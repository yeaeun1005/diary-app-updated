"""Build reviewed student refinements; no DB/network."""
from pathlib import Path
import json,hashlib,re,shutil,zipfile,subprocess
HERE=Path(__file__).resolve().parent;V4=HERE.parent;ROOT=HERE.parents[3]
BASE=ROOT/'renders/releases/audio-type-20260922';OUT=ROOT/'renders/releases/review-polish-20260922'
bm=json.loads((BASE/'manifest.json').read_text());assert bm['version']=='1877d3db2428'
sha=lambda b:hashlib.sha256(b).hexdigest()
SOURCE_COMMIT='0745ab8'
source=subprocess.check_output(['git','show',SOURCE_COMMIT+':index.html'],cwd=ROOT).decode()
assert bm['assetPath']+'/' in source
assert sha((ROOT/'index.html').read_bytes())==sha(source.encode())
old=bm['assetPath'];files={str(p.relative_to(BASE/'candidate'/old)):p.read_bytes() for p in (BASE/'candidate'/old).rglob('*') if p.is_file()}
def rep(s,a,b):
    assert s.count(a)==1,(a[:100],s.count(a));return s.replace(a,b)
for n in ['scene.js','friend-view.js','student-tools.js','student-tools-model.js']:files[n]=(V4/n).read_bytes()
files['tutorial.js']=(V4/'model-upgrade/tutorial.js').read_bytes()
files['guides.js']=(V4/'final-polish/guides.js').read_bytes()
files['sharing.js']=(V4/'social-upgrade/sharing.js').read_bytes()
files['teacher-tools.js']=(V4/'classroom-upgrade/teacher-tools.js').read_bytes()
files['typography.css']=(V4/'audio-type/typography.css').read_bytes()
files['sound.js']=(V4/'audio-type/sound.js').read_bytes()
files['legacy/social.js']=(V4/'final-release/social.js').read_bytes()
for p in (V4/'final-release/assets').glob('*.mp3'):files['sounds/'+p.name]=p.read_bytes()
for n in ['review-polish.css','friend-guide.js','diary-empathy.js','credits.js']:files[n]=(HERE/n).read_bytes()
files['guardian-consent.pdf']=(V4/'teacher-upgrade/output/pdf/guardian-consent.pdf').read_bytes()
def blind_paths(value):
    if isinstance(value,list):return [blind_paths(v) for v in value]
    if isinstance(value,dict):return {('originalFileName' if k=='originalPath' else k):blind_paths(v) for k,v in value.items()}
    if isinstance(value,str) and value.startswith('/Users/'):return Path(value).name
    return value
for name,data in list(files.items()):
    if name.endswith('.json') and b'/Users/' in data:
        files[name]=(json.dumps(blind_paths(json.loads(data)),ensure_ascii=False,indent=2)+'\n').encode()
files['scene.js']=files['scene.js'].replace(b'const V4_QUERY=new URLSearchParams(location.search)',b'const V4_QUERY=new URLSearchParams()')
from transform import apply
transformed=apply(source)
version=sha(transformed.encode()+b''.join(k.encode()+files[k] for k in sorted(files)))[:12];asset='island-v4/'+version
s=transformed.replace('__REVIEW_POLISH__',asset).replace(old+'/',asset+'/').replace('content="'+bm['version']+'"','content="'+version+'"')
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
(preview/'__audio-probe.js').write_bytes((V4/'audio-type/probe.js').read_bytes())
h=h.replace('<script>root.render(React.createElement(App));</script>','<script src="__audio-probe.js"></script><script>root.render(React.createElement(App));</script>')
(preview/'__local-review.js').write_bytes((V4/'final-polish/review.js').read_bytes())
(preview/'index.html').write_text(h);shutil.copy2(V4/'release/local-transaction.js',preview/'__local-transaction.js')
local=preview/asset/'scene.js';local.write_text(rep(local.read_text(),'const V4_QUERY=new URLSearchParams()','const V4_QUERY=new URLSearchParams(location.search)'))
manifest={'version':version,'assetPath':asset,'previousCandidate':bm['version'],'previousCommit':SOURCE_COMMIT,'sourceSha256':sha(source.encode()),'candidateSha256':sha(s.encode()),'databaseMigration':False,'deployed':False,'files':{'index.html':sha(s.encode()),**{asset+'/'+n:sha(b) for n,b in files.items()}}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'version':version,'files':len(manifest['files']),'preview':'http://127.0.0.1:8795/','deployed':False}))
