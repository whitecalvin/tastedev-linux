import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {adminHelperSource,adminHelperSourceModules,assertAdminHelperCurrent} from '../scripts/admin/error-output-source.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('complete root helper is reproducibly generated from all TypeScript source modules',async()=>{
 await assertAdminHelperCurrent();const first=await adminHelperSource();assert.equal(first,await adminHelperSource());
 assert(first.startsWith('#!/usr/bin/node\n'));assert(!/\b(?:export|import)\s/.test(first));
 const root=await verificationWorkDirectory('admin-helper-source-');
 try{
  const directory=join(root,'scripts/admin');await mkdir(directory,{recursive:true});
  for(const module of adminHelperSourceModules)await copyFile(resolve('scripts/admin/'+module+'.mts'),join(directory,module+'.mts'));
  const file=join(directory,'linux-admin');await writeFile(file,first);await assertAdminHelperCurrent(root);
  const parsed=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',file],{encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
  const mutations=[first.replace("const BASE = '/var/lib/linux/admin';","const BASE = '/wrong-root';"),first.replace('main().catch((error)','main().catch((changed)'),first+'\nprocess.exitCode=0;\n'];
  for(const changed of mutations){assert.notEqual(changed,first);await writeFile(file,changed);await assert.rejects(assertAdminHelperCurrent(root),/complete TypeScript sources/);}
 }finally{await rm(root,{recursive:true,force:true});}
});

test('whole-source validation refuses a changed typed template even when the helper file is untouched',async()=>{
 const root=await verificationWorkDirectory('admin-helper-template-change-');
 try{
  const directory=join(root,'scripts/admin');await mkdir(directory,{recursive:true});
  for(const module of adminHelperSourceModules)await copyFile(resolve('scripts/admin/'+module+'.mts'),join(directory,module+'.mts'));
  await writeFile(join(directory,'linux-admin'),await readFile('scripts/admin/linux-admin'));
  const bootstrap=join(directory,'helper-bootstrap.mts');await writeFile(bootstrap,(await readFile(bootstrap,'utf8')).replace("BASE='/var/lib/linux/admin'","BASE='/changed-root'"));
  await assert.rejects(assertAdminHelperCurrent(root),/complete TypeScript sources/);
 }finally{await rm(root,{recursive:true,force:true});}
});
