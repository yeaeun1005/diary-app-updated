"""Restore one login sentence; prepare a Firebase-free local preview only."""
from pathlib import Path
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'renders/releases/review-polish-20260922'
OUT = ROOT / 'renders/releases/login-copy-20260923'
OLD = '가상 학급으로 체험해요. 예시 날짜는 오늘을 기준으로 표시되며 실제 학생 기록이 아닙니다.'
NEW = '학생과 선생님 화면을 체험할 수 있어요.'
sha = lambda data: hashlib.sha256(data).hexdigest()
base = json.loads((BASE / 'manifest.json').read_text())
source = (ROOT / 'index.html').read_text()
assert sha(source.encode()) == base['candidateSha256'], 'Published source changed; review first'
assert source.count(OLD) == 1
preview = (BASE / 'memory-preview/index.html').read_text()
assert preview.count(OLD) == 1
assert "connect-src 'none'" in preview and 'var __DB = {}' in preview
assert not re.search(r'firebase\.initializeApp|firebase-database-compat|<script[^>]+src=["\']https?://', preview)

# Retain the existing immutable assets. Only the HTML sentence changes.
for name, digest in base['files'].items():
    data = (BASE / 'candidate' / name).read_bytes()
    assert sha(data) == digest, name
    target = OUT / 'candidate' / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
candidate = source.replace(OLD, NEW)
(OUT / 'candidate/index.html').write_text(candidate)
shutil.copytree(BASE / 'memory-preview', OUT / 'memory-preview', dirs_exist_ok=True)
(OUT / 'memory-preview/index.html').write_text(preview.replace(OLD, NEW))
(OUT / 'before-work').mkdir(exist_ok=True)
backup = OUT / 'before-work/index.html'
if backup.exists():
    assert backup.read_text() == source
else:
    backup.write_text(source)
manifest = {
    'version': base['version'], 'changeId': sha(candidate.encode())[:12],
    'assetPath': base['assetPath'], 'previousCommit': 'cceff03',
    'sourceSha256': sha(source.encode()), 'candidateSha256': sha(candidate.encode()),
    'databaseMigration': False, 'deployed': False,
    'files': {**base['files'], 'index.html': sha(candidate.encode())},
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'changeId': manifest['changeId'], 'changedSentences': 1,
                  'preview': 'http://127.0.0.1:8796/', 'deployed': False}))
