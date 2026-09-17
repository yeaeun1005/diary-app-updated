"""Serve ONLY the Firebase-stripped release preview, bound to loopback."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,unquote
import os
ROOT=Path(__file__).resolve().parents[3]/'renders/releases/island-v2-20260917/memory-preview'
page=(ROOT/'index.html').read_text()
assert "connect-src 'none'" in page and 'var __DB = {}' in page
assert 'firebase.initializeApp(firebaseConfig);' not in page and 'firebase-database-compat.js' not in page
os.chdir(ROOT)
class LocalPreview(SimpleHTTPRequestHandler):
    def do_GET(self):
        p=unquote(urlsplit(self.path).path)
        if '..' in p or '/.' in p or (p not in ('/','/index.html','/__local-fixtures.js') and not (p.startswith(('/island-v2/','/fonts/','/sounds/','/intro/')) or (p.count('/')==1 and p.endswith(('.png','.svg','.webp'))))):
            self.send_error(403);return
        return super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
    def log_message(self,*args):pass
print('Memory-only integration preview: http://127.0.0.1:8767/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8767),LocalPreview).serve_forever()
