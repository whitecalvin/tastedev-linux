import test from 'node:test';import assert from 'node:assert/strict';import {patchDrafts,hasUnsavedFiles} from '../lib/draft-state.ts';
test('draft updates retain unrelated package and editor state without mutating old snapshots',()=>{const first={editorTabs:[{name:'a.js',text:'one',baseline:'one'}],packageKind:'redis'};const edited=patchDrafts(first,'editorTabs',tabs=>tabs.map(tab=>({...tab,text:'two'})));assert.equal(first.editorTabs[0].text,'one');assert.equal(edited.packageKind,'redis');assert.equal(hasUnsavedFiles(first),false);assert.equal(hasUnsavedFiles(edited),true);assert.equal(hasUnsavedFiles({}),false);});

import {loginDestination} from '../lib/login-destination.ts';
test('login return paths retain valid package selection and reject external destinations',()=>{assert.equal(loginDestination('/ide?package=redis'),'/ide?package=redis');assert.equal(loginDestination('//evil.example'),'/overview');assert.equal(loginDestination('https://evil.example'),'/overview');assert.equal(loginDestination('/login'),'/overview');assert.equal(loginDestination('/ide?package=unknown#tab'),'/ide');});

test('hidden package code changes remain protected across profile switches',()=>{assert.equal(hasUnsavedFiles({packageCodeRecords:{redis:{text:'edited',baseline:'original',visible:false}}}),true);assert.equal(hasUnsavedFiles({packageCodeRecords:{redis:{text:'same',baseline:'same'}}}),false);});

test('hidden nginx tree code remains protected while edited',()=>{assert.equal(hasUnsavedFiles({nginxTreeCode:{text:'changed',baseline:'original',visible:false}}),true);assert.equal(hasUnsavedFiles({nginxTreeCode:{text:'same',baseline:'same'}}),false);});

test('uncommitted nginx block code remains protected across tree and view changes',()=>{assert.equal(hasUnsavedFiles({nginxCodeBuffers:{'/etc/nginx/nginx.conf:2':{text:'server { listen 8080; }',baseline:'server { listen 80; }'}}}),true);assert.equal(hasUnsavedFiles({nginxCodeBuffers:{file:{text:'same',baseline:'same'}}}),false);assert.equal(hasUnsavedFiles({nginxCodeBuffers:{}}),false);});

test('incomplete package GUI fields remain protected until corrected',()=>{assert.equal(hasUnsavedFiles({packageCodeRecords:{'nodejs:app.env':{text:'PORT=3000',baseline:'PORT=3000',guiValues:{port:''}}}}),true);assert.equal(hasUnsavedFiles({packageCodeRecords:{'nodejs:app.env':{text:'PORT=3000',baseline:'PORT=3000',guiValues:{}}}}),false);});

test('login return keeps local query values and repeated filters but drops fragments',()=>{assert.equal(loginDestination('/ide/packages/nginx?view=code&filter=a&filter=b#old'),'/ide/packages/nginx?view=code&filter=a&filter=b');assert.equal(loginDestination('/logs?filter=error%20log'),'/logs?filter=error%20log');assert.equal(loginDestination('/ide?package=unknown&view=code'),'/ide?view=code');assert.equal(loginDestination('/\\evil.example'),'/overview');});

test('package IDE changes are protected even when hidden and mirrored GUI values alone stay clean',()=>{
 for(const kind of ['postgresql','certbot','redis','mariadb']){
  const record={kind,text:'original',baseline:'original',visible:false,guiValues:{port:5432}};
  assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{[kind]:record}}),false,'reading a configuration is not an edit');
  assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{[kind]:{...record,text:'edited'}}}),true,kind+' edits must warn before leaving');
  assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{[kind]:{...record,text:'edited',baseline:'edited'}}}),false,'successful save clears the warning');
 }
});

test('pending IDE GUI input warns even when serialized code is unchanged',()=>{
 const record={text:'port = 5432',baseline:'port = 5432',pendingGuiFields:['port']};
 assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{postgresql:record}}),true);
 assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{postgresql:{...record,pendingGuiFields:[]}}}),false);
});

test('unserialized file-setting input activates the IDE leave guard until corrected',()=>{
 const record={text:'port = 5432\n',baseline:'port = 5432\n',pendingSettingInputs:{'1:port':{raw:'port = 5432\n',value:"'unfinished",enabled:true,error:'invalid'}}};
 assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{postgresql:record}}),true);
 assert.equal(hasUnsavedFiles({packageIdeCodeRecords:{postgresql:{...record,pendingSettingInputs:{}}}}),false);
});

test('nginx pending-only settings activate the leave guard across pages until cleared',()=>{
 const record={source:'events {}',values:{field:''}};
 assert.equal(hasUnsavedFiles({nginxPendingInputs:{'/etc/nginx/nginx.conf':record}}),true);
 assert.equal(hasUnsavedFiles({nginxPendingInputs:{'/etc/nginx/nginx.conf':{...record,values:{}}}}),false);
 assert.equal(hasUnsavedFiles({nginxPendingInputs:{}}),false);
});

test('login returns to system settings while preserving local filters and removing fragments',()=>{assert.equal(loginDestination('/settings?section=ai#old'),'/settings?section=ai');assert.equal(loginDestination('/settings?filter=a&filter=b'),'/settings?filter=a&filter=b');assert.equal(loginDestination('/settings/unknown'),'/overview');});
