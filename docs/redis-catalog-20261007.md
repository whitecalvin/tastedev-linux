# Redis 설정 이름 대조와 제안 목록

공식 Redis 8.0.5 config.c의 등록 이름·별칭·파일 전용 지시어와 deprecated 목록을 대조했다. 근거 https://raw.githubusercontent.com/redis/redis/8.0.5/src/config.c 및 https://raw.githubusercontent.com/redis/redis/8.0.5/redis.conf . 소스 SHA-256과 추출 사실 자료는 `.runtime/verification/redis-catalog-20261007/source-catalog.json`, 변경 비교는 같은 디렉터리의 `comparison.json`에 보존했다.

기존 203개 이름에는 값인 no가 혼입되어 일반 문장 주석도 설정 행으로 표시될 수 있었다. 해당 이름을 제외하고 8.0.5 추가 이름/별칭 21개를 보완했다. 알려진 파일 이름 223개는 이전 별칭/폐기 표기도 읽고 편집할 수 있도록 유지한다. 새 설정 제안에는 공개 등록 이름과 파일 지시어 185개만 연결해 hidden·폐기 항목·중복 별칭 표기를 제외했다. 모듈과 확장 이름은 여전히 직접 입력할 수 있다. 설치 버전/빌드 옵션별 지원 여부는 실제 서버 검수가 필요하다.

관련 검사 11개 통과: 이름 분류, 새 주석 설정 편집과 일반 문장 구분, 컴파일된 입력의 제안 목록/한국어 label, 여러 인수·중복 행·비밀번호 가림·내용 비우기·미반영 입력 회귀.

첫 임시 빌드는 쓰기 할당량(-122)으로 중단됐다. 자체 이전 빌드 6개가 실행 중이지 않음을 확인하고 로그/소스 해시를 보존한 뒤 정리했다: `.runtime/verification/temporary-build-cleanup-20261007-4/result.json`. 최신 383개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T19-48-52.272Z/result.json`.

실제 격리 한국어 GUI에서 185개 datalist 연결·제외 이름 없음, 주석 hide-user-data-from-log 값 편집, no 일반 문장의 설정 행 제외, set-max-listpack-entries=256 추가와 모든 다른 코드/주석 보존, 로그아웃 확인. 설치 목록/설정 fixture만 사용하고 실제 Redis 실행·운영 변경은 하지 않았다. 원시 자동완성 팝업 키보드 선택과 모든 옵션 실제 서버 지원 검수는 남는다. 화면 `.runtime/verification/redis-completion-gui-20261007.png`.

GUI 결과 PASS: `.runtime/verification/package-editor-gui-2026-10-06T19-50-06.360Z/result.json`. 자체 서버·fixture·탭 정리와 읽기 전용 원본 설정 보존 확인 완료.
