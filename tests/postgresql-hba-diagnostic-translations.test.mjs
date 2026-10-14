import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {postgresqlHbaDiagnosticMessage} from '../lib/postgresql-hba.ts';
import {postgresqlHbaValidationReport} from '../lib/postgresql-hba-validation.ts';
import {translate} from '../lib/i18n.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const categories=['invalid-method','invalid-address','invalid-option','missing-include','invalid-rule','cycle-or-limit','missing-file','unsafe-or-unreadable','token-limit','unsafe-list-reference','missing-directory','unsafe-include-reference','changed-during-inspection','directory-changed','optional-file-appeared','optional-file-unreadable'];
test('all HBA diagnostic categories and safe fallback have direct native descriptions',async()=>{
 const source=await readFile(new URL('../lib/postgresql-hba.ts',import.meta.url),'utf8');
 const declared=[...source.matchAll(/'([a-z-]+)':'([^']*[가-힣][^']*)'/g)].map(match=>match[1]);assert.deepEqual(declared,categories);
 const keys=[...categories.map(postgresqlHbaDiagnosticMessage),postgresqlHbaDiagnosticMessage('unknown')];assert.equal(new Set(keys).size,17);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('PostgreSQL'))assert(catalog[key].includes('PostgreSQL'));if(key.includes('CIDR'))assert(catalog[key].includes('CIDR')&&catalog[key].includes('IP'));assert.equal(translate('ko',key),key);}}
});
test('bounded native reports retain path and line while each safe category localizes',()=>{
 const nativePath='/mnt/data/build/tastedev-linux/linux-pg-hba-fixture/pg_hba.conf',sourcePath='/etc/postgresql/18/main/pg_hba.conf';
 const rows=categories.slice(0,5).map((error,i)=>({file:nativePath,line:i+1,method:null,error,privateOption:'password=private-value'}));
 const report=postgresqlHbaValidationReport(JSON.stringify({schema:1,rows}),{major:18,files:[{nativePath,sourcePath}]});
 assert.equal(report.valid,false);assert.equal(report.authenticationAttempted,false);assert(!JSON.stringify(report).includes('private-value'));
 for(const locale of locales)for(const item of report.diagnostics){const explanation=translate(locale,postgresqlHbaDiagnosticMessage(item.category));const displayed=item.path+':'+item.line+' · '+explanation;assert(displayed.startsWith(sourcePath+':'+item.line));assert(!/[가-힣]/.test(explanation));}
 const unexpected={...rows[0],error:'secret=private-value'};assert.throws(()=>postgresqlHbaValidationReport(JSON.stringify({schema:1,rows:[unexpected]}),{major:18,files:[{nativePath,sourcePath}]}));
 for(const category of ['secret=private-value','__proto__','constructor',null,undefined])for(const locale of locales){const text=translate(locale,postgresqlHbaDiagnosticMessage(category));assert.equal(text,translate(locale,postgresqlHbaDiagnosticMessage('unknown')));assert(!text.includes('private-value'));}
});
