# 마음 바다 탐험대 작업 원칙

## 사용자와 협업

- 비개발자에게 실제 화면과 조작을 기준으로 쉬운 한국어로 설명한다. 최우선은 디자인 완성도다.
- 의견을 묻는 단계에서는 파일을 수정하지 않는다. 구현을 승인하면 합의한 범위만 수정한다.
- 승인된 결정을 DESIGN.md에 날짜와 함께 기록한다. 이전 결정과 충돌하면 무엇을 대체하는지 명시한다. 제안과 승인을 섞지 않는다.
- 결과는 실제 실행 화면과 수행한 검증으로 보여준다. 코드 확인/실제 조작 확인, 완료/미완료/미확인을 구분한다.

## 확정된 제품 구조

- 학생마다 독립된 내 섬 하나, 각 섬 안에 네 감정 구역. 캐릭터를 따라가는 작은 오픈월드다.
- 내 섬 안에 내 안으로 입구, 우리 반 게시판, 부두. 별도 광장은 최종 동선에서 제외한다.
- 내 섬 → 부두 승선 → 우리 반 바다 → 친구 선택·항해 → 친구 섬 입장·걷기·회전·공감 → 내 섬 복귀를 보존한다.
- 개인/친구 섬 풍경은 기록과 공개 설정에 따라 달라진다. 배경 장식과 학습 누적은 구분한다. 기존 비공개 경계·공감 규칙·게시판 익명화와 교사 검토·공개 조건을 보존한다.

## 안전과 작업 범위

- 시작할 때 Git 상태를 읽고 기존 미커밋 변경을 보존한다. 별도 작업 브랜치를 사용한다. 현재 V2 브랜치는 codex/island-world-v2.
- 강제 체크아웃, hard reset, clean, character-rework stash 복원을 하지 않는다. 임의 커밋·푸시·배포 금지.
- 운영 Firebase 접속/실제 학생 자료 조회·수정/시연 학급 재생성을 하지 않는다. 운영 데이터 변경과 배포는 사용자의 별도 승인 필요.
- 비밀번호·토큰을 출력하지 않는다. 패키지 설치·환경 이전·외부 모델 유료 API는 현재 승인 범위가 아니다.
- 로컬 실행은 검증한 Firebase 제거/메모리 DB 하네스로만 한다. 테스트라는 이름만으로 운영과 분리됐다고 가정하지 않는다.
- 새 시제품과 배포 연결 코드는 prototypes/island-world-v2/ 안에서 수정한다. 2026-09-17 사용자의 “커밋 푸시 고고” 승인으로 검증 후보 502991c9f22e의 index.html·island-v2/ 자산 적용과 커밋·푸시·기존 GitHub Pages 게시를 허용한다. 자세한 범위는 DESIGN.md 맨 앞 절을 따른다. 이는 운영 학생 자료 조회·변경이나 시연 재생성 승인이 아니다.
- 크롬북/실제 터치 기기는 확인 전까지 미확인으로 기록한다. 화면 캡처 성공을 성능 검증으로 대체하지 않는다.

## 문서와 실행 위치

- DESIGN.md: 설계와 승인 결정. 맨 앞 2026-09-17 V2 절이 충돌하는 과거 설계보다 우선한다.
- HANDOVER.md: 이전 구현 인수인계. 과거 브랜치/커밋/운영 시연 지시를 현재 실행 승인으로 해석하지 않는다.
- TEST.md: 기존 기능 검증 절차. 운영 접속을 요구하는 절차는 현재 로컬 범위에서 실행하지 않는다.
- ISLAND_WORLD_V2_BRIEF.md: 사용자 제공 설계 지시서. 현재 원본 /Users/kim/Downloads/ISLAND_WORLD_V2_BRIEF.md (저장소 루트에는 없음).
- prototypes/island-world-v2/README.md: 초보자 실행/종료와 1차 검증.
- prototypes/island-world-v2/COAST_REVIEW.md: 2026-09-17 해안/바다/조작 수정 및 실제 검증.
- prototypes/island-world-v2/EXPLORER_REVIEW.md: 같은 날 후속 탐험가/승선/잠수 구현과 실제 검증. DESIGN.md 맨 앞 후속 승인 절이 해안 단계 범위를 갱신한다.
- prototypes/island-world-v2/VISIT_REVIEW.md: 같은 날 친구 섬·로그인 첫 화면·화질 선택 검증. 기본 주소는 첫 화면이며, 컴퓨터만 확인한다. 실제 휴대폰·크롬북은 미확인.
- renders/harness/: 기존 메모리 DB 하네스와 무시된 캡처/검증 산출물.
- 안전한 실행: python3 prototypes/island-world-v2/build.py 후 python3 prototypes/island-world-v2/serve.py. 주소 http://127.0.0.1:8766/.
- 데이터·안전 검사: node prototypes/island-world-v2/check.cjs.
- 캐릭터·전환 검사: node prototypes/island-world-v2/check-passages.cjs. 브라우저 검증과 구분하는 메모리 단위 검사다.

- 친구 공개 경계·공감·인증 보존 검사: node prototypes/island-world-v2/check-social.cjs.

- prototypes/island-world-v2/RELEASE_REVIEW.md: 배포 후보의 계정별 저장·공개 경계·복구본 검증과 실제 배포 여부.
- prototypes/island-world-v2/release/README.md: 후보 생성/메모리 검증/로컬 적용/복귀 절차. 배포 후보 HTML을 직접 실행해 Firebase에 접속하지 않는다.
- 배포 연결 검증: python3 prototypes/island-world-v2/release/prepare.py → node prototypes/island-world-v2/release/check.cjs → python3 prototypes/island-world-v2/release/serve.py. 안전한 주소 http://127.0.0.1:8767/.
- renders/releases/island-v2-20260917/: 배포 후보/메모리 검증본/이전 정적 화면 zip/작업 전 백업. previous-static.zip은 화면·정적 파일 복구용이며 학생 DB 백업이 아니다.
- prototypes/island-world-v2/release/DEPLOYMENT.md: 이번 실제 게시 승인 범위와 이전 화면 재게시 절차. 운영 적용 뒤 기존 8766 생성기를 루트 index에 다시 실행하지 않는다. 안전한 8767 검증본은 기존 산출물을 serve.py로 실행한다.
