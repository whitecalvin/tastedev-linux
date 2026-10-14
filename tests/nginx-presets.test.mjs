import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {addNginxDirective,parseNginxTree} from '../lib/nginx-syntax.ts';
test('nginx presets respect known block contexts and do not guess included file context',()=>{assert.deepEqual(nginxPresets(null,{name:'conf.d/app.conf'}),[]);assert.deepEqual(nginxPresets({kind:'directive',label:'listen 80'}),[]);assert.deepEqual(nginxPresets({kind:'block',label:'unknown'}),[]);assert.ok(nginxPresets(null,{name:'nginx.conf'}).some(item=>item.name==='events'));assert.ok(!nginxPresets({kind:'block',label:'location /'}).some(item=>item.name==='listen'));});
test('nginx server preset creates a nested editable location draft and preserves existing settings',()=>{const source='http {\n server {\n  listen 80;\n }\n}\n',server=parseNginxTree(source)[0].children[0],preset=nginxPresets(server).find(item=>item.name==='location');const next=addNginxDirective(source,server.id,preset.name,preset.value,preset.kind),nodes=parseNginxTree(next);assert.ok(next.includes('listen 80;'));assert.equal(nodes[0].children[0].children[1].label,'location /');});

test('document roots are available in HTTP defaults while aliases belong to locations',()=>{
 for(const context of ['http','server','location']){const items=nginxPresets({kind:'block',label:context==='location'?'location /assets/':context});assert.equal(items.filter(item=>item.name==='root').length,1);assert.equal(items.some(item=>item.name==='alias'),context==='location');}
 assert(!nginxPresets(null,{name:'nginx.conf'}).some(item=>item.name==='root'||item.name==='alias'));
 const source='http {\n server { listen 80; }\n}\n',http=parseNginxTree(source)[0],preset=nginxPresets(http).find(item=>item.name==='root');const draft=addNginxDirective(source,http.id,preset.name,preset.value,preset.kind),parsed=parseNginxTree(draft)[0];assert.equal(parsed.children[0].kind,'block');assert.equal(parsed.children.at(-1).label,'root /var/www/html');assert(draft.includes('listen 80;'));
});
