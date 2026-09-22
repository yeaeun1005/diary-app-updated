def apply(s):
 def rep(a,b):
  nonlocal s
  assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
 rep('    if(loginLock.current)return;','    if(loginLock.current)return;\n    SND.play("login");')
 rep('if (page === "privacy") return React.createElement("div", {\n    style: shell','if (page === "privacy") return React.createElement("div", {\n    className:"v4-readable-page", style: shell')
 rep('function CreditsPage(props) {\n  return React.createElement("div", { style: shell }','function CreditsPage(props) {\n  return React.createElement("div", { className:"v4-readable-page", style: shell }')
 rep('// CC0만 쓰고 출처는 CREDITS.md에 적는다.','// 기존 소리와 사용자가 선택한 Pixabay 효과음. 출처와 라이선스는 CREDITS.md에 기록한다.')
 rep('<script>root.render(React.createElement(App));</script>','<link rel="stylesheet" href="__AUDIO_TYPE__/typography.css"><script src="__AUDIO_TYPE__/sound.js"></script><script>root.render(React.createElement(App));</script>')
 return s
