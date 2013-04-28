[![Build Status](https://travis-ci.org/sbekoe/exp.js.png)](https://travis-ci.org/sbekoe/exp.js)


exp.js
======

*exp.js makes building complex regular expressions easy and keeps them maintainable.*

**Note:** exp.js is still in beta phase. So its API may change frequently. !!!

A small showcase is available on [jsfiddle](http://jsfiddle.net/eokeb/rFgdY/8/).

## Features
- Extended Syntax:
    - [Named Captures](#named-captures) can be defined inline style `/(#name:\w+)/` or by placeholder `/#name/`.
    - [Injections](#injections) allow the use of placeholder such in `/%name/` and represent an expression part (definded in the options) which will be wrapped in non-capturing parenthesis.
    - [Lists](#lists) can be defined by a seperator as the third param of a quantifier. E.g.  `[\s]` in `/(\d){0,[\s]}/` allows matching `'1 2 3 4'` instead of `'1234'`.
    - [Attachments](#attachments) - `/(\w+)>data.attr/` - allows binding of data on the match obj by captures that differ from `undefined`.
- Additional Methods:
    - [Scanning](#scanstring-mapper) `.scan()` fetches all matches at once and returns them in an array.
    - [Searching](#searchstring-mapper) `.search()`returns the first match that passed the [mapping function](#mapper). 
    - [Parsing](#parsestring-mapper) `.parse()` returns all tokens in form of an array containing strings & matches alternately.
    - [Replacing](#replacestring-mapper) `.replace()` returns the the source string with all matches replace by the [mapper](#mapper).
- Additional Attributes:
    - [Range](#lastrange) `.range` is an array containg the start- and end indeces of the matched substring.  
    - [Last range](#lastrange) `.lastRange` is the range of the last match.
- Useful Utilities
    - [Match](#match) is Class that mims and extends the native match object.
    - [Match Collections](#match-collection) make performing actions on arrays of matches more fluid. 
    - [Escaping](#esc) of characaters, which are reserved in regular expression, can be done with `Exp.esc()`.
    - Scanning, Searching, Parsing and Replacing with native RegExp objects: `Exp.scan(RegExp, string [,mapper])` ...
- Native API:
    - `.exec()`,
      `.test()`,
      `.compile()`,
    - `.global`,
      `.ignoreCase`,
      `.multiline`,
      `.source`,
      `.lastIndex`
      `.lastMatch`

## Dependencies
- With keeping the size in mind, [underscore](http://underscorejs.org) is deeply intergrated into exp.js.

## Installation
exp.js is also available from npm: `$ npm install exp`

## Instanciation
The `Exp` constructor expects at leats one argument: a configuration object holding the source attribute or alternatively a native RegExp object passed first and optionally a config obj following.
```javascript
var exp = new Exp(/\w+/g); // object-oriented

var exp = Exp(/\w+/g); // functional

var exp = Exp({
  source: '\\w+'
  global: true
});
```

## Syntax
### Named Captures
Named captures allow to design complex expressions independently from capture indexes. There are two possible definition styles: inline and wildcard.
```javascript
// compiled to /(\w+) (\w+)/
var exp = Exp({
  source: '(#firstname:\\w+) #lastname',
  wdilcards:{
    "lastname": "\\w+"
  }
});

var match = exp.exec('Bob Dalton')

match.capture('firstname'); // 'Bob'
match.capture('lastname'); // 'Dalton'
```

### Injections
Injections work in the same way like named captures, but there sub expressions are wrapped in non-captureing parenthesis.
```javascript
// compiled to /(?:\w+) (?:\w+)/
var exp = Exp({
  source: '(%firstname:\\w+) %lastname',
  wdilcards:{
    "lastname": "\\w+"
  }
});

var match = exp.exec('Bob Dalton')

match.capture('firstname'); // undefined
match.capture('$&'); // 'Bob Dalton'
```

### Lists
Lists extend the native RegExp occurences syntax `{n,[m]}` with a third parameter `{n,[m],[s]}`, where `s` is optional and represents a subexpression defining the list seperator.
```javascript
// compiled to (#bandit(?:[,\\s]+#bandit){0,})
// /((?:(\w+) (\w+))(?:[,\s]+(?:(?:\w+) (?:\w+))){0,})/
var exp = Exp({
  source:'#bandit{1,,[,\\s]+}',
  wildcards:{
    bandit: '(#firstname:\\w+) (#lastname:\\w+)'
  }
});
var bandits = 'Bill Power, Bob Dalton, Grat Dalton, Dick Broadwell';

var match = exp.exec(bandits);

match.capture('bandit'); // Array of 4 sub matches
match.capture(['firstname']); // ["Bill", "Bob", "Grat", "Dick"]
```

### Attachments

## Methods
### .exec(string)<a id="exec"/>
*Returns a  [`Match`](#match) or `null`*
```javascript
var exp = Exp(/(#word:\w+)/g);
var match  = exp.exec('ABC DEF');

match[0]; // 'ABC DEF'
match[1]; // 'ABC'
match.capture('word'); // 'ABC'
match.value(); // ['ABC DEF', 'ABC']
match.index; // 0

exp.lastIndex; // 3
```
    
### .test(string)<a id="test"/>
*Returns a boolean whether the epression matched or not*

### .scan(string [,[mapper](#mapper)])<a id="scan"/>
*Returns an underscore wrapped array containing all matches  if the global flag is set and a single match or empty list elswise.*
```javascript
```

### .search(string [,[mapper](#mapper)])<a id="search"/>
*Returns the first match that passed the [mapper](#mapper).*
```javascript
var exp = Exp(/(#name:\w+ \w+)/);
var res = exp.exec('Bill Power, Bob Dalton, Grat Dalton, Dick Broadwell', function(match){
    return match[0][0] === 'B'? this.SKIP : match;
});

res.capture('name'); // 'Grat Dalton'
```

### .parse(string [,[mapper](#mapper)])<a id="parse"/>
*Returns all tokens in form of an array containing glue strings & matches alternately.*
```javascript
```

### .replace(string [,[mapper](#mapper)])<a id="repace"/>
*Returns the the source string with all matches replace by the [mapper](#mapper).*
```javascript
```

## Match
In exp.js [.exec()](#exec) returns an instance of the `Match` class which inhertis all the good stuff from
[underscore](http://underscorejs.org) and wraps the native match array.
For backward compatibility all attributes of the native match are accessable as usual.
The match object provides some further methods and attributes to access captures by name etc.

### .capture([path](#path)), .cap([path](#path))<a id="capture" /><a id="cap" />
*Gets the first named captures by name or path if they are nested. If the path string is wrapped in an array, all captuers matching the path will be returned.*
```javascript
var exp = Exp(/(#sentence:(#word:\w+) (#word:\w+).)/);
var match = exp.exec('Hi Bill!');

match.capture('sentence') // 'Hi Bill!'
match.capture('word') // 'Hi'
match.capture('sentence.word') // 'Hi'
match.capture(['word']) // ['Hi','Bill']
```

### .attachment([path](#path)), .atm([path](#path))<a id="attachment" /><a id="at" />
*Gets an attached object by path. If the path does not point to anything `undefined` will be returned.*
```javascript
var exp = Exp(/(#firstname:\w+) (#lastname \w+)>list/g,{
    attachment: {
        list:{ 
            'Dalton': { wanted: true }
        }
    }
});
var res = exp.scan('Bill Power, Bob Dalton, Grat Dalton, Dick Broadwell');

res[0].capture('lastname') // 'Power'
res[0].attachment('wanted') // undefined

res[1].capture('lastname') // 'Dalton'
res[1].attachment('wanted') // true
```

### .get([path](#path))
*Is a shorthand for `match.capture(path) || match.attachment(path) || match[path]`.*

## Mapper
Some methods, like [.scan()](#scanstring-mapper), accept a mapper as second argument.
The mapper can be a function or string.
### String-Mapper
Replaces each match with the specified string in which the `$`-prefixed placeholders will be substituted
[match.get()](#getpath), similar to
[String.prototype.replace](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter).
Possible placehoders are:
  - Substitute the n-th capture for `$n` where *n* is a number. 
  - Substitute the matched substring for `$&`.
  - Substitute the substring that preceds the match for ``$` ``.
  - Substitute the substring that follows the match for `$'`.
  - Substitute a named capture or assignment for `$p` where *p* is a [path](#path).
  - Substitute an attribute of the match object fot `$k` where *k* is the attributes key.
  
```javascript
var exp = Exp(/(#firstname:\w+) (#lastname \w+)/);
var res = exp.replace('Bill Power', '$lastname, $firstname'); // 'Power, Bill'
```

### Functional Mapper
Replaces the match with the mappers return value. The arguments passed to the mapper are: `(match, tokens)`.
The second argument is an array that contains all the previous matches.
The mappers context is the exp obect.
This allows to controll the execution flow
by returning `this.SKIP` to ignore the current match or `this.BREAK` to stop the execution.

```javascript
var exp = Exp(/(#firstname:\w+) (#lastname \w+)/g);
var bandits = 'Bill Power, Bob Dalton, Grat Dalton, Dick Broadwell';

// the functional mapper
var wanted = function(match){
    return match.cap('lastname') === 'Dalton'? this.SKIP : match.cap('firstname');
};

var res = exp.scan(bandits, wanted);

res.join(', '); // 'Bill, Dick'
```
## Path
