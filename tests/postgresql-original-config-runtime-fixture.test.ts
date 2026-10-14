import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {createPostgresqlGraphArchive,readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import {postgresqlGraphRestoreSnapshot} from '../lib/postgresql-graph-restore-snapshot.ts';
import {createPostgresqlGraphRestoreJournal} from '../lib/postgresql-graph-restore-journal.ts';
import {inspectPostgresqlOriginalConfiguration} from '../lib/postgresql-original-config-validation.ts';

test('original configuration validation reconstructs journal includes privately and preserves current files',async()=>{
 const base=await mkdtemp(join('/mnt/data/build/tastedev-linux','pg-original-ts-'));
 try{
  const target='/etc/postgresql/16/main/postgresql.conf',cluster=base+'/postgresql/16/main',backupRoot=base+'/backups';
  await mkdir(cluster+'/conf.d',{recursive:true,mode:0o700});await mkdir(backupRoot,{mode:0o700});
  await writeFile(cluster+'/postgresql.conf',"port=5432\ninclude_dir 'conf.d'\n",{mode:0o600});await writeFile(cluster+'/conf.d/01.conf',"work_mem='8MB'\n",{mode:0o600});
  const reference=await createPostgresqlGraphArchive(await postgresqlConfigGraph(target,{base}),backupRoot),archive=await readPostgresqlGraphArchive(reference,backupRoot,target);
  await writeFile(cluster+'/postgresql.conf',"port=6000\ninclude_dir 'conf.d'\n");await writeFile(cluster+'/conf.d/01.conf',"work_mem='4MB'\n");
  const journal=await createPostgresqlGraphRestoreJournal(await postgresqlGraphRestoreSnapshot(archive,{base}),backupRoot);
  let calls=0;const workRoots:string[]=[];
  const result=await inspectPostgresqlOriginalConfiguration(journal,backupRoot,{validate:async candidate=>{
   calls++;workRoots.push(candidate.directory);assert.notEqual(candidate.directory,base);
   const files=await readdir(candidate.payload,{recursive:true});assert(files.length>0);
   return {valid:true,scope:'private-config-options',namespaceCommandsCompleted:true,namespaceUid:candidate.namespaceUid,namespaceGid:candidate.namespaceGid,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,values:{port:'6000',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'}};
  }});
  assert.equal(calls,1);assert.equal(result.source,'private-journal-original-config');assert.equal(result.originalGraphVersion,journal.record.body.beforeGraph?.version);
  assert.equal(await readFile(cluster+'/postgresql.conf','utf8'),"port=6000\ninclude_dir 'conf.d'\n");
  for(const root of workRoots)await assert.rejects(readdir(root),{code:'ENOENT'});
  await assert.rejects(inspectPostgresqlOriginalConfiguration({...journal},backupRoot));
 }finally{await rm(base,{recursive:true,force:true});}
});
