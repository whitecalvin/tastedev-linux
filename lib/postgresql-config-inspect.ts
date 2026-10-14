import type {PostgresqlGraphOptions} from './postgresql-config-graph.ts';
import type {PostgresqlConfigCandidate} from './postgresql-config-candidate.ts';
type InspectionOptions=PostgresqlGraphOptions&{validationUid?:number;validationGid?:number;validate?:(candidate:PostgresqlConfigCandidate)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {postgresqlConfigGraph,assertPostgresqlConfigGraph} from './postgresql-config-graph.ts';
import {postgresqlConfigCandidate,assertPostgresqlConfigCandidate} from './postgresql-config-candidate.ts';
import {inspectPostgresqlConfigCandidate} from './postgresql-config-validation.ts';
const fail:(message?:string,status?:number)=>never=(message='PostgreSQL 격리 설정 검수가 실패했습니다.',status=400)=>{throw Object.assign(Error(message),{status});};
// Internal coordinator. All filesystem/account/executor dependencies are trusted
// helper configuration or fixtures, not JSON request fields.
export async function inspectPostgresqlConfiguration(root:unknown,{base='/etc',ownerUid,overrides=new Map(),validationUid=65534,validationGid=65534,validate=inspectPostgresqlConfigCandidate}:InspectionOptions={}){
 const graph=await postgresqlConfigGraph(root,{base,ownerUid,overrides});let candidate:PostgresqlConfigCandidate|undefined;
 try{candidate=await postgresqlConfigCandidate(graph,{validationUid,validationGid});const result=await validate(candidate);await assertPostgresqlConfigCandidate(candidate);await assertPostgresqlConfigGraph(graph);
  if(!object(result)||result.valid!==true||result.scope!=='private-config-options'||result.namespaceCommandsCompleted!==true||result.namespaceUid!==validationUid||result.namespaceGid!==validationGid||result.operatingConfigurationChanged!==false||result.operatingServiceChanged!==false||result.postmasterStarted!==false)fail();
  const values:Record<string,string>={};for(const key of ['port','max_connections','shared_buffers','work_mem','logging_collector']){const value=object(result.values)?result.values[key]:undefined;if(typeof value!=='string'||(key==='logging_collector'?!/^(on|off)$/.test(value):!/^\d{1,15}$/.test(value)))fail();values[key]=value;}
  return {valid:true,root:graph.root,graphVersion:graph.version,files:graph.files,directories:graph.directories,missing:graph.missing,values,scope:'private-config-options',engine:'postgres-config-read',namespaceUid:validationUid,namespaceGid:validationGid,namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,operationalResourcesVerified:false,autoConfigurationVerified:false};
 }finally{await candidate?.cleanup();}
}
