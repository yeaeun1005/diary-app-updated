"""Exact V4 HTML integration, shared behavior with the approved 8775 preview."""
import re
def apply(page):
 def once(a,b):
  nonlocal page
  assert page.count(a)==1,(a,page.count(a))
  page=page.replace(a,b)
 once('return React.createElement(V2App, {','return React.createElement(V4App, {')
 once('me:currentUser, entries:myEntries, trial:trialUser,','me:currentUser, entries:myEntries, trial:trialUser, onAdd:myAdd,onUpdate:myUpdate,onDelete:myDelete,setEntries:setME,')
 once('function DiaryView({\n  entries,','function DiaryView({\n  initialTab=null,\n  entries,')
 once('useState(readOnly ? "change" : "input")','useState(initialTab || (readOnly ? "change" : "input"))')
 once('    hits: a.hits || [],','    status: a.status || \"ready\", studentSelection: a.studentSelection || [],\n    hits: a.hits || [],')
 # V4 allows reflection on any selected diary, without requiring negative labels.
 once('function MindChat({\n  entries,','function MindChat({\n  allowAll=false,\n  entries,')
 once('return hasNeg && !hasChat;','return (allowAll || hasNeg) && !hasChat;')
 old_filter='var negEmo = (en.analysis.hits || []).filter(function (h) {\n      return h.val9 < 5;'
 assert page.count(old_filter)==2
 page=page.replace(old_filter,old_filter.replace('return h.val9 < 5;','return allowAll || h.val9 < 5;'))
 once('emotion: negEmo.join(\", \") || \"부정 감정\",','emotion: negEmo.join(\", \") || (allowAll ? \"내가 고를 마음\" : \"부정 감정\"),')
 import json
 for old,new in [('부정적 감정이 감지된 일기예요. 마음 속을 탐험해볼까요?','기억에 남는 일이 있나요? 필요한 도움과 해 볼 행동을 함께 생각해요.'),('부정적 감정이 발견되지 않았어요. 감정 일기를 먼저 작성해보세요.','대화를 시작할 기록을 골라 주세요. 어떤 마음이든 괜찮아요.')]:
  matches=[]
  chunk=page[page.index('function MindChat({'):page.index('function MindChat({')+40000]
  for m in re.finditer(r'"(?:[^"\\]|\\.)*"',chunk):
   try: value=json.loads(m.group())
   except (ValueError,TypeError): continue
   if value==old: matches.append(m.group())

  assert len(matches)==1,old
  once(matches[0],'(allowAll ? '+json.dumps(new,ensure_ascii=False)+' : '+matches[0]+')')
 # Preserve original text even when the retained legacy screen confirms an unmatched emotion.
 once('const augmented = pending.text + " " + emo.kw[0];\n    doSave(augmented, pending.date);','const a=analyzeEntry(pending.text);\n    doSave(pending.text,pending.date,{...a,studentSelection:[emo.label]});')
 once('const augmented = pending.text + " " + customEmo.trim();\n    doSave(augmented, pending.date);','const a=analyzeEntry(pending.text);\n    doSave(pending.text,pending.date,{...a,studentSelection:[customEmo.trim()]});')
 return page
