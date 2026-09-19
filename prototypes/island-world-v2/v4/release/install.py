import sys
"""Apply only the reviewed static manifest; no DB, Git or network actions."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'renders/releases'/(sys.argv[1] if len(sys.argv)>1 else 'mind-island-v4-20260919')
m=json.loads((OUT/'manifest.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(ROOT/'index.html') in (m['sourceSha256'],m['candidateSha256']), 'Unreviewed root index; refusing overwrite'
for path,digest in m['files'].items():
 source=OUT/'candidate'/path
 assert sha(source)==digest,path
 if path!='index.html' and (ROOT/path).exists():assert sha(ROOT/path)==digest,'Version path conflict'
for path in m['files']:
 if path=='index.html':continue
 target=ROOT/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(OUT/'candidate'/path,target)
# Activate the index last. Existing version paths remain available for old tabs.
shutil.copy2(OUT/'candidate/index.html',ROOT/'index.html')
print('Installed reviewed static files:',m['version'],'No Git/DB/network operations.')
