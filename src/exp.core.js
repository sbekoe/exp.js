var Exp = (function(){
  var Exp = function (exp, options){
    if (exp instanceof Exp){ return exp; }
    if (!(this instanceof Exp)){ return new Exp(exp, options); }
    this.initialize(exp, options);
  };

  Exp.prototype = {
    initialize: function(exp, options){
      var _this = this;
      var settings = options || exp || {};

      // initial properties
      this.source = exp.source? exp.source.toString() : exp;
      this.global = exp.global || settings.global;
      this.ignoreCase = exp.ignoreCase || settings.ignoreCase;
      this.multiline = exp.multiline || settings.multiline;

      this.options = _.extend({}, defaults, options, exp);

      _.extend(this, _.pick(this.options, specialOpt));
      this.flags = settings.flags || '';
      this.wildcards = settings.wildcards || {};

      this.assignments = settings.assignments || {};

      this.enclose(modes);

      // runtime properties
      this.zero(settings.lastIndex);

      this.compile(settings);
    },

    zero: function(lastIndex){
      this.lastIndex = lastIndex || 0;
      this.lastRange = [0, lastIndex || 0];
      this.lastMatch = null;
      return this;
    },

    /** @constructs */
    compile:function(options){
      var
        names = [],
        injections = [],
        captures = [],
        escaped = ['\\(', '\\)', CAPTURE_PREFIX, INJECTION_PREFIX],
        wc = this.wildcards,
        settings = options||{},
        w;

      for(w in wc)if(wc.hasOwnProperty(w)){
        if(w[0] === CAPTURE_PREFIX){
          w = w.slice(1); captures.push(w);
          escaped.push(w);
        }
        if(w[0] === INJECTION_PREFIX){
          w = w.slice(1); injections.push(w);
          escaped.push(w);
        }
        names.push(w);
      }
      this._captures = settings.captures || [{path:'', name:''}];
      this.indices = settings.indices || {path:{}, name:{}, list:{}};
      this.offset = settings.offset || 0;
      this._escaped = escaped;
      this._needle = new RegExp(
        '\\\\(' + escaped.join('|') + ')|' +
        '\\((' + CAPTURE_PREFIX + '|' + INJECTION_PREFIX + ')(\\w+(?:,\\w+)*):|' + // opener of named inline capture/injection
        '(\\((?!\\?:))|' + // opening parenthesis for native capture resp. unnamed capture. but prevent from matching non-capturing parentheses: '(' but not '(?:'
        '(' + CAPTURE_PREFIX + '|' + INJECTION_PREFIX + ')(' + (names.sort(byLength).join('|')||'$^') + ')|' + // captures/injections named in wildcards
        '(' + (captures.join('|')||'$^') + ')|' + // predefined captures named in wildcards
        '(' + (injections.join('|')||'$^') + ')', // predefined injections named in wildcards
        'g'
      );

      var
        src = this._captures.length>1?this.source : this.build(this.source, this._captures),
        flags = this.flags || ((this.global? 'g' : '') + (this.ignoreCase? 'i' : '') + (this.multiline? 'm' : ''));

      this._exp = new RegExp(src, flags);
    },

    // Build the expression string with replaced wildcards
    build: function(source, captures, namespace){
      var
        srcArr = _.isArray(source)? source : [source],
        wc = this.wildcards,
        needle = this._needle, // regexp to detect the (escaped) special characters.
        escaped = this._escaped,
        iName = this.indices.name,
        iPath = this.indices.path,
        iList = this.indices.list,

        // The namespace is a stack containing the keywords of the nested captures and injections
        // The name space is used to build the attribute name of a capture in a match. e.g: match.$keyword_nestedKeyword
        ns = namespace || [],

        exp = '',
        lastIndex = needle.lastIndex = 0,
        keywords,
        isCapture,
        capture,
        match,
        // the expression that replaces the keyword
        replacement,
        sub,
        i, src, r, a, n, e;

      for(i=0; i<srcArr.length; i++){
        src = srcArr[i].hasOwnProperty('s')? srcArr[i].s : srcArr[i].hasOwnProperty('srcArr')? srcArr[i].source : srcArr[i];
        if(!src){return '';}

        // disjunction of source elements
        if(i>0) exp += '|';

        while(match = needle.exec(src)) {
          // do nothing if an escaped characters was detected, but on captures and injections
          if (replacement = wc[match[6]] || wc[CAPTURE_PREFIX + match[7]] || wc[INJECTION_PREFIX + match[8]]  || (match[2]||match[4]? {s:findClosedReplacement(src.slice(needle.lastIndex)), a:srcArr[i].a||srcArr[i].assign} : false)) {
            // check if the the keyword is a capture
            isCapture = match[2] === CAPTURE_PREFIX || match[4] || match[5] === CAPTURE_PREFIX || typeof match[7] !== 'undefined';
            keywords = (match[3] || match[6] || match[7] || match[8] || '').split(',');

            // check for infinity recursion and add the current keyword to the namespace
            if(ns.indexOf(keywords[0]) === -1) ns.push(keywords[0]);
            else this.error('"'+ keywords[0] + '" includes itself. This would end up in infinity recursion loop!');

            // store the keyword in the captures array if necessary
            if(isCapture){
              n = captures.push(capture = {name: keywords[0], path: ns.join(PATH_DELIMITER), aliases: _.rest(keywords)});
              e = exp.length;
              // indicate capture name, aliases and path
              _.each(keywords, function(k){
                (iName[k] || (iName[k] = [])).push(n-1);
              });Object
              (iPath[capture.path] || (iPath[capture.path] = [])).push(n - 1);
            }

            // add the prepended native expression string and the replacement to the compiled expression
            // the replacement expression is build recursive and wrapped with ( ) for capturing or (?: ) for injection
            sub = this.build(replacement.s || replacement.source || replacement, captures, ns);
            exp += src.slice(lastIndex, match.index);

            lastIndex = match.index + match[0].length + (match[2]||match[4]? replacement.s.length + 1 : 0);
            
            // check for assignments
            if(isCapture && (a = src.slice(lastIndex).match(ASSIGNMENT_EXP))){
              lastIndex += a[0].length;
              capture.a = {
                force: 2 === a[1].length,
                path: a[2]
              };
            }

            // check for repetitions
            //
            // separated repetitions
            // e.g a list of numbers (<\d>'s) separated by a whitespace
            // - exactly 5:   /(\d){5, }/     -->   /(\d(?: \d){4})/      matches '0 1 2 3 4'
            // - indefinite:  /(\d){0,, }/    -->   /(\d?(?: \d){0,})/    matches '0 1 2 3 4' and '1' and ''
            // - 0 to 5:      /(\d){0,5, }/   -->   /(\d?(?: \d){0,4})/   matches matches '0 1' and '0 1 2 3 4'
            if(isCapture && this.options.enableLists && (r = REPETITION_EXP.exec(src.slice(lastIndex)))){
              var repConf = 0, repNumber = 1, repFinite = 2, repLimit = 3, repDelimiter = 4;
              capture.r = {
                capBound: [n, captures.length],
                expBound: [e + 4, e + sub.length + 4] // sub will wrapped with '(?:<sub>)' and '(<sub>)' w.r.t. '((?:<sub>))...' => the original <sub> pattern starts at position 'e' with an offset of 4: the length of the left wrapper '((?:'
              };
              (iList[capture.path] || (iList[capture.path] = [])).push(n - 1);
              if(r[repDelimiter]){
                // remove the captures in the repetition pattern
                var repetition = Exp.parse(PARENTHESIS, sub, function(m){ return m.pseudo? m : m[1] || '(?:'; }).join('');
                sub = '(?:' + sub + ')' + (r[repNumber] !== '0'? '': r[repFinite]?'?':'{0}') + '(?:'+ r[repDelimiter] + '(?:' + repetition + ')' + '){' + (r[repNumber] === '0'? 0 : r[repNumber]-1) + r[repFinite] + (r[repLimit]? r[repLimit] === '0'? 0:r[repLimit]-1 :'') + '}';
              }else
                sub = '(?:' + sub + ')' + r[repConf];

              lastIndex += r[repConf].length;
            }

            exp += (isCapture ? '(' : '(?:') + sub + ')';

            // set the needles index back to
            needle.lastIndex = lastIndex;
            ns.pop();
          }
        }
        // add the appended native expression string to the compiled expression
        exp += src.slice(lastIndex);
      }

      return exp.replace(new RegExp('\\\\(' + escaped.join('|') + ')','g'),'$1'); // replace escaped characters
    },

    // executes the expresion on a given string.
    // As usually exec returns an array, but this one is populated with the named captures.
    // In the default settings they can be reached with match.$captureName while match is the returned array and $ the default prefix.
    exec: function(string){
      var match, m;

      this._exp.lastIndex = this.lastIndex;

      if(match = this._exp.exec(string)){
        this.lastIndex = this._exp.lastIndex;
        this.lastMatch = m = new Match(match, this);
        this.lastRange = m.range;
      }

      return  m || null;
    },

    // check if the expression matches the given string
    test: function(string){ return this._exp.test(string); },


    expand: function(source){
      return this.build(source, [],{});
    },

    error: function(msg){
      if(DEBUG_MODE === true){
        throw 'Error in Expression /' + this.source + '/: ' + msg;
      }
    },

    subExp: function(index){
      var
        i = index - this.offset,
        c = this._captures[i];

      if(c.r === undefined) return;

      c.e || (c.e = new Exp({
          source: sSlice.apply(this._exp.source, c.r.expBound),
          captures: [{}].concat(aSlice.apply(this._captures, c.r.capBound)),
          indices: this.indices,
          assignments: this.assignments,
          offset: c.r.capBound[0] - 1,
          global: true
        }));

      return this._captures[i].e;
    },

    enclose: function(){
      _.each(arguments, function(closure){
        if(_.isFunction(closure)) closure.call(this, this.options);
      },this);
      return this;
    },



    SKIP: SKIP,
    BREAK: BREAK
  };


  var
    // Returns an array containing all matches/mappings of the given string.
    scan = Exp.scan = function(exp, string, mapper){
      var
        map = getMapper(mapper),
        wrap = exp instanceof Exp? Match.Collection : _,
        tokens = [],
        token,
        match;
      // exp.lastIndex = 0;
      if(_.isFunction(exp.zero)) exp.zero();
      else exp.lastIndex = 0;

      while(match = exp.exec(string)){
        token = map.call(exp, match, tokens);

        if(token === BREAK) break;
        if(token !== SKIP) tokens.push(token);
        if(!exp.global) break;
      }

      // return _.extend(_(tokens),tokens, {length: tokens.length});
      return _.extend(wrap(tokens), tokens, {length: tokens.length});
    },

    // return the first match in a string that is not the sipper obj
    search = Exp.search = function (exp, string, mapper) {
      var match, map = getMapper(mapper);
      scan(exp, string, function () {
        match = map.apply(this, arguments);
        return match !== SKIP? BREAK : match;
      });

      return match || null;
    },

    // returns an array containing all matches/mappings and the strings between
    parse = Exp.parse = function (exp, string, mapper) {
      var
        lastIndex = 0,
        line = 0,
        i = 0,
        strip,
        map = getMapper(mapper),
        br = /\n/g,
        nativeExp = !(exp instanceof Exp),

        tokens = scan(exp, string, function (match, tokens) {
          strip = string.slice(lastIndex, match.index);
          
          // if(match.index !== lastIndex) tokens.push(nativeExp? strip : 
          if(match.index !== lastIndex) tokens.push(
            map.call(exp, pseudoMatch({
              0: strip,
              index: lastIndex,
              input: string,
              line: line
            },exp), tokens)
          );

          line += count(br, strip);

          match.i = ++i;
          match.line = line;

          line += count(br, match[0] || '');
          lastIndex = match.index + match[0].length; // to keep it compatible if no global flag is set, match.lastIndex cant be used here

          return map.call(exp, match, tokens);
        });
      
      // if (lastIndex < string.length) tokens.push(tokens[tokens.length] = string.slice(lastIndex));
      if (lastIndex < string.length) tokens.push(tokens[tokens.length] = map.call(exp, pseudoMatch({
        0: string.slice(lastIndex),
        index: lastIndex,
        input: string,
        line: line
      },exp), tokens));

      return tokens;
    },

    // replaces all matches with the mapper
    replace = Exp.replace = function (exp, string, mapper) {
      return parse.apply(this, arguments).join('');
    },

    // returns the number of matches in a string
    count = Exp.count = function (exp, string, mapper) {
      return scan.apply(this,arguments).length;
    },

    matchToString = function(match){
      return '' + (match||this)[0];
    },

    matchToJSON = function(match){
      var m = match || this;
      return m.pseudo ? m.toString() : m;
    },

    pseudoMatch =  function(attr, exp){
      var match = _.extend(
        [],
        {
          0: '',
          index: 0,
          line: 0,
          input: '',
          length: exp && exp._captures && exp._captures.length || 1,
          pseudo: true,
          toString: matchToString,
          toJSON: matchToJSON
        },
        attr || {}
      );
      
      return exp instanceof Exp? Match(match, exp) : match;
    };

    // Closures
    var mode = function(){

    };

    var modes = function(settings){
      //privates
      var
        _this = this,
        mode = settings.mode || 'default',
        modes = settings.modes || {},
        attr = ['_exp','_captures', 'indices', 'assignments', 'offset', 'source'];

      _.each(modes,function(mode,name){
        var m =_.extend(_.pick(_this,['global', 'multiline', 'ignoreCase']),mode,{
          wildcards: _.extend(mode.wildcards||{}, _this.wildcards)
        });
        modes[name] = _.pick(new Exp(m), attr);
      });

      modes['default'] = _.pick(this, attr);

      this.mode = function(m){
        if(!arguments.length) return mode;
        if(modes[m]) _.extend(this,modes[mode = m]);
        return this;
      };
    };

    //dies ist ein test
    Exp.esc = esc;
  // extend prototype with featured methods
  _.each(['scan', 'search', 'parse','replace', 'count'], function(method){
    Exp.prototype[method] = function(){
      var arg = [this];
      aPush.apply(arg, arguments);

      return Exp[method].apply(this, arg);
    };
  });

  // default expessions settings
  var
    defaults = {
      enableLists: true,
      global: false,
      ignoreCase: false,
      multiline: false
    },
    specialOpt = ['source'];

  // helper
  var
    sSlice = String.prototype.slice,

    aSlice = Array.prototype.slice,

    aPush = Array.prototype.push,

    byLength = function(a,b){ return b.length - a.length;},

    getMapper = Exp.getMapper = function(mapper){
      var m, tokens, indices = {};
      if (typeof mapper !== 'string') return mapper || _.identity;

      tokens = parse(MARKER, mapper, function(m, t){
        if(m[1]) indices[t.length] = m[1];
        else return m.toString();
      }).value();

      return function(match){
        if(match.pseudo) return match[0];
        for(var i in indices)
          tokens[i] = indices[i] === '&'? match[0] : match.get? match.get(indices[i]) : match[indices[i]];
        return tokens.join('');
      };
    },
    //dies ist auch ein test
    findClosedReplacement = function (string){
      var opener = 1;
      return Exp.search(/\(|\)|\\\(|\\\)/g, string, function(match){
        if(match[0] === '('){opener++;}
        if(match[0] === ')'){opener--;}
        return opener === 0? string.slice(0,match.index) : SKIP;
      });
    };

  return Exp;
})();
