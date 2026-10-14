import {hasErrorCode} from '../lib/error-code.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {parse,transform,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {validateSecurity} from '../lib/security.ts';
import {helperCommand,runHelper} from '../lib/privilege.ts';
import {featureAllowed} from '../lib/capabilities.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
function localized(error){for(const locale of locales){const value=translate(locale,error.message);assert.notEqual(value,error.message);assert(!/[가-힣]/.test(value));if(error.message.includes('LINUX_ENABLE_ADMIN'))assert(value.includes('LINUX_ENABLE_ADMIN'));}return true;}
test('all literal security and privileged-operation exceptions have native catalog entries',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['security.ts','privilege.ts'])for(const key of diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file,import.meta.url),'utf8'),{filename:file})).literals)keys.add(key);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));}}
});
test('invalid security options and unknown or disabled helper operations remain blocked with localized diagnostics',async()=>{
 assert.throws(()=>validateSecurity({}),error=>error.status===400&&localized(error));assert.throws(()=>helperCommand('arbitrary-command'),localized);
 const previous=process.env.LINUX_ENABLE_ADMIN;process.env.LINUX_ENABLE_ADMIN='false';try{await assert.rejects(runHelper('nginx-check'),error=>error.status===403&&localized(error));}finally{if(previous===undefined)delete process.env.LINUX_ENABLE_ADMIN;else process.env.LINUX_ENABLE_ADMIN=previous;}
});
test('actual security module keeps unreadable policy and read-only feature gates closed',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/security.ts',import.meta.url),'utf8'),{filename:'security.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});const native=createRequire(import.meta.url);let missing=true,reads=0;
 const module={exports:{}};const mocks={'./error-code.ts':{hasErrorCode},'./runtime-paths.ts':{stateRoot:()=>'/fixture'},'./privilege.ts':{helperStatus:()=>({ready:false})},'./capabilities.ts':{featureAllowed},'./audit-log-page.ts':{},'node:fs/promises':{readFile:async()=>{reads++;throw Object.assign(Error('fixture denied'),{code:missing?'ENOENT':'EACCES'});}}};
 new Function('require','module','exports',code)(name=>mocks[name]??native(name),module,module.exports);
 await assert.rejects(module.exports.assertFeature('terminal'),error=>error.status===403&&localized(error));assert.equal(reads,1);missing=false;await assert.rejects(module.exports.securitySettings(),error=>error.status===403&&localized(error));assert.equal(reads,2);
});
