import type {RedisCandidate} from './redis-candidate.ts';
import {hasErrorCode} from './error-code.ts';
type ValidationOptions={base?:string;validate?:(candidate:RedisCandidate)=>unknown|Promise<unknown>};
type CodeApplyOptions={base?:string;backupRoot?:string;run?:(binary:string,args:string[])=>unknown|Promise<unknown>;inspectService?:()=>unknown|Promise<unknown>;validateCandidate?:(candidate:RedisCandidate)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {isRedisSandboxUnavailable,redisSandboxUnavailable} from './redis-validation-error.ts';
import {createHash} from 'node:crypto';
import {prepareRedisCode,redisCodeReviewVersion} from './redis-code-request.ts';
import {assertRedisGraphVersion,redisTopology} from './redis-topology.ts';
import {redisCandidate,assertRedisCandidate} from './redis-candidate.ts';
import {validateRedisSandboxCandidate} from './redis-sandbox-validation.ts';
import {redisConfigHooks} from './redis-config-hooks.ts';
import {applyRedisConfig} from './redis-apply.ts';
import {redisResourceReview} from './redis-resource-review.ts';
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
async function current(input:ReturnType<typeof prepareRedisCode>,base:string){const graph=input.graphVersion?await assertRedisGraphVersion(input.graphVersion,base):await redisTopology(undefined,base);if(!graph.complete||graph.files.find(file=>file.path===input.path)?.version!==input.version)fail('Redis 코드 기준 파일 또는 include 연결이 변경되었습니다.',409);return graph;}
// Trusted dependencies only; the HTTP boundary cannot set runners or filesystem roots.
export async function redisCodeOperationPlan(input:unknown,{base='/etc/redis',validate=validateRedisSandboxCandidate}:ValidationOptions={}){
 const prepared=prepareRedisCode(input),graph=await current(prepared,base);let candidate:RedisCandidate|undefined,preserve=false;
 try{
  candidate=await redisCandidate({version:graph.version,changes:{},restoreText:prepared.text},base);await assertRedisCandidate(candidate);
  const result=await validate(candidate);await assertRedisCandidate(candidate);
  if(!object(result)||result.valid!==true||result.scope!=='isolated-startup'||result.operatingServiceChanged!==false)fail('Redis 코드 격리 검수가 실패했습니다.');
  await assertRedisGraphVersion(graph.version,base);
  const next=await redisTopology(undefined,base,new Map([[prepared.path,prepared.text]]));if(!next.complete||next.version!==candidate.candidateVersion)fail('Redis 코드 기준 파일 또는 include 연결이 변경되었습니다.',409);
  const code={...prepared,graphVersion:graph.version,candidateGraphVersion:next.version};
  return {path:prepared.path,version:prepared.version,graphVersion:graph.version,candidateGraphVersion:next.version,draftVersion:digest(prepared.text),reviewVersion:redisCodeReviewVersion(code),changed:prepared.version!==digest(prepared.text),resourceReview:{...redisResourceReview(prepared.text),scope:'selected-file-only',path:prepared.path},validation:{valid:true,scope:'isolated-startup',operatingConfigurationChanged:false,operatingServiceChanged:false,operationalResourcesVerified:false,persistencePolicyValidated:false},operatingConfigurationChanged:false,operatingServiceChanged:false};
 }catch(error){const status=object(error)&&typeof error.status==='number'?error.status:undefined;preserve=status===500;if(isRedisSandboxUnavailable(error))throw redisSandboxUnavailable();if(!preserve&&hasErrorCode(error,'VALIDATION_EXECUTABLE_UNTRUSTED'))throw Object.assign(Error('Redis 검수 실행 파일의 경로·소유권·권한을 확인하세요.'),{status:409,code:'VALIDATION_EXECUTABLE_UNTRUSTED'});throw Object.assign(Error(status===409?'Redis 코드 기준 파일 또는 include 연결이 변경되었습니다.':preserve?'Redis 검수 환경 정리에 실패했습니다. 남은 검수 프로세스와 임시 파일을 확인하세요.':hasErrorCode(error,'REDIS_EXECUTABLE_UNAVAILABLE')?'Redis 실행 파일이 없습니다. 패키지 설치 상태를 확인하세요.':'Redis 코드 격리 검수가 실패했습니다.'),{status:preserve?500:status===409?409:400});}
 finally{if(!preserve)await candidate?.cleanup();}
}
export async function applyRedisCodeOperation(input:unknown,{base='/etc/redis',backupRoot,run,inspectService,validateCandidate}:CodeApplyOptions={}){
 const prepared=prepareRedisCode(input,true);await current(prepared,base);const candidateGraph=await redisTopology(undefined,base,new Map([[prepared.path,prepared.text]]));if(!candidateGraph.complete||candidateGraph.version!==prepared.candidateGraphVersion)fail('Redis 코드 기준 파일 또는 include 연결이 변경되었습니다.',409);
 if(typeof run!=='function')fail('Redis 설정 검수와 서비스 실행 기능이 필요합니다.',409);
 const hooks=redisConfigHooks({},run,{...(inspectService?{inspectService}:{}),...(validateCandidate?{validateCandidate}:{}),restoreVersion:digest(prepared.text)});
 return applyRedisConfig({version:prepared.graphVersion,changes:{},confirm:true},{base,backupRoot,restoreText:prepared.text,expectedCandidateGraphVersion:prepared.candidateGraphVersion,...hooks});
}
