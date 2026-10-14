<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 작업 파일 저장 경로 (사용자 지정, 2026-10-11)

- 빌드·검수·테스트의 새 작업 파일은 `/mnt/data/build/tastedev-linux` 아래에 생성한다. `/tmp` 및 `/var/tmp`로 대체하지 않는다.
- 실행하는 하위 프로세스에도 `TMPDIR`, `TMP`, `TEMP`를 위 경로로 전달한다.
- `/tmp`를 고정한 기존 검수 스크립트는 생성 경로·격리 마운트·정리 경로를 함께 수정하기 전까지 실행하지 않는다. 원격 검수도 해당 장비의 지정 경로를 먼저 확인한다.
- 기존 빌드 결과와 검수 증거는 사용자 요청 없이 이동하거나 삭제하지 않는다.
- 도구가 자체적으로 관리하는 임시 경로를 프로젝트 코드에서 통제할 수 있다고 주장하지 않는다.
