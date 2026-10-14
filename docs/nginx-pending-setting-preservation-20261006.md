# nginx 설정 미반영 입력 보존 (2026-10-06)

이전 입력 캐시는 파일 텍스트가 바뀌면 전체 초기화되어, 한 항목을 초안에 반영한 뒤 다른 노드로 이동했다 돌아오면 다른 미반영 입력이 사라질 수 있었다.

단일 설정 항목의 명시적인 로컬 반영에서는 동일한 노드·문맥·원래 값이 확인되는 나머지 기존 항목의 입력을 다음 초안 버전으로 전달한다. 반영한 항목과 모호한 반복 항목은 전달하지 않는다. 외부 파일 갱신, 코드 교체 및 구조 편집에는 기존 버전 무효화를 유지한다. 추가 항목 입력을 포함해 블록별 scope를 키에 포함하여 다른 블록의 입력이 섞이지 않도록 했다. 이후 추가 제안 항목의 미반영 값도 파일 root 또는 변경되지 않은 블록 scope가 확인될 때 보존하도록 보완했다.

집중 검사: `node --test --test-isolation=none tests/nginx-pending-inputs.test.mjs tests/nginx-block-settings.test.mjs tests/nginx-code-import.test.mjs`, 추가 제안 항목 보존을 포함한 최신 12개 통과. 다중 입력, 블록 scope, 반복 항목 충돌 및 외부 변경 무효화 등을 포함한다.

실제 개발 브라우저에서 nginx.conf의 worker_processes를 2로, pid를 임시 경로 문자열로 입력하고 worker_processes만 초안에 반영했다. events 노드로 이동 후 nginx.conf로 돌아와 worker_processes=2 및 미반영 pid 입력이 유지되는 것을 확인했다. 운영 파일 적용은 수행하지 않았으며 검사 초안을 초기화하고 임시 탭을 닫았다.

화면 증거: `/tmp/tastedev-nginx-pending-inputs-20261006.png`. 이번 변경 이후 별도 운영 빌드는 수행하지 않았다.

추가 브라우저 확인: events 블록에서 제안 항목 multi_accept를 켜고 worker_connections만 512로 초안에 반영했다. http로 이동 후 events로 돌아와 추가 항목을 펼쳤을 때 multi_accept=true가 유지됨을 실제 DOM checked 및 화면으로 확인했다. 검사 초안을 초기화하고 임시 탭을 닫았다. 증거 `/tmp/tastedev-nginx-additional-inputs-20261006.png`. 운영 설정 및 서비스는 변경하지 않았다.
