# V2 배포 준비와 안전한 확인

**후속 실제 게시 승인:** 사용자의 “커밋 푸시 고고”에 따라 후보 502991c9f22e의 운영 파일 적용과 게시를 진행한다. [게시·복구 절차](DEPLOYMENT.md)가 최신이며, 아래는 준비 단계 기록이다. 운영 적용 뒤 기존 8767 검증본을 열려면 serve.py만 실행한다. prepare.py는 준비 시점의 index를 요구하므로 다시 실행하지 않는다.

2026-09-17. 현재는 로컬 검증까지 완료했고 실제 게시하지 않았다. 전체 결과는 ../RELEASE_REVIEW.md를 읽는다.

## 사용자가 열 화면

http://127.0.0.1:8767/ — 이 컴퓨터에서만 열린다. ‘탐험 시작하기’는 가상 학생 A, ‘로그인’은 A/B/기록 없는 학생 또는 선생님을 선택한다. 실제 계정은 입력하지 않는다. 새로고침하면 연습 기록이 사라진다. 기존 시제품 8766도 보존했다.

서버가 꺼졌으면 저장소 폴더에서 다음을 실행한다. 패키지 설치가 필요 없다.

```sh
python3 prototypes/island-world-v2/release/prepare.py
node prototypes/island-world-v2/release/check.cjs
python3 prototypes/island-world-v2/release/serve.py
```

종료는 서버 터미널의 Control+C. 후보 생성에는 이번 작업 전 백업 renders/releases/island-v2-20260917/before-work/index.html과 기존 메모리 하네스가 필요하다. 루트 index가 백업과 다르면 생성기는 멈춘다. 이후 운영 적용 뒤에는 새 기준 버전을 검토하여 생성 절차를 갱신해야 한다.

## 산출물

renders/releases/island-v2-20260917/ 아래:

- candidate/: 실제 기존 로그인과 저장에 연결되는 배포 후보. **현재 로컬 검사에서 직접 열거나 웹 서버로 제공하지 않는다.**
- memory-preview/: 후보에서 Firebase SDK·설정·초기화를 제거한 검증본. serve.py는 이것만 127.0.0.1에 제공한다.
- previous/, previous-static.zip: 기존 화면과 정적 자산. 학생 DB 백업은 아니다.
- candidate-static.zip, manifest.json: 후보 묶음, 버전·변경 파일 해시.
- before-work/: 작업 시작 때의 소스·문서 백업. 기존 미커밋 변경 보존용.
- restore-rehearsal/: 적용·복귀 시험용 폴더. 운영 루트가 아니다.

## 연결 코드와 보존 범위

prepare.py는 원래 AppMain의 화면 연결만 바꾼다. integrated-app.js는 로그인한 학생 id·학교 코드·원래 활동 진입 함수를 받는다. account-view.js는 내 요약과 같은 학급 친구의 공개 요약을 읽는다. custom-growth.js는 직접 입력한 마음 말도 풍경에 배치한다. local-fixtures.js는 메모리 검증본에만 들어간다.

기존 인증·분석·저장·익명 공개 규칙은 유지한다. 발견한 기존 감정 수정 완료 안내 오류는 후보의 표시 상태만 보완했다. 학습 데이터 이전은 없다.

## 검증 명령

```sh
node prototypes/island-world-v2/release/check.cjs
node prototypes/island-world-v2/check.cjs
node prototypes/island-world-v2/check-passages.cjs
node prototypes/island-world-v2/check-social.cjs
```

코드 검증과 실제 화면 확인 범위는 ../RELEASE_REVIEW.md에 구분했다. 운영 DB를 실행하는 검사는 없다.

## 실제 게시 승인 후 적용·복귀

아래 명령은 **설명용이며 이번에는 운영 루트에 실행하지 않았다.** index.html과 해당 버전 자산만 적용하며, 알려지지 않은 수정이 있으면 멈춘다. 스스로 커밋·푸시·배포하거나 DB를 바꾸지 않는다.

```sh
python3 prototypes/island-world-v2/release/install.py
```

로컬에서 이전 화면으로 복귀:

```sh
python3 prototypes/island-world-v2/release/install.py --rollback
```

실제 사이트를 복귀하려면 이전 화면을 다시 게시해야 한다. Git 기록을 강제로 되감거나 학생 자료를 되돌리지 않는다. 새 버전 자산은 삭제하지 않아 브라우저가 이전 파일을 요청해도 깨지지 않게 한다.

시험 폴더만 대상으로 적용/복귀하는 옵션은 --rehearsal이다. previous/index.html을 restore-rehearsal/index.html에 복사한 뒤 --rehearsal, --rehearsal --rollback 순서로 검증했다. 추가 수정이 있는 시험 파일의 덮어쓰기 거부도 확인했다.
