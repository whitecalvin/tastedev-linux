import test from 'node:test';
import assert from 'node:assert/strict';
import hindi from '../lib/locales/hi.json' with {type:'json'};
import english from '../lib/locales/en.json' with {type:'json'};
import {translate,languageCoverage,languageCatalog,languageCoverageSummary} from '../lib/i18n.ts';
import {resolveLocale,localeFlag} from '../lib/i18n-core.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';

test('Hindi server and lazy client catalogs agree for regional language selection',async()=>{
 assert(resolveLocale('hi_IN.UTF-8').startsWith('hi'));
 assert.equal(localeFlag('hi-IN'),'🇮🇳');
 const loaded:Readonly<Record<string,string>>=await loadLanguageCatalog('hi-IN');assert.deepEqual(loaded,hindi);assert.deepEqual(languageCatalog('hi-IN'),hindi);
 const coreKeys:readonly (keyof typeof hindi)[]=['관리자 로그인','로그인','사용자명','비밀번호','대시보드','터미널','언어 선택'];
 for(const key of coreKeys){assert.equal(translate('hi-IN',key),loaded[key]);assert(/[\u0900-\u097f]/.test(loaded[key]));}
});

test('Hindi UI catalog covers every canonical message without claiming description completion',()=>{
 const coverage=languageCoverage('hi-IN');assert.equal(coverage.translatedEntries,Object.keys(english).length);assert.equal(coverage.totalEntries,Object.keys(english).length);assert.equal(coverage.complete,true);assert.equal(languageCoverageSummary().hi.complete,true);
 assert.deepEqual(Object.keys(english).filter(key=>!Object.hasOwn(hindi,key)),[]);
 assert.equal(translate('hi-IN','부분 번역'),'आंशिक अनुवाद');assert.equal(translate('hi-IN','영어 UI'),'अंग्रेज़ी इंटरफ़ेस');
});

test('Hindi core security copy retains session termination, consent and API-charge meaning',()=>{
 assert(translate('hi-IN','비밀번호를 변경하면 모든 로그인 세션이 종료됩니다. 새 비밀번호로 다시 로그인하세요.').includes('सभी लॉगिन सत्र समाप्त'));
 assert(translate('hi-IN','위 로그를 검토했으며 OpenAI 전송에 동의합니다.').includes('OpenAI को भेजने की सहमति'));
 const consent=translate('hi-IN','일부 키·비밀번호 패턴을 자동 마스킹합니다. 개인정보와 내부 주소 등은 직접 검토해 제거하세요. 선택한 로그만 OpenAI로 전송하며 API 사용 비용이 발생할 수 있습니다.');assert(consent.includes('केवल चुने हुए लॉग')&&consent.includes('API शुल्क लग सकता है'));
 assert(translate('hi-IN','제안은 자동 실행되지 않습니다. 서버 상태와 적용 영향을 확인하세요.').includes('अपने आप नहीं चलाए जाते'));
});

test('Hindi operational copy preserves installation exclusions and unsaved edit retention',()=>{
 const install=translate('hi-IN','패키지와 의존성을 설치하며, 패키지 기본 동작에 따라 서비스가 시작될 수 있습니다. 이미 설치된 선택 패키지는 업그레이드하지 않습니다. 인증서 발급과 nginx 설정은 포함하지 않습니다.');assert(install.includes('सेवाएँ शुरू हो सकती हैं')&&install.includes('अपग्रेड नहीं किए जाते')&&install.includes('इसमें शामिल नहीं'));
 assert(translate('hi-IN','디스크 버전을 저장 기준으로 갱신했습니다. 편집 내용은 유지됩니다.').includes('आपके संपादन बने हुए हैं'));
 assert(translate('hi-IN','편집 내용을 자동으로 덮어쓰지 않습니다. 필요한 내용을 비교해 반영하세요.').includes('अपने आप नहीं बदलते'));
 assert.equal(translate('hi-IN','부팅 시 자동 시작 켜기'),'बूट पर स्वतः शुरू करना सक्षम करें');assert.equal(translate('hi-IN','부팅 시 자동 시작 끄기'),'बूट पर स्वतः शुरू करना अक्षम करें');
});

test('Hindi service and security copy preserves actual permission and restoration limits',()=>{
 const service=translate('hi-IN','자동 시작 설정은 현재 실행 상태를 바꾸지 않습니다. nginx 시작·재시작·재로드 전에 nginx -t를 검사합니다. 서비스 제어는 관리자 모드에서만 사용할 수 있습니다.');assert(service.includes('वर्तमान चलने की स्थिति नहीं बदलती')&&service.includes('nginx -t')&&service.includes('प्रशासक मोड आवश्यक'));
 const restore=translate('hi-IN','복구 전 현재 설정을 백업합니다. nginx 복구는 구문 검사 후 재로드하며, crontab 복구는 전체 예약 목록을 선택한 시점으로 되돌립니다.');assert(restore.includes('पहले वर्तमान कॉन्फ़िगरेशन का बैकअप')&&restore.includes('पूरी समय-सारणी'));
 const security=translate('hi-IN','앱의 스위치만으로 OS 권한이 생성되지는 않습니다. 비밀번호 입력 방식과 인증 캐시는 OS 정책으로 관리하며, 브라우저에서 sudo 비밀번호를 수집하지 않습니다. 관리 작업의 영향 확인과 인증서 약관 동의는 항상 필요합니다.');assert(security.includes('OS अनुमतियाँ नहीं देते')&&security.includes('sudo पासवर्ड नहीं लिया जाता')&&security.includes('हमेशा आवश्यक'));
 const aof=translate('hi-IN','AOF를 끄면 AOF 지속성 설정만 변경됩니다. 기존 RDB 스냅샷 정책은 이 조각에 포함하지 않습니다. 메모리 제거 정책에 따라 키가 제거될 수 있습니다.');assert(aof.includes('केवल AOF')&&aof.includes('RDB स्नैपशॉट नीति')&&aof.includes('कुंजियाँ हटाई जा सकती हैं'));
});

test('Hindi configuration copy preserves staged apply, ACME test effects and cron scope',()=>{
 assert(translate('hi-IN','설정 초안 저장 완료 · nginx는 변경하지 않았습니다.').includes('nginx नहीं बदला'));
 const nginx=translate('hi-IN','적용 위치: /etc/nginx/conf.d/linux-도메인.conf. 이 앱이 관리하는 운영 블록을 불러와 편집합니다. 다른 설정 파일은 변경하지 않습니다. HTTPS 편집은 SSL·리다이렉트 설정을 보존합니다. 적용 시 백업 → nginx -t → 재로드 순서로 진행합니다.');assert(nginx.includes('बैकअप → nginx -t → पुनः लोड')&&nginx.includes('दूसरी कॉन्फ़िगरेशन फ़ाइलें नहीं बदलतीं'));
 const renewal=translate('hi-IN','서버에 등록된 기존 인증서 전체의 갱신 절차를 테스트합니다. 기존 갱신 설정의 인증 플러그인과 pre/post hook이 실행될 수 있으며 nginx가 일시적으로 변경될 수 있습니다. 발급한 테스트 인증서는 저장하지 않습니다.');assert(renewal.includes('सभी प्रमाणपत्रों')&&renewal.includes('pre/post hook')&&renewal.includes('अस्थायी रूप से बदल सकता है')&&renewal.includes('सहेजे नहीं जाते'));
 const cron=translate('hi-IN','현재 사용자 crontab의 LINUX 작업만 추가·수정합니다. 기존 작업과 환경 변수를 보존합니다. 시간대는 서버 cron 설정을 따릅니다. 같은 작업 이름으로 저장하면 변경하거나 비활성화할 수 있습니다.');assert(cron.includes('केवल LINUX कार्य')&&cron.includes('वातावरण चर सुरक्षित')&&cron.includes('समान कार्य नाम'));
});

test('Hindi package field labels preserve units and different zero meanings',()=>{
 assert.equal(translate('hi-IN','Redis 포트 (0=TCP 수신 안 함)'),'Redis पोर्ट (0=TCP सुनना बंद)');assert.equal(translate('hi-IN','최대 메모리 (MB, 0=제한 없음)'),'अधिकतम मेमोरी (MB, 0=असीमित)');
 assert(translate('hi-IN','느린 쿼리 기준 (초)').includes('सेकंड'));assert(translate('hi-IN','공유 버퍼 (MB)').includes('(MB)'));
 const event=translate('hi-IN','작업 이벤트는 브라우저 개발자 콘솔에도 출력됩니다. 관리자 토큰과 파일 본문은 기록하지 않습니다.');assert(event.includes('प्रशासक टोकन')&&event.includes('दर्ज नहीं होती'));
 assert(translate('hi-IN','운영 파일은 변경하지 않습니다. 수정한 초안을 검토하고 다운로드하세요.').includes('कॉन्फ़िगरेशन नहीं बदलता'));
});

test('Hindi draft and import help distinguishes source files, undo and UTC filtering',()=>{
 const block=translate('hi-IN','블록을 삭제하면 내부의 모든 설정 항목도 초안에서 삭제됩니다. 실행 취소로 복원할 수 있습니다.');assert(block.includes('प्रारूप से हटते')&&block.includes('पूर्ववत करके'));
 const imported=translate('hi-IN','읽은 항목만 현재 폼에 반영합니다. 다른 입력값은 유지됩니다.');assert(imported.includes('केवल पहचानी गई')&&imported.includes('अन्य इनपुट सुरक्षित'));
 const supported=translate('hi-IN','지정 파일의 지원 항목만 읽습니다. include 파일과 실행 중인 서버의 최종 설정은 별도로 확인하세요.');assert(supported.includes('include फ़ाइलों')&&supported.includes('अलग जाँच'));
 assert(translate('hi-IN','최근 기록 최대 100건에서 검색합니다. 날짜는 UTC 기준입니다.').includes('100')&&translate('hi-IN','최근 기록 최대 100건에서 검색합니다. 날짜는 UTC 기준입니다.').includes('UTC'));
});

test('Hindi recovery and Redis help preserves data boundaries and eviction scope',()=>{
 const metadata=translate('hi-IN','설정 백업의 메타데이터만 표시합니다. 데이터베이스 데이터 백업은 포함하지 않습니다.');assert(metadata.includes('केवल कॉन्फ़िगरेशन बैकअप')&&metadata.includes('डेटाबेस डेटा का बैकअप शामिल नहीं'));
 const restore=translate('hi-IN','지원 항목만 표시하지만 복원은 선택한 백업의 전체 설정 파일을 교체하고 클러스터를 재시작합니다.');assert(restore.includes('पूरी कॉन्फ़िगरेशन फ़ाइल')&&restore.includes('क्लस्टर पुनः शुरू'));
 const writes=translate('hi-IN','메모리 한도에 도달하면 키를 제거하지 않고 추가 메모리가 필요한 쓰기를 거부합니다.');assert(writes.includes('कुंजियाँ रखी जाती हैं')&&writes.includes('अस्वीकार'));
 assert(translate('hi-IN','TTL이 있는 키에서 최근 사용이 적은 키를 근사 LRU 방식으로 제거합니다.').includes('TTL वाली कुंजियों'));
 assert(translate('hi-IN','전체 키에서 최근 사용이 적은 키를 근사 LRU 방식으로 제거합니다.').includes('सभी कुंजियों'));
});

test('Hindi app service and cron help retains unregister and schedule boundaries',()=>{
 const unregister=translate('hi-IN','등록 목록에서만 제거합니다. 앱 파일과 서비스는 유지됩니다.');assert(unregister.includes('केवल पंजीकरण हटता')&&unregister.includes('फ़ाइलें और सेवाएँ सुरक्षित'));
 const register=translate('hi-IN','검토한 서비스 설정을 등록하고 systemd 설정을 다시 읽습니다. 앱 시작과 자동 시작은 별도로 설정합니다.');assert(register.includes('systemd')&&register.includes('अलग से कॉन्फ़िगर'));
 assert(translate('hi-IN','빈 값은 nginx 기본 설정을 상속합니다. 0은 업로드 크기 제한을 해제합니다.').includes('0 अपलोड आकार की सीमा हटाता'));
 assert(translate('hi-IN','선택한 날짜가 없는 달에는 실행되지 않습니다.').includes('कार्य नहीं चलता'));
 const percent=translate('hi-IN','명령의 이스케이프되지 않은 % 뒤 내용은 cron이 표준 입력으로 전달합니다. 문자 %를 사용하려면 역슬래시로 이스케이프하세요.');assert(percent.includes('%')&&percent.includes('मानक इनपुट')&&percent.includes('बैकस्लैश'));
});

test('Hindi permission and resource review copy avoids granting unsupported authority',()=>{
 const passwd=translate('hi-IN','PASSWD 규칙은 비밀번호 입력을 요구합니다. sudo -n으로 실행하는 웹 작업은 인증이 없으면 실패합니다. 기존 OS 규칙에 따라 최종 권한이 달라질 수 있습니다.');assert(passwd.includes('PASSWD')&&passwd.includes('बिना प्रमाणीकरण के विफल')&&passwd.includes('OS नियम'));
 const reverse=translate('hi-IN','PASSWD로 변경하거나 규칙 변경 명령을 해제하면 웹에서 되돌리지 못할 수 있습니다. 서버에서 복구할 수 있는지 확인하세요.');assert(reverse.includes('वेब से वापस बदलना संभव न हो')&&reverse.includes('सर्वर पर पुनर्प्राप्ति'));
 assert(translate('hi-IN','후보 파일의 검토 목록입니다. 실행 안전성 검증 결과는 아닙니다.').includes('सुरक्षित निष्पादन की पुष्टि नहीं'));
 const isolated=translate('hi-IN','임시 Redis 프로세스로 시작 가능 여부를 검사합니다. 운영 설정과 서비스는 변경하지 않습니다.');assert(isolated.includes('अस्थायी Redis प्रक्रिया')&&isolated.includes('सेवाएँ नहीं बदलतीं'));
});

test('Hindi nginx help retains interval timeouts, placeholders and recovery apply boundaries',()=>{
 assert(translate('hi-IN','업스트림 응답을 연속해서 읽는 사이의 제한 시간입니다.').includes('के बीच समय सीमा'));
 assert(translate('hi-IN','업스트림 요청을 연속해서 보내는 사이의 제한 시간입니다.').includes('के बीच समय सीमा'));
 assert(translate('hi-IN','허용할 요청 본문의 최대 크기입니다. 0은 크기 제한을 해제합니다.').includes('0 आकार की सीमा हटाता'));
 assert.equal(translate('hi-IN','저장하지 않은 변경을 버리고 {name} 탭을 닫을까요?',{name:'nginx.conf'}),'बिना सहेजे बदलाव हटाकर nginx.conf टैब बंद करें?');
 assert(translate('hi-IN','같은 파일의 같은 종류 노드를 선택한 뒤 편집을 이어갈 수 있습니다. 복구는 초안을 자동 적용하지 않습니다.').includes('अपने आप लागू नहीं करती'));
 assert(translate('hi-IN','gzip 압축 수준입니다. 1부터 9까지 지정합니다.').includes('1 से 9'));
});

test('Hindi terminal limits, private storage and audit placeholders retain their meaning',()=>{
 assert(translate('hi-IN','명령은 4096자 이하로 입력하세요.').includes('4096 अक्षरों'));assert(translate('hi-IN','터미널 입력은 4096바이트 이하로 입력하세요.').includes('4096 बाइट'));
 assert(translate('hi-IN','실행 제한 시간은 1~3600초 정수로 입력하세요.').includes('1 से 3600 सेकंड'));assert(translate('hi-IN','터미널은 최대 4개까지 동시에 실행할 수 있습니다.').includes('4 टर्मिनल'));
 const storage=translate('hi-IN','LINUX_AUTH_ROOT를 권한 설정이 가능한 저장소로 지정하세요. 폴더는 0700, 파일은 0600이어야 합니다.');assert(storage.includes('LINUX_AUTH_ROOT')&&storage.includes('0700')&&storage.includes('0600'));
 assert.equal(translate('hi-IN','최근 {total}건 중 {visible}건 표시. 최대 최근 100건을 조회합니다.',{total:120,visible:100}),'नवीनतम 120 रिकॉर्ड में से 100 दिखाए गए। अधिकतम नवीनतम 100 रिकॉर्ड प्राप्त किए जाते हैं।');
 assert(translate('hi-IN','작업 폴더에 저장한 초안을 검토하세요. 운영 접속 규칙은 자동 적용되지 않습니다.').includes('अपने आप लागू नहीं होते'));
});

test('Hindi interrupted recovery and nginx connection limits distinguish reload from restart',()=>{
 const hba=translate('hi-IN','현재 파일을 백업한 뒤 접속 규칙을 교체하고 이 클러스터에 reload를 요청합니다.');assert(hba.includes('बैकअप')&&hba.includes('reload का अनुरोध'));
 const systemd=translate('hi-IN','원본 서비스 설정을 복원하고 systemd 설정을 다시 읽습니다. 실행 중인 앱은 재시작하지 않습니다.');assert(systemd.includes('systemd')&&systemd.includes('ऐप पुनः शुरू नहीं होते'));
 const idle=translate('hi-IN','워커마다 캐시에 보관할 유휴 업스트림 연결 수입니다. 업스트림 전체 연결 수를 제한하는 값은 아닙니다.');assert(idle.includes('निष्क्रिय अपस्ट्रीम')&&idle.includes('सभी अपस्ट्रीम कनेक्शन की सीमा नहीं'));
 assert(translate('hi-IN','요청 본문을 연속해서 읽는 사이의 제한 시간입니다. 전체 업로드 시간 제한이 아닙니다.').includes('पूरे अपलोड की समय सीमा नहीं'));
 assert(translate('hi-IN','파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다. 기록을 검토하세요.').includes('जर्नल की सफ़ाई की पुष्टि नहीं'));
});

test('Hindi TLS, trusted proxy and cache help preserves distinct security semantics',()=>{
 assert(translate('hi-IN','클라이언트 인증서 또는 OCSP 응답 검증에 사용할 신뢰 CA 인증서 파일입니다. 클라이언트에게 전송하지 않습니다.').includes('क्लाइंट को नहीं भेजी'));
 assert(translate('hi-IN','HTTP Basic 인증에 사용할 사용자 이름과 암호 해시가 담긴 파일 경로입니다. auth_basic으로 인증을 활성화하며 파일 값은 이 화면에서 읽지 않습니다.').includes('फ़ाइल की सामग्री नहीं पढ़ती'));
 const trust=translate('hi-IN','X-Forwarded-For의 주소를 신뢰할 프록시 IP 또는 CIDR입니다. 요청이 신뢰 주소에서 왔을 때만 전달된 주소를 사용합니다.');assert(trust.includes('विश्वसनीय पते से आने पर ही'));
 assert(translate('hi-IN','외부 요청에는 404를 반환하고 내부 리다이렉트·하위 요청 등 내부 요청만 허용하는 location입니다. 인수 없이 작성합니다.').includes('बाहरी अनुरोध को 404'));
 const cache=translate('hi-IN','조건 값 중 하나라도 비어 있지 않고 0이 아니면 캐시에서 응답을 읽지 않습니다. 캐시 저장을 막는 proxy_no_cache와 구분됩니다.');assert(cache.includes('कैश से उत्तर नहीं पढ़ता')&&cache.includes('proxy_no_cache से अलग'));
});

test('Hindi certificate methods and preparation cleanup keep scope and side effects explicit',()=>{
 assert(translate('hi-IN','webroot는 공개 웹 루트에서 HTTP 검증 파일을 제공합니다. nginx 설정은 자동 변경하지 않습니다.').includes('अपने आप नहीं बदलता'));
 assert(translate('hi-IN','standalone은 HTTP 80 포트를 직접 사용합니다. nginx 설정은 자동 변경하지 않습니다.').includes('HTTP पोर्ट 80 सीधे'));
 const preparing=translate('hi-IN','파일 교체 전 중단된 PostgreSQL 준비 작업입니다. 설정을 변경하거나 서비스를 재시작하지 않고 준비 작업을 취소합니다.');assert(preparing.includes('फ़ाइल बदलने से पहले')&&preparing.includes('के बिना तैयारी रद्द'));
 assert(translate('hi-IN','원본 설정과 서비스 상태를 다시 확인한 뒤 기록된 임시 파일과 준비 기록만 정리합니다.').includes('केवल दर्ज अस्थायी फ़ाइलें'));
 const split=translate('hi-IN','이 백분율의 해시 구간에 배정할 결과 값입니다. 항목의 파일 순서대로 구간을 나누며 요청마다 무작위로 선택하는 방식이 아닙니다.');assert(split.includes('फ़ाइल क्रम')&&split.includes('यादृच्छिक चयन नहीं'));
});

test('Hindi AI diagnostics and hook controls disclose their actual limits',()=>{
 const connection=translate('hi-IN','연결 상태 확인은 서버의 API 키·허용 설정만 확인합니다. 실제 AI 응답이나 남은 사용량을 확인하는 기능은 아닙니다.');assert(connection.includes('केवल सर्वर')&&connection.includes('वास्तविक AI उत्तर या शेष उपयोग नहीं'));
 const limit=translate('hi-IN','HTTP 429는 API 사용량·크레딧 부족 또는 일시적인 요청 제한을 뜻할 수 있습니다. 원인이 확인되지 않으면 결제 부족으로 단정하지 않습니다.');assert(limit.includes('HTTP 429')&&limit.includes('कारण की पुष्टि के बिना'));
 const hooks=translate('hi-IN','끄면 renewal-hooks 디렉터리의 전역 hook을 생략합니다. 개별 인증서에 저장된 pre/post hook은 계속 실행될 수 있습니다.');assert(hooks.includes('वैश्विक hook नहीं चलते')&&hooks.includes('pre/post hook फिर भी'));
 assert(translate('hi-IN','연결 경로가 외부에서 변경되어 자동 복구할 수 없습니다.').includes('स्वतः पुनर्प्राप्ति संभव नहीं'));
});

test('Hindi nginx advanced I/O help keeps platform and request retry boundaries',()=>{
 assert(translate('hi-IN','업스트림 소켓의 운영체제 TCP keepalive를 켭니다. HTTP 연결 재사용과 별개입니다.').includes('HTTP कनेक्शन के पुनः उपयोग से अलग'));
 assert(translate('hi-IN',"다른 업스트림을 시도할 조건입니다. 클라이언트 전송이 시작된 뒤에는 전환할 수 없습니다.").includes('भेजना शुरू होने के बाद बदलना संभव नहीं'));
 const retry=translate('hi-IN','업스트림 오류·시간 초과·갱신 중 등 지정한 조건에서 오래된 캐시 응답을 허용합니다. 조건 목록으로 지정하며 off는 오래된 캐시 사용을 끕니다.');assert(retry.includes('पुराना कैश उत्तर')&&retry.includes('off'));
 assert(translate('hi-IN','응답을 로컬 파일로 저장합니다. on은 root·alias 경로를 사용하며 캐시와는 다른 기능입니다.').includes('कैश से अलग'));
});

test('Hindi data restore and remote access copy keeps confidentiality and sign-in requirements',()=>{
 assert(translate('hi-IN','백업에 포함된 객체를 교체합니다. 다른 클라이언트의 쓰기를 중지한 후 복원하세요.').includes('अन्य क्लाइंट का लिखना रोकें'));
 const failed=translate('hi-IN','PostgreSQL 데이터 작업이 실패했습니다. 원본 오류에는 데이터가 포함될 수 있어 화면에 출력하지 않습니다.');assert(failed.includes('मूल त्रुटि में डेटा')&&failed.includes('स्क्रीन पर नहीं दिखाया'));
 const external=translate('hi-IN','0.0.0.0은 서버의 모든 IPv4 주소에서 접속을 받습니다. 끄면 127.0.0.1에서만 접속할 수 있습니다. 로그인은 계속 필요합니다.');assert(external.includes('0.0.0.0')&&external.includes('127.0.0.1')&&external.includes('लॉगिन फिर भी आवश्यक'));
 const replay=translate('hi-IN','TLS 1.3의 0-RTT 요청을 허용합니다. nginx 1.15.3 이상이며 OpenSSL 지원과 애플리케이션의 재전송 공격 처리가 필요합니다.');assert(replay.includes('0-RTT')&&replay.includes('replay attack से सुरक्षा'));
 assert.equal(translate('hi-IN','{count}초',{count:3}),'3 सेकंड');
});

test('Hindi AI key and unknown administrative outcome copy preserves secret and permission boundaries',()=>{
 assert(translate('hi-IN','서버에 키가 등록되어 있습니다. 키 값은 다시 표시하지 않습니다.').includes('मान फिर नहीं दिखाया'));
 assert(translate('hi-IN','조회 전용 모드에서는 AI 설정을 저장할 수 없습니다.').includes('नहीं सहेज सकते'));
 const interrupted=translate('hi-IN','관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다. 상태와 중단 기록을 조회한 뒤 복구 여부를 확인하세요.');assert(interrupted.includes('परिणाम अज्ञात')&&interrupted.includes('रिकॉर्ड जाँचें'));
 const permission=translate('hi-IN','전용 helper 파일 확인 완료. sudo 허용 여부는 실제 작업 실행 시 OS에서 확인합니다.');assert(permission.includes('वास्तविक कार्य चलने पर OS'));
 assert.equal(translate('hi-IN','{group}: 처음 {count}개 파일만 표시합니다.',{group:'conf.d',count:8}),'conf.d: केवल पहली 8 फ़ाइलें दिखती हैं।');
});

test('Hindi connection-rule errors preserve ordering, reload guidance and detail placeholders',()=>{
 const order=translate('hi-IN','접속 규칙이 올바르지 않습니다. 연결 유형, 데이터베이스, 사용자, 주소와 인증 방식의 순서를 확인하세요.');assert(order.includes('कनेक्शन प्रकार, डेटाबेस, उपयोगकर्ता, पता और प्रमाणीकरण विधि का क्रम'));
 assert(translate('hi-IN','검사 중 설정 파일이 변경되었습니다. 파일을 다시 불러온 뒤 검수하세요.').includes('पहले फ़ाइल पुनः लोड'));
 assert.equal(translate('hi-IN','crontab 조회 실패: {detail}',{detail:'ENOENT'}),'crontab पढ़ा नहीं जा सका: ENOENT');
 assert(translate('hi-IN','로그 검색은 200자 이하로 입력하세요.').includes('200 अक्षर'));
});

test('Hindi file and cron validation preserves size limits, schedule order and actual permissions',()=>{
 assert(translate('hi-IN','256KB 이하 텍스트 파일만 편집할 수 있습니다.').includes('256KB तक'));
 assert(translate('hi-IN','cron 시간식은 분·시·일·월·요일 5개 필드입니다.').includes('मिनट, घंटा, दिन, महीना और सप्ताह का दिन'));
 assert(translate('hi-IN','이 작업에는 승인된 관리자 모드(LINUX_ENABLE_ADMIN=true)과 전용 sudo helper 권한이 필요합니다.').includes('LINUX_ENABLE_ADMIN=true'));
 assert(translate('hi-IN','일반 사용자 권한 및 LINUX_ENABLE_CRON=true 설정이 필요합니다.').includes('LINUX_ENABLE_CRON=true'));
 assert.equal(translate('hi-IN','현재 사용자 crontab을 읽을 수 없습니다: {detail}',{detail:'EACCES'}),'वर्तमान उपयोगकर्ता का crontab पढ़ा नहीं जा सकता: EACCES');
});

test('Hindi certificate and recovery errors retain unknown outcomes, locking and re-review conditions',()=>{
 const interrupted=translate('hi-IN','서버에서 이 작업의 종료 결과를 확인하지 못했습니다. Certbot 프로세스와 인증서·nginx 상태를 확인하세요. 기존 작업 잠금은 유지되며 자동 재실행하지 않습니다.');assert(interrupted.includes('सुनिश्चित नहीं कर सका')&&interrupted.includes('लॉक बना रहता')&&interrupted.includes('अपने आप दोबारा नहीं'));
 assert(translate('hi-IN','프록시 제한 시간은 1~3600초 범위입니다.').includes('1 से 3600 सेकंड'));
 assert(translate('hi-IN','추가 nginx HTTPS 연계는 webroot 인증 방식에서 선택하세요.').includes('webroot प्रमाणीकरण'));
 assert(translate('hi-IN','Redis 복구 검토 이후 설정·백업 또는 서비스가 변경되었습니다. 다시 검토하세요.').includes('फिर से समीक्षा'));
 assert(translate('hi-IN','PostgreSQL 원본 복구는 확인됐지만 완료 기록 보관을 확인하세요.').includes('पूर्णता रिकॉर्ड सुरक्षित'));
});

test('Hindi database candidate validation keeps effective values and integer placeholders distinct',()=>{
 const effective=translate('hi-IN','MariaDB 후보 설정의 실제 값이 요청한 값과 다릅니다. include 파일과 중복 설정을 확인하세요.');assert(effective.includes('प्रभावी मान')&&effective.includes('अनुरोधित मानों से अलग')&&effective.includes('include फ़ाइलें'));
 assert.equal(translate('hi-IN','{label}: {min}~{max} 범위의 정수를 입력하세요.',{label:'port',min:1,max:65535}),'port: 1 से 65535 के बीच पूर्णांक दर्ज करें।');
 assert(translate('hi-IN','설정 파일은 256 KiB 이하만 편집할 수 있습니다.').includes('256 KiB'));
 assert(translate('hi-IN','사용자명은 영문·숫자·점·밑줄·하이픈 1~64자로 설정하세요.').includes('1 से 64 लैटिन'));
 assert(translate('hi-IN','이 설정은 인수 없이 작성합니다.').includes('बिना किसी आर्ग्युमेंट'));
});

test('Hindi environment and isolated validation copy keeps non-root execution, restart and cleanup limits',()=>{
 assert(translate('hi-IN','앱 서비스는 일반 사용자 계정으로 실행해야 합니다.').includes('गैर-root उपयोगकर्ता'));
 assert(translate('hi-IN','Redis 설정 적용 시 서비스가 재시작됩니다. 변경 내용을 확인하세요.').includes('सेवा पुनः शुरू'));
 const cleanup=translate('hi-IN','Redis 검수 환경 정리에 실패했습니다. 남은 검수 프로세스와 임시 파일을 확인하세요.');assert(cleanup.includes('सफ़ाई विफल')&&cleanup.includes('बची हुई सत्यापन प्रक्रियाएँ'));
 assert(translate('hi-IN','PostgreSQL 검수 실행 파일의 설치와 root 소유권을 확인하세요.').includes('स्वामी root'));
 assert(translate('hi-IN','폼에서 지원하지 않는 설정 변경이 있습니다. 초안 다운로드로 검토하세요.').includes('प्रारूप डाउनलोड'));
});

test('Hindi final UI diagnostics retain API transport boundaries and uncertain certificate state',()=>{
 const api=translate('hi-IN','API 주소는 HTTPS를 사용하세요. 로컬 서버는 HTTP를 사용할 수 있습니다. 주소에 키를 넣지 마세요.');assert(api.includes('HTTPS')&&api.includes('स्थानीय सर्वर HTTP')&&api.includes('कुंजी न डालें'));
 assert(translate('hi-IN','PostgreSQL 15 이상에서 접속 규칙 검수를 지원합니다.').includes('PostgreSQL 15 और बाद'));
 assert(translate('hi-IN','인증서 공개 정보를 읽을 권한이 없습니다. 권한이 부족한 경우 상태를 추정하지 않습니다.').includes('अनुमान नहीं लगाया'));
 assert(translate('hi-IN','잠시 후 다시 시도하세요. 로그인 상태와 저장된 설정은 유지됩니다.').includes('लॉगिन सत्र और सहेजी गई सेटिंग सुरक्षित'));
});

test('Hindi runtime labels and terminal gate retain enablement and restart instructions',()=>{
 assert.equal(translate('hi-IN','자동 시작 (이번 부팅)'),'स्वचालित प्रारंभ (इस बूट में)');
 assert.equal(translate('hi-IN','관리자 권한'),'प्रशासक अनुमतियाँ');
 const gate=translate('hi-IN', '이 서버에서는 터미널 사용이 꺼져 있습니다. 서버 관리자에게 사용 허용을 요청하세요. 설치 서버는 /etc/tastedev-linux/environment에서 LINUX_ENABLE_TERMINAL=true로 설정한 뒤 tastedev-linux 서비스를 재시작해야 합니다. 기존 터미널 연결이 끊길 수 있으므로 작업을 저장한 뒤 진행하세요.');assert(gate.includes('/etc/tastedev-linux/environment')&&gate.includes('LINUX_ENABLE_TERMINAL=true')&&gate.includes('सेवा पुनः शुरू')&&gate.includes('काम सहेजें'));
});
