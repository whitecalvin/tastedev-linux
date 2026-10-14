// Native verifier subprocess only. Never used by an HTTP endpoint/root helper.
import {assertPostgresqlRunningService} from '../lib/postgresql-code-operation.ts';
import assert from 'node:assert/strict';
import {readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import {inspectPostgresqlGraphArchive} from '../lib/postgresql-archive-candidate.ts';
import {reviewPostgresqlGraphRestore} from '../lib/postgresql-graph-restore-review.ts';
import {applyReviewedPostgresqlGraphRestore} from '../lib/postgresql-reviewed-graph-restore.ts';
import {readPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalServiceContext} from '../lib/postgresql-graph-restore-journal.ts';
import {recoverReviewedPostgresqlGraph} from '../lib/postgresql-reviewed-graph-recovery.ts';
import {inspectPostgresqlOriginalConfiguration} from '../lib/postgresql-original-config-validation.ts';
import {inspectPostgresqlConfigCandidate} from '../lib/postgresql-config-validation.ts';
const [mode,text]=process.argv.slice(2);assert(['writer','recovery'].includes(mode));assert(process.getuid&&process.getgid,'Linux identity support required');const uid=process.getuid(),gid=process.getgid();assert.notEqual(uid,0);assert(typeof text==='string');
const value:unknown=JSON.parse(text);assert(value!==null&&typeof value==='object');const input=Object.fromEntries(Object.entries(value));assert(typeof input.base==='string'&&typeof input.backupRoot==='string'&&typeof input.target==='string');const sourceService=assertPostgresqlRunningService(input.service,input.target);assert.match(input.base,/^\/mnt\/data\/build\/tastedev-linux\/tastedev-pg-restore-host-[A-Za-z0-9_-]+\/process-interruption$/);assert.equal(input.backupRoot,input.base+'/backups');
const identity={validationUid:uid,validationGid:gid},validate=(candidate:unknown)=>inspectPostgresqlConfigCandidate(candidate,identity);
if(mode==='writer'){
 const archive=await readPostgresqlGraphArchive(input.reference,input.backupRoot,input.target),service=sourceService;
 const review=await reviewPostgresqlGraphRestore(archive,{base:input.base,ownerUid:uid,archiveScope:service,inspectService:async()=>structuredClone(service),validateArchive:record=>inspectPostgresqlGraphArchive(record,{...identity,validate})});
 await applyReviewedPostgresqlGraphRestore(review,input.backupRoot,{control:async()=>{process.stdout.write('READY\n');await new Promise(()=>setInterval(()=>{},1000));}});
}else{
 const journal=await readPostgresqlGraphRestoreJournal(input.target,input.backupRoot,{base:input.base,ownerUid:uid}),context=postgresqlGraphRestoreJournalServiceContext(journal);
 const service={...sourceService,values:context.candidateValues,pid:sourceService.pid+1};
 const result=await recoverReviewedPostgresqlGraph(journal,input.backupRoot,{retainCompleted:false,
  validateOriginal:(journal,root)=>inspectPostgresqlOriginalConfiguration(journal,root,{...identity,validate}),
  inspectService:async()=>structuredClone(service),inspectRecovery:async()=>({unit:context.scope.unit,activeState:'active',controlPid:0,service:structuredClone(service)}),
  control:async(unit,action)=>{assert.equal(unit,context.scope.unit);assert.equal(action,'restart');service.values=context.originalValues;service.pid++;}
 });console.log(JSON.stringify(result));
}
