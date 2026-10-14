import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readdir,symlink,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('Node22 HBA GUI controller emits plain JavaScript and rejects unsupported modes before native startup',async()=>{
 const root=await verificationWorkDirectory('postgresql-hba-gui-runtime-');
 const script='scripts/verification/postgresql-hba-native-gui.mjs';
 const files=[script,...['work-directory','http-json','nginx-native-report','postgresql-local-api'].map(name=>'scripts/verification/'+name+'.mjs')];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(dir,{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory())await collect(file);else if(/\.(ts|mts)$/.test(file))files.push(file.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,script)],{encoding:'utf8'});
  assert.equal(checked.status,0,checked.stderr);
  const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'--invalid-fixture-option'],{encoding:'utf8',env:process.env,timeout:10000});
  assert.equal(rejected.status,1,rejected.stderr);
  assert(rejected.stderr.includes('AssertionError'),rejected.stderr);
  assert(!rejected.stderr.includes('MODULE_NOT_FOUND'));
  assert(!rejected.stdout.includes('GUI_READY'));
  assert(!rejected.stdout.includes('BUILDING'));
 }finally{await rm(root,{recursive:true,force:true});}
});
