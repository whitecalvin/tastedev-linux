import type {MariaDBCandidate} from './mariadb-candidate.ts';
import type {MariaDBApplyOptions} from './mariadb-apply.ts';
type ValidationOptions={base?:string;validate?:(candidate:MariaDBCandidate)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {createHash} from 'node:crypto';
import {prepareMariaDBCode,mariadbCodeReviewVersion} from './mariadb-code-request.ts';
import {mariadbTopology} from './mariadb-topology.ts';
import {mariadbCandidate,assertMariaDBCandidate} from './mariadb-candidate.ts';
import {inspectMariaDBSandboxCandidate} from './mariadb-sandbox-validation.ts';
import {applyMariaDBConfig} from './mariadb-apply.ts';
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const stale:()=>never=()=>{throw Object.assign(Error('MariaDB 코드 기준 파일 또는 include 연결이 변경되었습니다.'),{status:409});};
async function current(input:ReturnType<typeof prepareMariaDBCode>,base:string){const graph=await mariadbTopology(input.root,base);if(!graph.complete||input.graphVersion&&graph.version!==input.graphVersion||graph.files.find(file=>file.path===input.path)?.version!==input.version)stale();return graph;}
// Trusted helper/fixture dependencies; never supplied through the HTTP boundary.
export async function mariadbCodeOperationPlan(input:unknown,{base='/etc/mysql',validate=inspectMariaDBSandboxCandidate}:ValidationOptions={}){
 const prepared=prepareMariaDBCode(input),graph=await current(prepared,base);let candidate:MariaDBCandidate|undefined;
 try{
  const next=await mariadbTopology(prepared.root,base,new Map([[prepared.path,prepared.text]]));if(!next.complete)stale();
  candidate=await mariadbCandidate({root:prepared.root,target:prepared.path,version:graph.version,changes:{},restoreText:prepared.text},base);
  const result=await validate(candidate);await assertMariaDBCandidate(candidate);
  if(!object(result)||result.valid!==true||result.scope!=='private-options-validation'||result.namespaceCommandsCompleted!==true||result.operatingConfigurationChanged!==false||result.operatingServiceChanged!==false||(result.validationMode!=='configuration'&&result.validationMode!=='options-help'))throw Error('Invalid validation');
  await current({...prepared,graphVersion:graph.version},base);const after=await mariadbTopology(prepared.root,base,new Map([[prepared.path,prepared.text]]));if(!after.complete||after.version!==next.version)stale();
  const code={...prepared,graphVersion:graph.version,candidateGraphVersion:next.version};
  return {root:prepared.root,path:prepared.path,version:prepared.version,graphVersion:graph.version,candidateGraphVersion:next.version,draftVersion:digest(prepared.text),reviewVersion:mariadbCodeReviewVersion(code),changed:prepared.version!==digest(prepared.text),validation:{valid:true,scope:'private-options-validation',mode:result.validationMode,operatingConfigurationChanged:false,operatingServiceChanged:false,operationalResourcesVerified:false},operatingConfigurationChanged:false,operatingServiceChanged:false};
 }catch(error){const status=object(error)?error.status:undefined;throw Object.assign(Error(status===409?'MariaDB 코드 기준 파일 또는 include 연결이 변경되었습니다.':'MariaDB 격리 설정 검수가 실패했습니다.'),{status:status===409?409:400});}
 finally{await candidate?.cleanup();}
}
export async function applyMariaDBCodeOperation(input:unknown,{base='/etc/mysql',backupRoot,run,inspectService,candidateInspector=inspectMariaDBSandboxCandidate}:MariaDBApplyOptions={}){
 const prepared=prepareMariaDBCode(input,true);await current(prepared,base);
 const next=await mariadbTopology(prepared.root,base,new Map([[prepared.path,prepared.text]]));if(!next.complete||next.version!==prepared.candidateGraphVersion)stale();
 return applyMariaDBConfig({root:prepared.root,target:prepared.path,version:prepared.graphVersion,changes:{},confirm:true},{base,backupRoot,run,inspectService,candidateInspector,restoreText:prepared.text,expectedCandidateGraphVersion:prepared.candidateGraphVersion});
}
