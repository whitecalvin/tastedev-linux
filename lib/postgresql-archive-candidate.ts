import {hasErrorCode} from './error-code.ts';
type InspectionOptions=NonNullable<Parameters<typeof inspectPostgresqlConfiguration>[1]>;
import {postgresqlWorkDirectory} from './postgresql-work-directory.ts';
import path from 'node:path';
import {mkdir,writeFile,lstat,rm} from 'node:fs/promises';
import {assertPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {postgresqlConfigGraph,assertPostgresqlConfigGraph} from './postgresql-config-graph.ts';
import {inspectPostgresqlConfiguration} from './postgresql-config-inspect.ts';
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 백업 설정 후보를 확인하세요.'),{status:409});};
export async function postgresqlArchiveCandidate(value:unknown){
 const record=assertPostgresqlGraphArchive(value);const base=await postgresqlWorkDirectory('tastedev-pg-restore-'),allocated=await lstat(base);let graph;
 const cleanup=async()=>{let current;try{current=await lstat(base);}catch(error){if(hasErrorCode(error,'ENOENT'))return;throw error;}if(!current.isDirectory()||current.isSymbolicLink()||current.uid!==allocated.uid||current.dev!==allocated.dev||current.ino!==allocated.ino)fail();await rm(base,{recursive:true,force:true});};
 const physical=(name:string)=>{const file=path.join(base,name.slice('/etc/'.length));if(!file.startsWith(base+'/postgresql/')||path.normalize(file)!==file)fail();return file;};
 try{
  // Reconstruct only verified archive sources and referenced directories. Missing
  // optional paths remain absent, regardless of the current operating graph.
  for(const source of record.sources){const file=physical(source.path);await mkdir(path.dirname(file),{recursive:true,mode:0o700});await writeFile(file,source.text,{mode:0o600,flag:'wx'});}
  for(const directory of record.graph.directories)await mkdir(physical(directory.path),{recursive:true,mode:0o700});
  assertPostgresqlGraphArchive(record);graph=await postgresqlConfigGraph(record.target,{base,ownerUid:process.getuid?.()});
  if(graph.version!==record.graph.version)fail();await assertPostgresqlConfigGraph(graph);
  return {base,graph,scope:'private-archive-config-copy',operatingConfigurationChanged:false,operatingServiceChanged:false,cleanup};
 }catch(error){await cleanup();throw error;}
}
export async function inspectPostgresqlGraphArchive(value:unknown,{validationUid=65534,validationGid=65534,validate}:Pick<InspectionOptions,'validationUid'|'validationGid'|'validate'>={}){
 const record=assertPostgresqlGraphArchive(value),bundle=await postgresqlArchiveCandidate(record);
 try{const result=await inspectPostgresqlConfiguration(record.target,{base:bundle.base,ownerUid:process.getuid?.(),validationUid,validationGid,...(validate?{validate}:{})});assertPostgresqlGraphArchive(record);await assertPostgresqlConfigGraph(bundle.graph);if(result.graphVersion!==record.graph.version)fail();return {...result,source:'private-graph-archive'};}
 finally{await bundle.cleanup();}
}
