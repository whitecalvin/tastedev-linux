import test from 'node:test';
import assert from 'node:assert/strict';
import {redisConfigTree} from '../lib/redis-config-tree.ts';
test('Redis tree links wildcard targets, nested includes and marks missing or cyclic files',()=>{
 const root='/etc/redis/redis.conf',a='/etc/redis/a.conf',b='/etc/redis/b.conf';const tree=redisConfigTree({root,files:[{path:root,bytes:10,version:'hash'},{path:a,bytes:20},{path:b,bytes:30}],edges:[{from:root,line:2,to:'/etc/redis/*.conf',targets:[a,b]},{from:a,line:3,to:root},{from:b,line:5,to:'/etc/redis/missing.conf'}]});assert.equal(tree.version,'hash');assert.deepEqual(tree.children.map(node=>node.path),[a,b]);assert.equal(tree.children[0].line,2);assert.equal(tree.children[0].children[0].cycle,true);assert.equal(tree.children[1].children[0].missing,true);assert.equal(redisConfigTree(null),null);
});
test('Redis tree bounds deep graph rendering',()=>{
 const edges=Array.from({length:50},(_,index)=>({from:String(index),to:String(index+1),line:1}));let node=redisConfigTree({root:'0',files:[],edges}),depth=0;while(node.children.length){node=node.children[0];depth++;}assert.equal(depth,32);assert.equal(node.truncated,true);
});
test('Redis tree bounds wide include expansions',()=>{
 const graph={root:'main',files:[],edges:[{from:'main',targets:Array.from({length:1000},(_,index)=>String(index)),line:1}]};const tree=redisConfigTree(graph);assert(tree.children.length<=512);assert.equal(tree.truncated,true);
});
test('selected Redis file metadata includes wildcard parents and direct children without raw config',async()=>{
 const {redisFileDetails}=await import('../lib/redis-config-tree.ts');const graph={root:'main',files:[{path:'main',bytes:20,version:'hash',text:'private'},{path:'child',bytes:10,version:'child-hash'}],edges:[{from:'main',to:'*.conf',targets:['child'],line:3}],warnings:[]};const child=redisFileDetails(graph,'child');assert.equal(child.main,false);assert.deepEqual(child.incoming,[{from:'main',line:3}]);assert.deepEqual(child.outgoing,[]);assert.equal(redisFileDetails(graph,'main').main,true);assert(!JSON.stringify(redisFileDetails(graph,'main')).includes('private'));assert.equal(redisFileDetails(graph,'missing'),null);
});
