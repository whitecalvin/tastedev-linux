# nginx 매핑 블록 한국어 GUI (2026-10-07)

map/geo/split_clients 블록을 http의 추가 목록에 연결하고 내부 제안·한국어 입력을 보완했다. 사용자 지정 입력은 “매핑 키 / 결과 값”으로 표시하며 호스트 마스크·IP/CIDR·주소 범위·백분율·따옴표로 감싼 정규식 키를 추가할 수 있다. 일반 지시어 이름과 블록 이름의 제한은 유지한다. 기본 규칙 참고: [map](https://nginx.org/en/docs/http/ngx_http_map_module.html), [geo](https://nginx.org/en/docs/http/ngx_http_geo_module.html), [split_clients](https://nginx.org/en/docs/http/ngx_http_split_clients_module.html).

따옴표와 이스케이프를 고려해 키와 값을 분리한다. 공백이 있는 키의 결과 값을 수정해도 키를 잘라내지 않는다. 초안 입력 복원·설정 검색·직접 노드 편집에도 같은 분리를 사용한다. 포함된 매핑/MIME 파일의 루트 추가는 조회된 포함 문맥을 전달한다.

map hostnames/volatile 및 geo ranges/proxy_recursive는 인수 없는 설정으로 표시한다. hostnames와 ranges는 규칙 앞에 삽입한다. split_clients의 비율 규칙은 기존 나머지 * 규칙 앞에 삽입한다. 기존 CIDR을 주소 범위로 자동 변환하거나 잘못된 비율 합계를 자동 보정하지 않으며 운영 적용 전 nginx 검수가 필요하다.

## 확인 결과

- 관련 검사 25개 통과. 실제 컴파일된 GUI 폼의 따옴표 키 추가, 트리 callback의 포함 파일 추가/따옴표 키 편집, 원문 순서·입력 초안·MIME·인수 없는 설정·트리 렌더링 회귀 포함.
- 실제 임시 nginx 구문 6개 및 HTTP 요청 2개, 총 8개 그룹 통과: `.runtime/verification/nginx-mapping-2026-10-06T17-58-31.823Z/result.json`. 정규식 키 편집 결과, 와일드카드 호스트, IPv4/IPv6 CIDR 구문, 주소 범위, 백분율 결과 확인. 바이너리 버전·SHA-256·검수 출력과 응답 값 보존. 임시 서버 종료 및 fixture 정리 완료, 운영 파일/서비스 변경 없음.
- 첫 HTTP 검사 실패는 `.runtime/verification/nginx-mapping-2026-10-06T17-57-59.621Z/result.json`에 보존했다. 별도 자체 HTTP 서버에서 현재 Node v24.21.0의 fetch가 지정 Host 대신 URL 호스트를 전송함을 확인했다. 명시적인 HTTP request로 검증 도구를 수정했다: `.runtime/verification/nginx-mapping-host-20261007/result.json`.
- 최신 378개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T17-59-49.652Z/result.json`.

새 GUI의 실제 브라우저 E2E와 운영 적용 완료는 별도 남는다. 추가 다국어·사용자 담당 이름 변경·DEB 검증은 수행하지 않았다.


## 후속 항목 추가 수정

- 지시어 노드를 선택하고 다른 항목을 추가하면 선택한 지시어의 부모 블록에 추가한다. 포함 파일의 최상위 지시어는 파일 최상위에 추가한다.
- split_clients는 백분율 구간과 마지막 `*` 나머지 구간에 각각 기존의 구체적인 설명을 사용한다.
- 트리 검색은 공백을 포함한 따옴표 매핑 키를 하나의 토큰으로 처리한다.
- 관련 6개 검사 파일, 총 22개 검사 통과. 실제 컴포넌트 callback에서 부모 블록·포함 파일 추가 및 원본 보존을 확인했다.
- 최초 검사에서 기존 MIME 설명·문맥 없는 설명 조회를 가정하던 검사 2개가 실패했다. MIME 내부 include 설명과 실제 제안 문맥을 검증하도록 검사 기준을 갱신한 뒤 전체 22개가 통과했다.
- 이번 후속 변경의 운영 적용·실제 브라우저 확인·배포는 수행하지 않았다. 이전 구문/HTTP 증거를 이번 변경 이후의 결과로 재사용하지 않는다.
