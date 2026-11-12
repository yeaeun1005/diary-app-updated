"""Verify shipped files and isolation without running the production service."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'renders/releases/production-transition-20261112'
m = json.loads((OUT / 'manifest.json').read_text())
page = (OUT / 'candidate/index.html').read_text()
preview = OUT / 'memory-preview'
isolated = (preview / 'index.html').read_text()
for name, digest in m['files'].items():
    assert hashlib.sha256((OUT / 'candidate' / name).read_bytes()).hexdigest() == digest
for marker in ('V4ReviewClass', 'DemoSeedPanel', 'judgeForm', 'judgeOn', 'setJudge',
               'DEMO_CLOCK', 'MEM_OPS', 'MEM_NOTES', 'setTrialUser', '심사용', 'demo/seed'):
    assert marker not in page, marker
assert "function devMode() { return false; }" in page
assert 'const MEM_ONLY = false;' in page
assert 'return firebase.database().ref("app/" + k);' in page
assert 'new Date(nowTs())' in page
for name in ('review-data.js', 'review-generator.js', 'review-class.js'):
    assert not (OUT / 'candidate' / m['assetPath'] / name).exists()
assert '가상 이야기로 생각하기' in (OUT / 'candidate' / m['assetPath'] / 'activities.js').read_text()
assert "connect-src 'none'" in isolated and 'var __DB = {}' in isolated
assert not re.search(r'firebase\.initializeApp|databaseURL:|firebase-database-compat|<script[^>]+src=["\']https?://', isolated)
refs = []


class Tags(HTMLParser):
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            return
        for name, value in attrs:
            if name in ('src', 'href', 'poster'):
                refs.append((preview / 'index.html', value))


Tags().feed(isolated)
styles = '\n'.join(re.findall(r'<style\b[^>]*>([\s\S]*?)</style>', isolated, re.I))
for p, text in [(preview / 'index.html', styles)] + [(p, p.read_text()) for p in preview.rglob('*.css')]:
    refs += [(p, url.strip()) for url in re.findall(r'url\([\s\"\']*([^\)\"\']+)', text)]
checked = 0
for origin, url in refs:
    if not url or url.startswith(('data:', 'blob:', '#')):
        continue
    assert not urlsplit(url).scheme and not url.startswith('/'), url
    assert (origin.parent / unquote(url.split('?')[0].split('#')[0])).is_file(), url
    checked += 1
syntax = r'''
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');let count=0;
function walk(folder){for(const d of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,d.name);if(d.isDirectory())walk(p);else if(p.endsWith('.js')){new vm.Script(fs.readFileSync(p,'utf8'),{filename:p});count++;}}}
walk(process.argv[1]);for(const m of fs.readFileSync(path.join(process.argv[1],'index.html'),'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1])&&m[2].trim()){new vm.Script(m[2]);count++;}console.log(count);
'''
units = int(subprocess.check_output(['node', '-e', syntax, str(preview)], text=True))
result = {'pass': True, 'version': m['version'], 'manifestFiles': len(m['files']),
          'relativeRuntimeReferences': checked, 'syntaxUnits': units,
          'reviewAssets': 0, 'publishedDebugEntryDisabled': True, 'isolatedPreview': True}
(OUT / 'static-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
