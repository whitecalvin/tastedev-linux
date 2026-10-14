import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 translation catalogs and lazy JSON loading run emitted JavaScript without TypeScript support',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','i18n-runtime-'));
 try{
  const allowed=['lib/i18n.mjs','lib/i18n-core.mjs','lib/i18n-client.mjs'];
  for(const file of allowed)await writeFile(join(root,file.slice(4)),await readRuntimeModule(file,allowed),{mode:0o600});
  await mkdir(join(root,'locales'),{mode:0o700});
  for(const file of await readdir(new URL('../lib/locales/',import.meta.url)))if(file.endsWith('.json'))await copyFile(new URL('../lib/locales/'+file,import.meta.url),join(root,'locales',file));
  const source=await readFile(new URL('./i18n.test.mjs',import.meta.url),'utf8'),output=join(root,'i18n.test.mjs');await writeFile(output,source.replace(/\.\.\/lib\/([a-z0-9-]+)\.(?:ts|mjs)/g,'./$1.mjs').replace(/\.\.\/lib\/locales\//g,'./locales/'),{mode:0o600});
  const worker=join(root,'loader.test.mjs');await writeFile(worker,`import test from 'node:test';import assert from 'node:assert/strict';import {loadLanguageCatalog} from './i18n-client.mjs';import {translateWithCatalog} from './i18n-core.mjs';test('lazy locale loading shares pending reads and inherited keys remain literal',async()=>{const first=loadLanguageCatalog('ja-JP'),second=loadLanguageCatalog('ja');assert.equal(first,second);const catalog=await first;assert.equal(translateWithCatalog('ja','관리자 로그인',undefined,catalog,{}),'管理者ログイン');for(const key of ['constructor','__proto__','toString']){assert.deepEqual(await loadLanguageCatalog(key),{});assert.equal(translateWithCatalog('en',key,undefined,{},{}),key);}});`,{mode:0o600});
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',output,worker],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 16\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
