import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
import {copyNginxNode,pasteNginxNode,nginxPasteDomain} from '../lib/nginx-node-transfer.ts';
test('server paste preserves subtree and changes only direct server names',()=>{
 const source='http { server { listen 80; server_name old.test; location / { proxy_pass http://backend; } } }';
 const http=parseNginxTree(source)[0],server=http.children[0],copy=copyNginxNode(source,server.id);
 assert(nginxPasteDomain(copy));
 const result=pasteNginxNode(source,copy,http.id,{domain:'new.test'}),nodes=parseNginxTree(result.source)[0].children;
 assert.equal(nodes.length,2);assert.equal(nodes[0].children[1].label,'server_name old.test');assert.equal(nodes[1].children[1].label,'server_name new.test');assert.equal(nodes[1].children[2].children[0].label,'proxy_pass http://backend');assert.equal(nodes[1].start,result.start);
 assert.throws(()=>pasteNginxNode(source,copy,http.id,{domain:'bad; return 200'}));assert.throws(()=>pasteNginxNode(source,copy,null));
});
test('file paste creates missing server_name and supports HTTP include context',()=>{
 const result=pasteNginxNode('', 'server { listen 80; }',null,{rootContext:'http',domain:'example.com'});
 assert.equal(parseNginxTree(result.source)[0].children[1].label,'server_name example.com');
 assert.throws(()=>pasteNginxNode('', 'server {} server {}',null,{rootContext:'http'}));
});
test('drag moves siblings before target without duplication, including equal labels',()=>{
 const source='http { server { server_name a.test; } server { server_name b.test; } }';
 const [a,b]=parseNginxTree(source)[0].children;
 const moved=pasteNginxNode(source,copyNginxNode(source,b.id),a.id,{moveId:b.id});
 const nodes=parseNginxTree(moved.source)[0].children;
 assert.equal(nodes.length,2);assert.equal(nodes[0].children[0].label,'server_name b.test');assert.equal(nodes[0].start,moved.start);
 const back=pasteNginxNode(source,copyNginxNode(source,a.id),parseNginxTree(source)[0].id,{moveId:a.id});
 assert.equal(parseNginxTree(back.source)[0].children.at(-1).children[0].label,'server_name a.test');
});
test('drag rejects self, descendants and incompatible contexts; allows moving location between servers',()=>{
 const source='http { server { location /api { proxy_pass http://backend; } } server {} }';
 const http=parseNginxTree(source)[0],[a,b]=http.children,location=a.children[0];
 assert.throws(()=>pasteNginxNode(source,copyNginxNode(source,a.id),location.id,{moveId:a.id}));
 assert.throws(()=>pasteNginxNode(source,copyNginxNode(source,a.id),a.id,{moveId:a.id}));
 assert.throws(()=>pasteNginxNode(source,copyNginxNode(source,location.id),http.id));
 const result=pasteNginxNode(source,copyNginxNode(source,location.id),b.id,{moveId:location.id});
 const servers=parseNginxTree(result.source)[0].children;assert.equal(servers[0].children.length,0);assert.equal(servers[1].children[0].label,'location /api');assert.equal(servers[1].children[0].start,result.start);
});
