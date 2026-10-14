import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNginxTree} from '../lib/nginx-tree.ts';
test('nginx tree preserves nested blocks and quoted delimiters without interpreting includes',()=>{
 const nodes=parseNginxTree(`# comment\nevents { worker_connections 1024; }\nhttp { include /etc/nginx/conf.d/*.conf; server { listen 80; location / { proxy_set_header X-Test "a;#{}"; proxy_pass http://127.0.0.1:3000; } } }`);
 assert.equal(nodes[0].label,'events');assert.equal(nodes[1].line,3);
 assert.equal(nodes[1].children[0].label,'include /etc/nginx/conf.d/*.conf');
 assert.equal(nodes[1].children[1].children[1].children[0].label,'proxy_set_header X-Test "a;#{}"');
 assert.throws(()=>parseNginxTree('http { listen 80;'));
 assert.throws(()=>parseNginxTree('}'));
 assert.throws(()=>parseNginxTree('listen "unfinished;'));
});

import {updateNginxDirective} from '../lib/nginx-syntax.ts';
test('directive drafts preserve surrounding comments and nested blocks and reject injected structure',()=>{
 const source='# retain header\nhttp {\n  # keep comment\n  sendfile on; # trailing comment\n  server { listen 80; }\n}\n';
 const updated=updateNginxDirective(source,'2','off');
 assert.equal(updated,source.replace('sendfile on;','sendfile off;'));
 assert.throws(()=>updateNginxDirective(source,'2','off; include /tmp/evil'));
 assert.throws(()=>updateNginxDirective(source,'1','off'));
 assert.throws(()=>updateNginxDirective(source,'2','"unfinished'));
});

import {addNginxDirective,removeNginxDirective} from '../lib/nginx-syntax.ts';
test('node additions target the selected nested block and removals preserve adjacent comments',()=>{
 const source='# header\nhttp { server { listen 80; # keep\n location / { proxy_pass http://localhost; } } }\n';
 const added=addNginxDirective(source,'2','client_max_body_size','10m');
 const nodes=parseNginxTree(added);assert.equal(nodes[0].children[0].children.at(-1).label,'client_max_body_size 10m');
 assert.ok(added.includes('# keep'));
 const removed=removeNginxDirective(source,'3');assert.ok(!removed.includes('listen 80;'));assert.ok(removed.includes('# keep'));
 assert.throws(()=>addNginxDirective(source,'3','gzip','on'));
 assert.throws(()=>addNginxDirective(source,'2','evil;','on'));
 assert.throws(()=>addNginxDirective(source,'2','gzip','on; include /tmp/evil'));
 assert.throws(()=>removeNginxDirective(source,'2'));
 assert.equal(parseNginxTree(addNginxDirective('events {}\n',null,'worker_processes','auto')).at(-1).label,'worker_processes auto');
});

test('block drafts nest server and location nodes and reject structure injection',()=>{
 const initial='http {\n    # retained\n}\n';
 const server=addNginxDirective(initial,'1','server','','block');
 const location=addNginxDirective(server,'2','location','/api','block');
 const tree=parseNginxTree(location);
 assert.equal(tree[0].children[0].kind,'block');
 assert.equal(tree[0].children[0].children[0].label,'location /api');
 assert.ok(location.includes('# retained'));
 assert.throws(()=>addNginxDirective(initial,'1','server','} http {','block'));
 assert.throws(()=>addNginxDirective(initial,'1','server','','unknown'));
});

import {updateNginxBlock} from '../lib/nginx-syntax.ts';
test('block argument changes preserve children and adjacent blocks',()=>{
 const source='http { server { location / { # body\n proxy_pass http://localhost:3000; } location /static { root /srv; } } }';
 const updated=updateNginxBlock(source,'3','~ ^/api');
 assert.equal(parseNginxTree(updated)[0].children[0].children[0].label,'location ~ ^/api');
 assert.ok(updated.includes('# body\n proxy_pass http://localhost:3000; } location /static { root /srv; }'));
 assert.throws(()=>updateNginxBlock(source,'4','bad'));
 assert.throws(()=>updateNginxBlock(source,'3','/ { injected'));
});

test('nested additions retain closing indentation without extra blank lines',()=>{
 const source='http {\n    server {\n    }\n}\n';
 assert.equal(addNginxDirective(source,'2','location','/api','block'),'http {\n    server {\n        location /api {\n        }\n    }\n}\n');
});

import {removeNginxBlock} from '../lib/nginx-syntax.ts';
import {recordConfigChange,stepConfigHistory} from '../lib/config-history.ts';
test('block removal preserves sibling settings and undo restores all children',()=>{
 const source='# before\nhttp { server { location / { return 200; } } server { listen 8080; } }\n# after\n';
 const removed=removeNginxBlock(source,'2');
 assert.equal(removed,'# before\nhttp {  server { listen 8080; } }\n# after\n');
 assert.equal(parseNginxTree(removed)[0].children.length,1);
 const history=recordConfigChange(null,source,removed);
 assert.equal(stepConfigHistory(history,'undo').source,source);
 assert.throws(()=>removeNginxBlock(source,'4'));
 assert.throws(()=>removeNginxBlock(source,'missing'));
});

import {duplicateNginxNode} from '../lib/nginx-syntax.ts';
test('node duplication preserves nested settings and indentation and can be undone',()=>{
 const source='server {\n    location /api {\n        # preserved\n        proxy_pass http://localhost:3000;\n    }\n}\n';
 const result=duplicateNginxNode(source,'2');
 const nodes=parseNginxTree(result)[0].children;
 assert.equal(nodes.length,2);
 assert.equal(nodes[0].label,nodes[1].label);
 assert.equal(nodes[1].children[0].label,'proxy_pass http://localhost:3000');
 assert.equal(result.split('# preserved').length,3);
 assert.ok(result.includes('    }\n    location /api'));
 assert.equal(stepConfigHistory(recordConfigChange(null,source,result),'undo').source,source);
 assert.throws(()=>duplicateNginxNode(source,'unknown'));
});

import {moveNginxNode} from '../lib/nginx-syntax.ts';
test('node ordering stays in its parent and refuses ambiguous comment movement',()=>{
 const source='http {\n    server { listen 80; }\n    server { listen 81; }\n}\n';
 const moved=moveNginxNode(source,'2','down');
 assert.equal(parseNginxTree(moved)[0].children[0].children[0].label,'listen 81');
 assert.equal(moveNginxNode(source,'2','up'),source);
 assert.equal(moveNginxNode(source,'3','down'),source);
 assert.equal(moveNginxNode(moved,'2','down'),source);
 assert.throws(()=>moveNginxNode('http { listen 80; # belongs to next\nlisten 81; }','2','down'));
 assert.throws(()=>moveNginxNode(source,'missing','up'));
 assert.throws(()=>moveNginxNode(source,'2','left'));
});

import {addNginxServerBlock} from '../lib/nginx-syntax.ts';
test('new basic server targets a conf file or http block and preserves existing content',()=>{
 for(const nested of [false,true]){
  const original=nested?'http {\n    server { listen 8080; }\n}\n':'# keep\nserver { listen 8080; }\n';
  const updated=addNginxServerBlock(original,nested?'1':null);
  const tree=parseNginxTree(updated),siblings=nested?tree[0].children:tree;
  assert.equal(siblings.length,2);
  assert.equal(siblings[0].children[0].label,'listen 8080');
  assert.equal(siblings[1].label,'server');
  assert.deepEqual(siblings[1].children.map(node=>node.label),['listen 80','server_name example.com','root /var/www/html']);
  assert.ok(updated.includes(nested?'server { listen 8080; }':'# keep'));
 }
});

test('server presets preserve sibling servers and support nested location configuration',()=>{
 const source='http { server { listen 8080; } }';
 for(const preset of ['static','proxy']){
  const next=addNginxServerBlock(source,'1',preset),servers=parseNginxTree(next)[0].children;
  assert.equal(servers.length,2);assert.equal(servers[0].children[0].label,'listen 8080');
  const location=servers[1].children.find(node=>node.label==='location /');assert.ok(location);
  assert.equal(location.children[0].label,preset==='static'?'try_files $uri $uri/ =404':'proxy_pass http://127.0.0.1:3000');
 }
 assert.throws(()=>addNginxServerBlock(source,'1','unknown'));
});
