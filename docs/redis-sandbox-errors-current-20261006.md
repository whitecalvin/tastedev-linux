# Redis 검수 환경 실패 구분

2026-10-06. 단독 실제 namespace 프로브는 `.runtime/verification/redis-sandbox-native-2026-10-06T01-38-05.956Z.json`에서 성공했다. private PID/network namespace, 읽기 전용 후보 mount, runtime 쓰기, 메모리·파일 크기·FD·core 제한을 확인했다. Redis 실행 파일은 호스트에 없으므로 실제 Redis 기동 검수 성공을 뜻하지 않는다. 기존 중첩 namespace 기동 검사의 BLOCKED 기록은 유지한다.

검수 환경 자체를 실행할 수 없을 때 설정 오류와 구분된 공개 안내와 status 503/REDIS_SANDBOX_UNAVAILABLE을 전달한다. 기존 helper transport가 이 오류까지 NOPASSWD 권한 실패(403)로 포장하던 것도, 등록된 Redis 검수/적용/복원 5개 작업의 정확히 일치하는 공개 stderr 메시지에 한해 구분했다. 다른 stderr·작업·무결성 실패를 이 환경 오류로 바꾸지 않는다. 원시 stderr/경로는 새 공개 안내에 포함하지 않는다.

격리 프로브가 실패하면 Redis 프로세스를 시작하지 않고 임시 runtime/후보를 정리한다. 정리 실패는 기존 500과 자료 보존 절차가 우선한다. namespace, mount, 자원 제한과 executable 검사는 완화하지 않았다. 새 안내는 기존 11개 외국어 카탈로그 모두에 번역했다(현재 1453개 문구).

관련 회귀 및 기존 helper 입력 거부 검사 총 28개 고유 검사 성공. 증거: `.runtime/verification/redis-sandbox-errors-20261006/result.json`. 실제 HTTP→설치 helper 전달 및 운영 Redis 기동/검수/적용은 이 검사에 포함하지 않는다. 호스트 패키지 설치·서비스·sudo·배포 검사는 수행하지 않았다.
