# PostgreSQL 클러스터 상태 표시

2026-10-06

config-live PostgreSQL 설정 목록과 SSR 초기 목록에 파일별 클러스터 상태를 포함한다. postgresql.conf와 pg_hba.conf는 같은 PostgreSQL instance unit을 사용하며 하나의 읽기 전용 systemctl show 호출로 중복을 제거한다. 파일 경로/클러스터 이름은 정해진 패턴만 허용한다. 부분 실패 시 읽은 클러스터 상태를 유지하고 누락 상태는 unknown으로 표시한다.

선택한 파일은 해당 클러스터의 서비스 상태를 헤더에 표시한다. 선택 전 상위 서비스의 active/exited는 실행 중으로 해석하지 않는다. 기존 시작/종료는 여전히 postgresql.service 전체 대상이며 툴팁과 확인창에 대상 unit을 명시한다. 개별 클러스터 시작/종료는 이 변경에 포함되지 않는다.

관련 설정·SSR·컴포넌트·조회 검사 21개 성공. 실제 개발 브라우저에서 18/main 설정 선택 후 postgresql@18-main.service의 실행 중 상태 표시를 확인했다. 함께 발견된 페이지 외부 스크롤은 auth-shell을 제외한 공통 콘솔의 html/body에서 제한하며 본문 overflow:auto를 유지한다. 실제 화면에서 root/body hidden, 설정 본문 auto와 외부 스크롤바 제거를 확인했다.

원격 장비에 현재 모듈 소스를 SSH 표준입력으로 전송하는 검사는 자동 승인 검토에서 명시적 전송 승인이 없다는 이유로 거부됐다. 전송은 수행하지 않았고 승인 질문만 제출했다. 로컬 브라우저 확인은 이 원격 검사와 별도다. 설치 서버·서비스·예약 목록·권한을 변경하지 않았다. 이번 변경 후 전체 회귀 검사/운영 빌드 갱신은 아직 수행하지 않았다.

## 후속 구현: 선택 클러스터 제어

2026-10-06: PostgreSQL IDE 시작/종료 요청은 선택된 파일의 클러스터로 제한한다. 확인창은 클릭 당시 대상 unit/path를 유지한다. API는 경로와 unit 일치를 검사하고, root helper는 독립 검증과 기존 pgRead 소유권/경로 검사를 거쳐 pg_ctlcluster(version, cluster, start|stop)를 호출한다. 선택 파일의 로그도 같은 클러스터 journal을 조회한다. 파일 선택 전 시작/종료는 비활성이다. 기존 관리자/서비스 변경 권한은 그대로 적용한다.

관련 검사 33개 통과(서비스 요청, 독립 helper 명령 fixture, IDE 요청, 팝업, 기존 서비스, runtime closure). 실제 브라우저에서 18/main 선택 후 상태/버튼 대상 확인. 실제 운영 클러스터 시작/종료는 실행하지 않았다. 전체 목표와 운영 적용 검증은 미완료다.

## 데몬 화면 연계

등록된 PostgreSQL 설정 디렉터리를 탐색해 operations 상태 목록에 클러스터 unit/configPath를 포함한다. 디렉터리·설정 파일 심볼릭 링크를 따라가지 않으며 탐색 수를 제한한다. 데몬의 대상 선택, 로그 조회, IDE 링크를 연계했고 클러스터 시작·종료·재시작·reload를 경로에 제한해 처리한다. 부팅 자동 시작 옵션은 클러스터 선택에서 표시하지 않는다. 목록과 제어 패널이 각각 내부 스크롤되어 제어 영역이 목록 스크롤에 사라지지 않는다.

관련 검사 22개 통과. 실제 개발 서버 화면에서 postgresql@18-main.service의 active/running 표시, 선택 대상 및 네 작업 메뉴, 본문 overflow:hidden과 두 패널 overflow:auto 확인. 화면 증거: /tmp/tastedev-daemon-clusters.jpg. 운영 서비스를 변경하는 버튼은 실행하지 않았다.
