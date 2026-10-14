# cron 종료 후 잠금 해제 — 2026-10-06

cron 저장/삭제 및 백업 복구가 동일한 `withCronLock`을 사용한다. `cron.flock` 파일의 열린 FD를 자식 flock에 전달해 OS 잠금을 획득하고 부모의 FD를 유지한다. 정상 반환/예외는 finally에서 FD를 닫는다. 프로세스 종료 시 커널이 FD와 잠금을 해제한다. lock inode는 삭제하지 않는다.

기존 `cron.lock`은 이전 버전 작업일 수 있어 자동 삭제하지 않고 409로 보존한다. 새 코드를 적용할 때 이전 서버 프로세스를 종료하고 재시작하는 배포 경계가 필요하다. 이전 버전과 동시 실행을 지원한다고 주장하지 않는다.

잠금 파일은 NOFOLLOW로 열며 사용자 소유의 단일 링크 일반 파일, 0600 범위를 검사한다. flock은 기존 배포 의존성 util-linux에 포함된다.

검증: 관련 회귀 34개 통과. 실제 잠금 보유 프로세스 SIGKILL 뒤 새 잠금 획득, 동시 변경 거부, 예외 후 해제, 동일 inode 재사용, symlink/hardlink/공개 파일 거부, legacy lock 보존을 확인했다.

일반 사용자 격리 native crontab 변경/복구 11개 재검사 증거: `.runtime/verification/cron-user-isolated-2026-10-05T20-23-16.574Z/result.json`.

전체 회귀 1006개 결과는 이 잠금 변경 이전 결과다. 이번 변경의 현재 증거는 위 관련 34개와 native 11개다. daemon 예약 실행, 호스트 권한 전환 또는 DEB 배포 검증은 수행하지 않았다.
