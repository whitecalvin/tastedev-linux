# 접속 규칙 적용·복구 팝업의 대상 전환 보호

2026-10-08 한국어 우선 개발 후속.

## 수정한 문제

`components/postgresql-hba-operation.jsx`는 비동기 응답의 대상 변경을 확인했으나 이전 렌더에서 만들어진 적용/복구 확인 핸들러의 요청 시작은 막지 않았다. 입력 파일, API 연결, 보안 설정과 팝업 수명을 검토 범위에 연결했다. 범위가 바뀐 첫 렌더부터 이전 계획·확인·결과·오류를 숨기고, 이전 핸들러는 transport를 호출하기 전에 거부한다. 권한이 없어 검토를 시작할 수 없는 경우 한국어 이유를 표시한다.

## 검증

- 실제 컴포넌트를 Next SWC로 변환한 검사에서 파일 변경, API 교체, 정책 버전 변경, 조회 전용 전환, unmount 뒤 이전 적용 콜백이 요청을 보내지 않음을 확인했다.
- 이전 파일의 중단 작업 복구 콜백도 새 대상에 전달되지 않는다. 변경 후 이전 확인 화면이 즉시 숨겨지는 것을 확인했다.
- 최종 확인, 중복 적용 방지, 늦은 응답/갱신 실패 처리와 기존 transaction의 적용·백업 복원·실패 복구·충돌/원본 보존 검사 포함 14개 통과. 명령: Node 24.21.0 `--test --test-isolation=none`으로 postgresql-hba-operation-component, postgresql-hba-operation, package-config-ide-render를 실행했다.
- 첫 로컬 시도는 샌드박스의 `/`와 `/tmp` 소유자가 65534로 표시되어 transaction 안전한 경로 검사 5개가 실패했다. 자체 `/tmp` fixture만 사용하는 같은 검사를 실제 호스트 소유권 환경에서 재실행해 통과했다. 제품의 소유권 검사 조건은 완화하지 않았다.
- 새 컴포넌트 검사 첫 시도는 전체 API 요청 수에 새 파일 검토의 정상 비동기 요청까지 포함해 실패했다. 새 검토 시작을 기다린 뒤 이전 콜백의 요청 여부를 판단하도록 검사 시점을 수정했다.
- 현재 384개 소스 Next.js production compilation PASS, sourceChangedDuringBuild=[]: `.runtime/verification/source-build-2026-10-08T03-36-00.926Z/result.json`.

실제 브라우저와 실제 helper를 함께 사용하는 적용·복원 전체 흐름은 이 검사에 포함되지 않는다. 103번 운영 서비스/DB/설정과 OS 권한은 변경하지 않았다. 시스템 서비스 hook의 실제 수용은 남는다.
