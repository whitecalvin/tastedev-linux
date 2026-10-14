# 설치·인증서 작업 로그 UTF-8 보존 (2026-10-06)

기존 작업 로그는 stdout/stderr의 개별 Buffer마다 `toString()`을 호출하여 한글·이모지의 바이트가 출력 조각 사이에 나뉘면 문자가 깨질 수 있었다. `lib/process-log-lines.ts`를 추가해 각 스트림에 독립적인 UTF-8 StringDecoder와 줄 버퍼를 사용한다.

설치와 인증서 작업 모두 새 처리기를 사용한다. 줄 단위로 기록하며 종료 시 개행 없는 마지막 줄도 저장한다. 설치 로그는 빈 줄을 생략하는 기존 행 형식을 유지한다. 인증서 로그는 UI와 AI 입력에서 조각을 그대로 이어 붙이므로 개행과 빈 줄을 보존한다. CRLF는 LF로 정규화한다. 미완성 줄은 개행 또는 종료 때 기록된다. 줄 버퍼는 기존 저장 한도(설치 2000, 인증서 8000)를 준수하고, 자른 지점의 미완성 UTF-16 surrogate를 제외한다. PTY 터미널의 원시 스트림 처리는 변경하지 않는다.

검사: `node --test --test-isolation=none tests/process-log-lines.test.mjs tests/async-operation-audit.test.mjs tests/install-job-record.test.mjs tests/admin-job-record.test.mjs`, 20개 통과. 한 바이트씩 분리한 한글·이모지, stdout/stderr 동시 조각, 마지막 줄 flush, 긴 줄, 설치/인증서 worker 종료 저장 및 기존 실패·감사 처리 검사를 포함한다. 최초 제한 실행의 새 프로세스 조회 stdout은 빈 값으로 전달되어 1개가 실패했고, 허용된 동일 검사 실행에서는 새 프로세스 조회도 통과했다.

인증서 개행 보존 보완 후 `node --test --test-isolation=none tests/process-log-lines.test.mjs tests/async-operation-audit.test.mjs tests/certificate-job-history.test.mjs` 14개 통과. 인증서 worker 저장 로그를 이어 붙인 결과의 줄바꿈, 빈 줄, 마지막 미완성 줄 및 길이 제한을 확인했다.

실제 apt 또는 ACME 실행은 수행하지 않았다. 앞선 357개 소스 운영 빌드는 이번 변경 이전 증거다.
