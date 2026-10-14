import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadBindings,parse} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {certificateCommand} from '../lib/certificate-command.ts';
import {certificateExecution} from '../lib/certificate-execution.ts';
import {nginxConfig} from '../lib/nginx-config.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=error=>{assert.equal(error.status,400);for(const locale of locales){assert.notEqual(translate(locale,error.message),error.message);assert(!/[가-힣]/.test(translate(locale,error.message)));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all certificate and nginx config diagnostic entries preserve paths, protocols and numeric bounds',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['certificate-command','nginx-config']){const extension=['certificate-command','nginx-config','nginx-form-import','nginx-fields','nginx-code-import','nginx-server-presets','site-form'].includes(file)?'.ts':'.mjs';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));literals.forEach(key=>keys.add(key));}assert.equal(keys.size,16);
 for(const locale of locales){const catalog=languageCatalog(locale);for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));for(const token of ['nginx','HTTPS','webroot','hook','/var/www','/srv','/opt','/usr/share/nginx','MB',...key.matchAll(/\d+/g)].map(value=>typeof value==='string'?value:value[0]))if(key.includes(token))assert(catalog[key].includes(token),locale+': '+token);}}
});
test('invalid certificate requests reject with localized diagnostics before any privileged execution hook',async()=>{
 const base={domain:'example.invalid',email:'admin@example.invalid',confirm:true,agree:true};let actions=0;const forbidden=()=>{actions++;throw Error('must not execute');},hooks={backupNginx:forbidden,inspectDirectory:forbidden,run:forbidden};
 const changes=[{operation:'other'},{staging:'true'},{authenticator:'dns'},{installNginx:'true'},{installNginx:true,authenticator:'standalone'},{email:'not email'},{authenticator:'webroot',webroot:'/etc'},{operation:'renew-check',certName:'../escape'},{operation:'renew-check',directoryHooks:'false'},{domain:'bad; command'}];
 for(const change of changes){assert.throws(()=>certificateCommand({...base,...change}),localized);await assert.rejects(certificateExecution({...base,...change},hooks),localized);}assert.equal(actions,0);
 assert(certificateCommand({...base,authenticator:'webroot',webroot:'/srv/site',installNginx:true}).includes('--installer'));
});
test('nginx form validation localizes every rejection while maintaining boundary and injection rules',()=>{
 const base={domain:'example.invalid',port:80,mode:'proxy',upstreamPort:3000};
 for(const change of [{domain:'a;bad'},{port:0},{port:65536},{mode:'invalid'},{upstreamPort:0},{upstreamPort:65536},{mode:'static',root:'/srv/has space'},{mode:'static',root:'/srv/../etc'},{bodySize:-1},{bodySize:65537},{connectTimeout:0},{readTimeout:3601}])assert.throws(()=>nginxConfig({...base,...change}),localized);
 for(const port of [1,65535])assert(nginxConfig({...base,port,upstreamPort:port}).includes('listen '+port+';'));
 assert(nginxConfig({...base,bodySize:0,connectTimeout:1,readTimeout:3600}).includes('proxy_read_timeout 3600s;'));
 assert(nginxConfig({...base,bodySize:65536}).includes('client_max_body_size 65536m;'));
});
