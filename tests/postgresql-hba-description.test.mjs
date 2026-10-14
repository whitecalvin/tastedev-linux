import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {hbaTypes,hbaMethods} from '../lib/postgresql-hba.ts';
import {postgresqlHbaDescription as describe} from '../lib/postgresql-hba-description.ts';
const locales=['ko','en','ja','zh','es','fr','de','ru','pt','ar','id','it','ka','pl','sv','tr','uk','ca','fi','nl','da','nb','ro','vi','hu','el','bg','cs','sk','hi'];
const fields=['type','database','user','address','method','options'];

test('HBA field, connection and authentication help covers every UI language and region without fallback',()=>{
 for(const locale of locales)for(const key of [...fields,...hbaTypes,...hbaMethods]){
  const help=describe(key,locale.toUpperCase()+'_XX');assert.equal(help.language,locale);assert(help.translated,locale+': '+key);assert(help.text.trim().length>0,locale+': '+key);
  if(locale!=='en')assert.notEqual(help.text,describe(key,'en').text,locale+': '+key);
 }
 assert.equal(describe('peer','is-IS').language,'en');assert.equal(describe('peer','is-IS').translated,false);
 for(const key of ['constructor','__proto__','unknown'])assert.equal(describe(key,'ko').text,'');
 assert.match(describe('md5','en').text,/MD5 or SCRAM/);assert.match(describe('sspi','en').text,/unavailable on Linux/);
});

test('HBA rendered fields update localized help and selected method without changing the source',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-hba-settings.tsx',import.meta.url),'utf8'),{filename:'postgresql-hba-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};let locale='ko';
 const input=props=>React.createElement('input',{'aria-label':props.label,'aria-description':props['aria-description'],value:props.value,readOnly:true,disabled:props.disabled});
 const select=props=>React.createElement('select',{'aria-label':props.label,'aria-description':props['aria-description'],value:props.value,onChange:props.onChange},props.options.map(option=>React.createElement('option',{key:option.value,value:option.value},option.label)));
 const require=name=>name==='./console-types'?consoleTypes:name==='./language-provider'?{useLanguage:()=>({locale,t:value=>value})}:name==='./ui/confirm-dialog'?{__esModule:true,default:()=>null}:name==='./ui/controls'?{Button:({children})=>React.createElement('button',null,children),TextInput:input,Dropdown:select}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const record={text:'local all all peer\nhostssl app app 127.0.0.1/32 cert\n'},original=record.text;
 const render=()=>renderToStaticMarkup(React.createElement(module.exports.default,{record,onChange:()=>assert.fail('Help must not edit configuration'),onCode:()=>{}}));
 for(locale of locales){const html=render();assert(html.includes('lang="'+locale+'"'));assert(html.includes(describe('peer',locale).text));assert(html.includes(describe('cert',locale).text));assert(html.includes('aria-description='));assert.equal(record.text,original);}
 locale='ja';record.text='host all all 127.0.0.1/32 reject\n';assert(render().includes(describe('reject','ja').text));
});
