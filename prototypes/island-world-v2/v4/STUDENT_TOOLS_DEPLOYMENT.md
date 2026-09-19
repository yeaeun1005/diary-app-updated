# 학생 기능 복원 게시 — 2026-09-19

사용자가 복원 후 자동 배포를 명시적으로 요청했다. 이번 승인 범위는 학생 기능 복원과 승인된 첫 화면의 정적 파일 게시이며, 운영 데이터 조회/변경은 포함하지 않는다.

- 기준 게시 커밋: `5a431bdfbbd9170c3d7231b8d69885295205b4f8`
- 후보: `5927450af326`
- 변경 자산 경로: `island-v4/5927450af326/`
- 결과/manifest/정적 복구본: `renders/releases/mind-island-student-tools-20260919/`
- 실제 조작과 검사: `STUDENT_TOOLS_REVIEW.md`

## 준비 및 로컬 확인

기준 게시본이 루트에 있는 상태에서 `python3 prototypes/island-world-v2/v4/release/prepare-student-tools.py`로 준비한다. 이미 적용한 뒤에는 후보를 다시 만들려고 루트를 강제로 되돌리지 않는다. 기존 생성본에 `node prototypes/island-world-v2/v4/release/check.cjs mind-island-student-tools-20260919`를 사용한다.

안전한 미리보기만 `python3 prototypes/island-world-v2/v4/release/serve.py mind-island-student-tools-20260919 8780`으로 실행한다. candidate HTML을 로컬 실행하지 않는다.

검증 뒤 `python3 prototypes/island-world-v2/v4/release/install.py mind-island-student-tools-20260919`가 자산을 먼저 복사하고 index를 마지막으로 적용한다. 이번 manifest의 파일과 관련 소스·기록만 선택해 커밋하고 기존 main으로 일반 fast-forward 푸시한다. 기존 다른 미커밋 작업은 제외한다.

## 공개 파일 확인

`python3 prototypes/island-world-v2/v4/release/verify-student-tools.py`는 HEAD 커밋의 GitHub Pages 성공 여부와 공개된 정적 58개 파일의 SHA-256 일치를 확인하고 `deployment-result.json`을 남긴다. 운영 앱의 JavaScript를 실행하거나 DB에 접속하지 않는다.

## 되돌리기

이전 정적 파일은 `previous-static.zip`에 있다. 학생 DB 백업이 아니다. 필요 시 별도 사용자 지시에 따라 이전 index를 복원해 일반 커밋·푸시로 다시 게시한다. 기존 버전 자산은 삭제하지 않아 이전 index가 참조하는 경로를 보존한다. 강제 푸시나 DB 복구는 하지 않는다.

게시 상태: 검증한 후보 적용 및 Pages 확인 진행 중. 최종 상태는 위 배포 영수증을 따른다.
