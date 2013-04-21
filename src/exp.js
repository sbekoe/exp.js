(function (root, factory) {

  if (typeof exports === 'object') {
    var underscore = require('underscore');
    module.exports = factory(underscore);
  } else if (typeof define === 'function' && define.amd) {
    define(['underscore'], factory);
  } else {
    var _ = root._;
    root.Exp = factory(_);
  }

}(this, function (_) {
'use strict';

//global helpers     
var 
  escNativeExp = new RegExp('[\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|]','g'),
  escAdvancedExp = new RegExp('[\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|%#]','g'),
  esc = function(string, nativeCharsOnly){
    if(_.isArray(string)) string = string.join('');
    return string.replace(nativeCharsOnly? escNativeExp : escAdvancedExp, "\\$&");
  },
  resolvePath = function(path, obj, delimitter){
    delimitter = delimitter || '.';
    obj = obj || window;
    if(obj[path]) return obj[path];
    path = (path + '').split(delimitter);
    try{ return eval('(obj["' + path.join('"]["') + '"])'); }
    catch(e){ return undefined; }
  };

var
  INJECTION_PREFIX = '%',
  CAPTURE_PREFIX = '#',
  ASSIGNMENT_PREFIX = '>',

  PATH_DELIMITER = '.',
  DELIMITER_ESC = esc(PATH_DELIMITER, true),
  PATH = "\\w+(?:"+ DELIMITER_ESC +"(?:\\w+|\\[\\d+\\]))*",
  DEEP_PATH = "\\w+(?:"+ DELIMITER_ESC +"(?:\\w+|\\[\\d+\\]))+",
  ASSIGNMENT_EXP = new RegExp('('+ASSIGNMENT_PREFIX + '{1,2})(' + PATH + ')','g'),
  REPETITION_EXP = /^[*+]|^\{(\d+)(,?)(\d*)(?:,([^\}]+))?\}/,
  MARKER = new RegExp('\\$(' + PATH + '|[\\d&])', 'g'),
  DEBUG_MODE = true,
  SPLITTER = /,|\s+/,
  PARENTHESIS = /(\\\(|\(\?[:=!])|\((?:#\w+:)?/g,

  BREAK = {},
  SKIP = {};

// collection class
@@Collection

// exp class
@@Exp

// match class
@@Match

Exp.VERSION = '@@version';

Exp.Collection = Collection;
Exp.Match = Match;

return Exp;
}));