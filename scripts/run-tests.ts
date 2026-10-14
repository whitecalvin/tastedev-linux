import {buildWorkspace} from './build-workspace.ts';
import {mkdtemp,readdir,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
const available=(await readdir('tests')).filter(name=>/\.test\.(mjs|ts)$/.test(name)).sort().map(name=>'tests/'+name);
const selected=process.argv.slice(2);
if(selected.some(file=>!available.includes(file)))throw Error('tests 폴더의 검사 파일을 선택하세요.');
const concurrency=process.env.LINUX_TEST_CONCURRENCY??'1';
if(!/^[1-4]$/.test(concurrency))throw Error('검사 동시 실행 수는 1~4 범위여야 합니다.');
const files=selected.length?selected:available;
if(!files.length)throw Error('실행할 검사 파일이 없습니다.');
const root=await mkdtemp(join(buildWorkspace,'tastedev-linux-tests-'));
await writeFile(join(root,'files.json'),JSON.stringify(files,null,2)+'\n',{mode:0o600});
const log=createWriteStream(join(root,'test.log'),{flags:'wx',mode:0o600});
const logCompletion=finished(log);logCompletion.catch(()=>{});
let code=1;
try{
 const child=spawn(process.execPath,['--test','--test-concurrency='+concurrency,...files],{stdio:['inherit','pipe','pipe'],env:{...process.env,LINUX_STATE_ROOT:root,LINUX_AUTH_ROOT:join(root,'auth'),LINUX_WORKSPACE_ROOT:join(root,'workspace')}});
 child.stdout.on('data',(bytes:Buffer)=>{process.stdout.write(bytes);log.write(bytes);});
 child.stderr.on('data',(bytes:Buffer)=>{process.stderr.write(bytes);log.write(bytes);});
 log.on('error',()=>child.kill('SIGTERM'));
 code=await new Promise<number>((resolve,reject)=>{child.once('error',reject);child.once('close',value=>resolve(value??1));});
}finally{
 log.end();await logCompletion;
 await writeFile(join(root,'result.json'),JSON.stringify({status:code===0?'PASS':'FAIL',exitCode:code,files,concurrency:Number(concurrency),log:join(root,'test.log')},null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({testEvidence:root,status:code===0?'PASS':'FAIL'}));
 process.exitCode=code;
}
