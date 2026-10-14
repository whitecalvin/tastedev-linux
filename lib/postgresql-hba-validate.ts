import type {PostgresqlHbaGraph} from './postgresql-hba-graph.ts';
type ValidationOptions={base?:string;ownerUid?:number;runCandidate?:(graph:PostgresqlHbaGraph,sources:Map<string,string>,major:number)=>Promise<Record<string,unknown>>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {postgresqlHbaGraph,postgresqlHbaRoot} from './postgresql-hba-graph.ts';
import {runPostgresqlHbaCandidate} from './postgresql-hba-sandbox.ts';
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export function preparePostgresqlHbaValidation(input:unknown){
 if(!object(input)||typeof input.path!=='string'||Object.keys(input).some(key=>!['path','version','text'].includes(key)))fail('접속 규칙 검수 요청을 확인하세요.');
 postgresqlHbaRoot(input.path);
 const major=Number(input.path.split('/')[3]);if(!Number.isInteger(major)||major<15||major>99)fail('PostgreSQL 15 이상에서 접속 규칙 검수를 지원합니다.');
 if(typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||input.text!==undefined&&(typeof input.text!=='string'||input.text.includes('\0')||Buffer.byteLength(input.text)>262144))fail('접속 규칙 코드와 조회 버전을 확인하세요.');
 return {path:input.path,version:input.version,...(typeof input.text==='string'?{text:input.text}:{})};
}
// Dependencies are trusted fixture hooks, never extracted from request fields.
export async function validatePostgresqlHba(input:unknown,{base='/etc',ownerUid,runCandidate=runPostgresqlHbaCandidate}:ValidationOptions={}){
 const request=preparePostgresqlHbaValidation(input),sources=new Map<string,string>(),options={base,ownerUid,sources,override:request.text};
 const graph=await postgresqlHbaGraph(request.path,options),root=graph.files.find(file=>file.path===request.path);
 if(!root||root.sourceVersion!==request.version)fail('접속 규칙 파일이 변경되었습니다. 다시 조회하세요.',409);
 if(!graph.complete)return {valid:false,engine:'postgresql-hba-snapshot',ruleCount:0,diagnostics:graph.warnings.map(item=>({path:item.path,line:item.line??1,category:item.reason})),operationalFilesChanged:false,authenticationAttempted:false};
 const result=await runCandidate(graph,sources,Number(request.path.split('/')[3]));
 const after=await postgresqlHbaGraph(request.path,{...options,sources:new Map()});
 if(!after.complete||graph.version!==after.version)fail('검수 중 접속 규칙 파일이 변경되었습니다. 다시 조회하세요.',409);
 return {...result,sourceVersion:root.sourceVersion,draftVersion:root.version,graphVersion:graph.version};
}
