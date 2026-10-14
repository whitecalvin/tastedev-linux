export type NodeAppRuntime = {executable: string; status: 'ready' | 'missing' | 'unreadable' | 'unsupported'; envFileSupported: boolean; version?: string};
import {lstat,realpath} from 'node:fs/promises';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import path from 'node:path';
const execute=promisify(execFile);
export function nodeEnvRuntimeVersion(output: unknown){
 if(typeof output!=='string')return null;
 const match=/^v(\d+)\.(\d+)\.(\d+)\r?\n?$/.exec(output);
 if(!match)return null;
 const [major,minor,patch]=match.slice(1).map(Number);
 if(![major,minor,patch].every(Number.isSafeInteger))return null;
 return {version:`v${major}.${minor}.${patch}`,envFileSupported:major>20||(major===20&&minor>=6)};
}
async function trusted(file: string,final: boolean){
 const parts=file.split('/').filter(Boolean);let current='/';
 for(let i=0;i<parts.length;i++){
  current=path.join(current,parts[i]);const stat=await lstat(current);
  if(stat.uid!==0||(stat.mode&0o022))throw Error('unsafe');
  if(i===parts.length-1&&final){if(!stat.isFile()||!(stat.mode&0o111)||stat.nlink!==1)throw Error('unsafe');}
  else if(i===parts.length-1&&!final){if(!stat.isFile()&&!stat.isSymbolicLink())throw Error('unsafe');}
  else if(!stat.isDirectory()&&!stat.isSymbolicLink())throw Error('unsafe');
 }
}
export async function nodeAppRuntime(): Promise<NodeAppRuntime>{
 const executable='/usr/bin/node';
 try{
  await trusted(executable,false);const resolved=await realpath(executable);await trusted(resolved,true);
  const {stdout}=await execute(executable,['--version'],{timeout:3000,maxBuffer:1024,encoding:'utf8',cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});
  const result=nodeEnvRuntimeVersion(stdout);
  if(!result)return {executable,status:'unreadable',envFileSupported:false};
  return {executable,status:result.envFileSupported?'ready':'unsupported',...result};
 }catch(error){return {executable,status:error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT'?'missing':'unreadable',envFileSupported:false};}
}
