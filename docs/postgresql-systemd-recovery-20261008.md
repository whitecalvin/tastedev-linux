# PostgreSQL 실제 systemd 중단·원복 후속 (2026-10-08)

승인된 103번 disposable PostgreSQL 18/linuxverify20261008만 사용했다. 운영 DB와 설치 helper는 변경하지 않았다.

첫 실행은 기존 helper/systemd 11개 검사와 새 실패 원복 검사까지 성공했다. 첫 reload hook 실패를 의도적으로 주입한 뒤 coordinator가 원본을 복원하고 실제 systemctl reload를 수행했으며, pg_conf_load_time 변경과 journal 삭제를 확인했다. 시스템 자체 reload 실패를 자연 발생시킨 증거는 아니며 주입 실패와 실제 복구 동작을 구분한다. 그 뒤 중단 상태 조회에 검수 스크립트가 문자열 인자를 넘겨 실패했다. 최초 실패 결과를 보존했고 전용 서비스·클러스터·stage는 정리됐다.

인자를 {path}로 고친 후 이미 성공한 helper/원복 게이트를 건너뛰는 --interruption-only로 재개했다. 실제 클러스터 신원/TCP 비활성 확인 후 파일 교체·journal 기록 직후 apply 자식을 SIGKILL했다. PostgreSQL postmaster는 종료하지 않았다. 중단 상태를 확인하고 새로운 계획의 409 차단, 명시 복구의 원본 일치·실제 systemd reload·pg_conf_load_time 변경·journal 삭제·한글 데이터 보존을 확인했다. 이 실행 2개 검사 성공 후 서비스/클러스터/stage 정리 완료.

증거:
- .runtime/verification/remote-postgresql-host-jail-20261008T064501Z/result.json: 초기 12개 성공 후 검수 인자 오류로 전체 FAIL.
- .runtime/verification/remote-postgresql-host-jail-20261008T064557Z/result.json: 중단 복구 재개 PASS.
- 같은 폴더 scope-audit.json: 최초 결과 요약의 canonicalHelperTested/reloadFailureInjected 플래그는 skip 모드 반영 전 값이다. 원본은 보존하고 실제 checks의 2개 범위만 성공으로 계산했다. 해당 요약 플래그는 현재 스크립트에서 수정했다.

원래 GUI 정상 적용·백업 복원 증거는 postgresql-original-gui-20261008.md에 별도로 있다. 이번 실패/중단은 native coordinator와 실제 systemd를 연결한 검사이며 GUI/인증 API/canonical helper의 실패 경로 전체 연결로 확대 해석하지 않는다. 전체 PostgreSQL 코드 그래프 재시작·기타 제품 수용·최종 배포는 여전히 별도다.
