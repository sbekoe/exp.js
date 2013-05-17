var Match = (function(_){
	// var dummy = Exp('$^');
  var getCaptures = function(path){
    var
      p = path.split(SPLITTER),
      e = this._exp,
      that = this;

    // get listed captures (repetitions)
    var listCap = _
      .chain(e.indices.list)
      .map(function(index, listPath){
          return _
            .chain(p)
            .map(function(path){
              var pos = path.indexOf(listPath), subPath;

              subPath = pos === 0? path.slice(pos + listPath.length + 1) : path;

              if(!subPath || (pos !== 0 && path.indexOf(PATH_DELIMITER) !==-1) || !e.subExp(index))
                return false;

              return that.getSubMatches(index).map(function(match){
                return match.cap([subPath]);
              });

            })
            .compact()
            .value();
        })
      .flatten()
      .value();

    return _
      .chain(_.values(_.pick(e.indices.path, p)))
      .concat(_.values(_.pick(e.indices.name, p)))
      .flatten()
      .union()
      .map(function(index){
        return !this.isList(index)? this.getCapture(index) : this.getSubMatches(index);
      },this)
      .concat(listCap)
      .compact()
      .union()
      .value();
  };

  // The Match class
  var Match = Exp.Match = function(match, exp){
    if (match instanceof Match) return Match;
    if (!(this instanceof Match)) return new Match(match, exp);

    this._wrapped = this._match = match;
    this._exp = exp;
    this._getCaptures = _.memoize(getCaptures);
    this._subMatch = {};

    _.extend(this, match);

    this.match = match[0];
    this.length = match.length;
    this.lastRange = exp.lastRange;
    this.range = [match.index, exp.lastIndex];
    this.pseudo = !!match.pseudo;

    this["&"] = match [0]; // matched substring
    this["`"] = this.input.slice(0, this.index); // preceding string
    this["'"] = this.input.slice(exp.lastIndex); // following string
  };

  // result handler takes care of underscore chaining
  var result = function(obj, value){
    if(obj._chain){
      obj._wrapped = value;
      return obj;
    } else
      return value;
  };

  var proto = Match.prototype = _([]);

  proto.cap = proto.capture = function(path){
    var
      a = _.isArray(path),
      c = this._getCaptures(a? path.join(',') : path);

    return result(this, a? c : c[0]);
  };


  proto.atm = proto.attachment = function(path){
    var a = this.getAssignments();
    return result(this, path? resolvePath(path, a) : a);
  };

  //@deprecated
  proto.assignment = proto.atm;

  proto.get = function(path){
    var res;
    return (res = this.cap(path)) !== undefined ? res :
      (res  = this.atm(path)) !== undefined ? res :
      (res = (path[0]==='$$'? this[path.slice(1)] : this[path])) !== undefined? res :
      this[path];
  } ;

  proto.toString = function(){
    return this._match[0];
  };

  proto.toJSON = function(){
    var captures;
    //if(this._pseudo) return this.toString();
    //captures = _.chain([_.keys(this._exp.indices.name),_.keys(this._exp.indices.path)]).flatten().unique().value();
    return this.pseudo? this.toString() : {
      match: this._match,
      index: this.index
      //,input: this.input
      //,captures: _.object(captures, this.capture(captures)),
      //,attachment: this.getAssignments()
    };
  };

  proto.getAssignments = function(){
    if(!this._assignments)
      this._assignments  = _.reduce(this._match, function(res, cap, i){
        var
          c = this._exp._captures[i],
          path,
          assignment,
          subAssignments,
          a;
        
        if(cap === undefined || !c.a)
          return res;

        assignment = resolvePath(c.a.path, this._exp.assignments);
        assignment = assignment[cap] || assignment;
        
        for(a in assignment)
          if(c.a.force || res[a] === undefined)
            res[a] = assignment[a];

        if(c.r && false)
          this.getSubMatches(i)
            .chain()
            .getAssignments()
            .each(function(assignment){
              var a;
              for(a in assignment)
                if(c.a.force || res[a] === undefined)
                  res[a] = assignment[a];
            });

        return res;
      },{},this);

    return result(this, this._assignments);
  };

  // returns the offseted index
  proto.getOffset = function(index){
    return index - this._exp.offset;
  };

  proto.getSubMatches = function(index){
    return this._subMatch[index] || (this._subMatch[index] = this._exp.subExp(index).scan(this._match[this.getOffset(index)]));
  };

  proto.getCapture = function(index){
    return this._match[this.getOffset(index)];
  };

  proto.isList = function(index){
    return !!this._exp._captures[this.getOffset(index)].r;
  };

  proto.$ = '$$';

  Match.Collection = Collection.extend(Match, {
    bind:['get', 'cap', 'capture', 'atm', 'attachment', 'assignment', 'getAssignments']
  });

  return Match;
})(_);