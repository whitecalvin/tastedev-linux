import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
test('Node22 UI copy audit parses typed JSX and reports direct copy without claiming dynamic translation coverage',async()=>{
 const root=await verificationWorkDirectory('ui-copy-audit-runtime-');
 try{
  await mkdir(join(root,'app'),{mode:0o700});await mkdir(join(root,'components'),{mode:0o700});
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  await writeFile(join(root,'audit.mjs'),await readRuntimeModule('scripts/audit-untranslated-ui.mjs',['scripts/audit-untranslated-ui.mjs']),{mode:0o600});
  await writeFile(join(root,'app/page.tsx'),`type Props={flag:boolean;label:string};export default function Page({flag,label}:Props){return <div title="설명" aria-label={flag?'활성':'비활성'}>본문<span>{label}</span><span>{'English only'}</span></div>}`,{mode:0o600});
  await writeFile(join(root,'components/control.jsx'),`export default function Control(){return <input placeholder="검색"/>}`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','audit.mjs'],{cwd:root,env:process.env,encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr);const report:unknown=JSON.parse(result.stdout);assert(object(report));assert.equal(report.status,'DIRECT_JSX_COPY_REVIEW_REQUIRED');assert.equal(report.findings,7);assert(Array.isArray(report.items));
  const texts=report.items.map((item:unknown)=>{assert(object(item));return item.text;});assert.deepEqual([...new Set(texts)].sort(),['설명','활성','비활성','본문','검색'].sort());assert(!texts.includes('English only'));
  assert(typeof report.scope==='string'&&report.scope.includes('Review candidates'));
 }finally{await rm(root,{recursive:true,force:true});}
});
