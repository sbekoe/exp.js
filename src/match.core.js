var Match = (function(_){
	// var dummy = Exp('$^');
  var getCaptures = function(path){
    var
      p = path.split(SPLITTER),
      res = [],
      offset = this._exp.offset,
      e = this._exp;
    window.e || (window.e  = []); 

    // get listed captures (repetitions)
    var 
      listCap = _.chain(this._exp.indices.list)
      .map(function(index, p){
          var pos = path.indexOf(p), subPath;

          subPath = pos===0? path.slice(pos + p.length + 1) : path;
          if((pos !== 0 && path.indexOf(PATH_DELIMITER) !==-1) || !e.subExp(index))
            return false;

          return _.map(e.subExp(index).scan(this._match[index-offset]), function(match){
            return match.cap([subPath]);
          });
        },this)
      .compact()
      .flatten()
      .value();

    return _
      .chain(_.values(_.pick(this._exp.indices.path, p)))
      .concat(_.values(_.pick(this._exp.indices.name, p)))
      .flatten()
      .union()
      .map(function(index){
        // return this._match[index - offset];

        var
          i = index - this._exp.offset,
          r = this._exp._captures[i].r,
          c = this._match[i];
        return !r? c : this._exp.subExp(index).scan(c);

      },this)
      .concat(listCap)
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

    _.extend(this, match);

    this.match = match[0];
    this.length = match.length;
    this.lastRange = exp.lastRange;
    this.range = [match.index, exp.lastIndex];

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
      c = this._getCaptures(a? path[0] : path);

    return result(this, a? c : c[0]);
  };


  proto.at = proto.assignment = function(path){
    var a = this._assignments || (this._assignments = this._getAssignments());
    return path? resolvePath(path, a) : a;
  };

  proto.get = function(path){ return this.capture(path) || this.assignment(path) || this[path]; } ;

  proto.toString = function(){ return this._match[0]; };

  proto._getAssignments = function(){
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
  };

  proto.$ = '$$';

  Match.Collection = Collection.extend(Match, {
    bind:['get', 'cap', 'capture', 'assignment']
  });

  return Match;
})(_);