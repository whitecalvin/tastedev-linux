import test from 'node:test';
import assert from 'node:assert/strict';
import {patchNodeEnv} from '../lib/node-env-patch.ts';
import {parseNodeEnv} from '../lib/node-env.ts';
test('Node environment edits preserve unknown secrets, comments, export syntax and CRLF',()=>{
 const text='# project\r\nAPI_KEY="fixture-private"\r\nexport PORT = "3000" # app port\r\nHOST=127.0.0.1\r\n';
 const patched=patchNodeEnv(text,{port:3010,logLevel:'debug'});
 assert.equal(patched,'# project\r\nAPI_KEY="fixture-private"\r\nexport PORT = 3010 # app port\r\nHOST=127.0.0.1\r\nLOG_LEVEL=debug\r\n');assert.deepEqual(parseNodeEnv(patched).values,{port:3010,host:'127.0.0.1',logLevel:'debug'});
 assert.equal(patchNodeEnv('TOKEN=opaque',{memory:128}),'TOKEN=opaque\nNODE_OPTIONS=--max-old-space-size=128\n');
});
test('Node environment edits refuse duplicate, unsupported or injected known values and unknown changes',()=>{
 for(const [text,changes] of [['PORT=1\nPORT=2',{port:3000}],['NODE_OPTIONS=--inspect',{memory:128}],['PORT=3000',{port:'3000\nTOKEN=evil'}],['PORT=3000',{host:'127.0.0.1\nEVIL=1'}],['',{TOKEN:'value'}],['',{}]])assert.throws(()=>patchNodeEnv(text,changes));
});
