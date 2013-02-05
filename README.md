[![Build Status](https://travis-ci.org/sbekoe/exp.js.png)](https://travis-ci.org/sbekoe/exp.js)


exp.js
======

*exp.js makes building complex regular expressions easy and keeps them maintainable.*

**Note:** exp.js is still in beta phase. So its API may change frequently. !!!

A small showcase is available on [jsfiddle](http://jsfiddle.net/eokeb/rFgdY/8/).

## Features
- provides native api:
    - `.exec()`,
    - `.test()`,
    - `.compile()`,
    - `.global`,
    - `.ignoreCase`,
    - `.multiline`,
    - `.source`,
    - `.lastIndex`
    - `.lastMatch`
- Extended Syntax:
    - [Named Captures](#named-captures) can be defined inline style `/(#name:\w+)/` or by placeholder `/#name/`.
    - [Injections](#injections) allow the use of placeholder such in `/%name/` and represent an expression part (definded in the options) which will be wrapped in non-capturing parenthesis.
    - [Lists](#lists) can be defined by a seperator as the third param of a quantifier. E.g.  `[\s]` in `/(\d){0,[\s]}/` allows matching `'1 2 3 4'` instead of `'1234'`.
    - [Attachments](#assignments) - `/(\w+)>data.attr/` - allows binding of data on the match obj by captures that differ from `undefined`.
- Additional Methods:
    - [Scanning](#scanstring-mapper) `.scan()` fetches all matches at once and returns them in an array.
    - [Searching](#searchstring-mapper) `.search()`returns the first match that passed the [mapping function](#mapper). 
    - [Parsing](#parsestring-mapper) `.parse()` returns all tokens in form of an array containing strings & matches alternately.
    - [Replacing](#replacestring-mapper) `.replace()` returns the the source string with all matches replace by the [mapper](#mapper).
- Additional Attributes:
    - [`.lastRange`](#lastrange)
- Useful Utilities

## Dependencies
- With keeping the size in mind, [underscore](http://underscorejs.org) is deeply intergrated into exp.js.

## Installation
exp.js is also available from npm: `$ npm install exp`

## Instanciation
The `Exp` constructor exprects at leats one argument: a configuration object holding the source attribute or alternatively a native RegExp object passed first and optionally a config obj following.
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
### Injections
### Lists
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

returns all tokens in form of an array containing strings & matches alternately.
returns the the source string with all matches replace by the [mapper](#mapper).
    
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
    return match[0][0] === 'B'? this.skip : match;
});

res.capture('name'); // 'Grat Dalton'
```

### .parse(string [,[mapper](#mapper)])<a id="parse"/>
*Returns*
```javascript
```

### .replace(string [,[mapper](#mapper)])<a id="repace"/>
*Returns*
```javascript
```

## Match
In exp.js [`.exec()`](#exec) returns an instance of the `Match` class which inhertis all the good stuff from [underscore](http://underscorejs.org) and wraps the native match array.
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
var exp = Exp(/(#sentence:(#word:\w+) (#word:\w+).)/);
var match = exp.exec('Hi Bill!');

match.capture('sentence') // 'Hi Bill!'
match.capture('word') // 'Hi'
match.capture('sentence.word') // 'Hi'
match.capture(['word']) // ['Hi','Bill']
```
### .get([path](#path))
*Is a shorthand for `match.capture(path) || match.attachment(path) || match[path]`.*

## Mapper
Some methods, like [`.scan()`](#scanstring-mapper), accept a mapper as second argument.
The mapper can be a function or string.
Placeholders prefixed with the `$` character will be replaced by calling [`match.get(path)`](#getpath), similar to `String.prototype.replace`.

## Path
