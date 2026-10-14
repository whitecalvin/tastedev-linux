import type {NodeEnvironmentValues} from './node-env.ts';
export type SavedNodeEnvironment = {saved: true; version: string; values: NodeEnvironmentValues; backupId?: string};
function environmentValues(value: unknown): value is NodeEnvironmentValues {
 return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([key,item])=>['environment','port','host','memory','logLevel'].includes(key)&&(typeof item==='string'||typeof item==='number'&&Number.isFinite(item)));
}
// Shared boundary: a failed replacement must never become the GUI's new baseline.
export function requireNodeEnvSaved<T extends object>(result: T): T & SavedNodeEnvironment;
export function requireNodeEnvSaved(result: unknown): SavedNodeEnvironment;
export function requireNodeEnvSaved(result: unknown): SavedNodeEnvironment {
 const data=result!==null&&typeof result==='object'?result as Record<string,unknown>:{};
 if(data.saved!==true||data.failed||typeof data.version!=='string'||!/^[a-f0-9]{64}$/.test(data.version)||!environmentValues(data.values)||(data.backupId!==undefined&&typeof data.backupId!=='string')){
  const id=typeof data.backupId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(data.backupId)?data.backupId:null;
  throw Object.assign(Error('환경 파일 저장 상태를 확인할 수 없습니다. 다시 조회하세요.'+(id?' · 백업 ID: '+id:'')),{status:409});
 }
 return data as SavedNodeEnvironment;
}
export function nodeEnvSavedSnapshot<T extends object>(snapshot: T,result: unknown){const saved=requireNodeEnvSaved(result);return {...snapshot,version:saved.version,values:saved.values,backupId:saved.backupId};}
