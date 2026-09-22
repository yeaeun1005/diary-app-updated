후속 최종 점검·배포는 `../final-release/README.md`를 따른다. 아래는 이전 로컬 검토 단계의 기록이다.

# 2026-09-22 화면 수정과 심사 준비

사용자 18개 요청의 로컬 검토본. 브랜치 `codex/review-polish-20260922`, 기준 `0745ab8` / 기존 공개 후보 `1877d3db2428`, 이번 최종 후보 `4013b7988c43`(정적 파일 103개). 운영 사이트에 게시하지 않았다.

## 열기와 종료

- 검토 주소: http://127.0.0.1:8795/
- 이미 생성한 안전한 검토본 실행: `python3 prototypes/island-world-v2/v4/review-polish/serve.py`
- 종료: 서버를 실행한 터미널에서 Ctrl+C.
- `candidate/index.html`은 운영 연결 코드를 보존하는 배포 후보이므로 직접 실행하지 않는다. 서버는 Firebase SDK/초기화 제거 및 `connect-src 'none'`인 memory-preview만 허용한다.
- 새로고침하면 가상 학급 체험 입력이 초기화된다. 기존 운영 기록과 관계없다.

## 반영 내용

| 요청 | 반영 |
|---|---|
| 1~4 | Pretendard 본문 500, 전체 일기 선택 강조, 튜토리얼 핵심어 볼드, “그네, 등대, 꽃배 등을 놓을 수 있어요.” |
| 5 | 친구 섬 첫 방문 4단계 안내와 설정에서 다시 보기 |
| 6 | `CONTEST_REVIEW.md`에 효과음 검색어 추천. 새 음원은 선택 전이라 추가하지 않음 |
| 7 | 친구 공개 일기의 감정별 공감 버튼·선택 응원 글. 전송 직전 공개 상태 재조회, 기존 경험/하루 중복 제한 유지 |
| 8 | 허용된 클릭 이동 지점에 민트색 원이 0.8초간 나타났다가 사라짐. 회전 드래그·장식 배치에는 표시하지 않음 |
| 9~10 | 내 섬 이어가기 글자 9px 왼쪽, 두 탐험 버튼의 겹친 아래 그림자 제거 |
| 11~12 | 학교·기간·문의처 안내 문장 가운데점 정리, 교사 관찰 카드에 대화 시작 예시 |
| 13~15 | 저작권 화면에서 도구/이론 소개와 사용 위치 설명 제거, 3D 모델 19개와 자산 원본 출처 추가 |
| 16 | 보호자 동의서 Pretendard, 짧고 직접적인 문장. 1쪽 PDF 렌더 검수 |
| 17 | 첨부 요강 검토, 체험 예시 날짜의 가상 자료 표시. 실제 제출 마감 9월 23일 반영 |
| 18 | 제출 준비 폴더·257개 자산 목록·출처·실제 연구자료 정리 양식. 실제 연구자료/증빙 미제공 부분은 미완료 |

Tripo 제작 당시 유료 플랜은 사용자 확인을 받았다. 결제 내역과 원본 모델 증빙 파일을 확보했다고 표시하지 않았다.

## 실제 화면 확인

Codex 컴퓨터 브라우저의 작은 창과 1920×1080 화면에서 확인했다. 이후 기본 크기로 복원했다.

- 본문 Pretendard 500, 튜토리얼 강조어 750, 전체 일기 선택 700과 테두리.
- 내 섬 → 부두 → 바다 → 고래의 섬 항해 → 친구 첫 방문 안내.
- 친구 공개 일기에서 공감과 응원 글 전송 성공, 별 표시, 같은 감정의 ‘오늘 공감했어요’ 비활성 상태.
- 이동 클릭의 민트 원형 표시와 캐릭터 이동, 탐험 버튼의 아래 선 제거.
- 홈 이어가기 위치, 저작권 목록, 교사 ‘살펴봐 주세요’의 대화 예시, 동의서 링크와 PDF 1쪽.
- 브라우저 오류 로그 없음.

화면 자료: `renders/review-polish-20260922/`의 `friend-tutorial.jpg`, `diary-empathy.jpg`, `home-1920.jpg`, `teacher-conversation.jpg`, `quest-button.jpg`, `tap-ring-final.jpg`, `consent-1.png`.

## 코드·메모리 검사

통과한 검사:

```sh
node prototypes/island-world-v2/v4/review-polish/check.cjs
node prototypes/island-world-v2/v4/review-polish/check-review.cjs
node prototypes/island-world-v2/v4/review-polish/check-land.cjs
node prototypes/island-world-v2/v4/review-polish/check-empathy.cjs
node prototypes/island-world-v2/v4/social-upgrade/check-sharing.cjs
node prototypes/island-world-v2/v4/student-refinements/check-persistence.cjs review-polish-20260922
```

공개 철회/수정 시 공감 차단, 읽기 실패 때 전송 차단, 인증/공개 경계, 기존 꾸미기와 기록, 세 가지 완료 조건을 확인했다. 가상 25명/공개 예시 150편에서 운영 DB 참조 0회. 기존 배치 29,644개와 목적지 7곳 경로, 트랜잭션 재시도 16회 검사 통과. 마지막 출처 문구·원형 색 조정 후 최종 후보의 문법·파일 해시·안전 검사도 다시 통과했다.

## 제출 준비 결과와 남은 일

최신 폴더: `renders/review-polish-20260922/submission-preparation-4013b7988c43/`

- `document`: 요강 검토, 서식 5 작성용 자산 목록, 연구자료 정리표, 증빙 확인표, 화면 사진 2개(1024×768 이상), 확보된 고지.
- `media`: 그림 53개, 3D 19개, 소리 7개, 글꼴 파일 178개. 글꼴 파일 수에는 분할 웹폰트가 포함된다.
- `program`: Firebase 없는 메모리 실행본, 디버그 경로 제거. 제작자 컴퓨터의 절대 경로를 자산 메타데이터에서 제거했다.
- `source/runtime`: 실행본 330개 파일과 해시 일치. 정적 HTML 참조 경로 누락 없음.

이 폴더는 최종 제출본이 아니다. 실제 보고서·원자료·동의 확인서·미확인 자산의 사용권 증빙은 `EVIDENCE_CHECKLIST.md`에 남겼다. 기존 운영 자료를 가져오거나 삭제하지 않았다. USB 파일 직접 열기는 브라우저 도구의 file 주소 제한으로 미확인이다. 실제 Windows/Linux, 최신 Edge/Chrome/Safari, 크롬북/휴대폰/물리 터치, 최소 성능은 미확인이다.

재생성은 `prepare.py` 다음 `prepare-submission.py` 순서다. 동의서 폰트 재생성이 필요할 때는 시스템 Python의 `prepare-consent-fonts.py` 다음 reportlab이 있는 문서 런타임의 `teacher-upgrade/make-consent.py`를 사용한다. 패키지 설치·운영 데이터 변경·커밋·푸시·배포는 이번 작업에서 하지 않았다.
