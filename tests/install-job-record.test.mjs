import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,symlink,chmod,readFile,readdir,link} from 'node:fs/promises';
import path from 'node:path';import {tmpdir} from 'node:os';import {randomUUID} from 'node:crypto';
import {installJobRecord,readInstallJob,saveInstallJob} from '../lib/install-job-record.ts';
const job=()=>({id:randomUUID(),status:'running',command:['/usr/bin/apt-get','install','--yes','--no-remove','--no-upgrade','nginx'],startedAt:'2026-01-01T00:00:00Z',exitCode:null,logs:['설치 로그']});
test('installation state publishes complete private snapshots and reads final Unicode logs',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','install-record-')),file=path.join(root,'jobs/job.json');try{
  assert.equal(await readInstallJob(file),null);const value=job();await saveInstallJob(file,value);assert.deepEqual(await readInstallJob(file),value);
  const finished={...value,status:'success',finishedAt:'2026-01-01T00:00:01Z',exitCode:0};await saveInstallJob(file,finished);assert.deepEqual(await readInstallJob(file),finished);assert.deepEqual(await readdir(path.dirname(file)),['job.json']);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),finished);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('installation reader rejects symlinks hard links broad permissions and corrupt records',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','install-record-')),file=path.join(root,'job.json');try{
  await saveInstallJob(file,job());await symlink(file,path.join(root,'alias'));await assert.rejects(readInstallJob(path.join(root,'alias')),error=>error.status===403);
  await link(file,path.join(root,'hard'));await assert.rejects(readInstallJob(file),error=>error.status===403);await rm(path.join(root,'hard'));
  await chmod(file,0o644);await assert.rejects(readInstallJob(file),error=>error.status===403);await chmod(file,0o600);
  await writeFile(file,'{bad');await assert.rejects(readInstallJob(file),error=>error.status===409);
  await writeFile(file,JSON.stringify({...job(),command:['/bin/sh','-c','anything']}));await assert.rejects(readInstallJob(file),error=>error.status===409);
  await chmod(root,0o777);await assert.rejects(saveInstallJob(file,job()),error=>error.status===403);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('installation schema rejects inconsistent terminal states and does not expose extra fields',()=>{
 const value=job();assert.deepEqual(installJobRecord({...value,secret:'ignored'}),value);
 for(const extra of [{status:'success',exitCode:null},{finishedAt:'2026-01-01T00:00:01Z'},{exitCode:1},{logs:['x'.repeat(2001)]},{signal:'invalid'},{id:'../job'}])assert.throws(()=>installJobRecord({...value,...extra}),error=>error.status===409);
});

test('maximum valid Hangul and escaped log rows remain readable after private persistence',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','install-record-large-')),file=path.join(root,'job.json');
 try{for(const line of ['가'.repeat(2000),'\u0001'.repeat(2000)]){const value={...job(),logs:Array(1000).fill(line)};assert(Buffer.byteLength(JSON.stringify(value))>4*1024*1024);await saveInstallJob(file,value);assert.deepEqual(await readInstallJob(file),value);}}finally{await rm(root,{recursive:true,force:true});}
});
test('inherited required installation fields cannot publish an incomplete record',()=>{
 const value=job();assert.throws(()=>installJobRecord(Object.create(value)),error=>error.status===409);
 for(const key of ['id','command','status','logs','startedAt','exitCode']){const inherited=Object.assign(Object.create({[key]:value[key]}),value);delete inherited[key];assert.throws(()=>installJobRecord(inherited),error=>error.status===409);}
});

test('oversized installation metadata is rejected before replacing the existing state',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','install-record-overflow-')),file=path.join(root,'job.json');
 try{const value=job();await saveInstallJob(file,value);const before=await readFile(file,'utf8'),oversized={...value,startedAt:value.startedAt.slice(0,10)+' '.repeat(16*1024*1024)};assert(Number.isFinite(Date.parse(oversized.startedAt)));await assert.rejects(saveInstallJob(file,oversized),error=>error.status===409);assert.equal(await readFile(file,'utf8'),before);assert.deepEqual(await readInstallJob(file),value);}finally{await rm(root,{recursive:true,force:true});}
});
