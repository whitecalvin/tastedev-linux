import type {NginxTopology} from './nginx-topology.ts';
type ContextDependencies={readGraph?:()=>Promise<NginxTopology>;inspectService?:()=>unknown|Promise<unknown>;readSites?:(graph:NginxTopology)=>unknown|Promise<unknown>;readSiteRecovery?:()=>Promise<Record<string,unknown>>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {nginxTopology} from './nginx-topology.ts';
import {inspectNginxService} from './nginx-service-inspect.ts';
import {inspectNginxSites} from './nginx-sites.ts';
import {nginxSiteRecoveryPlan} from './nginx-site-operation.ts';
// Read-only helper result: no config source, arguments or unrelated environment.
export async function inspectNginxContext({readGraph=nginxTopology,inspectService=inspectNginxService,readSites=inspectNginxSites,readSiteRecovery=nginxSiteRecoveryPlan}:ContextDependencies={}){
 const before=await readGraph();let service;
 try{const scope=await inspectService();if(!object(scope))throw Error();service={ready:true,...Object.fromEntries(['mode','main','prefix','pid','start','processTitle','identityVerified','locale','collation','localeVerified','service'].filter(key=>Object.hasOwn(scope,key)).map(key=>[key,scope[key]]))};}catch{service={ready:false,reason:'Nginx service identity is unavailable or requires review'};}
 let sites;try{sites=await readSites(before);}catch{sites={ready:false,reason:'Nginx site inventory requires review',operatingConfigurationChanged:false};}
 let siteRecovery;try{siteRecovery={ready:true,...await readSiteRecovery()};}catch{siteRecovery={ready:false,recoveryRequired:true};}
 const graph=await readGraph();if(before.version!==graph.version)throw Object.assign(Error('Nginx configuration changed during inspection'),{status:409});
 return {graph,service,sites,siteRecovery,operatingConfigurationChanged:false};
}
