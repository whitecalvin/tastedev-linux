import * as packageIdeTypes from '../components/package-ide-types.ts';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import tr from '../lib/locales/tr.json' with {type:'json'};
import {translate,languageCoverage} from '../lib/i18n.ts';
import {nginxSettingInfo,nginxBlockInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxModulePresets} from '../lib/nginx-module-settings.ts';

test('Turkish nginx settings and block help has direct translations with no English fallback',async()=>{
 const descriptions=new Set();
 const collect=node=>{
  if(!node||typeof node!=='object')return;
  if(node.type==='StringLiteral'&&/[가-힣]/.test(node.value))descriptions.add(node.value);
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')collect(value);
 };
 await loadBindings();
 const files=new Set(['nginx-setting-info.ts','nginx-module-settings.ts','nginx-protocol-help.ts','nginx-mapping-help.ts','nginx-operational-help.ts',...(await readdir(new URL('../lib/',import.meta.url))).filter(name=>/^nginx-(?:main|http-core|proxy|tls|upstream)-settings\.(?:mjs|ts)$/.test(name))]);
 for(const file of files){
  const source=await readFile(new URL('../lib/'+file,import.meta.url),'utf8');
  collect(await parse(source,{filename:file}));
 }
 assert(descriptions.size>=315,'cover all separated description modules and escaped strings');
 assert([...descriptions].some(text=>text.includes('proxy_set_header Connection ""')),'retain quoted configuration examples');
 for(const text of descriptions){assert(Object.hasOwn(tr,text),'Missing Turkish help: '+text);assert.equal(translate('tr-TR',text),tr[text]);assert(!/[가-힣]/.test(tr[text]));}
 for(const context of ['http','server','location'])for(const {name}of nginxModulePresets(context)){
  const description=nginxSettingInfo(name,context).description;assert(Object.hasOwn(tr,description),name+' must use directly translated runtime help');
 }
 assert.equal(languageCoverage('tr-TR').complete,true,'the current Turkish UI catalog is fully populated');
});
test('Turkish selected-node help retains directive tokens and translated setting search',()=>{
 const worker=translate('tr',nginxSettingInfo('worker_connections','events').description);
 assert(worker.includes('İstemci ve üst sunucu'));assert(worker.includes('dosya tanıtıcısı'));
 const realip=translate('tr',nginxSettingInfo('real_ip_header','http').description);
 assert(realip.includes('proxy_protocol'));assert(realip.includes('listen'));assert(realip.includes('realip'));
 assert(translate('tr',nginxBlockInfo('location','http').description).includes('~*'));
 assert(translate('tr',nginxSettingInfo('proxy_pass','stream:server').description).includes("HTTP URL'si kullanılmaz"));
 assert(translate('tr',nginxSettingInfo('delete','geo').description).includes('Dosya silme komutu değildir'));
 assert(translate('tr',nginxSettingInfo('volatile','geo').description).includes('1.29.3'));
 assert(nginxSettingMatches('proxy_buffering','on','arabelleğe',text=>translate('tr',text),'server'));
});

test('Turkish nginx IDE and package shell catalogued labels are directly translated',async()=>{
 const names=(await readdir(new URL('../components/',import.meta.url))).filter(name=>name.startsWith('nginx-')&&/\.[jt]sx$/.test(name));names.push('console-workspace.tsx','console-chrome.tsx');
 const en=JSON.parse(await readFile(new URL('../lib/locales/en.json',import.meta.url),'utf8'));
 const texts=new Set();for(const file of names){const source=await readFile(new URL('../components/'+file,import.meta.url),'utf8');for(const match of source.matchAll(/(['"])([^'"\r\n]*[가-힣][^'"\r\n]*)\1/g)){const text=match[2].trim();if(Object.hasOwn(en,text))texts.add(text);}}
 assert(texts.has('사이트 연결')); assert(texts.has('조건에 맞는 패키지가 없습니다.'));
 for(const text of texts){assert(Object.hasOwn(tr,text),'Missing direct UI translation: '+text);assert.equal(translate('tr-TR',text),tr[text]);}
 assert(translate('tr','원본은 복원했지만 서비스 복구가 필요합니다.').includes('ancak hizmet kurtarma'));
});
