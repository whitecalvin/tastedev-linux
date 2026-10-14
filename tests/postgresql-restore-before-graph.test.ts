import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {capturePostgresqlBeforeGraph,validatePostgresqlBeforeGraph} from '../lib/postgresql-restore-before-graph.ts';
import type {BeforeGraphRequest} from '../lib/postgresql-restore-before-graph.ts';
const target='/etc/postgresql/16/main/postgresql.conf',folder='/etc/postgresql/16/main/conf.d';
const source=(text:string)=>({present:true,text,version:createHash('sha256').update(text).digest('hex')});
function fixture(){
 const files=new Map<string,ReturnType<typeof source>|{present:false}>([[target,source("include_dir 'conf.d'\ninclude_if_exists 'missing.conf'\n")],[folder+'/Z.conf',source('port=5432\n')],[folder+'/a.conf',source('work_mem=4096\n')],[target.replace('postgresql.conf','missing.conf'),{present:false}]]);
 const respond=(request:BeforeGraphRequest):unknown=>request.kind==='directory'?{present:true,names:['Z.conf','a.conf']}:files.get(request.path);
 return {files,respond,body:{target,files:[...files].map(([path,before])=>({path,before})),directories:[[folder,{}]],memberships:[[folder,['Z.conf','a.conf']]]}};
}
test('before graph captures C directory order and optional absence then validates the same recorded graph identity',async()=>{
 const f=fixture(),graph=await capturePostgresqlBeforeGraph(target,f.respond);
 assert.equal(graph.complete,true);assert.deepEqual(graph.directories[0].names,['Z.conf','a.conf']);assert.deepEqual(graph.missing,[target.replace('postgresql.conf','missing.conf')]);
 assert.equal(validatePostgresqlBeforeGraph(graph,f.body),graph);
 assert.throws(()=>validatePostgresqlBeforeGraph({...graph,version:'a'.repeat(64)},f.body),{status:409});
 assert.throws(()=>validatePostgresqlBeforeGraph(graph,{...f.body,memberships:[[folder,['a.conf','Z.conf']]]}),{status:409});
});
test('before graph refuses malformed yielded sources and directory metadata without reading host files',async()=>{
 const f=fixture();await assert.rejects(capturePostgresqlBeforeGraph(target,()=>null),{status:409});
 await assert.rejects(capturePostgresqlBeforeGraph(target,request=>request.kind==='directory'?{present:true,names:[null]}:f.respond(request)),{status:409});
 await assert.rejects(capturePostgresqlBeforeGraph(target,request=>request.kind==='directory'?{present:false,names:['Z.conf']}:f.respond(request)),{status:409});
 assert.throws(()=>validatePostgresqlBeforeGraph({},null),{status:409});
});
test('unavailable required includes and out-of-cluster references cannot claim a complete before graph',async()=>{
 const graph=await capturePostgresqlBeforeGraph(target,request=>request.path===target?source("include 'absent.conf'\ninclude '/etc/passwd'\n"):{present:false});
 assert.equal(graph.complete,false);assert.equal(graph.requiredMissing[0].kind,'file');assert.equal(graph.issues[0].reason,'outside-scope');assert.equal(graph.operationalResourcesVerified,false);
});
