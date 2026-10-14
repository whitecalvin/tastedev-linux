import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';

test('every PostgreSQL data context and executor diagnostic has a direct translation in every registered catalog',async()=>{
 await loadBindings();const keys=new Set();
 const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='StringLiteral'&&/[가-힣]/.test(node.value))keys.add(node.value);for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);};
 for(const file of ['postgresql-data-context.ts','postgresql-data-backup.ts'])walk(await parse(await readFile(new URL('../lib/'+file,import.meta.url),'utf8'),{filename:file,syntax:'typescript'}));
 assert(keys.size>=22,'cover actual executor errors, including the preserved-backup recovery diagnostic');
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));
  for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert(catalog[key].trim());assert(!/[가-힣]/.test(catalog[key]));assert.equal(translate(locale,key),catalog[key]);if(key.includes('PostgreSQL'))assert(catalog[key].includes('PostgreSQL'));}
 }
});
