# MariaDB 후보 설정 격리 검수

설치 패키지의 MariaDB 지원 항목 적용과 백업 복원은 운영 설정을 복사한 private 후보를 bubblewrap namespace에서 검수합니다. 운영 `/etc/mysql`, 데이터 디렉터리, 소켓과 네트워크를 제공하지 않습니다. 후보는 읽기 전용이며 `/usr`의 검증 실행 파일과 라이브러리만 읽기 전용으로 제공합니다. 임시 공간과 CPU·메모리·파일 크기·프로세스 수를 제한합니다.

검수 실행 파일은 root 소유권·권한·파일 identity·SHA-256을 확인하고 각 실행 전후 다시 검사합니다. 후보 파일도 실행 전후 확인합니다. 사용자 요청으로 실행 파일·argv·runner를 지정할 수 없습니다. namespace probe가 실패하면 호스트 실행으로 대체하지 않습니다. 배포 Depends에 `bubblewrap`을 포함합니다.

MariaDB의 실제 capability 출력에 `--validate-config`가 있으면 사용하고, 없으면 `--verbose --help`로 옵션 검수를 수행합니다. `my_print_defaults`는 같은 namespace에서 후보의 지원 필드 값을 확인하며 비밀번호 등의 원문은 응답하지 않습니다. native 실행 오류도 일반 오류로 변환합니다. 기존 서비스 preflight의 `--no-defaults` capability 조회는 운영 설정을 읽지 않습니다.

`--defaults-file`은 private 후보 main에 고정됩니다. datadir와 error log는 namespace 내부 `/tmp`로 덮어씁니다. 이 검수는 운영 데이터·TLS 파일·플러그인·사용자 권한·전체 서비스 기동의 성공을 증명하지 않습니다. 반환되는 `operationalResourcesVerified`는 false이며 검수 방식은 결과에 명시됩니다. 옵션 설명은 [MariaDB 공식 문서](https://mariadb.com/docs/server/server-management/starting-and-stopping-mariadb/mariadbd-options)를 참고합니다.

후보 검수 실패 시 원본 백업·설정 교체·서비스 재시작을 수행하지 않습니다. 검수 성공 후에도 기존 include graph, 서비스 시작 main, 파일 버전을 재확인하고 transaction의 백업·교체·재시작·실패 시 원문 복원을 유지합니다.

현재 장비에 MariaDB 실행 파일이 없어 native 실행 검수는 미완료입니다. fixture 검사는 고정 argv, namespace 오류, 실행 파일/후보 변경, 지원 값 불일치, 적용·복원 연결 및 검수 거부 시 원본 보존을 확인합니다. 이후 MariaDB 전체 코드 적용 API/GUI가 연결되었습니다. 사용법과 검증 범위는 mariadb-code-operation.md를 참고하세요. 실제 native 운영 적용 검증은 남아 있습니다.
