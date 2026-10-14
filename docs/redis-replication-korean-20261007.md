# Redis 복제·클러스터 한국어 설정 설명

사용자 지시에 따라 한국어 기능·화면을 먼저 완성하며 다국어 추가 작업은 보류한다.

Redis 8.0.5 [공식 설정](https://raw.githubusercontent.com/redis/redis/8.0.5/redis.conf)과 [이름·별칭 등록](https://raw.githubusercontent.com/redis/redis/8.0.5/src/config.c)을 대조했다. 복제·클러스터의 공개 이름 46개와 이전 별칭 13개의 한국어 설명을 추가하여 전체 설명은 49개에서 108개가 되었다. Sentinel 승격과 노출, 복제 버퍼의 0 값, 초/밀리초 환산, 내부 버스와 외부 접속 주소, 자동/수동 장애 전환을 구분한다. 설정 형식 자체를 검증하거나 설치 서버 지원 여부를 보장하는 설명은 아니다.

관련 개발 검사 14개와 현재 383개 소스 빌드가 통과했다. 실제 격리 한국어 GUI에서 설명으로 검색, 이전 이름 설명, 비밀번호 가림, 여러 인수 편집·코드 동기화, 나머지 원문 보존, 외부 스크롤 없음, 로그아웃을 확인했다. 모든 GUI 확인은 read-only fixture이며 운영 Redis·원본 설정을 수정하지 않았다. 자체 계정·탭·서버는 정리했다.

증거: `.runtime/verification/redis-replication-korean-20261007/result.json`, `.runtime/verification/package-editor-gui-2026-10-06T20-24-56.995Z/result.json`.

남은 범위는 나머지 Redis 옵션 설명·실제 클러스터/복제 흐름·설치 운영 적용이다. 내부 옵션 cluster-ping-interval은 이번 공개 설정 설명 범위와 신규 제안에 포함하지 않는다. 전체 제품 완료나 최종 배포 검증을 주장하지 않는다.
