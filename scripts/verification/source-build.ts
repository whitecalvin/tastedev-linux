import {buildWorkspace} from '../build-workspace.ts';
import {mkdtemp,mkdir,cp,copyFile,symlink,writeFile,readFile,readdir,lstat} from 'node:fs/promises';

import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const project=process.cwd(),root=await mkdtemp(path.join(buildWorkspace,'tastedev-current-build-'));
const files:string[]=[];
async function collect(relative:string){const source=path.join(project,relative),stat=await lstat(source);if(stat.isSymbolicLink())throw Error('Source snapshot requires a regular file: '+relative);if(stat.isDirectory()){for(const name of (await readdir(source)).sort())await collect(path.join(relative,name));}else if(stat.isFile())files.push(relative);else throw Error('Unsupported source entry: '+relative);}
try{
 for(const name of ['app','components','lib','public','types']){await collect(name);await cp(path.join(project,name),path.join(root,name),{recursive:true});}
 for(const name of ['package.json','next.config.mjs','tsconfig.json','next-env.d.ts']){await collect(name);await copyFile(path.join(project,name),path.join(root,name));}
 await symlink(path.join(project,'node_modules'),path.join(root,'node_modules'),'dir');
 // Keep the small source snapshot on a symlink-capable filesystem, while
 // allowing large build output on the workspace disk instead of tmpfs.
 if(process.env.LINUX_BUILD_OUTPUT){
  if(!path.isAbsolute(process.env.LINUX_BUILD_OUTPUT))throw Error('Build output directory must be absolute');
  await mkdir(process.env.LINUX_BUILD_OUTPUT,{recursive:true});
  const output=await mkdtemp(path.join(process.env.LINUX_BUILD_OUTPUT,'next-'));
  await symlink(output,path.join(root,'.next'),'dir');
 }
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex'),sources:Record<string,string>={};
 for(const file of files){const original=await readFile(path.join(project,file)),copy=await readFile(path.join(root,file));if(!original.equals(copy))throw Error('Source copy differs: '+file);sources[file]=sha(original);}
 await writeFile(path.join(root,'source-snapshot.json'),JSON.stringify({project,files:sources},null,2)+'\n',{mode:0o600});
 const logFile=path.join(root,'build.log');let log='';
 const child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:root,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',data=>{log+=data;});child.stderr.on('data',data=>{log+=data;});
 console.log(JSON.stringify({status:'RUNNING',root,sourceFiles:files.length,log:logFile}));
 const exitCode=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve(code));});await writeFile(logFile,log,{mode:0o600});
 const changed:string[]=[];for(const [file,hash] of Object.entries(sources)){if(sha(await readFile(path.join(project,file)))!==hash)changed.push(file);}
 const result={status:exitCode===0&&!changed.length?'PASS':'FAIL',scope:'Next.js production compilation',exitCode,root,sourceFiles:files.length,sourceChangedDuringBuild:changed,sourceSnapshot:path.join(root,'source-snapshot.json'),log:logFile,packageOrServiceChanges:false};
 const evidence=path.join(buildWorkspace,'source-build-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({...result,evidence:path.join(evidence,'result.json')}));if(result.status!=='PASS'){console.error(log.slice(-4000));process.exitCode=1;}
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
