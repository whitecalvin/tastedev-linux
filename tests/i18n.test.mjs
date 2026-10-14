import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import ja from '../lib/locales/ja.json' with {type:'json'};
import pt from '../lib/locales/pt.json' with {type:'json'};
import tr from '../lib/locales/tr.json' with {type:'json'};
import linuxLocales from '../lib/locales/linux-locales.json' with {type:'json'};
import {resolveLocale,translate,formatNumber,languages,localeFlag,languageCoverage} from '../lib/i18n.ts';
test('Turkish regional UI covers the complete current catalog with preserved placeholders',()=>{
 assert.equal(resolveLocale('tr_TR.UTF-8'),'tr-TR');assert.equal(translate('tr-TR','관리자 로그인'),'Yönetici girişi');assert.equal(translate('tr','보안 옵션 저장'),'Güvenlik seçeneklerini kaydet');assert.equal(translate('tr-TR',' nginx -t '),' nginx -t ');
 assert.deepEqual(Object.keys(tr).sort(),Object.keys(en).sort());assert.equal(languageCoverage('tr-TR').complete,true);assert.equal(languageCoverage('tr-TR').translatedEntries,Object.keys(en).length);
 assert.equal(translate('tr-TR','인증 방식'),'Doğrulama yöntemi');assert.equal(translate('tr-TR','만료: '),'Sona erme: ');
 for(const [key,value] of Object.entries(tr)){assert(Object.hasOwn(en,key),key);assert(value.trim());assert(!/[가-힣]/.test(value),key);assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),key+' preserves variable names and multiplicity while allowing translated word order');}
});
test('language resolution, missing-translation fallback, and formatting are deterministic',()=>{
 assert.equal(resolveLocale('ko_KR.UTF-8'),'ko-KR');assert.equal(resolveLocale('ja-JP'),'ja-JP');assert.equal(resolveLocale('unknown'),'en');
 assert.equal(translate('en','로그인'),'Sign in');assert.equal(translate('ja','로그인'),'ログイン');assert.equal(translate('ja-JP','로그인'),'ログイン');assert.equal(resolveLocale('en-GB'),'en-GB');assert.equal(translate('zh','로그인'),'登录');assert.equal(translate('ja','권한별 독립 설정'),'権限ごとの独立設定');assert.equal(translate('en','nginx -t'),'nginx -t');assert.equal(translate('en',' 로그인 '),' Sign in ');assert.equal(formatNumber('en',12345),'12,345');assert.equal(new Set(languages.map(item=>item.id)).size,languages.length);
 const missing=Object.keys(en).find(key=>!Object.hasOwn(ja,key));
 if(missing)assert.equal(translate('ja',missing),en[missing]);
 assert.equal(translate('unsupported-language','로그인'),en['로그인']);
});

test('locale flags use explicit regions and safely fall back',()=>{assert.equal(localeFlag('ko-KR'),'🇰🇷');assert.equal(localeFlag('en-GB'),'🇬🇧');assert.equal(localeFlag('en-US'),'🇺🇸');assert.equal(localeFlag('ja'),'🇯🇵');assert.equal(localeFlag('en-001'),'🌐');assert.equal(localeFlag('invalid_locale'),'🌐');});

test('all language flags are fixed even when browser region inference differs',()=>{
 const expected=languages.map(item=>localeFlag(item.id)),original=Intl.Locale;
 try{
  Intl.Locale=class{constructor(){throw Error('Locale unavailable');}};
  assert.deepEqual(languages.map(item=>localeFlag(item.id)),expected);
  Intl.Locale=class{maximize(){return {region:'US'};}};
  assert.deepEqual(languages.map(item=>localeFlag(item.id)),expected);
  assert(languages.every(item=>typeof item.flag==='string'&&item.flag.length>0));
 }finally{Intl.Locale=original;}
});

test('regional Spanish French and German use their shared catalog',()=>{assert.equal(translate('es-MX','로그인'),'Iniciar sesión');assert.equal(translate('fr-CA','로그인'),'Se connecter');assert.equal(translate('de-DE','로그인'),'Anmelden');});

test('Russian and Arabic regional UI use complete catalogs with explicit coverage',()=>{
 assert.equal(translate('ru-RU','로그인'),'Войти');assert.equal(translate('ar-SA','로그인'),'تسجيل الدخول');
 for(const locale of ['ru','ru-RU','ar','ar-SA']){
  assert.equal(languageCoverage(locale).complete,true);
  for(const key of Object.keys(en))assert.notEqual(translate(locale,key),key,`${locale}: ${key}`);
 }
 assert.equal(languageCoverage('en').complete,true);assert.equal(languageCoverage('ko').complete,true);
});

test('code recovery guidance uses the selected language rather than English fallback',()=>{
 for(const locale of ['ja-JP','zh-CN','de-DE','fr-CA','es-MX','ru-RU','ar-SA']){
  for(const key of ['미저장 코드 복구','선택한 노드에서 편집','원래 노드가 없어졌습니다. 코드는 보존되어 있습니다.','같은 파일의 같은 종류 노드를 선택하세요.','대상 노드에 미저장 코드가 있습니다.']){
   const value=translate(locale,key);assert.equal(typeof value,'string');assert(value.trim().length>0);assert.notEqual(value,key);assert.notEqual(value,en[key]);
  }
 }
});

test('file confirmations place literal filenames inside a complete translated sentence',()=>{
 const key='저장하지 않은 변경을 버리고 {name} 탭을 닫을까요?',name='draft $& {name} <test>.conf';
 for(const locale of ['ko','en','ja-JP','zh-CN','de-DE','fr-CA','es-MX','ru-RU','ar-SA','pt-BR','pt-PT']){
  const template=translate(locale,key),result=translate(locale,key,{name});
  assert.equal(result,template.replace('{name}',()=>name));
  assert.equal(translate(locale,key,{}),template);
  assert.equal(translate(locale,key,Object.create({name:'inherited'})),template);
 }
 assert.equal(translate('ko','{name}',{name:0}),'0');
 assert.equal(translate('en',null,{name:'file'}),null);
});

test('language labels are identical even when browser Intl display names are missing or different',async()=>{
 const original=Intl.DisplayNames;
 try{
  Intl.DisplayNames=class{constructor(){throw Error('DisplayNames unavailable');}};
  const unavailable=await import('../lib/i18n.ts?display-names-unavailable');
  Intl.DisplayNames=class{of(){return 'aa (Djibouti)';}};
  const different=await import('../lib/i18n.ts?display-names-different');
  assert.deepEqual(unavailable.languages,languages);assert.deepEqual(different.languages,languages);
  assert.equal(languages.find(item=>item.id==='aa-DJ').label,'Afar (Djibouti)');
  const ids=new Set(languages.map(item=>item.id));
  for(const locale of linuxLocales){let id;try{id=Intl.getCanonicalLocales(locale)[0];}catch{continue;}assert(ids.has(id),'Locale missing from fixed labels: '+id);}
  assert(languages.every(item=>typeof item.label==='string'&&item.label.trim()));
 }finally{Intl.DisplayNames=original;}
});


test('Portuguese regional locales share a complete catalog with deterministic locale selection',()=>{
 for(const locale of ['pt-BR','pt-PT']){assert.equal(translate(locale,'로그인'),'Entrar');assert.equal(translate(locale,'패키지 설치'),'Instalação de pacotes');assert.equal(translate(locale,'터미널 설정'),'Configurações do terminal');assert.equal(languageCoverage(locale).complete,true);assert.equal(languageCoverage(locale).translatedEntries,Object.keys(en).length);}
 assert.equal(resolveLocale('pt_BR.UTF-8'),'pt-BR');assert.equal(resolveLocale('pt_PT.UTF-8'),'pt-PT');
 assert.equal(translate('pt-BR','권한별 독립 설정'),'Configurações independentes por permissão');
 assert.deepEqual(Object.keys(pt).sort(),Object.keys(en).sort());
 assert.equal(translate('pt-BR','unlisted technical token'),'unlisted technical token');
 assert.equal(translate('en','원본 복구 완료'),'Original configuration restored');
 assert.equal(translate('en','복구 상태를 확인하세요.'),'Check the recovery status.');
});

test('Japanese regional UI uses a complete catalog without placeholder loss or Korean fallback',()=>{
 assert.deepEqual(Object.keys(ja).sort(),Object.keys(en).sort());
 const placeholders=text=>[...new Set(text.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[])].sort();
 for(const key of Object.keys(en)){
  assert.equal(typeof ja[key],'string',key);assert(ja[key].trim(),key);assert(!/[가-힣]/.test(ja[key]),key);
  assert.deepEqual(placeholders(ja[key]),placeholders(en[key]),key);
  const output=translate('ja-JP',key);assert(!/[가-힣]/.test(output),key);
  if(key===key.trim())assert.equal(output,ja[key],key);
  else assert.equal(output.trim(),ja[key.trim()],key);
 }
 assert.deepEqual(languageCoverage('ja'),{translatedEntries:Object.keys(en).length,totalEntries:Object.keys(en).length,complete:true});
 assert.equal(languageCoverage('ja-JP').complete,true);
 assert.equal(translate('ja-JP','현재 페이지의 최대 100건에서 검색합니다. 날짜는 UTC 기준입니다.'),'現在のページの最大 100 件から検索します。日付は UTC 基準です。');
});


test('Localized search matches Turkish dotted/dotless letters without breaking ASCII identifiers',async()=>{
 const {matchesLocalizedText:match}=await import('../lib/i18n.ts');
 assert(match('tr-TR','İşlem kimliği','işlem'));
 assert(match('tr-TR','Işık','ışık'));
 assert(match('tr-TR','idle_session_timeout','IDLE_SESSION_TIMEOUT'));
 assert(match('tr-TR','GÜNLÜK DOSYALARINA TOPLAMAK','günlük dosyalarına toplamak'));
 assert(match('en-US','PORT','port'));
 assert(match('ko-KR','서버 설정','설정'));
 assert(match('not a locale','PORT','port'));
 assert(!match('tr-TR','İşlem kimliği','sunucu'));
});


test('Italian regional UI covers all catalog entries and preserves technical tokens',async()=>{
 const {default:catalog}=await import('../lib/locales/it.json',{with:{type:'json'}});
 for(const locale of ['it-IT','it-CH']){
  assert.equal(translate(locale,'로그인'),'Accedi');
  assert.equal(translate(locale,'설정값 비우기'),'Svuota valore');
  assert.equal(languageCoverage(locale).complete,true);
  assert.equal(languageCoverage(locale).translatedEntries,Object.keys(catalog).length);
  assert.equal(languageCoverage(locale).totalEntries,Object.keys(en).length);
  assert.deepEqual(Object.keys(catalog).sort(),Object.keys(en).sort());
  for(const key of Object.keys(en))assert(!/[가-힣]/.test(translate(locale,key)),key);
 }
 for(const [key,value] of Object.entries(catalog)){
  assert(Object.hasOwn(en,key),key);assert.equal(typeof value,'string');assert(value.trim(),key);
  assert(!/[가-힣]/.test(value),key);
  assert.deepEqual(value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[],en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[],key);
 }
 assert.equal(translate('it-IT','nginx -t'),'nginx -t');
});

test('Ukrainian UI resolves Linux locales and covers the complete catalog with preserved placeholders',async()=>{
 const {default:uk}=await import('../lib/locales/uk.json',{with:{type:'json'}});
 assert.equal(resolveLocale('uk_UA.UTF-8'),'uk-UA');assert.equal(localeFlag('uk-UA'),'🇺🇦');
 for(const locale of ['uk','uk-UA']){
  assert.equal(translate(locale,'관리자 로그인'),'Вхід адміністратора');assert.equal(translate(locale,'패키지 설치'),'Встановлення пакетів');assert.equal(translate(locale,'작업 메모리 (MB)'),'Робоча пам’ять (MB)');
  assert.equal(languageCoverage(locale).complete,true);assert.equal(languageCoverage(locale).translatedEntries,Object.keys(en).length);
  for(const key of Object.keys(en)){assert(Object.hasOwn(uk,key),key);assert(!/[가-힣]/.test(translate(locale,key)),key);}
  assert.equal(translate(locale,'unregistered technical token'),'unregistered technical token');
 }
 for(const [key,value]of Object.entries(uk)){assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());}
});


test('nginx site controls and interrupted-change messages use each registered UI language',()=>{
 const messages=['사이트 연결','사이트 활성화','실제 설정 포함 여부','확인 필요','변경 사항 없음','원본 연결 복구','처리 중','중단된 nginx 사이트 연결을 먼저 복구하세요.','중단된 nginx 설정 변경을 먼저 복구하세요.'];
 for(const locale of ['en','ja-JP','zh-CN','es-MX','fr-CA','de-DE','ru-RU','ar-SA','pt-BR','it-IT','tr-TR','uk-UA'])for(const message of messages){const result=translate(locale,message);assert(result.trim());assert(!/[가-힣]/.test(result),locale+': '+message);if(locale!=='en')assert.notEqual(result,en[message],locale+': '+message);}
});
