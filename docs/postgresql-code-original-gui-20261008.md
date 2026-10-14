# PostgreSQL 전체 코드 원래 GUI 검수 · 2026-10-08

사용자의 추가 전송·GUI 검수 승인 범위에서 103번의 일회용 `18/linuxverify20261008`만 변경했다. 원래 Next 화면·Better Auth 인증 API·현재 canonical helper·실제 systemd 연결을 확인했다.

- 코드 보기에서 `work_mem = '8MB'` 편집 → 격리 검수 → 확인 → 적용 완료. 실제 SQL `SHOW work_mem`은 `8MB`였다.
- 원래 GUI 백업 선택 → 복원 격리 검수 → 확인 → 복원 및 재시작 → 백업 복원 완료. 실제 SQL은 `4MB`, 원본 파일 SHA-256은 `4baec07bb611b9a8af0a677969907d81cc264e1edecc11d2dc587c81b8b490da`로 완전히 복원됐다.
- 첫 복원 검토에서 Strict Mode 중복 metadata 조회가 helper 잠금 충돌을 일으켰다. 동일 화면 scope의 초기 Promise를 공유하고, 선택/계정정책/API 변경의 기존 응답 폐기 검사를 유지했다.
- 다음 단계에서 legacy metadata 조회의 `/etc/postgresql` root 소유 제한을 발견했다. Debian의 postgres 소유 상위 폴더도 허용하며, root 또는 조회한 postgres UID만 허용하고 symlink/그룹·전체 쓰기 권한 차단을 유지했다.
- 관련 회귀 21개 성공. 변경한 컴포넌트와 helper만 승인된 임시 GUI에 추가 전송한 후 실패했던 복원 단계부터 재개했다. 최초 실패 로그는 보존했다.
- 임시 GUI·서비스·클러스터·private stage·자체 SSH 포워드·테스트 자격증명·자체 브라우저 탭 정리 완료. 기존 설치 helper는 교체하지 않았다.

증거: `.runtime/verification/postgresql-code-original-gui-20261008/result.json`, `native-result.json`, `cleanup.json`, `applied.png`, `restored.png`, `test-state-evidence.tar.gz`. archive에는 일회용 설정 백업/감사 로그만 포함하며 auth DB·로그인 키는 포함하지 않는다. 수정 회귀는 `.runtime/verification/postgresql-code-gui-fixes-20261008.log`.

최초 검수는 변경 없음으로 종료되어 적용하지 않았다. 소스 읽기가 끝난 뒤 편집값을 확인하고 다시 검수한 변경본만 적용했다. 이는 실제 변경 전 없는 계획을 실행하지 않는 차단의 확인이며 입력 동기화 전체 검수로 확대하지 않는다.

전체 제품 완료는 아니다. 전체 코드 실패/중단 복구의 원래 GUI/API 연결, Certbot 발급·갱신 및 nginx 연계, 다른 패키지의 설치 서비스 수용은 남는다. 최종 배포 작업은 수행하지 않았다.


## 후속 경로 권한 경계 검수

`/etc/postgresql`, 버전 폴더, 클러스터 폴더 각각을 그룹 쓰기 가능·다른 UID 소유·심볼릭 링크로 만든 9가지 fixture에서 적용을 차단했다. 원본 내용 보존 및 계정 UID 조회 이외의 PostgreSQL 검수/서비스 명령 미실행도 확인했다. `tests/postgresql-helper.test.mjs`에 회귀를 추가했다. 관련 22개 검사 성공, `.runtime/verification/postgresql-directory-boundary-20261008.log`. 앞선 21개와 중복하므로 합산하지 않는다.

수정된 복원 GUI를 포함한 현재 384개 소스의 운영 빌드 성공: `.runtime/verification/source-build-2026-10-08T07-12-04.902Z/result.json`. helper는 해당 Next 빌드에 포함되지 않으며 별도의 native GUI/권한 회귀 증거로 판단한다.

동일 빌드의 HTTP 검사 15개 그룹 성공: `.runtime/verification/production-http-2026-10-08T07-12-26.924Z/result.json`. 보호 라우트·세션 재시작/만료·SSR 데몬·실제 PTY 한글/이모지 확인. Certbot은 미리보기만 검증하여 실제 ACME 수용으로 확대하지 않았다. 빌드 manifest/로그를 증거 디렉터리에 보존하고 이번 임시 빌드 폴더를 제거했다.
