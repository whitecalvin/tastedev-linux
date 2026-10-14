import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeWorkspaceTab} from '../lib/workspace-tabs.ts';
import {hasUnsavedFiles} from '../lib/draft-state.ts';

test('saved package drafts reopen one clean tab while generated previews remain unsaved',()=>{
 const saved={name:'redis.conf',text:'port 6379\n',version:'v1'};
 const first=mergeWorkspaceTab([],saved);
 assert.equal(hasUnsavedFiles({editorTabs:first.tabs}),false);
 const reopened=mergeWorkspaceTab(first.tabs,{...saved,text:'port 6380\n',version:'v2'});
 assert.equal(reopened.tabs.length,1);assert.equal(reopened.tabs[0].baseline,'port 6380\n');
 assert.equal(first.tabs[0].text,saved.text);
 const preview=mergeWorkspaceTab(reopened.tabs,{name:'generated.conf',text:'server {}'});
 assert.equal(preview.tabs[1].baseline,null);assert(hasUnsavedFiles({editorTabs:preview.tabs}));
});

test('reopening a saved draft preserves different unsaved edits and can acknowledge identical saved bytes',()=>{
 const edited={name:'redis.conf',text:'port 6390\n',baseline:'port 6379\n',version:'v1'};
 const other={name:'other.conf',text:'keep',baseline:'keep'},tabs=[edited,other];
 const conflict=mergeWorkspaceTab(tabs,{name:'redis.conf',text:'port 6380\n',version:'v2'});
 assert(conflict.preserved);assert.equal(conflict.tabs,tabs);assert.equal(conflict.existing,edited);
 assert(hasUnsavedFiles({editorTabs:conflict.tabs}));
 const same=mergeWorkspaceTab(tabs,{name:'redis.conf',text:edited.text,version:'v3'});
 assert.equal(same.preserved,false);assert.equal(same.tabs.length,2);
 assert.equal(same.tabs[0].version,'v3');assert.equal(same.tabs[0].baseline,edited.text);
 assert.equal(same.tabs[1],other);assert.equal(edited.baseline,'port 6379\n');
});
