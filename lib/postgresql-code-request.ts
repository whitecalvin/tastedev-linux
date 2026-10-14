const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {createHash} from 'node:crypto';import {postgresqlConfigRoot} from './postgresql-config-graph.ts';
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 코드와 적용 검토를 다시 확인하세요.'),{status:400});};
export const postgresqlCodeReviewVersion=(input:{path?:unknown;version?:unknown;graphVersion?:unknown;candidateGraphVersion?:unknown;serviceVersion?:unknown;text?:unknown})=>createHash('sha256').update(JSON.stringify([input.path,input.version,input.graphVersion,input.candidateGraphVersion,input.serviceVersion,input.text])).digest('hex');
export function preparePostgresqlCode(input:unknown,commit=false){
 if(!object(input)||Object.keys(input).some(key=>!['path','version','graphVersion','candidateGraphVersion','serviceVersion','text','reviewVersion','confirm'].includes(key))||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||typeof input.text!=='string'||Buffer.byteLength(input.text)>262144||input.text.includes('\0')||/\r(?!\n)/.test(input.text))fail();postgresqlConfigRoot(input.path);
 if(typeof input.path!=='string')fail();
 for(const key of ['graphVersion','candidateGraphVersion','serviceVersion'] as const)if(input[key]!==undefined&&(typeof input[key]!=='string'||!/^[a-f0-9]{64}$/.test(input[key])))fail();
 const request={path:input.path,version:input.version,text:input.text,...(typeof input.graphVersion==='string'?{graphVersion:input.graphVersion}:{}),...(typeof input.candidateGraphVersion==='string'?{candidateGraphVersion:input.candidateGraphVersion}:{}),...(typeof input.serviceVersion==='string'?{serviceVersion:input.serviceVersion}:{})};
 const reviewVersion=postgresqlCodeReviewVersion(request);
 if(commit&&(input.confirm!==true||!['graphVersion','candidateGraphVersion','serviceVersion'].every(key=>typeof input[key]==='string')||input.reviewVersion!==reviewVersion))fail();
 return {...request,...(commit?{reviewVersion,confirm:true}:{})};
}
