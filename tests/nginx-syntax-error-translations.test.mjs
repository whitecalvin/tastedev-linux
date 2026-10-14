import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {parseNginxTree,addNginxDirective,duplicateNginxNode,moveNginxNode,updateNginxBlock,removeNginxBlock} from '../lib/nginx-syntax.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
test('every literal nginx display-parser error has a direct native translation',async()=>{
 await loadBindings();const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/nginx-syntax.ts',import.meta.url),'utf8'),{filename:'nginx-syntax.ts'}));assert(literals.length>=12);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of literals){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('application/json'))assert(catalog[key].includes('MIME')&&catalog[key].includes('application/json'));}}
});
test('real parser and editing errors localize while invalid syntax and ambiguous edits remain rejected',()=>{
 const original='http { server { listen 80; } }';
 const attempts=[()=>parseNginxTree('}'),()=>parseNginxTree('http {'),()=>parseNginxTree('listen "80;'),()=>parseNginxTree('listen 80'),()=>parseNginxTree('a 1;'.repeat(2001)),()=>duplicateNginxNode(original,'missing'),()=>moveNginxNode(original,'1','sideways'),()=>moveNginxNode(original,'missing','up'),()=>updateNginxBlock(original,'missing',''),()=>removeNginxBlock(original,'missing'),()=>addNginxDirective(original,'1','listen','80','unknown'),()=>addNginxDirective('types {}','1','bad mime','html'),()=>addNginxDirective('map $a $b {}','1','bad key','value'),()=>addNginxDirective('upstream example { least_conn; }','1','hash','$request_uri')];
 for(const run of attempts)assert.throws(run,error=>{for(const locale of locales){const value=translate(locale,error.message);assert.notEqual(value,error.message);assert(!/[가-힣]/.test(value));}return true;});assert.equal(original,'http { server { listen 80; } }');
});
