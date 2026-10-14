import type {MariaDBCandidate} from './mariadb-candidate.ts';
import type {MariaDBTopology} from './mariadb-topology.ts';
export type MariaDBApplyOptions={run?:(binary:string,args:string[])=>unknown|Promise<unknown>;backupRoot?:string;base?:string;restoreText?:string;inspectService?:()=>unknown|Promise<unknown>;candidateInspector?:(candidate:MariaDBCandidate)=>unknown|Promise<unknown>;expectedCandidateGraphVersion?:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {mariadbServiceScope} from './mariadb-service-scope.ts';
import {acquireConfigOperationLease} from './config-operation-lease.ts';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mariadbTopology} from './mariadb-topology.ts';
import {mariadbCandidate} from './mariadb-candidate.ts';
import {mariadbConfigHooks} from './mariadb-config-hooks.ts';
import {patchConfig} from './config-patch.ts';
import {configTransaction} from './config-transaction.ts';
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
// Internal executor. The privilege helper must gate callers; base/run/backupRoot are not HTTP input.
export async function applyMariaDBConfig(value:unknown,{run,backupRoot,base='/etc/mysql',restoreText,inspectService,candidateInspector,expectedCandidateGraphVersion}:MariaDBApplyOptions){
 if(!object(value)||typeof value.root!=='string'||typeof value.target!=='string'||value.confirm!==true)fail('MariaDB restart confirmation required');
 const input={root:value.root,target:value.target,version:value.version,changes:value.changes};
 if(typeof run!=='function')fail('MariaDB 설정 대상 파일과 변경할 항목을 확인하세요.');
 const restoring=restoreText!==undefined;const hooks=mariadbConfigHooks(input.target,input.changes,run,restoring?createHash('sha256').update(restoreText).digest('hex'):null,{candidateInspector});
 const graph=await mariadbTopology(input.root,base);
 if(!graph.complete||graph.version!==input.version)fail('Inspect the current complete MariaDB include graph',409);
 const selected=graph.files.find(file=>file.path===input.target);if(!selected)fail('MariaDB target is not included by the selected main');
 const release=await acquireConfigOperationLease(path.join(base,'.tastedev-mariadb-graph-lock'));
 let bundle:MariaDBCandidate|undefined,updated:{version:string;bytes:number}|undefined,restoredGraph:MariaDBTopology|undefined,serviceScope:ReturnType<typeof mariadbServiceScope>|null=null;
 const checkScope=async()=>{if(inspectService){const snapshot=await inspectService();if(!object(snapshot))fail('MariaDB 실행 서비스의 기본 설정 경로를 확인한 후 적용하세요.',409);serviceScope=mariadbServiceScope(input.root,snapshot.argv,snapshot.canonical);}}

 const assertGraph=async(after=false,verifyRestore=true)=>{
  const current=await mariadbTopology(input.root,base);
  if(restoring&&after){if(!restoredGraph||!current.complete||current.version!==restoredGraph.version)fail('MariaDB restored graph changed',409);return;}
  if(after&&!updated)fail('MariaDB include graph changed during the operation',409);const currentUpdate=updated;
  const expected=graph.files.map(file=>file.path===input.target&&after&&currentUpdate?{...file,version:currentUpdate.version,bytes:currentUpdate.bytes}:file);
  if(!current.complete||JSON.stringify(current.files)!==JSON.stringify(expected)||JSON.stringify(current.edges)!==JSON.stringify(graph.edges))fail('MariaDB include graph changed during the operation',409);
  if(restoring&&restoredGraph&&!after&&verifyRestore){const candidate=await mariadbTopology(input.root,base,new Map([[input.target,restoreText]]));if(!candidate.complete||candidate.version!==restoredGraph.version)fail('MariaDB restored include graph changed',409);}

 }
 try{
  await assertGraph();await checkScope();await hooks.preflight();
  if(typeof backupRoot!=='string')fail('Invalid configuration transaction');
  const result=await configTransaction({file:path.join(base,input.target.slice(11)),backupRoot,version:selected.version,
   transform:async text=>{const patched=restoring?restoreText:patchConfig('mariadb',text,input.changes);if(restoring){restoredGraph=await mariadbTopology(input.root,base,new Map([[input.target,restoreText]]));if(!restoredGraph.complete)fail('Resolve restored MariaDB include connections');if(expectedCandidateGraphVersion&&restoredGraph.version!==expectedCandidateGraphVersion)fail('MariaDB reviewed candidate graph changed',409);}updated={version:createHash('sha256').update(patched).digest('hex'),bytes:Buffer.byteLength(patched)};return patched;},
   validate:async()=>{bundle=await mariadbCandidate({root:input.root,target:input.target,version:input.version,changes:input.changes,...(restoring?{restoreText}: {})},base);await hooks.validatePrepared(bundle);await assertGraph();},
   beforeCommit:async()=>{await assertGraph();await checkScope();},
   activate:async()=>{await assertGraph(true);await checkScope();await hooks.activate();await checkScope();},
   recover:async()=>{await assertGraph(false,false);await hooks.recover();await checkScope();}
  });
  return {...result,validationMode:hooks.validationMode,...(serviceScope?{serviceScope}: {})};
 }finally{try{await bundle?.cleanup();}finally{await release();}}
}
