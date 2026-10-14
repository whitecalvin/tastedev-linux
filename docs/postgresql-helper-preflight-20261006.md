# 실제 PostgreSQL helper 격리 환경 제한 (2026-10-06)

기존 native DB/API 검사와 구분하여 패키지 helper의 PostgreSQL 계정·검수 계정 전환 조건을 확인했다. helper는 root 계정의 파일/실행 파일 소유권과 실행 중인 비root PostgreSQL의 실제 UID·프로세스·소켓을 검증한다. 이 검사를 fixture 성공 값으로 대체해서 실제 helper 통과라고 표시하지 않는다.

현재 bwrap 단일 user namespace는 실제 `/proc/self/uid_map`이 `0 1000 1`이다. 자식 프로세스의 다른 GID/UID 전환은 EINVAL이다. 현재 사용자에 할당된 subordinate UID/GID 범위가 있으나 `unshare --user --map-auto --map-root-user`는 `newuidmap: write to uid_map failed: Operation not permitted`로 실패했다. root 및 PostgreSQL·검수 계정을 함께 실행할 환경을 만들 수 없어 실제 helper 단계만 BLOCKED다. 계정 전환 syscall 검사까지 실행했고 DB/helper 실행에는 도달하지 않았다.

운영 사용자·sudo 설정·서비스는 변경하지 않았다. 사용자에게 별도 테스트 VM, 기존 Docker Desktop, 또는 환경 제공 시점을 확인 요청했다. 전체 개발 목표를 BLOCKED로 처리하지 않으며, 이전 실제 임시 DB 및 HTTP coordinator 증거도 그대로 유효하다. helper의 소유권·계정 검사를 낮추는 방식으로 우회하지 않는다.

실제 실행 결과는 `.runtime/verification/postgresql-helper-preflight-*.json`에 기록했다. 새 환경이 준비되기 전 같은 namespace 검사를 반복하지 않는다.
