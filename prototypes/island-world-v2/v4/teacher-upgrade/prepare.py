"""Reviewable login/teacher candidate; leaves published files and production DB untouched."""
from pathlib import Path
import hashlib, json, re, shutil, subprocess
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
OUT=ROOT/'renders/releases/login-teacher-upgrade-20260919'
BASE='81c473d10789bf1bbc496be3fcd6e71fad392874'
source=subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT,text=True)
assert (ROOT/'index.html').read_text()==source,'Published baseline changed'
sha=lambda b:hashlib.sha256(b).hexdigest()
def rep(s,a,b):
    assert s.count(a)==1, 'Integration boundary changed: '+a[:80]
    return s.replace(a,b)
old=re.search(r'<meta name="island-world-release" content="([^"]+)"',source)[1]
files={str(p.relative_to(ROOT/'island-v4'/old)):p.read_bytes() for p in (ROOT/'island-v4'/old).rglob('*') if p.is_file()}
for f in ['review-class.js','access.css']:files[f]=(HERE/f).read_bytes()
files['guardian-consent.pdf']=(HERE/'output/pdf/guardian-consent.pdf').read_bytes()
data=(ROOT/'demo/seed-data.js').read_text()
data,n=re.subn(r'D\.PW = "[^"]*";', 'D.PW = null; // Ephemeral review credentials are created in memory.',data);assert n==1
files['review-data.js']=data.encode()
files['review-generator.js']=(ROOT/'demo/seed-gen.js').read_bytes()
s=source
s=rep(s,'function dbRef(k) {','function dbRef(k) {\n  if(typeof V4ReviewClass!=="undefined" && V4ReviewClass.active())return V4ReviewClass.ref(k);')
a=s.index('  const judgeOn = function (role)');b=s.index('  const [authView,',a)
s=s[:a]+'''  const judgeOn = function () { return judge; };
  const judgeForm = function (on, role) { return on ? V4ReviewClass.form(role) : {schoolCode:"",loginId:"",password:"",role:role||"student"}; };
  const setJudge = function (on) { setJudgeRaw(on); try { if(on)localStorage.removeItem("judge");else localStorage.setItem("judge","0"); } catch(e){} };
  const [loginBusy,setLoginBusy]=useState(false);
  const loginLock=useRef(false);
'''+s[b:]
a=s.index('  const handleLogin = () => {');b=s.index('  const addStudent = async',a)
s=s[:a]+'''  const handleLogin = async () => {
    if(loginLock.current)return;
    const teacher=loginForm.role==="teacher";
    if(!loginForm.loginId.trim()||!loginForm.password.trim()||(!teacher&&!loginForm.schoolCode.trim())){
      setMsg(teacher?"아이디와 비밀번호를 입력해 주세요.":"학교 코드, 아이디, 비밀번호를 모두 입력해 주세요.");return;
    }
    loginLock.current=true;setLoginBusy(true);setMsg("");
    try {
      if(judge)await V4ReviewClass.start();else V4ReviewClass.leave();
      if(teacher)await teacherLogin();else await studentLogin();
    } catch(e){setMsg("로그인을 준비하지 못했어요. 잠시 뒤 다시 눌러 주세요.");}
    finally{loginLock.current=false;setLoginBusy(false);}
  };
'''+s[b:]
s=rep(s,'  const logout = () => {','  const logout = () => {\n    V4ReviewClass.leave();')
# Keep the original authentication handlers, role fields and password hiding.
s=rep(s,'}, "\\u2715")), authView === "login" ?', '''}, "\\u2715")), React.createElement("div",{className:"v4-login-welcome"},
    React.createElement("span",{className:"v4-login-star","aria-hidden":true},"✦"),
    React.createElement("h2",null,loginForm.role==="teacher"?"우리 반 마음을 만나 볼까요?":"마음 바다로 출발해 볼까요?"),
    React.createElement("p",null,loginForm.role==="teacher"?"아이들의 마음 탐험을 함께해 주세요.":"선생님이 알려주신 정보로 들어와요.")), authView === "login" ?''')
s=rep(s,'className: "auth-tab " + (loginForm.role === r ? "on" : "off"),','className: "auth-tab " + (loginForm.role === r ? "on" : "off"), disabled:loginBusy, "aria-pressed":loginForm.role===r,')
s=rep(s,'(loginForm.role !== "teacher" || !!DEMO_TEACHER.pw) && React.createElement("label",','React.createElement("label",')
s=rep(s,'type: "checkbox", checked: judge, "aria-label": "심사용",','type: "checkbox", checked: judge, disabled:loginBusy, "aria-label": "심사용",')
s=rep(s,'judge ? " · 시연 학급 계정이 채워져 있어요" : " · 직접 입력해요"','judge ? " · 학생과 선생님이 같은 가상 학급으로 들어가요" : " · 내 계정으로 들어가요"')
s=rep(s,'className: "auth-btn", onClick: handleLogin,','className: "auth-btn", onClick: handleLogin, disabled:loginBusy,')
s=rep(s,'}, "로그인"), loginForm.role === "teacher"','}, loginBusy?"바다를 준비하고 있어요…":"로그인"), loginForm.role === "teacher"')
s=s.replace('readOnly: judgeOn(loginForm.role),','readOnly: judgeOn(loginForm.role), disabled:loginBusy,')
s=rep(s,'}, "이 화면 안내"),','}, "선생님 길잡이"),')
s=rep(s,'title: "이 화면의 카드가 무엇인지 차례로 안내해요"','title: "학생 등록부터 학급 마음 살펴보기까지 차근차근 안내해요"')
s=rep(s,'if (page === "teacherDash" && currentUser) return React.createElement("div", {\n    style: shell\n  }, React.createElement("div", {','if (page === "teacherDash" && currentUser) return React.createElement("div", {\n    style: shell\n  }, React.createElement("div", {\n    className:"v4-teacher-header",')
s=rep(s,'className: "tut-dim", style: { position: "absolute", right: 24, top: 16, display: "flex", gap: 8 }','className: "tut-dim v4-teacher-actions", style: { position: "absolute", right: 24, top: 16, display: "flex", gap: 8 }')
s=rep(s,'}, "\\uBE44\\uC6B0\\uAE30"),','}, "기록 전체 삭제"),')
s=rep(s,'if (!confirm(stu.name + "의 기록을 모두 비울까요?")) return;','if (!confirm(stu.name + " 학생의 일기와 연결된 탐험 기록을 모두 삭제할까요? 학생 계정은 유지되며, 삭제한 기록은 되돌릴 수 없습니다.")) return;')
s=rep(s,'setMsg("✅ 기록이 비워졌습니다.");','setMsg("✅ 학생 계정은 유지하고 기록을 모두 삭제했습니다.");')
# A persistent download appears for both empty and populated classes.
anchor='}, currentUser.teacherId === MIG_OWNER && migUI(), msgBox, myStudents.length === 0'
card='''}, currentUser.teacherId === MIG_OWNER && migUI(), msgBox,
  React.createElement("section",{className:"v4-teacher-download","aria-label":"보호자 동의서"},
    React.createElement("div",null,React.createElement("h2",null,"보호자 동의서"),React.createElement("p",null,"학교명·활동 기간·문의처를 작성한 뒤 보호자에게 나눠 주세요. 학생을 등록한 뒤에도 언제든 내려받을 수 있어요.")),
    React.createElement("a",{className:"v4-consent-link",href:"__V4_ACCESS__/guardian-consent.pdf",download:"마음바다탐험대_보호자동의서.pdf"},"동의서 PDF 내려받기")), myStudents.length === 0'''
s=rep(s,anchor,card)
# The previous expandable form is replaced with the same printable, consistent template.
a=s.index('React.createElement("button", {\n    onClick: function () {\n      setShowConsent(!showConsent);')
b=s.index('React.createElement("label", {\n    style: {\n      display: "flex",',a)
s=s[:a]+'''React.createElement("a",{className:"v4-consent-link",href:"__V4_ACCESS__/guardian-consent.pdf",download:"마음바다탐험대_보호자동의서.pdf",style:{marginBottom:14}},"동의서 PDF 내려받기"), '''+s[b:]
version=sha(s.encode()+b''.join(k.encode()+files[k] for k in sorted(files)))[:12]
asset='island-v4/'+version
s=s.replace('island-v4/'+old+'/',asset+'/').replace('content="'+old+'"','content="'+version+'"').replace('__V4_ACCESS__',asset)
tags='\n'.join('<script src="'+asset+'/'+n+'"></script>' for n in ['review-data.js','review-generator.js','review-class.js'])
s=rep(s,'<script>root.render(React.createElement(App));</script>',tags+'\n<link rel="stylesheet" href="'+asset+'/access.css">\n<script>root.render(React.createElement(App));</script>')
candidate=OUT/'candidate';preview=OUT/'memory-preview';before=OUT/'before-work'
for p in [candidate,preview,before]:p.mkdir(parents=True,exist_ok=True)
if not (before/'index.html').exists():(before/'index.html').write_text(source)
assert (before/'index.html').read_text()==source
for name,data in files.items():
    p=candidate/asset/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
(candidate/'index.html').write_text(s)
shutil.copytree(candidate/asset,preview/asset,dirs_exist_ok=True)
for p in ROOT.iterdir():
    if p.is_file() and p.suffix in ['.png','.svg','.webp']:shutil.copy2(p,preview/p.name)
for f in ['fonts','sounds','intro']:shutil.copytree(ROOT/f,preview/f,dirs_exist_ok=True)
# Reuse the established network-isolation transform, without changing the new judge flow.
builder=(ROOT/'prototypes/island-world-v2/release/prepare.py').read_text()
a=builder.index('h=s\nh=re.sub(');b=builder.index("a=h.index('  const judgeOn = function (role)')",a)
env={'s':s,'re':re,'ROOT':ROOT,'rep':rep};exec(builder[a:b],env);h=env['h']
h=rep(h,'<script>root.render(React.createElement(App));</script>','<script src="__local-transaction.js"></script><script>root.render(React.createElement(App));</script>')
assert "connect-src 'none'" in h and 'var __DB = {}' in h
assert not re.search(r'firebase\.initializeApp|firebase-database-compat\.js|<script[^>]+src=["\']https?://',h)
(preview/'index.html').write_text(h)
shutil.copy2(HERE.parent/'release/local-transaction.js',preview/'__local-transaction.js')
manifest={'version':version,'assetPath':asset,'previousCommit':BASE,'sourceSha256':sha(source.encode()),'candidateSha256':sha(s.encode()),'databaseMigration':False,'deployed':False,'files':{'index.html':sha(s.encode()),**{asset+'/'+k:sha(v) for k,v in files.items()}}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'version':version,'files':len(manifest['files']),'preview':'http://127.0.0.1:8781/','deployed':False}))
