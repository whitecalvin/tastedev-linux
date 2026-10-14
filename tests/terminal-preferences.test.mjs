import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalPreferences,mergeTerminalPreferences} from '../lib/terminal-preferences.ts';
test('persistent terminal preferences exclude sessions, credentials, commands and editor buffers',()=>{
 const saved=terminalPreferences({terminalAppearance:{fontSize:18,cursorStyle:'bar',cursorBlink:true,scrollback:10000,secret:'credential'},terminalTabTimeout:900,terminalTabs:[{command:'secret'}],account:'user',editorTabs:['private']});
 assert.deepEqual(Object.keys(saved),['terminalAppearance','terminalTabTimeout']);assert.deepEqual(saved.terminalAppearance,{fontSize:18,cursorStyle:'bar',cursorBlink:true,scrollback:10000});assert.equal(saved.terminalTabTimeout,900);assert(!JSON.stringify(saved).includes('secret'));assert(!JSON.stringify(saved).includes('credential'));
});
test('storage values are bounded and recovery cannot replace current edits',()=>{
 const defaults=terminalPreferences({terminalTabTimeout:Infinity,terminalAppearance:{fontSize:100,cursorStyle:'bad',scrollback:100000000,cursorBlink:'yes'}});
 assert.equal(defaults.terminalTabTimeout,3600);assert.equal(defaults.terminalAppearance.fontSize,13);assert.equal(defaults.terminalAppearance.scrollback,3000);assert.equal(defaults.terminalAppearance.cursorBlink,false);
 const current={terminalAppearance:{fontSize:16},editorTabs:['draft']},merged=mergeTerminalPreferences(current,{terminalAppearance:{fontSize:18},terminalTabTimeout:300});assert.equal(merged.terminalAppearance,current.terminalAppearance);assert.equal(merged.editorTabs,current.editorTabs);assert.equal(merged.terminalTabTimeout,300);
});
