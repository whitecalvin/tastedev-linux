import test from 'node:test';import assert from 'node:assert/strict';
import {mkdir,writeFile,readdir,cp,symlink,rm,lstat} from 'node:fs/promises';import {join,dirname,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
test('Node22 MariaDB lifecycle controller emits plain JavaScript and rejects unapproved paths before binaries or fixtures',async()=>{
 const root=await verificationWorkDirectory('mariadb-lifecycle-controller-runtime-');const script='scripts/verification/mariadb-lifecycle.mjs';const files=[script,...['work-directory','http-json','nginx-native-report'].map(name=>'scripts/verification/'+name+'.mjs')];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(dir,{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory())await collect(file);else if(/\.(ts|mts)$/.test(file))files.push(file.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}await cp('lib/locales',join(root,'lib/locales'),{recursive:true});
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,script)],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
  for(const args of [[],['/usr/bin','/usr/share'],[root,join(root,'evidence')]]){const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),...args],{env:process.env,encoding:'utf8',timeout:10000});assert.equal(rejected.status,1);assert(!rejected.stderr.includes('MODULE_NOT_FOUND'));assert(/지정 빌드 경로|ENOENT/.test(rejected.stderr));}
  await assert.rejects(lstat(join(root,'evidence')),error=>error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT');
 }finally{await rm(root,{recursive:true,force:true});}
});
