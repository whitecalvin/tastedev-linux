import type {RedisCandidate} from '../../lib/redis-candidate.ts';

import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {redisTopology} from '../../lib/redis-topology.ts';
import {redisCodeOperationPlan} from '../../lib/redis-code-operation.ts';
import {validateRedisSandboxCandidate} from '../../lib/redis-sandbox-validation.ts';
import {redisSandboxReviewer} from '../../lib/redis-sandbox-review.ts';
import {redisValidationBinary} from '../../lib/redis-validation-binary.ts';
function nativeDiagnostic(error:unknown){if(error!==null&&typeof error==='object'&&'stderr' in error&&(typeof error.stderr==='string'||Buffer.isBuffer(error.stderr)))return error.stderr.toString();return error instanceof Error?error.message:String(error);}
const validate=async (candidate:RedisCandidate)=>{try{redisValidationBinary();return await validateRedisSandboxCandidate(candidate,{verifySandbox:redisSandboxReviewer({execute:(binary,args,options)=>{try{return execFileSync(binary,args,{...options,stdio:'pipe'});}catch(error){console.error('Namespace probe: '+nativeDiagnostic(error));throw error;}}}),launch:(binary,args,options)=>{const child=spawn(binary,args,{...options,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>process.stderr.write(data));return child;}});}catch(error){console.error('Native validation diagnostic: '+nativeDiagnostic(error));throw error;}};
const fixtureHelperMode=false;
function jsonRecord(value:unknown):Record<string,unknown>{assert(value!==null&&typeof value==='object'&&!Array.isArray(value));return Object.fromEntries(Object.entries(value));}
function helperError(text:string){try{const value=jsonRecord(JSON.parse(text));if(value.protocol==='tastedev-helper-error-v1'&&value.action==='redis-code-plan'&&typeof value.message==='string'&&Buffer.byteLength(value.message)<=2000&&typeof value.status==='number'&&[400,403,404,409,422,500,503].includes(value.status)&&Object.keys(value).sort().join(',')==='action,message,protocol,status')return Object.assign(Error(value.message),{status:value.status});}catch{}return null;}
async function invokeHelper(request:unknown):Promise<unknown>{try{return JSON.parse(execFileSync('/usr/bin/node',['/usr/lib/tastedev-linux/scripts/admin/linux-admin','redis-code-plan'],{input:JSON.stringify(request),timeout:45000,maxBuffer:65536,encoding:'utf8',stdio:'pipe',env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}}));}catch(error){const stderr=error!==null&&typeof error==='object'&&'stderr' in error?String(error.stderr):'';throw helperError(stderr)||error;}}
function reviewResult(value:unknown){const plan=jsonRecord(value),validation=jsonRecord(plan.validation);assert(typeof validation.valid==='boolean'&&typeof validation.scope==='string'&&typeof plan.operatingServiceChanged==='boolean');return {validation:{valid:validation.valid,scope:validation.scope},operatingServiceChanged:plan.operatingServiceChanged};}
const review=async(text:string)=>reviewResult(fixtureHelperMode?await invokeHelper(input(text)):await redisCodeOperationPlan(input(text),{validate}));
process.umask(0o077);assert.equal(process.getuid?.(),0);
const mountRows=fs.readFileSync('/proc/self/mountinfo','utf8').split('\n');const rootMount=mountRows.find(row=>row.split(' - ')[0].split(' ')[4]==='/');assert(rootMount&&rootMount.split(' - ')[1].startsWith('tmpfs '),'전용 임시 root namespace가 필요합니다.');
if(fixtureHelperMode){const stateMount=mountRows.find(row=>row.split(' - ')[0].split(' ')[4]==='/var/lib/linux');assert(stateMount&&stateMount.split(' - ')[1].startsWith('tmpfs '));const state=fs.lstatSync('/var/lib/linux');assert(state.isDirectory()&&!state.isSymbolicLink()&&state.uid===0&&(state.mode&0o777)===0o700);assert(!fs.existsSync('/var/lib/linux/admin'));}
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const checks:string[]=[],file='/etc/redis/redis.conf',before=fs.readFileSync(file,'utf8');
assert.equal(before,'port 6379\nbind 127.0.0.1\nprotected-mode yes\nmaxmemory 64mb\nmaxmemory-policy noeviction\nsave ""\nappendonly no\n','전용 합성 Redis 설정이 필요합니다.');
let graph=await redisTopology(undefined,'/etc/redis');assert(graph.complete);
function requiredFileVersion(){const row=graph.files.find(item=>item.path===file);assert(row);return row.version;}
const input=(text:string)=>({path:file,text,version:requiredFileVersion(),graphVersion:graph.version});
const plan=await review(before.replace('maxmemory 64mb','maxmemory 96mb'));
assert.equal(plan.validation.valid,true);assert.equal(plan.validation.scope,'isolated-startup');assert.equal(plan.operatingServiceChanged,false);assert.equal(fs.readFileSync(file,'utf8'),before);checks.push('actual Redis startup and Unix socket readiness through production validation');
await assert.rejects(review(before+'definitely_invalid_fixture_directive yes\n'));assert.equal(fs.readFileSync(file,'utf8'),before);checks.push('native invalid directive rejection preserves original');
const protectedPlan=await review(before+'requirepass native-fixture-only\n');assert.equal(protectedPlan.validation.valid,true);assert.equal(fs.readFileSync(file,'utf8'),before);checks.push('authenticated candidate readiness accepts NOAUTH without leaking credential');
const stale=input(before);fs.writeFileSync(file,before+'timeout 30\n');await assert.rejects(fixtureHelperMode?invokeHelper(stale):redisCodeOperationPlan(stale),(error:unknown)=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);checks.push('changed original rejected before native launch');fs.writeFileSync(file,before);
assert(!fs.readdirSync('/mnt/data/build/tastedev-linux').some(name=>name.startsWith('tastedev-redis-validation-')));checks.push('native validation processes and private runtime cleaned');
fs.writeFileSync('/mnt/evidence/result.json',JSON.stringify({status:'PASS',checks,redisVersion:execFileSync('/usr/bin/redis-server',['--version'],{encoding:'utf8'}).trim(),redisSha256:hash(fs.readFileSync('/usr/bin/redis-server')),hostPackageOrServiceChanges:false,networkIsolated:true,actualProductionValidation:true,actualHelperExercised:fixtureHelperMode,nativeLockSupervisorExercised:fixtureHelperMode,operatingApplyVerified:false,systemdVerified:false,sourceSha256:hash(fs.readFileSync('/mnt/source/lib/redis-code-operation.ts'))},null,2)+'\n');

