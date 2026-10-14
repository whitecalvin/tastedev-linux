import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {nginxConfig} from '../lib/nginx-config.ts';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('emitted nginx config generation runs without a TypeScript loader and retains strict validation',async()=>{
 const bytes=await readAdminRuntimeModule('nginx-config.mjs');assert.deepEqual(bytes,await readAdminRuntimeModule('nginx-config.mjs'));
 const url='data:text/javascript;base64,'+bytes.toString('base64');
 const input={domain:'app.example.com',port:80,mode:'proxy',upstreamPort:3000,bodySize:64,connectTimeout:10,readTimeout:120};
 const code=`import assert from 'node:assert/strict';const {nginxConfig}=await import(${JSON.stringify(url)});const input=${JSON.stringify(input)};const text=nginxConfig(input);for(const value of [true,null,[],[80],'0x50','1e2','80;id'])assert.throws(()=>nginxConfig({...input,port:value}));assert.throws(()=>nginxConfig({...input,domain:'example.com;id'}));assert.throws(()=>nginxConfig({...input,mode:'static',root:'/var/www/html',connectTimeout:10}));console.log(JSON.stringify(text));`;
 const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--input-type=module','-e',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout),nginxConfig(input));
});
