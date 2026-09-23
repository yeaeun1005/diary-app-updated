"""Build the approved registration fix and credits page; no DB or network."""
from pathlib import Path
import hashlib
import json
import re
import shutil
from transform import apply

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = ROOT / 'renders/releases/login-copy-20260923'
OUT = ROOT / 'renders/releases/credits-registration-20260923'
sha = lambda data: hashlib.sha256(data).hexdigest()
base = json.loads((BASE / 'manifest.json').read_text())
source = (ROOT / 'index.html').read_text()
assert sha(source.encode()) == base['sourceSha256'], 'Published source changed; review first'
baseline = (BASE / 'candidate/index.html').read_text()
assert sha(baseline.encode()) == base['candidateSha256']
old = base['assetPath']
assets = {}
for name, digest in base['files'].items():
    data = (BASE / 'candidate' / name).read_bytes()
    assert sha(data) == digest, name
    if name.startswith(old + '/'):
        assets[name[len(old)+1:]] = data
credits = json.loads((HERE / 'credits-data.json').read_text())
assert sum(len(s['items']) for s in credits['sections']) == 83
assets['credits.js'] = ('/* Attribution based on the user-provided material list. */\nCREDITS=' + json.dumps(credits, ensure_ascii=False, indent=2) + ';\n' + (HERE / 'credits-page.js').read_text()).encode()
assets['credits.css'] = (HERE / 'credits.css').read_bytes()
transformed = apply(baseline)
needle = '<script src="' + old + '/credits.js"></script>'
assert transformed.count(needle) == 1
transformed = transformed.replace(needle, '<link rel="stylesheet" href="' + old + '/credits.css">' + needle)
version = sha(transformed.encode() + b''.join(k.encode()+assets[k] for k in sorted(assets)))[:12]
asset = 'island-v4/' + version
candidate = transformed.replace(old+'/', asset+'/').replace('content="'+base['version']+'"', 'content="'+version+'"')
for name, data in assets.items():
    target = OUT / 'candidate' / asset / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
(OUT / 'candidate/index.html').write_text(candidate)
(OUT / 'before-work').mkdir(exist_ok=True)
backup = OUT / 'before-work/index.html'
if backup.exists():
    assert backup.read_text() == source
else:
    backup.write_text(source)

# Reuse the established SDK-removal and memory DB adapter, without running its build.
def rep(text, a, b):
    assert text.count(a) == 1, a[:80]
    return text.replace(a, b)
builder = (ROOT / 'prototypes/island-world-v2/release/prepare.py').read_text()
a = builder.index('h=s\nh=re.sub(')
b = builder.index("a=h.index('  const judgeOn = function (role)')", a)
env = {'s':candidate, 're':re, 'ROOT':ROOT, 'rep':rep}
exec(builder[a:b], env)
preview = rep(env['h'], '<script>root.render(React.createElement(App));</script>', '<script src="__local-transaction.js"></script><script src="__local-review.js"></script><script>root.render(React.createElement(App));</script>')
assert "connect-src 'none'" in preview and 'var __DB = {}' in preview
assert not re.search(r'firebase\.initializeApp|firebase-database-compat|<script[^>]+src=["\']https?://', preview)
local = OUT / 'memory-preview'
shutil.copytree(OUT / 'candidate' / asset, local / asset, dirs_exist_ok=True)
for p in ROOT.iterdir():
    if p.is_file() and p.suffix in ('.png', '.svg', '.webp'):
        shutil.copy2(p, local / p.name)
for name in ('fonts', 'sounds', 'intro'):
    shutil.copytree(ROOT / name, local / name, dirs_exist_ok=True)
shutil.copy2(HERE.parent / 'release/local-transaction.js', local / '__local-transaction.js')
shutil.copy2(HERE.parent / 'final-polish/review.js', local / '__local-review.js')
(local / 'index.html').write_text(preview)
scene = local / asset / 'scene.js'
scene.write_text(rep(scene.read_text(), 'const V4_QUERY=new URLSearchParams()', 'const V4_QUERY=new URLSearchParams(location.search)'))
manifest = {'version':version, 'assetPath':asset, 'previousCandidate':base['version'],
            'previousCommit':'cceff03', 'sourceSha256':sha(source.encode()),
            'candidateSha256':sha(candidate.encode()), 'databaseMigration':False, 'deployed':False,
            'files':{'index.html':sha(candidate.encode()), **{asset+'/'+n:sha(data) for n,data in assets.items()}}}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'version':version, 'files':len(manifest['files']), 'preview':'http://127.0.0.1:8797/', 'deployed':False}))
