# fonts/ — 메이플스토리 서체 슬라이스 (자체 호스팅)

넥슨 메이플스토리 서체 Light·Bold를 글자 범위별 woff2 174조각 + 첫 화면 조각 2개로 잘라 둔 것이다.
출처·라이선스는 `../CREDITS.md`. 학교 망에서 외부 서버가 막혀도 첫 화면·로그인 창·3D 팻말 글꼴이 깨지지 않게 하려는 것이다(2026-09-10).

- `@font-face`는 `index.html`의 `<style id="font-maplestory">`에 인라인되어 있다(요청 하나를 줄이고 렌더를 막지 않게).
- `maplestory-*-home.woff2`(각 10KB쯤)는 첫 화면·로그인 창·3D 팻말 글자만 담았고 `index.html`이 preload한다.
  맨 뒤에 선언되어 있어 그 글자들은 큰 조각을 받지 않는다. 다른 글자가 나오면 해당 조각만 온다.
- 다시 만들기: `make-slices.py` 머리말. 원본 OTF는 저장소에 두지 않는다(눈누 noonnu.cc/font_page/427).
