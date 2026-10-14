import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {backupCertificateNginx} from '../lib/certificate-nginx-backup.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'],native=createRequire(import.meta.url);
const localized=(error,status)=>{assert.equal(error.status,status);for(const locale of locales){assert.notEqual(translate(locale,error.message),error.message);assert(!/[가-힣]/.test(translate(locale,error.message)));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all operation-plan and certificate-backup static diagnostics have native entries preserving identifiers',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['config-operation-plan','certificate-nginx-backup']){const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));literals.forEach(key=>keys.add(key));}assert.equal(keys.size,11);
 for(const locale of locales){const catalog=languageCatalog(locale);for(const key of keys){assert(Object.hasOwn(catalog,key));assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));for(const token of ['MariaDB','Redis','nginx','include','server_name'])if(key.includes(token))assert(catalog[key].toLowerCase().includes(token.toLowerCase()),locale+': '+token);}}
});
test('operation plan rejects incomplete, foreign and changed graph snapshots with translated errors',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/config-operation-plan.ts',import.meta.url),'utf8'),{filename:'config-operation-plan.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const version='a'.repeat(64),graphVersion='b'.repeat(64),target='/etc/mysql/conf.d/a.cnf';let phase='',topologyReads=0;
 const mocks={'./mariadb-topology.ts':{mariadbTopology:async()=>({complete:phase!=='incomplete',version:phase==='changed'&&++topologyReads===2?'c'.repeat(64):graphVersion,root:'/etc/mysql/my.cnf',files:phase==='foreign'?[]:[{path:target,version:phase==='file-version'?'d'.repeat(64):version}]})},'./config-live.ts':{readLiveConfig:async()=>({version:phase==='snapshot'?'e'.repeat(64):version,text:'[mariadbd]\nport=3306\n'}),parseLiveConfig:()=>({values:{port:3306},warnings:[]})},'./config-patch.ts':{patchConfig:()=> '[mariadbd]\nport=3307\n'},'./config-field-diff.ts':{configFieldDiff:()=>[]}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>mocks[name]??(name.startsWith('.')?{}:native(name)),module,module.exports);const input={kind:'mariadb',root:'/etc/mysql/my.cnf',path:target,version,graphVersion,changes:{port:3307}};
 await assert.rejects(module.exports.configOperationPlan({...input,version:null}),error=>localized(error,400));
 for(const [state,status,message] of [['incomplete',409,'MariaDB include 연결을 다시 조회하세요.'],['foreign',400,'선택한 main에 포함되지 않은 설정 파일입니다.'],['snapshot',409,'운영 설정 파일이 변경되었습니다. 다시 조회한 뒤 비교하세요.'],['file-version',409,'설정 연결의 파일 버전이 변경되었습니다.'],['changed',409,'설정 include 연결이 변경되었습니다.']]){phase=state;topologyReads=0;await assert.rejects(module.exports.configOperationPlan(input),error=>{assert.equal(error.message,message);return localized(error,status);});}
});
test('certificate backup rejects incomplete graphs, unmatched domains and conflicting canonical links before writes',async()=>{
 let backups=0,assertions=0;const root='/etc/nginx/nginx.conf';
 for(const phase of ['incomplete','domain','versions'])await assert.rejects(backupCertificateNginx('example.invalid',{readGraph:async(_base,_drafts,sources)=>{sources.set(root,'server { server_name '+(phase==='domain'?'other.invalid':'example.invalid')+'; }');return {complete:phase!=='incomplete',root,version:'graph',edges:[],files:[{path:root,version:'one'},...(phase==='versions'?[{path:'/etc/nginx/alias.conf',resolved:root,version:'two'}]:[])]};},assertGraph:async()=>{assertions++;},backup:async()=>{backups++;}}),error=>localized(error,409));
 assert.equal(backups,0);assert.equal(assertions,0);
});
