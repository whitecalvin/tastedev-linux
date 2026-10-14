# PostgreSQL 적용 실패와 자동 복구 안내

HBA 적용 실패를 자동 원복하면 이전 화면은 복구 완료만 표시했다. 적용 성공으로 오해하지 않도록 `변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.`로 수정하고 role=alert로 표시한다. 정상 적용·명시 복구 성공의 role=status 및 부분 복구 실패 안내는 유지한다.

HBA 컴포넌트·coordinator 검사 16개 통과. 최초 제한 샌드박스 native 파일 검사 실패 후 실제 개발 계정으로 재실행해 전체 확인했다. 운영 DB 사용 없음.

현재 컴포넌트 GUI→검수용 proxy→인증 API→실제 coordinator→PostgreSQL 18.6 전용 임시 DB에 reload 실패를 한 번 주입했다. 원본 자동 복원·native 검수·복구 reload의 pg_conf_load_time 변화 수락·한글 데이터 보존·journal 제거·commit 1회 및 rolled-back 감사·실패 경고·중복 적용 차단 확인. 자체 DB/서버/인증/작업 폴더/탭 정리 완료.

결과: `.runtime/verification/postgresql-hba-native-gui-2026-10-08T04-46-03.016Z/result.json`. 컴포넌트 SHA `28a92ae20a9377c42313ad300d0857b1df9b4e9a3d568262b61e7764abcc02fc`. 화면 `/tmp/tastedev-postgresql-hba-rollback-20261008.png`.

전송/helper/service 식별/candidate 실행은 명시적인 fixture adapter, reload는 pg_ctl이다. 설치 helper/systemd 및 원래 IDE에서 팝업 진입 전체 흐름은 별도 남는다. 기존 운영 DB·서비스·설정과 배포 패키지 무변경.

첫 전체 빌드는 임시 쓰기 할당량 오류 -122로 중단됐다. 자체 이전/실패 빌드 두 개의 snapshot과 사용 가능한 로그를 보존하고 정리했다: `.runtime/verification/owned-build-quota-cleanup-20261008T0449Z/result.json`. 개발 서버와 사용자 파일은 유지했다.

정리 후 수정된 현재 소스 384개 Next.js 운영 빌드 성공. 빌드 중 소스 변경 없음: `.runtime/verification/source-build-2026-10-08T04-48-00.527Z/result.json`. 관련 16개 검사 기록: `.runtime/verification/postgresql-hba-rollback-component-20261008.json`.
