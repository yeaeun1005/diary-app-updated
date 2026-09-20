"""Build the user feedback and three-model update; no DB/network."""
from pathlib import Path
import json,hashlib,re,shutil,zipfile,subprocess
HERE=Path(__file__).resolve().parent;V4=HERE.parent;ROOT=HERE.parents[3]
BASE=ROOT/'renders/releases/six-models-20260920';OUT=ROOT/'renders/releases/island-feedback-models-20260920'
bm=json.loads((BASE/'manifest.json').read_text());assert bm['version']=='02192a6ab4f5'
sha=lambda b:hashlib.sha256(b).hexdigest()
SOURCE_COMMIT='d8bfbede1a0dc1bfe8712c3d058bebf5f4c74880'
source=subprocess.check_output(['git','show',SOURCE_COMMIT+':index.html'],cwd=ROOT).decode()
assert bm['assetPath']+'/' in source
assert sha((ROOT/'index.html').read_bytes())==sha(source.encode())
old=bm['assetPath'];files={str(p.relative_to(BASE/'candidate'/old)):p.read_bytes() for p in (BASE/'candidate'/old).rglob('*') if p.is_file()}
def rep(s,a,b):
    assert s.count(a)==1,(a[:100],s.count(a));return s.replace(a,b)
for n in ['scene.js','friend-scene.js','friend-view.js','content.js','state.js','decor-model.js','decor-scene.js','decor-ui.js']:files[n]=(V4/n).read_bytes()
state=files['state.js'].decode().replace("'local-adapter-required'","'adapter-required'")
state=rep(state,'then(async()=>{const state=reduce(load(me),event);','then(async()=>{if(adapter.dispatch)return adapter.dispatch(k,event);const state=reduce(load(me),event);')
files['state.js']=state.encode()
files['scene.js']=rep(files['scene.js'].decode(),'new URLSearchParams(location.search)','new URLSearchParams()').encode()
app=(V4/'app.js').read_text();app=app[app.index('const v4h='):]
for a,b in [('function V4App(props){','function V4AppInner(props){'),('window.__V4=api.current;',''),('delete window.__V4;',''),("'로컬 검수용 섬 · 새로고침하면 연습 기록이 초기화돼요.'","MEM_ONLY?'체험 중 · 새로고침하면 처음으로 돌아가요.':'로그인한 계정에 기록과 탐험 진행을 저장해요.'")]:app=rep(app,a,b)
files['app.js']=app.encode()
for n in ['sharing.js','social.css']:files[n]=(V4/'social-upgrade'/n).read_bytes()
files['activities.js']=rep(files['activities.js'].decode(),'정원 벤치 ·','마음 우체통 ·').encode()
files['tutorial.js']=(V4/'model-upgrade/tutorial.js').read_bytes()
for model in json.loads((HERE/'models-manifest.json').read_text()):
    n='assets/models/'+model['assetId']+'-data.js';files[n]=(V4/n).read_bytes()
files['feedback-models-manifest.json']=(HERE/'models-manifest.json').read_bytes()
version=sha(source.encode()+b''.join(k.encode()+files[k] for k in sorted(files)))[:12];asset='island-v4/'+version
s=source.replace(old+'/',asset+'/').replace('content="'+bm['version']+'"','content="'+version+'"')
candidate=OUT/'candidate';preview=OUT/'memory-preview'
for p in[candidate,preview,OUT/'before-work']:p.mkdir(parents=True,exist_ok=True)
backup=OUT/'before-work/index.html'
if not backup.exists():backup.write_text(source)
assert backup.read_text()==source
if not (OUT/'previous-static.zip').exists():
    with zipfile.ZipFile(OUT/'previous-static.zip','w',zipfile.ZIP_DEFLATED) as f:
        for n in bm['files']:f.write(ROOT/n,n)
for n,b in files.items():
    p=candidate/asset/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
(candidate/'index.html').write_text(s);shutil.copytree(candidate/asset,preview/asset,dirs_exist_ok=True)
for p in ROOT.iterdir():
    if p.is_file() and p.suffix in ['.png','.svg','.webp']:shutil.copy2(p,preview/p.name)
for n in['fonts','sounds','intro']:shutil.copytree(ROOT/n,preview/n,dirs_exist_ok=True)
builder=(ROOT/'prototypes/island-world-v2/release/prepare.py').read_text();a=builder.index('h=s\nh=re.sub(');b=builder.index("a=h.index('  const judgeOn = function (role)')",a)
env={'s':s,'re':re,'ROOT':ROOT,'rep':rep};exec(builder[a:b],env);h=env['h']
h=rep(h,'<script>root.render(React.createElement(App));</script>','<script src="__local-transaction.js"></script><script src="__local-review.js"></script><script>root.render(React.createElement(App));</script>')
assert "connect-src 'none'" in h and 'var __DB = {}' in h
assert not re.search(r'firebase\.initializeApp|firebase-database-compat\.js|<script[^>]+src=["\']https?://',h)
(preview/'__local-review.js').write_bytes((HERE/'review.js').read_bytes())
(preview/'index.html').write_text(h);shutil.copy2(V4/'release/local-transaction.js',preview/'__local-transaction.js')
local=preview/asset/'scene.js';local.write_text(rep(local.read_text(),'const V4_QUERY=new URLSearchParams()','const V4_QUERY=new URLSearchParams(location.search)'))
manifest={'version':version,'assetPath':asset,'previousCandidate':bm['version'],'previousCommit':SOURCE_COMMIT,'sourceSha256':sha(source.encode()),'candidateSha256':sha(s.encode()),'databaseMigration':False,'deployed':False,'files':{'index.html':sha(s.encode()),**{asset+'/'+n:sha(b) for n,b in files.items()}}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'version':version,'files':len(manifest['files']),'preview':'http://127.0.0.1:8786/','deployed':False}))
