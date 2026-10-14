import test from 'node:test';
import assert from 'node:assert/strict';
import {filterNginxFiles} from '../lib/nginx-tree-search.ts';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
import {translate} from '../lib/i18n.ts';
test('tree search preserves matching ancestors and original node identities without changing source',()=>{
 const source='http { server { listen 80; location / { proxy_pass http://localhost; } } gzip on; }';
 const files=[{name:'nginx.conf',source,nodes:parseNginxTree(source)}];
 const filtered=filterNginxFiles(files,'PROXY_PASS');
 assert.equal(filtered[0].nodes[0].children.length,1);
 assert.equal(filtered[0].nodes[0].children[0].children[0].label,'location /');
 const leaf=filtered[0].nodes[0].children[0].children[0].children[0];
 assert.equal(leaf.label,'proxy_pass http://localhost');
 assert.equal(filtered[0].source,source);
 assert.equal(files[0].nodes[0].children.length,2);
 assert.equal(filterNginxFiles(files,'nginx.conf')[0],files[0]);
 assert.deepEqual(filterNginxFiles(files,'not found'),[]);
 assert.equal(filterNginxFiles(files,' '),files);
});

test('tree help search respects protocol ancestry, included mapping context and selected language',()=>{
 const source='http { upstream backend { keepalive_timeout 10s; } server { keepalive_timeout 20s; client_header_timeout 60s; } map $host $out { include conf.d/mapped.conf; } } stream { server { proxy_pass backend; } }';
 const main={name:'nginx.conf',path:'/etc/nginx/nginx.conf',source,nodes:parseNginxTree(source)};
 const mapped={name:'conf.d/mapped.conf',path:'/etc/nginx/conf.d/mapped.conf',source:'root literal;',nodes:parseNginxTree('root literal;')};
 const files=[main,mapped],snapshot=JSON.stringify(files);
 const english=filterNginxFiles(files,'complete request',{translate:text=>translate('en',text)});
 assert.equal(english.length,1);assert.equal(english[0].nodes[0].children[0].label,'server');
 assert.equal(english[0].nodes[0].children[0].children[0].label,'client_header_timeout 60s');
 const idle=filterNginxFiles(files,'유휴 업스트림');
 assert.equal(idle.length,1);assert.equal(idle[0].nodes[0].children.length,1);assert.equal(idle[0].nodes[0].children[0].label,'upstream backend');
 const mapping=filterNginxFiles(files,'원본 값');
 assert(mapping.some(file=>file.path===mapped.path),'included map rules need map explanations, not HTTP root explanations');
 const httpSearch=filterNginxFiles(files,'백엔드 서버로 요청',{translate:text=>text});
 assert(!httpSearch.some(file=>file.nodes.some(node=>node.label==='stream')),'HTTP descriptions cannot match stream proxy_pass');
 const byValue=filterNginxFiles(files,'20s');assert.equal(byValue[0].nodes[0].children[0].label,'server');
 assert.equal(JSON.stringify(files),snapshot,'help search must not mutate source, nodes or order');
});

test('quoted mapping keys and split remainder help remain searchable without changing source',()=>{
 const source='http { map $http_user_agent $device { "~Opera Mini" mobile; } split_clients $request_id $variant { 50% A; * B; } }';
 const file={name:'nginx.conf',path:'/etc/nginx/nginx.conf',source,nodes:parseNginxTree(source)};
 const result=filterNginxFiles([file],'Opera Mini');assert.equal(result[0].nodes[0].children[0].children[0].label,'"~Opera Mini" mobile');
 const remainder=filterNginxFiles([file],'나머지 해시');assert.equal(remainder[0].nodes[0].children[0].children[0].label,'* B');
 assert.equal(file.source,source);assert.deepEqual(file.nodes,parseNginxTree(source));
});
