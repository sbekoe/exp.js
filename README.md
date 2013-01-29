exp.js
======

Regular expressions object oriented.

[![Build Status](https://travis-ci.org/sbekoe/exp.js.png)](https://travis-ci.org/sbekoe/exp.js)

exp.js makes building complex regular expressions easy and keeps them maintainable.

## Features
- provides native api: `.exec()`, `.tets()`, `.compile()`, `.global`, `.ignoreCase`, `.multiline`, `.source`, `.lastIndex` and `.lastMatch`
- comes with additional methods: `.scan()`, `.search()`, `.parse()`, `.replace()`
- named captures: inline style `/(#name:\w+)/` or with wildcards `/#name/`
- injections: `/%name/` represents an epression part which will be wrapped in non-capturing parenthesis
- lists: the seperator `[\s]` in the quantifier of `/(\d){0,[\s]}/` allows matching `'1 2 3 4'` instead of `'1234'`
- assignments: `/(\w+)>data.attr/` allows data binding to captures diffrent from `undefined`
- and some more

## Dependencies
- underscore

## Installation
- `$ npm install exp`


A small showcase is available on [jsfiddle](http://jsfiddle.net/eokeb/rFgdY/8/).