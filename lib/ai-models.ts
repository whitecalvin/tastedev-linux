import type {AiModel} from './ai-model-order.ts';
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {orderAiModels} from './ai-model-order.ts';
import {aiConfiguration,aiSettings,validateAiSettings} from './ai-settings.ts';
export async function listAiModels(input: Record<string,unknown>,fetcher: typeof fetch=fetch){
 const old=aiConfiguration();const same=(['provider','protocol','endpoint'] as const).every(k=>input?.[k]===old[k]);
 if(same&&!input?.apiKey&&input?.clearKey!==true&&input?.version!==undefined&&input.version!==aiSettings(old).version)throw Object.assign(Error('AI 설정이 변경됐습니다. 다시 조회한 뒤 모델 목록을 갱신하세요.'),{status:409});
 const config=validateAiSettings({...input,model:input?.model||'model-list',reasoningEffort:'auto',enabled:false,apiKey:input?.clearKey===true?'':input?.apiKey||(same?old.apiKey:'')});
 if(!config.apiKey&&new URL(config.endpoint).protocol!=='http:')throw Object.assign(Error('모델 목록을 조회할 업체의 API 키를 입력하세요.'),{status:400});
 const headers: Record<string,string>={};if(config.protocol==='anthropic'){headers['x-api-key']=config.apiKey;headers['anthropic-version']='2023-06-01';}else if(config.protocol==='gemini')headers['x-goog-api-key']=config.apiKey;else if(config.apiKey)headers.Authorization='Bearer '+config.apiKey;
 const models: AiModel[]=[];let cursor: unknown=null;const seen=new Set<string>();let truncated=false;
 for(let page=0;page<10;page++){
  const url=new URL(config.endpoint+'/models');
  if(config.protocol==='anthropic'){url.searchParams.set('limit','100');if(typeof cursor==='string'&&cursor)url.searchParams.set('after_id',cursor);}
  if(config.protocol==='gemini'){url.searchParams.set('pageSize','100');if(typeof cursor==='string'&&cursor)url.searchParams.set('pageToken',cursor);}
  let response;try{response=await fetcher(url.href,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw Object.assign(Error('모델 목록 API에 연결할 수 없습니다. 주소와 네트워크를 확인하세요.'),{status:502});}
  if(!response.ok)throw Object.assign(Error(response.status===401||response.status===403?'모델 조회 권한 또는 API 키를 확인하세요.':response.status===429?'업체의 모델 조회 요청 제한에 도달했습니다. 잠시 후 갱신하세요.':'업체에서 모델 목록을 가져오지 못했습니다.'),{status:502});
  let body: unknown;try{body=await response.json();}catch{throw Object.assign(Error('모델 목록 응답 형식을 확인하세요.'),{status:502});}if(!object(body))throw Object.assign(Error('모델 목록 응답 형식을 확인하세요.'),{status:502});const entries: unknown=config.protocol==='gemini'?body.models:body.data;
  if(!Array.isArray(entries)||entries.length>2000)throw Object.assign(Error('모델 목록 응답 형식을 확인하세요.'),{status:502});
  for(const item of entries){if(!object(item))continue;if(config.protocol==='gemini'&&(!Array.isArray(item.supportedGenerationMethods)||!item.supportedGenerationMethods.includes('generateContent')))continue;if(item.lifecycle==='retired')continue;const id=config.protocol==='gemini'?(typeof item.name==='string'?item.name.replace(/^models\//,''):undefined):item.id;if(typeof id!=='string'||! /^[a-zA-Z0-9._:/-]{1,160}$/.test(id)||models.some(m=>m.id===id))continue;const created=typeof item.created==='number'?item.created:typeof item.created_at==='string'?Date.parse(item.created_at)/1000:0;models.push({id,label:String(item.display_name||item.displayName||id).slice(0,160),...(typeof item.line==='string'?{line:item.line.slice(0,80)}:{}),...(Number.isFinite(created)&&created>0?{created}:{})});}
  cursor=config.protocol==='anthropic'&&body.has_more?body.last_id:config.protocol==='gemini'?body.nextPageToken:null;
  if(!cursor)break;if(typeof cursor!=='string'||seen.has(cursor))throw Object.assign(Error('모델 목록의 페이지 정보가 올바르지 않습니다.'),{status:502});seen.add(cursor);if(page===9)truncated=true;
 }
 return {models:orderAiModels(models),at:new Date().toISOString(),provider:config.provider,truncated};
}
