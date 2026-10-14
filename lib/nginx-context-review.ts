const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {nginxValidationLocale} from './nginx-locale.ts';
const fail: (status?:number)=>never=(status=400)=>{throw Object.assign(Error('Review the current nginx service and locale context'),{status});};
// Explicit administrator attestation, not proof of observed live libc state.
// Actual service identity/graph are trusted helper observations, never HTTP values.
export function nginxContextReview(input:unknown,scope:unknown,graphVersion:unknown){
 if(!object(input)||input.confirm!==true||Object.keys(input).some(key=>!['confirm','pid','start','graphVersion','locale'].includes(key))||typeof input.pid!=='number'||!Number.isInteger(input.pid)||input.pid<=0||typeof input.start!=='string'||!/^\d+$/.test(input.start)||typeof input.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.graphVersion))fail();
 const locale=nginxValidationLocale(input.locale);
 if(!object(scope)||scope.identityVerified!==true||scope.service!=='nginx.service'||scope.main!=='/etc/nginx/nginx.conf'||scope.pid!==input.pid||scope.start!==input.start||graphVersion!==input.graphVersion)fail(409);
 return Object.freeze({...scope,identityVerified:true as const,service:'nginx.service' as const,main:'/etc/nginx/nginx.conf' as const,pid:input.pid,start:input.start,locale,collation:locale.LC_ALL||locale.LC_COLLATE||locale.LANG||'C',localeVerified:true,localeVerification:'administrator-attested',liveLibcLocaleVerified:false});
}
export function reviewedNginxInspector(review:unknown,{inspect,readGraph,candidateVersion}:{inspect?:()=>unknown|Promise<unknown>;readGraph?:()=>Promise<{complete:boolean;version:string}>;candidateVersion?:string}={}){
 if(!object(review)||typeof review.graphVersion!=='string'||typeof inspect!=='function'||typeof readGraph!=='function'||candidateVersion!==undefined&&!/^[a-f0-9]{64}$/.test(candidateVersion))fail();return async()=>{const before=await readGraph(),scope=await inspect(),after=await readGraph();if(!before.complete||!after.complete||before.version!==after.version||![review.graphVersion,candidateVersion].includes(after.version))fail(409);const attested=nginxContextReview(review,scope,review.graphVersion);return Object.freeze({...attested,observedGraphVersion:after.version});};
}
