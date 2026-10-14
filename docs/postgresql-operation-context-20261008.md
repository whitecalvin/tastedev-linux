# PostgreSQL 코드 적용·복원·중단 복구의 요청 대상 보호

2026-10-08 한국어 우선 개발 후속.

`postgresql-code-operation.jsx`, `postgresql-restore.jsx`, `postgresql-code-recovery.jsx`에서 이전 렌더의 요청 핸들러가 파일·백업·연결·권한 전환 또는 unmount 뒤 transport를 시작하지 못하도록 수정했다. 전환 첫 렌더부터 이전 검토·확인·결과·오류를 숨긴다. 체크박스/복구 확인과 취소 핸들러에도 같은 대상 검사를 적용했다. 백업 자동 조회는 Strict Mode의 effect 재실행에서 정리된 첫 조회 응답이 추가 graph 검토를 시작하지 않도록 취소 상태를 확인한다.

## 증거

- 세 수정 컴포넌트와 HBA 적용 컴포넌트의 29개 검사 통과, 실패/skip 0개. Next SWC로 실제 JSX를 변환하고 파일/API/정책/백업/비활성/수명 전환 전후의 핸들러를 호출했다. 첫 렌더에서 이전 확인이 숨겨짐과 요청 무생성, 정상 검토/최종 확인/중복 방지/늦은 응답 무시/갱신 실패 결과 보존을 검사했다.
- Strict Mode effect 재실행에서 첫 조회의 응답은 graph 검토를 시작하지 않고 두 번째 조회만 정상 검토를 진행했다.
- 현재 384개 소스의 Next.js production compilation PASS, 빌드 중 소스 변경 없음: `.runtime/verification/source-build-2026-10-08T03-40-35.067Z/result.json`.
- 첫 빌드는 `/tmp` quota 오류로 종료됐다. 자신이 만든 이전·실패 빌드 복사본 2개의 source-snapshot과 build.log(존재하는 경우)를 보존하고 정리한 후 재시도했다: `.runtime/verification/owned-build-cleanup-20261008T033952Z/result.json`. 사용자 개발 서버는 종료하지 않았다.

API/서비스는 컴포넌트 검사 fixture 응답이다. 이 결과는 실제 브라우저→helper→systemd 전체 적용·복원 수용을 증명하지 않는다. 운영 DB/설정/서비스와 권한은 변경하지 않았다.
