"""Build a versioned V4 candidate and its physically isolated memory twin.
Never runs production HTML, reads Firebase, migrates records or publishes.
"""
from pathlib import Path
import hashlib,json,re,shutil,sys,zipfile,subprocess
HERE=Path(__file__).resolve().parent
V4=HERE.parent
ROOT=HERE.parents[3]
OUT=ROOT/'renders/releases/mind-island-v4-decor-20260919'
backup=OUT/'before-work/index.html'
PREVIOUS='e92499fe29841a31012e64b52b5170308a4161fa'
SOURCE=subprocess.check_output(['git','show',PREVIOUS+':index.html'],cwd=ROOT,text=True)
if not backup.exists():
 assert (ROOT/'index.html').read_text()==SOURCE, 'Unreviewed root index'
 backup.parent.mkdir(parents=True,exist_ok=True);backup.write_text(SOURCE)
assert backup.read_text()==SOURCE, 'Backup must match the reviewed previous release'
sha=lambda data:hashlib.sha256(data).hexdigest()
def rep(s,a,b):
 assert s.count(a)==1, 'Changed integration boundary: '+a[:80]
 return s.replace(a,b)
old_version=re.search(r'<meta name="island-world-release" content="([^"]+)">',SOURCE).group(1)
old='island-v4/'+old_version
protected=OUT/'protected-before.json'
if not protected.exists():
 paths=[ROOT/'index.html',ROOT/'HANDOVER.md',*(ROOT/old).rglob('*')]
 protected.write_text(json.dumps({str(p.relative_to(ROOT)):sha(p.read_bytes())for p in paths if p.is_file()},indent=2)+'\n')
files={}
for p in (ROOT/old/'legacy').iterdir():
 if p.is_file():
  data=p.read_bytes()
  files['legacy/'+p.name]=data
files['GLTFLoader.r147.js']=(HERE/'vendor/GLTFLoader.r147.js').read_bytes()
modules=['decor-model','state','content','assets','passages','scene','sea-scene','sea-view','friend-style','friend-scene','friend-view','activity-model','activities','decor-scene','decor-ui','persistence','app']
styles=['style.css','sea.css','friend.css','activities.css','decor.css']
for name in modules:
 text=(HERE/'persistence.js' if name=='persistence' else V4/(name+'.js')).read_text()
 if name=='state':
  text=rep(text,"throw Error('local-adapter-required')","throw Error('adapter-required')")
  text=rep(text,"const state=reduce(load(me),event);await adapter.write(k,state);return state;","if(adapter.dispatch)return adapter.dispatch(k,event);const state=reduce(load(me),event);await adapter.write(k,state);return state;")
 if name=='assets':text=rep(text,'new URLSearchParams(location.search)','new URLSearchParams()')
 if name=='scene':text=rep(text,'new URLSearchParams(location.search)','new URLSearchParams()')
 if name=='app':
  text=text[text.index('const v4h='):]
  text=rep(text,'function V4App(props){','function V4AppInner(props){')
  text=rep(text,'window.__V4=api.current;','')
  text=rep(text,'delete window.__V4;','')
  text=rep(text,"'로컬 검수용 섬 · 새로고침하면 연습 기록이 초기화돼요.'","MEM_ONLY?'체험 중 · 새로고침하면 처음으로 돌아가요.':'로그인한 계정에 기록과 탐험 진행을 저장해요.'")
 files[name+'.js']=text.encode()
for name in styles:files[name]=(V4/name).read_bytes()
for p in (V4/'assets/models').glob('*-data.js'):files['assets/models/'+p.name]=p.read_bytes()
# Record provenance without exposing local user paths; original measurements remain local.
provenance=json.loads((HERE/'asset-provenance.json').read_text())
files['assets/provenance.json']=(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n').encode()
page=SOURCE
# Replace only the old V4 bundle tags; preserve all inline/auth/diary code.
page,n=re.subn(r'<(?:link|script)[^>]+(?:href|src)="'+re.escape(old)+r'/(?!legacy/)[^"]+"[^>]*>(?:</script>)?\n?', '',page)
assert n==16, ('Unexpected old V4 tag count',n)
version=sha(page.encode()+b''.join(k.encode()+files[k] for k in sorted(files)))[:12]
asset_path='island-v4/'+version
page=page.replace(old+'/legacy',asset_path+'/legacy')
page=rep(page,'<meta name="island-world-release" content="'+old_version+'">','<meta name="island-world-release" content="'+version+'">')
tags=''.join('<link rel="stylesheet" href="'+asset_path+'/'+n+'">\n'for n in styles)
tags+='<script src="'+asset_path+'/GLTFLoader.r147.js"></script>\n'
tags+=''.join('<script src="'+asset_path+'/'+n+'.js"></script>\n'for n in modules)
page=rep(page,'<script>root.render(React.createElement(App));</script>',tags+'<script>root.render(React.createElement(App));</script>')
assert not any(t in page for t in ['__local-fixtures.js','var __DB = {}','V2_TEST_AUTH','127.0.0.1'])
assert 'firebase.initializeApp(firebaseConfig);' in page
candidate=OUT/'candidate';candidate.mkdir(exist_ok=True,parents=True)
for name,data in files.items():
 p=candidate/asset_path/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
(candidate/'index.html').write_text(page)
# Previous assets remain in place in production. Back up current static files only.
previous=OUT/'previous';previous.mkdir(exist_ok=True)
if not (previous/'index.html').exists():(previous/'index.html').write_text(SOURCE)
preview=OUT/'memory-preview';preview.mkdir(exist_ok=True)
for p in ROOT.iterdir():
 if p.is_file() and p.suffix in ('.png','.svg','.webp'):shutil.copy2(p,preview/p.name)
for folder in ['fonts','sounds','intro']:
 shutil.copytree(ROOT/folder,preview/folder,dirs_exist_ok=True)
shutil.copytree(candidate/asset_path,preview/asset_path,dirs_exist_ok=True)
# Reuse the established offline auth and Firebase-removal transform, not its
# old deployment builder. Its exact boundaries fail closed on unknown changes.
old_builder=(ROOT/'prototypes/island-world-v2/release/prepare.py').read_text()
a=old_builder.index('h=s\nh=re.sub(');b=old_builder.index("(preview/'index.html').write_text(h)",a)
env={'s':page,'re':re,'ROOT':ROOT,'rep':lambda s,a,b:rep(s,a,b)}
exec(old_builder[a:b],env)
h=env['h']
h=rep(h,'<script src="__local-fixtures.js"></script>','<script src="__local-transaction.js"></script><script src="__local-fixtures.js"></script>')
assert "connect-src 'none'" in h and 'var __DB = {}' in h
assert not re.search(r'<script[^>]+src=["\']https?://',h)
assert 'firebase.initializeApp(firebaseConfig);' not in h and 'firebase-database-compat.js' not in h
(preview/'index.html').write_text(h)
shutil.copy2(ROOT/'prototypes/island-world-v2/release/local-fixtures.js',preview/'__local-fixtures.js')
shutil.copy2(HERE/'local-transaction.js',preview/'__local-transaction.js')
manifest={'version':version,'assetPath':asset_path,'previousCommit':PREVIOUS,'sourceSha256':sha(SOURCE.encode()),'candidateSha256':sha(page.encode()),'databaseMigration':False,'deployed':False,'files':{'index.html':sha(page.encode()),**{asset_path+'/'+k:sha(v) for k,v in files.items()}},'bytes':sum(len(v) for v in files.values())+len(page.encode())}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
with zipfile.ZipFile(OUT/'previous-static.zip','w',zipfile.ZIP_DEFLATED)as z:
 z.writestr('index.html',SOURCE)
 for p in (ROOT/old).rglob('*'):
  if p.is_file():z.write(p,p.relative_to(ROOT))
print(json.dumps({'version':version,'files':len(manifest['files']),'bytes':manifest['bytes'],'memoryPreview':'http://127.0.0.1:8777/','productionExecuted':False},indent=2))
