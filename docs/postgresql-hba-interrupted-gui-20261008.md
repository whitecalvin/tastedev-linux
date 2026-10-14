# 중단 작업 GUI 복구와 완료 후 경고 제거

검수 전용 PostgreSQL 18.6 클러스터에서 실제 HBA 적용 자식을 파일 교체 후 SIGKILL했다. 현재 제품 coordinator가 남긴 실제 journal과 백업을 GUI가 읽어 새 적용을 막고 명시 복구 확인을 요구했다. 브라우저에서 확인 후 원본 복원·native parser·실제 pg_ctl reload 수락·한글 데이터 보존·journal 제거·recovered 감사 기록을 확인했다.

첫 실행에서 복구 완료 뒤에도 중단 경고가 남는 제품 화면 오류를 발견했다. native 복구 기록: `.runtime/verification/postgresql-hba-native-gui-2026-10-08T04-50-48.471Z/result.json`. 이 기록의 staleRecoveryWarning=true는 화면 미완료를 의미하며 전체 GUI 완료 증거로 사용하지 않는다.

컴포넌트를 수정해 recovered=true, failed 아님, recoveryRequired=false, journalCleanupVerified=true가 모두 확인된 경우에만 오래된 중단 경고와 복구 버튼을 숨긴다. 기록 삭제 미확인/실패는 경고를 유지한다. 기존 완료 상태는 표시한다.

컴포넌트·실제 SIGKILL journal 회귀 19개 통과: `.runtime/verification/postgresql-hba-interrupted-component-20261008.json`. 수정 후 실제 GUI→인증 API→native coordinator→전용 DB 복구 전체 경로 확인: `.runtime/verification/postgresql-hba-native-gui-2026-10-08T04-51-54.847Z/result.json`. 새 적용 검토/commit 없음, 복구 commit 및 감사 각각 1회, 오래된 경고 제거 확인. SHA `a958505be031e4866dc68ef333a9a66f9c02fbe30cf68927e10a6572477cb199`.

두 실행 모두 자체 DB·서버 종료 및 임시 인증/작업 폴더·탭 정리. 기존 DB·서비스·설정과 배포 패키지 무변경. privileged helper 전송·서비스 식별·candidate 실행은 명시적인 fixture adapter, reload는 pg_ctl이다. 설치 helper/systemd 및 원래 IDE에서 팝업 진입 전체 흐름은 별도 남는다. SWC 컴포넌트 검사와 현재 소스 Next 개발 서버 GUI로 검증했으며 이번 변경 후 전체 운영 빌드는 재실행하지 않았다.

수정 후 화면: `/tmp/tastedev-postgresql-hba-interrupted-fixed-20261008.png`.
