# 지정 장비 및 도메인의 실제 검증

## 호스트 임시 전송 승인 후 실제 실행 (2026-10-08)

### 현재 HBA 구문 검수의 실제 호스트 실행 성공

임시 클러스터 후속 7개 PASS: .runtime/verification/remote-postgresql-host-jail-20261008T032501Z/result.json. 실제 apply 자식 프로세스를 파일 교체 뒤 reload 단계에서 SIGKILL했다. 교체된 초안과 recoveryRequired=true journal을 확인한 뒤 현재 recoverPostgresqlHbaOperation으로 원본을 복원하고 실제 pg_ctl reload와 journal 삭제/recoveryRequired=false를 확인했다. 한글 데이터 보존과 자체 클러스터 종료·임시 폴더 삭제를 확인했다. 기존 5개 적용/복원/native 검수 흐름을 함께 유지했다. 실제 운영 프로세스에는 종료 신호를 보내지 않았다. systemd/GUI 전체 수용은 별도 남는다.

최신 임시 클러스터 적용/복구 검사 5개 PASS: .runtime/verification/remote-postgresql-host-jail-20261008T032329Z/result.json. 시스템 uidmap 패키지는 설치하지 않았다. root 부모가 자신이 만든 임시 user namespace 자식의 root/PostgreSQL 두 UID/GID만 매핑하도록 도구를 보완했다. 외부 검수 환경의 CAP_CHOWN/CAP_SETUID/CAP_SETGID만 보존하고 PAM을 호스트에서 가져오지 않도록 spawn UID/GID로 PostgreSQL 계정을 지정했다. capability 이름 첫 오류(032243Z)와 PAM 설정 없는 runuser 실패(032256Z)는 보존했다. uidmap 설치 요청은 불필요해져 철회했다.

현재 HBA coordinator의 실제 native parser 검토·원자적 설정 교체/native pg_ctl reload/비공개 백업·백업 복원과 undo 백업·잘못된 초안의 교체 전 거부·주입한 reload 실패의 원본 원복과 실제 복구 reload를 검사했다. 임시 Unix 소켓 클러스터의 한글 데이터 보존, journal 정리, privateClusterStarted/Stopped=true, privateWorkspaceRemoved/privateStageRemoved=true 확인. configurationApplied=true는 자체 namespace fixture만을 뜻한다. 호스트 DB/서비스/설정과 설치 helper는 변경하지 않았다. 실제 systemd 서비스 hook 및 브라우저 GUI 전체 수용은 이 검사에 포함되지 않으며 실패는 주입된 reload 오류다.

임시 클러스터 후속의 계정 매핑을 검수 전용 unshare user namespace에서 수행하도록 도구를 보완했다. PostgreSQL 계정을 포함하는 매핑과 CHOWN/SETUID/SETGID만 외부 bwrap에 허용하며 제품의 내부 검수 계획은 유지한다. 실제 실행은 unshare가 newuidmap 실행 파일을 찾지 못해 exit 127로 실패했다. DB 시작 전 실패이며 privateStageRemoved=true 확인. 증거: .runtime/verification/remote-postgresql-host-jail-20261008T032045Z/result.json. 103번에 uidmap 패키지를 설치할지 사용자에게 요청했으며 아직 설치하지 않았다. 전체 업그레이드나 서비스 설정 변경은 계획하지 않는다.

적용/복구 후속 도구 scripts/verification/postgresql-hba-lifecycle.mjs를 준비해 현재 coordinator의 native parser·실제 파일 교체·pg_ctl reload·백업 복원·주입된 reload 실패 원복과 한글 데이터 보존을 검사하도록 구성했다. 첫 실제 시도는 외부 user namespace가 root 한 UID만 매핑해 PostgreSQL 계정 소유권의 임시 데이터 폴더를 만들지 못하고 EINVAL chown으로 실패했다. DB는 시작되지 않았고 체크 0개, 전송 임시 폴더 삭제 확인. 증거: .runtime/verification/remote-postgresql-host-jail-20261008T031748Z/result.json. 해당 최초 결과의 privateClusterStopped=true는 시작 여부와 구분되지 않는 도구 보고 오류였으며 후속 소스에서 privateClusterStarted/Stopped를 실제 시작 여부로 기록하도록 고쳤다. 적용·복구 PASS는 아니다. 기존 helper 10개 및 직접 검수 11개 PASS는 유지한다.

최신 helper 후속은 10개 PASS: .runtime/verification/remote-postgresql-host-jail-20261008T031541Z/result.json. 6개 기본 흐름에 실제 helper/native parser의 invalid-method·invalid-address·invalid-option 거부 및 포함 파일의 오류 원래 경로/한국어 주석 뒤 2줄 매핑을 추가했다. 원본 설정·포함 파일과 백업 수 보존, 임시 폴더 삭제 확인. 한국어 설명 함수는 lib/postgresql-hba.ts의 해당 category별 원인/확인 안내에 연결되어 있다. 이 실행은 실제 브라우저 화면 수용 증거로 확대하지 않는다.

최신 실제 helper 경로 검수 6개 PASS: .runtime/verification/remote-postgresql-host-jail-20261008T031431Z/result.json. 사용자가 호스트 PID 사용을 승인한 후 읽기 전용 host procfs 방식은 UID map 쓰기 거부로 PARTIAL이었다(031319Z 기록). 이후 검수 도구에 --private-proc-outer를 구현해 unshare의 자체 mount/PID/net/IPC/UTS namespace에서 전용 procfs를 만든 뒤 외부 bwrap에 연결했다. 호스트 procfs나 PID 공간을 공유하지 않고 원래 helper/제품의 내부 후보 격리 계획을 유지한다. 전용 폴더 생성 순서의 첫 실패(031418Z)는 보존하고 소유권 변경 전 생성하도록 수정했다.

실제 canonical 경로의 root-owned helper에서 설정 읽기·백업/목록·버전 충돌 거부·복원 미리보기·심볼릭 링크 거부와 HBA native parser가 모두 성공했다. 엔진 postgresql-hba-file-rules, namespace UID/GID 65534, fixtureUnchanged=true, privateStageRemoved=true, installedHelperReplaced=false, hostConfigurationChanged=false. 운영 postmaster/서비스와 실제 설정 적용은 실행하지 않았으며 GUI 적용/실패 복구 전체 수용은 남는다. 호스트 procfs 연결 없이 helper 구문 검수의 차단을 해소했다. 아래 승인 대기/실패 기록은 이전 이력이다.

사용자가 호스트 /proc 읽기 전용 연결을 승인해 실제 재실행했다. helper 기본 5개는 통과했지만 HBA namespace 확인은 시간 초과였으며 후속 id 진단은 `bwrap: open /proc/156/ns/ns failed: No such file or directory`였다. 외부 PID namespace와 호스트 procfs의 PID 번호 불일치로 기존 읽기 전용 연결만으로는 해결되지 않았다. 원본 fixture·호스트 설정·설치 helper 보존과 privateStageRemoved=true를 확인했다. 증거: .runtime/verification/remote-postgresql-host-jail-20261008T024005Z/result.json.

검수 도구의 host-proc-outer 모드에서 외부 PID namespace만 호스트와 공유하고 사용자·네트워크·IPC·UTS 분리를 유지하도록 준비했다. 제품 후보의 기존 전체 namespace 분리는 변경하지 않았다. 재실행은 자동 승인 검토가 외부 PID 격리 변경을 기존 /proc 연결 승인 범위 밖으로 판단해 거부했으므로 실행되지 않았다. 호스트 PID 사용 범위에 대한 추가 승인 질문이 대기 중이다. 앞서 통과한 직접 검수 11개는 현재 증거이며 helper 전체 구문 검수 PASS는 아직 아니다.

실제 helper 전체 경로의 추가 검수: 외부 격리의 /proc만 호스트 읽기 전용 마운트로 대체하는 --host-proc-outer 모드를 준비했다. 제품의 내부 검수 계획은 유지한다. 이 명령은 자동 승인 검토에서 프로세스 메타데이터 노출이 기존 승인 범위 밖이라는 이유로 거부되어 실행되지 않았다. 정확한 읽기 전용 연결 범위와 검사 후 임시 정리를 사용자에게 질문했다. 기존 직접 구문 검수 11개 PASS는 유지되지만 실제 helper 전체 구문 실행 PASS로 확대하지 않는다.

후속 확장 실행 11개 PASS: 기본 5개에 포함 파일 정상 규칙의 원래 경로, 포함 파일 오류의 원래 경로/2줄 위치, include_dir 파일 순서/경로, @데이터베이스 목록 참조, 필수 포함 파일 누락, 포함 순환 거부를 추가했다. 정상·잘못된 규칙·참조 파일은 실제 PostgreSQL 격리 파서로 검사했고 누락·순환은 snapshot 단계에서 파서 실행 전에 거부되는 것을 확인했다. 주 파일과 확인한 포함/목록 원본 보존, 전송 임시 폴더 삭제, 기존 설정/설치 helper 무변경 확인. 증거: .runtime/verification/remote-postgresql-host-jail-20261008T011150Z/result.json. 이는 제품 GUI 전체 적용/복구 완료의 증거가 아니다.

103번에서 동일 HBA namespace 계획의 id 직접 실행은 UID 65534로 성공했고 자체 fixture를 삭제했다: .runtime/verification/postgresql-direct-namespace-20261008T010936Z/result.json. 중첩 환경 실패를 호스트 실행 실패로 확대하지 않는 근거다.

검수 도구에 --direct-parser를 추가했다. 승인한 모듈을 root 소유의 자체 임시 폴더에 둔 뒤 현재 validatePostgresqlHba 함수를 직접 호출한다. 원본 fixture는 /tmp 아래에만 존재하며 논리 경로 /etc/postgresql/18/fixture를 trusted base 옵션으로 연결했다. 실제 PostgreSQL 후보는 제품의 기존 bwrap 격리·65534 계정·자원 한도·네트워크 분리를 그대로 사용했다. 검수 도구의 외부 중첩 격리만 제거했고 제품 검수 격리는 약화하지 않았다.

정상 규칙, 잘못된 인증 방식, 잘못된 주소, 잘못된 인증 옵션을 PostgreSQL 18의 실제 pg_hba_file_rules로 구분했고 오래된 버전은 409로 거부했다. 5개 검사 PASS, fixtureUnchanged=true, privateStageRemoved=true, hostConfigurationChanged=false, installedHelperReplaced=false. 운영 postmaster/서비스를 시작하거나 기존 설정을 적용하지 않았다. 증거: .runtime/verification/remote-postgresql-host-jail-20261008T011042Z/result.json. 이는 현재 구문 검수 함수의 실제 격리 실행 증거이며 GUI→설치 helper→적용/실패 복구 전체 수용은 별도 남는다. 아래 중첩 검사 PARTIAL은 보존된 이전 이력이다.

package.json 추가 전송도 사용자가 승인했다. 보완한 실제 실행은 PARTIAL이다. helper의 한국어 원문/버전 읽기, 비공개 백업/목록, 오래된 버전 거부 및 추가 백업 무생성, 복원 미리보기의 원본 보존, 심볼릭 링크 거부 5개를 통과했다. HBA 구문 검사 전 격리 계정 확인 단계는 차단됐으며 동일 계획의 id 진단은 `bwrap: Can't mount proc on /newroot/proc: Operation not permitted`를 반환했다. bwrap는 0.9.0이고 외부 격리 안의 중첩 실행이다. 앞선 Docker의 namespace 생성 거부와 실패 지점이 다르다. 이 결과만으로 설치 앱의 호스트 직접 실행도 실패한다고 판단하지 않는다. fixtureUnchanged=true, hostConfigurationChanged=false, installedHelperReplaced=false, privateStageRemoved=true. 운영 DB 시작/설정 적용/전체 복구는 실행하지 않았다. 증거: .runtime/verification/remote-postgresql-host-jail-20261008T002759Z/result.json. 아래 추가 파일 승인 대기는 해결된 이전 이력이다.

사용자가 helper·런타임 141개의 호스트 임시 전송을 승인했다. 첫 실행은 전송과 격리 실행까지 도달했으나 helper 시작에서 실패했다. 검수 도구가 배포에 포함되는 scripts/admin/package.json을 누락해 호스트의 ES module 설정 아래 CommonJS helper의 require가 정의되지 않았다. 검사 항목은 실행되지 않았으며 성공으로 판단하지 않는다. 기존 설치 helper와 호스트 설정은 변경하지 않았고 privateStageRemoved=true를 확인했다. 원본 실패 증거: .runtime/verification/remote-postgresql-host-jail-20261007T224345Z/result.json.

검수 도구에 기존 package.json의 정확한 내용 {"private":true,"type":"commonjs"}을 검사하고 전송 목록에 포함하도록 수정했다. 제품 helper 소스는 변경하지 않았다. 재실행은 자동 승인 검토가 해당 메타데이터 파일의 추가 전송을 승인 범위 밖으로 판단해 거부했으므로 실행되지 않았다. 이 한 파일의 추가 전송·검수 후 삭제 승인을 별도로 요청했으며 답변을 기다린다. 아래 첫 전송 승인 대기 설명은 이전 이력이다.

사용자가 103번 장비와 eztoy.app을 제공했다. 장비 192.168.0.103의 nginx·Certbot 2.9.0·PostgreSQL 18·bwrap 0.9.0과 sudo -n 실행 조건을 확인했다. nginx는 구동 중이고 실제 서비스와 DB 포트가 있으므로 기존 설치·설정을 덮어쓰지 않는다. 지정 호스트의 sudo bwrap --unshare-all id 실행은 성공했다. Docker 제한과 구분한다.

기존 eztoy.app 및 www.eztoy.app 인증서는 유효하며 ACME webroot는 /var/www/letsencrypt이다. 공개 도메인이 Cloudflare를 경유하는 상태에서 고유 파일 한 개를 배타적으로 만들어 두 도메인의 외부 HTTPS 요청 내용이 일치함을 확인하고 동일 inode·내용을 검증한 뒤 삭제했다. nginx 설정은 변경하지 않았다. 증거 .runtime/verification/eztoy-origin-20261007T204546Z/result.json.

실제 Certbot renew --dry-run --cert-name eztoy.app의 webroot override staging 갱신 검사에서 두 도메인의 simulated renewal이 성공했다. 디렉터리 훅을 막고 pre/post/deploy는 true로 고정했다. 기존 nginx.conf·vhost_eztoy.conf·갱신 설정·fullchain.pem의 전후 hash가 일치했고 자체 작업·로그 폴더를 정리했다. 실제 운영 인증서 교체/서비스 배포/앱 GUI→작업 실행의 전체 수용을 증명하지 않는다. 증거 .runtime/verification/eztoy-certbot-dryrun-20261007T204754Z/result.json 및 certbot.log.

현재 helper와 런타임 141개를 root-owned 자체 /tmp 폴더로 전송하고 호스트 bwrap 안에서 canonical 경로에 읽기 전용으로 보이게 하는 도구를 준비했다: scripts/verification/remote-postgresql-host-jail.py. 명령은 자동 승인 검토에서 원격 소스 payload의 호스트 임시 폴더 전송에 대한 명시적 승인이 부족하다는 이유로 거부돼 실행되지 않았다. Docker 이미지 전송 승인과 별도이며 사용자에게 정확한 파일 범위·임시 보관 위치·검수/삭제 범위의 허용을 요청했다. 우회 전송하지 않았다. 현재 helper의 호스트 격리 검수·실제 적용·실패 복구와 GUI 수용은 미완료다. DEB 검증은 수행하지 않았다.
