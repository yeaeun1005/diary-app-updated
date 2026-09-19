# 학생 활동·꾸미기 후속 게시 — 2026-09-19

사용자의 “오케이 배포해줘” 승인으로 학생 활동 화면(대화·연습·달력·리포트), 소품 6종, 두 정원 안의 위치·회전·보관 기능을 기존 GitHub Pages에 게시한다. 운영 학생 자료 조회/변경과 시연 재생성은 포함하지 않는다.

검수 후보 버전: `cc85b475f8e3`. 이전 게시 커밋: `e92499fe29841a31012e64b52b5170308a4161fa`, 이전 자산 경로: `island-v4/95a253b916de/`.

## 게시 전 확인

- 배포 파일 46개(HTML 1개 + 버전 자산 45개), 총 10,936,101바이트. 새 활동/꾸미기 모듈·CSS·소품 전달 파일 6종 포함.
- 기존 HTML의 모든 인라인 스크립트, 인증/DB 관문/일기 저장과 공개 요약 코드 동일. 디버그 query는 배포본에서 비활성화한다. 원본 GLB·로컬 검수 자료·운영 데이터는 게시하지 않는다.
- 기존 계정별 `_mindIslandV4` JSON 상태에 배치 필드를 추가하고 기존 트랜잭션을 사용한다. 이전 보상/준비된 자리를 읽으며 강제 이전·초기화는 하지 않는다. 두 클라이언트의 겹치는 배치, 동시 보관/임시 글, 실패 시 상태 보존, 계정/학급 분리, 이전 보상 1회 선택 검사를 통과했다.
- Firebase SDK/초기화를 제거하고 CSP `connect-src 'none'`을 적용한 8777 검증본에서 실제 조작 확인: 학생 A 로그인 → 벤치 배치·45° 회전 저장 → 새 달력과 기존 일기 2편 확인 → 로그아웃 → A 재로그인 → 좌표/45° 복원 → B 로그인 → 배치 0개. 콘솔 오류/경고 없음.
- `check-decor.cjs`, `check-activities.cjs`, 배포 후보 `release/check.cjs` 통과. 실제 운영 계정 저장과 학교 기기 확인은 수행하지 않았다.

## 재생성·검증·로컬 적용

```sh
python3 prototypes/island-world-v2/v4/release/prepare-decor.py
node prototypes/island-world-v2/v4/release/check.cjs mind-island-v4-decor-20260919
python3 prototypes/island-world-v2/v4/release/serve.py mind-island-v4-decor-20260919 8777
```

브라우저는 `http://127.0.0.1:8777/` 메모리 검증본만 연다. `candidate/index.html`을 실행하면 안 된다. 검사 후 `install.py mind-island-v4-decor-20260919`로 manifest의 파일만 적용하며 index는 마지막에 복사한다. 기존 버전 자산은 그대로 남긴다. 커밋에는 이번 구현·정적 파일·배포 연결 파일만 선택적으로 포함한다.

`renders/releases/mind-island-v4-decor-20260919/`에는 이전 index, 정적 복구 zip, 보호 파일 해시, 후보/메모리 검증본/manifest를 보관한다. 이는 학생 DB 백업이 아니다. 복귀가 필요하면 이전 커밋의 index를 새 커밋으로 다시 게시한다. DB를 삭제하거나 되돌릴 필요가 없다.

최종 게시 성공은 대상 커밋의 GitHub Pages 작업 성공과 공개 파일 46개의 SHA-256 일치로 확인한다. 결과는 같은 로컬 폴더의 `deployment-result.json`에 기록한다. 정적 다운로드만 하며 운영 앱을 실행하거나 학생 자료에 접근하지 않는다.
