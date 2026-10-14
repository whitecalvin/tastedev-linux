import {mkdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {preparePostgresqlConfigBackup} from './postgresql-backup-request.ts';
import {postgresqlConfigGraph,postgresqlConfigSources,assertPostgresqlConfigGraph} from './postgresql-config-graph.ts';
import {createPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {postgresqlCodeDependencies,assertPostgresqlRunningService,postgresqlServiceScope} from './postgresql-code-operation.ts';
import {publishPostgresqlRestoreBackup} from './postgresql-restore-undo-backup.ts';
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 설정 파일 또는 실행 상태가 변경되었습니다.'),{status:409});};

// Capture a private restore-compatible configuration graph; never stage or activate it.
export async function createPostgresqlConfigBackup(input:unknown,dependencies:Parameters<typeof postgresqlCodeDependencies>[0]={}){
 const request=preparePostgresqlConfigBackup(input),opts=postgresqlCodeDependencies(dependencies);
 if(typeof request.path!=='string')fail();const target=request.path;
 const graph=await postgresqlConfigGraph(request.path,{base:opts.base,ownerUid:opts.ownerUid});
 if(graph.files.find(file=>file.path===request.path)?.version!==request.version)fail();
 const service=assertPostgresqlRunningService(await opts.inspectService(target),request.path);
 async function verify(){await assertPostgresqlConfigGraph(graph);const current=assertPostgresqlRunningService(await opts.inspectService(target),request.path);if(JSON.stringify(current)!==JSON.stringify(service))fail();}
 await verify();
 if(typeof opts.backupRoot!=='string'||!path.isAbsolute(opts.backupRoot))fail();
 await mkdir(opts.backupRoot,{recursive:true,mode:0o700});const directory=await lstat(opts.backupRoot);
 if(!directory.isDirectory()||directory.isSymbolicLink()||directory.uid!==process.getuid?.()||(directory.mode&0o777)!==0o700)fail();
 const graphArchive=await createPostgresqlGraphArchive(graph,opts.backupRoot);
 const record={id:randomUUID(),kind:'postgresql',target:request.path,text:postgresqlConfigSources(graph).get(request.path),version:request.version,createdAt:new Date().toISOString(),context:{version:1,graphVersion:graph.version,graphArchive,scope:postgresqlServiceScope(service),values:service.values}};
 const backup=await publishPostgresqlRestoreBackup(record,opts.backupRoot,verify);
 return {path:request.path,backup,fileCount:graph.files.length,created:true,operatingConfigurationChanged:false,operatingServiceChanged:false};
}
