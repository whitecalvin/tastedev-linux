import test from 'node:test';
import assert from 'node:assert/strict';
import {closeWorkspaceTab} from '../lib/workspace-tabs.ts';
test('closing a workspace tab retains other edits and picks an adjacent tab only for the closed active tab',()=>{
 const tabs=['a','b','c'].map(name=>({name,text:name,baseline:'original',version:'v1'}));
 const before=JSON.stringify(tabs);const result=closeWorkspaceTab(tabs,'b',{...tabs[1]});assert.deepEqual(result.tabs,[tabs[0],tabs[2]]);assert.equal(result.active,'c');
 assert.equal(closeWorkspaceTab(tabs,'a',tabs[1]).active,'a');assert.equal(closeWorkspaceTab(tabs,'c',tabs[2]).active,'b');assert.equal(closeWorkspaceTab([tabs[0]],'a',tabs[0]).active,'');assert.equal(JSON.stringify(tabs),before);
});
test('workspace tab close rejects newer edits, updated disk baselines and missing targets',()=>{
 const tab={name:'file.js',text:'edited',baseline:'original',version:'v1'},request={...tab};
 for(const patch of [{text:'newer'},{baseline:'updated'},{version:'v2'}])assert.throws(()=>closeWorkspaceTab([{...tab,...patch}],'file.js',request));
 assert.throws(()=>closeWorkspaceTab([],'file.js',request));
});
