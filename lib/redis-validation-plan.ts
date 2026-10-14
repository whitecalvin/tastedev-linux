import type {RedisCandidate} from './redis-candidate.ts';
import {redisCandidateResources} from './redis-candidate-resources.ts';
import {assertRedisCandidate} from './redis-candidate.ts';
import {isRedisWorkPath} from './redis-work-directory.ts';
const fail=()=>{throw Object.assign(Error('Redis 전용 검수 환경의 경로를 확인하세요.'),{status:400});};
// Internal command planning only: no process start and no proof of resource
// isolation. A native runner must independently inspect all included directives,
// runtime ownership, external resources and process cleanup before execution.
export async function redisValidationPlan(candidate:RedisCandidate,runtime:string){
 await assertRedisCandidate(candidate);
 if(!isRedisWorkPath(runtime,'tastedev-redis-validation-')||runtime===candidate.directory||Buffer.byteLength(runtime+'/redis.sock')>=108)fail();
 const resourceReview=await redisCandidateResources(candidate);
 return {resourceReview,binary:'/usr/bin/redis-server',args:[candidate.main,'--port','0','--tls-port','0','--unixsocket',runtime+'/redis.sock','--unixsocketperm','700','--daemonize','no','--supervised','no','--dir',runtime,'--dbfilename','validation.rdb','--save','','--appendonly','no','--logfile',runtime+'/redis.log','--pidfile',runtime+'/redis.pid','--syslog-enabled','no'],scope:'isolated-startup-plan',operatingServiceChanged:false,executed:false,resourceIsolationVerified:false,persistencePolicyValidated:false};
}
