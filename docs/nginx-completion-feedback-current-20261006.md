# nginx 적용·복원 완료 안내 유지 (2026-10-06)

실제 GUI 검사에서 적용/복원 성공 후 부모가 초안·복원 계획을 정리하면서 `NginxApplyPanel`이 제거되고 그 안의 완료 안내도 사라지는 문제를 수정했다.

`NginxConfigTree`는 적용 결과를 선택 파일별 부모 상태에 보관한다. 설정/코드 탭 모두에서 완료 안내를 표시하며 성공한 목록 갱신 후에만 기존 초안을 제거한다. 갱신 실패 시 실제 적용 성공과 목록 갱신 실패를 구분하고 초안을 보존한다. 연결 변경·부모 해제 후 늦은 갱신 결과는 무시하고 새 초안을 편집하면 이전 안내를 지운다. 다시 조회한 파일이 적용한 내용과 달라지고 초안도 없는 경우 이전 적용 안내를 숨긴다.

`NginxBackupsPanel`은 복원 완료 안내를 복원 계획 밖에 보관한다. 계획 정리·백업 목록 갱신 후에도 표시하며 트리 또는 목록 갱신 실패를 구분한다. 다른 백업 선택이나 연결 변경에서는 이전 결과를 지운다.

관련 검사: `node --test --test-isolation=none tests/nginx-apply-panel.test.mjs tests/nginx-backups-panel.test.mjs tests/nginx-code-import.test.mjs`, 9개 통과. 완료 안내 유지와 목록 갱신 실패의 구분, 기존 늦은 응답/중복 요청 차단을 포함한다.

실제 브라우저는 `/tmp/tastedev-current-build-IadTsV` 빌드에서 별도 localhost Next.js·임시 nginx에 로그인하여 코드 편집/검토/적용 후 코드 탭의 “설정 적용 완료”와 생성 백업의 실제 복원/목록 갱신 후 “복원 완료”를 확인했다. 종료 시 원본 파일 바이트와 실제 HTTP 응답 복원 확인: `.runtime/verification/nginx-next-isolated-2026-10-05T23-11-26.157Z/result.json`.

스크린샷:

- `/tmp/tastedev-nginx-completion-applied-20261006.png`
- `/tmp/tastedev-nginx-completion-restored-20261006.png`

브라우저 확인 이후, 원본 복원 등으로 파일이 다시 바뀌었을 때 이전 적용 안내를 숨기는 표시 조건을 추가했다. 이 최종 변경을 포함한 358개 소스 빌드는 `.runtime/verification/source-build-2026-10-05T23-13-58.904Z/result.json`에서 소스 변경 없이 성공했다. 위 스크린샷은 마지막 표시 조건 추가 이전 증거로 구분한다.

실제 GUI의 성공 후 안내 유지는 확인했지만 갱신 실패 및 연결 교체 분기는 코드 검사 범위다. sudo/systemctl은 임시 fixture adapter이며 실제 운영 서비스/권한 변경이나 DEB 검증은 수행하지 않았다. 임시 서버·nginx·계정·fixture·브라우저 탭은 정리했다.
