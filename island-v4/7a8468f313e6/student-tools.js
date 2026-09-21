/* Original student capabilities, presented inside the current five island activities. */
const V4WritingDrafts=new Map();
function V4WritingHelper({text,emotions,situations,onEmotions,onSituations,disabled}){
 const [custom,setCustom]=useState('');
 const found=useMemo(()=>V4StudentTools.detected(text),[text]);
 const toggle=(items,value,set)=>set(items.includes(value)?items.filter(x=>x!==value):[...items,value]);
 const chip=(label,items,set)=>v4h('button',{key:label,type:'button',disabled,'aria-pressed':items.includes(label),onClick:()=>toggle(items,label,set)},label);
 return v4h('section',{className:'v4-restored-card','aria-label':'감정·상황 도움받기'},
  v4h('h4',null,'감정·상황 도움받기'),v4h('p',null,'글이 잘 떠오르지 않으면 마음과 상황부터 골라 봐요. 여러 개를 골라도 괜찮아요.'),
  v4h('h5',null,'오늘의 감정 고르기'),v4h('div',{className:'v4-chips'},EMOTIONS_28.map(e=>chip(e.label,emotions,onEmotions))),
  v4h('div',{className:'v4-custom-emotion'},v4h('label',null,'나만의 감정 표현',v4h('input',{value:custom,maxLength:40,disabled,placeholder:'목록에 없는 마음도 적어 봐요.',onChange:e=>setCustom(e.target.value)})),v4h('button',{type:'button',disabled:disabled||!custom.trim(),onClick:()=>{onEmotions([...new Set([...emotions,custom.trim()])]);setCustom('');}},'내 감정 추가')),
  emotions.filter(w=>!EMOTIONS_28.some(e=>e.label===w)).length>0&&v4h('div',{className:'v4-chips'},emotions.filter(w=>!EMOTIONS_28.some(e=>e.label===w)).map(w=>chip(w,emotions,onEmotions))),
  v4h('h5',null,'어떤 상황이었나요?'),v4h('div',{className:'v4-chips'},['친구','학교','가족','시험','놀이','혼남','칭찬','다툼','발표','운동'].map(s=>chip(s,situations,onSituations))),
  text.trim()&&v4h('div',{className:'v4-detection'},v4h('h5',null,'글에서 자동으로 찾았어요'),v4h('p',null,'감정: '+(found.words.join(' · ')||'아직 찾은 말이 없어요')),v4h('p',null,'상황: '+(found.situations.map(s=>s.ctx).join(' · ')||'아직 찾은 상황이 없어요')),found.suggested.length>0&&v4h(React.Fragment,null,v4h('p',null,'이 상황에서 느꼈을 수도 있는 마음 · 직접 골라요'),v4h('div',{className:'v4-chips'},found.suggested.map(e=>chip(e.label,emotions,onEmotions))))),
  v4h('p',{className:'v4-fine'},'언제, 누구와, 어떤 일이 있었나요? 그때의 마음은 어땠나요? 자동으로 찾은 말과 내가 고른 말은 따로 보관해요.'),
  emotions.length>0&&v4h('p',{role:'status'},'내가 고른 감정: '+emotions.join(' · ')));
}
function V4AnalysisTools({entries,initialEntryTs=null}){
 entries=useMemo(()=>V4StudentTools.refresh(entries),[entries]);
 const [period,setPeriod]=useState('all'),[scope,setScope]=useState(initialEntryTs?String(initialEntryTs):'all'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[hover,setHover]=useState(null),[focus,setFocus]=useState(null);
 const ordered=V4ActivityModel.inRange(entries,'all',dayStamp());
 const invalid=period==='custom'&&(!start||!end||start>end);
 const filtered=useMemo(()=>{
  let es=period==='custom'?ordered.filter(e=>{const d=V4ActivityModel.recordDate(e);return !invalid&&d&&d>=start&&d<=end;}):V4ActivityModel.inRange(entries,period,dayStamp());
  return scope==='all'?es:es.filter(e=>String(e.ts)===scope);
 },[entries,period,scope,start,end]);
 const summary=useMemo(()=>V4StudentTools.summarize(filtered),[filtered]);
 return v4h('section',{className:'v4-restored-analysis','aria-label':'나의 감정 분석'},
  v4h('div',{className:'v4-restored-card'},v4h('h3',null,'기록 속 마음을 살펴봐요'),v4h('p',{className:'v4-emotion-guide'},'나의 원하는 바가 이루어졌을 때 우리는 긍정적인 감정(예: 기쁨)을 느껴요. 부정적인 감정(예: 슬픔)은 내가 원하는 것이 있다는 신호에요.'),
   v4h('div',{className:'v4-segment','aria-label':'분석 기간'},[['7','최근 7일'],['30','최근 30일'],['all','전체'],['custom','직접 입력']].map(([id,label])=>v4h('button',{key:id,'aria-pressed':period===id,onClick:()=>{setPeriod(id);setHover(null);setFocus(null);}},label))),
   period==='custom'&&v4h('div',{className:'v4-date-range'},v4h('label',null,'시작 날짜',v4h('input',{type:'date',value:start,onInput:e=>setStart(e.target.value),onChange:e=>setStart(e.target.value)})),v4h('label',null,'끝 날짜',v4h('input',{type:'date',value:end,onInput:e=>setEnd(e.target.value),onChange:e=>setEnd(e.target.value)}))),
   invalid&&v4h('p',{role:'status'},'시작 날짜와 끝 날짜를 순서대로 골라 주세요.'),
   v4h('label',{className:'v4-field'},v4h('span',null,'분석할 일기'),v4h('select',{value:scope,onChange:e=>{setScope(e.target.value);setHover(null);setFocus(null);}},v4h('option',{value:'all'},'기간 안의 모든 일기'),ordered.map(e=>v4h('option',{key:e.ts,value:String(e.ts)},e.date+' · '+e.text.slice(0,28))))),
   v4h('p',{className:'v4-fine'},'선택한 일기 '+filtered.length+'편 · 가상 이야기와 게임 기록은 포함하지 않아요.')),
  !filtered.length?v4h(V4Empty,{title:'이 범위에는 아직 일기가 없어요',copy:'다른 기간을 고르거나 감정일기를 먼저 남겨 보세요.'}):v4h(React.Fragment,null,
   v4h('section',{className:'v4-restored-card'},v4h('h4',null,'긍정·부정 감정 변화'),v4h(V4AnalysisHelp,null,'감정일기에 나타난 내 마음은 어떤 특성을 보이나요?'),summary.trendEntries.length>=2?v4h(TrendChart,{entries:summary.trendEntries,readable:true}):v4h('p',null,'감정 표현을 찾은 일기가 두 편 이상이면 변화를 보여줘요.')),
   v4h('section',{className:'v4-restored-card'},v4h('h4',null,'마음 원형 그래프'),v4h(V4AnalysisHelp,null,'내 마음이 특히 한 쪽에 몰려있지는 않아요? 내가 알아챈 감정들은 어떤 특징이 있나요?'),v4h('p',{className:'v4-fine'},'왼쪽은 부정, 오른쪽은 긍정 · 위아래는 에너지의 높고 낮음이에요. 좋은 감정과 나쁜 감정을 나누는 점수는 아니에요.'),
    v4h(CircumplexChart,{entries:summary.chartEntries,hovIdx:hover===null?focus:hover,onHover:setHover,teacher:false,readable:true}),v4h('p',{className:'v4-chart-help'},'아래 날짜를 누르면 그날의 마음 말이 크게 보여요.'),
    v4h('div',{className:'v4-chips'},summary.chartEntries.map((e,i)=>v4h('button',{key:e.ts,'aria-pressed':focus===i,onClick:()=>{setHover(null);setFocus(focus===i?null:i);}},e.date+' 일기 '+(i+1))))),
   v4h('div',{className:'v4-restored-grid'},[['positive','긍정 감정 TOP 10'],['negative','부정 감정 TOP 10']].map(([kind,title])=>v4h('section',{className:'v4-restored-card',key:kind},v4h('h4',null,title),v4h(V4AnalysisHelp,null,'나는 주로 어떤 '+(kind==='positive'?'긍정':'부정')+' 감정 단어를 많이 사용했나요? 혹시 내가 알아채지 못하고 지나가는 감정이 있지는 않을까요?'),summary[kind].length?v4h(DonutChart,{data:summary[kind],size:190,title:'기록에서 살펴본 감정'}):v4h('p',null,'자동으로 찾은 표현이 없어요.'),v4h('p',{className:'v4-fine'},'같은 표현은 일기 한 편당 한 번씩 세어요. 직접 고친 감정을 반영하고, 최대 10개를 보여줘요.')))),
   v4h('div',{className:'v4-restored-grid'},[['positiveSituations','긍정 표현이 나온 상황'],['negativeSituations','부정 표현이 나온 상황']].map(([key,title])=>v4h('section',{key,className:'v4-restored-card'},v4h('h4',null,title),v4h(V4AnalysisHelp,null,'나는 주로 어떤 상황에서 '+(key==='positiveSituations'?'긍정':'부정')+' 감정을 느끼나요?'),v4h(V4WordTags,{words:summary[key].map(s=>s.text+' · '+s.count+'편'),empty:'이 범위에서 찾은 상황이 없어요.'}))))));

}
function V4AnalysisHelp({children}){return v4h('details',{className:'v4-analysis-help',open:true},v4h('summary',null,'마음을 살펴보는 질문'),v4h('p',null,children));}
const V4InsightDrafts=new Map();
function V4AnalysisCheck({me,entries,data,change,onLeavePlace}){
 const stored=V4Daily.current(data),existing=V4ActivityModel.inRange(entries,'all',dayStamp()).find(e=>V4ActivityModel.recordDate(e)===dayStamp()),d=stored.entryTs?stored:existing?{entryTs:existing.ts}:stored,key=me.schoolCode+':'+me.id+':'+String(d.entryTs||'');
 const [text,setText]=useState(()=>V4InsightDrafts.get(key)??d.insight??''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const lock=useRef(false),entry=entries.find(e=>e.ts===d.entryTs),canTalk=!!entry&&V4StudentTools.hasNegative(entry);
 async function act(event,notice){if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');try{if(!stored.entryTs)await change({type:'dailyWrite',ts:d.entryTs,date:dayStamp()});await change({...event,ts:d.entryTs});setMessage(notice);if(event.type==='dailyInsight')V4InsightDrafts.delete(key);}catch{setError('저장하지 못했어요. 입력은 그대로예요. 다시 눌러 주세요.');}finally{lock.current=false;setBusy(false);}}
 if(!d.entryTs)return v4h('section',{className:'v4-restored-card v4-analysis-check'},v4h('h3',null,'오늘의 마음 탐험'),v4h('p',null,'오늘 날짜로 일기를 저장하면 분석 확인과 알게 된 점을 남길 수 있어요.'),v4h('button',{className:'v4-primary',onClick:()=>onLeavePlace('write')},'나무 책상으로 가기'));
 return v4h('section',{className:'v4-restored-card v4-analysis-check','aria-label':'분석 확인과 알게 된 점'},
 v4h('h3',null,'내 마음을 살펴봤나요?'),v4h('p',{className:'v4-fine'},'보상을 위해 확인 후, 확인했어요 버튼을 눌러주세요.'),v4h('div',{className:'v4-actions'},v4h('button',{className:'v4-primary',disabled:busy||!!d.analysisCheckedAt,onClick:()=>act({type:'dailyAnalysis'},'오늘의 분석 확인을 저장했어요.')},d.analysisCheckedAt?'✓ 확인했어요':'확인했어요')),
 v4h('label',{className:'v4-field'},v4h('span',null,'알게 된 점 한 가지 (선택)'),v4h('textarea',{value:text,rows:3,maxLength:1000,disabled:busy,placeholder:'예: 나는 친구와 함께할 때 즐거움을 자주 느꼈어요.',onChange:e=>{setText(e.target.value);V4InsightDrafts.set(key,e.target.value);setMessage('');}})),
 v4h('div',{className:'v4-actions'},v4h('button',{disabled:busy||!text.trim(),onClick:()=>act({type:'dailyInsight',text,deferred:false},'알게 된 점을 저장했어요.')},'알게 된 점 저장하기'),v4h('button',{className:'v4-text',disabled:busy,onClick:()=>act({type:'dailyInsight',text,deferred:true},'알게 된 점은 다음에 써도 괜찮아요.')},'다음에 쓸게요')),
 d.analysisCheckedAt&&!d.completedAt&&v4h('div',{className:'v4-talk-next'},v4h('h4',null,'오늘의 마음 대화'),!canTalk&&v4h('p',null,'이 일기에는 부정 감정이 없어 마음 대화를 만들지 않아요.'),v4h('div',{className:'v4-actions'},canTalk&&v4h('button',{className:'v4-primary',disabled:busy,onClick:()=>onLeavePlace('talk','빛나는 마음 우체통에서 오늘의 대화를 남겨요.')},'마음 대화하러 가기'),v4h('button',{disabled:busy,onClick:()=>act({type:'dailyTalk',status:'skipped'},'오늘의 마음 탐험을 마쳤어요.')},'오늘은 대화할 내용이 없어요'))),
 message&&v4h('p',{role:'status'},message),error&&v4h('p',{role:'alert'},error));
}

function V4RecentEntries({entries,onUpdate}){
 const sorted=V4ActivityModel.inRange(entries,'all',dayStamp());
 const [all,setAll]=useState(false),[editing,setEditing]=useState(null);
 return v4h('section',{className:'v4-recent','aria-label':'최근 일기'},v4h('div',{className:'v4-recent-heading'},v4h('h3',null,'최근 일기'),v4h('span',null,'총 '+sorted.length+'편')),
  !sorted.length?v4h('p',{className:'v4-fine'},'일기를 저장하면 이곳에서 감정과 비율을 살펴볼 수 있어요.'):(all?sorted:sorted.slice(0,5)).map(e=>v4h(V4RecentEntry,{key:e.ts,entry:e,onUpdate,editing:editing===e.ts,onEdit:()=>setEditing(e.ts),onClose:()=>setEditing(null)})),
  sorted.length>5&&v4h('button',{className:'v4-text',onClick:()=>setAll(!all)},all?'최근 5편만 보기':'이전 일기도 보기'));
}
function V4RecentEntry({entry,onUpdate,editing,onEdit,onClose}){
 const shown=V4StudentTools.refresh([entry])[0],a=shown.analysis||{},pos=Number.isFinite(a.posPct)?Math.round(a.posPct):0,neg=Number.isFinite(a.negPct)?Math.round(a.negPct):0;
 return v4h('article',{className:'v4-recent-entry'},v4h('header',null,v4h('strong',null,entry.date),v4h('small',null,a.corrected?'내가 고른 감정':'글에서 찾은 감정')),
  v4h('p',{className:'v4-journal-text'},entry.text),v4h(V4WordTags,{words:(a.hits||[]).map(h=>h.label),empty:'찾은 감정이 없어요. 내 감정을 직접 고를 수 있어요.'}),
  v4h('div',{className:'v4-emotion-ratio','aria-label':'긍정 '+pos+'%, 부정 '+neg+'%'},v4h('span',null,'긍정 '+pos+'%'),v4h('span',null,'부정 '+neg+'%')),
  a.status==='unavailable'&&v4h('p',{className:'v4-fine'},'자동 분석을 불러오지 못했어요.'),
  !editing?v4h('button',{className:'v4-text',onClick:onEdit},'내 감정은 달라요'):v4h(V4EmotionCorrection,{key:entry.ts,entry:shown,onUpdate,onClose}));
}
function V4EmotionCorrection({entry,onUpdate,onClose}){
 const manual=entry.analysis?.corrected,customHit=manual&&(entry.analysis.hits||[]).find(h=>h.custom),initial=manual?(entry.analysis.hits||[]).filter(h=>!h.custom).map(h=>h.label):[];
 const [selected,setSelected]=useState(initial),[customOn,setCustomOn]=useState(!!customHit),[custom,setCustom]=useState(customHit?.label||''),[valence,setValence]=useState(customHit?customHit.val9>5?'pos':customHit.val9<5?'neg':'neu':'neu'),[energy,setEnergy]=useState(customHit?customHit.aro9>5?'high':customHit.aro9<5?'low':'mid':'mid'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false);
 async function save(){if(lock.current||(!selected.length&&(!customOn||!custom.trim())))return;lock.current=true;setBusy(true);setError('');try{const updated=V4StudentTools.correct(entry,selected,customOn?custom:'',valence,energy);await onUpdate(updated);onClose();}catch{setError('감정을 저장하지 못했어요. 고른 내용은 그대로예요. 다시 시도해 주세요.');}finally{lock.current=false;setBusy(false);}}
 const options=(label,values,value,set)=>v4h('fieldset',null,v4h('legend',null,label),v4h('div',{className:'v4-chips'},values.map(([id,name])=>v4h('button',{key:id,type:'button',disabled:busy,'aria-pressed':value===id,onClick:()=>set(id)},name))));
 return v4h('section',{className:'v4-correction','aria-label':'내 감정 수정'},v4h('h4',null,'어떤 감정이었나요?'),v4h('p',null,'여러 감정을 골라도 괜찮아요. 일기 내용은 그대로 두고 내 감정만 바꿔요.'),
  v4h('div',{className:'v4-chips'},EMOTIONS_28.map(e=>v4h('button',{key:e.name,type:'button',disabled:busy,'aria-pressed':selected.includes(e.label),onClick:()=>setSelected(xs=>xs.includes(e.label)?xs.filter(x=>x!==e.label):[...xs,e.label])},e.label))),
  v4h('button',{className:'v4-text',disabled:busy,'aria-expanded':customOn,onClick:()=>setCustomOn(!customOn)},'+ 기타(직접 입력)'),
  customOn&&v4h('div',{className:'v4-custom-correction'},v4h('label',{className:'v4-field'},v4h('span',null,'나만의 감정 표현'),v4h('input',{value:custom,maxLength:40,disabled:busy,onChange:e=>setCustom(e.target.value),placeholder:'예: 머쓱함, 후련함'})),options('이 감정은',[['pos','긍정'],['neu','중립'],['neg','부정']],valence,setValence),options('내 에너지는',[['high','높아요'],['mid','보통이에요'],['low','낮아요']],energy,setEnergy)),
  v4h('div',{className:'v4-actions'},v4h('button',{className:'v4-primary',disabled:busy||(!selected.length&&(!customOn||!custom.trim())),onClick:save},busy?'저장 중…':'이 감정으로 저장하기'),v4h('button',{disabled:busy,onClick:onClose},'취소')),error&&v4h('p',{role:'alert'},error));
}
