import type {ValidationBinary} from './redis-validation-binary.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type InspectOptions={inspect?:(options:{binary:string})=>unknown};
import {redisValidationBinary} from './redis-validation-binary.ts';
const paths=Object.freeze(['/usr/bin/bwrap','/usr/bin/prlimit']);
const fail:()=>never=()=>{throw Object.assign(Error('Redis 격리 검수 실행 파일의 경로·소유권·권한을 확인하세요.'),{status:409});};
// Trusted filesystem inspector only. Executable integrity is separate from
// namespace availability and resource-isolation review.
export function redisSandboxExecutables({inspect=redisValidationBinary}:InspectOptions={}):readonly ValidationBinary[] {
 if(typeof inspect!=='function')fail();
 const binaries=paths.map(binary=>{
  const record=inspect({binary});
  if(!object(record)||record.path!==binary||typeof record.sha256!=='string'||!/^[a-f0-9]{64}$/.test(record.sha256)||typeof record.ino!=='number'||!Number.isSafeInteger(record.ino)||typeof record.dev!=='number'||!Number.isSafeInteger(record.dev)||typeof record.bytes!=='number'||!Number.isSafeInteger(record.bytes)||record.bytes<1)fail();
  return Object.freeze({path:record.path,sha256:record.sha256,ino:record.ino,dev:record.dev,bytes:record.bytes});
 });
 return Object.freeze(binaries);
}
export function reviewedRedisSandboxExecutables(expected:unknown,options:InspectOptions={}) {
 const current=redisSandboxExecutables(options);
 if(JSON.stringify(current)!==JSON.stringify(expected))fail();
 return current;
}
