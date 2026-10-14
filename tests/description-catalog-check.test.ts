import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import settings from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hba from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {inspectDescriptionCatalogs as inspect} from '../scripts/verification/description-catalog.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord,recordField} from '../scripts/verification/http-json.ts';

test('description inventory reports effective settings and complete Catalan/Finnish help independently of UI coverage',()=>{
  const result=inspect(settings,overrides,hba);
  assert.equal(result.status,'PASS');assert.deepEqual(result.invalid,[]);
  for(const locale of ['ca','fi','ar','ka']){
    assert.deepEqual(result.coverage[locale].settings,{translated:351,total:351,missing:0,complete:true});
    assert.deepEqual(result.coverage[locale].hba,{translated:27,total:27,missing:0,complete:true});
  }
});

test('case-normalized overrides match runtime lookup and invalid overrides cannot conceal missing help',()=>{
  const main={en:{DateStyle:['Date format'],port:['TCP port']},fi:{port:['TCP-portti']}};
  const extra={en:{include:['Read file']},fi:{datestyle:['Päiväys'],include:['Lue tiedosto']}};
  const rules={en:{peer:'OS user'},fi:{peer:'Käyttäjä'}};
  assert.deepEqual(inspect(main,extra,rules).coverage.fi.settings,{translated:3,total:3,missing:0,complete:true});
  const broken=inspect(main,{...extra,fi:{datestyle:[],include:['Lue tiedosto']}},rules);
  assert.equal(broken.status,'FAIL');assert.equal(broken.coverage.fi.settings.translated,2);
  assert(broken.invalid.some(issue=>issue.key==='datestyle'&&issue.reason==='non-empty text required'));
  assert.equal(inspect(main,{...extra,fi:{DateStyle:['Päiväys']}},rules).status,'FAIL');
  const partial=inspect(main,{en:extra.en},rules);
  assert.equal(partial.status,'PASS');assert.equal(partial.coverage.fi.settings.missing,2);
  const absent=inspect(main,extra,rules,['cs']);
  assert.equal(absent.coverage.cs.settings.translated,0);assert.equal(absent.coverage.cs.settings.missing,3);
  assert.equal(absent.coverage.cs.hba.missing,1);
});

test('description schemas reject unknown keys, blank text, malformed paragraphs and leaked Korean',()=>{
  const result=inspect({en:{port:['Port']},fi:{port:'wrong shape',unknown:['Unknown']}},{en:{include:['Read']},fi:{include:[' ']}},{en:{peer:'User'},fi:{peer:'사용자'}});
  assert.equal(result.status,'FAIL');assert.equal(result.invalid.length,4);
  assert.equal(result.coverage.fi.settings.translated,0);assert.equal(result.coverage.fi.hba.translated,0);
  assert.equal(inspect(null,{},[]).status,'FAIL');
  assert.equal(inspect({en:{port:['Port']},constructor:{port:['Bad']}},{en:{include:['Read']}},{en:{peer:'User'}}).status,'FAIL');
});

test('description CLI returns failure for malformed files and accepts honest partial coverage',async()=>{
  const root=await verificationWorkDirectory('description-catalog-cli-');
  const run=promisify(execFile),checker=resolve('scripts/check-setting-descriptions.ts');
  const dir=join(root,'lib/locales');await mkdir(dir,{recursive:true});
  const save=async(name:string,value:unknown)=>writeFile(join(dir,name+'.json'),JSON.stringify(value));
  try{
    await save('postgresql-descriptions',{en:{port:['TCP port']},fi:{port:[]}});
    await save('postgresql-description-overrides',{en:{include:['Read file']}});
    await save('postgresql-hba-descriptions',{en:{peer:'OS user'}});
    await save('cs',{});
    await assert.rejects(run(process.execPath,[checker],{cwd:root}),error=>error instanceof Error&&'stdout' in error&&typeof error.stdout==='string'&&jsonRecord(JSON.parse(error.stdout)).status==='FAIL');
    await save('postgresql-descriptions',{en:{port:['TCP port']},fi:{port:['TCP-portti']}});
    const result=jsonRecord(JSON.parse((await run(process.execPath,[checker],{cwd:root})).stdout));
    const coverage=recordField(result,'coverage');
    assert.equal(result.status,'PASS');assert.equal(recordField(recordField(coverage,'fi'),'settings').missing,1);assert.equal(recordField(recordField(coverage,'fi'),'hba').missing,1);
    assert.equal(recordField(recordField(coverage,'cs'),'settings').translated,0);
  }finally{await rm(root,{recursive:true,force:true});}
});
