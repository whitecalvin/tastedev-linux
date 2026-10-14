import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('translation source check ignores comments, finds conditional labels, and rejects missing labels and broken placeholders',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-translation-check-')),script=fileURLToPath(new URL('../scripts/check-translations.ts',import.meta.url));
 const exec=promisify(execFile);
 try{
  for(const name of ['app','components','lib/locales'])await mkdir(path.join(root,name),{recursive:true});
  for(const file of (await readdir(new URL('../lib/',import.meta.url))).filter(name=>/\.(?:mjs|ts)$/.test(name)))await writeFile(path.join(root,'lib',file),'export {};');
  await writeFile(path.join(root,'lib/nginx-main-settings.ts'),"export const description='최상위 설명';");
  await writeFile(path.join(root,'components/fixture.jsx'),"// t('댓글')\nconst view=()=>t(ok ? '로그인' : '닫기');t(dynamic);");
  await writeFile(path.join(root,'lib/locales/en.json'),JSON.stringify({'로그인':'Sign in','닫기':'Close','최상위 설명':'Main description'}));
  await writeFile(path.join(root,'lib/locales/ja.json'),'{}');
  const report=JSON.parse((await exec(process.execPath,[script],{cwd:root})).stdout);
  assert.equal(report.status,'PASS');assert.equal(report.literalKeys,3);assert.equal(report.dynamicCalls,1);
  assert.deepEqual(report.missingEnglish,[]);assert.equal(report.coverage.ja.missing,3);
  await writeFile(path.join(root,'components/fixture.jsx'),"t('누락');t('안녕 {name}');");
  await writeFile(path.join(root,'lib/locales/en.json'),JSON.stringify({'안녕 {name}':'Hello {name}','최상위 설명':'Main description'}));
  await writeFile(path.join(root,'lib/locales/ja.json'),JSON.stringify({'안녕 {name}':'こんにちは {file}'}));
  await assert.rejects(exec(process.execPath,[script],{cwd:root}),error=>{
   assert.equal(error.code,1);const failed=JSON.parse(error.stdout);assert.equal(failed.status,'FAIL');
   assert.equal(failed.missingEnglish[0].key,'누락');assert.equal(failed.invalid[0].reason,'placeholder mismatch');return true;
  });
 }finally{await rm(root,{recursive:true,force:true});}
});
