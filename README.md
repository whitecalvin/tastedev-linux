# LINUX 운영환경 GUI

Next.js 16 / React 기반 리눅스 서버 관리 콘솔과 Tauri 2 데스크톱 클라이언트입니다. 대상은 이 Next.js 서버가 실행되는 장비입니다.

## 실행

Node.js 22 이상이 필요합니다.

```bash
npm ci
cp .env.example .env.local
```

이 프로젝트 폴더의 대화형 터미널에서 `npm run account:setup`으로 최초 관리자 계정을 설정하세요. 인증 경로는 아래 관리자 로그인 설정을 참고하세요. 계정이 설정되지 않으면 관리 API를 사용할 수 없습니다. 기본값은 조회 전용이며 모든 운영 변경 옵션은 꺼져 있습니다. 비밀번호 해시와 API 키는 Git 또는 NEXT_PUBLIC 변수에 넣지 마세요.

```bash
npm run build
npm run start -- --port 8791
```

http://127.0.0.1:8791 에 접속합니다. 기본 스크립트 포트는 8787이며 `--port`로 변경할 수 있습니다. 개발은 `npm run dev -- --port 8791`입니다. 심볼릭 링크가 제한된 작업 디스크를 지원하도록 `.npmrc`에 bin-links=false를 설정했습니다.

exFAT 작업 디스크에서는 개발 모드에서만 1초 주기로 파일 변경을 확인합니다. 이는 수정한 컴포넌트가 반영되지 않는 문제를 위한 설정이며 운영 서버에는 적용하지 않습니다.

## 기능

- nginx server 블록: GUI 생성·초안·검토, 도메인·포트·프록시/정적 사이트, 검사 후 적용.
- Certbot: nginx 도메인 연계, 이메일, 테스트/운영 인증서 선택, 발급 로그. 약관 동의와 영향 확인 필수.
- cron: 현재 사용자 조회, 프리셋·직접 시간식, 작업 추가·수정·비활성화. 기존 작업 보존 및 변경 충돌 검사.
- 서비스: nginx.service, cron.service, certbot.timer 상태와 시작·중지·재시작. nginx 재로드 전 구문 검사.
- 로그: systemd journal, nginx access/error 최근 150줄, 검색, 3초 폴링.
- 백업/복구: 설정 이력·해시·현재/백업 비교, 복구 전 백업. nginx 복구 전 검사.
- 보안: 조회 전용, sudo 비밀번호 생략, 작업별 허용, 감사 옵션. OS 권한과 앱 옵션은 별도.
- 공통 UI: 사용자 버튼·체크박스·라디오·스위치·드롭다운·입력·진행 표시, 밝게/어둡게/시스템 테마.
- 고급 도구: 지정 폴더 파일 편집, 대화형 PTY 웹 터미널, 이벤트 콘솔.

`/components`에서 공통 UI를 확인할 수 있습니다. 설치/명령 실행 중 전체 진행률은 알 수 없으므로 임의 백분율 대신 진행 중 표시를 사용합니다.

## 권한 및 옵션

웹 서버는 일반 사용자로 실행합니다. 루트 작업은 root 소유의 전용 helper를 `sudo -n`으로 요청합니다. [보안 옵션 및 등록 절차](docs/security-options.md)를 검토하세요. OS sudo 설정은 자동 변경하지 않습니다. helper가 없거나 권한이 부족하면 명령이 실패하며 비밀번호를 기다리지 않습니다.

환경 변수는 허용 범위의 상한입니다. 필요한 기능만 true로 지정한 뒤 보안 옵션에서 조회 전용을 끄고 해당 기능을 허용합니다.

| 변수                  | 범위                                                     |
| --------------------- | -------------------------------------------------------- |
| LINUX_ENABLE_ADMIN    | nginx 적용/복구, Certbot, 서비스 제어                    |
| LINUX_ENABLE_INSTALL  | nginx·certbot·nodejs 패키지 설치                         |
| LINUX_ENABLE_CRON     | 현재 일반 사용자 crontab 변경/복구                       |
| LINUX_ENABLE_TERMINAL | 일반 사용자 shell 명령 실행                              |
| LINUX_WORKSPACE_ROOT  | 파일 편집·터미널 기본 작업 폴더; 기본 .runtime/workspace |

파일 편집은 숨김/상위 경로/심볼릭 링크를 차단하며 256KB 이하 UTF-8을 지원합니다. 웹 터미널은 shell 명령 실행 기능이므로 현재 사용자 권한 전체에 접근할 수 있습니다. 대화형 PTY는 현재 실행 계정으로 동작하며 키보드 입력과 화면 크기 변경을 지원합니다. SSH나 sudo 명령의 인증은 해당 셸에서 처리하며 웹 로그인 계정과 구분됩니다. 실행 제한은 1~3600초로 설정할 수 있습니다. 단일 명령 API의 기본값은 120초, 탭 터미널의 초기 설정은 3600초입니다.

nginx는 `/etc/nginx/conf.d/linux-도메인.conf`만 관리합니다. 앱이 관리하는 운영 블록은 폼으로 불러와 편집할 수 있습니다. 임의 외부 설정 가져오기/삭제는 미지원입니다. Certbot은 사전에 적용한 LINUX HTTP 사이트에 연계합니다. DNS와 80 포트 접근이 필요합니다. 인증서/HTTPS 설정 변경은 실제 장비에서 별도 검증해야 합니다. Certbot 변경 전체의 트랜잭션 롤백은 제공하지 않습니다.

cron은 현재 사용자 기준이며 root crontab은 변경하지 않습니다. 전체 crontab 백업 복구는 기존 예약 작업까지 해당 시점으로 되돌립니다. 시간대는 서버 cron 설정을 따릅니다.

패키지는 apt 저장소 버전으로 설치합니다. 전체 upgrade·삭제·저장소 추가·apt update는 하지 않습니다. 선택 패키지는 --no-upgrade, 삭제는 --no-remove로 제한합니다. 의존성과 패키지 설치 스크립트는 서비스/타이머를 변경할 수 있습니다. Certbot apt 방식은 upstream 권장 snap과 다르므로 기존 설치 방식과 혼용하지 마세요.

## 기록과 복구

앱 설정/작업 로그는 `.runtime/`, 관리자 nginx 백업은 root 소유의 `/var/lib/linux/admin/`에 저장합니다. sudo helper는 사용자 편집 가능한 백업을 root 복구에 사용하지 않습니다. 보안 스위치를 꺼도 이미 실행된 작업은 자동 종료하지 않습니다.

helper 관리자 작업은 root 잠금으로 직렬화합니다. 앱/관리자 helper 중단 시 잠금과 실제 apt/dpkg/nginx 상태를 먼저 확인하세요. 잠금은 자동 해제/재실행하지 않습니다. 감사 기록은 작업 종류·시각·결과만 보존하며 요청 본문·비밀번호는 저장하지 않습니다. 감사 기록의 변조 방지·자동 보존 기간 관리는 미지원입니다. 서비스 원본 로그에는 민감한 정보가 포함될 수 있습니다.

loopback 바인딩을 유지하고 원격 사용은 SSH 터널로 접속하세요. 서버리스/멀티프로세스/클러스터 운영은 지원하지 않습니다.

## Tauri

Tauri 개발 창은 `npm run dev`의 http://127.0.0.1:8787 서버를 표시합니다. 설치용 데스크톱 창은 서비스 주소 http://127.0.0.1:8791 을 사용합니다. Next.js 서버를 먼저 실행해야 하며 데스크톱 창 자체에 서버를 내장하지 않습니다. 데스크톱 패키지 생성 스크립트는 제공되지만 실제 설치 GUI 검증은 별도입니다.

```bash
npm run desktop:check
npm run desktop:start
```

Rust 및 Linux GTK/WebKit 개발 의존성이 필요합니다. 작업 디스크가 실행 파일 잠금을 유발하면 `cargo check --locked --manifest-path src-tauri/Cargo.toml --target-dir /tmp/linux-tauri-target`로 확인할 수 있습니다.

## 검증

```bash
npm test
npm run i18n:check
npm run build
```

실제 검증 범위와 미완료 항목은 [VALIDATION.md](VALIDATION.md)에 기록합니다. 개발 검증을 기존 7개 제품의 설치 패키지 QA PASS로 취급하지 않습니다. 이전 Python 초안은 legacy/python에 보존되어 있으며 현재 앱에서는 사용하지 않습니다.

### 운영 상태 조회와 활성 전환

nginx 관리 설정을 조회하고 `.conf` ↔ `.conf.disabled` 전환으로 활성 여부를 관리합니다. nginx가 `conf.d/*.conf`를 포함하는 구성이 필요합니다. 전환 시 설정 검사와 reload를 수행하며 실패하면 파일명을 복원합니다. 인증서 조회는 공개 `cert.pem`의 기간과 도메인을 표시하며 신뢰 체인·폐기 여부를 검증하지 않습니다. 읽기 권한이 없으면 조회 불가로 표시합니다. UI와 API가 같은 보안 정책으로 작업 허용 여부를 판단합니다.

### 데이터베이스 설치

PostgreSQL (`postgresql`), MariaDB (`mariadb-server`), Redis (`redis-server`)를 선택해 설치 명령을 검토할 수 있습니다. 배포판 기본 패키지를 설치하며 DB 계정·비밀번호·원격 접근 설정은 변경하지 않습니다. 패키지 설치 정책과 전용 helper 권한이 필요하며, 설치 과정에서 서비스가 시작될 수 있습니다. 실제 설치 검증은 미수행입니다. PostgreSQL은 버전별 실행 경로가 달라 현재 화면에서 서버 바이너리 해시를 표시하지 않습니다.

### 데몬 관리

nginx·cron·certbot.timer와 PostgreSQL·MariaDB·Redis의 systemd 상태/로그 조회 및 시작·중지·재시작·부팅 자동 시작 설정을 제공합니다. enable/disable은 즉시 시작/중지를 하지 않습니다. PostgreSQL의 개별 cluster unit 관리와 Node.js 앱의 사용자 정의 unit 등록은 아직 제공하지 않습니다.

### GUI IDE와 AI 오류 분석

GUI IDE는 파일 탐색·검색, 여러 파일 탭, 미저장 표시, Ctrl+S, 줄 번호·커서 위치·문자열 검색을 제공합니다. 탭별 편집 내용을 유지하며 도구 화면 전환 시에도 코드가 유지됩니다. 패키지 환경 설정 폼에서 nginx·Certbot·Node.js·PostgreSQL·MariaDB·Redis 초안을 생성해 IDE에 엽니다. 생성/저장은 운영 설정 적용과 구분됩니다. 패키지별 운영 설정 적용은 해당 검토·검수 절차를 거치며 생성만으로 자동 적용되지 않습니다. 범용 DB 접속 관리와 LSP는 미지원입니다. 대화형 PTY는 별도 터미널 페이지에서 제공합니다.

로그 화면과 IDE 콘솔에서 AI 도우미를 사용합니다. 서버에 `OPENAI_API_KEY`, `LINUX_ENABLE_AI=true`를 설정하고 `LINUX_AI_MODEL`로 모델을 선택합니다(기본 `gpt-4.1-mini`). 로그를 불러온 뒤 전송 내용을 검토하고 동의해야 분석합니다. 서버는 일반적인 비밀 값 패턴을 마스킹하며 요청 본문/분석 결과를 감사 로그에 저장하지 않습니다. API 키는 클라이언트에 전달하지 않습니다. 한 번에 한 요청, 최소 5초 요청 간격, 45초 제한, 입력 16KB·출력 2000토큰 제한을 적용합니다. 모델 제안은 자동 실행하지 않습니다.

[OpenAI Responses API 공식 문서](https://developers.openai.com/api/docs/guides/migrate-to-responses)에 따라 `store:false`로 응답 저장을 비활성화합니다. 이 설정만으로 모든 제공자 로그 보존이 없어지는 것은 아닙니다. 비용/권한/크레딧 오류는 화면에 표시합니다. 실제 운영 로그 전송은 수행하지 않았습니다.

터미널은 왼쪽 관리 메뉴에서 바로 열 수 있습니다. IDE와 같은 작업 공간의 실행 화면을 사용하며, 메뉴 전환 시 파일 편집 탭을 유지합니다. 대화형 PTY 셸에서 현재 실행 사용자 권한으로 명령을 실행합니다. Linux 로그인 비밀번호를 웹 계정 설정에 수집하거나 저장하지 않습니다. CLI의 입력은 선택한 셸 세션으로 전달됩니다.

### 관리자 로그인 설정

웹 로그인은 사용자명·비밀번호를 사용합니다. 개발 환경에서는 프로젝트 폴더의 대화형 터미널에서 실행하세요.

```bash
cd /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux
npm run account:setup
```

사용자명은 표시되고 비밀번호 입력은 숨겨집니다. 지정한 인증 루트의 `auth.json`에 사용자명과 scrypt 비밀번호 해시를 권한 0600으로 저장합니다. `LINUX_AUTH_ROOT`를 지정하지 않으면 앱의 상태 저장 루트를 사용합니다. 기존 계정을 재설정하려면 `npm run account:setup -- --replace`를 사용하세요. 저장 후 로그인 화면을 새로고침하세요.

설치 패키지에서는 서버의 대화형 터미널에서 `sudo tastedev-linux account setup`을 실행합니다. 개발 프로젝트의 npm 명령을 설치 장비에서 실행할 필요는 없습니다.

계정 파일 대신 환경 변수로 설정할 경우에만 `.env.local`에 `LINUX_LOGIN_USERNAME`, `LINUX_LOGIN_PASSWORD_HASH`를 지정하고 서버를 재시작하세요. 계정 파일이 있으면 환경 변수보다 우선합니다. 비밀번호는 12~256자이며 아래 명령은 비밀번호 원문 대신 scrypt 해시만 출력합니다. 셸 이력에 비밀번호를 넣지 마세요.

```bash
read -r -s -p '관리자 비밀번호: ' linux_password
printf '%s' "$linux_password" | node scripts/login-hash.mjs
unset linux_password
```

출력 해시를 `LINUX_LOGIN_PASSWORD_HASH`에 저장합니다. 웹 앱은 Better Auth와 HttpOnly·SameSite=Strict 쿠키로 인증하며 세션 유효 기간은 7일입니다. 지속적으로 사용하면 하루 간격으로 세션을 갱신합니다. 로그인 요청은 전체 서버에서 분당 10회로 제한합니다. HTTPS 배포 시 `LINUX_COOKIE_SECURE=true`와 실제 사이트 주소인 `BETTER_AUTH_URL`을 설정하세요. 기존 Bearer 관리자 토큰은 작업 API 인증에 사용되지 않습니다. 모든 관리 API는 로그인 세션이 필요합니다. 실제 계정 비밀번호는 이 개발 작업에서 임의로 생성하지 않았습니다.

세션과 서명 키는 계정 저장 루트의 `better-auth/auth.sqlite`와 `better-auth/secret`에 권한 0600으로 저장되어 프로세스 재시작 후에도 유지됩니다. 이 디렉터리는 비공개로 보존해야 합니다. 기존 scrypt 계정은 비밀번호 재설정 없이 연결되며 공개 회원 가입은 제공하지 않습니다. 이전 메모리 인증 방식에서 전환할 때만 한 번 다시 로그인해야 합니다. 다른 장비의 여러 인스턴스에는 별도 공유 데이터베이스 구성이 필요합니다.

인증 저장소는 디렉터리 0700·파일 0600 권한을 지원하는 파일시스템에 두세요. exFAT처럼 권한을 지정할 수 없는 작업 디스크에서는 `.env.local`의 `LINUX_AUTH_ROOT`를 사용자 홈의 비공개 폴더로 지정해야 합니다. 기존 `auth.json`과 이미 생성된 `better-auth` 파일은 새 경로로 함께 옮겨 계정과 세션을 보존하세요. `npm run account:setup`도 Next.js 환경 파일을 읽어 동일한 경로를 사용합니다. 설치 패키지는 서비스에서 지정한 인증 경로를 사용합니다.

로그인 후 **보안 · 감사 기록 → 관리자 계정**에서 현재 비밀번호를 확인하고 새 비밀번호로 변경할 수 있습니다. 변경 완료 시 모든 세션을 폐기하고 다시 로그인을 요청합니다. 기존 API 키·환경 변수 파일은 변경하지 않습니다.

IDE는 확장자에 따른 기본 구문 강조(JavaScript/TypeScript/JSON/셸/Python/설정 파일)를 제공합니다. 컴파일러·LSP 기반 문법 검사와 자동 완성은 포함하지 않습니다.

HTTPS 관리 화면에서 발급과 기존 인증서 전체의 갱신 테스트(`renew --dry-run`)를 선택할 수 있습니다. [Certbot 공식 문서](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates)에 따라 테스트도 nginx 변경과 기존 pre/post hook 실행이 가능하므로 영향 확인 후 실행합니다. 실제 갱신 테스트는 이 개발 검증에서 수행하지 않았습니다.

보안 화면은 전용 관리자 helper 파일의 설치·root 소유권·경로 안전성·앱과의 SHA-256 일치를 확인합니다. 파일 확인만으로 sudo 권한이 있다고 판단하지 않습니다. helper가 없거나 앱 버전과 다르면 관리자 작업을 차단합니다.

nginx 운영 블록을 편집할 때 현재 버전을 확인합니다. Certbot이 추가한 HTTPS 설정은 유지하면서 location의 앱 프록시 또는 정적 웹 루트만 변경합니다. HTTPS 수신 포트 변경과 중첩 location 등 지원하지 않는 구조는 GUI 적용을 거부합니다. 명령 검토는 실제 보존된 설정 전체를 보여주며, 적용 시 root helper에서도 같은 보존·버전 검사를 독립 수행합니다.

## Debian 패키지 배포

개발 소스에서는 `npm run build` 후 `npm run package:deb`으로 `.deb`를 생성합니다. 출력 파일은 `/mnt/data/build/tastedev-linux/tastedev-linux-package-*`의 새 폴더에 보존하며 명령 결과의 `package` 경로로 확인합니다. 최종 검증은 `npm run package:verify -- <출력된 DEB 절대 경로>`로 실행합니다. TypeScript 소스 도구에는 TypeScript 지원 Node 런타임(Node 24 권장)이 필요합니다. TypeScript 기능 없이 빌드된 일부 배포판 Node 22에서는 소스 도구를 직접 실행할 수 없습니다. 설치된 앱의 JavaScript 런타임은 Node.js 22 이상을 사용하며, 의존성의 native 바이너리 때문에 빌드한 CPU 아키텍처용 패키지입니다. 소스의 `.env*`, `.runtime`, 계정, API 키는 패키지에 포함하지 않습니다.

설치 계정이 확인되지 않았을 때 먼저 실행할 Linux 사용자 이름을 지정합니다. 이미 존재하는 일반 로그인 계정이어야 합니다.

```bash
sudo tastedev-linux service setup 사용자명
```

서비스 사용자 설정은 `/etc/tastedev-linux/service-user`와 `/etc/systemd/system/tastedev-linux.service.d/10-user.conf`에 root 소유로 저장합니다. 상태 파일은 지정한 계정 소유로 보존하며, symlink·특수 파일·hardlink 상태 파일은 자동 이관을 거부합니다. 서비스와 터미널은 같은 사용자로 실행합니다. 웹 로그인 비밀번호는 Linux 로그인 비밀번호와 별개의 앱 인증 정보입니다.

패키지 설치 환경의 최초 계정 설정은 서버 터미널의 어느 디렉터리에서든 실행합니다.

```bash
sudo tastedev-linux account setup
```

기존 계정을 명시적으로 교체할 때만 `sudo tastedev-linux account setup --replace`를 사용합니다. 비밀번호는 숨겨서 입력받고 `/var/lib/tastedev-linux/auth.json`에 해시만 저장합니다. CLI는 설치 시 기록한 Linux 실행 사용자로 웹 관리자 계정 설정을 실행합니다. 서버 설정과 상태는 `/var/lib/tastedev-linux`, 설치 코드는 `/usr/lib/tastedev-linux`, 서비스는 `tastedev-linux.service`를 사용합니다. 기본 주소는 `http://127.0.0.1:8791/login`이며 실제 sudo helper 허용과 기능별 권한은 자동으로 부여하지 않습니다.

현재 패키지 파일만 생성·검증했으며 APT 저장소에는 게시하지 않았습니다. 따라서 저장소 등록 없이 `sudo apt install tastedev-linux`이 가능하다고 보장하지 않습니다. 로컬 파일 설치는 승인된 배포 장비에서 `sudo apt install ./dist/tastedev-linux_0.1.0_amd64.deb`으로 수행합니다. 설치 스크립트는 `SUDO_USER`로 확인한 일반 Linux 사용자를 실행 계정으로 기록하고 systemd 사용자 drop-in을 구성합니다. root 계정·시스템 계정·로그인 불가 계정은 실행 사용자로 허용하지 않습니다. 설치 사용자를 확인할 수 없는 root 설치는 서비스를 시작하지 않고 `sudo tastedev-linux service setup 사용자명`을 안내합니다. 업그레이드는 기록한 계정을 유지합니다. 실행 계정 변경은 자동 지원하지 않으며 별도 데이터 이관 검토가 필요합니다. Linux 계정 비밀번호는 입력받거나 저장하지 않습니다. 서비스 HOME은 선택한 사용자의 홈이며 PATH에는 해당 홈의 `.local/bin`과 `bin`, 시스템 실행 경로가 포함됩니다. 별도 Node 버전 관리자 경로는 사용자 셸 설정 또는 서비스 환경에 추가해야 합니다. Claude·Codex CLI 자체의 설치와 인증은 별도로 필요합니다. 검증 장비의 운영 설정은 변경하지 않았습니다.

## 언어·테마

해/달 아이콘은 밝게·어둡게 전환하며 선택을 저장합니다. 언어 목록은 이 빌드 장비의 glibc SUPPORTED에서 얻은 321개 canonical locale을 포함합니다. 이는 모든 Linux 배포판의 로케일 목록과 동일하다는 의미는 아닙니다. 한국어·영어·일본어·포르투갈어 UI 리소스를 제공합니다. 일본어·포르투갈어는 현재 영어 기준 카탈로그 1,348개 항목과 키가 일치합니다. 중국어 등 나머지 부분 번역 언어와 카탈로그가 없는 로케일의 미번역 문구는 영어로 대체합니다. 기준 카탈로그 밖 동적 문구와 전 언어 완전 번역은 미완료입니다. 번역 리소스는 `lib/locales`, provider는 `components/language-provider.jsx`에 있습니다. 브라우저 언어 감지·선택 저장·RTL 방향·Intl 형식 유틸리티를 제공합니다. 언어 선택기의 324개 표시 이름과 국기는 `lib/locales/linux-languages.json`의 고정 데이터로 제공해 서버와 브라우저의 언어·지역 추론 차이가 초기 렌더링에 영향을 주지 않게 합니다.

패키지 생성 후 `npm run package:verify`로 내용·권한·helper·checksum을 확인할 수 있습니다. 검사 증거는 `.runtime/verification`에 저장합니다. 언어 목록은 지역 국기를 표시하며 스페인어·프랑스어·독일어의 주요 화면 리소스도 추가했습니다. 미번역 문구는 영어로 표시됩니다.

IDE 편집 탭과 패키지별 설정 초안은 같은 브라우저 화면에서 페이지를 이동해도 메모리에 유지됩니다. 로그아웃·세션 만료·새로고침으로 지워지며 디스크에 저장한 파일은 영향을 받지 않습니다. 미저장 파일이 있으면 새로고침/창 종료 경고를 표시합니다. 로그인은 처음 요청한 관리 경로와 허용된 IDE 패키지 선택으로 복귀합니다.

소스 production 실행은 `npm run build` 후 `npm start`를 사용합니다. 일반 Next.js 서버(`next start`)로 실행하며 기본 주소는 http://127.0.0.1:8787 입니다. 다른 포트는 `npm start -- --port 8791`로 지정합니다. 계정과 작업 폴더는 기존 프로젝트 `.runtime` 경로를 유지합니다. 개발 실행은 `next dev`, production 빌드는 `next build` 표준 CLI를 사용하며 현재 작업 디스크의 Turbopack 심볼릭 링크 제한 때문에 webpack 옵션을 지정합니다. bin-links=false 환경의 CLI 진입점은 postinstall에서 일반 실행 파일로 준비합니다. 현재 지원 아키텍처의 SQLite 바이너리는 패키지에 포함되어 있어 별도 소스 빌드를 실행하지 않습니다.

패키지 GUI의 **작업 폴더에 초안 저장**은 검증된 설정을 `LINUX_WORKSPACE_ROOT`(기본 `.runtime/workspace`)에 새 UUID 파일명으로 저장합니다. 보안 설정에서 조회 전용을 끄고 파일 편집을 허용해야 합니다. 저장 파일 이름이 화면에 표시되며 시스템 설정 적용과 서비스 재시작은 별도 관리 작업입니다. 폼 값을 바꾸면 이전 설정 미리보기는 닫힙니다.

PostgreSQL·MariaDB·Redis GUI의 **운영 설정 조회**는 지정된 `/etc` 설정 파일의 지원 항목을 표시합니다. 여러 파일은 각각 선택해 폼으로 가져올 수 있습니다. 권한 부족·심볼릭 링크·지원 범위를 벗어난 값은 경고로 표시합니다. include 파일과 DB/Redis 프로세스의 최종 실행 값을 완전히 해석하지 않으므로 조회 결과를 실제 적용 상태로 단정하지 마세요. 시스템 파일 쓰기는 이 조회·가져오기 과정에서 수행하지 않습니다.

### Tauri 데스크톱 패키지

`npm run package:desktop`는 잠금 파일을 사용한 offline Cargo release 빌드 후 `dist/tastedev-linux-desktop_0.1.0_amd64.deb`를 생성합니다(아키텍처에 따라 이름 변경). `npm run package:desktop:verify`로 패키지·ELF·공유 라이브러리·메뉴·아이콘을 검증합니다. Cargo 의존성과 GTK/WebKit 개발 도구가 미리 설치된 빌드 장비에서 사용합니다.

데스크톱 패키지는 같은 버전의 `tastedev-linux` 서버 패키지에 의존하며 앱 메뉴에서 **Tastedev Linux**를 실행할 수 있습니다. 웹 서버는 기본 127.0.0.1:8791에서 별도로 실행되어야 합니다. 서버 계정 생성과 로그인은 웹 버전과 같습니다. 이 배포본은 현재 Linux 빌드 장비의 공유 라이브러리를 기준으로 구성했으며 다른 배포판에서의 호환성은 별도 검증이 필요합니다. 패키지 생성·검증만으로 실제 데스크톱 실행 PASS를 의미하지 않습니다.

운영 설정을 폼으로 가져오면 패키지별 비교 기준이 저장됩니다. **운영 설정과 비교**에서 불러온 값과 편집 값을 확인할 수 있습니다. 조회되지 않은 항목은 동일한 것으로 간주하지 않으며, 비교 기준은 불러온 시점의 파일 항목입니다. 최신 운영 값을 확인하려면 다시 조회해 가져오세요.

감사 화면은 최신 기록 최대 100건에서 검색어·결과 상태·UTC 날짜로 필터링합니다. **선택한 감사 기록 내보내기**는 화면에 선택된 기록을 JSON으로 저장합니다. 파일은 선택 기록과 내보내기 시각·범위를 포함하며 전체 보존 이력의 완전한 백업을 의미하지 않습니다.

패키지 설정 스키마의 입력 라벨·설명·작업 유형은 영어·일본어·중국어·스페인어·프랑스어·독일어에 명시 번역을 제공합니다. `config-translations.test.mjs`는 스키마 변경 시 이 번역 키의 누락을 확인합니다. 전체 화면 및 Linux 지역 로케일의 완전 번역은 아직 진행 중입니다.

패키지 GUI에서 생성한 설정은 코드 작성기에서 직접 수정할 수 있습니다. 수정한 코드는 작업 폴더에 저장하거나 다운로드할 수 있으며 시스템 설정을 자동 적용하지 않습니다. GUI 입력을 바꾸어도 코드 초안은 보존되고, 편집한 초안을 새 설정으로 교체할 때 확인합니다. **코드 편집 숨기기**는 초안을 지우지 않습니다. 패키지별 초안은 현재 로그인 세션의 메모리에 유지되며 코드 변경은 GUI 입력값으로 역반영되지 않습니다.

MariaDB GUI는 운영 파일을 폼에 불러온 뒤 main/include 연결을 조회하고 변경 계획을 검토할 수 있습니다. 패키지로 설치한 root 소유 helper에서만 **MariaDB 설정 적용**을 실행합니다. DB 변경 권한·관리자 실행·sudo 허용이 필요하며 재시작 확인을 받습니다. 전체 include 후보를 private 폴더로 재연결해 설치 버전에 맞는 설정 검사 또는 옵션 파싱 검사와 지원 값 비교를 수행합니다. 옵션 파싱 검사는 실제 서버 시작 성공을 보장하지 않습니다. 설정 적용 전 백업을 `/var/lib/linux/admin/mariadb`에 저장하고 재시작 실패 시 원본 복원과 서비스 복구를 시도합니다. 외부 변경이 있으면 자동 덮어쓰기를 피하고 수동 복구 필요 상태를 반환합니다. 현재 symlink main과 서비스의 별도 시작 옵션은 지원하지 않습니다. 실제 MariaDB 적용 E2E는 아직 미검증입니다. 개발 폴더/helper 수동 단일 파일 설치로는 이 작업을 실행할 수 없습니다.

MariaDB GUI의 **MariaDB 백업 조회**는 관리자 helper가 root 전용 설정 백업을 검사한 뒤 ID·대상·시각·크기·버전만 표시합니다. 설정 원문과 비밀번호는 웹 응답에 포함하지 않습니다. 손상·공개 권한·심볼릭 링크 기록은 제외 수로 표시합니다. 이는 설정 파일 백업이며 DB 데이터 백업이 아닙니다. 복원 검토 뒤 명시적 확인으로 전체 파일 복원과 MariaDB 재시작을 요청할 수 있습니다.

MariaDB 설정 백업의 **복원 검토**에서는 main을 선택해 현재 include 연결의 대상 파일과 백업을 비교할 수 있습니다. 지원 항목만 표시하며 원문을 내려보내지 않습니다. 연결이 불완전하거나 대상이 main에 포함되지 않으면 검토를 거부합니다. 이 단계는 파일을 복원하지 않습니다. 복원 실행은 private 전체 후보 검사·직전 파일 백업·재시작·실패 복원을 수행합니다. 실제 root/MariaDB 복원 성공 E2E는 아직 미검증입니다.

MariaDB의 **서비스 main 확인**은 root helper에서 실제 MainPID와 실행 바이너리/시작 인수를 확인합니다. 명시적 main 불일치·추가 defaults·지원 외 시작 옵션은 적용 전에 차단합니다. 기본 main 경로 대조는 다른 기본 검색 파일·환경까지 확인한 결과가 아니며 화면에 가정 상태를 표시합니다. 이 검사는 적용/복원 전후에도 수행합니다. 현재 실행 중 서비스만 지원하므로 MainPID가 없는 중단 서비스 복원과 다른 시작 옵션은 별도 지원이 필요합니다.

소스 개발 환경에서는 `npm run verify:mariadb:native`로 실제 MariaDB 설정 진단을 별도로 실행할 수 있습니다. 로컬 Docker Desktop의 `desktop-linux` context와 미리 받은 공식 `mariadb:11.4` 이미지를 요구합니다. 현재 이미지 ID로 고정해 실행하며 네트워크 없음·읽기 전용 루트·모든 capability 제거·자원 제한을 사용합니다. 생성한 후보만 stdin tar로 tmpfs에 전달하므로 호스트 파일을 마운트하지 않습니다. 실행 UID는 후보를 생성한 사용자이며 진단 datadir도 `/tmp`로 제한합니다. 컨테이너는 실행마다 제거합니다. 이는 옵션/설정 파싱 검사이며 DB 기동·접속·systemd 재시작 E2E는 아닙니다. 일반 단위 테스트나 배포 서비스에서 자동 실행하지 않습니다.

PostgreSQL 설정 진단은 `npm run verify:postgresql:native`로 실행합니다. 같은 Docker Desktop 격리 방식과 미리 받은 공식 `postgres:16` 이미지를 사용합니다. 실제 `postgres -C`로 GUI의 다섯 설정값, 메모리 내부 단위, include 덮어쓰기, 잘못된 옵션, 전체 복구 설정 파싱을 확인합니다. PostgreSQL 서버·접속·root helper·pg_ctlcluster는 실행하지 않습니다. 두 native 검증기는 `scripts/native-diagnostics.mjs`의 격리 및 자신의 컨테이너 정리 절차를 공유합니다.

### 로컬 apt 저장소 구성

`npm run package:deb`로 생성한 패키지의 절대 경로를 `npm run package:apt -- <DEB 절대 경로>`에 전달하면 `/mnt/data/build/tastedev-linux/apt-repository-*` 아래에 pool, Packages, Packages.gz, Release를 생성합니다. 기존 저장소 폴더를 덮어쓰지 않습니다. 출력된 repository 경로를 `node scripts/verify-apt-repository.ts <repository 경로>`에 전달하면 패키지·인덱스·Release 체크섬과 압축 해제를 검사합니다.

이 결과는 서명 전 저장소 초안입니다. 배포 서명 키로 Release/InRelease를 서명하고 HTTPS 저장소에 게시한 뒤, 별도 설치 검증 장비에서 signed-by 키와 저장소 주소를 등록하여 apt 설치·업데이트를 확인해야 합니다. 이 스크립트는 서명 키 생성, 게시, 장비 apt 설정 변경 또는 패키지 설치를 수행하지 않습니다. 실제 apt 설치 가능 여부는 해당 검증 후 판단합니다.

`npm run package:apt:sign -- <repository 경로> <전체 GPG 키 지문>`은 지정한 기존 키로 InRelease와 Release.gpg를 만들고, GPG가 검증한 키 지문 및 서명된 Release 원문을 확인한 뒤 결과를 저장합니다. 기존 서명 파일은 덮어쓰지 않습니다. 성공 시 dists/stable/Signature.json에 공개 키 지문과 Release 체크섬을 기록합니다. 생성 당시 manifest.json은 서명 전 빌드 메타데이터이며 실제 서명 결과는 Signature.json과 GPG 검사로 확인합니다.

`node scripts/verify-apt-signing.mjs <서명 전 repository 경로>`는 별도 임시 GNUPGHOME과 테스트 전용 키를 생성하여 서명 성공·변조 거부를 검사하고 테스트 키/복제 저장소/에이전트를 정리합니다. 실제 배포 키를 사용하지 않습니다.

서명 검증 스크립트는 시스템과 분리된 apt 설정·목록·캐시·로그를 만들고 테스트 키의 signed-by 파일 저장소만 사용합니다. 실제 apt의 인덱스 인증, 후보 버전 조회, 패키지 다운로드 체크섬과 변조된 InRelease 거부를 확인합니다. 설치는 수행하지 않으며 임시 apt 파일은 검사 종료 후 삭제합니다. 이 결과는 로컬 파일 저장소 검사로, 실제 HTTPS 게시·설치·업데이트 성공을 의미하지 않습니다.

### 설치된 CLI의 PTY 버전 확인

프로젝트 폴더에서 `npm run verify:terminal:cli`를 실행하면 현재 프로세스 PATH의 Codex/Claude를 임시 PTY에서 `--version`으로만 검사하고 `.runtime/verification`에 결과를 기록합니다. CLI 로그인이나 AI 요청은 실행하지 않습니다. NVM 등 개발 셸의 PATH와 deb 서비스 PATH가 다르면 별도로 확인해야 합니다.

## PostgreSQL HBA 적용·복원 native 검증

```bash
npm run verify:postgresql:hba:operation
```

개발 계정으로 실행하며, 기존 로컬 Docker Desktop `desktop-linux`의 `postgres:16` 이미지를 immutable image ID로 사용합니다. 이미지를 내려받거나 운영 서버/DB에 연결하지 않습니다. network none, host bind mount 없음, non-root postgres 계정, private tmpfs 안의 일회용 클러스터에서 실제 HBA 파일 교체·reload·접속 허용/거부·백업 복원·주입 실패 rollback을 확인합니다. 검증이 끝나면 라벨이 일치하는 자기 container만 정리하고 `.runtime/verification`에 증거를 기록합니다.

systemd 호출은 검증 fixture가 실제 `pg_ctl`로 연결하며 runuser는 같은 postgres 계정의 실행으로 대체합니다. production `/proc`·pidfile·Unix socket identity와 fixed read-only settings query를 실행하지만 운영 systemd/runuser E2E를 증명하지 않습니다. 운영 API의 `reloadAcceptanceVerified=false`는 유지합니다.

## 관리자 kernel 잠금·명령 supervisor native 검증

```bash
npm run verify:admin:lock:native
```

개발 계정에서 기존 local Docker Desktop image만 사용합니다. network none/host bind 없음/cap-drop ALL의 일회용 컨테이너에서 실제 UID0 helper·manifest·flock·SIGKILL·명령 완료까지 대기·UTF8·timeout·root FD 비노출을 검사합니다. Node와 fixture 설치 파일은 컨테이너의 private writable layer에만 복사하고 실행 후 컨테이너를 제거합니다. 운영 DB 연결이나 호스트 패키지·서비스 변경은 하지 않습니다. 전체 운영 복구를 증명하는 명령은 아닙니다.

PostgreSQL HBA 적용 창에서 중단 작업을 발견하면 새 적용 검토 대신 **중단 작업 복구**를 표시합니다. 확인 후 원본 백업/참조 파일/서버 identity를 검증해 복원과 reload를 수행하며, 외부 편집은 보존합니다. 서비스 복구 실패는 기록을 유지해 재시도할 수 있습니다. 개발 전용 `npm run verify:postgresql:hba:operation`에는 실제 native reload 이후 자식 SIGKILL, journal을 통한 원본 복원 및 새 fixture 계정 접속 거부 확인도 포함합니다. 이 검증은 운영 DB에 접근하지 않습니다.
