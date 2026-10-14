# PostgreSQL 전체 설정 검수 UID 수정과 실제 적용·복원

2026-10-08, 승인된 103번 disposable 18/linuxverify20261008에서 현재 canonical helper의 postgresql-code-plan/apply/restore를 검수했다.

실제 버그: 후보 payload를 격리 내부 UID 65534와 같은 숫자의 호스트 UID로 chown하여 root helper가 만드는 bwrap UID 매핑에서 접근하지 못했다. 초기 실행은 bwrap의 passwd source Permission denied로 계획 단계에서 실패했으며 운영 설정을 변경하지 않았다. FD 전달 시도도 같은 매핑 문제를 해결하지 못했고 해당 변경은 되돌렸다.

최종 구현은 후보와 payload를 호스트 helper의 UID/GID 소유로 유지한다. 0700 디렉터리·0600 파일, private ancestor, namespace UID/GID 65534, 읽기 전용 bind, namespace와 capability 제한, 실행 전후 snapshot 검사는 유지한다. 호스트 소유자와 namespace ID가 다른 회귀 사례를 추가했고 관련 설정 그래프·검수·코드 적용·백업 복원 27개 검사 성공. 로그: .runtime/verification/postgresql-code-host-owner-20261008.log.

수정 후 실제 canonical root helper 계획이 통과했다. work_mem=8MB 후보를 적용하고 실제 systemd 재시작·postmaster 시작 시간 변경·실행 중 work_mem=8MB를 확인했다. 생성한 그래프 백업을 현재 helper로 복원해 원본 전체 설정 바이트와 실행 값 복귀, 한글 데이터 보존을 확인했다.

그 실행의 result.json은 정리 단계 오류 때문에 FAIL 상태를 그대로 보존한다. 제품의 그래프 복원이 의도적으로 남기는 .tastedev-pg-undo 파일을 fixture 정리 조건이 예상하지 못한 오류다. 별도 정리에서 정확한 전용 marker·sole remaining files·undo 원문·inode·파일 종류/권한과 테스트 데이터 디렉터리 삭제를 확인하고, undo 및 private helper 백업 전체를 증거 archive로 보존한 뒤 해당 disposable 잔여 파일·stage만 삭제했다. 최초 FAIL을 전체 PASS로 바꾸지 않았다. fixture는 다음 실행부터 이미 검증한 undo 원문/신원을 기록해 해당 파일만 정리하도록 수정했다. 정리 코드 변경 이후 같은 성공 기능 검사는 재실행하지 않았다.

증거: .runtime/verification/remote-postgresql-host-jail-20261008T065416Z/{result.json,cleanup-followup.json,retained-test-evidence.tar.gz}. 앞선 실패 실행 064803Z/064942Z/065126Z 결과도 보존한다. 기존 설치 helper·운영 클러스터는 변경하지 않았으며 DEB 생성/검증을 실행하지 않았다.

원래 GUI/인증 API에서 전체 postgresql.conf 코드 적용·복원과 전체 코드 실패/중단 복구는 추가 수용 검사로 남는다. HBA GUI 적용·복원 증거와 구분한다.
