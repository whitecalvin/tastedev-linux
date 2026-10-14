import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,lstat,unlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('security saves preserve private modes, reject stale and concurrent writes, and validate own boolean options',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-linux-tests-security-save-')),previousRoot=process.env.LINUX_STATE_ROOT;
 process.env.LINUX_STATE_ROOT=root;
 try{
  const security=await import('../lib/security.ts');
  const initial=await security.securitySettings(),settings={...initial.settings,readOnly:false,fileEditing:true,audit:false};
  const saved=await security.saveSecurity({settings,version:initial.version});
  assert.notEqual(saved.version,initial.version);assert.deepEqual(saved.settings,settings);
  const file=join(root,'security.json'),bytes=await readFile(file);
  assert.equal((await lstat(root)).mode&0o777,0o700);assert.equal((await lstat(file)).mode&0o777,0o600);
  assert.equal((await lstat(join(root,'audit.jsonl'))).mode&0o777,0o600);
  assert.deepEqual(security.parseAuditTail(await readFile(join(root,'audit.jsonl'),'utf8')).map(entry=>[entry.action,entry.result]),[['security','saved']]);
  const conflict=(error: unknown)=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409;
  await assert.rejects(security.saveSecurity({settings:{...settings,fileEditing:false},version:initial.version}),conflict);
  assert.deepEqual(await readFile(file),bytes);
  await writeFile(join(root,'security.lock'),'fixture',{flag:'wx',mode:0o600});
  await assert.rejects(security.saveSecurity({settings,version:saved.version}),conflict);assert.deepEqual(await readFile(file),bytes);await unlink(join(root,'security.lock'));
  const results=await Promise.allSettled([
   security.saveSecurity({settings:{...settings,fileEditing:false},version:saved.version}),
   security.saveSecurity({settings:{...settings,readOnly:true},version:saved.version}),
  ]);
  const success=results.filter(result=>result.status==='fulfilled'),failure=results.filter(result=>result.status==='rejected');
  assert.equal(success.length,1);assert.equal(failure.length,1);assert(conflict(failure[0].reason));
  assert.deepEqual((await security.securitySettings()).settings,success[0].value.settings);
  assert.equal((await security.auditEvents()).length,2);
  const invalid=(error: unknown)=>error!==null&&typeof error==='object'&&'status' in error&&error.status===400;
  assert.throws(()=>security.validateSecurity(Object.create(security.defaultSecurity)),invalid);
  let reads=0;const candidate={...security.defaultSecurity};Object.defineProperty(candidate,'terminal',{enumerable:true,get:()=>++reads===1?true:'invalid'});
  assert.equal(security.validateSecurity(candidate).terminal,true);assert.equal(reads,1,'normalization captures each option once');
 }finally{if(previousRoot===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=previousRoot;await rm(root,{recursive:true,force:true});}
});
