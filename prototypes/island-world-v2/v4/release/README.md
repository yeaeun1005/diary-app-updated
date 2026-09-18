# V4 게시 — 2026-09-19

사용자의 “오케이 배포해줘”에 따른 기존 GitHub Pages 게시 작업이다. 내 마음섬·우리 반 바다·친구 섬과 승인된 나무/책/망원경/게시판 사본을 포함한다. 원화만 있는 소품을 모델로 처리하지 않았다.

## 배포 연결

- 기존 인증·DB 관문·일기 저장·공개 요약·공감·교사 처리 보존. Three r147과 기존 정적 GLB 로더 사용.
- V4 탐험·보상 상태는 로그인한 학생의 `app/d2/<id>/_mindIslandV4`에 저장한다. 일기 목록은 기존처럼 `e`로 시작하는 자식만 읽는다. 원문 일기와 학습 응답을 섞지 않는다.
- 트랜잭션으로 최신 상태에 이벤트를 적용하여 두 기기의 보상 선택을 하나로 유지한다. 학교 코드가 다르거나 상태 형식이 잘못되면 초기화해 덮어쓰지 않고 오류를 알린다.
- Firebase가 빈 배열/객체를 생략하고 소수점이 든 일기 시각을 키로 허용하지 않는 문제를 피하도록 상태를 JSON 문자열로 보관한다. 실제 전송 키와 사용자 계정 경계는 기존 DB 관문 아래에 둔다.
- `MEM_ONLY` 체험·시연 계정의 새 상태는 세션 메모리만 사용한다. 새 모델 서비스/API·DB 규칙 변경·학생 자료 이전은 없다.
- 원화/GLB의 사용자 제공 출처·수령일·사본 수정 이력은 `asset-provenance.json`에 보존한다. 실제 생성 날짜·Tripo 개별 계정의 사용 조건은 이전 기록처럼 미확인으로 명시했다.

트랜잭션의 충돌 재시도와 빈 초기 캐시는 [Firebase 공식 문서](https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions)에 맞췄다.

## 검사

`python3 prototypes/island-world-v2/v4/release/prepare.py`는 현재 게시본을 덮어쓰지 않고 `renders/releases/mind-island-v4-20260919/`에 후보와 Firebase를 제거한 검증본을 만든다. 기준은 이전 게시 커밋 `6e694fefe3d6b87da12982db3ec1e0550cffae64`다.

```sh
node prototypes/island-world-v2/v4/release/check.cjs
python3 prototypes/island-world-v2/v4/release/serve.py
```

확인 화면은 `http://127.0.0.1:8776/`. CSP `connect-src 'none'`, Firebase SDK/설정/초기화가 제거된 메모리 DB다. 기존 로컬 가상 검증 자료를 재사용한다. 운영 시연 학급을 재생성하지 않는다. 실제 배포 후보 HTML은 로컬에서 실행하지 않는다.

코드/메모리 검사 통과: 인증과 기존 일기 처리 보존, 파일/문법/자산 경로, 이전 소스·모델 보호, 두 독립 클라이언트 충돌 재시도, 단일 보상, 새 실행 환경 상태 복원, 계정·학교 분리, 읽기/쓰기 실패와 잘못된 스키마 보호, 체험의 DB 호출 0건, 일기 목록에 메타데이터 미포함.

실제 브라우저 검증: 학생 A 진입 → 책상에서 가상 이야기 선택 → 관찰대에서 선택/피드백 저장 → 정원 등불 획득·책상 옆 배치 → 로그아웃 → 같은 학생 재진입 → 완료 단계와 선택한 등불/배치 복원. 기존 일기·공개·공감·친구 귀환 동작은 앞선 V4 검수와 보존 검사를 함께 적용했다.

학교 실기기, 운영 계정 실제 저장, 실제 Firebase 트랜잭션 충돌은 실행하지 않았으며 미확인이다. 이번 검증은 운영 DB를 조회하거나 수정하지 않았다.

## 게시와 복구

`install.py`는 검수 manifest에 있는 index와 버전별 자산만 로컬 루트에 복사한다. 미검토 index 변경이 있으면 거부한다. 이후 해당 파일과 배포 연결 소스만 선택적으로 커밋하고 기존 `origin/main`에 일반 푸시한다. 강제 옵션은 사용하지 않는다.

GitHub Pages 해당 커밋 작업 성공과 공개 HTML/새 자산 SHA-256으로 게시를 확인한다. 이 확인은 정적 다운로드만 하며 운영 앱 실행·로그인·학생 조회를 하지 않는다. 최종 게시 증거는 로컬 `renders/releases/mind-island-v4-20260919/deployment-result.json`에 남긴다.

복구 기준은 이전 커밋 `6e694fefe3d6b87da12982db3ec1e0550cffae64`의 `index.html`이다. 이전 `island-v2/502991c9f22e/` 파일은 그대로 남는다. 필요하면 이전 index를 새 커밋으로 다시 게시한다. `previous-static.zip`과 `before-work/index.html`은 정적 화면 복구본이며 학생 DB 백업이 아니다. 새 V4 메타데이터는 이전 화면에서 무시되므로 DB를 삭제하거나 되돌릴 필요가 없다.
