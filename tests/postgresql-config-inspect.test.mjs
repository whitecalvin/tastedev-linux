import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,rm,stat} from 'node:fs/promises';import path from 'node:path';import {inspectPostgresqlConfiguration} from '../lib/postgresql-config-inspect.ts';
const root='/etc/postgresql/16/main/postgresql.conf',identity={validationUid:process.getuid(),validationGid:process.getgid()},report={valid:true,scope:'private-config-options',namespaceCommandsCompleted:true,namespaceUid:identity.validationUid,namespaceGid:identity.validationGid,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,values:{port:'5433',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off',password:'private-value'}};
async function fixture(run){const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-inspect-test-');try{const cluster=path.join(base,'postgresql/16/main');await mkdir(cluster,{recursive:true,mode:0o700});await writeFile(path.join(cluster,'postgresql.conf'),"port=5432\npassword='private-original'\n",{mode:0o600});await run({base,cluster});}finally{await rm(base,{recursive:true,force:true});}}
test('PostgreSQL inspection coordinator passes exact draft to private native validator, strips non-public values and cleans candidate',async()=>fixture(async({base,cluster})=>{
 let directory;const overrides=new Map([[root,"port=5433\npassword='private-draft'\n"]]);const result=await inspectPostgresqlConfiguration(root,{base,...identity,overrides,validate:async candidate=>{directory=candidate.directory;assert((await readFile(candidate.main,'utf8')).includes('private-draft'));return {...report,secret:'private-native-output'};}});assert(result.valid);assert.equal(result.values.port,'5433');for(const secret of ['private-draft','private-original','private-value','private-native-output'])assert(!JSON.stringify(result).includes(secret));assert.equal(result.autoConfigurationVerified,false);assert((await readFile(path.join(cluster,'postgresql.conf'),'utf8')).includes('private-original'));await assert.rejects(stat(directory),{code:'ENOENT'});
}));
test('PostgreSQL inspection coordinator refuses incomplete namespace proof and changes during validation while preserving source',async()=>fixture(async({base,cluster})=>{
 let directory;await assert.rejects(inspectPostgresqlConfiguration(root,{base,...identity,validate:async candidate=>{directory=candidate.directory;return {...report,namespaceCommandsCompleted:false};}}));await assert.rejects(stat(directory),{code:'ENOENT'});
 await assert.rejects(inspectPostgresqlConfiguration(root,{base,...identity,validate:async candidate=>{directory=candidate.directory;await writeFile(candidate.main,'port=9999\n');return report;}}),error=>error.status===409);await assert.rejects(stat(directory),{code:'ENOENT'});
 await assert.rejects(inspectPostgresqlConfiguration(root,{base,...identity,validate:async()=>{await writeFile(path.join(cluster,'postgresql.conf'),'port=5434\n');return report;}}),error=>error.status===409);assert.equal(await readFile(path.join(cluster,'postgresql.conf'),'utf8'),'port=5434\n');
}));

test('private host payload stays helper-owned when the namespace UID differs',async()=>fixture(async({base})=>{
 let directory;
 const result=await inspectPostgresqlConfiguration(root,{base,validationUid:65534,validationGid:65534,validate:async candidate=>{
  directory=candidate.directory;
  assert.equal(candidate.namespaceUid,65534);assert.equal(candidate.namespaceGid,65534);
  for(const file of [candidate.directory,candidate.payload,candidate.main,candidate.payload+'/passwd',candidate.payload+'/group']){
   const held=await stat(file);assert.equal(held.uid,process.getuid());assert.equal(held.gid,process.getgid());assert.equal(held.mode&0o777,held.isDirectory()?0o700:0o600);
  }
  return {...report,namespaceUid:65534,namespaceGid:65534};
 }});
 assert.equal(result.valid,true);await assert.rejects(stat(directory),{code:'ENOENT'});
}));
