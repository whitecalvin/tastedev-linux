import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verifyPackagedCatalog,packageAccountSetup} from '../scripts/verification/package-assets.ts';

test('packaged catalog checks require matching filesystem and served UTF8 contents',async()=>{
 const root=await verificationWorkDirectory('package-assets-runtime-');
 try{
  const chunks=join(root,'.next/static/chunks');await mkdir(chunks,{recursive:true});
  const text='const labels=["관리자 로그인","한글 😀"];';await writeFile(join(chunks,'fixture.js'),text);
  let route='';await verifyPackagedCatalog(root,['관리자 로그인','한글 😀'],async value=>{route=value;return new Response(text);});
  assert.equal(route,'/_next/static/chunks/fixture.js');
  await assert.rejects(verifyPackagedCatalog(root,[],async()=>new Response(text)));
  await assert.rejects(verifyPackagedCatalog(root,['없는 문구'],async()=>new Response(text)),/Missing packaged catalog/);
  await assert.rejects(verifyPackagedCatalog(root,['관리자 로그인'],async()=>new Response(text,{status:404})),/not served/);
  await assert.rejects(verifyPackagedCatalog(root,['관리자 로그인'],async()=>new Response('다른 내용')),/content differs/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Node22 account fixture setup uses emitted MJS without TypeScript or shell interpolation',async()=>{
 const root=await verificationWorkDirectory('package-account-runtime-'),app=join(root,'app with spaces');
 try{
  await mkdir(join(app,'lib'),{recursive:true});
  await writeFile(join(app,'lib/auth-password.mjs'),"export async function passwordHash(value){if(value!=='Fixture-Synthetic-Password')throw Error('Unexpected fixture input');return 'synthetic-hash';}");
  await writeFile(join(app,'lib/auth-store.mjs'),"import assert from 'node:assert/strict';export function storeCredentials(username,hash){assert.equal(username,'package-fixture');assert.equal(hash,'synthetic-hash');}");
  const module='scripts/verification/package-assets.mjs',filename=join(root,'assets.mjs');await writeFile(filename,await readRuntimeModule(module,[module]));
  const source=packageAccountSetup(app,'package-fixture','Fixture-Synthetic-Password');assert(!source.includes('.ts'));
  assert.equal(spawnSync('/usr/bin/node',['--no-experimental-strip-types','--input-type=module','-e',source],{encoding:'utf8',timeout:10000}).status,0);
  const imported=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--input-type=module','-e',`const {packageAccountSetup}=await import(${JSON.stringify(pathToFileURL(filename).href)});const {execFileSync}=await import('node:child_process');execFileSync(process.execPath,['--no-experimental-strip-types','--input-type=module','-e',packageAccountSetup(${JSON.stringify(app)},'package-fixture','Fixture-Synthetic-Password')]);console.log(typeof packageAccountSetup);`],{encoding:'utf8',timeout:10000});assert.equal(imported.status,0,imported.stderr);assert.equal(imported.stdout.trim(),'function');
  assert.throws(()=>packageAccountSetup('relative','package-fixture','Fixture-Synthetic-Password'));
  assert.throws(()=>packageAccountSetup(app,'invalid username','Fixture-Synthetic-Password'));
  assert.throws(()=>packageAccountSetup(app,'package-fixture','short'));
 }finally{await rm(root,{recursive:true,force:true});}
});
