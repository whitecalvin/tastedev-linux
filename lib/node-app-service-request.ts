import {nodeApps} from './node-apps.ts';
import {nodeAppServicePlan} from './node-app-service-plan.ts';
const fail: (message: string,status?: number)=>never=(message,status=409)=>{throw Object.assign(Error(message),{status});};
export async function prepareNodeServiceInstall(input: Record<string,unknown>){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['id','registryVersion','files','options','confirm'].includes(key))||input.confirm!==true)fail('서비스 등록 확인이 필요합니다.',400);
 if(typeof input.id!=='string'||!(/^[a-z][a-z0-9-]{0,39}$/).test(input.id)||typeof input.registryVersion!=='string'||!(/^[a-f0-9]{64}$/).test(input.registryVersion)||!Array.isArray(input.files)||input.files.length!==2)fail('서비스 설정을 다시 검토하세요.',400);
 const expected=new Map<string,string>();for(const file of input.files){if(!file||typeof file.name!=='string'||typeof file.version!=='string'||!(/^[a-f0-9]{64}$/).test(file.version)||expected.has(file.name))fail('서비스 설정을 다시 검토하세요.',400);expected.set(file.name,file.version);}
 const uid=process.getuid?.()??0;if(uid<=0)fail('앱 서비스는 일반 사용자 계정으로 실행해야 합니다.',403);
 const plan=await nodeAppServicePlan(input.id,input.options);
 if(plan.registryVersion!==input.registryVersion||!Array.isArray(plan.files)||plan.files.length!==expected.size||plan.files.some(file=>expected.get(file.name)!==file.version))fail('서비스 설정을 다시 검토하세요.');
 if(plan.runtime.status!=='ready')fail('Node runtime with environment-file support is required',403);
 const registry=await nodeApps(),profile=registry.apps.find(app=>app.id===input.id);
 if(registry.version!==plan.registryVersion||!profile)fail('서비스 설정을 다시 검토하세요.');
 return {profile,uid,options:plan.serviceOptions,files:plan.files,confirm:true};
}

export async function prepareNodeServiceControl(input: Record<string,unknown>){
 if(!input||typeof input.operation!=='string'||!['start','stop','restart','enable','disable'].includes(input.operation))fail('Invalid Node service operation',400);
 const {operation,...review}=input;
 if(['stop','disable'].includes(operation)){
  if(Object.keys(review).some(key=>!['id','registryVersion','files','options','confirm'].includes(key))||review.confirm!==true||typeof review.id!=='string'||!(/^[a-z][a-z0-9-]{0,39}$/).test(review.id)||typeof review.registryVersion!=='string'||!(/^[a-f0-9]{64}$/).test(review.registryVersion))fail('서비스 설정을 다시 검토하세요.',400);
  const uid=process.getuid?.()??0;if(uid<=0)fail('앱 서비스는 일반 사용자 계정으로 실행해야 합니다.',403);
  const registry=await nodeApps(),profile=registry.apps.find(app=>app.id===review.id);if(registry.version!==review.registryVersion||!profile)fail('서비스 설정을 다시 검토하세요.');
  return {uid,profile,operation,confirm:true};
 }
 return {...await prepareNodeServiceInstall(review),operation};
}

export async function prepareNodeServiceInspection(id: unknown){
 if(typeof id!=='string'||!(/^[a-z][a-z0-9-]{0,39}$/).test(id))fail('등록한 앱을 선택하세요.',400);
 const uid=process.getuid?.()??0;if(uid<=0)fail('앱 서비스는 일반 사용자 계정으로 실행해야 합니다.',403);
 const registry=await nodeApps(),profile=registry.apps.find(app=>app.id===id);if(!profile)fail('등록한 앱을 선택하세요.',404);
 return {uid,profile,registryVersion:registry.version};
}

export async function prepareNodeServiceUpdate(input: Record<string,unknown>){
 if(!input||typeof input.unitVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.unitVersion))fail('등록된 서비스 설정을 다시 가져오세요.',400);
 const {unitVersion,...review}=input;
 return {...await prepareNodeServiceInstall(review),unitVersion};
}

export async function prepareNodeServiceRestore(input: Record<string,unknown>){
 if(!input||typeof input.backupId!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.backupId)||typeof input.backupVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.backupVersion))fail('복원할 서비스 백업을 다시 검토하세요.',400);
 const {backupId,backupVersion,...review}=input;
 return {...await prepareNodeServiceUpdate(review),backupId,backupVersion};
}

export async function prepareNodeServiceRecoveryReview(id: unknown){
 const inspected=await prepareNodeServiceInspection(id),plan=await nodeAppServicePlan(id);
 if(plan.registryVersion!==inspected.registryVersion||plan.runtime?.status!=='ready'||!Array.isArray(plan.files)||plan.files.length!==2)fail('서비스 설정을 다시 검토하세요.');
 return {...inspected,files:plan.files,options:plan.serviceOptions};
}
export async function prepareNodeServiceRecovery(input: Record<string,unknown>){
 if(!input||Array.isArray(input)||Object.keys(input).some(key=>!['id','registryVersion','files','options','confirm','reviewVersion'].includes(key))||typeof input.reviewVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.reviewVersion))fail('서비스 중단 복구를 다시 검토하세요.',400);
 const {reviewVersion,...review}=input;return {...await prepareNodeServiceInstall(review),reviewVersion};
}
