# 운영환경 보안 옵션

## 구현한 앱 옵션

보안 설정에서 조회 전용, 비밀번호 입력 없는 sudo 요청, nginx 적용/복구, Certbot 연계, 서비스 제어, cron 변경, 패키지 설치, 파일 저장, 터미널, 감사 기록을 독립적으로 설정한다. `.runtime/security.json`에 저장한다. 기본값은 조회 전용이며 작업 허용은 모두 꺼져 있다.

환경 변수는 관리자 지정의 상한이다. 해당 서버 허용 변수가 false이면 UI 설정만으로 활성화할 수 없다. 보안 설정 저장은 OS 권한을 부여하지 않는다. 요청 시 서버 API에서 매번 확인한다. 이미 시작한 작업은 설정을 꺼도 자동 종료하지 않는다.

## 관리자 인증 방식 비교

| 방식                                        | 용도                             | 현재 지원                               |
| ------------------------------------------- | -------------------------------- | --------------------------------------- |
| 비밀번호 없는 sudo (`NOPASSWD` + `sudo -n`) | 고정된 전용 helper에만 권한 부여 | helper와 앱 옵션 구현, OS 등록은 미수행 |
| 매번 비밀번호 (`PASSWD`, 인증 시간 설정)    | SSH/OS 터미널에서 사용자 확인    | OS 설정 안내, 웹 비밀번호 입력 미지원   |
| sudo 인증 캐시                              | 일정 시간 재인증 생략            | OS 정책으로 관리, 웹 세션 캐시와 별개   |
| polkit 인증 대화상자                        | Tauri/Linux 데스크톱에서 OS 인증 | 설계 후보, 미구현                       |
| 조회 전용                                   | 운영 변경 전면 차단              | 구현                                    |

공식 자료: [sudoers 매뉴얼](https://www.sudo.ws/docs/man/1.9.14/sudoers.man.pdf), [polkit 권한 구조](https://polkit.pages.freedesktop.org/polkit/polkit.8.html).

## OS 등록 절차 (관리자가 검토 후 수행)

웹 서버는 일반 사용자로 실행한다. helper는 작업 체크아웃이 아닌 root 소유의 `/usr/local/libexec/linux-admin`에 설치한다. 시스템의 `/usr/bin/node`가 필요하다. 관리자 설정은 이 개발 작업에서 실행하지 않았다.

```bash
sudo install -o root -g root -m 0755 scripts/admin/linux-admin /usr/local/libexec/linux-admin
sudo visudo -f /etc/sudoers.d/linux
```

허용하려는 작업만 추가한다. 실제 계정명으로 바꾼다. 아래는 nginx와 서비스 작업 예시다.

```sudoers
사용자명 ALL=(root) NOPASSWD: /usr/local/libexec/linux-admin nginx-apply, /usr/local/libexec/linux-admin nginx-toggle, /usr/local/libexec/linux-admin nginx-backup, /usr/local/libexec/linux-admin nginx-backups, /usr/local/libexec/linux-admin nginx-restore-plan, /usr/local/libexec/linux-admin nginx-restore, /usr/local/libexec/linux-admin service
```

앱을 업데이트할 때는 검토한 helper도 다시 설치한다. 앱과 설치된 helper의 SHA-256이 다르면 관리자 작업을 차단하여 이전 helper가 새 작업 유형을 다르게 처리하지 않도록 한다.

인증서와 패키지 설치가 필요하면 각각 helper의 `certificate`, `install` 액션을 별도로 허용한다. 전체 shell, 임의 node 스크립트 또는 ALL 명령 권한을 추가하지 않는다. helper와 부모 디렉토리는 일반 사용자가 수정할 수 없어야 한다.

helper는 고정 액션과 입력 검증을 수행하며 nginx 설정/백업을 root 소유 경로로 관리한다. 일반 사용자 편집 가능한 JSON 백업은 root 복구에 사용하지 않는다. nginx/서비스/인증서 작업은 root 소유의 잠금으로 직렬화한다.

## 추가 검토할 옵션

- API 인증을 다중 사용자와 역할별 권한으로 확장
- 토큰 만료·회전, 세션 자동 잠금, 로그인 시도 제한
- 작업별 재인증과 승인 이력
- 감사 기록 보존 기간·내보내기·변조 검출
- 서비스/도메인/폴더별 허용 목록
- 운영 변경 시간대 제한과 백업 보존 정책
- Tauri polkit 인증, OS 키 저장소 연계

이 목록은 구현 계획이며 현재 기능으로 표시하지 않는다.

### Debian 설치 패키지의 helper

패키지 환경은 `/usr/lib/tastedev-linux/scripts/admin/linux-admin`을 사용한다. 모든 부모 경로와 실행 파일이 root 소유이고 일반 사용자에게 쓰기 권한이 없는지 확인하며 `admin-helper.sha256`과 실제 파일을 비교한다. 패키지 설치는 sudoers 권한을 자동으로 만들지 않는다. 전용 서비스 사용자는 `tastedev-linux`이다. 운영 관리 권한을 별도로 승인한 관리자는 해당 고정 helper의 검토한 작업만 sudoers에 허용해야 한다. 기존 소스 실행 환경의 `/usr/local/libexec/linux-admin` 경로는 유지된다.

### GUI에서 관리하는 sudo 규칙

보안 화면에서 허용 작업을 선택해 규칙을 미리 보고 다운로드할 수 있다. GUI 변경은 패키지 helper 경로를 사용하는 `/etc/sudoers.d/tastedev-linux-helper`의 기존 관리 규칙에 한정한다. 최초 등록은 서버 관리자가 생성한 내용을 확인하고 `visudo`로 검사하여 수행한다. GUI가 임의 sudoers 파일이나 전체 사용자 권한을 편집하지 않는다.

현재 규칙 조회에는 기존 OS의 `sudo-policy-inspect` 권한과 앱의 sudo 실행 옵션, 관리자 helper 서버 허용이 필요하다. 변경에는 기존 OS의 `sudo-policy-update` 권한 외에 `LINUX_ENABLE_ADMIN=true`, `LINUX_ENABLE_SUDO_POLICY=true`, 저장된 보안 옵션의 `sudoPolicyChanges=true`, `sudoWithoutPrompt=true`, `readOnly=false`가 필요하다. 새 서버 허용 설정과 새 보안 옵션은 기본적으로 꺼진다. 서비스 제어 권한만으로 sudo 규칙 변경을 허용하지 않는다.

현재 규칙을 조회한 뒤 변경 내용을 미리 보고 접근 권한 영향 확인 체크를 해야 적용할 수 있다. 다른 관리자가 규칙을 바꾸면 버전 검사로 변경 요청을 거부한다. 후보 규칙과 전체 sudo 정책을 검사하고 이전 규칙을 백업하며, 적용 검증에 실패하면 이전 규칙 복구를 시도한다. 적용 후 현재 규칙을 다시 조회해야 한다.

`PASSWD`로 바꾸거나 `sudo-policy-inspect` / `sudo-policy-update` 작업을 제거하면 웹에서 조회하거나 되돌리지 못할 수 있다. 서버 관리자의 별도 복구 접근을 확보해야 한다. 조회 결과는 이 앱의 관리 규칙을 설명하며, 다른 OS 규칙까지 포함한 실제 sudo 권한을 증명하지 않는다.

## 배포된 웹 터미널 사용

서비스의 실행 사용자는 설치 시 확인한 일반 Linux 계정입니다. 관리자 웹 로그인 계정과 OS 실행 계정은 서로 다릅니다. 터미널을 허용하려면 운영자가 `/etc/tastedev-linux/environment`에 `LINUX_ENABLE_TERMINAL=true`를 지정하고 서비스에 적용한 뒤, 보안 화면에서 조회 전용을 끄고 웹 터미널 명령 실행을 켜 저장합니다. 이 서버 허용 설정이 없으면 웹 스위치만으로는 켤 수 없습니다.

터미널은 대화형 PTY를 지원하며 해당 계정의 HOME과 사용자 실행 경로를 사용합니다. 기본 셸, Claude CLI, Codex CLI 선택은 터미널 설정에 있습니다. CLI 설치·인증이 완료되어 있어야 각 CLI를 실행할 수 있습니다. 실행 사용자와 기본 작업 경로는 설정 창에서 확인합니다. Linux 계정 비밀번호를 별도 웹 설정으로 저장하지 않습니다.

## 관리자 helper 작업 잠금

최신 helper는 `/var/lib/linux/admin/operation.lock`의 고정 private marker inode를 kernel flock으로 잠급니다. 파일의 존재는 실행 중 상태를 의미하지 않습니다. 활성 여부는 kernel descriptor lock으로 결정하며 helper가 종료되면 해제됩니다. 정상 marker 파일을 삭제하면 별도 inode에 이중 잠금이 생길 수 있으므로 삭제하지 않습니다. legacy empty 파일·unknown hardlink·기존 package operation lease는 임의로 삭제하지 않고 관리자가 백업/파일/서비스 상태를 검토해야 합니다. 강제 종료 자체는 설정 파일의 자동 rollback을 보증하지 않습니다.

### PostgreSQL HBA 중단 작업 복구

HBA 운영 적용은 백업과 원본/교체 파일의 버전·inode·소유권, 참조 graph, 검토한 서버 식별 정보를 root-private `postgresql-hba/transactions` write-ahead record에 fsync한 뒤 파일을 교체합니다. 중단 기록이 있으면 새 검토·적용을 막습니다. HBA 적용 창은 먼저 중단 상태를 조회하고, 기록이 있으면 **중단 작업 복구** 및 최종 확인을 표시합니다. 복구는 `databaseChanges`/readOnly/sudo/server 게이트와 같은 helper kernel lock을 거칩니다. 확인 없이 파일 복원이나 reload를 실행하지 않습니다.

현재 파일이 작업의 교체 inode와 draft SHA인 경우에만 원본 백업을 native 검수한 뒤 복원합니다. 이미 원본 byte와 소유권/권한으로 복원된 경우에는 다시 덮어쓰지 않고 서버 복구를 재시도합니다. 서버 OS identity 변경, 외부 파일 편집, 참조 파일 변경, 불명확한 journal·backup·staging file은 보존하며 수동 검토를 요구합니다. reload 실패 뒤에는 record를 남기며, 최종 original SHA/reference graph도 확인합니다. 정상 완료된 설정 작업 뒤 journal 정리 실패는 별도 경고로 보고하며, 정리 실패만으로 journal 없는 역변경을 시작하지 않습니다. native reload 요청은 rule load acceptance proof가 아니며 그 flag는 false를 유지합니다.

확인된 동일 private inode의 `.journal-init-UUID` 초기화 alias만 정리할 수 있습니다. unknown hardlink/symlink/private permission 위반은 거부합니다. 기존 legacy HBA lease와 다른 패키지의 중단 작업까지 이 record로 자동 복구했다고 판단하지 않습니다. 운영 서버의 실제 중단 시험과 root/systemd/runuser 전체 전송 E2E는 개발 fixture 증거로 대체하지 않습니다.

### 공통 설정 및 MariaDB graph 작업 잠금

설치된 root helper가 만든 immutable 내부 context와 root600 고정 marker의 FD/inode를 확인한 경우에만 공통 설정 transaction과 MariaDB graph는 기존 kernel operation lock을 재사용합니다. 같은 프로세스 중복 실행은 Set으로 거부하고 새로운 per-file/per-graph directory lease를 생성하지 않습니다. 따라서 helper SIGKILL 뒤 해당 새 디렉터리 잠금이 남지 않습니다. 실행 중 native 명령의 descriptor 보호는 기존 supervisor가 담당합니다.

context가 없는 직접 호출자는 기존 private filesystem lease를 유지하여 별도 프로세스 간 동시 호출을 계속 차단합니다. 잘못된 context에서 그 직접 모드로 fallback하지 않습니다. 이전 lease가 이미 존재하면 살아 있는 작업인지 추정하지 않고 보존하며409로 거부합니다. 이 변경은 공통 transaction/MariaDB/Node 서비스의 파일 교체 이후 자동 byte 복원 또는 transaction journal 복구를 제공한 증거가 아닙니다. HBA journal 복구 범위와 분리해서 평가합니다.

## 설정 중단 기록 복구 (현재 소스, 미배포)

Node.js 서비스, Redis, nginx 복구 조회는 인증된 세션과 sudo 조회 옵션을 요구한다. 복구 변경은 해당 serviceChanges/databaseChanges/nginxChanges 권한과 조회 전용 해제, 동일 origin, 최종 확인 및 새로 검토한 SHA를 요구한다. 기록이 없으면 파일이나 서비스를 변경하지 않는다. HTTP에서 임의 파일 경로, 계정, backupRoot 또는 실행 명령을 지정할 수 없다.

nginx 복구는 복원 팝업에서 지원되는 설정 파일을 선택해 조회한다. 선택 파일의 백업 원문을 복원하며, 다른 include 파일은 현재 내용으로 그래프와 후보를 검토한다. 조회 이후 include 내용·프로세스·prefix·관측 locale이 바뀌면 다시 검토해야 한다. locale은 관리자 확인이며 현재 libc 상태를 직접 증명하는 기능이 아니다. 전체 후보 검사와 운영 nginx -t 뒤 고정 nginx.service reload를 수행한다. 원본 복원 후 검사/재로드 실패는 중단 기록을 남긴다.

설치 helper의 커널 잠금이 검증된 경우 nginx/Redis graph lock은 새 디렉터리를 만들지 않는다. 기존 잠금 파일·디렉터리는 자동 삭제하지 않는다. 별도 직접 호출의 디렉터리 잠금은 계속 사용된다. 서비스가 중지되어 실행 main/identity를 입증할 수 없으면 자동 복구를 거부하고 현재 파일/기록을 보존한다.

MariaDB 중단 복구 조회는 main과 대상 파일을 고정 허용 경로에서 선택하며 복구는 databaseChanges 권한과 확인한 검토 SHA를 요구한다. 전체 private candidate tree의 변조를 native 검사 전후 확인하고 원본 복원 뒤 고정 MariaDB 서비스 재시작을 수행한다. default-main-assumed scope는 기본 검색 파일과 실행 환경을 모두 증명하지 않으며 기존 경고를 검토해야 한다. 실제 process identity가 확인되지 않거나 재시작/최종 검사에 실패하면 중단 기록을 보존한다.
