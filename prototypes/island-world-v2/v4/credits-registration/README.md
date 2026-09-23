# 2026-09-23 교사 등록 오류·출처 화면 수정

로컬 검증 완료: 후보 `ec5b3d8b9ae7`, 정적 파일 105개. 기준 게시본 `cceff03` / 자산 `1af4f73d23eb`. 앞선 로그인 안내 원복을 포함한다. 브랜치 `codex/credits-registration-20260923`에서 기존 미커밋 변경을 보존했다. 커밋·푸시·배포하지 않았다.

## 반영한 수정

- 새 교사 등록 직후 현재 사용자에 일반 로그인과 동일한 `th`를 전달한다. `V4Care`가 재로그인 없이 교사 전용 조치 기록을 조회·저장한다. `ns` 자체와 서버 저장 payload는 그대로이며 해시는 로그인 세션에서만 참조한다.
- 첨부 `조예은 추가.pdf`의 4쪽·83개 자료를 바탕으로 출처 화면을 ‘자료 형태 / 자료 설명 / 출처’로 정리했다. 그림 53개, 그림(3D) 19개, 소리 8개, 폰트 3개다.
- ‘출처 및 이용 조건’ 링크와 ‘유료 플랜으로 제작’ 문구를 제거했다. 파일명·용량은 표시하지 않는다. 좁은 화면에서는 출처가 자료 설명 아래에 표시된다.
- 음원 제작자·곡명, Twemoji 및 글꼴 저작자·라이선스 고지는 보존했다. PDF의 증명서 ‘확보’ 표시는 독립 검증 사실로 옮기지 않았다. 참고 PDF 원본 해시는 `reference.json`에 있다. PDF는 수정하지 않았다.
- 로그인 안내 ‘학생과 선생님 화면을 체험할 수 있어요.’를 유지했다.

## 실행

```sh
python3 prototypes/island-world-v2/v4/credits-registration/prepare.py
python3 prototypes/island-world-v2/v4/credits-registration/serve.py
```

안전한 로컬 주소: http://127.0.0.1:8797/ . Firebase SDK·초기화를 제거하고 CSP `connect-src 'none'`을 적용한 메모리 검증본이다. `candidate/index.html`은 직접 실행하지 않는다. 후보는 기존 `login-copy-20260923` 산출물을 사용하고 현재 root HTML 해시를 확인한 뒤 생성한다. 게시 승인이 주어지면 기존 `v4/release/install.py credits-registration-20260923` 절차로 적용할 수 있다. 적용 뒤 생성기를 다시 실행하지 않는다.

## 실제 브라우저 확인

- 1280×800에서 자료 형태 / 자료 설명 / 출처 3열 배치, 390×844에서 자료 설명 아래 출처 배치 확인. 표가 가로로 넘치지 않았고 83행, 외부 링크 0개, 삭제 요청 문구·파일명·용량 없음 확인.
- 3D 모델 출처 `Tripo`, 소리 제작자와 곡명, 글꼴 3종을 확인했다. 홈으로 돌아가기도 동작했다.
- 심사용 해제 → 가상 교사·학급 새로 생성 → 가상 학생 1명 추가를 조작했다. **재로그인 없이** ‘살펴봐 주세요’에 정상 빈 상태가 표시되며 직전 후보의 ‘조치 기록을 불러오지 못했어요’가 사라졌다.
- 이 신규 가상 학생은 일기가 없어 조치 대상 카드가 생성되지 않는다. 신규 세션의 조치 기록 저장·재조회는 아래 메모리 함수 검사로 확인했으며, 신규 계정 화면에서 실제 조치 버튼을 눌러 저장한 것으로 보고하지 않는다.
- 최종 후보에서 추가된 브라우저 오류는 없었다. 초기 작업 중 발생한 출처 화면 문법·로딩 순서 오류는 수정 후 다시 로드해 해소했다.

화면 캡처: `renders/credits-registration-20260923/credits-desktop.png`, `credits-mobile.png`, `new-teacher-care.png`.

## 코드·메모리 검사

```sh
node prototypes/island-world-v2/v4/credits-registration/check-registration.cjs
node prototypes/island-world-v2/v4/student-refinements/check-persistence.cjs credits-registration-20260923
```

- 기존 게시본의 실제 `createSchool`을 실행해 `teacher-required` 오류 재현 후, 수정 후보의 실제 등록·로그인 함수와 `V4Care`를 실행하여 새 교사 즉시 조회·저장, 재로그인 후 같은 기록 재조회 확인.
- 교사별 기록 분리, 명단 밖 학생 거부, 읽기·쓰기 실패 처리, 가입 실패 시 미로그인 확인. 비밀번호·세션 해시가 학급·계정 payload에 추가되지 않는지 확인.
- 일별 진행·개인 생각 복구, 계정·학급 분리, 선물·배치 보존, 실패 재시도 검사 통과.
- 정적 파일 105개 해시·전체 JS/인라인 문법 검사 통과. 원래 로그인·DB 관문 동일. 자산 변경은 `credits.js`와 새 `credits.css`뿐이며 원본 라이선스 파일을 포함한 다른 자산은 바이트 동일.
- 결과 영수증: `renders/releases/credits-registration-20260923/verification.json`.

## 미확인 범위

운영 Firebase·실제 학생 자료·실제 계정에는 접속하지 않았다. 운영 서버의 실제 저장/보안 규칙, 실제 휴대폰·크롬북·물리 터치·성능은 미확인이다. 좁은 화면 검수는 컴퓨터 브라우저 크기 변경으로 수행했다. 공개 사이트는 아직 이전 게시본이다.
