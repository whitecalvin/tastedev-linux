import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import ca from '../lib/locales/ca.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,languageCoverageSummary} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Catalan administrative diagnostics keep unknown outcomes distinct from authorization checks',()=>{
  const interrupted=translate('ca-ES','관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다. 상태와 중단 기록을 조회한 뒤 복구 여부를 확인하세요.');
  assert(interrupted.includes("s'ha interromput")&&interrupted.includes('no se\'n pot confirmar el resultat')&&interrupted.includes('registres d\'interrupció'));
  const helper=translate('ca-ES','전용 helper 파일 확인 완료. sudo 허용 여부는 실제 작업 실행 시 OS에서 확인합니다.');
  assert(helper.includes('fitxer')&&helper.includes('sistema operatiu')&&helper.includes("l'autorització de sudo")&&helper.includes('operació real'));
  const detail=translate('ca-ES','관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. {detail}',{detail:'TEST_DIAGNOSTIC'});
  assert(detail.includes('NOPASSWD')&&detail.endsWith('TEST_DIAGNOSTIC')&&!detail.includes('{detail}'));
});

test('Catalan TLS, external access and restore failure guidance retains operational safeguards',()=>{
  const early=translate('ca-ES','TLS 1.3의 0-RTT 요청을 허용합니다. nginx 1.15.3 이상이며 OpenSSL 지원과 애플리케이션의 재전송 공격 처리가 필요합니다.');
  for(const part of ['TLS 1.3','0-RTT','1.15.3','OpenSSL','atacs de reproducció'])assert(early.includes(part),part);
  const external=translate('ca-ES','0.0.0.0은 서버의 모든 IPv4 주소에서 접속을 받습니다. 끄면 127.0.0.1에서만 접속할 수 있습니다. 로그인은 계속 필요합니다.');
  for(const part of ['0.0.0.0','totes les adreces IPv4','127.0.0.1',"L'autenticació continua sent necessària"])assert(external.includes(part),part);
  const failure=translate('ca-ES','데이터 복원에 실패했습니다. 복원 전 데이터 백업을 보존했습니다. 연결이 끊긴 경우 실제 데이터 상태를 다시 확인하세요.');
  assert(failure.includes('ha fallat')&&failure.includes("S'ha conservat")&&failure.includes("l'estat real de les dades"));
  const reconnect=translate('ca-ES','앱 재시작을 예약했습니다. 서버 내부 접속만 허용하도록 변경되어 현재 연결은 끊깁니다. 서버에서 {url}로 접속하세요.',{url:'http://127.0.0.1:8791'});
  assert(reconnect.includes('http://127.0.0.1:8791')&&reconnect.includes('des del servidor')&&!reconnect.includes('{url}'));
});

test('Catalan nginx proxy guidance distinguishes connection reuse and cache read/write controls',()=>{
  const tcp=translate('ca-ES','업스트림 소켓의 운영체제 TCP keepalive를 켭니다. HTTP 연결 재사용과 별개입니다.');
  assert(tcp.includes('TCP keepalive')&&tcp.includes('independent')&&tcp.includes('HTTP'));
  const noCache=translate('ca-ES','조건 값이 비어 있지 않고 0이 아니면 응답을 캐시에 저장하지 않습니다. 캐시에서 읽지 않는 조건은 proxy_cache_bypass로 지정합니다.');
  assert(noCache.includes('No desa')&&noCache.includes('no és buida ni 0')&&noCache.includes('proxy_cache_bypass')&&noCache.includes('impedeixen llegir'));
  const symbolic=translate('ca-ES','파일 경로의 심볼릭 링크 허용 방식입니다. on은 거부하고 if_not_owner는 소유자가 다른 링크를 거부합니다. 선택적으로 from=경로를 지정합니다.');
  assert(symbolic.includes('on els rebutja')&&symbolic.includes('if_not_owner')&&symbolic.includes('propietaris diferents')&&symbolic.includes('from='));
  const idle=translate('ca-ES','워커마다 캐시에 유지할 유휴 업스트림 연결 수입니다. 전체 활성 연결 수를 제한하지 않습니다. nginx 1.28에서는 부하 분산 방식을 이 항목보다 앞에 두고, HTTP 프록시에 proxy_http_version 1.1과 proxy_set_header Connection ""를 지정해야 연결을 재사용할 수 있습니다.');
  for(const token of ['inactives','No limita','1.28','proxy_http_version 1.1','proxy_set_header Connection ""'])assert(idle.includes(token),token);
});

test('Catalan country preference loads identical server and lazy client messages',async()=>{
  assert.equal(resolveLocale('ca_ES.UTF-8'),'ca-ES');
  assert.equal(initialLanguage('ca-ES','ko-KR').locale,'ca-ES');
  assert.equal(languageDirection('ca-ES'),'ltr');
  assert.deepEqual(await loadLanguageCatalog('ca-ES'),languageCatalog('ca-ES'));
  assert.equal(translate('ca-ES','관리자 로그인'),"Accés d'administrador");
  assert.equal(translate('ca-ES','대시보드'),'Tauler de control');
  assert.equal(translate('ca-ES','부분 번역'),'Traducció parcial');
});

test('Catalan catalog covers every canonical message and reports complete coverage',()=>{
  const english:Readonly<Record<string,string>>=en;
  const catalog:Readonly<Record<string,string>>=ca;
  const coverage=languageCoverage('ca-ES');
  const translated=Object.keys(english).filter(key=>Object.hasOwn(catalog,key));
  assert.deepEqual(Object.keys(catalog).sort(),Object.keys(english).sort());
  assert.equal(coverage.complete,true);
  assert.equal(coverage.translatedEntries,translated.length);
  assert.equal(coverage.totalEntries,Object.keys(english).length);
  assert.equal(coverage.complete,translated.length===Object.keys(english).length);
  assert.deepEqual(languageCoverageSummary().ca,coverage);
  for(const [key,value] of Object.entries(catalog)){
    assert(Object.hasOwn(english,key),key);
    assert(value.trim());assert(!/[가-힣]/.test(value),key);
    assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(english[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),key);
    assert.equal(value.split('\n').length,english[key].split('\n').length,key);
  }
  assert.equal(translate('ca-ES','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
  const name='draft $& {name} <test>.conf';
  assert.equal(translate('ca-ES','저장하지 않은 변경을 버리고 {name} 탭을 닫을까요?',{name}),`Voleu descartar els canvis sense desar i tancar la pestanya ${name}?`);
});

test('Catalan operational guidance preserves executable commands and configuration identifiers',()=>{
  const cases:ReadonlyArray<readonly [string,readonly string[]]>=[
    ['work_mem은 작업마다 할당됩니다. 연결 수와 함께 메모리 사용량을 검토하세요. pg_hba.conf 인증 규칙은 변경하지 않습니다.',['work_mem','pg_hba.conf']],
    ['AOF를 끄면 AOF 지속성 설정만 변경됩니다. 기존 RDB 스냅샷 정책은 이 조각에 포함하지 않습니다. 메모리 제거 정책에 따라 키가 제거될 수 있습니다.',['AOF','RDB']],
    ['PORT·HOST·LOG_LEVEL은 앱에서 읽어야 적용됩니다. 환경 파일 로딩과 프로세스 재시작은 별도로 진행하세요.',['PORT','HOST','LOG_LEVEL']],
    ['전용 helper를 sudo -n으로 실행합니다. OS의 NOPASSWD 권한이 별도로 필요합니다.',['sudo -n','NOPASSWD']],
    ['관리자 helper 실행에는 시스템 Node.js(/usr/bin/node)가 필요합니다. 서버 관리자가 먼저 설치해야 합니다.',['Node.js','/usr/bin/node']],
    ['MariaDB [mariadbd] 설정 조각',['MariaDB','[mariadbd]']],
    ['기존 인증서 갱신 테스트 (dry-run)',['dry-run']],
    ['수신 포트 / listen',['listen']],
    ['도메인 / server_name',['server_name']],
    ['업스트림의 Location과 Refresh 헤더를 변경합니다.',['Location','Refresh']],
    ['압축 응답에 Vary: Accept-Encoding 헤더를 추가합니다.',['Vary: Accept-Encoding']],
    ['프록시 오류 응답을 error_page 설정으로 처리합니다.',['error_page']],
    ['파일 전송에 sendfile 시스템 호출을 사용합니다.',['sendfile']],
    ['요청 본문을 파일에 보관하는 방식입니다. clean은 처리 후 임시 파일을 제거합니다.',['clean']],
    ['HTTP/1.1 응답의 청크 전송을 허용합니다.',['HTTP/1.1']],
    ['URI가 슬래시로 끝날 때 $fastcgi_script_name에 덧붙일 파일 이름입니다.',['$fastcgi_script_name']],
    ['두 캡처를 가진 정규식으로 URI를 스크립트 이름과 PATH_INFO로 나눕니다.',['PATH_INFO']],
    ['HTTPS 업스트림 인증서 검증과 SNI에 사용할 이름입니다. SNI를 보내려면 proxy_ssl_server_name도 켜야 합니다.',['SNI','proxy_ssl_server_name']],
    ['LINUX_AUTH_ROOT를 권한 설정이 가능한 저장소로 지정하세요. 폴더는 0700, 파일은 0600이어야 합니다.',['LINUX_AUTH_ROOT','0700','0600']],
    ['서버에서 LINUX_ENABLE_TERMINAL=true 설정이 필요합니다.',['LINUX_ENABLE_TERMINAL=true']],
  ];
  for(const [key,tokens] of cases){
    assert(Object.hasOwn(ca,key),key);
    const value=translate('ca-ES',key);
    for(const token of tokens)assert(value.includes(token),`${key}: ${token}`);
  }
  assert.equal(translate('ca-ES','/etc/nginx/conf.d/linux-도메인.conf'),'/etc/nginx/conf.d/linux-DOMAIN.conf');
});

test('Catalan terminal limits distinguish characters from bytes and preserve dynamic counts',()=>{
  const command=translate('ca-ES','명령은 4096자 이하로 입력하세요.');
  const input=translate('ca-ES','터미널 입력은 4096바이트 이하로 입력하세요.');
  assert(command.includes('4096 caràcters'));
  assert(input.includes('4096 bytes'));
  assert.equal(translate('ca-ES','최근 {total}건 중 {visible}건 표시. 최대 최근 100건을 조회합니다.',{total:25,visible:3}),'Es mostren 3 dels 25 registres recents. Es consulten com a màxim els darrers 100 registres.');
});

test('Catalan CA certificate help distinguishes private trust files from client-advertised lists',()=>{
  const trusted=translate('ca-ES','클라이언트 인증서 또는 OCSP 응답 검증에 사용할 신뢰 CA 인증서 파일입니다. 클라이언트에게 전송하지 않습니다.');
  const advertised=translate('ca-ES','클라이언트 인증서 검증에 사용할 PEM CA 인증서 파일입니다. CA 목록은 클라이언트에게 전송되며 검증 방식은 ssl_verify_client에서 정합니다.');
  assert(trusted.includes("No s'envia als clients"));
  assert(advertised.includes("La llista de CA s'envia als clients")&&advertised.includes('ssl_verify_client'));
});

test('Catalan cache and real-IP guidance preserves security conditions and deterministic mapping',()=>{
  const cache=translate('ca-ES','조건 값 중 하나라도 비어 있지 않고 0이 아니면 캐시에서 응답을 읽지 않습니다. 캐시 저장을 막는 proxy_no_cache와 구분됩니다.');
  assert(cache.includes('No llegeix')&&cache.includes('proxy_no_cache')&&cache.includes('impedeix desar'));
  const realip=translate('ca-ES','끄면 전달된 마지막 주소를 사용하고, 켜면 마지막 신뢰하지 않는 주소를 사용합니다. 원래 연결 주소가 신뢰 목록에 있을 때 적용하며 realip 모듈이 필요합니다.');
  assert(realip.includes("l'última adreça no fiable")&&realip.includes("quan l'adreça original és fiable")&&realip.includes('realip'));
  const partitions=translate('ca-ES','이 백분율의 해시 구간에 배정할 결과 값입니다. 항목의 파일 순서대로 구간을 나누며 요청마다 무작위로 선택하는 방식이 아닙니다.');
  assert(partitions.includes("ordre del fitxer")&&partitions.includes('no se seleccionen aleatòriament'));
});

test('Catalan proxy timeouts retain the interval between successive reads and writes',()=>{
  const read=translate('ca-ES','업스트림 응답을 연속해서 읽는 사이의 제한 시간입니다.');
  const write=translate('ca-ES','업스트림 요청을 연속해서 보내는 사이의 제한 시간입니다.');
  assert(read.includes('entre lectures consecutives'));
  assert(write.includes('entre enviaments consecutius'));
  assert.notEqual(read,write);
});

test('Catalan Redis policies distinguish access age from access frequency and retain TTL scope',()=>{
  const age=translate('ca-ES','전체 키에서 최근 사용이 적은 키를 근사 LRU 방식으로 제거합니다.');
  const frequency=translate('ca-ES','전체 키에서 사용 빈도가 낮은 키를 근사 LFU 방식으로 제거합니다.');
  assert(age.includes('LRU')&&age.includes('fa més temps'));
  assert(frequency.includes('LFU')&&frequency.includes("freqüència d'ús"));
  for(const key of [
    'TTL이 있는 키에서 최근 사용이 적은 키를 근사 LRU 방식으로 제거합니다.',
    'TTL이 있는 키에서 사용 빈도가 낮은 키를 근사 LFU 방식으로 제거합니다.',
    'TTL이 있는 키에서 무작위로 키를 제거합니다.',
    'TTL이 있는 키에서 만료까지 남은 시간이 짧은 키를 우선 제거합니다.',
  ])assert(translate('ca-ES',key).includes('TTL'),key);
  const refusal=translate('ca-ES','메모리 한도에 도달하면 키를 제거하지 않고 추가 메모리가 필요한 쓰기를 거부합니다.');
  assert(refusal.includes('es conserven les claus')&&refusal.includes('es rebutgen les escriptures'));
});
