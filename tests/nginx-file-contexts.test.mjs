import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
import {nginxFileContexts,nginxHelpContext} from '../lib/nginx-file-contexts.ts';
import {nginxSettingsSelection,nginxSettingInfo,nginxBlockInfo} from '../lib/nginx-setting-info.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
const file=(name,source)=>({name,path:'/etc/nginx/'+name,source,nodes:parseNginxTree(source)});
test('included mapping files preserve rule semantics and orphan files can explicitly choose map or geo',()=>{
 const files=[file('nginx.conf','http { map $host $out { include map.conf; } geo $region { include geo.conf; } }'),file('map.conf','gzip on;'),file('geo.conf','192.0.2.0/24 local;')];
 const before=JSON.stringify(files),mapping=nginxFileContexts(files);
 for(const [index,context] of [[1,'map'],[2,'geo']]){const help=nginxHelpContext(mapping,files[index].path);assert.equal(help.value,context);assert.equal(help.choose,false);const selection=nginxSettingsSelection(files[index].nodes,files[index].nodes[0].id,help.value);assert.equal(selection.context,context);assert.notEqual(nginxSettingInfo(files[index].nodes[0].label.split(/\s/)[0],context).unknown,true);}
 const orphan=file('orphan.conf','default local;'),unresolved=nginxFileContexts([file('nginx.conf','http {}'),orphan]);
 for(const context of ['map','geo']){const help=nginxHelpContext(unresolved,orphan.path,undefined,{path:orphan.path,value:context});assert.equal(help.value,context);assert.equal(help.choose,true);}
 assert.equal(JSON.stringify(files),before);
});
test('included server and upstream files inherit HTTP or stream help without altering source',()=>{
 const files=[file('nginx.conf','http { include conf.d/http.conf; upstream backend { include pool.conf; } } stream { include conf.d/tcp.conf; }'),file('conf.d/http.conf','server { proxy_pass http://backend; }'),file('pool.conf','keepalive_timeout 10s;'),file('conf.d/tcp.conf','server { proxy_pass backend:9000; }')];
 const before=JSON.stringify(files),mapping=nginxFileContexts(files);assert.equal(mapping.complete,true);
 assert.deepEqual(mapping.contexts.get(files[1].path),['http']);assert.deepEqual(mapping.contexts.get(files[2].path),['upstream']);assert.deepEqual(mapping.contexts.get(files[3].path),['stream:stream']);
 for(const [index,context] of [[1,'server'],[3,'stream:server']]){
  const selected=nginxSettingsSelection(files[index].nodes,files[index].nodes[0].id,nginxHelpContext(mapping,files[index].path).value);
  assert.equal(selected.context,context);assert.match(nginxSettingInfo('proxy_pass',context).url,index===1?/http\//:/stream\//);
 }
 assert.match(nginxSettingInfo('keepalive_timeout',nginxHelpContext(mapping,files[2].path).value).url,/upstream_module/);
 const tcp=nginxPresets(files[3].nodes[0],files[3],'stream:server');assert(!tcp.some(item=>item.name==='location'));assert(tcp.some(item=>item.name==='proxy_pass'));
 assert.equal(JSON.stringify(files),before);
});
test('shared include preserves multiple contexts and explicit help choice stays available',()=>{
 const files=[file('nginx.conf','http { include shared.conf; } stream { include shared.conf; }'),file('shared.conf','server { proxy_pass backend; }')],mapping=nginxFileContexts(files),path=files[1].path;
 assert.deepEqual(mapping.contexts.get(path),['http','stream:stream']);
 const unresolved=nginxHelpContext(mapping,path);assert.equal(unresolved.choose,true);assert.equal(unresolved.value,'unknown:root');
 const selection=nginxSettingsSelection(files[1].nodes,files[1].nodes[0].id,unresolved.value);assert.equal(selection.context,'unknown:server');assert.equal(nginxBlockInfo('server',selection.context).unknown,true);
 assert.equal(nginxHelpContext(mapping,path,undefined,{path,value:'stream:stream'}).value,'stream:stream');
 assert.equal(nginxHelpContext(mapping,path,undefined,{path,value:'main'}).value,'unknown:root','invalid or stale choices cannot override inspected contexts');
 const changed=nginxFileContexts([file('nginx.conf','http { include shared.conf; }'),files[1]]);
 assert.equal(nginxHelpContext(changed,path,undefined,{path,value:'stream:stream'}).value,'http');
 assert.equal(nginxHelpContext(changed,path).choose,false);
});
test('missing or unsupported includes stay uncertain, empty wildcards and cycles terminate',()=>{
 const main=file('nginx.conf','http { include conf.d/*.conf; }');assert.equal(nginxFileContexts([main]).complete,true);
 const orphan=file('orphan.conf','server { listen 80; }');const mapping=nginxFileContexts([main,orphan]);assert.equal(nginxHelpContext(mapping,orphan.path).value,'unknown:root');
 for(const include of ['missing.conf','../outside.conf'])assert.equal(nginxFileContexts([file('nginx.conf','include '+include+';')]).complete,false);
 const cycle=nginxFileContexts([file('nginx.conf','include loop.conf;'),file('loop.conf','include nginx.conf;')]);assert.equal(cycle.contexts.size,2);
 assert.equal(nginxHelpContext(cycle,undefined,undefined,undefined).choose,false);
 const incomplete=nginxFileContexts([file('nginx.conf','http { include missing.conf; include orphan.conf; }'),orphan]);
 assert.equal(nginxHelpContext(incomplete,orphan.path).choose,true);
 const selected=nginxHelpContext(incomplete,orphan.path,undefined,{path:orphan.path,value:'main'});assert.equal(selected.value,'main');assert.equal(selected.choose,true,'selecting main must not hide the selector');
});

test('verified enabled-site aliases propagate include context to their original and preserve ambiguity',()=>{
 const main=file('nginx.conf','http { include sites-enabled/*; }');
 const original=file('sites-available/example','server { listen 80; }');
 const alias={...original,name:'sites-enabled/example',path:'/etc/nginx/sites-enabled/example',symbolicLink:true,readOnly:true,linkTarget:original.path};
 const files=[main,original,alias],before=JSON.stringify(files);
 const mapping=nginxFileContexts(files);
 assert.equal(mapping.complete,true);
 assert.deepEqual(mapping.contexts.get(original.path),['http']);
 assert.equal(nginxHelpContext(mapping,original.path).choose,false);
 assert.equal(nginxSettingsSelection(original.nodes,original.nodes[0].id,nginxHelpContext(mapping,original.path).value).context,'server');
 const shared=nginxFileContexts([file('nginx.conf','http { include sites-enabled/*; } stream { include sites-enabled/*; }'),original,alias]);
 assert.deepEqual(shared.contexts.get(original.path),['http','stream:stream']);
 assert.equal(nginxHelpContext(shared,original.path).choose,true);
 for(const target of [null,{...original,error:'unreadable'},{...original,source:'server { listen 8080; }'}]){
  const uncertain=nginxFileContexts([main,alias,...(target?[target]:[])]);
  assert.equal(uncertain.complete,false);
  assert.equal(uncertain.contexts.has(original.path),false);
 }
 assert.equal(JSON.stringify(files),before,'context lookup must not mutate config snapshots');
});
