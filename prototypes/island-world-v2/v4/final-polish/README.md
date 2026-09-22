# 2026-09-22 마지막 화면 수정

사용자 승인: 21개 수정 목록 + “하고 배포”. 공개 예시는 모든 가상 친구에게 추가하라는 후속 답변을 따랐다. 승인 범위는 DECISION.md, 효과음 검색어와 폰트 비교는 SOUND_FONT_RESEARCH.md에 기록했다.

## 후보

- 기준 커밋: 882815a / 이전 정적 후보: 7a8468f313e6
- 최종 후보: db4aca2e5a1b / 정적 파일 91개
- 안전한 브라우저 주소: http://127.0.0.1:8793/ (Firebase 제거, connect-src none, 메모리 DB)
- 산출물: renders/releases/final-polish-20260922/
- 원래 미커밋 변경 백업: renders/final-polish-20260922/pre-existing.patch
- previous-static.zip은 화면 복구본이며 학생 DB 백업이 아니다.

## 실제 화면에서 확인

Codex in-app 브라우저에서 1280×800, 390×844 화면 크기로 확인했다. 실제 휴대폰이나 크롬북 검증이 아니다.

- 로그인 문구, 섬 안내의 어두운 주변과 장소 강조, 문장 줄바꿈, 활동 메뉴 강조.
- 오늘의 탐험 시작 → 목적지로 걸어가기 → 나무 책상 도착 → 일기 작성·저장. 최근 일기 증가 및 분석 표시.
- 일기·감정 분석·마음 대화의 활동별 사용법. 분석 확인 버튼과 다섯 질문의 번호 표시.
- 게시판으로 걷기 → 질문 읽기 → 내 답 쓰기 안내 → 감정 선택·저장 → 익명 친구 답 표시.
- 내 섬 부두 승선 → 우리 반 바다 → 이름만 보이는 친구 선택 → 고래에게 항해.
- 친구 공개 일기 6편, 동일 크기·모델의 섬, 걷기, 개인 분석 장소에서는 비공개 안내, 부두 승선 → 바다 → 내 섬 복귀.
- 작은 화면에서 튜토리얼 1·2단계의 화면 내 배치와 어두운 마스크. 임시 뷰포트 설정은 복구했다.
- 마지막 후보에서 브라우저 콘솔 오류 0건.

로컬 검수 버튼은 메모리 미리보기에만 있다. 배포 파일에는 검수 스크립트와 쿼리 진입을 넣지 않는다. 화면 확인 중 저장한 일기·게시판 답은 모두 메모리 자료다.

## 코드·회귀 검사

아래 모두 통과했다.

```sh
node prototypes/island-world-v2/v4/final-polish/check.cjs
node prototypes/island-world-v2/v4/final-polish/check-review.cjs
node prototypes/island-world-v2/v4/final-polish/check-land.cjs
node prototypes/island-world-v2/v4/student-refinements/check-persistence.cjs final-polish-20260922
node prototypes/island-world-v2/v4/social-upgrade/check-sharing.cjs
```

- 정적 파일 해시·스크립트 문법·Firebase 제거 확인, 기존 인증/자료 경계.
- 가상 학생 25명, 공개 예시 150편, 학생·교사 같은 메모리 학급, 운영 읽기/쓰기 0회.
- 중간 버튼 입력 함수의 회전/해제/일반 클릭 이동 방지, 7개 목적지 경로, 기존 장식 위치 29,644개 호환.
- 저장 재시도·계정/학급 경계·기존 선물, 공개 취소·실패 원자성·공감 규칙.

휠 버튼을 누른 실제 물리적 드래그는 브라우저 제어 도구가 지원하지 않아 미확인이다. 입력 함수 검사는 통과했다. 실제 기기 성능 및 실제 운영 계정 로그인은 검사하지 않았다.

## 아직 적용하지 않은 것

새 외부 효과음은 선택 전이므로 설치하지 않았다. 사이트/검색어만 추천하고 기존 재생을 유지했다. 폰트 비교는 제안이며 글꼴 교체는 하지 않았다. 사용자가 나중으로 지정한 개인정보·저작권 안내 재편도 보류했다.

## 배포

사용자의 배포 지시에 따라 검증한 정적 파일만 기존 GitHub Pages에 게시한다. 운영 앱 실행이나 DB 접속 없이 공개 정적 응답의 해시와 Pages 작업 결과로 확인한다. 최종 결과 영수증: renders/releases/final-polish-20260922/deployment-result.json.

```sh
python3 prototypes/island-world-v2/v4/release/install.py final-polish-20260922
python3 prototypes/island-world-v2/v4/final-polish/verify-public.py
```

운영 적용 후 prepare.py를 다시 실행하지 않는다. 안전한 미리보기는 기존 memory-preview를 serve.py로 실행한다.
