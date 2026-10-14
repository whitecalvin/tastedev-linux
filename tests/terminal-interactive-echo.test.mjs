import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {terminalLaunch} from '../lib/terminal-launch.ts';
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
async function until(check){for(let i=0;i<150;i++){if(check())return;await tick();}throw Error('interactive PTY fixture timed out');}
async function fixture(shell,run){
 const plan=terminalLaunch('account-shell',true,shell);
 const child=spawn(plan.binary,plan.args,{env:{PATH:'/usr/bin:/bin',HOME:'/tmp',SHELL:'/bin/sh',TERM:'xterm-256color',LANG:'C.UTF-8',PS1:'FIXTURE_READY> '},cwd:'/tmp',detached:true,stdio:['pipe','pipe','pipe']});
 let output='';child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stdout.on('data',text=>output+=text);child.stderr.on('data',text=>output+=text);const closed=new Promise(resolve=>child.once('close',resolve));let ended=false;child.once('close',()=>ended=true);
 try{await run(child,()=>output);}finally{if(!ended){try{process.kill(-child.pid,'SIGKILL');}catch{}}await closed;}
}
for(const shell of ['/bin/bash','/bin/sh'])test(shell+' displays English and Korean typing before Enter and executes the same input',async()=>{
 await fixture(shell,async(child,output)=>{
  await until(()=>/(?:FIXTURE_READY> |[$#] )$/.test(output()));const start=output().length;
  const displayed=()=>output().slice(start).replace(/\x1b\[[0-9;?]*[a-zA-Z]/g,'').replaceAll('\r','');
  child.stdin.write("printf 'RESULT:%s\\n' 'abc한글'");
  await until(()=>output().slice(start).includes('abc한글'));
  assert(!displayed().includes('\nRESULT:abc한글'),'typing is shown before execution');
  child.stdin.write('\r');await until(()=>displayed().includes('\nRESULT:abc한글'));
  assert.equal(displayed().match(/\nRESULT:abc한글/g)?.length,1,'input executes only once');
 });
});
test('interactive shell programs can disable echo for password entry',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-echo-'));
 try{
  const shell=join(root,'password-fixture');await writeFile(shell,'#!/bin/sh\nstty -echo\nprintf PASSWORD_READY\nIFS= read -r value\nstty echo\nprintf "\\nPASSWORD_RECEIVED:%s\\n" "${#value}"\n',{mode:0o700});
  await fixture(shell,async(child,output)=>{await until(()=>output().includes('PASSWORD_READY'));child.stdin.write('synthetic-password\r');await until(()=>output().includes('PASSWORD_RECEIVED:18'));assert(!output().includes('synthetic-password'));});
 }finally{await rm(root,{recursive:true,force:true});}
});
test('interactive presets enable PTY echo while command-only jobs keep echo suppressed',()=>{
 for(const preset of ['account-shell','bash -i','codex','claude'])assert.equal(terminalLaunch(preset,true).args[4],'always');
 assert.equal(terminalLaunch('read -r value',true).args[4],'never');
});
