# 인증서 작업 재시작 조회

## 변경

Certbot helper를 시작하기 전에 작업 ID·명령·시작 시각을 비공개 인증 저장소에 `.pending.json`으로 저장한다. 완료 기록과 같은 임시 파일 fsync·배타적 공개 잠금·rename·디렉터리 fsync 경로를 사용한다. 이 저장이 실패하면 helper는 시작하지 않으며 아직 사용하지 않은 작업 잠금은 정리한다.

현재 서버 프로세스가 작업을 관리하는 동안 목록·상세는 `running`을 유지한다. 새 서버 프로세스에서 완료 기록 없이 시작 기록만 발견하면 `recovery-required`, 한국어 화면에서는 **실행 상태 확인 필요**로 안내한다. 프로세스가 실제로 종료됐다고 추정하지 않으며, 인증서·nginx·Certbot 상태 확인이 필요하다고 표시한다. 기존 관리 잠금은 자동 해제하지 않고 Certbot을 재실행하지 않는다. 같은 ID의 완료 기록이 있으면 그 결과가 우선하며 목록에는 한 번만 표시한다.

초기 기록에는 시작 당시 로그만 있다. 중단 전 출력 전체 복구, 실행 프로세스 식별/수동 잠금 해제 및 실제 ACME 강제 종료 수용 검사는 이번 범위에 포함되지 않는다. 완료 여부를 확인할 수 없는 작업을 성공/실패로 표시하는 문제와 조회 404를 해결한 범위다.

## 확인

- 관련 6개 검사 파일 21개 통과, 저장 실패 시 helper 미실행 검사 추가 후 비동기/감사 파일 10개 통과(고유 총 22개).
- 실제 별도 Node.js 프로세스에서 미완료 기록 상세·목록 조회, 원래 작업 잠금 보존, 원본 시작 기록 보존 확인.
- 실행 중 메모리 기록 우선 및 완료 기록 중복 제거, 손상·심볼릭 링크·권한 오류 거부 확인.
- 실제 컴파일된 작업 로그 팝업에서 한국어 상태와 확인 안내 표시 확인.
- 최신 378개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T18-10-44.659Z/result.json`.

실제 Certbot, 운영 인증서/서비스 또는 배포 패키지는 실행·변경하지 않았다. 실제 브라우저·설치 환경 전체 수용을 완료한 결과는 아니다.


## 실제 Next.js HTTP 연동

동일 빌드 `/tmp/tastedev-current-build-lQ6mL1`의 임시 서버에서 인증되지 않은 요청 거부, 로그인 후 시작/완료 기록 목록·상세, 완료 기록 우선/중복 제거, 미완료 기록의 `recovery-required`·종료 코드 미추정, 잠금/초기 기록 보존과 실제 프로세스 재시작 후 동일 세션 조회를 확인했다.

`.runtime/verification/certificate-history-http-2026-10-06T18-12-18.486Z/result.json` — 8개 HTTP 검사 그룹 통과. 인증서와 설치 완료 데이터는 자체 임시 fixture이며 실제 발급/설치를 실행하지 않았다. 임시 서버 종료·작업 폴더 정리 완료.

동일 빌드의 전체 보호 라우트·로그인·세션·실제 PTY 한글/이모지 입출력·SSE 종료·감사 API 회귀 15개 그룹도 통과했다:

`.runtime/verification/production-http-2026-10-06T18-13-02.293Z/result.json`

OS 입력기 자모 조합 및 실제 인증서 강제 종료/설치 환경 수용은 여전히 별도 검사가 필요하다.


## 실제 팝업과 배치 보완

최초 실제 GUI에서 미완료 상태/안내·완료 한글 로그 선택은 성공했으나 두 배치 문제를 발견했다. 목록 너비 199px에 scrollWidth 219px로 불필요한 가로 스크롤이 있었고, 새로고침/닫기 SVG에 stroke가 없어 닫기 아이콘이 보이지 않았다. 최초 화면은 `.runtime/verification/certificate-interruption-gui-20261007.png`로 보존했다.

공통 아이콘 클래스를 적용하고 목록 항목의 nowrap을 해제했다. 작업 ID를 목록 내부에서 줄바꿈하고 헤더를 48px로 정리했다. 최신 378개 소스 빌드 `.runtime/verification/source-build-2026-10-06T18-18-00.435Z/result.json` 통과.

수정 빌드의 실제 1280×720 GUI에서 미완료 기록/확인 안내/완료 한글 로그 선택, 닫기·로그아웃을 확인했다. 목록 clientWidth/scrollWidth 모두 199px, 헤더 48px, 두 버튼 32px·border 0px·SVG fill none/stroke 있음. 같은 검사에서 실제 로그인/기록 API 및 프로세스 재시작도 포함한 9개 그룹 통과:

`.runtime/verification/certificate-history-http-2026-10-06T18-19-09.770Z/result.json`

수정 화면: `.runtime/verification/certificate-interruption-gui-fixed-20261007.png`. 별도 127.0.0.2 임시 탭/계정/서버를 사용했고 로그아웃·탭 닫기·서버 종료·fixture 제거 완료. 실제 Certbot/설치/운영 서비스 변경은 없음.
