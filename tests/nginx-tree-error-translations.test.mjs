import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {nginxTree} from '../lib/nginx-tree.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
test('every literal nginx file tree safety diagnostic has a native translation',async()=>{
 await loadBindings();const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/nginx-tree.ts',import.meta.url),'utf8'),{filename:'nginx-tree.ts',syntax:'typescript'}));assert.equal(literals.length,6);
 for(const locale of locales){const c=languageCatalog(locale);for(const key of literals){assert(Object.hasOwn(c,key));assert.equal(translate(locale,key),c[key]);assert(!/[가-힣]/.test(c[key]));for(const token of ['256KB','UTF-8','nginx'])if(key.includes(token))assert(c[key].includes(token));}}
});
test('real fixture tree retains link containment, UTF-8/size limits and localized bounded-list warnings',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-tree-copy-'));try{
  const directory=path.join(root,'nginx');await mkdir(path.join(directory,'conf.d'),{recursive:true});await mkdir(path.join(root,'external'));await symlink(path.join(root,'external'),path.join(directory,'snippets'));
  await writeFile(path.join(root,'private.conf'),'never-expose-fixture');await writeFile(path.join(directory,'nginx.conf'),'http {}');
  await symlink(path.join(root,'private.conf'),path.join(directory,'outside.conf'));await writeFile(path.join(directory,'large.conf'),Buffer.alloc(262145,32));await writeFile(path.join(directory,'binary.conf'),'a\0b');
  for(let i=0;i<101;i++)await writeFile(path.join(directory,'conf.d',String(i).padStart(3,'0')+'.conf'),'');
  const data=await nginxTree({directory});assert.equal(data.files.filter(file=>file.name.startsWith('conf.d/')).length,100);assert(data.warnings.includes('conf.d: 처음 100개 파일만 표시합니다.'));assert(data.warnings.includes('snippets: 설정 디렉터리 링크는 조회하지 않습니다.'));
  for(const name of ['outside.conf','large.conf','binary.conf']){const file=data.files.find(file=>file.name===name);assert(file.error);assert.equal(file.source,'');for(const locale of locales)assert(!/[가-힣]/.test(translate(locale,file.error)));}
  assert(!JSON.stringify(data).includes('never-expose-fixture'));
  for(const locale of locales){for(const warning of data.warnings){assert(!/[가-힣]/.test(translate(locale,warning)));assert.equal(translate('ko',warning),warning);}assert(translate(locale,data.warnings.find(x=>x.startsWith('conf.d:'))).includes('conf.d'));assert(translate(locale,data.warnings.find(x=>x.startsWith('conf.d:'))).includes('100'));}
 }finally{await rm(root,{recursive:true,force:true});}
});
test('unknown directory diagnostics and arbitrary directory identifiers remain unchanged',()=>{
 assert.equal(translate('en','conf.d: EACCES'),'conf.d: EACCES');assert.equal(translate('en','other: 처음 100개 파일만 표시합니다.'),'other: 처음 100개 파일만 표시합니다.');assert.equal(translate('ko','snippets: 설정 디렉터리 링크는 조회하지 않습니다.'),'snippets: 설정 디렉터리 링크는 조회하지 않습니다.');
});
