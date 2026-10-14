import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {loadBindings,parse} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {credentials,storeCredentials} from '../lib/auth-store.ts';
import {getBetterAuth} from '../lib/better-auth.ts';
import {helperErrorCollector} from '../lib/helper-error.ts';
import {helperJsonOutput} from '../lib/helper-json-output.ts';
import {prepareSudoPolicyUpdate} from '../lib/sudo-policy-request.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
function localized(error,message,status){
 assert.equal(error.message,message);if(status!==undefined)assert.equal(error.status,status);
 for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,message));assert.equal(translate(locale,message),catalog[message]);assert(!/[가-힣]/.test(catalog[message]));}
 return true;
}
test('authentication and helper modules have all eight direct native diagnostics',async()=>{
 await loadBindings();const keys=new Set();
 for(const file of ['auth-store','better-auth','helper-error','helper-json-output','sudo-policy-request']){
  const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));
  for(const message of literals){keys.add(message);localized(Error(message),message);}
 }
 assert.equal(keys.size,8);
});
test('invalid account files and names produce localized guidance without replacing original bytes',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','auth-localization-'));const previous=process.env.LINUX_AUTH_ROOT;
 try{
  process.env.LINUX_AUTH_ROOT=root;const file=path.join(root,'auth.json'),bytes=Buffer.from('{broken account registry');await writeFile(file,bytes,{mode:0o600});
  assert.throws(()=>credentials(),error=>localized(error,'계정 설정 파일을 확인하세요.'));assert.deepEqual(await readFile(file),bytes);
  assert.throws(()=>storeCredentials('invalid user','scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128)),error=>localized(error,'사용자명은 영문·숫자·점·밑줄·하이픈 1~64자로 설정하세요.'));assert.deepEqual(await readFile(file),bytes);
  const linked=path.join(root,'linked');await symlink(root,linked);process.env.LINUX_AUTH_ROOT=linked;
  assert.throws(()=>credentials(),error=>localized(error,'계정 저장 경로를 확인하세요.'));assert.deepEqual(await readFile(file),bytes);
 }finally{if(previous===undefined)delete process.env.LINUX_AUTH_ROOT;else process.env.LINUX_AUTH_ROOT=previous;await rm(root,{recursive:true,force:true});}
});
test('Better Auth rejects exposed permissions and invalid secrets while preserving the original secret',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','better-auth-guidance-'));const previous=process.env.LINUX_AUTH_ROOT;
 try{
  for(const [name,directoryMode,fileMode,message] of [
   ['directory',0o755,0o600,'인증 저장 경로 권한을 확인하세요.'],
   ['file',0o700,0o644,'인증 저장 파일 권한을 확인하세요.'],
   ['secret',0o700,0o600,'인증 키를 확인하세요.']
  ]){
   const account=path.join(root,name),base=path.join(account,'better-auth');await mkdir(account,{mode:0o700});await mkdir(base,{mode:directoryMode});
   const secret=path.join(base,'secret'),bytes=Buffer.from('invalid-secret-fixture');await writeFile(secret,bytes,{mode:fileMode});process.env.LINUX_AUTH_ROOT=account;
   await assert.rejects(getBetterAuth(),error=>localized(error,message));assert.deepEqual(await readFile(secret),bytes);
  }
 }finally{if(previous===undefined)delete process.env.LINUX_AUTH_ROOT;else process.env.LINUX_AUTH_ROOT=previous;await rm(root,{recursive:true,force:true});}
});
test('oversized helper output and unconfirmed sudo requests retain status and localized advice',()=>{
 assert.throws(()=>helperErrorCollector().write(Buffer.alloc(4097)),error=>localized(error,'관리 응답 크기가 너무 큽니다.',502));
 assert.throws(()=>helperJsonOutput('status').write(Buffer.alloc(1024*1024+1)),error=>localized(error,'관리 응답 크기가 너무 큽니다.',502));
 for(const input of [null,[],{}, {confirm:false,version:'a'.repeat(64)}, {confirm:true,version:'a'.repeat(64),unexpected:true}])
  assert.throws(()=>prepareSudoPolicyUpdate(input,{username:'fixture',uid:1000}),error=>localized(error,'sudo 권한 규칙 변경을 다시 확인하세요.',400));
});
