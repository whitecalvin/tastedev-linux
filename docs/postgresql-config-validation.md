# PostgreSQL native 옵션 격리 검수 기반

아직 운영 적용 GUI/API/helper와 연결하지 않은 source 모듈입니다. `inspectPostgresqlConfiguration`은 등록된 설정 graph → private 후보 → PostgreSQL 옵션 해석 → 후보/운영 graph 재확인 → cleanup을 연결합니다. 호출 시 실행 계정과 filesystem/validator 의존성은 내부 helper 또는 fixture가 제공하며 HTTP 요청 필드로 받아서는 안 됩니다.

root helper용 기본 검수 UID/GID는65534입니다. 후보의 상위 디렉터리는 실행 계정 소유0700으로 유지하고 하위 namespace payload는 검수 계정 소유0700/파일0600으로 만듭니다. 호스트의 상위 경로를 통과할 수 없으므로 비밀 원문은 계속 보호됩니다. namespace에서는 상위 디렉터리를 새로 생성하고 하위 payload만 읽기 전용으로 바인드합니다. 검수 계정 정보를 담은 고정 passwd/group도 namespace에만 제공합니다. 원본 파일 소유권은 변경하지 않습니다.

namespace는 모든 namespace 분리와 추가 user namespace 금지, 비-root UID/GID, capabilities 제거, 환경 초기화, CPU/메모리/파일/프로세스 제한을 설정합니다. 운영 `/etc/postgresql`, `/var/lib/postgresql`, 소켓과 네트워크는 제공하지 않습니다. `/usr`만 읽기 전용으로 제공하고 `/tmp`는16MiB tmpfs입니다. id -u/-g로 실행 계정을 확인한 뒤 고정된 postgres -C 명령만 허용합니다. 임의 binary/argv, 운영 data path, password 조회는 거부합니다.

[`postgres -C`](https://www.postgresql.org/docs/current/app-postgres.html)는 설정 값을 출력하고 종료하며 이 invocation의 인수 override를 반영합니다. 실행 중 클러스터의 시작 인수를 반영하지 않습니다. 검수는 private config_file과 `/tmp` data_directory를 고정하고 port/max_connections/shared_buffers/work_mem/logging_collector만 조회합니다. 메모리 값은 native 내부 단위이며 GUI MB값으로 직접 해석하면 안 됩니다. data_directory 원문은 검수 override로 대체되므로 그 운영 접근성은 증명하지 않습니다. postgresql.auto.conf와 실제 startup overrides, 데이터/TLS/플러그인 자원은 별도 검사가 필요합니다.

검수 실행 파일 root 소유권·권한·identity·SHA-256과 후보 checksum을 실행 전후 확인합니다. 명령당30초/출력4096byte로 제한하고 native 오류를 일반 오류로 바꿉니다. namespace 실패 시 호스트 검수로 대체하지 않습니다. 반환값은 고정된 공개 설정 값과 scope/proof뿐이고 native 원문·암호를 포함하지 않습니다. 구조화한 결과의 postmasterStarted, operationalResourcesVerified, autoConfigurationVerified는 false입니다.

fixture는 고정 argv/mount, 계정 확인, 출력 제한과 허용 값, native 오류·실행 파일 변경·후보 변경 거부, 원본 변경 감지, exact 후보 전달·비밀값 제외·cleanup을 검사합니다. 현재 PostgreSQL16 실행 파일이 없어 실제 native parse/namespace는 미검증입니다. 실제 root65534 ownership 전환도 fixture의 현재 계정 검사와 구분해야 합니다. 다음 단계는 helper/전체 코드 검토·적용·복원/GUI 및 실제 설치 환경 검증입니다.
