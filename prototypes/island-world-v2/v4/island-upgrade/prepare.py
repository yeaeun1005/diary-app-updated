"""Island refinements layered on the reviewed login/teacher candidate. Never installs or publishes."""
from pathlib import Path
import re,json,hashlib,shutil
HERE=Path(__file__).resolve().parent
V4=HERE.parent
ROOT=HERE.parents[3]
BASE=ROOT/'renders/releases/login-teacher-upgrade-20260919'
OUT=ROOT/'renders/releases/island-upgrade-20260919'
m=json.loads((BASE/'manifest.json').read_text());assert m['version']=='7f24e1af0f23'
source=(BASE/'candidate/index.html').read_text()
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(source.encode())==m['candidateSha256']
assert sha((ROOT/'index.html').read_bytes())==m['sourceSha256']
old=m['assetPath']
files={str(p.relative_to(BASE/'candidate'/old)):p.read_bytes() for p in (BASE/'candidate'/old).rglob('*') if p.is_file()}
def rep(s,a,b):
 assert s.count(a)==1,'Integration boundary: '+a[:100]
 return s.replace(a,b)
for n in ['decor-model.js','decor-ui.js','student-tools.js']:files[n]=(V4/n).read_bytes()
app=(V4/'app.js').read_text();app=app[app.index('const v4h='):]
for a,b in [('function V4App(props){','function V4AppInner(props){'),('window.__V4=api.current;',''),('delete window.__V4;',''),("'로컬 검수용 섬 · 새로고침하면 연습 기록이 초기화돼요.'","MEM_ONLY?'체험 중 · 새로고침하면 처음으로 돌아가요.':'로그인한 계정에 기록과 탐험 진행을 저장해요.'")]:app=rep(app,a,b)
files['app.js']=app.encode()
files['scene.js']=rep((V4/'scene.js').read_text(),'new URLSearchParams(location.search)','new URLSearchParams()').encode()
for n in ['clarity.css','island-title.svg','key-e.svg']:files[n]=(HERE/n).read_bytes()
# New and edited ordinary answers publish anonymously in the same atomic write.
# Existing hidden/pending answers are never swept or auto-migrated on read.
from chart_readability import apply as readable_charts
s=readable_charts(source)
s=rep(s,'o[base + "s"] = ans.flagged ? 2 : 0;','o[base + "s"] = ans.flagged ? 2 : 1;')
s=rep(s,'o["pub/" + qid + "/" + anonKey(sid)] = null;','o["pub/" + qid + "/" + anonKey(sid)] = ans.flagged ? null : {o:o[base+"o"],f:o[base+"f"],w:o[base+"w"],fl:o[base+"fl"]};')
s=s.replace('// 고치면 s를 0으로 되돌리고 광장 사본을 지운다 — 승인된 내용과 원본이 어긋나면 안 된다.','// 2026-09-19: 이름 경고가 없는 새 답/수정 답은 익명 사본과 함께 자동 공개한다.')
# Keep older retained board UI accurate too.
s=s.replace('s: flagged ? 2 : 0, nmf: flagged','s: flagged ? 2 : 1, nmf: flagged')
s=s.replace('선생님이 고른 답이 3개 이상 모이면 이름 없이 여기에 보여요.','답이 3개 이상 모이면 이름 없이 여기에 보여요.')
s=s.replace('아이들의 답은 선생님이 고른 것만 이름 없이 광장에 보여요.','아이들의 답은 이름 없이 자동 공개돼요. 이름이 들어간 답은 확인한 뒤 공개해 주세요.')
s=s.replace('선생님이 고른 답만 이름 없이 광장에 올라와요.','답은 이름 없이 자동 공개돼요. 친구 이름은 쓰지 않아요.')
s=s.replace('선생님이 고른 답만 이름 없이 광장 게시판과 카드에 보여요(3개 이상일 때).','답은 이름 없이 자동 공개돼요(3개 이상일 때). 이름이 들어간 답은 확인한 뒤 공개할 수 있고, 필요한 답은 숨길 수 있어요.')
board=files['legacy/board.js'].decode()
board=rep(board,'s: flagged ? 2 : 0, nmf: flagged','s: flagged ? 2 : 1, nmf: flagged')
board=board.replace('선생님의 공개를 기다려요','아직 공개되지 않았어요. 고치고 저장하면 자동 공개돼요')
board=board.replace('게시판에 공개됐어요','이름 없이 자동 공개됐어요')
board=board.replace('선생님이 고른 답이 3개 이상 모이면 이름 없이 여기에 보여요.','답이 3개 이상 모이면 이름 없이 여기에 보여요.')
board=board.replace('친구 이름은 쓰지 않아요. \'어떤 친구가\'라고 써요.','저장하면 이름 없이 자동 공개돼요. 친구 이름 대신 \'어떤 친구가\'라고 써요.')
board=board.replace('fontSize: 14, color: "#28444f"','fontSize: 16, fontWeight:700, color: "#28444f"')
board=board.replace('fontSize: 12, fontWeight: 700, color: "#0e7490"','fontSize: 14, fontWeight: 700, color: "#0e7490"')
files['legacy/board.js']=board.encode()
version=sha(s.encode()+b''.join(k.encode()+files[k] for k in sorted(files)))[:12]
asset='island-v4/'+version
s=s.replace(old+'/',asset+'/').replace('content="'+m['version']+'"','content="'+version+'"')
s=rep(s,'<script>root.render(React.createElement(App));</script>','<link rel="stylesheet" href="'+asset+'/clarity.css">\n<script>root.render(React.createElement(App));</script>')
candidate=OUT/'candidate';preview=OUT/'memory-preview'
for p in [candidate,preview,OUT/'before-work']:p.mkdir(parents=True,exist_ok=True)
backup=OUT/'before-work/index.html'
if not backup.exists():backup.write_text(source)
assert backup.read_text()==source
for n,b in files.items():
 p=candidate/asset/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
(candidate/'index.html').write_text(s)
shutil.copytree(candidate/asset,preview/asset,dirs_exist_ok=True)
for p in ROOT.iterdir():
 if p.is_file() and p.suffix in ['.png','.svg','.webp']:shutil.copy2(p,preview/p.name)
for n in ['fonts','sounds','intro']:shutil.copytree(ROOT/n,preview/n,dirs_exist_ok=True)
builder=(ROOT/'prototypes/island-world-v2/release/prepare.py').read_text();a=builder.index('h=s\nh=re.sub(');b=builder.index("a=h.index('  const judgeOn = function (role)')",a)
env={'s':s,'re':re,'ROOT':ROOT,'rep':rep};exec(builder[a:b],env);h=env['h']
h=rep(h,'<script>root.render(React.createElement(App));</script>','<script src="__local-transaction.js"></script><script>root.render(React.createElement(App));</script>')
assert "connect-src 'none'" in h and 'var __DB = {}' in h
assert not re.search(r'firebase\.initializeApp|firebase-database-compat\.js|<script[^>]+src=["\']https?://',h)
(preview/'index.html').write_text(h)
shutil.copy2(V4/'release/local-transaction.js',preview/'__local-transaction.js')
# Local inspection controls are available only in the isolated twin.
local=preview/asset/'scene.js';local.write_text(rep(local.read_text(),'const V4_QUERY=new URLSearchParams()','const V4_QUERY=new URLSearchParams(location.search)'))
manifest={'version':version,'assetPath':asset,'previousCandidate':m['version'],'previousCommit':m['previousCommit'],'sourceSha256':m['sourceSha256'],'candidateSha256':sha(s.encode()),'databaseMigration':False,'deployed':False,'files':{'index.html':sha(s.encode()),**{asset+'/'+n:sha(b) for n,b in files.items()}}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'version':version,'files':len(manifest['files']),'preview':'http://127.0.0.1:8782/','deployed':False}))
