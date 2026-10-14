# PostgreSQL 설정 설명 정정 — 2026-10-06

실제 개발 GUI에서 PostgreSQL 18/main/postgresql.conf의 351개 항목과 한국어 설명을 읽고 프랑스어로 전환했다. 두 언어의 synchronous_commit 설명이 동기화 수준을 격리 수준으로 잘못 설명하고 있었다. upstream PO를 그대로 사용하는 것은 번역 정확성 증거가 아님을 확인했다.

공식 PostgreSQL 18 문서에 따라 로컬 override를 정정했다. 원본 PO import 데이터는 유지하여 재수집 시에도 override가 보존된다.

- synchronous_commit: 한국어·프랑스어. 커밋 성공 응답 전 WAL 처리 대기와 local/on/remote_write/remote_apply/off 차이를 설명한다.
- shared_memory_type: 한국어. 주 공유 메모리 구현이며 dynamic_shared_memory_type과 구분한다.
- extra_float_digits: 한국어. 1 이상 shortest-precise 출력과 0/음수의 반올림 정밀도 차이를 설명한다. 기존 오타와 번역자 메모를 제거한다.
- vacuum_max_eager_freeze_failure_rate: 한국어. all-frozen 표시 실패 페이지 비율과 기본 3%, 0 비활성, 성공 동결에 별도로 적용되는 내부 20% 한도를 설명한다.

근거:
- https://www.postgresql.org/docs/18/runtime-config-wal.html#GUC-SYNCHRONOUS-COMMIT
- https://www.postgresql.org/docs/18/runtime-config-resource.html#GUC-SHARED-MEMORY-TYPE
- https://www.postgresql.org/docs/18/runtime-config-client.html#GUC-EXTRA-FLOAT-DIGITS
- https://www.postgresql.org/docs/18/runtime-config-vacuum.html#GUC-VACUUM-MAX-EAGER-FREEZE-FAILURE-RATE

관련 10개 검사 통과(설명 언어 coverage, 지역 로캘, GUI 연결, HBA 설명, 초안 편집). 실제 GUI에서 수정된 한국어·프랑스어 synchronous_commit 설명을 확인했다. 언어 전환 후 파일 선택·검색·설정값 on이 유지됨을 확인했다. 설정값 변경·파일 저장·운영 적용은 수행하지 않았다.

증거: /tmp/tastedev-postgresql-description-correction-20261006.png, /tmp/tastedev-postgresql-french-help-20261006.png. 마지막에 원래 ko-KR 언어를 복원하고 점검 탭을 닫았다.

이 검사는 17개 언어 전체 설명의 의미 정확성이나 모든 Linux 언어 UI 번역을 입증하지 않는다. 실제 OS 권한 때문에 pg_hba.conf 조회가 거부되어 HBA 실파일 GUI 전환은 확인하지 않았다.
