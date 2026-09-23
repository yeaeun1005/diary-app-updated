from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

root = Path(__file__).resolve().parents[4] / 'renders/releases/login-copy-20260923/memory-preview'
page = (root / 'index.html').read_text()
assert "connect-src 'none'" in page and 'var __DB = {}' in page
assert 'firebase.initializeApp' not in page and 'firebase-database-compat' not in page
print('Safe memory preview: http://127.0.0.1:8796/', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8796), partial(SimpleHTTPRequestHandler, directory=str(root))).serve_forever()
