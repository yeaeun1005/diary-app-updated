"""Serve only the Firebase-stripped V4 deployment verification twin."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import os
ROOT=Path(__file__).resolve().parents[4]/'renders/releases/mind-island-v4-20260919/memory-preview'
page=(ROOT/'index.html').read_text()
assert "connect-src 'none'" in page and 'var __DB = {}' in page
assert 'firebase.initializeApp(firebaseConfig);' not in page and 'firebase-database-compat.js' not in page
os.chdir(ROOT)
class Preview(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
 def log_message(self,*args):pass
print('V4 isolated deployment check: http://127.0.0.1:8776/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8776),Preview).serve_forever()
