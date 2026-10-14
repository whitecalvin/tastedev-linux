import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import tr from '../lib/locales/tr.json' with {type:'json'};
import en from '../lib/locales/en.json' with {type:'json'};
import {translate,languageCoverage} from '../lib/i18n.ts';

test('Turkish operational panels have direct translations for their catalogued text',async()=>{
 const keys=new Set();
 for(const file of ['components/operations-panel.tsx','components/security-panel.tsx','components/sudo-policy-panel.tsx','components/audit-panel.tsx','lib/audit-view.ts']){
  const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
  for(const match of source.matchAll(/(['"])([^'"\r\n]*[가-힣][^'"\r\n]*)\1/g))if(Object.hasOwn(en,match[2]))keys.add(match[2]);
 }
 assert(keys.size>100);
 for(const key of keys){assert(Object.hasOwn(tr,key),'Missing direct Turkish translation: '+key);assert.equal(translate('tr-TR',key),tr[key]);assert(!/[가-힣]/.test(tr[key]));}
 assert.equal(languageCoverage('tr-TR').complete,true,'the current Turkish UI catalog is fully populated');
});
test('Turkish operation guidance retains authentication distinctions and interpolation',()=>{
 const guidance=translate('tr','PASSWD 규칙은 비밀번호 입력을 요구합니다. sudo -n으로 실행하는 웹 작업은 인증이 없으면 실패합니다. 기존 OS 규칙에 따라 최종 권한이 달라질 수 있습니다.');
 assert(guidance.includes('PASSWD'));assert(guidance.includes('sudo -n'));assert(guidance.includes('başarısız'));
 assert.equal(translate('tr','최근 {total}건 중 {visible}건 표시. 최대 최근 100건을 조회합니다.',{total:100,visible:12}),'Son 100 kayıttan 12 tanesi gösteriliyor. En fazla son 100 kayıt yüklenir.');
 assert(translate('tr','현재 페이지의 최대 100건에서 검색합니다. 날짜는 UTC 기준입니다.').includes('UTC'));
});
