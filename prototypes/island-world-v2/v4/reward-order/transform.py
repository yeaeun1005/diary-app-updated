"""Make the next required reward step visible; preserve all award conditions."""


def replace_once(text, old, new):
    assert text.count(old) == 1, old[:100]
    return text.replace(old, new)


def apply(assets):
    text = assets['app.js'].decode()
    text = replace_once(text,
        "panel==='talk'&&v4h(V4Talk,{me,entries,data,change,onLeavePlace}),",
        "panel==='talk'&&v4h(V4Talk,{me,entries,data,change,onLeavePlace,onEarned}),")
    assets['app.js'] = text.encode()

    text = assets['activities.js'].decode()
    text = replace_once(text,
        'function V4Talk({me,entries,data,change,onLeavePlace}){',
        'function V4Talk({me,entries,data,change,onLeavePlace,onEarned}){')
    anchor = " const btn=(label,onClick,cls='',disabled=false)=>v4h('button',{type:'button',onClick,className:cls,disabled:busy||disabled},label);"
    addition = '''
 const today=V4Daily.current(data),todayEntry=entries.find(e=>e.ts===today.entryTs),todayCanTalk=!!todayEntry&&V4StudentTools.hasNegative(todayEntry);
 async function finishWithoutTalk(){
  if(lock.current||!todayEntry||todayCanTalk||!today.analysisCheckedAt)return;
  lock.current=true;setBusy(true);setError('');
  try{await change({type:'dailyTalk',ts:today.entryTs,status:'skipped'});}
  catch{if(mounted.current)setError('완료를 저장하지 못했어요. 다시 눌러 주세요.');}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 function completionNext(){
  let message,action,label;
  if(today.completedAt){message='오늘의 마음 탐험을 이미 마쳤어요. 완료 화면에서 선물을 확인할 수 있어요.';label='완료 선물 확인하기';action=onEarned;}
  else if(!today.entryTs){message='오늘 날짜의 일기를 저장하면 오늘의 마음 탐험을 이어갈 수 있어요.';label='오늘 일기 쓰러 가기';action=()=>onLeavePlace('write');}
  else if(!today.analysisCheckedAt){message='분석 확인이 아직 남아 있어요. 감정 분석에서 확인했어요를 누르면 저장한 대화와 함께 완료 여부를 확인해요.';label='분석 확인하러 가기';action=()=>onLeavePlace('review','감정 분석 아래의 확인했어요 버튼을 눌러요.');}
  else if(!todayCanTalk){message='오늘 탐험의 일기에는 대화할 부정 감정이 없어요. 아래 버튼으로 오늘의 탐험을 마칠 수 있어요.';label='오늘은 대화할 내용이 없어요';action=finishWithoutTalk;}
  else if(fiction||entry?.ts!==today.entryTs){message='이 대화는 저장했어요. 오늘의 선물을 받으려면 오늘 탐험에 연결된 일기로 마음 대화를 남겨요.';label='오늘 탐험의 일기로 대화하기';action=()=>choose(String(today.entryTs));}
  else return null;
  return v4h('section',{className:'v4-talk-next','aria-label':'오늘 탐험 마무리'},v4h('h4',null,'오늘의 마음 탐험'),v4h('p',null,message),action&&btn(label,action,'v4-primary'));
 }
'''
    text = replace_once(text, anchor, anchor + addition)
    text = replace_once(text,
        "btn('가상 이야기로 연습하기',()=>choose('fiction'),'v4-text'),chats.length>0",
        "btn('가상 이야기로 연습하기',()=>choose('fiction'),'v4-text'),completionNext(),error&&v4h('p',{className:'v4-inline-error',role:'alert'},error),chats.length>0")
    text = replace_once(text,
        "summary(draft),btn('조금 더 생각하기'",
        "summary(draft),completionNext(),btn('조금 더 생각하기'")
    assets['activities.js'] = text.encode()

    text = assets['review-class.js'].decode()
    text = replace_once(text,
        "   for(const s of generated.students){\n    const diary={_migrated:true};for(const e of generated.entries[s.id]||[])diary[entryKey(e.ts)]={ts:e.ts,date:e.date,text:e.text,analysis:e.analysis};",
        "   const reviewStartedAt=Date.now();\n   for(const s of generated.students){\n    const diary={_migrated:true};\n    function exampleTs(value){let ts=Math.min(value,reviewStartedAt-1);while(diary[entryKey(ts)])ts--;return ts;}\n    for(const e of generated.entries[s.id]||[]){const ts=exampleTs(e.ts);diary[entryKey(ts)]={ts,date:e.date,text:e.text,analysis:{...e.analysis,entryDate:dayStamp(e.ts)}};}")
    text = replace_once(text,
        "const ts=new Date(DEMO_CLOCK+'T15:00:00').getTime(),text=",
        "const ts=exampleTs(new Date(DEMO_CLOCK+'T15:00:00').getTime()),text=")
    text = replace_once(text,
        "diary[entryKey(ts)]={ts,date:fmtDate(new Date(ts)),text,analysis:analyzeEntry(text)};",
        "diary[entryKey(ts)]={ts,date:fmtDate(new Date(DEMO_CLOCK+'T12:00:00')),text,analysis:{...analyzeEntry(text),entryDate:DEMO_CLOCK}};")
    assets['review-class.js'] = text.encode()
    return assets
