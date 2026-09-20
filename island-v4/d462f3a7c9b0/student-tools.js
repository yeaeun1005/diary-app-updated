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
 const [period,setPeriod]=useState('all'),[scope,setScope]=useState(initialEntryTs?String(initialEntryTs):'all'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[hover,setHover]=useState(null),[focus,setFocus]=useState(null);
 const ordered=V4ActivityModel.inRange(entries,'all',dayStamp());
 const invalid=period==='custom'&&(!start||!end||start>end);
 const filtered=useMemo(()=>{
  let es=period==='custom'?ordered.filter(e=>{const d=V4ActivityModel.recordDate(e);return !invalid&&d&&d>=start&&d<=end;}):V4ActivityModel.inRange(entries,period,dayStamp());
  return scope==='all'?es:es.filter(e=>String(e.ts)===scope);
 },[entries,period,scope,start,end]);
 const summary=useMemo(()=>V4StudentTools.summarize(filtered),[filtered]);
 return v4h('section',{className:'v4-restored-analysis','aria-label':'나의 감정 분석'},
  v4h('div',{className:'v4-restored-card'},v4h('h3',null,'기록 속 마음을 살펴봐요'),
   v4h('div',{className:'v4-segment','aria-label':'분석 기간'},[['7','최근 7일'],['30','최근 30일'],['all','전체'],['custom','직접 입력']].map(([id,label])=>v4h('button',{key:id,'aria-pressed':period===id,onClick:()=>{setPeriod(id);setHover(null);setFocus(null);}},label))),
   period==='custom'&&v4h('div',{className:'v4-date-range'},v4h('label',null,'시작 날짜',v4h('input',{type:'date',value:start,onInput:e=>setStart(e.target.value),onChange:e=>setStart(e.target.value)})),v4h('label',null,'끝 날짜',v4h('input',{type:'date',value:end,onInput:e=>setEnd(e.target.value),onChange:e=>setEnd(e.target.value)}))),
   invalid&&v4h('p',{role:'status'},'시작 날짜와 끝 날짜를 순서대로 골라 주세요.'),
   v4h('label',{className:'v4-field'},v4h('span',null,'분석할 일기'),v4h('select',{value:scope,onChange:e=>{setScope(e.target.value);setHover(null);setFocus(null);}},v4h('option',{value:'all'},'기간 안의 모든 일기'),ordered.map(e=>v4h('option',{key:e.ts,value:String(e.ts)},e.date+' · '+e.text.slice(0,28))))),
   v4h('p',{className:'v4-fine'},'선택한 일기 '+filtered.length+'편 · 가상 이야기와 게임 기록은 포함하지 않아요.')),
  !filtered.length?v4h(V4Empty,{title:'이 범위에는 아직 일기가 없어요',copy:'다른 기간을 고르거나 감정일기를 먼저 남겨 보세요.'}):v4h(React.Fragment,null,
   v4h('section',{className:'v4-restored-card'},v4h('h4',null,'긍정·부정 감정 변화'),summary.trendEntries.length>=2?v4h(TrendChart,{entries:summary.trendEntries,readable:true}):v4h('p',null,'감정 표현을 찾은 일기가 두 편 이상이면 변화를 보여줘요.')),
   v4h('section',{className:'v4-restored-card'},v4h('h4',null,'마음 원형 그래프'),v4h('p',{className:'v4-fine'},'왼쪽은 부정, 오른쪽은 긍정 · 위아래는 에너지의 높고 낮음이에요. 좋은 감정과 나쁜 감정을 나누는 점수는 아니에요.'),
    v4h(CircumplexChart,{entries:summary.chartEntries,hovIdx:hover===null?focus:hover,onHover:setHover,teacher:false,readable:true}),v4h('p',{className:'v4-chart-help'},'아래 날짜를 누르면 그날의 마음 말이 크게 보여요.'),
    v4h('div',{className:'v4-chips'},summary.chartEntries.map((e,i)=>v4h('button',{key:e.ts,'aria-pressed':focus===i,onClick:()=>{setHover(null);setFocus(focus===i?null:i);}},e.date+' 일기 '+(i+1))))),
   v4h('div',{className:'v4-restored-grid'},[['positive','긍정 감정 TOP 10'],['negative','부정 감정 TOP 10']].map(([kind,title])=>v4h('section',{className:'v4-restored-card',key:kind},v4h('h4',null,title),summary[kind].length?v4h(DonutChart,{data:summary[kind],size:190,title:'글에서 찾은 표현'}):v4h('p',null,'자동으로 찾은 표현이 없어요.'),v4h('p',{className:'v4-fine'},'같은 표현은 일기 한 편당 한 번씩 세어요. 최대 10개를 보여줘요.')))),
   v4h('div',{className:'v4-restored-grid'},[['positiveSituations','긍정 표현이 나온 상황'],['negativeSituations','부정 표현이 나온 상황']].map(([key,title])=>v4h('section',{key,className:'v4-restored-card'},v4h('h4',null,title),v4h(V4WordTags,{words:summary[key].map(s=>s.text+' · '+s.count+'편'),empty:'이 범위에서 찾은 상황이 없어요.'}))))));

}
