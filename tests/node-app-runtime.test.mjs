import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeEnvRuntimeVersion,nodeAppRuntime} from '../lib/node-app-runtime.ts';
test('Node environment runtime capability uses the documented version boundary and rejects arbitrary output',()=>{
 for(const value of ['v18.20.8','v20.5.1'])assert.equal(nodeEnvRuntimeVersion(value).envFileSupported,false);
 for(const value of ['v20.6.0\n','v22.0.0','v24.21.0\r\n'])assert.equal(nodeEnvRuntimeVersion(value).envFileSupported,true);
 for(const value of ['v20.6.0-pre','v20.6','secret\nv22.0.0','v22.0.0\nsecret','v999999999999999999999.0.0'])assert.equal(nodeEnvRuntimeVersion(value),null);
});
test('Node runtime inspection exposes only fixed executable and validated capability metadata',async()=>{
 const result=await nodeAppRuntime();assert.equal(result.executable,'/usr/bin/node');assert(['ready','missing','unreadable','unsupported'].includes(result.status));assert.equal(typeof result.envFileSupported,'boolean');assert(Object.keys(result).every(key=>['executable','status','envFileSupported','version'].includes(key)));
});
