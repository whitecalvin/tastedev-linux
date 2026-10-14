# Redis 실제 설정 적용·복구 확인 (2026-10-07)

한국어 기능 완성을 우선한다. `scripts/verification/redis-local-lifecycle.mjs`로 현재 `applyRedisConfig`, 후보 설정 생성 및 설정 트랜잭션을 Redis 8.0.5 실제 실행 파일과 함께 검사했다.

현재 계정이 소유한 임시 데이터 디렉터리와 Unix 소켓만 사용한다. TCP 포트는 0으로 비활성화하며 운영 systemd/Redis 서비스/사용자 데이터는 변경하지 않는다. 검수용 후보 서버는 별도 임시 데이터 디렉터리에서 시작하고 AOF·스냅샷 저장을 끈다. 운영 역할의 fixture 서버만 자체 AOF를 사용한다. native 옵션 덮어쓰기를 사용하는 개발 fixture이므로 helper의 namespace 격리 검수를 증명하지 않는다.

5개 검사 모두 통과했다.

- 자체 Unix 소켓 접속과 한글 Redis 값 저장·조회.
- 실제 후보 서버 시작 검수 후 maxclients 100→123 적용·재시작과 AOF 한글 값 유지.
- 생성된 설정 파일 백업의 전체 파일 복원 후 maxclients 100 확인.
- Redis가 거부하는 잘못된 설정을 파일 교체·재시작 전에 차단.
- 실제 Redis 시작 실패 후 이전 설정 원복·서비스 fixture 재기동 및 AOF 한글 값 유지.

증거: `.runtime/verification/redis-native-lifecycle-20261007/result.json`. 바이너리 SHA-256·실제 버전·재시작 횟수·정리 결과를 기록했다. 모든 자체 서버 종료와 임시 데이터 정리를 확인했다.

남은 범위: 설치 계정의 권한 helper 및 namespace 격리 검수, 실제 GUI→API→helper 적용·실패·복구 전체 연동. 이번 확인은 설정 파일 백업/복원과 재시작 시 기존 AOF 유지에 한정하며 별도 DB 내용 백업 기능을 완료했다는 의미가 아니다. 최종 배포 검증은 실행하지 않았다.
