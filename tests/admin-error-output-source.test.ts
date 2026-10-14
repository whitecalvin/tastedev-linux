import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {adminErrorOutputSource,assertAdminErrorOutputCurrent,adminNginxConfigSource,assertAdminNginxConfigCurrent} from '../scripts/admin/error-output-source.mts';
import {helperErrorOutput} from '../scripts/admin/helper-error-output.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('root helper contains the exact compiled TypeScript error formatter',async()=>{
 await assertAdminErrorOutputCurrent();
 const emitted=await adminErrorOutputSource();
 assert(!emitted.includes('export function'));
 assert(emitted.includes('function helperErrorOutput('));
});

test('nginx helper input validation exactly matches the embedded TypeScript source',async()=>{
 await assertAdminNginxConfigCurrent();
 const emitted=await adminNginxConfigSource();
 for(const fn of ['hash','domain','port','config','updateConfig'])assert(emitted.includes('function '+fn+'('));
 assert(!/\b(?:export|import)\s/.test(emitted));
 const root=await verificationWorkDirectory('admin-nginx-config-source-');
 try{
  const directory=join(root,'scripts/admin');await mkdir(directory,{recursive:true});
  await copyFile(resolve('scripts/admin/helper-nginx-config.mts'),join(directory,'helper-nginx-config.mts'));
  const source=await readFile('scripts/admin/linux-admin','utf8');
  await writeFile(join(directory,'linux-admin'),source);await assertAdminNginxConfigCurrent(root);
  for(const invalid of [source.replace('function domain(value)','function domain(stale)'),source.replace('// BEGIN TYPESCRIPT HELPER NGINX CONFIG','// missing config marker'),source+'\n// END TYPESCRIPT HELPER NGINX CONFIG\n']){
   await writeFile(join(directory,'linux-admin'),invalid);
   await assert.rejects(assertAdminNginxConfigCurrent(root),/differs|Missing or ambiguous/);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});

test('helper source validation refuses stale output and missing or duplicate markers',async()=>{
 const root=await verificationWorkDirectory('admin-error-output-source-');
 try{
  const directory=join(root,'scripts/admin');await mkdir(directory,{recursive:true});
  await copyFile(resolve('scripts/admin/helper-error-output.mts'),join(directory,'helper-error-output.mts'));
  const source=await readFile('scripts/admin/linux-admin','utf8');
  await writeFile(join(directory,'linux-admin'),source);await assertAdminErrorOutputCurrent(root);
  for(const invalid of [source.replace('function helperErrorOutput(error, action)','function helperErrorOutput(error, stale)'),source.replace('// BEGIN TYPESCRIPT HELPER ERROR OUTPUT','// missing marker'),source+'\n// END TYPESCRIPT HELPER ERROR OUTPUT\n']){
   await writeFile(join(directory,'linux-admin'),invalid);
   await assert.rejects(assertAdminErrorOutputCurrent(root),/differs|Missing or ambiguous/);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});

test('typed formatter preserves safe messages and hides unsafe native details',()=>{
 for(const status of [400,403,404,409,422,500,503]){
  assert.deepEqual(JSON.parse(helperErrorOutput({status,message:'검수 오류'},'nginx-check')),{protocol:'tastedev-helper-error-v1',action:'nginx-check',status,message:'검수 오류'});
 }
 const fallback='관리 작업을 완료하지 못했습니다.';
 for(const error of [null,undefined,'private output',{status:401,message:'secret'},{status:400,message:'secret\noutput'},{status:400,message:'secret\0output'},{status:400,message:'한'.repeat(667)}])assert.equal(JSON.parse(helperErrorOutput(error,'nginx-check')).message,fallback);
 assert.equal(JSON.parse(helperErrorOutput({status:400,message:'a'.repeat(2000)},'nginx-check')).message.length,2000);
});

test('typed nginx configuration preserves HTTPS and refuses stale or unpreservable edits',async()=>{
 const mark='# Managed by LINUX\n';
 const context=vm.createContext({createHash,MARK:mark,Buffer,fail(message:string){throw Error(message);}});
 vm.runInContext(await adminNginxConfigSource(),context);
 function invoke(name:string,...args:unknown[]):unknown{return vm.runInContext(name+'('+args.map(arg=>JSON.stringify(arg)).join(',')+')',context);}
 function text(value:unknown):string{assert(typeof value==='string');return value;}
 const input={domain:'App.Example.com',mode:'proxy',port:80,upstreamPort:3000,bodySize:0,connectTimeout:10,readTimeout:30};
 const original=text(invoke('config',input));
 assert(original.startsWith(mark));assert(original.includes('server_name app.example.com;'));
 assert(original.includes('client_max_body_size 0m;'));assert(original.includes('proxy_read_timeout 30s;'));
 assert.equal(invoke('updateConfig',input,null),original);
 assert.throws(()=>invoke('updateConfig',{...input,version:'stale'},original),/changed/);
 assert.throws(()=>invoke('updateConfig',{...input,version:'stale'},null),/missing/);
 const https=original.replace('listen 80;','listen 443 ssl;\n    ssl_certificate /etc/fixture/cert.pem;\n    ssl_certificate_key /etc/fixture/key.pem;');
 const version=text(invoke('hash',https));
 const changed=text(invoke('updateConfig',{...input,port:443,upstreamPort:4000,version},https));
 assert(changed.includes('listen 443 ssl;'));assert(changed.includes('ssl_certificate_key /etc/fixture/key.pem;'));
 assert(changed.includes('proxy_pass http://127.0.0.1:4000;'));assert(!changed.includes(':3000;'));
 assert.throws(()=>invoke('updateConfig',{...input,version},https),/port must be preserved/);
 const unsupported=original.replace('proxy_pass http://127.0.0.1:3000;','proxy_pass http://127.0.0.1:3000;\n        add_header X-Custom value;');
 assert.throws(()=>invoke('updateConfig',{...input,version:invoke('hash',unsupported)},unsupported),/cannot preserve/);
 for(const patch of [{bodySize:-1},{bodySize:65537},{connectTimeout:0},{readTimeout:3601},{mode:'static',root:'/var/www/../secret'},{mode:'static',root:'/var/www',readTimeout:1}])assert.throws(()=>invoke('config',{...input,...patch}),/Invalid/);
 const staticSite=text(invoke('config',{domain:'app.example.com',port:8080,mode:'static',root:'/var/www/app'}));
 assert(staticSite.includes('root /var/www/app;'));assert(staticSite.includes('try_files $uri $uri/ =404;'));
});
