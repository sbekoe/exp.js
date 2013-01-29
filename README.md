exp.js
======

Regular expressions object oriented.

[![Build Status](https://travis-ci.org/sbekoe/exp.js.png)](https://travis-ci.org/sbekoe/exp.js)

exp.js makes building complex regular expressions easy and keeps them maintainable.

## Features
- provides native api: `.exec()`, `.test()`, `.compile()`, `.global`, `.ignoreCase`, `.multiline`, `.source`, `.lastIndex` and `.lastMatch`
- comes with additional methods: `.scan()`, `.search()`, `.parse()`, `.replace()`
- additional attributes: `.lastRange`
- named captures: inline style `/(#name:\w+)/` or with wildcards `/#name/`
- injections: `/%name/` represents an epression part which will be wrapped in non-capturing parenthesis
- lists: the seperator `[\s]` in the quantifier of `/(\d){0,[\s]}/` allows matching `'1 2 3 4'` instead of `'1234'`
- assignments: `/(\w+)>data.attr/` allows data binding to captures differing from `undefined`
- and some more utilities

## Dependencies
- underscore

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

## Match<a id="match"/>
```javascript
```

## Mapper<a id="mapper"/>
## Methods<a id="methods"/>
### .exec(*string*)<a id="exec"/>
*Returns a  [Match](#match)*
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