/**
 * expJS - modular expressions
 * (c) Simon Bekoe
 * exp.js may be freely distributed under the MIT license.
 *
 * https://gist.github.com/3726969
 * http://jsbin.com/ogokog/20/edit
 */

(function(){
	"use strict";

  // constants
	var
		INJECTION_PREFIX = '%',
		CAPTURE_PREFIX = '#',
		ASSIGNMENT_PREFIX = '>',

    PATH = "\\w+(?:\\.(?:\\w+|\\[\\d+\\]))*",
		ASSIGNMENT_EXP = new RegExp('('+ASSIGNMENT_PREFIX + '{1,2})(' + PATH + ')','g'),
		REPETITION_EXP = /^[*+]|^\{(\d+)(,?)(\d*)(?:,([^\}]+))?\}/,
    MARKER = RegExp('\\$(' + PATH + '|[\\d&])', 'g'),
		PATH_DELIMITER = '.',
		DEBUG_MODE = true, // TODO: move to Exp.DEBUG_MODE
    SPLITTER = /,|\s+/;

  // default expessions settings
  var
    defaults = {
      captureRepetition: false,
      global: false,
      ignoreCase: false,
      multiline: false
    },
    specialOpt = ['source'];

	// Expression class
	function Exp(exp, options){
    if (exp instanceof Exp) return exp;
    if (!(this instanceof Exp)) return new Exp(exp, options);

		var settings = options || exp || {};

		// initial properties
    //this.source = exp.source? exp.source.toString().slice(1,-1) : exp;
		this.source = exp.source? exp.source.toString() : exp;
		this.global = exp.global || settings.global;
		this.ignoreCase = exp.ignoreCase || settings.ignoreCase;
		this.multiline = exp.multiline || settings.multiline;

    this.options = _.extend({}, defaults, options, exp);
//    _.extend(this, _.pick(this.options, specialOpt));
    this.flags = settings.flags || '';
		this.wildcards = settings.wildcards || {};

    this.assignments = settings.assignments || {};

		// runtime properties
		this.lastIndex = settings.lastIndex || 0;
		this.lastRange = [0,0];

		this.compile(settings);
	}

	Exp.prototype = {
		/** @constructs */
		compile:function(settings){
			var
				names = [],
				injections = [],
				captures = [],
				escaped = ['\\(', '\\)', CAPTURE_PREFIX, INJECTION_PREFIX],
				wc = this.wildcards,
				settings = settings||{},
				w;

			for(w in wc){if(wc.hasOwnProperty(w)){
				if(w[0] === CAPTURE_PREFIX){w = w.slice(1); captures.push(w); escaped.push(w);}
				if(w[0] === INJECTION_PREFIX){ w = w.slice(1); injections.push(w); escaped.push(w);}
				names.push(w);
			}}
			this._captures = settings.captures || [{path:'', name:''}];
      this.indices = settings.indices || {path:{}, name:{}};
      this.offset = settings.offset || 0;
			this._escaped = escaped;
			this._needle = new RegExp(
				'\\\\(' + escaped.join('|') + ')|' +
        '\\((' + CAPTURE_PREFIX + '|' + INJECTION_PREFIX + ')(\\w+(?:,\\w+)*):|' + // opener of named inline capture/injection
        '(\\((?!\\?:))|' + // opening parenthesis for native capture resp. unnamed capture. but prevent from matching non-capturing parentheses: '(' but not '(?:'
        '(' + CAPTURE_PREFIX + '|' + INJECTION_PREFIX + ')(' + (names.sort(byLength).join('|')||'$^') + ')|' + // captures/injections named in wildcards
        '(' + (captures.join('|')||'$^') + ')|' + // predefined captures named in wildcards
        '(' + (injections.join('|')||'$^') + ')' + // predefined injections named in wildcards
				'', 'g'
			);

      var
        src = this._captures.length>1?this.source : this.build(this.source, this._captures),
        flags = this.flags || ((this.global? 'g' : '') + (this.ignoreCase? 'i' : '') + (this.multiline? 'm' : ''));

			this._exp = new RegExp(src, flags);
		},

		// Build the expression string with replaced wildcards
		build: function(source, captures, namespace){
			var
				source = _.isArray(source)? source : [source],
				wc = this.wildcards,
				needle = this._needle, // regexp to detect the (escaped) special characters.
				escaped = this._escaped,
        iName = this.indices.name,
        iPath = this.indices.path,

				// The namespace is a stack containing the keywords of the nested captures and injections
				// The name space is used to build the attribute name of a capture in a match. e.g: match.$keyword_nestedKeyword
				namespace = namespace || [],

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

			for(i=0; i<source.length; i++){
				src = source[i].hasOwnProperty('s')? source[i].s : source[i].hasOwnProperty('source')? source[i].source : source[i];
				if(!src){return '';}

				// disjunction of source elements
				if(i>0) exp += '|';

				while(match = needle.exec(src)) {
					// do nothing if an escaped characters was detected, but on captures and injections
					if (replacement = wc[match[6]] || wc[CAPTURE_PREFIX + match[7]] || wc[INJECTION_PREFIX + match[8]]  || (match[2]||match[4]? {s:findClosedReplacement(src.slice(needle.lastIndex)), a:source[i].a||source[i].assign} : false)) {
						// check if the the keyword is a capture
						isCapture = match[2] === CAPTURE_PREFIX || match[4] || match[5] === CAPTURE_PREFIX || typeof match[7] !== 'undefined';
						keywords = (match[3] || match[6] || match[7] || match[8] || '').split(',');

						// check for infinity recursion and add the current keyword to the namespace
						namespace.indexOf(keywords[0]) === -1? namespace.push(keywords[0]) : this.error('"'+ keywords[0] + '" includes itself. This would end up in infinity recursion loop!');

						// store the keyword in the captures array if necessary
						if(isCapture){
              n = captures.push(capture = {name: keywords[0], path: namespace.join(PATH_DELIMITER), aliases: _.rest(keywords)});
              e = exp.length;
              // indicate capture name, aliases and path
              _.each(keywords, function(k){
                (iName[k] || (iName[k] = [])).push(n-1);
              });
              (iPath[capture.path] || (iPath[capture.path] = [])).push(n - 1);
            }

						// add the prepended native expression string and the replacement to the compiled expression
						// the replacement expression is build recursive and wrapped with ( ) for capturing or (?: ) for injection
						sub = this.build(replacement.s || replacement.source || replacement, captures, namespace);
            exp += src.slice(lastIndex, match.index);

            lastIndex = match.index + match[0].length + (match[2]||match[4]? replacement.s.length + 1 : 0);
						// check for assignments
            ASSIGNMENT_EXP.lastIndex = lastIndex;

            if(isCapture && (a = ASSIGNMENT_EXP.exec(src))){
              lastIndex += a[0].length;
              capture.a = {
                force: 2 === a[1].length,
                path: a[2]
              }
            }

            // check for repetitions
            //
            // separated repetitions
            // e.g a list of numbers (<\d>'s) separated by a whitespace
            // - exactly 5:   /(\d){5, }/     -->   /(\d(?: \d){4})/      matches '0 1 2 3 4'
            // - indefinite:  /(\d){0,, }/    -->   /(\d?(?: \d){0,})/    matches '0 1 2 3 4' and '1' and ''
            // - 0 to 5:      /(\d){0,5, }/   -->   /(\d?(?: \d){0,4})/   matches matches '0 1' and '0 1 2 3 4'
            if(isCapture && this.options.captureRepetition && (r = REPETITION_EXP.exec(src.slice(lastIndex)))){
              var repConf = 0, repNumber = 1, repFinite = 2, repLimit = 3, repDelimiter = 4;
              capture.r = {
                capBound: [n, captures.length],
                expBound: [e + 4, e + sub.length + 4] // sub will wrapped with '(?:<sub>)' and '(<sub>)' w.r.t. '((?:<sub>))...' => the original <sub> pattern starts at position 'e' with an offset of 4: the length of the left wrapper '((?:'
              };
              if(r[repDelimiter]){
                // remove the captures in the repetition pattern
                var repetition = Exp.parse(/(\\\(|\(\?[:=!])|\((?:#\w+:)?/g, sub, function(m){return m[1] || '(?:'}).join('');
                sub = '(?:' + sub + ')' + (r[repNumber]!=0?'':r[repFinite]?'?':'{0}') + '(?:'+ r[repDelimiter] + '(?:' + repetition + ')' + '){' + (r[repNumber]==0?0:r[repNumber]-1) + r[repFinite] + (r[repLimit]? r[repLimit]==0?0:r[repLimit]-1 :'') + '}';
              }else
                sub = '(?:' + sub + ')' + r[repConf];

              lastIndex += r[repConf].length;
            }

            exp += (isCapture ? '(' : '(?:') + sub + ')';

						// set the needles index back to
						needle.lastIndex = lastIndex
            namespace.pop();
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
        this.lastRange = m.lastRange;
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
		}
	};
  var
    getMapper = Exp.getMapper = function(mapper){
      var m, tokens, indices = {};
      if (typeof mapper !== 'string') return mapper || _.identity;

    tokens = parse(MARKER, mapper, function(m, t){
      indices[t.length] = m[1]
    });

    return function(match){
      for(var i in indices)
        tokens[i] = indices[i] === '&'? match[0] : match.get? match.get(indices[i]) : match[indices[i]];
      return tokens.join('');
    };
  }

	// Returns an array containing all matches of the given string.
	// This makes only sence, if the global flag is true
	var
    scan = Exp.scan = function(exp, string, mapper){
      var tokens = [], token, match, mapper = getMapper(mapper);
      exp.lastIndex = 0;

      while(match = exp.exec(string)){
        token = mapper.call(exp, match, tokens);
        if(token === breaker) break;
        if(token !== skipper) tokens.push(token);
        if(!exp.global) break;
      }

      return tokens;
    },

    search = Exp.search = function(exp, string, mapper){
      var match, mapper = getMapper(mapper);
      scan(exp, string, function(){
        match = mapper.apply(this, arguments);
        return match !== skipper? breaker: match
      });
      return match || null;
    },

    parse = Exp.parse = function(exp, string, mapper){
      var
        lastIndex = 0, line = 0, i = 0, strip, mapper = getMapper(mapper), br = /\n/g,

        tokens = scan(exp, string, function(match, tokens){
          strip = string.slice(lastIndex, match.index);
          line += count(br, strip);

          match.i = ++i;
          match.line = line;

          if(match.index !== lastIndex) tokens.push(strip);
          line += count(br, match[0]||'');
          lastIndex = match.index + match[0].length; // to keep it compatible if no global flag is set, match.lastIndex cant be used here

          return mapper.call(exp, match, tokens);
        });
      if(lastIndex < string.length) tokens.push(string.slice(lastIndex));

      return tokens;
    },

    replace = Exp.replace = function(exp, string, mapper){
      return parse.apply(this, arguments).join('');
    },

    count = Exp.count = function(exp, string, mapper){
      return scan.apply(this,arguments).length;
    },

    breaker = Exp.breaker = {},

    skipper = Exp.skipper = {},

    esc = Exp.esc = function(string, nativeCharsOnly){
      !_.isArray(string) || (string = string.join(''));
      return string.replace(new RegExp('[\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|' + (nativeCharsOnly? '' : '%#') +']','g'), "\\$&");
    };

  // extend prototype with featured methods
  _.each(['scan', 'search', 'parse','replace', 'count'], function(method){
    Exp.prototype[method] = function(){
      var arg = [this];
      aPush.apply(arg, arguments);

      return Exp[method].apply(this, arg);
    }
  });


  var getCaptures = function(path){
    var p = path.split(SPLITTER);

    return _
      .chain(_.values(_.pick(this._exp.indices.path, p)))
      .concat(_.values(_.pick(this._exp.indices.name, p)))
      .flatten()
      .union()
      .map(function(i){
        var
          i = i - this._exp.offset,
          r = this._exp._captures[i].r,
          c = this._match[i];

        return !r? c : Exp({
          source: sSlice.apply(this._exp._exp.source, r.expBound),
          captures: [{}].concat(aSlice.apply(this._exp._captures, r.capBound)),
          indices: this._exp.indices,
          assignments: this._exp.assignments,
          offset: r.capBound[0] - 1,
          global: true
        }).scan(c);

      },this)
      .value();
  };

  var Match = Exp.Match = function(match, exp){
    if (match instanceof Match) return Match;
    if (!(this instanceof Match)) return new Match(match, exp);

    this._wrapped = this._match = match;
    this._exp = exp;
    this._getCaptures = _.memoize(getCaptures);

    _.extend(this, match);

    this.match = match[0];
    this.length = match.length;
    this.lastRange = exp.lastRange;
    this.range = [match.index, exp.lastIndex];
  }

  // result handler takes care of underscore chaining
  var result = function(obj, value){
    if(obj._chain){
      obj._wrapped = value;
      return obj;
    } else
      return value;
  }

  Match.prototype = _.extend(_([]),{
    capture: function(path){
      var
        a = _.isArray(path),
        c = this._getCaptures(a? path[0] : path);

      return result(this, a? c : c[0]);
    },


    assignment: function(path){
      var a = this._assignments || (this._assignments = this._getAssignments());
      return path? resolvePath(path, a) : a;
    },

    get: function(path){ return this.capture(path) || this.assignment(path) || this[path]} ,

    toString: function(){ return this._match[0] },

    _getAssignments: function(){
      return _.reduce(this._match, function(res, cap, i){
        var
          c = this._exp._captures[i],
          path,
          assignment,
          a;
        if(cap === undefined || !c.a) return res;
        assignment = resolvePath(c.a.path, this._exp.assignments);
        assignment = assignment[cap] || assignment;
        for(a in assignment)
          if(c.a.force || res[a] === undefined) res[a] = assignment[a];

        return res;
      },{},this);
    }
  });


	// helper
	var
    sSlice = String.prototype.slice,
    aSlice = Array.prototype.slice,
    aPush = Array.prototype.push,
		byLength = function(a,b){ return b.length - a.length;},
		findClosedReplacement = function (string){
			var opener = 1;
			return Exp.search(/\(|\)|\\\(|\\\)/g, string, function(match){
				if(match[0] === '('){opener++;}
				if(match[0] === ')'){opener--;}
				return opener === 0? string.slice(0,match.index) : skipper;
			});
    },

    resolvePath = function(path, obj, delimitter){
      delimitter = delimitter || '.';
      obj = obj || window; // TODO: remove the window alternative
      if(obj[path]) return obj[path];
      path = (path + '').split(delimitter);
      try{ return eval('(obj["' + path.join('"]["') + '"])'); }
      catch(e){ return undefined; }
    };

  if (typeof exports !== 'undefined') exports.Exp = Exp;
  else window.Exp = Exp;
}());