import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxConfig} from '../lib/nginx-config.ts';
import {nginxDraftForm} from '../lib/nginx-form-import.ts';
const site={domain:'app.example.com',port:80,mode:'proxy',upstreamPort:3000,root:'/var/www/html'};
test('nginx tree drafts transfer supported fields without dropping extra directives',()=>{const original=nginxConfig(site),changed=original.replace('127.0.0.1:3000','127.0.0.1:3200');assert.equal(nginxDraftForm(changed,original,site.domain).upstreamPort,3200);assert.throws(()=>nginxDraftForm(changed.replace('listen 80;','listen 80;\n    client_max_body_size 10m;'),original,site.domain));assert.throws(()=>nginxDraftForm(changed.replace(site.domain,'other.example.com'),original,site.domain));});
test('nginx GUI ports reject coerced values',()=>{for(const port of [true,false,null,[],[80],'0x50','8e1',' 80'])assert.throws(()=>nginxConfig({...site,port}));assert(nginxConfig({...site,port:'80'}).includes('listen 80;'));});
test('HTTPS tree form import preserves certificate and redirect settings while rejecting hidden changes',()=>{
 const tls=nginxConfig({...site,port:443}).replace('listen 443;','listen 443 ssl;').replace('    server_name app.example.com;','    server_name app.example.com;\n    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;\n    add_header X-Label "two  spaces";')+'server {\n    listen 80;\n    server_name app.example.com;\n    return 301 https://$host$request_uri;\n}\n';
 const changed=tls.replace('127.0.0.1:3000','127.0.0.1:4000');const form=nginxDraftForm(changed,tls,site.domain);assert.equal(form.https,true);assert.equal(form.port,443);assert.equal(form.upstreamPort,4000);
 for(const candidate of [changed.replace('fullchain.pem','other.pem'),changed.replace('return 301','return 302'),changed.replace('two  spaces','two spaces'),changed.replace('listen 443 ssl','listen 8443 ssl')])assert.throws(()=>nginxDraftForm(candidate,tls,site.domain));
});
test('upload limits round trip through location tree and reject coercion',()=>{
 const original=nginxConfig(site);
 for(const bodySize of [0,1,64,65536,'128']){const config=nginxConfig({...site,bodySize});assert(config.includes(`client_max_body_size ${Number(bodySize)}m;`));assert.equal(nginxDraftForm(config,original,site.domain).bodySize,Number(bodySize));}
 for(const bodySize of [true,false,null,[],[1],'','1e2','0x10',' 10',-1,65537,1.5])assert.throws(()=>nginxConfig({...site,bodySize}));
 assert(!original.includes('client_max_body_size'));
});
test('proxy timeouts transfer from tree without coercion or static leakage',()=>{
 const original=nginxConfig(site),configured=nginxConfig({...site,connectTimeout:'10',readTimeout:120});const form=nginxDraftForm(configured,original,site.domain);assert.equal(form.connectTimeout,10);assert.equal(form.readTimeout,120);
 for(const key of ['connectTimeout','readTimeout'])for(const value of [0,3601,true,null,'',[],[10],'1e2',1.5])assert.throws(()=>nginxConfig({...site,[key]:value}));
 assert.throws(()=>nginxConfig({...site,mode:'static',connectTimeout:10}));
});
test('live GUI availability distinguishes supported fields from lossy configurations',async()=>{
 const {nginxFormAvailability}=await import('../lib/nginx-form-import.ts');
 const supported=nginxFormAvailability(nginxConfig({...site,bodySize:64,connectTimeout:10}),site.domain);assert.equal(supported.form.bodySize,64);assert.equal(supported.editWarning,null);
 for(const source of [nginxConfig(site).replace('    listen 80;','    listen 80;\n    add_header X-Custom yes;'),nginxConfig(site).replace('        proxy_pass','        add_header X-Custom yes;\n        proxy_pass')]){const result=nginxFormAvailability(source,site.domain);assert.equal(result.form,null);assert(result.editWarning);}
});
test('existing operation plan refuses stale disabled mismatched and lossy live settings',async()=>{
 const {nginxExistingPlan}=await import('../lib/nginx-form-import.ts');const current={domain:site.domain,enabled:true,version:'fixture-version',config:nginxConfig(site)},input={...site,version:current.version,bodySize:64};assert.match(nginxExistingPlan(input,current).config,/client_max_body_size 64m;/);
 for(const state of [null,{...current,enabled:false},{...current,version:'changed'},{...current,domain:'other.example.com'},{...current,config:current.config.replace('    listen 80;','    listen 80;\n    add_header X-Custom yes;')}])assert.throws(()=>nginxExistingPlan(input,state),error=>error.status===409);
 assert.equal(nginxExistingPlan(site,null).config,nginxConfig(site));
});
