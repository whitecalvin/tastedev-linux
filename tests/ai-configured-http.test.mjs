import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {aiSettings,saveAiSettings} from '../lib/ai-settings.ts';
import {listAiModels} from '../lib/ai-models.ts';

test('saved provider settings drive real local HTTP model refresh and Korean analysis for each supported protocol',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','configured-ai-http-')),old=process.env.LINUX_AI_SETTINGS_ROOT;
 const requests=[];
 const server=createServer(async(req,res)=>{
  let bytes='';for await(const chunk of req)bytes+=chunk;
  const body=bytes?JSON.parse(bytes):null;requests.push({url:req.url,headers:req.headers,body});
  res.setHeader('Content-Type','application/json');
  if(req.method==='GET'){
   if(req.url.startsWith('/gemini/models'))res.end(JSON.stringify({models:[{name:'models/local-korean',displayName:'한국어 모델',supportedGenerationMethods:['generateContent']}]}));
   else res.end(JSON.stringify({data:[{id:'local-korean',display_name:'한국어 모델'}]}));
   return;
  }
  if(req.url==='/responses/responses')res.end(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'한국어 원인 분석: nginx 경로를 확인하세요.'}]}]}));
  else if(req.url==='/chat-completions/chat/completions')res.end(JSON.stringify({choices:[{message:{content:'한국어 해결 방법: 연결 상태를 확인하세요.'},finish_reason:'stop'}]}));
  else if(req.url==='/anthropic/messages')res.end(JSON.stringify({content:[{type:'text',text:'한국어 검수: 설정 구문을 확인하세요.'}],stop_reason:'end_turn'}));
  else if(req.url==='/gemini/models/local-korean:generateContent')res.end(JSON.stringify({candidates:[{content:{parts:[{text:'한국어 복원 방법: 백업을 확인하세요.'}]},finishReason:'STOP'}]}));
  else{res.statusCode=404;res.end('{}');}
 });
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});process.env.LINUX_AI_SETTINGS_ROOT=root;
  for(const [protocol,tier] of [['responses','priority'],['chat-completions','flex'],['anthropic','standard_only'],['gemini','auto']]){
   const saved=await saveAiSettings({...aiSettings(),provider:'Local '+protocol,protocol,endpoint:'http://127.0.0.1:'+server.address().port+'/'+protocol,model:'local-korean',serviceTier:tier,enabled:true,apiKey:'sk-fixture-private',clearKey:false});
   const models=await listAiModels({...saved,apiKey:''});assert.deepEqual(models.models.map(model=>model.id),['local-korean']);
   const {analyzeLog}=await import('../lib/ai-analysis.ts?configured-http='+protocol);
   const count=requests.length;
   await assert.rejects(analyzeLog({source:'fixture',text:'synthetic error',confirm:false,configVersion:saved.version}),/동의/);assert.equal(requests.length,count);
   await assert.rejects(analyzeLog({source:'fixture',text:'synthetic error',confirm:true,configVersion:'outdated'}),error=>error.status===409);assert.equal(requests.length,count);
   const result=await analyzeLog({source:'synthetic fixture',text:'nginx error password=fixture-password token=fixture-token',confirm:true,configVersion:saved.version});
   assert.match(result.analysis,/한국어/);assert.equal(result.provider,saved.provider);assert.equal(result.model,'local-korean');assert.equal(result.incomplete,false);
   const sent=requests.at(-1);assert(!JSON.stringify(sent.body).includes('fixture-password'));assert(!JSON.stringify(sent.body).includes('fixture-token'));
   if(protocol==='gemini'){assert.equal(sent.headers['x-goog-api-key'],'sk-fixture-private');assert.equal(sent.body.service_tier,undefined);}
   else{assert.equal(sent.body.service_tier,tier);assert.equal(sent.body.model,'local-korean');assert.equal(protocol==='anthropic'?sent.headers['x-api-key']:sent.headers.authorization,protocol==='anthropic'?'sk-fixture-private':'Bearer sk-fixture-private');}
  }
  assert.equal(requests.length,8);
 }finally{if(old===undefined)delete process.env.LINUX_AI_SETTINGS_ROOT;else process.env.LINUX_AI_SETTINGS_ROOT=old;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});

test('Ollama and LM Studio local models work without a key and omit cloud priority and reasoning fields',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','local-llm-http-')),old=process.env.LINUX_AI_SETTINGS_ROOT,requests=[];
 const server=createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;requests.push({url:req.url,authorization:req.headers.authorization,body:text?JSON.parse(text):null});res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.method==='GET'?{data:[{id:'qwen-local:8b'}]}:{choices:[{message:{content:'한국어 테스트: 설정을 확인하세요.'},finish_reason:'stop'}]}));});
 try{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));process.env.LINUX_AI_SETTINGS_ROOT=root;
 for(const provider of ['Ollama','LM Studio']){
 const saved=await saveAiSettings({...aiSettings(),provider,protocol:'chat-completions',endpoint:'http://127.0.0.1:'+server.address().port+'/v1',model:'qwen-local:8b',enabled:true,apiKey:'',clearKey:true,serviceTier:'auto',reasoningEffort:'auto'});
 assert.equal(saved.configured,true);assert.equal(saved.keyConfigured,false);
 assert.deepEqual((await listAiModels({...saved,apiKey:''})).models.map(m=>m.id),['qwen-local:8b']);
 const {analyzeLog}=await import('../lib/ai-analysis.ts?local='+encodeURIComponent(provider));const result=await analyzeLog({source:'fixture',text:'synthetic error',confirm:true,configVersion:saved.version});assert.match(result.analysis,/한국어/);
 assert.equal(requests.at(-1).url,'/v1/chat/completions');assert.equal(requests.at(-1).body.model,'qwen-local:8b');assert.equal(requests.at(-1).body.service_tier,undefined);assert.equal(requests.at(-1).body.reasoning_effort,undefined);assert.equal(requests.at(-1).authorization,undefined);
 }assert.equal(requests.length,4);
 }finally{if(old===undefined)delete process.env.LINUX_AI_SETTINGS_ROOT;else process.env.LINUX_AI_SETTINGS_ROOT=old;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
