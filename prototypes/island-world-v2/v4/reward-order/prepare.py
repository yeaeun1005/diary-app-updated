"""Build a versioned deployment candidate and a matching isolated USB preview."""
from pathlib import Path
import hashlib
import importlib.util
import json
import shutil
from transform import apply

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = ROOT / 'renders/releases/credits-registration-20260923'
OUT = ROOT / 'renders/releases/reward-order-20260923'
sha = lambda b: hashlib.sha256(b).hexdigest()
base = json.loads((BASE / 'manifest.json').read_text())
source = (ROOT / 'index.html').read_text()
assert sha(source.encode()) == base['candidateSha256'], 'Published source changed'
assets = {}
old = base['assetPath']
for name, digest in base['files'].items():
    data = (BASE / 'candidate' / name).read_bytes()
    assert sha(data) == digest, name
    if name.startswith(old + '/'):
        assets[name[len(old) + 1:]] = data
assets = apply(assets)
version = sha(source.encode() + b''.join(k.encode() + assets[k] for k in sorted(assets)))[:12]
asset = 'island-v4/' + version
page = source.replace(old + '/', asset + '/').replace('content="' + base['version'] + '"', 'content="' + version + '"')
for name, data in assets.items():
    p = OUT / 'candidate' / asset / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
(OUT / 'candidate/index.html').write_text(page)
(OUT / 'before-work').mkdir(exist_ok=True)
(OUT / 'before-work/index.html').write_text(source)
manifest = {'version': version, 'assetPath': asset, 'previousCandidate': base['version'],
            'previousCommit': '056fc8e', 'sourceSha256': sha(source.encode()),
            'candidateSha256': sha(page.encode()), 'databaseMigration': False, 'deployed': False,
            'files': {'index.html': sha(page.encode()), **{asset + '/' + n: sha(data) for n, data in assets.items()}}}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')

# Full static source exists outside the submission; never run this online copy.
service = OUT / 'service-source'
shutil.copytree(OUT / 'candidate', service, dirs_exist_ok=True)
for p in ROOT.iterdir():
    if p.is_file() and p.suffix in ('.png', '.svg', '.webp'):
        shutil.copy2(p, service / p.name)
for name in ('fonts', 'sounds', 'intro'):
    shutil.copytree(ROOT / name, service / name, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('.DS_Store', '*.md', '*.py', '__pycache__'))
spec = importlib.util.spec_from_file_location('usb_rebuild', HERE.parent / 'submission-package/rebuild-usb.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
adapter = ROOT / 'renders/submission-20260923/qa/service-source-20260923-110905'
module.build(service, OUT / 'offline', adapter)
shutil.copytree(OUT / 'offline', OUT / 'memory-preview')
print(json.dumps({'version': version, 'files': len(manifest['files']), 'offline': str(OUT / 'offline')}, ensure_ascii=False))
