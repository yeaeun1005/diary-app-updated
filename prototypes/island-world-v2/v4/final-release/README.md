# 2026-09-22 최종 점검·배포

사용자가 앞선 18개 수정의 배포와 자율 버그 수정을 승인하고 Twinkle/Sparkle MP3를 제공했다. 브랜치 `codex/final-release-20260922`. 기존 공개 커밋 `0745ab8` / 후보 `1877d3db2428`에서 시작한다. 최종 검증 후보 `1af4f73d23eb`, 정적 파일 104개.

## 반영한 수정

- 이전 `review-polish`의 글꼴·문구·친구 첫 사용법·공개 일기 공감·이동 표시·교사 대화 예시·동의서·출처 화면 수정 전체.
- 공개 일기와 마음 식물에서 공감 전송 성공 시 제공 음원을 원래 속도로 재생(음량 0.22). 약 2.04초. 실패·중복이면 재생하지 않으며 음소거를 존중한다. 원본 바이트와 출처는 `ASSETS.json`.
- 공개 일기 창을 닫으면 친구 섬의 공감 상태를 다시 읽는다. 기록 읽기 실패를 빈 목록으로 처리하지 않는다. 실제 전송이 성공한 뒤 재조회만 실패한 경우 성공 표시를 유지한다. 연속 클릭 잠금을 추가했다.
- 학생이 먼저 입력하거나 클릭한 뒤 지연된 자동 안내가 초점을 빼앗지 않는다. 저장으로 화면이 다시 만들어져도 안내가 갑자기 재등장하지 않는다. 수동 ‘사용법 보기’는 유지한다.
- TOP 10에서 분석용 어간을 기존 분석기가 아는 감정 이름으로 표시하고 한 일기의 같은 감정을 중복 합산하지 않는다. 일기 원문·분석 점수·직접 고른 이름은 변경하지 않는다.
- 배포 자산 메타데이터에서 제작자 컴퓨터의 절대 경로를 파일명으로 바꾼다. 원본 출처와 해시는 보존한다.

## 실제 브라우저 검수

Firebase SDK/초기화 제거, CSP `connect-src 'none'`인 로컬 메모리본만 실행했다. 주소 http://127.0.0.1:8795/ . 운영 학생 자료에는 접근하지 않았다.

- 내 섬 → 부두 걷기/승선 → 우리 반 바다 → 고래 선택/항해 → 공개 일기 → 공감 전송 → 홈 → 내 섬 이어가기.
- HTMLAudio의 실제 `playing`/`ended` 이벤트, MP3 준비 상태 4·오류 없음, 길이 2.037531초 확인. 두 번째 공감은 음소거에서 성공하며 추가 오디오 재생이 없었다. 같은 감정의 다른 일기 버튼도 함께 비활성화됨.
- 가상 일기 저장 후 14편에서 15편으로 증가, 문장 전체와 ‘뿌듯·감사’ 반영, 자동 안내가 나타나지 않음. 수동 사용법 정상 표시.
- 분석 화면에 저장한 일기 연결. 최종 후보에서 ‘부끄러’와 ‘보람찼’이 별도 항목으로 남지 않고 기존 감정 이름으로 정리됨.
- 앞선 단계의 좁은 창·1920×1080, 친구 첫 안내·교사 화면·PDF 검수 기록은 `../review-polish/README.md`.

화면 자료: `renders/review-polish-20260922/final-empathy-sound.jpg`, `final-diary-save.jpg`. 실제 휴대폰/크롬북/물리 터치/다른 OS/최소 성능은 미확인이다.

## 코드·메모리 검사

```sh
node prototypes/island-world-v2/v4/review-polish/check.cjs
node prototypes/island-world-v2/v4/review-polish/check-review.cjs
node prototypes/island-world-v2/v4/review-polish/check-land.cjs
node prototypes/island-world-v2/v4/review-polish/check-empathy.cjs
node prototypes/island-world-v2/v4/social-upgrade/check-sharing.cjs
node prototypes/island-world-v2/v4/student-refinements/check-persistence.cjs review-polish-20260922
node prototypes/island-world-v2/v4/final-release/check-audio.cjs
node prototypes/island-world-v2/v4/final-release/check-empathy.cjs
node prototypes/island-world-v2/v4/final-release/check-guides.cjs
node prototypes/island-world-v2/v4/final-release/check-chart.cjs
```

공개 철회·학급 경계·인증·기존 기록·선물/배치·실패 재시도 검사가 통과했다. 가상 25명/공개 예시 150편, 운영 DB 참조 0회. 지형 29,644개 배치·목적지 7곳 경로 보존. 후속 변경마다 관련 검사와 최종 해시·문법·안전 검사를 다시 수행했다.

## 인터넷이 없는 경우

| 실행 방법 | 현재 가능한 범위 |
|---|---|
| 공개 웹사이트의 실제 학급 | 실제 서버의 로그인·조회·저장·친구/교사 공유에는 인터넷이 필요. 영구 오프라인 저장과 나중 동기화 기능 없음 |
| 이미 열어 둔 심사용 가상 학급 | 메모리 자료로 체험. 아직 받지 않은 자산 로딩이나 새로고침 이후 재접속은 브라우저 캐시에 의존하므로 웹사이트 자체의 오프라인 작동을 보장하지 않음 |
| 별도 제출 준비 폴더 | React/3D/그림/폰트/음원과 가상 생성기를 함께 넣고 Firebase를 제거함. 외부 연결 차단 상태의 로컬 실행은 확인. USB file 주소 직접 실행은 브라우저 도구 제한으로 미확인 |

제출 준비 폴더의 자료는 가상 예시이며 실제 학생 자료 사본이 아니다. 새로고침하면 체험 입력이 초기화된다. 실제 학생의 오프라인 기록 보존이 필요하다면 별도 저장·재접속 동기화 설계와 검증이 필요하다. 이번에는 해당 기능을 새로 추가하지 않았다.

최신 준비 폴더: `renders/review-polish-20260922/submission-preparation-1af4f73d23eb/`. 자산 258개, 실행/소스 331개 파일 일치. 보고서·실제 연구 원자료·권리 증빙 미비가 남은 준비본이며 최종 출품본으로 표시하지 않는다.

## 게시와 복구

후보 생성 후 `python3 prototypes/island-world-v2/v4/release/install.py review-polish-20260922`로 검증된 정적 파일만 적용한다. 설치 뒤 `prepare.py`를 다시 실행하지 않는다. 기존 root 기준 해시가 바뀌면 설치를 거절한다.

이번 파일만 선택 커밋하고 기존 origin/main에 일반 푸시한다. 기존 미커밋 문서와 다른 untracked 자산은 제외한다. 공개 앱을 실행하지 않고 GitHub Pages 작업 결과와 정적 응답 104개의 SHA-256만 확인한다. 검사: `python3 prototypes/island-world-v2/v4/final-release/verify-public.py`.

영수증: `renders/releases/review-polish-20260922/deployment-result.json`. 게시 완료 여부는 영수증을 기준으로 한다. `previous-static.zip`은 이전 정적 화면의 복구용이고 학생 데이터 백업은 아니다. 기존 버전 경로를 삭제하지 않는다.
