import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 emitted verification tools inventory typed source and validate owned work paths and redirects',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','verification-tools-runtime-'));
 try{
  const allowed=['scripts/verification/audit-runtime-copy.mjs','scripts/verification/page-redirect.mjs','scripts/verification/work-directory.mjs'];
  for(const file of allowed){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  await symlink(join(process.cwd(),'node_modules'),join(root,'node_modules'),'dir');
  await mkdir(join(root,'lib/locales'),{recursive:true,mode:0o700});await writeFile(join(root,'lib/locales/en.json'),JSON.stringify({'설정을 확인하세요.':'Check settings.'}));
  await writeFile(join(root,'lib/typed.ts'),"export function fail(message:string){throw Error(message);} fail('설정을 확인하세요.');");
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {rm} from 'node:fs/promises';import {auditRuntimeCopy,diagnosticCandidates} from './scripts/verification/audit-runtime-copy.mjs';import {assertPageRedirect} from './scripts/verification/page-redirect.mjs';import {verificationWorkDirectory} from './scripts/verification/work-directory.mjs';const inventory=await auditRuntimeCopy(process.argv[2]);assert.equal(inventory.filesScanned,1);assert.equal(inventory.uniqueMissingEnglish,0);assert.deepEqual(inventory.files[0].literals,['설정을 확인하세요.']);assert.deepEqual(diagnosticCandidates(null),{literals:[],dynamic:[]});const directory=await verificationWorkDirectory('node22-verification-tools-');assert(directory.startsWith('/mnt/data/build/tastedev-linux/'));assert.equal(process.env.TMPDIR,'/mnt/data/build/tastedev-linux');await rm(directory,{recursive:true});await assert.rejects(verificationWorkDirectory('../bad-'));await assertPageRedirect(new Response(null,{status:307,headers:{location:'/login'}}),'/login');await assertPageRedirect(new Response('<meta http-equiv="refresh" content="0;url=/login?next=x&amp;tab=y">'),'/login?next=x&tab=y');await assert.rejects(assertPageRedirect(new Response('<main>private page</main>'),'/login'));console.log('PASS');`,{mode:0o600});
  const environment:NodeJS.ProcessEnv={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker,root],{env:environment,cwd:root,encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
