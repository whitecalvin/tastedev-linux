import test from 'node:test';
import assert from 'node:assert/strict';
import {nextCodeMatch} from '../lib/code-search.ts';
test('code search selects next literal occurrence and wraps without changing source',()=>{
 const text='한글 port 80;\nport 443;\n';assert.deepEqual(nextCodeMatch(text,'port',0),{start:3,end:7});assert.deepEqual(nextCodeMatch(text,'port',7),{start:12,end:16});assert.deepEqual(nextCodeMatch(text,'port',16),{start:3,end:7});
 assert.equal(nextCodeMatch(text,'missing'),null);assert.equal(nextCodeMatch(text,''),null);assert.deepEqual(nextCodeMatch('a.* b','.*'),{start:1,end:3});assert.deepEqual(nextCodeMatch('😀😀','😀',2),{start:2,end:4});
});
