# 일반 서비스 전환 · 2026-11-12

사용자가 심사 종료 후 심사용 부분을 일반 배포용으로 전환하고 자동 배포하도록 승인했다. 기준 커밋 cea2caa, 후보 dba851648de6. 기존 GitHub Pages와 계정별 Firebase 저장 구조를 유지한다.

## 변경

- 로그인은 학생/선생님 모두 빈 입력칸으로 시작한다. 심사용 체크박스, 과거 judge 설정, 자동 입력, 가상 학급 생성기와 3개 review 자산을 제거했다.
- 임시 메모리 DB 오버레이·체험 페이지·시연 띠를 제거했다. 일반 계정의 기존 인증·개인 기록·교사 조치·학급 공개 경계와 실제 날짜를 유지한다.
- DEMO01 학생은 조회 전에, 해당 학교의 교사는 자격 확인 후 계정 설정·명단 조회·마이그레이션 전에 차단한다. 운영 DB의 옛 시연 자료는 접근하거나 삭제하지 않는다.
- 공개 #dev 진입을 비활성화했다. 학습용 가상 이야기, 활동 예시, 사용법, 콘텐츠 출처는 교육 기능이므로 보존한다.
- 가입 초기 저장이 실패하면 성공 화면을 열지 않는다. 자격 생성 후 중단된 계정은 다시 로그인할 때 빠진 공개 학교명만 복구하며 기존 명단은 덮어쓰지 않는다.
- 신규 학교 생성 후 로그인 모달을 닫고 다음 인증 화면을 초기화하여, 로그아웃 시 등록창이 다시 뜨던 문제를 수정했다.

## 검증

`python3 prototypes/island-world-v2/v4/production-transition/prepare.py`는 버전 후보와 Firebase 제거 메모리 사본을 만든다. 실제 서비스 후보를 브라우저로 실행하지 않는다.

- `node prototypes/island-world-v2/v4/production-transition/run-suite.cjs`: 일반 기능 회귀 15/15.
- `node prototypes/island-world-v2/v4/production-transition/check-accounts.cjs`: 실제 계정 함수·일기 저장/재로그인·날짜 전환·조치 기록·예약 시연 계정 차단·초기 저장 실패/복구·기존 명단 보존.
- `python3 prototypes/island-world-v2/v4/production-transition/check-static.py`: 정적 파일 102개 해시, 로컬 상대 참조 242개, 문법 68개, 심사 자산 제외와 검증본 외부 연결 차단.
- 실제 로컬 UI: 교사 등록 → 학생 등록 → 일반 학생 로그인 → 빈 기록/오늘 날짜 → 일기·분석·5문항 대화 → 완료 보상 진입. 최종 후보에서는 신규 등록·로그아웃 후 정상 홈 복귀, #dev&seed 새로고침 후 일반 로그인도 확인했다. 브라우저 오류 0개.

실제 학생 자료/운영 Firebase, 물리 기기·크롬북·터치는 미확인이다. 과거 제출 폴더와 ZIP은 기록 보관본으로 변경하지 않는다. 모든 검증 산출물은 renders/releases/production-transition-20261112 및 renders/production-transition-20261112에 보관한다.

배포는 검증 manifest의 파일만 release/install.py로 적용하고 선택 커밋을 기존 origin/main에 일반 푸시한다. verify-public.py가 해당 커밋의 Pages 작업 성공 및 공개 정적 파일 102개 바이트를 확인한다. 배포 영수증은 renders/releases/production-transition-20261112/deployment-result.json이다.
