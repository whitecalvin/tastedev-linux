# 복구 검토 대상 및 연결 유지 — 2026-10-08

nginx·MariaDB·Redis·Node.js 중단 복구 컴포넌트가 API 함수 교체를 검토 무효화 조건에 포함하지 않아 이전 검토와 확인 콜백을 사용할 수 있었다. 렌더 scope·mount 여부·현재 disabled 상태를 확인하도록 수정했다. 파일·앱·보안 정책·API 변경 시 첫 렌더부터 이전 검토/확인/결과를 숨기고 늦은 응답과 이전 조회/확인/복구 콜백을 transport 호출 전에 차단한다. nginx locale 변경은 최종 확인을 해제한다.

Node.js의 부모 onBusy 피드백으로 disabled가 바뀌는 것은 진행 중 요청을 무효화하지 않는다. 새로운 사용자 동작만 차단하며 응답 후 부모 busy를 해제한다. 부분 복구 결과는 role=alert, 실제 recovered 결과는 status로 구분한다.

컴포넌트 검사 23개 성공. 기존 조회·복구·최종 확인·중복 실행·조회 전용 검사와 API 교체/정책/disabled/unmount 이후 이전 콜백 차단, 이전 API 응답 폐기, StrictMode 정리/재실행, 부분 복구 경고, Node 부모 busy 피드백을 포함한다.

로그: `.runtime/verification/recovery-context-20261008.log`.
최신 384개 소스 Next.js 전체 빌드: `.runtime/verification/source-build-2026-10-08T05-04-14.953Z/result.json` (PASS, 소스 변경 없음).

응답은 컴포넌트 검사 fixture이며 실제 설치 서비스의 복구 성공을 뜻하지 않는다. 이번 네 복구 화면의 신규 실제 브라우저 수용과 설치 helper/systemd 전체 연동은 별도 남는다. 운영 설정·서비스·배포 패키지는 변경하지 않았다.

## 실제 브라우저 후속 확인

2026-10-08 Next 개발 서버에서 현재 제품 네 컴포넌트를 실제 렌더링했다. 각 최종 복구 확인창을 연 뒤 API 연결을 바꾸면 확인창과 검토가 사라지고 요청 기록 수는 증가하지 않았다. 새 연결에서 조회→명시 확인→복구 결과를 확인했으며 네 흐름 모두 성공했다. 총 요청 12개는 각 이전 조회·새 조회·새 연결 복구로 구성된다. Node.js 실제 부모 busy 전달도 연결했다. 검증 도구 `scripts/verification/recovery-context-gui.mjs`, 화면 `/tmp/tastedev-recovery-context-browser-20261008.png`. API 응답은 fixture이며 운영 helper/systemd 복구의 증거로 확대하지 않는다. 자체 서버·폴더·탭 정리 완료.
