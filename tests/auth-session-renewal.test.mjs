import {sessionCookieName} from '../lib/auth.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {login,passwordHash,logoutSession} from '../lib/auth.ts';
import {getBetterAuth} from '../lib/better-auth.ts';
import {GET} from '../app/api/auth/[operation]/route.ts';
test('authenticated status refreshes an aged Better Auth session and private browser cookie without reviving revoked sessions',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-session-renewal-'));
 const keys=['LINUX_AUTH_ROOT','LINUX_LOGIN_USERNAME','LINUX_LOGIN_PASSWORD_HASH'];const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 let db;
 try{
  process.env.LINUX_AUTH_ROOT=root;process.env.LINUX_LOGIN_USERNAME='renewal-fixture';process.env.LINUX_LOGIN_PASSWORD_HASH=await passwordHash('renewal-fixture-password');
  const token=await login('renewal-fixture','renewal-fixture-password');
  const request=new Request('http://localhost/api/auth/status',{headers:{cookie:sessionCookieName()+'='+token}});
  ({db}=await getBetterAuth());
  const before=Date.now()-25*3600000;
  db.prepare('UPDATE session SET createdAt=?,updatedAt=?,expiresAt=?').run(before,before,before+7*86400000);
  const result=await GET(request,{params:Promise.resolve({operation:'status'})});
  assert.equal(result.status,200);assert.equal((await result.json()).authenticated,true);
  const cookie=result.headers.get('set-cookie');assert.match(cookie,/HttpOnly; SameSite=Strict; Max-Age=604800/);assert(!cookie.includes('Max-Age=0'));
  assert(new Date(db.prepare('SELECT expiresAt FROM session').get().expiresAt).getTime()>Date.now()+6*86400000);
  await logoutSession(request);
  const revoked=await GET(request,{params:Promise.resolve({operation:'status'})});assert.equal((await revoked.json()).authenticated,false);assert.equal(revoked.headers.get('set-cookie'),null);
 }finally{
  db?.close();for(const key of keys)if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];
  await rm(root,{recursive:true,force:true});
 }
});
