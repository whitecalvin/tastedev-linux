# PostgreSQL 실제 서비스 경로 식별

2026-10-08. 사용자의 103번 호스트 PID 공간 및 /proc 읽기 전용 검수 승인을 확인했다. 중첩 구문 검수의 procfs 문제는 이전 전용 PID namespace 검사로 해결되어 같은 실패 조건을 반복하지 않았다.

현재 서비스 읽기 전용 검사를 실행한 결과, systemctl 조회 후 PostgreSQL 데이터 경로의 상위 폴더 검사에서 거부됐다. 정확한 첫 경로는 `/media/whitecalvin/data`다. 이 경로는 root 또는 PostgreSQL 실행 계정 소유가 아니므로 현재 신뢰 정책을 만족하지 않는다. PID 공간 승인은 디렉터리 신뢰 조건을 바꾸지 않는다.

`lib/postgresql-hba-service.mjs`는 이 경우 일반적인 클러스터 확인 오류 대신 거부된 경로와 소유권·쓰기 권한 조건을 한국어로 표시한다. 다른 계정 소유, root 디렉터리의 그룹/전체 쓰기, 심볼릭 링크 거부는 유지한다. PostgreSQL 계정 및 그룹 소유의 2775 소켓 폴더는 기존대로 허용한다. 실제 소유권·권한 변경은 수행하지 않았다.

- 실제 Node 서비스 검사: 4개 통과.
- 103번 현재 소스 검사: `.runtime/verification/remote-postgresql-host-jail-20261008T035710Z/result.json`.
- 실제 서비스 식별 결과: FAIL, HTTP 상태 409. 읽기 전용 SQL 실행 전 거부.
- 호스트 PID·프로세스 메타데이터 읽기 사용. 설정 적용, reload, restart, 설치 helper 교체 없음. 전송 임시 폴더 삭제 확인.
- 기존 임시 클러스터 native 적용/복구 성공 증거는 유지하며, 실제 설치 서비스 또는 전체 시스템 완료로 확대하지 않는다.

## 오류 전달과 재검토 후속

HBA 검토가 실패한 뒤 같은 화면에서 다시 검토할 수 없던 상태를 보완했다. 한국어 오류 옆에 테두리 없는 재검토 아이콘을 추가했다. 재검토는 중단 기록부터 다시 조회하고 새 검토를 생성한다. 실패한 검토로 적용 버튼을 표시하지 않으며, 결과가 이미 존재하거나 중단 복구가 필요한 경우 별도의 재검토 버튼을 표시하지 않는다. 이전 파일·권한·종료된 화면의 콜백과 중복 클릭을 차단한다.

현재 JSX를 SWC로 실행한 HBA 화면, 서비스 경로, helper 오류 규약 검사 19개가 통과했다. 이 검사는 실제 브라우저 검사와 구분한다.

실제 Better Auth 로그인 및 로컬 HTTP API 검사 4개 그룹이 통과했다. 현재 helper의 오류 직렬화와 UTF-8 분할 수신을 사용해 한국어 경로 설명·409 상태 유지, 읽기 전용 정책의 transport 이전 차단, 민감한 경로 없는 실패 감사 기록을 확인했다. OS 메타데이터와 privileged transport는 명시적 fixture이며 운영 DB/helper 실행을 증명하지 않는다. 증거: `.runtime/verification/postgresql-service-diagnostic-api-2026-10-08T03-59-55.216Z.json`. 자체 인증 저장소와 HTTP 서버는 정리했다.

현재 384개 소스의 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-08T04-01-27.942Z/result.json`. 빌드 중 소스 변경 없음. 최초 시도는 자체 임시 폴더의 저장 할당량 오류(-122)로 실패했다. 이전 자체 빌드 및 실패 폴더의 스냅샷·로그를 보존하고 그 폴더들만 삭제한 뒤 재실행했다. 실패/정리 기록: `.runtime/verification/owned-build-cleanup-20261008T040111Z/result.json`. 사용자 개발 서버는 중지하지 않았다.

DEB 검증은 수행하지 않았다.

## 실제 브라우저 재검토 검사

현재 HBA 컴포넌트를 별도 임시 Next.js 서버에서 실제 브라우저로 확인했다. 한국어 경로 오류 표시, 재검토 후 새 계획 생성, 확인 팝업의 대상 전환 시 폐기, 새 대상에 한 번만 확인된 요청, 조회 전용 전환 후 검토 차단의 5개 항목을 확인했다. React Strict Mode의 초기 중단 기록 조회 두 번 중 검토 요청은 한 번이었다. 명시적인 fixture 응답이며 실제 DB 적용은 수행하지 않았다.

증거: `.runtime/verification/postgresql-operation-gui-2026-10-08T04-02-45.994Z/result.json`. 4개 실제 컴포넌트의 원본/복사본 해시 일치 확인, 서버 종료 및 자체 임시 폴더 삭제 완료. 화면: `/tmp/tastedev-hba-retry-gui-20261008.jpg`.
