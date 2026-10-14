import test from 'node:test';import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {join,dirname} from 'node:path';import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';import {jsonRecord} from '../scripts/verification/http-json.ts';
test('Node22 AI verification controller requires explicit synthetic input and reports mocked outcomes without raw provider errors',async()=>{
 const root=await verificationWorkDirectory('ai-live-controller-runtime-');const script='scripts/verification/ai-live-korean.mjs',files=[script,'scripts/verification/work-directory.mjs','lib/ai-analysis.mjs'];
 try{
  for(const file of files.filter(file=>file!=='lib/ai-analysis.mjs')){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  await mkdir(join(root,'lib'));await writeFile(join(root,'lib/ai-analysis.mjs'),`export async function analyzeLog(input){if(!input.text.startsWith('Synthetic example:')||input.confirm!==true)throw Error('Invalid fixture');if(process.env.FIXTURE_AI_CASE==='error')throw Object.assign(Error('raw-provider-secret-must-not-be-stored'),{status:502,providerStatus:429,providerCode:'insufficient_quota'});return {analysis:'한국어 합성 검사 결과',model:'mock-model',incomplete:process.env.FIXTURE_AI_CASE==='incomplete',at:'fixture'};}`);
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,script)],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
  const denied=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script)],{encoding:'utf8'});assert.equal(denied.status,1);assert(denied.stderr.includes('--confirm-synthetic-input'));assert.equal(denied.stdout,'');
  for(const mode of ['pass','incomplete','error']){
   const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'--confirm-synthetic-input'],{env:{...process.env,FIXTURE_AI_CASE:mode,LINUX_ENABLE_AI:'false'},encoding:'utf8',timeout:10000});assert.equal(run.status,mode==='pass'?0:1,run.stderr);const summary=jsonRecord(JSON.parse(run.stdout));assert.equal(summary.status,mode==='pass'?'PASS':'FAIL');assert(!('analysis' in summary));assert(typeof summary.evidence==='string');const stored=await readFile(summary.evidence,'utf8');assert(!stored.includes('raw-provider-secret'));const result=jsonRecord(JSON.parse(stored));assert.equal(result.syntheticInputOnly,true);assert.equal(result.hostCommandsExecuted,false);if(mode==='error'){assert.equal(result.httpStatus,502);assert.equal(result.providerStatus,429);assert.equal(result.providerCode,'insufficient_quota');}
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
