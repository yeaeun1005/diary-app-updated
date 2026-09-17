# V2 게시·복구 절차 — 2026-09-17

사용자가 “커밋 푸시 고고”라고 승인했다. 검토한 후보 502991c9f22e를 기존 마음바다탐험대.kr에 게시하는 데 필요한 커밋·푸시를 허용한다. 기존 학습 저장 구조·공개 조건은 유지하며 운영 Firebase 조회, 실제 학생 자료 변경, 시연 학급 재생성은 하지 않는다.

## 게시 대상

- 저장소: https://github.com/yeaeun1005/diary-app-updated
- 작업 브랜치: codex/island-world-v2. 기존 main에서 이어지는 커밋을 강제 옵션 없이 main에 푸시한다.
- 실행 파일: 검증한 index.html과 island-v2/502991c9f22e/의 새 화면 자산.
- 개발 원본·검사·결정 기록: prototypes/island-world-v2/, AGENTS.md, DESIGN.md의 이번 결정 절. 기존 DESIGN.md의 별도 한 줄 수정과 HANDOVER.md 수정은 이번 커밋에서 제외하고 작업 폴더에 보존한다.
- renders/의 가상 DB·캡처·백업·압축본은 기존 규칙대로 커밋하지 않는다. 패키지 설치나 DB 이전은 없다.

게시 성공은 해당 커밋의 GitHub Pages 작업 성공과 공개 사이트의 HTML·신규 자산 해시로 확인한다. 이 확인은 정적 파일 다운로드만 하며 운영 앱의 스크립트를 실행하거나 로그인하지 않는다. 게시 후 실제 계정 사용과 실기기 성능은 사용자 확인 대상이다.

## 이전 화면으로 복귀

복구 기준 커밋: **347e610e6af3ad94f19c41834932ac3731428e04**.

해당 버전의 index.html 내용은 이번 작업 전 원본이며, 기존 이미지·폰트·사운드는 이번에 바꾸지 않는다. 새 버전 자산은 버전별 경로로 추가한다. 따라서 이전 index.html을 새 복구 커밋으로 다시 게시하면 이전 화면으로 돌아간다. 강제 reset·강제 push·학생 자료 복원은 필요하지 않다. 이후 추가 작업이 있으면 전체 커밋을 무작정 되돌리지 않고 화면 파일과 필요한 자산을 검토한다.

현재 컴퓨터에는 renders/releases/island-v2-20260917/previous-static.zip과 before-work/도 보존한다. install.py --rollback은 이 백업에서 로컬 index.html만 복원하며 Git 커밋·푸시는 하지 않는다. 새로운 미검토 index 변경이 있으면 덮어쓰기를 거부한다. 학생 DB 백업이나 학생 기록 복원 도구가 아니다.

## 이후 로컬 확인

기존 메모리 검증본: http://127.0.0.1:8767/ . 서버가 꺼졌다면 아래 명령만 실행한다.

```sh
python3 prototypes/island-world-v2/release/serve.py
node prototypes/island-world-v2/release/check.cjs
```

과거 build.py와 release/prepare.py는 최초 기반 index를 입력으로 한 생성기다. 운영 적용 후 루트 index로 재생성하지 않는다. 다음 구현에서 새 기준 버전과 안전한 메모리 생성 절차를 함께 갱신한다. 이번 게시에서는 검증한 후보를 그대로 적용한다.

미확인: 실제 휴대폰·크롬북 성능, 운영 계정의 실제 저장. 로컬 검증 범위는 ../RELEASE_REVIEW.md에 기록돼 있다.
