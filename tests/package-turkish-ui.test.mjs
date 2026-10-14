import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import tr from '../lib/locales/tr.json' with {type:'json'};
import en from '../lib/locales/en.json' with {type:'json'};
import {translate,languageCoverage} from '../lib/i18n.ts';
import {configSchemas,configLabels,redisEvictionDescriptions} from '../lib/config-schema.ts';
test('package-specific GUI panels have direct Turkish translations for registered text',async()=>{
 const files=(await readdir(new URL('../components/',import.meta.url))).filter(name=>/^(postgresql-|mariadb-|redis-|node-|package-config).*\.tsx$/.test(name));
 const keys=new Set();for(const name of files){const source=await readFile(new URL('../components/'+name,import.meta.url),'utf8');for(const match of source.matchAll(/(['"])([^'"\r\n]*[가-힣][^'"\r\n]*)\1/g)){const text=match[2].trim();if(Object.hasOwn(en,text))keys.add(text);}}
 assert(keys.has('PostgreSQL 재시작과 설정 변경 영향을 확인했습니다.'));assert(keys.has('서비스 등록 실패: 수동 복구가 필요합니다.'));
 for(const key of keys){assert(Object.hasOwn(tr,key),'Missing package UI translation: '+key);assert.equal(translate('tr-TR',key),tr[key]);}
 assert.equal(languageCoverage('tr').complete,true,'the current Turkish UI catalog is fully populated');
});
test('actual runtime field schemas and Redis policy descriptions use Turkish without changing identifiers',()=>{
 for(const schema of Object.values(configSchemas)){
  for(const text of [schema.description,...schema.fields.map(field=>field[1])]){assert(Object.hasOwn(tr,text),text);assert(!/[가-힣]/.test(translate('tr',text)));}
 }
 for(const text of [...Object.values(configLabels),...Object.values(redisEvictionDescriptions)])assert(Object.hasOwn(tr,text),text);
 assert(translate('tr',redisEvictionDescriptions['volatile-lfu']).includes('TTL'));assert(translate('tr',redisEvictionDescriptions['volatile-lfu']).includes('LFU'));
 assert(translate('tr','원본 서비스 설정을 복원하고 systemd 설정을 다시 읽습니다. 실행 중인 앱은 재시작하지 않습니다.').includes('yeniden başlatılmaz'));
 assert(translate('tr','파일 저장 및 reload 요청 완료').includes('isteği gönderildi'));
});
