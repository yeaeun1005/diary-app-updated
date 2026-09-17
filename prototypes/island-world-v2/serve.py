"""Local-only preview. Production HTML, demo generators and hidden files are not served."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
import os
ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        u = urlsplit(self.path)
        p = unquote(u.path)
        if p in ('/', '/index.html'):
            self.path = '/renders/harness/world-v2.html' + ('?' + u.query if u.query else '')
        elif not (p.startswith('/prototypes/island-world-v2/') or p.startswith('/fonts/') or p.startswith('/sounds/') or (p.count('/') == 1 and p.endswith(('.png','.svg','.webp')))):
            self.send_error(403); return
        if '..' in p or '/.' in p or p.endswith(('.py', '.md')):
            self.send_error(403); return
        return super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()
    def log_message(self, *args): pass
print('Memory-only preview: http://127.0.0.1:8766', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8766), Preview).serve_forever()
