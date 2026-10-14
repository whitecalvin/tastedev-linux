# MariaDB 적용 화면 확인 (2026-10-06)

한국어 기능 완성을 우선한다. 다국어 추가 작업은 사용자 지시에 따라 기능 완성 이후로 미뤘다.

MariaDB 적용 화면에서 부모 busy 상태가 렌더되기 전 중복 클릭으로 적용 요청이 반복되는 경로를 차단했다. 검토 후 plan/API/연결/권한이 바뀌면 effect 실행 전에도 이전 확인창/결과/오류를 숨기고 보관된 적용 handler의 요청을 거부한다. 같은 계획에서 확인한 적용만 실행한다. 연결 변경 후 늦게 완료된 결과와 오류는 새 화면에 반영하지 않는다.

신규 컴파일 컴포넌트 3개와 기존 파일 적용/복원 모델 12개, 총 15개 통과. `.runtime/verification/mariadb-apply-ui-20261006/result.json`. 실제 MariaDB 설치/서비스/DB 또는 브라우저 수용을 완료한 증거는 아니다.

현재 373개 소스 Next.js production compilation 통과, 빌드 중 소스 변경 없음. `.runtime/verification/source-build-2026-10-06T08-44-03.248Z/result.json`. 개발 서버 재시작/운영 변경/최종 배포 검증은 수행하지 않았다.
