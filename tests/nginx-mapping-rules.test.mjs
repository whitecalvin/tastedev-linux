import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxSettingParts,validNginxSettingName} from '../lib/nginx-setting-name.ts';
import {parseNginxTree,addNginxDirective,updateNginxDirective} from '../lib/nginx-syntax.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxDirectiveField} from '../lib/nginx-fields.ts';
test('mapping keys preserve quotes, escapes and whitespace without admitting node injection',()=>{
 for(const name of ['"~Opera Mini"','"~^id[0-9]{1,3}$"','*.example.com','\\default','192.0.2.0/24','2001:db8::/32','50%','*'])assert(validNginxSettingName(name,'map'),name);
 for(const name of ['','key value','"unterminated','key;server','key{','key#comment','key\nvalue','key\\'])assert(!validNginxSettingName(name,'map'),name);
 assert.deepEqual(nginxSettingParts('"~Opera Mini" mobile'),{name:'"~Opera Mini"',value:'mobile'});
 assert.deepEqual(nginxSettingParts('a\\ b result'),{name:'a\\ b',value:'result'});
 let source='http { map $http_user_agent $route {} }';const map=()=>parseNginxTree(source)[0].children[0];
 source=addNginxDirective(source,map().id,'"~Opera Mini"','mobile');source=updateNginxDirective(source,map().children[0].id,'new_mobile');
 assert.equal(map().children[0].label,'"~Opera Mini" new_mobile');
 assert.throws(()=>addNginxDirective(source,parseNginxTree(source)[0].id,'"~Opera Mini"','x'),/설정 이름/);
});
test('mapping prefix flags and split percentages precede rules that depend on them',()=>{
 let source='http { map $host $route { default fallback; *.example.com wildcard; } geo $region { 192.0.2.1-192.0.2.2 local; } split_clients $request_id $variant { * rest; } }';
 const block=name=>parseNginxTree(source)[0].children.find(node=>node.label.startsWith(name+' '));
 source=addNginxDirective(source,block('map').id,'hostnames','');source=addNginxDirective(source,block('geo').id,'ranges','');source=addNginxDirective(source,block('split_clients').id,'50%','A');
 assert.equal(block('map').children[0].label,'hostnames');assert.equal(block('geo').children[0].label,'ranges');assert.deepEqual(block('split_clients').children.map(node=>node.label),['50% A','* rest']);
 for(const [name,context] of [['hostnames','map'],['volatile','map'],['ranges','geo'],['proxy_recursive','geo']])assert.equal(nginxDirectiveField(name,'',context).type,'flag');
 assert.equal(nginxDirectiveField('hostnames','literal','map').type,'text');
 for(const name of ['map','geo','split_clients'])assert(nginxPresets(null,null,'http').some(item=>item.name===name&&item.kind==='block'));
 for(const context of ['server','location','main'])for(const name of ['map','geo','split_clients'])assert(!nginxPresets(null,null,context).some(item=>item.name===name));
});
