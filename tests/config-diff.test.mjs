import test from 'node:test';
import assert from 'node:assert/strict';
import {configDiff} from '../lib/config-diff.ts';
import {nginxDirectiveField} from '../lib/nginx-fields.ts';
test('configuration comparison isolates changes without losing inserted or removed lines',()=>{
 assert.deepEqual(configDiff('a\nb\nc\n','a\nx\ny\nc\n'),{changed:true,startLine:2,before:['b'],after:['x','y']});
 assert.equal(configDiff('same','same').changed,false);
 assert.deepEqual(configDiff('a\nb','a'),{changed:true,startLine:2,before:['b'],after:[]});
});
test('nginx directive controls preserve path and unsupported variants',()=>{
 assert.equal(nginxDirectiveField('gzip','on').type,'switch');
 assert.equal(nginxDirectiveField('access_log','/var/log/access.log').type,'text');
 assert.equal(nginxDirectiveField('access_log','off').type,'text');
 assert.equal(nginxDirectiveField('worker_connections','768').min,1);
 assert.deepEqual(nginxDirectiveField('server_tokens','build').options,['on','off','build']);
 assert.equal(nginxDirectiveField('unknown','on').type,'text');
});
