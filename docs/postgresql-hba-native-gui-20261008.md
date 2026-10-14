# PostgreSQL GUI와 실제 임시 DB 적용·복원

현재 제품 HBA 적용 컴포넌트를 임시 Next.js 화면에서 렌더링하고, 실제 브라우저의 검토·확인·적용·백업 복원을 현재 인증 HTTP API 및 HBA coordinator에 연결했다. 실제 PostgreSQL 18.6의 native HBA parser와 전용 Unix 소켓 클러스터를 사용했다.

최종 결과: `.runtime/verification/postgresql-hba-native-gui-2026-10-08T04-43-04.992Z/result.json`.

- GUI의 편집 설정 검토 후 최종 확인으로 실제 파일 교체 및 원본 백업 생성
- pg_ctl reload 이후 pg_conf_load_time 변화로 실제 reload 수락 확인
- 생성된 백업을 GUI에서 검토·최종 확인하여 실제 원본 복원 및 reload
- 적용·복원 commit 각각 1회 및 감사 completed 각각 1회
- 원본 파일 일치, 한글 SQL 데이터 보존, 중단 기록 정리
- 컴포넌트·API·coordinator 원본과 복사본 SHA 일치
- 자체 클러스터 종료, 임시 서버·인증/작업 폴더·브라우저 탭 정리

실행 바이너리: PostgreSQL 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1), SHA-256 `30a38e0516ec1bde4b8ca710cf28ba51ee78bd004cabbf3107e7a52d5414a64a`.

범위는 실제 HBA GUI→검수 전용 proxy→현재 Better Auth 인증 API→native coordinator→전용 임시 DB다. GUI proxy가 자체 fixture 인증을 전달한다. privileged helper 전송·서비스 식별·pg_ctl reload hook·candidate 실행은 명시적인 fixture adapter이며 설치 helper/systemd/bwrap 전체 경로를 증명하지 않는다. 제품의 원래 IDE 트리부터 팝업 진입하는 전체 화면 수용과 GUI reload 실패·중단 복구도 남는다. 기존 운영 DB와 서비스, 패키지, 설정은 변경하지 않았다. 배포 패키지 검수 없음.

최초 검수 도구 origin 비교 오류는 Next 내부 URL 대신 고정 fixture browser origin으로 수정했다. `.runtime/verification/postgresql-hba-native-gui-2026-10-08T04-40-30.176Z/result.json` FAIL 기록 보존, native 변경은 시작하지 않았다. 다음 실행은 GUI 적용/복원과 데이터 확인 후 자동 감사 기대값 success/completed 불일치로 FAIL이었다: `.runtime/verification/postgresql-hba-native-gui-2026-10-08T04-41-48.629Z/result.json`. 실제 API 감사 값 completed로 기대값을 수정하고 nativeProof를 보존한 최종 실행이 PASS다. 모든 실행의 자체 DB 종료·임시 정리를 확인했다.

최종 화면: `/tmp/tastedev-postgresql-hba-native-final-20261008.png`.
