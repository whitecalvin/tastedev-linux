import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('GitHub API requires login, blocks cross-site/read-only mutations and never audits token payloads',async()=>{
 await loadBindings();const source=await readFile(new URL('../app/api/github/route.ts',import.meta.url),'utf8');const compiled=await transform(source,{filename:'route.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let logged=false,readOnly=false,mutations=0;const audits=[];const snapshot={connected:true,account:{login:'fixture'},version:'fixture-version'};
 const mocks={'../../../lib/auth.ts':{cookieSession:async()=>logged},'../../../lib/auth-storage-error.ts':{isAuthStorageError:()=>false},'../../../lib/security.ts':{securitySettings:async()=>({settings:{readOnly}}),auditEvent:async(...args)=>audits.push(args)},'../../../lib/github.ts':{githubSnapshot:()=>snapshot,githubProject:async()=>({types:['Next.js'],status:'detected'}),verifyGitHub:async()=>({account:snapshot.account,repositoryCount:0,hasMore:false,sample:[]}),connectGitHub:async()=>{mutations++;return snapshot;},disconnectGitHub:async()=>{mutations++;return snapshot;},githubRepositories:async()=>({repositories:[],nextPage:null})}};
 const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>{assert(name in mocks,name);return mocks[name];},module,module.exports);const {GET,POST}=module.exports;
 const post=(body,origin='http://localhost')=>new Request('http://localhost/api/github',{method:'POST',headers:{origin,'content-type':'application/json'},body});
 assert.equal((await GET(new Request('http://localhost/api/github'))).status,401);assert.equal((await POST(post('{}'))).status,401);
 logged=true;assert.equal((await POST(post('{}','https://evil.invalid'))).status,403);readOnly=true;assert.equal((await POST(post('{"action":"connect"}'))).status,403);readOnly=false;
 assert.equal((await POST(post('x'.repeat(8193)))).status,413);assert.equal((await POST(post('{'))).status,400);assert.equal((await POST(post('{"action":"unsupported"}'))).status,400);assert.equal(mutations,0);
 const verification=await POST(post(JSON.stringify({action:'verify',token:'synthetic-secret',version:'v'})));assert.equal(verification.status,200);assert.equal(mutations,0);assert.equal(audits.length,0);
 const result=await POST(post(JSON.stringify({action:'connect',token:'synthetic-secret',version:'v'})));assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');assert.deepEqual(await result.json(),snapshot);assert.equal(mutations,1);assert.deepEqual(audits,[['github-connect','saved',true]]);assert(!JSON.stringify(audits).includes('synthetic-secret'));
 assert.equal((await GET(new Request('http://localhost/api/github?view=repositories'))).status,200);
 assert.deepEqual(await (await GET(new Request('http://localhost/api/github?view=project&repository=fixture/repo'))).json(),{types:['Next.js'],status:'detected'});
});
