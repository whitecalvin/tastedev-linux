import test from 'node:test';
import assert from 'node:assert/strict';
import {redisServiceScope,redisSystemdStartup} from '../lib/redis-service-scope.ts';
const main='/etc/redis/redis.conf',binary='/usr/bin/redis-server';
test('Redis startup scope accepts explicit main and fixed foreground systemd options',()=>{
 for(const extra of [[],['--supervised','systemd','--daemonize','no']]){
  const result=redisServiceScope(main,[binary,main,...extra]);
  assert.equal(result.main,main);assert.equal(result.mode,'explicit-main');assert.deepEqual(Object.keys(result).sort(),['main','mode','notice']);
 }
});
const record=()=>({type:'a(sasbttttuii)',data:[[binary,[binary,main,'--supervised','systemd','--daemonize','no'],false,1000000,500000,0,0,42,0,0]]});
test('structured systemd started command proves exact main for the live PID without exposing arguments',()=>{
 const result=redisSystemdStartup(JSON.stringify(record()),42);assert.equal(result.main,main);assert.equal(result.mode,'systemd-started-main');assert.equal(Object.hasOwn(result,'argv'),false);
});
test('systemd startup proof rejects unused, exited, other PID, override and malformed command records',()=>{
 const changes=[r=>r.data.push(r.data[0]),r=>r.type='wrong',r=>r.extra=true,r=>r.data[0][0]='/bin/sh',r=>r.data[0][1]=[binary,main,'--requirepass','private-secret'],r=>r.data[0][1]=[binary,'/etc/redis/other.conf'],r=>r.data[0][2]=true,...[3,4].map(i=>r=>r.data[0][i]=0),...[5,6,8,9].map(i=>r=>r.data[0][i]=1),r=>r.data[0][7]=43,r=>r.data[0][7]='42',r=>r.data[0][3]=Number.MAX_SAFE_INTEGER+1];
 for(const change of changes){const r=record();change(r);assert.throws(()=>redisSystemdStartup(JSON.stringify(r),42),e=>e.status===409&&!e.message.includes('private-secret'));}
 for(const text of ['broken','null','x'.repeat(16385)])assert.throws(()=>redisSystemdStartup(text,42));
});
test('Redis startup scope rejects overrides and redacted process titles without exposing credentials',()=>{
 const cases=[[],[binary],[binary,'/etc/redis/other.conf'],[binary,main,'--port','6380'],[binary,main,'--requirepass','private-secret'],[binary,main,'--include','/tmp/private-secret'],[binary,main,'--supervised'],[binary,main,'--daemonize','yes'],[binary,main,'--supervised','systemd','--supervised','systemd'],['redis-server 127.0.0.1:6379'],[binary,main,'--sentinel'],[binary,main,'--supervised','systemd\0'],[binary,main,...Array(101).fill('private-secret')]];
 for(const args of cases)assert.throws(()=>redisServiceScope(main,args),error=>error.status===409&&!error.message.includes('private-secret'));
 assert.throws(()=>redisServiceScope('/tmp/redis.conf',[binary,main]));
});
