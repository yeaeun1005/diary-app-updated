def apply(s):
 def rep(a,b):
  nonlocal s
  assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
 rep('judge ? " · 학생과 선생님이 같은 가상 학급으로 들어가요" : " · 내 계정으로 들어가요"','judge ? "학생과 선생님 화면을 체험할 수 있어요." : "학교에서 받은 계정으로 로그인해요."')
 rep('loginForm.role==="teacher"?"우리 반 마음을 만나 볼까요?":"마음 바다로 출발해 볼까요?"','loginForm.role==="teacher"?"선생님 로그인":"내 마음섬으로 들어가기"')
 rep('"선생님이 알려주신 정보로 들어와요."','"학교에서 받은 계정을 입력해 주세요."')
 rep('return "둘러보기 중 · " + t + (bat ? "은" : "는") + " 가상 학생이에요 · 쓴 것은 저장되지 않아요";', 'return "가상 학급 체험 중. 새로고침하면 기록이 초기화돼요.";')
 # Keep the learning scene visible through a real spotlight during movement.
 rep('style: { ...st, background: TUT.mask }','style: { ...st, background: TUT.mask, pointerEvents:step.walkMask?"none":undefined }')
 # Free tours should not leave four opaque corner patches on their target.
 rep('corner("tl", "100% 100%", { left: 0, top: 0 }), corner("tr", "0% 100%", { right: 0, top: 0 }),\n      corner("bl", "100% 0%", { left: 0, bottom: 0 }), corner("br", "0% 0%", { right: 0, bottom: 0 }),','!step.free && [corner("tl", "100% 100%", { left: 0, top: 0 }), corner("tr", "0% 100%", { right: 0, top: 0 }),\n      corner("bl", "100% 0%", { left: 0, bottom: 0 }), corner("br", "0% 0%", { right: 0, bottom: 0 })],')
 rep('<script>root.render(React.createElement(App));</script>','<link rel="stylesheet" href="__POLISH__/polish.css"><script src="__POLISH__/guides.js"></script><script>root.render(React.createElement(App));</script>')
 return s
