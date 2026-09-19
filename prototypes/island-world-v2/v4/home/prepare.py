"""Prepare a homepage-only candidate and isolated preview, without installing or publishing.

The published V4 bundle is the immutable baseline. Change the landing component,
scoped styles and first-screen illustration assets. Use the established
Firebase-removal harness for local UI QA.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = ROOT / 'renders/releases/mind-island-home-20260919'
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
# The storybook welcome screen is an illustration layer. The authenticated
# world is copied byte-for-byte, with no hero camera or animation hook.
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
print(json.dumps({'version': version, 'files': len(manifest['files']), 'preview': 'http://127.0.0.1:8779/', 'deployed': False}, indent=2))
