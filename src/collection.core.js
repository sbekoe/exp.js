
var Collection = (function(_){
  //'use strict';

  var Collection = function(list){
    this._wrapped = list || [];
  };

  Collection.prototype = _([]);

  Collection.prototype.bind = function(method, context) {
    var obj = this._parent, that = this;
    if(_.isFunction(obj[method]))
      that[method] = function(){
        var args = arguments;
        return this.map(function(e){
          return obj[method].apply(context || e, args);
        });
      };
    else if(_.isFunction(_[method]))
      that[method] = function(){
        var args = arguments;
        return this.map(function(e){
          return _[method].apply(context || e, [e].concat(args));
        });
      };
    else
      that[method] = function(){
        var args = arguments;
        return this.map(function(e){
          return _.isFunction(e[method])? e[method].apply(context || e, args) : e[method];
        });
      };
    return that[method];
  };

  Collection.prototype.add = function(e) {
      this.push(_.isFunction(this._parent)? this._parent.apply(null, arguments) : e);
  };

  Collection.extend = function(protos, statics){
    var
      s = statics || {},
      fn = s.fn || {},
      context = s.context,
      parent = protos.prototype || protos,
      bind = statics.bind || _.functions(protos),
      c = s.constructor || function(){},
      constructor = function(){
        Collection.apply(this, arguments);
        c.apply(this, arguments);
      },
      proto = _.extend(new Collection(), fn);
      _.extend(constructor, s);

    proto._parent = parent;
    
    _.each(bind, function(fct){
      proto.bind(fct, context);
    });

    constructor.prototype = proto;

    return constructor;
  };

  return Collection;
})(_);