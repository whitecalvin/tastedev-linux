import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {parsePostgresqlHba,appendPostgresqlHba,updatePostgresqlHba,removePostgresqlHba,movePostgresqlHba} from '../lib/postgresql-hba.ts';
import {configSource} from '../lib/config-source.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=error=>{for(const locale of locales){const result=translate(locale,error.message);assert.notEqual(result,error.message,locale+': '+error.message);assert(!/[가-힣]/.test(result));}assert.equal(translate('ko',error.message),error.message);return true;};
test('literal HBA editing and source permission errors have direct translations in all 12 catalogs',async()=>{
 await loadBindings();const keys=new Set();
 for(const file of ['postgresql-hba','config-source']){const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));for(const key of literals)keys.add(key);}
 assert.equal(keys.size,9);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('sudo'))assert(catalog[key].includes('sudo'));}}
});
test('invalid HBA edits remain rejected and preserve original text while errors localize',()=>{
 const original='# keep\nlocal all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n';
 const values={type:'host',database:'all',user:'all',address:'127.0.0.1/32',method:'scram-sha-256',options:''};
 for(const run of [()=>parsePostgresqlHba('a'.repeat(262145)),()=>parsePostgresqlHba('local\0all'),()=>appendPostgresqlHba(original,{...values,user:'all\nextra'}),()=>appendPostgresqlHba(original,{...values,method:'unsupported'}),()=>appendPostgresqlHba(original,{...values,user:'"unterminated'}),()=>updatePostgresqlHba(original,1,values),()=>removePostgresqlHba(original,1),()=>movePostgresqlHba(original,2,'up'),()=>movePostgresqlHba(original,2,'sideways')])assert.throws(run,localized);
 assert.equal(original,'# keep\nlocal all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n');
 assert.equal(parsePostgresqlHba('host all all "unterminated')[0].kind,'raw','unrecognized syntax must remain raw for code/native inspection');
 const moved=movePostgresqlHba(original,3,'up');assert.equal(parsePostgresqlHba(moved)[0].method,'scram-sha-256');
});
test('HBA permission fallback localizes denial without bypassing policy or widening allowed paths',async()=>{
 let helperCalls=0,policyCalls=0;
 const path='/etc/postgresql/18/main/pg_hba.conf';
 const unreadable=Object.assign(Error('permission denied'),{code:'EACCES'});
 const mocks={readSource:async()=>{throw unreadable;},readPolicy:async()=>{policyCalls++;return {settings:{sudoWithoutPrompt:false}};},helper:async()=>{helperCalls++;throw Error('must not run');}};
 await assert.rejects(configSource('postgresql',path,mocks),error=>{assert.equal(error.status,403);return localized(error);});assert.equal(helperCalls,0);
 for(const target of ['/etc/postgresql/18/main/postgresql.conf','/etc/other/pg_hba.conf'])await assert.rejects(configSource('postgresql',target,mocks),error=>error===unreadable);
 await assert.rejects(configSource('nginx',path,mocks),error=>error===unreadable);assert.equal(policyCalls,1);
 const source='local all all peer\n';const result=await configSource('postgresql',path,{...mocks,readPolicy:async()=>({settings:{sudoWithoutPrompt:true}}),helper:async(action,input)=>{helperCalls++;assert.equal(action,'postgresql-hba-source');assert.deepEqual(input,{path});return {source};}});
 assert.deepEqual(result,{source});assert.equal(helperCalls,1);
});
