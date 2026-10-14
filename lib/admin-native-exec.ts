// Root helper context is internal, immutable and never populated from requests.
import {execFile as nativeExecFile,execFileSync as nativeExecFileSync,spawn as nativeSpawn} from 'node:child_process';
import type {ChildProcess,ExecFileOptions,ExecFileSyncOptions,SpawnOptions,StdioOptions} from 'node:child_process';
import {fstatSync} from 'node:fs';
import {promisify} from 'node:util';
type NativeOutput=string|Buffer;
type NativeError=Error&{code?:string|number|null;signal?:NodeJS.Signals|null;killed?:boolean;stdout?:NativeOutput;stderr?:NativeOutput};
type ExecOptions=Omit<ExecFileOptions,'encoding'>&{encoding?:BufferEncoding|'buffer'|null;stdio?:StdioOptions};
type Callback=(error:NativeError|null,stdout:NativeOutput,stderr:NativeOutput)=>void;
type Context={fd:number;helper:string};
function context():Context|null{
 const value:unknown=Reflect.get(globalThis,Symbol.for('tastedev.admin-native-lock'));
 if(!value)return null;
 if(process.getuid?.()!==0||typeof value!=='object'||!Object.isFrozen(value)||!('fd' in value)||typeof value.fd!=='number'||!Number.isInteger(value.fd)||!('helper' in value)||typeof value.helper!=='string'||!value.helper.startsWith('/'))throw Error('Invalid admin native execution context');
 const stat=fstatSync(value.fd);if(!stat.isFile()||stat.uid!==0||(stat.mode&0o777)!==0o600||stat.nlink!==1)throw Error('Invalid admin lock descriptor');return {fd:value.fd,helper:value.helper};
}
function descriptors(stdio:StdioOptions|undefined,fd:number):StdioOptions{
 const values=Array.isArray(stdio)?stdio.slice(0,3):[stdio||'pipe',stdio||'pipe',stdio||'pipe'];while(values.length<3)values.push('pipe');return [...values,fd];
}
function command(active:Context,binary:string,args:string[],options:{timeout?:number}):[string,string[]]{return ['/usr/bin/node',[active.helper,'--native-lock-supervisor',String(options.timeout||300000),binary,...args]];}
export function spawn(binary:string,args:string[]=[],options:SpawnOptions={}):ChildProcess&{adminLockSupervised?:boolean}{
 const active=context();if(!active)return nativeSpawn(binary,args,options);const [file,parameters]=command(active,binary,args,options);return Object.assign(nativeSpawn(file,parameters,{...options,shell:false,stdio:descriptors(options.stdio,active.fd)}),{adminLockSupervised:true});
}
export function execFileSync(binary:string,args:string[]=[],options:ExecFileSyncOptions={}):NativeOutput{
 const active=context();if(!active)return nativeExecFileSync(binary,args,options);const [file,parameters]=command(active,binary,args,options);return nativeExecFileSync(file,parameters,{...options,stdio:descriptors(options.stdio,active.fd)});
}
function executeNative(binary:string,args:string[],options:ExecOptions,callback?:Callback):ChildProcess;
function executeNative(binary:string,args:string[],callback?:Callback):ChildProcess;
function executeNative(binary:string,options:ExecOptions,callback?:Callback):ChildProcess;
function executeNative(binary:string,callback?:Callback):ChildProcess;
function executeNative(binary:string,args?:string[]|ExecOptions|Callback,options?:ExecOptions|Callback,callback?:Callback):ChildProcess{
 const parameters=Array.isArray(args)?args:[];
 const settings:ExecOptions=Array.isArray(args)?(typeof options==='object'?options:{}):(typeof args==='object'?args:{});
 const done=Array.isArray(args)?(typeof options==='function'?options:callback):(typeof args==='function'?args:typeof options==='function'?options:callback);
 const active=context();if(!active)return nativeExecFile(binary,parameters,settings,done);
 const [file,supervised]=command(active,binary,parameters,settings),child=nativeSpawn(file,supervised,{...settings,shell:false,stdio:descriptors('pipe',active.fd)}),stdout:Buffer[]=[],stderr:Buffer[]=[],limit=settings.maxBuffer??1048576;
 let outBytes=0,errBytes=0,error:NativeError|null=null,finished=false,timer:ReturnType<typeof setTimeout>|undefined;
 const stop=(reason:NativeError)=>{error??=reason;child.kill(settings.killSignal||'SIGTERM');};
 function collect(list:Buffer[],data:Buffer|string,isOut:boolean){const bytes=Buffer.isBuffer(data)?data:Buffer.from(data),used=isOut?outBytes:errBytes,remaining=Math.max(0,limit-used);if(remaining)list.push(bytes.subarray(0,remaining));if(isOut)outBytes+=bytes.length;else errBytes+=bytes.length;if(used+bytes.length>limit)stop(Object.assign(Error('Native output exceeded maxBuffer'),{code:'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}));}
 // The supervised branch constructs pipe descriptors for both output streams.
 child.stdout!.on('data',data=>collect(stdout,data,true));child.stderr!.on('data',data=>collect(stderr,data,false));child.once('error',reason=>{error??=reason;});if((settings.timeout??0)>0)timer=setTimeout(()=>stop(Object.assign(Error('Native execution timed out'),{killed:true})),settings.timeout);
 child.once('close',(code,signal)=>{if(finished)return;finished=true;clearTimeout(timer);const encoding=settings.encoding===null||settings.encoding==='buffer'?null:settings.encoding||'utf8',output=Buffer.concat(stdout),diagnostic=Buffer.concat(stderr),out=encoding?output.toString(encoding):output,err=encoding?diagnostic.toString(encoding):diagnostic;if(code!==0||signal)error??=Object.assign(Error('Native command failed'),{code,signal});if(error){error.stdout=out;error.stderr=err;error.killed??=child.killed;}done?.(error,out,err);});
 return child;
}
function promised(binary:string,args?:string[]|ExecOptions,options?:ExecOptions){
 let child:ChildProcess|undefined;
 const promise=new Promise<{stdout:NativeOutput;stderr:NativeOutput}>((resolve,reject)=>{const callback:Callback=(error,stdout,stderr)=>error?reject(error):resolve({stdout,stderr});child=Array.isArray(args)?executeNative(binary,args,options??{},callback):executeNative(binary,args??{},callback);});
 return Object.assign(promise,{child});
}
export const execFile=Object.assign(executeNative,{[promisify.custom]:promised});
