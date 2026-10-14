import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
import {nginxNodeKey} from '../lib/nginx-node-key.ts';
import {nginxEditorTarget,nginxCodeRecoveryEntries,recoverNginxCodeBuffer} from '../lib/nginx-code-recovery.ts';
import {hasUnsavedFiles} from '../lib/draft-state.ts';
const file=source=>({path:'/etc/nginx/nginx.conf',source,nodes:parseNginxTree(source)});
const identity=(file,node)=>JSON.stringify([file.path,nginxNodeKey(file.nodes,node?.id)]);
test('renamed or removed blocks retain recoverable code without modifying configuration',()=>{
 const original=file('http { server { listen 80; } }'),block=original.nodes[0].children[0],id=identity(original,block),baseline=original.source.slice(block.start,block.end),text='server { listen 8080; }';
 const buffers={[id]:{text,baseline}},renamed=file('http { server changed { listen 80; } }');
 assert.equal(nginxCodeRecoveryEntries(buffers,[original])[0].state,'current');
 assert.equal(nginxCodeRecoveryEntries(buffers,[renamed])[0].state,'missing');
 assert.equal(nginxCodeRecoveryEntries(buffers,[])[0].buffer.text,text);
 const target=nginxEditorTarget(identity(renamed,renamed.nodes[0].children[0]),[renamed]);
 const recovered=recoverNginxCodeBuffer(buffers,id,target);
 assert.equal(recovered[id],undefined);assert.equal(recovered[target.identity].text,text);assert.equal(recovered[target.identity].baseline,'server changed { listen 80; }');
 assert.equal(renamed.source,'http { server changed { listen 80; } }');assert.equal(buffers[id].text,text);
 assert.throws(()=>recoverNginxCodeBuffer(buffers,id,nginxEditorTarget(identity(renamed),[renamed])));
 assert.throws(()=>recoverNginxCodeBuffer(buffers,id,{...target,filePath:'/etc/nginx/conf.d/other.conf'}));
});
test('external edits require rebasing and dirty target buffers require explicit replacement',()=>{
 const original=file('server { listen 80; }'),id=identity(original,original.nodes[0]),buffers={[id]:{text:'server { listen 8080; }',baseline:original.source}};
 const changed=file('server { listen 81; }'),target=nginxEditorTarget(id,[changed]);
 assert.equal(nginxCodeRecoveryEntries(buffers,[changed])[0].state,'changed');
 const next=recoverNginxCodeBuffer(buffers,id,target);assert.equal(next[id].baseline,changed.source);
 const other=file('server alternate { listen 82; }'),otherTarget=nginxEditorTarget(identity(other,other.nodes[0]),[other]);
 const both={...buffers,[otherTarget.identity]:{text:'server alternate { listen 90; }',baseline:other.source}};
 assert.throws(()=>recoverNginxCodeBuffer(both,id,otherTarget),/미저장/);
 assert.equal(recoverNginxCodeBuffer(both,id,otherTarget,true)[otherTarget.identity].text,buffers[id].text);
 assert.equal(both[otherTarget.identity].text,'server alternate { listen 90; }');
 assert.equal(nginxEditorTarget('invalid',[original]),null);
 assert.equal(hasUnsavedFiles({nginxCodeBuffers:{[id]:{text:original.source,baseline:original.source,dirty:true}}}),true);
});

import {applyNginxRecoveryConfirmation} from '../lib/nginx-code-recovery.ts';
test('approval cannot overwrite a newer buffer, a changed target, or a newly protected file',()=>{
 const original=file('server { listen 80; }'),id=identity(original,original.nodes[0]);
 const changed=file('server alternate { listen 81; }'),target=nginxEditorTarget(identity(changed,changed.nodes[0]),[changed]);
 const buffers={[id]:{text:'server { listen 8080; }',baseline:original.source},[target.identity]:{text:'server alternate { listen 9090; }',baseline:changed.source}};
 const request={kind:'replace',identity:id,buffer:{...buffers[id]},target:{...target},destination:{...buffers[target.identity]}};
 const approved=applyNginxRecoveryConfirmation(buffers,request,target);assert.equal(approved[target.identity].text,buffers[id].text);assert.equal(approved[id],undefined);
 assert.throws(()=>applyNginxRecoveryConfirmation({...buffers,[id]:{...buffers[id],text:'new edits'}},request,target),/설정이 변경/);
 assert.throws(()=>applyNginxRecoveryConfirmation({...buffers,[target.identity]:{...buffers[target.identity],text:'new target edits'}},request,target),/설정이 변경/);
 assert.throws(()=>applyNginxRecoveryConfirmation(buffers,request,{...target,source:'external change'}),/설정이 변경/);
 const protectedTarget=nginxEditorTarget(target.identity,[{...changed,readOnly:true}]);assert.equal(protectedTarget.readOnly,true);
 assert.throws(()=>applyNginxRecoveryConfirmation(buffers,request,protectedTarget));assert.throws(()=>recoverNginxCodeBuffer(buffers,id,protectedTarget,true));
 assert.equal(buffers[target.identity].text,'server alternate { listen 9090; }');assert.equal(changed.source,'server alternate { listen 81; }');
});
test('discard approval removes only the captured unchanged buffer and preserves other edits',()=>{
 const source=file('events {} http {}'),id=identity(source,source.nodes[0]),other=identity(source,source.nodes[1]);
 const buffers={[id]:{text:'events { worker_connections 32; }',baseline:'events {}'},[other]:{text:'http { server {} }',baseline:'http {}'}};
 const request={kind:'discard',identity:id,buffer:{...buffers[id]}};const next=applyNginxRecoveryConfirmation(buffers,request,null);
 assert.equal(next[id],undefined);assert.deepEqual(next[other],buffers[other]);assert.ok(buffers[id]);
 assert.throws(()=>applyNginxRecoveryConfirmation({...buffers,[id]:{...buffers[id],text:'events { worker_connections 64; }'}},request,null));
 assert.throws(()=>applyNginxRecoveryConfirmation({},request,null));
});

import {resetNginxEditorBuffer} from '../lib/nginx-code-recovery.ts';
test('editor reset refuses altered or missing buffer and target without discarding other edits',()=>{
 const buffer={text:'listen 8080;',baseline:'listen 80;',dirty:true},buffers={selected:buffer,other:{text:'keep',baseline:'original',dirty:true}};
 const request={identity:'selected',source:'listen 80;',buffer:{...buffer}},current={identity:'selected',source:'listen 80;',readOnly:false};
 const result=resetNginxEditorBuffer(buffers,request,current);assert.equal(result.selected,undefined);assert.equal(result.other,buffers.other);assert.equal(buffers.selected,buffer);
 assert.throws(()=>resetNginxEditorBuffer({...buffers,selected:{...buffer,text:'new edit'}},request,current));
 assert.throws(()=>resetNginxEditorBuffer({other:buffers.other},request,current));
 for(const changed of [{...current,identity:'other'},{...current,source:'listen 81;'},{...current,readOnly:true}])assert.throws(()=>resetNginxEditorBuffer(buffers,request,changed));
 assert.throws(()=>resetNginxEditorBuffer(buffers,{...request,buffer:null},current));
});

test('malformed saved node paths stay missing and cannot become recovery targets',()=>{
 for(const key of ['0','false','[]','[[{},"server",0]]','[["block",{},0]]','[["block","server",-1]]','[["block","server",0.5]]']){
  const identity=JSON.stringify(['/etc/nginx/nginx.conf',key]);assert.equal(nginxEditorTarget(identity,[]),null);
  const buffers={[identity]:{text:'edited',baseline:'original'}};const entries=nginxCodeRecoveryEntries(buffers,[]);assert.equal(entries.length,1);assert.equal(entries[0].state,'missing');assert.equal(entries[0].buffer,buffers[identity]);
 }
});
