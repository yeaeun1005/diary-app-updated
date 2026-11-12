"""Remove review entry points while preserving ordinary account-owned storage."""
import re


def once(text, old, new):
    assert text.count(old) == 1, old[:90]
    return text.replace(old, new)


def span(text, start, end, replacement=''):
    assert text.count(start) == 1 and text.count(end) == 1, (start, end)
    a = text.index(start)
    b = text.index(end, a)
    return text[:a] + replacement + text[b:]


def apply(page, assets):
    page = span(page, '// ── DB 관문과 시연 메모리 오버레이', '// 실패를 그대로 던진다.', '''// Account-owned storage. Preview builds replace only the Firebase adapter.
const MEM_ONLY = false;
function dbRef(k) { return firebase.database().ref("app/" + k); }
''')
    page = span(page, '// 2단계(2026-09-14): 시연 계정', 'function dayStamp(ts)', '''// Account validation and the device's current calendar date.
function setAccountStorage(user) {
  if (user && isRetiredReviewSchool(user.schoolCode)) throw Error('review-account-retired');
}
function isRetiredReviewSchool(code) { return String(code || '').trim().toUpperCase() === 'DEMO01'; }
const RETIRED_REVIEW_MESSAGE = '체험 계정은 이용이 종료되었어요. 학교에서 받은 계정으로 로그인해 주세요.';
function nowTs() { return Date.now(); }
''')
    page = span(page, '// #dev 일 때만 켜지는 디버그.', '// lv층 평지가 가장 좁아지는 각도.', '''// Debug entry points are disabled in the published service.
function devMode() { return false; }
''')
    page = span(page, '// ⑩ 시연 학급 패널 (DESIGN.md §14).', '// ── 튜토리얼 투어 엔진')
    page = span(page, '  // 4단계: 시연·체험(메모리에만 쓰는 상태)', '  const [loginForm, setLF]', '''  const setMsg = useCallback(function (m) { setMsgRaw(m); }, []);
  const [currentUser, setCU] = useState(null);
''')
    page = span(page, '  // 「심사용」 체크박스(2026-09-17). 처음 열면', '  const [loginBusy,setLoginBusy]', '''  const emptyLoginForm = role => ({schoolCode:"",loginId:"",password:"",role:role||"student"});
''')
    page = span(page, '  const [trialEntries, setTE]', '  // ⑨ 로그인 전에는 아무것도 읽지 않는다.')
    page = span(page, '  const studentLogin = () =>', '  const handleLogin = async () =>', '''  const studentLogin = () => studentLoginWith(loginForm.schoolCode.trim().toUpperCase(), loginForm.loginId.trim(), loginForm.password.trim());
''')
    page = once(page, '      if(judge)await V4ReviewClass.start();else V4ReviewClass.leave();\n', '')
    page = once(page, '    V4ReviewClass.leave();\n', '')
    page = page.replace('setDemoClock(', 'setAccountStorage(')
    page = once(page, 'setCU(scu); setTrialUser(!!viaTrial);', 'setCU(scu);')
    page = once(page, 'setCU(null); setTrialUser(false);', 'setCU(null);')
    page = once(page, '  // 학생 로그인 본체. 로그인 창(studentLogin)과 체험 간판(demoLogin)이 같이 쓴다. 들어갔으면 true, 아니면 setMsg 뒤 false.\n  const studentLoginWith = async (code, lid, pw, viaTrial) => {   // viaTrial: 체험 간판·시연 링크로(2026-09-15)\n', '''  // 학생 로그인 본체. 학교에서 받은 개인 계정을 확인한다.
  const studentLoginWith = async (code, lid, pw) => {
    if (isRetiredReviewSchool(code)) { setMsg(RETIRED_REVIEW_MESSAGE); return false; }
''')
    page = once(page, '    let s = keyOk(tid) ? await sGet(tcredKey(tid, h)) : null;\n', '''    let s = keyOk(tid) ? await sGet(tcredKey(tid, h)) : null;
    if (s && isRetiredReviewSchool(s.schoolCode)) { setMsg(RETIRED_REVIEW_MESSAGE); return; }
''')
    page = once(page, '      s = { schoolCode: ls.schoolCode, schoolName: ls.schoolName || "", teacherName: ls.teacherName || "" };', '''      if (isRetiredReviewSchool(ls.schoolCode)) { setMsg(RETIRED_REVIEW_MESSAGE); return; }
      s = { schoolCode: ls.schoolCode, schoolName: ls.schoolName || "", teacherName: ls.teacherName || "" };''')
    page = once(page, '    await sSet(schPubKey(code), { schoolName: ns.schoolName });\n    await sSet(stuKey(code), []);', '''    try {
      await dbRef(schPubKey(code)).set({ schoolName: ns.schoolName });
      await dbRef(stuKey(code)).set([]);
    } catch (e) {
      setMsg("학교 정보를 저장하지 못했어요. 입력한 계정으로 다시 로그인해 주세요.");
      return;
    }''')
    page = once(page, '    setAccountStorage(tcu); setCU(tcu);\n    const st = (await sGet(stuKey(s.schoolCode))) || [];', '''    // Resume a registration interrupted after its credential was created.
    // Existing school information and student lists are never replaced.
    const publicSchool = await sGetStrict(schPubKey(s.schoolCode));
    if (!publicSchool) await dbRef(schPubKey(s.schoolCode)).set({ schoolName: s.schoolName || "" });
    const st = (await sGetStrict(stuKey(s.schoolCode))) || [];
    setAccountStorage(tcu); setCU(tcu);''')
    page = once(page, '    setMsg("✅ 학교가 생성되었습니다! 학교 코드: " + code);', '''    setAuthOpen(false);
    setAuthView("login");
    setMsg("✅ 학교가 생성되었습니다! 학교 코드: " + code);''')
    page = once(page, 'setLF(judgeForm(judge,loginForm.role))', 'setLF(emptyLoginForm(loginForm.role))')
    page = once(page, '      onTrial:function(){setMsg("");setTE([]);return demoLogin(function(){setMsg("");setPage("trial");});},\n', '')
    page = once(page, 'setLF(judgeForm(judge, r)); },   // 탭을 옮기면 그 탭의 시연 계정으로(심사용이 켜져 있을 때). 꺼져 있으면 빈 칸', 'setLF(emptyLoginForm(r)); },')
    page = span(page, '  // 「심사용」 체크박스(2026-09-17). 켜져 있으면', 'msgBox, loginForm.role !== "teacher"')
    field = 'className: "auth-inp" + (judgeOn(loginForm.role) ? " ro" : ""), readOnly: judgeOn(loginForm.role), disabled:loginBusy,'
    assert page.count(field) == 3
    page = page.replace(field, 'className: "auth-inp", disabled:loginBusy,')
    page = span(page, '  if (page === "trial") return', '  // 섬은 화면을 꽉 채운다.')
    page = page.replace('trial:trialUser, ', '').replace('trial: trialUser,', 'trial: false,')
    page = re.sub(r'<div id="demo-ribbon"[^>]*>.*?</div>\n', '', page)
    page = re.sub(r'^.*(?:심사용 체크:|로그인·체험하기 동선은 그대로다).*$\n?', '', page, flags=re.M)
    # Unused review-specific CSS only; preserve all surrounding layout rules.
    page = re.sub(r'[^{}]*\.auth-judge[^{}]*\{[^{}]*\}', '', page)
    for name in ('review-data.js', 'review-generator.js', 'review-class.js'):
        page = re.sub(r'<script src="island-v4/[^/]+/' + re.escape(name) + r'"></script>\n?', '', page)
        assert name in assets
        del assets[name]
    for name in ('access.css', 'polish.css', 'legacy/world.css'):
        css = assets[name].decode()
        css = re.sub(r'[^{}]*\.auth-judge[^{}]*\{[^{}]*\}', '', css)
        css = re.sub(r'[^{}]*\.v2-auth-judge-hint[^{}]*\{[^{}]*\}', '', css)
        assets[name] = css.encode()
    text = assets['app.js'].decode()
    text = once(text, "MEM_ONLY?'체험 기록은 새로고침하면 사라져요.':'이 계정에 일기와 탐험 기록을 저장해요.'", "'이 계정에 일기와 탐험 기록을 저장해요.'")
    assets['app.js'] = text.encode()
    text = assets['legacy/world.js'].decode()
    text = once(text, "MEM_ONLY?MEM_NOTES.studentBand(me.name):", '')
    text = once(text, "MEM_ONLY?'체험 중':", '')
    assets['legacy/world.js'] = text.encode()
    assert not re.search(r'V4ReviewClass|judgeForm|judgeOn|setJudge|DEMO_CLOCK|DEMO_TRIAL|DEMO_TEACHER|MEM_OPS|MEM_NOTES|DemoSeedPanel|trialEntries|setTrialUser|심사용', page)
    return page, assets
