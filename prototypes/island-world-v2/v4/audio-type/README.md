# 효과음과 본문 글꼴, 첫 화면 대상 표시 — 2026-09-22

사용자 제공 MP3 4개 연결, 튜토리얼 제목 `1.` 형식, 제목 메이플스토리/본문 Pretendard 분리, 후속 요청 `초등 1-6학년, 국어, 도덕` 표시와 배포. 승인 문서는 DECISION.md. 기준 커밋 684227b, 후보 1877d3db2428, 정적 파일 99개.

## 변경

- Magic Button Click: 첫 화면 로그인하고 시작하기 (0.18)
- Computer Mouse Click: 로그인 버튼과 Enter 제출 (0.28)
- Turn a Page: 섬/활동 튜토리얼 다음 (0.22)
- Water Splash: 부두 출항과 바다에서 친구 섬/내 섬으로 출발 (0.18)
- 원본 MP3 그대로, 재생 속도 1배. 음소거 상태에서는 효과음을 만들거나 재생하지 않는다. 새 효과음끼리는 이전 소리를 멈추고 재생한다. 끄기를 누르면 재생 중인 소리도 멈춘다.
- Pretendard 공식 v1.3.9 원본 가변 WOFF2 자체 제공. 라이선스 원문 포함. 다운로드·원본 해시는 ASSETS.json에 기록. 패키지 설치 없음.
- 일기·안내·입력칸·분석·게시판·개인정보/저작권 본문 Pretendard. 큰 제목·주요 게임 버튼 메이플스토리 유지.
- 첫 화면 오른쪽 위 대상/교과 문구. 1050px 이하에서는 제목 위에 여백을 둔다.
- 출처 화면과 CREDITS.md에 이번 추가 자산만 기록. 기존 개인정보 본문/저작권 화면 전면 재편은 이번 범위 밖.

## 검증

Firebase SDK/초기화 제거, CSP connect-src none, 기존 메모리 DB 미리보기에서 확인했다. 주소 http://127.0.0.1:8794/ . 새 소리 관찰 스크립트는 이 로컬 미리보기에만 있다.

- 실제 브라우저에서 시작·로그인·튜토리얼 다음의 HTMLAudio playing/ended 이벤트, MP3 4개 디코딩 준비 상태와 오류 없음.
- 튜토리얼 1. 날짜를 확인해요 / 2. 여기에 일기를 써요 및 줄바꿈, 제목 700 메이플스토리/본문 400 Pretendard 계산 스타일 확인.
- 390×844 입력칸과 말풍선이 화면 안에 들어옴. 첫 화면 대상 문구·개인정보 본문 가로 넘침 없음.
- 1280×800 첫 화면 대상 문구와 제목의 영역 겹침 없음.
- 부두에서 바다로 출항, 바다에서 내 섬 복귀의 물소리 playing/ended 이벤트 확인. 소리 끄기 후 모든 오디오 paused, 마지막 브라우저 오류 0건.
- 개인정보 본문 Pretendard 16px, 새 효과음 4개와 Pretendard의 출처 표시 확인.

검사 명령:

```sh
node prototypes/island-world-v2/v4/audio-type/check.cjs
node prototypes/island-world-v2/v4/audio-type/check-audio.cjs
```

정적 해시·문법·메모리 격리·기존 인증/자료 경계 통과. 효과음 기본 음소거/다른 소리 전환/반복 클릭/끄기/원본 해시·폰트 서명/튜토리얼 번호 검사 통과. 실제 휴대폰·크롬북은 미확인이며 음향 장비별 체감 음량을 보장하지 않는다.

## 배포와 복구

```sh
python3 prototypes/island-world-v2/v4/audio-type/prepare.py
python3 prototypes/island-world-v2/v4/release/install.py audio-type-20260922
python3 prototypes/island-world-v2/v4/audio-type/verify-public.py
```

운영 적용 후 prepare.py를 다시 실행하지 않는다. 미리보기는 기존 memory-preview를 serve.py로 실행한다. 기존 미커밋 변경을 제외하고 이번 파일만 선택 커밋·origin/main 일반 푸시한다. 공개 정적 응답과 GitHub Pages 결과만 확인하며 운영 앱이나 DB는 실행하지 않는다. 영수증: renders/releases/audio-type-20260922/deployment-result.json. previous-static.zip은 이전 정적 화면 복구본이며 학생 DB 백업이 아니다.
