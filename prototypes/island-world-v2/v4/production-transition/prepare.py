"""Build the normal service and an isolated, empty-account verification copy."""
from pathlib import Path
from datetime import datetime
import hashlib
import importlib.util
import json
import shutil
from transform import apply

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = ROOT / 'renders/releases/reward-order-20260923'
OUT = ROOT / 'renders/releases/production-transition-20261112'
sha = lambda b: hashlib.sha256(b).hexdigest()
base = json.loads((BASE / 'manifest.json').read_text())
source = (BASE / 'candidate/index.html').read_text()
assert sha(source.encode()) == base['candidateSha256']
allowed = {base['candidateSha256']}
if (OUT / 'manifest.json').exists():
    allowed.add(json.loads((OUT / 'manifest.json').read_text())['candidateSha256'])
assert sha((ROOT / 'index.html').read_bytes()) in allowed, 'Unreviewed index changes'
old = base['assetPath']
assets = {}
for name, digest in base['files'].items():
    data = (BASE / 'candidate' / name).read_bytes()
    assert sha(data) == digest, name
    if name.startswith(old + '/'):
        assets[name[len(old) + 1:]] = data
page, assets = apply(source, assets)
version = sha(page.encode() + b''.join(k.encode() + assets[k] for k in sorted(assets)))[:12]
asset = 'island-v4/' + version
page = page.replace(old + '/', asset + '/').replace('content="' + base['version'] + '"', 'content="' + version + '"')
if OUT.exists():
    archive = ROOT / 'renders/production-transition-20261112/builds' / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    archive.parent.mkdir(parents=True, exist_ok=True)
    OUT.rename(archive)
for name, data in assets.items():
    p = OUT / 'candidate' / asset / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
(OUT / 'candidate/index.html').write_text(page)
(OUT / 'before-work').mkdir()
(OUT / 'before-work/index.html').write_text(source)
manifest = {'version': version, 'assetPath': asset, 'previousCandidate': base['version'],
            'previousCommit': 'cea2caa', 'sourceSha256': sha(source.encode()),
            'candidateSha256': sha(page.encode()), 'databaseMigration': False, 'deployed': False,
            'files': {'index.html': sha(page.encode()), **{asset + '/' + n: sha(data) for n, data in assets.items()}}}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
service = OUT / 'service-source'
shutil.copytree(OUT / 'candidate', service)
for p in ROOT.iterdir():
    if p.is_file() and p.suffix in ('.png', '.svg', '.webp'):
        shutil.copy2(p, service / p.name)
for name in ('fonts', 'sounds', 'intro'):
    shutil.copytree(ROOT / name, service / name,
                    ignore=shutil.ignore_patterns('.DS_Store', '*.md', '*.py', '__pycache__'))
spec = importlib.util.spec_from_file_location('isolated_preview', HERE.parent / 'submission-package/rebuild-usb.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
adapter = ROOT / 'renders/submission-20260923/qa/service-source-20260923-110905'
module.build(service, OUT / 'memory-preview', adapter)
print(json.dumps({'version': version, 'files': len(manifest['files']), 'reviewDataIncluded': False,
                  'preview': str(OUT / 'memory-preview')}, ensure_ascii=False))
