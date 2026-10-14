import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,link,symlink,realpath,rm} from 'node:fs/promises';
import path from 'node:path';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {validateFile,createFolder,readCode,saveCode} from '../lib/workspace.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=(error,status)=>{assert.equal(error.status,status);for(const locale of locales){const text=translate(locale,error.message);assert.notEqual(text,error.message);assert(!/[가-힣]/.test(text));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all static shared workspace and terminal diagnostics have direct native catalog entries',async()=>{
 await loadBindings();const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/workspace.ts',import.meta.url),'utf8'),{filename:'workspace.ts'}));assert(literals.length>=14);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of literals){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));for(const token of ['256KB','UTF-8','PTY'])if(key.includes(token))assert(catalog[key].includes(token));}}
});
test('real private workspace rejects unsafe file edits and retains original fixture bytes',async()=>{
 const fixture=await mkdtemp('/mnt/data/build/tastedev-linux/workspace-errors-'),work=path.join(fixture,'work'),oldRoot=process.env.LINUX_WORKSPACE_ROOT;await mkdir(work);process.env.LINUX_WORKSPACE_ROOT=work;
 try{
  for(const name of ['../escape','.hidden','nested/.hidden','/etc/passwd','a\\b','a\0b','folder/../file'])assert.throws(()=>validateFile(name),error=>localized(error,400));
  await writeFile(path.join(work,'large.conf'),Buffer.alloc(262145,97));await assert.rejects(readCode('large.conf'),error=>localized(error,400));
  await writeFile(path.join(work,'invalid.conf'),Buffer.from([0xff]));await assert.rejects(readCode('invalid.conf'),error=>localized(error,400));
  await writeFile(path.join(fixture,'outside.conf'),'outside fixture marker\n');await symlink(path.join(fixture,'outside.conf'),path.join(work,'linked.conf'));await assert.rejects(readCode('linked.conf'),error=>localized(error,403));
  await writeFile(path.join(work,'single.conf'),'original fixture\n');await link(path.join(work,'single.conf'),path.join(work,'hard.conf'));await assert.rejects(saveCode('hard.conf','replacement'),error=>localized(error,403));
  await assert.rejects(saveCode('single.conf','replacement','0'.repeat(64)),error=>localized(error,403));
  await writeFile(path.join(work,'plain.conf'),'unchanged\n');await assert.rejects(saveCode('plain.conf','replacement'),error=>localized(error,409));
  await assert.rejects(saveCode('new.conf','x'.repeat(262145)),error=>localized(error,400));
  await createFolder('config');await assert.rejects(createFolder('config'),error=>localized(error,409));
  const full=path.join(await realpath(work),'plain.conf');globalThis.__linuxFileWrites.add(full);try{await assert.rejects(saveCode('plain.conf','replacement'),error=>localized(error,409));}finally{globalThis.__linuxFileWrites.delete(full);}
  const uid=process.getuid;process.getuid=()=>0;try{await assert.rejects(saveCode('new.conf','value'),error=>localized(error,403));await assert.rejects(createFolder('root-folder'),error=>localized(error,403));}finally{process.getuid=uid;}
  assert.equal(await readFile(path.join(work,'single.conf'),'utf8'),'original fixture\n');assert.equal(await readFile(path.join(work,'plain.conf'),'utf8'),'unchanged\n');assert.equal(await readFile(path.join(fixture,'outside.conf'),'utf8'),'outside fixture marker\n');
 }finally{if(oldRoot===undefined)delete process.env.LINUX_WORKSPACE_ROOT;else process.env.LINUX_WORKSPACE_ROOT=oldRoot;await rm(fixture,{recursive:true,force:true});}
});
