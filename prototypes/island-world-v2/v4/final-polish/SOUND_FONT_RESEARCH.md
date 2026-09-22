# 효과음과 폰트 제안 — 2026-09-22

새 음원과 글꼴은 아직 교체하지 않았다. 아래는 공식 사이트를 확인해 고른 검색 출발점이며 개별 음원의 청취를 마친 최종 선정 목록은 아니다.

## 효과음

추천 순서: **Pixabay → Mixkit → Freesound**. 첨부 출처 예시에서 보인 사이트는 Freesound다. 예전에 추천했던 사이트가 무엇인지는 이번 대화만으로 확인되지 않으므로 Mixkit을 추가 추천한다.

| 장면 | 원하는 느낌 | 영어 검색어 | 길이 제안 |
|---|---|---|---|
| 첫 화면 ‘로그인하고 시작하기’ | 작은 물방울 뒤에 맑은 빛이 나는 소리 | `soft bubble pop`, `magic chime short`, `cute game start` | 0.5~1초 |
| 로그인 버튼 | 부드러운 확인음. 실패에도 성공 팡파르처럼 들리지 않는 소리 | `soft ui confirm`, `wooden button click`, `gentle interface click` | 0.15~0.4초 |
| 튜토리얼 ‘다음’ | 종이나 책장이 살짝 넘어가는 소리 | `soft page turn`, `page turn chime`, `soft ui swipe` | 0.2~0.5초 |
| 배를 타고 출발 | 작은 물살과 짧은 출항 느낌 | `small boat water`, `rowing splash`, `gentle water splash` | 0.8~1.5초 |

선택 방향은 **물방울 → 짧은 확인음 → 책장 소리 → 물살**이다. 매번 같은 전환음을 빠르게 재생하는 현재 방식보다 각 행동을 구별하기 쉽다. 긴 종소리·큰 엔진·경적은 작은 섬 분위기와 맞지 않아 우선순위를 낮춘다. 길이와 느낌은 디자인 판단이며 측정이나 청취 결과가 아니다.

- [Pixabay UI pop 검색](https://pixabay.com/sound-effects/search/ui-pop/): 짧은 버튼 반응 후보.
- [Pixabay boat water 검색](https://pixabay.com/sound-effects/search/boat%20water/): 배 출발 후보.
- [Mixkit Interface](https://mixkit.co/free-sound-effects/interface/): `Page turn chime`, `Game user interface tone` 등이 목록에 있다. 제목은 검색 출발점이며 이번에 듣고 채택한 것은 아니다.
- [Mixkit Boat](https://mixkit.co/free-sound-effects/boat/): 자연스러운 물살 후보.
- [Freesound 검색](https://freesound.org/): 위 영어 검색어와 CC0 또는 CC BY 필터를 사용한다.

[Pixabay 이용 조건](https://pixabay.com/service/license-summary/)은 무료 사용·수정·일반적인 출처표기 생략을 허용하지만 음원 자체의 단독 재배포 등은 제한한다. [Mixkit](https://mixkit.co/license/)에서는 선택한 효과음에 적용되는 라이선스를 확인한다. [Freesound FAQ](https://freesound.org/help/faq/)는 음원마다 다른 라이선스가 붙는다고 설명한다. CC BY는 제작자와 라이선스 출처를 남겨야 하므로 실제 다운로드한 음원의 원본 페이지와 이용 조건을 함께 기록한다.

## 폰트

추천 조합: **큰 게임 제목은 메이플스토리 Bold, 긴 본문은 Pretendard Regular/Medium**. 차선 후보는 SUIT다. 현재 본문·보조설명·버튼까지 굵기가 비슷해 ‘어디를 먼저 읽을지’ 구분이 약하다. 글꼴 전체를 바꾸는 것보다 제목과 본문의 역할을 나누는 편이 현재 섬 분위기를 보존하기 좋다. 이 평가는 화면 디자인 판단이며 초등학생 대상 실험으로 입증된 결과는 아니다.

| 후보 | 어울리는 곳 | 판단 |
|---|---|---|
| 메이플스토리 | 큰 제목, 짧은 장소 이름, 주요 게임 버튼 | 현재 그림과 자연스럽게 이어짐. 긴 안내문 전체를 굵게 쓰면 읽기 순서가 약해짐 |
| Pretendard | 개인정보·저작권 안내, 입력칸, 긴 일기, 그래프 설명 | 단정한 본문 후보. 공식적으로 9가지 굵기와 가변 글꼴을 제공하므로 제목·본문 계층을 만들기 쉬움 |
| SUIT | 긴 안내문, 설정, 교사 화면 | 차분한 UI 본문 후보. 같은 문단을 나란히 놓고 Pretendard와 선택할 만함 |

권장 시안 수치: 본문 17~18px/굵기 400~500/줄높이 1.75~1.9, 보조설명 15~16px, 제목 22~26px/700. 휴대폰은 본문 16~17px부터 확인한다. 읽기 영역과 입력 영역은 색·여백·제목으로 함께 구분한다. 이 수치는 이번 앱에 대한 시작 제안이며 접근성 규격의 최소값이라고 주장하지 않는다.

- [메이플스토리 공식 서체](https://maplestory.nexon.com/Media/Font): 임베딩 시 저작권 안내 포함, 출처 표기 권장 및 수정/배포 조건을 확인할 수 있다.
- [Pretendard 공식 저장소](https://github.com/orioncactus/pretendard), [SIL OFL 원문](https://github.com/orioncactus/pretendard/blob/main/LICENSE).
- [SUIT 공식 저장소](https://github.com/sunn-us/SUIT): 글꼴 특징과 라이선스 원문을 확인할 곳.

## 최종 정리 때 적용할 출처 안내

사용자가 지금은 보류한 항목이다. 화면에는 실제 사용한 음원·글꼴·이미지·3D 자산만 ‘사용 위치 / 자산 이름 / 제작자 / 원본 링크 / 라이선스’ 형식으로 정리한다. 사용 도구 목록과 배경 이론·연구 소개는 제외한다. 필수 저작권·라이선스 고지는 유지한다. 개인정보 안내의 사실관계·보관기간 등은 출처 안내 축소에 섞어 지우지 않는다.

예시: `튜토리얼 전환음 — [음원 제목] / [제작자] / [원본 링크] / [해당 음원 라이선스]`. 실제로 쓰지 않은 음원을 출처 목록에 미리 넣지 않는다.
