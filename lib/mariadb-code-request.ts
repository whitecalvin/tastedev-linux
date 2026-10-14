const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {createHash} from 'node:crypto';
const fail:()=>never=()=>{throw Object.assign(Error('MariaDB 코드와 적용 검토를 다시 확인하세요.'),{status:400});};
export const mariadbCodeReviewVersion=(input:{root?:unknown;path?:unknown;version?:unknown;graphVersion?:unknown;candidateGraphVersion?:unknown;text?:unknown})=>createHash('sha256').update(JSON.stringify([input.root,input.path,input.version,input.graphVersion,input.candidateGraphVersion,input.text])).digest('hex');
export function prepareMariaDBCode(input:unknown,commit=false){
 if(!object(input)||Object.keys(input).some(key=>!['root','path','version','graphVersion','candidateGraphVersion','text','reviewVersion','confirm'].includes(key))||typeof input.root!=='string'||!['/etc/mysql/my.cnf','/etc/mysql/mariadb.cnf'].includes(input.root)||typeof input.path!=='string'||!/^\/etc\/mysql\/(?:my\.cnf|mariadb\.cnf|(?:mariadb\.conf\.d|conf\.d)\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*\.cnf)$/.test(input.path)||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||typeof input.text!=='string'||Buffer.byteLength(input.text)>262144||input.text.includes('\0')||/\r(?!\n)/.test(input.text))fail();
 for(const key of ['graphVersion','candidateGraphVersion'])if(input[key]!==undefined&&(typeof input[key]!=='string'||!/^[a-f0-9]{64}$/.test(input[key])))fail();
 const request={root:input.root,path:input.path,version:input.version,text:input.text,...(typeof input.graphVersion==='string'?{graphVersion:input.graphVersion}:{}),...(typeof input.candidateGraphVersion==='string'?{candidateGraphVersion:input.candidateGraphVersion}:{})},reviewVersion=mariadbCodeReviewVersion(request);
 if(commit&&(input.confirm!==true||typeof input.graphVersion!=='string'||typeof input.candidateGraphVersion!=='string'||input.reviewVersion!==reviewVersion))fail();
 return {...request,...(commit?{reviewVersion,confirm:true}:{})};
}
