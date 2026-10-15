import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {login,passwordHash,cookieSession,logoutSession,sessionCookieName} from '../lib/auth.ts';
import {getBetterAuth} from '../lib/better-auth.ts';

test('two installations share a browser cookie jar without replacing or logging out each other',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/session-isolation-');
 const keys=['LINUX_AUTH_ROOT','LINUX_COOKIE_SECURE','LINUX_LOGIN_USERNAME','LINUX_LOGIN_PASSWORD_HASH'];
 const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 const databases=[];
 try{
  process.env.LINUX_COOKIE_SECURE='false';process.env.LINUX_LOGIN_USERNAME='isolation-admin';process.env.LINUX_LOGIN_PASSWORD_HASH=await passwordHash('isolation-fixture-password');
  process.env.LINUX_AUTH_ROOT=join(root,'server-a');
  const a=await login('isolation-admin','isolation-fixture-password');const nameA=sessionCookieName();databases.push((await getBetterAuth()).db);
  process.env.LINUX_AUTH_ROOT=join(root,'server-b');
  const b=await login('isolation-admin','isolation-fixture-password');const nameB=sessionCookieName();databases.push((await getBetterAuth()).db);
  assert.notEqual(nameA,nameB);assert.match(nameA,/^linux_session_[a-f0-9]{20}$/);
  const sharedCookie=nameA+'='+a+'; '+nameB+'='+b;
  const request=port=>new Request('http://127.0.0.1:'+port+'/api/auth/status',{headers:{cookie:sharedCookie}});
  assert.equal((await cookieSession(request(8793)))?.username,'isolation-admin');
  process.env.LINUX_AUTH_ROOT=join(root,'server-a');assert.equal(sessionCookieName(),nameA);
  assert.equal((await cookieSession(request(8791)))?.username,'isolation-admin');
  await logoutSession(request(8791));assert.equal(await cookieSession(request(8791)),null);
  process.env.LINUX_AUTH_ROOT=join(root,'server-b');assert.equal(sessionCookieName(),nameB);
  assert.equal((await cookieSession(request(8793)))?.username,'isolation-admin');
  assert.equal(await cookieSession(new Request('http://127.0.0.1:8793',{headers:{cookie:nameA+'='+a}})),null);
 }finally{
  databases.forEach(db=>db.close());for(const key of keys)if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];
 }
});
