import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPendingFileInputs,carryNginxSettingInputs,hasPendingNginxInputs,snapshotNginxPendingInputs,restoreNginxPendingInputs,setNginxAuxiliaryInput} from '../lib/nginx-pending-inputs.ts';
import {parseNginxTree,updateNginxDirective} from '../lib/nginx-syntax.ts';
import {nginxNodeKey} from '../lib/nginx-node-key.ts';
test('unapplied nginx inputs survive navigation but never cross file text versions',()=>{
 const cache=new Map(),first=nginxPendingFileInputs(cache,'/etc/nginx/nginx.conf','user www-data;');
 first.set('row','');first.set('another','pending');
 assert.equal(nginxPendingFileInputs(cache,'/etc/nginx/nginx.conf','user www-data;').get('row'),'');
 assert.equal(nginxPendingFileInputs(cache,'/etc/nginx/other.conf','user www-data;').size,0);
 assert.equal(nginxPendingFileInputs(cache,'/etc/nginx/nginx.conf','user nginx;').size,0);
 assert.equal(nginxPendingFileInputs(cache,'/etc/nginx/nginx.conf','user www-data;').size,0);
 for(let index=0;index<20;index++)nginxPendingFileInputs(cache,String(index),'source');
 assert.equal(cache.size,16);
});
test('pending additional settings retain their values only within a verified unchanged block',()=>{
 const cache=new Map(),path='/etc/nginx/nginx.conf',before='http { server { listen 80; } server { listen 81; } }',nodes=parseNginxTree(before),first=nodes[0].children[0],second=nodes[0].children[1];
 const scope=nginxNodeKey(nodes,first.id),other=nginxNodeKey(nodes,second.id),values=nginxPendingFileInputs(cache,path,before),key=parent=>JSON.stringify([parent,true,'server_name','server_name example.test']);
 values.set(key(scope),'first.pending.test');values.set(key(other),'second.pending.test');values.set(key('missing-block'),'invalid');
 const after=updateNginxDirective(before,first.children[0].id,'8080');carryNginxSettingInputs(cache,path,before,after);const carried=nginxPendingFileInputs(cache,path,after);
 assert.equal(carried.get(key(scope)),'first.pending.test');assert.equal(carried.get(key(other)),'second.pending.test');assert.equal(carried.has(key('missing-block')),false);
});
test('additional settings for a file root survive local edits without adopting block values',()=>{
 const cache=new Map(),path='/etc/nginx/nginx.conf',before='worker_processes auto;',node=parseNginxTree(before)[0],values=nginxPendingFileInputs(cache,path,before),key=JSON.stringify(['root',true,'worker_rlimit_nofile','worker_rlimit_nofile 65535']);values.set(key,'8192');
 const after=updateNginxDirective(before,node.id,'2');carryNginxSettingInputs(cache,path,before,after);assert.equal(nginxPendingFileInputs(cache,path,after).get(key),'8192');
});
test('local setting commit retains other pending fields across settings navigation',()=>{
 const cache=new Map(),path='/etc/nginx/nginx.conf',before='http { server { listen 80; server_name demo.test; } }',nodes=parseNginxTree(before),directives=nodes[0].children[0].children;
 const values=nginxPendingFileInputs(cache,path,before),key=node=>JSON.stringify(['server-scope',false,node.id,node.label]);
 values.set(key(directives[0]),'8080');values.set(key(directives[1]),'pending.test');
 const after=updateNginxDirective(before,directives[0].id,'8080');carryNginxSettingInputs(cache,path,before,after);
 const carried=nginxPendingFileInputs(cache,path,after);assert.equal(carried.get(key(directives[1])),'pending.test');assert.equal(carried.has(key(directives[0])),false);assert.deepEqual([...carried.values()],['pending.test'],'the committed value must not survive under its updated label');
 assert.equal(nginxPendingFileInputs(cache,path,after+'\n# external refresh').size,0,'external changes retain existing invalidation');
});
test('changed repeated directives are discarded while untouched occurrences retain their own input',()=>{
 const cache=new Map(),path='/etc/nginx/nginx.conf',before='server { listen 80; listen 443 ssl; server_name demo.test; }',nodes=parseNginxTree(before)[0].children,values=nginxPendingFileInputs(cache,path,before);
 const key=node=>JSON.stringify(['scope',false,node.id,node.label]);values.set(key(nodes[0]),'8080');values.set(key(nodes[1]),'444 ssl');
 const after=updateNginxDirective(before,nodes[0].id,'8080');carryNginxSettingInputs(cache,path,before,after);assert.deepEqual([...nginxPendingFileInputs(cache,path,after).values()],['444 ssl']);
});
test('an edit creating equal sibling labels cannot transfer pending input to the edited sibling',()=>{
 const cache=new Map(),path='/etc/nginx/nginx.conf',before='server { listen 80; listen 443; }',nodes=parseNginxTree(before)[0].children,values=nginxPendingFileInputs(cache,path,before);
 values.set(JSON.stringify(['scope',false,nodes[1].id,nodes[1].label]),'444');
 carryNginxSettingInputs(cache,path,before,updateNginxDirective(before,nodes[0].id,'443'));assert.equal(nginxPendingFileInputs(cache,path,'server { listen 443; listen 443; }').size,0);
});

 test('nginx apply detects only pending inputs for its file and actual source version',()=>{
 const cache=new Map(),path='/etc/nginx/nginx.conf',source='user www-data;',values=nginxPendingFileInputs(cache,path,source);
 assert.equal(hasPendingNginxInputs(cache,path,source),false);values.set('setting','');assert.equal(hasPendingNginxInputs(cache,path,source),true);
 assert.equal(hasPendingNginxInputs(cache,path,source+'\n'),false);values.clear();
 const identity=JSON.stringify([path,'root']),buffers={[identity]:{text:'user nginx;',baseline:source}};
 assert.equal(hasPendingNginxInputs(cache,path,source,buffers),true);assert.equal(hasPendingNginxInputs(cache,'/etc/nginx/other.conf',source,buffers),false);
 assert.equal(hasPendingNginxInputs(cache,path,source,{[identity]:{text:source,baseline:source},malformed:{text:'pending'}}),false);
 });

test('nginx pending snapshots survive route remount and isolate mutable caches',()=>{
 const path='/etc/nginx/nginx.conf',source='http {}',cache=new Map(),values=nginxPendingFileInputs(cache,path,source);
 setNginxAuxiliaryInput(values,'root','custom-directive',{name:'option',value:'pending'});
 const snapshot=snapshotNginxPendingInputs(cache);values.values().next().value.value='changed';assert.equal(Object.values(snapshot[path].values)[0].value,'pending','provider snapshot does not share mutable field objects');
 const restored=restoreNginxPendingInputs(snapshot);assert.equal(hasPendingNginxInputs(restored,path,source),true);nginxPendingFileInputs(restored,path,source).values().next().value.value='another';assert.equal(Object.values(snapshot[path].values)[0].value,'pending');
 assert.equal(nginxPendingFileInputs(restored,path,source+'\n').size,0,'changed original versions still invalidate restored input');assert.deepEqual(snapshotNginxPendingInputs(restored),{});assert.equal(restoreNginxPendingInputs({bad:null}).size,0);
});

test('pending restore accepts valid inputs and discards malformed stored values',()=>{
 const source='http {}',restored=restoreNginxPendingInputs({bad:{source,values:{invalid:42,array:[],object:{name:'x',value:null},text:'kept',custom:{name:'x',value:'pending'}}}});
 assert.deepEqual([...restored.get('bad').values], [['text','kept'],['custom',{name:'x',value:'pending'}]]);
 for(const value of [null,42,[],{bad:{source:42,values:{x:'y'}}}])assert.equal(restoreNginxPendingInputs(value).size,0);
});
