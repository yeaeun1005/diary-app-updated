# 3D 모델 6종 · 섬/정원 확대 · 튜토리얼 — 2026-09-20

사용자가 전달한 실제 GLB를 적용하고, 후속 요청의 섬/정원 확대와 이전 느낌의 튜토리얼을 구현했다. 마지막 메시지에서 배포를 명시했다. 기존 작업을 보존한 `codex/island-six-models-20260920` 브랜치에서 진행했다.

## 적용

| 파일 | 쓰이는 곳 | 앱 안 크기 |
|---|---|---|
| pastel shell chair | 마음 대화하기 · 기존 벤치 대체 | 높이 1.98 |
| compass | 탐험연습하기 · 기존 간단한 책상 대체 | 너비 1.45 |
| treasure chest | 탐험 일지보기 · 기존 상자 대체 | 너비 1.15 |
| wooden swing | 기본 소품 ‘별빛 그네’ | 너비 2.30 |
| lighthouse | 기본 소품 ‘작은 등대’ | 높이 2.40 |
| wooden boat planter | 기본 소품 ‘꽃배 화분’ | 너비 2.10 |

기본 소품은 6개에서 9개가 된다. 새 소품도 기존 배치/45도 회전/보관/저장 흐름을 사용하며 각각 하나씩이다. 퀘스트 보상과 기존 배치는 보존한다. 활동 장소의 제목과 기능은 그대로이며 접근하면 새 모델에 기존 흰 윤곽이 적용된다. 대화/연습/일지의 도착점을 충돌 경계 바깥으로 소폭 조정했다. 모델을 못 불러올 때는 기존 활동 대체 모형 또는 새 소품의 간단한 대체 모형이 남는다.

Downloads 원본은 수정하지 않았다. `source/`에 동일 바이트 사본을 보관한다. `intake.py`는 원본 형상/UV/노멀/재질/노드/애니메이션을 바꾸지 않고 2048 텍스처만 1024로 줄인다. 실제 GLB 6개 모두 외부 URI와 추가 디코더가 없다. 런타임 파일은 `assets/models/*-data.js`, 사본의 근거는 `manifest.json`이다.

## 섬과 정원

- 섬 반경 X 23 → 25.3, Z 19 → 20.9: 가로·세로 10% 확대. 기존 장소·산책길·부두는 유지하고 바깥 풀밭과 해안을 넓혔다. 바다 미니어처에도 같은 지형과 해안 범위를 쓴다.
- 여섯 정원의 중심은 유지하고 각 기본 범위를 넓혔다. 정원 크기를 임의로 편집하는 별도 기능은 추가하지 않았다. 사용자에게 선택지를 묻고 응답 전 독립 작업을 진행한 뒤, 기본 공간 확대를 가정한다고 알렸다.
- 사각 구역 면적 확대: 나무 곁 +49.3%, 산책길 곁 +50.9%, 큰 나무 뒤뜰 +57.9%, 바다 정원 +69.7%, 노을빛 +51.6%, 남쪽 소풍 +63.6%. 실제 놓을 수 있는 부분은 계속 길/물/고정물/다른 소품을 제외한다.

## 튜토리얼

기존 `TutorialOverlay`의 나무 말풍선과 빛나는 테두리를 재사용한다. 처음에는 ‘같이 둘러보기 / 먼저 놀러 갈래요’를 선택한다. 걷기 → 책상 → 다섯 마음 활동 → 꾸미기 → 부두 → 시작 준비, 총 6단계다. 조금 걸으면 다음 단계로 넘어가고, 이동이 어려워도 ‘다음’을 누를 수 있다. 언제든 끝내고 ‘섬 사용법’ 또는 설정에서 다시 볼 수 있다.

장소를 설명할 때 카메라만 해당 장소로 이동하며 캐릭터를 강제로 이동하거나 개인 일기를 쓰지 않는다. 안내 중 활동 창의 우발적 실행을 막고 걷기 단계에서는 이동 입력을 허용한다. 종료/건너뛰기 때 이동과 카메라 안내를 정리한다. 안내 확인 여부는 학교/학생별 이 브라우저의 localStorage에만 저장하며 비활성 저장소도 처리한다. DB/보상/일기 상태를 바꾸지 않는다.

## 검증과 한계

- `check.cjs`: 후보 전체 구문/해시/메모리 미리보기 격리, 기존 인증/익명 규칙 보존. 확대된 구역의 허용 배치 29,644개가 실제 지형과 곡선 길을 침범하지 않음. 기본 소품 9종 동시 배치 통과.
- `check-models.cjs`: 실제 배송용 r147 GLTFLoader로 모델 6개를 파싱하고 캐시/접지/스케일/모든 회전에서 충돌 반경 검사. Node에서는 이미지 디코딩을 대체했으므로 이를 시각 검증으로 보지 않는다. 실제 V4 저장 모듈로 새 소품 저장/다시 열기/보관/실패 복원/계정 분리/기존 벤치 유지 검사.
- `check-land.cjs`: 이전의 유효 배치 13,480개가 모두 계속 허용됨. 보수적인 고정물 충돌 경계로도 모든 상호작용 접근 경로 존재. Three.js 미니어처 25개 생성과 좌표/색상 검사 통과.
- `check-tutorial.cjs`: 실제 컴포넌트의 첫 안내/걷기 자동 진행/수동 다음/종료 중복 방지/정리/다시 보기/학생별 확인 상태 검사. React 훅 메모리 검사이며 브라우저 클릭 검사가 아니다.
- `check-integration.cjs`: 실제 앱 인증 함수와 가상 학급으로 학생/친구/교사 연결, 일기 공개/철회, 응원 글 저장/중복 제한 검사. 운영 DB 참조 0회.
- 설치된 Blender로 **제공된 실제 모델의 앱용 GLB**를 렌더링해 정면 방향/재질/모양을 육안 확인했다. `renders/six-models-20260920/*.png`. 앱 화면 캡처가 아닌 모델 자체의 오프라인 렌더다.
- 브라우저 도구는 초기 연결 및 리셋 후에도 `failed to write kernel assets: No such file or directory`로 실패했다. **이번 앱 화면 클릭/튜토리얼 실제 화면 배치/모바일·크롬북·터치/실제 성능은 미확인**이다. 과거 캡처를 이번 검증으로 쓰지 않았다.

## 빌드와 실행

```sh
python3 prototypes/island-world-v2/v4/model-upgrade/intake.py
python3 prototypes/island-world-v2/v4/model-upgrade/prepare.py
node prototypes/island-world-v2/v4/model-upgrade/check.cjs
node prototypes/island-world-v2/v4/model-upgrade/check-models.cjs
node prototypes/island-world-v2/v4/model-upgrade/check-land.cjs
node prototypes/island-world-v2/v4/model-upgrade/check-tutorial.cjs
node prototypes/island-world-v2/v4/model-upgrade/check-integration.cjs
python3 prototypes/island-world-v2/v4/release/serve.py six-models-20260920 8784
```

미리보기 http://127.0.0.1:8784/ 는 Firebase를 제거하고 connect-src를 차단했다. candidate/index.html은 운영 연결 코드가 있어 직접 실행하지 않는다. 적용 후 루트 index를 되돌리거나 생성기를 다시 실행하지 않는다. `previous-static.zip`은 정적 파일 백업이며 DB 백업이 아니다.

최종 후보: `02192a6ab4f5`, 정적 파일 79개. `release/install.py six-models-20260920` 적용 후 관련 파일만 선택 커밋·일반 푸시한다. `verify-public.py`로 GitHub Pages 작업과 공개 정적 파일 해시를 확인한다. 운영 앱 JavaScript나 DB는 실행하지 않는다.
