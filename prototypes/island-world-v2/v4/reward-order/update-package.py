"""Replace only the approved program/source copies; keep media and prior files."""
from pathlib import Path
from datetime import datetime
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[4]
AUDIT = ROOT / 'renders/submission-20260923'
OUT = Path('/Users/kim/Desktop/마음바다탐험대_제출자료')
RELEASE = ROOT / 'renders/releases/reward-order-20260923'
sha = lambda b: hashlib.sha256(b).hexdigest()


def files(root):
    return {str(p.relative_to(root)): sha(p.read_bytes()) for p in sorted(root.rglob('*'))
            if p.is_file() and p.name != '.DS_Store'}


before = files(OUT)
assert before == json.loads((AUDIT / 'flat-source-result.json').read_text())['hashes'], 'Submission changed'
runtime = files(RELEASE / 'offline')
assert len(runtime) == 328
receipt = json.loads((AUDIT / 'package-result.json').read_text())
archive = Path(receipt['zip'])
assert sha(archive.read_bytes()) == receipt['zipSha256'], 'ZIP changed'
backup = AUDIT / 'qa' / ('reward-order-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True, exist_ok=False)
for name in ('program', 'source'):
    shutil.copytree(RELEASE / 'offline', backup / ('new-' + name))
    assert files(backup / ('new-' + name)) == runtime
for name in ('program', 'source'):
    (OUT / name).rename(backup / name)
    (backup / ('new-' + name)).rename(OUT / name)
after = files(OUT)
assert files(OUT / 'program') == files(OUT / 'source') == runtime
assert {k: v for k, v in after.items() if k.startswith('media/')} == {k: v for k, v in before.items() if k.startswith('media/')}
assert len(after) == 736
with zipfile.ZipFile(backup / 'updated.zip', 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name in after:
        z.write(OUT / name, OUT.name + '/' + name)
with zipfile.ZipFile(backup / 'updated.zip') as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(after)
    for name, digest in after.items():
        assert sha(z.read(OUT.name + '/' + name)) == digest
archive.rename(backup / archive.name)
(backup / 'updated.zip').rename(archive)
(backup / 'before-hashes.json').write_text(json.dumps(before, ensure_ascii=False, indent=2) + '\n')
(AUDIT / 'reward-order-package-hashes.json').write_text(json.dumps({'hashes': after}, ensure_ascii=False, indent=2) + '\n')
receipt.update(candidate=json.loads((RELEASE / 'manifest.json').read_text())['version'],
               zipBytes=archive.stat().st_size, zipSha256=sha(archive.read_bytes()),
               archiveFiles=len(after), allArchiveBytesMatch=True, programUnchanged=False,
               sourceEqualsProgram=True, mediaUnchanged=True, backup=str(backup),
               directFileOpen={'previousVersionConfirmedBy': 'user',
                               'currentVersion': 'same relative-file structure; localhost UI verified'})
(AUDIT / 'package-result.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt, ensure_ascii=False, indent=2))
