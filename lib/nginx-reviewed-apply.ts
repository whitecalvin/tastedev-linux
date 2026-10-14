import type {NginxOperationDependencies} from './nginx-operation-hooks.ts';
export type ReviewedNginxOptions=NginxOperationDependencies&{base?:string;backupRoot?:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {nginxTopology,assertNginxGraphVersion} from './nginx-topology.ts';
import {nginxContextReview,reviewedNginxInspector} from './nginx-context-review.ts';
import {inspectNginxService} from './nginx-service-inspect.ts';
import {nginxOperationHooks} from './nginx-operation-hooks.ts';
import {applyNginxConfiguration} from './nginx-apply.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Reviewed nginx configuration and service context are required'),{status:400});};
// Trusted helper composition. Caller authorization must precede this function.
// base/backupRoot/inspect/runCommand are internal dependencies, never HTTP fields.
export async function applyReviewedNginx(input:unknown,{base='/etc/nginx',backupRoot,inspect=inspectNginxService,runCommand}:ReviewedNginxOptions={}){
 if(!object(input)||typeof input.path!=='string'||typeof input.text!=='string'||Object.keys(input).some(key=>!['path','text','version','graphVersion','confirm','review'].includes(key))||input.confirm!==true||!object(input.review)||input.review.graphVersion!==input.graphVersion)fail();
 const snapshot=structuredClone(input);if(typeof snapshot.path!=='string'||typeof snapshot.text!=='string')fail();
 const review=snapshot.review,configuration={path:snapshot.path,text:snapshot.text,version:snapshot.version,graphVersion:snapshot.graphVersion,confirm:true};
 const original=await assertNginxGraphVersion(configuration.graphVersion,base);
 const observed=await inspect();
 nginxContextReview(review,observed,original.version);
 await assertNginxGraphVersion(original.version,base);
 const candidate=await nginxTopology(base,new Map([[configuration.path,configuration.text]]));
 if(!candidate.complete)throw Object.assign(Error('Resolve nginx candidate include connections'),{status:409});
 const reviewed=reviewedNginxInspector(review,{inspect,readGraph:()=>nginxTopology(base),candidateVersion:candidate.version});
 const hooks=nginxOperationHooks({inspect:reviewed,...(runCommand?{runCommand}:{})});
 return applyNginxConfiguration(configuration,{base,backupRoot,...hooks});
}
