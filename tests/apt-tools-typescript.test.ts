import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm,chmod,symlink} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {aptRepositoryPath} from '../scripts/apt-repository-path.ts';
test('Distribution TypeScript tools emit Node22 JavaScript; directory and invalid-argument checks execute no package/GPG/APT operations',async()=>{
 const root=await verificationWorkDirectory('apt-repository-');
 const scripts=['build-apt-repository','sign-apt-repository','verify-apt-repository','verify-apt-signing'].map(name=>'scripts/'+name+'.mjs');
 const desktopScripts=['scripts/build-desktop-deb.mjs','scripts/verify-desktop-deb.mjs','scripts/verification/prepare-desktop-install.mjs'];
 const files=[...scripts,...desktopScripts,'scripts/desktop-cargo-paths.mjs','scripts/apt-repository-path.mjs','scripts/build-workspace.mjs','scripts/verification/http-json.mjs','scripts/verification/work-directory.mjs','lib/error-code.mjs'];
 try{
  assert.equal(await aptRepositoryPath(root),root);await assert.rejects(aptRepositoryPath('/etc/rejected-repository'));await chmod(root,0o755);await assert.rejects(aptRepositoryPath(root));await chmod(root,0o700);
  const alias=root+'alias';await symlink(root,alias,'dir');try{await assert.rejects(aptRepositoryPath(alias));}finally{await rm(alias,{force:true});}
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  await writeFile(join(root,'package.json'),JSON.stringify({type:'module',version:'../invalid-version'}),{mode:0o600});
  for(const script of ['scripts/build-desktop-deb.mjs','scripts/verify-desktop-deb.mjs']){const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script],{cwd:root,env:process.env,encoding:'utf8',timeout:10000});assert.equal(rejected.status,1);assert(rejected.stderr.includes('Unsupported desktop package version'));}
  for(const script of [...scripts,...desktopScripts]){const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',script],{cwd:root,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);if(desktopScripts.includes(script)||script.endsWith('/build-apt-repository.mjs'))continue;const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script,'/etc/rejected-repository','A'.repeat(40)],{cwd:root,env:process.env,encoding:'utf8',timeout:10000});assert.equal(rejected.status,1);assert(rejected.stderr.includes('designated build directory'));assert(!rejected.stderr.includes('MODULE_NOT_FOUND'));}
 }finally{await rm(root,{recursive:true,force:true});}
});
