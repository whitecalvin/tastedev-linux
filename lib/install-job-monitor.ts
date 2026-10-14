import type {FileHandle} from 'node:fs/promises';
import {constants} from 'node:fs';
import {open,readFile} from 'node:fs/promises';

const message='설치 결과 확인이 필요합니다. 앱이 재시작되었거나 작업 기록 연결이 끊겼습니다. 패키지 관리 명령은 아직 실행 중일 수 있으므로 기존 로그와 dpkg 상태를 확인하세요. 설치 잠금은 자동으로 삭제하지 않습니다.';

export async function installProcessIdentity(pid: unknown) {
 if(typeof pid!=='number'||!Number.isSafeInteger(pid)||pid<=0)throw Error('Invalid installation owner');
 const [boot,stat]=await Promise.all([readFile('/proc/sys/kernel/random/boot_id','utf8'),readFile('/proc/'+pid+'/stat','utf8')]);
 const bootId=boot.trim(),fields=stat.slice(stat.lastIndexOf(')')+2).trim().split(/\s+/);
 if(!/^[a-f0-9-]{36}$/.test(bootId)||!/^\d+$/.test(fields[19]||'')||['Z','X'].includes(fields[0]))throw Error('Unobserved installation owner');
 return bootId+':'+fields[19];
}

// Observe only. A dead web process does not prove that its apt helper stopped.
export async function observeInstallJob<T extends {id: string; status: string}>(job: T | null | undefined, lockFile: string, {probe=(pid: number)=>process.kill(pid,0),identity=installProcessIdentity}: {probe?: (pid: number)=>unknown; identity?: (pid: number)=>Promise<string>}={}) {
 if(!job||job.status!=='running')return job;
 let handle: FileHandle | undefined;
 try {
  handle=await open(lockFile,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  const stat=await handle.stat();
  if(!stat.isFile()||stat.nlink!==1||stat.uid!==process.getuid?.()||(stat.mode&0o077)||stat.size>1024)throw Error('Unsafe installation lock');
  const bytes=Buffer.alloc(1025),{bytesRead}=await handle.read(bytes,0,bytes.length,0);
  const parsed: unknown=JSON.parse(bytes.subarray(0,bytesRead).toString('utf8'));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Unknown installation owner');const owner=parsed as Record<string,unknown>;
  if(typeof owner.pid!=='number'||!Number.isSafeInteger(owner.pid)||owner.pid<=0||owner.jobId!==job.id)throw Error('Unknown installation owner');
  try{probe(owner.pid);}catch(error){if(error===null||typeof error!=='object'||!('code' in error)||error.code!=='EPERM')throw error;}
  if(typeof owner.identity!=='string'||owner.identity!==await identity(owner.pid))throw Error('Installation owner identity changed');
  return job;
 }catch{return {...job,monitoringUnavailable:true,monitoringMessage:message};}
 finally{await handle?.close();}
}
