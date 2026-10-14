## 2026-10-09 AI API 연동 사용자 완료 승인

사용자가 “AI API 는 완료된거로 처리한다”라고 승인했습니다. AI API 연동 항목은 사용자 수용 완료로 기록하며 추가 API 호출·한도 해소 검사는 진행하지 않습니다. 실제 OpenAI gpt-6-luna 테스트에서 응답 제한 오류가 반환된 사실은 유지합니다. 업체의 정상 분석 응답을 확인했다는 의미가 아닙니다. 현재 작업은 전체 페이지 디자인이며 이 항목 때문에 전체 목표를 차단하지 않습니다.

## 2026-10-06 패키지 IDE 경로 포함 오류 안내 번역

파일 경로와 오류 설명이 합쳐진 메시지를 분리하여 설명만 선택한 언어로 번역합니다. 리터럴 경로와 미확인 오류 코드는 그대로 보존합니다. 최초 SSR 데이터와 수동 갱신 오류 모두 같은 렌더링 처리를 사용합니다. 번역·패키지 IDE 렌더링·SSR·팝업 검사 12개가 성공했습니다. 실제 아랍어 PostgreSQL 화면에서 /etc/postgresql/18/main/pg_hba.conf 경로 유지와 오류 설명 번역을 확인했으며 메모리 메뉴도 아랍어로 표시됩니다.

화면: /tmp/tastedev-postgresql-localized-notice-20261006.jpg. 읽기 권한 자체는 변경하지 않았습니다. 한국어 복원 후 검사용 탭을 닫았습니다. 전체 목표는 진행 중입니다.

## 2026-10-06 PostgreSQL 설명 예시의 설정 항목 오인 수정

PostgreSQL 기본 파일의 주석 name=value 및 단위 설명 d=days 등의 정확한 예시를 파서에서 제외했습니다. 활성 설정·비활성 실제 설정·사용자 정의 항목을 유지하며 다른 내용은 변경하지 않습니다. 파서·렌더링·include 그래프 테스트 12개가 성공했습니다. 실제 개발 화면의 첫 항목이 data_directory, hba_file, ident_file로 시작하며 name/d 예시 입력은 0개인 것을 확인했습니다.

메모리 메뉴 번역을 기존 9개 카탈로그에 추가했고 기준 키는 1437개입니다. 번역 형식 검사 성공. 화면: /tmp/tastedev-postgresql-comment-examples-fixed-20261006.jpg. 전체 목표는 진행 중입니다.

## 2026-10-06 DB·Certbot 기술 값 방향 수정

PostgreSQL·MariaDB·Redis 설정 값과 HBA 필드의 기술 값은 LTR·왼쪽 정렬을 사용하도록 수정했습니다. Certbot 도메인·이메일·웹 루트 입력에 dir=ltr를 지정했습니다. 실제 아랍어 화면에서 Certbot 도메인·이메일 및 PostgreSQL data_directory·hba_file·ident_file 입력 방향 LTR, 설명 방향 RTL을 확인했습니다. 값과 운영 설정은 변경하지 않았으며 한국어 복원 후 검사용 탭을 닫았습니다.

증거: /tmp/tastedev-certbot-arabic-direction-20261006.jpg, /tmp/tastedev-postgresql-arabic-direction-20261006.jpg. 현장 확인 중 PostgreSQL 설명 예시 name=value, d=days가 설정 항목으로 나타나는 파서 문제와 메모리 메뉴의 번역 누락을 발견했으며 후속 수정이 필요합니다.

## 2026-10-06 RTL nginx 기술 값 표시 수정

아랍어 화면에서 파일 경로와 지시어 값이 RTL 문맥을 상속하는 문제를 수정했습니다. nginx 파일 트리와 설정 값·사용자 지정 지시어 입력은 LTR·왼쪽 정렬·격리 표시를 사용하며 아랍어 설명은 RTL을 유지합니다. 실제 화면에서 경로 입력 6개와 트리의 계산 방향 LTR, 설명 RTL을 확인했습니다. 코드 본문은 기존 LTR 처리를 유지합니다. 한국어를 복원하고 검사용 탭을 정리했습니다.

증거: /tmp/tastedev-nginx-arabic-technical-direction-20261006.jpg. CSS 표시 수정이며 시스템 설정과 입력 값은 변경하지 않았습니다. 전체 기능 완료는 아직 미확인입니다.

## 2026-10-06 현재 소스 전체 회귀 검사

최근 카탈로그·커서 변경을 포함한 npm test 결과 988개 성공, 실패·건너뜀 0입니다. 실제 PTY 영문·완성된 한글 에코 검사를 포함하지만 OS 자모 조합 실사용 검증은 남아 있습니다. 운영 설치 환경·AI·데스크톱 및 전체 언어 실사용 검증을 대신하지 않습니다.

증거: [현재 회귀 검사](regression-current-20261006.md). 전체 목표는 진행 중입니다.

## 2026-10-06 아랍어 nginx 화면 확인

8787 개발 서버를 최신 카탈로그로 다시 구동한 뒤 별도 검사용 탭에서 아랍어 지역 옵션과 nginx 검색·탭·기본 설정 설명을 확인했습니다. 한국어와 사용자 코드 보기 화면을 복원했습니다. 화면 증거: /tmp/tastedev-nginx-arabic-settings-20261006.jpg. 확인은 해당 화면에 한정되며 전체 기능 완료는 아직 미확인입니다.

## 2026-10-06 아랍어 기준 UI 카탈로그 보완 완료

마지막 78개를 추가하여 아랍어 1436개 기준 UI 키 전체를 제공합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 미완성 가정을 가진 테스트를 러시아어·아랍어 지역별 전체 키 검사로 갱신했습니다. 기존 9개 카탈로그의 기준 키 누락은 없으나 다른 Linux 언어 UI, 동적 메시지, 실제 화면·원어민 검수 및 전체 목표의 기능 검증은 남아 있습니다.

증거: [아랍어 번역 기록](arabic-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 아랍어 nginx stream·map·캐시 설명 보완

아랍어 80개 항목을 추가하여 1358/1436개 기준 UI 키를 제공합니다. stream·mail, upstream 분산, realip·인증, map·geo 및 응답 캐시 설명을 포함합니다. 78개가 남았습니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수와 전체 목표는 미완료입니다.

## 2026-10-06 아랍어 nginx 워커·블록 설명 보완

아랍어 80개 항목을 추가하여 1278/1436개 기준 UI 키를 제공합니다. nginx 워커·로그·연결·FastCGI·TLS 및 HTTP 블록 설명을 포함합니다. 158개가 남았습니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수와 전체 기능 완료는 미완료입니다.

## 2026-10-06 아랍어 접속 규칙·중단 복구 안내 보완

아랍어 80개 항목을 추가하여 1198/1436개 기준 UI 키를 제공합니다. PostgreSQL HBA 적용·복구와 서비스·Redis·nginx 중단 작업 복구 안내를 포함합니다. 238개가 남았습니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수와 전체 기능 완료는 미완료입니다.

## 2026-10-06 아랍어 nginx 프록시·TLS 설명 보완

아랍어 80개 항목을 추가하여 1118/1436개 기준 UI 키를 제공합니다. nginx 파일 처리, 프록시 타임아웃·헤더, gzip·TLS 및 편집·백업 안내를 포함합니다. 318개가 남았습니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수와 전체 기능 완료는 아직 미완료입니다.

## 2026-10-06 아랍어 예약·권한·nginx 상세 안내 보완

아랍어 80개 항목을 추가하여 1038/1436개 기준 UI 키를 제공합니다. cron 시간·입력 처리, sudo 관리 규칙, nginx 검사 오류 및 요청 헤더 설정 설명을 포함합니다. 398개가 남았습니다. 번역 형식 검사와 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수와 전체 기능 완료는 미완료입니다.

## 2026-10-06 아랍어 DB 복구·Redis 정책 안내 보완

아랍어 80개 항목을 추가하여 958/1436개 기준 UI 키를 제공합니다. PostgreSQL 적용·백업 복원, MariaDB·Redis include 구조, Redis 메모리 정책과 Node 환경 안내를 포함합니다. 478개가 남았습니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수와 전체 기능 완료는 아직 확인되지 않았습니다.

## 2026-10-06 아랍어 설정 트리·초안 편집 안내 보완

아랍어 100개 항목을 추가하여 878/1436개 기준 UI 키를 제공합니다. 설정 트리, 블록 조작, 초안 비교·가져오기·저장 및 기본값 복원을 포함합니다. 558개가 남았습니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면·원어민 검수 및 전체 목표는 미완료입니다.

## 2026-10-06 아랍어 nginx·Certbot·cron 안내 보완

아랍어 100개 항목을 추가했습니다. nginx 사이트 적용, Certbot 발급·갱신, cron 일정, 명령 실행·권한 안내를 포함합니다. 영어 기준 1436개 중 778개를 제공하며 658개가 남았습니다. 번역 형식 검사와 언어 관련 테스트 16개가 성공했습니다. 실제 아랍어 화면·원어민 검수와 전체 기능 완성은 미완료입니다.

## 2026-10-06 아랍어 운영·편집 UI 보완

아랍어 파일 편집, 로그인, 운영 권한, nginx 사이트 설정 등 80개 항목을 추가했습니다. 영어 기준 1436개 중 678개를 제공하며 758개가 남았습니다. 번역 형식 검사와 언어 관련 기존 테스트 16개가 성공했습니다. 실제 아랍어 화면과 원어민 검수는 미완료입니다. 전체 목표는 진행 중입니다.

## 2026-10-06 러시아어 기준 UI 카탈로그 보완 완료

러시아어의 남은 238개를 번역하여 영어 기준 1436개 UI 키 전체를 제공합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 기존 지원 카탈로그 중 아랍어의 누락 838개가 남아 있습니다. 다른 Linux 언어의 UI 대체 표시, 동적 메시지 및 실제 화면·원어민 검수도 남아 있으며 전체 목표는 진행 중입니다.

증거: [러시아어 번역 기록](russian-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 러시아어 프록시·TLS 및 중단 복구 안내 보완

러시아어 200개를 추가하여 현재 1198/1436개 기준 키를 제공합니다. 238개가 남았습니다. nginx 설정 설명과 PostgreSQL 접속 규칙·중단 복구 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [러시아어 번역 기록](russian-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 러시아어 설정 편집·DB 복원 안내 보완

러시아어 200개를 추가하여 현재 998/1436개 기준 키를 제공합니다. 438개가 남았습니다. nginx 편집·DB 복원·Redis 정책·Node 환경 및 cron 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [러시아어 번역 기록](russian-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 러시아어 Certbot·cron 및 실행 안내 보완

러시아어 100개를 추가하여 현재 798/1436개 기준 키를 제공합니다. 638개가 남았습니다. Certbot·cron·터미널 및 패키지 환경 설정 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [러시아어 번역 기록](russian-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 러시아어 UI 번역 보완

러시아어 100개 항목을 추가하여 현재 698/1436개 기준 키를 제공합니다. 738개가 남았습니다. 파일 편집·로그인·운영 권한·nginx 및 Certbot 상태 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [러시아어 번역 기록](russian-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 nginx 코드 입력 커서 수정

코드 입력 커서가 정의되지 않은 --text 변수를 사용하여 투명한 글자색을 따라가던 문제를 수정했습니다. caret-color에 테마 강조색과 기본 색을 지정했습니다. 실제 개발 브라우저에서 입력 포커스와 불투명한 커서 색 rgb(36,100,173)을 확인했으며 화면의 24행 끝에서 커서가 보입니다. 설정 내용은 변경하지 않았습니다.

화면 증거: /tmp/tastedev-nginx-caret-fixed-20261006.jpg.

## 2026-10-06 중국어 기준 UI 카탈로그 보완 완료

중국어의 남은 276개 항목을 번역하여 영어 기준 1436개 키 전체를 제공합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 추가분의 실제 화면과 원어민 검수는 남아 있습니다. 전체 목표는 진행 중입니다.

증거: [중국어 번역 기록](chinese-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 중국어 설정 설명 및 접속 규칙 안내 보완

중국어 200개 항목을 추가하여 현재 1160/1436개 기준 키를 제공합니다. 276개가 남았습니다. Redis·cron·sudo·nginx 상세 설명과 PostgreSQL 접속 규칙 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [중국어 번역 기록](chinese-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 중국어 UI 번역 보완

중국어 220개 항목을 추가하여 현재 960/1436개 기준 키를 제공합니다. 476개가 남았습니다. 파일 편집·nginx·Certbot·cron·DB 백업 복원 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [중국어 번역 기록](chinese-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 스페인어 기준 UI 카탈로그 보완 완료

스페인어의 남은 176개 항목을 번역하여 영어 기준 1436개 UI 키 전체를 제공합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 개발 브라우저의 nginx.conf 설정 설명·탭·버튼을 스페인어로 확인하고 한국어로 복원했습니다. 다른 언어의 누락 및 동적 메시지·원어민 검수는 남아 있습니다. 전체 목표는 미완료입니다.

증거: [스페인어 번역 기록](spanish-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 스페인어 프록시·TLS 및 중단 복구 안내 보완

스페인어 200개 항목을 추가하여 현재 1260/1436개 기준 키를 제공합니다. 176개가 남았습니다. nginx 상세 설명·코드 편집과 PostgreSQL 접속 규칙 및 서비스 중단 복구 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면과 원어민 검수는 남아 있으며 전체 목표는 진행 중입니다.

증거: [스페인어 번역 기록](spanish-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 스페인어 설정 설명·복원 안내 보완

스페인어 200개 항목을 추가하여 현재 1060/1436개 기준 키를 제공합니다. 376개가 남았습니다. nginx 설정 설명·DB 복원·Redis 메모리·cron 시간대 및 sudo 권한 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 추가분의 실제 화면 및 원어민 검수는 미완료이며 전체 목표는 진행 중입니다.

증거: [스페인어 번역 기록](spanish-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 스페인어 UI 번역 보완

스페인어 누락 번역 120개를 추가하여 현재 860/1436개 기준 키를 제공합니다. 576개가 남았습니다. 파일 편집·nginx·Certbot·cron 및 운영 영향 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 실제 화면 및 원어민 검수, 기타 언어 작업은 남아 있습니다. 전체 목표는 미완료입니다.

증거: [스페인어 번역 기록](spanish-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 프랑스어 기준 UI 카탈로그 보완 완료

프랑스어의 남은 296개 항목을 번역하여 영어 기준 1436개 키 전체를 제공합니다. nginx 설정 설명 및 DB 설정 적용·중단 복구 안내를 포함합니다. 번역 형식 검사와 기존 언어 테스트 16개가 성공했습니다. 다른 언어의 누락, 동적 메시지 범위 및 원어민 검수는 남아 있습니다. 전체 목표는 미완료입니다.

증거: [프랑스어 번역 기록](french-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 프랑스어 DB 복원 및 nginx 설정 설명 보완

프랑스어 번역 200개를 추가하여 현재 1140/1436개 기준 키를 제공합니다. 296개가 남아 있습니다. DB 복원·include 연결·Redis 메모리 정책·cron 시간대·sudo 변경 영향·nginx 설정 설명을 포함합니다. 번역 형식 검사와 기존 언어 검사 16개가 성공했습니다. 전체 목표는 미완료이며 운영 변경·배포는 수행하지 않았습니다.

증거: [프랑스어 번역 기록](french-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 프랑스어 설정·보안·운영 안내 보완

프랑스어 UI 번역 200개를 추가하여 현재 940/1436개 기준 키를 제공합니다. 496개가 남아 있습니다. 번역 형식 검사와 언어 관련 기존 검사 16개가 성공했습니다. 추가 번역의 실제 브라우저 및 원어민 검수는 미완료이며 운영 변경·배포는 수행하지 않았습니다. 전체 목표는 미완료입니다.

증거: [프랑스어 번역 검사](french-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 독일어 기준 UI 카탈로그 보완 완료

남은 독일어 361개 항목 및 기존 지원 언어의 동적 서비스 상태 메시지 6개를 추가했습니다. 독일어는 영어 기준 1436개 키 전체를 포함합니다. 언어 검사 16개와 번역 형식 검사가 성공했으며 개발 브라우저에서 nginx.conf 주요 설정 설명을 확인하고 한국어로 복원했습니다. 기타 언어의 누락·카탈로그 밖의 동적 메시지·원어민 검수는 남아 있습니다. 전체 제품 목표는 미완료이며 배포 및 운영 변경은 수행하지 않았습니다.

증거: [독일어 번역 및 화면 확인](german-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 독일어 설정 설명 및 운영 영향 안내 보완

독일어 200개 항목을 추가하여 nginx 설정 설명·GUI 편집 안내, PostgreSQL 적용/복원, MariaDB include 구조, Redis 제거 정책, cron 시간대, sudo 규칙 및 로그인 오류 안내를 보완했습니다. 현재 1069/1430개 키이며 361개가 남았습니다. 번역 형식 검사와 언어 검사 16개가 성공했습니다. 운영 변경·배포는 수행하지 않았으며 전체 목표는 미완료입니다.

증거: [독일어 번역 기록](german-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 독일어 UI 안내 및 Certbot 오류 번역 보완

독일어 번역 136개와 기존 지원 언어의 인증서 디렉터리 오류 설명을 추가했습니다. 실제 개발 브라우저에서 독일어 Certbot 설정 안내를 확인하고 기존 한국어로 복원했습니다. 언어 검사 16개 및 번역 형식 검사가 성공했습니다. 독일어는 현재 869/1430개 키이며 561개가 남았습니다. 이번 카탈로그 변경은 아래 이전 전체 회귀/빌드 결과의 범위에 포함되지 않습니다. 전체 목표는 미완료입니다.

증거: [독일어 화면 확인](german-ui-translation-check-20261006.md). 아래는 이전 이력입니다.

## 2026-10-06 개발 화면 수정 및 통합 확인

현재 소스의 전체 회귀 검사 988개가 성공했습니다. 개발 서버와 분리한 복사본의 Next.js 빌드가 완료됐으며 app/components/lib/public/scripts/packaging의 389개 파일 내용이 현재 소스와 일치합니다. 이번 작업은 개발 소스와 사용자 안내를 수정한 범위입니다.

nginx 코드 높이와 검색 위치, 초기 상태 조회, 설정·코드 탭 전환 중 미반영 입력 보존, Certbot 인증 방식 변경 시 이전 명령 제거를 확인했습니다. 코드 도구 버튼은 접근 가능한 이름이 있는 아이콘 버튼으로 변경했습니다. 회귀 검사의 기존 컴포넌트 모형도 현재 버튼과 입력 보존에 맞췄습니다. README는 개발 계정 설정 위치와 설치 장비의 계정 설정 명령을 구분합니다.

실제 개발 브라우저의 터미널 입력·출력·탭 분리, 여섯 현황 페이지의 공통 헤더·본문 스크롤, 패키지 도구 높이, nginx 설정·코드 왕복 및 Certbot 명령 검토 증거는 같은 날짜의 browser-check 문서에 기록했습니다. 운영 파일 적용이나 인증서 발급은 이 화면 검사에 포함되지 않습니다.

번역 형식·영어 키 검사에는 오류가 없지만 전체 UI 번역은 완료되지 않았습니다. 영어·일본어·포르투갈어는 1429개 키가 있고, 독일어·스페인어·프랑스어·중국어는 각 696개, 아랍어·러시아어는 각 838개가 빠져 영어로 대체됩니다. 다른 Linux 로케일은 별도 번역이 필요합니다. PostgreSQL 설정 설명의 언어 지원과 전체 UI 번역은 서로 다른 범위입니다.

남은 확인: 실제 OS 한영 전환·한글 조합, AI 키 사용 결정 이후 오류 해결 연동, 설치 환경의 서비스/helper 및 운영 적용·복원, 최종 배포 인수 검사. 전체 목표는 미완료입니다. 증거: [개발 검사 결과](development-regression-20261006.json). 아래는 기존 이력입니다.

## 2026-10-06 PostgreSQL 준비 단계 취소 GUI/API 연결

기존 복구 API에서 파일 교체 전 ready 및 intent-only 단계를 재시작 없는 준비 취소로 검토합니다.
GUI는 실제 파일 복원·서비스 재시작과 구분한 확인창을 표시하고, 감사 상태는 cancelled,
터미널 결과는 preparation cancellation으로 기록합니다. sudo/root 작업 종류는 추가하지 않았습니다.
원본 파일 hash/inode/속성·서비스·auto 설정·임시 원장 변경은 거부하고 기록을 보존합니다.
유실 원장과 swap·고아 후보 파일, preparing/cleaning/custody 등 모호한 상태를 자동 삭제하지 않습니다.
전체 회귀 986 PASS, 관련 범위 157개 포함, production build 및 DEB 검증 PASS.
격리된 실제 PostgreSQL 검사 19 PASS: 공개 API core로 ready·intent-only 취소,
별도 마운트의 include 후보와 새 디렉터리 정리, 실제 PID·SQL 값·원본 유지 확인.
서비스 관리자는 fixture이며 실제 설치 root helper/systemd·브라우저 검증은 미완료입니다.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-preparation-cancel.deb.
SHA-256: 2fe3dc75cba3976a120327df2b4ae6c916ad65a6a0112dd8cf318932e4196d34.
증거: .runtime/verification/postgresql-preparation-cancel-delivery-20261006.json.
설치·운영 설정 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-06 선택 언어 첫 화면 SSR 및 설정 유지

공통 레이아웃이 언어 쿠키를 읽어 lang/dir와 Provider의 초기 언어를 함께 전달합니다.
언어 쿠키가 없으면 Accept-Language 가중치로 첫 화면 언어를 선택합니다.
클라이언트는 쿠키가 없는 경우에만 이전 localStorage 언어를 이전하며, 선택을 쿠키와 저장소에 함께 기록합니다.
첫 방문에서 이전 localStorage를 옮길 때만 한 차례 전환이 있을 수 있습니다.
관련 검사 25 PASS, 전체 회귀 972 PASS, production build 및 DEB 검증 PASS.
추출 배포 서버의 실제 HTTP 로그인 HTML에서 언어 쿠키 우선순위, 가중치, 잘못된 쿠키 처리,
아랍어 RTL 방향, 초기 번역과 서로 다른 요청 간 언어 분리를 확인했습니다.
패키지: dist/tastedev-linux_0.1.0_amd64-language-ssr.deb.
SHA-256: 2b04a1a747041c98ebaa072a60b10145932bed5710345aceb6f3184780a2d654.
증거: .runtime/verification/language-ssr-delivery-20261006.json.
실제 브라우저 시각 검증·전체 UI 및 추가 언어 번역·운영 기능의 전체 검증은 미완료입니다.
설치·운영 설정 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-06 PostgreSQL 조지아어 설정 설명 전체 보완

누락 설명 166개를 작성하여 조지아어에서도 설정 348개와 include 지시문 3개를 설명합니다.
현재 설명을 제공하는 17개 언어 전체에서 동일한 설정 범위를 지원합니다. HBA 설명도 17개 언어입니다.
언어 변경 시 도움말과 설명 검색이 갱신되며 설정 값과 원본 주석은 유지됩니다.
관련 검사 22 PASS, 전체 회귀 969 PASS, production build 및 DEB 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-georgian-complete.deb.
SHA-256: d1f10da545638b77f18fb79511776b1782e576e1f293eba960509af693cd9296.
증거: .runtime/verification/postgresql-georgian-complete-delivery-20261006.json.
추가 Linux 로케일·전체 UI 번역·원어민 검수·실제 브라우저 및 운영 기능 전체 검증은 미완료입니다.
설치·운영 설정 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-06 PostgreSQL 인도네시아어 설정 설명 전체 보완

누락 설명 208개를 보완하여 설정 348개와 include 지시문 3개를 설명합니다.
완전한 설정 설명은 16개 언어이며 조지아어는 182개 설정의 부분 번역입니다.
HBA 설명은 17개 언어이며 언어 변경 시 설명과 검색이 갱신되고 설정 값은 유지됩니다.
관련 검사 22 PASS, 전체 회귀 969 PASS, production build 및 DEB 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-indonesian-complete.deb.
SHA-256: 88a9bfa750cca5c9ce0a02daa0a154e0442fd5748d6555aaf2edd8fb73f74cb9.
증거: .runtime/verification/postgresql-indonesian-complete-delivery-20261006.json.
추가 언어 전체 UI·모든 Linux 로캘·원어민 검수·실제 브라우저 및 운영 검증은 미완료입니다.
설치·운영 설정 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-06 PostgreSQL 터키어 설정 설명과 로캘 검색

터키어 설명 누락 197개를 기존 공식 번역 문장과 앱 작성 보충 번역으로 채웠습니다.
공식 PO 원본 SHA를 확인했으며, 누락된 고유 문장 225개를 보완하여 설정 348개와
포함 지시문 3개 전체를 설명합니다. 설명의 문단 순서와 특수값 동작을 유지합니다.
완전한 설정 설명 언어는 15개, 부분 번역 언어는 인도네시아어·조지아어 2개입니다.

설정 설명·언어 선택 검색은 터키어 I/ı 및 İ/i 대소문자를 처리하며 ASCII 설정
이름의 대소문자 없는 검색도 유지합니다. GUI 도움말과 검색은 설정 파일을 바꾸지
않습니다. 관련 검사 22 PASS, 전체 회귀 969 PASS, production build·DEB 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-turkish-complete.deb.
SHA-256: 11e02de07510a49512e4dda1c87a93860e6bc44bb01e3145cf00e8259df62870.
증거: .runtime/verification/postgresql-turkish-complete-delivery-20261006.json.
추출 DEB에서 15개 언어 전체 설정 설명과 17개 언어 HBA 설명을 확인했습니다.
모국어 검수·브라우저 실화면까지 완료한 주장은 아닙니다. 나머지 2개 언어 설명,
추가 언어의 전체 UI 및 모든 Linux 로캘 지원·기존 운영 기능의 전체 검증은 미완료입니다.
설치·운영 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-06 PostgreSQL 폴란드어 설정 설명 전체 보완

폴란드어 설명 누락 189개를 앱 작성 번역으로 보완했습니다. PostgreSQL 설정
348개와 포함 지시문 3개 전체를 설명하며, GUI 도움말·입력 설명·번역 검색에
사용합니다. 특수값 0/-1, 빈 문자열과 WAL·TLS·트랜잭션 적용 범위도 설명합니다.
공식 번역의 SHA와 가져온 개수는 변경하지 않습니다.
완전한 설정 설명 언어는 14개, 부분 번역 언어는 3개입니다.

관련 검사 11 PASS, 전체 회귀 968 PASS, production build 및 DEB 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-polish-complete.deb.
SHA-256: 3f34b11714d918f3d40266844af8931a39f6e9a521c01c12f226637268986d50.
증거: .runtime/verification/postgresql-polish-complete-delivery-20261006.json.
추출 DEB에서 14개 언어의 모든 설정 설명과 17개 언어의 HBA 설명을 확인했습니다.
모국어 검수·브라우저 실화면까지 완료한 주장은 아닙니다. 인도네시아어·조지아어·
터키어의 누락 설명, 추가 언어의 전체 UI 번역 및 기존 기능의 전체 운영 검증은
미완료입니다. 설치·운영 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 이탈리아어 설정 설명 전체 보완

공식 이탈리아어 번역에서 빠진 112개 항목을 앱 작성 설명으로 보완해 348개 설정과
파일 포함 지시문 3개를 모두 설명합니다. 완전한 설정 설명을 제공하는 언어는 13개,
부분 번역 언어는 4개입니다. 원본 공식 번역의 SHA·개수는 그대로 기록합니다.
보완 설명은 GUI 입력 도움말과 설명 검색에도 사용하며 파일 초안을 수정하지 않습니다.

row_security 설명은 17개 언어 모두 off가 행 보안 정책을 무시하는 권한을 주는
설정이 아님을 설명하고, 쿼리 실패 및 슈퍼유저·BYPASSRLS 예외를 명시했습니다.
검토 기준: https://www.postgresql.org/docs/18/runtime-config-client.html#GUC-ROW-SECURITY

관련 검사 11 PASS, 전체 회귀 968 PASS, production build 및 DEB 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-italian-complete.deb.
SHA-256: c60b55a933b1390638fece6218653091946646937a7208756b075ef2ad160cf9.
증거: .runtime/verification/postgresql-italian-complete-delivery-20261005.json.
13개 언어 설명 전체와 나머지 4개 제공 범위 및 17개 언어 HBA 설명을 추출 DEB에서
확인했습니다. 모국어 검수와 브라우저 실화면까지 검증한 상태는 아닙니다.
전체 UI·나머지 설정 번역, 모든 Linux 로캘 지원 및 기존 기능의 전체 운영 검증은
미완료입니다. 설치·운영 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 접속 규칙 설명의 17개 언어 지원

pg_hba.conf의 필드 6개, 연결 유형 6개, 인증 방식 15개를 추가 7개 언어에도
설명합니다. 총 17개 언어의 27개 도움말 모두 누락 없이 제공하며, 지역 로캘과
언어 변경 시 렌더링·aria-description도 갱신됩니다. 설정 원문은 변경하지 않습니다.
앱 작성 번역이고 PostgreSQL 18 공식 문서를 기준으로 작성했습니다.

관련 검사 10 PASS, 전체 회귀 967 PASS, production build 및 DEB 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-hba-extra-languages.deb.
SHA-256: b2f99aaa0f6173dfe1cbec8d9ccd3da0b2bacdada54ae328524da7a4b1c74809.
증거: .runtime/verification/postgresql-hba-extra-languages-delivery-20261005.json.
추출 DEB에서도 17개 언어의 HBA 설명 27개를 모두 확인했습니다.
추가 7개 언어의 전체 UI 번역, 5개 언어의 나머지 설정 설명 및 모든 Linux 로캘
번역은 미완료입니다. 브라우저 실화면·모국어 검수까지 완료한 주장은 아닙니다.
설치·운영 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 설정 설명 언어 확장

공식 PostgreSQL 번역을 추가하여 설정 설명을 총 17개 언어로 제공합니다.
기존 10개 및 스웨덴어·우크라이나어는 348개 설정 전체를 설명합니다.
인도네시아어 139, 이탈리아어 236, 조지아어 182, 폴란드어 158, 터키어 150개는
공식 번역을 사용하고 미번역 항목은 해당 언어 안내와 영어 설명으로 구분합니다.
파일 포함 지시문 3개는 17개 언어 모두 제공합니다. 언어 전환 시 기존·추가 항목
입력 도움말과 검색도 갱신되고 파일 내용은 변경되지 않습니다.

관련 검사 10 PASS, 전체 회귀 967 PASS, production build 및 DEB 검증 PASS.
추출 DEB에서 완전 번역 12개 언어 전체와 나머지 5개 언어의 제공 항목을 검사했습니다.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-extra-languages.deb.
SHA-256: 5f944614cea62569601436b50d16050894b578329b591eaeb1a3c3122b175b96.
증거: .runtime/verification/postgresql-extra-languages-delivery-20261005.json.
추가 7개 언어의 HBA·UI 전체 번역 및 모든 Linux 로캘 지원은 아직 미완료입니다.
브라우저 실화면 검증 없이 렌더링 검사·빌드·추출 패키지 검사 범위입니다.
설치·운영 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 복원 준비 취소의 마운트 경계 수정

새 v2 stage 기록의 취소는 후보 파일과 생성 디렉터리를 각각 원래 부모의
.tastedev-pg-cancel-ID-KIND-INDEX 이름으로 옮긴 뒤 등록된 inode·내용·속성을
확인하고 정리합니다. 설정/백업 마운트 사이에 rename하지 않습니다. 원본 설정과
서버 PID/SQL 값은 유지합니다. 후보 변경이나 예약 이름 충돌은 보존하고 거부합니다.
이동/삭제 후 checkpoint 중단은 private stage 기록의 전체 사전 검사로 재개합니다.
이미 지워진 생성 디렉터리의 후손은 완료 상태가 확인된 경우에만 처리합니다.
이전 v1 stage 기록의 읽기와 기존 custody 취소는 계속 지원합니다.

관련 복구 82 PASS. 실제 임시 PostgreSQL 18 검사 18 PASS: 서로 다른 bind mount의
기존 main/include 후보 취소와 새 include 디렉터리 취소 후 live 파일·PID·SQL 값을
확인했습니다. systemd 관리와 계정 조회는 fixture이며 운영 서비스/root helper는
호출하지 않습니다. 임시 DB 종료·PID namespace 종료·fixture 정리 확인.
실제 증거: .runtime/verification/postgresql-runtime-host-2026-10-05T14-16-13.674Z.json.
전체 회귀 966 PASS, production build 및 DEB 추출 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-adjacent-stage-cancel.deb.
SHA-256: 29709214b999dc235f48507ea25cb5c644ce8085d02ef2def9b7659d3075ee9e.
배포 증거: .runtime/verification/postgresql-adjacent-stage-cancel-delivery-20261005.json.

이 변경은 내부 stage executor 경로입니다. 이전 v1 cleaning 기록의 다른 마운트
자동 전환, cancel 초기 디렉터리 게시 crash window, 전체 crash/power-loss,
실제 운영 서비스와 브라우저 GUI/IME 및 나머지 요구사항은 미완료입니다.
설치·운영 변경 없음. 전체 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 이전 PostgreSQL 복구 기록의 마운트 경계 호환

v2 중단 기록을 전체 원본·후보·undo·보관 파일 preflight 및 원본 native 검수
후 v3 rolling-back 기록으로 전환합니다. 이후 남은 후보는 설정 파일 옆에 보관해
마운트 경계를 넘는 rename을 사용하지 않습니다. 이전 custody에 이미 보관된
정확한 stage inode는 이동하지 않고 계속 증거로 사용합니다. 두 위치에 동시에
파일이 있거나 이름·내용·identity가 바뀌면 진행 기록과 원문을 보존하고 거부합니다.
형식 전환을 완료한 직후 중단돼도 v3는 검증된 기존 custody 위치를 인식합니다.

관련 복구 검사 79 PASS. 실제 private postmaster 검사 16 PASS: 이전 v2 형식
fixture checkpoint를 새 기록으로 복구하고 실제 PostgreSQL을 재시작해 SQL
원본값을 확인했습니다. fixture는 별도 config/backup bind mount를 사용하며,
v2 checkpoint 작성은 이전 formatter를 나타내는 fixture 조작입니다. 이전 배포
바이너리를 설치한 검증은 아닙니다. systemd 및 운영 root helper 호출 없음.
종료·PID namespace 종료 및 임시 파일 정리를 확인했습니다.
실제 DB 증거: .runtime/verification/postgresql-runtime-host-2026-10-05T14-04-06.352Z.json.

최종 전체 회귀 963 PASS, production build 및 DEB 추출 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-legacy-recovery-upgrade.deb.
SHA-256: d102a2e74ad9f4bab7a55a4defd54e19ca74d8e45fcce16c4fd13db1d1c68ff3.
배포 증거: .runtime/verification/postgresql-legacy-recovery-upgrade-delivery-20261005.json.
stage 취소의 마운트 경계,
모든 crash/power-loss 구간, 운영 systemd/root helper와 브라우저 GUI/IME 및
나머지 제품 요구사항은 미완료입니다. 설치·운영 변경 없음. 전체 PARTIAL.
아래는 이전 이력입니다.

## 2026-10-05 실제 여러 파일 복원 실패의 마운트 경계 롤백 수정

실제 임시 postmaster의 파일 묶음 복원·되돌리기와 시작 실패를 추가 검증했습니다.
시작 실패 후 후보 파일을 백업 쪽 custody로 rename하는 이전 구현은 마운트가
다르면 EXDEV로 실패했습니다. 새 v3 진행 기록은 각 후보를 해당 설정 부모의
.tastedev-pg-retired-ID-INDEX 이름에 보존하므로 inode·원문·속성을 유지한 채
원본을 복구합니다. 부모 FD와 파일 identity를 계속 검사하고 보관 이름 충돌은
모든 원본/후보 preflight에서 거부합니다. 별도 복구도 같은 v3 위치를 사용하며
이전 v2 진행 기록의 읽기와 기존 custody 복구를 계속 지원합니다.

실제 임시 PostgreSQL 검사 15 PASS: 메인/include 파일 복원, 복원 전 undo 백업,
실제 postmaster 재시작과 SQL 값, 다중 파일 시작 실패 후 원본/runtime 복구 포함.
systemd 응답과 실패 상태는 fixture이며 실제 운영 helper/systemd를 호출하지
않습니다. 종료·PID namespace 종료·임시 파일 정리를 확인했습니다. 관련 복구
검사 77 PASS. 최초 EXDEV 및 테스트 fixture 변수 오류 로그는 보존했습니다.
최종 전체 회귀 961 PASS, production build 및 DEB 추출 검증 PASS.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-crossmount-rollback.deb.
SHA-256: d8d90989a1355873fa0ac4158667c63720a90b5e214ade665485c6dcbd4ee72f.
배포 증거: .runtime/verification/postgresql-crossmount-rollback-delivery-20261005.json.
실제 DB 증거: .runtime/verification/postgresql-runtime-host-2026-10-05T13-54-51.781Z.json.

이전 v2의 마운트 경계가 있는 부분 복구 기록 자동 migration, stage 취소의
마운트 경계 처리, 모든 crash/power-loss 구간, 운영 systemd/root helper 및
브라우저 GUI/IME는 아직 미완료입니다. 설치·운영 설정 변경 없음. 전체 PARTIAL.
아래는 이전 이력입니다.

## 2026-10-05 완료 기록 백업 게시 전 중단 재시도

완료 기록에서 원본 백업을 가져오는 중 metadata 임시 파일만 남았을 때, 다음
명시적 가져오기에서 같은 기록의 원문·전체 원본 graph·권한·완료 기록 버전과
실제 격리 검수 결과를 확인한 뒤 같은 inode/바이트로 게시를 이어갑니다. 등록된
공유 게시기도 완전히 같은 private 임시 파일만 재사용하며 잘린 파일, 다른
내용, 노출 권한, 추가 링크 및 검토 중 수정은 보존하고 거부합니다.

실제 공유 게시 프로세스 SIGKILL(원문 fsync 후 최종 link 전), 동일 inode/byte
재게시, 완료 기록 재시도와 외부 수정 보존을 추가했습니다. 관련 30 PASS, 전체
회귀 959 PASS, 실제 PostgreSQL 18 격리 복원 시나리오 10 PASS, production build
PASS. native 완료 기록 시나리오에는 pending 파일 재게시와 기존 최종 연결
alias 정리 후 원본 복원이 포함됩니다. 실제 운영 활성화는 fixture callback이며
운영 DB/systemd/root helper를 호출하지 않습니다. 설치·운영 변경 없음.

검증 로그: /tmp/tastedev-pg-pending-publication-{focused,full,native,build}.log.
실제 격리 증거: .runtime/verification/postgresql-graph-restore-host-2026-10-05T13-41-46.140Z.json.
DEB 추출 검증 PASS: dist/tastedev-linux_0.1.0_amd64-postgresql-pending-publication.deb.
SHA-256: 0b779152fd7294e9c1e88eb5e7055abfc31925cc88a865f2442a55f34563b8a7.
배포 증거: .runtime/verification/postgresql-pending-publication-delivery-20261005.json.
power-loss 모든 구간이나 무관한 UUID의
버려진 undo 임시 파일 자동 수거를 검증한 것은 아닙니다. 브라우저 GUI/IME와
운영 서비스 연동 등 전체 목표 PARTIAL. 아래는 이전 검증 이력입니다.

## 2026-10-05 PostgreSQL 다국어 입력 도움말 배포 산출물

기존 항목 값과 새 항목 이름 입력에 현재 언어의 설명을 연결했습니다. 새 설정
이름을 입력하거나 언어를 변경하면 설명이 갱신되며 도움말 조회만으로 파일을
수정하지 않습니다. 일반 설정 348개와 include 3개, HBA 설명은 10개 UI 언어를
지원합니다. 미지원 언어는 영어, 알 수 없는 확장 설정은 설명 미제공 안내입니다.
모든 Linux 로캘의 완전한 번역은 미완료입니다.

관련 테스트 8 PASS, i18n literal gate PASS, production build 및 추출 DEB 검증
PASS. 전체 회귀 956 PASS는 이전 산출물 검사이며 이번에 반복하지 않았습니다.
실제 브라우저 GUI/IME 검증은 아직 미완료입니다. 장비 설치·운영 변경 없음.
패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-localized-input-help.deb.
SHA-256: 965db3428a03987997620d6cd67cc386dfc1f303d48b97ee30c24cfebe7f9fb6.
증거: .runtime/verification/postgresql-localized-input-help-delivery-20261005.json.
전체 목표 PARTIAL. 아래는 실제 임시 클러스터 검증과 이전 이력입니다.

## 2026-10-05 PostgreSQL 실제 적용 및 시작 실패 복구 검증

기존 실제 임시 PostgreSQL 검사에 설정 적용, 실제 postmaster 시작 실패 후 원본
복구와 재시작, 재시작으로 오래된 적용 검수 거부, 외부 동시 수정 원문 보존을
추가해 12개 검사를 통과했습니다. 운영 설정·DB·서비스는 변경하지 않았습니다.
임시 클러스터 종료, PID namespace 종료 및 소유한 fixture 파일 제거를 확인한
뒤 증거를 기록합니다. systemd 관리자 응답과 계정 lookup은 fixture이며 실제
운영 systemd/root helper 실행은 아직 검증되지 않았습니다.

재실행: npm run verify:postgresql:runtime:host.
증거: .runtime/verification/postgresql-runtime-host-2026-10-05T13-32-58.598Z.json.
중첩 namespace 생성과 미지원 preserve-fds 옵션의 실패 기록을 보존했습니다.
현재 검증은 private Unix socket으로 별도 호스트 측 기본 격리 검수기에 요청하며
허용 경로·요청 크기·설정 원문 hash와 graph를 검사합니다. 운영 검수기의 보안
옵션과 바이너리 소유권 검사는 변경하지 않았습니다. 전체 목표 PARTIAL.

## 2026-10-05 실제 임시 PostgreSQL 실행 및 리소스 검증

사용자·네트워크·PID namespace 안의 임시 클러스터에서 실제 postmaster, PID 파일,
실행 바이너리, 소켓과 SQL 설정 경로를 기존 inspector로 검사했습니다. 실제
읽기 전용 세션 강제, peer 매핑과 거부 인증, ALTER SYSTEM/reload에 따른 실행값과
postgresql.auto.conf 해시 변경, 조회 도중 자동 설정 변경 거부, 잘못된 설정의
오류 수 및 재시작 후 이전 프로세스 identity 거부 등 8개 검사를 통과했습니다.
임시 DB 종료와 파일 정리도 확인했습니다. systemd 관리자 응답과 계정 lookup은
namespace fixture이며 실제 systemd나 root helper의 운영 서비스는 호출하지 않습니다.
실행 바이너리는 namespace 진입 전에 root 소유권/경로/해시를 검증하고 안에서
다시 바이트를 확인합니다. 신뢰 검사를 운영 애플리케이션에서 완화하지 않았습니다.

재실행: npm run verify:postgresql:runtime:host (기본 major 18).
증거: .runtime/verification/postgresql-runtime-source-20261005.json.
초기 Node 마운트 오류의 진단과 실패 로그도 보존했습니다. 이번 변경은 개발용
검증 스크립트/명령뿐이며 앱 runtime 변경이 없어 전체 회귀나 DEB를 다시 만들지
않았습니다. 기존 검증 패키지 SHA-256: fe1fddeda158f2a3cfc41098dda14b7bac7f443c9ea6c5f2b7defb9490887408.

장비 설치·운영 DB/설정/서비스 변경 없음. 실제 운영 systemd/root helper 실행,
임시 실DB를 사용한 적용/롤백 검증, 다른 게시 crash window, 브라우저 GUI/IME
및 나머지 요구사항은 남아 있습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 백업 최종 연결 게시 후 중단 복구

원본 묶음 백업이나 완료 기록 가져오기의 최종 metadata 연결 생성 후 임시 연결을
지우기 전에 프로세스가 종료돼도, 전체 원문 hash·기록·원본 graph archive와 pinned
파일/부모 identity를 검증한 뒤 정확한 .pg-undo-init-ID 연결만 정리합니다. 최종
파일 inode와 내용은 보존합니다. 알 수 없는 연결·3개 이상 연결·변조 기록 및
유효하지 않은 archive는 보존하고 거부합니다. PostgreSQL 백업 목록 조회에도
연결해 복원 가능한 백업이 목록에서 제외되지 않도록 했습니다.

실제 fixture 게시 프로세스 SIGKILL 및 byte/inode 보존 검사 포함 관련 47 PASS,
전체 회귀 956 PASS, 실제 PostgreSQL 18 격리 시나리오 10 PASS, production build
및 package:verify -- --terminal PASS. 기존 helper 목록 테스트는 async 목록 조회를
기다리도록 갱신했습니다. 초기 실패 로그를 보존했습니다. 일시적인 자동 승인
검토 용량 부족은 재검토 성공 후 해소됐으며 승인되지 않은 검사를 실행하지 않았습니다.

패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-publication-resume.deb.
SHA-256: fe1fddeda158f2a3cfc41098dda14b7bac7f443c9ea6c5f2b7defb9490887408.
이전 HBA 언어 산출물을 보존하고 기본 dist 파일을 검증된 새 파일로 갱신했습니다.
증거: .runtime/verification/postgresql-publication-resume-delivery-20261005.json.

이 검증은 최종 연결 생성 후 임시 연결 제거 전 프로세스 중단 구간입니다.
게시 전 임시 기록, 다른 crash window, 실제 운영 리소스/서비스, 브라우저 GUI/IME
및 모든 Linux 로캘 등은 미완료입니다. 장비 설치·운영 설정/서비스 변경 없음.
전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 접속 규칙의 언어별 설명

pg_hba.conf GUI의 6개 입력 필드, 연결 유형 6개와 인증 방식 15개에 10개 UI 언어
설명을 추가했습니다. 선택한 유형/인증 방식 설명은 입력 아래에서 갱신되며
aria-description으로 보조 기술에도 제공합니다. 원래 키워드/주석/설정 원문은
바꾸지 않습니다. 지역 로캘은 기본 언어 설명을 사용하며 미지원 언어는 영어입니다.
기준: https://www.postgresql.org/docs/18/auth-pg-hba-conf.html

언어별 SSR 렌더링/언어 변경/원문 보존 및 설명 누락을 포함한 관련 검사 9 PASS,
전체 회귀 953 PASS, i18n literal gate PASS, production build 및 DEB 검증 PASS.
추출된 DEB의 27개 HBA 설명을 10개 언어 모두 검증했습니다. 초기 검증기가
번들로만 배포되는 GUI 파서를 raw 파일에서 읽던 오류를 수정하고 실패 로그도 보존했습니다.

패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-hba-languages.deb.
SHA-256: 10cd484ded418cf3e4d8babc1b6b4f2e7cd05dbdeac8d969afcb4f309dee99b0.
이전 retention-resume 산출물을 보존하고 기본 dist 파일을 새 검증 패키지로 갱신했습니다.
증거: .runtime/verification/postgresql-hba-languages-delivery-20261005.json.

장비 설치·운영 설정/서비스 변경 없음. 실제 브라우저 GUI/IME, 운영 리소스/서비스,
다른 게시 crash window, 모든 Linux 로캘 및 전체 제품 요구사항은 미완료입니다.
전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 빈 보관 폴더 중단 후 재개

완료 intent의 보관 폴더 생성 후 이동 전에 프로세스가 종료된 경우, 같은 기록 ID의
700 권한·현재 계정 소유·심볼릭 링크 없는 빈 폴더만 재사용합니다. 등록된 intent와
terminal progress를 다시 확인한 뒤 원본 바이트를 보관하고 active slot을 해제합니다.
다른 파일이 있거나 권한/링크가 올바르지 않으면 기록을 보존하고 거부합니다.

실제 fixture 자식 프로세스를 폴더 생성 직후 SIGKILL한 검사가 통과했습니다.
관련 36 PASS, 전체 회귀 951 PASS, PostgreSQL 18 native 격리 시나리오 10 PASS,
production build 및 package:verify -- --terminal PASS.

패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-retention-resume.deb.
SHA-256: 7f9dc37fd5ea5cfe52169c2a5323e2690f6bff0e0330a550dd2a0964fdcbbff9.
이전 history 패키지를 보존하고 기본 dist 파일을 검증된 새 파일로 갱신했습니다.
증거: .runtime/verification/postgresql-retention-resume-delivery-20261005.json.

이 검증은 폴더 생성/intent 이동 전 중단 구간입니다. 다른 게시 crash window,
실제 운영 서비스/리소스 및 브라우저 GUI/IME와 나머지 전체 요구사항은 남아 있습니다.
장비 설치나 운영 설정/서비스 변경 없음. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 완료 복원 기록 조회 및 원본 백업 가져오기

복원 팝업에서 선택한 클러스터의 완료 기록을 명시적으로 갱신하고, 기록된 원본
include graph를 검수해 기존 백업 목록으로 가져올 수 있습니다. 원문은 목록에
노출하지 않으며 같은 기록은 동일 백업 ID로 재사용합니다. 별도 아이콘으로 기존
복원 검토를 열고 실행 확인을 거칩니다. 불완전한 원본 및 변조 기록은 거부합니다.
새 화면/API/helper 문구는 10개 UI 언어에 포함했습니다.

최종 전체 회귀 949 PASS, 관련 화면/API/SSR 검사 15 PASS, PostgreSQL 18 native
격리 시나리오 9개 PASS, production build 및 package:verify -- --terminal PASS.
초기 테스트 컴포넌트 연결 누락과 sandbox 자식 프로세스 차단 실패 로그를 보존하고
수정/실행 환경 확인 후 전체 검사를 통과했습니다.

패키지: dist/tastedev-linux_0.1.0_amd64-postgresql-history.deb.
SHA-256: c31f05a3c47a433269685cc11da7ebb19342e3eed0339e1c3c071c1e3391de37.
기존 undo-backup 산출물을 보존하고 기본 dist 파일을 새 검증 패키지로 갱신했습니다.
증거: .runtime/verification/postgresql-history-delivery-20261005.json.

장비 설치 및 운영 설정/서비스 변경 없음. 실제 root 서비스 실행과 운영 리소스,
보관/백업 게시 crash window, 브라우저 GUI/IME 및 나머지 전체 요구사항은
미완료이므로 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 복원 전 원본 묶음 백업 및 되돌리기 검토 GUI

새로운 full graph 복원은 원본 include graph가 완전하면 실행 전에 원본 묶음과
일반 PostgreSQL 백업 메타데이터를 함께 남깁니다. 기존 백업 목록에서 조회하고
복원 완료 화면의 테두리 없는 되돌리기 아이콘으로 그 백업을 검토할 수 있습니다.
재검수·별도 실행 확인을 거쳐 원본 파일들을 복원하며, 되돌리기 실행 전 상태도
다시 백업합니다. 원본 include가 누락된 경우 복원 가능한 undo 백업을 만들었다고
표시하지 않고 기존 intent 원본 기록을 보존합니다. 동일 설정이면 백업/재시작 없음.

전체 회귀 943 PASS, 최종 관련 검사 17 PASS, PostgreSQL 18 native fixture 8개 PASS,
production build 및 `package:verify -- --terminal` PASS. 실제 undo 시나리오에서
수정·생성·제거된 include 파일과 최종 native 값이 원본으로 복구됨을 확인했습니다.
처음 fixture의 archive ID/metadata ID 혼동을 정정하고 실패 로그도 보존했습니다.

패키지: `dist/tastedev-linux_0.1.0_amd64-postgresql-undo-backup.deb`.
SHA-256: `fe78ad541d4e08c558780698d310c352862487f379867f01d92197755e6818e9`.
이전 패키지를 보존하고 검증한 산출물로 기본 dist 파일을 갱신했습니다.
증거: `.runtime/verification/postgresql-undo-backup-delivery-20261005.json`.

이 기능은 앞으로 실행하는 복원에 적용됩니다. 이전 완료 intent의 목록/백업 가져오기
GUI, 보관·백업 게시 crash window, 실제 운영 리소스/서비스 적용 및 브라우저 GUI/IME
등은 남아 있습니다. root helper 구성은 검증했지만 실제 root 운영 서비스는 실행하지
않았습니다. 장비 설치·운영 설정 변경 없음. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL native 진단 출력 보호 DEB 검증 완료

비공개 파이프 수정이 포함된 production build와 deb를 만들고
`package:verify -- --terminal`을 통과했습니다. 패키지 관리자 모듈 checksum,
빌드 동일성, 로그인·세션·권한 거부·터미널 격리 실행을 확인했습니다.
실제 PostgreSQL 18 잘못된 설정의 오류에 fixture 값이 포함됐음을 비공개로
확인했으며, 부모 stderr와 공개 응답에는 그 값이 출력되지 않았습니다.
관련 회귀 8 PASS 및 실제 namespace의 정상/오류 설정 2 PASS입니다.

패키지: `dist/tastedev-linux_0.1.0_amd64-postgresql-private-diagnostics.deb`.
SHA-256: `50bcc4c2aac2edc08c5cc2d43d3a0090e68a35d70f3ca14d7b7fc878f0a0169a`.
이전 패키지를 보존하고 검증한 산출물로 기본 dist 파일을 갱신했습니다.
증거: `.runtime/verification/postgresql-private-diagnostics-delivery-20261005.json`.

장비 설치·운영 설정/서비스 변경 없음. 실제 root 서비스 실행, 복구 이력 undo GUI,
보관 게시 crash window, 브라우저 GUI/IME 및 나머지 전체 목표는 PARTIAL입니다.
아래 source-only 문단은 패키징 전의 기록입니다.

## 2026-10-05 PostgreSQL native 검수 진단 출력 비공개 처리 (source)

설정 검수 실행의 stdin은 ignore, stdout/stderr는 bounded pipe로 명시했습니다.
상세 설정값이나 native 오류가 execFileSync 기본 동작을 통해 서버 콘솔로 직접
출력되지 않습니다. 공개 결과는 고정 설정값 또는 기존 일반 오류 메시지만 포함합니다.
기존 helper supervisor의 별도 lock descriptor 전달은 유지합니다.

성공 진단 출력·native 실패·stderr 한도 초과의 실제 subprocess와 helper 회귀
8개 PASS. 실제 PostgreSQL 18.6 namespace의 정상 설정 및 잘못된 설정 2개 PASS:
부모 stderr는 비어 있으며 비공개 오류 문자열은 공개 결과에 포함되지 않습니다.
증거: `.runtime/verification/postgresql-private-diagnostics-source-20261005.json`.

운영 설정/서비스 변경 및 장비 설치 없음. 이 변경은 source이며 기존 배포 후보
`f6624db...`에는 아직 포함되지 않습니다. 새 패키징과 운영 검증 등 전체 목표는
PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 중단된 다중 파일 복구 GUI/API/helper 연결 및 DEB 검증

기존 중단 작업 조회/복구 요청이 v3 include graph intent를 발견하고 원본 여러
파일을 함께 복구하도록 연결했습니다. 원본 설정을 private fixture로 재구성해
native 검수하며, 기록·progress·서비스 상태·auto.conf가 바뀐 검토는 거부합니다.
화면에 대상 파일 목록을 표시하고 완료 후 원본 복구 확인과 active intent 해제를
기존 결과 형식으로 전달합니다. 기존 단일 파일 복구도 유지합니다. 서로 다른
단일 파일/graph 기록이 동시에 존재하면 자동 선택하지 않고 거부합니다.

전체 회귀 937 PASS 및 최종 변경 관련 36 PASS, PostgreSQL 18 native 격리 fixture
7개 PASS, production build 및 `package:verify -- --terminal` PASS. 원본 기록의
그래프 해시와 native 검사 그래프 해시가 다른 형식임을 확인해 구분했습니다.
초기 native 실패 로그도 보존하고 최종 통과 증거를 기록했습니다.

패키지: `dist/tastedev-linux_0.1.0_amd64-postgresql-graph-recovery.deb`.
SHA-256: `f6624db54edf156f915d754baa67bdd98d940351014ea34b1ecea3ef519b5005`.
이전 패키지를 보존하고 검증된 새 산출물로 기본 dist 파일을 갱신했습니다.
증거: `.runtime/verification/postgresql-graph-recovery-delivery-20261005.json`.

운영 DB/서비스 변경 또는 장비 설치는 하지 않았습니다. root helper 구성/closure는
검사했지만 실제 root 서비스 실행은 검사하지 않았고 서비스 콜백은 fixture입니다.
완료 이력 기반 undo GUI, 보관 게시 crash window, 실제 운영 리소스 및 서비스,
브라우저 GUI/IME 등은 남아 있습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 기존 PostgreSQL 복원 GUI/API/helper에 전체 include graph 연결 및 DEB 검증

기존 복원 검토/실행 요청을 full graph coordinator에 연결했습니다. 원본 백업에
기록된 include 파일의 수정·생성·제거를 함께 검토하고, 변경 파일 목록을 GUI에
표시합니다. 확인된 적용 또는 롤백 뒤 이력을 보관하고 active intent를 해제합니다.
완료 기록 ID를 표시하며 일반 undo 백업이 생성되었다고 표시하지 않습니다.

전체 회귀 933 PASS, PostgreSQL 18 격리 native fixture 6개 PASS, production build
및 `package:verify -- --terminal` PASS. 새 관리자 모듈 11개의 helper closure와
패키지 소스 동일성을 검증했습니다. 351개 PostgreSQL 설명의 10개 언어도 패키지
검사에서 모두 확인했습니다.

패키지: `dist/tastedev-linux_0.1.0_amd64-postgresql-graph-restore.deb`.
SHA-256: `fcf5e0ac4fdb81e7ab6aee05fbd28632908bc443bca6baa454c9ba03e776bacb`.
이전 기본 패키지를 보존하고 검증된 산출물로 기본 dist 파일을 갱신했습니다.
증거: `.runtime/verification/postgresql-graph-restore-integration-delivery-20261005.json`.

장비 설치나 운영 DB/서비스 변경은 수행하지 않았습니다. 서비스 콜백은 fixture이며
독립 graph recovery의 GUI/API/helper 연결, 이력 기반 undo UI, 보관 게시 crash
window 및 실제 운영 검증은 남아 있습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 확인된 복원/복구 후 완료 기록 자동 보관 (source)

내부 restore/recovery coordinator에 lease를 사용하는 자동 완료 기록 보관을
연결했다. 적용 또는 원본 복구 확인 뒤 active slot을 비우며 이력은 모두
보존한다. 같은 경로의 연속 복원 및 보관 방해 시 이미 확인된 activation과
retention 실패를 구분하는 검사를 추가했다. 관련120 regression 및 최종16 focused
PASS. PostgreSQL 18 native/SIGKILL/새 프로세스 복구/자동 보관 5개 fixture PASS.
proof: `.runtime/verification/postgresql-automatic-retention-source-20261005.json`.

서비스 콜백은 fixture이고 외부 GUI/API/helper에는 아직 미연결이다. 보관 게시
crash window와 운영 리소스 검증·패키징은 남아 있다. 운영 DB/서비스 변경 없음.
전체 목표 PARTIAL. 아래는 이전 이력이다.

## 2026-10-05 완료 복원 intent 보존 및 active slot 해제 (source)

완료 progress에 binding된 journal을 원본 byte/hash·identity 확인 후 completed
영역에 보관하는 함수를 추가했다. committed/rolled-back만 허용하고 진행 중인
기록을 거부한다. active 위치를 비워 다음 검토를 허용하면서 원본/undo/progress
증거를 삭제하지 않는다. 집중119 tests PASS. PostgreSQL 18 native 및 실제
writer SIGKILL→새 process 복구의 4개 fixture 모두 완료 기록 보관까지 PASS.
proof: `.runtime/verification/postgresql-retained-intent-source-20261005.json`.

자동 보관 coordinator 호출·게시 중 crash window·기존 복원 GUI/API/helper 연결은
아직 미완료다. 운영 DB/서비스 변경이나 신규 패키징 없음. 전체 목표 PARTIAL.
아래는 이전 이력이다.

## 2026-10-05 실제 PostgreSQL 복원 writer 종료/새 프로세스 복구 검증

host verifier에 writer/recovery 전용 subprocess를 추가했다. 실제 writer를
activation 단계에서 SIGKILL하고 새 프로세스가 v3 journal을 다시 읽어 원본
PostgreSQL native namespace 검수·여러 파일 복구·설정값 확인을 수행했다.
commit/활성화 실패/재현 checkpoint/실제 SIGKILL 4개 시나리오 PASS.
proof: `.runtime/verification/postgresql-real-process-recovery-20261005.json`.

fixture 직접 호출의 캡처된 빈 directory lease만 정확한 child 종료 후 제거했다.
설치 helper kernel lock·실제 운영 서비스·다른 crash window의 검증은 아니다.
서비스 콜백은 fixture이며 운영 DB/서비스 변경 및 신규 패키징 없음.
GUI/API/helper 연결·전체 운영 리소스 검증 등 전체 목표 PARTIAL.
아래는 이전 이력이다.

## 2026-10-05 v3 journal 기반 독립 서비스 복구 coordinator (source)

원래 process-local 검토 없이 다시 읽은 v3 journal을 사용하는 복구 실행을
추가했다. 기록된 원본 include graph를 비공개 fixture로 재구성해 실제 native
namespace 검수한 뒤 service scope 확인·파일 복구·고정 unit 재시작·원래 값
검증을 수행한다. 서비스 data scope 변경은 파일 교체 전 거부한다.
집중117 tests 및 PostgreSQL 18 native checkpoint 복구 fixture PASS.
proof: `.runtime/verification/postgresql-independent-recovery-source-20261005.json`.

중단 상태는 완료된 swap의 activation checkpoint를 재현한 것이다. 실제 kill/
재시작 및 운영 서비스 활성화 증거가 아니다. GUI/API/helper 연결과 운영 리소스,
전체 crash window 검증·패키징은 남아 있다. 운영 DB/서비스 변경 없음.
전체 제품 목표 PARTIAL. 아래는 이전 이력이다.

## 2026-10-05 원래 서비스 proof를 포함한 PostgreSQL v3 intent (source)

복원 검토의 서비스 대상/PID·시작값/원래·후보 실행값/검토 버전을 파일 snapshot과
같은 v3 journal에 원자적으로 저장한다. 기존 v1/v2 reader와 구문 검증을 유지하고
서비스 unit/설정 경로 불일치 및 알 수 없는 metadata를 거부한다. 검증된 journal
reader의 context는 복사본으로 반환하며 원본 등록 기록을 변조하지 않는다.
집중115 및 reader9 tests PASS, 실제 PostgreSQL 18 namespace를 포함한 파일 복원/
실패 복구 fixture PASS. proof: `.runtime/verification/postgresql-service-intent-source-20261005.json`.

운영 서비스 콜백은 fixture이며 GUI/API/helper·독립 중단복구 서비스 coordinator는
아직 연결 전이다. source 변경만 수행, 신규 패키징·운영 DB/서비스 변경 없음.
전체 제품 목표 PARTIAL. 아래는 이전 이력이다.

## 2026-10-05 PostgreSQL 여러 파일 복원 서비스 coordinator (source)

등록된 검토→journal→staging→파일 교체→고정 서비스 재시작→실행값 검증을
연결한 내부 실행 모듈을 추가했다. 실패 시 원본 파일 복구 후 원래 서비스
scope·실행값을 확인한다. 변경된 서비스 scope는 복구 재시작을 거부하며 기록을
보존한다. no-change 설정은 journal과 재시작을 생략한다. 집중110 tests PASS.
실제 PostgreSQL 18 namespace와 파일 교체의 성공/실패 복구 통합도 PASS.
proof: `.runtime/verification/postgresql-reviewed-coordinator-source-20261005.json`.

서비스 활성화·조회는 fixture 콜백이며 실제 운영 재시작 증거가 아니다.
GUI/API/helper, durable 원래 서비스 proof·중단복구 연결 및 운영 리소스 검증은
아직 미완료다. 운영 DB·서비스 변경/신규 패키징 없음. 전체 목표 PARTIAL.
아래는 이전 이력이다.

## 2026-10-05 PostgreSQL 검토 snapshot → durable intent 연결 (source)

복원 검토에 등록된 snapshot으로만 journal을 생성하는 연결을 추가했다.
게시 전후 파일·서비스·journal identity를 다시 검사하고, 중복 기록은 보존한다.
게시 후 서비스 충돌은 운영 파일 변경 없이 journal ID와 intent 보존 오류로
보고한다. 묶음 백업/snapshot/journal/staging/swap 집중106 tests PASS.

실제 PostgreSQL 18 native 검수를 사용하는 fixture에서도 review→journal→stage→
swap과 활성화 콜백 실패 후 원본 graph/옵션/phase 복원 PASS.
proof: `.runtime/verification/postgresql-reviewed-journal-source-20261005.json`.
서비스 콜백은 fixture이며 운영 DB·서비스 변경 없음. GUI/API/helper, durable
원래 서비스 proof 및 실제 서비스/리소스 검증 연결은 아직 미완료다.
신규 패키징 없음. 전체 제품 목표 PARTIAL. 아래는 이전 이력이다.

## 2026-10-05 PostgreSQL 여러 파일 복원 검토 연결 (source)

묶음 백업의 원래 service scope, 현재 실행 서비스 identity, 여러 파일 snapshot,
네이티브 검수 옵션을 묶는 내부 검토 모듈을 추가했다. 검수 중 파일/서비스 변경,
검토 이후 파일/서비스 변경과 검토 객체 변조를 거부한다. 집중78 tests PASS.
실제 PostgreSQL 18 namespace와 multi-file swap을 함께 실행해 파일 수정·생성·
제거 및 활성화 콜백 실패 후 원본 graph/옵션/phase 복원을 확인했다.
proof: `.runtime/verification/postgresql-graph-review-source-20261005.json`.

서비스 콜백은 fixture다. 운영 DB·서비스 변경 없음. 새 검토 모듈의 GUI/API/helper
연결, 실제 서비스/리소스 검증과 새 패키징은 아직 수행하지 않았다.
기존 검증 패키지 47d29f79f1b1… 유지. 전체 목표 PARTIAL. 아래는 이전 이력이다.

## 2026-10-05 PostgreSQL 설치 바이너리 호환성 배포 후보

실행 파일 검증 모듈과 관리자 helper 허용 목록 보완을 새 deb에 반영했다.
최신 소스 production build 및 package --terminal 검증 PASS. 모든 관리자 모듈과
helper의 현재 소스 바이트 동일성도 검사한다. source 회귀917 tests PASS.
패키지 SHA-256: `47d29f79f1b1ff6ddb91776c2dbc1e968bd7011b7af7c525554534449a94d807`.
기본 이름과 `dist/tastedev-linux_0.1.0_amd64-postgresql-host.deb`에 보관했고
기존 기본 패키지를 보존했다. proof: `.runtime/verification/postgresql-host-delivery-20261005.json`.

패키지는 설치하지 않았다. 실제 PostgreSQL 18 namespace 검수는 source의
임시 설정 범위이고, 패키지 검증은 HTTP/PTY/SSR/모듈 동일성 범위다.
운영 서비스·DB·설정 변경 없음. 설치 GUI/IME·root 복원 coordinator 및 운영
리소스 검증 등 전체 제품 목표는 여전히 PARTIAL이다. 아래는 이전 이력이다.

## 2026-10-05 설치된 PostgreSQL 18 격리 검수 보완 (source)

설치된 PostgreSQL 18.6의 실제 bubblewrap 검수에서 UID/GID와 5개 옵션,
include/include_dir 적용 순서, 선택 파일 누락, 잘못된 설정 이름·값 거부 및
fixture 원본 보존·후보 정리를 확인했다. Ubuntu Rust coreutils의 고정 id 링크와
root 소유 multicall 대상을 검증하는 모듈을 추가했고 helper/패키징 모듈 허용
목록을 함께 수정했다. 일반 실행 파일의 링크 제한은 유지한다.

집중16 및 전체917 tests PASS. 명령: `npm run verify:postgresql:host -- 18`.
proof: `.runtime/verification/postgresql-host-source-20261005.json`.
이번 변경은 source 상태이며 새 deb나 대상 서버 설치는 수행하지 않았다.
운영 DB·서비스·설정을 변경하지 않았다. root helper 계정 실행, 운영 리소스,
auto.conf, 서비스 복원 coordinator, 설치 GUI 검증은 여전히 미완료다.
전체 제품 목표 PARTIAL. 아래는 이전 이력이다.

## 2026-10-05 다국어 설명 및 터미널 입력 검증 배포 후보

10개 UI 언어의 PostgreSQL 설정 351개 설명과 공통 아이콘/IME 키 처리, 대화형 셸 입력 표시 변경을 포함한 새 deb를 생성했다. 기본 계정 프로필 초기화가 약 3초 걸리는 실제 재현을 근거로 패키지 검증의 고정 약 2초 대기를 최대 10초로 수정했다. 실행 중인 job과 실제 준비 출력·Enter 전 입력·Enter 후 단일 실행 확인은 유지한다.

전체914 tests, production build, UI 번역 검사, package --terminal HTTP 검증 PASS. 설명 원본·출처·라이선스와 터미널 런타임 파일의 패키지 동일성도 검사했다. deb는 기본 이름 및 `dist/tastedev-linux_0.1.0_amd64-multilingual-terminal.deb`; SHA-256 `a9c01da08f9a554f0b072e50dd9fd31bbebc4f793d47bc522f9c5198d772c79f`. 이전 배포물을 보존했다. proof: `.runtime/verification/multilingual-terminal-delivery-20261005.json`. 장비에 설치하지 않았고 운영 서비스·설정은 변경하지 않았다. 설치 GUI/IME와 실제 PostgreSQL native scope 및 복원 coordinator 등 전체 제품 범위는 여전히 PARTIAL이다. 아래는 이전 이력이다.

## 2026-10-05 PostgreSQL 설정 설명 다국어 보완

현재 번역 UI 10개 언어(ko/en/ja/zh/es/fr/de/ru/pt/ar)에 PostgreSQL 18의 가져온
348개 설정과 include 계열 지시문 3개 설명을 제공한다. 지역 코드와 설정 이름의
대소문자도 처리하며, 번역 설명 검색과 원본 주석 보존을 유지한다.
기타 Linux 로캘은 영어 설명을 사용하고 알 수 없는 확장 설정은 설명 미제공을
안내한다. 모든 로캘·확장 모듈의 완전 번역으로 해석하지 않는다.

집중12 tests 및 임시 작업 폴더의 Next.js production build PASS.
proof: `.runtime/verification/postgresql-description-complete-20261005.json`.
설치 GUI/브라우저 시각 검증·새 deb/대상 서버 설치는 수행하지 않았다.
현재 검증 배포물은 변경하지 않았으며 전체 제품 목표 PARTIAL이다. 아래는 이전 이력이다.

## 2026-10-05 PostgreSQL 실행 중 준비 기록 binding (source)

교체 실행은 ready stage의 hash·전체 file identity를 잠금/검수 전후에 고정하고 progress 게시 및 서비스 콜백·복구 경계마다 같은 intent/stage인지 재검사합니다. 같은 내용의 다른 inode·재계산 digest의 변조·삭제·unknown hardlink를 기존 검토로 승인하지 않습니다. 문제가 있으면 committed/rolled-back 성공 단계로 게시하지 않고 기존 progress·원본·후보를 보존합니다.

집중75 및 전체907 tests PASS. 검수/활성화/검증/복구의 16개 metadata obstruction fixture를 포함합니다. proof: `.runtime/verification/postgresql-stage-binding-source-20261005.json`. native/service/GUI/helper 연결, 원래 service/resource scope, 전체 crash window·보관 정리 및 패키징은 미완료입니다. 신규 deb/설치 없음, 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca` 유지. 전체 목표 PARTIAL.

## 2026-10-05 PostgreSQL in-process rollback 전체 원본 검사 (source)

실패 후 원본 복원을 시작하기 전에 unchanged 참조 파일·target·undo·남은 stage와 include_dir membership을 모두 검토합니다. 외부 수정·unknown hardlink·원본 손상은 후보를 이동하거나 다른 행을 되돌리기 전에 거부하며 마지막 progress와 보관 원본을 유지합니다. 정상 복구는 기존 경로로 진행합니다.

집중59 및 전체891 tests PASS. 실제 /tmp 파일 fixture의 before-only 참조/목록 변경, 먼저 처리된 후보/undo 변경, unknown alias 보존을 검사했습니다. proof: `.runtime/verification/postgresql-rollback-preflight-source-20261005.json`. native/service/GUI/helper 연결과 in-process stage ledger binding·원래 service/resource scope·보관 정리·패키징은 남았습니다. 신규 deb/설치는 없으며 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca` 유지, 전체 목표 PARTIAL입니다.

## 2026-10-05 터미널 대화형 입력 표시 / PostgreSQL 원본 include graph (source)

대화형 account-shell·Bash·Codex·Claude PTY에 echo always를 적용했습니다. 실제 Bash·sh에서 Enter 이전 영문·한글 표시 및 단일 실행, 프로그램의 비밀번호 에코 해제를 확인했습니다. 기존 세션은 보존하며 새 터미널 탭부터 적용됩니다. 명령/출력 작업의 echo never는 유지합니다. 브라우저 한영 전환/IME 검증은 별도입니다.

PostgreSQL 복원 snapshot은 백업 graph와 현재 원본 include graph의 합집합을 캡처하며 원본에서만 참조하는 파일은 보존합니다. 필수 include 누락/범위 외 참조/순환은 incomplete로 기록합니다. v2 intent는 같은 탐색기로 원본 graph를 재검증하고 legacy v1은 complete=false로 구분합니다. 운영 resource/service scope와 fixed native coordinator 연결은 미완료입니다.

터미널 집중16, PostgreSQL 집중73, 전체886 tests와 literal 번역 검사 PASS. proof: `.runtime/verification/terminal-echo-and-pg-before-graph-source-20261005.json`. 신규 build/deb·설치 GUI 검증은 수행하지 않았습니다. 배포 SHA-256은 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca` 그대로입니다. 전체 제품 목표 PARTIAL.

## 2026-10-05 PostgreSQL 새 프로세스 filesystem rollback primitive (source)

등록 v2 progress와 실제 target/undo/stage/retired의 inode/hash/권한·정확한 hardlink alias를 대조해 중단된 원본 복구를 수행합니다. 변경 전 모든 파일/membership을 검토하고 역순으로 no-overwrite 복구하며 private 진행을 fsync/atomic 갱신합니다. 외부 수정/unknown alias는 보존하고 거부합니다. 검수 실패는 rolling-back을 유지하며 committed를 자동 되돌리지 않습니다.

집중58 tests 및 literal 번역 검사 PASS. 실제 writer subprocess SIGKILL at activating 및 새 프로세스 파일 복구, 여섯 개 rename/link/unlink checkpoint fixture, runtime 실패 재시도와 외부 파일 보존을 확인했습니다. 최종 전체873 tests PASS. source proof `postgresql-swap-recovery-source-20261005.json`. 종료가 확인된 정확한 fixture inode의 빈 lock만 테스트에서 명시적으로 정리했으며 production unknown lock 자동 삭제는 없습니다. root/helper kernel lock/PG 다른 UID/native service/전원 중단/설치 GUI 증거는 아닙니다.

durable 원래 service/runtime scope·before include graph 전체 capture와 fixed native coordinator, 초기 게시 alias/더 많은 전원 중단 구간, 보관 정리·GUI/API/helper 연결·패키징이 남았습니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL private swap progress reader (source)

ready private stage에서 원래 target 상태를 가정하지 않는 recovery context와 closed-schema v2 progress reader를 추가했습니다. producer도 같은 validator와 정확한 stage ledger 버전을 기록합니다. 기록의 intent/target/행 순서/UUID undo basename/진행 flags·단계 불변 조건, bounded private FD/bytes/hash를 검사하고 stage/intent를 다시 확인합니다. WeakMap 등록 proof와 디스크 재확인으로 복사/변조·후속 변경을 거부합니다. 공개 summary는 실제 복구 검증이 false임을 표시하며 원문을 포함하지 않습니다.

집중44 tests 및 literal 번역 검사 PASS. 실제 새 Node 프로세스 readback과 재계산 checksum의 foreign path/잘못된 flags/추가 field, 권한/hardlink/후속 stage 변경 보존을 확인했습니다. 최종 전체859 tests PASS. source proof `postgresql-swap-progress-source-20261005.json`. filesystem rollback 재개/SIGKILL/native/root/설치 GUI 증거는 아닙니다.

새 프로세스 filesystem reconciliation/rollback, 전체 crash window·보관 정리, native/service snapshot coordinator 및 GUI/API/helper 연결·패키징이 남았습니다. source v1 progress는 자동 삭제/승격 없이 거부합니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 여러 파일 교체·실패 원상 복구 primitive (source)

ready stage를 변경/생성/제거하는 내부 실행 primitive를 추가했습니다. 원본을 UUID undo로 보관하고 후보는 no-overwrite hardlink로 게시합니다. private progress에 단계별 상태를 보관하고 전체 파일/membership 검수 뒤 trusted 서비스 콜백을 호출합니다. 실패 시 원본을 역순 복구·재검수하며 외부 수정 target은 덮어쓰지 않습니다. 성공/실패 뒤 intent/progress/undo는 보존하며 swap 기록이 있으면 intent 삭제를 막습니다.

집중33 tests 및 literal 번역 검사 PASS. /tmp에서 실제 여러 파일 교체/추가 conf 제거/누락 파일 생성/활성화·검수 실패 복구/외부 수정 보존을 확인했습니다. 최종 전체848 tests PASS. source proof `postgresql-graph-swap-source-20261005.json`. 서비스 콜백 fixture이며 실제 native/root/운영 DB/SIGKILL/설치 GUI 증거는 아닙니다.

progress reader·새 프로세스 interrupted 복구/전체 crash window, 성공·복구 뒤 보관 정리 및 고정 native/service coordinator·GUI/API/helper 연결·패키징이 남아 있습니다. 새 build/deb는 만들지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 준비 완료 후보 취소·정리 (source)

ready 후보를 private700 custody로 FD 기준 이동한 뒤 기록된 inode/내용/권한을 재확인해 정리하는 내부 함수를 추가했습니다. 직접 생성한 빈 디렉터리만 역순으로 제거합니다. 변조된 후보나 unrelated 파일은 보존하고 private 진행/intent도 유지합니다. rename/unlink 후 checkpoint 전 중단 상태를 재개하며 운영 target 원문은 교체하지 않습니다.

집중25 tests 및 literal 번역 검사 PASS. 정상 취소·생성 디렉터리 정리·변조/외부 파일 보존·중단 checkpoint fixture를 포함합니다. 최종 전체840 tests PASS. source proof `postgresql-stage-cancel-source-20261005.json`. 실제 writer SIGKILL/전원 중단/root와 PG 계정이 다른 환경/native/service/설치 GUI 검증은 아닙니다.

준비 중 기록 없는 생성/디렉터리 chown 중단, 게시 hardlink crash, 기록 삭제 후 빈 custody orphan 정리, 서로 다른 파일시스템 정책, 실제 여러 파일 교체/실패 복구/GUI/API/helper 연결이 남았습니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 target 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 중단된 임시 파일 준비 재개 (source)

preparing 기록을 명시적으로 재개하는 내부 함수를 추가했습니다. 완료 temp는 전체 내용·identity·권한이 같아야 하고 pending temp는 기록된 inode와 후보 바이트 prefix·허용 소유자/권한이 일치해야만 같은 FD에 원문을 완성합니다. 기록이 없는 기존 이름, 내용/inode 변조는 보존하고 거부합니다. 원래 설정 파일은 교체하지 않습니다.

집중19 tests와 literal 번역 검사 PASS. 실제 새 Node 프로세스가 private journal을 검증해 재개하는 검사 및 변조 보존을 포함합니다. 최종 전체834 tests PASS. source proof `postgresql-stage-resume-source-20261005.json`. 실제 writer SIGKILL, root/PG 계정이 다른 환경, native/service 및 설치 GUI 검증은 아닙니다.

임시 파일/생성 디렉터리 안전한 정리, inode 기록 전 중단과 chown 중간 상태 재개, 여러 파일 교체/실패 복구 및 GUI/API/helper 연결이 남았습니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 target 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 임시 복원 부모 디렉터리 FD 고정 (source)

인접 후보 파일/새 부모 생성과 ready 파일 검증을 열린 부모 디렉터리 FD 기준으로 변경했습니다. 모든 조상을 O_DIRECTORY/O_NOFOLLOW로 유지하고 snapshot/생성 기록 및 현재 이름 경로와 비교합니다. 부모가 심볼릭 링크나 다른 디렉터리로 교체돼도 교체된 경로로 쓰지 않고 변경을 거부합니다. 새 부모의 chown 전 실행 계정 소유와700 권한도 확인합니다.

집중13 tests와 literal 번역 검사 PASS. 실제 /tmp 부모 교체 fixture 두 가지를 포함합니다. 최종 전체828 tests PASS. source proof `postgresql-stage-pinned-source-20261005.json`. 실제 root/PG 계정이 다른 환경·native/service·writer SIGKILL·설치 GUI 증거는 아닙니다.

여러 파일 교체/실패 복구/중단 재개·정리 및 GUI/API/helper 연결이 남았습니다. 새 production build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 target 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 복원 인접 임시 파일 준비 기반 (source)

persistent intent에서 private stage ledger를 게시하고, 후보의 인접 temp 이름·생성 inode·내용 hash·소유 계정/권한·ready 상태를 fsync와 atomic ledger 갱신으로 보관하는 모듈을 추가했습니다. 없어진 부모는 trusted UID/GID의700 디렉터리로 준비하고 target 파일은 absent/원본 상태를 유지합니다. 준비 전/각 단계/완료 때 원본 파일·부모·membership·intent를 재확인합니다. ready inspect는 temp 내용/identity/권한을 확인하며 변조 파일/기록은 보존합니다. stage 기록이 있으면 intent를 지우지 못하게 했습니다.

집중11·전체826 tests 및 literal 번역 검사 PASS. /tmp에서 실제 temp 및 missing parent를 만들고 target unchanged/변조 보존/intent 삭제 보호를 확인한 source fixture 증거입니다. 실제 root/PG 계정이 다른 환경, parent named-path race, writer SIGKILL/native/service/설치 GUI 증거는 아닙니다. source proof `postgresql-graph-stages-source-20261005.json`, 상세 `docs/postgresql-graph-restore-stages.md`.

root 연결 전 descriptor 기반 부모 고정/race 검증이 필요합니다. stage 게시 중단/pending 재개·정리, 실제 여러 파일 교체/실패 undo·서비스 재검증/interrupted recovery 및 완료 cleanup·GUI/API/helper 연결이 남아 있습니다. 이번 단계에서는 production build/deb를 새로 만들지 않았고 기존 검증 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/서버 설치 변경은 없으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 여러 파일 복원 persistent intent 기반 (source)

등록된 snapshot의 원본/후보 원문·UID/GID/권한·FD identity, 부모 디렉터리 상태, include_dir membership 및 대상 버전을 private intent 파일로 보관하는 내부 모듈을 추가했습니다. 파일/디렉터리 fsync와 atomic link 게시를 사용하고 기존 기록을 덮어쓰지 않습니다. 게시 전 snapshot을 재확인합니다. 새 프로세스에서 디스크 기록을 검증·등록할 수 있으며 공개 summary에는 원문이 없습니다. 등록 read/정확한 private root·trusted 옵션·현재 identity/version 일치 때만 지웁니다. 수정된 기록과 알 수 없는 hardlink는 보존하고 거부합니다. 게시 후 UUID 임시 link 정리 전 종료 구간을 fixture로 모사해 안전한 alias 정리를 확인했습니다.

집중12·전체821 tests 및 literal 번역 검사 PASS. 실제 새 Node 프로세스의 readback을 검사했지만 실제 writer SIGKILL/native/root/클러스터/설치 GUI 검사와는 다릅니다. source proof `postgresql-graph-restore-journal-source-20261005.json`, 상세 `docs/postgresql-graph-restore-journal.md`.

아직 native/service snapshot·staged inode·단계별 진행 및 여러 파일 교체/실패 복원/중단 복구 executor, GUI/API/helper에 연결하지 않았습니다. 이번 단계에서는 production build/deb를 새로 생성하지 않았고 기존 검증 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 파일/서비스/서버 설치 변경은 없습니다. 전체 목표 PARTIAL이며 나머지 범위를 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 여러 파일 복원 snapshot 기반 (source)

검증·등록 archive에서 여러 파일 복원 대상을 읽는 내부 모듈을 추가했습니다. 원래 파일의 생성/변경/동일, 현재 include_dir의 추가 conf 파일 및 원래 없던 선택적 파일의 제거를 검토합니다. 현재 필수 원본/디렉터리가 없어도 검토를 구성하고 정확한 현재 원문/소유 계정/권한/FD identity를 내부 undo 입력으로 보관합니다. 공개 snapshot은 경로/action/hash/membership만 포함합니다. 생성 중 전체 재확인과 검토 후 재확인으로 파일·권한·부모 inode·membership·선택적 부재 변경을 감지합니다. unrelated hidden/non-conf 파일은 보존합니다. 복사/변조 snapshot을 거부하고 내부 원문 accessor는 deep copy를 반환합니다.

집중19·전체815 tests 및 literal 번역 검사 PASS. 상세 `docs/postgresql-graph-restore-snapshot.md`, source proof `postgresql-graph-restore-snapshot-source-20261005.json`. 아직 GUI/API/helper에 연결하지 않았고 운영 여러 파일을 교체하지 않습니다. 이번 단계에서는 production build/deb를 새로 만들지 않았으며 기존 검증 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다.

persistent 여러 파일 journal/undo/교체/실패 복원/중단 복구와 삭제 디렉터리 생성 정책, 서비스 검수·GUI/API/helper 연결이 남아 있습니다. 현재 주 설정 복원은 include drift를 계속 거부합니다. native/root/클러스터/설치 GUI/E2E 및 나머지 전체 목표 PARTIAL입니다. 운영 파일/서비스/서버 설치 변경은 없습니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 묶음 보관·복원 후보 검수 연결 및 deb 반영

private archive reader가 검증·등록한 snapshot에서 주 설정/모든 include 원문·include_dir 순서/빈 디렉터리·선택적 파일 부재를 private 임시 경로에 재구성합니다. 운영 include 파일이 변경/삭제되거나 새 파일이 생겨도 후보는 보관 당시 graph와 정확히 같아야 합니다. 복사/변조 record를 거부하고 기존 namespace 검수 coordinator와 연결해 고정5개 공개 값만 반환합니다. 후보와 archive snapshot을 재확인하고 성공/실패에 정리하며 교체된 임시 경로는 삭제하지 않습니다.

graphArchive가 있는 일반 전체 코드 복원의 기본 root 검수에 이 경로를 연결했습니다. trusted source fixture validator와 이전 백업의 검수 경로는 유지합니다. 앞서 source에서 추가한 archive capture/파일 UID/GID/권한 보관/적용 백업 참조/복원·중단 복구 reader 검증도 이번 deb에 포함했습니다.

집중27·전체809 tests, production build, literal 번역 검사 및 격리 package:verify --terminal PASS. 실제 패키지 HTTP의 복원 인증/정책 차단 및 module closure를 확인했으나 root/native 복원 실행은 하지 않았습니다. evidence `package-2026-10-05T06-40-42.235Z.json`, source proof `postgresql-archive-candidate-integration-source-20261005.json`.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-archive-candidate.deb` 및 기본 이름, SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`. 장비에 설치하지 않았고 운영 파일/서비스/서버 설치 변경은 없습니다. 후보 재구성은 운영 파일 복원이 아니며 현재 복원 planner는 변경된 include graph를 계속 거부합니다. 여러 파일 transaction/실패 복원/중단 복구, archive 목록/retention, 실제 native/root/설치 GUI/E2E 및 나머지 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 설정 묶음 보관 및 적용 백업 연결 (source)

등록 config graph의 주 설정과 모든 include 원문·파일 UID/GID/권한·hash, include 순서/관계, include_dir 이름 순서와 선택적 파일 부재를 private graph archive에 보관하는 내부 모듈을 추가했습니다. 전체 코드 적용 백업에 UUID/digest/크기/graphVersion만 든 참조를 연결했습니다. 큰 원문을 기존 작은 context에 넣지 않고 private700/600 `graphs/<UUID>.json`으로 분리합니다. capture 전후 registered graph를 재확인하고 private reader에서 digest/FD/파일 동일성·권한·경로·원문 hash를 검사합니다. 복원/중단 복구 백업 reader는 참조가 있으면 묶음과 main 원문 일치도 확인합니다. 참조 없는 이전 백업은 유지합니다. 브라우저·터미널에 묶음 원문을 반환하지 않습니다.

집중34·전체803 tests 및 literal 번역 키 검사 PASS. graph source1MiB 한도 내 JSON escape가 일반 백업보다 커지는 경우도 exact bytes 보존을 확인했습니다. 이번 단계에서는 production build/deb를 새로 만들지 않았으며 기존 검증 배포 SHA-256 `99ba606cf2a3aab843f257c37b9f8be02f0756946a0f6ebc32943c2d50798d86`을 유지합니다. source evidence `postgresql-graph-archive-source-20261005.json`, 상세 `docs/postgresql-graph-archive.md`.

보관된 여러 파일을 함께 교체하는 복원 transaction 및 중단 복구는 아직 없습니다. 기존 복원은 변경된 include graph를 계속 거부합니다. 실패 후 참조되지 않은 private archive의 목록/retention도 남았습니다. 실제 native/root/클러스터 적용·복원·설치 GUI/E2E, archive 변경 패키지 반영 및 나머지 전체 목표는 PARTIAL입니다. 운영 파일/서비스/서버 설치 변경은 없습니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 백업 전체 코드 복원 GUI/API/helper 연결

복구 페이지 및 PostgreSQL IDE의 기존 백업 복원 화면에 새 서버 검토/복원 모듈을 연결했습니다. private context가 있는 백업은 main/include graph·실행 서비스·백업 전체 기록 digest를 확인하고 명시적 확인 후 복원합니다. 공개 표에는5개 runtime/candidate 값만 표시하며 백업 원문을 보내지 않습니다. 새 검토 실패는 기존 복원 경로로 우회하지 않습니다. context 없는 옛 백업의 일반 복원 경로는 유지합니다. 대상/정책/연결 변경 때 검토/확인을 무효화하고 중복 실행 및 늦은 응답을 막습니다.

새 두 POST API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt와 schema를 검사합니다. root helper의 고정 UID lookup/백업 경로와 checksum module closure를 사용합니다. 적용은 현재 설정의 새 private 백업·기존 transaction·클러스터 재시작/실패 원본 복원 및 외부 변경 보존 규칙을 재사용합니다. 터미널은 구조화한 상태/백업 ID만 기록합니다. 신규 문구 en/ja/pt 및 literal 번역 검사 PASS.

집중22·전체796 tests, production build, 격리 package:verify --terminal PASS. 실제 패키지 HTTP에서 새 복원 API의401/cross-origin403/비활성 DB 권한403을 확인했습니다. 이 HTTP 검사는 root/native 복원 실행을 하지 않았습니다. source evidence `postgresql-code-restore-integration-source-20261005.json`, package evidence `package-2026-10-05T06-19-40.301Z.json`.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-code-restore.deb` 및 기본 이름, SHA-256 `99ba606cf2a3aab843f257c37b9f8be02f0756946a0f6ebc32943c2d50798d86`. 장비에 설치하지 않았으며 운영 파일/서비스/서버 설치 변경은 없습니다. 포함 파일의 내용까지 백업/복원하는 묶음 기능은 아직 없어 포함 파일이 백업 당시와 달라졌다면 새 경로는 거부합니다. 실제 PostgreSQL native/root 소유권/클러스터 복원·설치 GUI/E2E, 전체 번역·공개 APT/desktop·AI 실연동 및 나머지 실환경 검증을 포함한 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 백업 전체 코드 복원 서버 모듈 기반

새 `lib/postgresql-code-restore.mjs`는 private 백업 원문을 클라이언트에 노출하지 않고 기존 main/include graph 검수·실행 서비스 확인·원본 백업·재시작/실패 복원 transaction을 재사용합니다. 백업 기록 전체 digest와 현재/후보 graph·서비스·원문 버전에 묶인 검토값 및 명시적 확인을 요구합니다. 검수와 서비스 확인 전후 백업을 다시 읽어 교체를 거부합니다. 후보 graph가 백업 당시 graph와 같아야 하므로 포함 파일 변경은 거부합니다. include 원문을 함께 보관하고 되돌리는 백업 묶음 기능은 아직 없습니다.

집중10 및 전체790 tests PASS. 임시 파일과 서비스/검수 fixture로 검사했으며 실제 native 클러스터/root 소유권/설치 GUI는 미검증입니다. GUI/API/helper에는 아직 연결하지 않았고 이번 단계에서는 production build 및 새 deb를 만들지 않았습니다. 기존 검증 배포 SHA-256 `0170007c2515ba626eb8b022bcd7ac8ae2614be7e13c641ba9834100d86659c4`을 유지합니다. source evidence `postgresql-code-restore-source-20261005.json`; 상세 `docs/postgresql-code-restore.md`. 운영 파일/서비스/서버 설치는 변경하지 않았으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 중단 복구 GUI/API/helper 연결

복구 페이지와 PostgreSQL IDE의 복원 팝업에 중단 복구 검토·확인·실행을 연결했습니다. 복구 페이지에서는 실제 클러스터 main 파일 목록을 명시적으로 조회하고 선택하며 IDE에서는 선택된 main 파일을 기본 대상으로 사용합니다. 연결 변경은 기존 목록/선택을 지우고 대상/정책/연결 변경은 검토/확인을 무효화합니다. 중복 실행 및 늦은 응답을 막고 복구 후 목록을 갱신합니다. 기존 일반 백업 복원과 HBA 경로를 유지합니다.

두 POST API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt와 path/확인 digest만 허용하는 schema를 검사합니다. root helper는 서버 계정 lookup과 checksum module closure를 사용하며 UID/명령/기준 경로를 요청으로 지정하지 못합니다. 종료/실패 상태를 포함한 backend 복구와 private 원래 graph/runtime context를 배포에 포함했습니다. 터미널은 구조화한 복구 상태와 백업 ID만 기록합니다. 새 문구는 en/ja/pt에 추가했습니다.

관련33 tests, 수정 후 화면 연결2 tests, 최종 전체785 tests, production build, literal 번역 키 검사 및 격리 package:verify --terminal PASS. 첫 전체784/1은 신규 IDE 복원 팝업 fixture의 postgresql-backups 응답 누락이었으며 수정 후 전체를 다시 검사했고 실패 로그도 보존했습니다. 실제 패키지 HTTP에서 중단 복구 두 API의401·cross-origin/비활성 DB 권한403을 확인했습니다. 이 작은 복구 요청 검사와 전체 코드 API의8KiB 초과 요청 검사를 최종 evidence에서 별도 항목으로 기록했습니다. root/native 복구 실행은 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-code-recovery.deb` 및 기본 이름, SHA-256 `0170007c2515ba626eb8b022bcd7ac8ae2614be7e13c641ba9834100d86659c4`, evidence `package-2026-10-05T06-00-51.653Z.json`, source hash `postgresql-code-recovery-integration-source-20261005.json`. 현재 PostgreSQL16 binary 존재 확인은 false이며 native namespace·실제 클러스터 적용/복구·root 소유권 유지 교체·설치 브라우저 GUI/E2E는 미검증입니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았고 전체 목표 PARTIAL입니다. whole graph 백업 복원/include 파일 단독 적용, 전체 번역·공개 APT/desktop·AI 실연동 및 나머지 실환경 검증 범위를 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 중단 복구 backend 기반

새 private 백업 context에 원래 graph 버전·클러스터 경로/unit/major·auto configuration 부재/hash와5개 공개 runtime 값을 보존합니다. 원문 없는 공통 journal 형식은 유지하며 context는 private 백업에만 넣습니다. 이 context를 사용해 정확한 backup/journal/current-original graph/service 상태에 묶인 중단 복구 검토와 원본 재검수·재시작·확인을 구현했습니다. 종료/실패한 loaded cluster unit의 MainPID/ControlPID0을 확인한 경우에도 복구를 준비하며 active 서비스의 조회 실패를 종료 상태로 대체하지 않습니다.

이미 원본이 복원된 경우 inode를 유지하고 서비스만 재시도합니다. 백업·참조 파일·서비스·auto configuration 변경, 확인 없는 복구 및 외부 편집을 거부합니다. 실패 시 원본과 journal을 보존하며 검증된 원래 경로/runtime 값과 graph를 확인한 경우만 기록을 정리합니다. 원문 교체로 바뀌는 디스크 설정 오류 수는 재시작 전 service identity에서 제외하고 재시작 후 오류0을 확인합니다. context 없는 구버전 백업은 보존하되 자동 중단 복구에 사용하지 않습니다.

관련22 tests와 최종 전체780 tests PASS. 첫 관련 검사에서 비밀값 assertion이 공개 private-config-options scope 문구를 오인했습니다. 실제 비밀값 기준으로 수정한 후 관련·전체를 재검사했고 실패 로그도 보존했습니다. 증거/source hash는 postgresql-code-recovery-source-20261005.json, 설명은 postgresql-code-recovery.md입니다.

현재 source-only backend 단계입니다. 관리자 helper/API/GUI 복구 연결 및 배포는 남아 있으며 이번 단계에서는 새 production build/deb를 생성하지 않았습니다. 기존 검증 deb는 PostgreSQL 전체 코드 적용 버전664afb2646a17c8550270d47f1e995c834de0b04457969a05f019198c0ab6cc6을 유지합니다. 실제 PostgreSQL native namespace·클러스터 적용/복원·root에서 소유권 유지 교체·설치 GUI/E2E는 미검증입니다. 운영 파일·서비스·대상 서버 설치 변경은 없으며 전체 목표 PARTIAL입니다. whole graph 백업 복원/include 파일 단독 적용, 전체 번역·공개 APT/desktop·AI 실연동 및 나머지 실환경 검증 범위도 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 GUI/API/helper 적용 연결

PostgreSQL main 파일의 GUI/코드 초안을 헤더 검수 팝업에서 검수하고 클러스터 재시작 영향 확인 후 적용하도록 연결했습니다. 원문·원본/후보 include graph·실행 서비스 snapshot의 검토 digest와 정확한 confirm을 전달합니다. 연결/정책/입력 변경 때 검토를 무효화하고 중복 실행·늦은 응답을 막습니다. pg_hba.conf는 기존 별도 경로를 유지합니다. include 파일 단독 전체 코드 적용은 지원하지 않으며 main 후보에 참조된 graph를 함께 검수합니다.

API/helper에서 로그인·동일 origin·databaseChanges·sudoWithoutPrompt, 1.6MB JSON/262144byte UTF-8 원문 한도를 검사합니다. 계정 UID는 고정 서버 lookup으로 구하고 요청의 기준 경로/UID/실행 명령을 거부합니다. 관리자 checksum module closure/작업 allowlist/보안 라벨과 실행 timeout을 연결했습니다. native 후보 검수·서비스/auto configuration 확인·private 원본 백업·클러스터 재시작·실패 시 복원을 재사용합니다. 터미널은 구조화한 검수/적용 상태와 백업 ID만 기록하며 원문·비밀값·native 상세 로그를 기록하지 않습니다. 새 문구는 en/ja/pt에 추가했습니다.

관련30 tests, 최종 전체773 tests, production build, literal 번역 키 및 격리 package:verify --terminal PASS. 실제 패키지 HTTP에서 PostgreSQL 코드 두 API의401·cross-origin/비활성 권한403과8KiB 초과 요청의 권한 검사 도달을 확인했습니다. 이 HTTP 검사는 root/native 실행을 하지 않았습니다. verifier 증거의 범위 이름에 PostgreSQL을 명시해 최종 검증 기록을 갱신했습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-code-operation.deb` 및 기본 이름, SHA-256 `664afb2646a17c8550270d47f1e995c834de0b04457969a05f019198c0ab6cc6`, evidence `package-2026-10-05T05-30-41.605Z.json`, source hash `postgresql-code-integration-source-20261005.json`. 현재 장비에는 PostgreSQL16 실행 파일이 없어 native namespace·실제 클러스터 적용/복원·root에서 PostgreSQL 소유 파일 교체·설치 브라우저 GUI/E2E는 미검증입니다. 전체 코드 중단 복구 adapter/whole graph 백업 복원 연결, 전체 번역·공개 APT/desktop·AI 실연동 및 다른 실환경 검증은 남아 있습니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 검토·적용 backend 기반

전체 원문·원본/후보 graph·실행 서비스 snapshot에 묶인 검토 digest와 적용 transaction을 구현했습니다. 고정 읽기 전용 SQL로 공개 runtime 값과 디스크 설정 오류 수를 조회하고 postgresql.auto.conf의 부재/hash를 확인합니다. 상위 디렉터리는 descriptor를 순차 열어 심볼릭 링크와 경로 교체를 검사하며 원문을 결과에 노출하지 않습니다. 신뢰된 PostgreSQL 소유 UID를 파일 검수·교체·복원에 허용하고 백업/journal은 실행 계정의 private 소유를 유지합니다. 기존 PostgreSQL backup kind를 기록합니다.

적용 전 재검수·graph/service 재확인, 적용 후 고정 unit 재시작 및 실제 공개 값 확인을 추가했습니다. 실패 시 원본/서비스 복구를 시도하며 외부 편집은 덮어쓰지 않습니다. 검토 후 source/auto configuration 변경, 실패 후 복원, 외부 편집 보존, 고정 readonly SQL, unsafe 경로/링크/하드링크 거부를 fixture로 검사했습니다. 공통 중단 복구 검수에서 PostgreSQL 소유 UID를 놓친 부분도 수정했습니다.

관련19 tests와 최종 전체768 tests PASS. 증거·소스 hash는 postgresql-code-operation-source-20261005.json, 로그는 tastedev-pg-code-focused.log와 tastedev-pg-code-full.log이며 사용법/제한은 postgresql-code-operation.md입니다. 현재 단계는 source-only입니다. helper/API/GUI 및 별도 중단 작업 복구·백업 복원 연결, PostgreSQL native namespace/실제 운영 기동·root 소유 전환·설치 GUI/E2E는 남아 있습니다. 이번 단계에서는 새 deb 또는 production build를 수행하지 않았습니다. 기존 검증 deb를 유지하고 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL native 옵션 격리 검수기·coordinator 기반

PostgreSQL 설정 graph→private 후보→고정 native 옵션 조회→후보/운영 graph 재확인→cleanup coordinator를 추가했습니다. native 실행은 고정 postgres -C의 공개5개 항목과 id -u/-g만 허용하며 binary/argv를 요청으로 지정하지 않습니다. namespace 전체 분리·추가 userns 금지·비-root UID/GID·capabilities 제거·환경 초기화·리소스 제한, private 후보 읽기 전용 바인드, 명령당30초/출력4096byte 제한을 설정합니다. 실행 파일과 후보 변경, 계정 불일치, namespace 실패, 허용 외 출력은 거부하고 호스트 검수로 대체하지 않습니다.

root helper용 기본 후보 계정은 UID/GID65534입니다. 호스트 상위 private 디렉터리는 실행 계정 소유0700을 유지하고 payload만 검수 계정 소유0700/0600으로 구성해 비-root 프로세스의 읽기와 호스트 비밀 원문의 보호를 함께 준비했습니다. namespace에서는 payload만 마운트하며 상위 보호 경로를 새로 생성합니다. 원본 파일 소유권은 변경하지 않습니다. 고정 passwd/group을 제공합니다. fixture는 현재 계정으로 배치·검수 계정을 확인하며 실제 root65534 chown 및 namespace 실행 증거와 구분합니다.

관련12 tests, 최종 전체759 tests PASS. 첫 fixture/전체 실행에서 secret assertion이 public scope 문자열 private-config-options까지 오인했습니다. 실제4개 비밀값을 확인하도록 수정한 후 관련·전체 검사를 다시 실행했고 실패 로그도 보존했습니다. 소스 hash와 fixture/native 범위는 postgresql-config-validation-source-20261005.json, 설명과 공식 근거는 postgresql-config-validation.md입니다.

현재 PostgreSQL16 binary가 없어 native parse/namespace·실제 서비스 적용·root65534 ownership 전환은 미검증입니다. postgres -C는 실제 startup override와 postgresql.auto.conf, 운영 data/TLS/플러그인 접근성을 증명하지 않으며 고정 data_directory는 private /tmp입니다. source-only 단계로 GUI/API/helper·전체 코드 적용/복원 연결은 남아 있습니다. 이번 단계에서는 deb를 생성하거나 설치하지 않았고 기본 검증 deb는 이전 MariaDB 전체 코드 적용 버전을 유지합니다. 운영 파일·서비스·대상 서버 설치 변경은 없으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 설정 graph·private 후보 기반

기존 PostgreSQL 적용 경로는 선택 파일만 native 검사하며 include graph 전체를 고정하지 않았습니다. 전체 코드 적용을 위한 별도 graph와 private 후보 기반을 추가했습니다. 같은 클러스터 내부 include/include_if_exists/include_dir, 상대/절대 경로, C 순서 디렉터리 참조, 선택 참조 부재를 추적합니다. 파일 identity/hash와 디렉터리 목록을 고정하며 초안 override가 있어도 운영 원본 변경을 검사합니다. 외부 경로·심볼릭 링크·권한 위반·순환·UTF-8/크기 한도를 거부합니다. 옵션 값은 공개 graph에 포함하지 않습니다.

후보는 등록된 최신 snapshot만 받아 모든 참조와 디렉터리 내 복사본을 private 경로로 재작성합니다. 원본을 변경하지 않으며 후보 hash/권한/identity를 확인합니다. cleanup은 최초 임시 디렉터리 identity를 확인하고 교체된 경로의 파일은 삭제하지 않습니다. 현재 구현은 source 기반이며 GUI/API·native 옵션 검수·서비스 identity·transaction 적용/복원에 연결하는 단계가 남아 있습니다. postgresql.auto.conf 및 실제 서비스 인수의 override도 별도 검사해야 합니다. 설명과 공식 근거는 postgresql-config-graph.md입니다.

관련6 tests, 전체753 tests PASS. 이후 cleanup 경로 교체 거부 assertion을 추가한 최종 관련6 tests도 PASS. 증거 및 소스 hash는 postgresql-config-graph-source-20261005.json과 tastedev-pg-config-graph-\*.log입니다. PostgreSQL16 실행 파일이 없어 native 실행 검증은 미완료입니다. 새 모듈은 아직 배포 helper에 연결하지 않아 이번 단계에서 새 deb를 생성하지 않았습니다. 검증된 기본 deb는 이전 MariaDB 전체 코드 적용 버전(1e0e66052c7143fbb64fd8f05497223dc9a485d719d2e6009c2e328ed82435ce)을 유지합니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았고 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 전체 코드 검수·검토·운영 적용 연결

MariaDB 파일/그룹 설정과 코드 초안 전체를 헤더 검수 팝업에서 검수하고 재시작 영향 확인 후 적용할 수 있도록 연결했습니다. main 설정 선택을 지원하며 선택 파일·기준 버전·운영/후보 include graph·정확한 원문의 hash에 검토를 묶습니다. 지원 폼 밖 옵션도 원문 전체 교체로 반영합니다. 검토 후 신규 include 파일 변경이나 재검수 중 graph 변경을 거부하고 기존 namespace 옵션 검수·서비스 main 검사·private 원본 백업·재시작 실패 원문 복원/복구 transaction을 사용합니다.

API와 root helper에서 schema/허용 경로/원문 UTF-8 262144 byte/확인을 검사합니다. JSON 한도1.6MB, 로그인·동일 origin·databaseChanges·sudoWithoutPrompt 권한을 요구하며 filesystem root·runner 지정은 거부합니다. helper closure/작업 allowlist/보안 작업 라벨을 포함했습니다. GUI main·초안·연결·정책 변경은 검토를 무효화하고 중복 실행과 늦은 응답을 막습니다. 터미널은 옵션 검수 범위를 구분하고 구조화한 결과·백업 ID만 저장합니다. 사용법은 mariadb-code-operation.md입니다.

관련32 tests, 최종 전체747 tests, 최종 production build, 번역 literal 키 검사, 격리 package:verify --terminal PASS. 첫 전체 실행은 신규 popup import의 SSR 테스트 mock 누락으로5개가 실패했으며 mock을 추가한 뒤 전체를 재검사했습니다. 실패 로그도 보존했습니다. 새 MariaDB API의 실제 패키지 HTTP401·cross-origin/권한 비활성403과8KiB 초과 요청의 권한 검사 도달을 확인했습니다. 이 HTTP 검사는 root/native 실행을 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-code-operation.deb` 및 기본 이름, SHA-256 `1e0e66052c7143fbb64fd8f05497223dc9a485d719d2e6009c2e328ed82435ce`, evidence `package-2026-10-05T04-46-08.048Z.json`, 소스 hash mariadb-code-operation-source-20261005.json입니다. 실제 MariaDB 실행 파일 부재로 native namespace 검수·DB 재시작·운영 적용/복구는 미검증이며 설치 환경 GUI/E2E도 별도입니다. candidate 옵션 검수는 데이터/TLS/플러그인 접근성이나 전체 기동 성공을 증명하지 않습니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL이며 PostgreSQL 전체 코드 적용, 전체 번역, 공개 APT/desktop, AI 실연동 및 실환경 검증 등의 남은 범위를 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 후보 설정 격리 검수

설치 패키지의 MariaDB 지원 항목 적용과 백업 복원에 private namespace 후보 검수를 연결했습니다. 운영 설정·데이터·소켓·네트워크를 제공하지 않고 후보와 검증 실행 파일을 읽기 전용으로 사용합니다. 실행 전후 후보 hash와 실행 파일 identity를 확인하며 native 옵션 검수·defaults 조회가 실패하면 호스트 실행으로 대체하지 않습니다. capability에 따라 configuration/options-help를 구분하고 지원 필드의 실제 후보 값을 확인합니다. 검수 거부 시 백업·파일 교체·서비스 재시작 전에 중단합니다. 기존 graph/service 검사와 transaction 복구는 유지합니다.

새 모듈은 helper checksum allowlist와 배포 closure에 포함되며 Depends에 bubblewrap을 추가했습니다. 관련23 tests, 전체736 tests, production build, 번역 literal 키 검사 및 격리 package:verify --terminal PASS. 패키지 검사는 새 모듈 import와 의존성도 확인합니다. 실패한 fixture 기대 오류는 transaction의 일반 오류 마스킹 동작에 맞춰 수정했고 실패 기록을 보존했습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-isolated-validation.deb` 및 기본 이름, SHA-256 `41fe5d1aec5eb22a0996a6d848c8bdff3e236719fd3ff56a5120b5eac94a238d`, evidence `package-2026-10-05T04-32-51.630Z.json`. 소스 hash는 mariadb-isolated-validation-source-20261005.json, 설명은 mariadb-sandbox-validation.md입니다. 현재 장비에 mariadbd/my_print_defaults가 없고 bwrap/prlimit은 root 소유가 아니므로 실제 native namespace/운영 적용 검증은 미완료입니다. fixture runner 검사는 native 기동 성공을 증명하지 않습니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. MariaDB 전체 코드 적용 API/GUI, 설치 환경 GUI/E2E 및 나머지 제품 범위는 남아 있으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 Redis 전체 코드 검수·검토·운영 적용 연결

Redis main 파일의 설정 GUI/코드 초안 전체를 헤더 검수 팝업에서 검수하고 확인 후 적용하도록 연결했습니다. 지원 항목만 변경하는 기존 경로와 별도로 전체 코드 지시어를 후보에 반영합니다. 운영 main 및 기존 include graph, 새로 포함되는 후보 graph, 정확한 코드의 해시에 검토를 묶으며 apply에서도 재검수합니다. 기존 namespace/리소스 제한 후보 검수와 서비스 identity 검사, private 원본 백업, 파일 교체, 재시작 실패 시 원문 복원/복구 transaction을 재사용합니다. root helper의 새 모듈과 작업은 checksum allowlist에 포함했습니다.

API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt·helper 권한을 검사하고 전체 코드 JSON을 1.6MB, 원문을 UTF-8 262144 byte로 제한합니다. 경로·runner·filesystem root 지정과 검토 후 코드/참조 파일 변경을 거부합니다. GUI는 입력/연결/정책 변경 때 검토를 해제하고 중복 실행·늦은 응답을 막습니다. 감사는 기존 completed/failed/rolled-back/recovery-required 상태를 사용합니다. 터미널에는 구조화한 검수·적용 결과와 백업 ID만 기록하며 암호·원문·native 상세 출력을 넣지 않습니다. 사용법은 redis-code-operation.md입니다.

관련 27 tests와 전체 730 tests PASS, 감사 상태 통일 후 최종 API 1 test PASS. 최종 production build, 번역 literal 키 및 격리 package:verify --terminal PASS. 실제 패키지 HTTP에서 새 두 API의 401·cross-origin/권한 비활성 403 및 8KiB를 넘는 코드 요청의 권한 검사 도달을 확인했습니다. 이 HTTP 검사는 root/helper 실행이나 Redis 기동을 수행하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-redis-code-operation.deb` 및 기본 이름, SHA-256 `4b3334216b7b07fbcf227e664d99a13374117267395ab1cb1e169f53a1ed05db`, evidence `package-2026-10-05T04-15-58.619Z.json`. 소스 hash·검사 범위는 redis-code-operation-source-20261005.json입니다. 현재 장비의 `/usr/bin/redis-server` 부재로 실제 Redis native 기동 검수·운영 적용 E2E는 미검증이며 설치 브라우저 GUI/E2E도 별도입니다. 운영 서비스·파일·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL. MariaDB/PostgreSQL 전체 코드 적용·전체 번역·공개 APT/desktop·AI 실연동 등 남은 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 실제 그룹 트리와 초기 SSR

파일 아래 `[client]`, `[mysqld]`, 버전 그룹과 빈 그룹을 원문 첫 등장 순서로 표시합니다. 서버 설정 조회는 그룹 이름만 metadata에 포함하며 옵션 비밀번호 값을 노출하지 않습니다. 초기 SSR 및 Strict Mode 효과 재실행은 같은 metadata를 유지합니다. 실제 React 서버 렌더러의 최초 HTML에서 파일·그룹·빈 inspector를 확인했습니다. 이 HTML 검사는 실제 설치 브라우저의 첫 페인트/E2E 검증과 구분합니다.

그룹 선택은 현재 코드 기록을 재사용하며 해당 그룹의 행만 오른쪽에 표시합니다. 새 옵션은 선택 그룹에 추가합니다. 코드 편집에서 그룹을 추가·삭제·재정렬하면 트리도 갱신합니다. 그룹 이름으로 트리 검색이 가능하며 주요 연결/메모리/로그 폼도 유지합니다. 같은 이름으로 반복된 그룹은 한 노드에 모아 원문 행을 각각 편집합니다. 공통 root helper metadata 모듈을 checksum allowlist에 포함했습니다.

관련 19 tests, 전체 719 tests PASS, 추가 실제 React SSR HTML 1 test PASS. 최종 production build와 격리 package:verify --terminal PASS. 검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-group-tree.deb` 및 기본 이름, SHA-256 `3f147fcc3d61cf6ea2861599d4e7b066b44e129795b984d1f6cb59b66e30399d`, evidence `package-2026-10-05T03-58-34.902Z.json`. 소스 hash·검사 범위는 mariadb-group-tree-source-20261005.json입니다.

설치 브라우저 GUI/E2E 및 MariaDB native 검수·운영 적용은 별도 미검증입니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL이며 나머지 패키지 설정·운영 적용/복원·전체 번역·공개 APT/desktop·AI 실연동 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 파일 전체 항목 설정 GUI

MariaDB 파일/전체 설정 노드는 그룹과 원문 순서의 옵션을 표시하며 코드 보기와 같은 초안을 편집합니다. 그룹 필터·검색·반복 행 편집·항목 추가·값 없는 옵션의 활성화·비밀번호 가림을 지원합니다. 값을 비우면 행을 유지하고 주석 처리합니다. 추가 항목은 마지막 지정 그룹 구간에 들어가며 이후 client 그룹을 변경하지 않습니다. include·따옴표·CRLF·세미콜론 값을 보존합니다. 주요 설정 폼도 하이픈/밑줄 별칭을 수정해 같은 옵션을 중복 추가하지 않습니다. 사용법과 native 의미 범위는 mariadb-file-settings.md입니다.

전체 717 tests PASS. 이후 주석 처리된 밑줄 옵션 표시 보완에 대해 최종 관련 15 tests PASS. 최종 production build와 격리 package:verify --terminal PASS, 번역 literal 키 검사 PASS. 검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-file-settings.deb` 및 기본 이름, SHA-256 `99c78ddb78a13e4926597b1fe533298d0c94b70eb9f3b6daae7a3a0941609ecc`, evidence `package-2026-10-05T03-51-30.863Z.json`. 소스 hash 및 검사 범위는 mariadb-file-settings-source-20261005.json에 기록했습니다.

설치 환경 브라우저 GUI/E2E 및 MariaDB native 검수·운영 적용은 별도 미검증입니다. 임의 옵션은 파일 초안 편집이며 기존 운영 적용 지원 필드·검수·검토·권한 제한을 유지합니다. 대상 서버 설치·운영 파일·서비스 변경은 하지 않았습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 Redis 파일 전체 항목 설정 GUI

Redis main 파일/설정 노드는 원문 순서의 지시어 전체 편집 화면을 표시합니다. PostgreSQL과 공통 FileSettings를 재사용하며 연결/메모리/AOF의 주요 항목 폼과 코드 초안은 같은 기록을 사용합니다. 반복 항목은 선택한 행만 변경하고 비우기는 행을 유지하면서 주석 처리합니다. 원문 따옴표·다중 인수·CRLF·관계 없는 줄을 보존하고 활성화·검색·항목 추가를 지원합니다. requirepass/masterauth 입력은 비밀번호 형식으로 표시합니다. 오래된 행·줄바꿈 주입·닫히지 않은 따옴표·UTF-8 크기 초과는 거부합니다.

공식 Redis7.0 레지스트리의 이름/별칭203개를 주석 예시 분류에 사용했습니다. 활성 지시어는 미등록 이름도 표시합니다. 이후 버전/모듈의 알 수 없는 주석 항목은 코드 보기에서 확인합니다. 공식 sample의71개 활성 행과 주석 예시를 포함한209행을 확인했고, 동일 값 편집 시 원문 byte 보존을 검증했습니다. sample에서 발견한 설명 문장 분류·공백 보존 문제는 회귀 검사에 반영했습니다. Redis 지원 값 가져오기에서도 줄 끝 #/세미콜론을 주석처럼 제거하지 않습니다. 사용법과 의미 범위는 redis-file-settings.md를 참조하세요.

관련 최종15 tests, 전체710 tests, 최종 production build 및 격리 package:verify --terminal PASS. 신규 literal 번역 키 검사 PASS. 검증 deb `dist/tastedev-linux_0.1.0_amd64-redis-file-settings.deb` 및 기본 이름, SHA-256 `6f457d6449d405072365609e40289d9c994a73f2c2446115eb56db833a9e885f`, evidence `package-2026-10-05T03-36-04.204Z.json`. 공식 참조 hash와 sample 범위는 redis-file-reference-20261005.json입니다.

파일 행 편집은 구문/초안 검사입니다. 실제 Redis 버전별 의미·native 운영 적용 및 설치 환경 브라우저 E2E는 완료하지 않았습니다. 기존 지원 항목의 검수/검토/권한 제한을 유지하며 임의 지시어를 자동 운영 적용하지 않습니다. 대상 서버 설치·운영 파일·서비스 변경은 하지 않았습니다. 전체 목표 PARTIAL. 나머지 패키지 전체 항목 GUI·운영 적용/복원 E2E·번역·공개 APT/desktop·AI 실연동 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 DB 설정 GUI 브라우저 편집 오류 수정

PostgreSQL·MariaDB·Redis 공통 폼의 patchConfig가 브라우저에서 제공되지 않는 Node Buffer.byteLength에 의존했습니다. 이전 검증 소스를 Node 전역이 없는 모듈 환경에 넣어 PostgreSQL 포트 편집의 `Buffer is not defined` 오류를 재현했습니다. UTF-8 크기 검사는 공통 TextEncoder로 변경했으며 필드 교체/추가 후 결과도 262144 byte 한도를 검사합니다. 크기 초과는 코드 교체 전에 거부합니다. 기존 코드·주석·CRLF·관련 없는 설정의 보존 동작은 유지합니다.

실제 순수 모듈 의존성을 Node 전역 없이 실행하고 세 DB의 실제 PackageConfigIde 편집 핸들러에 연결해 폼 수정·코드 역반영·기본값 복원을 검사했습니다. UTF-8 정확한 한도와 편집 결과 증가에 따른 거부도 검증했습니다. 관련 19 tests 및 전체704 tests PASS, 최종 production build와 격리 package:verify --terminal PASS. 이 모듈 검증은 실제 설치된 앱의 브라우저 GUI E2E 완료를 의미하지 않습니다. 운영 파일/서비스 변경과 대상 서버 설치는 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-db-browser-edit.deb` 및 기본 이름, SHA-256 `d5cbbc77c71d55a6f9c01d850a0756a2124f861cf3fc3e3fc01ff52f3d4bdc74`, evidence `package-2026-10-05T03-22-16.584Z.json`, 원인 재현 `tastedev-db-browser-reproduction.log`. 전체 목표 PARTIAL. 설치 환경 GUI/E2E·운영 적용/복원·패키지 전체 설정 범위·번역·공개 APT/desktop·AI 실연동의 남은 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 Certbot 인증 방식 선택·실행 연계

Certbot 발급 GUI와 명령 초안에 nginx·webroot·standalone 선택을 추가했습니다. 방식/웹 루트 변경은 이전 미리보기와 확인·동의를 해제하며 실행 요청에도 같은 값을 전달합니다. 기본 nginx 명령은 유지하고 webroot/standalone은 certonly로 발급합니다. 갱신 테스트는 기존 갱신 설정을 사용합니다. 관리자 helper는 root 소유·checksum 검증을 통과한 동일한 순수 명령 생성기를 사용합니다. nginx는 기존 관리 사이트 백업을 유지하고 webroot는 제한된 절대 경로·상위/검증 디렉터리 소유권·쓰기 권한·링크를 검사합니다.

관련 61 tests, 전체 702 tests PASS, 마지막 발급 메뉴 문구 변경 후 컴포넌트 재검사 PASS. 최종 production build 및 격리 package:verify --terminal PASS. HTTP 검증은 세 발급 방식·갱신 대상 미리보기, 잘못된 경로·이름 거부와 권한이 꺼진 발급 요청 403을 포함합니다. 번역 키 검사 PASS, 새 설정 항목은 기존 6개 주요 catalog 및 Portuguese에 반영했습니다. 사용법은 certbot-authenticators.md에 기록했습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-certbot-methods.deb` 및 기본 이름, SHA-256 `f0d3f03dfb496b0871705cc99fcd32fc1eef89185f351c58ba17c87ad728070d`, evidence `package-2026-10-05T03-15-10.967Z.json`. 실제 ACME 발급·갱신/운영 서버 설치·서비스 변경과 설치 환경 브라우저 E2E는 이번 검증에 포함하지 않았습니다. 새로운 인증서 helper 실행 경로는 검토된 패키지의 root 소유 runtime을 사용합니다. 전체 목표 PARTIAL이며 완전한 패키지 설정 범위·운영 적용/복원 E2E·번역·공개 APT/desktop·AI 실연동은 별도 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 작업 폴더 환경 파일 트리·코드 편집 구현

Node.js canonical 페이지는 인증 후 등록 앱과 작업 폴더의 편집 가능한 환경 파일 이름을 SSR로 전달합니다. 초기 트리에는 파일 노드를 표시하고 파일 내용은 선택 후 기존 인증된 file API로 읽습니다. 숨김 파일·상위 경로·링크는 기존 작업 폴더 제한을 유지합니다. 파일 선택 시 지원 환경 값·코드 순서·주석 및 다른 변수를 기존 공통 설정/코드 탭에서 편집하며 저장은 기존 파일 버전 검사를 사용합니다. 일반 Node 설정 초안과 파일별 코드 버퍼는 별도 키로 보존합니다.

서로 다른 파일의 누락 값이 섞이지 않으며 파일 전환·늦은 응답·연결 변경 때 이전 파일을 표시하지 않습니다. Strict Mode는 같은 파일의 대기 중 조회를 재사용합니다. 조회 실패는 새로고침으로 재시도합니다. 디스크에서 사라져도 미저장 코드/미완성 GUI 값이 있는 파일 노드는 유지하고 버퍼를 다시 엽니다. 실제 삭제된 파일을 자동 재생성하거나 저장 기준을 자동 바꾸지는 않습니다. 가져오기·기본값 복원 실패는 GUI를 부분 변경하지 않으며, 숫자를 입력하는 도중의 빈 값만 GUI에 유지합니다. 미완성 GUI 값도 이탈 경고 대상입니다.

관련 실제 컴포넌트/SSR·버퍼·늦은 응답·복구·오류 처리31 tests 및 전체696 tests PASS. 별도 production build와 격리 package:verify --terminal PASS. 설치된 Node.js 실제 브라우저 E2E는 별도 미검증이며 운영 서버 설치·서비스/환경 파일 변경은 하지 않았습니다. 이 트리는 관리 작업 폴더의 환경 파일을 대상으로 하며 등록 앱의 실제 .env 관리는 기존 앱 환경 관리 흐름을 유지합니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-env-files.deb` 및 기본 이름, SHA-256 `de22053b6fc14d20fa17af1653c0417bcb4fe967bb5405ffd23d300f32853d89`, evidence `package-2026-10-05T02-47-04.675Z.json`. 전체 목표 PARTIAL. 설치 환경 GUI/E2E, 모든 패키지 설정 GUI·운영 적용/복원, 완전 번역·공개 APT/desktop·AI 실연동 범위는 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 환경 값 가져오기 실패·재시도 처리

공통 설정 폼은 환경 값 적용 거부 이유를 가져오기 컴포넌트로 반환합니다. 로컬 파일 가져오기는 적용 실패 시 지원 값 검토를 유지하고 오류를 표시하며, 성공한 때만 검토 목록을 비웁니다. 작업 폴더 환경 파일은 실패 시 조회 결과와 반영 버튼을 유지하고 오류를 표시하며, 다음 반영 성공 시 오류를 지웁니다. 지원 변수 외의 원문 값은 기존 방식대로 검토 단계에서 제외합니다. Node 코드·GUI 양방향 연동의 중복 변수 거부 처리와 연결해, 실패를 성공처럼 소비하던 동작을 수정했습니다.

실제 가져오기·작업 폴더 조회·공통 폼·탭 컴포넌트 관련9 tests, 전체692 tests, 별도 production build, 격리 package:verify --terminal PASS. 실제 브라우저 가져오기 E2E는 별도 미검증이며 운영 서버 설치·환경 파일 변경은 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-import.deb` 및 기본 이름, SHA-256 `5bcf2dcec26757f075d6d4ef21fb34f26c70f8caadfca276df3f7451a8e44ee8`, evidence `package-2026-10-05T02-27-58.325Z.json`. 전체 목표 PARTIAL. 설치 환경 GUI/E2E, 패키지 전체 설정 GUI·운영 적용/복원, 완전 번역·공개 APT/desktop·AI 실연동 범위는 계속 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 코드·GUI 환경 값 양방향 연동

Node PackageTool에서 코드의 지원 환경 값과 작성 순서를 GUI에 반영합니다. GUI 수정·환경 값 가져오기·기본값 복원은 전체 환경 코드를 변경하면서 주석, export 구문, CRLF와 다른 변수를 보존합니다. 빈 숫자 입력은 GUI에서 유지하며 유효해진 시점에 코드에 반영합니다. 잘못된 코드나 중복 지원 변수는 마지막 정상 GUI 값을 보존하고 자동 코드 변경을 거부합니다. 삭제된 변수의 기존 GUI 값도 유지합니다. 폼 초기화·노드 재선택은 코드 변경 경고를 발생시키지 않으며 실제 변경만 반영합니다. Node 환경 생성/패치 모듈은 브라우저에서 사용할 수 있도록 서버 의존성을 분리했습니다.

실제 컴포넌트 핸들러 관련13 tests, 전체691 tests, 별도 production build, 격리 package:verify --terminal PASS. 패키지 검사는 인증된 nginx 최초 HTTP HTML의 트리·빈 inspector SSR도 확인했습니다. 브라우저 첫 페인트/수화 시각 변화와 설치된 Node.js 실제 화면 E2E는 별도 미검증입니다. 운영 nginx/DB/Certbot 설정 및 대상 서버 설치는 변경하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-sync.deb` 및 기본 이름, SHA-256 `11e9d8e99474fc0eea561acb3e8c9412dbf8251275140f26c7717eb1f8bfae65`, evidence `package-2026-10-04T22-29-40.506Z.json`. 전체 목표 PARTIAL. 모든 패키지 지시어 GUI·설치 환경 E2E·운영 적용/복원·완전 번역·공개 APT/desktop·AI 실연동 등 남은 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 설정/코드 전체 높이 탭 구현

Node PackageTool에 공통 설정/코드 탭과 접근성 tablist/tabpanel·키보드 이동을 추가했습니다. NodeConfigIde는 코드 탭에서 inspector를 전체 높이 편집 모드로 전환하며, 탭 여백 없이 구분선만 표시합니다. 코드 숨김·재열기·환경 노드 전환 때 초안 기록을 보존합니다. 기존 편집 코드가 있으면 새 GUI 초안 교체 확인 후에만 코드 탭으로 전환합니다. 기존 비탭 모드도 보존합니다.

실제 공통 컴포넌트와 임시 mock config-plan API를 사용한 격리 브라우저에서 환경 노드 선택 → 코드 생성 → PORT4000 편집 → 설정/코드 전환 유지 → 교체 확인 흐름을 검증했습니다. 최종 문서 높이720px=viewport720px, 트리/inspector566px, 탭38px, 코드 panel528px, textarea 약324px; 브라우저 오류0개. mock 초안만 편집했으며 저장·실행은 하지 않았습니다. 설치 패키지의 실제 운영 API E2E 증거를 대체하지 않습니다. fixture 라우트와 별도8795 서버는 제거했고 production manifest에 라우트 없음 확인. 증거 tastedev-node-tabs-browser-20261005.json 및 tastedev-node-tabs-full-height-20261005.png.

전체690 tests, 별도 production build와 격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-node-tabs.deb` 및 기본 이름, SHA-256 `d5bae9fe9c0659548b78ef3d542782f411c2dd503b1d9433e0634ab1307e1976`, evidence `package-2026-10-04T20-34-03.828Z.json`. 운영 서버 설치는 하지 않았습니다. 전체 목표 PARTIAL. Node 코드의 GUI 역반영, 폼 재마운트 때 GUI 변경 경고 조건, 전체 패키지 지시어 GUI·설치 환경 E2E·운영 적용/복원, 완전 번역/APT/desktop/AI 실연동 범위는 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 앱/환경 설정 트리 IDE 구현

Node.js canonical 페이지는 인증 후 등록 앱 메타데이터를 SSR로 전달합니다. 공통 IDE 레이아웃의 왼쪽에 등록 앱, 앱 등록, 환경 설정, 작업 폴더 환경 파일 관리 노드를 표시하고 오른쪽은 선택 안내로 시작합니다. 등록 앱 선택은 앱 ID/폴더 등 폼을 즉시 열며 기존 파일 확인·환경 변수·서비스 관리 구성요소를 재사용합니다. 환경 노드는 중복 앱 등록 패널을 숨기고 기존 초안/코드 기록을 유지합니다. 등록 목록 조회 오류는 페이지 전체 오류 대신 빈 목록과 조회 오류로 표시합니다. Node.js 런타임 자체를 daemon으로 표시하지 않습니다.

관련19 tests 및 전체689 tests, 별도 production build, 격리 package:verify --terminal PASS. SSR registry·StrictMode·앱 노드 초기 폼 선택·환경 노드 분기·중복 새로고침 방지·삭제된 앱 선택 해제·끊어진 연결의 늦은 조회/자식 응답 차단·재연결 조회를 실제 컴포넌트 핸들러로 검증했습니다. 현재 Node 런타임으로 앱 개발은 진행하지만 dpkg nodejs 패키지는 없으므로 설치 패키지 메뉴에서 이 화면을 사용하는 실제 브라우저 E2E는 미완료입니다. 설정/코드 화면은 기존 PackageTool을 재사용하며 nginx처럼 전체 높이 탭으로 정리하는 단계는 남아 있습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-ide.deb` 및 기본 이름, SHA-256 `7bb9a38ac74c4e0d70d18884fa4b921826edca0d72e991d87f18a72cc67334b6`, evidence `package-2026-10-04T20-22-50.034Z.json`. 운영 서버 설치/서비스·환경 파일 변경은 하지 않았습니다. 전체 목표 PARTIAL. 패키지별 전체 지시어 GUI·설치 환경 E2E·운영 적용/복원, 완전 번역·공개 서명 APT/desktop·AI 실연동 등 미완료 범위는 유지합니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 MariaDB 공통 파일 트리 IDE 구현

MariaDB를 공통 IDE로 연결하고 인증 후 서버에서 설정 파일 메타데이터·서비스 상태를 내려줍니다. 파일 선택 전에는 빈 설정 화면과 노드 선택 안내를 표시하며, 선택 후 연결·버퍼 풀·문자셋·로그 그룹 및 설정/코드 탭으로 편집합니다. 파일 조회 중에는 기본값 폼을 노출하지 않습니다. 기존 MariaDB include 구조 조회·검수·백업·복원 구성요소는 패키지 폼에서 유지합니다. 코드 초안은 .cnf 이름을 사용합니다.

관련15 tests PASS. 실제 컴포넌트 핸들러로 서버 포트 변경 시 client 그룹 포트·include·주석 보존, 코드 포트/버퍼 풀 변경의 GUI 반영, 그룹 전환 시 소스 재조회와 초안 덮어쓰기 방지, 다른 패키지 초안 보존을 확인했습니다. 전체687 tests, 별도 production build, 격리 package:verify --terminal PASS. 현재 장비에는 mariadb-server가 없어 설치된 MariaDB 실제 브라우저 E2E·운영 적용/복원은 미완료이며 GUI는 지원 항목 범위입니다.

deb `dist/tastedev-linux_0.1.0_amd64-mariadb-ide.deb` 및 기본 이름에 동일 패키지 보존. SHA-256 `5c26f01abe55e40b194c0ee72e7fb2d6ba414b9770f442d87450060732283325`, evidence `package-2026-10-04T20-14-33.157Z.json`. 운영 서버 설치/설정 변경은 수행하지 않았습니다. 전체 목표 PARTIAL. Node.js IDE 전환, 전체 지시어 GUI, 설치 환경 E2E와 운영 적용/복원 검증, 다국어/APT/desktop/AI 미완료 범위는 남아 있습니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 Redis 공통 파일 트리 IDE 구현

Redis를 기존 패키지 폼에서 공통 IDE로 연결했습니다. 서버에서 파일 메타데이터·서비스 상태를 내려 초기 트리와 노드 선택 안내를 표시합니다. redis.conf 선택 후 연결·메모리·AOF 그룹과 설정/코드 보기 탭을 사용하며, 지원 GUI 항목은 전체 원본 코드를 수정해 주석과 다른 설정을 보존합니다. 코드의 지원 값과 순서는 GUI로 반영합니다. 파일 조회 중에는 다른 초안/기본값 폼을 노출하지 않습니다. PostgreSQL과 Redis 초안은 분리하며 PostgreSQL 전용 운영 버튼은 Redis에 표시하지 않습니다. 기존 Redis 검수·백업·복원 기능은 패키지 설정 폼에서 유지합니다.

관련13 tests PASS: Redis 최초 SSR·StrictMode·갱신/재연결, 실제 컴포넌트 파일 선택/조회 대기, GUI 포트 변경·코드 포트/메모리 반영·주석 보존·PostgreSQL 초안 보존 포함. 전체685 tests, 별도 production build 및 격리 package:verify --terminal PASS. 현재 개발 장비 dpkg에는 redis-server가 없어 실제 설치된 Redis 화면 브라우저 E2E와 운영 적용/복원은 미완료입니다. GUI는 지원 항목 범위이며 모든 Redis 지시어를 구조화한 설정 편집기는 아직 아닙니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-redis-ide.deb` 및 기본 이름, SHA-256 `6fdb87f82fad41980c60c78f8f65b4b7e33706257e1ef93a79f2787f8789a286`; evidence `package-2026-10-04T20-09-56.052Z.json`. 운영 서버 설치/설정 변경은 하지 않았습니다. 전체 목표 PARTIAL. MariaDB·Node.js 공통 IDE 전환, Redis 전체 지시어 GUI 및 설치 환경 E2E 등은 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 나머지 패키지 최초 폼 SSR 수정

Node.js·MariaDB·Redis canonical 페이지도 인증 후 서버에서 상태·보안 정보를 읽어 초기 ConsoleWorkspace에 전달합니다. PackageConfig는 요청 패키지를 렌더링 시 바로 사용하므로 이전 PostgreSQL 초안 또는 nginx 기본 폼이 먼저 표시되지 않습니다. 패키지별 초안 저장과 기존 수동 운영 파일 조회는 유지합니다. 세 패키지에 nginx 형태의 파일 트리 IDE를 구현한 것은 아니며 기존 GUI의 최초 렌더링을 바로잡은 범위입니다.

실제 컴포넌트의 effect 실행 전 HTML에서 이전 PostgreSQL 초안이 있어도 Node.js·MariaDB·Redis 제목·설정 폼이 표시되는 회귀 검사 PASS. 서버 인증 전에는 상태/설정 조회가 없으며 다른 패키지 설정은 읽지 않습니다. 관련12 tests, 전체683 tests, 별도 production build 및 격리 package:verify --terminal PASS. 이번 범위의 실제 브라우저 편집 E2E는 추가 확인이 필요합니다.

deb SHA-256 `d141af2c46b6e56a3e75c3763ef1a7cf0565deeb8eaa3a548e26fa90e9c657ed`, evidence `package-2026-10-04T20-03-31.286Z.json`. dist/tastedev-linux_0.1.0_amd64-package-first-form.deb 및 기본 이름에 같은 검증 패키지를 보존했습니다. 운영 서버 설치·서비스/DB 설정 변경은 수행하지 않았습니다. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 Certbot·PostgreSQL 초기 SSR 및 GUI 검증

인증 후 서버에서 선택 패키지의 파일 목록·서비스 상태를 내려 첫 HTML에 트리와 선택 안내를 표시합니다. hydration 및 개발 StrictMode effect 재실행 때 목록을 비우거나 재조회하지 않으며, 수동 갱신과 재연결 조회는 유지합니다. Certbot 도메인 입력의 미정의 field 핸들러도 복구했으며 도메인이 바뀌면 기존 명령 검토와 확인을 초기화합니다.

실제 브라우저에서 Certbot 도메인·이메일 입력 → nginx staging 명령 검토 → 코드 보기, PostgreSQL 최초 트리·빈 설정 화면 → GUI 포트6543 → 코드 포트6544 → GUI6544를 확인했습니다. PostgreSQL 운영 파일 포트는5435 유지, 브라우저 오류0개. 인증서 발급·운영 설정 적용은 실행하지 않았습니다. 현재 장비에는 Certbot 인증서 파일이 없어 인증서 파일이 있는 초기 트리는 단위 fixture로 검사했습니다.

전체681 tests, 별도 production build 및 격리 package:verify --terminal PASS. 패키지 HTTP 검증은 JavaScript 실행 없이 nginx·Certbot·PostgreSQL 초기 HTML을 검사했습니다. deb SHA-256 `bb7a7a2c8347862db6bcd862980f61714a8c891ff0bcf0cafbeafa6de63a340b`; `dist/tastedev-linux_0.1.0_amd64-package-ide-ssr.deb`와 기본 이름에 보존. evidence `package-2026-10-04T19-58-40.920Z.json`, GUI 기록 `package-ide-ssr-gui-20261005.json` 및 같은 디렉터리 스크린샷. 이번 단계에서103 설치는 하지 않았습니다. 전체 목표 PARTIAL; 운영 적용/복원 실검증, 모든 로케일 완전 번역, 공개 서명 APT 설치·업데이트/desktop 최종 검증, AI 실연동 검증은 남아 있습니다.

## 2026-10-05 실제 nginx GUI 흐름 검증 및 오류 수정

새 임시 브라우저 탭에서 events 선택 → 블록 코드 편집 → 초안 반영 → 설정 화면 순서와 값 갱신 PASS. 내용 비우기는 행을 유지했고, sites-available 원본의 포트 초안을 sites-enabled 링크로 열어도 같은 편집 가능한 코드가 표시됨을 확인했습니다. 실제 원본 사이트 블록 hash 및 worker_connections 값 비교 PASS. 운영 적용은 실행하지 않았고 임시 탭만 닫았습니다. 이전 자동 클릭 검증 실패 기록은 이력이지만, 이번 범위는 접근성 API를 통한 실제 조작으로 확인했습니다. 브라우저 증거 nginx-gui-flow-20261005.json 및 nginx-{code-order,clear-setting,alias-code}-flow-20261005.png.

실제 파일 선택 시 발생하던 settings/add-block 형제 React 키 중복을 고쳤고 새 탭에서 오류 로그 0개 확인. 검증된 링크의 include 문맥을 원본 파일에도 전달합니다. 누락/오류/내용 불일치 대상 및 여러 포함 문맥은 보수적으로 미확정 상태를 유지합니다. 전체 include 그래프가 불완전하면 설명 문맥 선택은 유지합니다.

관련9 tests, 전체677 tests, 별도 production build, 격리 package:verify --terminal PASS. deb SHA-256 `7ae833c4f1cb7c99fa3afb50318486019446bfd1dc52dc8471610650f221f21e`, package evidence `package-2026-10-04T19-41-02.458Z.json`. dist/tastedev-linux_0.1.0_amd64-nginx-gui-context.deb 및 기본 이름에 동일 검증 패키지 보존. 103 설치는 이번 단계에서 하지 않았습니다. Certbot/PostgreSQL의 공통 초기 파일 목록이 현재 클라이언트 조회 방식임을 확인했으며 초기 SSR 개선은 남아 있습니다. 전체 목표 PARTIAL; 이번 GUI 증거는 nginx 초안 편집 범위이며 운영 적용/복원 및 모든 페이지 E2E 합격을 뜻하지 않습니다.

## 2026-10-05 nginx SSR 및 링크 초안 패키지 검증

sites-enabled의 검증된 링크는 sites-available 등 원본의 편집 초안과 같은 트리를 표시합니다. 추가·삭제로 노드 번호가 바뀌어도 링크에서 검색·선택·코드 편집하면 원본 초안에 반영하고 별도 링크 초안은 만들지 않습니다. 원본이 누락되거나 오류/조회 내용 불일치이면 조회 전용 링크 사본을 유지합니다. 실제 파일과 심볼릭 링크는 변경하지 않습니다.

관련7 tests, 전체676 tests, 별도 production build, 격리 package:verify --terminal PASS. 패키지 HTTP 검증은 클라이언트 script를 제거한 첫 응답에서 실제 조회된 nginx 파일 title과 선택 안내, 로딩 안내 부재를 검사했습니다. 검증 장비 nginx 설치 상태 install ok installed / 1.28.3-2ubuntu1.11. deb SHA-256 `72b2b7e07126a49c5209acc72c24ee618907cfb4156f0d9ca6c087285d967e17`, package evidence `package-2026-10-04T19-30-59.036Z.json`. 배포 파일 dist/tastedev-linux_0.1.0_amd64-nginx-ssr-alias.deb 및 기본 파일에 동일 검증 패키지를 보존했습니다. 103 설치 및 운영 설정 변경은 이번 단계에서 하지 않았습니다. 전체 목표 PARTIAL.

## 2026-10-05 nginx 첫 화면 SSR

인증 확인 후 서버 페이지에서 상태·보안·nginx 트리·관리 사이트를 읽어 ConsoleWorkspace와 ServerManager에 초기 데이터로 전달합니다. 첫 HTML부터 트리 노드와 선택 안내를 렌더링하며 hydration 때 초기 트리를 비우거나 nginx-tree/nginx-live를 다시 요청하지 않습니다. 수동 갱신과 연결 변경 시 새 조회는 유지합니다. 설치된 패키지 목록의 클라이언트 캐시 정책은 유지합니다.

SSR 인증 순서·초기 상태·중복 요청 방지·갱신·재연결 포함 관련6 tests, 전체676 tests 및 production build PASS. 개발8787 브라우저에서 펼쳐진 nginx.conf/events/http와 sites-available/sites-enabled 링크 노드, 오른쪽 선택 안내 확인. 화면 증거 .runtime/verification/nginx-initial-ssr-20261005.png. 이 변경은 개발 소스에 적용했으며 103 설치 패키지는 이전 nginx-session-links 버전입니다. 전체 목표 PARTIAL.

## 2026-10-05 세션 만료 로그인 이동 및 nginx 트리 정리

401은 본문 JSON 파싱 전에 처리하며 만료 안내 문구 대신 로그인 페이지로 전체 이동합니다. 기존 canonical IDE 경로는 next에 보존하고 중복 이동/추가 요청과 로그아웃 후 늦은401을 억제합니다. 인증 상태 조회의 authenticated=false/401에도 동일하게 적용합니다. 저장소503은 로그인 만료로 취급하지 않습니다. 세션 정리 직후 React 재렌더 전에 이전 미저장 페이지 이탈 경고가 로그인 이동을 막지 않도록 generation을 검사합니다. 일반 미저장 이탈 경고는 유지합니다.

초기 설정 응답 전에는 빈 폴더 트리 대신 로딩 안내만 표시합니다. 왼쪽 트리 검색은 파일명/지시어/값 외에 한국어와 선택 언어 설명도 검색하며 include의 map/geo 및 stream/mail 문맥을 따릅니다. sites-enabled 등 링크는 연결 아이콘과 nginx 루트 안의 실제 대상 경로를 표시합니다. 조회된 대상 내용이 일치할 때 대상 원본으로 선택을 연결하고, 대상이 조회되지 않았거나 초안 내용이 달라 일치하지 않으면 링크 사본은 조회 전용으로 유지합니다. 끊어진/외부/디렉터리 링크 보호는 유지하며 파일이나 링크 자체를 변경하지 않았습니다.

관련9 tests 및 초안 경고/세션 관련7 tests, 전체673 tests, 별도 production build와 격리 package:verify --terminal PASS. 승인된103 앱 업데이트 완료. SHA-256 `dd2c22604b006d7e1154a03268209e1329311e0b51b60904072f9d2a14968b38`, evidence `package-2026-10-04T19-11-43.563Z.json`. 기존 설정4개 hash 보존, active/whitecalvin/helper91·manifest·BUILD_ID·root 소유권, login200/미인증9 API401 및 설치/HTTP 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-session-links-{delivery,installed,bundles}-20261005.json`.

실제 GUI 조작은 이전 독립 HTML 입력 대조에서도 자동 클릭이 전달되지 않았으므로 미완료로 유지합니다. 초기 트리 시각 변화의 실제 발생 원인은 확정하지 않으며, 확인된 코드상 빈 트리 중간 표시를 제거했습니다. 전체 목표 PARTIAL. 남은 큰 범위는 GUI/PTY 실제 사용자 흐름, 운영 패키지 적용·복구 실검증, 모든 지원 로케일 완전 번역, 공개 서명 APT 설치·업데이트/desktop 최종 검증, AI 실연동 검증입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 검색 후 서버 선택 수정

검색 결과에서 동일한 `server` 블록 중 일부만 남으면 선택 키의 occurrence가 변경되어 다른 서버의 설정·코드가 표시되는 결함을 실제 컴포넌트 핸들러 검사로 재현했습니다. 443 검색 후 두 번째 서버를 선택했는데 수정 전에는 `listen 80`이 표시됐습니다. 이제 선택 및 컨텍스트 메뉴에는 원본 소스의 전체 트리를 보존합니다. 수정 후 설정·코드·새로 조회·컨텍스트 메뉴 삭제 대상이 두 번째 서버로 유지되며 원본 파일은 변경하지 않습니다.

관련7 tests, 전체671 tests, 별도 production build 및 격리 package:verify --terminal PASS. 승인된103 앱 업데이트 완료, 기존 설정4개 hash 보존. SHA-256 `0dc64f09356f8cd6928f19a88e651ebb9ff68d68f6d7a3190bfadd28b3d322d6`, package evidence `package-2026-10-04T18-58-12.970Z.json`. 설치 코드/root 소유권/helper91/BUILD_ID·manifest와 login200/미인증9 API401 및 설치·HTTP 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-search-selection-{delivery,installed,bundles,browser}-20261005.json`.

개발 화면 자동 클릭 검사는 미완료입니다. 앱과 독립된 로컬 단일 HTML 버튼에서도 onclick이 존재하고 활성 상태인데 자동 클릭 후 결과가 바뀌지 않았습니다. 브라우저 입력 전달 문제가 있는 증거이며, 앱의 초기 선택 불능 원인을 확정한 것은 아닙니다. 임시 검사 서버/탭은 종료했고 사용자 탭은 유지했습니다. 전체 목표는 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx MIME 설명 문맥 수정 및 include 검사

`types` 블록의 MIME 키가 charset/proxy_cache/gzip 같은 일반 지시어 이름과 겹쳐도 MIME 확장자 설명을 제공합니다. `types` 안의 include는 파일 포함 설명과 공식 문서 링크를 제공합니다. 이전 캐시·요청 제한 등 설명27개 보완도 포함합니다. 103의 nginx.conf에서 시작한 include 그래프28개 파일·125개 이름/문맥 조합을 읽기 전용으로 대조한 결과 구체 설명 누락0, include 경고0입니다. Certbot 공개 nginx 옵션6개도 포함하며 실행 중 nginx의 실제 유효 설정 전체를 증명하지는 않습니다.

관련37 tests, 전체670 tests, 번역 검사, 별도 production build, 격리 package:verify --terminal PASS. 승인된103 앱 업데이트 완료. 패키지 SHA-256 `3617d0c6614556e51cad913a1fb0c62aed32ee9c2e8dc571f7eeed100fc15ef4`, evidence `package-2026-10-04T18-48-11.435Z.json`. 기존 설정4개 hash 보존, active/whitecalvin/helper91·manifest·BUILD_ID·root 소유권, login200/미인증9 API401 및 설치5/HTTP3 자산 해시 일치 PASS. 운영 nginx/DB/Certbot/cron 설정과 sudo 정책은 변경하지 않았습니다.

개발 브라우저의 초기 트리 및 검색 동작은 관찰했습니다. 자동 조작으로 노드를 클릭하거나 키보드로 선택해도 설정 패널 변경을 확인하지 못했고 접기 버튼에서도 동일했습니다. 원인은 확정하지 않았으며 GUI 설명 표시 PASS를 주장하지 않습니다. 전체 목표 PARTIAL. 증거 `.runtime/verification/nginx-types-help-{delivery,include-audit,installed,bundles,browser}-20261005.json`. 아래는 이전 단계 이력입니다.

## 2026-10-05 실제 nginx 항목 설명27개103 반영

103의 읽기 전용 설정 이름·문맥 대조에서 확인한 캐시·프록시 버퍼/헤더·요청 제한·HTTP/2·문자셋·internal/break/autoindex 지시어24개와 split_clients 블록/규칙2종의 설명27개를 보완했습니다. 수집된124개 이름·문맥 조합의 구체 설명 누락은0개입니다. 읽기 오류8개와 미해결 include46개가 있어 전체 설정 검사 완료로 해석하지 않습니다. 설정 소스/값은 수집 결과에서 제외하고 map/geo/MIME 키는 익명 처리했습니다. 브라우저 ID2 탭1 바인딩은2회 timeout/kernel reset으로 실패했으며 앱의 동작 실패로 단정하지 않습니다.

관련36 tests, 전체669 tests, 번역 검사, production build, 격리 package:verify --terminal PASS. 승인된103 앱에 deb `dist/tastedev-linux_0.1.0_amd64-nginx-observed-help.deb`를 반영했습니다. SHA-256 `d2a5718d3e1006a2cbc19a9b7c30f9811ce1817b04e15db0658b001c2f0e5a9d`, package evidence `package-2026-10-04T18-32-54.405Z.json`. 설정4개 hash 보존, active/whitecalvin/helper91·manifest·BUILD_ID·root 소유권, login200/미인증9 API401 및 설치5·HTTP3 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-observed-help-delivery-20261005.json`, 같은 prefix inventory/installed/bundles 및 `nginx-gui-tab-timeout-20261005.json`. 브라우저 및 미해결 include 검증과 전체 목표는 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 매핑 규칙 설명·입력103 반영

map·geo·types 내부 키가 gzip/worker_connections/server_tokens 등과 겹쳐도 일반 결과 값 입력과 검증을 사용합니다. 일반 지시어의 숫자·스위치 검증은 유지합니다. 포함된 map/geo 파일의 문맥을 따라가고, 불확실한 파일에도 map/geo 설명 문맥을 선택할 수 있습니다. map/geo 규칙 설명과 이전 HTTP upstream·Basic 인증 설명 보완을 포함합니다. 관련13 tests, 전체667 tests, 번역 검사, production build 및 격리 package:verify --terminal PASS.

승인된103 앱 업데이트 완료. deb `dist/tastedev-linux_0.1.0_amd64-nginx-mapping-controls.deb`, SHA-256 `4a6ec55d09fe3a087db26d63f54b67739ca6bf5648c2bce535077c00480c9a95`, package evidence `package-2026-10-04T18-19-13.137Z.json`. 설정4개 hash 보존, active/whitecalvin, helper91·manifest·BUILD_ID·root 소유권, login200와 미인증9 API401, 설치5·HTTP3 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-mapping-controls-delivery-20261005.json` 및 같은 prefix 설치/자산 기록. 운영 nginx/DB/Certbot/cron 설정과 sudo 정책은 변경하지 않았습니다. 실제 브라우저 GUI와 전체 시스템 완료 증거는 남아 있으므로 전체 목표 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx map·geo 설정 설명 패키지 준비

map의 문자열·정규식 매핑과 default/hostnames/include/volatile, geo의 주소·CIDR·범위와 default/include/delete/proxy/proxy_recursive/ranges/volatile에 문맥별 설명을 추가했습니다. HTTP upstream의 분산·공유 메모리·resolver 및 Basic 인증 설명 보완도 포함합니다. 영문·일문·포르투갈어 카탈로그는 영어 기준1321개 키와 일치합니다. 관련35 tests, 전체664 tests, 번역 검사, 별도 production build와 격리 package:verify --terminal PASS. 클라이언트 자산의 새 설명 문구도 확인했습니다.

deb `dist/tastedev-linux_0.1.0_amd64-nginx-mapping-help.deb`, SHA-256 `8289a5df8020569c76a741286455248a6237667736dbf13b022ac1326e3f03a8`. 증거 `.runtime/verification/nginx-mapping-help-20261005.json`. 이번 패키지는 아직103에 설치하지 않았으며 현재 설치본은 아래 일본어 완료 패키지입니다. 브라우저 GUI와 전체 목표는 PARTIAL입니다.

## 2026-10-05 일본어 기준 UI 카탈로그1300개103 반영

일본어의 남은143개(지난 단계 nginx 설명142개와 합쳐 이전 배포 대비285개)를 번역했습니다. 영어 기준1300개와 키가 정확히 일치하며 누락·빈 값·잔여 Hangul·placeholder 불일치0개입니다. ja/ja-JP는 완성된 기준 catalog를 공유합니다. 기존 공백 alias가 canonical trimmed 번역을 사용하는 계약에 맞춰 최초 검사 예상만 정정했습니다. 전체 화면의 시각적/언어 품질 검증이나 기준 catalog 밖 동적 문구, 모든 Linux 언어 번역 완료를 뜻하지 않습니다.

관련28 tests/i18n/production build, 전체662 tests 및 격리 package:verify --terminal PASS. 실제 패키지가 제공하는 로그인 클라이언트 파일에서 일본어 HBA·감사 문구도 확인합니다. deb `dist/tastedev-linux_0.1.0_amd64-japanese-complete.deb` SHA-256 `48187b1668d0ce5d5ebb6dccbb6c2a779658b9f0501276c9daea68c27948c594`, package evidence `package-2026-10-04T17-57-45.835Z.json`.

승인된103 앱 업데이트를 적용하고 설정4개 hash 보존·active whitecalvin·helper91 runtime/manifest/BUILD_ID/root 소유권·login200·미인증 감사/복구9건401을 확인했습니다. 설치 자산5개·HTTP 자산3개 hash 일치 PASS. 운영 nginx/DB/Certbot/cron 파일과 sudo 정책은 변경하지 않았습니다. 증거 `.runtime/verification/japanese-complete-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles. 브라우저 GUI 검증과 다른 언어 전체 지원은 미완료이며 전체 목표 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 최신 nginx 설명·감사 페이지·HBA 확인창103 반영

최신 소스를 별도 빌드 복사본에서 검증하고 `dist/tastedev-linux_0.1.0_amd64-nginx-help-audit-hba.deb`를 승인된103 설치 앱에 업데이트했습니다. SHA-256 `187e537df12db60a0dc17b378b42e323d7e5192b33f029843a080d1d1eb6ee49`, package evidence `package-2026-10-04T17-42-10.167Z.json`. nginx TLS/realip/rewrite/if 설명, 감사 기록100건 페이지와 append snapshot, HBA 앱 내부 삭제 확인 및 stale/중복 승인 보호를 포함합니다. 전체 컴포넌트 회귀660 PASS, 최종 번역을 포함한 관련14/i18n/production build PASS, 실제 패키지의 인증된 감사 HTTP 페이지/PTY 검사 포함 `package:verify --terminal` PASS입니다.

설치 직전 진행 중인 작업 없음과 기존 보안·계정·systemd user override·환경 파일4개 hash를 확인했고 설치 후 동일함을 확인했습니다. 서비스 active/whitecalvin, helper91 runtime·manifest·BUILD_ID·root 소유권 일치, login200 및 미인증 감사·복구9개 요청401 PASS. 설치된 자산5개·HTTP 제공 자산3개 해시가 검증 빌드와 일치합니다. 운영 nginx/DB/Certbot/cron 설정과 sudo 정책은 변경하지 않았습니다. 로컬 개발 서버의 빌드 파일도 교체하지 않았습니다. 브라우저 GUI 조작과 실제 운영 적용은 검증되지 않았으며 전체 목표는 PARTIAL입니다. 증거 `.runtime/verification/nginx-help-audit-hba-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles. 아래는 이전 단계 이력입니다.

## 2026-10-05 일반 파일 IDE 탭 닫기·격리 GUI 입력 진단103 반영

일반 IdeEditor의 미저장 탭 닫기를 native confirm에서 앱 확인창으로 통일했습니다. text/baseline/version을 캡처하고 승인 및 함수형 상태 갱신 시 확인하여 최신 편집을 닫지 않습니다. 다른 활성 탭을 유지하고 닫힌 활성 탭은 오른쪽/왼쪽 인접 탭으로 이동합니다. 취소·오래된 승인·queued 편집 보존을 검사했으며 탭 닫기는 파일 API/디스크 저장을 실행하지 않습니다.

관련5 tests, 전체653 tests/i18n/production build/격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-workspace-tab-close.deb` SHA `9b1a16e4d5ad0613759b034c6d63c535f2bea62b138ac793a01f059cb1d6b3a6`, package evidence `package-2026-10-04T16-45-21.781Z.json`. 승인된103 앱 업데이트 후 설정4개 hash 보존, active whitecalvin/helper91·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치6개·HTTP4개 자산 일치 PASS.

실제 GUI 검증을 위해 /tmp 계정/state/workspace와 기존127.0.0.1 쿠키와 분리된127.0.0.2 루프백 IP에 조회 전용 서버를 실행했습니다. 최초8793 포트 충돌(EADDRINUSE)로 terminal 실패 후 비어 있는 포트를 배정해 정상 Ready를 확인했습니다. 로그인 화면과 입력값 표시를 확인했으나 semantic click/문서화된 native AX click/비밀번호 Enter 제출이 URL·focus·AX 변경으로 이어지지 않았습니다. JS dialog 없음/console error 없음. 앱 문제와 자동화 입력 문제의 원인은 확정하지 않으며 GUI PASS를 주장하지 않습니다. 임시 탭·서버 종료 및 포트 닫힘 확인. 기존 계정·쿠키·운영 설정은 변경하지 않았습니다. 진단 screenshot `/tmp/tastedev-gui-input-diagnostic-20261005.png`, 증거 `gui-input-diagnostic-20261005.json`.

설치 증거 `.runtime/verification/workspace-tab-close-delivery-20261005.json` 및 동일 prefix source/preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 서비스 확인창·결과 로그103 반영

nginx 시작/종료의 native confirm을 앱 ConfirmDialog로 바꿨습니다. 확인 전 API 요청은 발생하지 않습니다. 승인 시 현재 연결/API/policy version/capability/epoch를 다시 확인하고, 소비한 요청과 이전 확인 이벤트를 재사용하지 않습니다. 연속 클릭은 고정 nginx.service 요청 하나로 제한합니다. 시작/종료 결과는 별도 operation dialog shell log에 표시하며 이전 연결의 늦은 응답이 새 상태나 busy lock을 바꾸지 않습니다. dialog의 지연 close가 재개한 창을 닫지 않도록 open 상태를 확인합니다. 실제 운영 nginx 서비스를 시작/종료하지 않았습니다.

관련8 tests 및 전체650 tests, i18n/production build/격리 package:verify --terminal PASS. 최초 전체 검사에서 기존 연결 lifetime fixture2곳이 새 ConfirmDialog import stub을 누락해 실패했으며 보완 후 전체 재검사 통과. 서비스 연결 전환 중 취소/늦은 응답 보호 검사도 추가했습니다. deb `dist/tastedev-linux_0.1.0_amd64-nginx-service-dialog.deb` SHA `752f9786d651426fc5c11b55d3840752eb3b5774762b34cf38846b1c77729d3e`, package evidence `package-2026-10-04T16-27-25.283Z.json`.

승인된103 앱에 설치했습니다. 진행 작업 없음 확인, 설정4개 hash 보존, active whitecalvin/helper91·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치6개·HTTP4개 자산 일치 PASS. 로그인된 실제 브라우저 GUI·운영 서비스 제어 검증은 남아 있습니다. 운영 설정 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-service-dialog-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 코드 초기화 확인창·최신 편집 보호103 반영

NginxCodeEditor의 편집 초기화 native window.confirm을 앱 내부 ConfirmDialog로 통일했습니다. 초기화 요청이 캡처한 편집 identity/source/buffer를 승인 시점과 함수형 상태 갱신 시점에 다시 확인합니다. 확인 중 바뀐 코드·원본·선택·읽기 전용 상태는 삭제를 거부하고 다른 노드의 버퍼를 보존합니다. 취소 시 버퍼를 유지하며 identity/source/readOnly 변경 시 요청을 닫습니다. 운영 파일 또는 초안 반영 콜백을 실행하지 않습니다. 다른 화면의 native confirm은 남아 있으므로 앱 전체 통일 완료를 주장하지 않습니다.

관련7 tests(컴포넌트 초기화·취소·확인 중 변경·다른 버퍼 보존 및 순수 함수 재검사), 전체648 tests, i18n, production build 및 격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-nginx-editor-reset.deb` SHA `610f2529af2fdb97defa9c3e87f703d3778e4d7e2ab4f3f1e49c9a5bb00b9ccb`, package evidence `package-2026-10-04T16-19-32.730Z.json`.

승인된103 설치 앱에 업데이트했습니다. 진행 작업 없음과 기존 보안·계정·systemd override·환경4개 hash 보존, active whitecalvin/helper91·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치6개·HTTP4개 자산 일치를 확인했습니다. 로그인된 실제 브라우저 조작 검증은 남아 있습니다. 운영 nginx 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-editor-reset-delivery-20261005.json` 및 동일 prefix source/preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 stream upstream 설명·추천 메뉴103 반영

stream upstream 블록이 HTTP upstream 도움말을 사용하던 부분을 전용 설명으로 바꿨습니다. server·zone·hash·least_conn·random·resolver·resolver_timeout 7종에 stream upstream 공식 지시어 링크와 설명을 추가했습니다. upstream DNS 설정의 1.27.3 최소 버전 안내를 포함합니다. stream 트리 메뉴에서 이름 있는 upstream 블록을 생성하고 TCP·UDP 백엔드 지시어를 추가할 수 있습니다. HTTP keepalive/location/root 추천은 표시하지 않습니다. 영어·포르투갈어 번역을 추가했습니다. 이 범위가 모든 stream 외부 모듈 지시어 설명을 증명하지는 않습니다.

관련15 tests(실제 컴포넌트 메뉴 핸들러/초안 원본 보존 포함), 전체647 tests/i18n/production build 및 격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-nginx-stream-upstream.deb` SHA `53dfca34ea20b72ef2cde4b4cf8dbe9249d858efe7b63849dae5d291d1308c14`, package evidence `package-2026-10-04T16-12-27.301Z.json`.

승인된103 앱에 업데이트했습니다. 기존 설정4개 hash 보존, active whitecalvin, helper91/manifest/BUILD_ID/root ownership/login200/미인증 복구8건401 및 설치 자산6개·HTTP 제공4개 hash 일치를 확인했습니다. 현재 브라우저 URL은8792 관리자 로그인이며 정확한 로그인 heading 1개를 확인했습니다. 로그인된 GUI 조작/운영 nginx 적용은 검증하지 않았습니다. 증거 `.runtime/verification/nginx-stream-upstream-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx include 문맥별 설정 설명103 반영

조회된 include 연결을 따라 HTTP·stream·mail·upstream 설정 설명과 추천 항목을 구분합니다. 파일이 여러 문맥에서 포함되거나 include 조회가 불완전하면 설명 문맥을 선택하게 하며, 선택은 설정 초안이나 운영 파일을 변경하지 않습니다. 그래프 갱신 후 유효하지 않은 이전 선택은 무시합니다. 외부·미확인 지시어는 기본값을 추정하지 않고 공식 문서 확인 안내를 유지합니다.

관련14 tests, 전체646 tests, i18n 및 production build PASS. 초기 선택 없음에서 발생한 null 접근을 수정하고 회귀 검사했습니다. 패키지 생성 완료 전에 시작한 최초 검증은 불완전 archive로 실패했으며 생성 완료 후 재검증 PASS. deb `dist/tastedev-linux_0.1.0_amd64-nginx-include-help.deb` SHA `a731d581596ec0473debe68df4ab60ab00baf272ec666dfdaf6b1a1b211fa056`, 격리 package:verify --terminal PASS, package evidence `package-2026-10-04T16-06-08.174Z.json`.

승인된103 설치 앱에 반영했습니다. 진행 작업 없음과 기존 보안·계정·systemd override·환경4개 hash 보존을 확인했으며 active whitecalvin/helper91 runtime·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치·HTTP 자산 일치 PASS. 로그인된 GUI 검증은 이전 사용자 로그인 요청 대기 상태입니다. 운영 nginx 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-include-help-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 단일 편집 경로·코드 복구 확인창103 반영

ServerManager가 NginxConfigTree에 전달하던 미사용 legacy 서버 폼 JSX와 미사용 props/상태/import를 정리했습니다. 기존 트리 컴포넌트가 children을 표시하지 않았으므로 이 폼은 실제 화면에서 사용할 수 없었습니다. 기존 검사도 stub children을 순회해 폼이 표시된 것으로 오인하던 부분을 실제 전달 구조에 맞춰 수정했습니다. 새 외부 코드 편집창을 만드는 미사용 opener/native confirm은 제거했으나 nginxTreeCode에 이미 보존된 이전 편집 기록의 보기/수정/트리 반영 경로는 유지했습니다. Certbot 도메인 연계를 위한 선택 콜백은 유지합니다. 코드 복구의 앱 확인창과 변경/readonly 대상 거부도 함께 포함합니다.

기존 코드 복구/Certbot·cron/중복 요청·이전 연결 응답 거부 관련3 tests 및 전체643 tests/i18n/production build PASS. 최초 복구 fixture에서 liveSource 메타데이터 누락으로 검사 실패 후 실제 record 형식에 맞춰 보완해 통과했습니다. deb `dist/tastedev-linux_0.1.0_amd64-nginx-editor-consolidated.deb` SHA `8ec4101e1c6a82a1af6baae9200a7abbd5d0f7f860b0588a57f55dcfc3d57f79`, package evidence `package-2026-10-04T15-52-43.872Z.json`, 격리 package:verify --terminal PASS.

승인된103 앱에 설치했습니다. 진행 작업 없음 확인 후 보안·계정·systemd user override·환경 파일4개 hash 보존/active whitecalvin/helper91 runtime·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401을 확인했습니다. 설치 자산6개와 HTTP 제공4개가 빌드와 일치합니다. 원격 GUI 상호작용은 이전 관리자 로그인 요청 대기 중이며 실제 선택/확인창 동작을 검증했다고 주장하지 않습니다. 운영 nginx 파일은 변경하지 않았습니다. 증거 `nginx-editor-consolidated-delivery-20261005.json`, `nginx-editor-consolidated-preflight-20261005.json`, `nginx-editor-consolidated-install-result-20261005.json`, `nginx-editor-consolidated-installed-20261005.json`, `nginx-editor-consolidated-bundles-20261005.json`. 전체 목표 PARTIAL. 아래 기록은 이전 단계 이력입니다.

## 2026-10-05 nginx 코드 복구 확인창·최신 편집 보호

NginxCodeRecovery의 대상 코드 덮어쓰기/보존 코드 버리기 native confirm2곳을 앱 내부 ConfirmDialog로 바꿨습니다. 취소는 버퍼를 유지하며 승인할 때 캡처한 원본/대상 버퍼 및 대상 노드 identity/source/존재/읽기 전용 상태를 다시 검사합니다. 변경되었으면 작업을 거부하고 코드를 보존합니다. 버리기는 확인한 버퍼만 제거하고 다른 편집을 유지합니다. readonly 파일도 nginxEditorTarget에 표시하며 recoverNginxCodeBuffer가 거부합니다. 복구 dialog의 지연 close event가 재개한 dialog를 닫지 않도록 open 상태를 확인합니다.

관련6 tests와 전체643 tests/i18n/production build PASS. 컴포넌트 실제 핸들러에 대한 request/cancel/approve/stale destination/readonly 검사이며 로그인된 실제 브라우저 UI 증거가 아닙니다. 원격8792 탭은 관리자 로그인 화면으로 확인됐고 이전 사용자 로그인 요청은 대기 중입니다. 개발 소스 변경이며103 설치본은 직전 nginx-descriptions deb입니다. ServerManager의 legacy openTreeCode native confirm은 아직 남으며 앱 전체 제거를 주장하지 않습니다. 운영 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-code-recovery-dialog-20261005.json`. 전체 목표 PARTIAL.

## 2026-10-05 nginx 설명·메뉴 패키지103 반영

검증한 deb `dist/tastedev-linux_0.1.0_amd64-nginx-descriptions.deb` SHA `7ee4ad31ff4cf626a74178a45d2bb4d72186f896a895564f032432641839c7fc`를 승인된103 설치 앱에 반영했습니다. 설치 직전 active/whitecalvin/진행 중 child·helper 작업 없음과 보안·service-user·user override·환경 파일4개 hash를 확인했으며 설치 후4개 hash가 동일합니다. 서비스 active, helper/91 runtime/manifest/BUILD_ID/root ownership 일치, login200 및 미인증 복구8건401 PASS. 설치된6개 및 HTTP 제공4개 JS/CSS hash가 현재 검증 빌드와 일치합니다.

원격 브라우저의 nginx IDE 이동은 관리자 로그인 페이지로 리다이렉트됐습니다. 기존 계정으로 사용자 로그인을 요청했으며 로그인 세션을 우회하거나 비밀번호를 변경하지 않았습니다. 따라서 원격 노드 선택·설명 화면·확인창 조작은 로그인 후 검증이 남습니다. 로그인 화면 screenshot `/tmp/tastedev-nginx-update-login.jpg`. 증거 `nginx-descriptions-delivery-20261005.json`, `nginx-descriptions-preflight-20261005.json`, `nginx-descriptions-install-result-20261005.json`, `nginx-descriptions-installed-20261005.json`, `nginx-descriptions-bundles-20261005.json`. 전체 목표 PARTIAL. 아래 미설치 표시는 이전 단계 이력입니다.

## 2026-10-05 nginx 설명 패키지·컨텍스트 메뉴 실행 경로 수정

stream/mail 추천 메뉴를 표시하는 단계뿐 아니라 실제 nodeAction에서 조회하는 프리셋에도 프로토콜 문맥을 전달했습니다. stream의 server + 메뉴가 광고한 서버 블록을 실제 초안에 추가하는 검사와 원본 보존 검사를 추가했습니다. 관련11 tests와 최종 production build PASS. 이전 전체640 PASS 이후 이 메뉴 실행 경로를 보완했으며 전체검사를 반복했다고 주장하지 않습니다.

배포 deb `dist/tastedev-linux_0.1.0_amd64-nginx-descriptions.deb` SHA `7ee4ad31ff4cf626a74178a45d2bb4d72186f896a895564f032432641839c7fc`를 생성하고 격리 package:verify --terminal PASS를 확인했습니다. 인증·터미널 PTY HTTP·권한 거부·패키지 파일/BUILD_ID/closure 검증을 포함하며 실제 사용자의 GUI 동작이나 운영 nginx 적용 증거가 아닙니다. 서버103에는 아직 설치하지 않았습니다. package evidence `package-2026-10-04T15-36-28.695Z.json`.

새 개발 브라우저 탭에서 인증 화면/트리를 확인하고 검색 입력 events→필터링→검색 초기화는 반영됐습니다. 파일/노드 클릭과 Enter/컨텍스트 키, 모두 접기 클릭은 화면 변경을 확인하지 못했습니다. 검색 동작은 React가 실행 중임을 보이며 버튼 전반의 원인은 확정하지 않았습니다. 기존 탭의 JS 확인창 조회는 false였으나 DOM 조회는 focus timeout입니다. 새 탭의 DOM에서 버튼이 실제 클릭 대상이며 overlay가 없음을 확인했습니다. 진단 screenshot `/tmp/tastedev-nginx-selection-diagnostic.jpg`. 임시 탭을 닫았고 운영 설정 변경은 없습니다. 증거 `.runtime/verification/nginx-descriptions-package-20261005.json`. 전체 목표 PARTIAL.

## 2026-10-05 nginx HTTP·stream·mail 문맥 구분

stream/mail/if 블록 설명을 추가하고 server 블록의 의미와 설정 설명·공식 링크·추천 항목을 프로토콜별로 구분했습니다. TCP/UDP proxy_pass 예시에 HTTP URL을 사용하지 않으며 stream server의 컨텍스트 메뉴에 HTTP location을 추천하지 않습니다. 알 수 없는 프로토콜 항목에는 HTTP 설명을 잘못 대입하지 않고 문서 확인 안내를 유지합니다. 다른 파일에서 include된 블록의 외부 문맥 추론은 아직 구현하지 않았습니다.

전체640 tests PASS 이후 컨텍스트 메뉴의 프로토콜 구분을 추가했으며 최종 관련11 tests와 production build PASS. i18n PASS. 별도 개발 브라우저 탭에서 인증 화면·nginx 트리 로드는 확인했으나 클릭/Enter 이후 inspector가 선택 화면으로 전환되지 않아 실제 선택 동작은 미검증입니다. 콘솔 오류는 없었으며 임시 검증 탭을 닫았습니다. 원격 패키지 설치나 운영 파일 변경은 하지 않았습니다. 증거 `.runtime/verification/nginx-protocol-help-20261005.json`. 전체 목표 PARTIAL.

## 2026-10-05 nginx 항목 직접 선택 시 설명 표시 보완

기본 제공 지시어79종의 전용 설명 누락0을 재확인했습니다. 트리의 지시어를 직접 선택하면 이전에는 자식 목록이 비어 설명이 표시되지 않았으므로, 선택 지시어를 기존 설명/입력 행으로 표시하도록 수정했습니다. 부모 블록 문맥을 유지하여 upstream 연결 유지 설정과 HTTP 설정, types MIME 항목을 구분합니다. 중복 원시 값 편집기를 제거하고 events/http/server/location/upstream/types/limit_except/map/geo 블록의 역할·인수 설명과 공식 문서 링크를 제공합니다. 외부 모듈은 문서 확인 안내를 유지합니다.

관련7 tests/i18n/production build PASS. 브라우저 탭 조회가 Emulation.setFocusEmulationEnabled에서 시간 초과되어 실제 화면 확인은 미검증입니다. 개발 소스 변경이며 이번 요청에서 원격103 패키지를 설치하거나 운영 nginx 파일을 변경하지 않았습니다. 증거 `.runtime/verification/nginx-setting-descriptions-20261005.json`. 전체 목표 PARTIAL. 아래는 이전 기록입니다.

## 2026-10-04 nginx 중복 입력·블록 추가 UI 정리 및103 반영

지시어 추가는 NginxBlockSettings의 설정 목록/사용자 지정 폼으로 통일하고 기존 중복 추가 폼은 블록 추가만 처리합니다. http/events/server/types/stream/mail처럼 인수가 없는 블록의 빈 값 편집기를 제거하며 location 등 인수 있는 블록의 편집기를 유지합니다. events/types/upstream의 자식 블록 추가 폼은 표시하지 않으며 다른 노드로 이동할 때 추가 폼의 접힘 상태를 분리합니다. location 인수 편집 유지/새 location 블록 구조/원본 파일 보존을 포함한 관련16 검사와 i18n/build/deb --terminal 검사 PASS. 직전 전체636 PASS는 이전 소스 기준이며 이번 전체 검사를 반복했다고 주장하지 않습니다.

개발 인증 브라우저에서 http의 추가 폼으로 server 블록을 추가해 트리 server5개를 확인하고, 실행 취소 후 전체 코드가 검증 전 원본과 정확히 동일한 것을 확인했습니다. 최종 events DOM에 빈 인수/자식 블록 추가 폼이 없음을 확인했습니다. QA 기록 정리를 위해 원본 일치 확인 뒤 끝 newline만 초안에 반영하고 초안 초기화를 클릭했으나 확인창에서 CDP mouse/focus 명령이 응답하지 않았습니다. getJsDialog도 실패했고 최종 screenshot timeout으로 CUA kernel이 reset됐습니다. 사용자에게 확인창 직접 처리를 요청했으며 완료했다고 주장하지 않습니다. 운영 /etc/nginx/nginx.conf SHA `d7be180d12cb332090cf4a0e8de780bd30e7f59fd0ffa4ad42be0e70e6bc6348`가 검증 전과 동일합니다. 운영 적용 버튼/API는 실행하지 않았습니다.

최종 deb `dist/tastedev-linux_0.1.0_amd64-nginx-clean-settings.deb` SHA `a6a583a1e81b23aafd4a81564518b8f08c7c25d2da54d8c9144dc38b813b3cc9`, package evidence `package-2026-10-04T14-50-01.926Z.json`를 승인된103 앱에 설치했습니다. 작업 없음/기존 설정4개 checksum 동일/active whitecalvin/login200/미인증 복구8건401/helper와91 runtime·manifest·BUILD_ID·root ownership 일치 검사 PASS. 설치된 GUI assets6개와 HTTP 응답4개가 검증 빌드와 일치합니다. 최초 중간 패키지 ad21e818…는 보존했으며 설치하지 않았습니다. 최종 화면 screenshot과 원격 브라우저 실제 조작은 미검증입니다.

증거 `nginx-clean-settings-delivery-20261004.json`, `nginx-clean-settings-preflight-20261004.json`, `nginx-clean-settings-install-result-20261004.json`, `nginx-clean-settings-installed-20261004.json`, `nginx-clean-settings-bundles-20261004.json`. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 nginx 설정 설명·선택 컴포넌트 103 배포

개발 브라우저에서 검증한 설정 설명/블록 문맥 도움말 및32px 선택 화살표 정렬을 deb에 반영했습니다. 상태가 분리된 전체636 tests와 deb --terminal 검증 PASS. 새 패키지 `dist/tastedev-linux_0.1.0_amd64-nginx-help-ui.deb` SHA `aeb979de5acdad56be032feccabb2be6732dc8b77545758fcf3367b7bf738fa5`, package evidence `package-2026-10-04T14-35-35.594Z.json`.

승인된103 앱에 대해 서비스 active/실행 계정 whitecalvin, 진행 중 child/helper 작업 없음, 보안·service-user·systemd user override·환경 파일4개 checksum을 설치 직전 재확인했습니다. 업데이트 후4개 checksum 동일/서비스 active/login200/미인증 복구8건401/helper 및91 runtime/manifest/BUILD_ID 일치와 root ownership 검사가 통과했습니다. 새 nginx 도움말/선택 컴포넌트 JS·CSS6개 설치 hash와4개 HTTP 응답 hash가 검증 빌드와 동일합니다. 원격 readOnly=false/terminal=true를 유지했고 로컬 fileEditing 변경을 원격에 복제하지 않았습니다. 이전 deb와 증거를 보존합니다.

증거 `nginx-help-ui-delivery-20261004.json`, `nginx-help-ui-preflight-20261004.json`, `nginx-help-ui-install-result-20261004.json`, `nginx-help-ui-installed-20261004.json`, `nginx-help-ui-bundles-20261004.json`. 전체 목표 PARTIAL. 원격의 실제 로그인 브라우저 조작/운영 nginx 적용·복원/다른 패키지 운영 E2E는 이 배포 검사의 증거로 대체하지 않습니다. 아래는 이전 단계 이력입니다.

## 2026-10-04 개발 nginx 설정 설명·블록 문맥·브라우저 동기화 검증

개발8787의 기본 제공79개 지시어에 설명/공식 링크를 제공하고 FastCGI·TLS 도움말을 보완했습니다. 이후 실제 개발 /etc/nginx 파일7개를 읽어 이름만 점검하니 worker_cpu_affinity/proxy_ssl_name/allow/deny가 일반 fallback 상태여서 전용 설명을 추가했습니다. 재검사에서 활성 지시어36종의 설명 누락0/읽기 오류0을 확인했습니다. 설치된 모든 외부 모듈·다른 서버의 모든 설정을 포괄하는 증거는 아닙니다. 외부/사용자 지정 지시어는 알 수 없는 의미/기본값을 만들지 않고 모듈 문서 확인 안내를 표시합니다.

선택 블록 문맥을 도움말과 검색에 전달합니다. upstream의 keepalive_requests/time/timeout 및 resolver_timeout은 해당 모듈의 설명/링크를 사용하며 types 블록의 MIME 행에는 확장자 매핑 설명을 제공합니다. 관련20 tests, i18n check, production build PASS. 실제 로그인된 개발 브라우저에서 nginx.conf 코드에 multi_accept off를 worker_connections 앞에 추가하고768→769를 편집해 초안에 반영한 뒤 events 설정 화면의 순서/값/설명 갱신을 확인했습니다. 실행 취소 후 코드 전체가 검증 전과 정확히 동일함을 확인했습니다. 운영 적용은 실행하지 않았습니다. 증거 `.runtime/verification/nginx-help-installed-files-20261004.json`, 화면 `/tmp/tastedev-nginx-context-help.jpg`.

직전 개발 보안 변경은 readOnly=false 유지/fileEditing=true이며 다른 권한 옵션을 유지했습니다. 선택 컴포넌트는 실제32px 높이/16px 화살표/중앙 오차0 및 펼침·접힘 확인: `nginx-help-select-dev-20261004.json`. 이번 변경은 개발 소스/8787에 반영됐으며103 설치 앱은 이전 pg-all-settings deb를 유지합니다. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 PostgreSQL 선택 파일 전체 항목 GUI·103 반영

PostgreSQL 파일 노드는 이제 5개 미리 정한 폼 대신 선택 파일의 설정과 문법상 유효한 주석 처리 항목을 파일 순서대로 표시합니다. 별도 설정 노드에서도 같은 화면을 열며 기존 연결/메모리/로그 그룹 전용 폼은 유지합니다. 설정 이름/값/설명 검색, 항목 활성·주석 처리, 값 비우기(행 유지/주석 전환), 사용자 지정 항목 추가를 지원합니다. 변경은 같은 전체 코드 초안에 반영되며 코드 편집도 행/순서를 갱신합니다. 값 입력 중에는 row key를 보존하여 매 입력마다 입력칸이 재생성되지 않습니다. 잘못된 중간 입력은 코드에 반영하지 않고 표시하며, GUI로 읽을 수 없는 문법은 오류와 코드 보기로 안내합니다. 파일 밖 include/실행 중 pg_settings 값, enum/범위/재시작 메타데이터 전체 지원 또는 운영 자동 적용 기능으로 확대하지 않습니다.

새 파서는 optional equals, 인용 문자열 내부 #, doubled quote/backslash quote, CRLF, 중복 항목을 보존하며 선택한 줄만 바꿉니다. 오래된 줄·다중 행 주입·잘못된 값은 거부합니다. 첫 공식 sample 검사에서 단위 설명 주석4줄을 항목으로 오인했으며 유효하지 않은 주석 문장을 제외하도록 수정했습니다. 설치 PostgreSQL18.6 공개 sample353개 항목을 읽고 임시 파일의 port/shared_buffers/log_line_prefix를 실제 postgres -C로 확인했습니다. binary SHA `30a38e0516ec1bde4b8ca710cf28ba51ee78bd004cabbf3107e7a52d5414a64a`. 서버/DB를 시작하거나 운영 설정을 변경하지 않았습니다.

관련7 tests, 최종 전체633 tests, i18n check, production build 및 deb --terminal 검증 PASS. 새 feature 문구 추가 후 포르투갈어 complete-catalog 회귀가 실패해 해당 신규 문구를 번역하고 전체검사를 다시 통과했습니다. 새 deb `dist/tastedev-linux_0.1.0_amd64-pg-all-settings.deb` SHA `fba2ae049b727dced8c9bf165d80b6d84958cc8bc16e835f03ff6e2adc5338d0`를 승인된103 앱에 설치했습니다. 진행 작업 없음/설정4개 checksum 보존, active/whitecalvin, login200, 미인증 복구8건401, helper/91runtime/manifest/BUILD_ID 일치 확인. 새 PostgreSQL GUI의 server/client2개 및 login JS9개 SHA가 검증 빌드와 일치합니다. 로그인 브라우저의 실제 키 입력/화면 시각 검증은 아닙니다.

증거 `.runtime/verification/pg-all-settings-delivery-20261004.json`, `postgresql-all-settings-native-20261004.json`, `pg-all-settings-preflight-20261004.json`, `pg-all-settings-install-result-20261004.json`, `pg-all-settings-installed-20261004.json`, `pg-all-settings-installed-bundles-20261004.json`, `pg-all-settings-served-20261004.json`, `package-2026-10-04T14-03-51.256Z.json`. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 목표 시스템: 실행 계정의 기본 셸 터미널 반영

터미널 신규 기본값을 고정 `bash -i`에서 서버 실행 계정(userInfo)의 기본 셸로 변경했습니다. terminal-context 및 PTY SHELL도 같은 계정 값을 사용합니다. 경로를 shell quoting하여 실행하며 nologin/false 및 잘못된 기본 셸 경로는 거부합니다. 명시적 Bash/Codex/Claude 선택과 기존 저장된 선택은 유지합니다. 출력에는 내부 프리셋 이름 대신 실제 셸 실행 명령을 표시합니다. 웹 로그인 계정과 OS 실행 계정은 서로 다른 역할이며 SSH 접속 정보를 추가로 요구하지 않습니다.

전체628 검사 PASS 후 출력 명령 표시만 보완하여 관련9 검사·최종 production build·deb --terminal 검사 PASS. 실제 로컬 whitecalvin 기본 Bash PTY의 UID 일치/Enter(CR) 입력/출력/100×30 크기 변경/정상 종료 PASS. 최초300ms 시작 대기 검사에서는 실패했고 원인은 분리하지 못했습니다. 1200ms 대기 후 LF 및 CR 검사가 통과했습니다. 최초 실패를 없던 것으로 처리하지 않습니다. 로그인된 브라우저 키 입력 증거는 아닙니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-account-shell.deb`, SHA `46c60d207997fb84013da4565d328bd619dfaaa74126d120aaf759d8414aef11`를 승인된103 앱에 설치했습니다. 작업 없음 조건/설정4개 checksum 보존, active/whitecalvin, login200, 미인증 복구8건401, helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다. 변경된 터미널 서버·클라이언트3개 번들과 login JS9개 SHA가 현재 검증한 빌드와 일치합니다. 개발8787 및 기존103 터널8792의 login200도 확인했습니다. 보류된 일본어90개와 신규 셸 오류 문구도 빌드에 포함되어 ja1010/1190이며180개 미번역입니다.

증거 `.runtime/verification/account-shell-delivery-20261004.json`, `account-shell-native-20261004.json`, `account-shell-preflight-20261004.json`, `account-shell-install-result-20261004.json`, `account-shell-installed-20261004.json`, `account-shell-installed-bundles-20261004.json`, `account-shell-served-20261004.json`, `package-2026-10-04T13-46-34.144Z.json`. 전체 목표 PARTIAL. 앞으로 현재 요청의 우선순위는 목표 시스템의 패키지별 운영 GUI/터미널 실제 동작이며, 추가 번역 항목 수를 기능 구현 진척의 대체 지표로 사용하지 않습니다. 아래는 이전 단계 이력입니다.

## 2026-10-04 일본어 운영·IDE 안내205개 추가·103 반영

일본어 파일/디스크 비교, 패키지 설정 안내, 보안 권한, nginx server·인증서·cron·터미널, 설정 트리 및 PostgreSQL 적용/복구 영향205개 항목을 번역했습니다. 일본어919/전체1189 항목으로270개 미번역이며 영어 fallback/부분 번역 표시는 유지합니다. 관련17 tests, i18n:check, production build 및 package --terminal 검증 PASS입니다. 전체 언어 또는 실제 전체 GUI 완료 증거로 확대하지 않습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-ja-operations.deb` SHA `ba7a51cca309b9d304895431afe5e44e1c5103565104a9789acf94aa4a280de8`를 승인된103 앱에 설치했습니다. 작업 없음 조건 및 기존 설정4개 checksum 보존 확인. 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치 확인. 제공 JS9개 SHA가 검증한 로컬 빌드와 전부 일치하며 새 일본어6종의 문자열 포함을 확인했습니다. source catalog SHA `a3815461079b4c38666b8af9397568f3034cf8cbabcf7db2f7e11e98aa939fec`. 브라우저 언어 선택·키보드/마우스 조작과 전체919개 문구 렌더링 검증은 아닙니다.

증거 `.runtime/verification/ja-operations-delivery-20261004.json`, `ja-operations-preflight-20261004.json`, `ja-operations-install-result-20261004.json`, `ja-operations-installed-20261004.json`, `ja-operations-served-20261004.json`, `package-2026-10-04T13-31-52.275Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 포르투갈어 기준 catalog1189개 충족·103 반영

남은288개 항목(nginx 지시어 설명·코드/미저장 복구, 환경 파일 복원, 터미널 입력·오류, PostgreSQL HBA 적용/복구와 중단 작업 복구)을 번역했습니다. pt-BR/pt-PT 공통 catalog의 키는 영어 기준1189개와 정확히 일치하며 누락0개, placeholder 불일치/빈 값/잔여 Hangul0개입니다. 기존 부분 catalog 회귀 검사를 전체 키·coverage 일치 검사로 변경했습니다. 문구의 기술 용어/수치/확인 영향은 보존했습니다. 기준 catalog 밖의 미추출·동적 메시지와 실제 전체 UI의 번역 품질까지 완료한 결과는 아닙니다. 다른 Linux 언어 전체 번역도 미완료입니다.

관련17 tests 및 i18n:check PASS. 실제 컴파일된 LanguagePicker를 pt-BR/pt-PT/aa-DJ context로 React 서버 렌더링하여 Portuguese 선택 항목에 부분/영어 UI 안내가 없고 미번역 Afar 선택에는 English UI가 유지됨을 확인했습니다. 각324개 항목을 확인했습니다. 브라우저 선택·저장 상호작용 증거는 아닙니다. production build 및 package --terminal verifier PASS; 해당 verifier의 과거 'Portuguese partial catalog' 체크 이름은 카탈로그 제공 확인의 기존 이름이며 현재 누락 수 판정으로 사용하지 않았습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-pt-catalog.deb` SHA `501e85f8c02cbbc8a36209f7cad2a5be32d2491955ba25e177ce859468a182e2`를 승인된103 앱에 설치했습니다. 진행 작업 없음 및 설정4개 checksum 보존 확인. 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치 확인. 실제 제공 JS9개 SHA는 검증한 로컬 빌드 파일과 전부 일치했습니다. 새 번역6종의 문자열 포함도 확인했습니다. source catalog SHA `95bae2d4e26abf6bfa0385940ea4d747bdd1f3d62cb22ea7abc2d0fb13823510`.

증거 `.runtime/verification/portuguese-catalog-render-20261004.json`, `pt-catalog-delivery-20261004.json`, `pt-catalog-preflight-20261004.json`, `pt-catalog-install-result-20261004.json`, `pt-catalog-installed-20261004.json`, `pt-catalog-served-20261004.json`, `package-2026-10-04T13-23-42.346Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 서비스 문구 잔여 한국어 수정·포르투갈어145개 추가·103 반영

영어/일본어/중국어/스페인어/프랑스어/독일어/러시아어/아랍어의 시스템 서비스 제어 값에 남아 있던 한국어 '시스템' 접두사를 각 언어로 수정했습니다. 현재9개 번역 catalog 값의 한국어 잔류는0개입니다. i18n 검사기에 비한국어 번역 값의 Hangul 잔류를 FAIL로 기록하는 검사를 추가했습니다. 기존 오류를 메모리로 주입해 실제 검사기 exit1/FAIL 및 해당 항목 검출을 확인했으며 원본 catalog는 변조하지 않았습니다. 이 검사는 번역 자연스러움이나 다른 언어의 잔류까지 판정하지 않습니다.

포르투갈어 서비스 등록·설정·제어·백업·복구, sudo 규칙·권한 영향, nginx 실행/적용/복구와 Redis 리소스/격리 검사 안내145개도 추가했습니다. 포르투갈어901/전체1189 항목이며288개 미번역입니다. 관련17 tests, clean i18n check, production build 및 package --terminal 검증 PASS입니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-service-language.deb` SHA `71c3001c284b0ae57c5906552693892ae077d40efb4ff4979660f3f49d8b3778`를 승인된103 앱에 설치했습니다. 작업 없음 및 설정4개 checksum 보존을 확인했습니다. 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401, helper/91runtime/manifest/BUILD_ID 일치 확인. 제공되는 JS9개에서 수정된9개 언어 서비스 문구와 새 포르투갈어5종을 확인했고 이전 한국어 접두사 부재를 확인했습니다. 실제 브라우저 언어 선택이나 운영 sudo/서비스 변경 검증은 아닙니다.

증거 `.runtime/verification/translation-residual-check-20261004.json`, `service-language-delivery-20261004.json`, `service-language-preflight-20261004.json`, `service-language-install-result-20261004.json`, `service-language-installed-20261004.json`, `service-language-served-20261004.json`, `package-2026-10-04T13-14-02.859Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 포르투갈어 IDE·복구·PTY 안내270개 추가·103 반영

nginx 트리/초안/코드 교체·디스크 비교, PostgreSQL 적용/백업/복구 영향, MariaDB·Redis include 연결과 Redis 제거 정책, Node 앱/환경 파일, Certbot 선택 갱신·cron 시간대, PTY 안내 및 감사 결과의 포르투갈어270개 항목을 추가했습니다. 기존 키·명령·동작은 변경하지 않았습니다. 포르투갈어756/전체1189 항목이며 미번역433개가 남습니다. 다른 Linux 언어 전체 번역도 미완료입니다.

관련 번역17 tests, i18n:check, production build 및 package --terminal verifier PASS. 새 deb `dist/tastedev-linux_0.1.0_amd64-pt-ide-fields.deb` SHA `35019d8f076946ac16636c4cda61b1b2d924960ba1e8686f72b5e52ebc6bc88f`를 승인된103에 설치했습니다. 설치 전 진행 작업과 helper 없음 조건을 확인하고 설정4개 checksum을 보존했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다.

제공되는 JS9개에서 새 nginx 트리·PostgreSQL 복원 검토·설정값 오류·Ctrl+C·앱 등록 해제·감사 결과 번역6종을 확인했습니다. source catalog SHA `2eeaedcc9cc7f6270e77db4357a2c0c15fc30fbd37a9d73edfd002ac5495636f`. 이 HTTP 확인은 실제 브라우저 입력/언어 선택 및 전체756개 문구 렌더링을 증명하지 않습니다.

증거 `.runtime/verification/pt-ide-fields-delivery-20261004.json`, `pt-ide-fields-preflight-20261004.json`, `pt-ide-fields-install-result-20261004.json`, `pt-ide-fields-installed-20261004.json`, `pt-ide-fields-served-20261004.json`, `package-2026-10-04T13-06-41.241Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 언어 선택창 번역 상태 안내 현지화·103 반영

언어 선택창의 하드코딩 English UI/Partial UI를 t('영어 UI')/t('부분 번역')로 교체했습니다. 제공되는9개 번역 catalog에 두 문구를 추가했으며 한국어는 원문을 표시합니다. 지원되지 않는 언어의 영어 fallback과 일부 번역 언어의 부분 번역 표시는 유지합니다. 고정 언어 이름/국기/선택 동작은 변경하지 않았습니다.

실제 컴파일된 LanguagePicker를 React 서버 렌더러와 제어된 언어 context로10개 언어에서 렌더링하여 안내 두 문구,324개 언어 항목, 선택1개, 고정 Afar 이름을 확인했습니다. 언어 데이터는 현재 소스에서324개이며 이전 기록의321개로 추정하지 않습니다. 이는 브라우저 저장/키보드/클릭 검증이 아닙니다. 기존 i18n/config17 tests, catalog 검사, production build 및 package --terminal 검증 PASS입니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-picker-labels.deb` SHA `44d5ee327d6d05cbb0499f5faac75e5a63694b347d0875d9ad33c6e52d5c454a`를 승인된103 앱에 설치했습니다. 설치 직전 진행 작업과 root helper 없음을 확인하고 기존 설정4개 checksum을 보존했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401, helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다. 제공되는 JS9개에서 새 포르투갈어 안내2종을 확인했습니다. 포르투갈어486/전체1189 항목으로 미번역703개가 남으며 전체 Linux 언어 번역과 실제 GUI 검증은 미완료입니다.

증거 `.runtime/verification/language-picker-label-render-20261004.json`, `picker-labels-delivery-20261004.json`, `picker-labels-preflight-20261004.json`, `picker-labels-install-result-20261004.json`, `picker-labels-installed-20261004.json`, `picker-labels-served-20261004.json`, `package-2026-10-04T12-58-47.521Z.json`. 전체 목표 PARTIAL이며 아래 기록은 이전 단계 이력입니다.

## 2026-10-04 포르투갈어 IDE·운영·패키지 설정 번역260개 추가·103 반영

파일 비교/저장, 서비스 상태·제어, 로그, 백업/복구 영향 확인, 보안 및 sudo 안내, 감사 기록, nginx 설정, Certbot 발급/약관/갱신, cron, 터미널 안내와 Node/PostgreSQL/MariaDB/Redis 설정의 누락된 포르투갈어260개 항목을 번역했습니다. pt-BR/pt-PT 공통 catalog는224개에서484개로 늘었습니다. 전체1187개 중703개는 여전히 미번역이며 Partial UI 및 영어 fallback을 유지합니다. 다른 Linux locale 전체 번역도 아직 완료되지 않았습니다. 언어 선택창의 English UI/Partial UI 하드코딩도 확인했으며 후속 개선 항목으로 남습니다.

관련 i18n/config 번역17 tests와 i18n:check PASS, production build 및 package --terminal verifier PASS. 새 deb `dist/tastedev-linux_0.1.0_amd64-pt-settings.deb` SHA `60397037b88a99a10a59ad159533557dc839a7d157428ea996fc8f75bbb6d4c1`를 승인된103 앱에 설치했습니다. 설정4개 checksum 보존 및 진행 중 작업 없음 조건을 설치 전에 확인했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다.

실제103에서 제공되는 login JS9개를 읽고 minifier 문자 이스케이프를 실행 없이 해석해, 새 서비스·복구 영향·보안 정책·약관·cron 시간식·Node 메모리 번역6종 포함을 확인했습니다. source catalog SHA `dfad7c0a48eeced0bb1bb13d617d91ed23641ef6a15b7f884fc17cd8d6389ffd`. 전체484개 항목의 렌더링/지역별 언어 선택 상호작용이나 운영 작업 실행을 증명하는 검사로 확대 해석하지 않습니다.

증거 `.runtime/verification/pt-settings-delivery-20261004.json`, `pt-settings-preflight-20261004.json`, `pt-settings-install-result-20261004.json`, `pt-settings-installed-20261004.json`, `pt-settings-served-20261004.json`, `package-2026-10-04T12-53-51.261Z.json`. 전체 목표 PARTIAL이며 아래 기록은 이전 버전 이력입니다.

## 2026-10-04 포르투갈어 운영 화면 번역 131개 추가·103 반영

계정/비밀번호 변경, 패키지 정보 및 설치 영향 확인, 작업 로그, AI 전송 동의·비용 안내, 파일 편집 안내131개를 포르투갈어로 번역했습니다. 영어 문자열을 복사해 번역 완료로 계산하지 않았습니다. pt-BR/pt-PT 공통 catalog는93개에서224개로 증가했습니다. 파일 이름이 포함된 전체 확인 문장의 {name} 변수도 유지합니다. English fallback 및 Partial UI 표시는 미번역 항목에 유지됩니다. 전체1187개 중963개가 아직 미번역이며 기타 Linux locale 지원도 전부 번역된 상태는 아닙니다.

i18n 지역 선택/변수/fallback9 tests 및 기존 설정 번역8 tests PASS, i18n:check PASS(영어 literal 누락/placeholder 불일치0), production build 및 deb --terminal 검증 PASS. 전체627 회귀는 이전 helper 수정 단계의 기록이며 이번 번역 수정에 대해 재실행한 것으로 주장하지 않습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-pt-operations.deb` SHA `440d241b031019f7195955f4f8d8dd758c7072b0add20e1ad98e96c8000b7467`를 승인된103의 같은 앱에 설치했습니다. 진행 작업 없음/이전 설정 checksum 일치를 재확인했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구 API8건401, helper/91runtime/manifest/BUILD_ID 일치와 보안 설정 보존을 확인했습니다. 최초 HTTP 검사에서는 설치되지 않는 원본 JSON 경로와 minifier의 \xHH 문자 이스케이프를 고려하지 않아 실패했습니다. 원본 JSON 대신 제공된 JS를 읽고 이스케이프 문자를 실행 없이 복원한 뒤 추가 번역4종이 실제 login client assets에 포함됐음을 HTTP로 확인했습니다. 화면 렌더링·언어 선택 상호작용을 증명하는 검사는 아닙니다.

증거 `.runtime/verification/pt-operations-delivery-20261004.json`, `pt-operations-preflight-20261004.json`, `pt-operations-install-result-20261004.json`, `pt-operations-installed-20261004.json`, `pt-operations-served-20261004.json`, `package-2026-10-04T12-44-36.619Z.json`. 전체 목표 PARTIAL입니다. 아래 설치 기록은 이전 버전 이력입니다.

## 2026-10-04 nginx 검수 stderr 로그 수정 및 103 설치 검증

103의 기존 설치본에서 실제 nginx-check는 valid=true인데 logs가 빈 문자열이었습니다. nginx -t의 성공 진단이 stderr로 출력되지만 고정 명령 실행기가 stdout만 반환하던 문제였습니다. helper의 고정 명령 실행을 spawnSync로 변경하여 stdout와 stderr를 합쳐 반환합니다. 두 스트림의 시간순 병합은 아닙니다. 2MiB 출력 제한, 실행 시간 제한, 고정 환경, root supervisor의 잠금 FD3 전달과 native 자식에 대한 FD 격리를 유지합니다. 실패 명령의 진단도 오류에 보존합니다.

전체627 tests PASS, production build PASS, package --terminal verifier PASS. 실제 UID0 격리 native 검증에서 Unicode stdout/stderr 반환과 native FD3 부재, 기존 SIGKILL 잠금·journal 복구 검사가 통과했고 컨테이너 정리를 확인했습니다. 첫 native 실행은 첫 fixture에서 10초 시간 초과로 실패했습니다. 동일 소스와 제한으로 순차 재실행하여 PASS를 확인했으며 최초 실패 원인은 확정하지 않았습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-helper-stderr.deb` SHA `272497a19ed4e08927c824c4c7b7bd33f89b8c54ce8a6457890e9bbe78f0e37f`를 승인된 103 서버에 설치했습니다. 실행 작업이 없음을 확인하고 같은 앱만 업데이트했습니다. 설치 전후 보안/계정/environment 설정 checksum이 일치합니다. 앱 active, 계정 whitecalvin, Node22.23.3, loginHTTP200, 인증 없는 복구 GET/POST8건401, root helper/91 runtime 모듈/manifest/BUILD_ID 일치를 확인했습니다.

설치된 helper SHA `d09e9f6fecf00e3a56042f29f6176db9abb56fcb413fa61cac6e29887b32bdf4`로 실제 nginx-check를 실행해 valid=true와 검수 로그132바이트 반환을 확인했습니다. 임의 command/path 입력은 거절됐습니다. nginx1.31.6-1~noble 바이너리 SHA `8a27bd4b1960fafff9fa7a47828f1042fd968e3e682772ac0d5a5254e0cb0e30`, 28파일 설정 graph 및 nginx PID/상태는 검사 전후 동일했습니다. 별도 private candidate 검증에서도 원본 승인/오류 directive 거절과 정리를 확인했습니다. 운영 설정 적용·reload·DB 접속은 수행하지 않았습니다.

증거 `.runtime/verification/helper-stderr-delivery-20261004.json`, `helper-stderr-preflight-20261004.json`, `helper-stderr-install-result-20261004.json`, `helper-stderr-installed-20261004.json`, `nginx-installed-helper-check-20261004.json`, `nginx-installed-candidate-20261004.json`, `admin-lock-native-2026-10-04T12-31-55.030Z.json`, `package-2026-10-04T12-37-24.645Z.json`. 실제 인증된 브라우저 검수 팝업과 전체 운영 복구 E2E는 미검증입니다. 전체 목표 PARTIAL이며 아래 기록은 이전 단계 이력입니다.

## 2026-10-04 패키지 IDE 노드 연결 및 PostgreSQL 양방향 편집 103 설치 완료

Certbot/PostgreSQL 선택 노드-코드 연결과 PostgreSQL 파일 기반 GUI/코드 양방향 편집을 포함한 deb SHA `16950ecf50d208c4eabad965fc7114c447f47a7d1ab4433cc5f4b12115c28142`를 승인된 103 서버의 같은 앱에 설치했습니다. source hash 및 전체625 PASS/build/package PASS 기록과 deb checksum을 설치 전에 대조했습니다. Next 서버 외 app child 작업과 root helper가 없음을 설치 직전까지 확인했습니다.

설치 전후 security.json/service-user/10-user.conf/environment checksum이 일치합니다. 앱 active/version0.1.0/Node22.23.3/OS 계정 whitecalvin, loginHTTP200, 기존 readOnly=false/terminal=true를 확인했습니다. root helper와91개 감사 runtime 모듈/manifest/BUILD_ID, 서버·클라이언트 JS/JSON/CSS125개가 검증한 소스·빌드와 일치하고 root 소유권/권한을 확인했습니다. 업데이트 대상 앱 외 운영 서비스·DB를 변경하지 않았습니다.

8792 SSH 터널의 /login200 및 nginx/Certbot/PostgreSQL IDE와 terminal307 로그인 리다이렉트도 확인했습니다. 설치/라우트 확인은 인증된 브라우저 키보드 입력이나 GUI 렌더 증거가 아닙니다. 실제 GUI 양방향 조작과 운영 서비스 복구 E2E는 아직 미검증이므로 전체 목표 PARTIAL입니다.

증거 `.runtime/verification/package-ide-preflight-20261004.json`, `package-ide-install-result-20261004.json`, `package-ide-installed-20261004.json`, `package-ide-installed-bundles-20261004.json`. 아래 미배포 기록은 소스/패키지 검사 단계의 이력입니다.

## 2026-10-04 PostgreSQL 선택 파일의 GUI/코드 양방향 편집 (소스/deb 검증, 미배포)

선택한 postgresql.conf의 지원 설정을 초기 GUI 값으로 표시합니다. 이전 독립 패키지 초안 값이 선택 파일 값을 덮지 않도록 controlled draft를 연결했습니다. GUI 변경은 같은 전체 파일 초안에 patchConfig로 반영하며 주석/include/지원 밖 설정과 줄 순서를 보존합니다. 코드 변경은 지원 필드 값과 순서를 GUI에 반영합니다. 잘못된 GUI 입력은 입력칸에 남기되 코드에는 반영하지 않고 오류를 표시합니다. 코드에서 삭제/해석할 수 없는 지원 항목은 기존 GUI 값을 유지하는 기존 정책을 따릅니다. include의 최종 runtime effective 값이나 모든 PostgreSQL 설정을 지원한다는 뜻은 아닙니다.

기본값 복원도 최종 확인 뒤 같은 파일 코드에 반영합니다. 최초 회귀 검사에서 확인 팝업이 독립 package draft를 초기화하는 경로를 발견하고 동일 callback으로 고쳤습니다. 선택 파일 GUI에서는 전체 코드를 조각으로 교체할 수 있는 standalone config-save/download 버튼을 제외하고 코드 보기로 이동합니다. 전체 초안의 저장·다운로드는 코드 편집기에서 제공합니다. 독립 패키지 화면의 조각 생성 동작은 유지합니다.

관련5 tests PASS, 최종 전체625 PASS, production build PASS. 앞 단계 Certbot/PostgreSQL 노드-코드 연결도 포함한 새 deb SHA `16950ecf50d208c4eabad965fc7114c447f47a7d1ab4433cc5f4b12115c28142`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-package-ide-sync.deb`. package --terminal verifier PASS (`package-2026-10-04T12-11-59.528Z.json`): 현재 빌드/runtime/manifest closure, 로그인·정규 route·격리 터미널 HTTP 및 auth/기능 비활성 게이트를 확인했습니다. GUI callback/render 구조 검사와 package HTTP 검사이며 실제 로그인 브라우저 양방향 입력 또는 운영 DB 적용 검증이 아닙니다.

증거 `.runtime/verification/postgresql-gui-sync-source-package-20261004.json` 및 관련 tests/build/package 로그. 아직103에 새 deb를 설치하지 않았습니다. 운영 설치본은 이전 terminal-account deb SHA `51800ad6fd47bd02a564cc0ce2b51acae4e90b3976261d38b481803ffad1578a`입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 Certbot/PostgreSQL IDE 노드와 코드 연결 수정 (소스 검증, 미배포)

PostgreSQL에서 다른 파일 선택 후 미저장 코드 교체를 확인하는 동안 이전 파일 코드가 새 노드 아래에 표시되던 경로를 수정했습니다. 코드 편집기는 선택한 sourcePath가 일치할 때만 표시합니다. 편집한 코드 유지 선택은 원래 파일/설정 그룹을 복원하며 초안을 그대로 보존합니다. 원래 파일이 최신 트리에서 제거된 경우 선택을 비우고 초안은 보존합니다. 새 선택은 이전 pending 교체를 취소하며 새 초안 저장에는 임시 이전 선택 metadata를 포함하지 않습니다.

Certbot 명령 초안에도 선택 인증서 key를 연결했습니다. 이전 인증서의 명령을 다른 인증서 아래에서 표시하지 않고, 이전 노드 또는 연결의 늦은 preview 응답을 무시합니다. 편집 유지 시 원래 인증서와 갱신 작업으로 돌아옵니다. 기존 key 없는 명령은 재생성하기 전 선택된 인증서의 코드로 추정하지 않습니다.

최종 전체624 tests PASS 및 production build PASS. 증거 `.runtime/verification/package-node-scope-source-20261004.json` 및 final-tests/final-build 로그. 초기 tests/build 후 원래 파일 삭제 보호를 보완했으므로 최종 소스 전체검사/빌드를 별도로 실행했습니다. 컴포넌트 callback/렌더 구조 검사이며 로그인된 브라우저 상호작용 증거가 아닙니다. 이 수정은 아직 새 deb/103에 반영하지 않았으며 설치본은 이전 terminal-account deb입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 실행 계정 수정 deb 103 설치 완료

검증한 terminal-account deb SHA `51800ad6fd47bd02a564cc0ce2b51acae4e90b3976261d38b481803ffad1578a`를 승인된 103 서버의 같은 tastedev-linux 앱에 설치했습니다. 실행 전 MainPID 하위의 Next 서버 외 작업과 root helper가 없음을 확인했습니다. 첫 단순 child 검사는 정상 Next 서버를 작업으로 판단해 설치하지 않았고, 프로세스 관계를 확인한 뒤 수정된 preflight로 재검사했습니다. root 전용 설정 읽기 권한 오류 뒤 내용 대신 sudo sha256sum으로 고정 설정 체크섬만 기록했습니다.

설치 전후 security.json, service-user, 10-user.conf, environment 체크섬이 일치합니다. 앱 active, 설치 버전0.1.0, OS 실행 계정 whitecalvin, Node22.23.3, loginHTTP200, 기존 readOnly=false/terminal=true를 확인했습니다. 기존 계정·보안 설정을 변경하지 않았습니다. root helper 및91개 감사 runtime 모듈, BUILD_ID와 서버/클라이언트 JS·JSON·CSS125개가 현재 검증한 빌드와 정확히 일치하고 root 소유/권한을 확인했습니다.

증거 `.runtime/verification/terminal-account-preflight-20261004.json`, `terminal-account-install-result-20261004.json`, `terminal-account-installed-20261004.json`, `terminal-account-installed-bundles-20261004.json`. 격리 패키지의 로그인 후 실제 PTY HTTP 동작은 직전 단계 PASS입니다. 이번 운영 설치 확인은 인간 계정의 로그인된 브라우저 키 입력 증거가 아닙니다. 전체 목표 PARTIAL이며 운영 서비스 복구 및 실제 GUI 상호작용 확인이 남아 있습니다. 아래 미배포 표시는 이전 소스/패키지 검증 단계의 이력입니다.

## 2026-10-04 터미널 실행 계정 환경 수정 (소스/deb 검증, 새 deb 미배포)

터미널 프로세스의 HOME/USER/LOGNAME을 앱 시작 환경에서 복사하는 대신 OS 실행 계정의 userInfo로 설정했습니다. 설치 계정 이외의 홈과 사용자명이 환경에 남아 있어도 실제 계정으로 셸 설정/CLI 경로를 사용합니다. 작업 폴더 선택, 일반 사용자 실행, 비밀 환경 값 제거 및 기존 프로세스 환경은 유지합니다.

잘못된 launcher 계정 값을 넣은 non-PTY/PTY 회귀 검사 PASS, 전체624 PASS, production build PASS. 새 deb SHA `51800ad6fd47bd02a564cc0ce2b51acae4e90b3976261d38b481803ffad1578a`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-terminal-account.deb`. package verifier --terminal PASS (`package-2026-10-04T11-49-02.164Z.json`): 격리 관리자 로그인 뒤 실제 HTTP PTY 입력/출력/resize/timeout, 계정 환경 및 logout SSE 취소를 확인했습니다.

패키지 검증의 기존 가짜 HOME override CLI fixture는 실제 실행 계정 홈 선택과 충돌하므로 명시적 격리 Bash rcfile 및 유일한 synthetic executable로 수정했습니다. 실제 사용자 startup 파일/AI CLI를 실행하지 않습니다. 기본 CLI preset의 interactive Bash 매핑 검사는 기존 terminal-launch tests에 남아 있습니다. 설치 계정의 실제 Claude/Codex 인증 성공을 주장하지 않습니다.

증거 `.runtime/verification/terminal-account-source-package-20261004.json` 및 관련 tests/build/package 로그. 103 설치본은 이전 통합 복구 deb SHA `644a294a76c65c24677cd9e3eebbef5ed0efdc330c1e0b4bb8eb59c77c5e72e0`입니다. 이번 새 deb는 아직 배포하지 않았습니다. 로그인된 브라우저 상호작용/실제 운영 서비스 복구는 미검증이며 전체 목표 PARTIAL입니다.

## 2026-10-04 현재 배포 및 개발 터미널 확인

통합 설정 복구 deb를 103 서버에 설치했습니다. 설치 버전 0.1.0, deb SHA-256 `644a294a76c65c24677cd9e3eebbef5ed0efdc330c1e0b4bb8eb59c77c5e72e0`. 설치된 helper, 91개 runtime 모듈, manifest 및 BUILD_ID가 검증한 소스/빌드와 일치합니다. 앱 active, login HTTP 200, 네 복구 API의 미인증 요청 401을 확인했습니다. 기존 보안 파일 SHA를 보존했으며 확인 당시 readOnly=false/terminal=true입니다. 아래의 미배포 기록은 이전 단계의 이력입니다.

실제 설치 root helper의 Redis/nginx/MariaDB 복구 기록 조회가 성공했으며 pending 기록은 없었습니다. 파일 교체, 서비스 재로드/재시작 또는 DB 연결을 실행한 증거는 아닙니다. 증거: `.runtime/verification/config-recovery-installed-20261004.json`, `.runtime/verification/config-recovery-installed-helper-lookup-20261004.json`.

격리 MariaDB 11.4.13 native options-help 후보 검사 PASS: 전체 후보, include 옵션 덮어쓰기 거부, 알 수 없는 옵션 거부 및 복원 후보 검사를 확인했습니다. DB/서비스를 시작하지 않았습니다. 증거: `mariadb-native-2026-10-04T11-36-48.695Z.json`. 로컬 nginx 1.28.3의 proxy/static/TLS/redirect 구문과 잘못된 directive 거부 PASS. 운영 설정/서비스를 변경하지 않았습니다. 증거: `nginx-native-2026-10-04T11-43-07.044Z.json`.

개발 서버 주소는 `http://127.0.0.1:8787/terminal`입니다. 8792는 103으로 전달되는 SSH 터널 주소입니다. 개발 환경의 terminal gate=true, terminal=true, readOnly=false 및 일반 사용자 whitecalvin을 확인했습니다. 실제 PTY에서 Unicode 입력/출력, Ctrl+C, EOF, 크기 변경, 독립 탭 4개와 종료 격리 검사가 PASS입니다. 증거: `terminal-pty-2026-10-04T11-42-02.470Z.json`. 로그인된 브라우저 화면/키 입력을 직접 검증한 것은 아닙니다.

전체 목표는 PARTIAL입니다. 운영 서비스 복구의 실제 적용 및 로그인된 GUI 상호작용 검증은 여전히 남아 있습니다. 기존 보안 정책을 임의로 추가 활성화하지 않았습니다.

## 2026-10-04 MariaDB 중단 작업 복구 및 통합 deb 검증 (패키지 생성, 103 미배포)

MariaDB 패키지 설정에 main/target 선택, 수동 중단 기록 조회, 현재/복원 후보 include 파일 SHA 비교, 서비스 scope 확인 및 최종 재시작 확인을 연결했습니다. 선택된 파일의 백업 원문을 복원하고 다른 include 파일은 현재 내용으로 검토합니다. private journal/backup, graph, PID/start/UID와 시작 main scope를 검토 SHA에 묶고 변경 시 거부합니다. root helper의 기존 MariaDB process snapshot에 bounded stat/status read와 start/계정 재검사를 추가했습니다. 명시적 --defaults-file은 main을 대조하며 default-main-assumed는 기존 경고를 표시합니다; 실제 모든 기본 검색 파일/환경의 영향까지 증명한 것으로 간주하지 않습니다.

MariaDB private candidate tree는 디렉터리 목록, 파일 SHA/owner/mode/nlink/FD·named identity·timestamps를 snapshot하여 native validator 전후 변조를 거부합니다. capability preflight 후 --validate-config 또는 options-help 검사와 내부 my_print_defaults 검사를 사용하고 원본 복원 뒤 고정 mariadb.service restart 및 최종 graph/main/UID를 확인합니다. 재시작 실패나 변경은 journal을 유지합니다. GUI는 final confirmation, duplicate prevention, stale target response 거부, read-only 복구 비활성화를 적용했습니다. GET 로그인/sudo 조회와 POST 로그인/동일 origin/databaseChanges/조회 전용 해제/confirm/review SHA 게이트를 연결했습니다. HTTP에서는 임의 root/target/runner/계정을 허용하지 않습니다.

전체623 tests PASS, 최종 production build PASS, literal English fallback 검사 PASS. 초기 service snapshot fixture가 새 stat/status read를 반영하지 않은 assertion을 추가 검증과 함께 수정했고, main 설정 번역 누락을 보완했습니다. initial-targeted/initial-i18n 로그를 보존했습니다. `.runtime/verification/mariadb-recovery-source-package-20261004.json`에 source identity를 기록했습니다.

actual UID0/root-owned installed-layout helper/closure에서 MariaDB graph 적용 rename 후 SIGKILL 및 별도 검토 복구 PASS (`admin-lock-native-2026-10-04T11-26-01.531Z.json`). native worker 종료까지 kernel lock 유지, filesystem lease 미생성, 원본 byte 복구와 journal 정리를 확인했습니다. process/capability/validation/restart transport는 fixture hooks입니다. 운영 MariaDB 접속·native mysqld validator·실제 systemd 재시작 검증이 아닙니다. 기존 pinned image/no pull/network none/host bind 없음/격리 writable layer/cleanup PASS.

통합 deb SHA `644a294a76c65c24677cd9e3eebbef5ed0efdc330c1e0b4bb8eb59c77c5e72e0`를 생성하고 `dist/tastedev-linux_0.1.0_amd64-config-recovery.deb`로 보존했습니다. package verification PASS (`package-2026-10-04T11-28-50.827Z.json`): 현재 build/runtime checksum, root helper manifest/import closure, 비밀파일 제외, 계정/loopback/maintainer script 조건 및 격리 localhost 로그인/세션과 네 복구 API의 unauthenticated/disabled-permission 거부를 확인했습니다. 권한을 끈 격리 서버 검사이며 root operational recovery 실행과 browser GUI E2E의 증거가 아닙니다.

103에는 아직 이 deb를 설치하지 않았습니다. 현재 설치본 common lease deb는 유지합니다. 공통 journal의 Node.js/Redis/nginx/MariaDB 사용자 복구 경로는 현재 소스와 새 deb에 연결됐습니다. 설치 장비 적용 확인 및 실제 package native recovery/browser E2E는 남아 있으므로 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 중단 작업 복구 팝업/API 및 graph kernel lease (소스 검증, 미배포)

nginx 복원 팝업에 지원되는 설정 파일 선택, 수동 중단 기록 조회, 현재/복원 후보 include 파일 SHA 비교, locale 확인, 최종 복구 확인을 연결했습니다. 선택된 파일의 원본 백업을 복원하며 다른 include 파일은 현재 bytes로 검토합니다. 조회 이후 그래프·백업·master PID/start·prefix·관측 locale 변화는 재검토를 요구합니다. 전체 private candidate 검사 후 파일을 복원하고 운영 nginx -t, 고정 nginx.service reload 및 최종 graph/identity 검사를 수행합니다. 검사/재로드 실패나 외부 변경은 journal을 보존합니다. 서비스가 중지되어 실행 identity를 확인할 수 없으면 자동 복구를 거부합니다.

GET은 로그인·sudo 조회 옵션, POST는 로그인·동일 origin·nginxChanges·조회 전용 해제·명시적 confirm·검토 SHA 및 검증된 locale을 요구합니다. payload는 path/confirm/reviewVersion/locale만 허용하며 지원되는 nginx 파일 path 외 임의 경로·계정·hook은 받지 않습니다. locale은 관리자 확인이며 live libc 상태의 직접 증명이 아닙니다. GUI는 duplicate commit 방지, target 변경 후 이전 응답 무시, locale 수정 후 확인 해제, read-only 변경 비활성화, 복구 완료 후 트리 갱신 및 갱신 실패와 실행 결과 구분을 구현했습니다.

nginx graph lock도 공통 operation lease를 사용합니다. 실제 설치 helper kernel FD 확인 뒤 graph 디렉터리를 새로 만들지 않으며 기존 lock 파일/디렉터리는 삭제하지 않습니다. 직접 호출은 기존 cross-process 디렉터리 잠금을 유지합니다.

전체616 tests PASS, production build PASS, literal English fallback 검사 PASS. 증거 `.runtime/verification/nginx-recovery-source-20261004.json` 및 full/build/i18n 로그. initial targeted의 candidate argv index 오기로 발생한 assertion 실패를 올바른 -c 인덱스 검사로 수정했고 로그를 보존했습니다. 초기 full 2개 실패는 기존 toolbar renderer의 새 child stub 누락으로, 기존 assertion을 유지하고 child fixture를 연결해 해결했습니다.

actual UID0/root-owned installed-layout helper/module closure에서 nginx graph apply rename 뒤 SIGKILL 검사 PASS (`admin-lock-native-2026-10-04T11-13-51.103Z.json`). native supervisor가 worker 종료까지 커널 잠금을 유지하고 graph/file lease가 남지 않으며, journal을 별도 확인 복구로 원본 bytes와 함께 정리했습니다. service identity와 nginx/systemd command transport는 fixture hooks이므로 실제 nginx -t/reload 또는 운영 nginx 접속 증거가 아닙니다. 기존 pinned image/no pull/network none/host bind 없음/격리 writable layer/cleanup PASS.

아직 deb 생성/103 배포하지 않았습니다. 현재 common lease 설치본을 유지합니다. MariaDB 복구 경로 및 각 package 실제 native recovery/browser 검증이 남아 있으므로 전체 목표 PARTIAL입니다.

## 2026-10-04 Redis 중단 작업 복구 GUI/API 및 graph kernel lease (소스 검증, 미배포)

Redis 패키지 설정에 수동 중단 기록 조회, 현재/원본 include 파일 SHA 비교, 최종 재시작 영향 확인 및 복구 버튼을 연결했습니다. 조회는 로그인과 sudo 조회 옵션, 복구 POST는 로그인·동일 origin·databaseChanges·조회 전용 해제·명시적 confirm·검토 SHA를 요구합니다. payload는 confirm/reviewVersion만 허용하며 경로·계정·실행 hook은 HTTP에서 받지 않습니다. GUI는 중복 요청을 막고 연결/정책 변경 뒤 이전 응답을 무시합니다.

복구 controller는 private journal/backup SHA, 현재 main 원본/후보 SHA, 현재/원본 include graph, 실행 서비스 PID/start/UID/고정 main identity를 재검토합니다. 원본 전체 graph 후보를 기존 isolated Redis validator에 전달하고 candidate 변조 및 validation 이후 graph/process 변경을 검사합니다. 원본 복원 뒤 고정 Redis service restart hook을 호출하고 최종 graph·서비스 identity/UID를 확인합니다. 외부 파일/include/process 변경, 후보 변조, 실패한 restart 또는 post-restart account 변경은 기록을 유지합니다. 이미 원본 bytes인 경우도 검토 후 service recovery를 재시도합니다. 실행 Redis process의 원래 main을 확인할 수 없거나 서비스가 중지돼 있다면 자동 복구를 거부합니다; 임의 process argv를 추정하지 않습니다.

Redis graph lock도 공통 operation lease를 사용합니다. 설치 helper의 실제 kernel FD가 확인되면 filesystem graph lease를 만들지 않고 in-process 중복을 막습니다. 기존 lock directory/symlink는 삭제하거나 죽은 작업이라고 추정하지 않습니다. helper context 없는 직접 호출은 기존 cross-process directory lock을 유지합니다.

전체608 tests PASS, production build PASS, literal English fallback 검사 PASS. `.runtime/verification/redis-recovery-source-20261004.json`과 full/build/i18n 로그에 기록했습니다. 초기 2개 실패는 기존 package-config 부모 renderer의 새 child module stub 누락이며 기존 assertion을 유지하고 fixture를 연결해 해결했습니다. initial-regression 로그를 보존했습니다.

actual UID0/root-owned installed-layout helper 및 검증된 module closure에서 Redis graph apply rename 후 SIGKILL 검사 PASS (`admin-lock-native-2026-10-04T11-02-38.873Z.json`). native supervisor가 worker 종료까지 kernel lock을 유지하며 graph/file lease가 남지 않고, 중단 journal이 남아 별도 확인 복구로 원본 bytes와 journal 정리를 검증했습니다. fixture service identity/validation/restart hooks를 사용했으므로 native Redis validator/systemd 재시작 또는 운영 Redis 접속 증거가 아닙니다. 기존 pinned image/no pull/network none/host bind 없음/격리 writable layer/cleanup PASS.

아직 deb 생성/103 배포하지 않았습니다. 현재 설치된 common lease deb를 유지합니다. nginx/MariaDB 사용자 복구 경로 및 package native recovery transport/browser 검증은 남아 있으므로 전체 목표 PARTIAL입니다.

## 2026-10-04 Node.js 서비스 중단 작업 복구 GUI/API (소스 검증, 미배포)

등록된 Node.js 앱의 서비스 설정에 중단 기록 조회, 현재/원본 옵션 비교, 최종 확인 후 원본 복구를 추가했습니다. helper는 등록 앱·sudo caller UID·앱 파일 버전·관리 대상 unit·백업 SHA·journal·systemd FragmentPath/User/DropInPaths를 검토하고, 복원 후보를 systemd-analyze로 검사한 뒤 daemon-reload만 수행합니다. 실행 중인 앱을 재시작하지 않습니다. 검토가 만료되거나 외부 수정/다른 drop-in이 발견되면 기존 기록을 보존하고 거부합니다. 복구 실패 시 기록을 유지하여 재검토할 수 있습니다.

GET 조회는 로그인과 sudo 조회 옵션을 요구하며 POST 복구는 로그인, 동일 origin, serviceChanges 권한, 조회 전용 해제, 명시적 confirm 및 검토 SHA를 요구합니다. GUI는 수동 조회, 최종 확인, 중복 실행 방지, 이동/연결 변경 후 응답 무시를 적용했습니다. 조회 전용에서는 조회만 허용합니다. 임의 경로나 계정을 클라이언트에서 지정할 수 없습니다.

전체 600 tests PASS, production build PASS, literal English fallback 검사 PASS. 증거는 `.runtime/verification/node-service-recovery-source-20261004.json` 및 같은 접두사의 full/build/i18n 로그입니다. 부모 GUI 테스트의 새 child-module fixture 누락으로 발생한 초기 2개 실패는 기존 assertion을 유지하고 child stub을 추가해 해결했으며 initial-regression 로그를 보존했습니다. Node 복구 tests의 manager/validation/reload는 fixture hooks이며 실제 systemd 복구나 로그인 browser E2E를 확인한 증거가 아닙니다.

아직 deb 생성/103 배포를 수행하지 않았습니다. 현재 설치된 common lease deb는 유지합니다. nginx/Redis/MariaDB의 공통 pending journal을 사용자가 복구하는 경로와 실제 package transport 검증이 남아 있으므로 전체 목표는 PARTIAL입니다.

## 2026-10-04 공통 설정 write-ahead journal 및 내부 복구 기반 (소스 검증, 미배포)

현재 소스에 `config-journal.ts`와 내부 `recoverConfigTransaction`을 추가했습니다. 전체591 PASS, production build PASS. 최신 source는 아직 deb로 만들거나103에 설치하지 않았습니다. 설치된 앱은 앞 단계 common lease deb SHA `efaf381c5d9643c1504bc0f471290126cf51d5928eba2629c2ec3e6804ed8db8`를 유지합니다. 패키지별 GUI/helper action/API 보안 게이트와 실제 package recovery transport 연결을 완료한 뒤 별도 배포 검증이 필요합니다. 내부 함수가 있다는 이유로 사용자 GUI에서 공통 중단 복구가 제공된다고 주장하지 않습니다.

공통 configTransaction은 후보/원본 SHA, backup UUID, 원본/교체 inode·소유권·권한, 고정 staging leaf를 private immutable journal에 저장하고 fsync 후 rename합니다. transactions directory 생성 뒤 backupRoot도 sync합니다. 원문·secret·명령은 journal에 저장하지 않습니다. pending이면 새 적용을409로 막고, unknown/corrupt/private permission 위반 record는 보존·거부합니다. 같은 inode의 알려진 initialization alias만 정리하며 unknown hardlink는 보존합니다. 정상 activation 또는 확인된 rollback 뒤 journal 정리를 수행하고 정리 오류만으로 새 rollback을 시작하지 않습니다.

원본 bounded read는 short-read loop, FD/이름 identity·mtime/ctime·size·owner/mode/nlink 안정성 및 UTF8/NUL 검사를 거칩니다. validation 후 후보 SHA/inode가 같은지 검사합니다. beforeCommit 이후 journal publication 뒤 live file을 다시 비교합니다. rename 후 directory sync 오류는 replacementOccurred로 표시해 backup ID와 변경 상태/복구 필요를 보고합니다. activation 중 외부 edit나 복구 뒤 원본 byte 불일치는 journal을 보존합니다. 실제 directory sync EIO/power loss를 이 검사에서 주입한 것은 아니며 SIGKILL/기록 보호 범위의 증거입니다.

`recoverConfigTransaction`은 generic HTTP action으로 공개하지 않았습니다. allowlisted file/private backupRoot, 명시적 confirm, 독립적인 beforeRecovery scope/identity 검사·native validate·recover transport callbacks를 모두 요구합니다. 백업 UUID/target/SHA/원문 크기 및 private regular single-link 안정성을 검증하고, draft SHA+staged inode가 일치할 때만 원본을 교체합니다. 이미 원본 byte/ownership/mode이면 다시 덮어쓰지 않고 recovery를 재시도합니다. native validation 및 activation 전 scope를 다시 확인하고, activation 직전 file 변경과 최종 original SHA도 검사합니다. recovery 실패/불명확한 상태는 journal을 유지합니다. 각 package의 original graph/service context와 적용 검토를 올바르게 연결하는 작업은 아직 남아 있습니다.

actual UID0/private container/root-owned installed-layout helper·manifest/runtime에서 ownership adapter 없이 SIGKILL 검사 PASS (`admin-lock-native-2026-10-04T10-35-32.617Z.json`). parent가 공통 설정 rename 이후 native sleep을 실행한 상태에서 실제 SIGKILL: global kernel descriptor는 native 종료까지 보호되고 filesystem lease는 남지 않았으며, private backup/journal이 남아 새 transaction을 거부했습니다. 별도 confirmed recovery와 고정 public port fixture scope/validation/recovery callbacks로 original byte 복원 및 record 제거를 확인했습니다. callbacks는 fixture이며 nginx/Redis/MariaDB/systemd native recovery 또는 운영 DB 접속의 증거가 아닙니다. network none/host bind 없음/기존 pinned image/no pull/private writable layer/cap-drop ALL/private tmpfs/resource limits 및 cleanup PASS.

private fixture tests는 failed recovery retry와 original inode 보존, confirmation/scope 실패, native validation 오류/후보 변조, external edit와 recovery 중 external edit, substituted backup, private permissions/corrupt records/unknown hardlinks/initialization alias 및 invalid UTF8를 확인했습니다. 초기 전체 regression8 실패는 transactions metadata directory를 백업 파일로 센 기존 fixture count 가정이었습니다. 기존 원문/backup 내용/service/rollback 검사를 유지하고 UUID `.json` 백업만 세도록 바꾸었습니다. 새 private metadata0700/성공 뒤 빈 journal directory 조건을 별도 검사했고 최종591 PASS. 초기 결과 `.runtime/verification/common-journal-initial-regression-20261004.log`를 보존했습니다.

전체 목표 PARTIAL. 다음은 package-specific recovery review/GUI/helper/API gate 연결입니다. 이 기반만으로 운영 GUI 복구, 이전 filesystem lease cleanup, full systemd/runuser/native package transport, 로그인된 browser E2E가 완료됐다고 판단하지 않습니다. 소스의 새 graph guard를 사용자-facing recovery 없이 운영 앱에 배포하지 않았습니다.

## 2026-10-04 공통 설정 및 MariaDB graph의 설치 helper kernel lease 반영

최신 deb SHA-256 `efaf381c5d9643c1504bc0f471290126cf51d5928eba2629c2ec3e6804ed8db8`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-common-kernel-lease.deb`. 전체586 PASS, production build PASS, package verifier PASS (`package-2026-10-04T10-23-32.970Z.json`). 기존 설치 승인 대상103의 동일 앱 업데이트 완료: app active/version0.1.0/Node22.23.3, installed helper/common lease/config transaction/MariaDB/HBA modules/BUILD_ID SHA 일치, loginHTTP200 및 미인증 HBA apply/recovery-status/recover 모두401. 증거 `.runtime/verification/common-kernel-lease-installed-20261004.json`. 운영 DB나 sudo/readOnly 정책을 변경하지 않았고 로그인된 브라우저 조작 증거가 아닙니다.

`config-operation-lease.ts`를 audited root runtime closure에 포함했습니다. 공통 `configTransaction`과 MariaDB graph는 설치 helper의 immutable nonwritable/nonconfigurable internal context, 실제 UID0, 고정 설치 helper path, root600 single-link marker의 FD/이름/dev/ino/marker bytes가 확인될 때만 기존 global kernel lock을 사용합니다. 같은 프로세스 중복 호출은 Set으로 차단하며 새 filesystem lease를 생성하지 않습니다. invalid context는 direct mode로 fallback하지 않습니다. 정상 marker를 unlink하지 않고 기존 native supervisor의 descriptor 보호를 유지합니다.

context 없는 직접 호출은 기존 private directory lease를 계속 생성하여 별도 프로세스의 동시 호출을 거부합니다. 기존 unknown legacy directory/symlink가 있으면 보존·409 거부하며 죽은 작업이라고 추정해 제거하지 않습니다. 이 변경은 설치 helper 작업의 새 per-file/per-graph directory lock 잔류를 없앤 범위입니다. 직접 호출의 파일 lease crash cleanup 또는 공통 transaction의 파일 교체 중 durable journal/byte rollback을 구현한 증거는 아닙니다.

actual UID0/private container/root-owned installed helper·runtime에서 ownership adapter 없이 검사 PASS (`admin-lock-native-2026-10-04T10-19-57.293Z.json`). root parent가 managed lease를 얻고 native sleep을 실행한 뒤 실제 SIGKILL: 디렉터리 lease는 생성되지 않았고 실제 kernel lock은 native supervisor가 명령 종료까지 유지했습니다. 이후 동일 inode로 다음 작업 진입, 같은 프로세스 중복 거부/idempotent release/legacy directory 보존, actual root common transaction의 후보 검수/private backup/주입 activation failure 후 byte rollback과 회복 callback을 확인했습니다. 단순 public port fixture이며 DB/systemd/app service activation을 실행한 증거가 아닙니다. network none/host bind 없음/기존 pinned image/no pull/private writable image layer/cap-drop ALL/private tmpfs/resource limits 및 cleanup PASS. operatingClusterAccess=false/databaseConnections=false/postmasterStarted=false.

direct fixture 및 별도 child의 directory lease 경쟁 차단, legacy symlink 보존, invalid context의 fallback 차단과 invalid relative path 거부 PASS. HBA journal source는 이번 변경에서 그대로 유지했고 앞 절의 실제 native SIGKILL 복구 증거를 역사로 보존합니다.

전체 목표 PARTIAL. 다른 패키지 설정의 durable journal 및 GUI 중단 복구, 이전 legacy lease의 확인 기반 복구, 운영 전송/로그인 GUI E2E 등 기존 완료 감사 항목은 남아 있습니다. 이번 변경은 관리자 잠금 상태 개선을 증명하며 일반적인 운영 설정 자동 복원을 주장하지 않습니다.

## 2026-10-04 PostgreSQL HBA write-ahead journal 및 명시적 중단 복구 반영

최신 최종 deb SHA-256 `cb35952fb6f5bcd3b615542cda900128224df9d18af59ba37518595499ea6f3c`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-hba-journal-final.deb`. 전체 회귀584 PASS, production build PASS, 최종 package verifier PASS (`package-2026-10-04T10-14-10.377Z.json`). 기존 설치 승인 대상103의 동일 앱 업데이트 완료: app active/version0.1.0/Node22.23.3, helper·native exec·HBA operation/journal/service·BUILD_ID의 installed SHA 일치, login HTTP200, 미인증 HBA apply/recover POST 및 recovery-status GET 모두401. 설치 증거 `.runtime/verification/postgresql-hba-journal-installed-20261004.json`. 운영 DB 연결·HBA 변경·reload·보안 옵션 변경 및 로그인 GUI 조작을 수행한 결과가 아닙니다.

새 root-private immutable journal은 백업 ID·원본/draft SHA·원본/교체 inode/소유권·권한·원본 참조 graph state·실행 서버 identity를 저장하고 파일/directory fsync 후 rename을 허용합니다. 설정 원문은 journal에 저장하지 않습니다. 기록이 있으면 새 검토와 적용은409로 차단합니다. 동일 private inode의 알려진 초기화 hardlink만 정리하며 unknown link/symlink/private permission 위반은 보존/거부합니다. 성공 또는 확인된 rollback 후 기록 정리를 수행하고, 이미 검증된 완료 상태의 journal 정리 오류만으로 journal 없는 추가 rollback을 시작하지 않습니다. 정리 미확인은 별도 boolean/GUI 경고로 보고합니다.

`postgresql-hba-recovery-status` GET은 인증/sudo 옵션을 거치며 record의 target/backup UUID/pending flag만 반환합니다. `postgresql-hba-recover` POST는 인증/origin/확인/databaseChanges/readOnly/sudo/server 게이트와 global kernel lock 및 감사 로그를 거칩니다. 운영 적용 popup은 status를 먼저 조회해 pending이면 새 draft 계획 대신 중단 작업 복구와 최종 확인을 표시합니다. 순서가 바뀐 status+plan에 맞춰 component fixture를 수정한 뒤 기존 확인/중복 클릭/scope/unmount 검사 및 새 recovery confirmation 검사가 통과했습니다. source/diff/native error는 terminal record에서 제외하고 구조화 boolean/backup UUID만 기록합니다.

복구는 기존 작업의 staged inode와 draft SHA가 일치할 때만 원본 native 검수·파일 교체를 수행합니다. 이미 원본 byte/소유권/권한이 일치하면 파일을 다시 덮어쓰지 않고 필요한 reload를 재시도합니다. 파일 교체 전 중단도 서버 identity/고정 read-only running settings 확인 없이 복구 완료로 보고하지 않습니다. 서버 OS identity 변경/원본 include 변경/외부 파일 편집은 거부하며 기록과 백업을 보존합니다. reload 실패와 복구 중 외부 편집도 기록을 남기고, 최종 원본 SHA/reference graph를 다시 확인합니다. 기존 legacy lease는 삭제하지 않습니다.

실제 separate child SIGKILL/private filesystem journal/명시적 byte 복원, service identity 실패 보존, reload 실패 뒤 원본 inode 유지 재시도, 초기화 alias 및 unknown hardlink 보존, private permission/불명확한 record 거부, 교체 전 중단의 service 확인, 복구 도중 외부 편집 보존, 완료 이후 cleanup 실패로 추가 역변경하지 않는 조건을 fixture로 확인했습니다. 이 fixture service/reload hook은 운영 systemd가 아닙니다.

최종 actual PostgreSQL16.15 native fixture PASS (`postgresql-hba-operation-native-2026-10-04T10-12-21.617Z.json`). 기존 native 검수/실제 적용·인증·backup restore·실패 rollback 외에 실제 reload로 새 fixture role 연결이 허용된 뒤 child를 SIGKILL하고, pending record로 명시적 원본 복원·native 검수·실제 reload 후 새 연결이 다시 거부되는 조건까지 통과했습니다. 같은 postmaster PID/start 유지, 기존 pinned image/network none/host binds 없음/read-only image/non-root uid999/cap-drop ALL/private tmpfs/제한된 자원 및 cleanup PASS. 실제 /proc/native binary/pidfile/socket/고정 SQL 검사는 production code이며 systemd/runuser 전송은 pg_ctl 및 동일 PG 계정 fixture adapter입니다. `reloadAcceptanceVerified=false` 유지. Unix socket 사용, TCP listener 없음. Root supervisor UID0 native 증거는 이전 잠금 단계의 것이며 이번 journal/실제 systemd/runuser E2E 증거로 확장하지 않습니다.

확장 native fixture 첫 실행은 reload 후 자식에 active handle이 없어 SIGKILL 전에 스스로 종료해 signal=null로 실패했습니다. 실제 child를 유지하도록 fixture interval handle을 추가한 뒤 검사한 signal=SIGKILL과 재인증 결과가 통과했습니다. 초기 실패는 `.runtime/verification/hba-journal-crash-native-initial-failure-20261004.log`에 보존했습니다. 중간 journal deb SHA `584c86a5d3cadcaf67f4425b7f05de5873c72c28c38ed17a0f148cbfeff25655`는 보존/업로드했지만 설치하지 않았으며, 최종 배포는 위 cb3595 deb입니다.

전체 목표 PARTIAL. HBA의 확인 기반 중단 복구 경로는 추가됐지만 운영 장비의 실제 강제 종료·root/systemd/runuser 전체 전송·로그인된 GUI E2E, 다른 패키지의 이전 filesystem lease와 중단 복구, 그 밖의 기존 제품 완료 감사 항목은 남아 있습니다. 앱 시작/조회만으로 운영 복원을 자동 실행하지 않습니다. 아래 기록은 이전 단계 역사이며 최신 HBA journal/배포 증거는 이 절입니다.

## 2026-10-04 최종 관리자 잠금 개선 패키지 반영

최종 전체 회귀 574 PASS, production build PASS, deb verifier PASS (`package-2026-10-04T09-51-01.035Z.json`). 최종 deb SHA-256 `aff9d8185e0e22d551982e546dc2fff401533461ab81cf5bfe097e645f6cb825`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-admin-native-lock.deb`. 기존 설치 승인 대상 103의 동일 앱 업데이트 완료: version0.1.0/app active/Node22.23.3, installed helper·native exec runtime·HBA controller·BUILD_ID SHA가 검증한 source/build와 일치합니다. login HTTP200, 미인증 HBA operation POST401. 증거 `.runtime/verification/admin-native-lock-installed-20261004.json`. 운영 DB 연결·설정 적용·reload·보안 옵션 변경 또는 로그인된 브라우저 조작을 수행한 증거가 아닙니다.

최종 실제 root private fixture 잠금/SIGKILL/native supervisor 검증 PASS (`admin-lock-native-2026-10-04T09-42-21.281Z.json`). 최종 비root disposable PostgreSQL 실제 HBA 적용·새 인증·복원·reload 후 실패 rollback 검증도 PASS (`postgresql-hba-operation-native-2026-10-04T09-45-11.054Z.json`). 병렬 검사 중 한 차례 native command failure가 있었고 원인은 확정하지 못했습니다. 당시 로그 `/tmp/tastedev-admin-native-lock-hba-native.log`를 보존했습니다. 공개 fixture만 사용하는 진단에 실패 phase/제한된 fixture stderr를 추가한 뒤 한 차례 재실행이 통과했으며, 이 결과로 실패 원인을 설명하거나 운영 성공을 주장하지 않습니다. 아래 571 PASS/08:57 evidence 및 이전 deb 기록은 중간 단계의 역사이며 최신 최종 결과는 이 절입니다.

전체 목표 PARTIAL. 이번 반영은 helper 강제 종료 후 실행 중 native 명령과의 잠금 유지 및 종료 후 다음 작업 진입 개선입니다. 파일 교체 중 강제 종료의 durable transaction journal/자동 rollback, 기존 package별 lease 검토와 실제 로그인 GUI 검증은 남아 있습니다.

## 2026-10-04 관리자 작업 강제 종료 후 잠금 해제 및 HBA lease 개선

관리 명령 자체가 남아 있는 경우의 supervisor 보호도 추가했습니다. `admin-native-exec.ts`는 installed helper가 만든 immutable internal context에서만 root FD를 사용합니다. audited runtime의 execFile/execFileSync 및 helper의 sync 명령을 같은 설치 helper의 private supervisor entry로 실행합니다. supervisor는 canonical root600 marker와 FD3의 inode를 확인하고 root FD를 native 프로그램에 넘기지 않습니다. native command가 실제 종료할 때까지 보유하며 SIGTERM/INT·wall deadline은 native process group 종료 후 해제합니다. helper SIGKILL 직후 자식 명령이 실행 중이면 다음 작업이 거부됩니다. 임시 namespace/isolated validation의 직접 spawn PID 의미는 바꾸지 않았고, 이 부분의 SIGKILL cleanup을 이 검사로 증명하지 않습니다.

local actual SIGKILL/supervisor/output/UTF8/maxBuffer/timeout/no-root-FD-to-native 검사 PASS. 런타임 배열에 신규 모듈을 추가하는 초기 편집이 실패해 closure checks가 실패했으며, 정확한 배열 등록 후 통과했습니다. 중간 no-supervisor deb는 `dist/tastedev-linux_0.1.0_amd64-kernel-lock-initial.deb`로 보존했고 배포하지 않았습니다.

actual UID0/private disposable Docker image에서도 ownership adapter 없이 설치 구조의 manifest/helper/source lookup·같은 inode 경쟁·SIGKILL 뒤 native 명령 종료까지 대기·sync/async Unicode·timeout·FD 비노출 PASS. root fixture의 첫 두 실패는 PG-owned 기존 /etc/postgresql parent 접근과 잘못 둔 fixture manifest 위치였습니다. fixture 전용 root-private tmpfs와 실제 runtime/manifest.json 위치로 수정했고 production trust를 완화하지 않았습니다. root fixture는 Node를 컨테이너의 private writable layer에만 복사하며 network none/host binds 없음/cap-drop ALL/no-new-privileges/pids96/memory768MiB/cpu1을 사용했습니다. DB/postmaster/operating service 실행 없음. evidence `admin-lock-native-2026-10-04T09-42-21.281Z.json`, binary/helper/runtime/snapshot SHA와 cleanup PASS를 기록했습니다.

최종 전체574 PASS. 실제 root supervisor 증거는 생성한 HBA fixture를 읽는 동작과 고정 sleep/printf/readlink에 대한 증거이며 운영 서비스 중단이나 실제 DB 복구 증거가 아닙니다. 설정 교체 이후 강제 종료의 자동 journal rollback 및 이전 package lease 검토는 여전히 미완료입니다.

전체 회귀571 PASS, production build PASS, 변경된 HBA controller의 actual disposable PostgreSQL 적용·인증·복원·rollback 검증 PASS (`postgresql-hba-operation-native-2026-10-04T08-57-54.977Z.json`). Unix socket은 fixture에서 사용했으며 운영 DB 연결·systemd/runuser transport E2E 증거는 아닙니다. 103의 flock은 root-owned755 regular file이며 업데이트 전 legacy operation.lock은 존재하지 않았습니다. 이 preflight로 이후의 부재를 보장하지 않습니다.

root helper의 empty `operation.lock` 생성/삭제 방식을 고정 inode의 `flock` 방식으로 교체했습니다. 완전한 marker를 private exclusive 임시 파일에 쓰고 fsync한 뒤 atomic hardlink로 초기화합니다. 정상 종료 시 marker inode를 삭제하지 않으며, fd 3로 전달한 동일 open file description에 `/usr/bin/flock --exclusive --nonblock --conflict-exit-code 75`를 적용합니다. helper가 부모 FD를 보유하는 동안 다른 helper는 거부되고 descriptor close 또는 SIGKILL 때 커널 잠금이 해제됩니다. `/usr`·`/usr/bin` 및 flock executable의 root ownership/regular/no-link/nonwritable/executable 상태를 검사하고 실행 전후 binary inode/metadata와 lock inode를 확인합니다. 기존 deb Depends의 util-linux를 사용합니다.

marker/root600/regular/no-follow/same inode 검사를 유지하고, 초기화 중 죽어 남은 단 하나의 `.operation-lock-init-UUID` hardlink만 root-private directory에서 same-inode로 확인 후 정리합니다. legacy empty lock, 불명확한 marker, 다른 hardlink, symlink나 비신뢰 executable은 거부하고 보존합니다. 이전 empty lock을 죽은 작업이라고 추정해 자동 삭제하지 않습니다. 새 marker가 존재하면 이전 helper의 wx lock 생성도 실패하므로 새 helper와 legacy helper가 서로 다른 inode를 잠그도록 만들지 않습니다. root 운영자가 활성 lock inode를 수동 unlink하면 이 보장은 깨지므로 정상 marker는 삭제하지 않아야 합니다.

HBA controller는 installed helper의 global kernel lock을 사용하고 same-process Set으로 직접 중복 호출도 거부합니다. 새 작업에서 target 디렉터리의 `.tastedev-hba-lock`을 만들지 않아 SIGKILL 뒤 새 directory lease를 남기지 않습니다. 이전 lease가 존재하면 해당 작업의 파일 교체 여부를 추정하지 않고 보존하며 검토 필요409로 거부합니다. 이 변경은 외부에서 helper를 거치지 않는 별도 root 프로그램과의 전역 조정을 보장하지 않습니다.

실제 임시 파일과 `/usr/bin/flock`을 사용한 경쟁 차단·FD close 후 재실행·동일 inode 유지·별도 child SIGKILL 후 재실행 PASS. 테스트 전용 ownership adapter는 DEV 장비의 nobody 소유 flock을 root-owned로 모사하지만 실행 중인 kernel flock은 실제입니다. production ownership 검사 완화 없음. legacy/symlink/unknown hardlink 보존, 초기화 alias 정리, unsafe executable 거부 및 HBA same-process 경쟁/legacy lease 보존 PASS. 관련14 PASS, syntax/i18n key 검사 PASS.

전체 목표 PARTIAL. 이는 잠금 해제와 다음 작업의 진입 개선입니다. 강제 종료 시 교체된 DB 설정의 자동 복원/transaction journal recovery를 구현했다고 주장하지 않습니다. MariaDB/Redis/config transaction/Node service의 기존 per-operation filesystem lease도 별도 recovery 검토가 필요합니다. 운영 DB/서비스·readOnly/sudo policy 변경 없음.

## 2026-10-04 HBA 실제 적용·reload·인증·실패 복원 native 검증 및 터미널 출력 연결

최신 배포 deb SHA `6fe3cddd6c47820e4b871ccdad8e9ca20f54e9fc7354dd29a697519b432c3a77`. package verifier PASS (`package-2026-10-04T08-42-36.204Z.json`), 기존 승인 대상103의 동일 앱 업데이트 완료: app active/version0.1.0, BUILD_ID 및 변경된 client chunk SHA 일치, login·client assetHTTP200, 미인증 applyPOST401. 설치 evidence `.runtime/verification/postgresql-hba-terminal-output-installed-20261004.json`. 운영 DB 작업/보안 옵션 변경 및 로그인된 GUI 조작 증거 없음. 변경은 작업 결과 terminal integration이며 새 native verifier는 개발 전용 도구입니다.

새 개발 명령 `npm run verify:postgresql:hba:operation`은 local Docker Desktop의 기존 pinned PostgreSQL16.15 image `sha256:1a6ab3f5345eb6dbe04a1349529caabdb0ab09293a09590fad07b2246bfa4b54`에서 일회용 클러스터를 실행합니다. network none/host bind 없음/read-only image/non-root uid999/cap-drop ALL/no-new-privileges/private tmpfs/pids96/memory768MiB/cpu1을 사용합니다. Node binary와 reviewed runtime modules는 bounded stdin tar로 전달합니다. PostgreSQL binary SHA `ea528a9f858bce5eef557522820c945a3d3b9fd260a15d6d0313d6350574229d`, image digest·Node SHA 및 cleanup을 evidence에 기록합니다.

production /proc owner/exe/argv/start, postmaster.pid, directory/socket identity, root binary trust, fixed read-only running-server SQL inspection 및 reload 전후 OS identity 검사를 실행했습니다. systemd transport는 fixture가 actual pg_ctl로 연결하고 runuser transport는 같은 postgres 계정의 native 실행으로 대체합니다. 검증 fixture DB 연결이며 운영 DB/서비스에는 접근하지 않습니다. 최초 Docker 기본 DB 상위 폴더의 공개 쓰기 권한 때문에 경로 검사가 거부됐고, private tmpfs로 fixture만 수정한 뒤 통과했습니다. production 검사 완화 없음; 실패 로그를 보존합니다.

실제 native 후보 검수 후 reviewed HBA 교체·reload가 거부되던 fixture role의 새 연결을 허용, backup restore·reload가 다시 거부, 첫 실제 reload 직후 실패 주입 시 원본 byte 복원과 두 번째 실제 reload가 거부 상태를 복구했습니다. postmaster PID/start 유지와 소유권·권한 유지, invalid native draft가 원본을 변경하지 않는 조건을 확인했습니다. 최종 fresh fixture 접속 실패가 실제 pg_hba.conf rejection인 경우만 인정하는 검사도 PASS. evidence `.runtime/verification/postgresql-hba-operation-native-2026-10-04T08-40-44.364Z.json`, container cleanup PASS. 이는 비동기 규칙 적용의 fixture 인증 증거이며 운영 API의 load acceptance proof나 실제 systemd/runuser E2E는 아닙니다. `reloadAcceptanceVerified=false`를 유지합니다.

HBA operation 응답은 공통 operationTerminalReport를 통해 터미널 작업 출력 탭에 연결했습니다. 고정 boolean 결과와 유효 backup UUID만 기록하며 source/diff/비밀번호 옵션/raw native error/reason은 제외합니다. 결과는 입력 가능한 shell로 취급하지 않고 reload/복구/실패를 구분합니다. native runner는 개발 도구이며 웹 API에 노출하거나 운영 앱 DB를 자동 기동하지 않습니다.

전체 회귀 566 PASS 및 production build PASS. 검증 환경의 Unix socket listener는 사용했고 networkListeners=false는 TCP listener를 제공하지 않았다는 범위입니다.

전체 목표 PARTIAL. native 적용·인증·복원 fixture 증거는 확보했으나 운영 DB E2E와 로그인된 GUI interaction, 강제 종료 recovery 등 기존 미완료 범위는 남아 있습니다. 원격 readOnly/sudo 옵션 변경 없음.

## 2026-10-04 PostgreSQL HBA 운영 적용·복원 연결 (fixture 검증)

이번 단계의 deb SHA `548e757bfec07d0b7c84b8c8ac971390d91c91d18e3eaf94fd24b7702be589ff`, deb 인증/PTY/helper closure 검증 PASS. 기존 승인 대상103의 동일 앱 재설치 완료, app service active/실행 계정 whitecalvin, helper와 두 신규 runtime 및 BUILD_ID SHA 일치, loginHTTP200/미인증 plan·applyPOST401. 설치 버전0.1.0. evidence `.runtime/verification/postgresql-hba-operation-installed-20261004.json`. 운영 DB 연결·HBA 변경·DB reload 및 readOnly/sudo policy 변경 없음. 새 기능의 운영 실행 증거로 이 설치 확인을 해석하지 않습니다.

HBA 노드 헤더의 적용 검토와 백업 목록의 운영 복원 검토를 연결했습니다. 검토 popup은 선택 순간의 코드/sourceVersion 또는 backupId를 고정하여 native 후보 검수, live cluster identity 확인, before/after 차이를 조회합니다. 최종 확인과 synchronous execution lock으로 중복 실행을 차단하고, popup/scope 변경·unmount 뒤 응답은 반영하지 않습니다. 운영 적용 성공은 sourceVersion만 갱신하며 workspace 저장 baseline을 임의로 승인하지 않습니다. 백업 복원 이후 최신 source를 읽되 기존 미저장 코드 교체 확인을 유지합니다.

`postgresql-hba-service.mjs`는 root-trusted PostgreSQL/psql binary, systemd unit/MainPID, /proc owner/start/argv/exe, postmaster.pid 및 postgres-owned Unix socket을 확인합니다. 운영 검토는 선택한 실행 클러스터에 fixed read-only metadata SQL만 보내 actual data_directory/config_file/hba_file/port/version/start를 비교합니다. `postgres -C`는 실행 서버 상태 증거로 사용하지 않습니다. password/passfile/service 설정을 받지 않고 TCP endpoint도 받지 않습니다. reload는 원래 OS process identity를 확인한 후 고정 unit에 요청합니다. 이는 이전 HBA가 새 관리 인증을 차단해도 rollback 신호 경로를 유지하기 위한 분리입니다.

`postgresql-hba-operation.mjs`는 source SHA/inode/uid/gid/mode, native 검수 graph, service identity, draft SHA 또는 backupId를 review hash에 결합합니다. commit은 확인과 재검토를 요구하고, private backup 후 같은 디렉터리의 exclusive 임시 파일에서 소유권/권한을 보존해 fsync/rename합니다. reload 또는 후속 확인 실패 시 자기 교체 파일의 SHA와 identity가 일치할 때만 원본을 복원합니다. 외부 변경은 보존하며 참조 파일이 변경되거나 복구 검수가 실패하면 수동 복구 필요 상태를 반환합니다. 프로세스 강제 종료·전원 손실의 자동 transaction recovery는 아직 구현하지 않았고, 검사와 rename 사이 비협조 외부 writer의 경쟁을 원천 차단했다고 주장하지 않습니다.

API/helper whitelist, strict payload, 1.6MB escaped JSON input bound, 4MiB review response bound, manifest closure, login/origin/readOnly/databaseChanges/admin/sudo 게이트와 내용 없는 action 감사 기록을 연결했습니다. 계획 120초/적용 300초 helper timeout입니다. 새 UI literal 영어 fallback과 i18n key 검사 PASS. 모든 언어의 완전 번역 증거는 아닙니다.

전체 회귀 565 PASS 및 IDE parent 관련 2 PASS, production build PASS. 주요 fixture는 파일 소유권/권한·private backup·undo backup, 변경 이후 review 만료, PID 교체, include 변경, reload 실패의 원본 복원 및 서비스 복구 실패 구분, 외부 edit 보존, GUI 최종 확인/중복 클릭/권한 차단/stale 응답입니다. 결과의 reloadAcceptanceVerified=false는 의도적입니다. 새 관리 연결 성공과 reload 요청만으로 PostgreSQL의 비동기 HBA 규칙 load 성공을 보증하지 않습니다.

전체 목표 PARTIAL. 이번 신규 actual live-cluster SQL inspection 및 운영 HBA apply/restore/reload는 fixture로 검증했고 운영 DB에 실행하지 않았습니다. 운영 규칙 load acceptance, 강제 종료 복구, custom/shared include layout 및 이전 미완료 범위는 남아 있습니다. 원격 readOnly 질문은 미응답 상태를 유지합니다. 이후 아래 기록들은 이전 배포 시점의 증거입니다.

## 2026-10-04 PostgreSQL HBA 격리 native 검수와 웹 버튼 연결 완료

HBA 노드를 선택하면 PostgreSQL IDE 헤더에 검수 아이콘이 표시됩니다. 현재 code draft와 조회 sourceVersion을 전송하며 metadata의 이전 version fallback도 유지합니다. 별도 popup에 검수 성공/실패와 original path:line/category를 표시합니다. popup ticket/scope guards를 유지하고 검수 창에서 관련 없는 백업/복원 동작은 제외합니다. root helper action/label/manifest closure/API whitelist와 body bounds, login/origin/databaseChanges/readOnly/admin/sudo 게이트 및 requested/completed/invalid/failed 감사 기록을 연결했습니다. root helper timeout은 이 action에서 120초입니다. API JSON body/helper stdin은 escaped 256KiB draft를 지원하도록 최대1600000 bytes, source text는256KiB로 제한합니다.

`postgresql-hba-validate.mjs`는 path/version/text 외 필드를 거부하고 registered source graph의 live SHA와 draft SHA를 구분합니다. incomplete include/@ graph는 snapshot 진단으로 반환하고 native 실행하지 않습니다. native 검사 종료 후 원본 source/include/membership graph를 다시 조회하여 검사 중 변화를409로 거부합니다. `postgresql-hba-sandbox.mjs`는 root-owned 설치 helper에서만 실행되며 root-owned regular executable/parent 및 binary SHA를 전후 확인합니다. /usr read-only, private /etc(passwd/group)/proc/dev/tmp와 root-owned disposable cluster만 mount하고 uid/gid65534, unshare-all/userns, cap-drop ALL/disable-userns를 사용합니다. initdb와 fixed SQL의 postgres --single backend만 실행하고 TCP/Unix listeners/operating data/config mounts를 제공하지 않습니다. stdout/stderr bounds와 단계별 wall deadline, configured prlimit AS/CPU/file/nofile/nproc/core 제한 및 process termination/cleanup을 적용합니다. resourceLimitsConfigured=true이지만 root host uid의 nproc 효과까지 검증했다고 주장하지 않아 resourceLimitsVerified=false입니다. 운영 인증 시도/SSL/GSS/역할 등의 의미는 검증하지 않습니다.

최초 actual helper 검사는 COPY report file의 mode0644를 private-only mode로 엄격히 검사하면서 실패했습니다. umask0077만으로 해결되지 않았고 native report 단계/uid0/mode644로 실제 원인을 확인했습니다. 최종 reader는 private root-owned700 parent와 no-follow regular/single-link/root-owner/nonwritable/bounded descriptor identity를 먼저 검증한 뒤 그 임시 report FD만600으로 제한해 읽습니다. parent/file identity를 재검사하고 group-writable/public-parent/symlink fixture를 거부합니다. 운영 원본 파일 권한 검사는 완화하지 않았습니다. 중간 deb 검사는 생성 완료 전 실행해 incomplete archive를 읽었던 순서 오류도 있었고, 완료 handle 확인 뒤 최종 재검증은 통과했습니다. 초기 실패 로그/이전 deb는 보존합니다.

PostgreSQL15에서는 pg_hba_file_rules에 file_name/rule_number가 없어 고정 candidate path와 line_number SQL을 사용합니다.16+에서는 native file_name/rule_number를 original source mapping으로 변환합니다. 후보 파일은 include_dir duplicate aliases까지최대256개 매핑합니다. 기준 https://www.postgresql.org/docs/15/view-pg-hba-file-rules.html . 기존 HBA literal 영어 fallback 누락20개와 새 검수 문구9개 catalog를 추가했습니다. i18n literal key check PASS이며 모든 Linux 언어의 전체 번역 PASS를 주장하지 않습니다.

최종 전체554 PASS, 관련 request/namespace/report permission/closure10 PASS 및 GUI popup2 PASS, production build PASS, deb authentication/PTY/helper closure 검사 PASS. 최신 deb `72d9ba3170b429140208472e210ada94b5fc4101df6d636b9b18db833a7f528e`, package evidence `.runtime/verification/package-2026-10-04T07-48-45.329Z.json`. 기존 설치 승인 대상103의 같은 앱만 별도 deb로 재설치했고 installed helper/runtime/BUILD_ID source identity 일치를 확인했습니다. 앱 loginHTTP200, unauthenticated HBA POST401.

실제 설치 helper에서 PostgreSQL15/16/17/18 각각 private generated single-user cluster의 정상2-rule draft와 invalid CIDR line1/original path 진단 PASS. uid/gid65534 검사 PASS. 원본 HBA SHA 전후 일치, operating cluster MainPID/ActiveState/SubState 유지, 임시 cluster directory cleanup PASS. 운영 DB 접속/operating PostgreSQL service restart/HBA 적용/sudo policy/readOnly 변경 없음. evidence `.runtime/verification/postgresql-hba-installed-20261004T075032Z.json`; 실행 후 설치 package0.1.0 및 binaries SHA metadata는 `.runtime/verification/postgresql-hba-installed-metadata-20261004.json`로 별도 기록했습니다. 이 metadata를 실행 순간의 binary snapshot으로 추정하지 않습니다. 실제 실행 중 runner는 binary identity/hash 전후 비교를 수행했습니다. 재현에 사용한 local SSH verifier는 `.runtime/verification/postgresql-hba-installed-check.py`에 보존하며 배포에 포함하지 않습니다.

전체 목표 PARTIAL. 웹 positive operation은 React fixture/API denial와 실제 설치 helper evidence를 결합한 상태이며 로그인된 browser 검수 interaction proof는 없습니다. 원격 readOnly 해제 질문은 미응답이므로 권한을 자율 변경하지 않았습니다. HBA operating apply/restore/reload/rollback과 external shared include 등록, 다른 기존 요구의 미완료 항목은 여전히 남았습니다. 다음은 검수된 HBA 초안을 운영 파일에 적용/복원하는 version-bound review/backup/reload/rollback 경로입니다.

## 2026-10-04 개발 터미널의 서버 재시작 복구

현재 개발 서버는 http://127.0.0.1:8787 에서 실행되고 login HTTP200을 확인했습니다. 8792는 이전 SSH tunnel로 103 서버 앱에 연결된 주소이며 로컬 개발 앱 주소와 다릅니다. 개발 보안 설정의 readOnly=false/terminal=true는 기존 사용자 승인 상태를 유지했습니다. 원격 readOnly 및 sudo 설정은 변경하지 않았습니다.

terminal-context가 정상 응답했을 때만 사라진 저장 셸을 종료 상태로 표시하고, 기존 출력/명령 기록을 유지하면서 빈 새 탭을 생성합니다. 네 탭 제한을 지키며 살아 있는 셸은 재연결하고 중복 실행하지 않습니다. 이전 CLI/명령을 재실행하지 않고 현재 터미널 설정의 새 셸만 실행합니다. 첫 번째 탭이 종료된 경우에도 빈 탭을 찾아 선택하고 시작합니다. 권한/연결이 준비되지 않으면 새 터미널 버튼도 비활성화하며 클릭 handler에서 다시 검사합니다. settings/history 조회만으로 종료된 명령을 다시 열지 않습니다.

관련 Node/React 검사 10 PASS, Next.js production build PASS. 개발 terminal 경로 HTTP307 → /login?next=%2Fterminal로 인증 보호 유지. 실제 로컬 임시 PTY에서 네 탭 독립 입력·출력, 한글/emoji 붙여넣기, 화면 크기, Ctrl+C, EOF, 제한 시간 검사 PASS: `.runtime/verification/terminal-pty-2026-10-04T07-26-41.762Z.json`. 이 증거는 실제 PTY backend 및 React fixture의 증거이며 로그인된 브라우저 조작 증거는 아닙니다. 전체 목표 PARTIAL이며 다른 패키지 native HBA runner/운영 적용 등 미완료 범위는 이전 기록대로 유지합니다. 이번 변경은 개발 소스에 반영됐고 원격 deb 재설치는 수행하지 않았습니다.

## 2026-10-04 HBA include/@ graph 및 검수 snapshot 구현

`postgresql-hba-links.mjs`는 PostgreSQL 소스의 토큰 규칙을 참고하여 physical continuation을 quote/comment보다 먼저 합치고 원본 token offset/line을 유지합니다. quoted @literal과 unquoted @"file", comma field, doubled quote, comment continuation을 구분합니다. `postgresql-hba-graph.mjs`는 현재 cluster 디렉터리 안에서 include/include_if_exists/include_dir 및 모든 field의 @ 목록을 재귀적으로 수집합니다. @ expansion으로 만들어진 include directive/target도 해석합니다. private source Map과 public path/version/edge metadata는 구분하며 DB/user/options 원문은 graph에 포함하지 않습니다.

root/postgres 소유와 nonwritable parent/file, no symlink/hardlink, bounded FD read, UTF8/NUL, file identity/hash before/after를 검사합니다. cluster 밖의 경로는 읽지 않습니다. file128/total1MiB/depth16/visit300/token10000/directory1000 제한을 넘으면 incomplete입니다. include_dir의 UTF8 byte C filename ordering, optional absence와 directory membership, draft version과 live sourceVersion을 graph hash에 반영하며 끝에 전부 재검사하여 mixed snapshot을 거부합니다. inode/content/membership 변경을 조용히 승인하지 않습니다.

`postgresql-hba-candidate.mjs`는 registered complete graph identity와 정확한 source bytes만 받아 private ASCII aliases로 복사합니다. include/@ absolute references와 expanded include lines를 복사본 안으로 바꾸고 continuation/physical newline 개수를 보존합니다. include_dir는 원래 순서대로 번호 파일을 별도 directory에 배치합니다. optional missing target은 실제 파일을 만들지 않습니다. root700/file600/no-follow/exclusive writes와 fsync를 사용합니다. public source mapping은 한글/공백 파일명도 지원하고 raw config는 포함하지 않습니다. rewritten file1MiB/candidate4MiB 상한을 유지합니다.

실제 postgres16.15 pinned Docker Desktop image, network none/host mount none/private tmpfs/non-root postgres uid999에서 snapshot native 검수 PASS: absolute include, continued nested @lists, C include order, original line7 CIDR error, original fixture byte preservation, @file expansion으로 생긴 include, 한글·공백 파일의 original path/line2 error. Native evidence `.runtime/verification/postgresql-hba-native-2026-10-04T07-14-04.465Z.json`. 진단 runner의 private tree 전송 한도는 이번 fixture만 maxFile1MiB/tar8MiB로 명시하고 기존 caller 기본값을 유지했습니다. 첫 unit run은 fixture parent를 default writable mode로 만들었던 문제와 offset assertion 값 오류를 고친 뒤 통과했습니다. unsafe source 정책은 완화하지 않았습니다. 전체 549 PASS, syntax PASS.

103번 서버에서 DB나 파일을 실행/작성하지 않는 fixed `/usr/bin/id -u` namespace probe만 추가했습니다. bwrap unshare-all/unshare-user, disable/assert-userns, cap-drop ALL, /usr readonly, private /proc/dev/tmp와 custom uid/gid65534가 실제 uid65534로 실행됐습니다. evidence `.runtime/verification/postgresql-hba-namespace-20261004.json`. namespace가 가능하다는 proof이며 PostgreSQL root runner/성능·resource limits·operating apply proof는 아닙니다. 원격 sudo 설정/운영 파일/서비스는 변경하지 않았습니다.

전체 목표 PARTIAL. 아직 root helper namespace runner, 웹 검수 버튼과 reviewed 운영 적용/복원·rollback에 연결하지 않았습니다. cluster 외부 shared HBA 경로는 explicit safe registration이 필요하며 현재 검사로 전체 임의 운영 layout을 지원한다고 주장하지 않습니다. 현재 원격 앱은 이전 HBA backup deb SHA `a55b176f9c967d6f53e1c5dd66744c0b80e055f84f6331cffc3606b912b6322a`를 유지합니다. 이번 source foundation 작업을 앱에 배포됐다고 주장하지 않습니다. 기준 https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/libpq/hba.c . 다음은 private namespace에서 generated passwd/config와 root-owned ephemeral runtime만 사용하는 native runner를 실제검증하고 앱에 연결하는 단계입니다.

## 2026-10-04 PostgreSQL HBA 실제 native single-user 검수 경로 확인

`postgresql-hba-validation.ts`에 private workspace만 사용하는 고정 initdb/postgres --single 계획과 pg_hba_file_rules 결과 parser를 추가했습니다. SQL은 path/line/auth method/error category만 반환하며 database/user 목록과 인증 옵션 원문·native error 원문은 제외합니다. reviewed file mapping/major/line/response size/schema를 검사합니다. 이 모듈은 아직 웹/root helper 실행 경로에 연결하지 않았으며 계획 생성은 실행/격리 증거가 아닙니다.

새 `npm run verify:postgresql:hba:native`는 기존 로컬 Docker Desktop postgres:16 pinned image, network none, host mount none, read-only rootfs, cap drop ALL/no-new-privileges, pids/memory/cpu limits, private tmpfs에서만 fixture cluster를 initdb하고 single-user backend로 검수했습니다. OS image의 fixed postgres non-root account를 id로 확인(uid999)하며 호스트 UID1000을 container account로 오인하지 않습니다. 실제 native relative include/include_dir C filename order/include_if_exists/@user-list, 잘못된 method/CIDR, 포함 파일 오류 path/line, required include/@list missing, LDAP option value 비노출을 통과했습니다. client 인증·LDAP 연결·운영 DB 접속은 수행하지 않았습니다. PostgreSQL16.15 binary SHA `ea528a9f858bce5eef557522820c945a3d3b9fd260a15d6d0313d6350574229d`, image `sha256:1a6ab3f5345eb6dbe04a1349529caabdb0ab09293a09590fad07b2246bfa4b54`.

처음에는 initdb 단계 실패를 확인했습니다. 기존 진단 runner가 host UID를 사용하던 경로에 fixed image postgres account 옵션을 추가하여 해결했습니다. failure phase만 공개하고 raw output은 보존하지 않는 기존 비공개 정책을 유지했습니다. 성공한 입력/증거를 반복한 것이 아니라 include 순서/@list missing 등 새 범위를 확장하여 최종 PASS했습니다. evidence `.runtime/verification/postgresql-hba-native-2026-10-04T06-57-10.272Z-clarified.json`는 원래 증거를 보존하면서 serverStarted 용어를 postmasterStarted=false/singleUserBackendExecuted=true로 명확히 한 기록입니다. ephemeral single-user cluster에서 SQL backend가 실행됐다는 사실을 숨기지 않습니다. 모든 verification container는 session cleanup/label 검사로 정리됐습니다.

unit 2 PASS, 전체 542 PASS, verifier syntax PASS. docs 기준 https://www.postgresql.org/docs/16/view-pg-hba-file-rules.html 와 https://www.postgresql.org/docs/current/app-postgres.html . 103 서버에는 실행 파일 root ownership metadata만 조회했고 namespace/DB native 실행은 하지 않았습니다. 최신 원격 앱은 이전 HBA backup deb SHA `a55b176f9c967d6f53e1c5dd66744c0b80e055f84f6331cffc3606b912b6322a`를 유지합니다. 이번 단계는 native validator foundation/verification 변경이므로 앱에 새 검수 버튼이 반영됐다고 주장하지 않습니다.

전체 목표 PARTIAL. 다음 필요 범위는 실제 HBA include/@ graph의 안전한 snapshot/rewrite, root helper private namespace 실행과 native binary/runtime 검증, 웹 검수 버튼 및 검토된 operating apply/restore/rollback입니다. 다른 PostgreSQL major/SSL/GSS/역할·네트워크 환경에서의 실제 인증 의미와 운영 서비스 E2E는 이번16 fixture 검사의 증거로 대체하지 않습니다.

## 2026-10-04 HBA 파일 백업과 복원 코드 초안 연결

pg_hba.conf 노드를 선택하면 헤더 백업/복원은 해당 cluster 파일의 HBA 백업 창을 엽니다. 현재 운영 파일의 조회 SHA와 일치할 때만 private backup을 생성하며, 편집 중인 초안은 백업하지 않습니다. 목록은 해당 target만 표시하고 source text를 노출하지 않습니다. restore draft는 현재 live text/version과 백업 text를 함께 읽어 code baseline을 현재 파일로 유지합니다. 편집 중 초안이 있으면 기존 교체 확인을 거치며 코드/GUI 양쪽에 반영됩니다. 다른 cluster record, traversal, private permission 위반, symlink/hardlink, 손상/변경 기록을 거부합니다. 파일 내용 backup fsync와 private directory fsync를 수행합니다. 운영 파일 복원/DB restart는 이 draft action에 포함하지 않습니다.

root helper closure/action label와 authenticated API를 연결했습니다. GET 목록/복원 초안은 명시적 sudoWithoutPrompt 게이트, POST backup은 databaseChanges/readOnly/server gate/sudo 권한·origin 검사와 감사 로그를 거칩니다. 오래된 persisted HBA code record의 sourceVersion이 없으면 선택 metadata version을 사용하고 actual backup은 다시 SHA를 검증합니다. helper JSON 응답은 byte 단위 제한과 UTF-8 stream decoding을 사용합니다. HBA restore draft의 두 bounded snapshot이 JSON escape 후 정상 크기를 초과할 수 있어 해당 action만 최대 4 MiB로 제한하며 다른 action은 1 MiB를 유지합니다.

최종 전체 540 PASS, 최종 render 백업 payload/older draft fallback/복원 baseline 검사 PASS, production build PASS, deb 인증·권한/PTY/helper closure·모듈 export 검증 PASS. 초기 security test 직접 실행은 isolated auth root를 지정하지 않아 개발 저장소 권한 검사를 실패했으며 표준 npm test의 private fixture root로 최종 통과했습니다. DB 또는 사용자 인증 저장소 권한을 완화하지 않았습니다.

최신 deb SHA-256 `a55b176f9c967d6f53e1c5dd66744c0b80e055f84f6331cffc3606b912b6322a`, package evidence `.runtime/verification/package-2026-10-04T06-42-56.346Z.json`. 기존 설치 승인 대상 103 앱만 재설치하고 helper/BUILD_ID/HBA backup module의 source hash 일치, app active, login HTTP200, 두 HBA GET endpoint의 unauthenticated HTTP401을 확인했습니다. 원격 증거 `.runtime/verification/postgresql-hba-backups-20261004.json`.

전체 목표 PARTIAL. HBA native 검수·운영 적용/실제 파일 복원·실제 브라우저 편집 E2E는 아직 완료하지 않았습니다. 이번 backup/restore draft의 positive 동작은 filesystem/React fixture 증거이며 remote 운영 DB에서 수행한 검사가 아닙니다. 원격 보안 설정·운영 HBA 파일·PostgreSQL 서비스는 변경하지 않았습니다.

## 2026-10-04 PostgreSQL 설치 계정 소유 설정 적용 경로 수정

실제 103번 서버 PostgreSQL cluster 디렉터리와 postgresql.conf는 postgres 소유였습니다. 기존 legacy apply/restore helper의 root-only 파일/부모 검사는 정상 배포 설정을 거부했습니다. 고정 /usr/bin/id 바이너리의 root 소유·nonwritable 여부를 검증하고 postgres uid를 확인하여 PostgreSQL 경로에만 root/postgres 소유권을 허용했습니다. /etc와 /etc/postgresql는 root-owned 정책을 유지합니다. 다른 계정 소유, writable directory/file, 링크와 hardlink는 거부합니다. O_NOFOLLOW/O_NONBLOCK FD의 bounded read, UTF-8/NUL 검사, 읽기 전후 파일 identity와 부모 재검사를 추가했습니다. 설정 적용/복원은 기존 SHA conflict, native candidate 검수, private backup, 소유권 보존, activation rollback 경로를 유지합니다.

관련 helper 회귀 23 PASS, 전체 535 PASS, production build PASS, deb 인증·세션·PTY 검증 PASS. deb SHA-256 `ac025c16351012056aef42a5b9e1e23bc271195e189b6327399cb9cb32ea5118`. 패키지 증거 `.runtime/verification/package-2026-10-04T06-26-58.267Z.json`. 기존 설치 승인으로 103 앱만 재설치했고 installed helper/BUILD_ID checksum 일치, app active, login HTTP200을 확인했습니다. 원격 증거 `.runtime/verification/postgresql-owner-20261004.json`.

전체 목표 PARTIAL. 실제 DB 접속·PostgreSQL 재시작·운영 설정 적용은 수행하지 않았습니다. postgres 소유 파일 적용/복원은 fixture 검증이며 실제 native activation E2E를 대체하지 않습니다. HBA 운영 검수·적용·백업·복원 및 브라우저 E2E는 남아 있습니다.

## 2026-10-04 PostgreSQL pg_hba.conf GUI·코드 편집 및 제한된 관리자 조회

이전 턴은 PostgreSQL 그룹 전환/초안 교체 상태 수정과 실제 앱 반영으로 progress였습니다. 이번에는 cluster별 pg_hba.conf metadata를 live inventory와 IDE tree에 추가했습니다. local/host/SSL/GSS 유형, database/user/address, 인증 방식(18 oauth 포함)/옵션, 규칙 추가·수정·삭제·인접 순서 이동을 GUI로 코드 초안에 반영합니다. quoted keyword/name/주석/CRLF/IPv4 별도 mask를 보존하고 include·복잡한 multiline·알 수 없는 형식은 원문 code 편집으로 남깁니다. include 경계를 넘어 GUI에서 순서를 바꾸지 않습니다. 기존 postgresql.conf GUI import/apply와 HBA는 분리하고 서로의 draft를 덮어쓰지 않습니다. 작업 폴더 초안 저장/다운로드는 기존 코드 편집 경로를 사용하며 운영 HBA 자동 적용은 아직 제공하지 않습니다.

config source는 부모 링크/파일 교체/size/UTF8/NUL 검사를 강화했습니다. unreadable HBA도 오류 metadata node로 표시합니다. 직접 읽기 권한 부족에만 고정 HBA path + sudoWithoutPrompt 게이트를 적용해 전용 postgresql-hba-source helper를 호출합니다. helper는 확인된 root/postgres 소유, nonwritable/일반/single-link/bounded file만 읽고 include target을 열지 않습니다. 소유 uid 조회는 검증된 fixed /usr/bin/id -u postgres만 사용합니다. root module closure, helper allowlist, security label에 새 읽기 동작을 포함했습니다. 실제 sudo 정책/파일 권한은 변경하지 않았습니다.

관련 21 PASS, 전체 533 PASS, production build PASS, 최종 deb 인증/PTY/API/helper closure 검증 PASS. 최초 새 HBA render test는 기존 미저장 초안 교체 확인을 거치지 않아 실패했고 실제 확인 동작을 추가했습니다. HBA guiSynchronized prop를 잘못 제외하던 구현도 수정했습니다. 첫 전체 게이트는 새 helper의 audit entry/label 누락을 찾아 수정 후 최종 PASS했습니다. 공식 기준 https://www.postgresql.org/docs/current/auth-pg-hba-conf.html .

최신 deb SHA-256 `02e7a602b2b5a330ee44ba6aa2a5f4906cee2d36c2d39d180f524c3ab58fbc5c`, package evidence `.runtime/verification/package-2026-10-04T06-13-59.139Z.json`, unsigned/unpublished APT `dist/apt-repository-GJo62N`. 기존 설치 승인 범위에서 103 앱만 checksum 확인 후 재설치, BUILD_ID hash 일치/app active/admin configured=true/loginHTTP200. 설치 module의 15/16/17/18 HBA metadata nodes 확인, 모두 app account 직접 read denied(mode640). 설치 helper의 /etc/passwd 요청 거부 확인. HBA 내용·DB 접속·운영 파일/서비스·sudo 정책은 변경하지 않았습니다. 원격 증거 `.runtime/verification/postgresql-hba-20261004.json`.

전체 목표 PARTIAL. HBA의 positive root read/실제 브라우저 편집·운영 적용/검수/백업·복원 E2E는 미검증/미구현 부분이며 fixture PASS로 대체하지 않습니다. 원격 옵션은 자율 활성화하지 않았습니다. 다음은 HBA 운영 검수·적용·복원 흐름 및 원래 다른 요구의 미완료 범위를 이어갑니다.

로그 `/tmp/tastedev-pg-hba-tests.log`, `/tmp/tastedev-pg-hba-source-tests.log`, `/tmp/tastedev-pg-hba-full.log`, `/tmp/tastedev-pg-hba-build.log`, `/tmp/tastedev-pg-hba-package.log`, `/tmp/tastedev-pg-hba-remote-install.log`.

## 2026-10-04 PostgreSQL 그룹 전환·초안 교체 상태 개선

이전 턴은 nginx 조회 갱신의 선택/초안 유지 수정과 실제 앱 반영으로 progress였습니다. 이번에는 PostgreSQL 같은 파일의 연결/메모리/로그 그룹 전환 시 기존 source record가 있으면 재조회하지 않고 코드 초안을 유지하도록 했습니다. 파일 노드를 다시 선택하는 명시적 재조회는 유지하고 첫 로드 중 group 선택은 소스가 없으므로 다시 요청합니다. inventory 갱신은 같은 파일의 선택 metadata만 새 객체로 교체하며 코드 초안/검토 baseline은 보존합니다. 사라진 파일은 선택과 pending replacement prompt를 해제합니다. package/connection scope 변경도 pending을 지우며 다른 kind pending의 확인창/교체 동작을 차단합니다.

관련 GUI/code/popup 검사 5 PASS, production build PASS, 최종 deb 인증/PTY/API 검증 PASS. 신규 테스트 첫 실행은 group 선택이 settings로 이동한 후 비활성 code editor를 찾으려는 fixture 오류로 실패했고 code 탭을 다시 여는 실제 흐름으로 수정했습니다. 전체 525 회귀는 이전 결과이며 이번에 반복하지 않았습니다.

최신 deb SHA-256 `820533e063c36d62105474ff1868235325f994a848ab26c1cb583f7d556fb8bd`, package evidence `.runtime/verification/package-2026-10-04T05-54-07.930Z.json`, unsigned/unpublished APT `dist/apt-repository-8ml4VV`. 사용자 기존 설치 승인 범위에서 103 앱만 별도 deb checksum 확인 후 재설치했습니다. production BUILD_ID hash 일치, app active/admin configured=true/login HTTP200. 원격 PostgreSQL 15/16/17/18 main postgresql.conf mode644/app account readable=true. 파일 metadata만 확인했으며 DB 접속/설정 수정/서비스 재시작은 실행하지 않았습니다. 원격 증거 `.runtime/verification/postgresql-ide-20261004.json`.

전체 목표 PARTIAL 유지. 실제 브라우저 상호작용·운영 DB/설정 적용/복원 E2E는 미검증이며 파일 읽기 권한 검사는 이들을 증명하지 않습니다. 다음은 패키지별 실제 설정 파일 범위와 GUI 편집 기능의 부족 부분을 이어서 구현합니다. 원격 readOnly 해제 승인 질문은 미응답이고 로컬 개발 터미널 허용은 유지됩니다.

로그 `/tmp/tastedev-postgresql-ide-tests.log`, `/tmp/tastedev-postgresql-ide-build.log`, `/tmp/tastedev-postgresql-ide-package.log`, `/tmp/tastedev-postgresql-ide-remote-install.log`.

## 2026-10-04 nginx IDE 조회 갱신의 선택·초안 유지

이전 턴은 root 파일 편집/트리·백업 연결 및 실제 앱 반영으로 progress입니다. 이번 턴은 모든 data 갱신에서 setSelected(null)하던 버그를 고쳤습니다. 초기 선택 없음은 유지하고 이후 갱신에서는 file path와 semantic ancestry key로 같은 블록을 선택합니다. 이전 parser ID가 달라져도 같은 블록/설정·코드 탭 유지, 사라진 파일 선택 해제, draft source/기존 baseline 보존을 검증했습니다. 블록 details key도 semantic key를 사용하여 앞쪽 노드 번호 변화에 의해 불필요하게 초기화되지 않도록 했습니다.

관련 렌더/semantic-key/editor 검사 5 PASS, production build PASS, 최종 deb 서버/인증/PTY/API 검증 PASS. 이번 UI 변경에 전체 525 회귀를 반복하지 않았으며 이는 직전 턴의 결과입니다. 최신 deb SHA-256 `b4b128482a743d61779c2c5bec4546009e31d1406a0389d9e8add82421d7114a`, package evidence `.runtime/verification/package-2026-10-04T05-45-29.645Z.json`. 로컬 unsigned/unpublished APT `dist/apt-repository-YsMwbL`.

사용자 기존 설치 승인 범위에서 103 앱만 별도 deb checksum 확인 후 재설치했습니다. 최신 production BUILD_ID 해시 대조 PASS, app active/admin configured=true/login HTTP 200. 증거 `.runtime/verification/nginx-selection-20261004.json`. 운영 nginx 파일/서비스, DB, 인증서 발급은 변경하지 않았습니다. 이전 root graph 28files/58edges 경고0은 unchanged backend의 이전 검사 증거이며 이번에 반복하지 않았습니다.

실제 GUI 렌더링/사용자 조작 E2E와 원격 운영 적용·복원은 아직 검증하지 않았습니다. 전체 목표 PARTIAL 유지. 원격 조회 전용 해제 승인 질문은 미응답이고 개발 터미널 활성화는 유지합니다. 다음은 다른 패키지 GUI 흐름과 남은 원래 요구사항 검증을 이어갑니다.

로그 `/tmp/tastedev-nginx-selection-tests.log`, `/tmp/tastedev-nginx-selection-build.log`, `/tmp/tastedev-nginx-selection-package.log`, `/tmp/tastedev-nginx-selection-remote-install.log`.

## 2026-10-04 nginx 루트 설정 파일 GUI·편집·백업 연결

지난 변경은 nginx-tree inventory에 root _.conf와 Certbot 옵션을 추가했지만 renderer가 기존 폴더만 표시하는 누락이 있었습니다. 이번에 root 파일 노드와 letsencrypt 그룹을 실제 렌더링하고 regression에서 표시를 확인했습니다. `nginx-config-paths.ts`로 client/helper 공통 경로 정책을 만들고 root의 안전한 일반 _.conf 파일을 편집·검수·백업·복원 경로에 연결했습니다. /etc 밖, 숨김 파일, root 다른 확장자, 깊은 subdirectory, sites-enabled 직접 편집, Certbot 외부 공통 파일 편집은 계속 거부합니다. graph membership, ownership/symlink, conflict, native validation/service identity, backup/rollback gate는 유지합니다. helper 두 module closure에 새 pure module을 포함했습니다.

root include candidate가 원본을 보존하며 편집본을 전체 private graph에 포함하는 검사, unreferenced file/외부 변경 거부, reload 실패 시 원본 복원+백업 fixture PASS. 최초 render test는 native button을 custom Button 목록에서 찾는 잘못된 assertion으로 실패했고 native 목록으로 수정했습니다. 관련 11 PASS, 전체 525 PASS, 최종 toolbar/tree GUI 3 PASS. production build PASS, 최종 deb 인증/PTY/API/helper closure 검증 PASS.

최신 deb SHA-256 `da6b93fa93023297a79fa4d88843514b63f46dd3b77a7d7ec2f2a799a8b23d91`, package evidence `.runtime/verification/package-2026-10-04T05-39-42.477Z.json`, unsigned/unpublished APT `dist/apt-repository-HIHF5z`. 사용자 기존 설치 승인 범위로 103 앱만 checksum 확인 및 같은 패키지 재설치. 설치 모듈에서 rootEditable=true/certbotEditable=false, fixed readonly graph files=28/edges=58/complete=true/warnings=0, app active/admin configured=true 확인. 증거 `.runtime/verification/nginx-root-settings-20261004.json`. nginx 운영 파일 수정·서비스 재시작·ACME 발급·DB 변경은 실행하지 않았습니다.

전체 목표 PARTIAL 유지. 실제 브라우저 조작과 운영 적용/복원 E2E는 별도 미검증이며 fixture 검사를 해당 범위의 증거로 대체하지 않습니다. 다음 범위는 파일 선택→블록 선택→GUI/코드 초안→검수→적용/복원의 미검증 동작 및 다른 패키지의 동일 IDE 흐름 점검입니다. 원격 조회 전용 해제 명시 승인 질문은 아직 미응답 상태입니다. 로컬 development terminal 활성화는 유지합니다.

로그 `/tmp/tastedev-nginx-root-full.log`, `/tmp/tastedev-nginx-root-targeted.log`, `/tmp/tastedev-nginx-root-gui.log`, `/tmp/tastedev-nginx-root-build.log`, `/tmp/tastedev-nginx-root-package.log`, `/tmp/tastedev-nginx-root-remote-install.log`.

## 2026-10-04 nginx·Certbot 공통 설정 그래프/트리 연결 완료

고정 공통 설정 `/etc/letsencrypt/options-ssl-nginx.conf`만 topology에 읽기 전용으로 포함하고 후보 검수 시 별도 private external namespace에 복사합니다. 원본/후보 그래프 버전과 후보 해시 검사를 유지합니다. 개인키/인증서 경로, 외부 wildcard, symlink 및 외부 파일 편집은 허용하지 않습니다. GUI tree는 nginx root \*.conf와 실제 include된 공통 설정을 표시합니다. 공통 파일 설정/코드는 읽기 전용이며 저장된 초안도 무시하고 mutation/context/초안 버튼을 숨깁니다.

전체 523 PASS, production build PASS, 최종 GUI fixture 5 PASS, 최종 deb 서버/인증/PTY/SSE 검증 PASS. deb SHA-256 `402d2fb381b070514092cc2d9206ef48dc13d586ee8816cfa8fdb9fd141ac152`, package evidence `.runtime/verification/package-2026-10-04T05-31-25.854Z.json`. 로컬 APT 산출물 `dist/apt-repository-ITgEaY`, unsigned/unpublished.

사용자 기존 설치 승인 범위에서 103 앱만 새 별도 deb를 checksum 확인 후 재설치했습니다. 실제 fixed read-only helper 결과 files=28, includeEdges=58, complete=true, warningCount=0, certbotOptionsReadOnly=true, serviceReady=true, operatingConfigurationChanged=false. 기존 46개 Certbot 옵션 include 경고 해결. 앱 active/admin configured=true 유지. 원격 증거 `.runtime/verification/nginx-certbot-options-20261004.json`. 인증서 발급, nginx 서비스 제어/운영 설정 적용, DB 변경은 실행하지 않았습니다.

GUI 실제 픽셀/상호작용과 운영 설정 적용 E2E는 확인하지 않았으며 전체 목표 PARTIAL 유지. 다음 실제 기능 부족 항목: root common.conf 등의 운영 편집 범위, 전체 GUI 검증, 패키지별 적용/복원 실제 안전 환경 검증. 원격 조회 전용 해제는 이전 명시 승인 질문 미응답으로 유지, 로컬 개발 터미널 허용 상태는 유지합니다.

로그 `/tmp/tastedev-certbot-full.log`, `/tmp/tastedev-certbot-gui-tests.log`, `/tmp/tastedev-certbot-build.log`, `/tmp/tastedev-certbot-package.log`, `/tmp/tastedev-certbot-remote-install.log`.

## 2026-10-04 실제 nginx 상대 include·prefixed mask 지원

원격 고정 읽기 전용 nginx-context-inspect에서 최초 files=2/complete=false를 확인했습니다. 지적 include는 common.conf/cache.conf/geoserver.conf/kakao.conf/jenkins.conf 및 conf.d/vhost\__.conf였습니다. 상대 경로를 nginx.conf의 /etc/nginx prefix 기준으로 해석하고 leaf _ 패턴을 일반 prefix/suffix 매칭으로 확장했습니다. GUI include 링크, root topology, private candidate rewrite가 같은 매칭을 사용하며 directory 재확인도 같은 pattern으로 수행합니다. 경로 이탈/상위 디렉터리·변수·directory wildcard 차단 및 기존 editable file 허용 범위는 유지했습니다.

관련 10 PASS, 전체 520 PASS, production build PASS. 초기 신규 fixture는 폴더 권한을 지정하지 않아 unsafe 검증으로 실패했으며 700으로 수정했습니다. candidate 신규 test는 기존 범위 밖 common.conf 직접 편집을 거부하여 실패했고 nginx.conf를 대상으로 바꿔 편집 범위를 넓히지 않았습니다. 후보의 relative/mask private 경로 재작성과 원본 불변 검사 PASS. 기준 자료 https://mailman.nginx.org/pipermail/nginx/2016-April/050456.html .

최신 deb SHA-256 `24f9d0702934ed23748948ff69dfae8fdb8c8dbefcee2bed55fc4cbe1ceca697`, 패키지 증거 `.runtime/verification/package-2026-10-04T05-17-44.460Z.json`. 사용자 목표 시스템/설치 승인 범위에서 103 앱만 재설치, 이전 deb 보존, nginx 설정/운영 서비스 변경 없음. 새 실제 helper graph files=27/includeEdges=12/serviceReady=true, complete=false. 남은 46 경고는 모두 /etc/letsencrypt/options-ssl-nginx.conf include로 확인했습니다. 인증서/개인키 파일은 읽지 않았습니다. 이 공통 Certbot 설정 연결은 다음 미완료 항목으로 유지하며 전체 PARTIAL입니다. 웹 UI 픽셀/조작 또는 실제 설정 적용 E2E PASS가 아닙니다.

로그 /tmp/tastedev-nginx-relative-tests.log, /tmp/tastedev-nginx-relative-full.log, /tmp/tastedev-nginx-relative-build.log, /tmp/tastedev-nginx-relative-package.log, /tmp/tastedev-nginx-relative-apt.log. 이전 턴은 터미널 디자인 수정/실제 배포로 progress, 이번 턴은 nginx include 누락 수정/실제 그래프 증거로 progress입니다.

## 2026-10-04 터미널 스크롤바·내부 선 수정 및 원격 반영

사용자 요청에 따라 terminal host 외부 padding 8px을 0으로 바꾸고 텍스트 inset은 xterm에만 left 8px으로 적용했습니다. xterm scrollable element의 top/left shadow를 숨겨 스크롤 그림자 선을 제거했습니다. FitAddon이 xterm padding을 계산하는 현재 라이브러리 구현을 확인했습니다. shell 출력 내용·입력 커서·선택 표시는 변경하지 않았습니다.

production build PASS, 최신 deb 인증/PTY/SSE 검증 PASS. SHA-256 `92544de9bee4960bc6b8fa32c2305333aa7e5eb34d12c42ec1a332dfe2ffffc1`, 증거 `.runtime/verification/package-2026-10-04T05-09-24.354Z.json`. 수정 요청과 기존 설치 승인 범위로 192.168.0.103에 새 deb를 별도 edge 파일로 전송해 checksum 확인 및 같은 앱 재설치 완료. 이전 deb 보존, 0 upgrade/1 reinstall/0 removal, whitecalvin 실행 계정 유지. SSH 터널 login HTTP 200, 실제 제공되는 CSS의 host padding 0/scroll shadow hidden 확인, 관리자 configured=true 보존 PASS. 실제 GUI 픽셀·스크롤 조작은 미검증입니다.

원격 nginx 1.31.6, Certbot 2.9.0, PostgreSQL meta 18+293, MariaDB 10.11.14 패키지 존재 확인. 버전 조회만 수행하며 해당 운영 서비스/DB 데이터 변경 없음. 사용자 “목표 시스템 구현” 요청에 따라 이들을 다음 GUI/운영 검증 대상으로 유지합니다. 원격 조회 전용 해제 승인 질문은 별도 미응답이고 개발 터미널 활성화는 완료 상태 유지. CSS처럼 낮은 영향의 스타일 변경에 구현 복제 테스트/전체 회귀 반복을 추가하지 않았습니다. 전체 목표 PARTIAL.

## 2026-10-04 사용자 요청 개발환경 터미널 활성화

사용자가 “지금 개발환경에서 터미널 사용할 수 있게 해줘”라고 요청했습니다. 개발 .env.local의 LINUX_ENABLE_TERMINAL=true만 설정하고 보안 설정 terminal=true/readOnly=false를 saveSecurity의 버전 확인/감사 경로로 적용했습니다. 다른 기능 옵션과 원격 103 설정은 변경하지 않았습니다. 확인한 프로젝트 개발 프로세스만 종료하고 npm run dev로 8787 재시작, exec session 13764 유지. 개발 login HTTP 200, serverAllowsTerminal=true/readOnly=false/terminal=true 확인.

같은 개발환경 변수/보안 모듈로 일반 계정 PTY에 입력을 보내 marker와 whoami whitecalvin 출력/exit success를 대조해 PASS. 이는 별도 모듈 subprocess의 실제 PTY 검사이며 인증된 브라우저 입력 증거는 아닙니다. 사용자는 개발 /terminal을 새로고침하여 사용할 수 있습니다. 원격 조회 전용 해제 승인 질문은 별도이며 이번 개발 활성화로 대체되지 않습니다. 앞선 스크롤바/내부 선 디자인 요청은 여전히 후속으로 남습니다. 전체 PARTIAL.

## 2026-10-04 원격 웹 터미널 서버 허용 적용

사용자가 관리자 설정 완료를 알렸고 공개 status에서 configured=true를 확인했습니다. 이어 서버 웹 터미널 허용 적용 질문에 “응”으로 승인했습니다. 192.168.0.103의 /etc/tastedev-linux/environment에 LINUX_ENABLE_TERMINAL=true만 적용하고 앱 서비스만 재시작했습니다. 기존 파일이 있으면 root 600 백업을 만들고 다른 환경 값을 보존하는 방식입니다. 적용 당시 기존 override 파일은 없었습니다.

재시작 후 systemd whitecalvin/active/running, auth configured=true 보존 및 실제 MainPID environ에서 terminal flag true만 추려 확인 PASS. 다른 환경 값/비밀번호/쿠키 노출 없음. 웹 보안 설정의 readOnly/terminal 허용과 인증 후 실제 셸 조작은 미검증이며 전체 PARTIAL입니다. 로컬 QA-01 서비스/설정 변경 없음.

## 2026-10-04 원격 인증·터미널 허용 입력 대기 — BLOCKED audit 3

두 이전 턴은 동일 사용자 초기 설정/선택 부재로 no progress였습니다. 이번 턴에도 관리자 생성 완료 및 서버 terminal gate true/서비스 재시작 선택 답변이 없습니다. 마지막 공개 auth status는 configured=false이며 계정 초기 설정이 실행 중이라는 확인도 없습니다. 인증 후 실제 셸/GUI 검증을 진행할 수 없어 goal BLOCKED로 전환합니다. 192.168.0.103 deb 설치, whitecalvin 서비스 실행, loopback 로그인 및 SSH 터널 접근 결과를 보존합니다. 계정 설정 완료와 허용 선택을 받은 뒤 재개합니다. 전체 목표는 여전히 PARTIAL이며 완료 범위를 축소하지 않습니다.

## 2026-10-04 원격 인증·터미널 허용 입력 대기 — blocker audit 2

이전 턴은 no progress입니다. 공개 auth status를 다시 확인했으나 configured=false/authenticated=false로 동일합니다. 관리자 설정 완료 답변과 터미널 허용 승인도 아직 없습니다. 동일 사용자 입력/초기 설정 blocker의 두 번째 연속 no-progress 턴입니다. SSH 터널은 응답하지만 사용자 계정 초기 설정 프로세스가 실행 중이라는 증거는 아니므로 verified wait로 세지 않습니다. 서비스 설정/계정 변경 없이 전체 goal active/PARTIAL 유지.

## 2026-10-04 원격 인증·터미널 허용 입력 대기 — blocker audit 1

이전 턴은 원격 관리자 미설정/terminal environment override 없음이라는 새 선행 조건 증거 확보로 progress였습니다. 이번 턴에는 관리자 설정 완료 답변 및 서버 terminal gate true/서비스 재시작 승인 모두 아직 없음을 대조했습니다. 응답을 추정하지 않고 초기 비밀번호 생성·계정 교체·서버 gate 변경을 하지 않았습니다. 실제 인증 후 터미널/GUI 검증이 사용자 초기 설정 및 선택에 막힌 첫 no-progress 턴입니다. SSH 전달 프로세스는 사용자 웹 접근용으로 유지하지만 계정 설정 작업이 실행 중이라는 증거는 아니므로 verified wait로 세지 않습니다. 전체 goal active/PARTIAL 유지.

## 2026-10-04 원격 터미널 활성화 선행 조건 확인

원격 설치 서버의 관리자 configured=false를 공개 HTTP로 확인했습니다. /etc/tastedev-linux/environment가 없어 기본 unit의 LINUX_ENABLE_TERMINAL=false가 적용됩니다. 인증 후 실제 셸 검증에는 관리자 초기 설정, 서버 terminal gate 허용, 웹 보안 설정 허용이 필요합니다. 관리자 설정 완료 여부 및 서버 gate true/서비스 재시작 여부를 사용자에게 질문했습니다. 답변을 추정하지 않으며 인증 계정/서버 gate/서비스를 이번 턴에서 변경하지 않았습니다. 기본값 OFF를 기능 동작 완료로 주장하지 않습니다. 이전 턴은 SSH 터널·설치 바이너리/소유권 증거 확보로 progress이며 전체 목표 PARTIAL입니다.

## 2026-10-04 원격 설치 서비스 SSH 터널·소유권 검증

설치 서버 192.168.0.103의 loopback:8791을 로컬 127.0.0.1:8792로 SSH 전달했습니다. 서버 공개 바인딩/방화벽 변경 없음. 터널 login HTTP 200, 미로그인 terminal 307, 관리자 configured=false 확인. 실행 중 tunnel exec session 54277은 사용자 접근을 위해 유지하며 자동 완료를 기다리는 검증 작업은 아닙니다.

원격 Node 22.23.3 바이너리, startup script 및 SQLite native SHA-256을 기록했습니다. 상태 폴더와 workspace 모두 whitecalvin 소유/700, systemd User=whitecalvin/active/running 확인. 증거 `.runtime/verification/remote-installed-20261004T044052Z.json`. 비밀번호/키/쿠키/계정 파일 내용 기록 없음. 실제 설치 계정 요구의 서비스/소유권 증거가 강화됐으나 인증 후 터미널 및 GUI 조작은 아직 미검증입니다. 관리자 계정 생성 여부를 사용자에게 요청했고 응답을 추정하지 않습니다. 전체 PARTIAL.

## 2026-10-04 사용자 승인 원격 deb 설치 완료

사용자가 SSH 192.168.0.103 / whitecalvin / id_ed25519를 제공한 뒤 “설치해”라고 명시적으로 승인했습니다. 이전 파일 전송 거부 후 해당 승인을 근거로 deb를 원격 임시 폴더에 전송했습니다. 양쪽 SHA-256 `939cd8f96d27336e5bc5b753db0cea3eea97ab9214c5b46d924ae27e9ac4d4d7` 일치 확인 후 sudo apt-get install으로 tastedev-linux 0.1.0 설치 PASS. Ubuntu 24.04.5, Node 22.23.3. 0 upgrade / 1 new install / 0 removal. 로컬 QA-01 서비스/sudo/apt 변경 없음.

원격 systemd ActiveState=active/SubState=running/User=whitecalvin/Group=1000 확인. 서비스 로그인 HTTP 200, auth status configured=false/authenticated=false. 실제 설치 후 지정 OS 계정으로 서비스 구동 증거 확보. service-user 파일 일반 계정 읽기 Permission denied로 내용은 확인하지 않았고 추가 권한 변경 없음. 웹 관리자 계정 초기 설정과 인증 후 실제 터미널 조작/GUI, 다른 운영 기능의 전체 검증은 아직 남아 전체 PARTIAL입니다. 비밀번호 생성/수집/노출 없음. 이전 환경 blocker에 새 설치 승인이 제공되어 설치 단계 진행 완료.

## 2026-10-04 최종 환경 검증 BLOCKED — blocker audit 3

두 이전 턴은 동일 환경 blocker로 no progress였습니다. 세 번째 턴에도 QA-01 sudo/운영 서비스 변경 금지가 유지되며 DEV-01 접속 주소·프로젝트 경로 답변은 없습니다. 실제 GUI 조작 및 deb 설치 계정/서비스 검증을 진행할 수 없어 goal을 BLOCKED로 전환합니다. 전체 목표는 미완료/PARTIAL이며 범위를 축소하지 않습니다. 코드·빌드·517 회귀·추출 deb PTY/SSE HTTP PASS는 유지하되 운영 설치/GUI PASS로 확대 해석하지 않습니다. 환경 정보와 허용된 검증 접근이 제공되면 재개합니다.

## 2026-10-04 터미널 최종 환경 검증 대기 — blocker audit 2

이전 턴은 no progress이며 실행 중 프로세스 대기가 아닙니다. 이번 턴에도 QA-01 운영 서비스/sudo 변경 금지 지침이 유지되고 DEV-01 접속 주소·프로젝트 경로 답변이 없습니다. 실제 GUI/설치 계정 검증을 대체할 허용된 환경이 확인되지 않았습니다. 기존 성공 검사를 반복하거나 무관한 코드를 추가하지 않았습니다. 동일 환경 blocker의 두 번째 연속 no-progress 턴, 전체 목표 PARTIAL/active 유지.

## 2026-10-04 터미널 최종 환경 검증 대기 — blocker audit 1

이전 목표 턴은 실제 idle SSE HTTP 증거와 검증 스크립트 개선으로 progress입니다. 이번 턴에는 최신 package 증거의 installed=false, 설치 postinst의 configure-service-account -> systemd 경로, serviceAccountPlan의 사용자/HOME/PATH 설정을 다시 대조했습니다. 기존 PASS를 반복 실행하지 않았습니다. 실제 GUI 조작 및 deb 설치 계정/운영 서비스 검증은 여전히 증거가 없습니다.

현재 QA-01 AGENTS.md는 sudo 설정·운영 서비스 변경을 금지합니다. GUI 도구의 기존 접근 제한을 우회하지 않습니다. DEV-01 접속 주소/프로젝트 경로 질문의 답변이 아직 없어 필요한 설치 환경에 접근할 수 없습니다. 실행 중인 검증 프로세스는 없으며 이를 verified wait로 세지 않습니다. 동일 외부 환경 blocker의 첫 no-progress 턴으로 기록합니다. 전체 목표 미완료/PARTIAL, goal active 유지. 추가 코드나 같은 성공 검사로 완료를 대체하지 않습니다.

## 2026-10-04 실제 deb HTTP idle heartbeat 검증

최신 deb의 실제 인증 SSE 연결을 출력 없는 상태로 유지하여 15초 heartbeat 이벤트 전달을 확인했습니다. heartbeat payload는 빈 객체이며 output id/sequence를 변경하지 않습니다. 이후 같은 PTY에 입력을 보내 최종 출력과 종료까지 확인했습니다. 미로그인/소실 작업 거부 및 로그아웃 인증 폐기 등 기존 패키지 검사도 PASS. 첫 시도는 검사 공통 5초 fetch 제한 때문에 TimeoutError로 종료됐으며 heartbeat용 스트림 요청만 30초로 수정해 재검증 PASS. 일반 API 제한은 유지했습니다.

배포 파일은 변경하지 않았습니다. SHA-256 `939cd8f96d27336e5bc5b753db0cea3eea97ab9214c5b46d924ae27e9ac4d4d7`, 새 증거 `.runtime/verification/package-2026-10-04T04-03-23.535Z.json`. 로그 `/tmp/tastedev-terminal-heartbeat-http.log` (초기 검사 제한 실패), `/tmp/tastedev-terminal-heartbeat-http-retry.log` (PASS). 현재 개발 서버 8787의 /login HTTP 200, /terminal 미로그인 307 -> /login?next=%2Fterminal 확인. 이는 GUI 렌더/로그인 후 터미널 조작 증거가 아닙니다.

서비스 기본 unit의 tastedev-linux 사용자 설정은 configure-service-account.ts의 설치 SUDO_USER 기록 및 systemd drop-in 경로로 덮어쓰도록 구현되어 있습니다. 실제 설치 계정/서비스 동작은 DEV-01 환경이 필요하며 아직 환경 정보 답변 없음. 현재 QA-01의 sudo/운영 서비스 변경 금지 및 GUI 도구 접근 제한을 우회하지 않았습니다. 이전 턴은 idle 복구 코드와 517 검사/빌드/패키지 증거 생성으로 progress. 이번 턴은 실제 idle HTTP 증거 확보로 progress. 전체 목표 PARTIAL 유지.

## 2026-10-04 터미널 연결 후 스트림 정지 복구

첫 SSE 이벤트 이후에도 연결 생존 확인을 유지합니다. 서버는 출력이 없을 때 15초마다 heartbeat 이벤트를 전송하며 로그/sequence는 변경하지 않습니다. 클라이언트는 job/heartbeat마다 35초 타이머를 갱신하고 응답이 멎으면 스트림을 닫고 기존 작업 조회 폴링으로 전환합니다. 셸 재실행/입력 재전송 없음. 첫 응답의 3초 제한은 유지하며 종료·화면 종료·연결 변경·폴링 전환 시 타이머를 정리합니다. 지연 heartbeat는 닫힌 연결을 다시 시작하지 않습니다.

관련 6 검사 PASS: idle heartbeat의 출력 중복/커서 변경 없음, 첫 연결 후 정지의 폴링 전환, heartbeat 타이머 갱신, 전환 이후 지연 heartbeat 무시, 기존 인증 폐기/취소/증분 출력 보존. 전체 회귀 517 PASS, production build PASS. 최신 추출 deb의 인증/PTY/SSE HTTP 검증 PASS. 실제 브라우저 네트워크 정지 재현은 미검증입니다.

deb SHA-256 `939cd8f96d27336e5bc5b753db0cea3eea97ab9214c5b46d924ae27e9ac4d4d7`. 증거 `.runtime/verification/package-2026-10-04T04-01-05.191Z.json`. 로컬 APT 저장소 `dist/apt-repository-kO4utD`, 서명/게시/호스트 설치 false. 로그 `/tmp/tastedev-terminal-idle-tests.log`, `/tmp/tastedev-terminal-idle-full.log`, `/tmp/tastedev-terminal-idle-build.log`, `/tmp/tastedev-terminal-idle-package.log`. DEV-01 환경 답변은 아직 없으며 GUI/운영 설치를 포함한 전체 목표는 PARTIAL입니다. 이전 턴은 실제 입력 큐 수정과 PTY 증거/최신 배포 산출물 갱신으로 progress입니다.

## 2026-10-04 터미널 대량 붙여넣기 최신 배포 검증

전체 회귀 516 PASS, production build PASS, 번역 검사 PASS. 일반 Unicode 입력 73,000 UTF-16 단위 / 169,000 UTF-8 바이트를 격리 raw PTY로 전송하여 원문 SHA-256 일치와 입력 echo 없음 PASS. 입력 대기 한도 262,144 단위, 순차 전송 및 실패 입력 폐기/명시적 복구를 유지합니다. backend 요청 한도와 NUL 차단은 그대로입니다. NUL 차단 해제 제안은 자동 승인 검토에서 실행 전 거부됐으며 해당 변경을 제외했습니다.

최신 deb 추출 서버의 인증·PTY 입력/resize·대량 출력·SSE·로그아웃 인증 폐기 검증 PASS. deb SHA-256 `e285792494500f2330161f383e847f453df8082b65f8da512b467cd987cbb433`. 증거 `.runtime/verification/terminal-pty-2026-10-04T03-40-18.249Z.json`, `.runtime/verification/package-2026-10-04T03-50-44.665Z.json`. 같은 deb의 로컬 APT 저장소 `dist/apt-repository-8eBkpW` 생성 완료. 서명/게시/호스트 설치 false.

로그 `/tmp/tastedev-terminal-paste-full.log`, `/tmp/tastedev-terminal-paste-build.log`, `/tmp/tastedev-terminal-paste-package.log`, `/tmp/tastedev-terminal-paste-apt.log`. 실제 브라우저 키보드/클립보드·전체 레이아웃, 실제 deb 설치와 운영 서비스 적용은 미검증입니다. QA-01의 sudo/운영 서비스 변경 금지를 유지하며 DEV-01 접속 주소와 프로젝트 경로를 요청했습니다. 아직 답변이 없어 추정하지 않습니다. 일반 셸은 실행 OS 계정을 사용하며 Claude CLI 로그인은 선택 프리셋의 별도 후속입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 대량 일반 텍스트 붙여넣기

대기 입력 한도를 기존 8,192 UTF-16 코드 단위에서 262,144 단위로 늘렸습니다. 요청은 기존 1,024 단위 묶음으로 순차 전송하며 backend 4,096바이트 요청 한도/8,192바이트 writable backlog 검사/권한 gate/NUL 차단은 변경하지 않았습니다. 한도 초과는 capacity 사유로 구분하고 나누어 붙여넣으라는 안내를 기존 9개 catalog에 추가했습니다. 실패 당시 입력은 기존대로 폐기하며 명시적인 연결 확인 후 새 입력만 재개합니다.

관련 회귀 11 PASS: 8천자를 넘는 Unicode 붙여넣기의 전체 내용/순서/요청 바이트 한도, 초과 입력 차단과 새 입력 재개, NUL 차단 유지. 실제 격리 raw PTY fixture에 일반 텍스트 73,000 UTF-16 단위/169,000 UTF-8 바이트를 전송하여 SHA-256 원문 일치와 입력 echo 없음 PASS. 증거 `.runtime/verification/terminal-pty-2026-10-04T03-40-18.249Z.json`. 실제 브라우저 클립보드 붙여넣기 검증은 아닙니다.

첫 제안에 포함된 NUL 차단 해제는 자동 승인 검토가 사용자 승인 없이 제어 바이트 범위를 확대한다는 이유로 거부했으며 실행 전 거부되어 소스 변경이 없었습니다. 소스를 확인한 후 해당 변경을 제외하고 큰 일반 텍스트 큐 개선만 수행했습니다. 우회나 NUL 전송 허용 변경 없음. 일반 셸 요구는 Linux 실행 계정 기준이며 외부 Claude CLI 로그인은 선택한 프리셋의 별도 인증 후속입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 SSE 최신 배포·인증 폐기 검증

전체 회귀 515 PASS, production build PASS. 최신 deb에서 실제 PTY 명령의 새 출력과 최종 종료 상태를 인증된 SSE HTTP로 읽었습니다. 출력 sequence 중복 없음, 입력 echo 없음, 미로그인 401/소실 작업 404를 확인했습니다. 실행 중인 별도 셸의 SSE를 연 채 로그아웃하여 terminal-error status 401과 stream 종료도 확인하고, fixture 재로그인으로 해당 셸을 중지한 뒤 다시 로그아웃했습니다. 인증 재확인은 1초 간격이며 이 검사는 로그아웃 직후 모든 바이트의 즉시 차단을 보장하는 검사가 아닙니다. 사용자 GUI 응답 속도 측정이나 실제 Claude 대화 검증은 아닙니다.

deb SHA-256 `723b6aeb9c50070236d824445969a2e42af084acf64a95861d403a801fb03ef3`. 증거 `.runtime/verification/package-2026-10-04T03-29-03.553Z.json`. 로컬 APT 저장소 `dist/apt-repository-Djg6VW`, 서명/게시/호스트 설치 false. 로그 `/tmp/tastedev-terminal-stream-full.log`, `/tmp/tastedev-terminal-stream-build.log`, `/tmp/tastedev-terminal-stream-package.log`, `/tmp/tastedev-terminal-stream-apt.log`.

Claude 사용자 로그인 완료 답변은 아직 없으며 추정하지 않습니다. GUI·운영 설치·AI 대화 등 원래 미완료 요구를 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 증분 출력 스트리밍

인증된 GET /api/terminal-events는 SSE로 새 sequence의 출력과 입력/종료 상태 변경만 전송합니다. 서버 확인 간격은 100ms, 기존 인증 재확인은 1초 간격이며 인증 폐기 시 terminal-error 이벤트 후 닫습니다. 캐시/변환 방지 및 X-Accel-Buffering=no 헤더를 설정했습니다. 브라우저는 탭별 스트림을 연결하고 500개 로컬 출력 레코드를 병합합니다. 같은 렌더 사이에 연속 도착한 이벤트도 함수형 상태 갱신으로 병합하여 앞 출력을 덮어쓰지 않습니다. 이전 연결/작업 응답은 무시하며 탭 종료·화면 종료 시 스트림/타이머를 정리합니다.

스트림 오류·지원 없음·첫 이벤트 3초 대기 초과 시 기존 700ms 폴링으로 전환합니다. 스트리밍 동안 중복 폴링은 하지 않습니다. 재접속 since/Last-Event-ID는 안전한 정수 커서로 대조하고 누락된 보관 기록의 gap 알림은 기존 방식으로 표시합니다.

관련 회귀 13 PASS: 새 로그만 송신, 최종 종료 상태/닫힘, Last-Event-ID 커서, 잘못된 커서 거부, 인증 재확인 폐기, abort/cancel 이후 읽기 중단, 증분 병합·연속 이벤트 보존, 이전 연결 무시, 오류/초기 응답 지연 폴링 전환. 전체 회귀 515 PASS (`/tmp/tastedev-terminal-stream-full.log`), production build PASS (`/tmp/tastedev-terminal-stream-build.log`). 실제 HTTP PTY 스트림 및 로그아웃 검사도 패키지 verifier에 추가했습니다. 실측 사용자 GUI 응답 속도/Claude 대화는 아직 검증하지 않았으며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 입력 복구 최신 배포 검증

전체 회귀 510 PASS 및 production build PASS. 입력 오류 영역/연결 확인 버튼과 명시적 큐 재개, 실패 입력 미재전송 및 기존 작업 GET 확인이 최신 deb에 반영됐습니다. 추출 deb 인증/PTY 입력·resize·대량 한글·이모지 출력·임시 사용자 Bash CLI 프리셋 HTTP 검증 PASS입니다. 브라우저에서 오류 유발/버튼 클릭을 수행한 증거는 아닙니다.

deb SHA-256 `77d1e4945e147cac4f716e04d4932f5c9b61dd081adfa6da16a315f4f2c081e3`. 증거 `.runtime/verification/package-2026-10-04T03-10-15.729Z.json`. 로컬 APT 저장소 `dist/apt-repository-6qwlGD`, 서명/게시/호스트 설치 false. 로그 `/tmp/tastedev-terminal-recovery-full.log`, `/tmp/tastedev-terminal-recovery-build.log`, `/tmp/tastedev-terminal-recovery-package.log`, `/tmp/tastedev-terminal-recovery-apt.log`.

현재 개발 계정 Claude auth는 직접 실행과 터미널 프리셋과 동일한 사용자 Bash 초기화 실행에서 모두 loggedIn=false/exit 1입니다. 프로필 확인 증거 `.runtime/verification/claude-profile-auth-status-2026-10-04T03-11-19.158Z.json`. 로그인 변경/AI 요청/토큰 기록 없음. 사용자 Claude 로그인 완료 답변을 요청했으며 답변을 추정하지 않습니다. 실제 GUI·운영 설치·AI 대화 등 원래 미완료 범위가 남아 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 입력 오류의 명시적 복구

전송 실패/입력 큐 초과 이후 입력이 영구 정지하던 화면에 연결 확인 컨트롤을 추가했습니다. 실패 당시 pending 입력은 버리고 유지하지 않습니다. 연결 확인은 기존 작업 GET만 수행하며 새 셸 실행/입력 전송을 하지 않습니다. 기존 셸이 running/PTY/stdinOpen이고 같은 연결·작업임을 확인한 경우에만 큐를 재개합니다. 종료·소실·교체·화면 종료 후의 지연 응답은 이전 큐를 재개하지 않습니다. 오류/복구 영역은 터미널 내부 flex 레이아웃에 포함하여 높이 100% host 아래로 가려지지 않도록 했습니다. 연결 확인 문구는 기존 9개 catalog에 번역했습니다.

관련 회귀 9 PASS 및 종료/교체 실패 사례 포함. 전체 회귀 510 PASS (`/tmp/tastedev-terminal-recovery-full.log`), production build PASS (`/tmp/tastedev-terminal-recovery-build.log`), 번역 검사 PASS. 새 입력만 전송되고 실패/queued 입력이 재전송되지 않음, 폐기된 큐 resume 거부, 기존 작업 조회만 수행, 종료된 셸·교체된 셸의 늦은 응답 차단을 검증했습니다. 실제 브라우저 오류 영역/복구 클릭은 미검증입니다.

현재 개발 OS 계정 whitecalvin의 실제 Claude 2.1.274 `auth status --json`은 loggedIn=false/exit 1입니다. 토큰·계정 상세는 출력/기록하지 않았습니다. 증거 `.runtime/verification/claude-auth-status-2026-10-04T03-07-50.423Z.json`, 실행 바이너리 SHA-256 `15e2d05148f801b5774032faad87e624ecd172e9903288bda448b892eb58fa07`. 로그인 변경/AI 요청 없음. 실제 AI 대화에는 사용자 Claude 로그인이 필요하며 배포 서비스 계정의 인증 여부를 증명하지 않습니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 대량 출력·소실 상태 최신 배포 검증

전체 회귀 508 PASS, production build PASS. 단일 출력 묶음의 8,000자 이후 누락을 수정한 서버와 성공한 전체 세션 조회의 소실 상태 처리가 최신 deb에 포함됐습니다. 추출 패키지의 인증 PTY HTTP에서 대량 한글·이모지 출력 전체 문자열을 대조하여 PASS했고 기존 입력·resize·실행 제한 시간·임시 Bash CLI 프리셋도 PASS했습니다. 실제 AI CLI 로그인/대화는 검사하지 않았습니다.

deb SHA-256: `919703d05fd6ff9587e6b8f62bd36a07ed3e2611fe47b655a823a33ba281c240`. 증거 `.runtime/verification/package-2026-10-04T02-59-49.208Z.json`. 로컬 APT 저장소 `dist/apt-repository-remZ99`도 같은 deb로 갱신했습니다. 서명/게시/호스트 설치 false.

로그: `/tmp/tastedev-terminal-output-full.log`, `/tmp/tastedev-terminal-output-build.log`, `/tmp/tastedev-terminal-output-package.log`, `/tmp/tastedev-terminal-output-apt.log`. 보관 한도 500개 출력 레코드 유지, 실제 GUI·운영 설치·AI 인증 등 기존 미완료 요구 유지, 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 대량 출력 누락 수정

workspace의 출력 기록은 한 stream data 이벤트의 앞 8,000자만 남기던 방식에서 전체 문자열을 여러 8,000자 이하 레코드로 나누는 방식으로 변경했습니다. 이모지의 UTF-16 surrogate pair는 레코드 경계에서 분리하지 않습니다. 기존 500개 레코드 보관 한도와 sequence/gap 알림은 유지하므로 보관 한도를 넘은 과거 출력까지 영구 보존하는 기능은 아닙니다.

관련 회귀 5 PASS: 실제 일반 셸의 대량 stdout/stderr가 원문과 일치하고 순서 번호·UTF-16 경계가 온전함을 검사했습니다. 격리 실제 PTY에서도 대량 한글·이모지 출력의 문자열 전체 일치 PASS: `.runtime/verification/terminal-pty-2026-10-04T02-57-20.323Z.json`. 이전 4개 탭 독립 입력/출력, Ctrl+C, 크기 변경, EOF, 제한 시간 검사도 PASS입니다. 전체 회귀 508 PASS (`/tmp/tastedev-terminal-output-full.log`), production build PASS (`/tmp/tastedev-terminal-output-build.log`). 패키지 verifier에도 인증된 HTTP를 통해 같은 대량 PTY 출력을 비교하는 검사를 추가했습니다.

실제 브라우저 렌더와 AI CLI 로그인·대화 검증은 여전히 미완료, 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 세션 소실 즉시 반영

성공한 전체 세션 조회에서 사라진 실행 중 셸은 더 이상 입력을 받지 않도록 failed/stdinOpen=false로 전환하고 기존 출력과 탭을 보존합니다. 자동 재실행하지 않으며 사용자가 시작 아이콘으로 새 셸을 열 수 있습니다. 조회 시작 당시의 작업 ID만 대조하므로 조회 중 새로 시작한 다른 셸은 소실 판정에서 제외합니다. 정상 응답의 sessions 배열/ID/상태/중복 ID를 검증하며 불완전 응답과 전송 실패는 셸 종료의 증거로 취급하지 않습니다. 설정 팝업의 세션 새로 조회에도 같은 규칙을 적용합니다.

관련 회귀 8 PASS (`/tmp/tastedev-terminal-missing-regression.log`): 소실 상태 및 출력 보존, 최신 작업 보존, 중복 소실 안내 없음, 컴포넌트 입력 차단·자동 재실행 없음, 불완전 응답은 기존 running 상태 보존. 번역 검사 PASS (`/tmp/tastedev-terminal-missing-language.log`). 소스 반영이며 최신 deb `7c4845729743c14a0d1fa9f4079ccbfd9d34765975c039ddd518b9661f604693` 이후 변경입니다. 실제 서버 재시작 GUI/E2E나 재시작을 넘는 셸 프로세스 재연결을 증명하지 않으며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 탭·연결 복구 최신 배포 검증

전체 회귀 506 PASS, production build PASS. 탭 활성화 시 컨테이너 크기 맞춤/입력 포커스, 숨겨진 화면 보존, 새 계정 조회 전 입력 제한, 이전 연결의 지연 응답 차단이 최신 deb에 반영됐습니다. 직접 격리 PTY 검증에서는 4개 동시 탭 입력/출력 독립과 개별 종료를 확인했습니다. 추출 deb는 `package:verify -- --terminal`로 인증된 PTY HTTP 입력·resize·종료·실행 제한 시간과 임시 사용자 Bash 프로필의 CLI 프리셋 실행을 확인했습니다. 실제 Claude AI 대화는 수행하지 않았습니다.

deb SHA-256: `7c4845729743c14a0d1fa9f4079ccbfd9d34765975c039ddd518b9661f604693`. 증거 `.runtime/verification/package-2026-10-04T02-51-44.462Z.json`. 기본 terminal gate OFF 검증도 별도로 PASS: `.runtime/verification/package-2026-10-04T02-50-57.248Z.json`. 로컬 APT 저장소 `dist/apt-repository-mTpA6C` 갱신, 서명/게시/호스트 설치 false.

로그: `/tmp/tastedev-terminal-connection-regression.log`, `/tmp/tastedev-terminal-connection-build.log`, `/tmp/tastedev-terminal-connection-pty-http.log`, `/tmp/tastedev-terminal-connection-apt.log`. 실제 GUI·운영 설치·AI 인증 등 원래 미완료 범위는 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 연결·계정 복구 수명 관리

새 연결의 terminal-context 조회가 성공하기 전에는 이전 계정 정보로 셸 실행/입력을 허용하지 않습니다. 연결 변경 시 계정/오류 상태를 초기화하고, 지연된 계정·poll 응답은 원래 연결과 현재 연결이 같을 때만 반영합니다. 자동 시작은 연결별로 한 번 수행하며 이미 복구된 실행 중 셸은 중복 실행하지 않습니다. 설정에서 계정을 새로 조회한 경우에도 현재 연결의 정보로만 입력을 허용합니다.

전체 회귀 506 PASS (`/tmp/tastedev-terminal-connection-regression.log`), production build PASS (`/tmp/tastedev-terminal-connection-build.log`). 컴포넌트 회귀 4 PASS: 이전 조회 응답 무시, 새 연결 조회 전 입력 비활성, 실행 중 세션 복구 후 입력 허용, 중복 셸 실행 없음, 연결 변경 직후 도착한 이전 poll 결과 무시. 실제 브라우저 GUI/운영 설치/AI CLI 로그인은 미검증이며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 우선 구현: 탭 활성화 시 크기·포커스 및 실제 PTY 검증

TerminalScreen은 숨겨진 탭을 0 크기로 fit하지 않고, 처음 연결되거나 다시 선택된 탭을 다음 animation frame에서 컨테이너 크기에 맞춥니다. 실행 중인 입력 가능 셸에만 포커스를 전달하고, 기록 화면에는 포커스를 강제로 옮기지 않습니다. 닫힘/숨김 이후 예약된 작업은 취소하거나 실행 직전에 다시 확인합니다. 기존 탭의 화면과 입력 큐는 유지합니다.

전체 회귀 505 PASS (`/tmp/tastedev-terminal-priority-regression.log`), 관련 회귀 13 PASS. 실제 격리 PTY 검증 PASS: 4개 동시 탭의 입력/출력 독립, 5번째 탭 제한, 한 탭 종료 후 다른 셸 유지, 한글·이모지 붙여넣기, Ctrl+C, EOF, 화면 크기 변경, 제한 시간. 증거 `.runtime/verification/terminal-pty-2026-10-04T02-45-18.046Z.json`. 임시 subprocess에서만 terminal gate를 열었으며 호스트 보안 설정·운영 서비스·계정을 변경하지 않았습니다. 실제 브라우저 GUI 및 실제 AI CLI 로그인/대화는 미검증, deb 갱신 전, 전체 목표 PARTIAL입니다.

앞선 nginx 상태 언어 전환 수정도 소스에 보존: ServerManager 알림을 원문 키로 저장하고 적용 후 목록 갱신 실패 알림은 키/상세 구조로 저장합니다. 관련 회귀 4 PASS. 이번 우선 작업은 터미널이며 nginx 추가 확장은 하지 않았습니다.

## 2026-10-04 로그인 오류의 언어 전환 갱신

로그인 상태 조회 실패와 빈 오류 응답의 기본 로그인 실패 문구는 번역된 문자열 대신 원문 키를 상태에 저장합니다. 표시할 때 현재 locale로 번역하므로 오류 이후 언어 전환 시 안내도 갱신됩니다. 서버가 반환한 오류 원문은 기존대로 저장합니다.

로그인 관련 테스트 4 PASS: 재요청 없이 영어↔pt-BR 전환 후 상태 오류/로그인 실패가 현재 언어로 표시됨을 추가 검사했습니다. 번역 검사에 setMessage 리터럴도 포함하고 임시 미번역 메시지가 FAIL인 게이트 회귀 1 PASS. 현재 번역 검사 PASS (`/tmp/tastedev-login-language-switch.log`). 소스 반영이며 deb 갱신 전, 실제 GUI 언어 전환 등 기존 미완료 범위를 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 포르투갈어 로그인·인증 안내 보완

pt-BR/pt-PT에 로그인 소개·최초 계정 생성·저장소 권한 안내 및 인증 실패·1분 대기·세션 만료 등 26개 문구를 추가했습니다. LoginScreen의 직접 번역 문자열은 모두 pt catalog에 있음을 코드 대조로 확인했습니다. catalog는 현재 87개 항목이며 상세 설정 등 전체 UI는 여전히 부분 번역입니다.

번역 검사 PASS (`/tmp/tastedev-portuguese-login-language.log`). 주요 7개 로그인 안내를 두 지역 locale의 실제 translate()로 14회 확인하여 한국어/영어 fallback이 아님을 검사했습니다. 실제 브라우저 로그인·언어 전환은 미검증입니다. 소스 반영이며 deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 포르투갈어·상태 오류 번역 최신 배포 검증

전체 회귀 503 PASS (`/tmp/tastedev-i18n-status-regression.log`), production build PASS (`/tmp/tastedev-i18n-status-build.log`), 추출 패키지 로그인 클라이언트의 포르투갈어 partial catalog 포함 및 인증·설정·PTY HTTP 검사 PASS. 첫 문구 검사에서 악센트 문자 빌드 이스케이프 때문에 false negative가 발생했으며, 실제 client chunk에서 catalog를 확인한 뒤 같은 catalog의 ASCII ‘Selecionar idioma’로 검사 기준을 수정했습니다. 동일 deb 재검증 PASS입니다. 실제 브라우저 언어 전환을 검증한 것은 아닙니다.

최신 deb SHA-256: `6c28bf4b8da2bd16a32e32ea16be5599911874658755233c7506381c1a303a07`. 증거: `.runtime/verification/package-2026-10-04T02-34-21.112Z.json`. 최신 deb와 로컬 APT 저장소에 pt-BR/pt-PT 공통 61개 번역, 영어 복구 안내 및 nginx 오류 번역을 반영했습니다. 호스트 설치·운영 서비스·서명·게시 없음.

로그: `/tmp/tastedev-i18n-status-verify.log`, `/tmp/tastedev-i18n-status-apt.log`. 전체 언어 UI·실제 GUI·운영 E2E·CLI/AI 인증 등 기존 미완료 요구를 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 상태·컴포넌트 오류 번역 검사 확장

nginx의 설정 파일 재선택, 이전 연결 응답, 활성 관리 server 선택 안내 3개를 영어 및 기존 8개 비영어 catalog에 추가했습니다. `i18n:check`는 직접 t() 문자열 외에 setNotice/setError 리터럴과 컴포넌트 Error() 문구도 검사합니다. 동적 API/lib 오류 전체를 증명하지 않으며 미분석 호출 수를 별도로 보고합니다.

현재 검사 PASS: 769개 리터럴 키, 상태 6개/컴포넌트 오류 14개 검사, 영어 누락 0 및 치환자 오류 0 (`/tmp/tastedev-dynamic-message-language.log`). 관련 언어/nginx 테스트 12 PASS. 임시 미번역 상태·오류가 FAIL이고 명시적 영어 번역 추가 후 PASS인 게이트 회귀 1 PASS. 소스 반영이며 deb 갱신 전, 전체 언어 UI·GUI/운영 E2E 등 기존 범위 미완료, 전체 목표 PARTIAL입니다.

## 2026-10-04 포르투갈어 공통 UI 시작·영어 복구 안내 보완

포르투갈어 catalog 58개 문구를 추가하고 pt-BR/pt-PT에 연결했습니다. 로그인·현황/도구 메뉴·패키지 설치·설정/코드 탭·트리 조작·터미널 설정·테마/언어 버튼·인증서/복구 안내를 포함합니다. 미번역 상세 설정은 기존 영어 fallback을 사용하며 언어 선택의 Partial UI 표시를 유지합니다. 포르투갈어 전체 UI 완료를 뜻하지 않습니다.

동적 복구 안내의 영어 기본 catalog에서 빠진 ‘복구 상태 확인’ 및 ‘원본 복구 완료’를 추가했습니다. i18n 관련 테스트 9 PASS, 번역 검사 PASS (`/tmp/tastedev-portuguese-language.log`). 실제 브라우저 전환은 미검증, 소스 반영이며 deb 갱신 전. 전체 목표 PARTIAL입니다.

## 2026-10-04 사용자 Bash CLI 프리셋 패키지 통합 검증

전체 회귀 501 PASS (`/tmp/tastedev-cli-profile-regression.log`), production build PASS (`/tmp/tastedev-cli-profile-build.log`). 임시 HOME/.bashrc의 PATH에서만 찾을 수 있는 테스트 Claude 명령을 인증된 packaged PTY HTTP로 실행하여 출력 marker와 exit 0을 확인했습니다. 실제 AI CLI/계정은 사용하지 않았습니다. CLI PATH 상태 조회·세션 폐기·로그인 보호 및 기존 설정/PTY 검사도 PASS입니다.

최신 deb SHA-256: `cbdb488fde5c284cda658087aecae2bd18c8f6fc5b6ab44b834a59c15b6e418d`. 증거: `.runtime/verification/package-2026-10-04T02-22-36.202Z.json`. 최신 deb와 로컬 APT 저장소에 Bash 프리셋 변경 및 안내 번역이 포함되었습니다. 호스트 설치·운영 서비스 변경·APT 서명·게시 없음.

현재 개발 계정 실제 CLI --version PTY 증거와 패키지 임시 CLI 프로필 검사는 서로 다른 범위입니다. 설치된 서비스 계정의 실제 CLI 인증·AI 대화·GUI/운영 E2E 및 전체 언어 UI 등 기존 요구는 미완료이며 전체 목표 PARTIAL입니다.

## 2026-10-04 CLI 프리셋의 사용자 Bash 초기화

PTY의 정확한 Codex/Claude 프리셋은 `/bin/bash -ic 'exec codex'` 또는 Claude로 실행하여 기본 Bash 터미널처럼 사용자 .bashrc 설정을 반영합니다. 임의 명령과 비-PTY 실행은 기존 동작을 유지합니다. exec로 셸을 교체하여 CLI 종료 결과를 전달합니다. 프로세스 PATH 조회는 사용자 .bashrc를 실행하지 않으므로 두 상태의 차이를 설정 팝업에서 8개 언어로 설명합니다.

관련 테스트 6 PASS. 임시 HOME의 .bashrc에만 존재하는 CLI를 실제 PTY로 찾는 fixture를 포함했습니다. 실제 사용자 NVM 초기화/서비스 계정/CLI 로그인은 별도 미검증이며 운영 환경을 바꾸지 않았습니다. 소스 반영, deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 설치된 Codex·Claude 실제 PTY 버전 확인

현재 개발 계정 whitecalvin의 PATH에서 발견한 Codex 0.159.2 및 Claude Code 2.1.274를 임시 workspace/PTY에서 --version만 실행했습니다. 두 작업 exit 0, PTY true. 인증·AI 요청·운영 서비스 변경 없음. 재현 명령: `npm run verify:terminal:cli`. 증거: `.runtime/verification/terminal-cli-2026-10-04T02-16-06.506Z.json`.

Codex SHA-256은 resolved codex.js launcher 파일의 hash이고 전체 npm 패키지나 내부 native 실행 파일의 hash가 아닙니다. Claude SHA-256은 resolved 실행 파일의 hash입니다. 소스 commit/배포 패키지 provenance는 추정하지 않습니다.

Codex는 NVM PATH에서 발견됐으며 deb 서비스의 기본 PATH에 자동 포함되지 않습니다. 따라서 이 결과는 현재 개발 계정의 PTY 버전 실행 증거만 제공하며 설치된 서비스 계정·CLI 로그인·AI 대화·실제 GUI E2E를 증명하지 않습니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 CLI 상태 인증 HTTP·최신 배포 검증

CLI 드롭다운은 존재/부재를 구분하며 미설치 안내를 번역합니다. 패키지 검증용 PATH의 실행 권한을 가진 비프로그램 Codex fixture를 실행하지 않고 경로만 반환함을 인증 HTTP로 확인했습니다. 미로그인 terminal-context는 401입니다. 전체 회귀 499 PASS (`/tmp/tastedev-cli-context-regression.log`), production build PASS (`/tmp/tastedev-cli-context-build.log`), 추출 패키지 인증·설정·PTY HTTP 검사 PASS. 새 실행 환경 연결 보호와 nginx 복구 안내 21개 번역도 포함했습니다.

최신 deb SHA-256: `231e432251a9d07405de221f4d12826ceabd39cab4067b4df1af3ed4b9c9d6f3`. 증거: `.runtime/verification/package-2026-10-04T02-14-15.401Z.json`. 로컬 APT 저장소 갱신 로그: `/tmp/tastedev-cli-context-apt.log`. 호스트 설치·운영 서비스 변경·서명·게시 없음.

실제 Codex/Claude 로그인·CLI 실행 성공, GUI·운영 적용·전체 언어 UI 등 기존 미완료 요구는 남아 있습니다. CLI 경로 존재는 인증/실행 성공 증거가 아니며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 CLI PATH 상태 표시

terminal-context API가 현재 서버 실행 계정의 PATH와 터미널 작업 폴더를 기준으로 Codex/Claude 실행 파일의 존재·일반 파일 여부·실행 권한을 검사합니다. CLI를 실행하거나 자격 증명을 읽지 않습니다. 설정 드롭다운은 실행 파일이 없으면 해당 CLI에 번역된 ‘PATH에서 찾을 수 없음’을 표시합니다. 발견 상태는 설치/로그인/실행 성공을 증명하지 않으며 실행 선택 자체를 막지 않습니다.

PATH 우선순위, 실행 권한 없음, 디렉터리 제외, symlink, 현재 폴더/누락 경로를 임시 fixture로 검사했고 터미널 UI와 함께 2 PASS. 번역 검사 PASS (`/tmp/tastedev-terminal-cli-language.log`). 소스 반영이며 deb 갱신 전. 실제 CLI 인증·실행 E2E와 기존 전체 요구는 미완료, 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 적용·복구 결과 번역

복구 상태 확인, 원본 복구 완료, 설정 적용 성공 후 목록 갱신 실패의 3개 문구를 일본어·중국어·독일어·프랑스어·스페인어·러시아어·아랍어로 보완했습니다. 다른 적용 완료/재조회/백업 안내는 이미 번역되어 있음을 확인했습니다.

번역 검사 PASS (`/tmp/tastedev-nginx-recovery-language.log`), 실제 translate() 출력 21개가 한국어 원문/영어 fallback과 다름을 확인했습니다. 소스 반영이며 deb 갱신 전, 전체 언어 UI는 아직 미완료이고 전체 목표 PARTIAL입니다.

## 2026-10-04 설정 실행 환경 조회 연결 보호

공유 `NginxContextPanel`은 API 연결 변경 시 이전 실행 상태·PID·설정 경로와 오류를 초기화합니다. 조회 잠금은 현재 요청 세대에만 적용하며 이전 연결 요청이 대기 중이어도 새 연결을 조회할 수 있습니다. 이전 응답과 finally는 새 데이터/로딩 상태를 변경하지 않습니다.

관련 테스트 5 PASS. 이전 PID가 새 연결에 표시되지 않고 현재 연결 응답만 표시되는 사례를 추가했습니다. 호스트 서비스 변경 없음. 소스 반영이며 deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 요청 수명·다국어 최신 배포 검증

전체 격리 회귀 497 PASS와 production build PASS인 소스로 최신 deb를 생성했습니다. 추출 패키지 인증·설정·PTY HTTP 검사 PASS. 자동 터미널 탭 다국어 이름, Certbot 35개 안내 번역 및 nginx 헤더/백업/적용 검토의 연결 변경·늦은 응답·잠금 보호가 배포 파일에 반영됐습니다. 로컬 APT 인덱스/Release를 최신 deb로 갱신했습니다.

SHA-256: `0fb14d029a7348ba521c0bb9cdddc197cb9df58a442a27468210cc3b8ad9f402`. 증거: `.runtime/verification/package-2026-10-04T02-06-08.479Z.json`. 로그: `/tmp/tastedev-nginx-lifetime-deb.log`, `/tmp/tastedev-nginx-lifetime-verify.log`, `/tmp/tastedev-nginx-lifetime-apt.log`.

호스트 설치·운영 서비스 변경·서명·게시를 수행하지 않았습니다. 실제 GUI·운영 적용·전체 언어/CLI/AI E2E 등 기존 미완료 요구를 유지하며 전체 목표는 PARTIAL입니다.

## 2026-10-04 nginx 연결 수명·다국어 통합 검증

전체 격리 회귀 497 PASS (`/tmp/tastedev-nginx-lifetime-regression.log`), production build PASS (`/tmp/tastedev-nginx-lifetime-build.log`). 새 연결 수명 테스트는 scripts/run-tests.mjs의 \*.test.mjs 자동 수집을 통해 정식 회귀에 포함됩니다. nginx 검토·헤더·백업 연결 교체, 해시 계산 중 무효화, 자동 터미널 탭 다국어 이름, Certbot 35개 안내 번역 변경이 현재 production build에 반영됐습니다.

기존 deb SHA-256 `1db463b9e4703098cbd188eed784ffd6ee35bfa9db81f7c0693e4da55a5dbb36`은 이 후속 변경 이전 버전입니다. 최신 deb/저장소 갱신 및 기존 실제 GUI·운영 적용·전체 언어/CLI/AI E2E 요구는 남아 있습니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 검토 잠금·백업 호출 수명 보호

적용 검토의 요청 잠금을 세대별로 분리하여 이전 연결 검토가 대기 중이어도 새 연결을 검토할 수 있습니다. 이전 finally는 새 검토의 busy 상태를 해제하지 않습니다. 백업 파일 SHA-256 계산 뒤에도 요청 세대를 확인하여 그 사이 무효화된 백업은 API를 호출하지 않습니다.

기존 관련 테스트 11 PASS 및 해시 계산 중 연결 교체 사례를 포함한 연결 수명 테스트 3 PASS. 호스트 nginx 서비스·설정·백업은 변경하지 않았습니다. 소스 반영이며 deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 헤더·백업 연결 수명 보호

nginx 헤더는 API 연결 변경 시 상태·선택 파일·백업 목록·복원 검토·확인과 팝업을 초기화합니다. 헤더 작업 및 백업 목록의 잠금은 현재 요청 세대에만 적용하여 이전 연결이 대기 중이어도 새 연결 조회를 허용합니다. 이전 응답과 finally는 새 연결 출력·목록·busy 상태를 덮어쓰지 않습니다. 펼쳐진 백업 목록은 새 API 연결에서 자동 조회합니다.

관련 테스트 8 PASS. 새 연결의 검수와 백업 조회를 이전 요청 완료 전에 시작하고 오래된 응답/잠금 해제가 무시되는 사례를 추가했습니다. 실제 운영 서비스·백업 파일을 변경하지 않았습니다. 소스 반영이며 deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 적용 검토 연결 보호

`NginxApplyPanel`은 API 연결 변경 시 기존 검토 context 및 적용 확인을 초기화합니다. 늦게 도착한 이전 연결의 검토 응답은 현재 context에 반영하지 않습니다. 초안 값 자체는 변경하지 않습니다.

`node --test tests/nginx-apply-panel.test.mjs`: 3 PASS. 새 연결의 PID/context를 사용하고 이전 연결의 승인을 버리는 사례를 추가했습니다. 실제 nginx 운영 적용은 수행하지 않았습니다. 소스 반영이며 deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 자동 터미널 탭 이름 다국어화

자동 생성/복구된 `Terminal 1`~`Terminal 4` 탭은 기존 터미널 번역을 사용하여 현재 선택 언어로 표시합니다. 저장된 탭 identity와 작업은 바꾸지 않으며 명령 출력 탭의 명령 이름은 보존합니다. 언어 변경 시 렌더에서 즉시 반영됩니다.

탭 UI 및 세션 상태 관련 테스트 6 PASS. 실제 브라우저 확인은 미수행입니다. 소스 반영이며 deb 갱신 전, 전체 목표 PARTIAL입니다.

## 2026-10-04 Certbot 안내 번역 보완

인증서 작업 완료/실패, 전체 인증서 선택, 선택 대상 갱신 테스트 및 hook 영향 확인의 5개 문구를 일본어·중국어·독일어·프랑스어·스페인어·러시아어·아랍어에 추가했습니다. 기존 터미널 직접 문구와 크기/시간/명령 검증 문구는 이미 번역되어 있음을 확인했습니다.

`npm run i18n:check` PASS (`/tmp/tastedev-certbot-language-check.log`). 실제 translate() 결과 35개가 한국어 원문이나 영어 fallback이 아님을 확인했습니다. 소스 변경이며 최신 deb에는 아직 포함되지 않았습니다. 전체 언어 UI 번역 및 실제 GUI 검증은 미완료, 전체 목표 PARTIAL입니다.

## 2026-10-04 연결 변경 보호 배포 갱신 — 전체 PARTIAL

nginx API 연결 변경 시 이전 응답 무효화·새 트리 조회, Certbot/PostgreSQL 조회 중복 및 연결 변경 보호, 패키지 설치 안내 21개 번역이 최신 빌드와 deb에 반영됐습니다. 전체 회귀 493 PASS, production build PASS, 추출 패키지 인증·설정·실제 PTY HTTP 검사 PASS. 로컬 APT 저장소도 갱신했습니다. 호스트 설치·게시·서명은 수행하지 않았습니다.

deb SHA-256: `1db463b9e4703098cbd188eed784ffd6ee35bfa9db81f7c0693e4da55a5dbb36`.
증거: `.runtime/verification/package-2026-10-04T01-54-37.240Z.json`. 실행 로그: `/tmp/tastedev-connection-regression.log`, `/tmp/tastedev-connection-build.log`, `/tmp/tastedev-connection-verify.log`, `/tmp/tastedev-connection-apt.log`.

실제 브라우저 GUI, 운영 적용, CLI/AI 실 연결, 전체 언어 UI 번역 등 기존 미완료 요구는 남아 있습니다. 이 검증은 전체 완료를 증명하지 않습니다.

## 2026-10-04 nginx 연결 변경 조회 보호

- `ServerManager`는 API 연결이 바뀌면 진행 중인 이전 연결 요청을 무효화하고 nginx 파일 트리와 서버 목록을 새 연결에서 다시 조회합니다. 편집 초안은 유지합니다.
- `node --test tests/server-manager-component.test.mjs`: 1 PASS. 지연된 이전 응답을 버리고 새 연결의 파일 목록을 표시하는 사례를 추가했습니다. 컴포넌트 테스트이며 실제 GUI 검증은 아닙니다.
- 설정/코드 보기 탭의 1px 세로 구분선은 현재 CSS에서 확인했습니다.
- 이번 수정은 소스에 반영했으며 기존 deb에는 아직 포함하지 않았습니다. 전체 목표는 PARTIAL입니다.

## 2026-10-04 패키지 설치 준비 안내 번역

설치 허용 범위, 시스템 Node helper 필요 조건, nginx 실행 파일 부재 안내 3개 문구의 ja/zh/de/fr/es/ru/ar 누락 번역 21개를 추가했습니다. i18n 검사 PASS. 번역 실행 함수에서 영어 fallback 제외와 `/usr/bin/node` 경로 보존을 확인했습니다. 전체 언어 번역은 여전히 미완료이며 직전 deb 이후 변경입니다. 전체 PARTIAL 유지.

## 2026-10-04 PostgreSQL 원문 조회의 연결 문맥 보호

패키지 IDE에서 노드 선택으로 요청한 config-source 결과와 오류를 선택 순서/수명뿐 아니라 API 연결 문맥에 결합했습니다. 요청 도중 연결이 바뀌면 기존 원문을 코드 기록에 넣지 않습니다. 기존 선택/탭/팝업 회귀 2개 PASS; mock HTTP 응답을 지연시킨 뒤 API 연결 변경 후 port=5999 이전 원문이 편집 기록에 들어오지 않는 사례 포함. 실제 GUI/E2E 또는 운영 설정 변경은 수행하지 않았습니다. 소스는 최신 deb 이후 변경이며 전체 PARTIAL 유지.

## 2026-10-04 Certbot/PostgreSQL IDE 파일 조회 수명 보완

공통 패키지 IDE의 파일 목록/서비스 조회에 연결 문맥별 동기 잠금을 추가했습니다. 동일 연결의 중복 새로고침은 하나의 파일·서비스 요청 쌍만 실행하고, API 연결이 바뀌면 새 조회를 허용하되 이전 응답/오류/완료가 현재 화면을 덮어쓰지 않습니다. 초기 노드 선택 안내/설정·코드 전환과 팝업 검증 2개 PASS; 동일 fixture에 실제 중복 요청과 새 연결/옛 응답 폐기 사례 포함. 실제 브라우저 GUI와 root 운영 변경 검증은 아니며 이번 소스 변경은 직전 deb 이후입니다. 전체 PARTIAL 유지.

## 2026-10-04 최신 보안·nginx·번역 배포 검증

전체 격리 회귀 493 PASS, production build PASS. 최신 nginx root/alias GUI 항목과 보안 PTY 설명·서버 gate 활성화 안내, 로그인/권한 70개 번역이 deb에 반영됐습니다. 추출 패키지 인증·설정·PTY HTTP 검증 PASS. SHA-256: `21e6ed059724c65af330c88793cdede56b99a30758ddbf9ebadb9bed54780ad0`. 증거: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-04T01-41-59.984Z.json`. 기존 개발 서버 8787의 로그인 HTTP 200과 미로그인 주요 경로 307을 확인했습니다. 실제 브라우저 화면/로그인 흐름 검증은 아닙니다. 호스트 설치·운영 서비스 변경·전체 Linux 언어 번역·실제 CLI/AI 연결 등 원래 미완료 범위는 남아 있으며 전체 목표 PARTIAL입니다.

## 2026-10-04 보안 기능의 서버 허용 안내

서버 gate가 꺼져 있는 기능은 접힌 안내에서 정확한 환경 변수와 `=true` 값을 선택/복사할 수 있게 표시합니다. 서버 실행 환경 적용과 앱 재시작 이후 웹 스위치를 켜는 순서를 설명합니다. 환경 변수를 UI에서 자동 수정하거나 운영 서비스를 재시작하지 않습니다. 보안 화면 컴파일·기존 설정 회귀 및 i18n literal 검사 PASS. 안내 문구 8개 언어 번역 포함. 직전 deb에는 이번 변경이 포함되지 않았으며 전체 PARTIAL 유지.

## 2026-10-04 로그인·보안 공통 문구 번역 보완

웹 터미널 권한, 보안 설정 로딩/서버 차단/옵션 활성화, 계정 미설정/인증 실패/로그인 요청 제한/계정 변경/로그인 필수 및 패키지 기본값 문구 10개에 대해 ja/zh/de/fr/es/ru/ar 카탈로그에 70개 누락 번역을 추가했습니다. i18n literal 검사 PASS 및 실행 번역 함수에서 해당 70개가 영어 fallback 대신 각 언어로 반환되는지 PASS. 전체 Linux 언어 UI 번역 완료는 아니며 다른 미번역 문구는 남아 있습니다. 직전 deb는 변경 이전 산출물입니다. 전체 PARTIAL 유지.

## 2026-10-04 터미널 보안 안내 정정

보안 화면과 README의 오래된 비대화형 설명을 현재 대화형 PTY 동작에 맞게 정정했습니다. 해당 설명에 8개 언어 번역을 추가했고 배포 앱의 서버 허용 설정과 웹 보안 옵션 활성화 절차를 security-options 문서에 안내했습니다. i18n literal 검사 및 보안 화면 컴파일/요청 회귀 PASS. 전체 언어 번역 완료를 의미하지 않으며 운영 서비스 설정은 변경하지 않았습니다. 직전 deb보다 뒤의 소스 변경입니다. 전체 PARTIAL 유지.

## 2026-10-04 nginx 경로 항목 native 검증

`npm run verify:nginx:native -- --path-settings`로 이번 변경만 별도 검증했습니다. nginx version: nginx/1.28.3 (Ubuntu)의 실제 `-t` 검사에서 HTTP root와 location alias 후보가 통과했고 HTTP 문맥 alias는 거부됐습니다. 기존 listen 유지도 확인했습니다. nginx 바이너리 SHA-256: `94eb839f1cdc7f3f42062d352b504fe406e2f888d83b554af7ea25bcdc9506f5`. 증거: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/nginx-native-2026-10-04T01-33-03.178Z.json`. 임시 설정만 생성했으며 서비스 시작/재로드와 운영 설정 변경은 모두 false입니다. native 구문 검사이며 브라우저 조작/실제 파일 제공/E2E 완료를 뜻하지 않습니다. 전체 PARTIAL 유지.

## 2026-10-04 nginx 파일 경로 설정 문맥 보완

공식 ngx_http_core_module 문서를 확인해 HTTP 블록의 root 추가 항목과 location 블록의 alias 추가 항목을 보완했습니다. main/events/다른 문맥에는 노출하지 않습니다. 기존 root 중복 없이 제공하고 새 root 코드 추가 시 기존 server 블록 순서를 유지하는 검사 및 설정 편집 회귀 9개 PASS. 개발 소스 적용이며 직전 deb는 이 변경보다 앞선 빌드입니다. 실제 운영 적용/GUI 검증과 전체 외부 모듈 설정 카탈로그 완성은 미검증입니다. 전체 PARTIAL 유지.

## 2026-10-04 공통 레이아웃 및 패키지 디자인 배포 반영

공통 ConsolePage/ConsoleBody로 관리 페이지의 높이·본문 스크롤·사이드바 유무를 통일했습니다. 패키지 페이지도 동일한 관리 레이아웃을 사용합니다. 패키지 카드의 32px 아이콘과 이름/상태, 설명, 메타데이터, 설치 선택 영역을 간결하게 구성했고 빈 작업 로그는 숨겼습니다. nginx 설정/코드 보기 탭 구분선과 고정 어두운 터미널, 종료 출력 탭 복원 및 최신 기록 조회도 포함합니다.

터미널 변경까지 전체 회귀 492 PASS. 이후 공통 레이아웃/카드 변경의 관련 검사 3 PASS. 최신 production build 및 추출 패키지 인증/PTy HTTP 검증 PASS. deb SHA-256: `9f2a9a45924f77327132ac7f3f840add2d512a9517b3338ebca1507d01dd6636`. 증거: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-04T01-29-44.572Z.json`. 실제 GUI/E2E와 호스트 설치·운영 적용은 검증하지 않았으며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 기록 최신 조회

설정 버튼을 누를 때 인증된 terminal-context를 다시 조회해 방금 종료한 명령을 출력 목록에 표시합니다. 늦은 이전 조회 응답과 오류가 최신 목록을 덮어쓰지 않도록 요청 순서를 확인합니다. 격리 컴포넌트에서 설정 클릭의 실제 조회, 출력 선택 시 재실행 없음, 역순 응답 보호를 검증했습니다. 관련 검사 7개 PASS. 기존 deb는 이 UI 변경보다 앞선 빌드이며 실제 브라우저와 운영 서비스 검증은 미완료입니다. 전체 상태 PARTIAL.

## 2026-10-04 종료된 터미널 출력 다시 열기

터미널 설정의 명령 출력 목록에서 서버가 보유한 최근 종료 기록을 선택해 별도 출력 탭으로 다시 엽니다. 명령을 재실행하지 않으며 기존 탭을 중복 생성하지 않습니다. 최대 4개 탭 제한을 유지하고 실행 중인 셸 입력에 영향을 주지 않습니다. 세션 상태 및 컴포넌트 검사 7개 PASS. 기록은 현재 서버 프로세스가 보유한 메모리 범위이며 서버 재시작 후 영속 복원은 제공하지 않습니다. 이번 UI 변경은 개발 서버 소스에 적용됐으며 직전 deb에는 아직 포함되지 않았습니다. 전체 상태는 PARTIAL입니다.

## 2026-10-04 최신 터미널 배포 산출물 검증

Next.js production build PASS. 최신 터미널 탭 여백 제거와 설치 계정 HOME/PATH 변경을 포함한 deb를 생성했습니다. SHA-256: `fda52ae58689868a1f5992f2dc69dcf0245187043dfc054e8aa4b704d61f5fff`. 패키지 추출 서버 검증 및 격리 인증 PTY HTTP 검증 PASS. 증거: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-04T01-18-06.969Z.json`. 로컬 APT 인덱스: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/dist/apt-repository-Zks7qR`. 서명·외부 게시·실제 설치는 수행하지 않았습니다. 브라우저 GUI 및 설치 대상 시스템의 실제 사용자/서비스 동작 검증은 남아 있으며 전체 상태는 PARTIAL입니다.

## 2026-10-04 터미널 여백 및 설치 사용자 환경 보완

빈 메시지 영역이 터미널 탭 위에 차지하던 공간을 제거했습니다. 설치 계정 systemd drop-in은 HOME과 사용자 `.local/bin`, `bin`을 포함하는 PATH를 명시합니다. 공백 포함 홈 경로도 전체 환경 할당을 인용합니다. 계정 모델 및 격리 설치 fixture 4개 검증 PASS. 호스트 서비스는 변경하지 않았습니다. 실제 GUI 확인과 사용자 CLI 인증은 미검증이며 기존 deb에는 이번 소스 변경이 아직 포함되지 않았습니다. 전체 완료 상태는 PARTIAL입니다.

배포 검증 갱신: 최신 deb SHA-256 `f29f9e2a84aca40df75015e8edcd66de4da27dae2350c95bfaeb8a011914fd2e`, `npm run package:verify -- --terminal` PASS, installed=false. 계정 도구와 shared 계정 모델의 소스 일치/포함을 검사했고 실제 PTY HTTP는 추출 테스트 계정/작업 폴더에서 확인했다. 증거 `.runtime/verification/package-2026-10-04T01-09-55.367Z.json`. 실제 postinst/systemd 사용자 전환은 실행하지 않았으며 계정 전환 증거는 mock fixture이다. 최신 APT repository에는 아직 이 deb를 반영하지 않았다.

## 2026-10-04 — 설치 사용자 실행 및 터미널 화면 정리

postinst는 SUDO_USER 일반 Linux 계정을 선택하고 root 소유 사용자 기록/systemd drop-in을 생성한다. 업그레이드는 저장된 계정을 유지한다. root 설치에서 사용자 정보가 없으면 설치는 완료하되 서비스를 임의 사용자로 시작하지 않고 `sudo tastedev-linux service setup USERNAME`을 안내한다. 앱 관리자 계정 setup CLI도 저장된 Linux 실행 계정으로 runuser를 사용한다. Linux 비밀번호는 받지 않는다. 기존에 구성된 실행 계정의 자동 변경은 거부한다. 상태 데이터는 보존하며 특수 파일/symlink/hardlink를 거부하고 descriptor identity를 확인해 소유권을 지정한다. 실제 호스트 계정/systemd 변경은 수행하지 않았다.

터미널의 반 너비 문제는 flex item의 전체 너비/확장 규칙을 추가해 수정했다. 상단 탭 위 inset과 하단 불필요한 상태줄을 제거하고 start/stop/new/settings를 투명 아이콘으로 통일했다. 중복 read-only 안내를 제거했다. 실행 중 화면은 탭별로 유지하며 숨겨진 화면에 새 키 입력을 보내지 않되 이미 수락한 입력 큐는 유지한다. 설정 팝업에서 실행 사용자/초기 작업 폴더/기본 셸을 표시한다.

관련 계정/터미널 컴포넌트 fixture 6개 PASS. 운영 sudo/systemd 서비스 변경은 모두 mock으로 검증했다. 실제 설치/사용자 전환/E2E 및 브라우저 렌더 검증은 포함하지 않았으며 전체 목표는 PARTIAL이다.

## 2026-10-04 — 터미널 다국어 보완

23개 터미널 라벨 및 PTY/입력/세션/크기/권한/동시 실행 오류 안내를 en/ja/zh/de/fr/es/ru/ar 8개 카탈로그에 명시적으로 번역했다. 실행 제한 숫자와 LINUX_ENABLE_TERMINAL=true 표기는 보존한다. 터미널의 실패 안내가 번역 함수를 사용하며 상태는 running/success/failed 원문 대신 실행 중/완료/실패 번역을 표시한다. 사라진 입력 폼을 안내하는 전송 오류 문구는 연결 확인 안내로 바꿨다.

관련 번역/i18n/터미널 컴포넌트 테스트 17개 PASS, literal 번역 검사 PASS, production build PASS. 전체 Linux 언어 UI 완전 번역을 의미하지 않는다. 이전 전체 회귀 485개 증거는 이전 코드 기준이며 이번 변경은 관련 검사로 검증했다. 이번 번역 변경은 아직 deb/APT에 반영되지 않았다. 실제 브라우저 언어 전환과 RTL 렌더는 미검증이며 전체 목표 상태 PARTIAL이다.

최신 배포 증거(2026-10-04): 전체 회귀 485개 PASS, production build PASS, `npm run package:verify -- --terminal` PASS. deb SHA-256 `08ad773af5c2eb8bc6359db7c42e6914c65723721ac1209ec87b741339cbb3d9`. 인증/격리 PTY HTTP 검증 포함, 호스트 설치 false. 패키지 증거 `.runtime/verification/package-2026-10-04T00-46-37.799Z.json`. 로컬 APT `dist/apt-repository-nL5zJI` 최신 deb/index/Release 체크섬 대조 PASS, 증거 `.runtime/verification/terminal-snapshot-apt-2026-10-04.json`; signed/published/installed는 false. 현재 프로젝트 서버 미리보기는 최신 빌드에 맞춰 재시작했으며 호스트 서비스/권한 설정은 변경하지 않았다.

## 2026-10-04 — 터미널 작업 ID와 스냅샷 순서

새 세션을 같은 탭에서 시작한 후 이전 세션의 조회/404/중지 결과가 도착해도 작업 ID가 다르면 적용하지 않는다. 같은 ID도 출력 logSequence가 감소하는 응답이나 종료 후 running으로 되돌아가는 응답은 무시한다. 최초 연결의 세션 복구에도 같은 순서 규칙을 적용한다. 새 작업 ID의 시작은 정상 허용한다.

실행 입력은 기존 작업 ID를 유지하고 스냅샷 적용만 제한한다. 별도 실제 프로세스/운영 권한 변경은 없다. 관련 컴포넌트/상태 테스트 5개 PASS. 전체 목표는 PARTIAL이며 실제 브라우저 상호작용·Claude CLI 설치/인증·운영 배포 검증은 별도 미완료이다.

## 2026-10-04 — 소실된 터미널 세션 처리

공통 API 함수가 실패 응답의 HTTP status를 Error에 보존한다. terminal 조회/중지에서 404가 확인된 경우에만 로컬 세션을 종료 상태로 전환하고 기존 출력을 보존한다. 입력을 비활성화하며 다시 시작 버튼을 사용할 수 있다. 소실된 실행 세션의 탭 닫기도 로컬 목록에서 완료한다. 401/403/409/500과 전송 오류는 실행 종료의 증거로 간주하지 않는다.

이 변경은 서버 프로세스 재시작 후 기존 탭이 계속 실행 중 표시로 남는 문제를 해결한다. 실제 종료된 프로세스를 복원하는 기능은 아니다. 단위/React 테스트는 소실 응답 및 탭 닫기, 기존 출력/sequence 보존과 일시 오류 구분을 검증했다. 실제 브라우저 및 호스트 서버 재시작을 통한 E2E는 이번 검증 범위에 포함하지 않았다. 전체 목표는 PARTIAL이며 최신 deb는 이번 팝업/세션 만료 변경을 아직 포함하지 않는다.

## 2026-10-04 — 패키지 IDE 팝업 요청 수명

Certbot/PostgreSQL의 로그·백업·복원 팝업을 닫거나 다른 작업으로 전환하면 이전 요청의 데이터/오류/로딩 완료를 무시한다. 패키지·연결·API 컨텍스트 변경 및 언마운트도 이전 응답을 무효화한다. 오래된 native dialog close 이벤트는 새 팝업을 닫지 않는다. 백업 조회 중에는 빈 목록 안내를 표시하지 않는다.

서비스 시작/종료 확인에 즉시 요청 잠금을 추가했다. 중복 클릭은 하나의 서비스 요청만 생성하며 패키지 변경/언마운트 후 이전 성공·실패가 새 화면을 갱신하지 않는다. 실제 서비스 변경은 테스트에서 수행하지 않았고 mock 응답으로 요청 수명만 검증했다.

전체 회귀 483개 PASS. 마지막 언마운트 컨텍스트 수정 후 관련 GUI 컴포넌트 테스트 2개 PASS. 실제 브라우저 GUI/E2E는 검증하지 않았다. 이전 deb SHA c9c24a55341dc3475f648d097aba0019ece1d4d95c3198e36baaaf7f2a67cf35는 이번 팝업 변경을 포함하지 않는다. 전체 완료 상태는 PARTIAL이다.

배포 검증: 최신 `tastedev-linux_0.1.0_amd64.deb` SHA-256 `c9c24a55341dc3475f648d097aba0019ece1d4d95c3198e36baaaf7f2a67cf35`. `npm run package:verify -- --terminal` PASS. 추출된 패키지의 임시 계정/작업 폴더에서 실제 PTY launch/input/resize/deadline 및 terminal-context 인증 보호를 검증했다. 설치 여부 false. 증거 `.runtime/verification/package-2026-10-04T00-33-46.547Z.json`. GUI/E2E 및 전체 제품 완료를 의미하지 않는다.

## 2026-10-04 — 터미널 재접속 및 배포 반영

터미널의 인증된 컨텍스트 조회가 메모리에 살아 있는 세션 스냅샷을 반환하고, 화면 재접속 시 기존 작업 ID를 탭에 다시 연결한다. 비어 있는 기본 탭을 먼저 재사용하며 중복 탭과 중복 셸 자동 시작을 방지한다. 서버 프로세스 자체가 재시작되면 셸을 복원하는 기능은 아니다. 기존 패키지 출력 탭은 DraftProvider 내 페이지 이동 동안 유지된다.

터미널 설정에서 AI 오류 분석 팝업을 열 수 있다. 선택한 출력의 최대 마지막 12,000자를 클릭 시점에 복사하고 기존 마스킹/검토/전송 동의 절차를 사용한다. 실시간 로그 갱신은 팝업의 검토 중인 텍스트를 덮어쓰지 않는다. 실제 외부 AI 응답 성공은 이번 검증에 포함하지 않았다.

전체 회귀 테스트 482개 통과(세션 복구 추가 후). AI 진입점 추가 후 관련 컴포넌트/복구 테스트 3개 및 최종 프로덕션 빌드/번역 검사 통과. 8791 프로덕션 미리보기를 최신 빌드로 교체했고 8787 개발 미리보기는 유지했다. 설치·운영 권한 플래그와 sudo/호스트 서비스는 변경하지 않았다.

## 2026-10-04 — 탭 터미널

`/terminal`에 전체 높이 PTY 화면과 상단 탭/새 탭/설정 아이콘을 추가했다. Bash 기본 셸과 Codex CLI·Claude CLI 실행 프리셋, 실행 제한 시간, 세션 중지, 로그 다운로드를 설정 팝업에서 제공한다. 패키지 실행 결과는 읽기 전용 출력 탭으로 표시한다. 웹 로그인 계정과 별개로 실제 프로세스는 앱 서버의 일반 OS 계정 권한을 사용하며 계정 전환이나 sudo 상승은 제공하지 않는다.

서버는 명시적인 tab 모드에 한해 최대 4개 실행 중 세션을 허용하며 시작 중 요청도 슬롯에 포함한다. 기존 single 모드의 단일 실행 제한은 유지한다. 탭별 입력·크기 변경·종료는 해당 작업 ID를 사용하고, 실행 중 작업을 기록 제한으로 삭제하지 않는다. 인증된 terminal-context 조회를 추가했다(비로그인 HTTP 401).

Next.js 프로덕션 빌드 통과. 임시 작업 폴더에서 동시 슬롯 제한, 독립 입력/출력, 기본 OS 계정 및 컴포넌트 탭 선택/종료/CLI 프리셋을 검사했다. 8787 개발 서버와 8791 프로덕션 미리보기의 보호된 terminal 라우트는 비로그인 HTTP 307을 반환한다. 실제 브라우저 렌더·상호작용 검증과 Claude CLI 설치/로그인은 확인하지 않았다. 미리보기의 LINUX_ENABLE_TERMINAL=false는 유지하며 호스트 권한/서비스는 변경하지 않았다. Claude 앱과의 완전한 기능 동등성 또는 AI 연결 성공을 의미하지 않는다.

## 보안 새로고침·미저장 변경 보존 (2026-10-04)

- 공통 헤더의 새로고침으로 전달된 보안 스냅샷을 화면이 수신한다. 편집하지 않은 스위치는 최신 값으로 갱신하고 미저장 변경은 보존한다.
- 초안의 기준 버전을 별도로 유지해 서버 정책 변경을 새 버전으로 자동 승인하지 않는다. 버전이 달라지면 저장을 차단하며 사용자가 명시적으로 편집 취소/최신 값 사용을 선택해야 한다. 스위치를 원래 값으로 돌리는 동작도 새 서버 버전을 승인하지 않는다.
- 저장·조회·감사 요청에 공통 중복 방지 및 연결 해제/종료 응답 보호를 적용했다. 새 GUI fixture는 깨끗한 초안 갱신, 미저장 변경 보존, 버전 충돌/취소, 기존 버전 저장, 중복 저장, 연결 해제 뒤 오류 무시를 검증한다.
- 정식 전체 회귀 검사 478개 PASS, 번역/placeholder 검사 및 최신 build PASS. 직접 보안 API 검사 실행은 전용 임시 인증 경로를 설정하지 않아 실패했으며 이를 통과 근거로 사용하지 않는다. 정식 실행기는 임시 인증/작업 경로를 사용하며 PASS다.
- 8791 미리보기 반영. 운영 보안 정책 변경 없음. 최신 .deb/로컬 APT에는 이 추가 기능이 아직 미포함이며 실제 브라우저/운영 적용 검증은 남아 있다.

## 보안·감사 번역과 문장 구성 (2026-10-04)

- 날짜 필터·감사 결과/검색/내보내기, 보안 설정 조회/저장, 관리자 helper 및 sudo/OS 권한 안내의 누락 번역 156개를 7개 언어에 추가했다. 기존 번역 보존.
- 감사 건수 문장을 단어 연결 대신 total/visible placeholder로 구성해 번역별 어순을 지원한다. 한국어 포함 9개 언어에서 숫자 치환/placeholder 제거를 확인했다. helper 상태 사유에도 번역 함수를 적용했다.
- 언어 회귀 검사 16개, 소스 키·placeholder 검사, 최신 build PASS. 미리보기 반영. 최신 .deb/로컬 APT에는 이 추가 변경이 아직 미포함이다.
- 영어 기준 1049개 중 주요 5개 카탈로그 648개, 러시아어·아랍어 511개. 전체 언어 번역과 실제 언어 전환·RTL 화면 검증은 미완료다.

## 로그·복구·감사 번역 보완 (2026-10-04)

- 로그 조회/다운로드/자동 갱신/읽기 권한, 백업 생성/목록/선택, 복원 비교/확인/실행 결과, 감사 조회/검색/내보내기 문구 30개를 보완했다. nginx 재로드와 crontab 전체 예약 교체의 영향을 설명하는 문구도 번역했다.
- 주요 5개 언어 각각 27개, 러시아어·아랍어 각각 30개의 누락 번역을 추가했다(총 195개). 기존 번역 보존. 영어 1048개 중 주요 5개 카탈로그 628개, 러시아어·아랍어 483개로 전체 번역은 아직 미완료다.
- 번역 회귀 검사 16개, 소스 문구/placeholder 검사 및 최신 build PASS. 미리보기 반영. 실제 언어 전환·RTL 화면 검증은 미완료다.
- 최신 .deb 격리 검증 PASS, SHA-256 `0fb4bd548790a31ed99a080b8d38112f482ec752691ec10f0519e47e044b4710`. 증거 `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-04T00-07-43.050Z.json`. 최신 로컬 APT 저장소 `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/dist/apt-repository-MgC9VK`의 패키지/인덱스/Release 대조 PASS. 서명·게시·호스트 설치 없음.

## 운영 화면 번역 보완 (2026-10-04)

- 패키지 검색/상태/선택/설치, 데몬 상태/시작/재시작/부팅 자동 시작/설정 재로드, 로그 소스/검색 문구 45개에 누락 번역을 추가했다. 기존 번역은 덮어쓰지 않았다.
- 일본어·중국어·독일어·프랑스어·스페인어 각각 25개 추가, 러시아어·아랍어 각각 45개 추가. 총 215개 누락 항목을 보완했다. 영어 기준 1048개 중 주요 5개 카탈로그 601개, 러시아어·아랍어 453개이며 전체 언어 UI 완전 번역은 미완료다.
- 언어/번역 회귀 검사 16개, literal t() 및 placeholder 검사, 최신 build PASS. 8791 미리보기 반영. 최신 .deb/로컬 APT에는 이 추가 번역이 아직 포함되지 않았다. 실제 언어 전환/RTL 화면 검증은 남아 있다.

## 최신 소스 검증·배포 산출물 (2026-10-04)

- 최신 전체 회귀 검사 477개 PASS. 최근 PostgreSQL 가져오기·코드 편집 및 편집기 요청 대상 보호를 포함한다. 최신 production build PASS.
- `dist/tastedev-linux_0.1.0_amd64.deb` 격리 검증 PASS, 13622개 파일. SHA-256 `28de3c6b2fd95a3a27c54d6bcd5aba46078df7d6ad7f36629528846112a8cc3a`. 검증 증거 `.runtime/verification/package-2026-10-04T00-00-35.032Z.json`.
- 최신 패키지의 새 로컬 APT 저장소: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/dist/apt-repository-M9kAsj`. 패키지 SHA-256, Packages 인덱스, gzip 동일성, Release 크기·SHA-256 대조 PASS. 증거 `.runtime/verification/apt-current-2026-10-04.json`. 서명·게시·호스트 설치는 수행하지 않았다.
- 전체 완료 상태는 PARTIAL이다. 실제 브라우저 검증, 승인된 격리 장비의 설치/운영 적용/복구, 실제 ACME 및 AI 성공 응답, 운영 APT 서명/게시/설치, desktop GUI, 전체 언어 UI 번역은 미완료다. 이전 섹션의 패키지 해시는 과거 산출물이다.

## PostgreSQL 가져오기·코드 편집 일관성 (2026-10-04)

- 패키지 초기화 후 선택 파일 가져오기를 등록하도록 effect 순서를 수정했다. 첫 파일 선택 시 가져오기 확인창이 초기화에 의해 사라지지 않는다.
- 코드 편집 시 해당 파일의 이전 값 가져오기 확인을 해제하고 검토 중인 운영 계획/적용 확인을 무효화한다. 편집한 GUI 값과 기존 운영 비교 기준/버전은 유지한다.
- 첫 선택 확인 표시·코드 편집 후 이전 확인 해제·비교 기준 유지 및 기존 초안 요청 문맥 검사 포함 관련 검사 3개 PASS. 최신 build PASS, 8791 미리보기 반영. 최신 .deb에 이 추가 변경은 아직 미포함이며 실제 브라우저 검증은 미완료다.

## PostgreSQL 코드→GUI 반영 (2026-10-04)

- 운영 설정 조회와 브라우저에서 같은 순수 값 파서를 사용한다. root helper 런타임 허용 목록에도 파서 분리를 반영했다.
- 선택된 PostgreSQL 파일의 코드 편집이 지원하는 5개 GUI 값(포트·연결 수·공유 버퍼·작업 메모리·로그 수집)에 반영된다. GUI 항목은 코드의 지시문 순서를 따른다. 중복 지시문은 마지막 지시문을 기준으로 지원되는 값만 반영한다. 삭제되거나 지원 범위 밖인 값은 기존 GUI 값을 유지하며 코드 자체를 보존한다. 다른 파일의 보존된 코드 초안은 현재 선택 파일 GUI에 반영하지 않는다.
- 이 동작은 전체 PostgreSQL 설정에 대한 완전한 양방향 AST 편집이 아니다. GUI에서 생성한 설정은 기존 초안 검토 흐름을 사용하며 운영 반영에는 기존 비교·계획·검수·확인 단계가 필요하다.
- 최신 전체 회귀 검사 476개 및 build PASS. 배포 .deb 격리 검증 PASS, SHA-256 `7bf9bb8dcb4f314fb6a003099b819a805290e310634bd0a01593d3547dd67753`, 호스트 설치 없음. 증거 `.runtime/verification/package-2026-10-03T23-55-38.795Z.json`. 실제 브라우저 상호작용과 운영 적용 검증은 남아 있다.

## 공통 코드 편집기 요청 대상 보호 (2026-10-04)

- 저장과 디스크 비교를 하나의 요청 잠금으로 관리한다. 파일·패키지·저장 버전·연결 상태가 바뀌거나 편집기를 종료하면 이전 응답은 현재 화면에 반영하지 않는다. 파일을 바꿨다가 같은 이름으로 돌아오는 경우도 별도 요청 문맥으로 처리한다.
- 파일 이동 시 이전 비교/오류를 지우고 비교 결과는 해당 파일에만 표시한다. 정상 저장의 버전/기준 갱신과 실패 후 재시도는 유지한다.
- 저장 중복·실패 재시도·파일 이동 후 저장 완료·연결 해제 후 실패·다른 파일 방문 후 같은 이름 복귀·종료 후 완료 검사 포함 관련 검사 3개 PASS, 최신 build PASS. 브라우저 실제 상호작용은 미검증이며 최신 .deb에는 이 추가 변경이 아직 포함되지 않았다.

## 패키지 IDE 선택·키보드 동작 마무리 (2026-10-04)

- Certbot·PostgreSQL의 파일 선택을 경로/인증서 이름으로 비교해 목록 갱신 이후에도 선택 표시를 유지한다. 목록에서 사라진 파일은 선택 및 설정 대상을 해제하고 진행 중인 원문 조회도 무효화한다.
- 설정/코드 탭에 tabpanel 연결과 roving tabindex를 적용하고 방향키·Home·End 전환을 지원한다. 코드 패널은 남은 컨테이너 높이를 채운다.
- 관련 컴포넌트 검사 3개 및 최신 build 통과. 직전 공통 레이아웃 전체 회귀 검사 476개 통과. 이번 변경의 실제 브라우저 키보드·시각 검증은 미완료다.
- 최신 `dist/tastedev-linux_0.1.0_amd64.deb` 격리 검증 PASS, SHA-256 `c0613d5ebc0cdca97a1b1cfb37a42ed338f5c350d7e7b7ac47a4d1fd5bea0fd1`. 현재 장비 설치 없음. 증거 `.runtime/verification/package-2026-10-03T23-49-18.140Z.json`.

## 관리 페이지 공통 레이아웃 (2026-10-04)

- overview·daemon·logs·recovery·security·audit에 동일한 72px 헤더와 남은 높이를 채우는 본문을 적용했다. 외부 페이지 스크롤 대신 본문 안에서만 스크롤하며, 작은 화면에서는 가로 메뉴 높이도 반영한다.
- 서버 이름과 새로고침을 공통 헤더에 배치하고 중복 서버 안내 행을 숨겼다. 각 페이지의 작업 버튼은 유지했다.
- 설치된 패키지/보안 상태 스냅샷을 공유하여 도구 전환 시 연결 대기와 목록 재조회가 발생하지 않도록 했다. 설치된 패키지 제목 오른쪽에서 수동 갱신한다.
- 공통 구조 및 메뉴 전환 컴포넌트 검사 2개, 전체 회귀 검사 476개, production build 통과. 8787·8791 로그인 HTTP 200 확인. 브라우저 정책 제한으로 실제 화면 시각 검증은 미완료다.

# 현재 제공 상태 (2026-10-04)

전체 완료는 아니다. 화면 연결 보완이나 반복 패키지 검사로 완료 범위를 확대하지 않는다.

## 공통 패키지 IDE·터미널·운영 화면 개편

- Certbot·PostgreSQL에 nginx와 같은 고정 왼쪽 탐색기, 오른쪽 설정/코드 탭, 상태 및 아이콘 작업 헤더를 연결했다. Certbot은 조회된 인증서의 발급·갱신 작업과 기존 동의·작업 로그를 사용한다. PostgreSQL은 실제 설정 파일, 연결·메모리·로그 항목 및 설정 원문을 조회하며 폼 가져오기·적용·백업 복원 기능을 유지한다. 코드 저장은 작업 폴더의 초안이며 운영 파일을 직접 덮어쓰지 않는다.
- nginx는 초기 조회 시 자동 선택을 제거하고 오른쪽 중앙에 왼쪽 노드 선택 안내만 표시한다. 코드 편집기 포커스 선은 테마 색상의 1px 안쪽 선으로 변경했다.
- 터미널은 상단 도구 모음과 남은 화면을 채우는 xterm으로 구성한다. 셸과 최근 패키지 작업 출력을 선택하고 실행 중 작업을 조회한다. 패키지 출력은 입력 가능한 셸로 취급하지 않는다. Bash/Codex/Claude 명령 선택은 설치된 CLI를 사용하며 자동 설치·로그인은 수행하지 않는다. PTY 기본값과 최대 실행 시간을 대화형 작업에 맞추고 서버·보안 권한 gate를 유지한다.
- 데몬은 검색·필터 툴바, 선택 가능한 서비스 목록, 서비스 작업 영역으로 분리했다. 운영 페이지의 제목·여백·32px 입력/버튼·표·스크롤 스타일을 통일했다. 로그인 페이지의 바깥 여백은 이 변경에서 제외했다.
- 러시아어·아랍어 DB 설정 문구 각각 21개와 공통 안내를 추가했다. 전체 회귀 475개, 번역 검사, production build, 격리 package:verify PASS. 증거: .runtime/verification/regression-unified-gui-2026-10-04.log 및 .runtime/verification/package-2026-10-03T23-34-58.839Z.json. deb SHA-256: 85d4841da5da28a5b87a02673ca4b955db59d4113d85bef863e15cabe713d09f. 호스트 설치 없음.
- 후속으로 Certbot 탐색기의 파일 표기를 실제 조회한 live/<인증서>/cert.pem으로 정리했다. 선택 렌더링 검사 PASS이며 이 표기 변경은 위 deb 이후 소스 변경이다. 8787·8791 로그인 HTTP 200, 신규 설정 원문 API 미로그인 401 확인. 실제 GUI 시각·키보드·운영 작업 E2E와 전체 번역은 여전히 미완료다.

## nginx 코드 영역·트리 툴바 후속 정리

- 코드 편집 영역은 오른쪽 컨테이너의 남은 공간을 채우고 내부에서 스크롤한다. 설정 패널만 콘텐츠 스크롤 스타일을 적용해 미저장 코드 복구 안내가 편집 영역과 공간을 절반씩 나누지 않도록 수정했다. 코드 모드의 바깥 스크롤 여백과 textarea 최소 높이 제한도 제거했다.
- 검색 옆 펼치기·접기 버튼은 검색창과 동일한 32px 높이의 투명한 툴바 아이콘으로 변경했다. 공통 버튼의 최소 높이·여백·배경을 명시적으로 덮어쓰고 hover/focus/disabled 상태를 유지한다.
- 패키지 초안 저장·코드 생성·다운로드 결과는 요청 당시 패키지·편집 값·연결 상태가 유지되고 화면이 열려 있을 때만 반영한다. 정상 완료·패키지 전환·재편집·연결 해제·화면 종료·지연 오류를 세 작업별로 검사했다. 기존 GUI 렌더링 포함 3개 PASS. nginx 트리·코드 편집 렌더링 2개 및 production build PASS.
- 최신 배포 패키지에 반영했고 격리 package:verify PASS. SHA-256: 1c19c853a38f973d33e70c54102a4f74ee7ad2ab16fe22f7932dc589117f379c. 증거: .runtime/verification/package-2026-10-03T23-16-46.107Z.json. 호스트 설치 없음. 8787·8791 로그인 HTTP 200. 아래 패키지 해시는 이전 산출물이다.
- 실제 브라우저 화면 크기와 아이콘 시각 검증은 남아 있다.

## 언어 목록 hydration 오류 수정

- 후속으로 국기 표시도 고정 데이터로 공유한다. 서버·브라우저 렌더링에서 Intl.Locale.maximize를 호출하지 않으며, 지역 추론 API가 없거나 다른 지역을 반환하는 조건에서도 전체 목록의 국기가 동일하다. 관련 번역 검사 8개·production build·격리 package:verify PASS. 8787·8791 로그인 HTTP 200, 고정 언어 이름과 한국어 국기 확인. 실제 브라우저 콘솔 검증은 여전히 남아 있다.
- 국기 수정 포함 최신 deb SHA-256: 1654eb3ab01ef2c2039e6c6c5d345cfc9f54cf6ca63425e132c7f96fe135c910. 증거: .runtime/verification/package-2026-10-03T23-08-07.678Z.json. 호스트 설치는 수행하지 않았으며 아래 해시는 이전 산출물이다.
- 서버의 Intl.DisplayNames는 Afar (Djibouti), 브라우저는 aa (Djibouti)를 반환해 로그인 화면의 hydration이 불일치했다. 언어·지역 324개 이름을 linux-languages.json의 고정 데이터로 공유하며 렌더링 때 Intl.DisplayNames를 호출하지 않는다.
- 표시 이름 API가 없거나 다른 값을 반환하는 두 환경에서도 목록이 동일하고 기존 Linux locale들이 포함되는 검사 PASS. 번역 관련 검사 7개와 production build PASS, 8787·8791 로그인 HTML 200 및 고정 이름 확인. 실제 브라우저 콘솔 검증은 남아 있다.
- 언어 이름 수정 deb에 반영했고 격리 package:verify PASS. 로그인 SSR HTML과 실제 제공된 클라이언트 JavaScript 양쪽에 고정된 Afar (Djibouti) 이름이 포함되는 것을 HTTP로 검사했다. SHA-256: 3c4f88dd01c2b124a233765188689715572da7f6e1b7746b2b358daa56f4ac30. 증거: .runtime/verification/package-2026-10-03T23-04-49.809Z.json. 호스트 설치는 수행하지 않았다.
- 보호 페이지의 인증 저장소 오류는 로그인 안내로 이동하며, 작업 API의 관련 오류는 503을 반환한다. 열린 작업 화면은 저장소 503을 세션 만료로 취급해 강제 이동하지 않는다. 관련 인증·화면 회귀 7개 PASS. 실제 GUI의 편집 보존 흐름은 미검증이다.

## 인증 오류 안내 최신 반영

- 후속으로 잘못된 계정 JSON/null/배열과 파일 형태의 인증 경로도 503 안내로 처리하며 원본을 보존한다. 관련 인증 상태·화면 검사 5개 PASS. 복구 안내 4개 문구를 7개 언어에 번역했고 카탈로그 검사 PASS. 이 후속 변경은 위 최신 패키지에 포함된다.
- 인증 저장소 권한 오류를 로그인 페이지에서 처리해 경로·권한 안내를 표시하고 입력·제출을 차단한다. 상태 API는 계정이 설정돼 있으면 인증 저장소를 확인하며 관련 오류에 민감한 경로를 포함하지 않는 503을 반환한다. 로그인 POST도 같은 오류를 처리한다. 관련 없는 서버 오류는 숨기지 않는다.
- 권한이 잘못된 임시 저장소에서 키를 만들지 않는 것, 권한 복구 후 정상 상태, 화면 렌더링·제출 차단을 검증했다. 전체 회귀 468개 PASS, production build 및 최신 격리 package:verify PASS. 회귀 증거: .runtime/verification/regression-auth-storage-2026-10-04.log.
- 이전 deb SHA-256: 9e00f9225d980216636ec376639127457d33b9ee49c8b46a0e23054ebc2fc189. 증거: .runtime/verification/package-2026-10-03T22-49-10.836Z.json. 영어 누락 및 7개 언어 후속 번역, 계정 설정 CLI 환경 로더를 포함한다. 아래 패키지 기록은 과거 산출물이다.
- 8787/8791 로그인·인증 상태 HTTP 200, configured:true, storageUnavailable:false 확인. 실제 브라우저 로그인과 운영 변경 검증은 남아 있다.

## 로그인 인증 저장 경로 오류 해결

- 개발 작업 디스크가 exFAT이고 기본 인증 폴더가 0777로 표시되는 것을 확인했다. 권한 검사를 완화하지 않고 사용자 홈의 development-auth 저장소로 연결했다. 기존 auth.json을 보존해 복사했으며 비밀번호 재설정은 하지 않았다. 기존 기본 경로에는 Better Auth 키/DB가 생성되어 있지 않았다.
- 새 인증 디렉터리 0700·키/DB 0600, 로그인 페이지 HTTP 200, 인증 상태 API configured:true 확인. 실제 브라우저 로그인 및 사용 중인 쿠키 검증은 미완료다.
- 계정 설정 CLI도 Next 환경 파일의 LINUX_AUTH_ROOT를 읽도록 수정했다. 설치 패키지의 명시적 인증 경로는 유지한다. 격리 환경 경로 검사와 프로세스 간 세션 유지 검사 2개 PASS. CLI 수정은 현재 배포 패키지 이후 소스 변경이다.

## 화면 번역 누락 검사

- 환경 파일 관리·지원 값 비교·다른 변수 보존·앱 재시작 범위·전체 파일 복원 확인 등 23개 문구를 7개 언어에 추가했다. 지역별 선택 언어의 전체 파일 복원 확인이 영어로 fallback하지 않는 것을 확인했다. 소스 카탈로그 검사 PASS. 이 변경도 현재 패키지 이후 소스 변경이다.
- 후속으로 nginx·MariaDB 시작/종료/복원과 영향 확인, 백업 상태, 터미널 입력/EOF 등 24개 문구를 7개 언어에 추가했다. 실제 운영 작업이나 키 입력 GUI 검증은 수행하지 않았다. 번역 검사 6개 및 소스 카탈로그 검사 PASS. 이 번역 추가는 현재 배포 패키지 이후 소스 변경이다.
- 실제 화면의 정적 번역 호출에서 발견한 영어 누락 62개를 보완했다. nginx·MariaDB 시작/종료/복원 확인, 환경 파일 관리, 터미널 입력 등의 안내를 포함한다. 영어 카탈로그는 현재 1038개 항목이다.
- 개발 소스 검사 명령 npm run i18n:check를 추가했다. app/components의 정적 t() 호출 733개에 영어 누락 0, 카탈로그의 빈 문자열·매개변수 불일치 0. 동적 호출 125개는 별도 검토 대상이며 언어별 미번역 수를 보고한다. 증거: .runtime/verification/i18n-source-2026-10-04.log.
- 조건부 문구 추출·주석 제외·실제 누락 거부·매개변수 불일치 거부 fixture 및 번역 검사 7개 PASS. 전체 UI의 완전 번역 증거는 아니다. 최신 영어 번역은 아래 빌드/패키지 이후 소스 변경이다.

## IDE 수정 최신 배포 반영

- IDE 중복 탭·저장 기준, 파일명 매개변수 번역, 세 편집기의 들여쓰기·내어쓰기 수정을 production 빌드와 deb에 반영했다. 빌드 및 격리 package:verify PASS. 최신 SHA-256: e74b47853dc983da2a118aba5f3b663a61b45121e2d94788fd8336658698683e. 증거: .runtime/verification/package-2026-10-03T22-29-08.015Z.json. 아래 배포 기록은 이전 산출물이다.
- 큰 선택 영역의 내어쓰기를 문자열 전체 반복 재조합에서 한 번의 조합으로 변경했다. 같은 5만 줄 입력에서 약 3763ms → 22ms(이 장비의 단일 비교 측정). 결과·선택 경계와 길이 초과 차단 검사 PASS. 실제 브라우저 성능 측정은 아니다.
- 최신 8791 미리보기 시작 및 로그인 HTTP 200 확인. 운영 장비에 패키지를 설치하지 않았다. 실제 GUI 상호작용과 운영 설정 변경 검증은 미완료다.

## 작업 폴더 IDE 탭 보존 수정

- 일반 IDE·패키지 코드·nginx 코드 편집기의 Tab/Shift+Tab을 수정했다. 여러 줄의 선택 범위와 줄바꿈을 유지하며 들여쓰기·내어쓰기를 수행한다. Ctrl/Alt/Meta+Tab을 가로채지 않는다. nginx는 기존 4칸, 일반/패키지는 2칸을 유지한다. Unicode·CRLF·선택 끝 경계·텍스트 길이 제한 및 nginx 실제 이벤트 처리 포함 검사 6개 PASS, 3개 컴포넌트 SWC 컴파일 PASS. 최신 소스 변경이며 실제 GUI와 배포 반영은 남아 있다.
- 패키지 GUI가 저장한 초안을 열 때 동일 파일의 기존 탭을 재사용한다. 저장 버전이 있는 초안은 저장된 기준으로 표시하고, 저장하지 않은 생성 코드는 미저장으로 유지한다.
- 기존 탭에 다른 미저장 편집이 있으면 그 내용을 보존한다. 저장된 초안을 다시 열면 디스크 비교를 제공한다. 동일한 편집 내용이 실제 저장됐을 때만 최신 저장 버전과 기준을 반영한다.
- 탭 보존·외부 변경 충돌·초안 검사 10개 PASS, IDE 컴포넌트 SWC 컴파일 PASS. 이 수정은 아래 배포 패키지 및 production 빌드 이후 소스 변경이다. 실제 GUI 상호작용은 미검증이다.

## 최신 배포 산출물

- 번역 보완을 포함한 최신 deb 생성 및 격리 package:verify PASS. SHA-256: aee6f0b500c72a8fb553e81b6600aa0610ae1c7d23e02f2569d8befcea065a74. 증거: .runtime/verification/package-2026-10-03T22-18-21.664Z.json.
- 표준 npm start, 외부 테마 자원, production CSP, 로그인·비밀번호 변경·세션 폐기, 정규 패키지 경로 및 격리 설정 API를 확인했다. 운영 장비에는 설치하지 않았다. 아래 과거 패키지 기록은 이전 산출물이다.
- 8791 production 미리보기를 최신 빌드로 재시작했다. 로그인과 테마 자원 HTTP 200 확인. 실제 브라우저 렌더링과 운영 설정 적용 검증은 남아 있다.

## 다국어 화면 문구 보완

- 후속 코드 편집기 문구 18개와 파일명을 포함한 확인 문장 1개를 7개 언어에 추가했다. 문장 단위 매개변수 번역으로 언어별 어순을 유지하며 파일명의 특수문자를 그대로 표시한다. 번역·초안 보존 관련 검사 11개 및 production build PASS. 이 후속 변경은 위 deb 생성 이후 소스 변경이다.
- 공통 화면 문구 60개, nginx 미저장 코드 복구 문구 13개, 설치 확인·화면 검색 문구 10개를 일본어·중국어·독일어·프랑스어·스페인어·러시아어·아랍어에 추가했다. 이미 번역된 항목은 보존했다.
- 영어 카탈로그 1042개 항목 기준 일본어·중국어·독일어·프랑스어·스페인어는 각각 570개, 러시아어·아랍어는 각각 381개가 번역되어 있다. 지역 언어는 해당 기본 언어 카탈로그를 사용한다. 전체 Linux 언어 번역 완료를 의미하지 않는다.
- 번역 테스트 5개, 테마 초기화 2개, 코드 복구 2개 PASS. production build PASS 및 개발 서버 로그인 HTTP 200 확인. 아래 deb는 이번 번역 추가 전 산출물이다. 실제 브라우저 언어 전환 검증은 남아 있다.
- 누적 소스의 격리 전체 회귀 458개 PASS(실패·취소·건너뛰기 0). 증거: .runtime/verification/regression-i18n-2026-10-04.log. 실제 운영 설정 변경이나 GUI E2E 합격을 의미하지 않는다.

## 표준 실행·테마·편집 코드 복구 최신 확인

- npm 스크립트를 next dev / next build / next start CLI로 정리했다. 현재 작업 디스크의 심볼릭 링크 제한 때문에 webpack을 사용하며 CLI는 일반 실행 파일로 준비한다. 새 임시 폴더의 오프라인 npm ci, Next CLI, SQLite 실제 쿼리 PASS: .runtime/verification/npm-clean-2026-10-03T22-02-00.496Z.json.
- 테마 초기화는 React의 외부 async 스크립트 리소스로 제공한다. 저장된 테마를 정한 뒤 본문을 표시한다. 개발 CSP에만 unsafe-eval 및 loopback HMR을 허용하며 production에는 포함하지 않는다. 페이지/테마 자원의 HTTP 제공과 테마 초기화 검사는 통과했고 실제 브라우저 렌더링 검증은 남아 있다.
- 이름 변경/삭제/외부 변경으로 기존 노드와 연결되지 않는 미저장 코드의 복구 창, 다운로드, 같은 파일/종류 노드의 편집 재개를 제공한다. 기존 대상의 미저장 코드 교체는 확인을 받는다. 복구는 운영 파일을 수정하지 않는다. 편집을 되돌리면 불필요한 버퍼를 없애며 외부 변경 뒤에도 미저장 경고를 유지한다. 관련 검사 11개 PASS.
- production build 및 최신 deb의 표준 npm start 검증 PASS. 개발 캐시는 패키지에서 제외한다. 테마 자원, production CSP, 인증 및 기존 격리 HTTP 검사를 확인했다. SHA-256: a1f46b95b40542d662fed9b91e6c3680ae52a73e9177ebdda604da0cfa3e8f35. 증거: .runtime/verification/package-2026-10-03T22-01-14.404Z.json. 아래 배포 기록은 이전 산출물이다. 운영 장비에 설치하지 않았다.

## nginx 설정 GUI 확장 (2026-10-04)

- 프록시·TLS·gzip 지시어 28개의 설명/공식 문서 링크와 블록 범위별 추천 입력을 제공한다. HTTP/server 상속 범위를 추가했고 http의 upstream 블록 추가도 제공한다. 설치된 모든 모듈의 완전한 설정 카탈로그를 의미하지 않는다.
- 사용자 지정 이름/값으로 목록에 없는 지시어와 반복 지시어를 선택한 블록 끝에 추가할 수 있다. 입력 오류 시 입력값을 보존한다. 실제 설치 모듈과 컨텍스트 허용 여부는 nginx 검수로 판단한다.
- PID 설정 생략 시 검수용 main 파일에만 임시 pid를 추가한다. include 파일에 PID가 있으면 중복 추가하지 않는다. 운영 파일은 변경하지 않는다.
- 관련 컴포넌트·트리·입력·후보 설정 검사 10개 PASS, production build PASS. 실제 nginx -t로 상속 proxy/gzip/TLS와 반복 헤더 승인 및 location의 TLS 지시어 거부를 확인했다. 증거: .runtime/verification/nginx-module-gui-2026-10-03T21-39-23.670Z.json. 서비스 시작/재시작 및 브라우저 GUI E2E 증거는 아니다.
- 최신 deb 재생성/격리 package:verify PASS. SHA-256: 0f99c98c1d8100518f74035f570a641482a45f3ab1db55171e5cd02b53c22c4b. 증거: .runtime/verification/package-2026-10-03T21-40-46.604Z.json. 공통 컨트롤 후속 변경과 이 nginx 변경을 포함한다. 아래 배포 기록은 과거 산출물이다.

## Better Auth 및 공통 컨트롤 최신 반영

- Better Auth 1.7.7 및 SQLite로 인증을 전환했다. 기존 scrypt 계정을 유지하고 7일 세션을 디스크에 보존한다. 이전 메모리 세션은 전환 후 한 번 재로그인이 필요하다.
- 별도 프로세스 로그인/세션 재조회, 변조 쿠키 거부, 로그아웃 후 새 프로세스의 세션 거부 및 인증 파일 권한 0600 검사 PASS. 기존 전체 회귀 446개 PASS와 추가 지속성 검사 1개 PASS. 최신 production build PASS 및 8791 미리보기 반영.
- NativeSelect, 키보드 탐색과 포털 목록을 제공하는 CustomSelect, 스위치 공통 컴포넌트를 제공한다. 패키지 헤더 검색·선택·버튼 높이를 32px로 맞췄다. 실제 브라우저 렌더링 검증은 미완료다.
- 선택 메뉴 후속 보완: 닫힌 메뉴 Home/End, 비활성 항목 건너뛰기, 방향키 순환, 문자 입력/반복 문자 탐색, Enter 확정 및 Escape/Tab 취소를 컴포넌트 이벤트 검사로 확인했다. native select와 switch의 label 연결·네이티브 속성 포함 검사 3개 PASS. /components에 두 select 비교 예시를 제공한다. 이 후속 변경은 아래 deb 생성 이후 소스 변경이다.
- 최신 deb SHA-256: 56d883da7aeea56b081a3a73387adac65902da781a8102927ec82488a79df800. Better Auth/native SQLite 의존성을 포함한다. 격리 패키지 서버 인증·비밀번호 변경·로그아웃 및 기존 HTTP 검사 PASS. 증거: .runtime/verification/package-2026-10-03T21-27-03.611Z.json. 운영 장비에는 설치하지 않았다. 아래 과거 배포 기록은 이전 산출물이다.

## 미완료 부분

- Redis 설정 적용 및 전체 설정 복원: 운영용 helper·POST API·실행 GUI가 연결되어 있다. 다만 실행 main을 관측할 수 없는 서비스에는 적용을 차단하며, 실제 실행 검증은 남아 있다. 조회, 초안, 격리 검증, 백업 조회·복원 검토 및 조건부 적용·복원 실행을 제공한다. 운영 데이터 보존과 실제 재시작까지 검증한 상태는 아니다.
- 다국어: 언어 선택 목록은 광범위하지만 실제 번역은 8개 카탈로그 중심이다. 모든 선택 언어의 완전한 번역은 아니다.

## 구현과 실제 검증을 구분할 부분

- nginx·Certbot·cron·서비스·PostgreSQL·MariaDB·Node.js 운영 GUI/API/helper는 존재한다. 실제 운영 설정 적용·서비스 재시작·복구 전체 흐름은 미검증이다.
- Tauri release 및 패키지 구조 검사는 존재한다. 실제 데스크톱 실행·로그인·GUI 동작 검증은 미완료다.
- 배포 .deb는 생성됐다. 운영 APT 저장소 주소/서명 키와 실제 설치·업데이트 검증은 미완료다.
- AI 로그 분석 연결은 존재한다. 성공한 실제 AI 응답은 quota 제약으로 미확인이다.
- 복구 페이지는 nginx 설정 변경 백업 컴포넌트와 설치된 PostgreSQL/MariaDB 전용 설정 복원 GUI 진입을 제공한다. DB 데이터 백업을 제공하는 것으로 해석하면 안 된다.

## 진행 제약

QA-01은 현재 운영 장비의 sudo 설정·운영 서비스·apt upgrade 변경을 금지한다. 실제 변경 검증은 별도 승인된 DEV/격리 환경이 필요하다. Redis 실행을 위한 격리 환경 승인 요청은 미응답 상태다. 브라우저 접근 정책으로 현재 GUI E2E도 검증되지 않았다.

nginx IDE는 파일·블록 트리, 블록별 설정 편집, include 파일 탐색, 하위 블록 추가 및 컨텍스트 메뉴를 제공한다. 모든 설치 모듈의 설정 카탈로그와 실제 브라우저 동작 검증은 완료되지 않았다. 실제 실행 검증을 위한 환경 확보와 구분해 진행해야 한다. 전체 완료 판정은 이 파일만으로 하지 않고 completion-audit.md 및 각 기능의 실제 증거를 확인한다.

## nginx IDE 최신 확인 (2026-10-04)

- 헤더 상태는 조회된 nginx 서비스의 실행 상태로 표시하며, 시작·종료·검수·백업·복원은 오른쪽 아이콘 버튼이다.
- nginx 트리와 헤더는 고정 높이 레이아웃 안에 유지되고 오른쪽 설정 영역이 독립적으로 스크롤한다. 긴 트리 자체에는 별도 스크롤을 허용한다. 현재 브라우저 렌더링 검증은 미완료다.
- http 노드 추가 버튼의 공통 버튼 최소 높이 충돌을 제거했고 스위치를 둥근 트랙으로 정리했다. 소스 production build는 통과했다.
- 설정 복원 검토는 기본적으로 원문을 반환하지 않는다. 명시적인 includeDiff:true에만 비교 원문을 반환하며 false와 잘못된 타입, 검토 단계의 파일 미변경을 격리 fixture에서 확인했다. nginx 복원·복원 GUI·헤더·블록 설정 관련 검사 4개가 통과했다 (/tmp/nginx-current-checks.log). 실제 운영 복원 성공을 의미하지 않는다.

## nginx 블록 설정 후속 검증 (2026-10-04)

- 선택한 파일 또는 블록에 설정/코드 보기 전환을 제공한다. 코드 보기는 현재 초안에서 다시 파싱한 노드 범위를 사용하고, 파일 선택 시 초안 전체를 표시한다. 블록 생성 후 코드 범위 및 파일 전체 보기 컴포넌트 검사를 통과했다.
- 내용 비우기는 로컬 입력값만 초기화하며 행/지시어와 운영 파일을 삭제하지 않는다. 새 값 입력 후 초안에 반영한다. 빈 값은 반영 버튼을 비활성화한다.
- HTTP core의 헤더 처리·본문 처리·해시 설정 11개를 허용 컨텍스트에 추가했다. reference: https://nginx.org/en/docs/http/ngx_http_core_module.html . 모든 모듈 카탈로그를 완성했다는 뜻은 아니다.
- 최신 전체 회귀: npm test 438/438 PASS, /tmp/tastedev-current-regression.log. 최신 production build PASS. 운영 서비스 변경, 실제 GUI 렌더링/E2E 및 전체 제품 완료 증거를 대신하지 않는다.

## 최신 배포 산출물 (2026-10-04)

- dist/tastedev-linux_0.1.0_amd64.deb 재생성 및 package:verify PASS.
- SHA-256: 234723f0406d017cc8dd4072856fbea5798444cd1a7c727366d1c688fb1c9dc3
- 증거: .runtime/verification/package-2026-10-03T20-59-52.177Z.json
- 최신 production build ID와 패키지 런타임 동일성, 격리 서버 로그인/로그아웃, 패키지 라우트, 인증·권한 거부, 설정 파일 fixture 및 백업 복원 HTTP 검사를 확인했다. 운영 장비에 설치하지 않았다.
- nginx 설정/코드 전환, 블록 코드 편집과 줄 번호, 현재 초안 노드, 미반영 코드 보호, 설정 도움말이 포함된 빌드다. 브라우저 실제 렌더링 및 운영 서비스 적용 성공을 증명하지 않는다.

## 통합 IDE 회귀 (2026-10-04)

- 전체 npm test 446/446 PASS, /tmp/tastedev-integrated-ide-regression.log.
- 최신 소스는 코드 구문 강조·줄 번호·영어 도움말·설명 검색·선택과 버퍼의 의미 경로·컨텍스트 메뉴 통합 코드 편집을 포함한다.
- 최신 deb(234723f...)는 이후 추가한 구문 강조/검색/선택 경로 변경보다 앞선 산출물이다. 최신 소스와 동일한 패키지로 주장하지 않는다.
- 현재 미리보기는 최신 source production build를 사용한다. 브라우저 렌더링, 전체 번역 및 실제 운영 적용은 여전히 미완료다.

### 2026-10-05 nginx 설명 보완 — 소스 검증 완료, 배포 미실시

TLS 4개·realip 3개·rewrite 2개 지시어 및 if 블록에 공식 문서 기반 설명을 추가했습니다. 확인된 기본값만 표시하고 외부 모듈의 미확인 지시어에 대한 기존 안내를 유지합니다. 영어·포르투갈어 번역과 설명 검색을 함께 반영했습니다. 관련 검사14 PASS, 전체 격리 회귀659 PASS, i18n 검사 PASS, 별도 복사본의 Next.js 배포 빌드 PASS이며 클라이언트 번들에서 새 설명을 확인했습니다. 현재 8787 개발 서버는 IDE 요청에 HTTP307을 반환합니다. sandbox 내부의 연결 실패는 서버 중단 증거가 아니며 정정했습니다. CUA 기존 탭은 Emulation.setFocusEmulationEnabled 시간 초과로 실제 화면 검증이 미완료입니다. 실행 중인 서버 빌드 파일은 교체하지 않았고 103 배포도 수행하지 않았습니다. 증거: `.runtime/verification/nginx-help-additions-20261005.json`.

### 2026-10-05 최신 nginx 설명·감사 페이지 DEB 생성 및 격리 검증

소스와 별도 빌드 복사본의 app/components/lib/public/scripts 내용 일치를 확인하고 최신 빌드의 DEB를 생성했습니다. `dist/tastedev-linux_0.1.0_amd64-nginx-help-additions.deb` SHA-256 `046569eb3f7be5694f8a32450178d9743770a7165e45314c5c846ca1f6ccc9a6`. `package:verify -- --terminal` PASS: 격리된 인증·세션 폐기·PTY 입력/화면 크기/시간 제한·현재 실행 계정 식별·canonical package routes·권한 거부 및 helper closure 등을 검사했습니다. 신규 nginx 설명을 포함한 실제 DEB 내부 클라이언트 번들 해시가 검증 빌드와 일치합니다. 실제 설치·운영 nginx/DB/Certbot 실행·브라우저 GUI 전체 검증은 수행하지 않았습니다. 103 설치본은 이전 workspace-tab-close 패키지 그대로입니다. README의 오래된 PTY 미지원 문구와 실행 제한 설명을 현재 소스에 맞게 정정했습니다. 증거 `.runtime/verification/nginx-help-additions-package-20261005.json`. 전체 목표는 PARTIAL입니다.

### 2026-10-05 감사 페이지의 실제 패키지 HTTP 통합 검사

동일 DEB SHA `046569eb3f7be5694f8a32450178d9743770a7165e45314c5c846ca1f6ccc9a6`를 임시 디렉터리에 풀어 235건의 한국어 fixture 기록을 100/100/35건으로 조회했습니다. 중복·누락 없이 전체 기록 일치, 페이지 조회 중 append 이후 head cursor와 이전 페이지 snapshot 유지, 새로고침 시 새 기록 반영, 추가 private 필드 제외, no-store, 미인증401·잘못된 커서400·축소된 파일409를 실제 패키지 API로 확인했습니다. 검사 후 해당 임시 기록을 원래 bytes로 복구하며 운영 감사 파일은 읽거나 쓰지 않습니다. `package:verify -- --terminal` 전체 PASS. 새 통합 검사는 향후 패키지 검증에도 포함됩니다. 실제 브라우저 GUI/장비 설치/감사 기록 변조 방지 기능의 증거로 확대하지 않습니다. 증거 `.runtime/verification/audit-pagination-package-http-20261005.json`. 전체 목표는 PARTIAL입니다.

### 2026-10-05 PostgreSQL HBA 삭제 확인창 보완 — 소스 검증

접속 규칙 초안 삭제의 native window.confirm을 공통 ConfirmDialog로 교체했습니다. 확인창에 선택 규칙 원문을 표시하며 취소 시 유지합니다. 승인 시 캡처한 record identity·전체 source bytes·line/raw를 다시 검사하고 변경된 초안은 보존·거부합니다. 요청별 pending ref로 오래된 승인/취소 콜백과 중복 승인이 다른 삭제 요청에 영향을 주지 못하게 합니다. 관련·최종 번역 검사14 PASS, 컴포넌트 변경 전체 회귀660 PASS, i18n PASS, 최종 번역을 포함한 별도 production build PASS. 최초 fixture의 raw newline 예상 불일치 및 번역 누락을 수정했고 로그를 보존했습니다. 최종 추가 번역은 focused 검사로 검증했습니다. 아직 DEB 재생성·103 설치·운영 HBA 변경을 하지 않았습니다. 증거 `.runtime/verification/postgresql-hba-delete-dialog-20261005.json`. 새 IAB 탭의 격리 로그인 조작도 화면 변화가 없었으며 원인은 확정하지 않았습니다. GUI 증거 `.runtime/verification/gui-click-retry-20261005.json`, 화면 `/tmp/tastedev-gui-click-retry-20261005.jpg`. 전체 목표는 PARTIAL입니다.

### 2026-10-05 일본어 nginx 설정 설명142개 추가 — 소스 반영

HTTP/core/proxy/TLS/FastCGI/stream/mail/upstream 지시어 및 블록 설명의 누락142개를 일본어로 번역했습니다. 일본어로 설정 설명을 검색할 수 있으며 지시어 이름·옵션·수치·stream DNS 최소 버전1.27.3·문맥 제한을 유지합니다. 실제 추천 항목 문맥과 설치 파일의 추가 지시어, 일본어 설명 검색을 검사한 관련18 PASS, i18n PASS, 별도 production build PASS이며 새 일본어 설명을 클라이언트 번들에서 확인했습니다. 일본어 기준1157/1300개 번역, 누락143개입니다. 전 일본어 UI 또는 모든 Linux 언어 번역 완료를 주장하지 않습니다. 현재103 설치본은 이전 nginx-help-audit-hba 패키지이고 이번 번역은 아직 DEB 재생성·배포하지 않았습니다. 증거 `.runtime/verification/nginx-japanese-help-20261005.json`. 전체 목표 PARTIAL.
