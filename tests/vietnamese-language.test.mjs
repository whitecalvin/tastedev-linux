import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import vi from '../lib/locales/vi.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,languageCoverageSummary,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageCookie,languageDirection} from '../lib/language-preference.ts';

test('Vietnamese Linux locale shares its native catalog between SSR and lazy client loading',async()=>{
 assert.equal(resolveLocale('vi_VN.UTF-8'),'vi-VN');
 assert.equal(localeFlag('vi-VN'),'🇻🇳');
 assert.deepEqual(initialLanguage('vi-VN','en-US'),{locale:'vi-VN',persisted:true});
 assert.equal(initialLanguage(null,'en;q=0.2,vi-VN;q=0.9').locale,'vi-VN');
 assert.equal(languageDirection('vi-VN'),'ltr');
 assert(languageCookie('vi_VN').startsWith('linux-language=vi-VN;'));
 const client=await loadLanguageCatalog('vi-VN');
 assert.deepEqual(client,languageCatalog('vi-VN'));
 for(const locale of ['vi','vi-VN']){
  assert.equal(translate(locale,'관리자 로그인'),'Đăng nhập quản trị');
  assert.equal(translate(locale,'설정'),'Cài đặt');
  assert.equal(translate(locale,'모델 목록 갱신 완료 · {count}개',{count:17}),'Đã làm mới danh sách · 17 mô hình');
  assert.equal(translate(locale,' 로그인 '),' Đăng nhập ');
  assert.equal(translate(locale,'nginx -t'),'nginx -t');
 }
});

test('Vietnamese covers every current canonical message and preserves unknown content',()=>{
 const coverage=languageCoverage('vi-VN');
 assert.equal(coverage.translatedEntries,Object.keys(vi).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(languageCoverageSummary().vi,coverage);
 assert.deepEqual(Object.keys(vi).sort(),Object.keys(en).sort());
 assert.equal(translate('vi-VN','unknown runtime diagnostic'),'unknown runtime diagnostic');
 assert.equal(translate('vi-VN','/etc/nginx/conf.d/example.conf'),'/etc/nginx/conf.d/example.conf');
 for(const [key,value] of Object.entries(vi)){
  assert(Object.hasOwn(en,key),key);assert(value.trim());assert(!/[가-힣]/.test(value),key);
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),key);
 }
});

test('Vietnamese package help retains operational identifiers and warnings in server and client catalogs',async()=>{
 const client=await loadLanguageCatalog('vi-VN');
 const cases=[
  ['work_mem은 작업마다 할당됩니다. 연결 수와 함께 메모리 사용량을 검토하세요. pg_hba.conf 인증 규칙은 변경하지 않습니다.',['work_mem','pg_hba.conf','từng thao tác','không được thay đổi']],
  ['AOF를 끄면 AOF 지속성 설정만 변경됩니다. 기존 RDB 스냅샷 정책은 이 조각에 포함하지 않습니다. 메모리 제거 정책에 따라 키가 제거될 수 있습니다.',['AOF','RDB','không bao gồm','có thể bị loại bỏ']],
  ['PORT·HOST·LOG_LEVEL은 앱에서 읽어야 적용됩니다. 환경 파일 로딩과 프로세스 재시작은 별도로 진행하세요.',['PORT','HOST','LOG_LEVEL','khởi động lại']],
  ['도메인의 DNS가 이 서버를 가리키고 HTTP 80 포트로 접근 가능해야 합니다. nginx 인증 플러그인이 검증 후 HTTPS 설정을 변경합니다. 테스트 인증서는 브라우저가 신뢰하지 않습니다.',['DNS','HTTP 80','nginx','HTTPS','không tin cậy']],
  ['서버에 등록된 기존 인증서 전체의 갱신 절차를 테스트합니다. 기존 갱신 설정의 인증 플러그인과 pre/post hook이 실행될 수 있으며 nginx가 일시적으로 변경될 수 있습니다. 발급한 테스트 인증서는 저장하지 않습니다.',['tất cả','pre/post','nginx','tạm thời','không được lưu']],
  ['현재 사용자 crontab의 LINUX 작업만 추가·수정합니다. 기존 작업과 환경 변수를 보존합니다. 시간대는 서버 cron 설정을 따릅니다. 같은 작업 이름으로 저장하면 변경하거나 비활성화할 수 있습니다.',['LINUX','crontab','người dùng hiện tại','Giữ nguyên','Múi giờ','vô hiệu hóa']],
  ['관리자 helper 실행에는 시스템 Node.js(/usr/bin/node)가 필요합니다. 서버 관리자가 먼저 설치해야 합니다.',['Node.js','/usr/bin/node','phải cài đặt trước']],
  ['명령은 서버에서 실행됩니다. 대화형 SSH·sudo 입력은 지원하지 않습니다. 실행 제한은 120초입니다.',['máy chủ','Không hỗ trợ','SSH','sudo','120 giây']],
  ['지정 파일의 지원 항목만 읽습니다. include 파일과 실행 중인 서버의 최종 설정은 별도로 확인하세요.',['Chỉ đọc','include','kiểm tra riêng']],
  ['지정 파일의 변경 계획입니다. include 우선순위와 실행 중 설정은 별도로 확인해야 합니다. 아직 파일을 저장하거나 서비스를 변경하지 않았습니다.',['include','thứ tự ưu tiên','Chưa lưu tệp','thay đổi dịch vụ']],
  ['선택한 관리 작업만 삭제합니다. 변경 전 crontab은 백업됩니다.',['Chỉ xóa','crontab','sao lưu trước']],
  ['설정 백업의 메타데이터만 표시합니다. 데이터베이스 데이터 백업은 포함하지 않습니다.',['siêu dữ liệu','Không bao gồm','dữ liệu cơ sở dữ liệu']],
  ['전체 설정 파일을 백업으로 교체하고 이 클러스터를 재시작합니다. 연결 중인 작업이 중단될 수 있습니다.',['toàn bộ tệp cấu hình','khởi động lại cụm','có thể bị gián đoạn']],
  ['TTL이 있는 키가 없으면 메모리가 필요한 쓰기가 거부될 수 있습니다.',['không có khóa nào có TTL','có thể bị từ chối']],
  ['등록 목록에서만 제거합니다. 앱 파일과 서비스는 유지됩니다.',['Chỉ xóa khỏi danh sách','Giữ nguyên','tệp ứng dụng','dịch vụ']],
  ['PASSWD 규칙은 비밀번호 입력을 요구합니다. sudo -n으로 실행하는 웹 작업은 인증이 없으면 실패합니다. 기존 OS 규칙에 따라 최종 권한이 달라질 수 있습니다.',['PASSWD','nhập mật khẩu','sudo -n','thất bại nếu chưa được xác thực']],
  ['명령의 이스케이프되지 않은 % 뒤 내용은 cron이 표준 입력으로 전달합니다. 문자 %를 사용하려면 역슬래시로 이스케이프하세요.',['cron','%','đầu vào tiêu chuẩn','gạch chéo ngược']],
  ['실제 예약 기준은 cron 데몬과 crontab 설정을 따릅니다. 서버 프로세스 시간대와 다를 수 있습니다.',['cron','crontab','Múi giờ có thể khác']],
  ['HTTPS 업스트림 인증서 검증과 SNI에 사용할 이름입니다. SNI를 보내려면 proxy_ssl_server_name도 켜야 합니다.',['HTTPS','SNI','proxy_ssl_server_name','phải bật']],
  ['OCSP 응답의 서명을 검증합니다. ssl_trusted_certificate에 발급자·중간·루트 CA 인증서를 지정해야 합니다.',['OCSP','ssl_trusted_certificate','CA trung gian','CA gốc']],
  ['접근을 허용할 IP 주소·CIDR·unix: 또는 all입니다. allow와 deny를 파일 순서대로 검사해 처음 일치한 규칙을 적용합니다.',['CIDR','unix:','allow','deny','thứ tự trong tệp','khớp đầu tiên']],
  ['TCP·UDP 연결을 전달할 백엔드 주소·포트, Unix 소켓 또는 upstream 그룹입니다. HTTP URL을 사용하지 않습니다.',['TCP','UDP','Unix','upstream','Không sử dụng URL HTTP']],
 ];
 for(const [key,identifiers] of cases){
  const value=translate('vi-VN',key);
  assert.equal(value,client[key]);assert.notEqual(value,en[key]);
  for(const identifier of identifiers)assert(value.includes(identifier),identifier);
 }
 assert.equal(translate('vi-VN','서버 적용'),'Áp dụng vào máy chủ');
 assert.equal(translate('vi-VN','수신 포트 / listen'),'Cổng lắng nghe / listen');
});
