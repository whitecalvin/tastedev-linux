# TypeScript 전환

개발 언어를 TypeScript로 전환한다. 화면·서버 로직·실행 스크립트까지 단계적으로 전환하며, 기존 기능과 설치 계정·데이터는 유지한다. Tauri 네이티브 코드는 Rust를 유지한다.

## 현재 적용

- TypeScript 7 및 React·Node·SQLite 타입 패키지
- `strict: true`, `noEmit: true`, Next.js 타입 검사. 오류 무시 옵션 없음
- 루트·콘솔 레이아웃, 진입/리다이렉트/로딩 페이지, 로그인 페이지·화면, 콘솔·패키지 IDE 라우트 및 오류 화면
- 관리자 계정·비밀번호 변경, 확인 대화상자, 제네릭 편집 상태 저장 훅과 세션 정리
- xterm 터미널 화면·세션별 입력/크기 변경 콜백, 탭 터미널·세션 복구/출력 이력/연결 대상 확인
- 로그 분석 도우미·입력 세대/전송 동의/이전 응답 차단 및 공통 터미널·AI API 응답 타입
- 공통 설정 코드 편집기·저장/비교/커서 상태
- 언어 Provider·선택·카탈로그/번역 계약, 세션 유지 훅, nginx 아이콘
- 관리 앱 접속·재시작 및 시스템 설정: 로그·터미널 표시·AI 연결 요청/응답 계약
- 보안 옵션·sudo 규칙 검토/적용, 감사 기록 페이지/필터/내보내기
- 서비스·로그·백업/복구 운영 화면과 공통 정책·감사·서비스·복구 응답 타입
- nginx 헤더/검수·적용·백업/복원·중단 복구, nginx/Redis 공유 설정 상태 조회 및 API 타입
- nginx 코드 편집·커서/스크롤 상태·미저장 코드 복구·블록 설정, AST/코드 버퍼/미반영 입력 타입
- nginx 트리뷰 전체: 검색·선택·펼침 상태·심볼릭 링크·서버 추가·복사/붙여넣기·드래그앤드롭·컨텍스트 메뉴
- nginx 사이트 활성화/복구 대화상자, Certbot 작업 로그/백업 연결, PostgreSQL 복원 완료 기록/원본 백업 가져오기
- PostgreSQL 코드 검수/적용·중단 복구/준비 취소·백업 복원·pg_hba.conf 검토/적용 및 버전/결과 타입
- pg_hba.conf 규칙 편집·삭제 확인·미반영 입력, PostgreSQL 데이터 백업/복원
- PostgreSQL·MariaDB·Redis 공통 파일 설정 편집기와 각 제품 연결 컴포넌트, 행/추가 입력/규칙/데이터 백업 타입
- MariaDB·Redis 코드 검수/적용·중단 복구, Redis 리소스 목록 검토와 공통 DB 결과 타입
- 패키지 IDE 연결부: 인증서/설정 파일·초안·선택·미반영 입력·작업 팝업 타입, 검토 입력의 버전/코드 확인
- 공통 페이지 연결부: 초기 서버/패키지 데이터·설치 계획/작업·관리 API·Node.js 조회 실패 상태 타입
- 공통 패키지 설정 폼: 스키마·운영 파일·기준 값·DB 적용 계획 타입, 동일 패키지 API 교체의 오래된 초안 응답 차단
- Node.js 앱 등록·파일 확인·서비스 계획·상태·환경/로그 탭: 식별 정보만 있는 상태와 검토된 서비스 계획의 구별 타입
- 공통 메뉴/헤더·nginx/Certbot/cron 관리 연결: 상태·인증서·예약 작업·관리 API 타입
- 파일 탐색기/코드 작성기·실행 콘솔: 파일 탭·저장 기준·실행 기록 타입
- Node.js IDE·환경 파일 조회·패키지 설정/코드 탭 연결: 파일 초안·선택 노드·API 타입
- Node.js 서비스 설정 백업/복원·변경·중단 복구: 등록 상태와 복구 필요 여부의 구별 타입
- Node.js 앱 및 작업 폴더 환경 파일 조회·저장·복원: 현재 연결과 파일/입력값에 확인을 결속
- Node.js 서비스 시작/중지/재시작·자동 시작 제어와 환경 파일 백업/복원: 계획·응답·확인 상태 타입
- Node.js 앱 로그 조회와 환경 파일 불러오기: 응답·입력 이벤트·검토 값 타입
- MariaDB·Redis 백업/복원·GUI 설정 적용/검수·include 연결 조회, API 교체 시 이전 그래프/응답 차단
- 공통 Button/IconButton/Checkbox/Radio/Switch/NativeSelect/CustomSelect/TextInput/Badge/Progress, IDE 분할 패널, 테마 토글
- 컴포넌트 예제 페이지 및 인증·작업·트리 상태 저장 API 라우트
- `npm run typecheck` (컴파일 캐시를 소스 폴더에 남기지 않음)
- 검수 빌드 스냅샷에 tsconfig 및 Next 환경 타입 파일 포함
- 변경된 파일의 기존 SWC 테스트는 TypeScript 파서 사용

## UI 전환 완료

`app`의 모든 페이지/API 라우트와 `components`의 77개 UI 모듈은 TypeScript이다. 해당 경로에 JavaScript/JSX 파일은 남지 않았다. 서버 도메인과 관리·검수 스크립트는 별도 전환 중이므로 전체 완료로 판정하지 않는다.

## 공통 로직 전환

메뉴 경로·패키지 선택/필터/버전·상태 갱신·서비스 필터/진단·감사 표시·파일 탭과 코드 검색/들여쓰기/위치 저장 모듈을 TypeScript로 전환했다. 브라우저용 로직이며 관리자 helper의 실행 경로는 변경하지 않았다.

터미널의 출력 프레임·입력 큐·크기 변경 큐·조합 입력 표시 상태도 TypeScript로 전환했다. 출력 중복 방지, 유니코드 입력 순서, 탭 전환 중 조합 완료 및 폐기된 세션의 입력 차단 동작은 기존 회귀 검사로 확인한다.

터미널 표시 옵션·환경 저장·화면 캐시·세션 복구/스트림 병합도 TypeScript로 전환했다. 화면 캐시는 xterm 인스턴스·FitAddon·출력 위치를 같은 타입으로 연결하며, 로그아웃 뒤 늦은 보관 요청과 닫힌 탭의 복구를 차단한다.

nginx 트리의 펼침 상태·노드 의미 키·검색·include 문맥·코드 강조 토큰을 TypeScript로 전환했다. AST 타입을 공통 노드 모듈에서 UI에 공유하며, 없어졌거나 오래된 노드 키로 이동하지 않도록 호출부를 보완했다. 검색은 파일·노드의 순서와 원본 텍스트를 유지한다.

설정 변경 이력·차이 비교·미저장 보호와 nginx 코드 복구/승인도 TypeScript로 전환했다. 복구 대상 경로는 파일과 노드 의미 키의 구조를 검사하며, 잘못된 저장 키를 유효한 복구 대상으로 취급하지 않는다. 기존 편집 버퍼는 보존한다.

관리자 helper 런타임은 승인된 `.mjs` 이름을 유지한다. 빌드/검수 전용 변환기는 전환된 `.ts`를 ES2022 JavaScript로 내보내고, 허용된 정적 import만 `.mjs`로 연결한다. 설치된 helper는 TypeScript 로더·컴파일러를 사용하지 않으며, 패키지의 다이제스트는 생성된 실제 런타임 바이트에 대해 기록·검사한다. 최종 DEB 생성은 배포 단계까지 보류한다.

nginx 표시 파서·설정 이름 검사·서버 프리셋을 TypeScript로 전환했다. 파서가 AST 타입을 직접 반환하므로 UI의 AST 단언을 제거했다. 관리자 런타임에서는 기존 `.mjs` 이름으로 생성하며 Node 22에서 구문 트리·프리셋·복제·이동·값 비우기·블록 삭제 결과를 원본 TypeScript와 비교했다. 실제 nginx 운영 검수의 최종 기준은 계속 `nginx -t`이다.

nginx include 탐색·편집 허용 경로·전체 코드 반영·노드 복사/붙여넣기/이동을 TypeScript로 전환했다. include 결과는 지원/미지원으로 구분하며 발견된 파일의 타입을 유지한다. Node 22의 생성된 JavaScript 결과와 TypeScript 원본을 비교했고, 운영 파일 반영 전 검수 및 실패 시 복구는 기존 검사로 확인했다.

로그인 복귀 경로·인증 저장소 오류 분류·보안 기능 제한 판정·서버 페이지 세션 조회를 TypeScript로 전환했다. `/settings` 로그인 복귀 경로를 허용하고 쿼리 반복 값은 보존하며 URL fragment는 제거한다. 형식이 잘못된 정책 값은 기능을 활성화하지 않는다. 페이지 세션 조회는 서버 렌더링 하나 안에서만 공유한다.

API 요청 처리기를 TypeScript로 전환했다. 요청·응답·기능 제한 목록·작업 결과 계약에 타입을 연결하고 요청 본문은 `unknown`에서 JSON 객체로 좁힌다. 저장·터미널 함수의 기존 런타임 검증에 맞춰 호출 계약을 보완했다. 형식이 잘못된 예외는 유효한 오류 상태 코드와 문자열 응답으로 처리한다.

보안 설정 검증·버전 기반 저장·동시 저장 제한·감사 기록 저장/조회와 감사 페이지 커서를 TypeScript로 전환했다. 보안·감사 타입은 서버 모듈에서 UI로 공유한다. 새 TypeScript 저장 검사는 0700/0600 권한, 오래된 버전과 동시 저장 거부, 강제 감사 기록 및 옵션의 단일 값 확인을 검사한다. 테스트 실행기는 전환 중 `.test.mjs`와 `.test.ts`를 함께 실행한다.

시스템 로그 설정·버전 기반 저장·열린 파일 설명을 공유하는 flock 잠금과 터미널 실행 계획·시간 제한·크기 검증을 TypeScript로 전환했다. 잠금은 기존 레코드와 inode를 보존하며, 오류나 잠금 보유 프로세스 종료 후 다시 획득할 수 있는지 실제 프로세스로 검사했다. 기본 계정 셸의 인용과 PTY 출력도 기존 실행 검사로 확인했다.

터미널 CLI 조회·키 처리·클립보드 입력과 SSE 실시간 출력도 TypeScript로 전환했다. 클립보드 읽기·쓰기와 큐는 실제 세션 상태를 확인하고, SSE는 세션을 재확인하며 재접속 커서·대기 깨우기·종료 시 구독 해제를 유지한다. 실제 PTY/파이프 출력과 IME 조합·붙여넣기 순서를 기존 검사로 확인했다.

작업 폴더·파일 저장·터미널 프로세스/입출력/구독/크기/종료·환경 파일 교체를 처리하는 서버 모듈을 TypeScript로 전환했다. 전역 작업 상태는 명시적인 레코드로 유지하고 파일·작업 ID는 검증 후 사용한다. 파일 저장은 NUL·대체 문자·잘못된 유니코드 입력을 쓰기 전에 거부해 원본을 보존한다. 실제 작업 폴더·환경 파일 백업/복원·PTY와 세션 만료 흐름으로 검수한다.

외부 접속 설정·리스너 정보·실행 중 인증 origin·저장 잠금·재시작 요청도 TypeScript로 전환했다. 시작 스크립트의 독립 런타임은 고정 파일 목록에서 JavaScript로 생성하고, 관리자 helper의 파일 목록과 분리한다. 시작 스크립트·접속 설정·공통 경로·오류 분류 4개를 Node 22에서 TypeScript 로더 없이 확인했다. 실제 앱 서버 시작이나 서비스 재시작은 이 검사에서 수행하지 않는다.

계정 저장·scrypt 비밀번호 검증·Better Auth 초기화·세션 로그인/폐기/비밀번호 변경도 TypeScript로 전환했다. 기존 해시와 쿠키·세션 형식을 유지한다. 설치용 계정 설정 명령과 인증 모듈은 고정된 독립 런타임 목록에서 JavaScript로 생성하며, Node 22의 TypeScript 로더를 끈 상태에서 로그인·로그아웃을 검사했다. 계정 생성 CLI와 서비스 실행 계정 설정 CLI도 TypeScript로 전환했다. 서비스 계정 조회·설정은 기존 일반 계정 검사·파일 소유자 검사·데이터 보존·runuser 실행 절차를 유지하며, 설치용 출력 파일은 JavaScript로 생성한다. 공통 저장 경로와 서비스 계정 레코드/계획도 TypeScript이다. 전체 전환은 계속 진행 중이다.

nginx 지시문 입력 형식·값 검증·server 설정 코드 생성·기존 HTTPS 폼 변환·운영 버전 비교도 TypeScript로 전환했다. 스위치/선택/숫자 입력의 타입을 UI와 공유해 별도 타입 강제 변환을 제거했다. 기존 TLS/redirect와 지원하지 않는 지시문을 폼에서 손실하지 않는 검사는 유지하며, 관리자 helper의 설정 생성 모듈은 고정된 JavaScript 출력 이름으로 변환해 Node 22에서 검사한다.

패키지 설정 스키마·기본값·PostgreSQL/MariaDB/Redis 설정 조각 생성·단위 파싱·Node 실행 환경 생성·초안 저장도 TypeScript로 전환했다. 스키마 타입을 UI와 공유하고 패키지 종류는 실제 지원 키만 허용한다. DB 독립 런타임의 스키마/파서/생성 모듈은 Node 22에서 TypeScript 로더 없이 비교한다. 기존 번역 검사에서 Redis 포트의 TCP 비활성화 설명에 대한 직접 번역 누락을 확인했으며, 사용자의 한국어 우선 지시에 따라 다국어 후속 항목으로 보존한다.

PostgreSQL/MariaDB/Redis 전체 파일의 행 파서·값 문법 검사·행 갱신·사용자 항목 추가와 공통 설정 부분 교체도 TypeScript로 전환했다. 원본 행의 위치·원문 일치를 확인한 다음 원본에서 다시 읽은 이름·주석·간격·줄바꿈을 사용해 갱신한다. UI 설정 행 타입은 각 파서의 실제 출력 타입을 공유한다. 브라우저에서 Node 전역 없이 부분 교체가 작동하며, helper에 포함되는 PostgreSQL 행 편집과 부분 교체는 Node 22의 TypeScript 로더를 끈 상태에서도 검수한다.

Node 환경 파일의 제한된 변수 파싱·선택 항목 교체·저장 결과 확인·IDE 미완성 입력 유지·필드 비교도 TypeScript로 전환했다. Node 환경 값 타입을 UI에서 공유한다. 저장 결과에 지원하지 않는 비밀 변수·잘못된 값 타입·비정상 숫자가 있으면 기존 GUI 기준을 바꾸지 않고 안전한 안내를 반환한다. 미완성 입력은 원본 행과 그룹·중복 개수에 맞춰 유지해 다른 설정에 붙지 않도록 한다.

nginx 설정 도움말·직접 선택 문맥·블록 프리셋·모듈 예시·미완성 입력 보존과 복구도 TypeScript로 전환했다. 저장 입력과 프리셋 형식을 확인하고, 실제 입력 캐시를 UI와 같은 타입으로 공유한다. 처음 화면을 렌더링할 때 저장 캐시를 복구하며, 코드 변경에 맞지 않는 입력은 다른 노드로 넘기지 않는다. HTTP·stream·MIME·map·geo·events·TLS 문맥 및 지시문 순서/공식 문서 링크를 기존 회귀 검사로 확인한다.

nginx proxy·TLS·upstream·main·HTTP core·stream/mail·map/geo·운영 지시문 카탈로그 8개도 TypeScript로 전환했다. 행 데이터는 명시적인 튜플로 선언하고 프리셋·도움말의 반환 타입을 공통화했다. 항목 문맥·편집 예시·기본값·공식 문서 링크와 설명 내용은 유지한다. 번역 원문 검사와 테스트 fixture는 실제 `.ts`/`.mjs` 파일 이름을 모두 확인해 전환 후 카탈로그를 누락하지 않는다.

cron 기본 일정 생성·해석·시간대 관찰·% 입력 구분자 확인과 Certbot 고정 인수 구성·webroot 경로 검사·실행 순서·실패 안내도 TypeScript로 전환했다. 인증서 명령은 선택한 nginx/webroot/standalone·갱신 대상·hook 옵션을 유지하고, ACME 요청 전 승인·웹 루트·nginx 백업 순서를 검사한다. 실행 모듈의 설치용 JavaScript는 Node 22에서 가짜 내부 hook만 사용해 검수하며, 실제 인증서 발급이나 서버 설정 변경은 수행하지 않는다.

관리자 helper의 동작 목록·JSON 출력 수집·오류 프로토콜·한국어 오류 변환·Certbot 스트림/로그/백업 후보·직렬 진행 기록도 TypeScript로 전환했다. JSON 입력은 검증 뒤 사용하며, 바이트 한도·한글/emoji 조각·완료 전 진행 기록 쓰기 순서·실패 시 잠금 보존을 유지한다. 관리자 실행 목록과 검사 도구는 소스의 `.ts` 이름과 설치용 `.mjs` 출력 이름을 구분해 전체 의존성과 진단을 검사한다.

관리자 권한 활성화·helper 경로/소유자/권한/해시 검사·고정 sudo argv·실행 시간 제한·하위 프로세스 출력/오류 전달도 TypeScript로 전환했다. helper 응답은 JSON 객체만 허용하고, 비정상 응답이나 종료 신호를 성공으로 처리하지 않는다. API의 작업 결과 타입은 서비스 목록 응답도 포함할 수 있도록 연결했다. 타입 오류 우회를 위한 `any`나 오류 무시 옵션은 추가하지 않았다.

Node 앱 프로필·등록 목록 저장·파일 상태·런타임 버전·systemd unit 생성·서비스 검토/변경 요청도 TypeScript로 전환했다. UI의 앱 프로필과 서비스 옵션 타입은 서버와 공유한다. 폴더·상대 실행 파일·환경 파일·UID·재시작 옵션은 검증 뒤 사용하고, 런타임 조회 중 등록이나 파일이 바뀌면 기존 검토를 거부한다. 설치용 unit 생성 코드는 Node 22에서 TypeScript 로더 없이 검수하며, 실제 시스템 서비스 설치·시작은 이 검사에서 수행하지 않는다.

설치 출력 디코딩·줄 경계·설치 상태 저장/조회·실행 소유자 관찰·패키지 조회와 설치 그룹 판정·조회 캐시도 TypeScript로 전환했다. UI는 실제 설치 기록 타입을 공유한다. 원래 허용한 최대 한글/JSON 이스케이프 로그 기록이 조회 한도를 넘던 문제는 저장·조회 한도를 함께 16 MiB로 맞추고, 넘는 저장은 기존 파일을 교체하기 전에 거부하도록 수정했다. PID/부팅/시작 식별자가 불명확한 작업은 검토 안내만 붙이고 잠금이나 실행 상태를 자동 정리하지 않는다.

PostgreSQL HBA 규칙 파싱·따옴표 처리·행 편집/추가/삭제/이동·미완성 입력 유지·검수 계획/결과 해석도 TypeScript로 전환했다. 규칙과 raw/include의 구분 타입을 UI에서 공유한다. 검수 결과는 검토한 파일·줄·인증 방식 또는 고정 오류 분류만 반환하며, 인증 옵션이나 원시 PostgreSQL 오류는 노출하지 않는다. 설치용 결과 해석 코드는 Node 22에서 TypeScript 로더 없이 검사했고 실제 DB 접속이나 운영 reload는 수행하지 않았다.

빌드 작업 폴더 생성·고정 런타임 목록·TypeScript→JavaScript 변환 도구도 TypeScript로 전환했다. 관리자 helper 폴더의 CommonJS 실행 방식은 유지하고 ESM 도구는 `.mts`로 구분한다. 변환 시 AST·문자열·바이트 위치를 검증하며, 설치용 출력 이름과 고정 의존성 목록은 유지한다. Node 22에서 TypeScript 로더 없이 생성된 인증·DB·nginx·Certbot·Node 런타임을 검사한다.

cron 입력 저장·커널 잠금과 Node 앱 로그/서비스 상태/데몬 목록 조회도 TypeScript로 전환했다. 잠금 작업의 반환 타입을 보존하고 알 수 없는 오류는 코드 검사 뒤 분기한다. 서비스 상태는 고정 속성만 반환하며 등록 목록과 조회 대상/버전 검사를 유지한다. 실제 잠금 소유자 강제 종료·비정상 파일 거부와 Node 22 JavaScript 실행을 검수했고 운영 crontab은 변경하지 않았다.

관리 작업의 초기 의도·진행 기록·완료 이력·중단 복구 조회와 nginx/Certbot/cron 서버 도구도 TypeScript로 전환했다. 디스크의 JSON은 unknown으로 받아 필드·고정 argv·상태·날짜·로그·종료 값을 검증한 뒤 공개 타입으로 반환한다. 진행 기록의 저장 순서·완료 후 갱신 거부·독점 공개·비정상 종료 잠금 보존을 유지한다. 허용되는 최대 JSON 이스케이프 로그가 저장 후 조회 한도를 넘지 않도록 저장과 조회의 한도를 32 MiB로 맞추고 최대 크기 회귀 검사를 추가했다. Node 22에서 생성된 작업 이력 모듈의 중단/완료 조회를 실제 파일로 검사했다.

작업 폴더와 등록 Node 앱의 환경 파일 조회·부분 편집·백업 목록·복원 계획·복원 실행도 TypeScript로 전환했다. 백업 JSON은 unknown으로 받아 UUID·경로·텍스트·크기·해시·날짜를 검증한 뒤 값을 사용한다. 지원 값 조회는 실제 환경 키만 허용하고, 등록 앱 파일의 ready 상태에서도 버전·파싱 값·제외 수가 있는지 확인한다. 폴더/파일 소유자·심볼릭 링크 거부·버전 재검토·비밀 변수 보존·복원 후 재시작 분리는 유지한다. 오래된 UI 성공 응답 fixture를 실제 지원 키로 맞추고 잘못된 성공 응답이 편집기를 갱신하지 않는 회귀 검사를 추가했다.

AI 설정 저장·업체별 요청 생성/응답 추출·모델 갱신/정렬·추론 수준·로그 분석도 TypeScript로 전환했다. API 및 저장 JSON은 unknown으로 받아 확인하며 모델 목록의 비정상 항목은 사용하지 않고 응답의 실제 문자열만 분석 결과로 취급한다. 기존 비활성 기본값·키 비공개·같은 전송 대상에서만 키 유지·버전 충돌·명시적 전송 동의·단일 요청·로컬 LLM 설정 동작은 유지한다. 합성 키·로컬 HTTP fixture·주입 응답으로 검사했고 Node 22에서도 실제 외부 fetch를 차단한 상태로 생성된 JavaScript를 검수했다. 실제 업체 API는 호출하지 않았다.

운영 설정 변경 계획·수동 백업 요청·nginx 적용/복원 요청 검토·sudo 정책 생성/해석/변경 요청·nginx 검수 로케일도 TypeScript로 전환했다. 입력은 unknown으로 받아 허용 필드·버전·확인·프로세스 식별 정보·고정 helper 작업·로케일을 검증한다. DB 설정 계획은 파일과 include 그래프를 조회 전후 비교하며 아직 저장/실행한 것으로 표시하지 않는다. 설치용 helper 출력 이름은 `.mjs`로 유지했고 sudo 정책/로케일 생성 코드는 Node 22에서 검수했다. 실제 권한 규칙과 운영 서비스는 변경하지 않았다.

nginx 설정 파일/블록 트리 조회·계정별 펼침 상태 저장과 관리 사이트/공개 인증서 상태 조회도 TypeScript로 전환했다. 실제 트리 파일과 인증서 타입을 UI와 공유한다. 파일/디렉터리 링크 제한·조회 크기/UTF-8/변경 검사·고정 Certbot 공개 옵션만 조회·인증된 계정별 상태 분리와 첫 SSR 반영을 유지한다. 공개 인증서 유효 기간 분류는 로컬 합성 자체 서명 인증서로 검수했고 실제 인증서 발급이나 운영 서비스 변경은 수행하지 않았다.

설정 변경의 immutable write-ahead 기록과 작업 잠금 모듈도 TypeScript로 전환했다. 기록 JSON의 정확한 필드·해시·원본/후보 파일 식별 정보를 검사하고 파일 바뀜·권한·링크 검사를 유지한다. 관리 helper의 상속 커널 잠금 정보는 unknown으로 받아 frozen/고정 descriptor/파일 식별 정보와 marker를 검토하며, 일반 호출의 디렉터리 잠금과 알 수 없는 기존 잠금 보존을 유지한다. 공통 오류 코드 판정 모듈을 고정 helper 의존성 목록 양쪽에 포함해 정확한 closure와 manifest 검사를 일치시켰다. Node 22에서 생성된 기록/잠금 코드의 생성·조회·복구 필요 안내·삭제·경합 거부를 격리 파일로 검사했다.

공통 설정 트랜잭션의 후보 검수·백업·기록 생성·원자 교체·활성화·원복·명시적 중단 복구도 TypeScript로 전환했다. 검수/활성화/복구 hook의 입력·비동기 결과와 파일 스냅샷/소유자/중단 기록 타입을 연결한다. 저장 JSON은 unknown으로 받은 뒤 원본 대상·해시·텍스트를 확인하고, 외부 편집을 원복으로 덮지 않는 절차를 유지한다. 생성된 helper JavaScript는 Node 22에서 실패 원복→복구 안내 유지→명시적 복구→재적용까지 실제 격리 파일과 합성 hook으로 검사했다. 실제 서비스 명령은 실행하지 않았다.

PostgreSQL/MariaDB/Redis 운영 설정 검색·안전한 파일 읽기·지원 값 조회·권한 오류일 때 제한된 helper 원문 조회와 MariaDB 그룹 이름 추출도 TypeScript로 전환했다. 운영 설정 파일 타입을 UI와 공유한다. 고정 경로·부모 디렉터리/파일 링크 거부·일반 파일/크기/UTF-8/변경 검사·HBA/Redis 권한 부족 선택 유지·MariaDB alternatives 중복 제거를 유지한다. 원문 helper 조회는 정확한 경로와 명시적인 sudo 옵션이 필요하며 다른 패키지나 경로로 확장하지 않는다. 생성된 조회 코드는 Node 22에서 합성 Redis 파일의 공개 값만 반환하고 링크를 거부하는지 검사했다. 실제 DB/서비스는 변경하지 않았다.

PostgreSQL 클러스터 식별·검색·서비스 상태 조회와 MariaDB/Redis/nginx 시작 설정 범위 검토도 TypeScript로 전환했다. 실행 인수와 systemd 기록 JSON을 unknown으로 받아 정확한 main·PID·고정 옵션을 검토하며 프로세스 인수나 인증정보는 반환하지 않는다. PostgreSQL 상태 조회는 고정된 한 번의 systemctl show 요청으로 대상을 중복 제거하고, 정상 비제로 출력의 개별 관측은 보존하되 시간 초과/신호 중단 때는 불완전한 상태를 폐기한다. 서비스 상태 타입을 운영 설정 조회와 공유한다. Node 22에서도 합성 인수·주입 상태 출력으로 검사했고 실제 서비스 변경 명령은 실행하지 않았다.

nginx/Redis/PostgreSQL 검수용 작업 폴더와 관리자 native 실행 도구도 TypeScript로 전환했다. 경로/접두사/소유자/권한과 Redis Unix socket 길이 제한을 유지한다. 실행 context는 unknown으로 받아 frozen/FD/소유자 검사를 거치며 콜백·Promise child·문자열/Buffer·동기/비동기·출력 한도/시간 초과 타입을 연결한다. 실제 합성 하위 프로세스 검사에서 부모 SIGKILL 이후 native 명령 종료까지 커널 잠금 유지와 FD 비노출을 확인했다. Node 22 검사 fixture의 인수 없는 Node 입력 대기는 종료한 뒤 즉시 완료되는 명령으로 수정했고 실패 로그를 별도로 보존했다. 실제 운영 서비스는 변경하지 않았다.

nginx 전체 파일 교체·검수 출력 경로 격리·오류 분류·격리 HTTP 초안 검수도 TypeScript로 전환했다. 검토한 텍스트/대상 경로를 고정해 후보 검수 hook과 그래프 재검토에 전달하고, 필수 native hook/백업 경로를 확인한다. 후보 변조·원본 버전 충돌·실패 원복·서로 다른 파일의 그래프 잠금 직렬화를 유지한다. 검수 진단은 unknown으로 받아 고정 원인 안내만 반환하며 원시 경로/환경/설정 오류는 노출하지 않는다. Node 22의 설치용 JavaScript는 합성 후보 검수/원복 hook으로 검사했고 실제 nginx 서비스 변경은 수행하지 않았다.

Redis 후보 복사/등록/무결성 재검토·자원 메타데이터·전체 후보 자원 검토·격리 실행 계획·namespace 계획도 TypeScript로 전환했다. 원문과 비밀 값을 공개 자원 결과에 넣지 않고, 후보 변경과 새 include 구성은 스냅샷 비교로 거부한다. 등록된 후보/계획만 재사용하며 원래 데이터 경로는 빈 namespace 디렉터리로만 계획하고 운영 데이터 바인드는 추가하지 않는다. 실행 계획은 실행/격리/영속성 검수 성공을 의미하지 않는 상태를 유지한다. Node 22에서 복사·변조 거부·계획 검토를 확인했으며 Redis 실행이나 마운트는 수행하지 않았다.

Redis 실행 파일 fingerprint/재검토·sandbox wrapper 확인·승인된 coreutils id alias·검수 프로세스 관리/adapter·격리 불가 오류 전달도 TypeScript로 전환했다. 실행 파일 bytes/hash/inode/소유자/권한과 제한된 alias/hardlink 정책을 유지하고, 계획/실행 파일 재검토 뒤에만 가짜 또는 native launch hook을 호출한다. 프로세스 error는 종료로 추정하지 않고 SIGTERM/필요 시 SIGKILL 이후 close를 기다리며 foreign handle은 거부한다. Node 22에서 합성 파일과 EventEmitter 자식으로 검사했고 실제 Redis/bubblewrap은 실행하지 않았다.

Redis 등록된 검수 runtime 생성/재검토/정리·소켓 준비 확인·후보 검수 생명주기·sandbox 검토/실행 연결도 TypeScript로 전환했다. runtime inode/소유자/허용 출력/권한을 검사하며, 소켓의 PONG/NOAUTH는 준비 여부만 반환하고 원시 응답이나 인증 성공으로 취급하지 않는다. 초기 검토·실행 파일 변경 거부·ready 시간 제한·stop 이후 정리·정리 실패 시 실패 반환을 유지한다. Node 22에서 개인 Unix 소켓과 합성 sandbox 자식으로 전체 흐름을 확인했고 실제 Redis/bubblewrap 실행은 수행하지 않았다.

Redis 적용/원문 코드/복원 요청과 PostgreSQL 원문 코드/백업 조회·생성 요청 검증도 TypeScript로 전환했다. 입력은 unknown으로 받아 허용 필드·정확한 main 경로·파일/그래프/서비스 버전·확인·원문 크기/줄바꿈을 검사한 뒤 제한된 요청을 반환한다. 검토 해시는 반환할 요청 스냅샷으로 한 번 계산해 비교하며 원문/그래프/서비스가 바뀐 이전 승인은 거부한다. 복원 요청은 검토한 버전만 가진 frozen 객체를 유지한다. Node 22에서 순수 요청·해시 검증을 검사했고 실제 DB나 서비스는 변경하지 않았다.

Redis/MariaDB 단일 설정 파일의 개인 백업 저장과 MariaDB 복원용 백업 읽기·PostgreSQL 전체 설정 그래프 백업 생성도 TypeScript로 전환했다. 원본 hash/identity·저장 폴더 inode·staging 파일 권한·단일 링크·변경 감지를 재검토하며 다른 프로세스 편집이나 폴더 교체는 저장 전에 거부한다. MariaDB 백업 JSON은 unknown으로 받아 문자열 대상·원문 크기·버전 hash·날짜를 확인한다. 저장 반환은 메타데이터만 포함하며 비밀 원문은 개인 파일에만 보존한다. Node 22에서 합성 파일의 백업/읽기/오래된 버전/대상 누락을 검사했고 실제 DB나 서비스는 변경하지 않았다.

Redis·Node.js 서비스·nginx 설정 백업 읽기와 공개 목록도 TypeScript로 전환했다. JSON은 unknown으로 받아 대상·날짜·원문 hash와 개인 파일 권한을 확인하며 목록에는 원문과 비밀 값을 넣지 않는다. Node.js 서비스 옵션은 공통 검증기로 정규화하고 관리 unit 원문과 일치해야 한다. 관련 검사 32개와 Node 22 변환 실행 검사 1개, 엄격 타입 검사, 현재 소스 빌드 및 HTTP 검사 36개가 통과했다. 실제 서비스·DEB는 변경하지 않았다.

Node.js 관리 서비스 제어·설정 변경·선택 백업 복원·중단 거래 복구도 TypeScript로 전환했다. 입력은 unknown으로 받고 호출 계정과 관리 unit 원문·유효 systemd 계정/추가 설정·버전·백업 변경을 검토한다. 후보 검수 전후 inode/hash 비교와 실패 원복, 동시 편집 보존 및 수동 복구 기록을 유지한다. 서비스 복원/복구는 실행 앱을 재시작하지 않는다. Node 22에서는 변환된 JavaScript로 기존 제어/변경/복원/복구 검사 15개를 합성 unit과 백업에서 실행했고, 전체 관련 검사 79개·엄격 타입·최신 빌드·HTTP36이 통과했다. 한국어 안내 누락과 중첩 테스트 출력 환경 문제의 실패 기록을 보존하고 수정 후 다시 확인했다. 운영 systemd·DEB는 변경하지 않았다.

nginx include 연결 그래프·관리자 서비스/locale 컨텍스트 확인·백업 복원 계획·복원 실행도 TypeScript로 전환했다. 그래프 파일·디렉터리·연결·경고에 명시 타입을 두고 읽기 전후 파일 identity/내용 크기/소유자/권한과 디렉터리 목록 변경을 확인한다. 내부 sites 심볼릭 링크와 canonical override는 유지하며 외부 Certbot 공개 options만 읽기 전용으로 포함한다. 복원 계획은 기본 메타데이터만 공개하고 승인된 경우에만 원문 diff를 제공하며 선택 백업 대상과 현재 그래프를 다시 검토한다. 관리자 locale 확인은 live libc 관찰 증거로 주장하지 않는다. Node 22 변환 실행에서 기존 그래프/컨텍스트/복원 검사 10개를 합성 파일과 명령으로 확인했다. 관련 검사 33개·타입·현재 빌드·HTTP36이 통과했으며 운영 nginx/systemd와 DEB는 변경하지 않았다.

nginx 개인 후보 생성·후보 무결성 검토·격리 후보 검수·운영 검수/재적재 hook·검토된 적용 조합·적용 실행도 TypeScript로 전환했다. 후보 bundle/파일 snapshot/명령 hook에 명시 타입을 두고 실제 등록된 객체만 재검토한다. 복제한 bundle과 null은 거부하며 include 패턴·PID/로그 출력 격리·Certbot 공개 options namespace 복사와 정리 동작을 유지한다. 검토 입력은 복사해 그래프/서비스 식별/locale 확인과 후보 검수 전후에 재검토하며 운영 검수 실패 및 재적재 실패의 기존 원복을 유지한다. Node 22 변환 실행에서 기존 후보/검수 hook/적용 검사 14개를 합성 파일과 명령으로 확인했다. 관련 검사 44개·타입·최신 빌드·HTTP36이 통과했으며 운영 nginx/systemd와 DEB는 변경하지 않았다.

nginx 서비스 PID/프로세스 시작값·환경 locale 조회·컨텍스트 조회·사이트 파일/링크 목록·중단 설정 복구도 TypeScript로 전환했다. manager 출력과 locale 입력은 unknown으로 받고 고정 필드만 분석하며 공개 컨텍스트에 argv/관련 없는 환경/원시 진단을 포함하지 않는다. 사이트 목록은 bounded scan을 두 번 수행해 원본 및 링크 변경을 거부하고 깨진/외부/불안전 링크와 실제 include 여부를 구분한다. 중단 복구는 journal/백업/현재 및 원래 그래프/서비스 식별 해시를 재검토하며 후보 검수와 운영 검수 뒤에만 합성 재적재 hook을 호출한다. 실패 시 journal과 동시 편집을 보존한다. 관련 검사 52개·Node 22 변환 실행 내 검사 14개·타입·최신 빌드·HTTP36이 통과했으며 운영 nginx/systemd와 DEB는 변경하지 않았다.

nginx 사이트 활성화/비활성화 요청과 실제 심볼릭 링크 작업·중단된 링크 복구도 TypeScript로 전환했다. 요청은 허용 필드와 대상/링크 경로·사이트 및 그래프 hash·확인을 검사한 후 독립 스냅샷을 반환한다. pending JSON은 unknown으로 받아 kind/ID/단계/경로/hash/이전 링크 값을 검증하고 공개 복구 목록에 내부 링크 원문을 노출하지 않는다. 원본/연결 목록과 include 도달성을 재검토하며 충돌 파일은 덮어쓰지 않는다. 기존 링크 문자열 보존·검수 실패 원복·재적재 실패 후 복구 및 중단 기록 보존을 유지했다. 관련 검사 37개·Node 22 변환 실행 내 검사 10개·타입·최신 빌드·HTTP36이 통과했으며 운영 nginx/systemd와 DEB는 변경하지 않았다.

Node.js 서비스 새 unit 설치·앱 파일/환경 파일 계정 및 hash 확인·고정 native systemd hook도 TypeScript로 전환했다. 입력은 unknown으로 받아 비-root caller UID와 두 개의 정확한 파일 경로/version을 검토하고 환경 비밀 값을 반환하지 않는다. unit 후보 검수 전후 inode/hash와 exclusive link 발행을 확인하며 충돌 unit은 덮어쓰지 않는다. 설치 실패 시 이번 작업의 inode/hash가 일치하는 unit만 제거하고 동시 외부 교체는 보존한다. 설치는 서비스를 시작하거나 부팅 자동 실행으로 설정하지 않는다. 관리자 상태 파서는 중복/알 수 없는 필드와 누락을 거부하며 명령은 고정된 실행 파일/argv를 유지한다. 관련 검사 44개·Node 22 변환 실행 내 검사 7개·타입·최신 빌드·HTTP36이 통과했으며 운영 systemd와 DEB는 변경하지 않았다.

Redis include 그래프·서비스 식별·컨텍스트 조회·후보 검수/서비스 hook·중단 작업 복구도 TypeScript로 전환했다. 그래프 파일/디렉터리/연결/경고에 명시 타입을 두고 제한된 include 경로와 디렉터리 목록 재검토를 유지한다. PID/UID/시작값/실행 파일 확인과 같은 PID의 안정된 systemd 시작 기록을 검토하며 공개 출력에서 argv/비밀 값/원시 진단을 제외한다. 복구는 journal/백업/현재 및 원래 그래프/계정 식별 검토를 다시 수행하고 후보 변조, 서비스 계정 변경 및 include 변경 시 실패 기록을 보존한다. 관련 검사 46개·Node 22 변환 실행 내 검사 18개·타입·최신 빌드·HTTP36이 통과했으며 운영 Redis/systemd와 DEB는 변경하지 않았다.

Redis 설정 적용·선택 백업 복원·검토된 적용 및 격리 검수·전체 코드 적용 계획/실행도 TypeScript로 전환했다. hook과 후보/논리 그래프를 명시 타입으로 연결하고 원본·후보·적용 후 graph hash 및 선택 main/백업/코드 검토 버전을 재검사한다. 새 include 파일이나 후보/백업 변조는 교체 전에 거부한다. unknown 오류는 상태·코드를 안전하게 분류하고 원시 native 진단을 공개하지 않으며 정리 실패 시 후보를 보존한다. 서비스 활성화 실패 원복과 동시 외부 main 편집 보존을 유지했다. 관련 검사 50개·Node 22 변환 실행 내 검사 19개·타입·최신 빌드·HTTP36이 통과했으며 운영 Redis/systemd와 DEB는 변경하지 않았다.

MariaDB include 그래프·개인 후보 생성/무결성 확인·후보 검수 연결·namespace 격리 옵션 검수도 TypeScript로 전환했다. 그래프/후보 snapshot/고정 명령 hook에 명시 타입을 두고 등록된 후보만 재검토한다. CRLF와 비밀 원문을 개인 파일에 보존하며 include 경로·복원 원문·후보 변화와 stale graph를 거부한다. namespace 명령은 고정 실행 파일/argv와 private 후보의 읽기 전용 연결만 계획하고 운영 데이터 경로는 연결하지 않는다. 실행 파일 fingerprint를 명령 전후 재검토하며 원시 defaults 출력은 필터하고 요청한 값이 최종 옵션과 같아야 한다. 관련 검사 56개·Node 22 변환 실행 내 검사 14개·타입·최신 빌드·HTTP36이 통과했으며 실제 MariaDB/systemd/bubblewrap과 DEB는 실행/변경하지 않았다.

MariaDB 코드 요청/검토 hash·코드 검수/적용·설정 적용·중단 작업 복구도 TypeScript로 전환했다. 요청은 unknown으로 받고 허용 main/대상/원문 크기/확인/그래프 버전을 검토한 제한된 스냅샷에서 검토 hash를 한 번 계산한다. 서비스 경로 확인 함수의 반환도 문자열로 검증한다. 원본/후보/복원 그래프와 source hash를 적용 전후 재검토하고 재시작 실패 원복·동시 include 변경 보존·실패 journal 보존을 유지했다. 새 내부 오류 안내의 한국어 누락 실패를 보존하고 기존 한국어 서비스 안내로 수정했다. 관련 검사 59개·Node 22 변환 실행 내 검사 24개·타입·최신 빌드·HTTP36이 통과했으며 운영 MariaDB/systemd와 DEB는 변경하지 않았다.

PostgreSQL 설정 include 그래프·원본 source/권한 snapshot·개인 후보 생성·namespace 검수·검수 결과 조회도 TypeScript로 전환했다. 등록된 그래프/후보에 명시 타입과 private WeakMap 기록을 연결하고 파일 identity/내용·디렉터리 구성·선택적 include 부재를 재검토한다. 후보는 내부 include 경로만 읽기 전용 namespace 복사로 다시 쓰고 host 파일 소유자는 유지하며 정리 시 다른 디렉터리를 삭제하지 않는다. 고정 옵션 조회 명령만 계획하고 namespace UID/GID 및 실행 파일 fingerprint를 검사한다. 공개 출력은 고정 옵션 다섯 개만 포함하며 데이터 디렉터리/원문/진단 비밀을 공개하지 않는다. 관련 검사 33개·Node 22 변환 실행 내 검사 14개·타입·최신 빌드·HTTP36이 통과했다. 진단 검사는 Node 하위 프로세스로 수행했고 실제 PostgreSQL/bubblewrap과 DEB는 실행/변경하지 않았다.

PostgreSQL 자동 설정 fingerprint·실행 설정 조회·복구 대상 서비스 조회·클러스터 제어 요청도 TypeScript로 전환했다. 고정 root 디렉터리 FD에서 postgresql.auto.conf까지 내려가며 조상 디렉터리 identity와 파일 소유권/링크/내용 변화·부재 상태를 재검토한다. 실행 설정 JSON은 unknown으로 받고 public scalar 값과 비음수 정수 오류 개수만 반환한다. 서비스 조회는 고정 읽기 전용 SQL과 서비스 identity/자동 설정 두 번 확인을 유지하고 활성 unit의 조회 실패를 오프라인 복구 권한으로 바꾸지 않는다. 클러스터 제어 대상은 경로에서만 도출한다. 관련 검사 32개·Node 22 helper 변환 실행 내 검사 11개·타입·최신 빌드·HTTP36이 통과했으며 실제 PostgreSQL/systemd와 DEB는 실행/변경하지 않았다.

PostgreSQL HBA 참조 스캐너·파일 그래프·안전한 원문 읽기·개인 후보 계획/생성도 TypeScript로 전환했다. token/논리 줄/파일/연결/경고에 명시 타입을 두고 줄바꿈 연속 구문·인용된 파일명·목록 참조·optional include와 C 정렬을 유지한다. 파일/디렉터리/optional 부재 상태를 다시 확인해 mixed snapshot을 거부하고 등록된 그래프와 정확한 source bytes만 후보로 복사한다. 공개 그래프는 원문을 포함하지 않으며 후보 경로 변환은 native 진단 줄 번호를 보존한다. 관련 검사 40개·Node 22 변환 실행 내 검사 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 PostgreSQL/service와 DEB는 실행/변경하지 않았다.

PostgreSQL HBA 격리 명령 계획/실행·검수 요청 및 그래프 재검토·실행 클러스터 식별/조회/재적재 hook도 TypeScript로 전환했다. 고정 namespace argv·계정·시간 및 출력 제한을 유지하고 원시 진단은 안전한 원인 안내로 구분한다. private COPY 보고서는 확인된 FD에서 권한을 0600으로 제한한 뒤 읽고 불안전한 파일/부모는 변경하지 않는다. 서비스 조회는 postmaster PID metadata/OS 계정/실행 파일/Unix 소켓과 고정 읽기 전용 SQL을 확인하고 재적재 전후 기존 identity를 재검토한다. 관련 검사 50개·Node 22 변환 실행 내 검사 11개·타입·최신 빌드·HTTP36이 통과했다. 실제 PostgreSQL/systemd/bubblewrap과 DEB는 실행/변경하지 않았다.

PostgreSQL HBA 백업 저장/읽기/목록/복원 초안과 복원 서비스 기록 검증도 TypeScript로 전환했다. 백업 JSON은 unknown으로 받고 UUID/클러스터 경로/원문 hash/날짜/개인 파일 권한/단일 링크를 검사한다. 공개 목록은 검증된 메타데이터 필드만 반환해 추가 비공개 속성을 제외하며 실제 HBA는 초안 복원으로 변경하지 않는다. 서비스 복원 기록은 정확한 중첩 key 목록·main/HBA/클러스터 unit·scalar 값·PID/시작값/자동 설정 hash를 검사한 후 같은 객체를 반환해 기록의 내용과 key 순서를 보존한다. 관련 검사 128개·Node 22 변환 실행 내 검사 3개·타입·최신 빌드·HTTP36이 통과했다. 실제 PostgreSQL/service와 DEB는 실행/변경하지 않았다.

PostgreSQL HBA 작업 전 기록과 검토된 적용·중단 복구도 TypeScript로 전환했다. 기록 JSON은 unknown으로 받아 정확한 필드·파일 identity·hash·서비스 상태를 검사하고 개인 파일/단일 링크와 변경된 기록 삭제 거부를 유지한다. 교체 전후 파일 및 include 그래프·실행 서비스 identity를 재검토하고 재적재 실패 원복·동시 편집 보존·중단 기록 유지·확인된 복구를 유지했다. 관련 검사 109개·Node 22 변환 실행 내 적용/실제 소유 하위 프로세스 SIGKILL 복구 검사 16개·타입·최신 빌드·HTTP36이 통과했다. 기존 테스트의 source TS 및 배포 runtime MJS 참조 오류를 수정했고 최초 실패 로그를 보존했다. 실제 PostgreSQL/systemd와 DEB는 실행/변경하지 않았다. 서버 모듈은 250개 전환, 54개 미전환이며 전체 전환은 진행 중이다.

PostgreSQL 기존 설정 검수/활성화 hook·복원 디렉터리 FD 고정·설정 형식/선택값 메타데이터도 TypeScript로 전환했다. 허용 경로/변경 key/실제 옵션 값 비교와 클러스터 상태 확인을 유지하고 복원 경로의 모든 조상을 FD로 고정한 뒤 inode/소유권/모드를 재검토한다. 경로 교체·불안전한 자식 경로를 거부하며 디렉터리 handle을 실패 시 닫는다. unknown 설정명은 unrestricted 편집을 유지하고 BOOLEAN/enum 값과 빈 enum 인용을 보존한다. Node 22에서 JSON import 속성 소실을 발견해 공용 변환 도구가 속성을 보존하도록 수정했고 최초 실패 로그를 보존했다. 관련 검사 202개(기존 복구/설정 158개와 전체 TypeScript 검사 44개)·타입·Node 22·최신 빌드·HTTP36이 통과했으며 실제 PostgreSQL/systemd 및 DEB는 변경하지 않았다. 서버 모듈 253개 전환, 51개 미전환으로 전체 전환은 진행 중이다.

관리 sudo 규칙 조회·고정 native 계정/visudo 검수 hook·검토된 기존 규칙 갱신도 TypeScript로 전환했다. 요청과 native 출력은 unknown으로 받아 허용 필드·확인·hash·단일 계정 identity를 검사하고 공개 출력에 계정 DB 원문이나 규칙 원문을 포함하지 않는다. 파일 권한/소유권/단일 링크/교체 중 상태 변화 검사와 후보 검수 전후 내용/inode 확인을 유지하고 전역 정책 실패 원복 및 동시 관리자 편집 보존을 검증했다. 관련 검사 31개·Node 22 변환 실행 내 검사 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 sudoers/systemd 및 DEB는 변경하지 않았다. 서버 모듈 256개 전환, 48개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 데이터 실행 컨텍스트·custom archive 백업/복원 executor·helper dispatcher도 TypeScript로 전환했다. 요청/action/실행 서비스/카탈로그/native 출력/백업 JSON을 명시 타입과 unknown 검증으로 연결하고 공개 DB/백업 목록은 허용 메타데이터만 반환한다. cluster PID/시작값/DB OID/system identity 검토 hash, 확정된 socket/계정/고정 실행 파일/argv와 제한된 환경, archive hash/크기·이름 확인·복원 전 undo 백업·실패 시 상태 미확인 안내를 유지한다. 개인 백업 파일·symlink 거부와 잘못된 확인 시 조회 차단을 fixture로 검증했다. 관련 검사 16개·Node 22 변환 실행 내 검사 8개·타입·최신 빌드·HTTP36이 통과했고 기존 설명 검사 source 경로 오류의 최초 실패를 보존했다. 실제 pg_dump/pg_restore/운영 DB 및 DEB는 실행/변경하지 않았다. 서버 모듈 259개 전환, 45개 미전환으로 전체 전환은 진행 중이다.

패키지 설치/인벤토리 coordinator·작업 터미널 보고서·helper 작업 라벨·설정 안내·코드 토큰도 TypeScript로 전환했다. 허용 패키지 key만 고정 apt argv로 만들고 설치 job에 명시 타입을 두어 실제 owner identity/순차 저장/완료 감사/실패 잠금 보존을 유지한다. 구조화된 설정 작업 결과만 terminal report에 포함하며 unknown 일반 job의 잘못된 command/status/log/exitCode를 제한된 값으로 처리한다. 코드 원문 token 연결·경로 식별자 보존·라벨의 권한 미확장도 확인했다. 관련 검사 78개·Node 22 표시 모듈 변환 실행 내 검사 12개·타입·최신 빌드·HTTP36이 통과했다. 설치 coordinator는 소유한 가짜 child로 검증했으며 실제 apt/운영 서비스 및 DEB는 실행/변경하지 않았다. 서버 모듈 264개 전환, 40개 미전환으로 전체 전환은 진행 중이다.

요청 단위 초기 console 조회·공용 shell의 브라우저 세션 유지·인증서 연계 nginx 백업·Node 환경 파일/복구 초안 목록·workspace tree도 TypeScript로 전환했다. 활성 상태·최근 사용자 활동·5분 제한·중복 갱신·10초 취소·정리 후 늦은 응답 무시를 유지하고 네트워크 실패를 만료로 취급하지 않는다. HTTP401은 JSON 해석 없이 만료 처리한다. nginx 백업은 include의 server 문맥/도메인과 그래프 hash를 확인하고 canonical 파일을 한 번씩 백업하며 완료된 메타데이터만 다음 백업/ACME 호출 전에 전달한다. Node 환경 목록은 안전한 경로와 실제 dirty Node 버퍼만 유지한다. 관련 검사 34개·Node 22 변환 실행 내 검사 19개·타입·최신 빌드·HTTP36이 통과했고 실제 ACME/운영 서비스 및 DEB는 실행/변경하지 않았다. 서버 모듈 269개 전환, 35개 미전환으로 전체 전환은 진행 중이다.

운영 서비스 조회/제어·로그 조회·cron 백업 생성/목록/복원 coordinator도 TypeScript로 전환했다. 서비스·로컬 백업·공개 관리자 백업 메타데이터·파일 handle 타입을 연결하고 unknown 요청/오류/helper 카탈로그를 검증한다. 고정 서비스/클러스터/로그 대상과 제한된 줄 수, 병렬 표준/DB/Node 서비스 조회 및 독립 실패 안내를 유지한다. cron 복원은 확인/기능 권한/backup hash/현재 cron hash/원본 undo 백업 후 설치 순서를 유지한다. 개인 임시 파일 sync/rename 발행, 중단 시 미완성 파일 목록 제외를 실제 소유 SIGKILL fixture로 확인했다. 관련 검사 89개·타입·Node 22 순수 JS 로컬 백업 및 운영 명령 차단 fixture·최신 빌드·HTTP36이 통과했고 진단 항목 개수 변경의 최초 실패를 보존했다. 실제 운영 서비스/cron 및 DEB는 변경하지 않았다. 서버 모듈 270개 전환, 34개 미전환으로 전체 전환은 진행 중이다.

기존 언어 초기 선택/cookie/방향·테마 초기화 문자열·Redis 옵션 이름/제안 목록·PostgreSQL/HBA/MariaDB/Redis 설정 설명도 TypeScript로 전환했다. bundled JSON catalog와 설명 dictionary에 명시 타입을 두고 unknown 설정명/언어 값을 검사한다. 기존 설명·한국어 도움말·영어 보충 안내·알 수 없는 옵션 미분류·별칭/폐기 옵션 구분·옵션 정렬을 유지했고 다국어 범위를 확장하지 않았다. 저장 locale 우선 적용·가중치/잘못된 언어 거부·초기 테마 storage 차단 처리도 유지했다. 관련 검사 71개·Node 22 JSON import 보존 변환 실행 내 검사 20개·타입·최신 빌드·HTTP36이 통과했고 API/OS/DEB는 변경하지 않았다. 서버 모듈 277개 전환, 27개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 여러 설정 파일의 개인 graph archive 생성/검증/등록과 복원 후보 재구성/격리 검수 coordinator도 TypeScript로 전환했다. archive/reference/source/소유권/graph에 명시 타입을 두고 JSON은 unknown으로 받아 중첩 schema·개수/크기·경로·C 정렬·원문 hash·include 그래프 hash를 검사한다. 실제 운영 자원 검증을 수행하지 않은 graph의 임의 검증 주장도 거부한다. 원본 CRLF/비밀/한글·참조 디렉터리/optional 부재와 private FD identity·단일 링크·권한·동기화를 유지하고 WeakMap에 등록된 변경되지 않은 기록만 복원 후보로 재구성한다. 정리 시 경로가 교체되면 외부 내용을 보존한다. 관련 검사 173개·Node 22 변환 실행 내 검사 14개·타입·최신 빌드·HTTP36이 통과했고 실제 PostgreSQL/service/bubblewrap 및 DEB는 실행/변경하지 않았다. 서버 모듈 279개 전환, 25개 미전환으로 전체 전환은 진행 중이다.

남은 Redis include 트리/선택 파일 메타데이터·관리자 main 검토/검토된 실행 조회·native 검수 adapter 조합도 TypeScript로 전환했다. 재귀 노드에 명시 타입을 두고 missing/cycle/깊이32/노드512 제한을 유지한다. 검토 입력은 unknown으로 받고 PID/UID/시작값/main/graph hash/확인을 검사해 관리자 확인과 실제 startup argv 관찰을 구분한다. 조회 전후 graph 변화와 검토 후 입력 변경을 거부한다. 등록된 후보와 동결된 plan argv·실행 파일 fingerprint·독립 자원 검토를 확인한 후에만 가짜 프로세스 시작/정리 단계로 연결되는지 검증했다. 관련 검사 66개·Node 22 변환 실행 내 검사 8개·타입·최신 빌드·HTTP36이 통과했고 실제 Redis/systemd 및 DEB는 실행/변경하지 않았다. 서버 모듈 282개 전환, 22개 미전환으로 전체 전환은 진행 중이다.

공용 i18n core·서버 catalog·브라우저 lazy loader와 provider 번역 함수 overload도 TypeScript로 전환했다. catalog/interpolation/비동기 pending 값에 명시 타입을 두고 문자열 이외 입력 보존·경로/진단/치환값 보존·저장 언어/JSON import/동시 lazy 조회 재사용을 유지한다. catalog와 loader의 상속된 constructor/__proto__/toString 속성을 실제 항목으로 취급하지 않도록 수정했고 경계 검사를 추가했다. 타입·Node 22 변환 실행 내 검사 16개·최신 빌드·HTTP36이 통과했다. 외부 회귀는 75개 중 74개 통과이며 기존 Redis 포트 설명의 직접 번역 누락 1개는 DEFERRED_KOREAN_FIRST로 다시 기록했다. 전체 다국어 통과로 주장하지 않는다. 최초 Node22 fixture 참조 실패도 보존하고 수정했다. API/OS/DEB는 변경하지 않았다. 서버 모듈 285개 전환, 19개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 실행 서비스/scope/공개 검수 값 검증·내부 dependency 구성·전체 코드 계획/적용 coordinator도 TypeScript로 전환했다. owner UID·고정 restart hook·서비스 metadata에 명시 타입을 두고 unknown 서비스/검수 응답을 검사한다. PID/시작값·클러스터 경로/unit/major·자동 설정 hash·설정 오류 개수·공개 값 5개를 확인하고 서비스 객체 identity 및 JSON 검토 hash를 유지한다. 검수 결과의 추가 비공개 값은 계획에 포함하지 않는다. graph/source/service 검토 변경 거부와 적용/원복/동시 외부 편집 보존을 확인했고 기존 수동 백업의 target 캡처도 typed 재조회로 연결했다. 관련 검사 158개·Node 22 변환 실행 내 검사 11개·타입·최신 빌드·HTTP36이 통과했다. 설명 검사의 이전 hba 백업 filename 참조 실패는 보존한 뒤 수정했다. 실제 PostgreSQL/systemd 및 DEB는 실행/변경하지 않았다. 서버 모듈 286개 전환, 18개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 복원 전 include 그래프의 replay generator와 private journal graph 비교 검증도 TypeScript로 전환했다. generator 요청/응답·파일/디렉터리/연결/필수 누락/문제 origin에 명시 타입을 두고 yielded 응답과 기록 tuple은 unknown으로 검증한다. 원문 hash·C 디렉터리 정렬·optional 부재·필수 누락·범위 밖 경로·순환/깊이/크기 제한을 유지하고 기록된 원본 소스/멤버 목록에서 다시 계산한 그래프의 정확한 JSON과 비교한다. 검증된 원래 graph 객체 identity를 유지했다. 관련 검사 162개·Node 22 변환 실행 내 generator/snapshot 검사 14개·타입·최신 빌드·HTTP36이 통과했고 실제 PostgreSQL/service 및 DEB는 실행/변경하지 않았다. 서버 모듈 287개 전환, 17개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 복원 스냅샷·등록된 file row/내부 context 접근도 TypeScript로 전환했다. 현재/후보 파일의 present/missing 상태를 구분하고 FD 전체 identity·권한 attributes·디렉터리 identity·멤버 목록·before graph·공개 변경 action·private context에 명시 타입을 두었다. 등록되지 않거나 바뀐 snapshot/원본 archive를 거부하고 file/parent/membership/permission/optional 출현 변화·원본 범위 밖 include·순환을 재검토한다. raw 내부 기록은 structuredClone으로 반환해 저장된 undo 원문을 변경할 수 없게 유지한다. 누락된 멤버 기록을 빈 목록으로 대체하지 않는다. 관련 검사 159개·Node 22 변환 실행 내 generator/snapshot 검사 14개·타입·최신 빌드·HTTP36이 통과했고 실제 PostgreSQL/service 및 DEB는 실행/변경하지 않았다. 서버 모듈 288개 전환, 16개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 복원 intent journal·완료 기록 보관과 조회를 TypeScript로 전환했다. 외부 JSON을 unknown으로 받아 v1/v2/v3 기록·원문 hash·파일 identity·디렉터리/멤버 tuple·before graph·service context를 검증하고, 등록된 기록과 private 완료 디렉터리의 FD custody를 유지한다. 기존 권한/변조/중단 저장 복구/legacy 기록/전체 PostgreSQL 검사 376개·Node 22 변환 실행 journal 검사 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 서비스와 DEB는 변경하지 않았다. 서버 모듈 289개 전환, 15개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 등록된 복원 검토·원래 설정 재구성 검수를 TypeScript로 전환했다. 신뢰된 archive/snapshot/service와 외부 hook 반환값의 검증 경계를 연결하고 검토 plan·실행 의존성·기록 identity에 명시 타입을 두었다. 검토 hash/원본 객체 등록·서비스/파일 변경 거부·공개 전후 값 순서·충돌 시 intent 보존을 유지했다. 원래 include 구성은 기록에서 private 작업 폴더로 재구성하며 현재 호스트 파일로 누락된 증거를 대체하지 않는다. 관련 검사 59개·Node 22 변환 실행 검사 43개·타입·최신 빌드·HTTP36이 통과했다. 실제 native 검수/서비스는 fixture로 대체했고 DEB는 변경하지 않았다. 서버 모듈 291개 전환, 13개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL swap 진행 기록을 TypeScript로 전환했다. 외부 JSON은 unknown으로 검증하며 v2/v3 단계·원본 이동/후보 연결/배치/원복/폐기 플래그 간 제약, 정확한 journal/stage 결합, 원문 digest·파일/디렉터리 identity·등록된 객체 검증을 유지한다. 기존 JS 단계 context 경계도 검증된 journal body·ready stage 항목·identity 타입으로 연결했다. 관련 검사 144개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 292개 전환, 12개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 복구/미발행 백업 조회·복원 전 undo 백업 발행·완료 기록 보관 조정자 3개를 TypeScript로 전환했다. private JSON의 원문/hash/시간/service scope/공개 값/원본 archive 연결을 unknown에서 검증하고 pinned FD·부모 권한·같은 inode의 발행 별칭 복구·단일/이중 링크 제약·검토 재확인과 중단 증거 보존을 유지한다. 관련 검사 66개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 빌드 동시 실행 중 Node 22 묶음의 30초 제한 실패를 보존했으며 빌드 종료 후 동일 검사는 약 9초에 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 295개 전환, 9개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 검토된 복원 실행·독립 중단 복구 서비스 조정자 2개를 TypeScript로 전환했다. 등록된 검토/journal 반환값·trusted service hook·검수 결과·실행 완료 결과와 예외 표식을 명시 타입/unknown 검증으로 연결했다. 후보 graph와 원래 service scope 재확인·재시작 전 상태·실패 시 원본 값 확인·보관 실패를 원본 복구 실패와 구분하는 동작을 유지한다. 관련 검사 66개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 진단 mock 변환기의 ECMAScript parser 실패를 보존하고 TypeScript parser와 실제 반환 계약으로 수정했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 297개 전환, 7개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 완료 기록 조회·백업 가져오기 모듈을 TypeScript로 전환했다. unknown 요청의 요약 조회/가져오기 overload·private 옵션·공개 기록 row와 확정된 완료 단계 타입을 연결했다. 원문을 공개하지 않는 100개 제한 요약·경고/정렬/잘림·기록 버전 확인·원래 include/권한/검수 값 재구성·기발행 또는 중단 발행 backup의 검증과 같은 inode 재시도를 유지한다. 관련 검사 66개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 298개 전환, 6개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 백업 복원 요청·검토·실행 dispatch 모듈을 TypeScript로 전환했다. unknown 입력의 검토용/실행용 overload·고정 proof key·backup/service 검증 context·private hook 옵션을 연결했다. 검토 hash 순서·backup 원문/identity 재확인·원래 service scope·graph/legacy 복원 분기·undo backup 생성·완료 기록 보관 여부를 유지한다. 공개 fields는 검수된 다섯 값의 원래 순서를 유지하며 service snapshot은 검증 후 접근한다. 관련 검사 79개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 299개 전환, 5개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL legacy 설정 및 include 그래프 중단 복구 요청 조정자 2개를 TypeScript로 전환했다. unknown 요청의 검토/실행 overload·trusted 복구 옵션·가동/중지/실패 서비스 상태 union·stage 준비/진행 기록 경계와 검수 결과를 연결했다. 원래 scope/자동 설정 버전·서비스 PID·동시 journal 충돌·원본/현재 graph·검토 hash 재확인과 준비 취소 시 서비스 재시작을 하지 않는 동작을 유지한다. 현재 파일 hash는 snapshot에서 검증된 값을 사용하며 누락을 빈 값으로 대체하지 않는다. 관련 검사 69개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 301개 전환, 3개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL include 그래프 파일 교체 실행기를 TypeScript로 전환했다. 고정 단계 데이터·필수 coordinator hook·파일 snapshot/attributes/identity·pinned 부모/보관 FD에 명시 타입을 연결하고 기존 단계 context의 unknown 검증을 공통 함수로 연결했다. 같은 stage/journal 결합·exclusive 진행 기록·rename/link checkpoint·전체 원복 preflight·멤버 목록·서비스 실패 시 원본 복구·충돌 시 보관 파일과 intent 보존을 유지한다. before 원본 identity와 필요한 후보 stage가 누락되면 검사를 중단하며 빈 값으로 대체하지 않는다. 관련 검사 144개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 302개 전환, 2개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 중단된 파일 교체 원복 실행기를 TypeScript로 전환했다. 파일 snapshot/identity·별칭 판정·pinned 부모/보관 FD·원복 관측 배열과 필수 coordinator hook에 명시 타입을 연결했다. 모든 target/undo/후보/폐기 파일의 preflight·멤버 목록·같은 inode의 승인된 이중 링크·v2 기록의 v3 전환·checkpoint 재조정·재시작 후 원본 검증과 충돌 시 증거 보존을 유지한다. 필요한 row/stage가 없으면 검사를 중단하고 낯선 파일/별칭을 삭제하지 않는다. 관련 검사 144개·Node 22 변환 실행 review 43개/journal 8개·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. 서버 모듈 303개 전환, 1개 미전환으로 전체 전환은 진행 중이다.

PostgreSQL 복원 임시 파일 관리 모듈을 TypeScript로 전환했다. preparing/ready/cleaning 단계·미완료 inode/전체 파일 identity·private ledger/cleanup 상태·부모/보관 FD와 요청 경계를 unknown 검증/명시 타입으로 연결했다. nullable 생성 디렉터리 identity는 기존 부모 pin API 타입에도 반영했다. 준비 재개·prefix 검증·변조/멤버/권한 거부·같은 부모의 취소 보관·legacy 기록 checkpoint 조정·낯선 파일 보존을 유지한다. 완료 저장 후 기록이 사라지면 검사를 중단하며 빈 기록을 만들지 않는다. 전체 PostgreSQL 검사 378개·Node 22 변환 실행·타입·최신 빌드·HTTP36이 통과했다. 실제 운영 서비스/DEB는 변경하지 않았다. app/components/lib의 JS/JSX/MJS는 0개이고 서버 모듈 304개가 TypeScript이다. 관리 스크립트 107개와 extensionless helper·기존 JavaScript 검사·전체 회귀·최종 설치/GUI 검수는 남아 있어 전체 완료는 아니다.

서버 시작·Next/TypeScript CLI 준비·Cargo 실행/경로·검사 실행기 5개 관리 스크립트를 TypeScript로 전환했다. npm 명령은 전환한 소스를 실행하며 설치 runtime 출력의 MJS 이름은 유지한다. CLI 준비도 고정 startup emitter에 연결했다. 서버 origin 계산에는 검증된 숫자 port를 전달한다. 검사 실행기는 선택 파일을 tests 목록으로 제한하고 기본 직렬 실행/선택 동시 실행 수 1~4·private 파일 목록/로그/결과와 실패 증거 보존을 지원한다. Node 22 변환 MJS의 시작/기존 CLI 보존/Cargo fixture 호출/검사 성공과 실패 증거, 실제 auth startup closure·네트워크 관련 검사 총 12개·타입·최신 빌드·HTTP36이 통과했다. Rust 빌드/실제 서비스/DEB는 실행하거나 변경하지 않았다. scripts는 TS 10개/MTS 2개/MJS 102개이며 전체 전환은 진행 중이다.

검수 작업 폴더·정확한 페이지 이동 assertion·현재 소스 빌드·진단 AST 탐색 4개 공통 도구를 TypeScript로 전환했다. AST와 영어 catalog를 unknown으로 검증하고 모호한 factory·동적 메시지를 완료로 오인하지 않는 동작을 유지한다. 진단 소스 목록은 TS/MTS/CTS도 실제 파싱하므로 전환된 서버 파일이 빠져 빈 목록이 되는 문제를 막는다. 관련 검사 17개·Node 22 변환 실행·타입·전환된 빌드 도구의 실제 빌드·HTTP36이 통과했다. 이전 operations/HBA 파일명 조합을 읽던 검사 실패 두 기록을 보존하고 TS 파일/파서로 수정했다. 운영 서비스/DEB는 변경하지 않았다. scripts는 TS 14개/MTS 2개/MJS 98개이며 전체 전환은 진행 중이다.

기존 언어 검사·비밀번호 hash CLI 두 스크립트를 TypeScript로 전환했다. AST/callee/argument·문자열 key/map/set·catalog/placeholder/coverage와 동적 메시지 경계를 unknown으로 검증하고 누락·동적 안내를 완료로 오인하지 않는 동작을 유지했다. 기존 검사 fixture는 현재 TS 서버 파일명으로 맞췄다. hash CLI는 UTF-8 stdin decoding·전체 입력/검수 finally 정리·계정 저장소 대신 동일한 직접 hash 함수 import로 연결했다. Node 22 변환 MJS의 기존 누락/상태/화면 설명 검사 fixture와 나눠 보낸 한글 hash 입력·검증·과다 입력 거부·타입·빌드·HTTP36이 통과했다. 제품 catalog의 다국어 범위는 늘리지 않았으며 기존 Redis 설명 누락의 다국어 단계 이월도 유지한다. 운영 서비스/DEB는 변경하지 않았다. scripts는 TS 16개/MTS 2개/MJS 96개이며 전체 전환은 진행 중이다.

서비스 조회 후보·일괄 조회/패키지별 성능 비교 3개 도구를 TypeScript로 전환했다. unit/행·UTF-8 실행 callback·unknown 예외/부분 stdout·측정 sample/key·관측 결과 경계를 연결하고 ID별 순서·필수 상태·타임아웃/잘림 거부를 유지한다. 모의 systemctl/provider를 사용한 Node 22 변환 실행 및 관련 검사 9개·타입·빌드·HTTP36이 통과했다. 실제 속도 개선 수치나 실제 서버 상태 검수로 해석하지 않는다. 첫 테스트 준비/실행은 tmpdir()의 /tmp 사용 가능성 때문에 자동 승인 검토가 거부했고 실행되지 않았다. fixture 경로를 /mnt/data/build/tastedev-linux로 명시한 수정 후 승인·통과했다. 운영 서비스/DEB는 변경하지 않았다. scripts는 TS 19개/MTS 2개/MJS 93개이며 전체 전환은 진행 중이다.

PTY·설치 CLI version·Node service unit 검수 도구 3개를 TypeScript로 전환했다. 작업 폴더와 결과는 지정된 /mnt/data/build로 고정하고 상태/로그/기록/예외와 native 실행 옵션에 타입을 연결했다. 실제 자체 PTY의 한글/emoji/대량 입출력/네 탭/크기/EOF/중단/기한 13개 검사가 통과했고 네이티브 systemd-analyze는 자체 unit의 restart 세 옵션과 없는 실행 파일 거부를 확인했다. 서비스를 등록/시작/활성화하지 않았다. 고정 runtime 허용 목록의 동적 literal import도 검증된 byte span으로 MJS 경로에 연결하고 다른 문자열/허용 밖 경로는 바꾸지 않는다. Node 22의 CLI fixture/관리 helper/startup 검사 7개·타입·빌드·HTTP36이 통과했다. startup fixture의 tmpdir() 때문에 자동 승인 검토가 한 번 거부한 실행은 시작되지 않았고 경로를 명시 수정한 뒤 통과했다. 실제 AI CLI/AI 요청/DEB는 실행하지 않았다. scripts는 TS 22개/MTS 2개/MJS 90개이며 전체 전환은 진행 중이다.

오프라인 네이티브 진단 coordinator·PostgreSQL 진단 entry 두 스크립트를 TypeScript로 전환했다. image JSON/명시 옵션·stdin snapshot·진단 category/exitCode·승인된 container label 정리와 private 파일 속성 검사를 연결했다. 호스트/컨테이너 작업 경로·tmpfs·tar 목적지를 /mnt/data/build/tastedev-linux로 통일했고 MariaDB/HBA 호출부의 기존 경로도 맞췄다. Node 22의 Docker/tar 모의 호출은 context/image 거부·라벨 충돌 시 삭제 거부·가려진 원본 오류·고정 작업 경로·정리 재시도를 확인했다. 실제 Docker/container/DB는 실행하지 않았으므로 변경된 tmpfs/tar 경로의 실제 네이티브 검수는 미완료로 남긴다. 타입·빌드·HTTP36은 통과했다. 운영 서비스/DEB는 변경하지 않았다. scripts는 TS 24개/MTS 2개/MJS 88개이며 전체 전환은 진행 중이다.

전체 회귀 준비에서 기존 테스트 143개의 tmpdir() fixture 기본 경로를 /mnt/data/build/tastedev-linux로 명시 고정했다. 타입·모든 JavaScript 테스트 구문 검사는 통과했다. 첫 전체 실행은 1817개 중 1780 통과/37 실패였고, 이전 MJS/JSX 파일명 조합·TypeScript parser·실제 공통 의존성·서로 다른 React ref를 잘못 공유하던 fixture를 수정했다. 전체 재실행은 1815 통과/2 실패이며 두 실패는 동일한 Redis 포트 설명의 영어/터키어 직접 catalog 누락이다. 사용자 한국어 우선 지시에 따라 다국어 단계로 이월하며 원본 assertion과 실패 기록을 그대로 유지한다. 전체 회귀는 PARTIAL/raw FAIL이고 전체 완료로 판정하지 않았다. 이번 변경은 검사 코드뿐이므로 현재 app/components/lib/package/config 소스와 직전 컴파일 HTTP 증거는 일치한다. 운영 서비스·DEB·제품 catalog는 변경하지 않았다.

MariaDB·sudo 정책·nginx 후보 검수 도구 3개를 TypeScript로 전환했다. 자체 sudoers 구문 및 nginx 격리 후보 검수와 실제 오프라인 MariaDB 이미지의 후보 값/뒤쪽 include 충돌/잘못된 옵션/복원 include 검수가 통과했다. MariaDB 검수 도구의 과거 영어 오류 assertion을 현재 한국어 메시지와 맞췄으며 최초 실패를 기록했다. 관련 회귀 10개(Node 22 변환 실행 포함)·타입·현재 빌드·HTTP36이 통과했다. DB 또는 운영 서비스/설정/DEB는 변경하지 않았다. scripts는 TS 27개/MTS 2개/MJS 85개이고 전체 전환은 진행 중이다.

nginx 전체 생성 설정/TLS/root·alias 및 PostgreSQL HBA 네이티브 검수 entry를 TypeScript로 전환했다. nginx 작업 경로와 결과·하위 도구의 임시 경로를 지정된 /mnt/data/build로 옮기고 필수 preset/location·Linux UID를 확인한다. 실제 nginx 구문 8개와 네트워크 없는 postgres:16 사설 single-user HBA 검수 9개가 통과했다. HBA는 include·정렬·중첩 목록·오류의 원본 행·한글 파일명·민감 옵션 숨김을 검사한다. 관련 회귀 20개(Node 22 진단 runtime 포함)와 타입·현재 빌드·HTTP36이 통과했다. 운영 cluster·서비스·DEB는 변경하지 않았다. scripts는 TS 29개/MTS 2개/MJS 83개이며 전환은 진행 중이다.

Redis 격리 인프라 검수·직접 화면 문구 탐색 도구를 TypeScript로 전환했다. Redis 작업/증거/하위 환경을 지정된 /mnt/data/build에 연결하고 후보·runtime에 명시 타입을 추가했다. 실제 read-only 후보·사설 쓰기 폴더·메모리/FD/파일 크기 제한·호스트 자원 부재·PID/네트워크 격리 8개가 통과했다. Redis 서버·설정은 실행하지 않았으므로 설정 검수 완료를 뜻하지 않는다. 문구 탐색은 unknown AST를 검증하고 typed JSX를 파싱한다. Node 22 변환 실행의 한국어 직접 문구/조건식/접근성 속성·영문/동적 값 제외와 Redis 회귀 9개가 통과했다. 최초 fixture는 attribute/expression을 별도로 보고하는 기존 동작의 관측 수를 잘못 기대했고 실패 기록을 보존한 뒤 정확한 관측 수와 고유 문구 목록으로 검증했다. 현재 빌드·HTTP36도 통과했고 다국어 catalog는 늘리지 않았다. scripts는 TS 31개/MTS 2개/MJS 81개이며 전체 전환은 진행 중이다.

감사 페이지 검수·SSR 요청 캐시 검수 2개 도구를 TypeScript로 전환했다. 응답 JSON을 unknown에서 검사하고 private 원본 bytes/실패 복구와 cursor/no-store/401·400·409 검사를 유지한다. Node 22 변환 실행은 실제 로그 parser로 235행/append snapshot/잘못된 응답/실패 후 원본 복구를 확인했다. SSR fixture·.next·실패 증거는 /mnt/data/build로 고정했다. 분리된 .next symlink가 React runtime을 찾지 못한 최초 실패 후 같은 fixture 폴더로 수정했다. 실제 Next Server Component 요청 네 개는 사용자별로 인증·상태·보안·서비스 읽기 각각 한 번, 만료 요청은 인증 한 번/호스트 정보 조회 0번과 query를 보존한 로그인 이동을 확인했다. 관련 회귀 13개·타입이 통과했다. app/components/lib/package/config의 455파일이 직전 빌드·HTTP snapshot과 같아 반복 빌드는 하지 않았다. scripts는 TS 33개/MTS 2개/MJS 79개이며 전체 전환은 진행 중이다.

PostgreSQL 중단 복원·SCRAM 작업자 2개를 TypeScript로 전환하고 현재 소스에서 검수용 실행 자료를 생성하는 typed 준비 도구를 추가했다. 복원 입력은 unknown JSON/실행 계정/경로/검증된 서비스로 연결하며 부모의 worker 경로와 작업 폴더도 /mnt/data/build로 맞췄다. SCRAM worker는 고유 검수 root/runtime/role/target/port·민감 입력을 확인하고 실행 자료에는 고정 MJS 모듈을 사용한다. Python 전송 준비가 없어진 MJS 원본을 읽던 동작을 고정 runtime emitter로 교체했다. Python은 구문만 검사했고 원격 전송·DB·서비스는 실행하지 않았다. Node 22 실제 worker 로드/잘못된 복원 입력 거부·모의 SQL/service 적용과 복원/한글 출력·비밀번호 출력 부재, 기존 HBA/복원 core runtime outer 3개(복원 review 내부 43개 포함)·타입 검사가 통과했다. 현재 455파일이 기존 빌드·HTTP 증거와 같아 반복 빌드는 하지 않았다. scripts는 TS 36개/MTS 2개/MJS 77개이며 전체 전환은 진행 중이다.

Node 환경 설정 HTTP 검수 도구를 TypeScript로 전환하고 검수 응답 JSON의 객체·목록·필수 문자열을 unknown에서 확인하는 공통 typed 도구를 추가했다. fixture/증거/하위 환경은 /mnt/data/build로 고정했다. 현재 빌드의 자체 Next 서버로 실제 계정·환경 파일 저장/백업/복원·서버 재시작·감사·권한/Origin/동시 변경 거부 9개를 확인했다. 원래 CRLF·한글·댓글·비밀 값 bytes와 비공개 백업을 보존했다. Node22 공통 JSON 도구의 비정상 응답/누락 필드/잘못된 배열·문자열 검수와 환경 관련 회귀 13개·타입 검사가 통과했다. 운영 파일/서비스는 변경하지 않았다. 기존 455파일 빌드 snapshot과 현재 소스가 일치해 반복 빌드는 하지 않았다. scripts는 TS 38개/MTS 2개/MJS 76개이며 전체 전환은 진행 중이다.

nginx 값 없는 지시문·upstream·TLS·MIME/조건 블럭 네이티브 검수 도구 4개를 TypeScript로 전환하고 공통 report·필수 AST block·unknown 오류 stderr 검증 도구를 추가했다. fixture와 모든 증거는 /mnt/data/build에 기록한다. 실제 nginx -t 91개가 통과했다(값 없는 지시문 3/upstream 17/TLS 60/core 11). 자체 하루짜리 인증서·CRL·OCSP·키만 사용하며 실제 서비스·도메인·운영 설정은 변경하지 않았다. 고정 MJS 허용 목록으로 변환한 동일 도구의 Node 22 실제 구문 91개와 관련 GUI/catalog outer 회귀 9개·타입도 통과했다. 현재 455파일은 기존 빌드·HTTP snapshot과 같아 빌드는 반복하지 않았다. scripts는 TS 43개/MTS 2개/MJS 72개이며 전체 전환은 진행 중이다.

nginx main·events·HTTP core·proxy·mapping 검수 도구 5개를 TypeScript로 전환했다. 공통 report는 PARTIAL과 미실행 사유도 보존하고 필수 AST/preset·stderr·예약 포트·HTTP 응답·자체 프로세스 수명 타입을 연결한다. main 15/events 5/HTTP core 117/proxy 209/mapping 8개가 실제로 통과했다. main의 load_module·ssl_engine은 설치 모듈/엔진을 요구해 기존처럼 NOT_RUN이며 전체 main native inventory는 PARTIAL이다. mapping만 고유 loopback 사설 nginx를 시작해 실제 응답을 확인했고 임시 경로·PID·종료를 검증했다. 운영 서비스/파일/도메인은 변경하지 않았다. 이전 4개 도구를 포함한 고정 MJS closure의 Node 22 실제 검사 445개와 미실행 두 항목·관련 회귀 21개·타입이 통과했다. 현재 455파일은 기존 빌드·HTTP snapshot과 일치한다. scripts는 TS 48개/MTS 2개/MJS 67개이며 전체 전환은 진행 중이다.

nginx upstream·TLS·proxy 실제 HTTP 검수 도구 3개를 TypeScript로 전환하고 공통 실행/결과 타입을 추가했다. 예약 포트·HTTP 서버/응답·소켓 ID·held 요청·TLS socket/session·오류 code·AST 노드·자체 프로세스 종료를 타입과 런타임 검증으로 연결했다. 모든 body/proxy/temp/PID·자체 인증서는 /mnt/data/build의 사설 fixture에 두었다. 실제 upstream 9/TLS 10/proxy 11개 검사에서 연결 재사용·weighted/hash/least 분산·캐시/lock/bypass·쿠키/redirect·재시도·TLS 신뢰/이름/클라이언트 인증/프로토콜/세션 재사용을 확인했다. 고정 MJS 허용 목록으로 생성한 Node 22에서도 동일 30개와 서버 종료를 확인했고 관련 outer 회귀 9개·타입이 통과했다. 운영 서비스/도메인/외부 API는 변경하지 않았다. 현재 455파일은 기존 빌드·HTTP snapshot과 일치한다. scripts는 TS 52개/MTS 2개/MJS 64개이며 전체 전환은 진행 중이다.

cron root/일반 사용자 namespace 검수 도구 2개를 TypeScript로 전환했다. 작업·결과·namespace의 source/evidence/build 별칭과 임시 환경을 /mnt/data/build로 맞추고 원래 /tmp mount를 제거했다. unknown 결과/빌드 snapshot·Linux UID/GID·진단 타입을 연결했다. 사설 tmpfs crontab의 root 구문/조회 8개, 일반 계정 저장·삭제·복원·충돌/감사·API 25개, 새 컴파일 Next cron API 14개가 실제로 통과했다. 호스트 crontab/cron 서비스는 변경하지 않았다. 이번 범위는 cron 데몬의 예약 tick/실제 GUI 검수가 아니다. 관련 회귀 9개(Node22 core runtime 포함)·타입·새 빌드·HTTP36도 통과했다. scripts는 TS 54개/MTS 2개/MJS 62개이며 전체 전환은 진행 중이다.

cron 격리/원격 컨테이너 scheduler 도구 2개를 TypeScript로 전환했다. fixture/namespace/work 환경을 /mnt/data/build로 연결하고 원격은 UUID 라벨 확인 후 자체 컨테이너만 정리하며 image ID 고정·pull 금지·remote shell quoting·응답 unknown 검증을 추가했다. 실제 SSH 없는 모의 전송/foreign label 정리 거부와 Node22 core 회귀 2개·타입·새 빌드·HTTP36은 통과했다. 최초 runner 경로 상수 오류를 수정했지만 실제 namespace cron은 예약 tick에서 create tmpfile 오류로 출력을 만들지 못했다. 두 실패 기록을 보존하며 scheduler 실행은 미완료/PARTIAL이고 /tmp로 대체하지 않았다. cron 내부 임시 동작을 프로젝트 환경만으로 제어했다고 주장하지 않는다. 운영 crontab/서비스와 DEB는 변경하지 않았다. scripts는 TS 56개/MTS 2개/MJS 60개이며 전체 전환은 진행 중이다.

공통 실제 HTTP/API/auth fixture 어댑터와 PostgreSQL 서비스/Redis 실행 파일 진단 도구 3개를 TypeScript로 전환했다. compile exports·요청 body/headers·응답 JSON·policy·audit·callback·주소/종료·native Error와 VM serializer 경계를 검증한다. 처음에는 Error.message를 JSON처럼 열거해 누락한 실패 두 개를 보존하고 Error 객체를 직접 검증하도록 수정했다. 실제 자체 Better Auth·HTTP 진단 8개에서 한국어 오류/status·조각 UTF-8 helper 전송·조회 전용 차단·메타데이터/내용 없는 감사 기록이 통과했다. OS metadata와 privileged dispatch는 fixture이며 운영 PostgreSQL/Redis를 검사하거나 변경하지 않았다. 관련 회귀 21개(Node22 서비스 runtime 포함)·타입도 통과했다. 기존 455파일 빌드 snapshot과 일치해 반복 빌드는 하지 않았다. cron의 실제 예약 실행 미완료 기록도 유지한다. scripts는 TS 59개/MTS 2개/MJS 57개이며 전체 전환은 진행 중이다.

PostgreSQL 로컬 HBA 파서·실제 HTTP lifecycle 도구 2개를 TypeScript로 전환했다. 작업/증거/하위 임시 환경을 /mnt/data/build로 연결하고 후보 graph/source·불변 native argv·stdin·service hooks·HTTP JSON·Linux UID·진단/결과 타입을 연결했다. 실제 자체 cluster HTTP 8개는 인증/권한·검토·적용·native reload 수락·백업/undo 복원·실패 후 원복·감사·한글 데이터 보존을 확인하고 cluster를 종료했다. 한국어 single-user parser 7개는 include·잘못된 인증 방식/주소/옵션/필드·누락/순환·비밀값 제외·원본 유지가 통과했다. Node22 plain MJS에서도 parser 7개와 기존 HBA coordinator를 확인했고 outer 회귀 17개·타입이 통과했다. 운영 DB·systemd·privileged helper는 검사하거나 변경하지 않았다. 현재 455파일 빌드 snapshot과 일치해 빌드는 반복하지 않았다. scripts는 TS 61개/MTS 2개/MJS 55개이며 전체 전환은 진행 중이고 cron 예약 미완료 기록도 유지한다.

공통 페이지/설치된 복구 GUI 준비 도구 2개를 TypeScript로 전환했다. 빌드 snapshot·주소·ready/stop/close promise·PID 존재·오류 code를 검증하고 증거 경로를 /mnt/data/build로 맞췄다. 설치 도구는 배포 runtime의 고정 MJS 인증 모듈 이름을 사용한다. 현재 빌드 준비 서버 로그인·6개 페이지와 기존 설치 준비 서버 로그인/복구 HTTP 응답이 통과했고 두 서버·임시 계정/상태 정리를 파일 부재로 확인했다. 표준 입력이 닫힌 첫 exec 준비 서버는 확인한 자체 PID/명령에만 SIGTERM을 보내 정상 정리했다. 기존 설치 BUILD_ID는 E71XGgBpOcuE7O-DVPo1E이며 최신 소스 배포나 실제 렌더 GUI의 증거가 아니다. Node22 plain MJS 구문/부적절한 root 거부·startup 회귀 2개·타입도 통과했다. 현재 455파일 snapshot과 일치해 반복 빌드는 하지 않았다. 설치/DEB/운영 상태는 변경하지 않았다. scripts는 TS 63개/MTS 2개/MJS 53개이며 전체 전환은 진행 중이다.

navigation·설치 관찰·브라우저 session 유지 검수 제어기 3개를 TypeScript로 전환했다. snapshot·proxy timing·server/PID·GUI JSON·SQL row/시간/결과·오류 타입을 연결하고 증거/임시 경로를 /mnt/data/build로 맞췄다. 세 서버의 실제 계정 로그인과 페이지 응답, 올바른 /api/job 읽기 후 합성 설치 record/lock 보존을 확인했다(최초 잘못된 /api/install-job probe는 404). GUI PASS를 만들어 넣지 않고 [] assertion과 age/renew 이전 stop을 전달했으며 거부·FAIL 기록·서버/계정/fixture 정리의 파일 부재를 확인했다. 이는 제어기 negative 검사이며 실제 GUI/브라우저 maintenance timer 검수는 아니다. Node22 plain MJS 구문/잘못된 경로 조기 거부·startup 회귀 2개·타입도 통과했다. 현재 455파일은 기존 빌드 snapshot과 같아 반복 빌드는 하지 않았다. scripts는 TS 66개/MTS 2개/MJS 50개이며 전체 전환은 진행 중이다.

APT 저장소 생성/서명/확인 도구 4개를 TypeScript로 전환하고 생성 저장소 경로를 /mnt/data/build/tastedev-linux의 정규 private directory로 확인하는 공통 타입 도구를 추가했다. package JSON·architecture·version·Buffer hash/compression tuple·생성 대상·unknown 오류/지문을 연결하고 내부 호출/npm 경로도 TS로 맞췄다. 서명 fixture home/repository·결과·하위 임시 환경은 지정 빌드 경로를 사용한다. Node22 생성 JavaScript 구문과 부적절한 경로·공개 권한·symlink 거부만 검사했다. 실제 DEB 생성/검증·저장소 생성·GPG/서명·APT·배포는 실행하지 않았으며 최종 배포 게이트로 남긴다. 타입·구문/입력 outer 검사 1개·새 Next 빌드·HTTP36이 통과했다. scripts는 TS 71개/MTS 2개/MJS 46개이며 전체 전환은 진행 중이다.

데스크톱 package 생성·확인·최종 설치 준비 도구 3개를 TypeScript로 전환했다. metadata/proof·Buffer hash·architecture·의존 라이브러리 소유 package·경로/버전 타입을 연결했다. 생성 package는 지정 빌드 root의 새 desktop-package 폴더에 보존하고 확인 CLI는 명시 파일 인수를 지원하며 결과도 새 증거 파일로 보관한다. 최종 준비 기록은 자체 결과물 옆에 남긴다. 버전은 파일명에 쓰기 전에 검사하며 Node22 구문/부적절한 버전의 Cargo/패키지 동작 전 거부 outer 검사 1개·타입·새 Next 빌드·HTTP36은 통과했다. 실제 Cargo·데스크톱/DEB 생성·확인·설치 준비·설치·native GUI는 실행하지 않았으며 최종 배포 단계로 유지한다. scripts는 TS 74개/MTS 2개/MJS 43개이며 전체 전환은 진행 중이다.

PostgreSQL native catalog/host 후보 검수 도구 2개를 TypeScript로 전환했다. 설치된 major·선택 행·정규 readonly 설정 argv·원본 파일 map·후보 mutable holder·Linux UID/GID·unknown 오류를 연결하고 작업/증거를 /mnt/data/build로 고정했다. 실제 PostgreSQL 18.6 샘플 351개가 native 이름/순서/한 줄 편집/기존 설명 데이터를 유지했고 private namespace 5개는 UID/GID·include 우선순위·잘못된 매개변수/값 거부·원본/후보 정리를 확인했다. 기존 17개 설명 언어를 검사했지만 새 번역 범위를 늘리지 않았다. 동일 plain MJS의 Node22 실제 catalog/namespace와 관련 회귀 13개·타입·새 Next 빌드·HTTP36이 통과했다. postmaster/운영 DB/서비스/설정/DEB는 실행하거나 변경하지 않았다. scripts는 TS 76개/MTS 2개/MJS 41개이며 전체 전환은 진행 중이다.

PostgreSQL systemd fixture 검수 도구를 TypeScript로 전환하고 고정 허용 목록의 현재 runtime·자체 포함 fixture를 생성하는 준비 도구를 추가했다. Python 전송 제어기는 제거된 MJS 소스를 읽는 대신 생성된 자료를 사용하며 배포 runtime 이름은 MJS로 유지한다. Node22 파일/표준 입력의 계획 출력과 비관리자 실행 조기 차단, 관련 서비스 회귀 2개·타입 검사가 통과했다. 실제 SSH·systemd·cluster 생성·helper·패키지 작업은 실행하지 않았다. 현재 455파일은 기존 빌드 snapshot과 같고 scripts는 TS 78개/MTS 2개/MJS 40개이다. 전체 전환과 최종 설치·GUI 검수는 진행 중이다.

PostgreSQL private runtime host 도구를 TypeScript로 전환하고 worker의 상대 import·namespace 작업/증거/백업/임시 환경을 지정 빌드 root로 맞췄다. 복사한 TS 원본 대신 고정 허용 목록에서 생성한 MJS runtime을 사용한다. 공통 변환기에 MTS fallback·정적/동적 import 지원을 추가했고 처음 발견한 Next SWC의 MTS parse 오류를 파일명 정규화로 수정했다(실패 증거 보존). 실제 격리 postmaster/SQL·설정 반영·실패 원복·include graph/undo·복구 취소·동시 외부 편집 보존 19개와 Node22 동일 19개·회귀 9개·타입·새 빌드·HTTP36이 통과했다. 운영 DB/systemd/helper/패키지는 변경하지 않았고 자체 cluster 종료·fixture 정리를 확인했다. worker는 아직 JavaScript이며 scripts는 TS 79개/MTS 2개/MJS 39개이다. 전체 전환·전체 회귀·최종 설치/native GUI는 진행 중이다.

PostgreSQL 격리 runtime worker를 TypeScript로 전환했다. child/exit/log·SQL argv/env·서비스 hook·RPC pending/응답·archive·복구 journal·union 결과와 unknown JSON 경계를 연결했다. canonical fixture를 쓰기 전에 기록된 호스트 PID/net namespace와 다른지 확인한다. 전환 과정에서 복원 입력에 추가 필드를 포함한 실패와 legacy ledger의 checked data를 실제 저장 객체에 재연결하지 않은 실패를 보존하고, 고정 입력 필드·명시 data 연결로 수정했다. 실제 Node24/Node22에서 private postmaster·SQL·설정 반영·실패 원복·복구 취소·동시 편집 보존 19개와 회귀9·타입이 통과했다. 자체 DB/fixture 정리를 확인했고 운영 서비스/helper/DEB는 변경하지 않았다. 455파일은 기존 컴파일/HTTP snapshot과 같아서 빌드는 반복하지 않았다. scripts는 TS 80개/MTS 2개/MJS 38개이며 전체 전환은 진행 중이다.

PostgreSQL 비공개 진단/다중 파일 복원 검수 도구 2개를 TypeScript로 전환했다. diagnostic worker와 모든 임시 환경·증거를 지정 빌드 경로로 연결하고 후보·native argv/options·에러/JSON·archive·journal·프로세스 signal/timer·union 결과·고정 복원 입력을 검증한다. source hash는 실제 TS 파일명으로 기록하며 Node22 검수는 고정 생성 MJS worker를 선택한다. 실제 native diagnostic 2개는 private 오류 marker가 공개 stdout/stderr로 새지 않음을 확인했다. 복원 10개 시나리오/20개 검사는 업데이트·생성·삭제·활성화 실패 fixture/원복·독립 복구·자체 writer SIGKILL 복구·보관·복원 요청·undo·history 재가져오기와 hardlink 정리를 확인했다. 동일 Node22 native22·회귀7·타입·새 빌드·HTTP36도 통과했다. native parser를 실제 사용했지만 서비스 callback은 fixture이고 postmaster/운영 DB/systemd/helper/DEB는 실행하거나 변경하지 않았다. scripts는 TS 82개/MTS 2개/MJS 36개이며 전체 전환은 진행 중이다.

PostgreSQL HBA native container 검수 제어기와 operation/crash driver 3개를 TypeScript로 전환했다. stdin·readonly native argv·SQL·service hook·candidate·unknown error/JSON·union 결과·이미지/실행 파일 메타데이터를 연결하고 작업·tmpfs mount·tar unpack·후보·하위 임시 환경·증거를 /mnt/data/build로 맞췄다. 고정 MJS 생성 closure와 UUID 라벨 확인 후 자체 container 정리를 유지한다. 실제 Node24 native6은 PostgreSQL16.15에서 적용/reload·fresh 역할 인증·backup/restore·실패 rollback·invalid draft 거부·자체 child SIGKILL 후 복구를 확인했다. Node22 첫 실행은 호스트 공유 libnode.so.127 누락으로 실패해 기록을 보존했다. 공식22.22.1 독립 runtime을 지정 root에 checksum 확인하여 보관하고 LINUX_VERIFY_CONTAINER_NODE의 private regular file·owner·버전을 검증하도록 추가했다. 실제 portable Node22 native6·회귀12·타입·새 빌드·HTTP36이 통과했다. 시스템 Node를 설치/변경하지 않았고 기존 image만 사용했다. systemd/runuser는 fixture transport이며 운영 reload acceptance 검수와 전체 GUI/배포는 완료로 주장하지 않는다. 네트워크/host bind/image pull/운영 DB·서비스·DEB 변경은 없고 자체 container 정리를 확인했다. scripts는 TS85개/MTS2개/MJS33개이며 전체 전환은 진행 중이다.

Node 앱 환경/등록과 인증서·설치 이력 HTTP 검수 도구 2개를 TypeScript로 전환하고 현재 제품 파일 목록·원본/빌드 SHA 일치를 확인하는 공통 검사를 추가했다. process/close·주소/port·RequestInit/Headers·cookie·JSON record/list·작업 snapshot·GUI assertion·오류 code/진단 경계를 연결했다. 생성 fixture·증거·서버 log를 지정 빌드 root로 옮기고 기존 빌드 log 덮어쓰기를 제거했다. 인증서 기록은 현재 소스/빌드 일치 확인 후 typed publishing API를 사용한다. 실제 Node24와 Node22 자체 서버에서 각각 HTTP16개로 private Node 앱 등록/환경 변경·주석/CRLF/한글/private 값 보존·백업/복원·재시작 세션·등록 해제/감사, 권한/손상/중단/중복 기록 이력·정확한 오류 상태와 재시작 유지가 통과했다. 회귀17·타입도 통과했으며 455제품 파일이 기존 snapshot과 같아 반복 빌드는 하지 않았다. 앱 서비스/Certbot/APT/helper/DEB는 실행하지 않았고 실제 GUI mode도 수행하지 않았다. scripts는 TS88개/MTS2개/MJS31개이며 전체 전환은 진행 중이다.

세션 만료/터미널 클립보드 GUI 검수 제어기 2개를 TypeScript로 전환했다. 전체 현재 소스/빌드 snapshot 검사를 사용하고 socket 주소·process/close·캡처된 자체 PID·timer·cookie/API/JSON list·SQLite unknown count·GUI assertion·에러 code를 연결했다. 새 fixture/증거/log는 지정 빌드 root를 사용한다. 실제 두 준비 서버 로그인과 세션 SQL 만료 후 HTTP401을 확인했다. fresh 재로그인 없이 중단하거나 {} GUI 결과를 전달하면 원래 FAIL로 판정했고 서버/계정 fixture 부재로 정리를 확인했다. 이는 준비/negative 판정 검수이며 화면 PASS를 만들어 넣지 않았고 실제 브라우저/OS IME/PTY GUI는 검수하지 않았다. Node22 제어기7개 구문/잘못된 경로 조기 거부와 실제 인증 startup 회귀2·타입도 통과했다. 제품455파일 snapshot이 같아 빌드를 반복하지 않았고 운영 설정·shell·서비스·DEB는 변경하지 않았다. scripts는 TS90개/MTS2개/MJS29개이며 전체 전환은 진행 중이다.

Node IDE 연결 GUI 제어기와 생성 검수 페이지를 TypeScript/TSX로 전환했다. 기존 tsconfig/next-env를 검수 복사본에 포함하고 typed registry/unit·readonly API overload·ref/promise·주소/port·자체 child·JSON/오류 경계를 연결했다. 불완전한 소스는 fixture 생성 전에 거부한다. 첫 캡처에서 fixture가 기존 ide-page flex 문맥을 빠뜨려 본문이 보이지 않는 문제를 확인했고, 제품 CSS를 변경하지 않고 fixture에 원래 레이아웃 클래스를 연결했다. 최초 실행은143으로 중단됐고 그 fixture를 보존했다. 새 복사본의 빌드와 실제 내장 브라우저에서 초기 목록·서버 교체 후 이전 선택/목록 숨김·새 목록 선택·연결 해제·재연결 선택 6개가 통과했다. 캡처는 tool 화면에 표시됐으나 browser artifact filesystem 쓰기는 EROFS로 거부돼 관찰 기록만 지정 경로에 저장했다. 새 서버/fixture/임시 탭 정리, Node22 구문/불완전 소스 조기 거부·연결 회귀12·타입이 통과했다. API는 readonly fixture이며 실제 운영 서버 연결/native Tauri/배포 검수로 확대하지 않는다. scripts는 TS91개/MTS2개/MJS28개이며 전체 전환은 진행 중이다.

복구 context·코드 중단·Node 완료 GUI 제어기 3개를 TypeScript로 전환했다. source hash map·GUI JSON/오류·socket/port·자체 child 종료·env 경계를 연결하고 새 작업/증거를 지정 빌드 root로 맞췄다. 최초 준비 서버는 layout이 요구하는 console-design.css가 복사되지 않아 실패했으며 기록을 보존하고 기존 CSS를 복사하도록 수정했다(제품 디자인 변경 없음). 실제 준비 서버3개 HTTP200·{} GUI 결과의 FAIL 판정·서버/fixture 정리를 확인했고 Node22 제어기 구문/불완전 소스의 초기 FAIL과 복구 회귀11·타입이 통과했다. 생성되는 JSX 페이지3개는 아직 JavaScript 검수 코드이며 실제 GUI 조작 PASS로 처리하지 않았다. API는 합성 응답이고 native helper/DB/service/DEB는 실행하거나 변경하지 않았다. 현재455제품 파일은 기존 컴파일 snapshot과 같아 빌드를 반복하지 않았다. scripts는 TS94개/MTS2개/MJS25개이며 전체 전환은 진행 중이다.

Node 복구 완료 검수 페이지를 TSX로 전환하고 registry/unit·SecurityPolicy·파일/서비스 후보/등록 설정/복구 검토/완료 응답을 실제 DTO와 API overload로 연결했다. 지원하지 않는 fixture 요청은 reject하고 any/unsafe cast로 오류를 숨기지 않았다. 개발 서버 대신 typed fixture의 production build/typecheck를 먼저 수행하도록 바꿨다. 실제 내장 브라우저에서 서비스 설정 확인→합성 중단 경고→복구 검토/확인→이전 경고 제거와 완료 안내 유지 2개가 통과했고 screenshot에도 완료 문구가 보였다. API는 로컬 합성 응답이고 운영 systemd/DB/helper는 실행하지 않았다. 서버/fixture/임시 탭 정리·Node22 제어기와 복구/IDE 회귀14·타입도 통과했다. 기존 제품455파일 snapshot은 동일하다. 생성 JSX 검수 페이지는2개, MJS 스크립트는25개 남아 있으며 전체 전환은 진행 중이다.

Redis/MariaDB 코드 중단 복구 검수 페이지를 TSX로 전환했다. discriminated 입력·실제 SecurityPolicy·두 API overload·코드 검토/복구 DTO를 연결하고 unsupported 요청을 reject한다(any/unsafe cast 없음). typed production fixture build 후 실제 내장 브라우저에서 각 검수/승인→합성 적용 중단→복구 검토/확인→완료와 이전 경고 제거를 확인했다. 첫 준비 프로세스는 결과 기록 전143으로 종료되어 fixture를 보존했으며 전체 자동 검수 PASS로 처리하지 않았다. 자체 Next 프로세스를 분리한 새 실행에서는13개 실제 브라우저 동작을 재검수하고 GUI PASS 파일·종료0·fixture/탭 정리를 확인했다. 회귀33·타입도 통과했다. API는 로컬 합성 응답이며 실제 DB/helper/service/DEB나 제품 디자인은 변경하지 않았다. 제품455파일은 기존 snapshot과 동일하다. 남은 생성 JSX 검수 페이지1개와 MJS 스크립트25개를 계속 전환한다.

복구 연결 전환 페이지도 TSX로 전환해 기존 세 복구 제어기 페이지 전환을 마쳤다. nginx/MariaDB/Redis/Node의 실제 policy·파일·검토 DTO/API overload·service option과 busy/call state 타입을 연결했고 typed production fixture build를 선행한다. 실제 브라우저에서 각 확인 대화상자 중 연결 변경으로 이전 검토/승인이 없어지고 stale recover 호출이 발생하지 않으며 새 연결2/3/4/5의 재검토/확인만 복구를 요청하고 완료 표시되는 것을 확인했다. 회귀29·타입·서버/fixture/임시 탭 정리도 통과했다. API는 로컬 합성 응답이며 운영 서비스/helper/DB/제품 CSS/DEB는 변경하지 않았다. 제품455파일 snapshot은 동일하다. 앞선 생성 JSX 수3→2→1은 이 세 제어기 기준이었다. 전체 scripts 검색에서는 service-mutation-gui.mjs·postgresql-operation-gui.mjs·postgresql-hba-native-gui.mjs·ssr-request-cache.ts의 기존 JSX 생성4곳도 남아 있어 범위를 명확히 기록했다. 기능 범위를 늘린 것이 아니며 MJS25개·helper·기존 JavaScript 테스트/생성 코드와 최종 검수를 계속 진행한다.

PostgreSQL 적용·복원·중단 복구/HBA GUI 검수 제어기를 TypeScript로 전환했다. process·주소/port·hash·GUI JSON·오류 경계를 연결하고 fixture/증거를 지정 빌드 경로로 옮겼다. 실제 기본/HBA/원복 결과 준비 서버3개 HTTP200과 비어 있는 GUI 결과의 FAIL 판정·자체 fixture 정리를 확인했다. Node22 생성 MJS 구문/불완전 소스 거부와 관련 회귀39·타입도 통과했다. 생성 page.jsx는 아직 전환 대상이며 실제 GUI/native helper/운영 DB/DEB 검수로 처리하지 않았다. 제품455파일은 기존 빌드 snapshot과 동일하다. scripts는 TS95개/MTS2개/MJS24개이며 전체 전환은 진행 중이다.

전체 production HTTP 검수 도구를 TypeScript로 전환했다. 공통 현재 소스/빌드 비교를 연결하고 응답 JSON object/list/string·process/port·cookie·SSE·에러 경계를 타입으로 확인한다. 새 성공/실패/log는 지정 빌드 경로에 보존하며 기존 빌드 log를 덮어쓰지 않는다. 첫 Node22 검수는 잠금 child가 빌드 TS를 직접 읽어 실패했고 증거를 보존했다. source/생성 MJS 문맥에 맞는 고정 현재 모듈을 선택하도록 수정하여 실제 Node22와 Node24에서 각 HTTP36개가 통과했다. 로그인/만료/재시작 세션·SSR·read-only 차단·자체 잠금 holder 중단·격리 실제 PTY/SSE 한글/emoji를 확인했으며 운영 helper/서비스/Certbot/APT/DEB와 실제 브라우저/Tauri GUI는 실행하지 않았다. Node22 생성 plain MJS/잘못된 빌드 경로 거부 회귀·타입도 통과했다. 제품455파일은 기존 snapshot과 동일하고 scripts는 TS96개/MTS2개/MJS23개이다. 전체 전환과 최종 검수는 진행 중이다.

Node 앱 GUI 검수 제어기를 TypeScript로 전환했다. 공통 전체 source snapshot 검사·JSON object/list·cookie·layout number·port·자체 child PID/종료·오류 경계를 연결했다. /tmp 생성과 mount를 지정 경로로 함께 수정했으나 첫 bwrap mount 순서가 readonly 부모에 directory를 만들려 해 실패했으며 증거를 보존했다. fixture/tmp 생성 및 fixture bind 선행으로 수정했고 실제 Node24/Node22 서버 준비·앱 등록/API/HTTP200과 빈 GUI layout 결과의 FAIL 판정·fixture 정리를 확인했다. 관련 파일/환경/연결/복원 회귀18·타입도 통과했다. 실제 GUI 편집·복원/스크롤 합격으로 처리하지 않았고 운영 Node 서비스/앱 코드/패키지를 실행하지 않았다. 제품455파일 snapshot은 동일하고 scripts는 TS97개/MTS2개/MJS22개이며 전체 전환은 진행 중이다.

패키지 IDE GUI 검수 제어기를 TypeScript로 전환했다. 현재 소스와 빌드의 전체 파일/hash 비교·socket/port·GUI JSON·자체 child PID/종료 promise·오류 경계를 연결했다. 새 fixture/증거와 하위 임시 환경은 지정 빌드 root를 사용한다. 실제 PostgreSQL/Certbot/Redis/MariaDB 네 서버 준비 HTTP200·빈 GUI 결과의 FAIL 판정·자체 fixture 정리를 확인했다. Node22 plain MJS 구문/잘못된 경로의 계정·서버 생성 전 거부와 관련 편집 회귀23·타입도 통과했다. 실제 GUI 편집·스크롤/로그인 브라우저 합격으로 처리하지 않았고 root 설정은 private namespace readonly fixture이며 운영 DB/서비스/helper/AI/DEB는 변경하지 않았다. 제품455파일 snapshot은 동일하다. scripts는 TS98개/MTS2개/MJS21개이며 전체 전환과 최종 검수는 진행 중이다.

nginx 편집기 GUI 검수 제어기를 TypeScript로 전환했다. 전체 source/build 파일/hash 검증·socket/port·GUI JSON·자체 child PID/종료 promise·unknown 오류 경계를 연결하고 작업/증거/하위 임시 환경을 지정 빌드 root로 맞췄다. 기존 editor/restore/pending/auxiliary/route/http/proxy/upstream/tls/conflict 10개 시나리오는 실제 격리 서버 HTTP200·빈 GUI 결과 FAIL 판정·자체 fixture 정리가 통과했다. Node22 plain MJS 구문/잘못된 경로 초기 거부와 관련 트리/편집 회귀17·타입도 통과했다. 실제 브라우저의 각 조작 PASS로 처리하지 않았으며 설정은 readonly 격리 fixture이고 운영 nginx/helper/서비스/AI/DEB는 실행하거나 변경하지 않았다. 제품455파일 snapshot은 동일하고 scripts는 TS99개/MTS2개/MJS20개이다. 전체 전환과 최종 검수는 진행 중이다.

서비스 변경 GUI 제어기와 생성 JSX 검수 페이지를 TypeScript/별도 TSX fixture로 전환했다. 실제 SecurityPolicy·NodeServicePlan·설정/백업 목록/복원 검토/변경 DTO와 API overload에 연결하고 미지원 요청을 reject한다. fixture 템플릿 hash를 복사본과 비교하며 production build/typecheck를 먼저 실행한다. 실제 내장 브라우저에서 변경 확인 중 연결 전환으로 승인 제거→새 검토/변경 완료(연결2), 백업 조회/복원 확인 중 연결 전환→새 검토/복원 완료(연결3)를 확인했다. screenshot은 tool 화면에 표시됐으며 파일 저장 증거로 주장하지 않는다. API는 합성 응답이고 운영 서비스/helper는 변경하지 않았다. GUI 결과 PASS·서버/fixture/임시 탭 정리·Node22 plain MJS/불완전 소스 조기 FAIL과 회귀23·타입도 통과했다. 제품455파일 snapshot은 동일하고 scripts는 TS100개/MTS2개/TSX1개/MJS19개이다. 남은 literal JSX generator는3곳이며 전체 전환·최종 검수는 진행 중이다.

Redis 로컬 lifecycle 검수 제어기를 TypeScript로 전환했다. candidate/apply option·자체 child/종료·command/CLI·보고서·backup JSON/오류 타입을 연결했다. assets/evidence와 새 fixture는 지정 빌드 root에 한정하고 realpath/owner/regular file을 확인하며 기존 result.json 대신 새 exclusive 결과 이름을 사용한다. Node22 plain MJS 구문/잘못된 경로·실행 파일 부재의 기동 전 거부와 적용/복원/후보 회귀12·타입이 통과했다. 현재 지정 경로에 Redis server/cli assets가 없고 호스트에도 실행 파일이 없어 실제 private Redis 기동 검수는 실행하지 않았고 기동 PASS로 처리하지 않았다. 운영 Redis/패키지/helper/서비스는 변경하지 않았다. 제품455파일 snapshot은 동일하고 scripts는 TS101개/MTS2개/TSX1개/MJS18개이며 전체 전환·native 실행·최종 검수는 진행 중이다.

AI 한국어 검수 제어기를 TypeScript로 전환했다. 결과 discriminated union·unknown 오류 status/code 경계를 연결하고 합성 전송 명시 옵션(--confirm-synthetic-input)이 없으면 실제 분석 모듈을 불러오기 전에 거부한다. 기존 AI 활성 환경 강제 설정을 제거해 저장된 활성 설정을 존중한다. 새 private 작업/증거는 지정 빌드 root를 사용하며 원본 provider 오류 대신 고정 안내와 알려진 quota/rate code만 기록한다. Node22 plain MJS 구문·명시 옵션 거부·합성 한국어/불완전/429 판정·원본 오류 비저장 테스트와 타입이 통과했다. 응답 모듈은 테스트용 합성이며 실제 AI API/키/모델 호출은 하지 않았다. 사용자가 완료 처리한 AI API 검수 상태를 다시 열지 않았다. 제품455파일 snapshot은 동일하고 scripts는 TS102개/MTS2개/TSX1개/MJS17개이며 전체 전환과 최종 검수는 진행 중이다.

MariaDB 로컬 lifecycle 검수 제어기를 TypeScript로 전환했다. apply option·자체 child/종료·SQL/command argv·보고서·backup JSON/오류 타입을 연결했다. assets/evidence/new fixture는 지정 빌드 root로 제한하며 realpath/owner/regular file을 검증하고 새 exclusive 결과 파일을 사용한다. Node22 plain MJS 구문/잘못된 경로·실행 파일 부재의 기동 전 거부와 적용/후보 회귀16·타입이 통과했다. 현재 PC의 MariaDB native 실행 파일 부재로 실제 DB 기동 검수는 실행하지 않았으며 native 합격으로 처리하지 않았다. 운영 DB/서비스/helper/패키지는 변경하지 않았다. 제품455파일 snapshot은 동일하고 scripts는 TS103개/MTS2개/TSX1개/MJS16개이며 전체 전환과 native/최종 검수는 진행 중이다.

PostgreSQL container lifecycle 검수 제어기를 TypeScript로 전환했다. Docker argv/stdin·JSON image ID/digest·보고서/오류 경계를 연결했고 container의 작업/Unix socket/data/log/tmpfs와 임시 환경을 지정 빌드 경로로 옮겼다. 기존 PostgreSQL16.15 image ID를 확인하고 pull never/network none/read-only/cap-drop/UID999·UUID 라벨/자체 container 정리를 유지했다. 실제 Node24/Node22에서 private Unix socket 기동·앱 후보 적용 재시작·한글 데이터 유지·invalid 기동 거부·원복/데이터 유지·클러스터 종료 각6개가 통과했다. Node22 plain MJS 구문과 설정 패치 포함 outer 회귀5·타입도 통과했다. 호스트 bind/외부 port/운영 DB/서비스/패키지/DEB는 변경하지 않았으며 설치 GUI/root helper 검수로 처리하지 않는다. 제품455파일 snapshot은 동일하고 scripts는 TS104개/MTS2개/TSX1개/MJS15개이며 전체 전환과 최종 검수는 진행 중이다.

PostgreSQL 원격 HBA lifecycle worker를 TypeScript로 전환하고 준비 source 도구를 추가했다. UID·native argv/env·설치 runtime unknown/function/결과 record 경계·callback·backup/복구 결과를 연결했다. 설치 runtime을 읽기 전에 root와 /etc·/var/lib/linux의 전용 tmpfs 마운트를 확인하며 child 임시 환경도 지정 경로를 사용한다. Python 전송 제어기는 삭제된 MJS를 읽는 대신 생성한 plain JS 문자열을 사용한다. 최초 source JSON에 Buffer가 들어간 실패를 보존하고 UTF-8 문자열로 수정했다. Node22 생성 worker 구문·일반 호스트의 설치 runtime 로딩 전 거부와 HBA 적용/백업 회귀9·타입·Python AST 구문이 통과했다. 원격 전송/실제 HBA lifecycle/native helper/운영 DB는 이번 단계에서 실행하지 않았고 해당 합격으로 처리하지 않았다. 제품455파일 snapshot은 동일하고 scripts는 TS106개/MTS2개/TSX1개/MJS14개이며 전체 전환과 최종 검수는 진행 중이다.

웹 패키지 생성 도구를 TypeScript로 전환했다. 프로젝트/버전/의존성 metadata·CPU mapping·복사 경로·source hash·오류를 타입으로 검증하고 invalid 입력은 staging/패키지 생성 전에 거부한다. 결과 DEB는 지정 빌드 root의 새 package 폴더에 보존하며 verifier/APT 도구는 명시 DEB 경로를 받을 수 있다. npm 실행 경로와 README를 맞췄다. 검수 복사본의 Next 의존성 누락과 호스트 Node22의 ERR_NO_TYPESCRIPT 실패를 보존했다. 기존 Next 연결을 추가하고 호스트 Node22 plain MJS 및 보관된 공식 Node22 TypeScript 원본의 프로젝트/버전/의존성 초기 거부가 통과했다. TypeScript 기능 없이 빌드된 배포판 Node22는 소스 도구 직접 실행을 지원하지 않으며 소스 도구는 TypeScript 지원 runtime(Node24 권장), 설치 runtime은 생성 MJS를 사용한다고 명시했다. 타입·새 현재455파일 Next 빌드·HTTP36이 통과했다. DEB 생성/검증/설치/APT 생성은 실행하지 않았고 최종 배포 단계로 유지한다. scripts는 TS107개/MTS2개/TSX1개/MJS13개이며 전체 전환과 최종 검수는 진행 중이다.

웹 DEB 검증 도구를 TypeScript로 전환했다. 프로젝트/버전·재귀 파일 경로·manifest JSON/hash·helper 오류 출력·패키지 설명 함수/응답 record·문단 list·서버 검사 결과 list 경계를 연결했다. 코드의 description 변수명 충돌을 해소했고 admin runtime import 검사의 certificate-execution/sudo-policy 파일명을 실제 생성 MJS와 맞췄다. npm 검증 명령은 TS 경로를 사용하며 새 증거는 지정 빌드 root로 기록한다. Node22 생성 plain MJS 구문 및 잘못된 프로젝트/버전의 DEB 검사 전 거부·타입·새 현재455파일 Next 빌드·HTTP36이 통과했다. 실제 DEB 검사/생성/설치나 배포 검증 합격은 수행·주장하지 않았으며 최종 배포 단계로 유지한다. verify-package-server 자체는 아직 JavaScript이고 이후 전환/현재 runtime 경로 재검사가 필요하다. scripts는 TS108개/MTS2개/TSX1개/MJS12개이며 전체 전환과 최종 검수는 진행 중이다.

PostgreSQL 원격 helper worker와 준비 source 도구를 TypeScript로 전환했다. root 및 /etc(또는 /etc/postgresql)·/var/lib/linux tmpfs 조건·helper JSON object/list·namespace probe 모듈/argv·오류 경계를 연결했다. 설치 runtime의 sandbox 파일명은 생성 MJS로 수정했고 두 Python 원격 제어기는 제거된 MJS 파일 대신 변환된 JS 문자열을 받는다. 별도 remote helper의 runtime hash 확인도 TS 원본 경로 대신 준비된 MJS 바이트를 비교하며 image ID 형식·임시 mount/증거 경로를 지정 root로 맞췄다. Node22 worker 구문/일반 호스트 초기 거부와 관련 helper/HBA 회귀14·타입·두 Python AST 구문이 통과했다. 실제 SSH/원격 helper/native DB/DEB는 실행하지 않았고 해당 합격으로 처리하지 않았다. 제품455파일은 현재 빌드 snapshot과 같아서 빌드를 반복하지 않았다. scripts는 TS110개/MTS2개/TSX1개/MJS11개이며 전체 전환과 최종 검수는 진행 중이다.

nginx 격리 제어기와 내부 실행 문자열을 TypeScript/별도 TS worker로 전환했다. worker의 JSON object/list·native argv·predicate·uid map 타입을 연결하고 새 PID/temp/mount와 하위 임시 환경을 지정 빌드 root로 맞췄다. fixture에는 현재 helper의 CommonJS metadata·고정 MJS runtime closure/manifest를 복사한다. 최초 Node22 격리 실행은 배포판 Node의 externalized builtin 라이브러리 부재로 실패했고 증거를 보존했다. /usr/share/nodejs를 존재 시 읽기 전용으로 연결한 뒤 실제 Node22/Node24에서 apply/reload·버전 편집·backup restore·stale toggle 거부·disable/enable·구문 실패 원복·TLS/redirect 보존·stale HTTPS 거부·reload 실패 원복 각9개가 통과했다. worker 일반 호스트 초기 거부·관련 회귀4/Node22 native outer2·타입도 통과했다. 네트워크는 별도 namespace이며 호스트 nginx 서비스/설정/패키지/DEB는 변경하지 않았다. 제품455파일 snapshot은 동일하다. scripts는 TS112개/MTS2개/TSX1개/MJS10개이며 기존 String.raw JS runtime generator가 있는8개 파일 위치도 남은 전환 대상으로 명시했다(새 기능 추가가 아님). 전체 전환·최종 검수는 진행 중이다.

SSR request-cache 도구의 생성 JSX 페이지·untyped layout/metrics/route와 합성 auth/status/security/service 모듈을 TSX/TypeScript로 전환했다. PageSession·searchParams Promise·ReactNode·읽기 kind/count·typed global map·경고 배열·nullable seed를 연결했고 fixture tsconfig와 실제 타입 검사를 추가했다. 현재 두 공유 모듈의 정확한 바이트를 사용해 실제 Node24/Node22 Next 개발 Server Component 렌더링에서 요청당 session/status/security/service 1회·두 동시 사용자의 ID/계정 격리·만료 request의 session 1회와 metadata 0회/로그인 리다이렉트를 확인했다. 생성 fixture 타입·Node22 plain MJS/controller 회귀·전체 타입·자체 서버/fixture 정리도 통과했다. backend는 합성 읽기 counters이며 운영 계정/정책/서비스/DEB는 변경하지 않았다. 제품455파일 snapshot은 같아서 빌드는 반복하지 않았다. MJS 도구는10개로 같고 남은 literal JSX 생성 위치는2곳이다. 전체 전환·최종 검수는 진행 중이다.

Redis startup 제어기·String.raw 실행 문자열·원격 준비 도구를 TypeScript/별도 TS worker로 전환했다. candidate/graph version·native 옵션·helper JSON/오류·검수 결과·namespace/synthetic 설정 조건을 연결했다. root/tmpfs와 고정 합성 설정을 확인하며 helper 모드는 private state mount도 확인한다. 제어기는 현재 고정 MJS closure를 복사하고 /tmp 생성/mount/청소 대신 지정 root와0700 scratch를 사용하며 fingerprint용 현재 TS 한 파일만 읽기 전용으로 연결한다. 원격 Python은 source 문자열 분할/연쇄 변형 대신 명시 parser/helper 모드 자료를 받으며 모듈 경로·결과 출력은 준비 도구에서 변환한다. Node22 제어기/worker/두 원격 모드 구문·일반 호스트/부적절한 실행 파일 초기 거부와 후보 회귀5·타입·Python AST 구문이 통과했다. 현재 PC에는 Redis 실행 파일이 없어 실제 Redis startup/SSH/native helper는 실행하지 않았고 native 합격으로 처리하지 않았다. 제품455파일 snapshot은 동일하다. scripts는 TS115개/MTS2개/TSX1개/MJS9개이며 기존 literal JS runner 위치는7개로 줄었다. 전체 전환과 native/최종 검수는 진행 중이다.

nginx reviewed 제어기와 String.raw 실행 코드를 TypeScript/별도 TS worker로 전환했다. native argv/env·프로세스 어댑터·wait predicate·graph 필수 파일·409 오류 경계를 연결하고 실행 전 UID map의 전용 namespace 조건을 확인한다. 고정 현재 MJS closure와 fingerprint용 TS7파일 snapshot을 복사하고 PID/temp/캐시/tmpfs/임시 환경은 지정 빌드 root를 사용한다. 배포판 Node의 externalized builtin도 존재 시 읽기 전용 연결한다. 실제 Node24/Node22에서 stale PID/start 거부·검토 후 include 적용/HTTP 응답·stale graph 거부·backup restore/HTTP·native 구문 실패 원본 보존·주입 reload 실패 원복/재검수/재로드 각6개와 outer 회귀4·타입이 통과했다. systemd는 합성 어댑터이며 실제 systemd 합격으로 처리하지 않았고 호스트 서비스/설정/패키지/DEB는 변경하지 않았다. 제품455파일 snapshot은 동일하다. scripts는 TS117개/MTS2개/TSX1개/MJS8개이며 기존 literal JS runner 위치는6개로 줄었다. 전체 전환·최종 검수는 진행 중이다.

## 다음 단계

1. 남은 관리 helper와 CLI·빌드/검수 스크립트: Node 22 실행 및 배포 호환성 유지
2. 전체 타입 검사·회귀·현재 빌드 실행 검수
3. 최종 배포 단계에서 DEB 갱신 및 설치·Tauri 실제 GUI 검수

`allowJs`는 전환 중 기존 코드와의 연결을 위한 설정이다. JS 파일이 남은 상태를 전체 TypeScript 전환 완료로 판정하지 않는다. 파일 확장자 변경만으로 끝내거나 `@ts-nocheck`, 빌드 오류 무시로 검사를 생략하지 않는다.

PostgreSQL HBA 실제 GUI 제어기와 proxy/page fixture를 TypeScript/TSX로 전환했다. 실제 접속 규칙 DTO·API overload·SecurityPolicy와 JSON 응답 경계를 연결하고 typed production fixture build를 먼저 실행한다. 실제 private PostgreSQL18.6에서 내장 브라우저를 통해 적용/백업 복원, reload 실패 자동 복구, 실제 적용 child SIGKILL 이후 명시 복구의 세 모드를 확인했다. 원본 bytes·한글 데이터·감사 결과·journal 해제 및 자체 클러스터/fixture 정리가 모두 통과했다. privileged transport와 pg_ctl 서비스 연결은 fixture adapter이며 실제 systemd/helper 검수로 주장하지 않는다. 화면은 tool로 표시했지만 screenshot 파일은 저장되지 않았다. Node22 plain MJS 구문/미지원 모드 기동 전 거부와 관련 회귀21·타입 검사를 통과했다. Node22 전체 native GUI 모드는 별도 미실행이다. 제품455파일 snapshot은 동일하고 scripts는 TS119개/MTS2개/TSX2개/MJS7개이다. 생성 JSX는 postgresql-operation-gui.ts 한 곳이 남는다. 기존 JavaScript 테스트/helper/runtime generator와 최종 검수를 포함한 전체 전환은 진행 중이며 DEB 생성·검증·설치는 실행하지 않았다.

PostgreSQL 로컬 lifecycle 제어기를 TypeScript로 전환했다. 실제 RestoreOptions·API bridge·후보 검수 입력 타입 및 unknown JSON/오류 경계를 연결하고 fixture/증거/하위 임시 환경을 지정 빌드 root로 옮겼다. 실제 PostgreSQL18.6에서 Node24 기본6개 및 reviewed/authenticated API9개 검수와 Node22 emitted MJS 기본6개 native 검수가 통과했다. 적용/원본 백업/구문 거부/실패 원복/한글 데이터/정리, reviewed stale proof 거부와 Better Auth·Origin·read-only/database/sudo 정책 거부 및 감사 결과를 확인했다. privileged helper/systemd/GUI 또는 Node22 reviewed API 합격으로 확대하지 않는다. 첫 emitted 테스트의 고정 의존성 목록 누락 실패는 보존했고 수정 후 회귀15개·타입 검사가 통과했다. npm local/native 검수 명령에서 이미 전환된 세 파일의 삭제된 MJS 경로도 TS로 바로잡았으며 현재 제품455파일 production 컴파일과 HTTP36개가 통과했다. scripts는 TS120개/MTS2개/TSX2개/MJS6개이며 기존 helper/JS 테스트/생성 코드와 최종 검수는 남아 있다. DEB 생성·검증·설치는 실행하지 않았다.

Redis/MariaDB 수동 설정 백업 검수 제어기를 TypeScript로 전환하고 내부 String.raw JS 실행기를 별도 typed worker로 분리했다. 기존 dpkg-query/systemctl/sudo 합성 명령도 하나의 TypeScript fixture로 추출해 plain MJS로 생성하며 일반 호스트를 uid/단일 user mapping 검사로 거부한다. JSON backup/catalog/request·process/port/close·source snapshot·unknown 오류 경계를 연결하고 /tmp fixture/mount/marker/검사 경로를 지정 빌드 root로 옮겼다. 고정 현재 admin runtime과 별도 worker runtime을 생성하며 Node22 externalized builtin readonly 연결을 포함한다. 실제 격리 helper Redis/MariaDB 백업5개 흐름이 Node22에서 통과했고 최신 compiled Next.js 인증 API→실제 helper→감사13개 흐름은 Node24에서 통과했다. 인증/Origin/정책 차단, stale/injected request 거부, 원본/비밀 비노출/비공개 백업 권한과 운영 서비스 미호출을 확인했다. 실제 sudo·동작 중인 DB·Redis startup·GUI 합격으로 처리하지 않는다. 관련 회귀13·타입과 제품455파일 기존 snapshot 일치가 통과했다. scripts는 TS123개/MTS2개/TSX2개/MJS5개이며 기존 inline JS runner 위치는5곳이 남는다. DEB 생성·검증·설치는 하지 않았고 전체 전환·최종 검수는 계속 진행 중이다.

관리자 native 잠금 검수 제어기·driver·parent 세 파일을 TypeScript로 전환했다. 실제 runtime DTO/callback/candidate/options, unknown JSON·VM descriptor/오류·child/stdin·Docker image/manifest 타입 경계를 연결했다. fixture·컨테이너 추출·tmpfs·후보/잠금 검사·증거 경로를 지정 build root로 옮겼으며 fixture 환경과 실제 두 tmpfs mount를 확인하고 ordinary host 실행을 거부한다. plain MJS helper runtime을 상대 import로 연결했고 manifest/runtime fingerprint의 삭제된 TS 경로를 MJS로 수정했다. 첫 VM cross-realm Error 판별과 private root 권한 실패는 확인/기록했으며 structural guard·tmpfs0700으로 수정했다. 기존 postgres16 이미지에서 Node24와 공식 portable Node22 각각 실제 UID0 helper/kernel flock/native supervisor·네 controller SIGKILL/원본 journal 복구13개 검수가 통과했다. 한글/emoji·timeout·FD3 비노출·동일 inode·legacy lease 보존도 확인했다. 실제 운영 DB 접속/서비스/systemd와 GUI 합격으로 처리하지 않는다. related 회귀7·타입·현재455파일 production 컴파일/HTTP36개가 통과했다. scripts는 TS126개/MTS2개/TSX2개/MJS2개이며 verify-package-server와 nginx-helper-isolated 및 기존 helper/JS 생성 코드/테스트가 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 전체 전환·최종 검수는 계속 진행 중이다.

nginx helper 격리 검수의 외부 제어기를 TypeScript로 전환했다. process/stdin·socket/port·JSON/hash·unknown 오류 경계와 현재 전체 빌드 snapshot 비교를 연결하고 작업/증거/tmpfs/PID/cache/marker/검사 경로를 지정 build root로 옮겼다. fixture bind에 tmpfs가 가려진 첫 실패를 보존하고 mount 순서를 수정했다. 삭제된 typed runtime 실행 경로를 실제 MJS로 고쳤고 emitted runtime의 공백 형식에도 정확히 한 번만 적용되는 checkpoint 삽입으로 수정했다. 실제 Node24·Node22 helper 적용/복원/원복/checksum 거부7개, 사이트 enable/disable 8개 중단·복구 조합, 19개 보호 요청 및 cross recovery 차단/정상 재개5개 검수가 통과했다. 교차 차단 첫 namespace worker 권한 실패는 보존했으며 후속 단독 실행은 통과했다. API/GUI/systemd 합격으로 확대하지 않는다. 회귀8·타입·현재455파일 production 컴파일/HTTP36개가 통과했다. scripts는 TS127개/MTS2개/TSX2개/MJS1개이다. 이 제어기의 내부 String.raw 실행기·checkpoint·명령 어댑터는 여전히 JavaScript이며 남은 inline runner5곳 목록에 TS 제어기 경로로 명확히 유지한다. 완전 TypeScript 완료로 처리하지 않았고 verify-package-server 및 기존 helper/JS 생성 코드/테스트·최종 검수가 남는다. DEB는 생성·검증·설치하지 않았다.

cron-scheduler-container 제어기의 String.raw JavaScript payload를 별도 TypeScript worker로 분리했다. 고정 fixture 모듈을 plain MJS로 변환하고 합성 일정 JSON 호출만 덧붙여 전송한다. worker에는 unknown 일정 입력·길이/NUL 검사·UID0/fixture 환경/지정 tmpfs 확인·child exit/signal·조건/종료 promise 타입을 연결했다. import만으로 crontab/daemon을 실행하지 않으며 ordinary host 호출을 거부한다. Node22 plain MJS 구문/import/호스트 거부와 고정 이미지/네트워크/작업 경로/타인 컨테이너 삭제 거부 전송 시뮬레이션, 일정/runtime 회귀5개 및 타입 검사가 통과했다. 실제 SSH/cron은 실행하지 않았으며 기존 분 단위 실행 gate 미완료를 유지한다. 제품455파일 기존 snapshot은 동일하다. scripts는 TS128개/MTS2개/TSX2개/MJS1개이고 기존 raw JS runner 위치는4곳이 남는다. DEB 생성·검증·설치는 하지 않았고 전체 전환·최종 검수는 진행 중이다.

cron-user-isolated 내부 String.raw 실행기를 TypeScript worker로 분리했다. 현재 cron/operations DTO를 직접 연결하고 unknown backup/HTTP JSON·headers/body·job/account/record·process/server/socket/close·409 오류 경계를 검증한다. 고정 worker 및 전체 lib runtime을 plain MJS로 생성하며 source fingerprint는 readonly 현재 TS 소스와 연결한다. ordinary UID/단일 uid map/private spool mount 및 crontab 바이너리 hash 확인 후에만 원본 fixture를 설치한다. 실제 Node24와 Node22에서 native 사용자 crontab·백업/복원·동시 충돌·HTTP bridge25개씩, 최신 compiled Next.js에서 Better Auth/권한 차단/변경/복원/정확한 감사14개가 통과했다. 회귀7·타입과 제품455파일 기존 snapshot 일치가 통과했다. 호스트 crontab은 변경하지 않았고 분 단위 scheduler 실행 또는 실제 GUI 합격으로 확대하지 않는다. scripts는 TS129개/MTS2개/TSX2개/MJS1개이며 기존 inline JS runner 위치는3곳이 남는다. DEB는 실행하지 않았고 전체 전환·최종 검수는 진행 중이다.

cron-isolated와 cron-scheduler-isolated의 기존 String.raw JavaScript 실행기를 각각 TypeScript worker로 분리했다. cron DTO·native argv/text/hash·job·child exit/signal·종료 promise를 연결했고 실제 UID0 단일 map/private spool mount를 확인한 뒤에만 fixture를 설치한다. 고정 worker와 현재 lib closure를 plain MJS로 생성하며 원본 fingerprint source는 readonly로 유지한다. 구문/환경/비활성화/재활성화/삭제/원본 복원/구문 거부/조회 실패 상태의 실제 native crontab8개 검수가 Node24와 Node22에서 통과했다. Node22 두 worker 구문 및 ordinary host 거부, 회귀5·타입·제품455파일 기존 snapshot 일치도 통과했다. scheduler worker의 실제 분 단위 실행은 재실행하지 않았으며 기존 미완료 gate를 유지한다. Python syslog fixture는 Python으로 유지했고 실제 GUI/API/운영 scheduler 합격으로 확대하지 않는다. scripts는 TS131개/MTS2개/TSX2개/MJS1개이며 남은 raw JS runner 위치는 nginx-helper-isolated.ts 한 곳이다. DEB는 실행하지 않았고 기존 helper/JS 테스트/나머지 생성 코드/최종 검수까지 전체 전환은 진행 중이다.

nginx helper의 sudo/systemctl String.raw 명령 어댑터와 inline checkpoint 함수를 각각 TypeScript fixture로 분리했다. 명령/argv/exit code·unknown 오류 경계를 타입으로 검증하고 UID0 단일 mapping 조건에서만 namespace 명령을 허용한다. checkpoint는 고정 네 phase·private ready 파일·unknown ENOENT·never 대기 promise 타입을 연결하고 alias import를 사용해 원래 module과 충돌하지 않는다. 고정 fixture를 plain MJS로 생성해 namespace copy에만 연결한다. 실제 nginx 사이트 enable/disable 중단·복구8개 조합이 통과했고 Node22 구문/import/ordinary host 거부 및 실제 helper 실행과 회귀8·타입이 통과했다. compiled Next.js fixture의 영어 오류 단언이 실제 한국어 안내와 맞지 않던 FAIL은 보존했으며 두 실제 문구를 확인하도록 수정해 로그인/권한/적용/복원/원복/checksum/정확한 감사12개 검수가 통과했다. 실제 sudo/systemd/GUI 또는 제품 배포 합격으로 확대하지 않는다. 제품455파일 기존 snapshot은 동일하다. scripts는 TS133개/MTS2개/TSX2개/MJS1개이며 nginx-helper-isolated.ts의 주 String.raw 실행기는 아직 JavaScript이고 전체 전환은 미완료다. DEB는 생성·검증·설치하지 않았다.

nginx-helper-isolated의 마지막 주 String.raw JavaScript 실행기를 별도 TypeScript worker로 분리했다. 현재 nginx topology/service DTO를 연결하고 HTTP/native helper JSON·context graph/service/sites/recovery·instrumentation/audit·Request headers/body·child/stdin/output/server/close·tuple action/payload 타입과 경계를 검증한다. helper 출력 JSON 판별 오류도 promise reject로 전달한다. 현재 worker와 전체 lib runtime을 plain MJS로 생성하며 API 전용 namespace에서 보이지 않던 absolute node_modules 링크 실패를 보존하고 readonly /mnt/source 링크로 수정했다. 실제 사이트 enable/disable8개 중단 복구, Node22 native helper7개, compiled Next.js12개, 직접 HTTP bridge11개 검수가 통과했다. 관련 회귀9·타입·제품455파일 기존 snapshot도 일치한다. 운영 서비스/실제 sudo/systemd/GUI 합격으로 확대하지 않는다. scripts는 TS134개/MTS2개/TSX2개/MJS1개이며 scripts TS/MTS 안의 String.raw 검색은0개다. 이는 전체 JavaScript 제거 완료가 아니다. verify-package-server.mjs·extensionless privileged helper·남은 PostgreSQL JSX 생성 페이지·기존 JS 테스트 및 최종 배포 검수가 남아 있다. DEB는 실행하지 않았고 전체 전환·최종 검수는 계속 진행 중이다.

마지막 PostgreSQL operation GUI 생성 page.jsx를 별도 TypeScript/TSX fixture로 전환했다. SecurityPolicy·적용/복원/복구/HBA/DB 계획 및 결과 DTO·API overload를 연결하고 미지원 요청은 reject한다. 서버 wrapper는 typed client와 mode JSON만 연결하며 production fixture build/typecheck를 먼저 실행한다. 첫 client 서버-module import 빌드 실패와 template 초기 읽기가 결과 경계 밖에 있던 Node22 검사 실패를 보존했고 client 정책을 typed synthetic 값으로 바꾸고 읽기를 catch/cleanup 안으로 옮겼다. 실제 내장 브라우저에서 기본 적용/복원/복구의 대상 전환 승인 해제, 새 대상 최종 확인/완료와 read-only 차단을 확인했다. 합성 API이고 운영 DB/helper는 실행하지 않았다. 실제 GUI PASS·템플릿/component hash·서버/fixture/임시 탭 정리·회귀39·타입·제품455파일 기존 snapshot 일치가 통과했다. screenshot은 표시됐지만 파일 저장 증거는 없다. 이 fixture의 HBA/원복결과 mode 실제 GUI는 아직 별도 미검수다. scripts는 TS134개/MTS2개/TSX3개/MJS1개이고 known literal JSX 생성 페이지 위치는0개이다. verify-package-server.mjs·privileged helper·기존 JS 테스트 및 최종 검수를 포함한 전체 전환은 미완료이며 DEB는 실행하지 않았다.

마지막 package-server 검수의 lazy client catalog 검색/응답 비교와 계정 setup 코드 생성을 TypeScript utility로 추출했다. 파일/경로/문구·Response callback·재귀 nullable 반환 타입과 절대 경로/빈 문구/이름/비밀번호 길이 경계를 확인한다. 기존 setup이 설치 런타임에 없는 lib/auth.ts/auth-store.ts를 참조하던 오류를 수정해 emitted auth-password.mjs/auth-store.mjs를 사용한다. Node22에서 emitted utility가 setup 코드를 생성하고 synthetic MJS hash/store fixture를 실행하며 공백 경로를 처리하는 것을 확인했다. catalog 내용/없는 문구/404/응답 불일치 및 web verifier 초기 metadata 거부까지 회귀3·타입·제품455파일 기존 snapshot 일치가 통과했다. 실제 계정/비밀번호·패키지 서버/DEB/설치 검수는 실행하지 않았다. 기존 일부 언어 chunk 문구는 검수의 기존 계약을 그대로 유지한 것이며 새 다국어 구현을 추가하지 않았다. scripts는 TS135개/MTS2개/TSX3개/MJS1개이고 verify-package-server.mjs의 나머지 HTTP/PTY 흐름은 아직 TypeScript 전환 대상으로 남는다. 전체 전환·최종 검수는 진행 중이다.

패키지 서버 검수의 SSE 출력/heartbeat/종료와 로그아웃 인증 해제 이벤트 읽기를 TypeScript utility로 추출했다. Response/reader/UTF8 decoder·frame·unknown JSON record/job/status/log/cursor 타입 경계를 연결하고 중복 cursor·누락/모호한 event/data·잘못된 cursor를 거부한다. 기존 warm-up chunk를 소비한 뒤 남은 job frame 조각은 인증 해제 탐색에서 그대로 건너뛰어 유효한 네트워크 분할을 실패로 처리하지 않는다. 실제 앱 terminalEventResponse에 synthetic job/authorization을 연결해 정상 이벤트와401종료를 확인했고 one-byte 한글/emoji UTF8 분할·중복/잘못된 입력·partial warm-up, Node22 emitted utility 및 web verifier 초기 metadata 거부 회귀4·타입이 통과했다. 실제 PTY/인증 계정/패키지 서버/DEB/설치는 실행하지 않았다. 제품455파일 기존 snapshot은 동일하고 scripts는 TS136개/MTS2개/TSX3개/MJS1개이다. verify-package-server.mjs의 나머지 HTTP/프로세스/다른 검수 흐름과 privileged helper·기존 JS 테스트는 계속 전환 대상이며 전체 완료로 처리하지 않았다.

패키지 서버 검수의 프로세스/env/profile/port/readiness/HTTP 요청/실패 기록/종료를 TypeScript harness로 분리했다. Node process/stdio·ProcessEnv·주소·Response/RequestInit·unknown 오류·close promise/신호 타입을 연결한다. 작업 root의 실제 경로·소유·비공개 권한을 확인하고 현재 port의127.0.0.1 요청만 허용하며 실패 증거를 지정 build root에 기록한다. 기존 synthetic HOME/USER/LOGNAME 계약과 운영 플래그 off를 유지하며 민감 이름 env/Node 옵션을 제외한다. close는 한번만 own detached group을 종료하고 이미 종료된 경우 남은3초 timer도 해제한다. Node22에서 fake npm shim으로 실제 자체 synthetic HTTP 서버를 시작/준비/요청/종료해 환경·target 제한·idempotent close·예상된 synthetic FAIL 기록의 query 비저장을 확인했다. 회귀2·타입·제품455파일 기존 snapshot 일치가 통과했다. 실제 패키지 서버/계정/DEB 검수로 확대하지 않는다. scripts는 TS137개/MTS2개/TSX3개/MJS1개이며 verify-package-server.mjs의 나머지 HTTP 검수와 privileged helper/기존 JS 테스트·최종 검수는 계속 진행 중이다.

마지막 verify-package-server.mjs의 나머지 HTTP 검수 흐름을 verify-package-server.ts로 전환하고 verify-deb.ts의 import를 연결했다. 모든 Response JSON은 unknown object 경계로 읽고 nested record/list/text·문자열 명령 목록·찾기 결과·terminal job id/status/log text/kind·nullable reader/response와 callback/인수 타입을 확인한다. 기존 로그 메타데이터는 보존하며 잘못된 값·빈 식별/상태·없거나 잘못된 목록을 거부한다. 권한/페이지/PTY/파일/Node 앱/환경/인증 검수 항목은 제거하지 않았다. 타입 검사와 JSON 경계·자산·실제 SSE 생산기 synthetic 작업·실제 synthetic server·Node22 emitted verifier의 metadata 초기 거부 회귀9개가 통과했다. 실제 packaged HTTP/DEB/설치 검수는 실행하지 않았으며 최종 배포 gate로 유지한다. 제품455파일 기존 snapshot은 동일하고 scripts는 TS138개/MTS2개/TSX3개/MJS0개이다. 이는 전체 JavaScript 제거/제품 완료가 아니다. extensionless privileged helper·기존 JS 테스트·runtime/config 예외와 최종 검수/배포가 남아 있어 전체 목표는 진행 중이다.

관리자 helper의 오류 출력을 TypeScript로 분리하고 컴파일 결과를 기존 CJS helper에 내장했다. runtime 검증 실패 중에도 오류 보고가 가능하도록 외부 runtime 의존성을 추가하지 않았다. DEB builder는 staging 전에 TypeScript 원본과 내장 출력의 일치를 확인한다. 누락/중복 marker·변경된 출력·민감한 native 오류의 비노출 회귀를 포함해 관련11개와 타입 검사가 통과했다. 변경된 실제 UID0 helper의 전용 격리 컨테이너 잠금/중단/원복13개도 통과했다. 제품455파일 snapshot은 동일하다. scripts는 TS138개/MTS4개/TSX3개/MJS0개이며 extensionless helper의 나머지 JavaScript와 기존 JS 테스트는 남는다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-error-output-20261013/result.json

관리자 helper의 nginx hash/domain/port/config/updateConfig를 standalone TypeScript로 전환하고 기존 CJS helper에 컴파일 결과를 내장했다. 타입 선언은 helper의 기존 createHash/MARK/fail 연결을 표현하며 runtime 의존성은 추가하지 않는다. staging 전 원본/내장 출력의 일치도 확인한다. 입력 주입·숫자 coercion 거부·HTTPS 인증서와 listen 보존·stale version 및 수동 설정 손실 거부를 포함한21개 회귀와 타입 검사가 통과했다. 변경된 UID0 helper의 실제 Node22 전용 격리 잠금/중단/원복13개가 통과했다. 제품455파일 snapshot은 동일하며 scripts는 TS138/MTS5/TSX3/MJS0이다. helper의 나머지 JS·기존 JS 테스트와 전체 최종 검수는 계속 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-nginx-config-20261013/result.json

관리자 helper의 rootDir/target/current/writeConfig/backup/record를 standalone TypeScript로 전환하고 컴파일 결과를 CJS helper에 내장했다. 기존 root 소유·권한·설정 파일 심볼릭/하드 링크 거부·배타적 staging/rename 실패 정리를 유지했다. 백업 읽기의 unknown JSON 형태/문자열 필드를 검증하며 일반 파일·하드 링크·크기 검사도 보강했다. digest와 관리 대상 경로 검사는 유지한다. 타입·관련 회귀21개와 실제 Node24 UID0 격리 helper 잠금/중단/복구13개가 통과했다. 파일 단위 검사는 명시적인 메타데이터 adapter이며 실제 root 파일 검수로 확대하지 않는다. 기존 제품455파일 snapshot은 동일하고 scripts는 TS138/MTS6/TSX3/MJS0이다. helper의 나머지 native/PG/dispatch/lock/main JS와 기존 JS 테스트 및 최종 검수는 남는다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-nginx-files-20261013/result.json

관리자 helper의 PostgreSQL pgSync/pgRun/pgInput/pgOwner/pgDirectories/pgRead/pgService/pgStage/pgReplace/pgApply를 standalone TypeScript로 전환하고 컴파일 결과를 기존 CJS helper에 내장했다. root/postgres 계정·파일 소유권·링크/UTF-8·bounded read와 inode/digest 충돌·후보 검수·비공개 백업·실패 원복 처리의 기존 동작을 유지했다. 입력/원본 검증과 apply/restore/restart 실패 회귀25개 및 타입 검사가 통과했다. 적용 단위 검사는 명시적인 native/소유권 adapter를 사용하며 운영 PostgreSQL 적용 검수로 확대하지 않는다. 현재 helper의 실제 Node22 UID0 격리 잠금/중단/복구13개도 통과했다. 제품455파일 snapshot은 동일하고 scripts는 TS138/MTS7/TSX3/MJS0이다. PG 백업/복원/catalog와 native/runtime/dispatch/lock/main 및 기존 JS 테스트·최종 검수는 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-postgresql-files-20261013/result.json

관리자 helper의 PostgreSQL pgBackupRecord/pgPublicValues/pgRestorePlan/pgRestore/pgBackups를 standalone TypeScript로 전환하고 기존 helper에 내장했다. unknown JSON 타입 검증과 id/kind/digest/경로/날짜/크기·권한·링크 검사를 유지하며 catalog에서도 NUL 포함 백업을 거부한다. 타입·회귀23개가 통과했다. 신규 검사에서 malformed/위변조 백업 거부, immutable backup version 확인, 지원 항목만 미리보기, 최대1000개 검사/100개 반환과 날짜 정렬/오류 집계·복구 hard-link 연결 검증을 확인했다. 단위 검사는 명시적인 native/메타데이터 adapter이며 실제 운영 DB 복원 합격으로 처리하지 않는다. 현재 helper의 실제 Node22 UID0 격리 잠금/중단/복구13개도 통과했다. 제품455파일 snapshot은 동일하며 scripts는 TS138/MTS8/TSX3/MJS0이다. MariaDB/Redis helper와 native/runtime/dispatch/lock/main JS·기존 JS 테스트·최종 검수는 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-postgresql-backups-20261013/result.json

관리자 helper의 MariaDB/Redis 백업 root와 MariaDB record/catalog, execFileSync/run native 실행 wrapper를 TypeScript로 전환했다. 비공개 권한·id/JSON/digest/대상 검증·O_NOFOLLOW descriptor·예외 시 close·내용 비노출을 유지한다. supervisor argv/stdio와 FD3·timeout·출력 제한·Unicode·exit/error 처리를 유지하며 child NODE_ENV는 고정 production이다. 초기 wrapper 구간 교체가 새 run 함수와 일치해 기존 helper 함수가 빠지는 실패를 테스트로 발견했고 typed source와 기존 고정 상수를 재조립해 수정했다. 실패 기록은 보존했다. 최종 전체 관련 회귀55개·타입 검사가 통과했으며 현재 helper의 실제 Node22 UID0 격리 잠금/중단/원복13개도 통과했다. 제품455파일 snapshot은 동일하고 scripts는 TS138/MTS10/TSX3/MJS0이다. runtime/서비스/dispatch/lock/supervisor/main 및 기존 JS 테스트·최종 검수는 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-database-native-20261013/result.json

관리자 helper의 고정 runtime 모듈 목록과 mariaRuntime loader를 TypeScript로 전환했다. 52개 integrity-checked dynamic import 연결을 실제 lib TypeScript 선언으로 검사하며 AdminRuntime 타입을 제공한다. checkout 거부·root 소유/권한/링크/크기 검증·고정 manifest key 목록·전체 checksum 확인을 유지했고 unknown manifest 형태를 명시적으로 거부한다. 첫 생성 검사에서 주석의 export 단어를 static import/export로 오인해 생성이 거부됐으나 helper 파일은 변경되지 않았고 주석을 바로잡았다. 타입·관련 회귀24개가 통과했고 현재 helper의 실제 Node22 UID0 격리 runtime load·잠금/중단/복구13개도 통과했다. 제품455파일 snapshot은 동일하며 scripts는 TS138/MTS11/TSX3/MJS0이다. 남은 서비스/inspect/apply/restore/state guard/dispatch/lock/supervisor/main JS와 기존 JS 테스트·전체 최종 검수는 진행 중이다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-runtime-loader-20261013/result.json

관리자 helper의 mariaInspect/mariaServiceSnapshot/mariaApply/mariaRestore/mariaRestorePlan/redisRestorePlan/nginxMutationStateGuard를 TypeScript로 전환했다. 실제 AdminRuntime 타입과 native wrapper 계약을 연결하고 include override/선택 파일의 존재·입력 main 문자열을 검사한다. 명령 encoding 결과는 string/Buffer를 처리하며 child NODE_ENV는 production으로 고정한다. proc bounded read/close·PID/UID/시작시각·실행 바이너리·main 링크 검사, 후보 검수와 복원 graph 재확인, 비밀 비노출 미리보기와 pending nginx 변경 차단을 유지했다. 초기 unknown main 인수 타입 오류는 명시적 문자열 검증으로 수정했다. 타입·관련 회귀36개가 통과했고 현재 helper의 실제 Node22 UID0 격리 잠금/중단/복구13개도 통과했다. 서비스 단위 검사는 명시적인 native/메타데이터 adapter이며 운영 MariaDB/Redis/systemd 합격으로 확대하지 않는다. 제품455파일 snapshot은 동일하며 scripts는 TS138/MTS12/TSX3/MJS0이다. legacy nginx apply·dispatch·lock/supervisor/main/bootstrap JS와 기존 JS 테스트·전체 최종 검수는 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-service-operations-20261013/result.json

관리자 helper의 adminLockIdentity/adminLockFile/acquireAdminLock/runNativeLockSupervisor/main과 lock marker를 TypeScript로 전환했다. fd/stat/timer/child exit와 unknown 오류를 검사하며 원자적 영구 lock 초기화·같은 inode 확인·legacy 파일 보존·SIGKILL 이후 supervisor 소유·native FD3 비전달·timeout 정리를 유지한다. stdin을 StringDecoder로 조합해 한글 UTF-8 경계 분할을 보존하고 실제 수신 byte 한도와 object payload를 파일 생성 전에 확인한다. 시작 코드의 실패 후 fd close도 검증했다. 타입·관련 회귀26개와 현재 helper의 실제 Node22 UID0 격리 잠금/중단/원복13개가 통과했다. entrypoint 단위 검사에는 명시적 파일/lock adapter가 쓰이며 실제 native 검수는 별도 전용 컨테이너 증거다. 제품455파일 snapshot은 동일하며 scripts는 TS138/MTS13/TSX3/MJS0이다. legacy nginx apply·dispatch·bootstrap/fail·마지막 catch JS와 기존 JS 테스트·전체 최종 검수는 남아 있다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-lock-main-20261013/result.json

관리자 helper의 전체 dispatch와 legacy nginx apply를 TypeScript로 전환했다. unknown payload를 object로 검증하고 각 runtime prepare 결과를 별도 typed prepared 변수로 연결한다. PostgreSQL history overload는 명시적인 true/false 분기로 호출하고 인증서 run은 실제 Promise 계약에 맞춘다. 고정 패키지 map·no-remove/no-upgrade·서비스 allowlist·nginx -t·sudo/Node caller binding·confirmation·비공개 백업·원복 거부를 유지한다. 초기 history boolean overload와 인증서 Promise 계약 오류를 수정한 뒤 타입·회귀40개가 통과했다. 현재 helper의 실제 Node22 UID0 격리 dispatch·잠금/중단/복구13개도 통과했다. 제품455파일 snapshot은 동일하고 scripts는 TS138/MTS14/TSX3/MJS0이다. helper 기능 함수는 모두 typed source에 있으며 bootstrap binding/constants/fail·마지막 main catch와 기존 JS 테스트·전체 최종 검수는 남는다. DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-dispatch-20261013/result.json

관리자 helper의 bootstrap binding/constants/fail과 마지막 main catch까지 TypeScript로 전환했다. 13개 typed source module 전체에서 extensionless CJS helper를 재현 가능하게 생성하며 전체 byte 일치를 staging 전 확인한다. generated helper의 header/상수/마지막 catch/추가 코드 또는 typed 원본 변경은 모두 거부된다. Node22 배포 runtime은 plain JavaScript이고 수동 helper JS는 남지 않는다. 타입·관련 회귀34개·Node22 plain 구문과 현재 generated helper의 실제 UID0 격리 잠금/중단/원복13개가 통과했다. 제품455파일 snapshot은 동일하고 scripts는 TS138/MTS16/TSX3/MJS0이다. 기존 JS 테스트·Next config/public runtime 예외와 전체 회귀/native/GUI/최종 배포 검수는 남는다. DEB 생성·검증·설치는 실행하지 않았다. 전체 제품은 완료로 처리하지 않는다. 증거: /mnt/data/build/tastedev-linux/typescript-admin-helper-complete-source-20261013/result.json

전환 후 전체600개 파일/1,906개 회귀를 실행해 1,902 PASS/4 FAIL을 기록했다. 새 검증 오류4개에 한국어 안내를 추가했고 PostgreSQL backup scope fixture가 함수 일부만 추출해 공유 검증 함수를 빠뜨린 문제를 전체 generated backup block 사용으로 수정했다. 관련30개와 타입 검사가 통과했다. 기존 Redis 포트 label의 영어/터키어 번역 누락2개는 다국어 후속 작업으로 유지하며 원본 실패를 삭제하거나 전체 PASS로 변경하지 않는다. 수정 후 전체 suite 재실행은 아직 하지 않았다. 현재455파일 production 컴파일과 로그인/세션/API/실제 PTY/SSE/SSR HTTP36개가 통과했다. 최신 snapshot은 /mnt/data/build/tastedev-linux/tastedev-current-build-fuRcdE이다. 기존 JS 테스트·config/public runtime 예외 및 native/GUI/전체 최종 검수·배포는 남아 있으며 DEB 생성·검증·설치는 실행하지 않았다. 증거: /mnt/data/build/tastedev-linux/typescript-full-regression-corrections-20261013/result.json

현재 cron 실제 분 단위 실행 검수 gate를 닫았다. 103번의 기존 검수 이미지는 shell entrypoint와 cron 부재로 실패했고 원본 증거를 보존했다. 전송 controller가 Node entrypoint를 명시하도록 수정하고 모의 전송/소유권 정리 검사를 보강했다. 기존 이미지에서 파생한 전용 QA 이미지에만 cron을 설치했으며 호스트 apt/서비스는 변경하지 않았다. Node-only worker와 지정 tmpfs·네트워크/호스트 마운트 없는 전용 컨테이너에서 실제2분 주기117224ms 동안 초기 실행/환경 유지/처음부터 비활성 미실행/편집 반영/기존 작업 비활성/편집 작업 환경 유지6개가 통과했다. cron3.0pl1-197과 두 native binary SHA를 기록했고 자체 검수 컨테이너가 남지 않았음을 확인했다. transport/worker 회귀3·타입과 기존455파일 snapshot 일치도 통과했다. 계정은 container root fixture이며 GUI·app mutation API 합격으로 확대하지 않는다. DEB 생성·검증·설치는 실행하지 않았고 전체 제품 완료로 처리하지 않는다. 증거: /mnt/data/build/tastedev-linux/cron-current-native-scheduler-20261013/result.json

현재 typed PostgreSQL operation fixture의 HBA와 outcomes 두 모드를 실제 내장 브라우저에서 확인했다. HBA 첫409 진단·재검토·확인창에서 대상 변경 시 확인 해제·새 other 대상 적용 기록·조회 전용 차단을 확인했다. PostgreSQL/MariaDB/Redis 적용 실패 및 PostgreSQL 백업 복원 실패 응답은 성공으로 표시되지 않고 원본 복원/서비스 복구 alert와 백업 ID를 표시하며 확인 절차/중복 실행 비활성도 유지했다. HBA 제어기는 PASS로 종료했다. outcomes 제어기는143으로 중단되어 자동 완료를 주장하지 않으며, 실제 관찰 결과·production BUILD_ID·다섯 source와 template 일치를 독립적으로 확인/기록하고 정확한 cwd/시작시각이 일치한 자체 서버만 종료했다. 두 fixture/탭을 정리하고 사용자 탭은 보존했다. 화면 이미지는 도구에 표시됐지만 파일로 저장되지 않았다. 명시적인 응답 adapter이며 운영 DB/native helper 검수로 확대하지 않는다. 제품455파일 snapshot은 그대로이며 디자인 수정/DEB 생성·검증·설치는 하지 않았다. 전체 목표는 미완료다. 증거: /mnt/data/build/tastedev-linux/operation-gui-current-20261013/result.json

PostgreSQL operation GUI 제어기의 SIGTERM/SIGINT 종료 처리를 보강했다. 자체 자식만 종료하고 interruption을 실패로 기록한 뒤 fixture를 정리한다. child의 signalCode도 확인해 신호 종료된 프로세스를 계속 실행 중으로 보지 않으며 정리 close listener를 종료 신호보다 먼저 설치한다. 실제 제어기와 실제 전용 Node 자식으로 두 신호의 종료/실패 기록/폴더 제거를 확인했고 타입 검사가 통과했다. Next 빌드와 HTTP 준비는 명시적인 모의이며 실제 GUI 검수로 확대하지 않는다. 초기 preload regex escape 실패는 보존했고 URL 파싱 검사로 수정했다. 제품455파일 snapshot은 동일하다. 운영 앱/DB·디자인 변경과 DEB 생성·검증·설치는 하지 않았다. 전체 목표는 미완료다. 증거: /mnt/data/build/tastedev-linux/operation-gui-signal-cleanup-20261013/result.json

2026-10-13: 제품 개발 소스는 TypeScript로 유지하며 tsconfig의 strict=true, allowJs=false를 적용했다. 설치본 JavaScript를 읽는 검수 도구에는 원본 TypeScript 함수 계약을 연결한 선언을 추가했다. 실제 tsc --noEmit --incremental false가 통과했고, declarations 폴더를 포함한 현재 456파일 Next.js production snapshot 및 HTTP 36개가 통과했다. 전체 회귀 601파일/1907항목 중1905PASS,2FAIL이며 두 실패는 기존 Redis 포트 라벨의 다국어 설명이고 한국어 우선 지시에 따라 미룬 상태다. 결과를 PASS로 바꾸지 않았다. Tauri release 실행 파일을 실제 재컴파일했고 설치된 개발 PC 바이너리와 SHA-256이 일치했다. 원시 Rust 컴파일은 native GUI 관찰 합격이 아니다. 현재 소스 최종 배포 준비를 진행하며 전체 목표는 아직 미완료다. 증거: /mnt/data/build/tastedev-linux/typescript-strict-source-20261013/result.json

현재 최종 웹 DEB를 생성해 실제 packaged 로그인/PTY/설정 검수를 통과한 뒤103번에 재설치했다. 설치 전 auth native module과 의존성, 기존 계정·설정·코드 백업을 확인했고 이후 서비스 active/login200/protectedAPI401/계정·설정 바이트 보존/빌드ID 일치와 TypeScript에서 생성된 실제 root-owned runtime164개 해시 일치를 확인했다. 빌드ID EMWcvSvbo3xNwWHjzf74T, DEB SHA-256 d2336c9897eb3cc6c7e8172008aa43e1ae8ed81c233d7616c3f0c3b0b8d18ae7. 첫 검수의 fixture root 권한 실패는 별도로 보존했으며 압축 해제 후0700복구를 수정했다. 도구 수정 후 실제 final DEB 검수, 관련 회귀3개와 타입 검사 통과. 개발 PC의 웹 갱신은 sudo interactive 인증이 필요해 사용자 명령 실행을 기다리고 있으며 installed Tauri native GUI는 아직 관찰 합격이 아니다. 다국어2FAIL도 지우지 않았고 전체 목표는 진행 중이다. 증거: /mnt/data/build/tastedev-linux/final-deployment-20261013/result.json

Tauri 설치본 사용자 검수 완료: 사용자는 현재 창에서 로그인·메뉴 이동·터미널 표시가 정상이라고 확인했다. 해당 installed Korean build(EMWcvSvbo3xNwWHjzf74T)의 native 기본 화면 검수만 PASS로 기록했다. 캡처 파일은 없으며 전체 다국어 합격으로 확대하지 않았다. 한국어 우선 순서의 완료 조건을 받은 뒤 기존26개 카탈로그에 Redis 포트(0=TCP listening disabled) 설명을 보완했다. 과거 실패2개를 포함한 관련11개와 타입 검사가 통과했고26개 카탈로그 각각2233개 canonical 메시지가 누락0/변수오류0/한국어잔존0이었다. 기존 전체회귀1907개 결과는 보존했고 이번 수정 후 전체 회귀는 아직 재실행하지 않았다. Linux 언어324개 항목의 base를 실제 집계하면 아직 영어 fallback180개가 남는다. source-only multilingual 수정이며 accepted Korean 설치본·DEB는 변경하지 않았다. 증거: /mnt/data/build/tastedev-linux/tauri-user-acceptance-QW5Sr8/multilingual-progress.json

다국어 확장 첫 단계: 카탈루냐어 ca-ES의 로그인·공통 메뉴·기본 조작·IDE 트리/설정 문구246개를 실제 카탈루냐어로 추가했고 서버 카탈로그와 lazy client loader에 연결했다. 2233개 기준1987개는 여전히 영어 fallback이며 coverage.complete=false/부분 번역으로 표시한다. 기존26개 완성 카탈로그를 포함한 complete base27개(한국어 포함)는 유지했고 영어 fallback만 있는 base179개와 부분 번역ca1개, 즉 전체 번역 미완료 base180개를 그대로 기록한다. country cookie/SSR/client equality/English fallback/파일명·변수·개행 보존/프로토타입 경계·세 글자 Linux 언어 코드 검사 관련 회귀23+3+2가 통과했고457파일 실제 production build, 실제 ca 로그인 h2와 Nginx 노드 선택 안내를 포함한 HTTP37개 및 타입 검사가 통과했다. 처음 h1 선택자와 아포스트로피 HTML entity 미처리로 실패한 검수 결과2개는 보존했고 actual h2/HTML text escaping으로 검수 코드만 수정했다. 디자인·DEB·설치본은 변경하지 않았다. source-only이며 전체 다국어 완료로 처리하지 않는다. 증거: /mnt/data/build/tastedev-linux/catalan-localization-qF5VOC/result.json

카탈루냐어 운영 화면 확장: 기존246개에서546개로300개 문구를 추가했다. 데몬·로그·백업/복구·보안·감사·nginx server 폼·Certbot·cron·패키지 설정과 오류 안내를 포함한다. 키·변수·개행·지역 선택·서버/클라이언트·영어 fallback·파일명 보존의 관련26개와 타입 검사 및 카탈로그 검수가 통과했다. 추가된 운영 안내의 sudo -n/NOPASSWD/nginx 식별자/work_mem/pg_hba.conf/AOF/RDB/PORT/HOST/LOG_LEVEL/[mariadbd]/dry-run/System Node.js 경로 보존을 실제 번역 문자열로 검사했다. 이번 변경은 카탈로그 데이터와 검수 테스트만으로 디자인·명령 실행·빌드·DEB·설치를 변경하지 않았다. 1687개 카탈루냐어 문구 및179개 영어 fallback base와 향후 전체 검수/배포가 남아 전체 완료가 아니다. 증거: /mnt/data/build/tastedev-linux/catalan-operational-copy-rqO2q5/result.json

카탈루냐어 설정·오류 안내 확장:546개에서796개로250개 문구를 추가했다. 설정 비교·DB 복원 영향·include 조회·Node 서비스 등록/변경/복원·nginx 구문 검사·인증서 갱신·cron 예약·sudo 권한 안내를 포함한다. Redis LRU는 마지막 사용 이후 경과 시간, LFU는 사용 빈도로 명확히 구분하고 TTL 대상·noeviction의 키 보존/쓰기 거부 의미를 실제 번역 검수에 추가했다. 관련5개와 타입·전체 카탈로그 무결성 검사가 통과했다. 디자인·운영 명령·소스 production 재빌드·HTTP·DEB·설치는 변경하지 않았다. 아직 카탈루냐어1437문구와179개 영어 fallback base 및후속전체검수/배포가 남는다. 증거: /mnt/data/build/tastedev-linux/catalan-configuration-guidance-CeXjuI/result.json

카탈루냐어 nginx 도움말·권한 안내 확장:796개에서996개로200개 문구를 추가했다. sudo 관리 규칙 경고·nginx/Redis 검사·버퍼와 전송·upstream 시간 제한·gzip/TLS·미저장 노드 코드 복구·MariaDB 복원 영향을 포함한다. read/write timeout이 전체 응답 시간이 아닌 연속 읽기/쓰기 사이의 간격임을 문구·검사에서 구분했다. Location/Refresh/Vary: Accept-Encoding/error_page/sendfile/clean/HTTP/1.1 식별자도 실제 번역 보존 검수에 추가했다. 관련6개·타입·카탈로그 무결성 검수가 통과했다. source-only이고 디자인·서비스·빌드·HTTP·DEB·설치는 변경하지 않았다. 아직 카탈루냐어1237개 문구와179개 영어 fallback base 및전체후속검수/배포가 남는다. 증거: /mnt/data/build/tastedev-linux/catalan-nginx-help-aBr4Ds/result.json

카탈루냐어 복구·터미널·고급 도움말 확장:996개에서1296개로300개 문구를 추가했다. 환경 파일 복원·비밀 값·인증 저장소0700/0600·터미널 입력·감사 건수 변수·HBA apply/reload와 중단 복구·nginx worker/FastCGI/stream/mail/컨텍스트·CA 인증서 도움말을 포함한다. terminal4096문자/4096바이트, 변수total/visible, LINUX_AUTH_ROOT/LINUX_ENABLE_TERMINAL=true, $fastcgi_script_name/PATH_INFO/proxy_ssl_server_name, 신뢰 CA 파일 비전송과 client CA 목록 전송의 구분을 실제 문구로 검수했다. 관련8개·타입·카탈로그 무결성 검사가 통과했다. source-only이고 디자인·서비스·빌드·HTTP·DEB·설치는 변경하지 않았다. 카탈루냐어937개 문구와179개 영어 fallback base 및후속전체검수/배포가 남는다. 증거: /mnt/data/build/tastedev-linux/catalan-recovery-terminal-help-BEy9UO/result.json

### Catalan cache, real-IP and recovery guidance

Catalog expanded from 1296 to 1476 of 2233 messages; 757 remain untranslated. Targeted tests passed 9 assertions, nonincremental TypeScript checking exited 0, and catalog validation passed. Evidence: /mnt/data/build/tastedev-linux/catalan-cache-realip-guidance-3l4qoV/result.json. No design changes, rebuild, HTTP rerun or package deployment was performed; installed Korean acceptance remains unchanged.

### Catalan site operations and nginx proxy guidance

Catalog expanded from 1476 to 1656 of 2233 messages; 577 remain untranslated. Added site conflict/recovery and node copy/paste messages, Certbot hook and webroot integration explanations, AI consent copy, nginx worker/file I/O and proxy/TLS guidance. Targeted tests passed 10 assertions, nonincremental TypeScript checking exited 0, and catalog validation passed. Evidence: /mnt/data/build/tastedev-linux/catalan-proxy-site-guidance-iH90bd/result.json. No design changes, live AI requests, rebuild, HTTP rerun or package deployment. Overall multilingual scope remains incomplete.

### Catalan TLS, data restore and application settings

Catalog expanded from 1656 to 1796 of 2233 messages; 437 remain untranslated. Added certificate and OCSP explanations, PostgreSQL data operation messages, external access/restart, terminal and AI/local LLM settings copy. Tests passed 11 assertions including replay protection, login requirement for external access, restore failure state and reconnect URL substitution. Type checking and catalog validation passed. Evidence: /mnt/data/build/tastedev-linux/catalan-tls-data-settings-0S2ZLL/result.json. No design changes, live AI calls, rebuild, HTTP rerun or deployment. Multilingual scope remains incomplete.

### Catalan administrative, HBA and file/cron diagnostics

Catalog expanded from 1796 to 1976 of 2233 messages; 257 remain untranslated. Added component showcase copy, settings/restart validations, tree node constraints, helper permissions, interrupted outcome warnings, PostgreSQL connection rule diagnostics and file/cron validation. Tests passed 12 assertions, type checking and catalog validation passed. Evidence: /mnt/data/build/tastedev-linux/catalan-admin-hba-diagnostics-8KA79h/result.json. No design changes, rebuild, HTTP rerun or deployment. Multilingual scope remains incomplete.

### Complete Catalan canonical UI catalog

Added the final 257 messages, completing 2233/2233 canonical source keys. Tests passed 13 assertions including full key equality, variable multiplicity/newline parity, server/client loading and three-letter locale validation. Type checking and catalog validation passed. Evidence: /mnt/data/build/tastedev-linux/catalan-complete-catalog-jORyR7/result.json. This proves source catalog coverage, not native linguistic acceptance, full configuration-description translation or installed GUI acceptance. No design changes, live AI requests, rebuild, HTTP rerun or deployment. 179 other base languages still use English fallback; broader multilingual scope remains incomplete.

### Current complete Catalan compiled SSR verification

The current 457-file product snapshot passed Next.js production compilation. The emitted Node22 HTTP controller passed its test and 37 actual HTTP checks, including rendered Catalan login title, authenticated settings header and nginx node-selection guidance, saved-language cookie precedence, session retention across process restart and real PTY/SSE input/output. Temporary validation server stopped. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/catalan-current-compiled-ssr-tpUcnS/result.json. This is source compilation and HTTP SSR proof, not visual/native linguistic acceptance or deployment. Installed Korean app remains unchanged; multilingual scope remains incomplete.

### Catalan PostgreSQL descriptions and HBA help

Added all 27 connection-rule explanations and 12 of 351 setting explanations (7 common parameters plus 5 overrides); 339 setting descriptions still use explicit English fallback. Native Catalan fallback/unavailable/comment labels added. Tests passed 11 assertions including actual HBA component static rendering with the source unchanged, first-match authentication, TLS password transport, row_security failure semantics and include ordering. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/catalan-postgresql-help-cLbt4s/result.json. These source additions follow the last compiled snapshot; no rebuild, HTTP rerun, design change, live AI call or deployment.

### Catalan PostgreSQL maintenance, planner and durability explanations

Added 115 setting explanations, increasing coverage from 12 to 127 of 351; 224 remain explicit English fallback. Tests passed 13 assertions including inherited -1 limits versus disabled insert/maximum thresholds, microseconds versus milliseconds, reciprocal archive fallbacks, planner cache estimates and full-page crash recovery. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/catalan-postgresql-maintenance-planner-a5J5BA/result.json. No rebuild, HTTP rerun, design change or deployment; complete UI key coverage does not imply complete package setting descriptions or native language acceptance.

### Catalan PostgreSQL replication, logging and memory explanations

Added 120 descriptions, increasing coverage from 127 to 247 of 351; 104 remain explicit English fallback. Tests passed 14 assertions including byte versus kilobyte limits, full -1 parameter values versus disabled logging, unlimited standby waits, transaction versus nontransaction idle timeouts and io_method=worker. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/catalan-postgresql-logging-replication-Dq7iau/result.json. No rebuild, HTTP rerun, design change or deployment; native-language and broader multilingual scope remain incomplete.

### Complete Catalan PostgreSQL setting descriptions

Added the final 104 descriptions, completing all 351 effective setting descriptions (346 imported translations plus 5 overrides) alongside 27 HBA explanations and the 2233-message UI catalog. Tests passed 26 assertions covering full parameter equality, regional/case resolution, unchanged HBA source during rendering, TLS 1.2 versus 1.3 ciphers, TCP OS defaults, prepared-transaction exclusions and WAL retention/deletion semantics. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/catalan-postgresql-complete-Unj2n3/result.json. Source coverage does not imply native linguistic acceptance, current compiled GUI proof or deployment. No rebuild, HTTP rerun, design change or deployment; wider multilingual scope remains incomplete.

### Catalan PostgreSQL component, search and emitted Node22 verification

Extended the real file-setting, grouped package-setting and language-provider SSR tests to Catalan. Description/aria rendering, uppercase Catalan search and original-text preservation passed in 14 tests. The emitted runtime test additionally executes all 351 setting explanations and 27 HBA explanations under Node22 with type stripping disabled; 21 inner assertions passed. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/catalan-postgresql-render-runtime-Qmw7X1/result.json. This proves component rendering and emitted runtime loading, not browser visual/native linguistic acceptance. No rebuild, HTTP rerun, design change or deployment.

### Current source full regression and SSR fixture watcher repair

Current 457-file source build passed. Full regression ran 604 files and 1925 assertions: 1924 passed; the sole failure was an EMFILE file-watcher resource error in the SSR cache dev fixture. The original failed result is preserved at /mnt/data/build/tastedev-linux/tastedev-linux-tests-vnO50D/result.json. Set WATCHPACK_POLLING=1000 only for that fixture child; the identical emitted Node22 SSR/cache isolation test then passed, including typed fixture checking, per-request sharing, concurrent-user isolation and expired-session metadata gating. Type checking passed. Full regression was not rerun after this fixture-only repair. Current compiled HTTP verification passed 37 checks and stopped its temporary server. Reconciliation: /mnt/data/build/tastedev-linux/current-regression-reconciliation-ZLmc8O/result.json. Installed apps/design unchanged; no package build or deployment. Wider multilingual/native linguistic/visual scope remains incomplete.

### Finnish PostgreSQL common settings and HBA help

Added all 27 Finnish connection-rule explanations and 12 of 351 effective setting descriptions (7 common parameters plus 5 overrides); 339 remain explicit English fallback with Finnish notices. Tests passed 17 assertions including regional/case lookup, security semantics and actual HBA component static rendering without source changes. Existing unsupported-language fallback tests use Czech, which still has no PostgreSQL description catalog. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/finnish-postgresql-help-vu91WW/result.json. No rebuild, HTTP rerun, design change or deployment. The previous full regression predates these source additions. Wider multilingual scope remains incomplete.

### Finnish PostgreSQL WAL, maintenance and checkpoints

Added 65 descriptions, increasing effective setting coverage from 12 to 77 of 351; 274 remain explicit English fallback. Tests passed 18 assertions, including inherited -1 defaults versus disabled insertion/maximum thresholds, milliseconds versus microseconds, archive_command/archive_library fallback and escaped quote preservation. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/finnish-postgresql-maintenance-XXlPjc/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Finnish PostgreSQL planner, durability and I/O explanations

Added 84 descriptions, increasing effective setting coverage from 77 to 161 of 351; 190 remain explicit English fallback. Tests passed 19 assertions including planner cache estimates, fsync/full-page crash recovery, transaction versus nontransaction idle limits, io_method=worker and disabled JIT thresholds. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/finnish-postgresql-planner-io-zBEedc/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Finnish PostgreSQL logging, locks and replication explanations

Added 86 descriptions, increasing effective setting coverage from 161 to 247 of 351; 104 remain explicit English fallback. Tests passed 20 assertions including full logged values versus disabled logging, byte versus kilobyte units, unlimited standby waits, predicate lock escalation and replication-slot failure semantics. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/finnish-postgresql-log-replication-obGhrM/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Complete Finnish PostgreSQL descriptions

Added the final 104 descriptions, completing all 351 effective setting descriptions (346 imported translations plus 5 overrides) and 27 HBA explanations. Unix socket terminology corrected consistently. Tests passed 21 assertions covering complete parameter equality, region/case lookup, protocol versions, TCP OS defaults, prepared-transaction exclusion and WAL retention/shared-buffer defaults. Type checking passed. Evidence: /mnt/data/build/tastedev-linux/finnish-postgresql-complete-CVFpjp/result.json. Source coverage does not prove native linguistic acceptance, compiled visual GUI acceptance or deployment. No rebuild, HTTP rerun, design change or deployment; wider multilingual scope remains incomplete.

### Finnish PostgreSQL component and current compiled verification

Real file-setting, grouped package-setting and provider SSR tests now include Finnish. Uppercase Finnish explanation search and language switching preserve configuration text; 14 tests passed. Emitted Node22 runtime checks all 351 setting and 27 HBA descriptions in Catalan and Finnish within 21 inner assertions. Type checking passed. Current 457-file product compilation and 37 actual HTTP checks passed; temporary HTTP server stopped. Evidence: /mnt/data/build/tastedev-linux/finnish-postgresql-render-compiled-abMBDv/result.json. This proves component/SSR/runtime scope, not browser visual/native linguistic acceptance or deployment. Installed apps/design unchanged; no package build. Wider multilingual scope remains incomplete.

### PostgreSQL description schema and effective coverage checker

Added npm run i18n:descriptions to validate setting/override/HBA schemas and report effective translated/missing counts independently of UI key coverage. Empty/malformed text, unknown keys, invalid language codes and Korean remnants are rejected; absent description catalogs for translated UI languages are reported as missing. Runtime-compatible lowercase override aliases handle DateStyle/TimeZone/IntervalStyle. Initial alias failure is preserved; corrected tests passed 4 assertions including actual CLI failure/success behavior. Current TypeScript check passed. Evidence: /mnt/data/build/tastedev-linux/description-catalog-check-puQU2Q/result.json. Native translation quality and visual acceptance are outside this automated check. No rebuild, HTTP rerun, design change or deployment.

### Dutch PostgreSQL common settings and HBA help

Added all 27 Dutch connection-rule explanations and 12 of 351 effective setting descriptions. Missing 339 setting descriptions retain explicit English fallback with Dutch notices. Netherlands/Belgium preferences, first-rule authentication, plaintext password transport, row_security failure semantics, include ordering and per-operation work_mem scope verified. Tests passed 15 assertions including actual HBA component static rendering and description checker CLI; type checking and source schema validation passed. Evidence: /mnt/data/build/tastedev-linux/dutch-postgresql-help-wTJ4Ds/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Dutch PostgreSQL WAL and maintenance explanations

Added 65 explanations, increasing effective setting coverage from 12 to 77 of 351; 274 remain explicit English fallback. Tests passed 16 assertions including inherited -1 defaults versus disabled triggers/maximum thresholds, milliseconds versus microseconds, reciprocal archive fallback and escaped quote preservation. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/dutch-postgresql-maintenance-Y2Pqww/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Dutch PostgreSQL planner and I/O explanations

Added 84 explanations, increasing effective setting coverage from 77 to 161 of 351; 190 remain explicit English fallback. Tests passed 17 assertions including planner cache assumptions, fsync/full-page crash recovery, transaction/nontransaction idle limits and disabled JIT thresholds. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/dutch-postgresql-planner-io-aQ4nw6/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Dutch PostgreSQL logging, memory and replication explanations

Added 86 explanations, increasing effective setting coverage from 161 to 247 of 351; 104 remain explicit English fallback. Tests passed 18 assertions including full logged values versus disabled logs, bytes versus kilobytes, unlimited standby waits, predicate lock escalation and failed replication-slot semantics. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/dutch-postgresql-log-replication-5JV7NT/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Complete Dutch PostgreSQL descriptions

Added the final 104 explanations, completing 351 effective setting descriptions (346 imported entries plus 5 overrides) and 27 HBA explanations. Tests passed 19 assertions covering complete parameter equality, regional Netherlands/Belgium lookup, TLS versions, TCP OS defaults, prepared-transaction exclusions and WAL defaults/deletion semantics. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/dutch-postgresql-complete-1BNTMo/result.json. Source coverage does not prove native linguistic acceptance, compiled visual GUI acceptance or deployment. No rebuild, HTTP rerun, design change or deployment; wider multilingual scope remains incomplete.

### Dutch PostgreSQL component, emitted runtime and compiled verification

Real file/grouped settings and provider SSR tests now include Dutch. Uppercase Dutch description search and language switching preserve configuration text; 14 tests passed. Emitted Node22 runtime checks all 351 setting and 27 HBA descriptions in Catalan, Finnish and Dutch within 21 inner assertions. Type checking passed. Current 457-file compilation and 37 HTTP checks passed; temporary HTTP server stopped. Source description checker reports 9 UI languages without PostgreSQL descriptions: bg, cs, da, el, hu, nb, ro, sk, vi. Evidence: /mnt/data/build/tastedev-linux/dutch-postgresql-render-compiled-jngzie/result.json. Component/SSR/runtime proof does not establish browser visual/native linguistic acceptance or deployment. Installed apps/design unchanged; no package build.

### Danish PostgreSQL common settings and HBA help

Added all 27 Danish connection-rule explanations and 12 of 351 effective setting descriptions. Missing 339 setting descriptions retain explicit English fallback with Danish notices. Tests passed 15 assertions including regional lookup, first-match authentication, plaintext password/TLS conditions, row_security failure, unfrozen-page insert threshold and per-operation memory, plus real HBA component static rendering. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/danish-postgresql-help-2P9Y8L/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Danish PostgreSQL WAL and maintenance explanations

Added 65 explanations, increasing effective setting coverage from 12 to 77 of 351; 274 remain explicit English fallback. Tests passed 16 assertions including inherited -1 defaults versus disabled insert/maximum thresholds, milliseconds versus microseconds, reciprocal archive fallbacks and escaped quote preservation. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/danish-postgresql-maintenance-lkIUD2/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Danish PostgreSQL planner and I/O explanations

Added 84 explanations, increasing effective setting coverage from 77 to 161 of 351; 190 remain explicit English fallback. Tests passed 17 assertions including planner cache assumptions, fsync/full-page crash recovery, transaction/nontransaction idle limits and disabled JIT thresholds. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/danish-postgresql-planner-io-LAyORt/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### Danish PostgreSQL logs, memory and replication explanations

Added 86 explanations, increasing effective setting coverage from 161 to 247 of 351; 104 remain explicit English fallback. Tests passed 18 assertions including full logged values versus disabled logs, byte/kilobyte limits, unlimited standby waits, predicate lock escalation and failed replication-slot semantics. Type checking and description schema validation passed. Evidence: /mnt/data/build/tastedev-linux/danish-postgresql-log-replication-HsY2pi/result.json. No rebuild, HTTP rerun, design change or deployment. Wider multilingual/native-language scope remains incomplete.

### 덴마크어 PostgreSQL 설명 완료 (2026-10-13T03:45:31.482Z)

남은 104개 설명을 추가하여 설정 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 조건을 별도 검사했다. 설명 검사 19개, 컴포넌트·SSR·검색·Node22 런타임 검사 14개 및 TypeScript 검사가 통과했다. 원어민 검수·실제 GUI 검수·최종 배포는 완료로 주장하지 않는다. 디자인 및 설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/danish-postgresql-complete-zWm1yI/result.json

### 덴마크어 포함 현재 소스 컴파일·HTTP 확인 (2026-10-13T03:47:32.499Z)

현재 457개 소스 파일을 새 스냅샷으로 컴파일했다. Node22 검수 컨트롤러로 실제 컴파일 앱의 HTTP 검사 37개가 통과했고 임시 서버 종료를 확인했다. 언어별 초기 HTML, 쿠키 언어 우선순위, 로그인·세션 만료·재시작 유지 및 PTY 입출력을 포함한다. 실제 PostgreSQL GUI와 원어민 품질 검수의 대체 증거는 아니다. DEB 생성·설치·운영 서비스 변경은 하지 않았다.

증거: /mnt/data/build/tastedev-linux/danish-postgresql-render-compiled-WDvMyD/result.json

### 노르웨이어 PostgreSQL 접속 규칙·주요 설정 (2026-10-13T03:50:05.871Z)

접속 규칙 설명 27개와 주요 설정 설명 12개를 추가했다. 나머지 설정 설명 339개는 노르웨이어 안내와 함께 영어 보충 설명을 유지한다. 관련 검사 16개가 통과했다. 최초 타입 검사는 테스트의 JSON 문자열 인덱스 접근 때문에 TS7053으로 실패했으며 Object.entries로 수정했다. 수정 후 검사 3개와 TypeScript 검사가 통과했다. 실제 HBA 컴포넌트 정적 렌더링을 포함하지만 원어민 검수·전체 GUI 검수·배포 완료 증거는 아니다.

증거: /mnt/data/build/tastedev-linux/norwegian-postgresql-help-W3SHIF/result.json

### 노르웨이어 PostgreSQL WAL·유지 관리 설명 (2026-10-13T03:52:25.346Z)

설명 65개를 추가하여 설정 설명 범위가 12개에서 77/351개로 늘었다. 남은 274개는 명시적 영어 보충 설명을 유지한다. 기본값 상속과 임계값 비활성화, 마이크로초·밀리초, WAL 보관 명령과 라이브러리의 상호 대체, 강제 디스크 쓰기 중지를 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/norwegian-postgresql-maintenance-x6HNvv/result.json

### 노르웨이어 PostgreSQL 쿼리 계획·I/O 설명 (2026-10-13T03:54:41.438Z)

설명 84개를 추가하여 설정 설명 범위가 77개에서 161/351개로 늘었다. 남은 190개는 명시적 영어 보충 설명을 유지한다. 계획 수립에 쓰는 캐시 추정치, fsync와 전체 페이지 기록의 장애 복구 역할, 트랜잭션 안팎 유휴 제한 및 JIT 비활성화 값을 검사했다. 검사 18개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/norwegian-postgresql-planner-io-pPBP53/result.json

### 노르웨이어 PostgreSQL 로그·메모리·복제 설명 (2026-10-13T03:57:02.625Z)

설명 86개를 추가하여 설정 설명 범위가 161개에서 247/351개로 늘었다. 남은 104개는 명시적 영어 보충 설명을 유지한다. 로그 값 전체 기록과 로그 비활성화, 바이트·킬로바이트 단위, standby 무제한 대기, 페이지·관계 단위 잠금 승격 및 WAL 한도 초과 시 복제 슬롯 실패 처리를 검사했다. 검사 19개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/norwegian-postgresql-log-replication-vb6KfT/result.json

### 노르웨이어 PostgreSQL 설명 완료 (2026-10-13T03:59:42.624Z)

남은 104개를 추가하여 설정 설명 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 시스템 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 중지 조건을 검사했다. 실제 컴포넌트 정적 렌더링·검색·언어 SSR·Node22 런타임을 포함한 검사 34개와 TypeScript·설명 스키마 검사가 통과했다. 실제 브라우저 화면·원어민 품질 검수·최종 배포는 별도 미완료다. 디자인·설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/norwegian-postgresql-complete-0veU38/result.json

### 루마니아어 PostgreSQL 접속 규칙·유지 관리 설명 (2026-10-13T04:02:41.840Z)

HBA 설명 27개와 설정 설명 77개를 추가했다. 남은 274개 설정은 루마니아어 안내를 포함한 명시적 영어 보충 설명을 유지한다. 첫 인증 규칙 실패 처리, TLS 보호, row_security off의 실패 동작, 비동결 페이지 기준, 작업별 메모리, 기본값 상속과 비활성화 및 시간 단위를 검사했다. 검사 16개와 TypeScript·설명 스키마 검사가 통과했다. 실제 HBA 컴포넌트 정적 렌더링을 포함하지만 원어민·전체 GUI 검수와 배포는 완료하지 않았다.

증거: /mnt/data/build/tastedev-linux/romanian-postgresql-maintenance-0ILcUs/result.json

### 루마니아어 PostgreSQL 쿼리 계획·I/O 설명 (2026-10-13T04:04:58.510Z)

설명 84개를 추가하여 설정 설명 범위가 77개에서 161/351개로 늘었다. 남은 190개는 명시적 영어 보충 설명을 유지한다. 캐시 크기의 계획용 추정, fsync와 전체 페이지 기록의 복구 역할, 트랜잭션 안팎 유휴 제한, I/O worker 조건 및 JIT 비활성화 값을 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/romanian-postgresql-planner-io-qbceHb/result.json

### 루마니아어 PostgreSQL 로그·메모리·복제 설명 (2026-10-13T04:07:27.194Z)

설명 86개를 추가하여 설정 설명 범위가 161개에서 247/351개로 늘었다. 남은 104개는 명시적 영어 보충 설명을 유지한다. 로그 값 전체 기록과 로그 비활성화, 바이트·킬로바이트 단위, standby 무제한 대기, 페이지·관계 단위 잠금 전환 및 WAL 한도 초과 시 복제 슬롯 실패 처리를 검사했다. 검사 18개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/romanian-postgresql-log-replication-3HTOWM/result.json

### 루마니아어 PostgreSQL 설명 완료 (2026-10-13T04:11:22.432Z)

남은 104개를 추가하여 설정 설명 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 시스템 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 중지 조건을 검사했다. 실제 컴포넌트 정적 렌더링·검색·언어 SSR·Node22 런타임을 포함한 검사 33개와 TypeScript·설명 스키마 검사가 통과했다. 실제 브라우저 화면·원어민 품질 검수·최종 배포는 별도 미완료다. 디자인·설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/romanian-postgresql-complete-iHaJch/result.json

### 베트남어 PostgreSQL 접속 규칙·주요 설정 (2026-10-13T04:13:16.497Z)

HBA 설명 27개와 주요 설정 설명 12개를 추가했다. 남은 339개 설정은 베트남어 안내를 포함한 명시적 영어 보충 설명을 유지한다. 첫 인증 규칙 실패 처리, TLS 보호, 운영체제 사용자 식별, row_security off의 실패 동작, 비동결 페이지, include 순서와 작업별 메모리를 검사했다. 검사 16개와 TypeScript·설명 스키마 검사가 통과했다. HBA 컴포넌트 정적 렌더링을 포함하지만 원어민·전체 GUI 검수와 배포는 완료하지 않았다.

증거: /mnt/data/build/tastedev-linux/vietnamese-postgresql-help-AWI8i1/result.json

### 베트남어 PostgreSQL WAL·유지 관리 설명 (2026-10-13T04:15:14.284Z)

설명 65개를 추가하여 설정 설명 범위가 12개에서 77/351개로 늘었다. 남은 274개는 명시적 영어 보충 설명을 유지한다. 기본값 상속과 임계값 비활성화, 마이크로초·밀리초, WAL 보관 명령과 라이브러리의 상호 대체 및 강제 디스크 쓰기 중지를 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/vietnamese-postgresql-maintenance-BEXSRu/result.json

### 베트남어 PostgreSQL 쿼리 계획·I/O 설명 (2026-10-13T04:17:21.399Z)

설명 84개를 추가하여 설정 설명 범위가 77개에서 161/351개로 늘었다. 남은 190개는 명시적 영어 보충 설명을 유지한다. 계획 수립에 쓰는 캐시 추정치, fsync와 전체 페이지 기록의 장애 복구, 트랜잭션 안팎 유휴 제한, I/O worker 조건 및 JIT 비활성화 값을 검사했다. 검사 18개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/vietnamese-postgresql-planner-io-joCCvY/result.json

### 베트남어 PostgreSQL 로그·메모리·복제 설명 (2026-10-13T04:19:33.028Z)

설명 86개를 추가하여 설정 설명 범위가 161개에서 247/351개로 늘었다. 남은 104개는 명시적 영어 보충 설명을 유지한다. 로그 값 전체 기록과 로그 비활성화, 바이트·킬로바이트 단위, standby 무제한 대기, 페이지·관계 단위 잠금 전환 및 WAL 한도 초과 시 복제 슬롯 실패 처리를 검사했다. 검사 19개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/vietnamese-postgresql-log-replication-vhfcL9/result.json

### 베트남어 PostgreSQL 설명 완료 (2026-10-13T04:22:05.892Z)

남은 104개를 추가하여 설정 설명 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 시스템 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 중지 조건을 검사했다. 실제 컴포넌트 정적 렌더링·검색·언어 SSR·Node22 런타임을 포함한 검사 34개와 TypeScript·설명 스키마 검사가 통과했다. 실제 브라우저 화면·원어민 품질 검수·최종 배포는 별도 미완료다. 디자인·설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/vietnamese-postgresql-complete-GJWFzI/result.json

### 최근 언어 설명 포함 현재 소스 컴파일·HTTP 확인 (2026-10-13T04:23:43.802Z)

노르웨이어·루마니아어·베트남어 설명을 포함한 현재 457개 소스 파일을 새 스냅샷으로 컴파일했다. Node22 검수 컨트롤러가 실제 컴파일 앱의 HTTP 검사 37개를 통과했고 임시 서버 종료를 확인했다. 언어별 초기 HTML, 쿠키 언어 우선순위, 로그인·세션 만료·재시작 유지 및 PTY 입출력을 포함한다. 실제 PostgreSQL GUI 및 원어민 품질 검수를 대신하지 않는다. DEB 생성·설치·운영 서비스 변경은 하지 않았다.

증거: /mnt/data/build/tastedev-linux/localized-postgresql-current-compiled-uPPaWp/result.json

### 헝가리어 PostgreSQL 접속 규칙·주요 설정 (2026-10-13T04:25:51.927Z)

HBA 설명 27개와 주요 설정 설명 12개를 추가했다. 남은 339개 설정은 헝가리어 안내를 포함한 명시적 영어 보충 설명을 유지한다. 첫 인증 규칙 실패 처리, TLS 보호, 운영체제 사용자 식별, row_security off의 실패 동작, 비동결 페이지, include 순서와 작업별 메모리를 검사했다. 검사 16개와 TypeScript·설명 스키마 검사가 통과했다. HBA 컴포넌트 정적 렌더링을 포함하지만 원어민·전체 GUI 검수와 배포는 완료하지 않았다.

증거: /mnt/data/build/tastedev-linux/hungarian-postgresql-help-rLIqwG/result.json

### 헝가리어 PostgreSQL WAL·유지 관리 설명 (2026-10-13T04:28:05.138Z)

설명 65개를 추가하여 설정 설명 범위가 12개에서 77/351개로 늘었다. 남은 274개는 명시적 영어 보충 설명을 유지한다. 기본값 상속과 임계값 비활성화, 마이크로초·밀리초, WAL 보관 명령과 라이브러리의 상호 대체 및 강제 디스크 쓰기 중지를 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/hungarian-postgresql-maintenance-3qCgdu/result.json

### 헝가리어 PostgreSQL 쿼리 계획·I/O 설명 (2026-10-13T04:30:29.633Z)

설명 84개를 추가하여 설정 설명 범위가 77개에서 161/351개로 늘었다. 남은 190개는 명시적 영어 보충 설명을 유지한다. 계획 수립에 쓰는 캐시 추정치, fsync와 전체 페이지 기록의 장애 복구, 트랜잭션 안팎 유휴 제한, I/O worker 조건 및 JIT 비활성화 값을 검사했다. 검사 18개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/hungarian-postgresql-planner-io-mYjI6R/result.json

### 헝가리어 PostgreSQL 로그·메모리·복제 설명 (2026-10-13T04:33:16.724Z)

설명 86개를 추가하여 설정 설명 범위가 161개에서 247/351개로 늘었다. 남은 104개는 명시적 영어 보충 설명을 유지한다. 로그 값 전체 기록과 로그 비활성화, 바이트·킬로바이트 단위, standby 무제한 대기, 페이지·관계 단위 잠금 전환 및 WAL 한도 초과 시 복제 슬롯 실패 처리를 검사했다. 검사 19개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/hungarian-postgresql-log-replication-aIZQhl/result.json

### 헝가리어 PostgreSQL 설명 완료 (2026-10-13T04:36:14.684Z)

남은 104개를 추가하여 설정 설명 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 시스템 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 중지 조건을 검사했다. 실제 컴포넌트 정적 렌더링·검색·언어 SSR·Node22 런타임을 포함한 검사 34개와 TypeScript·설명 스키마 검사가 통과했다. 실제 브라우저 화면·원어민 품질 검수·최종 배포는 별도 미완료다. 디자인·설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hungarian-postgresql-complete-xSev0z/result.json

### 그리스어 PostgreSQL 접속 규칙·주요 설정 (2026-10-13T04:38:16.660Z)

HBA 설명 27개와 주요 설정 설명 12개를 추가했다. 남은 339개 설정은 그리스어 안내를 포함한 명시적 영어 보충 설명을 유지한다. 첫 인증 규칙 실패 처리, TLS 보호, 운영체제 사용자 식별, row_security off의 실패 동작, 비동결 페이지, include 순서와 작업별 메모리를 검사했다. 검사 16개와 TypeScript·설명 스키마 검사가 통과했다. HBA 컴포넌트 정적 렌더링을 포함하지만 원어민·전체 GUI 검수와 배포는 완료하지 않았다.

증거: /mnt/data/build/tastedev-linux/greek-postgresql-help-mht0wt/result.json

### 그리스어 PostgreSQL WAL·유지 관리 설명 (2026-10-13T04:40:36.371Z)

설명 65개를 추가하여 설정 설명 범위가 12개에서 77/351개로 늘었다. 남은 274개는 명시적 영어 보충 설명을 유지한다. 기본값 상속과 임계값 비활성화, 마이크로초·밀리초, WAL 보관 명령과 라이브러리의 상호 대체 및 강제 디스크 쓰기 중지를 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/greek-postgresql-maintenance-3NEcoF/result.json

### 그리스어 PostgreSQL 쿼리 계획·I/O 설명 (2026-10-13T04:43:04.143Z)

설명 84개를 추가하여 설정 설명 범위가 77개에서 161/351개로 늘었다. 남은 190개는 명시적 영어 보충 설명을 유지한다. 계획 수립에 쓰는 캐시 추정치, fsync와 전체 페이지 기록의 장애 복구, 트랜잭션 안팎 유휴 제한, I/O worker 조건 및 JIT 비활성화 값을 검사했다. 검사 18개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/greek-postgresql-planner-io-IlYfym/result.json

### 그리스어 PostgreSQL 로그·메모리·복제 설명 (2026-10-13T04:45:39.740Z)

설명 86개를 추가하여 설정 설명 범위가 161개에서 247/351개로 늘었다. 남은 104개는 명시적 영어 보충 설명을 유지한다. 로그 값 전체 기록과 로그 비활성화, 바이트·킬로바이트 단위, standby 무제한 대기, 페이지·관계 단위 잠금 전환 및 WAL 한도 초과 시 복제 슬롯 실패 처리를 검사했다. 검사 19개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/greek-postgresql-log-replication-LERQeT/result.json

### 그리스어 PostgreSQL 설명 완료 (2026-10-13T04:48:36.958Z)

남은 104개를 추가하여 설정 설명 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 시스템 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 중지 조건을 검사했다. 실제 컴포넌트 정적 렌더링·검색·언어 SSR·Node22 런타임을 포함한 검사 34개와 TypeScript·설명 스키마 검사가 통과했다. 실제 브라우저 화면·원어민 품질 검수·최종 배포는 별도 미완료다. 디자인·설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/greek-postgresql-complete-j2sazl/result.json

### 불가리아어 PostgreSQL 접속 규칙·주요 설정 (2026-10-13T04:50:31.629Z)

HBA 설명 27개와 주요 설정 설명 12개를 추가했다. 남은 339개 설정은 불가리아어 안내를 포함한 명시적 영어 보충 설명을 유지한다. 첫 인증 규칙 실패 처리, TLS 보호, 운영체제 사용자 식별, row_security off의 실패 동작, 비동결 페이지, include 순서와 작업별 메모리를 검사했다. 검사 16개와 TypeScript·설명 스키마 검사가 통과했다. HBA 컴포넌트 정적 렌더링을 포함하지만 원어민·전체 GUI 검수와 배포는 완료하지 않았다.

증거: /mnt/data/build/tastedev-linux/bulgarian-postgresql-help-xq8Oiq/result.json

### 불가리아어 PostgreSQL WAL·유지 관리 설명 (2026-10-13T04:52:35.184Z)

설명 65개를 추가하여 설정 설명 범위가 12개에서 77/351개로 늘었다. 남은 274개는 명시적 영어 보충 설명을 유지한다. 기본값 상속과 임계값 비활성화, 마이크로초·밀리초, WAL 보관 명령과 라이브러리의 상호 대체 및 강제 디스크 쓰기 중지를 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/bulgarian-postgresql-maintenance-zCvfpR/result.json

### 불가리아어 PostgreSQL 쿼리 계획·I/O 설명 (2026-10-13T04:54:49.702Z)

설명 84개를 추가하여 설정 설명 범위가 77개에서 161/351개로 늘었다. 남은 190개는 명시적 영어 보충 설명을 유지한다. 계획 수립에 쓰는 캐시 추정치, fsync와 전체 페이지 기록의 장애 복구, 트랜잭션 안팎 유휴 제한, I/O worker 조건 및 JIT 비활성화 값을 검사했다. 검사 18개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/bulgarian-postgresql-planner-io-7t3HDY/result.json

### 불가리아어 PostgreSQL 로그·메모리·복제 설명 (2026-10-13T04:57:13.938Z)

설명 86개를 추가하여 설정 설명 범위가 161개에서 247/351개로 늘었다. 남은 104개는 명시적 영어 보충 설명을 유지한다. 로그 값 전체 기록과 로그 비활성화, 바이트·킬로바이트 단위, standby 무제한 대기, 페이지·관계 단위 잠금 전환 및 WAL 한도 초과 시 복제 슬롯 실패 처리를 검사했다. 검사 19개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/bulgarian-postgresql-log-replication-sM0rBB/result.json

### 불가리아어 PostgreSQL 설명 완료 (2026-10-13T04:59:57.300Z)

남은 104개를 추가하여 설정 설명 351개와 HBA 설명 27개를 모두 채웠다. TLS 버전 범위, TCP 시스템 기본값, 준비된 트랜잭션 제외 및 WAL 자동 삭제 중지 조건을 검사했다. 실제 컴포넌트 정적 렌더링·검색·언어 SSR·Node22 런타임을 포함한 검사 34개와 TypeScript·설명 스키마 검사가 통과했다. 실제 브라우저 화면·원어민 품질 검수·최종 배포는 별도 미완료다. 디자인·설치 패키지는 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/bulgarian-postgresql-complete-R3Gee2/result.json

### 체코어 PostgreSQL 접속 규칙·주요 설정 (2026-10-13T05:02:13.004Z)

HBA 설명 27개와 주요 설정 설명 12개를 추가했다. 남은 339개 설정은 체코어 안내를 포함한 명시적 영어 보충 설명을 유지한다. 기존 미번역 검사 언어는 체코어 대신 아직 설명이 없는 아이슬란드어로 변경하여 영어 보충 동작 검사를 유지했다. 첫 인증 규칙 실패 처리, TLS 보호, 운영체제 사용자 식별, row_security off의 실패 동작, 비동결 페이지, include 순서와 작업별 메모리를 검사했다. 검사 16개와 TypeScript·설명 스키마 검사가 통과했다. HBA 정적 렌더링을 포함하지만 원어민·전체 GUI 검수와 배포는 완료하지 않았다.

증거: /mnt/data/build/tastedev-linux/czech-postgresql-help-jn9ivJ/result.json

### 체코어 PostgreSQL WAL·유지 관리 설명 (2026-10-13T05:04:15.696Z)

설명 65개를 추가하여 설정 설명 범위가 12개에서 77/351개로 늘었다. 남은 274개는 명시적 영어 보충 설명을 유지한다. 기본값 상속과 임계값 비활성화, 마이크로초·밀리초, WAL 보관 명령과 라이브러리의 상호 대체 및 강제 디스크 쓰기 중지를 검사했다. 검사 17개 및 TypeScript·설명 스키마 검사가 통과했다. 새 컴파일·GUI 검수·배포는 하지 않았다.

증거: /mnt/data/build/tastedev-linux/czech-postgresql-maintenance-Ow2xUa/result.json

## 한국어 단계 종료 확인

사용자 요청에 따라 추가 다국어 작업을 중단했다. 설치된 웹 BUILD_ID, 164개 실행 파일 및 Tauri 실행 바이너리를 기존 최종 설치 증거와 다시 대조했다. 앱·컴포넌트·관리 helper 소스는 해당 설치 스냅샷과 동일하다. 사용자의 로그인·메뉴 이동·터미널 화면 정상 확인을 연결하고 오래된 설치 대기 문구를 정리했다. 전체 다국어 요구와 기존 번역은 보존하며 전체 제품 완료로 기록하지 않는다. 새 테스트·빌드·설치 없이 증거와 실행 파일을 확인했다.

증거: /mnt/data/build/tastedev-linux/korean-phase-closure-jD13bC/result.json

## 체코어 PostgreSQL 계획·I/O 설명

기존 요청에 따라 한국어 단계 종료 후 제공 중인 언어를 보완했다. 체코어 설명 84개를 추가하여 설정 161/351, 접속 규칙 27/27을 확보했다. 캐시 추정, fsync와 전체 페이지 복구, 0의 서로 다른 의미, -1 JIT 비활성화, OS 기본 locale 의미를 포함한 18개 검사가 통과했고 TypeScript 검사 종료 코드는 0이다. 설정 190개가 영어로 대체되며 언어 품질·GUI·배포 완료를 주장하지 않는다. 설치본 및 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/czech-postgresql-planner-io-jO1F4b/result.json

## 체코어 PostgreSQL 로그·복제 설명

설명 86개를 추가하여 설정 247/351, 접속 규칙 27/27로 보완했다. 로그 샘플링, 로그 순환, 파라미터 전체 출력, 복제 슬롯 WAL 한도와 무제한 대기의 의미를 보존했다. 관련 검사 19개와 TypeScript 검사가 통과했다. 설정 104개와 언어 품질·GUI·배포 확인은 남아 있다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/czech-postgresql-log-replication-J2qReA/result.json

## 체코어 PostgreSQL 설명 목록 완료

나머지 설명 104개를 추가하여 설정 351/351, 접속 규칙 27/27의 소스 목록을 채웠다. TLS 버전 구분, 기본값과 비활성화 구분, 동기 복제 수신 순서, VACUUM과 WAL 동작을 보존했다. 실제 설정 컴포넌트의 정적 SSR·설명 검색과 배포용 Node22 모듈 조회를 포함한 34개 검사 및 TypeScript 검사가 통과했다. 이는 체코어 언어 품질·실제 GUI·최종 배포 완료가 아니다. 설치본과 디자인은 변경하지 않았다. 기존 UI 언어 중 슬로바키아어 설명이 남아 있다.

증거: /mnt/data/build/tastedev-linux/czech-postgresql-complete-6MFAWR/result.json

## 슬로바키아어 PostgreSQL 기본 설명

기본 설정 12개와 접속 규칙 설명 27개를 추가했다. 규칙 최초 일치와 실패, TLS와 비밀번호 전송, OS 계정 인증, include 처리와 행 보안 오류의 의미를 보존했다. 나머지 설정 339개는 영어 보충 설명으로 구분한다. 관련 검사 16개와 TypeScript 검사가 통과했다. 언어 품질·GUI·전체 배포 완료는 아니며 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/slovak-postgresql-help-oXjSu3/result.json

## 슬로바키아어 PostgreSQL 유지보수 설명

설명 65개를 추가하여 설정 77/351, 접속 규칙 27/27로 보완했다. autovacuum 상속값과 비활성화, 밀리초와 마이크로초, 아카이브 선택, 강제 디스크 기록의 의미를 보존했다. 관련 검사 17개와 TypeScript 검사가 통과했다. 설정 274개가 영어로 대체되며 언어 품질·GUI·최종 배포 확인은 별도다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/slovak-postgresql-maintenance-UHdngM/result.json

## 슬로바키아어 PostgreSQL 계획·I/O 설명

설명 84개를 추가하여 설정 161/351, 접속 규칙 27/27로 보완했다. 캐시 추정, fsync와 전체 페이지 복구, 시간 제한과 JIT 비활성화, OS 기본 locale 의미를 보존했다. 관련 검사 18개와 TypeScript 검사가 통과했다. 설정 190개가 영어로 대체된다. 언어 품질·GUI·최종 배포 확인은 별도이며 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/slovak-postgresql-planner-io-tZ1fSh/result.json

## 슬로바키아어 PostgreSQL 로그·복제 설명

설명 86개를 추가하여 설정 247/351, 접속 규칙 27/27로 보완했다. 로그 샘플링·순환, 전체 매개변수 값 출력, 복제 슬롯 한도와 무제한 대기의 의미를 보존했다. 관련 검사 19개와 TypeScript 검사가 통과했다. 설정 104개가 영어로 대체된다. 언어 품질·GUI·최종 배포 확인은 별도이며 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/slovak-postgresql-log-replication-pS6zxR/result.json

## 슬로바키아어 PostgreSQL 설명 목록 완료

나머지 설명 104개를 추가하여 설정 351/351, 접속 규칙 27/27의 소스 목록을 채웠다. TLS 버전·기본값, 동기 복제 순서와 VACUUM/WAL 동작을 보존했다. 컴포넌트 정적 SSR·설명 검색·배포용 Node22 모듈 조회를 포함한 검사 34개 및 TypeScript 검사가 통과했다. 현재 UI 목록의 PostgreSQL 설명 누락 언어는 0개다. 이는 전체 Linux 언어 번역, 원어민 품질, 실제 GUI 또는 배포 완료가 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/slovak-postgresql-complete-1HOYKH/result.json

## 체코어·슬로바키아어 포함 현재 소스 빌드

현재 소스 457개로 Next.js 빌드를 완료했고 빌드 중 소스 변경이 없었다. 배포용 Node22 HTTP 검사 도구로 로그인·세션·만료 이동·페이지 SSR·현재 언어 쿠키와 실제 PTY 한글/이모지 출력 등 37개 검사가 통과했다. 격리 서버 종료를 확인했다. 실제 PostgreSQL 다국어 GUI·원어민 품질·최종 배포 또는 전체 회귀 검수 완료는 아니다. DEB 생성·설치와 운영 서비스 변경은 하지 않았다.

증거: /mnt/data/build/tastedev-linux/current-localized-compiled-P1UGcx/result.json

## PostgreSQL 다국어 설명 브라우저 확인

실제 FileSettings/HBA 컴포넌트를 쓰는 API 없는 전용 화면을 추가했다. 12개 최근 언어에서 설정 6개·접속 규칙 2개의 설명 표시, 설명 검색과 원문 유지가 실제 내장 브라우저에서 확인됐고 콘솔 오류·경고는 없었다. 제어기는 브라우저 확인 후 결과 쓰기 전 SIGTERM으로 중단됐다. 기존 FAIL을 보존하고 브라우저 확인 범위만 별도 기록했다. 폴더 제거와 해당 cwd 프로세스 부재를 확인했다. TypeScript와 기존 중단 정리 검사가 통과했다. 전체351개 화면·원어민 품질·배포 완료는 아니며 설치본/디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-description-browser-FM1d6g/result.json

## Linux 전체 언어 번역 범위 점검

`npm run i18n:coverage` 명령을 추가하여 Linux 언어 목록의 지역별 선택지를 기본 언어로 묶고 UI·PostgreSQL·접속 규칙의 실제 번역 누락을 보여 준다. `--require-complete`는 누락 시 종료 코드 1을 반환한다. 목록만 있는 언어를 완전 번역으로 표시하지 않으며 소스 목록 완료도 언어 품질·GUI·배포 완료를 뜻하지 않는다. 관련 검사 4개와 TypeScript가 통과했다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/full-language-coverage-G40ZG9/result.json

## 힌디어 기본 UI 번역

로그인·관리 메뉴·상태·보안 안내 등 힌디어 문구115개를 추가하고 서버 카탈로그와 클라이언트 언어 로더에 등록했다. 나머지2118개는 영어로 표시되며 부분 번역 상태를 유지한다. 비밀번호 변경의 세션 종료, 로그 전송 동의와 API 비용 의미를 보존했다. 관련 검사27개 및 TypeScript가 통과했다. 테스트 카탈로그 키의 타입 오류를 수정했으며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-core-localization-OL1j5Y/result.json

## 힌디어 설치·IDE·운영 문구

문구90개를 추가하여205/2233개를 번역했다. 설치 시 서비스 시작 가능성, 기존 설치 패키지 미업그레이드, 인증서/nginx 설정 제외와 IDE 편집 원문 유지 의미를 보존했다. 관련 검사28개와 TypeScript 검사가 통과했다.2028개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-operational-localization-aCtMRa/result.json

## 힌디어 서비스·백업·보안 문구

문구90개를 추가하여295/2233개를 번역했다. 서비스 부팅 설정과 실행 상태의 차이, nginx 검수, crontab 전체 복원, AOF/RDB 범위, 앱 스위치와 OS 권한의 차이를 보존했다. 관련 검사29개와 TypeScript 검사가 통과했다.1938개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-service-security-localization-qszXgK/result.json

## 힌디어 nginx·Certbot·cron 문구

문구90개를 추가하여385/2233개를 번역했다. nginx 초안과 실제 적용, 백업→검수→재로드 순서, Certbot hook 영향과 staging 인증서, cron 기존 작업·환경 변수 보존 의미를 유지했다. 관련 검사30개와 TypeScript 검사가 통과했다.1848개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-nginx-certbot-cron-localization-StvEhL/result.json

## 힌디어 터미널·패키지 설정 항목

문구90개를 추가하여475/2233개를 번역했다. Redis 포트0/TCP 비활성화와 메모리0/무제한, MB·초 단위, 관리자 토큰/파일 본문 비기록, 운영 설정과 초안 구분을 보존했다. 관련 검사31개와 TypeScript 검사가 통과했다.1758개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-package-fields-localization-pgaBiH/result.json

## 힌디어 설정 초안·불러오기·감사 문구

문구90개를 추가하여565/2233개를 번역했다. 블록 삭제/실행 취소, 파일 불러오기와 운영 값 조회의 차이, 지원 항목만 폼 반영, UTC 날짜/100건 검색 한계를 보존했다. 관련 검사13개와 TypeScript 검사가 통과했다.1668개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-draft-import-localization-IxCjCq/result.json

## 힌디어 복원·Redis 정책·환경 파일 안내

문구90개를 추가하여655/2233개를 번역했다. 설정/데이터 백업 구분, 전체 파일 복원과 클러스터 재시작, Redis 전체/TTL 키 제거 및 noeviction 쓰기 거부, include 검사 한계를 보존했다. 관련 검사14개와 TypeScript 검사가 통과했다.1578개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-recovery-redis-localization-QRTN83/result.json

## 힌디어 앱 서비스·검증·인증서 안내

문구120개를 추가하여775/2233개를 번역했다. 등록 해제와 파일/서비스 보존, 등록과 시작의 분리, nginx 검사 오류 구분, 업로드 제한0, cron 날짜와% 처리 및 서비스 변경/복원의 재시작 필요 의미를 보존했다. 관련 검사15개와 TypeScript 검사가 통과했다.1458개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-service-validation-localization-fyUISR/result.json

## 힌디어 sudo·nginx·리소스 검토 안내

문구120개를 추가하여895/2233개를 번역했다. PASSWD와sudo -n 동작, 웹 복구 불가 가능성, include/실행 환경 별도검토, 격리Redis 검사와운영변경 분리, 원본/초안 비교를 보존했다. 관련 검사16개와 TypeScript 검사가 통과했다.1338개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-permission-resource-localization-L3LvEG/result.json

## 힌디어 nginx 설정 항목 설명

문구100개를 추가하여995/2233개를 번역했다. 업스트림 연속읽기/쓰기 사이 타임아웃, 크기제한0, gzip1~9, TLS 인증서/캐시, 미저장코드 복구와자동미적용, 파일명{name} 치환을 보존했다. 관련 검사17개와 TypeScript 검사가 통과했다.1238개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-nginx-settings-help-V0Z6RZ/result.json

## 힌디어 터미널·환경 백업·접속 규칙 안내

문구120개를 추가하여1115/2233개를 번역했다. 환경파일 전체복원/비밀변수 구분, 인증저장소0700/0600, 터미널4096문자/바이트·1~3600초·동시4개, 설치사용자권한 및접속규칙 초안미적용 의미를 유지했다. 감사{total}/{visible} 치환을 포함한 관련 검사18개와 TypeScript가 통과했다.1118개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-terminal-hba-localization-YVYqgg/result.json

## 힌디어 중단 복구·nginx 실행 설명

문구120개를 추가하여1235/2233개를 번역했다. HBA reload 요청, systemd 메타데이터 복원과앱비재시작, 파일/참조 변경시보존, 복구기록정리 미확인, nginx 워커/연결/타임아웃/idle캐시 및FastCGI/TLS 설명을 보존했다. 관련 검사19개와 TypeScript 검사가 통과했다.998개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-interrupted-recovery-localization-puQdoH/result.json

## 힌디어 nginx 보안·캐시·컨텍스트 설명

문구100개를 추가하여1335/2233개를 번역했다. CA전송/비전송, OCSP·실제IP신뢰조건, location/map/geo/stream/mail문맥, 모듈/버전요건과캐시읽기/저장금지 차이를 보존했다. 관련 검사20개와 TypeScript 검사가 통과했다.898개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-nginx-security-cache-help-OKvkcC/result.json

## 힌디어 인증서 방식·준비 취소·검증 안내

문구100개를 추가하여1435/2233개를 번역했다. Certbot nginx/webroot/standalone과root소유경로, Redis/MariaDB/PostgreSQL 격리검수한계, 준비취소의비재시작과기록된임시파일정리, nginx캐시/해시분배의미를 보존했다. 관련 검사21개와 TypeScript가 통과했다.798개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-certificate-preparation-help-PylC4M/result.json

## 힌디어 진단·AI·hook 안내

문구120개를 추가하여1555/2233개를 번역했다. 사이트링크 충돌과외부변경시자동복구제한, AI연결확인범위·429원인구분·로그전송동의, 전역hook비활성과개별hook계속실행가능성, nginx백엔드옵션을 유지했다. 관련 검사22개와 TypeScript가 통과했다. 실제AI API는 호출하지 않았다.678개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-diagnostics-ai-hook-localization-2zK5Uw/result.json

## 힌디어 nginx I/O·프로세스·프록시 설명

문구100개를 추가하여1655/2233개를 번역했다. 플랫폼별 무시/버전조건, direct I/O/sendfile, worker권한·수명, cache읽기/저장조건, HTTP재사용/TCPkeepalive구분, 업스트림재시도전송경계를 유지했다. 관련 검사23개와 TypeScript가 통과했다.578개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-nginx-io-proxy-help-Srrydl/result.json

## 힌디어 TLS·데이터 복원·접속 설정 안내

문구120개를 추가하여1775/2233개를 번역했다.0-RTT/replay조건, 비밀키비읽기, 데이터복원전쓰기중지와민감오류비표시, 외부접속후로그인유지·재시작연결중단, {url}/{count}/{model}치환을 보존했다. 관련 검사24개와 TypeScript가 통과했다.458개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-data-network-settings-localization-D5xXn1/result.json

## 힌디어 AI·공통 설정·관리 권한 안내

문구120개를 추가하여1895/2233개를 번역했다. 키비표시와지역서버선택, 조회전용저장차단, 관리자중단결과미확인, helper확인/OSsudo권한구분, 외부링크비조회 및{detail}/{group}/{count}치환을 보존했다. 관련 검사25개와 TypeScript가 통과했다.338개는 영어로 표시되며 언어 품질·실제 GUI·배포 완료는 아니다. 실제AI 호출·설치본·디자인 변경은 없었다.

증거: /mnt/data/build/tastedev-linux/hindi-ai-general-settings-localization-2rPbcY/result.json

## 힌디어 접속 규칙·로그·복구 오류 안내

문구 40개를 추가하여 1935/2233개를 번역했다. 접속 필드 순서, 검사 중 파일 변경 시 재조회, 200자 제한과 {detail} 치환을 유지했다. 관련 검사 26개와 TypeScript 검사를 통과했다. 298개는 영어로 표시되며, 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-connection-rule-errors-sOQEbC/result.json

## 힌디어 파일·cron 검증 안내

문구 50개를 추가하여 1985/2233개를 번역했다. 파일 크기와 UTF-8 제한, 단일 링크 조건, cron의 5개 필드 순서, 관리자·일반 사용자 권한과 {detail} 치환을 유지했다. 관련 검사 27개와 TypeScript 검사를 통과했다. 248개는 영어로 표시되며, 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-file-cron-validation-8Qmbon/result.json

## 힌디어 인증서·중단 복구 검증 안내

문구 50개를 추가하여 2035/2233개를 번역했다. Certbot 종료 결과 미확인 시 잠금 유지·자동 재실행 금지, webroot 연계 조건, 포트·시간 범위, 복구 검토 이후 변경 시 재검토 조건을 유지했다. 관련 검사 28개와 TypeScript 검사를 통과했다. 198개는 영어로 표시되며, 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-certificate-recovery-errors-YXOnwW/result.json

## 힌디어 데이터베이스·계정 오류 안내

문구 60개를 추가하여 2095/2233개를 번역했다. 실행 계정·참조 파일 변경, MariaDB 후보의 요청값과 실제값 차이, 검토 만료, 256 KiB 제한과 정수 범위 치환을 유지했다. 관련 검사 29개와 TypeScript 검사를 통과했다. 138개는 영어로 표시되며, 언어 품질·실제 GUI·배포 완료는 아니다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-database-account-errors-4nbD7O/result.json

## 힌디어 UI 카탈로그 문구 완성 및 사용자 우선순위 반영

사용자의 “현재 제공하는 언어부터 완성” 선택을 반영했다. 새 언어 확장은 후속으로 남긴다. 문구 138개를 추가하여 힌디어 UI 카탈로그 2233/2233개를 채웠다. 관련 검사 31개와 TypeScript 검사를 통과했다. PostgreSQL 설정·HBA 설명은 아직 힌디어로 번역되지 않았다. 카탈로그 누락 없음은 언어 품질·전체 화면 적용·배포 완료를 뜻하지 않는다. 설치본과 디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-ui-catalog-complete-epi1eX/result.json

## 힌디어 PostgreSQL 접속 규칙 설명 및 초기 설정 설명

접속 규칙 설명 27/27개와 설정 설명 12/351개를 추가했다. 첫 일치 규칙의 실패 처리, TLS 요구, 운영체제 식별 방식, include 경로·누락 조건, 행 보안 정책 실패와 WAL 대안 설정을 유지했다. 미번역 설명과 원본 주석 안내도 힌디어로 표시한다. 관련 검사 38개와 TypeScript 검사를 통과했다. 설정 설명 339개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-initial-help-3lmuc9/result.json

## 힌디어 PostgreSQL 자동 정리·체크포인트 설명

설정 설명 40개를 추가하여 52/351개를 번역했다. autovacuum 기본값 상속과 -1 비활성화, 밀리초/마이크로초, 강제 쓰기와 백그라운드 쓰기의 0 의미, WAL 체크포인트 경고를 구분했다. 관련 검사 39개와 TypeScript 검사를 통과했다. 설정 설명 299개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-maintenance-help-FgWiWc/result.json

## 힌디어 PostgreSQL 쿼리 계획·기본 동작 설명

설정 설명 40개를 추가하여 92/351개를 번역했다. 비용·캐시 크기의 플래너 추정, 커널 캐시와 공유 버퍼, DateStyle 별칭, 동적 라이브러리 검색 조건, 트랜잭션 기본값과 쿼리 계획 옵션을 유지했다. 관련 검사 40개와 TypeScript 검사를 통과했다. 설정 설명 259개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-planner-help-z86tOD/result.json

## 힌디어 PostgreSQL 내구성·입출력·계획 설명

설정 설명 50개를 추가하여 142/351개를 번역했다. fsync의 물리 쓰기, full_page_writes의 부분 쓰기 복구, 트랜잭션 안/밖 유휴 제한, GEQO 기본값과 GIN 무제한의 0 차이, io_method=worker와 JIT 비활성화를 유지했다. 관련 검사 41개와 TypeScript 검사를 통과했다. 설정 설명 209개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-durability-io-help-P7A50U/result.json

## 힌디어 PostgreSQL 로그·로케일 설명

설정 설명 50개를 추가하여 192/351개를 번역했다. 로그 샘플링과 전체 기간 기록, 바이트 단위 값 길이, 8진수 파일 권한 표기, 시간/크기별 순환, OS 로케일 상속과 내부 디코딩 버퍼별 메모리 한도를 유지했다. 관련 검사 42개와 TypeScript 검사를 통과했다. 설정 설명 159개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-logging-help-8HmbrE/result.json

## 힌디어 PostgreSQL 연결·병렬 처리·복제 제한 설명

설정 설명 50개를 추가하여 242/351개를 번역했다. 작업별/노드별 병렬 한도, predicate 잠금 승격, WAL 보존 초과의 슬롯 실패, 무한 대기와 REPLICATION 플러그인 허용 목록을 유지했다. 관련 검사 43개와 TypeScript 검사를 통과했다. 설정 설명 109개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-replication-help-xzP8N8/result.json

## 힌디어 PostgreSQL 복구 목표·보안·TLS 설명

설정 설명 55개를 추가하여 297/351개를 번역했다. 복구 목표, CA/서버 인증서/개인키 역할, TLSv1.2와 TLSv1.3 cipher 범위, passphrase 기본값, WAL 수신 확인 후 전송 순서와 TCP 시스템 기본값 상속을 유지했다. 관련 검사 44개와 TypeScript 검사를 통과했다. 설정 설명 54개와 화면 적용 확인이 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-tls-recovery-help-WdxOZy/result.json

## 힌디어 PostgreSQL 설명 완성 및 제공 언어 소스 범위 확인

마지막 설명 54개를 추가하여 설정 설명 351/351개, 접속 규칙 설명 27/27개를 채웠다. 트랜잭션 준비 제외, null 비교, 작업별 메모리, freeze 스캔 비율과 WAL 보존·삭제 조건을 유지했다. 관련 검사 45개와 TypeScript 검사를 통과했다. 현재 제공하는 모든 비한국어 카탈로그의 UI 2233개·설정 351개·HBA 27개가 누락 없이 존재함을 실제 검사로 확인했다. 이는 언어 품질·전체 화면·배포 완료가 아니다. 새 언어 확장은 사용자 선택대로 후속으로 남기며 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-postgresql-complete-YIaEAE/result.json

## 힌디어 실제 컴포넌트·Node22·컴파일 HTTP 연동

PostgreSQL 설정 폼, 패키지 폼, HBA, SSR 언어 공급자와 설명 검색의 기존 검수 범위에 힌디어를 추가했다. 해당 검사 16개와 변환된 Node22 설명 모듈이 통과했다. 현재 소스 458개 파일의 분리 빌드 및 HTTP 검사 38개가 통과했고, 완료 뒤 소스 해시도 일치했다. 힌디어 로그인·설정·nginx 초기 SSR 및 저장 언어 우선 적용을 실제 HTTP로 확인했다. 검수 서버는 종료되었다. 실제 브라우저 전체 화면과 번역 품질·최종 배포를 확인한 것은 아니며 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/hindi-compiled-integration-LiXuQ5/result.json

## 힌디어 PostgreSQL 설명 실제 브라우저 검수

실제 IAB에서 전용 예제의 설정 6행·설명 7문단과 접속 규칙 2행·추가 폼 포함 설명 18문단이 힌디어로 표시됨을 확인했다. 힌디어 검색은 logging_collector 한 행만 표시했다. 한국어↔힌디어 전환 및 새로고침 후 힌디어 선택과 원본 값이 유지됐고 콘솔 오류/경고는 없었다. 전용 탭과 서버를 종료하고 예제 폴더 정리가 완료됐으며 컨트롤러도 PASS를 기록했다. 전체 제품 화면·원어민 품질 검수를 뜻하지 않는다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-operation-gui-2026-10-13T09-13-06.728Z/result.json

## 기존 제공 언어의 PostgreSQL 설명 브라우저 범위 보완

아직 브라우저 설명 검수 증거가 없었던 ar/de/en/es/fr/id/it/ja/pl/pt/ru/sv/tr/uk/zh 15개 언어를 실제 IAB에서 확인했다. 설정 6행, 접속 규칙 2행과 추가 폼의 설명, 현지어 검색의 단일 결과와 원본 유지가 확인됐으며 콘솔 오류/경고는 없었다. 아랍어의 문단 수를 7개로 고정한 첫 관찰은 잘못된 검수 가정이었다. 실제 6개 설정의 설명 표시로 보정하고 원본 관찰 실패를 결과에 보존했다. 기존 13개 언어의 성공 증거와 합쳐 제공 비한국어 28개 언어의 해당 범위가 확인됐다. 전용 탭·서버·예제 폴더는 정리했다. 전체 제품 GUI 및 원어민 품질 검수를 뜻하지 않으며 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-operation-gui-2026-10-13T09-17-17.800Z/result.json

## PostgreSQL 로그 수집 설명의 의미 누락 보완

원문 대조에서 ar/fr/pt/zh의 logging_collector 설명이 stderr/csvlog/jsonlog 수집 대상과 하위 프로세스 동작을 생략한 것을 확인하여 보완했다. 일본어는 동등한 번역 명칭을 명시하므로 보존했다. 모든 제공 카탈로그의 세 대상 명시와 변경된 설명·실제 설정 폼·SSR·카탈로그 검사를 포함한 12개 검사가 통과했고 TypeScript도 통과했다. 다른 설정의 전체 번역 품질이나 변경 후 실제 브라우저·컴파일 확인을 뜻하지 않는다. 이전 컴파일 증거는 보존하되 현재 소스와 일치한 것으로 표시하지 않는다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-logging-help-fidelity-dfNzmj/result.json

## PostgreSQL 유지보수 설명의 조건·참조 누락 보완

ar/es/fr/pt/zh 5개 언어의 eager freeze 설명에 성공 시 100%보다 낮아지는 스캔 상한과 여러 VACUUM으로 작업을 분산하는 목적을 추가했다. 유지보수 I/O의 effective_io_concurrency 참조와 아랍어 Unix 소켓 권한의 chmod/umask·8진수 선행 0 조건도 보완했다. 총 11개 설명을 수정했고 관련 검사 15개와 TypeScript 검사가 통과했다. 자동 대조의 숫자·식별자 누락은 검토 후보일 뿐, 번역된 숫자 표현이나 동등한 소수값을 오류로 단정하지 않았다. 변경 후 브라우저·컴파일 및 전체 번역 품질은 아직 미완료다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-maintenance-help-fidelity-9B3UJN/result.json

## WAL 아카이브 참조 설명 및 수치·식별자 후보 대조

공식 PostgreSQL 문서와 대조하여 ar/fr/id/it/pl/pt/tr/zh 8개 언어의 archive_mode 설명에 archive_command/ archive_library 명칭을 명시했다. 기존 always 모드의 복구 안내를 유지했다. 수치·참조 대조의 남은 후보는 현지어 0 표현, 동등한 0/1 또는 선택된 설정 이름의 자기참조로 분류하고 판단 근거를 별도 기록했다. 이는 전체 번역 품질 심사가 아니다. 관련 검사 17개와 TypeScript 검사가 통과했다. 변경 후 브라우저·컴파일 검수가 남아 있으며 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-archive-help-fidelity-9yxtpN/result.json

## 수정된 PostgreSQL 설명의 브라우저 재확인

전용 예제에 변경 대상 설정을 포함하여 ar/es/fr/id/it/pl/pt/tr/zh 9개 언어의 설정 10행을 실제 IAB에서 확인했다. 로그 수집 대상, 성공 동결 시 100% 미만 조건, I/O 참조, 아랍어 소켓 권한, 아카이브 참조가 실제 설명에 나타났다. 설명 검색은 한 행만 표시했고 원본 값이 유지됐다. 중국어 HBA smoke와 콘솔 무오류도 확인했다. 기존 변경 없는 언어의 성공 증거는 반복하지 않고 보존했다. 컨트롤러 PASS 및 탭·서버·예제 폴더 정리가 완료됐다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/postgresql-operation-gui-2026-10-13T09-29-10.537Z/result.json

## 의미 보완 후 현재 소스 컴파일·HTTP 확인

변경 설명 9개 언어의 브라우저 재검수 뒤 현재 소스 458개 파일을 분리된 폴더에서 빌드했다. 빌드와 실제 HTTP 검사 38개가 통과했으며 완료 후 원본 해시도 일치했다. 검수 서버 종료가 확인됐다. 이전 검수 증거를 보존하면서 현재 컴파일·HTTP 상태만 갱신했다. 전체 앱 브라우저·전체 번역 품질 확인은 아니며 설치본·디자인 변경이나 DEB 생성은 하지 않았다.

증거: /mnt/data/build/tastedev-linux/description-fidelity-compiled-browser-oDvbKT/result.json

## 실제 힌디어 앱 15개 화면 점검 및 런타임 문구 누락 발견

현재 컴파일 앱을 임시 계정·분리 저장소·운영 쓰기 비활성 상태로 실행하여 힌디어 15개 경로를 실제 IAB에서 확인했다. 1280×720 화면에서 문서 바깥 스크롤과 콘솔 오류는 없었다. 데몬 상태, 보안 옵션 그룹, 터미널 비활성 안내에 한국어가 남아 있었다. 2233개 알려진 키가 모두 존재해도 런타임의 미등록 키까지 완성됐다는 뜻은 아니므로 기록을 수정했다. 복구의 Node.js 라벨은 기존 복원 검토 번역을 조합하도록 수정했으며 모든 제공 언어 SSR 링크 및 기존 SSR 검사 4개와 TypeScript 검사가 통과했다. 첫 테스트의 잘못된 recovery 탭 가정은 backups로 보정했고 실패를 보존했다. 전용 서버·임시 계정·폴더와 탭 정리를 확인했다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/common-pages-original-gui-2026-10-13T09-33-43.866Z/result.json

## 동적 UI 상태·보안·터미널 문구 누락 검사 보완

서비스 상태 사전과 보안 그룹 데이터, capabilities 안내의 동적 선택 문구도 검사 대상에 포함했다. 실제 검사에서 미등록 문구 25개가 드러났고 원본 FAIL 결과를 보존했다. 영어 기본 문구와 힌디어 25개를 추가하여 힌디어 2258/2258개가 됐다. 검사기 회귀 테스트는 해당 동적 데이터와 안내 누락을 거부하는 것을 확인했으며 관련 검사 34개와 TypeScript가 통과했다. 다른 제공 카탈로그 26개는 각 25개 보완이 필요하고 현재 영어로 대체 표시된다. 변경 후 실제 페이지 재검수는 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/dynamic-ui-translation-audit-NEu7G1/result.json

## 기존 주요 언어의 동적 상태·보안·터미널 문구 보완

ja/zh/de/fr/es/pt 6개 언어에 각 25개, 총 150개 문구를 추가했다. 자동/수동 시작과 이번 부팅 한정 상태를 구분하고, 보안 그룹 안내·터미널의 서버 허용 및 환경 파일·재시작·작업 저장 설명을 유지했다. 관련 검사 37개와 TypeScript 검사가 통과했다. en/hi를 포함한 8개 카탈로그가 2258/2258개이고 나머지 제공 언어 20개는 각 25개를 영어로 대체 표시한다. 실제 브라우저 재확인과 전체 제공 언어 완료는 아직 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/dynamic-ui-six-language-supplement-POkd4p/result.json

## 추가 기존 언어의 동적 상태·보안·터미널 문구 보완

ru/ar/it/id/pl/tr 6개 언어에 각 25개, 총 150개 문구를 추가했다. 부팅 한정 상태와 자동/수동 시작, 보안 그룹 안내 및 터미널 허용 절차·연결 중단·작업 저장 안내를 유지했다. 관련 검사 37개와 TypeScript 검사가 통과했다. 총 14개 카탈로그가 2258/2258개이며 남은 제공 언어 14개는 각 25개를 영어로 대체 표시한다. 실제 화면 재확인과 전체 제공 언어 완성은 아직 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/dynamic-ui-six-more-language-supplement-nqFmbm/result.json

## 추가 6개 제공 언어의 동적 화면 문구 보완

cs/sk/uk/vi/sv/ca에 각 25개, 총 150개 문구를 추가했다. 부팅 한정 서비스 상태, 보안 그룹과 권한, 터미널 허용 방법과 재시작 영향을 보존했다. 관련 검사 37개와 TypeScript 검사가 통과했다. 총 20개 카탈로그가 2258/2258개이며 남은 8개 카탈로그는 각 25개를 영어로 대체 표시한다. 실제 화면 재확인과 전체 제공 언어 완료는 아직 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/dynamic-ui-third-six-language-supplement-ruYUUL/result.json

## 제공 카탈로그의 동적 문구 보완 완료

bg/da/el/fi/hu/nb/nl/ro에 각 25개, 총 200개 문구를 추가했다. 현재 제공하는 비한국어 카탈로그 28개 모두 알려진 UI 문구 2258개가 누락 없이 존재한다. 관련 검사 38개와 TypeScript 검사가 통과했다. 첫 검사의 한국어 외부 카탈로그 가정은 원문 방식과 별도 검증으로 바로잡고 실패 기록을 보존했다. 이 결과는 확장 검사기의 범위에 대한 소스 완성으로, 모든 동적 화면이나 원어민 품질을 증명하지 않는다. 실제 앱의 데몬·복구·보안·터미널 재검수가 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/dynamic-ui-provided-catalogs-complete-yojQQn/result.json

## 전체 제공 언어의 실제 기본 화면 재검수

현재 소스 458개 파일을 분리 빌드하고 임시 계정·저장소·운영 쓰기 비활성 상태에서 실제 IAB로 28개 비한국어 언어 × 15개 경로, 총 420개 기본 화면 조합을 확인했다. 데몬·복구·보안·터미널에서 발견한 한국어 문구가 없어졌으며, 전체 조합에서 한국어 UI 잔여 문구·문서 바깥 스크롤·콘솔 오류가 없었다. 명시된 합성 감사 데이터의 한국어 원문은 UI 번역 대상에서 제외했다. 원본 소스 해시가 빌드와 일치하고 전용 탭·서버·임시 계정·저장소 정리가 완료됐다. 초기 화면과 안내 검수로서 모든 운영 동작·원어민 언어 품질의 전체 합격을 뜻하지 않는다. 현재 빌드 HTTP/회귀 검수와 최종 배포가 남아 있다. 설치본·디자인은 변경하지 않았다.

증거: /mnt/data/build/tastedev-linux/common-pages-original-gui-2026-10-13T09-55-10.174Z/result.json

### 현재 제공 언어 최종 소스 검증 (2026-10-13)

28개 비한국어 카탈로그의 2,258개 메시지와 PostgreSQL 설정 351개·HBA 설명 27개를 채웠습니다. 28개 언어 × 15개 초기 페이지의 실제 브라우저 검사 420건, 현재 빌드 HTTP 검사 38건, 전체 회귀 검사 623개 파일·2,055개 검사가 통과했습니다. 초기 페이지 검사는 모든 운영 작업의 실행이나 원어민 감수를 의미하지 않습니다. 신규 언어 확대는 사용자 요청에 따라 이후로 미룹니다.

- HTTP 증거: /mnt/data/build/tastedev-linux/production-http-2026-10-13T10-09-59.535Z/result.json
- 회귀 증거: /mnt/data/build/tastedev-linux/tastedev-linux-tests-9T2n3l/result.json

### 현재 제공 언어 최종 배포 (2026-10-13)

최종 DEB를 검증하고 103번 서버에 재설치했습니다. 설치 빌드 ID는 ATJrJhS9dOfCkO0wU_SSh이며 서비스 활성, 로그인 HTTP 200, 비인증 보호 API 401, 기존 계정·설정 보존을 확인했습니다. 설치 로그인 SSR의 28개 언어 응답도 확인했습니다. 개발 PC는 sudo 비밀번호 입력이 필요해 최신 DEB 적용을 사용자에게 안내했습니다. 기존 Tauri 실행 파일은 변경되지 않았습니다.

- 패키지 검증: /mnt/data/build/tastedev-linux/package-2026-10-13T10-18-50.019Z.json
- 설치 증거: /mnt/data/build/tastedev-linux/final-web-reinstall-103-20261013T101834Z/result.json
- 패키지 SHA-256: 6c6599f0f07aed61229b0b277439f8474a80fc3dfdab8398cc49a84e8d3273bf

### 최종 설치 확인 및 현재 요청 범위 완료 (2026-10-14, 한국 시간)

개발 PC에 최신 빌드 ATJrJhS9dOfCkO0wU_SSh가 설치됐습니다. DEB의 일반 파일 13,798개를 설치 파일과 비교한 결과 불일치가 없습니다. 서비스 활성, 기본 실행 계정 whitecalvin, 로그인 HTTP 200, 비인증 보호 API 401을 확인했습니다. 기존 Tauri 실행 파일 SHA-256도 일치합니다. 현재 제공 언어 우선이라는 사용자 결정에 따라 신규 언어 확장은 이후 작업으로 남기며, 현재 요청 범위의 필수 작업은 없습니다.

- 설치 증거: /mnt/data/build/tastedev-linux/local-current-install-acceptance-20261013T170435Z/result.json
- 완료 감사: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/final-requested-scope-completion-20261014.json

### 공통 토스트 컴포넌트 (2026-10-14)

`components/ui/toast.tsx`의 `Toast`와 `ToastViewport`를 사용합니다. `kind`는 `success`, `info`, `warning`, `error`이며 기본값은 `info`입니다. 호출 화면에서 번역한 제목, 메시지, 닫기 라벨을 전달합니다.

```tsx
<ToastViewport>
  <Toast
    kind="warning"
    title={t('터미널')}
    message={t(notice)}
    closeLabel={t('닫기')}
    onDismiss={() => setDismissedNotice(notice)}
  />
</ToastViewport>
```

- 제목은 선택 항목입니다. 본문은 줄바꿈과 긴 경로를 유지하며 화면 너비에 맞춰 줄바꿈합니다.
- 선택적으로 `action={{label, onClick}}`을 전달하면 본문 아래에 작업 버튼이 표시됩니다. 닫기는 작업을 실행하지 않습니다.
- 오류는 `alert`, 다른 종류는 `status`로 전달하며 색상과 종류별 아이콘을 함께 사용합니다.
- 우측 하단에서 여러 메시지를 쌓을 수 있습니다. 본문 레이아웃 높이를 차지하지 않습니다.
- 메시지는 사용자가 닫을 때까지 유지됩니다. 닫기 버튼 또는 토스트 안에서 Escape 키로 닫습니다.
- 아이콘 버튼은 투명 배경과 테두리 없는 형태이며 키보드 포커스 표시를 유지합니다.
- 터미널 기능 비활성 안내는 경고, 요청 실패는 오류 타입을 사용합니다. 닫아도 기능 권한은 변경되지 않습니다.

공통 페이지 알림은 루트의 `ToastProvider`와 `ToastNotice`를 사용합니다. `useFeedback`은 메시지 종류와 이벤트 번호를 함께 유지하여 같은 메시지를 다시 발생시킬 수 있습니다. 페이지 이동과 팝업 닫힘 시 해당 알림을 제거합니다. 팝업 내 알림은 해당 dialog 안에 배치하여 닫기 버튼이 동작하도록 합니다. 서비스 제어는 “시작/중지”, 보안 옵션과 터미널 안내는 “웹 터미널 명령 실행”으로 통일합니다.
