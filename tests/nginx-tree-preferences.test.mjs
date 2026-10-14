import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {nginxTreePreferences,saveNginxTreePreferences} from '../lib/nginx-tree-preferences.ts';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
test('the first server render uses the saved collapsed state before browser effects run',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/draft-provider.tsx',import.meta.url),'utf8'),{filename:'draft-provider.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const module={exports:{}},require=createRequire(import.meta.url);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function Tree(){const [state]=module.exports.useDraftState('nginxTreeExpansion',{defaultOpen:true,nodes:{}});return React.createElement('details',{open:state.defaultOpen},React.createElement('summary',null,'conf.d'));}
 const html=renderToStaticMarkup(React.createElement(module.exports.DraftProvider,{initialTreeExpansion:{defaultOpen:false,nodes:{}},preferenceUserId:'one'},React.createElement(Tree)));
 assert.equal(html,'<details><summary>conf.d</summary></details>');
});
test('tree expansion survives a new server read and is isolated by authenticated account',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','nginx-tree-pref-')),old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 try{assert.equal(nginxTreePreferences('one'),null);const state={defaultOpen:false,nodes:{'folder:conf.d':true,'file node':false}};await saveNginxTreePreferences('one',state);assert.deepEqual(nginxTreePreferences('one'),state);assert.equal(nginxTreePreferences('two'),null);await saveNginxTreePreferences('two',{defaultOpen:true,nodes:{}});assert.deepEqual(nginxTreePreferences('one'),state);assert.equal((await readdir(root)).some(name=>name.startsWith('.')),false);}
 finally{if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;await rm(root,{recursive:true,force:true});}
});
test('tree preference reader refuses symlink substitution instead of following an external file',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','nginx-tree-link-')),old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 try{await saveNginxTreePreferences('one',{defaultOpen:false,nodes:{}});const file=join(root,(await readdir(root))[0]);await rm(file);await symlink('/etc/passwd',file);assert.throws(()=>nginxTreePreferences('one'));}
 finally{if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;await rm(root,{recursive:true,force:true});}
});
test('preference writes require the same origin and the authenticated account, not a client-selected owner',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../app/api/nginx-tree-preferences/route.ts',import.meta.url),'utf8'),{filename:'route.js',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let session={userId:'one'},writes=0;const module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>name.includes('/auth.ts')?{cookieSession:async()=>session}:{saveNginxTreePreferences:async(id)=>{assert.equal(id,'one');writes++;}},module,module.exports);
 const request=(userId,origin='http://localhost')=>new Request('http://localhost/api/nginx-tree-preferences',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({userId,expansion:{defaultOpen:false,nodes:{}}})});
 assert.equal((await module.exports.POST(request('one','https://external.invalid'))).status,403);
 assert.equal((await module.exports.POST(request('other'))).status,409);
 assert.equal(writes,0);assert.equal((await module.exports.POST(request('one'))).status,200);assert.equal(writes,1);
 session=null;assert.equal((await module.exports.POST(request('one'))).status,401);assert.equal(writes,1);
});
