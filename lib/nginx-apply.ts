import type {NginxCandidate} from './nginx-candidate.ts';
type Hook=()=>unknown|Promise<unknown>;
export type NginxApplyOptions={base?:string;backupRoot?:string;inspectService?:Hook;validateOperational?:Hook;activate?:Hook;recover?:Hook;validatePrepared?:(bundle:NginxCandidate)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {nginxTopology,assertNginxGraphVersion} from './nginx-topology.ts';
import {nginxCandidate,assertNginxCandidate} from './nginx-candidate.ts';
import {validateNginxCandidate} from './nginx-candidate-validation.ts';
import {updateNginxFile} from './nginx-file-update.ts';
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
// Trusted orchestration only. Operational validation and service hooks have no
// default; isolated syntax success alone cannot authorize a reload.
export async function applyNginxConfiguration(input:unknown,{base='/etc/nginx',backupRoot,inspectService,validateOperational,activate,recover,validatePrepared=validateNginxCandidate}:NginxApplyOptions={}){
 if(!object(input)||typeof input.path!=='string'||typeof input.text!=='string'||input.confirm!==true||Object.keys(input).some(key=>!['path','text','version','graphVersion','confirm'].includes(key))||typeof inspectService!=='function'||typeof validateOperational!=='function'||typeof activate!=='function'||typeof recover!=='function'||typeof validatePrepared!=='function')fail('Reviewed nginx graph and operational checks are required');
 const configuration={path:input.path,text:input.text,version:input.version,graphVersion:input.graphVersion};
 const original=await assertNginxGraphVersion(configuration.graphVersion,base),selected=original.files.find(file=>file.path===configuration.path||file.resolved===configuration.path);
 if(!selected||selected.version!==configuration.version)fail('Selected nginx configuration changed or is not included',409);
 const overrides=new Map([[configuration.path,configuration.text]]),expected=await nginxTopology(base,overrides);if(!expected.complete)fail('Resolve nginx candidate include connections',409);
 let bundle:NginxCandidate|undefined;
 const inspect=async(phase:'original'|'candidate')=>{if(bundle)await assertNginxCandidate(bundle);const version=phase==='original'?original.version:expected.version;await assertNginxGraphVersion(version,base);await inspectService();await assertNginxGraphVersion(version,base);if(bundle)await assertNginxCandidate(bundle);}
 try{return await updateNginxFile({path:configuration.path,text:configuration.text,version:configuration.version,confirm:true},{base,backupRoot,
  inspectGraph:({phase})=>inspect(phase),
  validatePrepared:async()=>{bundle=await nginxCandidate({version:original.version,target:configuration.path,text:configuration.text},base);if(bundle.candidateVersion!==expected.version)fail('Nginx candidate graph changed',409);await assertNginxCandidate(bundle);await validatePrepared(bundle);await assertNginxCandidate(bundle);await assertNginxGraphVersion(original.version,base);},
  activate:async()=>{await validateOperational();await inspect('candidate');await activate();},
  recover:async()=>{await validateOperational();await inspect('original');await recover();}
 });}finally{await bundle?.cleanup();}
}
