# Redis TLS 한국어 설명

Redis 8.0.5에 등록된 `tls-` 설정 20개 모두에 한국어 설명을 추가했다. 기존 한국어 설명 29개와 합쳐 49개이며 전체 Redis 설정 설명 완료를 의미하지 않는다.

인증서와 개인 키, 서버/클라이언트 접속 방향, CA, 클라이언트 인증 정책, 복제·클러스터 TLS, TLS 버전별 암호 설정, OpenSSL DH 차이, 세션 캐시의 한도·시간 단위를 구분한다. 기존 설정 행과 새 항목 입력에 공통 설명 함수를 사용하므로 설명 검색과 새 항목 도움말에도 반영된다.

근거: [Redis 8.0.5 기본 설정](https://raw.githubusercontent.com/redis/redis/8.0.5/redis.conf), [Redis 공식 TLS 설명](https://redis.io/docs/latest/operate/oss_and_stack/management/security/encryption/).

설명 카탈로그가 등록된 TLS 항목 20개와 일치하는지 및 인증 방향·버전·단위를 검사했다. 컴파일한 편집 컴포넌트의 새 비밀번호 항목 한국어 도움말과 입력 가림도 확인했다. 이번 설명 추가의 실제 GUI 검증과 TLS 서버 기동은 아직 수행하지 않았다. 호스트 인증서·키·서비스는 변경하지 않았다.
