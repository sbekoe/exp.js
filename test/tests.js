/**
 * Created with JetBrains PhpStorm.
 * User: Simon
 * Date: 13.10.12
 * Time: 12:33
 * To change this template use File | Settings | File Templates.
 */

module('Exp');

test('match obj extensions',function(){
  var exp, match;
  exp = Exp(/(unnamed) (#sub,nested:foo) (#top:(#sub:bar))/,{
    captureName: true, // default
    captureIndices: true,
    capturePaths: true
  });

  m = exp.exec('unnamed foo bar');

  ok(
    m[0] === 'unnamed foo bar' &&
    m[1] === 'unnamed' &&
    m[2] === 'foo' &&
    m[3] === 'bar' &&
    m[4] === 'bar',
  'native api - indices');

  deepEqual(m.capture(['sub']), ['foo','bar'], 'get captures by name'); // 'bar' will show up here also, because its capture has the same name
  deepEqual(m.capture('sub'), 'foo', 'get capture by name'); // 'bar' will show up here also, because its capture has the same name
  deepEqual(m.capture('nested'), 'foo', 'get capture by alias');
  deepEqual(m.capture(['top']), ['bar']);
  equal(m.capture('top'), 'bar');
  equal(m.capture('top.sub'), 'bar', 'get first capture by path'); // path to the second #sub capture

  ok(
    m.index === 0 &&
    m.input === 'unnamed foo bar' &&
    m.length === 5,
  'native api - attributes');

  ok(
     m.lastRange[0] === 0 &&
     m.lastRange[1] === 0 &&
     m.range[0] === 0 &&
     m.range[1] === 0,
  'extended api - special attributes');
});

test('capturing & non-capturing',function(){
  var exp, match;
  exp = Exp(/(unnamed) (#foo:bar) (unnamed)/,{});
  match = exp.exec('unnamed bar unnamed');

  ok(match == 'unnamed bar unnamed', 'provide native unnamed captures');
  equal(match.capture('foo'), 'bar');

  exp = Exp(/(unnamed) (#foo:named) (?:nonCaptured) (unnamed)/,{});
  match = exp.exec('unnamed named nonCaptured unnamed');

  ok(
    match[0] == 'unnamed named nonCaptured unnamed' &&
      match[1] == 'unnamed' &&
      match[2] == 'named' &&
      match.capture('foo') == 'named' &&
      match[3] == 'unnamed',
    'support of non-capturing parentheses'
  );
});

test("nested captures and wildcards",function(){
  var exp = new Exp('name is #name',{
    wildcards:{
      name: '#firstName #lastName',
      firstName:'%w',
      lastName:'%w',
      w:'\\w+'
    },
    capturePaths:true
  });
  var match = exp.exec('My name is Ted Mosby!');

  equal(match.match, 'name is Ted Mosby', 'matched string');
  equal(match.capture('name') , 'Ted Mosby', 'named capture');
  ok(
    match.capture('name.firstName') =='Ted' &&
    match.capture('name.lastName') == 'Mosby',
  'named nested captures');
});


test("multiple use of capture name",function(){
  var exp = new Exp({
    source: '#number',
    wildcards:{
      number: '#cypher#cypher#cypher',
      cypher:'\\d'
    }
  });
  var match = exp.exec('123456');

  ok(match.match == '123', 'whole match');
  deepEqual(match.capture(['cypher']),['1','2','3'],'');
});


test("disjunction",function(){
  var exp = new Exp('#subject #verb #predicate[%marks]',{wildcards:{
    subject: '\\w+',
    verb: '\\w+',
    predicate: ['easy to use','ingenious', 'helpful'], // disjunction
    marks: Exp.esc('.!?') // punctuation marks (escape native regexp chars)
  }});

  ok(exp.test('expJS is easy to use!'));
  ok(exp.test('expJS is ingenious?'));
  ok(exp.test('expJS is helpful.'));
});


// TODO new example is necessary since < and > are replaced by # and %
// @deprecated
test("escaping of special chars '%' and '#'",function(){
  var e = /<%s#tagname id%s=%s"#id"%s>#text<\/#w>/g,mmmmmmmmmm
    exp = new Exp(e,{wildcards:{
      tagname: '\\w+',
      text: '.*',
      id: '\\w+',
      s: '\\s*',
      w: '\\w+'
    }});

  var match = exp.exec('[...] <div id="content">text</div> [...]');
  ok(match,e.source + " to " + exp._exp.source);
  deepEqual([match.capture('id'), match.capture('text')], ['content','text']);
});


test("scanning, mapping and skipping",function(){
  var exp = new Exp(/#tag/g,{
    source: '#tag',
    capturePaths: true,
    wildcards:{
      // Captures like #name will be stored in match.$tag_name
      // Here the %name will include the same expression like #expression but without capturing its match.
      "tag": /< #name\ id = "#id" >#content< \/%name >/,

      // The expression assigned to a keyword can hold further injections and captures.
      // So the keywords are resolved recursive (since version 0.4).
      // If an keywords expression contains itslefs, an error event is thrown.
      "name": "%w",

      "id": "%w",
      "content": ".*",

      // a keywords first character can be the injetion or capture prefix "%"/"#".
      // In this case, it's allowd to use the keyword in expressions without prefixing it.
      // So in this example a whitespace respresents the expression \\s* => higher readability with
      // the drawback of meaningull whitespace.
      "% ": "\\s*",
      "w": "\\w+"
    }
  });

  var tokens = exp.scan(
    '<div id = "header" > header text< /div >\n' +
      '<div id = "skip" > header text< /div >\n' +
      '<div id =    "content">content text</div>\n' +
      '<div id="footer">footer text</div>\n',
    function(match){
      return match.capture('tag.id') == 'skip'? this.SKIP : 'tagname: '+ match.capture('tag.name') + ', id: ' + match.capture('tag.id') + ', content: ' + match.capture('tag.content');
    });

  deepEqual(tokens.value(),[
    "tagname: div, id: header, content:  header text",
    "tagname: div, id: content, content: content text",
    "tagname: div, id: footer, content: footer text"
  ]);
});

test('parsing & replacing',function(){
  var
    exp = Exp({ source:'\{\{(#key:\\w+)}\}', global:true}),
    tpl = 'Hi, my name is {{name}}!',
    data = {name: 'Ted'},
    mapper = function(match, tokens){ return data[match.capture('key')] || match.match},
    res = exp.parse(tpl, mapper);

  deepEqual(res.value(), ['Hi, my name is ', 'Ted', '!'], 'parse with functional mapper');

  var
    e = Exp(/(#firstname:\w+)\s+(#lastname:\w+)/),
    s = 'James Bond',
    r1 = e.replace(s, '$lastname, $firstname'),
    r2 = e.replace(s, '$2, $1');
  ok(e.test(s));
  equal(r1, 'Bond, James', 'replace with named captures in string mapper');
  equal(r2, 'Bond, James', 'replace with indexed captures in string mapper');

  var poem = Exp(/^.*$/gm).replace(
    'The rose is red,\n' +
    'the violet\'s blue,\n' +
    'The honey\'s sweet,\n' +
    'and so are you.',
    '$line: $&'
  );
  equal(poem,
    '0: The rose is red,\n' +
    '1: the violet\'s blue,\n' +
    '2: The honey\'s sweet,\n' +
    '3: and so are you.'
  );
});

test('named inline captures',function(){
  var phone = Exp(/(#countrycode:\d+) (#areacode:%number) (#number:(?:\d+))/,{wildcards:{"areacode":/\d{4}/, number:/\d+/}}).exec('001 234 56789');
  equal(phone.capture('countrycode'), '001');
  equal(phone.capture('areacode'), '234');
  equal(phone.capture('number'), '56789');
});



test('assignments',function(){
  // inline assignments
  exp = Exp(/(#person:Homer|Marge|Bart|Lisa|Maggie)>simpsons/g,{
    assignments:{
      "simpsons":{
        Homer: {age:42, gender:'m'},
        Marge: {age:34, gender:'w'},
        Bart: {age:10, gender:'m'},
        Lisa: {age:8, gender:'w'},
        Maggie: {age:1, gender:'w'}
      }
    }
  });

  deepEqual(
    exp.scan('Homer, Marge, Bart, Lisa, Maggie',function(match){
      return {age: match.assignment('age'), gender: match.assignment('gender')};
    }).value(),
    [
      {age:42, gender:'m'},
      {age:34, gender:'w'},
      {age:10, gender:'m'},
      {age:8, gender:'w'},
      {age:1, gender:'w'}
    ],
    'inline assignments selected by captured string'
  );

  var
    e = Exp(/(#c1:\d)>a1(#c2:\d)>a2(#c3:\d)>a3/,{assignments:{
      a1: {attr1:'test1'},
      a2: {attr2:'test2'},
      a3: {attr3:'test3'}
    }}),
    match = e.exec('123')

  deepEqual(
    [match.assignment('attr1'), match.assignment('attr2'), match.assignment('attr3')],
    ['test1', 'test2', 'test3'],
    'multiple assignments'
  );

  var
    e = Exp(/(#c1:\d)>a1(#c2:\d)>>a2(#c3:\d)>a3/,{assignments:{
      a1: {attr1:'test1'},
      a2: {
        attr1:'forced',
        attr2:'test2'
      },
      a3: {
        attr1:'test3',
        attr3:'test3'
      }
    }}),
    match = e.exec('123')

  deepEqual(
    [match.assignment('attr1'), match.assignment('attr2'), match.assignment('attr3')],
    ['forced', 'test2', 'test3'],
    'soft & forced match extension'
  );

});

test('repetitions', function(){
  var e,m;
  e = Exp(/(#list:(#number:\d))*$/,{
    captureRepetition: true
  });

  m = e.exec('0123');
//  ok(match.number[0] == 0 && match.number[1] == 1 && match.number[2] == 2 && match.number[3] == 3);
  deepEqual(
    [
      m.capture('list')[0].capture('number'),
      m.capture('list')[1].capture('number'),
      m.capture('list')[2].capture('number'),
      m.capture('list')[3].capture('number')
    ],
    ['0','1','2','3'],
    'repetition of a named inline capture'
  );
/*
  e = Exp(/((#number:\d))*$/,{
    captureRepetition: true,
    captureIndices:true
  });

  m = e.exec('0123');
//  ok(match.number[0] == 0 && match.number[1] == 1 && match.number[2] == 2 && match.number[3] == 3);
  deepEqual(
    [
      m[1][0].capture('number'),
      m[1][1].capture('number'),
      m[1][2].capture('number'),
      m[1][3].capture('number')
    ],
    ['0','1','2','3'],
    'repetition of a named capture'
  );
*/
  e = Exp(/(#number:\d){0,, }$/,{
    captureRepetition: true
  });
  m = e.exec('0 1 2 3');
  deepEqual(
    [
      m.capture('number')[0].match,
      m.capture('number')[1].match,
      m.capture('number')[2].match,
      m.capture('number')[3].match
    ],
    ['0','1','2','3'],
    'separated repetitions'
  );

  e = Exp(/(#number:\d){0, }$/,{
    captureRepetition: true
  });
  m = e.exec('0 1 2 3');
  equal(m.match,'', '0 separated repetitions');

  // repetition of named capture defined in wildcards
  e = Exp(/#number{0,, }/,{
    captureRepetition: true,
    wildcards:{
      'number': /\d/
    }
  });
  m = e.exec('0 1 2 3');
  deepEqual(
    [
      m.capture('number')[0].match,
      m.capture('number')[1].match,
      m.capture('number')[2].match,
      m.capture('number')[3].match
    ],
    ['0','1','2','3'],
    'separated repetitions'
  );

  e = Exp(/#number{0,,,\s}/,{
    captureRepetition: true,
    wildcards:{
      'number': /\d/
    }
  });
  m = e.exec('0, 1, 2, 3');
  ok(m == '0, 1, 2, 3');
  
  e = Exp(/#number{0,,,\s}/,{
    captureRepetition: true,
    wildcards:{
      'number': /(#pre:\d+)-(#main:\d+)>obj/
    },
    assignments:{
      obj: {attr:'val'}
    }
  });
  m = e.exec('0123-456, 0234-789'); 
  
  ok(m == '0123-456, 0234-789');
  deepEqual(m.cap(['number.main']), ['456', '789'], 'get listed captures by name');
  deepEqual(m.cap(['number.pre']), ['0123', '0234'], 'get listed captures by path');
  deepEqual(m.cap(['number.pre, number.main']), ['0123', '456', '0234', '789'], 'get listed captures by multiple paths');
  ok(m.assignment('attr') == 'val');
});

//test('escaping Exp.esc',function(){});
//test('expanding external source string Exp.expand',function(){});

