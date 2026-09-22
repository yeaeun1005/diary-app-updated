# 출처와 라이선스

DESIGN §4 "참고와 모방의 선"에 따라, 외부에서 가져온 자료는 여기에 적는다. 음원도 아래 "음원" 표에 적는다.

**앱 안의 "출처와 저작권" 페이지**(첫 화면 꼬리, `index.html`의 `CREDITS`·`CreditsPage`, 2026-09-17)는 이 문서와 같은 내용이어야 한다. 한쪽을 고치면 다른 쪽도 고친다. 페이지 문구는 초안이다(사용자가 고른 뒤 확정).

## 서체

| 서체 | 만든 곳 | 쓰는 곳 | 라이선스 | 파일 |
|---|---|---|---|---|
| 메이플스토리 서체 (Light · Bold) | 넥슨 (NEXON) | 첫 화면 제목·부제·표지판, 로그인 창, 3D 섬 팻말(「내 안으로」「바다로」「우리 반으로」) | 넥슨이 무료 배포. 개인·기업 누구나 상업적 이용 허용, 글꼴 자체를 팔거나 고쳐서 배포하는 것은 금지. 눈누(noonnu.cc/font_page/427) 기준 "상업적 용도 모두 사용 가능" | `fonts/maplestory-*.woff2` — 원본 OTF를 글자 범위별 woff2로 자른 것(fonttools). 글꼴 수정이 아니라 웹 전송용 서브셋이다. 2026-09-10 |
| Jua(주아) | 우아한형제들 | 제목 글자(일기·대시보드 등) | SIL Open Font License 1.1. Google Fonts에서 불러온다. 출처 표기는 권장(의무 아님) | (외부) |
| Gowun Dodum(고운돋움) | 류양희 (Yanghee Ryu) | 본문 글자 | SIL Open Font License 1.1. Google Fonts에서 불러온다. (2026-09-17 전에는 만든 곳을 "고운"으로 잘못 적었다) | (외부) |

메이플스토리 서체 조건(넥슨 안내, 2026-09-17 확인): 개인·기업 무료, 상업적 이용 가능, **글꼴을 수정·편집하지 말고 배포된 형태 그대로**, 글꼴 자체 판매 금지, 다른 소프트웨어에 묶거나 임베드할 때는 저작권 표시 포함, **출처 표기 권장**("이 페이지에는 메이플스토리에서 제공한 메이플스토리 서체가 적용되어 있습니다"). 글자 범위별 woff2 서브셋(`fonts/`)은 글리프를 고치지 않은 웹 전송용 조각이지만 "수정·편집 금지"에 걸리는지는 넥슨이 명시하지 않았다 — 알고 있는 회색 지대(2026-09-17).


## 그림

| 자료 | 출처 | 비고 |
|---|---|---|
| `banner.webp` | 첫 화면 배경 | 제작 ChatGPT(생성 도구) · 2026-09-12 |
| `title.webp` | 첫 화면 제목 | 제작 ChatGPT(생성 도구) · 2026-09-15(여백 잘라 1431×269, 2026-09-12 판은 `title_old.webp`) |
| `panel.webp` | 로그인 창 배경(나무판 틀) | 제작 ChatGPT(생성 도구) · 2026-09-12 |
| `sign-login.webp` · `sign-guest.webp` | 첫 화면 표지판(로그인·체험, 글자는 그림 안에) | 제작 ChatGPT(생성 도구) · 2026-09-13 |
| `intro/isle-*.webp` · `intro/zoom-*.webp` | 첫 화면 아래 소개 섹션의 섬 그림과 네 영역 확대 | 이 앱의 3D 섬을 헤드리스 크롬으로 찍은 것(renders/harness/shootIsle.js · shootIntro.js) · 시연 학급 가상 데이터 · 2026-09-10 · 2026-09-13 |
| `emo_*.svg` (14개) | 일기 화면의 감정 얼굴 | **Twemoji** (Twitter, Inc. and other contributors) 그래픽, **CC BY 4.0** — 출처 표기 의무. 2026-07-29 추가. 2026-09-17 확인(36×36 viewBox·색 #FFCC4D 등 Twemoji 원본과 일치) |
| `clownfish.png` `jellyfish.png` `heart.png` `conch.png` `submarine.png` `starfish.png` `octopus.png` `diver.png` `deep_dive.png` `shark.png` `periscope.png` `pearl_shell.png` `manta.png` (+ 안 쓰는 `whale.png` `graph.png` `treasure_map.png`) | 화면 곳곳의 120×120 아이콘 | **출처 미상.** 2026-04-21 첫 판("Add files via upload")부터 있었고 기록이 없다. 만든 곳을 확인해 적거나 바꿔야 한다(2026-09-17) |

ChatGPT로 만든 그림: OpenAI 이용약관상 결과물의 권리는 만든 사람에게 있으나, 생성 도구 결과물의 저작권 인정 여부는 나라마다 다르다(한국은 사람이 만든 부분만). 앱 전체의 ©는 코드·글·화면 구성에 대한 것이고, 그림은 "생성 도구로 만들었다"고 밝힌다.


## 음원

`sounds/` 의 mp3 셋. 앱은 기본 음소거이고 3D 화면의 "소리" 버튼으로 켠다. CC0 등 라이선스가 명확한 것만 쓴다. 셋 다 Pixabay(Pixabay Content License — 출처 표기 의무 없음, 상업적 이용 가능, 음원 자체를 되팔거나 재배포하는 것은 금지). 2026-09-17 기록.

| 파일 | 쓰임 | 길이 | 원본 이름 | 만든 사람 | 출처 URL | 라이선스 | 손본 것 |
|---|---|---|---|---|---|---|---|
| `sounds/piano_loop.mp3` | 배경음. 내 섬·친구 섬·바다·광장에서 루프(음량 0.30) | 56초 | Musical Peaceful Piano Loop (ID 6903) | Pixabay | https://pixabay.com/sound-effects/musical-peaceful-piano-loop-6903/ | Pixabay Content License | — |
| `sounds/step.mp3` | 발걸음. 걷는 동안 루프, 멈추면 끔(음량 1.0) | 11초 | Nature Footstep Grass Leaf (ID 38778) | Pixabay | https://pixabay.com/sound-effects/nature-footstep-grass-leaf-38778/ | Pixabay Content License | — |
| `sounds/woosh.mp3` | 화면 전환. 잠수·광장·바다로 갈 때 한 번(음량 0.10) | 1.5초 | Film Special Effects Soft Luxury Air Whoosh 5 (ID 592509) | Pixabay | https://pixabay.com/sound-effects/film-special-effects-soft-luxury-air-whoosh-5-592509/ | Pixabay Content License | — |

## 라이브러리

| 이름 | 판 | 라이선스 | 어디 |
|---|---|---|---|
| React · ReactDOM | 18.3.1 | MIT (Meta Platforms, Inc.) | `index.html`에 인라인 |
| Three.js | r147 (UMD) | MIT (Three.js Authors) | `index.html`에 인라인(학교망 CDN 차단 대비) |
| Firebase JavaScript SDK (app · database, compat) | 10.12.2 | Apache License 2.0 (Google LLC) | gstatic CDN |
| Google Fonts | — | 서비스 | Jua · Gowun Dodum |

## 이론적 근거

저작권 문제는 아니지만 출처를 밝힌다(앱의 출처 페이지 "기대고 있는 연구").

- Radloff, L. S. (1977). The CES-D Scale: A self-report depression scale for research in the general population. *Applied Psychological Measurement, 1*(3), 385–401. — 「살펴봐주세요」 키워드(`CESD_KEYWORDS`)의 근거. 척도를 시행하는 것이 아니라 낱말 고르기의 참고.
- Russell, J. A. (1980). A circumplex model of affect. *Journal of Personality and Social Psychology, 39*(6), 1161–1178. — 마음 말 28가지(`EMOTIONS_28`)의 기운·긴장 좌표.
- Rosenberg, M. B. (2003). *Nonviolent Communication: A Language of Life* (2nd ed.). PuddleDancer Press. 한국어판 『비폭력대화』(캐서린 한 옮김, 한국NVC센터). — 교사 대화 문구(`PHRASES.md`).

## 2026-09-22 추가 자산

사용자가 제공한 효과음 원본을 변경 없이 사용한다. 원본 파일 해시는 `prototypes/island-world-v2/v4/audio-type/ASSETS.json`에 기록했다.

| 자산 | 제작자 | 사용 위치 | 원본 | 라이선스 |
|---|---|---|---|---|
| Magic Button Click | humordome | 첫 화면 시작 | https://pixabay.com/sound-effects/technology-magic-button-click-453255/ | Pixabay Content License |
| Computer Mouse Click | Universfield | 로그인 버튼 | https://pixabay.com/sound-effects/film-special-effects-computer-mouse-click-352734/ | Pixabay Content License |
| Turn a Page | CreatorsHome | 튜토리얼 다음 | https://pixabay.com/sound-effects/film-special-effects-turn-a-page-336933/ | Pixabay Content License |
| Water Splash | Universfield | 배 출발 | https://pixabay.com/sound-effects/film-special-effects-water-splash-199583/ | Pixabay Content License |
| Pretendard Variable 1.3.9 | 길형진 | 긴 본문·입력칸·튜토리얼 본문·개인정보/저작권 안내 | https://github.com/orioncactus/pretendard | SIL OFL 1.1, 저작권·라이선스 원문 동봉 |

기존 메이플스토리 제목과 주요 게임 버튼은 유지한다. 추가 음원과 글꼴은 배포 버전의 sounds/ 및 fonts/에서 자체 제공한다.
