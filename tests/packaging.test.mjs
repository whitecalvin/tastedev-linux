import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
test('package configure reloads and restarts through the policy-aware invoker using mocked commands',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-maintainer-')),bin=join(root,'bin'),log=join(root,'calls');
 try{
  await mkdir(bin);
  for(const name of ['node','getent','adduser','install','systemctl','deb-systemd-helper','deb-systemd-invoke'])await writeFile(join(bin,name),'#!/bin/sh\necho "'+name+' $*" >> "$TEST_CALLS"\n',{mode:0o755});
  const source=await readFile(new URL('../packaging/postinst',import.meta.url),'utf8');
  // Replace only the host systemd presence check; every external command is a fixture.
  const script=join(root,'postinst');await writeFile(script,source.replace('[ -d /run/systemd/system ]','[ 1 = 1 ]').replace('/usr/bin/node','node'));
  await exec('/bin/sh',[script,'configure','0.1.0'],{env:{PATH:bin,TEST_CALLS:log}});
  const calls=(await readFile(log,'utf8')).split('\n');
  assert(calls.includes('systemctl daemon-reload'));assert(calls.includes('deb-systemd-helper enable tastedev-linux.service'));
  assert(calls.includes('deb-systemd-invoke restart tastedev-linux.service'));assert(!calls.some(line=>line==='systemctl restart tastedev-linux.service'));
  assert(calls.indexOf('systemctl daemon-reload')<calls.indexOf('deb-systemd-invoke restart tastedev-linux.service'));
  await writeFile(log,'');await exec('/bin/sh',[script,'abort-upgrade'],{env:{PATH:bin,TEST_CALLS:log}});assert.equal(await readFile(log,'utf8'),'');
 }finally{await rm(root,{recursive:true,force:true});}
});
