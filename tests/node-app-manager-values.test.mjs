import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeAppManagerValues} from '../lib/node-app-service-hooks.ts';
test('Node manager state parser preserves override evidence and rejects ambiguous status',()=>{
 const valid='LoadState=loaded\nFragmentPath=/etc/systemd/system/tastedev-node-fixture.service\nUser=1000\nDropInPaths=\n';assert.equal(nodeAppManagerValues(valid).User,'1000');assert.equal(nodeAppManagerValues(valid).DropInPaths,'');
 assert.equal(nodeAppManagerValues(valid.replace('DropInPaths=','DropInPaths=/etc/systemd/system/service.d/override.conf')).DropInPaths,'/etc/systemd/system/service.d/override.conf');
 for(const text of [valid+'User=0\n',valid.replace('User=1000\n',''),valid+'Unknown=value\n',valid+'\0',null])assert.throws(()=>nodeAppManagerValues(text));
});
