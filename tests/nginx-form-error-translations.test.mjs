import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {nginxDraftForm,nginxExistingPlan} from '../lib/nginx-form-import.ts';
import {nginxConfig} from '../lib/nginx-config.ts';
import {prepareNginxApply} from '../lib/nginx-apply-request.ts';
import {validateNginxField} from '../lib/nginx-fields.ts';
import {nginxServerPresetBody} from '../lib/nginx-server-presets.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const site={domain:'app.example.com',port:80,mode:'proxy',upstreamPort:3000,root:'/var/www/html'};
function localized(error,message,status){assert.equal(error.message,message);if(status!==undefined)assert.equal(error.status,status);for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,message));assert.equal(translate(locale,message),catalog[message]);assert(!/[가-힣]/.test(catalog[message]));}return true;}
test('all static nginx form and validation diagnostics have direct translations',async()=>{
 await loadBindings();for(const file of ['nginx-form-import','nginx-apply-request','nginx-validation','nginx-fields','nginx-code-import','nginx-server-presets','site-form','site-status']){
  const extension=['nginx-validation','nginx-apply-request','nginx-config','nginx-form-import','nginx-fields','nginx-code-import','nginx-server-presets','site-form','site-status'].includes(file)?'.ts':'.mjs';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));assert(literals.length);for(const message of literals)localized(Error(message),message);
 }
});
test('form conversion refuses unsupported changes and explains every stale operating branch',()=>{
 const original=nginxConfig(site),lossy=original.replace('    listen 80;','    listen 80;\n    add_header X-Custom yes;');
 assert.throws(()=>nginxDraftForm('',original,site.domain),e=>localized(e,'이 초안은 server 편집 폼으로 변환할 수 없습니다.'));
 assert.throws(()=>nginxDraftForm(lossy,original,site.domain),e=>localized(e,'폼에서 지원하지 않는 설정 변경이 있습니다. 초안 다운로드로 검토하세요.'));
 const current={domain:site.domain,enabled:true,version:'fixture-version',config:original},input={...site,version:current.version};
 for(const [state,message] of [
  [null,'운영 설정이 없어졌습니다. 다시 조회하세요.'],
  [{...current,version:'changed'},'운영 설정을 먼저 편집 폼으로 불러오거나 최신 버전을 다시 조회하세요.'],
  [{...current,enabled:false},'비활성 블록은 먼저 활성화한 뒤 편집하세요.'],
  [{...current,config:lossy},'현재 운영 파일에 폼에서 보존할 수 없는 설정이 있습니다. 트리와 원본 설정을 검토하세요.']
 ])assert.throws(()=>nginxExistingPlan(input,state),e=>localized(e,message,409));
 assert.equal(nginxExistingPlan(site,null).config,original);assert.equal(current.config,original);
});
test('field, preset and unconfirmed apply requests fail with localized advice',()=>{
 assert.throws(()=>validateNginxField({type:'flag'},'on'),e=>localized(e,'이 설정은 인수 없이 작성합니다.'));
 assert.throws(()=>validateNginxField({type:'switch'},'invalid'),e=>localized(e,'설정 값을 확인하세요.'));
 assert.throws(()=>nginxServerPresetBody('invalid'),e=>localized(e,'서버 프리셋을 확인하세요.'));
 for(const input of [null,[],{}, {confirm:false}, {confirm:true,path:'/etc/nginx/nginx.conf',text:'',version:'invalid'}])assert.throws(()=>prepareNginxApply(input),e=>localized(e,'nginx 설정과 실행 환경 검토를 확인하세요.',400));
});
test('compiled validation detects an operating change and cleans up; early gates perform no operations',async()=>{
 await loadBindings();const source=await readFile(new URL('../lib/nginx-validation.ts',import.meta.url),'utf8');const {code}=await transform(source,{filename:'nginx-validation.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url);let plans=0,commands=0,writes=0,cleanups=0,uid=1000;
 const mocks={
  './nginx-work-directory.ts':{nginxWorkDirectory:async()=>'/mnt/data/build/tastedev-linux/nginx-no-files-fixture'},
  'node:fs/promises':{mkdir:async()=>{},writeFile:async()=>{writes++;},rm:async()=>{cleanups++;}},
  'node:child_process':{execFile:(_binary,_args,_options,callback)=>{commands++;callback(null,'','');}},
  './server-tools.ts':{nginxPlan:async()=>({config:++plans===1?'server { listen 80; }':'server { listen 81; }'})},
  './nginx-validation-diagnostic.ts':{},
 };
 const module={exports:{}};new Function('require','module','exports','process',code)(name=>mocks[name]??native(name),module,module.exports,{getuid:()=>uid,env:{NODE_ENV:process.env.NODE_ENV}});
 await assert.rejects(module.exports.validateNginxDraft(site),e=>localized(e,'검사 중 운영 설정이 변경되었습니다. 다시 검토하세요.',409));assert.equal(plans,2);assert.equal(commands,1);assert.equal(writes,1);assert.equal(cleanups,1);
 await assert.rejects(module.exports.validateNginxDraft({version:'existing'}),e=>localized(e,'기존 운영 설정은 전체 설정·인증서를 포함한 서버 적용 검사 경로를 사용하세요.',400));
 uid=0;await assert.rejects(module.exports.validateNginxDraft(site),e=>localized(e,'문법 검사는 일반 사용자 권한으로 실행하세요.',403));assert.equal(plans,2);assert.equal(commands,1);assert.equal(cleanups,1);
});
