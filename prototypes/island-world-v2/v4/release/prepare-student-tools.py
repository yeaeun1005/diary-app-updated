"""Prepare a restored-student-tools and homepage candidate and isolated preview, without installing or publishing.

The published V4 bundle is the immutable baseline. Restore student helpers inside the existing activity shell and include the
approved landing component, scoped styles and first-screen illustration assets. Use the established
Firebase-removal harness for local UI QA.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess

RELEASE = Path(__file__).resolve().parent
V4 = RELEASE.parent
HERE = V4 / 'home'
ROOT = RELEASE.parents[3]
OUT = ROOT / 'renders/releases/mind-island-student-tools-20260919'
PREVIOUS = '5a431bdfbbd9170c3d7231b8d69885295205b4f8'
SOURCE = subprocess.check_output(['git', 'show', PREVIOUS + ':index.html'], cwd=ROOT, text=True)
assert (ROOT / 'index.html').read_text() == SOURCE, 'Current release changed; review the new baseline first'
sha = lambda data: hashlib.sha256(data).hexdigest()

def rep(text, old, new):
    assert text.count(old) == 1, 'Changed integration boundary: ' + old[:80]
    return text.replace(old, new)

old_version = re.search(r'<meta name="island-world-release" content="([^"]+)">', SOURCE).group(1)
old_path = 'island-v4/' + old_version
files = {str(p.relative_to(ROOT / old_path)): p.read_bytes() for p in (ROOT / old_path).rglob('*') if p.is_file()}
files['legacy/landing.js'] = (HERE / 'landing.js').read_bytes()
files['home.css'] = (HERE / 'home.css').read_bytes()
# Restore student capabilities without changing inline authentication/DB/diary handlers.
for name in ['activities.js', 'student-tools-model.js', 'student-tools.js', 'student-tools.css']:
    files[name] = (V4 / name).read_bytes()
app = (V4 / 'app.js').read_text()
app = app[app.index('const v4h='):]
app = rep(app, 'function V4App(props){', 'function V4AppInner(props){')
app = rep(app, 'window.__V4=api.current;', '')
app = rep(app, 'delete window.__V4;', '')
app = rep(app, "'로컬 검수용 섬 · 새로고침하면 연습 기록이 초기화돼요.'", "MEM_ONLY?'체험 중 · 새로고침하면 처음으로 돌아가요.':'로그인한 계정에 기록과 탐험 진행을 저장해요.'")
files['app.js'] = app.encode()
files['scene.js'] = rep((V4 / 'scene.js').read_text(), 'new URLSearchParams(location.search)', 'new URLSearchParams()').encode()

# The storybook welcome screen is an illustration layer. The authenticated
# world assets stay unchanged; scene code changes only the five activity labels.
for name in ['storybook-world-v1.png', 'voyage-crew-v1.png', 'user-title-v4.png', 'drifting-cloud-v3.png', 'cta-login-v5.svg', 'cta-start-v5.svg']:
    p = HERE / 'art' / name
    assert p.is_file(), 'Missing reviewed welcome illustration: ' + name
    files['home-art/' + name] = p.read_bytes()
for p in (HERE / 'fonts').iterdir():
    if p.is_file():
        files['fonts/' + p.name] = p.read_bytes()
version = sha(SOURCE.encode() + b''.join(k.encode() + files[k] for k in sorted(files)))[:12]
asset_path = 'island-v4/' + version
page = SOURCE.replace(old_path + '/', asset_path + '/')
page = rep(page, 'content="' + old_version + '"', 'content="' + version + '"')
student_tags = '<script src="' + asset_path + '/student-tools-model.js"></script>\n<script src="' + asset_path + '/student-tools.js"></script>\n'
page = rep(page, '<script src="' + asset_path + '/activities.js"></script>', student_tags + '<script src="' + asset_path + '/activities.js"></script>')
page = rep(page, '<script>root.render(React.createElement(App));</script>', '<link rel="stylesheet" href="' + asset_path + '/student-tools.css">\n<script>root.render(React.createElement(App));</script>')

page = rep(page, '<script>root.render(React.createElement(App));</script>', '<link rel="stylesheet" href="' + asset_path + '/home.css">\n<script>root.render(React.createElement(App));</script>')

candidate = OUT / 'candidate'
preview = OUT / 'memory-preview'
for folder in [candidate, preview, OUT / 'before-work']:
    folder.mkdir(parents=True, exist_ok=True)
backup = OUT / 'before-work/index.html'
if not backup.exists():
    backup.write_text(SOURCE)
assert backup.read_text() == SOURCE
protected = OUT / 'protected-before.json'
if not protected.exists():
    protected.write_text(json.dumps({str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in [ROOT / 'index.html', *(ROOT / old_path).rglob('*')] if p.is_file()}, indent=2) + '\n')
for name, data in files.items():
    p = candidate / asset_path / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
(candidate / 'index.html').write_text(page)

for p in ROOT.iterdir():
    if p.is_file() and p.suffix in ('.png', '.svg', '.webp'):
        shutil.copy2(p, preview / p.name)
for folder in ['fonts', 'sounds', 'intro']:
    shutil.copytree(ROOT / folder, preview / folder, dirs_exist_ok=True)
shutil.copytree(candidate / asset_path, preview / asset_path, dirs_exist_ok=True)
# Failure switches exist only in this Firebase-stripped, connect-src:none twin.
local_scene = preview / asset_path / 'scene.js'
local_scene.write_text(rep(local_scene.read_text(), 'const V4_QUERY=new URLSearchParams()', 'const V4_QUERY=new URLSearchParams(location.search)'))

# Execute only the reviewed, fail-closed Firebase-removal transform, not the old builder.
builder = (ROOT / 'prototypes/island-world-v2/release/prepare.py').read_text()
a = builder.index('h=s\nh=re.sub(')
b = builder.index("(preview/'index.html').write_text(h)", a)
env = {'s': page, 're': re, 'ROOT': ROOT, 'rep': rep}
exec(builder[a:b], env)
h = rep(env['h'], '<script src="__local-fixtures.js"></script>', '<script src="__local-transaction.js"></script><script src="__local-fixtures.js"></script>')
assert "connect-src 'none'" in h and 'var __DB = {}' in h
assert not re.search(r'firebase\.initializeApp|firebase-database-compat\.js|<script[^>]+src=["\']https?://', h)
(preview / 'index.html').write_text(h)
shutil.copy2(ROOT / 'prototypes/island-world-v2/release/local-fixtures.js', preview / '__local-fixtures.js')
shutil.copy2(HERE.parent / 'release/local-transaction.js', preview / '__local-transaction.js')
manifest = {'version': version, 'assetPath': asset_path, 'previousCommit': PREVIOUS, 'sourceSha256': sha(SOURCE.encode()), 'candidateSha256': sha(page.encode()), 'databaseMigration': False, 'deployed': False, 'files': {'index.html': sha(page.encode()), **{asset_path + '/' + k: sha(v) for k, v in files.items()}}}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'version': version, 'files': len(manifest['files']), 'preview': 'http://127.0.0.1:8780/', 'deployed': False}, indent=2))
