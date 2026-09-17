"""Build an isolated, disposable memory-DB page; never edits the production app."""
from pathlib import Path
import subprocess, os, re, hashlib
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'renders/harness/world-v2.html'
env = dict(os.environ, HTTP='8766', OUT='world-v2.html')
subprocess.run(['node', str(ROOT/'renders/harness/gen.js')], env=env, check=True, stdout=subprocess.DEVNULL)
s = OUT.read_text()
# Remove all demo generator/bootstrap code. Only explicit V2 fixtures are used.
a = s.index('<script src="demo/seed-data.js">')
b = s.index('<script>\nvar firebaseConfig', a)
s = s[:a] + s[b:]
s = re.sub(r'var firebaseConfig\s*=\s*\{.*?\};', 'var firebaseConfig = {};', s, count=1, flags=re.S)
s = re.sub(r'<link[^>]+https://fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', s)
s = s.replace('<head>', '''<head><meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'">
<link rel="stylesheet" href="prototypes/island-world-v2/world.css">''', 1)
# Keep AppMain's authentication and teacher/learning handlers. Replace only its home
# presentation and student-world mount inside the isolated generated page.
a = s.index('  if (page === "home") return React.createElement')
b = s.index('  if (page === "privacy")', a)
home = s[a:b]
auth = home[home.index('authOpen && React.createElement'):home.index(', seedMode() ? React.createElement(DemoSeedPanel')]
s = s[:a] + '''  if (page === "home") return React.createElement(React.Fragment, null,
    React.createElement(V2Landing, {
      authOpen: authOpen,
      onLogin: function () { setMsg(""); setLF(judgeForm(judge, loginForm.role)); setAuthOpen(true); },
      onTrial: function () { return studentLoginWith(V2_ME.schoolCode, V2_AUTH.student.loginId, V2_AUTH.student.password, true); },
      onPrivacy: function () { setPage("privacy"); }, onCredits: function () { setPage("credits"); }
    }), ''' + auth + ');\n' + s[b:]
s = s.replace('  if (page === "island" && currentUser) return',
    '  if (page === "island" && currentUser && currentUser.schoolCode === V2_ME.schoolCode) return React.createElement(V2App, {initialEntries:myEntries, me:currentUser, onLogout:logout});\n  if (page === "island" && currentUser) return', 1)
a=s.index('  const judgeOn = function (role)')
b=s.index('  const [authView,', a)
s=s[:a]+'''  const judgeOn = function () { return judge; };
  const judgeForm = function (on, role) { return on ? Object.assign({}, V2_AUTH[role || "student"], {role:role || "student"}) : {schoolCode:"",loginId:"",password:"",role:role || "student"}; };
  const setJudge = function (on) { setJudgeRaw(on); };
'''+s[b:]
s=re.sub(r'const \[judge, setJudgeRaw\] = useState\(function \(\) \{.*?\}\);', 'const [judge, setJudgeRaw] = useState(true);',s,count=1)
s=s.replace('(loginForm.role !== "teacher" || !!DEMO_TEACHER.pw) && React.createElement("label",', 'React.createElement("label",',1)
s=s.replace('"심사용"', '"로컬 연습 계정"').replace('" · 시연 학급 계정이 채워져 있어요"', '" · 실제 계정은 입력하지 마세요"')
s=s.replace('className: "auth-board",','className: "auth-board v2-auth-board", role:"dialog", "aria-modal":true, "aria-label":"로그인",',1)
s=s.replace('placeholder: "학교 코드 (예: SCH3A7B2C)",','placeholder: "학교 코드", "aria-label":"학교 코드",',1)
s=s.replace('placeholder: "아이디",','placeholder: "아이디", "aria-label":"아이디",',1)
s=s.replace('placeholder: "비밀번호",\n    type: "password",','placeholder: "비밀번호", "aria-label":"비밀번호",\n    type: "password",',1)
# Persistent visible labels complement the existing placeholders and read-only fixture fields.
s=s.replace('msgBox, loginForm.role !== "teacher" && React.createElement("input", {', 'msgBox, loginForm.role !== "teacher" && React.createElement("label", {className:"v2-auth-label",htmlFor:"v2-school"}, "학교 코드"), loginForm.role !== "teacher" && React.createElement("input", {id:"v2-school",',1)
for field,label in [('loginId','아이디'),('password','비밀번호')]:
    needle='React.createElement("input", {\n    className: "auth-inp" + (judgeOn(loginForm.role) ? " ro" : ""), readOnly: judgeOn(loginForm.role),\n    value: loginForm.'+field+','
    replacement='React.createElement("label", {className:"v2-auth-label",htmlFor:"v2-'+field+'"}, "'+label+'"), '+needle.replace('"input", {','"input", {id:"v2-'+field+'",')
    assert needle in s
    s=s.replace(needle,replacement,1)
# AppMain used to request a Google font at mount; the preview uses bundled fonts only.
s=re.sub(r'  useEffect\(\(\) => \{\n    var link = document.createElement\("link"\);.*?document.head.appendChild\(link\);\n  \}, \[\]\);', '',s,count=1,flags=re.S)
a = s.index('const root = ReactDOM.createRoot')
b = s.index('</script>', a)
s = s[:a] + 'const root = ReactDOM.createRoot(document.getElementById("root"));\n' + s[b:]
tail = '''<script src="prototypes/island-world-v2/coast-water.js"></script>
<script src="prototypes/island-world-v2/board.generated.js"></script>
<script src="prototypes/island-world-v2/explorer.js"></script>
<script src="prototypes/island-world-v2/passages.js"></script>
<script src="prototypes/island-world-v2/social.js"></script>
<script src="prototypes/island-world-v2/world.js"></script>
<script src="prototypes/island-world-v2/landing.js"></script>
<script>root.render(React.createElement(V2Root));</script></body>'''
s = tail.join(s.rsplit('</body>', 1))
assert 'firebase-app-compat.js' not in s and 'firebase-database-compat.js' not in s
assert 'firebase.initializeApp(firebaseConfig)' not in s and 'var __DB = {}' in s
assert 'demo/seed' not in ''.join(re.findall(r'<script[^>]+src=[^>]+>', s))
OUT.write_text(s)
# Reuse the current board state, validation, saving, chips and answer UI verbatim.
# Drop the 3D effect entirely: opening this component never allocates a renderer.
src = (ROOT/'index.html').read_text()
board = src[src.index('function PlazaView('):src.index('function SeaView(')]
board = board.replace('function PlazaView(', 'function V2Board(')
a = board.index('  // 3D. 데이터가 온 뒤')
b = board.index('  // ── 카드 ──', a)
board = board[:a] + board[b:]
a = board.index('  var legendEl =')
b = board.index('  // 오늘 우리 반 마음 말', a)
board = board[:a] + '  var legendEl = null;\n' + board[b:]
a = board.index('  // 배치(2026-09-15')
board = board[:a] + '''
  return React.createElement("div", {className:"v2-modal-shade", onPointerDown:function(e){e.stopPropagation();}},
    React.createElement("section", {className:"v2-board", role:"dialog", "aria-modal":true, "aria-label":"우리 반 게시판"},
      React.createElement("header", null, React.createElement("div", null,
        React.createElement("small", null, "함께 나누는 마음"), React.createElement("h2", null, "우리 반 게시판")),
        React.createElement("button", {onClick:onBack, "aria-label":"게시판 닫기", autoFocus:true}, "닫기 ×")),
      React.createElement("div", {className:"v2-board-body"}, err ? React.createElement("p", {role:"alert"}, err) : body),
      React.createElement("footer", null, "이곳은 로컬 연습 공간이에요. 새로고침하면 작성한 답이 사라져요.")));
}
'''
board = board.replace('var r = await Promise.all([plazaCurrent(code)', 'await sGetStrict(plazaKey(code) + "/cur"); var r = await Promise.all([plazaCurrent(code)')
board = board.replace('console.error("plaza:", e);', 'setErr("질문을 불러오지 못했어요. 닫았다가 다시 열어 주세요.");')
board = board.replace('광장으로 가는 중…', '오늘의 질문을 가져오는 중…').replace('광장에 올라갔어요', '게시판에 공개됐어요')
board = board.replace('ans.s === 1 ?', 'ans.s === 0 ? React.createElement("span", {style:{fontSize:12,color:"#6d786b"}}, "선생님의 공개를 기다려요") : ans.s === 1 ?')
(ROOT/'prototypes/island-world-v2/board.generated.js').write_text('// Generated from current PlazaView: data rules unchanged, no 3D scene.\n' + board)
print('Built memory-only V2; production SHA256:', hashlib.sha256(src.encode()).hexdigest()[:16])
