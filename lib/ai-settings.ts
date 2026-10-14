import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
export type AiProtocol = 'responses'|'chat-completions'|'anthropic'|'gemini';
export type AiConfiguration = {reasoningEffort: string;serviceTier: string;provider: string;protocol: AiProtocol;endpoint: string;model: string;enabled: boolean;apiKey: string};
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const protocol=(value: unknown): value is AiProtocol=>typeof value==='string'&&protocols.includes(value);
import {reasoningLevels} from './ai-reasoning.ts';
import {readFileSync,openSync,closeSync,fstatSync,constants,lstatSync} from 'node:fs';
import {mkdir,open,writeFile,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {stateRoot} from './runtime-paths.ts';
const fail=(message: string,status=400)=>Object.assign(Error(message),{status});
const protocols=['responses','chat-completions','anthropic','gemini'];
// API keys use the private authentication storage when configured.
const location=()=>join(process.env.LINUX_AI_SETTINGS_ROOT||process.env.LINUX_AUTH_ROOT||stateRoot(),'ai-settings');
const digest=(value: unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function validateAiSettings(input: unknown): AiConfiguration{
 if(!object(input)||typeof input.enabled!=='boolean'||!protocol(input.protocol)||typeof input.provider!=='string'||!input.provider.trim()||input.provider.length>80||typeof input.model!=='string'||(input.enabled&&!input.model.trim())||(input.model!==''&&! /^[a-zA-Z0-9._:/-]{1,160}$/.test(input.model)))throw fail('AI 업체·API 방식·모델·사용 여부를 확인하세요.');
 let url;try{if(typeof input.endpoint!=='string')throw Error();url=new URL(input.endpoint);}catch{throw fail('AI API 주소를 확인하세요.');}
 if(url.username||url.password||url.search||url.hash||(typeof input.endpoint==='string'?input.endpoint.length:Infinity)>1000||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw fail('API 주소는 HTTPS를 사용하세요. 로컬 서버는 HTTP를 사용할 수 있습니다. 주소에 키를 넣지 마세요.');
 if(typeof input.apiKey!=='string'||input.apiKey.length>4096||/[\r\n\x00]/.test(input.apiKey))throw fail('API 키를 확인하세요.');
 const serviceTier=input.serviceTier||'auto';const allowed=input.protocol==='anthropic'?['auto','standard_only']:input.protocol==='gemini'?['auto']:['auto','default','flex','priority'];if(typeof serviceTier!=='string'||!allowed.includes(serviceTier))throw fail('선택한 API에서 지원하는 처리 우선순위를 선택하세요.');
 const reasoningEffort=input.reasoningEffort||'auto';if(typeof reasoningEffort!=='string'||!reasoningLevels(input).includes(reasoningEffort))throw fail('선택한 모델에서 지원하는 추론 수준을 선택하세요.');
 return {reasoningEffort,serviceTier,provider:input.provider.trim(),protocol:input.protocol,endpoint:url.href.replace(/\/$/,''),model:input.model,enabled:input.enabled,apiKey:input.apiKey};
}
function stored(){
 const dir=location(),file=join(dir,'settings.json');
 try{
  const ds=lstatSync(dir);if(!ds.isDirectory()||ds.isSymbolicLink()||ds.uid!==process.getuid?.()||(ds.mode&0o077))throw fail('AI 설정 저장 경로 권한을 확인하세요.',503);
  const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{const st=fstatSync(fd);if(!st.isFile()||st.nlink!==1||st.uid!==process.getuid?.()||(st.mode&0o077)||st.size>12000)throw fail('AI 설정 저장 파일 권한을 확인하세요.',503);return validateAiSettings(JSON.parse(readFileSync(fd,'utf8')));}finally{closeSync(fd);}
 }catch(e){if(hasErrorCode(e,'ENOENT'))return null;throw fail('AI 설정을 읽을 수 없습니다. 저장 경로와 권한을 확인하세요.',503);}
}
export function aiConfiguration(): AiConfiguration{
 return stored()||{reasoningEffort:'auto',serviceTier:'auto',provider:'OpenAI',protocol:'responses',endpoint:'https://api.openai.com/v1',model:'',enabled:false,apiKey:''};
}
export function aiSettings(snapshot?: AiConfiguration){
 const saved=snapshot||stored(),config=saved||aiConfiguration();
 const {apiKey,...settings}=config;
 return {...settings,configured:Boolean(apiKey)||(settings.protocol==='chat-completions'&&new URL(settings.endpoint).protocol==='http:'),keyConfigured:Boolean(apiKey),version:digest(config),source:saved?'saved':'default'};
}
export async function saveAiSettings(input: unknown){
 if(!object(input)||typeof input.version!=='string'||typeof input.apiKey!=='string'||typeof input.clearKey!=='boolean')throw fail('AI 설정을 다시 조회하세요.');
 const dir=location();await mkdir(dir,{recursive:true,mode:0o700});
 const ds=lstatSync(dir);if(!ds.isDirectory()||ds.isSymbolicLink()||ds.uid!==process.getuid?.()||(ds.mode&0o077))throw fail('AI 설정 저장 경로 권한을 확인하세요.',503);
 let lock: FileHandle;try{lock=await open(join(dir,'save.lock'),'wx',0o600);}catch{throw fail('다른 AI 설정 저장이 진행 중입니다.',409);}
 let temp: string|null|undefined;
 try{
  const previous=aiConfiguration();if(digest(previous)!==input.version)throw fail('AI 설정이 변경됐습니다. 다시 조회하세요.',409);
  const sameDestination=(['provider','protocol','endpoint'] as const).every(key=>input[key]===previous[key]);
  const next=validateAiSettings({...input,apiKey:input.clearKey?'':input.apiKey||(sameDestination?previous.apiKey:'')});
  if(next.enabled&&!next.apiKey&&!(next.protocol==='chat-completions'&&new URL(next.endpoint).protocol==='http:'))throw fail('선택한 업체의 API 키를 입력하세요.');
  temp=join(dir,'settings.'+randomUUID());await writeFile(temp,JSON.stringify(next)+'\n',{flag:'wx',mode:0o600});await rename(temp,join(dir,'settings.json'));temp=null;return aiSettings();
 }finally{if(temp)await unlink(temp).catch(()=>{});await lock.close();await unlink(join(dir,'save.lock'));}
}
