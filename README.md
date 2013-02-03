exp.js
======

Regular expressions object oriented.

[![Build Status](https://travis-ci.org/sbekoe/exp.js.png)](https://travis-ci.org/sbekoe/exp.js)

exp.js makes building complex regular expressions easy and keeps them maintainable.

**Note:** exp.js is still in beta phase. So its API may change frequently. !!!

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
    - [Named Captures](#named-captures): inline style `/(#name:\w+)/` or with wildcards `/#name/`
    - [Injections](#injections): `/%name/` represents an epression part which will be wrapped in non-capturing parenthesis
    - [Lists](#lists): the seperator `[\s]` in the quantifier of `/(\d){0,[\s]}/` allows matching `'1 2 3 4'` instead of `'1234'`
    - [Attachments](#assignments): `/(\w+)>data.attr/` allows data binding to captures differing from `undefined`
- Additional Methods:
    - [`.scan()`](#scanstring-mapper),
    - [`.search()`](#searchstring-mapper),
    - [`.parse()`](#parsestring-mapper),
    - [`.replace()`](#replacestring-mapper)
- Additional Attributes:
    - [`.lastRange`](#lastrange)
- Useful Utilities

## Dependencies
- [underscore](http://underscorejs.org)

## Installation
exp.js is also available from npm: `$ npm install exp`

## Instanciation
The `Exp` constructor exprects at leats one argument: a configuration object holding the source attribute or alternatively a native RegExp object passed first and optionally a config obj following.
```javascript
var exp = new Exp(/\w+/g); // object-oriented

var exp = Exp(/\w+/g); // as well as functional

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

## Match
In exp.js [`.exec()`](#exec) returns an instance of the `Match` class which inhertis all the good stuff from [underscore](http://underscorejs.org) and wraps the native match array.
For backward compatibility all attributes of the native match are accessable as usual.
The match object ptovides some further methods and attributes to access captures by name etc.

### .capture([path](#path)), .cap([path](#path))<a id="capture" /><a id="cap" />
Gets the first named captures by name or path if they are nested. If the path string is wrapped in an array, all captuers matching the path will be returned.
```javascript
var exp = Exp(/(#sentence:(#word:\w+) (#word:\w+).)/);
var match = exp.exec('Hi Bill!');

match.capture('sentence') // 'Hi Bill!'
match.capture('word') // 'Hi'
match.capture('sentence.word') // 'Hi'
match.capture(['word']) // ['Hi','Bill']
```

### .attachment([path](#path)), .at([path](#path))<a id="attachment" /><a id="at" />
Gets an attached object by path. If the path does not point to anything `undefined` will be returned.
```javascript
var exp = Exp(/(#sentence:(#word:\w+) (#word:\w+).)/);
var match = exp.exec('Hi Bill!');

match.capture('sentence') // 'Hi Bill!'
match.capture('word') // 'Hi'
match.capture('sentence.word') // 'Hi'
match.capture(['word']) // ['Hi','Bill']
```

## Mapper

## Path

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
*Returns an underscore wrapped array containing all matches  if the global falg is set and a single match or empty list elswise.*
```javascript
```

### .search(string [,[mapper](#mapper)])<a id="search"/>
*Returns*
```javascript
```

### .parse(string [,[mapper](#mapper)])<a id="parse"/>
*Returns*
```javascript
```

### .replace(string [,[mapper](#mapper)])<a id="repace"/>
*Returns*
```javascript
```
A small showcase is available on [jsfiddle](http://jsfiddle.net/eokeb/rFgdY/8/).