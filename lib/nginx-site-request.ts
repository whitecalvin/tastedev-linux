export type NginxSiteRequest={path:string;link:string;enabled:boolean;sitesVersion:string;graphVersion:string;confirm?:true;review?:unknown};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const site=/^\/etc\/nginx\/sites-available\/([a-zA-Z0-9][a-zA-Z0-9_.-]*)$/;
const alias=/^\/etc\/nginx\/sites-enabled\/([a-zA-Z0-9][a-zA-Z0-9_.-]*)$/;
const version=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function prepareNginxSite(input:unknown,apply=false):NginxSiteRequest{
 if(!object(input)||Object.keys(input).some(key=>!['path','link','enabled','sitesVersion','graphVersion',...(apply?['confirm','review']:[])].includes(key))||typeof input.path!=='string'||!site.test(input.path)||typeof input.link!=='string'||!alias.test(input.link)||typeof input.enabled!=='boolean'||!version(input.sitesVersion)||!version(input.graphVersion)||(apply&&(input.confirm!==true||!object(input.review)||input.review.graphVersion!==input.graphVersion)))fail('사이트와 연결 대상의 최신 버전을 검토하세요.',400);
 return structuredClone({path:input.path,link:input.link,enabled:input.enabled,sitesVersion:input.sitesVersion,graphVersion:input.graphVersion,...(apply?{confirm:true as const,review:input.review}:{})});
}
export function prepareNginxSiteRecovery(input:unknown){
 if(!object(input)||Object.keys(input).some(key=>!['graphVersion','confirm','review'].includes(key))||!version(input.graphVersion)||input.confirm!==true||!object(input.review)||input.review.graphVersion!==input.graphVersion)fail('사이트 연결 복구를 검토하세요.');
 return structuredClone({graphVersion:input.graphVersion,confirm:true as const,review:input.review});
}
