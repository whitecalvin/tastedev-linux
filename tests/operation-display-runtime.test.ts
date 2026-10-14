import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 operation reports and code display preserve safe results without a TypeScript loader',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','operation-display-runtime-'));
 try{
  const allowed=['lib/operation-terminal-report.mjs','lib/code-tokens.mjs','lib/config-notice.mjs','lib/helper-action-labels.mjs','lib/terminal-output-frame.mjs'];
  for(const file of allowed)await writeFile(join(root,file.slice(4)),await readRuntimeModule(file,allowed),{mode:0o600});
  const files:string[]=[];
  for(const name of ['operation-terminal-report','code-tokens']){
   const source=await readFile(new URL('./'+name+'.test.mjs',import.meta.url),'utf8');
   const output=join(root,name+'.test.mjs');
   await writeFile(output,source.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'./$1.mjs'),{mode:0o600});files.push(output);
  }
  const worker=join(root,'notice.test.mjs');await writeFile(worker,`import test from 'node:test';import assert from 'node:assert/strict';import {configNotice} from './config-notice.mjs';import {helperActionLabels} from './helper-action-labels.mjs';test('diagnostic notices retain paths and action labels grant no additional operations',()=>{assert.equal(configNotice('/etc/nginx/nginx.conf: reason',text=>text==='reason'?'설명':text),'/etc/nginx/nginx.conf: 설명');assert.equal(configNotice(null,text=>text),null);assert.equal(helperActionLabels['install'],'시스템 패키지 설치');assert.equal(helperActionLabels['arbitrary-command'],undefined);assert(Object.isFrozen(helperActionLabels));});`,{mode:0o600});files.push(worker);
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...files],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 12\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
