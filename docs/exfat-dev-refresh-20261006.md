# exFAT 개발 변경 감지 (2026-10-06)

개발 소스 수정이 기존 문서와 새 탭에도 반영되지 않아 개발 서버를 재시작해야 하는 현상을 반복 확인했다. 현재 프로젝트의 statfs type은 0x2011BAB0(exFAT)다. Next.js 16.3.8의 설정 스키마와 로컬 개발 안내를 읽은 뒤 해당 파일시스템의 development 모드에서만 watchOptions.pollIntervalMs=1000을 지정했다. 생산 모드와 다른 파일시스템에는 적용하지 않는다.

실제 브라우저의 이미 열린 /overview에서 console-workspace에 임시 data-dev-watch-probe 속성을 추가하자 서버 재시작·문서 새로고침 없이 표시됐다. 속성 제거도 자동 반영됐다. 최종 소스가 검사 전 내용과 같음을 확인했다. 보안 헤더/테마 초기화 테스트 2개 성공. production 구성에서 watchOptions가 undefined임을 별도 확인했다.

폴링은 개발 시 CPU/디스크 사용을 늘릴 수 있어 exFAT로 한정했다. DOM 반영 확인은 이 컴포넌트 변경 범위이며 모든 모듈의 Fast Refresh 상태 유지 보장은 아니다.
