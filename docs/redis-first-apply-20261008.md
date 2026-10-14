# Redis 첫 적용 백업 경로 준비 — 2026-10-08

현재 canonical helper의 redis-code-apply와 redis-config-apply는 configTransaction에 /var/lib/linux/admin/redis를 넘겼지만 폴더 생성 경로가 없었다. configTransaction은 기존 안전한 백업 폴더를 요구하므로 첫 적용은 ENOENT로 실패한다. 실제 임시 파일/백업 경로의 transaction 검사에서 원본 교체 및 활성화 전 실패를 확인했다.

helper redisBackupRoot가 검증된 BASE 아래 redis 폴더를 0700으로 생성한 뒤 root 소유·심볼릭 링크 아님·다른 계정 접근 없음 조건을 확인한다. 기존 잘못된 권한이나 소유권은 변경하지 않고 거부한다. 코드/GUI 항목 두 적용 dispatch가 모두 해당 경로를 사용한다. 거부 오류에는 한국어 안내를 연결했다.

실제 helper 소스를 VM에서 실행한 dispatch 검사, 신규 폴더·기존 내용 보존·공개755/링크/소유자 거부, 실제 configTransaction 원본 백업/파일600 생성 및 기존 Redis 검수·적용·실패 원복·include 충돌·오류 envelope 회귀 35개 통과. root 소유권 메타데이터는 명시적인 fixture이며 원격 root helper 실제 서비스 적용을 증명하지 않는다. fixture 임시 파일은 정리했다.

한국어 전체 runtime 검사에는 이미 143개를 순회하면서 종료 시 141개라고 고정한 오래된 assertion이 있었다. 현재 전체 목록 순회는 유지하고 최소 범위 및 중복 없음 검사로 수정했다. 중간 실패와 최종 통과를 구분하여 기록했다.

증거 `.runtime/verification/redis-first-apply-20261008/result.json`. GUI→인증 API→현재 helper→실제 전용 systemd Redis 정상 적용/복원은 아직 남는다. 현재 서비스 식별기는 Redis가 프로세스 제목을 변경한 경우 startup main을 증명하지 못하여 거부하므로 실제 환경에서 확인할 다음 항목이다. 기존 후보 검수/사설 lifecycle 증거를 최신 전체 서비스 완료로 확대하지 않는다.
