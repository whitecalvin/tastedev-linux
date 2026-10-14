import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadBindings,parse} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';
test('all network/restart/general settings module diagnostics have direct translations in twelve catalogs',async()=>{
 await loadBindings();const keys=new Set();
 const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='StringLiteral'&&/[가-힣]/.test(node.value))keys.add(node.value);for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);};
 for(const file of ['network-settings.ts','app-restart.ts','system-settings.ts'])walk(await parse(await readFile(new URL('../lib/'+file,import.meta.url),'utf8'),{filename:file}));
 assert(keys.size>=15,'scan actual module diagnostics rather than a duplicated list');
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));
  for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert(!/[가-힣]/.test(catalog[key]));assert.equal(translate(locale,key),catalog[key]);if(key.includes('IPv4'))assert(catalog[key].includes('IPv4'));if(key.includes('0.0.0.0'))assert(catalog[key].includes('0.0.0.0'));if(key.includes('1024'))assert(catalog[key].includes('1024')&&catalog[key].includes('65535'));}
 }
});
