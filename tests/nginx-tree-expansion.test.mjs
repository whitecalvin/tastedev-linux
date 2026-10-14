import test from 'node:test';
import assert from 'node:assert/strict';
import {treeExpansion,treeNodeOpen,setTreeNodeOpen} from '../lib/nginx-tree-expansion.ts';
import {nginxNodeKey} from '../lib/nginx-node-key.ts';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
test('tree preferences restore individual nodes and global collapsed default without source offsets',()=>{
 const initial={defaultOpen:false,nodes:{}};
 const tree=parseNginxTree('server { listen 80; } server { listen 8080; }');
 const key=JSON.stringify(['/etc/nginx/conf.d/site.conf',nginxNodeKey(tree,tree[1].id)]);
 const state=setTreeNodeOpen(initial,key,true),restored=treeExpansion(JSON.parse(JSON.stringify(state)));
 assert.equal(treeNodeOpen(restored,key),true);assert.equal(treeNodeOpen(restored,'other'),false);
 const updated=parseNginxTree('gzip on; server { listen 80; } server { listen 8080; }');
 assert.equal(JSON.stringify(['/etc/nginx/conf.d/site.conf',nginxNodeKey(updated,updated[2].id)]),key);
 assert.equal(treeNodeOpen(setTreeNodeOpen(restored,key,false),key),false);
 assert.deepEqual(treeExpansion({defaultOpen:'bad',nodes:{a:true,b:1}}),{defaultOpen:true,nodes:{a:true}});
});
