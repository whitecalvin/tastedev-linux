declare const rawExecFileSync:typeof import('node:child_process').execFileSync;
declare const childProcess:typeof import('node:child_process');
declare const __filename:string;
declare let adminNativeContext:{fd:number}|null;
type Options=import('node:child_process').ExecFileSyncOptions;
type StdioList=Exclude<import('node:child_process').StdioOptions,string>;

export function execFileSync(binary:string,args:readonly string[]=[],options:Options={}):string|Buffer{
 if(!adminNativeContext)return rawExecFileSync(binary,args,options);
 const stdio:StdioList=typeof options.stdio==='string'||options.stdio===undefined
  ?[options.stdio||'pipe',options.stdio||'pipe',options.stdio||'pipe']:options.stdio.slice(0,3);
 while(stdio.length<3)stdio.push('pipe');
 return rawExecFileSync('/usr/bin/node',[__filename,'--native-lock-supervisor',String(options.timeout||300000),binary,...args],{...options,stdio:[...stdio,adminNativeContext.fd]});
}
export function run(binary:string,args:readonly string[],timeout=300000):string{
 const active=adminNativeContext,command=active?'/usr/bin/node':binary;
 const parameters=active?[__filename,'--native-lock-supervisor',String(timeout),binary,...args]:args;
 const result=childProcess.spawnSync(command,parameters,{
  encoding:'utf8',timeout,maxBuffer:2*1024*1024,stdio:active?['pipe','pipe','pipe',active.fd]:['pipe','pipe','pipe'],
  env:{PATH:'/usr/sbin:/usr/bin:/sbin:/bin',HOME:'/root',LANG:'C.UTF-8',NODE_ENV:'production',DEBIAN_FRONTEND:'noninteractive',NEEDRESTART_MODE:'l'}
 });
 if(result.error)throw result.error;
 const logs=(result.stdout||'')+(result.stderr||'');
 if(result.status!==0)throw Object.assign(Error('Native command failed'+(logs?'\n'+logs:'')),{status:result.status,signal:result.signal});
 return logs;
}
