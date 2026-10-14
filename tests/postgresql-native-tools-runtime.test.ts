import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
test('Node22 emitted PostgreSQL native catalog and namespace tools retain sample descriptions and isolated candidate checks',async()=>{
 const root=await verificationWorkDirectory('postgresql-native-tools-runtime-');
 const scripts=['scripts/verify-postgresql-catalog-native.mjs','scripts/verify-postgresql-host.mjs'];
 const files=[...scripts,'scripts/build-workspace.mjs','scripts/verification/work-directory.mjs',...adminRuntimeFiles.map(name=>'lib/'+name),'lib/postgresql-setting-description.mjs'];
 try{
  for(const file of new Set(files)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  await mkdir(join(root,'lib/locales'),{mode:0o700});for(const name of ['postgresql-descriptions.json','postgresql-description-overrides.json'])await copyFile('lib/locales/'+name,join(root,'lib/locales',name));
  for(const script of scripts){const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script],{cwd:root,env:process.env,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr||result.stdout);const report:unknown=JSON.parse(result.stdout);assert(object(report)&&report.status==='PASS'&&Array.isArray(report.checks));assert.equal(report.checks.length,5);if(script.includes('catalog')){assert(typeof report.parsedSettings==='number'&&report.parsedSettings>300);assert.equal(report.serverStarted,false);}else{assert.equal(report.postmasterStarted,false);assert.equal(report.operatingConfigurationChanged,false);assert.equal(report.operatingServiceChanged,false);}}
 }finally{await rm(root,{recursive:true,force:true});}
});
