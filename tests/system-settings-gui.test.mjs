import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';
const native=createRequire(import.meta.url);
async function fixture(){
 await loadBindings();const {code}=await transform(await readFile(new URL('../components/system-settings.tsx',import.meta.url),'utf8'),{filename:'system-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],language={locale:'ko'},redirects=[];let si=0,ri=0;
 const hooks={...React,useEffect:()=>{},useState:initial=>{const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});}};
 const controls=Object.fromEntries(['Button','TextInput','Switch','Checkbox','Badge','CustomSelect'].map(key=>[key,key]));const module={exports:{}};
 const mocks={'react':hooks,'./network-settings':{__esModule:true,default:'NetworkSettings'},'./language-provider':{useLanguage:()=>({t:(value,vars)=>translate(language.locale,value,vars)})},'next/link':{__esModule:true,default:'Link'},'next/navigation':{useRouter:()=>({replace:value=>redirects.push(value)})},'./draft-provider':{useDraftState:(_key,initial)=>hooks.useState(initial)},'./ui/controls':controls, './ui/toast-provider':toastTestModuleWithReact(hooks)};
 mocks['./ui/toast-provider']=toastTestModule(name=>mocks[name]??native(name));
 new Function('require','module','exports',code)(name=>mocks[name]??native(name),module,module.exports);
 const props={readOnly:false,general:{version:'log-cas',logLines:150,logRefreshSeconds:5},initial:{enabled:false,provider:'OpenAI',protocol:'responses',endpoint:'https://api.openai.com/v1',model:'',reasoningEffort:'auto',keyConfigured:false},network:null};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 return{props,language,redirects,render(){si=ri=0;return nodes(module.exports.default(props));}};
}
test('general settings translate numeric units and labels in twelve catalogs while retaining stored values',async()=>{
 const view=await fixture();
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  view.language.locale=locale;const nodes=view.render();
  assert(nodes.some(n=>n.type==='h1'&&n.props.children===translate(locale,'설정')));
  const lines=nodes.find(n=>n.props.label===translate(locale,'최근 로그 줄 수'));
  assert.equal(lines.props.value,'150');assert.deepEqual(lines.props.options[2],{value:'300',label:translate(locale,'{count}줄',{count:300})});
  const seconds=nodes.find(n=>n.props.label===translate(locale,'자동 갱신 간격'));assert.equal(seconds.props.options[1].label,translate(locale,'{count}초',{count:5}));
  const runtime=nodes.find(n=>n.props.label===translate(locale,'새 셸 세션 최대 실행 시간'));assert.equal(runtime.props.value,'3600');assert.equal(runtime.props.options[3].label,translate(locale,'{count}분',{count:60}));
  assert(nodes.some(n=>n.type==='Link'&&n.props.href==='/terminal'&&n.props.children===translate(locale,'터미널 열기 ↗')));
  assert(nodes.some(n=>n.type==='Link'&&n.props.href==='/security'&&n.props.children===translate(locale,'보안 설정 열기 ↗')));
 }
});
test('localized log settings save unchanged CAS payload once and retranslate the result without another request',async()=>{
 const view=await fixture(),prior=globalThis.fetch;let calls=0,release;
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'/api/system-settings');assert.deepEqual(JSON.parse(options.body),view.props.general);await new Promise(resolve=>{release=resolve;});return{status:200,ok:true,json:async()=>({...view.props.general,version:'saved-cas'})};};
 try{
  const save=view.render().find(n=>n.props['aria-label']==='로그 설정 저장');const first=save.props.onClick();await save.props.onClick();assert.equal(calls,1);release();await first;
  for(const locale of ['en','ja','ar','uk','ko']){view.language.locale=locale;assert(view.render().some(n=>n.props.role==='status'&&n.props.children===translate(locale,'로그 설정을 저장했습니다. 다음 조회부터 적용됩니다.')));}
  assert.equal(calls,1);
 }finally{globalThis.fetch=prior;}
});
test('read-only log save and disabled AI provider/model controls retain their permission states',async()=>{
 const view=await fixture();view.props.readOnly=true;let nodes=view.render();
 assert(nodes.find(n=>n.props['aria-label']==='로그 설정 저장').props.disabled);
 for(const label of ['AI 업체','API 방식','모델'])assert(nodes.find(n=>n.props.label===label).props.disabled);
 assert(nodes.find(n=>n.props['aria-label']==='모델 목록 갱신').props.disabled);
 assert(nodes.find(n=>n.type==='input'&&n.props.type==='range').props.disabled);
});
test('expired log session navigates to login and translates the result',async()=>{
 const view=await fixture(),prior=globalThis.fetch;globalThis.fetch=async()=>({status:401});
 try{await view.render().find(n=>n.props['aria-label']==='로그 설정 저장').props.onClick();assert.deepEqual(view.redirects,['/login?next=%2Fsettings']);view.language.locale='ja';assert(view.render().some(n=>n.props.role==='status'&&n.props.children===translate('ja','로그인 페이지로 이동합니다.')));}
 finally{globalThis.fetch=prior;}
});
test('AI labels and local-provider options have native copy in all twelve catalogs without changing provider identities',async()=>{
 const view=await fixture();
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  view.language.locale=locale;const nodes=view.render();
  for(const key of ['AI 로그 분석 사용','AI 업체','API 방식','모델','API 키'])assert(nodes.some(n=>n.props.label===translate(locale,key)),locale+' '+key);
  const providers=nodes.find(n=>n.props.label===translate(locale,'AI 업체')).props.options;
  assert.deepEqual(providers.map(p=>p.value),['OpenAI','Anthropic','Google','Ollama','LM Studio','custom']);
  assert.equal(providers[3].label,translate(locale,'Ollama · 로컬 LLM'));
  const model=nodes.find(n=>n.props.label===translate(locale,'모델'));
  assert.equal(model.props.options[1].value,'gpt-6-astra');assert.equal(model.props.options.at(-1).label,translate(locale,'모델 ID 직접 입력'));
  const displayed=nodes.flatMap(n=>React.Children.toArray(n.props.children).filter(c=>typeof c==='string'));
  assert(!displayed.some(text=>/[가-힣]/.test(text)),locale+' visible Korean copy remains: '+JSON.stringify(displayed.filter(text=>/[가-힣]/.test(text))));
 }
});
test('provider selection retains filtered protocols and automatic endpoint while clearing destination-bound key/model',async()=>{
 const view=await fixture(),find=label=>view.render().find(n=>n.props.label===label);
 find('AI 로그 분석 사용').props.onChange({target:{checked:true}});
 assert.equal(find('모델').props.disabled,false);
 find('AI 업체').props.onChange({target:{value:'Anthropic'}});
 assert.equal(find('API 방식').props.value,'anthropic');assert.deepEqual(find('API 방식').props.options.map(p=>p.value),['anthropic']);
 assert.equal(find('API 기본 주소').props.value,'https://api.anthropic.com/v1');assert.equal(find('API 기본 주소').props.readOnly,true);
 find('API 키').props.onChange({target:{value:'fixture-key'}});
 find('AI 업체').props.onChange({target:{value:'Ollama'}});
 assert.equal(find('API 키').props.value,'');assert.equal(find('모델').props.value,'');assert.equal(find('API 기본 주소').props.value,'http://127.0.0.1:11434/v1');assert.equal(find('API 기본 주소').props.readOnly,false);
 assert.deepEqual(find('API 방식').props.options.map(p=>p.value),['chat-completions']);
 find('AI 로그 분석 사용').props.onChange({target:{checked:false}});
 assert.equal(find('모델').props.disabled,true);assert.equal(find('AI 업체').props.disabled,true);
});
test('model refresh count and saved AI result retranslate without extra requests and preserve selected model IDs',async()=>{
 const view=await fixture(),prior=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.provider,'OpenAI');assert.equal(body.endpoint,'https://api.openai.com/v1');return{status:200,ok:true,json:async()=>url==='/api/ai-models'?{models:[{id:'gpt-6.1-sol',label:'GPT-6.1 Sol'},{id:'gpt-6-astra',label:'GPT-6 Astra'}],at:'fixture-time'}:{...body,keyConfigured:false}};};
 try{
  view.render().find(n=>n.props.label==='AI 로그 분석 사용').props.onChange({target:{checked:true}});
  await view.render().find(n=>n.props['aria-label']==='모델 목록 갱신').props.onClick();
  for(const locale of ['en','ja','ar','uk','ko']){
   view.language.locale=locale;assert(view.render().some(n=>n.props.role==='status'&&n.props.children===translate(locale,'최신 모델 {count}개를 불러왔습니다.',{count:2})));
   assert(view.render().some(n=>n.props.className==='hint settings-model-hint'&&n.props.children===translate(locale,'모델 목록 갱신 완료 · {count}개',{count:2})));
  }
  assert.equal(calls,1);view.language.locale='ko';view.render().find(n=>n.props.label==='모델').props.onChange({target:{value:'gpt-6.1-sol'}});
  await view.render().find(n=>n.props['aria-label']==='AI 설정 저장').props.onClick();
  for(const locale of ['en','ja','ar','uk','ko']){view.language.locale=locale;assert(view.render().some(n=>n.props.role==='status'&&n.props.children===translate(locale,'AI 설정을 저장했습니다. 다음 분석부터 적용됩니다.')));assert.equal(view.render().find(n=>n.props.label===translate(locale,'모델')).props.value,'gpt-6.1-sol');}
  assert.equal(calls,2);
 }finally{globalThis.fetch=prior;}
});
test('late model refresh cannot publish an old provider response after a destination change',async()=>{
 const view=await fixture(),prior=globalThis.fetch;let release;
 globalThis.fetch=async()=>{await new Promise(resolve=>{release=resolve;});return{status:200,ok:true,json:async()=>({models:[{id:'old-provider-model',label:'Old model'}],at:'old-time'})};};
 try{
  view.render().find(n=>n.props.label==='AI 로그 분석 사용').props.onChange({target:{checked:true}});
  const pending=view.render().find(n=>n.props['aria-label']==='모델 목록 갱신').props.onClick();
  view.render().find(n=>n.props.label==='AI 업체').props.onChange({target:{value:'Ollama'}});
  release();await pending;
  assert(!view.render().find(n=>n.props.label==='모델').props.options.some(option=>option.value==='old-provider-model'));
  assert(!view.render().some(n=>n.props.role==='status'&&String(n.props.children).includes('최신 모델')));
 }finally{globalThis.fetch=prior;}
});
