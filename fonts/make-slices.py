# 메이플스토리 서체를 웹용 슬라이스로 자른다 (2026-09-10). 출처·라이선스는 ../CREDITS.md.
#   pip3 install --user fonttools brotli
#   python3 fonts/make-slices.py <MaplestoryOTFLight.woff> <MaplestoryOTFBold.woff> <google-jua.css>
# 1) 구글 폰트 Jua CSS의 한글 unicode-range 표(87조각)를 그대로 써서 굵기마다 조각을 만든다 — 쓰인 글자의 조각만 내려받는다.
# 2) 첫 화면·로그인 창·3D 팻말 글자만 담은 home 조각(각 10KB쯤)을 맨 뒤에 둔다 — 뒤 선언이 이기므로 그 글자들은 큰 조각을 받지 않는다.
# 3) @font-face 전부를 index.html의 <style id="font-maplestory"> 안에 넣는다 — 따로 CSS 파일을 두면 요청이 하나 더 생기고 렌더를 막는다.
import re, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont
light, bold, gcss = sys.argv[1:4]
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
HOME = ("마음 바다 탐험대 나의 감정이 자라면 나만의 섬이 생깁니다 로그인 없이 체험하기 계정 써볼 수 있어요 학생 선생님 탐험 시작 등록 "
        "학교 코드, 아이디, 비밀번호로 들어가요 학교명 (예: 바다초등학교) 선생님 이름 김대장 탐험대 생성하기 처음 만드나요? 등록하기 → ← 로그인으로 "
        "고유 코드가 발급됩니다. 이 코드를 학생들에게 공유하세요 닫기 개인정보 처리방침 0123456789 SCH3A7B2C 내 안으로 바다로 우리 반으로 광장 표지 의 섬 부두 잠수 지점")
css = open(gcss, encoding="utf-8").read()
slices = []
for b in [b for b in css.split("@font-face")[1:] if "font-family: 'Jua'" in b]:
    m = re.search(r"/\* \[?([\w-]+)\]? \*/", b); name = m.group(1) if m else str(len(slices))
    ur = re.search(r"unicode-range:\s*([^;]+);", b).group(1); cps = set()
    for part in ur.split(","):
        part = part.strip().replace("U+", ""); a, _, z = part.partition("-"); a = int(a, 16); z = int(z, 16) if z else a; cps.update(range(a, z + 1))
    slices.append((name, ur, cps))
def cut(src, cps, fn):
    f = TTFont(src); opt = subset.Options(); opt.flavor = "woff2"; opt.hinting = False; opt.desubroutinize = True; opt.notdef_outline = True
    s = subset.Subsetter(opt); s.populate(unicodes=cps); s.subset(f); f.flavor = "woff2"; f.save(os.path.join(here, fn)); return os.path.getsize(os.path.join(here, fn))
def ranges(cps):
    cps = sorted(cps); out = []; a = b = cps[0]
    for c in cps[1:]:
        if c == b + 1: b = c
        else: out.append((a, b)); a = b = c
    out.append((a, b)); return ",".join(("U+%04X" % a) if a == b else ("U+%04X-%04X" % (a, b)) for a, b in out)
rules = []
for key, src, w in (("light", light, 300), ("bold", bold, 700)):
    cmap = set(TTFont(src).getBestCmap().keys())
    for name, ur, cps in slices:
        have = cps & cmap
        if not have: continue
        fn = "maplestory-%s-%s.woff2" % (key, name); cut(src, have, fn)
        rules.append("@font-face{font-family:'Maplestory';font-style:normal;font-weight:%d;font-display:swap;src:url(fonts/%s) format('woff2');unicode-range:%s}" % (w, fn, ur))
homecps = set(ord(c) for c in HOME if c != "\n")   # 공백(U+0020)도 넣는다. 빠지면 공백 하나 때문에 라틴 조각 26KB가 딸려 온다
for key, src, w in (("light", light, 300), ("bold", bold, 700)):
    fn = "maplestory-%s-home.woff2" % key; cut(src, homecps, fn)
    rules.append("@font-face{font-family:'Maplestory';font-style:normal;font-weight:%d;font-display:swap;src:url(fonts/%s) format('woff2');unicode-range:%s}" % (w, fn, ranges(homecps)))
block = "<style id=\"font-maplestory\">\n/* fonts/make-slices.py가 만든다. 손으로 고치지 않는다 */\n" + "\n".join(rules) + "\n</style>"
p = os.path.join(root, "index.html"); h = open(p, encoding="utf-8").read()
h2 = re.sub(r'<style id="font-maplestory">[\s\S]*?</style>', lambda _: block, h, count=1)
assert h2 != h or block in h, "index.html에 <style id=\"font-maplestory\"> 자리가 없다"
open(p, "w", encoding="utf-8").write(h2); print("ok", len(rules), "rules")
