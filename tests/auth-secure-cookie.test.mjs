import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {login,passwordHash,cookieSession,sessionCookie,logoutSession,sessionCookieName} from '../lib/auth.ts';
import {getBetterAuth} from '../lib/better-auth.ts';
import {GET} from '../app/api/auth/[operation]/route.ts';
test('secure-cookie configuration signs in, renews and revokes the Better Auth secure-prefixed cookie',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-secure-cookie-'));
 const keys=['LINUX_AUTH_ROOT','LINUX_COOKIE_SECURE','BETTER_AUTH_URL','LINUX_LOGIN_USERNAME','LINUX_LOGIN_PASSWORD_HASH'];const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));let db;
 try{
  process.env.LINUX_AUTH_ROOT=root;process.env.LINUX_COOKIE_SECURE='true';process.env.BETTER_AUTH_URL='https://fixture.invalid';process.env.LINUX_LOGIN_USERNAME='secure-fixture';process.env.LINUX_LOGIN_PASSWORD_HASH=await passwordHash('secure-fixture-password');
  const token=await login('secure-fixture','secure-fixture-password');({db}=await getBetterAuth());
  const baseRequest=new Request('https://fixture.invalid/api/auth/status');
  const cookie=sessionCookie(baseRequest,token);assert(cookie.startsWith(sessionCookieName()+'='));assert.match(cookie,/; Secure$/);
  const request=new Request(baseRequest.url,{headers:{cookie:cookie.split(';')[0]}});
  assert.equal((await cookieSession(request)).username,'secure-fixture');
  const response=await GET(request,{params:Promise.resolve({operation:'status'})});assert.equal((await response.json()).authenticated,true);assert(response.headers.get('set-cookie').startsWith(sessionCookieName()+'='));
  await logoutSession(request);assert.equal(await cookieSession(request),null);assert(sessionCookie(baseRequest).startsWith(sessionCookieName()+'=;'));assert.match(sessionCookie(baseRequest),/Max-Age=0; Secure$/);
 }finally{
  if(!db){try{({db}=await getBetterAuth());}catch{}}
  db?.close();for(const key of keys)if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];await rm(root,{recursive:true,force:true});
 }
});
