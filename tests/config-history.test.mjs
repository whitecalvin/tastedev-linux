import test from 'node:test';
import assert from 'node:assert/strict';
import {recordConfigChange,stepConfigHistory} from '../lib/config-history.ts';
test('config history supports undo redo branching and a bounded memory history',()=>{
 let history=recordConfigChange(null,'original','first');history=recordConfigChange(history,'original','second');
 const original=history;history=stepConfigHistory(history,'undo');assert.equal(history.source,'first');assert.equal(history.baseline,'original');
 history=stepConfigHistory(history,'redo');assert.equal(history.source,'second');assert.equal(original.source,'second');
 history=stepConfigHistory(history,'undo');history=recordConfigChange(history,'original','branch');assert.equal(history.future.length,0);
 for(let i=0;i<25;i++)history=recordConfigChange(history,'original',String(i));assert.equal(history.past.length,20);
 assert.equal(recordConfigChange(history,'original',history.source),history);
});
