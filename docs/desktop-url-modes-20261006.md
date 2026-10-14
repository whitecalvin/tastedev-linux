# Tauri 서버 주소 구분 (2026-10-06)

개발 Next.js 스크립트는 8787, 설치 서비스는 8791에서 실행한다. Tauri 개발 URL을 8787로 변경하고 설치 빌드에서는 `custom-protocol` Cargo feature를 활성화하여 `frontendDist`의 8791을 선택한다.

근거는 설치된 tauri-build 2.7.1의 `is_dev` / cfg(dev) 처리와 tauri-codegen의 개발 URL 선택 경로다. 기본 Cargo check와 custom-protocol Cargo check 모두 성공했다. 이는 컴파일과 설정 선택 근거이며 데스크톱 창 실제 실행·설치 GUI 확인을 대신하지 않는다. DEB 생성·검증·설치는 수행하지 않았다.

명령:

```sh
npm run dev
npm run desktop:start
```

설치용 빌드 스크립트는 custom-protocol feature를 사용한다. 설치 서비스와 별도로 웹 서버가 먼저 실행돼 있어야 한다.
