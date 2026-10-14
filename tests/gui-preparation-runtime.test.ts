import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
test('Node22 GUI preparation scripts emit plain JavaScript and reject unapproved roots before account or server creation',async()=>{
 const root=await verificationWorkDirectory('gui-preparation-runtime-');
 const scripts=['scripts/verification/common-pages-original-gui.mjs','scripts/verification/installed-recovery-gui.mjs','scripts/verification/navigation-gui.mjs','scripts/verification/install-monitor-gui.mjs','scripts/verification/session-maintenance-gui.mjs','scripts/verification/session-expiry-gui.mjs','scripts/verification/terminal-clipboard-gui.mjs','scripts/verification/package-editor-gui.mjs','scripts/verification/nginx-editor-gui.mjs'];
 const files=[...scripts,'scripts/verification/compiled-source-check.mjs','scripts/verification/work-directory.mjs','scripts/verification/http-json.mjs','scripts/verification/nginx-native-report.mjs','scripts/build-workspace.mjs',...['error-code','auth-password','auth-store','runtime-paths'].map(name=>'lib/'+name+'.mjs')];
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  for(const script of scripts){const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',script],{cwd:root,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script,'relative-rejected-source','38000'],{cwd:root,env:process.env,encoding:'utf8',timeout:10000});assert.equal(rejected.status,1);assert(!rejected.stderr.includes('MODULE_NOT_FOUND'));assert(/검수된 빌드 경로|전용 검수 경로|Pass a production source snapshot|Pass an absolute current source build directory|AssertionError/.test(rejected.stderr));}
 }finally{await rm(root,{recursive:true,force:true});}
});
