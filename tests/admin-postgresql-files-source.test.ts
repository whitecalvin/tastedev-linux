import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {adminPostgresqlFilesSource,assertAdminPostgresqlFilesCurrent} from '../scripts/admin/error-output-source.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('helper PostgreSQL code is standalone and exactly matches its TypeScript source',async()=>{
 await assertAdminPostgresqlFilesCurrent();const emitted=await adminPostgresqlFilesSource();
 assert(!/\b(?:export|import)\s/.test(emitted));
 const root=await verificationWorkDirectory('admin-postgresql-files-source-');
 try{
  const directory=join(root,'scripts/admin');await mkdir(directory,{recursive:true});
  await copyFile(resolve('scripts/admin/helper-postgresql-files.mts'),join(directory,'helper-postgresql-files.mts'));
  const source=await readFile('scripts/admin/linux-admin','utf8');
  await writeFile(join(directory,'linux-admin'),source);await assertAdminPostgresqlFilesCurrent(root);
  for(const invalid of [source.replace('function pgRead(file)','function pgRead(stale)'),source.replace('// BEGIN TYPESCRIPT HELPER POSTGRESQL FILES','// missing marker'),source+'\n// END TYPESCRIPT HELPER POSTGRESQL FILES\n']){
   await writeFile(join(directory,'linux-admin'),invalid);
   await assert.rejects(assertAdminPostgresqlFilesCurrent(root),/differs|Missing or ambiguous/);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});

test('typed PostgreSQL input rejects untrusted fields and retains exact settings and units',async()=>{
 const context=vm.createContext({Buffer,fail(message:string){throw Error(message);}});
 vm.runInContext(await adminPostgresqlFilesSource(),context);
 const input={path:'/etc/postgresql/16/main/postgresql.conf',confirm:true,version:'a'.repeat(64),changes:{port:'5433',connections:100,sharedBuffers:128,workMem:8,logging:false}};
 function invoke(value:unknown):unknown{return vm.runInContext('pgInput('+JSON.stringify(value)+')',context);}
 assert.deepEqual(JSON.parse(JSON.stringify(invoke(input))),{version:'16',cluster:'main',file:input.path,values:{port:'5433',max_connections:'100',shared_buffers:'128MB',work_mem:'8MB',logging_collector:'off'}});
 for(const patch of [{confirm:false},{version:'stale'},{path:'/etc/shadow'},{changes:{}},{changes:[]},{changes:{unknown:1}},{changes:{logging:'on'}},{changes:{sharedBuffers:15}},{changes:{workMem:4097}},{changes:{port:true}},{changes:{connections:'1e2'}}])assert.throws(()=>invoke({...input,...patch}),/PostgreSQL/);
});
