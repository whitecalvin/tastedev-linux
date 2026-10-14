# 지정 장비의 제한된 namespace 프로필 검사 (2026-10-06)

Docker 공식 seccomp 문서와 연결된 moby/profiles의 기본 allowlist를 확인했다. 프로필은 기본 SCMP_ACT_ERRNO를 유지하고 `unshare`의 arg0가 정확히 CLONE_NEWUSER(268435456)인 경우에만 추가 허용했다. 공식 원본 SHA-256 `6416b47770785a41ac59073cdc77d9fe98517df2799dc83ef207e622de3053f6`를 고정하고 재조회가 다르면 실행을 차단한다. 수정 프로필 SHA-256 `0ea010570dd83fa95dd1ee3ed9e95a0e8f3f91f93843b721569404321f406622`.

공식 PostgreSQL 18.6 이미지의 임시 컨테이너, 읽기 전용 filesystem·network none·호스트 mount/port 없음, cap-drop ALL과 SETUID/SETGID만 사용했다. AppArmor docker-default(enforce)를 유지했다.

1. root 및 SETUID/SETGID만: unshare syscall 자체의 거부는 해소됐으나 uid_map 쓰기가 EPERM. 증거 `.runtime/verification/remote-namespace-policy-20261006T020816Z/result.json` BLOCKED.
2. 같은 프로필의 postgres UID999: namespace 생성과 UID map `0 999 1`, id UID0 성공. 증거 `.runtime/verification/remote-namespace-policy-20261006T020845Z/result.json` PASS.
3. root 및 SETFCAP capability 하나 추가: namespace 생성과 UID map `0 0 1`, id UID0 성공. 증거 `.runtime/verification/remote-namespace-policy-20261006T020933Z/result.json` PASS.

세 실행 모두 컨테이너 inspect 실패로 제거를 확인했고 프로필 임시 폴더도 정리했다. 호스트 보안·sudo·서비스·DB를 변경하지 않았고 privileged/unconfined/SYS_ADMIN을 사용하지 않았다. 후속 재현 도구 `scripts/verification/remote-namespace-preflight.py`, 선택적 `--root`.

이 증거는 단일 user namespace/UID mapping이다. 실제 helper가 요구하는 bwrap의 mount/network/PID 격리, 전용 검수 UID/GID, 자식 user namespace 차단, 바이너리 소유권, 전체 설정 적용/실패/복구는 아직 확인되지 않았다. 전체 helper 또는 설치 수용 검사 PASS로 확대하지 않는다.

출처: https://docs.docker.com/engine/security/seccomp/ 및 https://github.com/moby/profiles/blob/main/seccomp/default.json .
