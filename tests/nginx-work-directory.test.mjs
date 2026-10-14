import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,chmod,symlink} from 'node:fs/promises';
import path from 'node:path';
import {nginxWorkDirectory} from '../lib/nginx-work-directory.ts';
import {isolateNginxOutput} from '../lib/nginx-isolate-output.ts';

test('nginx private work uses the designated default and rejects temporary fallbacks',async()=>{
 const previous=process.env.TMPDIR;let created;
 try{
  delete process.env.TMPDIR;
  created=await nginxWorkDirectory('tastedev-nginx-candidate-');
  assert.equal(path.dirname(created),'/mnt/data/build/tastedev-linux');
  assert.match(isolateNginxOutput('pid /run/nginx.pid; events {} http {}',created),/\/mnt\/data\/build\//);
  for(const parent of ['/tmp','/var/tmp','/mnt/data/build/x/../escape','/mnt/data/build/x;touch bad']){
   process.env.TMPDIR=parent;await assert.rejects(nginxWorkDirectory('tastedev-nginx-check-'),/작업 경로/);
  }
  await assert.rejects(nginxWorkDirectory('../arbitrary'),/작업 종류/);
  assert.throws(()=>isolateNginxOutput('events {}','/mnt/data/build/x/../tastedev-nginx-candidate-forged'));
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;if(created)await rm(created,{recursive:true,force:true});}
});
test('nginx private work rejects shared or symlinked parents and cleans a valid custom candidate',async()=>{
 const previous=process.env.TMPDIR,root=await mkdtemp('/mnt/data/build/tastedev-linux/nginx-work-parent-');let created;
 try{
  await chmod(root,0o755);process.env.TMPDIR=root;
  await assert.rejects(nginxWorkDirectory('tastedev-nginx-candidate-'),/권한/);
  await chmod(root,0o700);process.env.TMPDIR=path.join(root,'alias');await symlink(root,process.env.TMPDIR);
  await assert.rejects(nginxWorkDirectory('tastedev-nginx-candidate-'),/권한/);
  process.env.TMPDIR=root;created=await nginxWorkDirectory('tastedev-nginx-check-');assert.equal(path.dirname(created),root);
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;await rm(root,{recursive:true,force:true});}
});
