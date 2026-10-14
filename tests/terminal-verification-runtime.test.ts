import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 verifier output rewrites approved dynamic workspace imports and refuses unapproved targets',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/terminal-verifier-runtime-');
 try{
  const allowed=['scripts/verify-terminal-cli.mjs','scripts/verification/work-directory.mjs','lib/terminal-cli.mjs','lib/workspace.mjs'];
  for(const file of allowed.slice(0,3)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  const source=await readFile(join(root,'scripts/verify-terminal-cli.mjs'),'utf8');assert(source.includes('import("../lib/workspace.mjs")'));assert(!source.includes('import("../lib/workspace.ts")'));
  await writeFile(join(root,'lib/workspace.mjs'),"export async function runCommand(command){if(!command.endsWith(' --version'))throw Error('Only fixture versions');return {id:'fixture',status:'success',exitCode:0,pty:true,username:'fixture',logs:[{text:'fixture-cli-v1'}]};}export function terminalContext(){return {sessions:[]};}export function stopCommand(){throw Error('No real session');}");
  await mkdir(join(root,'bin'));for(const name of ['codex','claude'])await writeFile(join(root,'bin',name),'#!/bin/sh\nexit 99\n',{mode:0o700});
  const environment:NodeJS.ProcessEnv={...process.env,PATH:join(root,'bin')};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,'scripts/verify-terminal-cli.mjs')],{cwd:root,env:environment,encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.status,'PASS');assert.equal(report.records.length,2);assert(report.records.every((row:{versionOutput:string})=>row.versionOutput==='fixture-cli-v1'));assert.equal(report.aiRequestSent,false);assert(report.evidence.startsWith('/mnt/data/build/tastedev-linux/evidence/'));
  await assert.rejects(readRuntimeModule('scripts/verify-terminal-cli.mjs',allowed.filter(name=>name!=='lib/workspace.mjs')),/Unapproved typed admin dependency/);
 }finally{await rm(root,{recursive:true,force:true});}
});
