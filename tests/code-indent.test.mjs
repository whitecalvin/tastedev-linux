import test from 'node:test';
import assert from 'node:assert/strict';
import {insertCodeIndent,editCodeIndent} from '../lib/code-indent.ts';
test('editor indent preserves surrounding source and selection cursor without exceeding limit',()=>{
 assert.deepEqual(insertCodeIndent('server {\n}',9,9),{text:'server {\n  }',cursor:11});
 assert.deepEqual(insertCodeIndent('한글abc😀',2,5),{text:'한글  😀',cursor:4});
 assert.equal(insertCodeIndent('a'.repeat(262144),0,0),null);assert.throws(()=>insertCodeIndent('a',2,2));
});

test('multiline indentation retains selected lines and excludes a trailing unselected line',()=>{
 const source='one\ntwo\nthree';
 const indented=editCodeIndent(source,0,8);
 assert.deepEqual(indented,{text:'  one\n  two\nthree',start:2,end:12});
 assert.deepEqual(editCodeIndent(indented.text,indented.start,indented.end,true),{text:source,start:0,end:8});
 assert.deepEqual(editCodeIndent('abc',1,2),{text:'a  c',start:3,end:3});
});

test('outdent handles tabs, short prefixes, CRLF, Unicode and an empty first line',()=>{
 assert.deepEqual(editCodeIndent('\t한글\r\n x',0,7,true),{text:'한글\r\nx',start:0,end:5});
 assert.deepEqual(editCodeIndent('  value',1,1,true),{text:'value',start:0,end:0});
 assert.deepEqual(editCodeIndent('value',2,2,true),{text:'value',start:2,end:2});
 assert.deepEqual(editCodeIndent('\n  value',0,0,true),{text:'\n  value',start:0,end:0});
 assert.equal(editCodeIndent('x\n'+'x'.repeat(262142),0,3),null);
 assert.throws(()=>editCodeIndent('a',-1,0,true));
 assert.deepEqual(editCodeIndent('    server',4,4,true,'    '),{text:'server',start:0,end:0});
 assert.deepEqual(editCodeIndent('x',0,0,false,'    '),{text:'    x',start:4,end:4});
 assert.throws(()=>editCodeIndent('x',0,0,false,'\n'));
});

test('large selections preserve every line and reject oversized indentation before creating output',()=>{
 const text='  x\n'.repeat(50000),changed=editCodeIndent(text,0,text.length,true);
 assert.equal(changed.text,'x\n'.repeat(50000));assert.equal(changed.start,0);assert.equal(changed.end,100000);
 const oversized='x\n'.repeat(100000);assert.equal(editCodeIndent(oversized,0,oversized.length),null);
});
