import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalOutputFrame} from '../lib/terminal-output-frame.ts';
test('terminal polling writes each sequence once and identifies missing history',()=>{
 let frame=terminalOutputFrame(null,{id:'a',command:'pwd',logs:[{sequence:1,text:'first'}]});assert.equal(frame.reset,true);assert.equal(frame.chunks[0].gap,false);const cursor=frame.cursor;
 frame=terminalOutputFrame(cursor,{id:'a',logs:[{sequence:1,text:'first'},{sequence:2,text:'next'}]});assert.deepEqual(frame.chunks,[{text:'next',gap:false}]);assert.equal(terminalOutputFrame(frame.cursor,{id:'a',logs:[{sequence:1,text:'old'}]}).chunks.length,0);
 frame=terminalOutputFrame(frame.cursor,{id:'a',logs:[{sequence:5,text:'partial'}]});assert.equal(frame.chunks[0].gap,true);assert.equal(terminalOutputFrame(frame.cursor,{id:'b',logs:[]}).reset,true);
});
test('unchanged legacy terminal history does not repeatedly reset the display',()=>{
 const job={id:'old',command:'pwd',logs:[{text:'legacy'}]},first=terminalOutputFrame(null,job),again=terminalOutputFrame(first.cursor,job);assert.equal(first.header,'$ pwd');assert.equal(again.header,null);assert.equal(again.reset,false);assert.equal(again.chunks.length,0);assert.equal(terminalOutputFrame(again.cursor,{...job,logs:[{text:'changed'}]}).reset,true);
});
