import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,transform,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
test('all literal Korean API diagnostics have direct native entries in twelve catalogs',async()=>{
 await loadBindings();const source=await readFile(new URL('../lib/api.ts',import.meta.url),'utf8');const {literals}=diagnosticCandidates(await parse(source,{filename:'api.ts'}));assert(literals.length>=14);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of literals){assert(Object.hasOwn(catalog,key),locale+': '+key);assert(!/[가-힣]/.test(catalog[key]));assert.equal(translate(locale,key),catalog[key]);if(key.includes('MariaDB'))assert(catalog[key].includes('MariaDB'));if(key.includes('JSON'))assert(catalog[key].includes('JSON'));}}
});
test('actual API request guards keep status codes and produce translatable errors before any privileged work',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});const module={exports:{}};let calls=0;
 const mocks={'./auth.ts':{cookieSession:async()=>({username:'fixture'})},'./security.ts':{securitySettings:async()=>({settings:{readOnly:true}})},'./auth-storage-error.ts':{isAuthStorageError:()=>false}};
 new Function('require','module','exports',code)(name=>mocks[name]??new Proxy({},{get:()=>()=>{calls++;throw Error('unexpected backend work');}}),module,module.exports);
 const base='http://127.0.0.1:8791/api/';const cases=[['unknown',{method:'GET'},404,'페이지를 찾을 수 없습니다.'],['network-settings',{method:'POST',headers:{Origin:'https://foreign.invalid','Content-Type':'application/json'},body:'{}'},403,'다른 사이트의 요청은 허용하지 않습니다.'],['network-settings',{method:'POST',body:'{}'},415,'JSON 요청이 필요합니다.'],['network-settings',{method:'POST',headers:{'Content-Type':'application/json'}},400,'요청 본문이 필요합니다.'],['network-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(20001)},413,'요청 크기가 너무 큽니다.']];
 for(const body of ['null','[]','true','42','"text"'])cases.push(['network-settings',{method:'POST',headers:{'Content-Type':'application/json'},body},400,'설정 값을 확인하세요.']);
 for(const action of ['ai-settings','system-settings','network-settings'])cases.push([action,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'},403,action==='ai-settings'?'조회 전용 모드에서는 AI 설정을 저장할 수 없습니다.':action==='system-settings'?'조회 전용 모드에서는 시스템 설정을 저장할 수 없습니다.':'조회 전용 모드에서는 접속 설정을 저장할 수 없습니다.']);
 for(const [action,options,status,message] of cases){const response=await module.exports.handle(new Request(base+action,options),action);assert.equal(response.status,status);assert.equal((await response.json()).error,message);for(const locale of locales)assert.notEqual(translate(locale,message),message);assert.equal(translate('ko',message),message);}assert.equal(calls,0);
});
