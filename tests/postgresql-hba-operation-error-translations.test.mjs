import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {preparePostgresqlHbaOperation} from '../lib/postgresql-hba-operation.ts';
import {postgresqlHbaValidationPlan,postgresqlHbaValidationReport} from '../lib/postgresql-hba-validation.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=error=>{assert.equal(error.status,400);for(const locale of locales){const value=translate(locale,error.message);assert.notEqual(value,error.message);assert(!/[가-힣]/.test(value));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all static HBA operation and native report diagnostics have direct native translations',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['postgresql-hba-operation','postgresql-hba-validation']){const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));for(const key of literals)keys.add(key);}
 assert.equal(keys.size,28);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('PostgreSQL'))assert(catalog[key].includes('PostgreSQL'));}}
});
test('invalid operation inputs and malformed native responses stay rejected with localized messages',()=>{
 const path='/etc/postgresql/18/main/pg_hba.conf',input={path,version:'a'.repeat(64),text:'local all all peer\n',confirm:true,reviewVersion:'b'.repeat(64)};
 for(const changes of [{confirm:false},{reviewVersion:'invalid'},{unexpected:'field'}])assert.throws(()=>preparePostgresqlHbaOperation({...input,...changes},true),localized);
 for(const changes of [{backupId:'invalid'},{text:null}])assert.throws(()=>preparePostgresqlHbaOperation({...input,...changes}),localized);
 for(const run of [()=>postgresqlHbaValidationPlan('/etc',18),()=>postgresqlHbaValidationPlan('/mnt/data/build/tastedev-linux/linux-pg-hba-fixture',14),()=>postgresqlHbaValidationReport('{broken',{major:18,files:[]}),()=>postgresqlHbaValidationReport('x'.repeat(262145),{major:18,files:[]}),()=>postgresqlHbaValidationReport(JSON.stringify({schema:1,rows:[{file:'/etc/passwd',line:1,method:'peer',error:null}]}),{major:18,files:[]})])assert.throws(run,localized);
 assert.equal(input.text,'local all all peer\n');
});
