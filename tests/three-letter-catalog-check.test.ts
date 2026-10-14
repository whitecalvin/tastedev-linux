import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readdir,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord,recordField} from '../scripts/verification/http-json.ts';

test('catalog validation checks three-letter Linux language codes and rejects broken variables',async()=>{
  const root=await verificationWorkDirectory('three-letter-catalog-check-');
  const checker=resolve('scripts/check-translations.ts');
  const run=promisify(execFile);
  try{
    for(const directory of ['app','components','lib/locales'])await mkdir(join(root,directory),{recursive:true});
    for(const name of (await readdir('lib')).filter(name=>name.endsWith('.ts')))
      await writeFile(join(root,'lib',name),'export {};\n');
    await writeFile(join(root,'components/fixture.tsx'),"const view=()=>t('안녕 {name}');\n");
    await writeFile(join(root,'lib/locales/en.json'),JSON.stringify({'안녕 {name}':'Hello {name}'}));
    await writeFile(join(root,'lib/locales/ast.json'),JSON.stringify({'안녕 {name}':'Hola {file}'}));
    await assert.rejects(run(process.execPath,[checker],{cwd:root}),error=>{
      assert(error!==null&&typeof error==='object'&&'stdout' in error&&typeof error.stdout==='string');
      const report=jsonRecord(JSON.parse(error.stdout));
      assert.equal(report.status,'FAIL');assert(Array.isArray(report.invalid));
      assert(report.invalid.some(item=>{const row=jsonRecord(item);return row.locale==='ast'&&row.reason==='placeholder mismatch';}));
      assert.equal(recordField(recordField(report,'coverage'),'ast').total,1);
      return true;
    });
    await writeFile(join(root,'lib/locales/ast.json'),JSON.stringify({'안녕 {name}':'Hola {name}'}));
    const report=jsonRecord(JSON.parse((await run(process.execPath,[checker],{cwd:root})).stdout));
    assert.equal(report.status,'PASS');assert.deepEqual(report.invalid,[]);
    assert.equal(recordField(recordField(report,'coverage'),'ast').missing,0);
  }finally{await rm(root,{recursive:true,force:true});}
});
