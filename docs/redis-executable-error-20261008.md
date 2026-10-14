# Redis 실행 파일 오류 구분

Redis native 검수의 실행 파일 소유권·권한 오류가 HTTP 409라는 이유만으로 코드 기준 파일/include 변경으로 표시되던 분기를 수정했다. 실행 파일 검사에 `VALIDATION_EXECUTABLE_UNTRUSTED` 코드를 부여하고 후보 검수와 코드 검토에서 그 원인을 보존한다. 사용자 안내는 `Redis 검수 실행 파일의 경로·소유권·권한을 확인하세요.`다.

원본 버전 충돌은 기존 설명을 유지한다. namespace 불가 503과 임시 runtime 정리 실패 500도 유지하며, 실행 파일 오류 코드가 붙어도 정리 실패를 낮은 상태로 바꾸지 않는다. 원시 native 출력은 사용자에게 전달하지 않는다.

실제 임시 실행 파일의 잘못된 권한을 사용한 후보 검수에서 프로세스 시작 없이 거부, 원본 및 백업 보존, 후보와 validation runtime 삭제를 확인했다. Redis 코드/파일/native 후보/격리 환경 오류 및 PostgreSQL 서비스 회귀 검사 15개 통과.

최신 런타임의 103번 canonical helper 및 lock supervisor native 5개 회귀 검사 통과: `.runtime/verification/remote-postgresql-host-jail-20261008T041920Z/result.json`. Redis 7.0.15 임시 namespace 검사이며 운영 적용/systemd 전체 수용은 아니다. 설치 helper 및 서비스·설정·패키지 무변경, 전송 임시 폴더 삭제 확인.

현재 코드 검토에서 실제 임시 파일 권한 오류를 생성하여 현재 helper 직렬화, UTF-8 분할 전달, 실제 Better Auth 인증 HTTP API의 한국어 409 응답·읽기 전용 차단·감사 기록 제한을 4개 그룹으로 확인했다: `.runtime/verification/redis-executable-diagnostic-api-2026-10-08T04-20-08.056Z.json`. privileged transport는 명시적인 adapter이며 브라우저/운영 DB 검수와 구분한다. 자체 인증 저장소와 HTTP 서버는 정리했다. 검사명 중 service/path 표현은 이전 공통 진단 도구의 이름이며 실제 검사 대상은 privateExecutablePermissionsTested에 표시된 Redis 실행 파일 신뢰 오류다.

이번 백엔드 변경을 포함한 현재 소스 384개의 Next.js 빌드와 동일 소스의 실제 HTTP 15개 그룹 검사 완료. 시작·종료 시 소스 SHA 일치 확인: `docs/current-production-http-20261008.md`. 최종 배포 패키지 검증은 수행하지 않았다.
