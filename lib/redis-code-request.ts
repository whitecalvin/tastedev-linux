const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {createHash} from 'node:crypto';
const fail:()=>never=()=>{throw Object.assign(Error('Redis 코드와 적용 검토를 다시 확인하세요.'),{status:400});};
export const redisCodeReviewVersion=(input:{path?:unknown;version?:unknown;graphVersion?:unknown;candidateGraphVersion?:unknown;text?:unknown})=>createHash('sha256').update(JSON.stringify([input.path,input.version,input.graphVersion,input.candidateGraphVersion,input.text])).digest('hex');
export function prepareRedisCode(input:unknown,commit=false){
 if(!object(input)||Object.keys(input).some(key=>!['path','version','graphVersion','candidateGraphVersion','text','reviewVersion','confirm'].includes(key))||input.path!=='/etc/redis/redis.conf'||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||typeof input.text!=='string'||Buffer.byteLength(input.text)>262144||input.text.includes('\0')||/\r(?!\n)/.test(input.text))fail();
 if(input.graphVersion!==undefined&&(typeof input.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.graphVersion)))fail();
 if(input.candidateGraphVersion!==undefined&&(typeof input.candidateGraphVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.candidateGraphVersion)))fail();
 const request={path:input.path,version:input.version,text:input.text,...(typeof input.graphVersion==='string'?{graphVersion:input.graphVersion}:{}),...(typeof input.candidateGraphVersion==='string'?{candidateGraphVersion:input.candidateGraphVersion}:{})};
 const reviewVersion=redisCodeReviewVersion(request);
 if(commit&&(input.confirm!==true||typeof request.graphVersion!=='string'||typeof request.candidateGraphVersion!=='string'||input.reviewVersion!==reviewVersion))fail();
 return {...request,...(commit?{reviewVersion,confirm:true}:{})};
}
