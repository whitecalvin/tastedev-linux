type FeaturePolicy = {settings: Record<string,unknown>; available: Record<string,unknown>; privilege: Record<string,unknown> | null};
export type FeatureOptions = {sudo?: boolean};
function record(value: unknown): Record<string,unknown> | null {return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}
function policyValue(value: unknown): FeaturePolicy | null {
 const input=record(value),settings=record(input?.settings),available=record(input?.available),privilege=record(input?.privilege);
 if(!settings||typeof settings.readOnly!=='boolean'||Object.values(settings).some(option=>typeof option!=='boolean'))return null;
 if(input?.available!==undefined&&(!available||Object.values(available).some(option=>typeof option!=='boolean')))return null;
 if(input?.privilege!=null&&!privilege||privilege?.ready!==undefined&&typeof privilege.ready!=='boolean')return null;
 return {settings,available:available||{},privilege};
}
export function featureAllowed(value: unknown,key: string,{sudo=false}: FeatureOptions={}): boolean{
  const policy=policyValue(value);
  return Boolean(policy && policy.settings.readOnly===false && policy.settings[key]===true && policy.available[key]!==false && (!sudo || policy.settings.sudoWithoutPrompt===true && policy.privilege?.ready!==false));
}
export function workPermissionLabel(value: unknown): string{
  const policy=policyValue(value);
  if(!policy)return '권한 설정 확인';
  if(policy.settings.readOnly)return '조회 전용';
  const effective={...policy,available:policy.available||{}};
  const features=['nginxChanges','databaseChanges','certificateChanges','serviceChanges','sudoPolicyChanges','cronChanges','packageInstall','fileEditing','terminal'];
  const withoutSudo=new Set(['cronChanges','fileEditing','terminal']);
  const allowed=features.filter(key=>featureAllowed(effective,key,{sudo:!withoutSudo.has(key)}));
  if(!allowed.length)return '작업 차단';
  return allowed.length===features.length?'작업 허용':'일부 작업 허용';
}
export function featureReason(value: unknown,key: string,{sudo=false}: FeatureOptions={}): string{
  const policy=policyValue(value);
  if(!policy)return '보안 설정을 불러오는 중입니다.';
  if(policy.settings.readOnly)return '조회 전용 모드입니다.';
  if(policy.available[key]===false)return '서버에서 이 기능을 허용하지 않았습니다.';
  if(policy.settings[key]!==true)return '보안 옵션에서 이 기능을 켜세요.';
  if(sudo&&policy.privilege?.ready===false)return typeof policy.privilege.reason==='string'?policy.privilege.reason:'서버에서 이 기능을 허용하지 않았습니다.';
  if(sudo&&policy.settings.sudoWithoutPrompt!==true)return 'sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.';
  return '';
}
export function terminalFeatureMessage(value: unknown): string{
  const input=record(value),settings=record(input?.settings),available=record(input?.available);
  if(available?.terminal===false)return '이 서버에서는 터미널 사용이 꺼져 있습니다. 서버 관리자에게 사용 허용을 요청하세요. 설치 서버는 /etc/tastedev-linux/environment에서 LINUX_ENABLE_TERMINAL=true로 설정한 뒤 tastedev-linux 서비스를 재시작해야 합니다. 기존 터미널 연결이 끊길 수 있으므로 작업을 저장한 뒤 진행하세요.';
  if(settings?.readOnly===true)return '';
  if(settings?.terminal===false)return '웹 터미널 명령 실행이 꺼져 있습니다. 보안 페이지에서 ‘웹 터미널 명령 실행’ 옵션을 켜면 현재 서버 계정으로 명령을 실행할 수 있습니다.';
  return featureReason(value,'terminal');
}
