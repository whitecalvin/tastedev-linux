# 103번 Redis 실제 격리 기동 검수

현재 `redisCodeOperationPlan` 및 `validateRedisSandboxCandidate`의 실제 bwrap 후보 실행 경로 5개 검사를 통과했다. 기존 중첩 namespace 제한은 103번 자체 mount/PID/network/IPC/UTS namespace의 전용 procfs로 해결했으며 제품 내부 후보의 읽기 전용 설정 연결·네트워크 분리·자원 한도를 유지했다.

증거: `.runtime/verification/remote-postgresql-host-jail-20261008T041216Z/result.json`.

- 실제 Redis 기동과 private Unix socket 준비 상태 확인.
- 잘못된 지시어의 native 거부 및 원본 보존.
- requirepass 후보의 NOAUTH 응답을 준비 상태로 처리하고 fixture 자격 정보 비노출.
- 검토 기준 원본의 변경을 native 기동 전에 거부.
- 후보 프로세스·validation runtime 종료와 임시 전송 폴더 삭제.

103번에는 `/usr/bin/redis-server`가 없었다. 장비에 구성된 APT의 redis-tools `5:7.0.15-1ubuntu0.24.04.5`와 liblzf1/libjemalloc2를 자체 임시 폴더에 다운로드·추출했다. 패키지 메타데이터 SHA-256과 다운로드 파일이 일치하는지 확인했다. 실행 파일과 필요한 동적 라이브러리는 root 소유의 사설 `/usr`로 구성하여 외부 namespace 안에만 연결했다. 호스트 `/usr`, 패키지 설치, 설정, 기존 서비스, 설치 helper는 변경하지 않았다.

Redis 버전: 7.0.15. 실제 실행 파일 SHA-256: `8716cd03cf5a0fcd99d0e95f9b04f7983fb134345d6e5802a7f4259af3658b6d`. 현재 8.0.5의 사설 서버 적용/복구 증거와 구분한다. 이번 결과가 Redis 8 전체 지시어 지원, systemd 적용, 설치 GUI→서비스 전체 수용을 증명하지 않는다.

## 수정 및 최초 실패 기록

`scripts/verification/redis-startup-isolated.mjs`의 진단 launch가 `stdio: ignore`로 생성된 자식의 null stderr에 이벤트를 연결하는 오류를 수정했다. 검수 도구의 해당 launch에만 stderr pipe를 지정했다. 제품 runner와 격리 정책은 변경하지 않았다.

원격 도구에 `--redis-parser --private-proc-outer` 모드를 추가했다. 원본 버전 충돌 검사의 대상은 자체 임시 fixture만 쓰기 가능하며, 실제 `/etc/redis`에는 접근하지 않는다.

최초 실패는 040745Z·040840Z·040930Z(진단 도구 stderr), 040957Z(추출 라이브러리 누락), 041109Z(임시 사설 /usr의 그룹 쓰기 권한), 041151Z(자체 원본 fixture의 읽기 전용 연결) 기록에 보존했다. 모두 `.runtime/verification/remote-postgresql-host-jail-20261008T<시각>/result.json`이다. 마지막 실패에서는 세 native 후보가 이미 실행됐지만 전체 통과로 기록하지 않았다. 자체 임시 폴더의 구성만 수정한 뒤 최종 5개 PASS를 확인했다.

애플리케이션 소스는 이번 검수에서 변경하지 않았으며 Next.js 빌드와 최종 배포 패키지 검증을 반복하지 않았다.

## 실제 canonical helper 명령 후속

`--redis-helper --private-proc-outer` 모드에서 현재 전송한 `/usr/lib/tastedev-linux/scripts/admin/linux-admin redis-code-plan` 명령을 별도 프로세스로 호출해 위 5개 검사를 통과했다. 실제 helper의 영구 inode kernel flock 및 native lock supervisor도 실행했다. helper 오류 envelope의 action/protocol/status/필드를 제한해서 읽었으며, 실제 클라이언트 전체 HTTP/GUI transport를 실행한 검사는 아니다.

최초 실행은 자동 승인 검토가 `/var/lib/linux/admin`의 호스트 상태와 tmpfs 격리 증거 부족을 이유로 거부해 실행되지 않았다. helper를 실행하지 않는 `--redis-state-preflight --private-proc-outer` 검사로 mountinfo의 `/var/lib/linux` filesystem=tmpfs, uid=0, mode=0700, admin 경로 부재를 확인했다. 증거: `.runtime/verification/remote-postgresql-host-jail-20261008T041451Z/result.json`. 실제 helper 모드도 실행 전에 같은 mountinfo/소유권/상태 부재 조건을 강제 검사한다. 이 증거를 제출한 재실행은 승인됐다.

최종 helper 증거: `.runtime/verification/remote-postgresql-host-jail-20261008T041617Z/result.json`. actualHelperExercised 및 nativeLockSupervisorExercised는 true, operatingApplyVerified 및 systemdVerified는 false다. 설치 helper는 교체하지 않았다. 모든 상태는 전용 tmpfs와 자체 fixture였으며 임시 전송물 삭제를 확인했다.

041518Z는 client 전용 helper-error 모듈을 runtime에서 찾던 도구 오류, 041541Z는 의도된 native 거부의 동기 예외를 assert.rejects가 받지 못한 도구 오류로 보존했다. fixture adapter를 수정한 뒤 전체 검사에 통과했다. 제품 관리자 helper 또는 오류 처리 규약은 바꾸지 않았다.
