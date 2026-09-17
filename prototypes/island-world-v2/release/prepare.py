"""Prepare reviewable static releases and a memory-only preview; never publish or read a DB."""
from pathlib import Path
import hashlib, json, re, shutil, zipfile
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).parent
PROTO=HERE.parent
OUT=ROOT/'renders/releases/island-v2-20260917'
BEFORE=OUT/'before-work'
SOURCE=(BEFORE/'index.html').read_text()
assert hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()==hashlib.sha256(SOURCE.encode()).hexdigest(), 'Source changed since backup; review first'
def rep(s,a,b,count=1):
    assert s.count(a)==count, 'Expected unique adapter boundary: '+a[:65]
    return s.replace(a,b)
def public_files():
    for p in ROOT.iterdir():
        if p.is_file() and (p.suffix in ('.png','.svg','.webp') or p.name=='CNAME'):yield p
    for name in ('fonts','sounds','intro','demo'):
        for p in (ROOT/name).rglob('*'):
            if p.is_file() and p.suffix in ('.woff2','.woff','.css','.mp3','.wav','.ogg','.png','.webp','.svg','.js'):yield p
def copy_public(dest):
    dest.mkdir(parents=True,exist_ok=True)
    for p in public_files():
        q=dest/p.relative_to(ROOT);q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
previous=OUT/'previous'
if not (previous/'index.html').exists():
    copy_public(previous);(previous/'index.html').write_text(SOURCE)
world=(PROTO/'world.js').read_text()
a=world.index('const V2_ME =');b=world.index('const v2Clamp=',a)
world=world[:a]+'''const V2_LOCAL=typeof __DB==='object';
const V2_QUERY=new URLSearchParams(V2_LOCAL?location.search:'');
const V2_SESSIONS={};
let V2_QUALITY=V2_QUERY.get('quality')==='low'?'low':'standard';
function v2EnvironmentLabel(me){return V2_LOCAL?'배포 전 연결 검증 · 가상 기록만 사용해요':MEM_ONLY?MEM_NOTES.studentBand(me.name):'나의 마음이 자라는 바다';}
function v2BoardNote(){return V2_LOCAL?'로컬 연결 검증 · 새로고침하면 연습 기록이 사라져요.':MEM_ONLY?'체험 중 · 쓴 내용은 저장되지 않아요.':'친구의 이름을 쓰지 않고, 마음을 함께 나눠요.';}
'''+world[b:]
world=world[:world.index('function V2App(')]
world=rep(world,'function V2World({state,onOpen,panel,profile=V2_ME,friend=null,myState=state,onLogout,onHidden})','function V2World({state,onOpen,panel,me,profile=me,friend=null,myState=state,onLogout,onHidden,trial=false})')
world=world.replace('V2_ME','me')
world=rep(world,'islandId:isFriend?profile.id:undefined','islandId:profile.id')
world=rep(world,'const allSlots={};','const allSlots=Object.create(null);')
world=rep(world,'  state.forEach(em=>{(allSlots[em.label]||[]).forEach', '''  Object.assign(allSlots,v2ExtraSlots(state,worldSeed,allSlots,(x,z)=>v2BaseWalk(x,z)&&v2Radius(x,z)<.87&&!nearPath(x,z,1.6)&&!colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.6)));
  state.forEach(em=>{(allSlots[em.label]||[]).forEach''')
world=rep(world,"'로컬 연습 공간 · 기록은 이 창에만'",'v2EnvironmentLabel(me)')
world=rep(world,"button('처음으로',null,onLogout)","button(V2_LOCAL?'처음으로':trial?'체험 끝내기':'로그아웃',null,onLogout)")
world=rep(world,'window.__V2=api.current;','if(V2_LOCAL)window.__V2=api.current;')
world=rep(world,'delete window.__V2;','if(V2_LOCAL)delete window.__V2;')
world=rep(world,"const isFriend=!!friend;","const isFriend=!!friend;\n  useEffect(()=>{SND.loop('bgm');return()=>SND.leave();},[]);")
world=rep(world,"button('?','조작 도움말',()=>setHelp(true))","v2h(SndBtn,{small:true,className:'v2-sound'}),button('?','조작 도움말',()=>setHelp(true))")
landing=(PROTO/'landing.js').read_text();landing=landing[landing.index('function V2Landing('):]
landing=rep(landing,'islandState(V2_ENTRIES)',"EMOTIONS_28.filter(e=>['신남','희열','만족','편안','슬픔','우울','분노','긴장'].includes(e.label)).map(e=>({label:e.label,q:e.q}))")
landing=rep(landing,"'로컬 연습 바다 · 실제 기록에 영향을 주지 않아요'","V2_LOCAL?'로컬 연결 검증 · 실제 기록에 영향을 주지 않아요':'한 사람, 하나의 마음 섬 · 마음 바다 탐험대'")
landing=rep(landing,"v2h('nav',null,v2h('button',{onClick:onPrivacy}","v2h('nav',null,v2h(SndBtn,{small:true,className:'v2-sound'}),v2h('button',{onClick:onPrivacy}")
board=(PROTO/'board.generated.js').read_text().replace('"이곳은 로컬 연습 공간이에요. 새로고침하면 작성한 답이 사라져요."','v2BoardNote()')
assets={f:(PROTO/f).read_bytes() for f in ['coast-water.js','explorer.js','passages.js','social.js']}
assets.update({'custom-growth.js':(HERE/'custom-growth.js').read_bytes(),'world.js':world.encode(),'landing.js':landing.encode(),'board.js':board.encode(),'account-view.js':(HERE/'account-view.js').read_bytes(),'integrated-app.js':(HERE/'integrated-app.js').read_bytes(),'world.css':((PROTO/'world.css').read_text()+'\n'+(HERE/'release.css').read_text()+"\n.v2-sound{position:static!important;font:inherit!important}.v2-camera .v2-sound{font-size:10px!important;padding:9px 6px!important}\n").encode()})
version=hashlib.sha256(SOURCE.encode()+b''.join(assets[k] for k in sorted(assets))+(HERE/'prepare.py').read_bytes()).hexdigest()[:12]
asset_path='island-v2/'+version
candidate=OUT/'candidate';copy_public(candidate)
for name,data in assets.items():
    p=candidate/asset_path/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
s=SOURCE
# Existing emotion correction already saves correctly, but its success notification
# calls an undefined setMsg. Add only a local, accessible notice; keep save logic intact.
s=rep(s,'  const [showEmoFix, setShowEmoFix] = useState(false);','  const [showEmoFix, setShowEmoFix] = useState(false);\n  const [editNotice, setEditNotice] = useState("");\n  useEffect(function(){if(!editNotice)return;var timer=setTimeout(function(){setEditNotice("");},5000);return function(){clearTimeout(timer);};},[editNotice]);')
s=rep(s,'  const renderInput = () => React.createElement("div", null,','  const renderInput = () => React.createElement("div", null, editNotice && React.createElement("p", {role:"status",className:"v2-edit-notice"}, editNotice),')
s=rep(s,'      setMsg("✅ 감정이 수정되었습니다.");','      setEditNotice("✅ 감정이 수정되었습니다.");')
# Leave every original auth and learning handler intact; replace their view mounts only.
a=s.index('  if (page === "home") return React.createElement');b=s.index('  if (page === "privacy")',a)
home=s[a:b];auth=home[home.index('authOpen && React.createElement'):home.index(', seedMode() ? React.createElement(DemoSeedPanel')]
s=s[:a]+'''  if (page === "home") return React.createElement(React.Fragment, null,
    React.createElement(V2Landing, {authOpen:authOpen,
      onLogin:function(){setMsg("");setLF(judgeForm(judge,loginForm.role));setAuthOpen(true);},
      onTrial:function(){setMsg("");setTE([]);return demoLogin(function(){setMsg("");setPage("trial");});},
      onPrivacy:function(){setPage("privacy");},onCredits:function(){setPage("credits");}}), '''+auth+');\n'+s[b:]
# Intercept island/plaza before the old scene branches. Diary header still returns here.
needle='  if ((page === "sea" || (page === "island" && seaHash())) && currentUser) return'
s=rep(s,needle,'''  if ((page === "island" || page === "plaza") && currentUser && !currentUser.teacherId) return React.createElement(V2App, {
    key:currentUser.schoolCode+":"+currentUser.id, me:currentUser, entries:myEntries, trial:trialUser,
    onDiary:function(){setPage("studentDiary");},onLogout:logout,
    initialPanel:page==="plaza"?"board":null,onBoardSeen:plazaMarkSeen,
    onBoardClose:function(){if(page==="plaza")setPage("island");},onTour:seaTour,tutOn:tutOn
  });
'''+needle)
# The learning-page question banner opens the board in the new island.
s=rep(s,'"📣 광장에 오늘의 질문이 올라왔어요"','"📣 우리 반 게시판에 오늘의 질문이 올라왔어요"')
s=rep(s,'"광장으로 →"','"게시판으로 →"')
s=rep(s,'className: "auth-board",','className: "auth-board v2-auth-board", role:"dialog", "aria-modal":true, "aria-label":"로그인",')
s=rep(s,'placeholder: "학교 코드 (예: SCH3A7B2C)",','placeholder: "학교 코드", "aria-label":"학교 코드",')
s=rep(s,'placeholder: "아이디",','placeholder: "아이디", "aria-label":"아이디",')
s=s.replace('placeholder: "비밀번호",\n    type: "password",','placeholder: "비밀번호", "aria-label":"비밀번호",\n    type: "password",',1)
s=rep(s,'msgBox, loginForm.role !== "teacher" && React.createElement("input", {','msgBox, loginForm.role !== "teacher" && React.createElement("label", {className:"v2-auth-label",htmlFor:"v2-school"}, "학교 코드"), loginForm.role !== "teacher" && React.createElement("input", {id:"v2-school",')
for field,label in [('loginId','아이디'),('password','비밀번호')]:
    needle='React.createElement("input", {\n    className: "auth-inp" + (judgeOn(loginForm.role) ? " ro" : ""), readOnly: judgeOn(loginForm.role),\n    value: loginForm.'+field+','
    replacement='React.createElement("label", {className:"v2-auth-label",htmlFor:"v2-'+field+'"}, "'+label+'"), '+needle.replace('"input", {','"input", {id:"v2-'+field+'",')
    s=rep(s,needle,replacement)
s=s.replace('<head>','<head>\n<meta name="island-world-release" content="'+version+'">\n<link rel="stylesheet" href="'+asset_path+'/world.css">',1)
s=rep(s,'root.render(React.createElement(App));','// The original App mounts after its new presentation assets are ready.')
order=['coast-water.js','board.js','explorer.js','passages.js','social.js','custom-growth.js','world.js','account-view.js','integrated-app.js','landing.js']
tail='\n'.join('<script src="'+asset_path+'/'+f+'"></script>' for f in order)+'\n<script>root.render(React.createElement(App));</script>\n</body>'
s=tail.join(s.rsplit('</body>',1))
(candidate/'index.html').write_text(s)
# A second artifact exercises this candidate with Firebase physically removed.
preview=OUT/'memory-preview';shutil.copytree(candidate,preview,dirs_exist_ok=True)
h=s
h=re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^\"]+firebase-(?:app|database)-compat.js"></script>\n?','',h)
h=re.sub(r'var firebaseConfig\s*=\s*\{.*?\};','var firebaseConfig = {};',h,count=1,flags=re.S)
shim_source=(ROOT/'renders/harness/gen.js').read_text()
shim=re.search(r"rep\('firebase.initializeApp\(firebaseConfig\);', `([\s\S]*?)`, \"init\"\);",shim_source).group(1)
h=rep(h,'firebase.initializeApp(firebaseConfig);',shim)
# No demo generator is loaded or executed in the memory preview.
h=re.sub(r'<script src="demo/[^\"]+"></script>\n?','',h)
h=re.sub(r'<link[^>]+https://fonts\.(?:googleapis|gstatic)\.com[^>]*>','',h)
h=re.sub(r'  useEffect\(\(\) => \{\n    var link = document.createElement\("link"\);.*?document.head.appendChild\(link\);\n  \}, \[\]\);','',h,count=1,flags=re.S)
h=h.replace('<head>',"<head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'\">",1)
a=h.index('  const judgeOn = function (role)');b=h.index('  const [authView,',a)
h=h[:a]+'''  const judgeOn=function(){return judge;};
  const judgeForm=function(on,role){return on?Object.assign({},V2_TEST_AUTH[role==='teacher'?'teacher':V2_TEST_CHOICE],{role:role||'student'}):{schoolCode:"",loginId:"",password:"",role:role||'student'};};
  const setJudge=function(on){setJudgeRaw(on);};
'''+h[b:]
h=re.sub(r'const \[judge, setJudgeRaw\] = useState\(function \(\) \{.*?\}\);','const [judge, setJudgeRaw] = useState(true);',h,count=1)
h=rep(h,'(loginForm.role !== "teacher" || !!DEMO_TEACHER.pw) && React.createElement("label",','React.createElement("label",')
h=h.replace('"심사용"','"로컬 연습 계정"').replace('" · 시연 학급 계정이 채워져 있어요"','" · 실제 계정은 입력하지 마세요"')
h=rep(h,'msgBox, loginForm.role !== "teacher" && React.createElement("label", {className:"v2-auth-label"','loginForm.role !== "teacher" && React.createElement("select", {"aria-label":"검증용 학생 선택",defaultValue:V2_TEST_CHOICE,onChange:function(e){V2_TEST_CHOICE=e.target.value;setLF(judgeForm(true,"student"));setJudge(true);}}, React.createElement("option",{value:"a"},"탐험이 · 학생 A"), React.createElement("option",{value:"b"},"여울 · 학생 B"), React.createElement("option",{value:"empty"},"산호 · 기록 없는 학생")), msgBox, loginForm.role !== "teacher" && React.createElement("label", {className:"v2-auth-label"')
h=rep(h,'onTrial:function(){setMsg("");setTE([]);return demoLogin(function(){setMsg("");setPage("trial");});}', 'onTrial:function(){return studentLoginWith(V2_TEST_AUTH.a.schoolCode,V2_TEST_AUTH.a.loginId,V2_TEST_AUTH.a.password,true);}')
h=rep(h,'<script>root.render(React.createElement(App));</script>','<script src="__local-fixtures.js"></script><script>V2_TEST_READY.then(function(){root.render(React.createElement(App));}).catch(function(){document.getElementById("root").textContent="로컬 검증 자료를 준비하지 못했습니다.";});</script>')
assert 'firebase.initializeApp(firebaseConfig);' not in h and 'firebase-database-compat.js' not in h
assert not re.search(r'<script[^>]+src="demo/',h)
(preview/'index.html').write_text(h)
shutil.copy2(HERE/'local-fixtures.js',preview/'__local-fixtures.js')
# Index + immutable visual assets are the only application changes.
manifest={'version':version,'sourceCommit':'347e610','sourceSha256':hashlib.sha256(SOURCE.encode()).hexdigest(),'candidateSha256':hashlib.sha256(s.encode()).hexdigest(),'assetPath':asset_path,'databaseMigration':False,'deployed':False,'files':{str(p.relative_to(candidate)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(candidate.rglob('*')) if p.is_file() and ('island-v2' not in p.relative_to(candidate).parts or str(p.relative_to(candidate)).startswith(asset_path+'/'))}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
for folder,name in [(candidate,'candidate-static.zip'),(previous,'previous-static.zip')]:
    with zipfile.ZipFile(OUT/name,'w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file() and (folder==previous or str(p.relative_to(folder)) in manifest['files']):z.write(p,p.relative_to(folder))
print('Prepared version',version,'and local rollback archive. No deployment, DB access, commit or push.')
print('Memory preview: http://127.0.0.1:8767/')
