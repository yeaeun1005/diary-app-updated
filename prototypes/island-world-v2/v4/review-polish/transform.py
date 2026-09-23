def apply(s):
 def rep(a,b):
  nonlocal s
  assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
 rep('학교명·활동 기간·문의처를 작성한 뒤 보호자에게 나눠 주세요. 학생을 등록한 뒤에도 언제든 내려받을 수 있어요.','학교명, 활동 기간, 문의처를 적어 보호자에게 나눠 주세요.')
 # 2026-09-23: keep the original login help text at the user's request.
 rep('}, it.note));','}, it.note), it.url && React.createElement("a", {className:"v4-credit-link",href:it.url,target:"_blank",rel:"noopener noreferrer"},"출처 및 이용 조건"));')
 rep('<script>root.render(React.createElement(App));</script>','<link rel="stylesheet" href="__REVIEW_POLISH__/review-polish.css"><script src="__REVIEW_POLISH__/friend-guide.js"></script><script src="__REVIEW_POLISH__/diary-empathy.js"></script><script src="__REVIEW_POLISH__/credits.js"></script><script>root.render(React.createElement(App));</script>')
 return s
