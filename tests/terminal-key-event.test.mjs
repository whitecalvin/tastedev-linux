import test from 'node:test';import assert from 'node:assert/strict';import {terminalKeyEvent} from '../lib/terminal-key-event.ts';
test('terminal leaves input-method switching keys native without cancelling the browser event',()=>{
 for(const key of ['HangulMode','Hangul','HanjaMode','Hanja','KanaMode','KanjiMode','Convert','NonConvert','ModeChange'])for(const type of ['keydown','keyup'])assert.equal(terminalKeyEvent({key,type,preventDefault:()=>assert.fail('native language switching must not be cancelled')}),false);
 for(const keyCode of [21,25])assert.equal(terminalKeyEvent({key:'Unidentified',keyCode}),false);
});
test('xterm retains composition commits, consonant transitions and ordinary terminal shortcuts',()=>{
 for(const event of [{key:'Process',keyCode:229,isComposing:true},{key:'Enter',keyCode:229,isComposing:true},{key:'Enter',keyCode:13,isComposing:true},{key:'Backspace',keyCode:8,isComposing:true},{key:'a'},{key:'c',ctrlKey:true},{key:'ArrowUp'},{key:'Tab'},{key:'Escape'}])assert.equal(terminalKeyEvent(event),true);
});
