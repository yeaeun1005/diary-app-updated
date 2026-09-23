"""Check the flattened submission without running the online service."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import base64
import hashlib
import json
import re
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[4]
OUT = Path('/Users/kim/Desktop/마음바다탐험대_제출자료')
PROGRAM = OUT / 'program'
AUDIT = ROOT / 'renders/submission-20260923'
sha = lambda b: hashlib.sha256(b).hexdigest()
files = lambda root: {str(p.relative_to(root)): sha(p.read_bytes())
                      for p in root.rglob('*') if p.is_file() and p.name != '.DS_Store'}
runtime = files(PROGRAM)
assert len(runtime) == 328 and runtime == files(OUT / 'source')
assert not (OUT / 'source/runtime').exists()
assert not (OUT / 'start-local.py').exists()
assert not (OUT / 'source/service-original').exists()
assert not (OUT / 'media/model').exists()
previous = json.loads((AUDIT / 'reward-order-package-hashes.json').read_text())
assert files(OUT) == previous['hashes']

page = (PROGRAM / 'index.html').read_text()
assert "connect-src 'none'" in page and 'var __DB = {}' in page
assert not re.search(r'firebase\.initializeApp|databaseURL:|firebase-database-compat', page)
refs = []
scripts = []


class Tags(HTMLParser):
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        assert tag != 'base'
        if tag == 'script':
            assert d.get('type') != 'module'
            if 'src' in d:
                scripts.append(d['src'])
        if tag != 'a':
            for key in ('src', 'href', 'poster'):
                if key in d:
                    refs.append((PROGRAM / 'index.html', d[key]))


Tags().feed(page)
styles = '\n'.join(re.findall(r'<style\b[^>]*>([\s\S]*?)</style>', page, re.I))
for p, text in [(PROGRAM / 'index.html', styles)] + [(p, p.read_text()) for p in PROGRAM.rglob('*.css')]:
    refs += [(p, url.strip()) for url in re.findall(r'url\([\s\"\']*([^\)\"\']+)', text)]
checked = 0
for origin, url in refs:
    if not url or url.startswith(('data:', 'blob:', '#')):
        continue
    assert not urlsplit(url).scheme and not url.startswith('/'), url
    target = origin.parent / unquote(url.split('?')[0].split('#')[0])
    assert target.is_file(), url
    checked += 1

asset_root = PROGRAM / 'island-v4/03df9e31ef23'
models = sorted((asset_root / 'assets/models').glob('*-data.js'))
assert len(models) == 19
for p in models:
    match = re.search(r'"([A-Za-z0-9+/=]{100,})"', p.read_text())
    assert match, p.name
    data = base64.b64decode(match.group(1), validate=True)
    magic, version, length, json_length, chunk_type = struct.unpack('<5I', data[:20])
    assert magic == 0x46546c67 and version == 2 and length == len(data) and chunk_type == 0x4e4f534a
    model = json.loads(data[20:20 + json_length])
    assert not any(item.get('uri') for item in model.get('buffers', []) + model.get('images', []))
    assert not model.get('extensionsRequired')

syntax = r'''
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');let count=0;
function walk(folder){for(const d of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,d.name);if(d.isDirectory())walk(p);else if(p.endsWith('.js')){new vm.Script(fs.readFileSync(p,'utf8'),{filename:p});count++;}}}
walk(process.argv[1]);for(const m of fs.readFileSync(path.join(process.argv[1],'index.html'),'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1])&&m[2].trim()){new vm.Script(m[2]);count++;}console.log(count);
'''
syntax_count = int(subprocess.check_output(['node', '-e', syntax, str(PROGRAM)], text=True))
result = {'pass': True, 'entry': 'program/index.html', 'sourceEntry': 'source/index.html',
          'runtimeFiles': len(runtime), 'sourceEqualsProgram': True,
          'relativeFileReferences': checked, 'classicExternalScriptFiles': len(scripts),
          'selfContainedGlbModels': len(models), 'jsSyntaxUnits': syntax_count,
          'externalRuntimeReferences': 0, 'separateBuildRequired': False,
          'directFileOpen': {'previousVersionConfirmedBy': 'user', 'currentVersion': 'same relative-file structure; localhost UI verified'},
          'agentFileUrlUiCheck': 'not performed: browser URL policy',
          'physicalUsbAndOtherOperatingSystems': 'not tested'}
(AUDIT / 'final-entry-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
