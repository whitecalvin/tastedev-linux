import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile,lstat,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('GUI controller records termination and removes its fixture and actual owned child on SIGTERM and SIGINT',async()=>{
 const root=await verificationWorkDirectory('pg-operation-gui-signal-');
 const preload=join(root,'preload.mjs');
 await writeFile(preload,`import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';import {writeFileSync} from 'node:fs';import assert from 'node:assert/strict';const actual=cp.spawn;cp.spawn=(binary,args,options)=>{assert(args[0].endsWith('/next/dist/bin/next'));assert(['build','start'].includes(args[1]));const server=args[1]==='start';const child=actual(process.execPath,['--input-type=module','-e',server?'setInterval(()=>{},1000)':'process.exit(0)'],options);if(server)writeFileSync(process.env.GUI_SIGNAL_TRACKER,JSON.stringify({pid:child.pid,cwd:options.cwd}),{mode:0o600});return child;};syncBuiltinESMExports();globalThis.fetch=async url=>{const target=new URL(url);assert.equal(target.hostname,'127.0.0.2');assert.equal(target.pathname,'/verify-operation');return new Response('fixture',{status:200});};`,{mode:0o600});
 try{
  for(const signal of ['SIGTERM','SIGINT'] as const){
   const tracker=join(root,signal+'.json');
   const child=spawn(process.execPath,['--import',preload,resolve('scripts/verification/postgresql-operation-gui.ts'),'--outcomes'],{cwd:process.cwd(),env:{...process.env,GUI_SIGNAL_TRACKER:tracker},stdio:['ignore','pipe','pipe']});
   const completion=new Promise<number|null>((res,rej)=>{child.once('error',rej);child.once('close',res);});let output='',errors='',signalled=false;
   assert(child.stdout&&child.stderr);
   child.stdout.on('data',(bytes:Buffer)=>{output+=bytes.toString();if(!signalled&&output.includes('"GUI_READY"')){signalled=true;child.kill(signal);}});
   child.stderr.on('data',(bytes:Buffer)=>errors+=bytes.toString());
   const deadline=setTimeout(()=>child.kill('SIGKILL'),15000);
   let code:number|null;try{code=await completion;}finally{clearTimeout(deadline);}
   assert(signalled,output+errors);assert.equal(code,1,output+errors);assert(errors.includes('interrupted'),errors);
   const lines=output.split('\n').filter(Boolean).map(line=>JSON.parse(line));const final=lines.find(row=>row.status==='FAIL'&&typeof row.evidence==='string');assert(final);
   const result=JSON.parse(await readFile(final.evidence,'utf8'));assert.equal(result.status,'FAIL');assert.equal(result.interrupted,signal);assert.equal(result.operatingConfigurationChanged,false);assert.equal(result.gui,undefined);
   await writeFile(final.evidence+'.simulation.json',JSON.stringify({testSimulation:true,actualNextBuildExecuted:false,actualBrowserObserved:false,actualOwnedNodeChildExecuted:true})+'\n',{mode:0o600});
   const owned=JSON.parse(await readFile(tracker,'utf8'));assert(typeof owned.pid==='number'&&typeof owned.cwd==='string');
   await assert.rejects(lstat(owned.cwd),{code:'ENOENT'});
   assert.throws(()=>process.kill(owned.pid,0),(error:unknown)=>error!==null&&typeof error==='object'&&'code' in error&&error.code==='ESRCH');
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
