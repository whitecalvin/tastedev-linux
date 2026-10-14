import type {FeatureOptions} from './capabilities.ts';
type RestartHelperResult = {scheduled?: boolean; delaySeconds?: number};
export type RestartDependencies = {packaged?: boolean; authorize?: (key: string,options: FeatureOptions) => unknown; settings?: () => {version: string; host: string; port: number}; audit?: (action: string,result: string,force: boolean) => unknown; helper?: (action: string,payload: {unit: string; action: string; confirm: boolean}) => Promise<RestartHelperResult>};
import {networkSettings} from './network-settings.ts';
import {securitySettings,assertFeature,auditEvent} from './security.ts';
import {featureAllowed,featureReason} from './capabilities.ts';
import {runHelper} from './privilege.ts';
const fail=(message: string,status=400)=>Object.assign(Error(message),{status});
export async function appRestartAvailability(){
 const policy=await securitySettings(),packaged=process.env.LINUX_PACKAGED==='true';
 return {restartAvailable:packaged&&featureAllowed(policy,'serviceChanges',{sudo:true}),restartReason:packaged?featureReason(policy,'serviceChanges',{sudo:true}):'재시작 버튼은 deb로 설치한 관리 앱에서 사용할 수 있습니다.'};
}
export async function restartApp(input: unknown,dependencies: RestartDependencies={}){
 const packaged=dependencies.packaged??(process.env.LINUX_PACKAGED==='true');
 if(!packaged)throw fail('개발 서버는 실행한 터미널에서 다시 시작하세요.',403);
 const request=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{};
 if(request.confirm!==true||typeof request.version!=='string'||Object.keys(request).some(key=>!['confirm','version'].includes(key)))throw fail('앱 재시작 안내를 확인하세요.');
 await (dependencies.authorize||assertFeature)('serviceChanges',{sudo:true});
 const settings=(dependencies.settings||networkSettings)();
 if(request.version!==settings.version)throw fail('저장된 접속 설정이 변경됐습니다. 새로고침 후 다시 확인하세요.',409);
 const audit=dependencies.audit||auditEvent;
 await audit('app-restart','requested',true);
 try{
  const result=await (dependencies.helper||runHelper)('service',{unit:'tastedev-linux.service',action:'restart',confirm:true});
  if(!result.scheduled)throw fail('앱 재시작을 예약하지 못했습니다.',503);
  await audit('app-restart','scheduled',true);
  return {scheduled:true,delaySeconds:result.delaySeconds,host:settings.host,port:settings.port};
 }catch(error){await audit('app-restart','failed',false);throw error;}
}
