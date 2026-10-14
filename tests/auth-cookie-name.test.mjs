import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionCookie,sessionToken} from '../lib/auth.ts';
test('cookie selection accepts only the configured cookie and rejects ambiguous duplicate tokens',()=>{
 const old=process.env.LINUX_COOKIE_SECURE;
 try{
  for(const secure of [false,true]){
   process.env.LINUX_COOKIE_SECURE=String(secure);const name=secure?'__Secure-linux_session':'linux_session';
   const request=cookie=>new Request('https://fixture.invalid/api/auth/status',{headers:{cookie}});
   assert.equal(sessionToken(request('other=one; '+name+'=valid; locale=ko')),'valid');
   for(const cookie of [name+'=',name+'=first; '+name+'=second','other_'+name+'=forged','other='+name+'=forged',secure?'linux_session=plain':'__Secure-linux_session=secure'])assert.equal(sessionToken(request(cookie)),null,cookie);
   assert(sessionCookie(request(''), 'valid').startsWith(name+'=valid;'));
   assert.match(sessionCookie(request('')),/Max-Age=0; Secure$/);
  }
 }finally{if(old===undefined)delete process.env.LINUX_COOKIE_SECURE;else process.env.LINUX_COOKIE_SECURE=old;}
});
