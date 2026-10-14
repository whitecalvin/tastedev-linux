import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {isAuthStorageError,authStorageMessage} from '../lib/auth-storage-error.ts';
import {copyNginxNode,pasteNginxNode} from '../lib/nginx-node-transfer.ts';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
test('all static nginx node transfer and terminal state errors have native catalog entries',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['nginx-node-transfer.ts','terminal-session-state.ts'])for(const key of diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file,import.meta.url),'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})})).literals)keys.add(key);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('server'))assert(catalog[key].includes('server'));}}
});
test('nginx invalid paste and self move preserve the source and return localized errors',()=>{
 const source='http { server { server_name original.example; } }';const roots=parseNginxTree(source),server=roots[0].children[0];const block=copyNginxNode(source,server.id);
 for(const run of [()=>pasteNginxNode(source,block,roots[0].id,{domain:'invalid domain'}),()=>pasteNginxNode(source,block,server.id,{moveId:server.id}),()=>pasteNginxNode(source,block+'\n'+block,roots[0].id)])assert.throws(run,error=>{for(const locale of locales)assert.notEqual(translate(locale,error.message),error.message);return true;});assert.equal(source,'http { server { server_name original.example; } }');
});
test('storage-specific internal diagnostics are classified into the already translated public guidance',()=>{
 for(const message of ['인증 저장 경로 권한을 확인하세요.','인증 저장 파일 권한을 확인하세요.','계정 저장 경로를 확인하세요.','계정 설정 파일을 확인하세요.','인증 키를 확인하세요.'])assert.equal(isAuthStorageError(Error(message)),true);assert.equal(isAuthStorageError(Error('unrelated')),false);
 for(const locale of locales){const value=translate(locale,authStorageMessage);assert.notEqual(value,authStorageMessage);assert(value.includes('LINUX_AUTH_ROOT')&&value.includes('0700')&&value.includes('0600'));}assert.equal(translate('ko',authStorageMessage),authStorageMessage);
});
