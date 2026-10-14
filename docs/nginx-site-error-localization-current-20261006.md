# nginx 사이트 연결 오류 다국어 — 2026-10-06

사이트/연결 버전 재검토, 연결 경로 충돌, include 누락, 원본 변경, 중단 기록 권한·변경·복구, 자동 복구 불가 등 새 backend 안내 24개를 영어·일본어·중국어·스페인어·프랑스어·독일어·러시아어·아랍어·포르투갈어·이탈리아어·터키어·우크라이나어에 추가했다. helper/API 원문은 유지하고 팝업에서 현재 언어로 변환한다.

검사기 범위를 nginx-sites/nginx-site-request/nginx-site-operation의 한국어 runtime 문자열까지 확장했다. t()와 설정 설명만 검사하던 방식에서 놓친 backend 오류 누락도 발견한다. 24개 runtime 문구와 195개 설정 설명은 English 누락이 없고 번역 문자열/placeholder 검사도 PASS다. 완성 목록 11개는 1489개 키를 포함한다. 우크라이나어는 347개 번역이며 1142개 보충 번역이 남는다.

실제 prepareNginxSite에서 잘못된 버전 오류를 발생시키고 실제 SWC 컴파일 팝업에서 12개 언어 표시·이전 확인 초기화·busy 해제를 검사했다. 팝업/i18n 총 19개 통과. 최종 현재 373개 소스 빌드 /tmp/tastedev-current-build-woYgSA 성공, 빌드 중 소스 변경 없음.

증거 .runtime/verification/nginx-site-errors-localized-20261006/result.json 및 .runtime/verification/source-build-2026-10-06T04-11-19.718Z/result.json. backend 작업 동작은 변경하지 않았고 운영 설정·서비스·배포 패키지를 변경하지 않았다. 실제 브라우저 GUI 검사는 이번 변경에 새로 수행하지 않았다. 전체 Linux 언어 지원 완료와 구분한다.
