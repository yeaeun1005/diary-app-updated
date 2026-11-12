/* Production view adapter. Authentication, diaries and saves remain in AppMain. */
function V2App({me,entries,onDiary,onLogout,onBoardSeen,initialPanel=null,onBoardClose,onTour,tutOn,trial=false}){
  const [view,setView]=useState('world'),[panel,setPanel]=useState(initialPanel);
  const [state,setState]=useState(()=>islandState(entries||[])),[friend,setFriend]=useState(null),[seaFrom,setSeaFrom]=useState(null);
  const [error,setError]=useState(''),[retry,setRetry]=useState(0);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{let current=true;v2LoadOwnIsland(me).then(s=>{if(current){setState(s);setError('');}}).catch(()=>{if(current)setError('섬의 마음을 불러오지 못했어요. 다시 눌러 주세요.');});return()=>{current=false;};},[me.id,me.schoolCode,entries,retry]);
  async function visit(info){setPanel(null);setError('');setView('loading');try{const next=await v2LoadPublicIsland(me,info);if(alive.current){setFriend(next);setView('friend');}}catch(e){if(alive.current){setError('친구 섬을 불러오지 못했어요. 우리 반 친구를 다시 선택해 주세요.');setView('sea');}}}
  function open(where){if(where==='diary'){if(view==='friend')setPanel('private');else onDiary();}else if(where==='private')setPanel('private');else if(where==='board')setPanel('board');else if(where==='sea'){setSeaFrom(view==='friend'?{fromId:friend.id,autoHome:true}:null);setView('sea');}}
  function close(){setPanel(null);onBoardClose?.();requestAnimationFrame(()=>document.querySelector('.v2-canvas canvas')?.focus({preventScroll:true}));}
  useEffect(()=>{if(!panel)return;function keys(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...document.querySelectorAll('[role="dialog"] button,[role="dialog"] textarea,[role="dialog"] input,[role="dialog"] select')].filter(n=>!n.disabled&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);},[panel]);
  if(view==='loading')return v2h('div',{className:'v2-loading',role:'status'},'친구의 마음 섬에 닿고 있어요…');
  if(view==='sea')return v2h('div',{className:'v2-legacy'},v2h(SeaView,{me,entries,arrive:seaFrom,tutOn,onTour,onBack:()=>{setView('world');setSeaFrom(null);},onGo:(where,info)=>{if(where==='friend'&&info)visit(info);}}),v2h('div',{className:'v2-legacy-note',role:error?'status':undefined},error||(V2_LOCAL?'연결 검증 바다 · 가상 친구들의 독립된 섬':'우리 반 바다 · 배를 타고 친구의 섬으로')));
  return v2h(React.Fragment,null,
    v2h(V2World,{key:view==='friend'?friend.id:me.id,me,trial,state:view==='friend'?friend.state:state,profile:view==='friend'?friend:me,friend:view==='friend'?friend:null,myState:state,onOpen:open,panel,onLogout,onHidden:(label,hidden)=>setState(s=>s.map(e=>e.label===label?{...e,hidden}:e))}),
    error&&v2h('div',{className:'v2-load-error',role:'alert'},error,v2h('button',{onClick:()=>setRetry(n=>n+1)},'다시 불러오기'),v2h('button',{onClick:onDiary},'내 안으로')),
    panel==='private'&&v2h('div',{className:'v2-modal-shade'},v2h('section',{className:'v2-help',role:'dialog','aria-modal':true,'aria-label':'친구의 개인 공간'},v2h('h2',null,'이곳은 친구만의 공간이에요'),v2h('p',null,'친구의 일기는 친구만 볼 수 있어요. 섬에 공개한 마음을 함께 산책해요.'),v2h('button',{onClick:close,autoFocus:true},'산책 계속하기'))),
    panel==='board'&&v2h(V2Board,{me,myState:state,onSeen:onBoardSeen,onBack:close}));
}
