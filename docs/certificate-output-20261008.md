# Certbot 긴 작업 로그 수집

2026-10-08. 서버가 helper JSON 응답을 해석하기 전에 8,000자 행 제한으로 잘라, 긴 `{logs:...}` 응답이 잘린 JSON 문자열로 화면에 표시되고 뒷부분이 사라지는 문제를 수정했다.

`lib/certificate-process-output.ts`에서 stdout/stderr를 별도 UTF-8 decoder로 받고 완성된 bounded JSON envelope를 해석한다. 결과를 JSON escape를 포함해 저장 행당 8,000자 이하로 나누고, 기존 `certificateJobLog`가 한 번만 해석하도록 각각 감싼다. 실제 셸이 출력한 JSON 문자열을 다시 로그 envelope로 해석하지 않는다. 알려진 helper 오류는 기존 안전한 한국어 안내로 표시하고, 알 수 없는 JSON은 원문 텍스트로 남긴다. 일부가 잘렸거나 알 수 없는 출력으로 명령 성공을 추정하지 않는다.

helper의 stdout/stderr 각 2MiB 한도 및 JSON escape 팽창을 고려해 envelope는 26MiB 이내로 제한한다. 초과한 행은 생략 안내를 표시하고 다음 응답을 계속 받는다. 기존 저장 기록의 최대 500행 한도는 유지하되 넘으면 처음 100행과 최신 399행 사이에 생략 안내 1행을 넣는다. 최초 백업 경로/ID와 최종 실패/성공 결과를 유지한다. 한도 내 결과의 문자열과 줄바꿈은 보존하며 무제한 로그 보존을 제공한다고 주장하지 않는다.

`lib/server-tools.ts`의 실제 certificate 작업 stdout/stderr와 spawn 오류 저장에 연결했다. 현재/저장 작업 로그 UI는 기존 formatter를 사용하며 다른 패키지의 `processLogLines`는 그대로 사용한다.

검증:

- 최초 관련 16개 검사 성공: 긴 한글·emoji·빈 줄·셸 JSON 내용·escape 팽창·분리된 stdout/stderr·초과 envelope·실제 completedAdminJob 검증·기존 UI/기록 검사.
- 저장 한도 및 현재 collector로 helper dispatch 연결을 포함한 최종 11개 검사 성공. API 인증·서버 재시작 중단 기록·실패·부분 백업을 함께 검사했다. 앞선 검사와 일부 중복이며 두 실행 횟수를 고유 검사 개수로 합산하지 않는다.
- 로그 증거: `.runtime/verification/certificate-output-20261008/{regression.log,regression.json}`.
- 현재 388개 소스 Next.js 빌드 성공, 빌드 중 소스 변경 없음. `.runtime/verification/source-build-2026-10-08T08-22-44.092Z/{result.json,build.log,source-snapshot.json,cleanup.json}`. 자체 임시 빌드 경로 정리.

이번 변경 이후 원래 GUI의 긴 native 결과 전체 수용은 별도로 남는다. 전 단계의 103번 Certbot 실패 GUI/실제 27개 백업 결과는 그 당시 수집기 증거이며 이번 수정 후 수용 증거로 대신하지 않는다. 신규 발급/TLS 변경·설정 복원·웹 강제 종료 중 진행 로그 영속화·전체 목표는 진행 중이다. DEB 빌드/검증은 실행하지 않았다.
