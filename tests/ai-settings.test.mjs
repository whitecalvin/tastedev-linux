import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,stat,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {aiSettings,aiConfiguration,saveAiSettings} from '../lib/ai-settings.ts';
import {aiRequest,aiOutput} from '../lib/ai-provider.ts';
import {listAiModels} from '../lib/ai-models.ts';
test('AI settings retain only same-destination keys, reject stale writes, persist privately and never return keys',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','ai-settings-test-'));const old=process.env.LINUX_AI_SETTINGS_ROOT;process.env.LINUX_AI_SETTINGS_ROOT=root;
 try{
  const initial=aiSettings();const first=await saveAiSettings({...initial,provider:'Fixture',protocol:'chat-completions',endpoint:'https://fixture.example/v1',model:'model-1',enabled:true,apiKey:'fixture-key',clearKey:false,serviceTier:'priority'});
  assert(!JSON.stringify(first).includes('fixture-key'));assert.equal(first.keyConfigured,true);assert.equal((await stat(join(root,'ai-settings/settings.json'))).mode&0o777,0o600);
  assert.equal(aiConfiguration().apiKey,'fixture-key');assert.equal(aiRequest(aiConfiguration(),{source:'fixture',text:'error'}).options.headers.Authorization,'Bearer fixture-key');assert.equal(JSON.parse(aiRequest(aiConfiguration(),{source:'fixture',text:'error'}).options.body).service_tier,'priority');
  await assert.rejects(saveAiSettings({...first,version:initial.version,apiKey:'',clearKey:false}),e=>e.status===409);
  await assert.rejects(saveAiSettings({...first,endpoint:'https://other.example/v1',apiKey:'',clearKey:false}),/API 키/);
  const next=await saveAiSettings({...first,endpoint:'https://other.example/v1',apiKey:'',clearKey:false,enabled:false});assert.equal(next.keyConfigured,false);
  assert.throws(()=>aiRequest({...aiConfiguration(),protocol:'invalid'},{source:'s',text:'x'}));
 }finally{if(old===undefined)delete process.env.LINUX_AI_SETTINGS_ROOT;else process.env.LINUX_AI_SETTINGS_ROOT=old;await rm(root,{recursive:true,force:true});}
});
test('model refresh fetches current pages and does not return keys or preserve retired Gemini models',async()=>{
 const config={provider:'Google',protocol:'gemini',endpoint:'https://fixture.example/v1beta',model:'x',enabled:false,apiKey:'fixture-key'};let calls=0;
 const result=await listAiModels(config,async(url,options)=>{assert.equal(options.headers['x-goog-api-key'],'fixture-key');assert.equal(options.redirect,'error');calls++;return Response.json(calls===1?{models:[{name:'models/new-1',displayName:'New',supportedGenerationMethods:['generateContent']},{name:'models/embedding',supportedGenerationMethods:['embedContent']}],nextPageToken:'next'}:{models:[{name:'models/new-2',supportedGenerationMethods:['generateContent']}]});});
 assert.equal(calls,2);assert.deepEqual(result.models.map(x=>x.id),['new-1','new-2']);assert(!JSON.stringify(result).includes('fixture-key'));
 await assert.rejects(listAiModels(config,async()=>new Response(null,{status:401})),/권한/);
});
test('providers use selected endpoint, model, authentication, payload and response format',()=>{
 for(const protocol of ['responses','chat-completions','anthropic','gemini']){
  const request=aiRequest({protocol,endpoint:'https://custom.example/api',model:'custom-model',apiKey:'fixture-key',serviceTier:'auto'},{source:'s',text:'fixture'});assert(request.url.startsWith('https://custom.example/api/'));const body=JSON.parse(request.options.body);assert.equal(body.model||decodeURIComponent(request.url.match(/models\/(.*):/)?.[1]),'custom-model');assert.equal(request.options.redirect,'error');assert(!request.url.includes('fixture-key'));
 }
 assert.equal(aiOutput('anthropic',{content:[{type:'text',text:'한국어'}],stop_reason:'end_turn'}).text,'한국어');assert.equal(aiOutput('gemini',{candidates:[{content:{parts:[{text:'한국어'}]},finishReason:'MAX_TOKENS'}]}).incomplete,true);assert.equal(aiOutput('chat-completions',{choices:[{message:{content:'한국어'},finish_reason:'stop'}]}).text,'한국어');
});

test('model refresh respects key deletion, rejects stale key reuse and hides invalid provider JSON',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','model-settings-test-')),old=process.env.LINUX_AI_SETTINGS_ROOT;process.env.LINUX_AI_SETTINGS_ROOT=root;
 try{
  const saved=await saveAiSettings({...aiSettings(),provider:'Fixture',protocol:'responses',endpoint:'https://fixture.example/v1',model:'model-1',enabled:true,apiKey:'fixture-key',clearKey:false});
  let calls=0;const fetcher=async()=>{calls++;return Response.json({data:[]});};
  await assert.rejects(listAiModels({...saved,apiKey:'',clearKey:true},fetcher),error=>error.status===400);assert.equal(calls,0);
  await assert.rejects(listAiModels({...saved,apiKey:'',clearKey:false,version:'stale'},fetcher),error=>error.status===409);assert.equal(calls,0);
  await assert.rejects(listAiModels({...saved,apiKey:'',clearKey:false},async()=>new Response('private-provider-content')),error=>error.status===502&&!error.message.includes('private-provider-content'));
 }finally{if(old===undefined)delete process.env.LINUX_AI_SETTINGS_ROOT;else process.env.LINUX_AI_SETTINGS_ROOT=old;await rm(root,{recursive:true,force:true});}
});

 test('AI stays disabled and unconfigured despite development environment credentials',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','ai-default-test-'));const names=['LINUX_AI_SETTINGS_ROOT','LINUX_ENABLE_AI','LINUX_AI_MODEL','OPENAI_API_KEY'];const old=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 try{process.env.LINUX_AI_SETTINGS_ROOT=root;process.env.LINUX_ENABLE_AI='true';process.env.LINUX_AI_MODEL='legacy-model';process.env.OPENAI_API_KEY='environment-fixture-key';
 const initial=aiSettings();assert.equal(initial.enabled,false);assert.equal(initial.keyConfigured,false);assert.equal(initial.model,'');assert.equal(initial.source,'default');assert.equal(aiConfiguration().apiKey,'');
 const saved=await saveAiSettings({...initial,apiKey:'',clearKey:false});assert.equal(saved.enabled,false);assert.equal(saved.model,'');
 }finally{for(const n of names){if(old[n]===undefined)delete process.env[n];else process.env[n]=old[n];}await rm(root,{recursive:true,force:true});}
 });

test('selected reasoning effort is persisted and sent separately from service tier',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','ai-reasoning-test-')),old=process.env.LINUX_AI_SETTINGS_ROOT;process.env.LINUX_AI_SETTINGS_ROOT=root;
 try{const saved=await saveAiSettings({...aiSettings(),provider:'OpenAI',model:'gpt-6.1-sol',reasoningEffort:'medium',enabled:true,apiKey:'fixture-key',clearKey:false});assert.equal(saved.reasoningEffort,'medium');
 const body=JSON.parse(aiRequest(aiConfiguration(),{source:'test',text:'fixture'}).options.body);assert.equal(body.reasoning.effort,'medium');assert.equal(body.service_tier,undefined);
 const chat=JSON.parse(aiRequest({...aiConfiguration(),protocol:'chat-completions'},{source:'test',text:'fixture'}).options.body);assert.equal(chat.reasoning_effort,'medium');
 await assert.rejects(saveAiSettings({...saved,model:'unsupported-model',apiKey:'',clearKey:false}),/추론 수준/);
 }finally{if(old===undefined)delete process.env.LINUX_AI_SETTINGS_ROOT;else process.env.LINUX_AI_SETTINGS_ROOT=old;await rm(root,{recursive:true,force:true});}
});

test('provider output uses only text fields and model refresh ignores malformed model entries',async()=>{
 for(const protocol of ['responses','chat-completions','anthropic','gemini'])for(const body of [null,[],42,'invalid',{}])assert.deepEqual(aiOutput(protocol,body),{text:'',incomplete:false});
 assert.deepEqual(aiOutput('anthropic',{content:[null,{type:'text',text:42},{type:'text',text:'유효한 응답'}],stop_reason:'max_tokens'}),{text:'\n유효한 응답',incomplete:true});
 const input={provider:'Fixture',protocol:'chat-completions',endpoint:'http://127.0.0.1:12345/v1',enabled:false,model:'',apiKey:'',clearKey:false};let calls=0;const result=await listAiModels(input,async()=>{calls++;return Response.json({data:[null,42,[],{id:42},{id:'fixture-model',display_name:'합성 모델'}]});});assert.equal(calls,1);assert.deepEqual(result.models,[{id:'fixture-model',label:'합성 모델'}]);
});
