/* Explicit per-entry publication. Visitors never read another student's diary path. */
const V4Sharing=(()=>{
 const id=x=>{x=String(x||'');if(!x||/[.#$\[\]/\x00-\x1f\x7f]/.test(x))throw Error('invalid-id');return x;};
 const entryId=e=>id(e._k||entryKey(e.ts));
 const epoch=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const same=(a,b)=>a&&b&&a.ts===b.ts&&a.date===b.date&&a.text===b.text&&JSON.stringify(a.analysis||null)===JSON.stringify(b.analysis||null);
 async function member(me,who){id(me?.id);id(who);if(!me.schoolCode)throw Error('class');const roster=await sGetStrict(stuKey(me.schoolCode));if(!Array.isArray(roster)||!roster.some(s=>String(s.id)===String(who)))throw Error('class');}
 function decode(raw,code){if(raw?.code&&raw.code!==code)throw Error('class');return Object.entries(raw?.shared||{}).filter(([k,e])=>e&&e.public===true&&e.schoolCode===code&&typeof e.text==='string'&&typeof e.date==='string').map(([key,e])=>({key,date:e.date,text:e.text,emotions:(e.emotions||[]).filter(w=>typeof w==='string'),publishedAt:e.publishedAt})).sort((a,b)=>b.publishedAt-a.publishedAt);}
 async function list(me,who=me.id){await member(me,who);return decode(await sGetStrict(isleKey(who)),me.schoolCode);}
 async function publish(me,entry,visible){id(me.id);const k=entryId(entry);await member(me,me.id);const before=await sGetStrict(isleKey(me.id));if(before?.code&&before.code!==me.schoolCode)throw Error('class');
  if(visible){const current=await sGetStrict(d2Key(me.id)+'/'+k);if(!same(current,entry))throw Error('entry-changed');}
  let accepted=false;const result=await dbRef(isleKey(me.id)).transaction(raw=>{accepted=false;if((raw?.shareEpoch||null)!==(before?.shareEpoch||null))return;if(raw?.code&&raw.code!==me.schoolCode)return;const next={...(raw||{}),code:me.schoolCode,shared:{...(raw?.shared||{})}};
   if(visible)next.shared[k]={public:true,schoolCode:me.schoolCode,date:entry.date,text:entry.text,emotions:[...new Set((entry.analysis?.hits||[]).map(h=>h.label).filter(Boolean))],publishedAt:nowTs()};else delete next.shared[k];accepted=true;return next;
  },undefined,false);if(!result.committed||!accepted)throw Error('entry-changed');return visible;
 }
 // Private write and public revocation share one atomic update. A classmate never needs d2 access.
 async function write(idValue,entry,remove=false){const who=id(idValue),k=entryId(entry),o={};o[d2Key(who)+'/'+k]=remove?null:d2Clean({date:entry.date,text:entry.text,ts:entry.ts,analysis:entry.analysis});if(!remove)o[d2Key(who)+'/_migrated']=true;o[isleKey(who)+'/shared/'+k]=null;o[isleKey(who)+'/shareEpoch']=epoch();await dbRef('').update(o);return k;}
 async function clear(idValue,drop=false){const who=id(idValue),o={};o[d2Key(who)]=drop?null:{_migrated:true};o[isleKey(who)+'/shared']=null;o[isleKey(who)+'/shareEpoch']=epoch();await dbRef('').update(o);}
 const cleanMessage=text=>String(text||'').replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,100);
 async function send(me,friend,label,message){await member(me,friend.id);const note=cleanMessage(message);if(/https?:|www\.|@|(?:\d[ -]?){7,}/i.test(note))throw Error('contact');return v2SendEmpathy(me,friend,label,note);}
 return{entryId,same,decode,list,publish,write,clear,cleanMessage,send};
})();
function V4ShareToggle({me,entry}){
 const[shared,setShared]=useState(null),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 useEffect(()=>{let alive=true;setShared(null);setError('');V4Sharing.list(me).then(list=>{if(alive)setShared(list.some(e=>e.key===V4Sharing.entryId(entry)));}).catch(()=>{if(alive)setError('공개 상태를 불러오지 못했어요.');});return()=>{alive=false;};},[me.id,entry.text,entry.analysis]);
 async function save(yes){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await V4Sharing.publish(me,entry,yes);setShared(yes);setConfirm(false);}catch{setError('저장하지 못했어요. 일기가 바뀌었다면 다시 열어 주세요.');}finally{lock.current=false;setBusy(false);}}
 return v4h('section',{className:'v4-sharing','aria-label':'이 일기 공개 설정'},v4h('strong',null,shared?'우리 반 친구에게 공개 중':shared===null?'공개 상태 확인 중…':'나만 보는 일기'),v4h('p',null,'기본은 비공개예요. 공개한 글은 우리 반 친구가 내 섬에 방문하면 볼 수 있어요. 나도 내 기록 보관함에서 볼 수 있어요.'),shared!==null&&v4h('button',{disabled:busy,onClick:()=>shared?save(false):setConfirm(true)},shared?'비공개로 바꾸기':'이 일기 공개하기'),confirm&&v4h('div',{className:'v4-share-preview',role:'group','aria-label':'공개할 일기 확인'},v4h('strong',null,'이 글 전체를 우리 반 친구에게 보여 줄까요?'),v4h('p',null,'친구 이름, 연락처, 보여 주고 싶지 않은 내용이 없는지 살펴봐요.'),v4h('blockquote',null,entry.text),v4h('div',{className:'v4-actions'},v4h('button',{className:'v4-primary',disabled:busy,onClick:()=>save(true)},busy?'공개 중…':'이 내용으로 공개하기'),v4h('button',{disabled:busy,onClick:()=>setConfirm(false)},'나만 볼래요'))),error&&v4h('p',{role:'alert'},error));
}
function V4SharedDiaryPanel({me,friend,onClose}){
 const own=String(me.id)===String(friend.id);
 const[list,setList]=useState([]),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true,busy=false;async function refresh(){if(busy)return;busy=true;try{const rows=await V4Sharing.list(me,friend.id);if(alive){setList(rows);setReady(true);setError('');}}catch{if(alive){setList([]);setError('공개 일기를 불러오지 못했어요. 잠시 후 다시 열어 주세요.');}}finally{busy=false;}}refresh();const timer=setInterval(refresh,5000);const focus=()=>refresh();window.addEventListener('focus',focus);return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',focus);};},[me.id,friend.id]);
 return v4h(V4Dialog,{title:own?'내가 공개한 일기':friend.name+'의 공개 일기',onClose},v4h('p',null,own?'내가 우리 반 친구에게 공개한 글이에요. 일기 보관함에서 언제든 비공개로 바꿀 수 있어요.':'친구가 일기마다 직접 선택해 공개한 글만 보여요. 기본은 비공개이고, 언제든 공개를 취소할 수 있어요.'),error?v4h('p',{role:'alert'},error):!ready?v4h('p',{role:'status'},own?'내가 공개한 글을 찾고 있어요…':'친구가 공개한 글을 찾고 있어요…'):list.length?list.map(e=>v4h('article',{className:'v4-shared-entry',key:e.key},v4h('small',null,e.date),v4h('p',{className:'v4-journal-text'},e.text),v4h('div',{className:'v4-record-words'},e.emotions.filter(w=>own||friend.state.some(s=>s.label===w)).map(w=>v4h('span',{key:w},w))))):v4h('div',{className:'v4-shared-empty'},v4h('span',{'aria-hidden':true},'✉'),v4h('h3',null,'아직 공개한 일기가 없어요'),v4h('p',null,own?'일기 보관함에서 공개할 일기를 직접 고를 수 있어요.':'친구가 아직 일기를 공개하지 않았어요. 일기가 있어도 공개를 선택하지 않으면 여기에 나오지 않아요.')));
}
function V4ReceivedMessages({me}){
 const[notes,setNotes]=useState([]),[error,setError]=useState('');useEffect(()=>{let alive=true;empLoad(me.id).then(rows=>{if(alive)setNotes(rows.filter(e=>e.message).reverse());}).catch(()=>{if(alive)setError('응원 편지를 불러오지 못했어요.');});return()=>{alive=false;};},[me.id]);
 return v4h('section',{className:'v4-received'},v4h('h3',null,'친구가 보낸 마음'),error?v4h('p',{role:'alert'},error):notes.length?notes.map(n=>v4h('article',{key:n.key},v4h('strong',null,n.name+' · '+n.date),v4h('p',null,n.message))):v4h('p',null,'응원 한마디가 도착하면 여기에 모여요.'));
}

function V4OwnSharedDiaries({me}){
 const [open,setOpen]=useState(false);
 return v4h('section',{className:'v4-own-shared'},v4h('h3',null,'내가 공개한 일기'),v4h('p',null,'친구에게 보여 주기로 한 글을 내 섬에서도 다시 읽어요.'),v4h('button',{className:'v4-primary',onClick:()=>setOpen(true)},'내가 공개한 일기 보기'),open&&v4h(V4SharedDiaryPanel,{me,friend:me,onClose:()=>setOpen(false)}));
}
