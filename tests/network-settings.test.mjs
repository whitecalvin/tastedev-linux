import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {networkSettings,saveNetworkSettings,validateNetworkSettings,networkOrigins,runtimeAuthOrigins} from '../lib/network-settings.ts';
test('network configuration persists with CAS without changing running listener or authentication origins',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-network-')),keys=['LINUX_STATE_ROOT','LINUX_HOST','PORT','LINUX_ACTIVE_HOST','LINUX_PACKAGED','LINUX_RUNTIME_NETWORK_ORIGINS'],previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 Object.assign(process.env,{LINUX_STATE_ROOT:root,LINUX_HOST:'127.0.0.1',LINUX_ACTIVE_HOST:'127.0.0.1',PORT:'8791',LINUX_PACKAGED:'true',LINUX_RUNTIME_NETWORK_ORIGINS:'["http://127.0.0.1:8791"]'});
 try{const first=networkSettings();assert.equal(first.externalEnabled,false);const saved=await saveNetworkSettings({...first,externalEnabled:true,host:'0.0.0.0'});assert(saved.externalEnabled);assert(saved.restartRequired);assert.equal(saved.active.host,'127.0.0.1');assert.deepEqual(runtimeAuthOrigins(),['http://127.0.0.1:8791']);await assert.rejects(saveNetworkSettings({...first,externalEnabled:true,host:'192.168.0.103'}),e=>e.status===409);const disabled=await saveNetworkSettings({...saved,externalEnabled:false});assert.equal(disabled.host,'127.0.0.1');assert.equal(disabled.restartRequired,false);await rm(join(root,'network-settings.json'));await symlink('/etc/passwd',join(root,'network-settings.json'));assert.throws(()=>networkSettings());}
 finally{for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}await rm(root,{recursive:true,force:true});}
});
test('only explicit IPv4 listeners and bounded unprivileged ports are accepted',()=>{
 for(const input of [{externalEnabled:true,host:'127.0.0.1',port:8791},{externalEnabled:true,host:'example.com',port:8791},{externalEnabled:true,host:'0.0.0.0\nPORT=22',port:8791},{externalEnabled:true,host:'0.0.0.0',port:80},{externalEnabled:true,host:'0.0.0.0',port:65536}])assert.throws(()=>validateNetworkSettings(input));
 assert.deepEqual(networkOrigins('0.0.0.0',8791,{lan:[{family:'IPv4',internal:false,address:'192.168.0.103'},{family:'IPv6',internal:false,address:'::1'}]}),['http://127.0.0.1:8791','http://localhost:8791','http://192.168.0.103:8791']);
 assert.deepEqual(networkOrigins('127.0.0.1',8791),['http://127.0.0.1:8791','http://localhost:8791']);
});
