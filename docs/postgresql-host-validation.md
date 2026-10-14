# 설치된 PostgreSQL 설정 검수

`npm run verify:postgresql:host -- 18`은 설치된 PostgreSQL 18 실행 파일을
실제 애플리케이션의 격리 검수 경로로 실행한다. 다른 설치 버전은 마지막 인자로
지정한다. 일반 OS 계정으로 실행하며 root 실행은 거부한다.

검사 파일은 새 `/tmp/tastedev-pg-host-*` 디렉터리에만 만든다. 포함 파일,
`include_dir`의 정렬 순서, 없는 선택 포함 파일, 잘못된 설정 이름·값을 검사한다.
원본 fixture의 바이트 보존과 후보 디렉터리 삭제도 확인한다. 실제 운영 설정,
DB 데이터 디렉터리, 실행 중인 DB 및 서비스에 접근하지 않는다.

검수는 bubblewrap namespace에서 계정 UID/GID를 확인한 뒤 PostgreSQL의
`-C`로 port, max_connections, shared_buffers, work_mem, logging_collector를
조회한다. namespace 실패 시 호스트 실행으로 대체하지 않는다.
바이너리 버전·SHA-256·실행 파일 identity 및 검사 결과는
`.runtime/verification/postgresql-host-*.json`에 기록한다.

Ubuntu Rust coreutils의 `/usr/bin/id` 링크는 고정된
`/usr/lib/cargo/bin/coreutils/id` 대상에 한해서 허용한다. 링크와 전체 부모 경로의
root 소유권 및 쓰기 권한, 대상 파일 바이트·링크 수를 검수 전후로 검사한다.
다른 실행 파일의 링크·hardlink 정책은 기존 제한을 유지한다.

이 검사는 임시 설정의 네이티브 구문·옵션 검수 증거다. 운영 리소스 접근성,
postgresql.auto.conf, 서비스 재시작, 설정 복원 coordinator, 설치 GUI 및 root
helper의 별도 계정 실행이 모두 검증됐다는 의미는 아니다.
