import test from 'node:test';
import {helperErrorFromStderr} from '../lib/helper-error.ts';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,lstat,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {configTransaction} from '../lib/config-transaction.ts';
import {patchConfig} from '../lib/config-patch.ts';
const digest=text=>createHash('sha256').update(text).digest('hex');
async function fixture(run){const root=await mkdtemp('/mnt/data/build/tastedev-linux/linux-config-transaction-');try{const file=join(root,'redis.conf'),backupRoot=join(root,'backups');await mkdir(backupRoot,{mode:0o700});const original='requirepass private\nport 6379\n';await writeFile(file,original,{mode:0o640});await run({file,backupRoot,original,version:digest(original),transform:text=>patchConfig('redis',text,{port:6380}),validate:async()=>{},activate:async()=>{},recover:async()=>{}});}finally{await rm(root,{recursive:true,force:true});}}
test('configuration transaction validates before activation and preserves permissions with a private backup',async()=>fixture(async input=>{
 const events=[];const result=await configTransaction({...input,validate:async staged=>{events.push('validate');assert.match(await readFile(staged,'utf8'),/port 6380/);assert.equal(await readFile(input.file,'utf8'),input.original);},activate:async()=>{events.push('activate');assert.match(await readFile(input.file,'utf8'),/port 6380/);}});
 assert.deepEqual(events,['validate','activate']);assert.equal(result.changed,true);assert.equal(result.journalCleanupVerified,true);assert.deepEqual(await readdir(join(input.backupRoot,'transactions')),[]);assert.equal((await lstat(join(input.backupRoot,'transactions'))).mode&0o777,0o700);assert.equal((await lstat(input.file)).mode&0o777,0o640);
 const backup=join(input.backupRoot,result.backupId+'.json');assert.equal((await lstat(backup)).mode&0o777,0o600);assert.equal(JSON.parse(await readFile(backup,'utf8')).text,input.original);assert(!JSON.stringify(result).includes('private'));
}));
test('validation and stale-version failures never change the operational file',async()=>fixture(async input=>{
 await assert.rejects(configTransaction({...input,validate:async()=>{throw Error('private diagnostic');}}),/validation failed/);
 assert.equal(await readFile(input.file,'utf8'),input.original);assert.deepEqual(await readdir(input.backupRoot),[]);
 await assert.rejects(configTransaction({...input,version:'a'.repeat(64)}),e=>e.status===409);assert.equal(await readFile(input.file,'utf8'),input.original);
}));
test('activation failure restores original contents then attempts service recovery',async()=>fixture(async input=>{
 let recovered=false;const result=await configTransaction({...input,activate:async()=>{throw Error('failure');},recover:async()=>{assert.equal(await readFile(input.file,'utf8'),input.original);recovered=true;}});
 assert.equal(result.restored,true);assert.equal(result.recovered,true);assert(recovered);
 const failed=await configTransaction({...input,activate:async()=>{throw Error();},recover:async()=>{throw Error();}});assert.equal(failed.restored,true);assert.equal(failed.recovered,false);
}));
test('rollback preserves an external edit and reports manual recovery instead of overwriting it',async()=>fixture(async input=>{
 let recovered=false;const result=await configTransaction({...input,activate:async()=>{await writeFile(input.file,'port 6390\n');throw Error();},recover:async()=>{recovered=true;}});
 assert.equal(result.restored,false);assert.equal(await readFile(input.file,'utf8'),'port 6390\n');assert.equal(recovered,false);
}));

test('overlapping transactions are refused while the first transaction retains its lock',async()=>fixture(async input=>{
 let enter,release;const entered=new Promise(resolve=>{enter=resolve;}),held=new Promise(resolve=>{release=resolve;});
 const first=configTransaction({...input,validate:async()=>{enter();await held;}});
 await entered;
 try{await assert.rejects(configTransaction(input),error=>error.status===409);}finally{release();}
 assert.equal((await first).changed,true);
 assert.equal((await readdir(join(input.file,'..'))).some(name=>name.endsWith('.tastedev-lock')),false);
}));

test('실제 후보 검수 실패와 오래된 원본 오류는 한국어로 전달되며 운영 파일을 보존한다',async()=>fixture(async input=>{
 for(const [options,status,expected] of [
  [{validate:async()=>{throw Error('fixture-only-native-diagnostic');}},400,'설정 검수에 실패했습니다.'],
  [{version:'a'.repeat(64)},409,'설정이 변경되었습니다. 다시 조회하세요.'],
 ]){
  const failure=await configTransaction({...input,...options}).then(()=>assert.fail('검수 실패가 필요합니다.'),error=>error);
  const action='redis-code-plan';const error=helperErrorFromStderr(action,JSON.stringify({protocol:'tastedev-helper-error-v1',action,status:failure.status,message:failure.message}));
  assert.equal(error.status,status);assert.equal(error.message,expected);assert(!error.message.includes('fixture-only-native-diagnostic'));
  assert.equal(await readFile(input.file,'utf8'),input.original);assert.deepEqual(await readdir(input.backupRoot),[]);
 }
}));
