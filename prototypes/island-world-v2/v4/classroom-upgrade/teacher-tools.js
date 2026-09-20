// Strict reads distinguish an unavailable diary from an empty one, using the existing paths.
async function v4LoadTeacherDiary(id){
 const value=await sGetStrict(d2Key(id));
 if(value&&value._migrated)return Object.keys(value).filter(k=>k.charAt(0)==='e').sort().map(k=>{const entry=safeEntries([value[k]])[0];entry._k=k;return entry;});
 return safeEntries(await sGetStrict(dKey(id)));
}
/* The watch criteria are unchanged. Teacher choices never hide a card or schedule reminders. */
function V4CareCard({student,record,ready,busy,error,onSave}){
 const [editing,setEditing]=useState(false),[selected,setSelected]=useState(()=>record?.actions||[]);
 const current=record?.status;
 return v4h('article',{className:'v4-care-card','data-care-id':String(student.id)},
  v4h('header',null,v4h('h3',null,student.name),v4h('span',null,'지난 7일 · '+student.count+'일')),
  v4h('div',{className:'v4-care-days'},student.days.map((d,i)=>v4h('span',{key:i},d.d+' '+(d.sad.length?d.sad.join('·'):d.kw||'')))),
  student.topLab?.length>0&&v4h('p',null,v4h('strong',null,'자주 나온 감정 · '),student.topLab.map(x=>x.label).join(' · ')),
  student.sits?.length>0&&v4h('p',null,v4h('strong',null,'그때의 상황 · '),student.sits.map(x=>x.text).join(' · ')),
  v4h('div',{className:'v4-care-actions','data-tut':'t-care'},
   v4h('button',{type:'button',disabled:!ready||busy,'aria-pressed':current==='observe',onClick:async()=>{if(await onSave('observe',record?.actions||[]))setEditing(false);}},'더 지켜볼게요'),
   v4h('button',{type:'button',disabled:!ready||busy,'aria-pressed':current==='acted','aria-expanded':editing,onClick:()=>{setSelected(record?.actions||[]);setEditing(!editing);}},'이렇게 조치했어요')),
  editing&&v4h('section',{className:'v4-care-editor','aria-label':student.name+' 조치 선택'},v4h('h4',null,'실제로 한 조치를 골라 주세요'),v4h('p',null,'여러 개를 고를 수 있어요. 선택한 내용은 선생님 기록에만 남아요.'),
   v4h('div',{className:'v4-care-options'},V4Care.actions.map(action=>v4h('label',{key:action},v4h('input',{type:'checkbox',checked:selected.includes(action),disabled:busy,onChange:()=>setSelected(list=>list.includes(action)?list.filter(x=>x!==action):[...list,action])}),v4h('span',null,action)))),
   v4h('div',{className:'v4-care-actions'},v4h('button',{type:'button',className:'is-primary',disabled:!ready||busy||!selected.length,onClick:async()=>{if(await onSave('acted',selected))setEditing(false);}},busy?'저장 중…':'조치 저장'),v4h('button',{type:'button',disabled:busy,onClick:()=>setEditing(false)},'취소'))),
  record&&v4h('div',{className:'v4-care-saved',role:'status'},v4h('strong',null,current==='observe'?'더 지켜보기로 기록했어요':'조치를 기록했어요'),record.actions.length>0&&v4h('p',null,(current==='observe'?'전에 기록한 조치 · ':'')+record.actions.join(' · '))),
  error&&v4h('p',{className:'v4-care-error',role:'alert'},error));
}
function V4TeacherWatch({user,students,watchList}){
 const [records,setRecords]=useState({}),[ready,setReady]=useState(false),[loadingError,setLoadingError]=useState(false),[retry,setRetry]=useState(0),[busy,setBusy]=useState({}),[errors,setErrors]=useState({});
 const locks=useRef(new Set()),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{let active=true;setReady(false);setLoadingError(false);V4Care.load(user).then(value=>{if(active){setRecords(value);setReady(true);}}).catch(()=>{if(active)setLoadingError(true);});return()=>{active=false;};},[user.teacherId,user.th,user.schoolCode,retry]);
 async function save(id,status,selected){
  if(!ready||locks.current.has(id))return false;locks.current.add(id);setBusy(v=>({...v,[id]:true}));setErrors(v=>({...v,[id]:''}));
  try{const record=await V4Care.save(user,students,id,status,selected);if(mounted.current)setRecords(v=>({...v,[id]:record}));return true;}
  catch{if(mounted.current)setErrors(v=>({...v,[id]:'저장하지 못했어요. 선택은 그대로 있으니 다시 시도해 주세요.'}));return false;}
  finally{locks.current.delete(id);if(mounted.current)setBusy(v=>({...v,[id]:false}));}
 }
 return v4h('section',{className:'v4-teacher-watch','data-tut':'t-watch','aria-label':'살펴봐 주세요'},
  v4h('header',null,v4h('h2',null,'살펴봐 주세요'),v4h('span',null,watchList.length+'명')),
  v4h('p',{className:'v4-care-intro'},'최근 7일 감정일기에서 마음이 힘들어 보이는 신호가 있는 학생이에요.'),
  loadingError?v4h('div',{className:'v4-care-error',role:'alert'},'조치 기록을 불러오지 못했어요.',v4h('button',{onClick:()=>setRetry(n=>n+1)},'다시 불러오기')):!ready&&v4h('p',{role:'status'},'선생님 기록을 불러오는 중…'),
  watchList.length?watchList.map(w=>v4h(V4CareCard,{key:w.id,student:w,record:records[String(w.id)],ready,busy:!!busy[w.id],error:errors[w.id],onSave:(status,selected)=>save(w.id,status,selected)})):v4h('p',{className:'v4-care-empty'},'최근 7일 안에 살펴볼 신호가 있는 학생이 없어요.'));
}
function V4TeacherJournal({student,entries,loading,error,onRetry}){
 const [mode,setMode]=useState('archive'),[entryTs,setEntryTs]=useState(null);
 const data={choices:{},q:{}};
 if(loading)return v4h('p',{role:'status'},'탐험일지를 불러오는 중…');
 if(error)return v4h('div',{role:'alert'},'탐험일지를 불러오지 못했어요.',v4h('button',{onClick:onRetry},'다시 불러오기'));
 return v4h('section',{className:'v4-activity-dialog v4-teacher-journal','data-activity':'archive'},
  v4h('nav',{className:'v4-archive-nav','aria-label':'학생 기록 종류'},[['archive','탐험일지'],['analysis','감정 분석하기']].map(([id,label])=>v4h('button',{key:id,'aria-pressed':mode===id,onClick:()=>{setEntryTs(null);setMode(id);}},label))),
  mode==='analysis'?v4h(V4AnalysisTools,{key:entryTs||'all',entries,initialEntryTs:entryTs}):v4h(V4Archive,{me:student,entries,data,readOnly:true,onLeavePlace:()=>setMode('analysis'),onInspect:ts=>{setEntryTs(ts);setMode('analysis');}}));
}
