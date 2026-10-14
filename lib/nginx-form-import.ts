import type {NginxConfigInput} from './nginx-config.ts';
import type {NginxAstNode} from './nginx-syntax.ts';
export type NginxCurrentSite = {domain: string; version: string; enabled: boolean; config: string};
type ShapeNode = {kind: NginxAstNode['kind']; label: string; children: ShapeNode[]};
import {managedSiteForm,mergeHttpsLocation} from './site-form.ts';
import {nginxConfig,domainName} from './nginx-config.ts';
import {parseNginxTree} from './nginx-syntax.ts';
const shape=(text: string)=>JSON.stringify(parseNginxTree(text).map(function node(item: NginxAstNode): ShapeNode{return {kind:item.kind,label:item.label.trim(),children:item.children.map(node)};}));
export function nginxDraftForm(source: string,previous: string,domain: string){
 const form=managedSiteForm(source,domain);if(!form)throw Error('이 초안은 server 편집 폼으로 변환할 수 없습니다.');
 const generated=nginxConfig(form),expected=form.https?mergeHttpsLocation(generated,previous,form):generated;
 if(shape(source)!==shape(expected))throw Error('폼에서 지원하지 않는 설정 변경이 있습니다. 초안 다운로드로 검토하세요.');
 return form;
}

export function nginxFormAvailability(config: string,domain: string){
 try{return {form:nginxDraftForm(config,config,domain),editWarning:null};}
 catch{return {form:null,editWarning:'이 파일에는 GUI 폼이 보존하지 못하는 설정이 있습니다. 트리에서 원본을 확인하고 초안으로 편집하세요.'};}
}

export function nginxExistingPlan(input: NginxConfigInput,current: NginxCurrentSite | null | undefined){
 const next=nginxConfig(input),domain=domainName(input.domain);
 const conflict=(message: string)=>Object.assign(new Error(message),{status:409});
 if(!current){if(input.version)throw conflict('운영 설정이 없어졌습니다. 다시 조회하세요.');return {config:next};}
 if(current.domain!==domain||input.version!==current.version)throw conflict('운영 설정을 먼저 편집 폼으로 불러오거나 최신 버전을 다시 조회하세요.');
 if(!current.enabled)throw conflict('비활성 블록은 먼저 활성화한 뒤 편집하세요.');
 let form;try{form=nginxDraftForm(current.config,current.config,domain);}catch{throw conflict('현재 운영 파일에 폼에서 보존할 수 없는 설정이 있습니다. 트리와 원본 설정을 검토하세요.');}
 return {config:form.https?mergeHttpsLocation(next,current.config,input):next};
}
