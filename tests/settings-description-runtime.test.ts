import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 settings descriptions, preference and theme metadata run emitted JavaScript with preserved JSON imports',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','settings-description-runtime-'));
 try{
  const names=['language-preference','theme-init','redis-setting-names','postgresql-setting-description','postgresql-hba-description','mariadb-setting-description','redis-setting-description','i18n-core'],allowed=names.map(name=>'lib/'+name+'.mjs');
  for(const file of allowed)await writeFile(join(root,file.slice(4)),await readRuntimeModule(file,allowed),{mode:0o600});
  await mkdir(join(root,'locales'),{mode:0o700});
  for(const name of ['linux-languages','postgresql-descriptions','postgresql-description-overrides','postgresql-hba-descriptions'])await copyFile(new URL('../lib/locales/'+name+'.json',import.meta.url),join(root,'locales',name+'.json'));
  const files:string[]=[];
  for(const name of ['postgresql-setting-description','mariadb-setting-description','redis-setting-description']){
   const source=await readFile(new URL('./'+name+'.test.mjs',import.meta.url),'utf8'),output=join(root,name+'.test.mjs');
   await writeFile(output,source.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'./$1.mjs').replace(/\.\.\/lib\/locales\//g,'./locales/'),{mode:0o600});files.push(output);
  }
  const worker=join(root,'preference.test.mjs');await writeFile(worker,`import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {initialLanguage,languageDirection,languageCookie} from './language-preference.mjs';import {themeInitScript} from './theme-init.mjs';import {postgresqlHbaDescription} from './postgresql-hba-description.mjs';import {redisSettingNames,redisSettingSuggestionNames} from './redis-setting-names.mjs';test('explicit locale precedes weighted browser preferences and initialization metadata stays stable',()=>{assert.deepEqual(initialLanguage('ko-KR','en-US'),{locale:'ko-KR',persisted:true});assert.equal(initialLanguage(null,'en;q=0.2,ja-JP;q=0.9').locale,'ja-JP');assert.equal(languageDirection('ar-SA'),'rtl');assert(languageCookie('ko',true).endsWith('; Secure'));assert.equal(redisSettingNames.length,223);assert.equal(redisSettingSuggestionNames.length,185);assert(Object.isFrozen(redisSettingNames));assert(postgresqlHbaDescription('database','ko').text);assert.equal(postgresqlHbaDescription('unknown','ko').text,'');const document={documentElement:{dataset:{}}};vm.runInNewContext(themeInitScript,{document,localStorage:{getItem(){throw Error('denied')}},matchMedia:()=>({matches:true})});assert.equal(document.documentElement.dataset.theme,'dark');});`,{mode:0o600});files.push(worker);
  const localized=join(root,'localized-description.test.mjs');
  await writeFile(localized,`import test from 'node:test';import assert from 'node:assert/strict';import catalogs from './locales/postgresql-descriptions.json' with {type:'json'};import overrides from './locales/postgresql-description-overrides.json' with {type:'json'};import hba from './locales/postgresql-hba-descriptions.json' with {type:'json'};import {postgresqlSettingDescription as describe} from './postgresql-setting-description.mjs';import {postgresqlHbaDescription as help} from './postgresql-hba-description.mjs';test('emitted Node22 modules load complete Catalan, Finnish, Dutch, Danish, Norwegian, Romanian, Vietnamese, Hungarian, Greek, Bulgarian, Czech, Slovak and Hindi PostgreSQL setting and HBA descriptions',()=>{const keys=new Set([...Object.keys(catalogs.en),...Object.keys(overrides.en)]);assert.equal(keys.size,351);for(const [locale,language] of [['ca-ES','ca'],['fi-FI','fi'],['nl-BE','nl'],['da-DK','da'],['nb-NO','nb'],['ro-RO','ro'],['vi-VN','vi'],['hu-HU','hu'],['el-GR','el'],['bg-BG','bg'],['cs-CZ','cs'],['sk-SK','sk'],['hi-IN','hi']]){for(const name of keys){const result=describe(name,locale);assert.equal(result.language,language,locale+': '+name);assert(result.translated,name);assert(result.paragraphs.length>0,name);}for(const name of Object.keys(hba.en)){const result=help(name,locale.replace('-','_')+'.UTF-8');assert.equal(result.language,language,locale+': '+name);assert(result.translated,name);assert(result.text,name);}assert.equal(describe('unknown.extension',locale).translated,false);assert.equal(describe('__proto__',locale).paragraphs.length,0);}});`,{mode:0o600});files.push(localized);
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...files],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 21\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
