import {hasErrorCode} from './error-code.ts';
import type {NodeServiceOptions} from './node-app-unit.ts';
export type NodeServiceOperation = 'start'|'stop'|'restart'|'enable'|'disable';
export type NodeServiceDependencies = {callerUid?: number;directory?: string;backupRoot?: string;ownerUid?: number;verifyContext?: ()=>unknown|Promise<unknown>;readUnit?: (unit: string)=>Promise<string>;inspectManager?: (unit: string)=>unknown|Promise<unknown>;perform?: (operation: NodeServiceOperation|'daemon-reload',unit: string)=>unknown|Promise<unknown>;validateUnit?: (file: string)=>unknown|Promise<unknown>;reloadManager?: ()=>unknown|Promise<unknown>};
type ServiceInspection = {registered:false;unit:string}|{registered:true;unit:string;serviceOptions:NodeServiceOptions;unitVersion:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {createHash} from 'node:crypto';
import {nodeAppProfile} from './node-app-profile.ts';
import {nodeAppUnit,nodeAppServiceOptions} from './node-app-unit.ts';
const fail: (message:string,status?:number)=>never=(message,status=409)=>{throw Object.assign(Error(message),{status});};
const operations=new Set<string>(['start','stop','restart','enable','disable']);
const isOperation=(value:unknown):value is NodeServiceOperation=>typeof value==='string'&&operations.has(value);
export function nodeAppInstalledOptions(text: unknown): NodeServiceOptions{
 if(typeof text!=='string'||text.length>65536)fail('Invalid installed Node service');
 const restart=[...text.matchAll(/^Restart=(no|on-failure|always)$/gm)],seconds=[...text.matchAll(/^RestartSec=([0-9]{1,3})$/gm)],stop=[...text.matchAll(/^TimeoutStopSec=([0-9]{1,3})$/gm)];
 if(restart.length!==1||seconds.length!==1||stop.length>1)fail('Installed Node service requires review');
 return nodeAppServiceOptions({restart:restart[0][1],restartSeconds:seconds[0][1],stopSeconds:stop[0]?.[1]??null});
}
// Trusted helper orchestration. Never controls an arbitrary unit or accepts commands.
export async function controlNodeAppService(input: unknown,{callerUid,verifyContext,readUnit,inspectManager,perform}: NodeServiceDependencies={}){
 if(!object(input)||input.confirm!==true||!isOperation(input.operation)||typeof verifyContext!=='function'||typeof readUnit!=='function'||typeof inspectManager!=='function'||typeof perform!=='function')fail('Node service operation and confirmation required',400);
 if(typeof callerUid!=='number'||!Number.isInteger(callerUid)||callerUid<=0||input.uid!==callerUid)fail('Service account must match caller',403);
 const operation=input.operation,profile=nodeAppProfile(input.profile),unit=profile.unit,safeStop=['stop','disable'].includes(input.operation),options=safeStop?nodeAppInstalledOptions(await readUnit(unit)):input.options,expected='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,callerUid,options);
 const checkFile=async()=>{const current=await readUnit(unit);if(current!==expected)fail('Installed Node service differs from the reviewed settings');}
 const checkManager=async()=>{const status=await inspectManager(unit);if(!object(status)||status.LoadState!=='loaded'||status.FragmentPath!=='/etc/systemd/system/'+unit||status.User!==String(callerUid)||status.DropInPaths!=='')fail('Node service manager configuration requires review');}
 await verifyContext();await checkFile();
 // Reload before checking effective state so a stale cached unit cannot be used.
 await perform('daemon-reload',unit);await checkFile();await checkManager();await verifyContext();
 await checkFile();await perform(operation,unit);await checkFile();await checkManager();
 return {changed:true,unit,operation};
}

export async function inspectNodeAppService(input: unknown,{callerUid,readUnit}: NodeServiceDependencies={}): Promise<ServiceInspection>{
 if(typeof callerUid!=='number'||!Number.isInteger(callerUid)||callerUid<=0||!object(input)||input.uid!==callerUid||typeof readUnit!=='function')fail('Service account must match caller',403);
 const profile=nodeAppProfile(input.profile);let text;
 try{text=await readUnit(profile.unit);}catch(error){if(hasErrorCode(error,'ENOENT'))return {registered:false,unit:profile.unit};throw error;}
 const serviceOptions=nodeAppInstalledOptions(text),expected='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,callerUid,serviceOptions);
 if(text!==expected)fail('Installed Node service differs from the registered app');
 if(await readUnit(profile.unit)!==text)fail('Installed Node service changed during inspection');
 return {registered:true,unit:profile.unit,serviceOptions,unitVersion:createHash('sha256').update(text).digest('hex')};
}
