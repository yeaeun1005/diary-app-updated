"""Local, explicit promotion/rollback of the reviewed UI. Never commits, pushes or touches a DB."""
from pathlib import Path
import argparse,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'renders/releases/island-v2-20260917'
a=argparse.ArgumentParser();a.add_argument('--rollback',action='store_true')
a.add_argument('--rehearsal',action='store_true',help='Only apply to an ignored local rehearsal folder, never the app root')
args=a.parse_args()
DEST=OUT/'restore-rehearsal' if args.rehearsal else ROOT
m=json.loads((OUT/'manifest.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
current=sha(DEST/'index.html')
assert current in (m['sourceSha256'],m['candidateSha256']), 'index.html has additional changes; stop and review, never overwrite them'
if args.rollback:
    source=OUT/'previous/index.html';assert sha(source)==m['sourceSha256']
else:
    source=OUT/'candidate/index.html';assert sha(source)==m['candidateSha256']
    for relative,digest in m['files'].items():
        if not relative.startswith(m['assetPath']+'/'):continue
        src=OUT/'candidate'/relative;assert sha(src)==digest
        dst=DEST/relative;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
# Atomic replacement after all checks and immutable assets are in place.
temp=DEST/'index.html.release-tmp';temp.write_bytes(source.read_bytes());temp.replace(DEST/'index.html')
if args.rehearsal:print('Rehearsal folder only; project index.html was not touched.')
print('Previous UI restored locally.' if args.rollback else 'Reviewed UI installed locally.')
print('No commit, push, deployment, database access or record migration performed.')
