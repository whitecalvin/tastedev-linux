import type {PostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import type {RestoreSnapshot} from './postgresql-graph-restore-snapshot.ts';
import type {PostgresqlRunningService,PostgresqlPublicValues} from './postgresql-code-operation.ts';
import {createHash} from 'node:crypto';
import {assertPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {inspectPostgresqlGraphArchive} from './postgresql-archive-candidate.ts';
import {postgresqlGraphRestoreSnapshot,assertPostgresqlGraphRestoreSnapshot} from './postgresql-graph-restore-snapshot.ts';
import {inspectPostgresqlConfigService} from './postgresql-config-service.ts';
import {assertPostgresqlRunningService,postgresqlServiceScope,postgresqlValidationValues} from './postgresql-code-operation.ts';
import {createPostgresqlGraphRestoreJournal,assertPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-journal.ts';

type InspectService=(target:string)=>unknown|Promise<unknown>;
type ValidateArchive=(archive:PostgresqlGraphArchive)=>unknown|Promise<unknown>;
export type RestoreReviewOptions={base?:string;ownerUid?:number;archiveScope?:unknown;validateArchive?:ValidateArchive;inspectService?:InspectService};
export type RestoreReview={path:string;archiveId:string;archiveGraphVersion:string;snapshotVersion:string;serviceVersion:string;files:RestoreSnapshot['files'];beforeGraphVersion:string;beforeGraphComplete:boolean;fields:{key:string;before:string;after:string}[];validation:{valid:boolean;scope:string;values:PostgresqlPublicValues;operationalResourcesVerified:boolean;autoConfigurationVerified:boolean};operatingConfigurationChanged:boolean;operatingServiceChanged:boolean;reviewVersion:string};
type RegisteredReview={plan:RestoreReview;proof:string;archive:PostgresqlGraphArchive;snapshot:RestoreSnapshot;service:PostgresqlRunningService;inspect:InspectService;validateArchive:ValidateArchive;base:string;ownerUid:number};
function valueKey(key:string):key is keyof PostgresqlPublicValues{return ['port','max_connections','shared_buffers','work_mem','logging_collector'].includes(key);}
const records=new WeakMap<object,RegisteredReview>(),hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const same=(left:unknown,right:unknown)=>JSON.stringify(left)===JSON.stringify(right);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 검토가 변경되었습니다.'),{status:409});};

// Private coordinator input: archive/scope come from a verified backup, never
// client JSON. A review alone neither stages files nor restarts the service.
export async function reviewPostgresqlGraphRestore(value:unknown,{base='/etc',ownerUid,archiveScope,validateArchive=inspectPostgresqlGraphArchive,inspectService}:RestoreReviewOptions={}){
 const archive=assertPostgresqlGraphArchive(value);
 if(typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<0||typeof validateArchive!=='function'||!archiveScope)fail();
 const inspect=inspectService??(target=>inspectPostgresqlConfigService(target,{ownerUid}));
 if(typeof inspect!=='function')fail();
 const service=assertPostgresqlRunningService(await inspect(archive.target),archive.target);
 // The data/HBA/unit/major/auto.conf scope of the original backup is binding.
 if(!same(postgresqlServiceScope(service),postgresqlServiceScope(archiveScope)))fail();
 const snapshot=await postgresqlGraphRestoreSnapshot(archive,{base,ownerUid});
 const validation=await validateArchive(archive);
 const values=postgresqlValidationValues(validation,archive.graph);
 await assertPostgresqlGraphRestoreSnapshot(snapshot);assertPostgresqlGraphArchive(archive);
 const latest=assertPostgresqlRunningService(await inspect(archive.target),archive.target);
 if(!same(service,latest))fail();
 const draft={path:archive.target,archiveId:archive.id,archiveGraphVersion:archive.graph.version,snapshotVersion:snapshot.version,serviceVersion:hash(service),files:structuredClone(snapshot.files),beforeGraphVersion:snapshot.beforeGraphVersion,beforeGraphComplete:snapshot.beforeGraphComplete,fields:Object.keys(values).filter(valueKey).map(key=>({key,before:service.values[key],after:values[key]})),validation:{valid:true,scope:'private-config-options',values,operationalResourcesVerified:false,autoConfigurationVerified:false},operatingConfigurationChanged:false,operatingServiceChanged:false};
 const plan:RestoreReview={...draft,reviewVersion:hash(draft)};
 records.set(plan,{plan,proof:hash(plan),archive,snapshot,service,inspect,validateArchive,base,ownerUid});
 return plan;
}

function registered(value:unknown){if(typeof value!=='object'||value===null)fail();const record=records.get(value);if(!record||record.proof!==hash(value))fail();return record;}

export async function assertPostgresqlGraphRestoreReview(value:unknown){
 const record=registered(value),plan=record.plan;
 assertPostgresqlGraphArchive(record.archive);await assertPostgresqlGraphRestoreSnapshot(record.snapshot);
 const latest=assertPostgresqlRunningService(await record.inspect(record.archive.target),record.archive.target);
 if(!same(record.service,latest))fail();
 return plan;
}

// Internal execution dependencies remain tied to the registered review.
export function postgresqlGraphRestoreReviewedContext(value:unknown){
 const record=registered(value);
 assertPostgresqlGraphArchive(record.archive);
 const {plan:registeredPlan,...context}=record;return {...context,service:structuredClone(record.service)};
}

// Persist the exact registered snapshot, not a fresh unreviewed filesystem view.
// A post-publication conflict preserves the intent for explicit recovery.
export async function createReviewedPostgresqlGraphRestoreJournal(value:unknown,backupRoot:string){
 const plan=await assertPostgresqlGraphRestoreReview(value);
 const record=registered(plan);
 const serviceContext={format:'postgresql-restore-service-v1',reviewVersion:plan.reviewVersion,serviceVersion:plan.serviceVersion,scope:postgresqlServiceScope(record.service),originalValues:record.service.values,candidateValues:plan.validation.values,pid:record.service.pid,start:record.service.start};
 const journal=await createPostgresqlGraphRestoreJournal(record.snapshot,backupRoot,{serviceContext});
 try{
  await assertPostgresqlGraphRestoreReview(plan);
  await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
  if(journal.record.body.snapshotVersion!==plan.snapshotVersion||journal.record.body.archiveGraphVersion!==plan.archiveGraphVersion||journal.record.body.archiveId!==plan.archiveId)fail();
  return journal;
 }catch(error){
  throw Object.assign(Error('PostgreSQL 복원 준비 기록을 보존했습니다. 다시 검토하세요.'),{status:409,journalId:journal.record.id,intentPreserved:true,cause:error});
 }
}
