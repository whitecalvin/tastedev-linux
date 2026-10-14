# Node.js 앱 로그 연결 전환 보완

한국어 기능 개발 우선 방침에 따라 기존 앱 로그 조회와 AI 분석 입력의 연결 소유권을 수정했다.

- 앱 ID, API 함수, 연결 상태가 바뀌면 이전 조회 결과와 AI 입력을 새 화면에 표시하지 않는다. effect 실행 전 렌더에서도 이전 결과를 감춘다.
- 이전 화면이 보관한 조회 callback은 새 연결에서 실행되지 않는다.
- 중복 클릭은 요청 완료까지 한 번만 실행한다. 이전 요청 실패·성공은 새 요청의 busy 상태나 오류·로그를 변경하지 않는다.
- 연결 해제·비활성·빈 앱 ID 및 unmount 이후 결과를 무시한다.
- 로그 조회는 공통 32px 무테두리 아이콘 버튼을 사용하며 한국어 접근성 이름과 tooltip을 유지한다.

## 확인 범위

`node-app-logs-component`, `node-config-ide`, `node-service-completion-component` 총 10개 검사 통과. SWC로 컴파일한 실제 컴포넌트의 callback 및 API 교체 전후 렌더를 검사했다. 현재 378개 소스 스냅샷의 Next.js 빌드 통과:

`.runtime/verification/source-build-2026-10-06T18-06-48.129Z/result.json`

실제 운영 앱의 journal 또는 외부 AI API 호출은 수행하지 않았다. 이번 결과를 설치 환경 전체 수용이나 최종 배포 완료로 판정하지 않는다.
