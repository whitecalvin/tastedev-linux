import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('emitted AI configuration and analysis run in Node22 using synthetic keys and injected responses only',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-ai-runtime-'));
 try{
  const allowed=['ai-settings','ai-provider','ai-reasoning','ai-model-order','ai-models','ai-analysis','runtime-paths','error-code'].map(name=>'lib/'+name+'.mjs');await mkdir(join(root,'lib'),{mode:0o700});
  for(const file of allowed){await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {aiSettings,saveAiSettings} from './lib/ai-settings.mjs';import {listAiModels} from './lib/ai-models.mjs';import {analyzeLog} from './lib/ai-analysis.mjs';globalThis.fetch=()=>assert.fail('External fetch forbidden');assert.equal(aiSettings().enabled,false);const saved=await saveAiSettings({...aiSettings(),model:'fixture-model',enabled:true,apiKey:'synthetic-key',clearKey:false});assert(!JSON.stringify(saved).includes('synthetic-key'));const models=await listAiModels({...saved,apiKey:''},async()=>Response.json({data:[{id:'fixture-model'}]}));assert.equal(models.models[0].id,'fixture-model');const result=await analyzeLog({source:'synthetic',text:'token=synthetic-secret',confirm:true,configVersion:saved.version},async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert(!options.body.includes('synthetic-secret'));return Response.json({output:[{type:'message',content:[{type:'output_text',text:'합성 분석 결과'}]}]});});assert.equal(result.analysis,'합성 분석 결과');console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:{...process.env,LINUX_AI_SETTINGS_ROOT:join(root,'state')}});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
