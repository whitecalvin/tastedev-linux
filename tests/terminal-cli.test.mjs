import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {terminalLaunch} from '../lib/terminal-launch.ts';
import {terminalCliCommands} from '../lib/terminal-cli.ts';
test('CLI inspection follows terminal PATH order and rejects directories and non-executable files without execution',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','terminal-cli-'));
 try{
  const first=path.join(root,'first'),second=path.join(root,'second');await mkdir(first);await mkdir(second);
  await mkdir(path.join(first,'codex'));await writeFile(path.join(second,'codex'),'invalid executable bytes',{mode:0o700});
  await writeFile(path.join(first,'claude'),'not executable',{mode:0o600});await writeFile(path.join(second,'claude'),'invalid executable bytes',{mode:0o700});
  const result=await terminalCliCommands(first+path.delimiter+second,root);
  assert.deepEqual(result.codex,{available:true,path:path.join(second,'codex')});assert.deepEqual(result.claude,{available:true,path:path.join(second,'claude')});
  await chmod(path.join(first,'claude'),0o700);assert.equal((await terminalCliCommands(first+path.delimiter+second,root)).claude.path,path.join(first,'claude'));
  await symlink(path.join(second,'codex'),path.join(root,'codex'));assert.equal((await terminalCliCommands('',root)).codex.available,true);
  assert.equal((await terminalCliCommands(path.join(root,'missing'),root)).claude.available,false);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('CLI preset loads only the fixture user shell PATH before replacing Bash with the CLI',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','terminal-cli-profile-'));
 try{
  const bin=path.join(root,'custom-bin');await mkdir(bin);
  await writeFile(path.join(root,'.bashrc'),'export PATH="'+bin+':$PATH"\n');
  await writeFile(path.join(bin,'codex'),"#!/bin/sh\nprintf 'fixture-codex-ready\\n'\n",{mode:0o700});
  const launch=terminalLaunch('codex',true);
  const result=await promisify(execFile)(launch.binary,launch.args,{env:{...process.env,HOME:root,PATH:'/usr/bin:/bin',SHELL:'/bin/bash'},cwd:root,timeout:5000});
  assert.match(result.stdout,/fixture-codex-ready/);
 }finally{await rm(root,{recursive:true,force:true});}
});
