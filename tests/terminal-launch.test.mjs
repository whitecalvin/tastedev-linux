import test from 'node:test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {terminalLaunch,terminalTimeout} from '../lib/terminal-launch.ts';
test('PTY launch fixes binary flags and disables transcript and input echo without interpreting command',()=>{
 const command='printf "%s" "a; b"';const plan=terminalLaunch(command,true);assert.equal(plan.binary,'/usr/bin/script');assert.deepEqual(plan.args,['--quiet','--return','--flush','--echo','never','--command',command,'/dev/null']);assert.equal(terminalLaunch(command).binary,'/bin/bash');for(const mode of ['true',1,null,[]])assert.throws(()=>terminalLaunch(command,mode));
});

test('terminal execution deadline defaults to two minutes and rejects coercion',()=>{assert.equal(terminalTimeout(),120);for(const value of [1,120,3600])assert.equal(terminalTimeout(value),value);for(const value of [null,'120',0,3601,2.5,true])assert.throws(()=>terminalTimeout(value));});


test('PTY CLI presets retain interactive Bash initialization independently of the account shell',()=>{
 for(const command of ['codex','claude'])assert.equal(terminalLaunch(command,true).args[6],"/bin/bash -ic 'exec "+command+"'");
 assert.deepEqual(terminalLaunch('codex',false).args,['--noprofile','--norc','-c','codex']);
 assert.equal(terminalLaunch('codex --version',true).args[6],'codex --version');
});


test('account shell preset invokes the selected executable literally in an actual PTY',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-account-shell-'));
 try{
  const shell=join(root,"shell ' fixture");
  await writeFile(shell,'#!/bin/sh\ntest "$1" = -i || exit 19\ntest -t 0 && test -t 1 || exit 20\nprintf ACCOUNT_SHELL_READY\n',{mode:0o700});
  const plan=terminalLaunch('account-shell',true,shell);
  const result=await promisify(execFile)(plan.binary,plan.args,{env:{PATH:'/usr/bin:/bin',SHELL:'/bin/sh'},timeout:5000});
  assert.equal(result.stdout,'ACCOUNT_SHELL_READY');
  for(const invalid of ['/usr/sbin/nologin','/bin/false','relative','/bin/sh\n',null])assert.throws(()=>terminalLaunch('account-shell',true,invalid));
  assert.throws(()=>terminalLaunch('account-shell',false,'/bin/sh'));
 }finally{await rm(root,{recursive:true,force:true});}
});
