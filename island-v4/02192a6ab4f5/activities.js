/* Student activity views. Existing diary/chat stores and games remain the source of truth. */
const V4ActivityDrafts=new Map();
function v4ActivityIcon(kind){
 const paths={talk:'M6 7h20v14H15l-6 5v-5H6z M11 12h10 M11 16h6',practice:'M7 6h8v20H7z M19 6h6v20h-6z M10 11h2 M21 11h2',archive:'M5 9h22v18H5z M4 5h24v4H4 M12 15h8',write:'M7 25l2-7L23 4l5 5-14 14z M18 9l5 5',review:'M13 5a8 8 0 1 0 0 16a8 8 0 1 0 0-16 M19 19l8 8'};
 return v4h('svg',{viewBox:'0 0 32 32',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},v4h('path',{d:paths[kind]||paths.archive}));
}
function V4ActivityHeading({kind,kicker,title,copy}){
 return v4h('div',{className:'v4-activity-hero'},v4h('div',null,v4h('small',null,kicker),v4h('h3',null,title),v4h('p',null,copy)),v4h('div',{className:'v4-activity-emblem'},v4ActivityIcon(kind)));
}
function V4Empty({title,copy,onWrite}){
 return v4h('div',{className:'v4-empty'},v4ActivityIcon('archive'),v4h('h4',null,title),v4h('p',null,copy),onWrite&&v4h('button',{className:'v4-primary',onClick:onWrite},'책상으로 가기'));
}
function V4WordTags({words,empty='아직 고른 말이 없어요'}){
 return words.length?v4h('div',{className:'v4-word-tags'},words.map(w=>v4h('span',{key:w},w))):v4h('p',{className:'v4-fine'},empty);
}
function V4Talk({me,entries,data,change,onLeavePlace}){
 const sorted=V4ActivityModel.inRange(entries,'all',dayStamp());
 const initial=data.context?.kind==='fiction'?'fiction':String(sorted.find(e=>e.ts===data.selectedEntryTs)?.ts||sorted[0]?.ts||'fiction');
 const [pick,setPick]=useState(initial),[chats,setChats]=useState([]),[load,setLoad]=useState('loading'),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false),[tick,setTick]=useState(0);
 const lock=useRef(false),mounted=useRef(true);
 const entry=sorted.find(e=>String(e.ts)===pick),fiction=pick==='fiction',raw=fiction?V4Content.story:entry?.text||'';
 const cacheKey=me.schoolCode+':'+me.id+':'+pick;
 let draft=V4ActivityDrafts.get(cacheKey);
 if(!draft||draft.raw!==raw){draft={raw,step:0,feeling:'',need:'',action:'',helpful:'',nextPlan:''};V4ActivityDrafts.set(cacheKey,draft);}
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{let active=true;setLoad('loading');(async()=>{try{if(V4_QUERY.get('readFail')==='1')throw Error('local-read-failure');const value=await sGetStrict(chatKey(me.id));if(value!==null&&value!==undefined&&!Array.isArray(value))throw Error('chat-format');if(active){setChats(value||[]);setLoad('ready');}}catch{if(active)setLoad('error');}})();return()=>{active=false;};},[me.id,attempt]);
 function update(field,value){draft[field]=value;setSaved(false);setError('');setTick(n=>n+1);}
 function choose(value){setPick(value);setSaved(false);setError('');if(value!=='fiction')change({type:'selectEntry',ts:Number(value)}).catch(()=>setError('기록 선택을 보관하지 못했어요. 다시 골라 주세요.'));}
 const history=fiction?[]:chats.filter(c=>c.entryTs===entry?.ts);
 const selectedWords=entry?V4ActivityModel.words(entry,data.choices):{auto:[],chosen:[]};
 const any=['feeling','need','action','helpful','nextPlan'].some(k=>draft[k].trim());
 async function save(){
  if(lock.current||!any)return;lock.current=true;setBusy(true);setError('');
  try{
   if(V4_QUERY.get('saveFail')==='1')throw Error('local-write-failure');
   if(fiction){await change({type:'talk',ts:null,text:['그때의 마음: '+(draft.feeling||'아직 고르지 않았어요'),'중요했던 것: '+(draft.need||'아직 고르지 않았어요'),'그때 한 행동: '+(draft.action||'아직 적지 않았어요'),'도움이 되었는지: '+(draft.helpful||'아직 모르겠어요'),'해 볼 행동: '+(draft.nextPlan||'천천히 생각해 볼게요')].join('\n')});}
   else {
    const latest=await sGetStrict(chatKey(me.id));
    const record={entryTs:entry.ts,entryDate:entry.date,entryText:entry.text,emotion:draft.feeling,observation:entry.text,feeling:draft.feeling,need:draft.need,action:draft.action,helpful:draft.helpful,nextPlan:draft.nextPlan,completed:true,step:7};
    const next=V4ActivityModel.upsertChat(latest,record);
    await dbRef(chatKey(me.id)).set(next);if(mounted.current)setChats(next);
   }
   if(mounted.current)setSaved(true);
  }catch{if(mounted.current)setError('저장하지 못했어요. 적은 내용은 그대로 있으니 다시 시도해 주세요.');}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 const btn=(label,onClick,cls='',disabled=false)=>v4h('button',{type:'button',onClick,className:cls,disabled:busy||disabled},label);
 const field=(key,label,placeholder,rows=3)=>v4h('label',{className:'v4-field'},v4h('span',null,label),v4h('textarea',{value:draft[key],onChange:e=>update(key,e.target.value),placeholder,rows,disabled:busy}));
 const steps=['그때의 마음','중요했던 것','도움과 다음 행동'];
 return v4h(React.Fragment,null,
  v4h(V4ActivityHeading,{kind:'talk',kicker:'정원 벤치 · 나를 위한 잠깐',title:'마음에 남은 일을, 천천히.',copy:'어떤 마음이든 괜찮아요. 답이 떠오르지 않는 질문은 건너뛰어도 돼요.'}),
  v4h('div',{className:'v4-activity-columns'},
   v4h('aside',{className:'v4-context-card'},v4h('label',{className:'v4-field'},v4h('span',null,'어떤 이야기를 나눌까요?'),v4h('select',{value:pick,onChange:e=>choose(e.target.value),disabled:busy},sorted.map(e=>v4h('option',{key:e.ts,value:String(e.ts)},e.date+' · '+e.text.slice(0,22))),v4h('option',{value:'fiction'},'가상 이야기로 생각하기'))),v4h('span',{className:'v4-eyebrow'},fiction?'가상 이야기 · 연습용':'내가 고른 일기'),v4h('blockquote',null,raw),v4h('p',{className:'v4-fine'},fiction?'여기에서 남긴 생각은 개인 일기 편수나 감정 집계에 들어가지 않아요.':'원래 쓴 글은 그대로 두고, 대화에서 떠오른 생각을 따로 남겨요.'),!fiction&&v4h(React.Fragment,null,v4h('h4',null,'내가 고른 마음 말'),v4h(V4WordTags,{words:selectedWords.chosen}),v4h('details',null,v4h('summary',null,'글에서 자동으로 찾은 말'),v4h(V4WordTags,{words:selectedWords.auto,empty:'자동으로 찾은 말이 없어도 대화할 수 있어요.'})))),
   v4h('div',{className:'v4-work-card'},
    v4h(V4TalkDetection,{text:raw,chosen:selectedWords.chosen,feeling:draft.feeling,onFeeling:value=>update('feeling',value),disabled:busy}),
    v4h('nav',{className:'v4-step-nav','aria-label':'마음 대화 순서'},steps.map((label,i)=>v4h('button',{key:label,'aria-current':draft.step===i?'step':undefined,onClick:()=>update('step',i),disabled:busy},v4h('span',null,String(i+1).padStart(2,'0')),label))),
    saved?v4h('section',{className:'v4-saved',role:'status'},v4h('span',{className:'v4-saved-mark'},'✓'),v4h('h4',null,'내 생각을 남겼어요'),v4h('p',null,'지금 답이 정해지지 않아도 괜찮아요. 나중에 다시 돌아볼 수 있어요.'),v4h('dl',null,['feeling','need','action','helpful','nextPlan'].map((k,i)=>draft[k]&&v4h(React.Fragment,{key:k},v4h('dt',null,['그때의 마음','중요했던 것','그때 한 행동','도움이 되었는지','해 볼 행동'][i]),v4h('dd',null,draft[k])))),btn('조금 더 생각하기',()=>setSaved(false)),btn('일기 보관함 밝히기',()=>onLeavePlace('archive'),'v4-primary')):
    v4h(React.Fragment,null,
     draft.step===0&&v4h(React.Fragment,null,v4h('span',{className:'v4-eyebrow'},'01 · 느꼈던 마음'),v4h('h4',null,fiction?'이 인물은 어떤 마음이었을까요?':'그때 어떤 마음이 들었나요?'),v4h('p',null,'여러 마음을 적어도 좋아요. 자동으로 찾은 말과 달라도 괜찮아요.'),field('feeling','마음에 가까운 표현','나의 말로 적어도 괜찮아요.'),v4h('div',{className:'v4-chips'},[...new Set([...selectedWords.chosen,...selectedWords.auto,'아직 잘 모르겠어요'])].map(w=>btn(w,()=>update('feeling',draft.feeling?draft.feeling+' · '+w:w))))),
     draft.step===1&&v4h(React.Fragment,null,v4h('span',{className:'v4-eyebrow'},'02 · 내 마음의 바람'),v4h('h4',null,fiction?'이 인물에게 무엇이 중요했을까요?':'나에게 무엇이 중요했나요?'),v4h('p',null,'원했던 것이나 필요했던 도움을 떠올려 봐요.'),field('need','중요했던 것 또는 필요했던 도움','함께하고 싶었어. 잠깐 쉬고 싶었어…'),v4h('div',{className:'v4-chips'},[...NEED_OPTIONS,'아직 모르겠어요'].map(w=>btn(w,()=>update('need',w))))),
     draft.step===2&&v4h(React.Fragment,null,v4h('span',{className:'v4-eyebrow'},'03 · 작은 다음 걸음'),v4h('h4',null,'나에게 도움이 될 것을 찾아봐요'),v4h('p',null,'모든 칸을 채울 필요는 없어요. 바로 행동하지 않고 더 생각해도 좋아요.'),field('action',fiction?'이야기 속에서 한 행동 (선택)':'그때 내가 한 행동 (선택)','기억나는 만큼만 적어요.',2),v4h('div',{className:'v4-chips','aria-label':'그때 한 행동 예시'},ACTION_OPTIONS.map(w=>btn(w,()=>update('action',w)))),field('helpful','그 행동이 도움이 되었나요? (선택)','도움이 되었거나 아쉬웠던 점, 아직 모르는 점.',2),v4h('div',{className:'v4-chips'},['도움이 되었어요','조금 도움이 되었어요','도움이 되지 않았어요','아직 잘 모르겠어요'].map(w=>btn(w,()=>update('helpful',w)))),field('nextPlan','필요한 도움이나 해 볼 행동 (선택)','믿을 수 있는 사람에게 이야기하기, 잠시 쉬기…',2),v4h(V4ActionSuggestions,{text:raw,value:draft.nextPlan,onChoose:value=>update('nextPlan',value),disabled:busy})),
     v4h('div',{className:'v4-activity-footer'},draft.step>0&&btn('이전 질문',()=>update('step',draft.step-1)),draft.step<2?btn('다음 질문 →',()=>update('step',draft.step+1),'v4-primary'):btn(busy?'저장 중…':'내 생각 저장하기',save,'v4-primary',!any||(!fiction&&load!=='ready')),draft.step<2&&btn('이 질문은 건너뛰기',()=>update('step',draft.step+1),'v4-text')),
     v4h('p',{className:'v4-fine'},'적는 중인 생각은 이 섬을 둘러보는 동안 이어 쓸 수 있어요.')),
    error&&v4h('p',{className:'v4-inline-error',role:'alert'},error),
    !fiction&&load==='error'&&v4h('div',{className:'v4-inline-error',role:'alert'},'지난 대화를 불러오지 못했어요. 기록을 보호하기 위해 저장을 잠시 멈췄어요.',btn('다시 불러오기',()=>setAttempt(n=>n+1))),
    !fiction&&load==='loading'&&v4h('p',{role:'status'},'지난 대화를 불러오고 있어요…'),
    (history.length>0||(fiction&&data.talk.fiction))&&v4h('details',{className:'v4-history'},v4h('summary',null,'남겨 둔 생각 다시 보기'),fiction?v4h('p',null,data.talk.fiction):history.map((c,i)=>v4h('article',{key:i},v4h('p',null,c.feeling||'마음을 아직 고르지 않았어요'),v4h('dl',null,['need','action','helpful','nextPlan'].map((k,j)=>c[k]&&v4h(React.Fragment,{key:k},v4h('dt',null,['중요했던 것','그때 한 행동','도움이 되었는지','다음 행동'][j]),v4h('dd',null,c[k])))),btn('이 생각에서 이어 쓰기',()=>{for(const k of ['feeling','need','action','helpful','nextPlan'])draft[k]=c[k]||'';draft.step=0;setSaved(false);setTick(n=>n+1);})))))));
}
function V4Practice(){
 const [mode,setMode]=useState('choose'),[pair,setPair]=useState(['행복','즐거움']);
 const pairs=[['행복','즐거움'],['슬픔','우울'],['긴장','불안'],['편안','차분']];
 const games={deepsea:DeepSeaGame,shell:ShellMatchGame,merge:OceanMergeGame};
 const options=[['words','마음 말 나란히 보기','닮은 두 말의 뜻을 천천히 살펴봐요.','글자 카드'],['deepsea','깊은 바다 탐험','상황 속 마음 말을 만나며 바다를 탐험해요.','상황 놀이'],['shell','감정 조개 매칭','게임에서 정한 카드 짝을 기억해 봐요.','기억 놀이'],['merge','바다 생물 합치기','잠깐 쉬어 가며 같은 생물을 모아 봐요.','쉬어 가기']];
 const back=v4h('button',{className:'v4-text',onClick:()=>setMode('choose')},'← 다른 연습 고르기');
 return v4h(React.Fragment,null,v4h(V4ActivityHeading,{kind:'practice',kicker:'작은 작업대 · 나의 속도로',title:'닮은 마음도, 조금씩 달라요.',copy:'뜻을 살펴보거나 놀이로 만나 봐요. 빠르게 끝내지 않아도 괜찮아요.'}),
  mode==='choose'?v4h('div',{className:'v4-practice-grid'},options.map(([id,title,desc,tag],i)=>v4h('button',{key:id,className:'v4-practice-card',onClick:()=>setMode(id)},v4h('span',{className:'v4-card-number'},String(i+1).padStart(2,'0')),v4h('span',{className:'v4-eyebrow'},tag),v4h('strong',null,title),v4h('span',null,desc),v4h('span',{className:'v4-card-arrow','aria-hidden':true},'↗')))):
  mode==='words'?v4h('section',{className:'v4-work-card'},back,v4h('h4',null,'두 말을 나란히 읽어 볼까요?'),v4h('div',{className:'v4-chips'},pairs.map(p=>v4h('button',{key:p.join(),'aria-pressed':pair.join()===p.join(),onClick:()=>setPair(p)},p.join(' · ')))),v4h('div',{className:'v4-compare-cards'},pair.map(label=>v4h('article',{key:label},v4h('small',null,'마음 말의 뜻'),v4h('h4',null,label),v4h('p',null,emoMeaning(label))))),v4h('p',{className:'v4-callout'},'뜻이 닮았어도 언제나 같은 말은 아니에요. 같은 일에도 사람마다 다른 마음을 느낄 수 있어요.'),v4h('label',{className:'v4-field'},v4h('span',null,'두 말이 어떻게 다르게 느껴지나요? (생각해 보는 칸)'),v4h('textarea',{rows:2,placeholder:'여기서는 자유롭게 생각해 봐요. 일기로 저장되지는 않아요.'}))):
  v4h('section',{className:'v4-game-frame'},mode==='shell'&&v4h('p',{className:'v4-callout'},'이 놀이는 정해진 카드 짝을 기억하는 연습이에요. 행복과 즐거움, 슬픔과 우울이 언제나 같은 뜻이라는 의미는 아니에요.'),v4h(games[mode],{onBack:()=>setMode('choose')})),
  v4h('p',{className:'v4-activity-note'},'게임 점수와 속도는 마음을 이해하는 능력의 점수가 아니에요. 이 연습에서 소품을 추가로 지급하지 않아요.'));
}
function V4Report({entries,data,me}){
 const [period,setPeriod]=useState('30'),[printOpen,setPrintOpen]=useState(false);
 useEffect(()=>{if(printOpen)document.body.classList.add('v4-print-mode');return()=>document.body.classList.remove('v4-print-mode');},[printOpen]);
 const filtered=V4ActivityModel.inRange(entries,period,dayStamp()),summary=V4ActivityModel.summarize(filtered,data.choices),range=period==='all'?'전체 기록':dayStamp()+' 기준 최근 '+period+'일';
 if(printOpen)return v4h('section',{className:'v4-print-preview','aria-label':'인쇄용 마음 기록'},
  v4h('div',{className:'v4-print-toolbar'},v4h('button',{onClick:()=>setPrintOpen(false)},'← 리포트로 돌아가기'),v4h('button',{className:'v4-primary',onClick:()=>window.print()},'PDF로 저장 / 인쇄')),
  v4h('small',null,'마음 바다 탐험대 · 나만의 기록'),v4h('h3',null,(me.name||'나')+'의 마음 기록'),v4h('p',null,range),v4h('p',null,'일기 '+summary.count+'편 · 기록한 날 '+summary.days+'일'),
  v4h('section',null,v4h('h4',null,'글에서 만난 마음 말'),v4h('p',null,'자동으로 찾은 말: '+(summary.auto.join(' · ')||'아직 없어요')),v4h('p',null,'내가 고른 말: '+(summary.chosen.join(' · ')||'아직 없어요')),v4h('small',null,'표현의 수는 감정을 이해하는 능력의 점수가 아니에요. 가상 이야기와 게임 기록은 일기에 포함하지 않아요.')),
  filtered.map(e=>v4h('article',{key:e.ts},v4h('small',null,V4ActivityModel.recordDate(e)||e.date||'날짜 미상'),v4h('p',null,e.text))));

 return v4h('div',{className:'v4-report'},v4h('div',{className:'v4-report-toolbar'},v4h('div',{className:'v4-segment','aria-label':'리포트 기간'},[['7','최근 7일'],['30','최근 30일'],['all','전체']].map(([id,label])=>v4h('button',{key:id,'aria-pressed':period===id,onClick:()=>setPeriod(id)},label))),v4h('button',{onClick:()=>setPrintOpen(true),disabled:!filtered.length},'인쇄용으로 보기')),
  v4h('p',{className:'v4-fine'},range+' · 가상 이야기와 게임은 포함하지 않아요.'),
  !filtered.length?v4h(V4Empty,{title:'이 기간에는 아직 일기가 없어요',copy:'다른 기간을 골라 보세요. 기록은 원하는 날, 원하는 만큼 남겨도 좋아요.'}):v4h(React.Fragment,null,
   v4h('div',{className:'v4-stats'},v4h('div',null,v4h('small',null,'남긴 일기'),v4h('strong',null,summary.count),v4h('span',null,'편의 이야기')),v4h('div',null,v4h('small',null,'기록한 날'),v4h('strong',null,summary.days),v4h('span',null,'일의 흔적')),v4h('div',null,v4h('small',null,'내가 고른 마음 말'),v4h('strong',null,summary.chosen.length),v4h('span',null,'가지 표현'))),
   v4h('div',{className:'v4-report-words'},v4h('section',{className:'v4-work-card'},v4h('span',{className:'v4-eyebrow'},'자동으로 찾았어요'),v4h('h4',null,'글에서 만난 마음 말'),v4h(V4WordTags,{words:summary.auto,empty:'자동으로 찾은 말이 없어요. 일기는 그대로 남아 있어요.'})),v4h('section',{className:'v4-work-card'},v4h('span',{className:'v4-eyebrow'},'내가 직접 골랐어요'),v4h('h4',null,'내 마음에 가까운 표현'),v4h(V4WordTags,{words:summary.chosen}))),
   v4h('p',{className:'v4-callout'},'마음 말이 많거나 적은 것으로 나를 평가하지 않아요. 지금 기록은 내가 남긴 이야기의 한 부분이에요.'),
   data.q.completedAt&&v4h('section',{className:'v4-learning-note'},v4h('span',null,'✦'),v4h('div',null,v4h('strong',null,'내 마음에 가까운 말 알아보기'),v4h('p',null,'전체 탐험 기록 · 뜻과 차이를 살펴보고 피드백을 확인했어요. 숙달 점수와는 달라요.'))),
   v4h('details',null,v4h('summary',null,'이 기간의 원문 '+filtered.length+'편 펼쳐 보기'),filtered.map(e=>v4h('article',{className:'v4-report-entry',key:e.ts},v4h('small',null,e.date),v4h('p',null,e.text))))));
}
function V4Archive({me,entries,data,change,onLeavePlace,onUpdate,onDelete,onLegacy}){
 const sorted=V4ActivityModel.inRange(entries,'all',dayStamp()),latest=sorted[0];
 const [view,setView]=useState('calendar'),[month,setMonth]=useState((V4ActivityModel.recordDate(latest)||dayStamp()).slice(0,7)),[day,setDay]=useState(V4ActivityModel.recordDate(latest)||dayStamp()),[editing,setEditing]=useState(null),[raw,setRaw]=useState(''),[remove,setRemove]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const lock=useRef(false),dayEntries=sorted.filter(e=>V4ActivityModel.recordDate(e)===day),counts={};sorted.forEach(e=>{const d=V4ActivityModel.recordDate(e);if(d)counts[d]=(counts[d]||0)+1;});
 async function act(fn,message){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{if(V4_QUERY.get('saveFail')==='1')throw Error('local-write-failure');await fn();setNotice(message||'');}catch{setError('변경을 저장하지 못했어요. 입력은 그대로예요. 다시 시도해 주세요.');}finally{lock.current=false;setBusy(false);}}
 function selectMonth(delta){const next=V4ActivityModel.shiftMonth(month,delta);setMonth(next);setDay(next+'-01');}
 function record(e){const w=V4ActivityModel.words(e,data.choices);return v4h('article',{className:'v4-journal-card',key:e.ts},v4h('header',null,v4h('span',{className:'v4-eyebrow'},e.date),v4h('span',{className:'v4-private-tag'},'나의 일기')),
  editing===e.ts?v4h('label',{className:'v4-field'},v4h('span',null,'원래 쓴 글 수정'),v4h('textarea',{value:raw,onChange:ev=>setRaw(ev.target.value),rows:5,disabled:busy})):v4h('p',{className:'v4-journal-text'},e.text),
  v4h('div',{className:'v4-record-words'},v4h('small',null,'자동으로 찾은 말'),v4h(V4WordTags,{words:w.auto,empty:'찾은 말이 없어도 괜찮아요.'}),w.chosen.length>0&&v4h(React.Fragment,null,v4h('small',null,'내가 고른 말'),v4h(V4WordTags,{words:w.chosen}))),
  v4h('div',{className:'v4-actions'},v4h('button',{disabled:busy,onClick:()=>act(async()=>{await change({type:'selectEntry',ts:e.ts});onLeavePlace('review','이 글을 골랐어요. 관찰대가 빛나요.');})},'이 마음 살펴보기'),editing===e.ts?v4h(React.Fragment,null,v4h('button',{className:'v4-primary',disabled:busy||!raw.trim(),onClick:()=>act(async()=>{await onUpdate({...e,text:raw,analysis:v4Analyze(raw)});V4ActivityDrafts.delete(me.schoolCode+':'+me.id+':'+e.ts);setEditing(null);},'글을 수정했어요. 예전 대화 연결도 정리했어요.')},busy?'저장 중…':'수정 저장'),v4h('button',{disabled:busy,onClick:()=>setEditing(null)},'수정 취소')):v4h('button',{disabled:busy,onClick:()=>{setEditing(e.ts);setRaw(e.text);}},'원문 수정'),v4h('button',{className:'v4-text',disabled:busy,onClick:()=>setRemove(e.ts)},'삭제')),
  !editing&&v4h(V4ShareToggle,{me,entry:e}),
  remove===e.ts&&v4h('div',{className:'v4-delete-confirm',role:'group','aria-label':'일기 삭제 확인'},v4h('p',null,'이 일기와 연결된 대화를 지울까요? 받은 소품은 그대로 남아요. 삭제한 글은 되돌릴 수 없어요.'),v4h('button',{disabled:busy,onClick:()=>setRemove(null)},'남겨 두기'),v4h('button',{disabled:busy,onClick:()=>act(async()=>{await onDelete(e);V4ActivityDrafts.delete(me.schoolCode+':'+me.id+':'+e.ts);setRemove(null);setEditing(null);},'일기와 연결된 대화를 삭제했어요.')},'일기 삭제하기')));
 }
 return v4h(React.Fragment,null,v4h(V4ActivityHeading,{kind:'archive',kicker:'기록 보관함 · 나에게 남긴 이야기',title:'지난 마음을 다시 만나요.',copy:'달력 속 하루를 펼치거나, 여러 날의 기록을 함께 돌아봐요.'}),
  v4h('nav',{className:'v4-archive-nav','aria-label':'기록 보기 방식'},[['calendar','달력으로'],['list','모든 일기'],['report','나의 리포트']].map(([id,label])=>v4h('button',{key:id,'aria-pressed':view===id,onClick:()=>{setView(id);setNotice('');}},label)),v4h('span',null,'내 일기 '+entries.length+'편')),
  entries.some(e=>/^\d{1,2}\.\d{1,2}$/.test(e.date||''))&&v4h('p',{className:'v4-fine'},'연도 없는 날짜는 글을 저장한 해를 기준으로 보여줘요.'),
  view==='report'?v4h(V4Report,{me,entries,data}):view==='list'?(sorted.length?v4h('div',{className:'v4-journal-list'},sorted.map(record)):v4h(V4Empty,{title:'첫 이야기를 기다리고 있어요',copy:'특별한 일이 아니어도 좋아요. 오늘 기억나는 순간을 남겨 보세요.',onWrite:()=>onLeavePlace('write')})):
  v4h('div',{className:'v4-calendar-layout'},v4h('section',{className:'v4-calendar','aria-label':'일기 달력'},v4h('header',null,v4h('button',{'aria-label':'이전 달',onClick:()=>selectMonth(-1)},'‹'),v4h('h4',null,Number(month.slice(0,4))+'년 '+Number(month.slice(5))+'월'),v4h('button',{'aria-label':'다음 달',onClick:()=>selectMonth(1)},'›')),v4h('div',{className:'v4-calendar-grid'},['일','월','화','수','목','금','토'].map(w=>v4h('span',{key:w,className:'v4-weekday'},w)),V4ActivityModel.monthGrid(month).map((date,i)=>date?v4h('button',{key:date,'aria-label':date+(counts[date]?' · 일기 '+counts[date]+'편':' · 일기 없음'),'aria-pressed':day===date,'aria-current':date===dayStamp()?'date':undefined,onClick:()=>setDay(date)},v4h('span',null,Number(date.slice(8))),v4h('i',{'aria-hidden':true,className:counts[date]?'has-record':''})):v4h('span',{key:'blank'+i}))),v4h('footer',null,v4h('span',null,'● 일기를 남긴 날'),v4h('button',{className:'v4-text',onClick:()=>{setMonth(dayStamp().slice(0,7));setDay(dayStamp());}},'오늘'))),
   v4h('section',{className:'v4-day-records','aria-label':'선택한 날의 일기'},v4h('h4',null,Number(day.slice(5,7))+'월 '+Number(day.slice(8))+'일의 이야기'),dayEntries.length?dayEntries.map(record):v4h(V4Empty,{title:'이날은 남긴 글이 없어요',copy:'쉬어 간 날도 괜찮아요. 점이 있는 다른 날을 눌러 보세요.',onWrite:entries.length?undefined:()=>onLeavePlace('write')}))),
  v4h(V4ReceivedMessages,{me}),v4h('div',{className:'v4-archive-extra'},v4h('button',{className:'v4-text',onClick:onLegacy},'세부 분석·기록 도구')),
  error&&v4h('p',{className:'v4-inline-error',role:'alert'},error),notice&&v4h('p',{className:'v4-save-notice',role:'status'},notice));
}
