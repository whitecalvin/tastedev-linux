# Redis native 기동 검수 시도 — 2026-10-06

상태: **BLOCKED**. Redis 설정 검수 또는 적용 성공이 아니다.

새 검증 명령: `npm run verify:redis:startup:isolated -- /absolute/path/to/redis-server`

현재 증거: `.runtime/verification/redis-startup-isolated-2026-10-05T20-29-46.313Z/result.json`

## 확보한 실제 상태

호스트 `/usr/bin/redis-server` 없음. 기존 Docker Desktop socket 없음. 따라서 Ubuntu resolute 공식 APT registry의 redis-tools/redis-server 5:8.0.5-1을 `/tmp/tastedev-redis-native-assets`에 다운로드하고 내용만 추출했다. 호스트에 설치하지 않았으며 서비스도 변경하지 않았다. apt metadata SHA-256과 다운로드 파일 bytes를 비교했다.

- redis-tools SHA-256: `2f048152958913c7f7c3d697c82d2a6325f059a46e85deb13719dde45eb6be8f`
- redis-server SHA-256: `796bf2bb1a9571d4e6c8bda81ece2ceb695c11e02f0b2fcd1761aa285f181e86`
- `redis-server --version` 출력: Redis 8.0.5, jemalloc 5.3.0.
- native binary SHA-256은 증거에 기록했다.

## 검증 도구

외부 user/pid/network namespace의 임시 rootfs에 binary와 설정 fixture를 배치한다. production redisCodeOperationPlan 및 validateRedisSandboxCandidate의 검수 경로를 호출한다. trusted 실행 adapter는 동일 프로브 명령의 stderr 수집에만 사용한다.

예정된 검사는 정상 기동/PING, 잘못된 directive 거부, 인증 후보 NOAUTH readiness, 원본 버전 충돌, private runtime 정리다. 이 검사들은 아직 통과하지 않았다.

실패 지점은 내부 bwrap namespace 프로브이며 커널의 중첩 user namespace 거부 메시지를 받았다. 보안 제한은 변경하지 않았다. 실패를 result.json에 BLOCKED로 기록하고 종료 코드 1을 유지한다. 일반 시스템 서비스 또는 중첩 namespace가 허용된 검증 장비에서 재개해야 한다.

전체 목표는 계속 진행 가능하다. 이 제약은 Redis native 검증 분기에만 해당한다.
