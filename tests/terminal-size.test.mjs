import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalSize} from '../lib/terminal-size.ts';
test('terminal resize validates integer bounds without coercion',()=>{
 assert.deepEqual(terminalSize(80,24),{cols:80,rows:24});for(const cols of [true,null,'80',[],19,401,80.5])assert.throws(()=>terminalSize(cols,24));for(const rows of [4,201,'24',false])assert.throws(()=>terminalSize(80,rows));
});
