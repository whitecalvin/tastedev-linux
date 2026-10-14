import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches,nginxSettingsSelection} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';

// Open-source events directives from the upstream core reference, excluding include
// (valid in every context) and the commercial stall_threshold extension.
const coreNames=['accept_mutex','accept_mutex_delay','debug_connection','multi_accept','use','worker_aio_requests','worker_connections'];
test('events presets expose all open-source core connection settings only in events',()=>{
 const presets=nginxPresets({kind:'block',label:'events'});
 assert.deepEqual(presets.map(item=>item.name).sort(),coreNames.toSorted());
 for(const context of ['main','http','server','location','upstream','stream:server']){
  const list=nginxPresets(null,{name:'nginx.conf'},context);
  assert(!list.some(item=>coreNames.includes(item.name)),context);
 }
});
test('new event controls preserve surrounding blocks and report Korean help in source order',()=>{
 let source='events {\n worker_connections 768;\n}\nhttp { server { listen 8080; } }\n';
 for(const name of ['accept_mutex_delay','debug_connection','use','worker_aio_requests']){
  const block=parseNginxTree(source)[0],preset=nginxPresets(block).find(item=>item.name===name);
  source=addNginxDirective(source,block.id,preset.name,preset.value,preset.kind);
 }
 const nodes=parseNginxTree(source),selected=nginxSettingsSelection(nodes,nodes[0].id);
 assert.equal(selected.context,'events');
 assert.deepEqual(selected.nodes.map(node=>node.label),['worker_connections 768','accept_mutex_delay 500ms','debug_connection 127.0.0.1','use epoll','worker_aio_requests 32']);
 assert.equal(nodes[1].children[0].children[0].label,'listen 8080');
 for(const node of selected.nodes){const name=node.label.split(' ')[0],info=nginxSettingInfo(name,selected.context);assert.notEqual(info.unknown,true);assert.match(info.description,/[가-힣]/);assert.equal(info.url,'https://nginx.org/en/docs/ngx_core_module.html#'+name);}
 assert.equal(nginxSettingMatches('worker_aio_requests','32','비동기',text=>text,'events'),true);
});
test('event help distinguishes defaults, Linux-specific examples and commercial capabilities',()=>{
 assert.equal(nginxSettingInfo('accept_mutex_delay','events').defaultValue,'500ms');
 assert.equal(nginxSettingInfo('worker_aio_requests','events').defaultValue,'32');
 for(const name of ['debug_connection','use'])assert.equal(nginxSettingInfo(name,'events').defaultValue,undefined);
 assert.match(nginxSettingInfo('debug_connection','events').description,/--with-debug/);
 assert.match(nginxSettingInfo('use','events').description,/자동 선택/);
 assert.match(nginxSettingInfo('stall_threshold','events').description,/상용 구독/);
 assert(!nginxPresets({kind:'block',label:'events'}).some(item=>item.name==='stall_threshold'));
});
test('AIO numeric input rejects malformed and out-of-range values without constraining map keys',()=>{
 const control=nginxDirectiveField('worker_aio_requests','32','events');
 assert.equal(control.type,'number');
 for(const value of ['0','1','32','2147483647'])assert.equal(validateNginxField(control,value),value);
 for(const value of ['-1','1.5','1e3','2147483648','32; worker_connections 0'])assert.throws(()=>validateNginxField(control,value));
 assert.equal(nginxDirectiveField('worker_aio_requests','32','map').type,'text');
});
