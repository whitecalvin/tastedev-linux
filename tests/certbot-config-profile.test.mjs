import test from 'node:test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {configProfile} from '../lib/config-profiles.ts';
test('Certbot draft renewal targets a named certificate or all certificates',()=>{
 assert.equal(configProfile('certbot',{operation:'renew-check'}),'/usr/bin/certbot renew --dry-run --non-interactive --no-random-sleep-on-renew\n');
 assert.equal(configProfile('certbot',{operation:'renew-check',certName:'example.com-0001'}),'/usr/bin/certbot renew --dry-run --non-interactive --no-random-sleep-on-renew --cert-name example.com-0001\n');
 for(const certName of [null,123,'--force-renewal','a;id','a b','a/b'])assert.throws(()=>configProfile('certbot',{operation:'renew-check',certName}));
});

test('Certbot renewal GUI guidance is translated in eight catalogs',async()=>{
 const keys=['갱신할 인증서 이름 (비우면 전체)','발급은 DNS·80 포트와 적용된 nginx 사이트가 필요합니다. 갱신 테스트는 지정한 인증서를 검사하며, 인증서 이름을 비우면 전체를 검사합니다.'];
 for(const language of ['en','ja','zh','es','fr','de','ru','ar']){
  const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+language+'.json',import.meta.url),'utf8'));
  for(const key of keys)assert(typeof catalog[key]==='string'&&catalog[key].trim()&&catalog[key]!==key,language+': '+key);
 }
});

test('Certbot config draft carries the chosen authenticator and only webroot includes its path',()=>{
 for(const authenticator of ['nginx','webroot','standalone']){const text=configProfile('certbot',{domain:'example.com',email:'admin@example.com',authenticator,webroot:'/srv/public'});assert(text.includes('--'+authenticator));assert.equal(text.includes('--webroot-path /srv/public'),authenticator==='webroot');assert.equal(text.includes('--redirect'),authenticator==='nginx');}
 assert.throws(()=>configProfile('certbot',{domain:'example.com',email:'admin@example.com',authenticator:'webroot',webroot:'/etc'}));
});


test('Certbot code draft preserves the webroot nginx installer choice and ignores it in other methods',()=>{
 const input={domain:'example.com',email:'admin@example.com',authenticator:'webroot',webroot:'/srv/public',installNginx:true};
 const text=configProfile('certbot',input);assert(text.includes('run --authenticator webroot --installer nginx'));assert(text.includes('--redirect'));assert(!text.includes('certonly'));
 const disabled=configProfile('certbot',{...input,installNginx:false});assert(disabled.includes('certonly --webroot'));assert(!disabled.includes('--installer'));
 for(const authenticator of ['nginx','standalone'])assert.equal(configProfile('certbot',{...input,authenticator}),configProfile('certbot',{...input,authenticator,installNginx:false}));
 for(const installNginx of ['true',1,null])assert.throws(()=>configProfile('certbot',{...input,installNginx}));
});
