import type {RedisCandidate} from './redis-candidate.ts';
import type {RedisTopology} from './redis-topology.ts';
type Hook=()=>unknown|Promise<unknown>;
export type RedisApplyOptions={backupRoot?:string;base?:string;restoreText?:string;expectedCandidateGraphVersion?:string;validatePrepared?:(candidate:RedisCandidate)=>unknown|Promise<unknown>;inspectService?:Hook;activate?:Hook;recover?:Hook};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {acquireConfigOperationLease} from './config-operation-lease.ts';
import path from 'node:path';
import {redisTopology,assertRedisGraphVersion} from './redis-topology.ts';
import {redisCandidate,assertRedisCandidate} from './redis-candidate.ts';
import {patchConfig} from './config-patch.ts';
import {configTransaction} from './config-transaction.ts';
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
// Internal orchestration only. All hooks are trusted helper dependencies, never
// supplied by HTTP. No default validation/restart: missing native checks block.
export async function applyRedisConfig(value:unknown,{backupRoot,base='/etc/redis',restoreText,expectedCandidateGraphVersion,validatePrepared,inspectService,activate,recover}:RedisApplyOptions){
 if(!object(value)||value.confirm!==true)fail('Redis 설정 적용 시 서비스가 재시작됩니다. 변경 내용을 확인하세요.');
 if(typeof validatePrepared!=='function'||typeof inspectService!=='function'||typeof activate!=='function'||typeof recover!=='function')fail('Redis 후보 설정 검수와 실행 서비스 조회 기능이 필요합니다.');
 const input={version:value.version,changes:value.changes};
 const original=await assertRedisGraphVersion(input.version,base),selected=original.files.find(file=>file.path===original.root);
 const release=await acquireConfigOperationLease(path.join(base,'.tastedev-redis-graph-lock'));
 let bundle:RedisCandidate|undefined,applied:RedisTopology|undefined,logicalCandidate:string|undefined;
 const originalGraph=async()=>{await assertRedisGraphVersion(input.version,base);}
 const appliedGraph=async()=>{const graph=await redisTopology(undefined,base);if(!applied||!graph.complete||graph.version!==applied.version)fail('적용한 Redis 설정 파일 연결이 변경되었습니다. 최신 설정을 다시 조회하세요.',409);}
 try{
  await originalGraph();await inspectService();
  if(typeof backupRoot!=='string'||!selected)fail('Invalid configuration transaction');
  return await configTransaction({file:path.join(base,'redis.conf'),backupRoot,version:selected.version,
   transform:async text=>{
    const candidate=restoreText===undefined?patchConfig('redis',text,input.changes):restoreText;
    if(typeof candidate!=='string'||candidate.includes('\0')||Buffer.byteLength(candidate)>262144)fail('Redis 후보 설정의 내용과 크기를 확인하세요.');
    logicalCandidate=candidate;applied=await redisTopology(undefined,base,new Map([[original.root,candidate]]));if(expectedCandidateGraphVersion!==undefined&&applied.version!==expectedCandidateGraphVersion)fail('Redis 후보 설정 파일 연결이 변경되었습니다. 다시 검토하세요.',409);if(!applied.complete)fail('Redis 후보 설정의 include 파일 연결을 확인한 후 적용하세요.');
    return candidate;
   },
   validate:async()=>{
    bundle=await redisCandidate({version:original.version,changes:input.changes,...(restoreText===undefined?{}:{restoreText})},base);
    await assertRedisCandidate(bundle);await validatePrepared(bundle);await assertRedisCandidate(bundle);await originalGraph();
   },
   beforeCommit:async()=>{
    await assertRedisCandidate(bundle);await originalGraph();await inspectService();await assertRedisCandidate(bundle);
    // Recheck newly referenced restoration files before replacing main.
    if(typeof logicalCandidate!=='string'||!applied)fail('Redis 후보 설정 파일 연결이 변경되었습니다. 다시 검토하세요.',409);
    const next=await redisTopology(undefined,base,new Map([[original.root,logicalCandidate]]));
    if(!next.complete||next.version!==applied.version)fail('Redis 후보 설정 파일 연결이 변경되었습니다. 다시 검토하세요.',409);
   },
   activate:async()=>{await appliedGraph();await inspectService();await activate();await appliedGraph();await inspectService();},
   recover:async()=>{await originalGraph();await recover();await inspectService();}
  });
 }finally{try{await bundle?.cleanup();}finally{await release();}}
}
