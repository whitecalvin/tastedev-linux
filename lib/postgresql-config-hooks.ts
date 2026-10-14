import {configProfile} from './config-profiles.ts';
import path from 'node:path';
import {parseLiveConfig} from './config-live.ts';
const names={port:'port',connections:'max_connections',sharedBuffers:'shared_buffers',workMem:'work_mem',logging:'logging_collector'};
const fail:(message:string)=>never=message=>{throw Object.assign(new Error(message),{status:400});};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function postgresqlConfigHooks(target:unknown,changes:unknown,run:(binary:string,args:string[])=>unknown|Promise<unknown>){
 const match=typeof target==='string'&&/^\/etc\/postgresql\/([1-9][0-9]?)\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\/postgresql\.conf$/.exec(target);
 if(!match||typeof run!=='function'||!object(changes)||Object.keys(changes).some(key=>!Object.hasOwn(names,key)))fail('Invalid PostgreSQL configuration target');
 if(!Object.keys(changes).length)fail('Select PostgreSQL configuration changes');
 const requested=changes;
 const execute=run;
 configProfile('postgresql',requested);
 const [,version,cluster]=match,dir=path.dirname(target),binary='/usr/lib/postgresql/'+version+'/bin/postgres';
 const control=(action:string)=>execute('/usr/bin/pg_ctlcluster',[version,cluster,action]);
 const check=async()=>{try{await control('status');}catch{fail('PostgreSQL cluster must be running before applying configuration');}};
 return {
  version,cluster,
  preflight:check,
  validate:async (candidate:unknown)=>{
   if(typeof candidate!=='string'||path.dirname(candidate)!==dir||!/^\.tastedev-config-[a-f0-9-]{36}$/.test(path.basename(candidate)))fail('Invalid PostgreSQL candidate file');
   // -C parses configuration and exits. It does not start a second server.
   for(const [key,value] of Object.entries(requested)){
    const output=await execute('/usr/sbin/runuser',['-u','postgres','--',binary,'-D',dir,'-c','config_file='+candidate,'-C',names[key as keyof typeof names]]);
    if(typeof output!=='string'||output.length>4096)fail('Invalid PostgreSQL validation response');
    const parsed=parseLiveConfig('postgresql',names[key as keyof typeof names]+' = '+output.trim());
    const actual=parsed.values[key];
    if(actual===undefined||(typeof actual==='number'?Number(value)!==actual:value!==actual))fail('PostgreSQL configuration does not resolve to the requested value');
   }
  },
  activate:async()=>{await control('restart');await check();},
  recover:async()=>{await control('restart');await check();}
 };
}
