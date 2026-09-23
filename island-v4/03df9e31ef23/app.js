const v4h=React.createElement,V4_SESSIONS={};
const V4_UI_ASSETS=new URL('./',document.currentScript.src);
function v4ToolIcon(name){const paths={left:'M10 5H5v5M5 5l5 5a6 6 0 1 1-1 8',right:'M14 5h5v5m0-5-5 5a6 6 0 1 0 1 8',minus:'M5 12h14',plus:'M5 12h14M12 5v14',home:'m3 11 9-8 9 8M6 9v11h12V9M10 20v-6h4v6',sound:'M4 9h4l5-4v14l-5-4H4ZM17 8q6 4 0 8',mute:'M4 9h4l5-4v14l-5-4H4ZM17 9l5 6m0-6-5 6'};return v4h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.4,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},v4h('path',{d:paths[name]}));}
function V4SoundButton(){const[on,setOn]=useState(SND.playing());useEffect(()=>{const f=()=>setOn(SND.playing());SND.sub(f);return()=>SND.unsub(f);},[]);return v4h('button',{type:'button',className:'v4-sound',onClick:()=>SND.set(!on),'aria-label':on?'소리 끄기':'소리 켜기','aria-pressed':on,title:on?'소리 끄기':'소리 켜기'},v4ToolIcon(on?'sound':'mute'));}
const V4_TABS=[['write','감정일기 쓰기','✎'],['review','감정 분석하기','◉'],['talk','마음 대화하기','♡'],['practice','탐험연습하기','✧'],['archive','탐험 일지보기','▤']];
function v4Analyze(raw){try{if(V4_QUERY.get('analysisFail')==='1')throw Error('local-analysis-failure');return analyzeEntry(raw);}catch{return{hits:[],excluded:[],matchedPos:[],matchedNeg:[],posScore:null,negScore:null,posPct:null,negPct:null,valence9:null,arousal9:null,valStd:null,aroStd:null,status:'unavailable'};}}
function V4AppInner(props){
 const {me,entries,onAdd,onUpdate,onDelete,setEntries,onDiary,onLogout,onHome,onBoardSeen,onBoardClose}=props;
 const [view,setView]=useState(V4_QUERY.get('inspect')==='1'&&V4_QUERY.get('view')==='sea'?'sea':'world'),[friend,setFriend]=useState(null),[seaFrom,setSeaFrom]=useState(null),[panel,setPanel]=useState(props.initialPanel),[data,setData]=useState(()=>V4State.load(me)),[error,setError]=useState(''),[state,setState]=useState(()=>islandState(entries||[]));
 const [placeRequest,setPlaceRequest]=useState(null),[celebrate,setCelebrate]=useState(false),[editDecor,setEditDecor]=useState(null);
 function leavePlace(id,message=''){setPanel(null);setPlaceRequest({id,message,token:Date.now()});requestAnimationFrame(()=>document.querySelector('.v2-canvas canvas')?.focus({preventScroll:true}));}
 function earned(){setPlaceRequest(null);setCelebrate(true);setPanel('complete');}
 useEffect(()=>{const timer=setInterval(()=>setData(old=>({...old})),60000);return()=>clearInterval(timer);},[]);
 const alive=useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
 useEffect(()=>{let active=true;v2LoadOwnIsland(me).then(s=>{if(active)setState(s);}).catch(()=>{});return()=>{active=false;};},[entries,me.id]);
 async function change(event){if(event.type.startsWith('daily'))event={...event,mode:await V4RewardSettings.forStudent(me)};const before=V4Daily.current(V4State.load(me)).completedAt;const next=await V4State.dispatch(me,event);if(alive.current){setData(next);if(!before&&V4Daily.current(next).completedAt){setPlaceRequest(null);if(event.type!=='dailyWrite')earned();}}return next;}
 async function addEntry(e){if(V4_QUERY.get('saveFail')==='1')throw Error('local-write-failure');await onAdd(e);}
 async function clearLinkedChat(ts){const chats=await sGet(chatKey(me.id));if(Array.isArray(chats))await dbRef(chatKey(me.id)).set(chats.filter(ch=>ch.entryTs!==ts));}
 async function updateEntry(e){await onUpdate(e);V4ActivityDrafts.delete(me.schoolCode+':'+me.id+':'+e.ts);if(entries.find(x=>x.ts===e.ts)?.text!==e.text)await clearLinkedChat(e.ts);setEntries(entries.map(x=>x.ts===e.ts?e:x));await change({type:'edit',ts:e.ts});}
 async function deleteEntry(e){await change({type:'forget',ts:e.ts});await clearLinkedChat(e.ts);await onDelete(e);setEntries(old=>old.filter(x=>x.ts!==e.ts));}
 function open(where){setError('');if(where==='sea'){setPanel(null);setSeaFrom(view==='friend'?{fromId:friend.id,autoHome:false}:null);setView('sea');}else if(where==='diary'||where==='private'){if(view==='friend')setPanel('private');else setPanel('write');}else setPanel(where);}
 function close(){setCelebrate(false);setPanel(null);onBoardClose?.();requestAnimationFrame(()=>document.querySelector('.v2-canvas canvas')?.focus({preventScroll:true}));}
 async function visit(info){setView('loading');try{const f=await v2LoadPublicIsland(me,info);setFriend(f);setView('friend');}catch(e){setError('친구 섬을 열지 못했어요. 다시 선택해 주세요.');setView('sea');}}
 if(view==='loading')return v4h('div',{className:'v2-loading',role:'status'},'친구의 마음 섬에 닿고 있어요…');
 if(view==='sea')return v4h('div',{className:'v2-legacy'},v4h(V4SeaView,{me,entries,reward:data.reward,arrive:seaFrom,tutOn:props.tutOn,onTour:props.onTour,onHome,onBack:()=>{setView('world');setSeaFrom(null);},onGo:(where,info)=>{if(where==='friend'&&info)visit(info);}}),error&&v4h('p',{role:'alert'},error));
 return v4h(React.Fragment,null,
  view==='friend'?v4h(V4FriendWorld,{key:friend.id,state:friend.state,myState:state,me,friend,panel,onOpen:open,onHome}):v4h(V4World,{me,state,data,change,panel,onOpen:open,onLogout,onHome,placeRequest,editDecor,onDecorClose:()=>setEditDecor(null),onDecorLibrary:()=>{setEditDecor(null);setPanel('reward');}}),
  V4_TABS.some(t=>t[0]===panel)&&v4h(V4Activities,{me,data,change,entries,panel,onLeavePlace:leavePlace,onEarned:earned,onClose:close,onAdd:addEntry,onUpdate:updateEntry,onDelete:deleteEntry,setEntries,onLegacy:onDiary}),
  panel==='reward'&&v4h(V4DecorLibrary,{data,change,celebrate,onClose:close,onEdit:id=>{setPanel(null);setEditDecor(id);}}),
  panel==='complete'&&v4h(V4Dialog,{title:'오늘의 마음 탐험 완료!',onClose:close},v4h('section',{className:'v4-completion',role:'status'},v4h('div',{className:'v4-completion-stars','aria-hidden':true},'✦  ★  ✦'),v4h('span',{className:'v4-completion-medal','aria-hidden':true},'✓'),v4h('h3',null,'오늘 내 마음을 조금 더 알게 되었어요!'),v4h('div',{className:'v4-completion-steps'},[['감정일기쓰기','완료'],['감정 분석하기',V4Daily.current(data).analysisCheckedAt?'완료':'선택 활동'],['마음대화하기',V4Daily.current(data).talkStatus==='done'?'완료':V4Daily.current(data).talkStatus==='skipped'?'오늘은 대화할 내용 없음':'선택 활동']].map(([s,status])=>v4h('span',{key:s},s,v4h('small',null,status)))),v4h('button',{className:'v4-primary',onClick:()=>setPanel('reward')},data.reward.item?'나의 선물 보러 가기':'완료 선물 고르기'),v4h('button',{className:'v4-text',onClick:close},'섬에서 자유롭게 놀기'))),
  panel==='shared'&&v4h(V4SharedDiaryPanel,{me,friend,onClose:close}),
  panel==='board'&&v4h(V2Board,{me,myState:state,onSeen:onBoardSeen,onBack:close}),
  panel==='private'&&v4h('div',{className:'v2-modal-shade'},v4h('section',{className:'v2-help',role:'dialog','aria-modal':true,'aria-label':'친구의 개인 공간'},v4h('h2',null,'친구만의 공간이에요'),v4h('p',null,'친구가 선택해 공개한 일기만 볼 수 있어요.'),v4h('button',{onClick:close,autoFocus:true},'산책 계속하기'))));
}
function V4World({me,state,data,change,panel,onOpen,onLogout,onHome,placeRequest,editDecor,onDecorClose,onDecorLibrary}){
 const [tour,setTour]=useState(false),[tourStage,setTourStage]=useState('walk'),[tourWelcome,setTourWelcome]=useState(()=>!V4TutorialMemory.seen(me));
 const stateKey=JSON.stringify(state);
 const host=useRef(null),api=useRef(null),openRef=useRef(onOpen);openRef.current=a=>{if(!tour&&!tourWelcome)onOpen(a);};
 function startTutorial(){setHelp(false);setMap(false);setTourWelcome(false);setTourStage('walk');setTour(true);requestAnimationFrame(()=>host.current?.querySelector('canvas')?.focus({preventScroll:true}));}
 function endTutorial(){api.current?.stop();api.current?.setTourFocus(null);api.current?.setDestination(lit);setTour(false);setTourWelcome(false);V4TutorialMemory.mark(me);requestAnimationFrame(()=>host.current?.querySelector('canvas')?.focus({preventScroll:true}));}
 function tutorialStage(id){setTourStage(id);api.current?.stop();api.current?.setTourFocus(['write','review','talk','board','dock'].includes(id)?id:null);api.current?.setDestination(['write','review','talk','board','dock'].includes(id)?id:null);}
 const [ui,setUI]=useState({}),[quality,setQuality]=useState('standard'),[help,setHelp]=useState(false),[map,setMap]=useState(false),[motion,setMotion]=useState(null),[collapsed,setCollapsed]=useState(()=>innerWidth<700),[notice,setNotice]=useState(''),[failed,setFailed]=useState(''),[lit,setLit]=useState(null);
 useEffect(()=>{const resize=()=>{if(innerWidth<700)setCollapsed(true);};window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 useEffect(()=>{SND.loop('bgm');try{api.current=v4CreateWorld(host.current,state,{open:a=>openRef.current(a),update:setUI,motion:setMotion},V4_SESSIONS[me.id],{quality,islandId:me.id});api.current.setDecoration(data.reward,data.decor);}catch(e){setFailed('섬 화면을 열지 못했어요. 마음 활동 바로가기를 이용해 주세요.');console.error(e);}return()=>{SND.leave();if(api.current){V4_SESSIONS[me.id]=api.current.snapshot();api.current.dispose();}};},[me.id,quality,stateKey]);
 useEffect(()=>{api.current?.pause(!!panel||help||!!editDecor||tourWelcome||(tour&&tourStage!=='walk'));},[panel,help,quality,stateKey,editDecor,tourWelcome,tour,tourStage]);useEffect(()=>{api.current?.setDecoration(data.reward,data.decor);},[data.reward.item,data.reward.spot,data.decor,quality]);
 async function act(event){try{await change(event);}catch(e){setNotice('저장하지 못했어요. 다시 눌러 주세요.');}}
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(timer);},[notice]);
 const q=V4Daily.quest(data),destination=['write','offer'].includes(q.stage)?'write':q.stage==='talk'?'talk':'review';
 const button=(text,fn,cls='',label)=>v4h('button',{type:'button',className:cls,onClick:fn,disabled:tour,'aria-label':label},text);
 function guide(id,message){setLit(id);api.current?.setDestination(id);setNotice(message||'');setMap(false);}
 function walk(id){guide(id);requestAnimationFrame(()=>{const ok=api.current?.walkToPlace(id);if(!ok)setNotice('지금 자리에서는 길을 찾지 못했어요. 조금 움직인 뒤 다시 눌러 주세요.');});}
 useEffect(()=>{if(q.stage==='complete'){setLit(null);setUI(old=>({...old,pin:null}));api.current?.setDestination(null);}else if(q.active)guide(destination);},[q.active,q.stage]);
 useEffect(()=>{if(placeRequest)guide(placeRequest.id,placeRequest.message);},[placeRequest?.token]);
 useEffect(()=>{api.current?.setDestination(lit);},[quality,stateKey,lit]);
 return v4h('main',{className:'v2-world v4-world'+(tour?' is-touring':'')+(editDecor?' is-decorating':''),'aria-hidden':panel?true:undefined,inert:panel?'':undefined},v4h('div',{className:'v2-canvas',ref:host,'data-testid':'v4-world'}),v4h('div',{className:'v2-vignette'}),v4h('div',{className:'v2-passage-wash'}),
  v4h('header',{className:'v4-brand'},v4h('h1',null,v4h('img',{src:new URL('island-title.svg',V4_UI_ASSETS).href,alt:'마음 바다 탐험대  내 마음섬'}))),
  v4h('nav',{className:'v4-tools','aria-label':'섬 도구'},button(v4h(React.Fragment,null,v4ToolIcon('home'),'홈'),onHome,'v4-home-link','홈으로'),button('마음 활동',()=>setMap(!map),'v4-activities-launch'),button('꾸미기',()=>onOpen('reward'),'v4-decor-launch'),button('설정',()=>setHelp(true))),
  v4h('section',{className:'v4-quest'+(collapsed?' is-collapsed':'')+(q.stage==='complete'?' is-complete':' is-inviting'),'aria-label':'오늘의 마음 탐험'},button('☀  오늘의 마음 탐험  '+(collapsed?'＋':'−'),()=>setCollapsed(!collapsed),'v4-quest-title'),!collapsed&&v4h(React.Fragment,null,v4h('h2',null,q.stage==='complete'?'오늘의 탐험 완료!':q.stage==='talk'?'마음 대화 남기기':q.stage==='review'?'내 감정 살펴보기':['offer','write'].includes(q.stage)?'오늘 일기 쓰기':'내 감정 살펴보기'),v4h('p',null,q.stage==='complete'?'멋지게 해냈어요. 이제 나의 섬을 자유롭게 즐겨요.':q.stage==='offer'?'일기를 쓰고 내 마음을 살펴봐요.':q.stage==='write'?'나무 아래에서 감정일기를 써요.':q.stage==='talk'?'마음 우체통에서 오늘의 대화를 남겨요.':'관찰대에서 감정을 분석하고 살펴봐요.'),v4h('div',{className:'v4-progress'},['감정일기쓰기','감정 분석하기','마음대화하기'].map((s,i)=>v4h('span',{key:s,className:((q.stage==='write'||q.stage==='offer')?i===0:q.stage==='complete'||q.stage==='talk'?i===2:i===1)?'current':''},s))),q.stage==='complete'?v4h('div',{className:'v4-actions'},button(data.reward.item?'내 소품 보기':'소품 선택하기',()=>onOpen('reward'),'v4-primary')):q.active?v4h(React.Fragment,null,v4h('div',{className:'v4-actions'},button('목적지로 걸어가기',()=>walk(destination),'v4-primary')),v4h('div',{className:'v4-actions'},button('다음에 하기',()=>act({type:'defer'}),'v4-text'))):button(q.stage==='offer'?'탐험 시작하기':'이어서 탐험하기',()=>act({type:'start'}),'v4-primary'))),
  map&&v4h('aside',{className:'v4-map'},v4h('h2',null,'어디로 갈까요?'),V4_TABS.map(([id,title,icon])=>v4h('div',{key:id},button(icon+' '+title,()=>walk(id),'',title+'까지 걸어가기'),button('바로 열기',()=>{setMap(false);onOpen(id);},'v4-direct',title+' 바로 열기'))),v4h('div',null,button('우리 반 게시판',()=>walk('board')),button('부두',()=>walk('dock')))),
  lit&&ui.pin&&!ui.pin.near&&!panel&&v4h('div',{className:'v4-beacon-label','data-world-anchor':'destination'},v4h('span',{'aria-hidden':true},'✦'),v4h('strong',null,ui.pin.title),v4h('small',null,ui.pin.id==='decoration'?'내 섬에 놓았어요':ui.pin.near?'E를 눌러 열어요':'이곳으로 걸어와요')),
  v4h('div',{className:'v4-bottom','aria-label':'화면과 소리 도구'},button(v4ToolIcon('left'),()=>api.current?.rotate(-Math.PI/4),'','시점 왼쪽 회전'),button(v4ToolIcon('right'),()=>api.current?.rotate(Math.PI/4),'','시점 오른쪽 회전'),button(v4ToolIcon('minus'),()=>api.current?.zoom(2),'','축소'),button(v4ToolIcon('plus'),()=>api.current?.zoom(-2),'','확대'),button(v4ToolIcon('home'),()=>api.current?.reset(),'','기본 시점'),v4h(V4SoundButton)),
  v4h(V2Joystick,{paused:!!panel||help||!!motion||!!editDecor||tourWelcome||(tour&&tourStage!=='walk'),onMove:(x,z)=>api.current?.stick(x,z)}),
  ui.nearest&&!panel&&!motion&&v4h('button',{className:'v4-interact',type:'button','data-world-anchor':'character','aria-label':ui.nearest.title+' 열기',onClick:()=>api.current?.interact(ui.nearest.action)},v4h('strong',null,ui.nearest.action==='sea'?'부두  배 타기':ui.nearest.title),v4h('img',{src:new URL('key-e.svg',V4_UI_ASSETS).href,alt:'E'})),
  notice&&!panel&&v4h('div',{className:'v4-notice',role:'status'},notice,button('×',()=>setNotice(''),'','안내 닫기')),
  failed&&v4h('div',{className:'v4-notice',role:'alert'},failed,V4_TABS.map(([id,title])=>button(title,()=>onOpen(id)))),
  motion&&v4h('div',{className:'v2-passage-shield'},v4h('div',{className:'v2-passage-caption'},v4h('p',{role:'status'},'배를 타고 친구들의 바다로 가요'),button('바로 들어가기',()=>api.current?.skipPassage()),button('취소',()=>api.current?.cancelPassage()))),
  help&&v4h(V4Dialog,{title:'편안하게 탐험하기',onClose:()=>setHelp(false)},v4h('p',null,'방향키 또는 WASD로 걸어요. 길을 눌러 걸을 수도 있어요. 화면을 드래그하거나 휠을 누른 채 움직이면 시점이 돌아가요. 휠을 위아래로 굴려도 회전해요.'),v4h('p',null,'장소에 다가가면 E 표시가 떠요. E 키나 표시를 누르면 열려요.'),v4h('div',{className:'v4-actions'},button('표준 화질',()=>setQuality('standard')),button('가벼운 화질',()=>setQuality('low'))),v4h('p',{className:'v4-muted'},MEM_ONLY?'체험 기록은 새로고침하면 사라져요.':'이 계정에 일기와 탐험 기록을 저장해요.'),button('섬 사용법 다시 보기',startTutorial,'v4-primary'),button('처음으로',onLogout)),
  !editDecor&&!tourWelcome&&!panel&&button(v4h(React.Fragment,null,v4h('span',{'aria-hidden':true},'?'),'섬 사용법'),startTutorial,'v4-tour-launch'),
  tourWelcome&&!panel&&v4h(V4Dialog,{title:'마음섬에 온 걸 환영해요!',onClose:endTutorial},v4h('section',{className:'v4-tour-welcome'},v4h('div',{className:'v4-tour-emblem','aria-hidden':true},'✦'),v4h('h3',null,'우리, 함께 둘러볼까요?'),v4h('p',null,'걷는 법부터 마음 활동, 정원 꾸미기까지',v4h('br'),'한 곳씩 알려 줄게요.'),v4h('div',{className:'v4-actions'},v4h('button',{className:'v4-primary',onClick:startTutorial},'같이 둘러보기'),v4h('button',{onClick:endTutorial},'먼저 놀러 갈래요')))),
  tour&&v4h(React.Fragment,null,['walk','write','review','talk','board','dock'].map(id=>v4h('div',{key:id,className:'v4-tutorial-anchor','data-tut':'v4-'+id,'aria-hidden':true})),v4h(V4IslandTutorial,{api,onStage:tutorialStage,onDone:endTutorial})),
  editDecor&&v4h(V4DecorEditor,{key:editDecor,api,data,change,id:editDecor,onClose:message=>{onDecorClose();setNotice(message);},onLibrary:onDecorLibrary}),
  V4_QUERY.get('inspect')==='1'&&v4h(V4Inspect,{api,host,data}));
}
function V4Dialog({title,onClose,children,wide=false,activity=null}){
 const ref=useRef(null);useEffect(()=>{const old=document.activeElement;ref.current?.querySelector('h2')?.focus();return()=>old?.isConnected&&old.focus?.();},[]);
 function keys(e){if(e.key==='Escape'&&!e.isComposing){e.stopPropagation();onClose();}if(e.key==='Tab'){const list=[...ref.current.querySelectorAll('button,input,textarea,select,a[href]')].filter(e=>!e.disabled&&e.getClientRects().length),first=list[0],last=list[list.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement.tagName==='H2')){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
 return v4h('div',{className:'v4-shade',onKeyDown:keys},v4h('section',{className:'v4-dialog'+(wide?' v4-wide':'')+(activity?' v4-activity-dialog':''),'data-activity':activity,ref,role:'dialog','aria-modal':true,'aria-label':title},v4h('header',null,v4h('h2',{tabIndex:-1},title),v4h('button',{onClick:onClose,'aria-label':'섬으로 돌아가기'},'섬으로 ×')),children));
}
function V4Activities({me,data,change,entries,panel,onLeavePlace,onEarned,onClose,onAdd,onUpdate,onDelete,setEntries,onLegacy}){
 const [text,setText]=useState(data.draft),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[choices,setChoices]=useState(data.q.response?.choices||[]),[thought,setThought]=useState(data.q.response?.thought||''),[help,setHelp]=useState(false),[correction,setCorrection]=useState(null),[edit,setEdit]=useState(null);
 const helperKey=me.schoolCode+':'+me.id;
 const [writing,setWriting]=useState(()=>({...V4WritingDrafts.get(helperKey),emotions:V4WritingDrafts.get(helperKey)?.emotions||[],situations:V4WritingDrafts.get(helperKey)?.situations||[],date:dayStamp()}));
 function updateWriting(patch){setWriting(old=>{const next={...old,...patch};V4WritingDrafts.set(helperKey,next);return next;});}
 const lock=useRef(false),pendingEntry=useRef(null);
 const q=V4Daily.quest(data),context=data.context||q.source,sourceEntry=context?.kind==='personal'?entries.find(e=>e.ts===context.entryTs):null,selected=entries.find(e=>e.ts===data.selectedEntryTs)||entries[entries.length-1];
 const textSource=context?.kind==='fiction'?V4Content.story:sourceEntry?.text||selected?.text||'';
 async function run(fn){if(lock.current)return;lock.current=true;setBusy(true);setNotice('');try{await fn();}catch(e){setNotice(pendingEntry.current?.saved?'일기는 저장했어요. 탐험 진행을 반영하지 못했어요. 다시 저장하면 중복 없이 이어서 처리해요.':'저장하지 못했어요. 입력은 그대로예요. 다시 시도해 주세요.');}finally{lock.current=false;setBusy(false);}}
 async function saveSource(quest){await run(async()=>{
  {
   const composed=V4StudentTools.compose(text,writing.emotions,writing.situations);
   if(!composed.text||V4ActivityModel.dateNumber(writing.date)===null)return;
   const signature=JSON.stringify([text,writing]);
   if(!pendingEntry.current||pendingEntry.current.signature!==signature){let ts=nowTs();while(entries.some(e=>e.ts===ts))ts++;pendingEntry.current={signature,entry:V4StudentTools.prepare(text,writing.emotions,writing.situations,writing.date,ts)};}
   const entry=pendingEntry.current.entry;if(!pendingEntry.current.saved){await onAdd(entry);pendingEntry.current.saved=true;}setEntries(old=>old.some(e=>e.ts===entry.ts)?old:[...old,entry]);
   const progress=await change({type:'dailyWrite',ts:entry.ts,date:writing.date});
   await change({type:'selectEntry',ts:entry.ts});await change({type:'draft',text:''});
   pendingEntry.current=null;setText('');V4WritingDrafts.delete(helperKey);setWriting({emotions:[],situations:[],date:dayStamp()});
   setNotice(V4Daily.current(progress).completedAt?'일기를 저장했어요. 최근 일기에서 확인해 보세요. 오늘의 마음 탐험도 완료했어요!':'일기를 저장했어요. 아래 최근 일기에서 바로 확인해 보세요.');
  }
  requestAnimationFrame(()=>document.querySelector('.v4-recent')?.scrollIntoView({block:'start',behavior:'smooth'}));
 });}

 function toggle(label){setChoices(old=>old.includes(label)?old.filter(x=>x!==label):[...old,label]);}
 const b=(label,onClick,cls='',disabled=false)=>v4h('button',{type:'button',onClick,className:cls,disabled:busy||disabled},label);
 const hitEntry=sourceEntry||selected,hits=hitEntry?.analysis?.hits||[];
 const sourceBlock=v4h('section',{className:'v4-source'},v4h('small',null,context?.kind==='fiction'?'가상 이야기  연습용':'내 기록'),v4h('p',null,textSource||'이야기를 먼저 골라 주세요.'));
 return v4h(V4Dialog,{title:V4_TABS.find(t=>t[0]===panel)?.[1]||'마음 활동',onClose,wide:true,activity:panel},v4h(V4ActivityGuide,{key:panel,me,kind:panel}),v4h('p',{className:'v4-place-caption'},({write:'나무 책상',review:'물가 관찰대  나의 감정의 변화와 감정이 일어나는 상황을 관련지어 생각해보는 곳.',talk:'마음 우체통  마음에 남은 일을 이야기하는 곳',practice:'작은 작업대  천천히 연습하는 곳',archive:'기록 보관함  나의 일기를 다시 만나는 곳'})[panel]),v4h('div',{className:'v4-activity-body'},
  panel==='write'&&v4h(React.Fragment,null,v4h('div',{className:'v4-section-head'},v4h('small',null,q.active?'탐험 1  일기 쓰기':'나만의 기록'),v4h('h3',null,'오늘 기억에 남는 순간이 있나요?'),v4h('p',null,'그때 어떤 마음이 들었나요? 특별한 일이 아니어도 좋아요.')),
   v4h(React.Fragment,null,v4h('div',{className:'v4-write-date'},v4h('label',null,'일기 날짜 ',v4h('input',{type:'date',value:writing.date,onInput:e=>updateWriting({date:e.target.value}),onChange:e=>updateWriting({date:e.target.value}),disabled:busy})),b('오늘',()=>updateWriting({date:dayStamp()}))),v4h('label',{className:'v4-label',htmlFor:'v4-diary'},'여기에 일기를 써요'),v4h('textarea',{id:'v4-diary',value:text,disabled:busy,onChange:e=>{setText(e.target.value);change({type:'draft',text:e.target.value}).catch(()=>setNotice('임시 글을 보관하지 못했어요.'));},placeholder:'어떤 상황에서 어떤 감정을 느꼈나요?',rows:5}),b(help?'감정과 상황 도움 접기':'감정과 상황 도움받기',()=>setHelp(!help),'v4-text'),help&&v4h(V4WritingHelper,{text,emotions:writing.emotions,situations:writing.situations,onEmotions:emotions=>updateWriting({emotions}),onSituations:situations=>updateWriting({situations}),disabled:busy})),
   v4h('div',{className:'v4-actions v4-write-submit'},b(busy?'저장 중…':'일기 저장하기',()=>saveSource(q.active),'v4-primary',(V4ActivityModel.dateNumber(writing.date)===null||!V4StudentTools.compose(text,writing.emotions,writing.situations).text)),b('나중에 이어쓰기',onClose)),notice&&v4h('p',{className:'v4-save-notice',role:'status'},notice),v4h(V4RecentEntries,{entries,onUpdate})),
  panel==='review'&&v4h(React.Fragment,null,v4h(V4AnalysisTools,{entries}),v4h(V4AnalysisCheck,{me,entries,key:me.id+':'+(V4Daily.current(data).entryTs||''),data,change,onLeavePlace})),
  panel==='talk'&&v4h(V4Talk,{me,entries,data,change,onLeavePlace,onEarned}),
  panel==='practice'&&v4h(V4Practice),
  panel==='archive'&&v4h(V4Archive,{me,entries,data,change,onLeavePlace,onUpdate,onDelete,onLegacy}),
  panel!=='write'&&notice&&v4h('p',{className:'v4-save-notice',role:'status'},notice),busy&&v4h('p',{role:'status'},'저장 중이에요…')));
}
function V4GiftPreview({item,celebrate=false}){
 const host=useRef(null);
 useEffect(()=>{const T=THREE,node=host.current;let raf,renderer;try{
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,20);camera.position.set(1.35,1.35,2.3);camera.lookAt(0,.48,0);
  renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
  scene.add(new T.HemisphereLight('#fff5df','#8ca7a0',1.1));const light=new T.DirectionalLight('#fff2d4',1.6);light.position.set(-3,6,5);scene.add(light);
  const gift=V4Decor.items[item]?v4DecorObject(item,V4Decor.items[item]):v4BuildReward(T,item);scene.add(gift);if(V4Decor.items[item]){camera.position.set(2.4,2.6,4.5);camera.lookAt(0,1,0);}node.appendChild(renderer.domElement);
  const resize=()=>{const w=node.clientWidth,h=node.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);},observer=new ResizeObserver(resize);observer.observe(node);resize();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();function tick(now){const t=(now-start)/1000,u=Math.min(1,t/.7);gift.rotation.y=reduced?-.3:Math.sin(Math.min(t,8)*.65)*.35-.3;gift.position.y=reduced?0:Math.sin(Math.min(t,8)*1.5)*.025;gift.scale.setScalar(celebrate&&!reduced?1-Math.pow(1-u,3)+Math.sin(u*Math.PI)*.12:1);renderer.render(scene,camera);if(t<8&&!reduced)raf=requestAnimationFrame(tick);}tick(start);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();if(gift.userData.release)gift.userData.release();else v4DisposeReward(gift);renderer.dispose();renderer.domElement.remove();};
 }catch{renderer?.dispose();}},[item,celebrate]);
 return v4h('div',{className:'v4-gift-preview',ref:host,role:'img','aria-label':V4Content.items[item].name+' 소품 미리보기'},v4h('span',{className:'v4-gift-fallback'},V4Content.items[item].icon));
}
function V4Rewards({data,change,onClose,onShow,celebrate=false}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[acquired,setAcquired]=useState(false),lock=useRef(false);
 async function act(e){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await change(e);if(e.type==='choose')setAcquired(true);}catch{setError('선택을 저장하지 못했어요. 다시 눌러 주세요.');}finally{lock.current=false;setBusy(false);}}
 const r=data.reward,festive=celebrate||acquired;
 return v4h(V4Dialog,{title:r.available?(r.item?'나의 꾸미기 소품':'탐험을 마쳤어요!'):'나의 꾸미기',onClose},!r.available?v4h('p',null,'기본 풍경은 언제나 그대로예요. 마음 말 탐험을 마치면 작은 소품 하나를 더 고를 수 있어요.'):v4h(React.Fragment,null,
  v4h('section',{className:'v4-reward-celebration'+(festive?' is-new':''),'aria-label':'소품 획득 안내'},festive&&v4h('div',{className:'v4-confetti','aria-hidden':true},Array.from({length:12},(_,i)=>v4h('i',{key:i,style:{'--i':i,'--x':(i*37%100)+'%','--delay':i*.055+'s'}}))),v4h('small',null,r.item?'내가 얻은 작은 선물':'마음 탐험 01'),r.item?v4h(V4GiftPreview,{item:r.item,celebrate:acquired}):v4h('div',{className:'v4-gift-emblem','aria-hidden':true},'✦'),v4h('h3',{role:festive?'status':undefined},acquired?V4Content.items[r.item].name+' 선물을 받았어요!':r.item?V4Content.items[r.item].name:'마음을 살펴본 나에게, 작은 선물'),v4h('p',null,r.item?'이 소품은 내 것이 되었어요. 마음에 드는 자리에 놓아 보세요.':'소품 하나를 골라 나의 섬에 놓을 수 있어요.')),
  !r.item?v4h(React.Fragment,null,v4h('p',{className:'v4-muted'},'어떤 마음을 골랐든 같은 선택권이에요. 선택은 한 번만 해요.'),v4h('div',{className:'v4-reward-grid'},Object.entries(V4Content.items).map(([id,item])=>v4h('button',{key:id,disabled:busy,onClick:()=>act({type:'choose',item:id})},v4h('span',null,item.icon),v4h('strong',null,item.name),v4h('small',null,item.desc))))):v4h(React.Fragment,null,v4h('h3',null,'어디에 놓을까요?'),v4h('div',{className:'v4-placement-list'},Object.entries(V4Content.spots).map(([id,spot])=>v4h('button',{key:id,disabled:busy,'aria-pressed':r.spot===id,onClick:()=>act({type:'place',spot:id})},spot.name+(r.spot===id?' ✓':'')))),v4h('div',{className:'v4-actions'},v4h('button',{disabled:busy,onClick:()=>act({type:'place',spot:null})},'보관하기'),v4h('button',{className:'v4-primary',disabled:busy,onClick:r.spot?onShow:onClose},r.spot?'섬에 놓인 모습 보기':'소품함에 보관하고 닫기')),v4h('p',{role:'status'},r.spot?V4Content.spots[r.spot].name+'에 놓았어요.':'소품함에 보관 중이에요.'))),error&&v4h('p',{role:'alert'},error));
}
