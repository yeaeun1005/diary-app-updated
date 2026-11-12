function V4DecorLibrary({data,change,onClose,onEdit,celebrate=false}){
 const [photos,setPhotos]=useState(()=>({...V4_DECOR_PHOTOS})),[filter,setFilter]=useState('all'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[acquired,setAcquired]=useState(false),lock=useRef(false);
 const catalog=V4Decor.catalog(data),placed=V4Decor.placements(data),r=data.reward;
 const giftRef=useRef(null),celebrationRef=useRef(null);
 useEffect(()=>{const node=acquired?celebrationRef.current:celebrate?giftRef.current:null;if(node){node.scrollIntoView({block:'center'});node.querySelector('h3')?.focus({preventScroll:true});}},[celebrate,acquired]);
 async function choose(item){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await change({type:'choose',item});setAcquired(true);}catch{setError('선택을 저장하지 못했어요. 다시 눌러 주세요.');}finally{lock.current=false;setBusy(false);}}
 return v4h(V4Dialog,{title:'나의 작은 정원',wide:true,onClose,activity:'decor'},v4h(V4DecorPhotos,{onReady:setPhotos}),
  v4h('div',{className:'v4-decor-intro'},v4h('div',null,v4h('small',null,'MY LITTLE GARDEN'),v4h('h3',null,'마음에 드는 풍경을 만들어요.'),v4h('p',null,'소품을 골라 정원에 놓아 보세요. 위치와 방향은 언제든 바꿀 수 있어요.')),v4h('span',{className:'v4-decor-count'},v4h('strong',null,Object.keys(placed).length),v4h('small',null,'개 놓았어요'))),
  v4h('div',{className:'v4-decor-filters','aria-label':'소품 분류'},[['all','전체 소품'],['stored','보관 중'],['placed','섬에 놓은 소품']].map(([id,name])=>v4h('button',{key:id,'aria-pressed':filter===id,onClick:()=>setFilter(id)},name))),
  v4h('div',{className:'v4-decor-grid'},Object.entries(catalog).filter(([id])=>filter==='all'||(filter==='placed'?!!placed[id]:!placed[id])).map(([id,item])=>v4h('button',{key:id,className:'v4-decor-card',onClick:()=>onEdit(id),'aria-label':item.name+' '+(placed[id]?'배치 바꾸기':'꾸미기')},v4h('span',{className:'v4-decor-photo',style:{'--decor-color':item.color||'#c4d4b0'}},photos[item.modelId||id]?v4h('img',{src:photos[item.modelId||id],alt:''}):v4h('span',{'aria-hidden':true},item.icon),v4h('small',{className:placed[id]?'is-placed':''},placed[id]?'섬에 놓았어요':(item.reward||item.gift)?'탐험 선물':'기본 소품')),v4h('strong',null,item.name),v4h('span',{className:'v4-decor-desc'},item.desc),v4h('span',{className:'v4-decor-link'},placed[id]?'자리 바꾸기 ↗':'정원에 놓기 ＋')))),
  !Object.keys(catalog).some(id=>filter==='all'||(filter==='placed'?placed[id]:!placed[id]))&&v4h('p',{className:'v4-decor-empty'},filter==='placed'?'아직 놓은 소품이 없어요. 전체 소품에서 하나를 골라 보세요.':'모든 소품이 정원에 있어요.'),
  !r.item&&v4h('section',{className:'v4-decor-gift',ref:giftRef},v4h('div',null,v4h('small',null,'마음 탐험 01 · 한 번 받는 선물'),v4h('h3',{tabIndex:-1},r.available?'탐험을 마쳤어요. 선물 하나를 골라요!':'탐험을 마치면 작은 선물 하나 더'),v4h('p',null,r.available?'어떤 마음을 골랐든 같은 선물이에요. 선택은 한 번만 해요.':'기본 소품 '+Object.values(V4Decor.items).filter(item=>!item.gift).length+'개는 지금 바로 꾸밀 수 있어요.')),
   r.available&&v4h('div',{className:'v4-actions'},Object.entries(V4Content.items).map(([id,item])=>v4h('button',{key:id,disabled:busy,onClick:()=>choose(id)},item.icon+' '+item.name)))),
  acquired&&r.item&&v4h('section',{className:'v4-reward-celebration is-new',role:'status',ref:celebrationRef},v4h('small',null,'마음 탐험 01 · 나에게 온 선물'),v4h(V4GiftPreview,{item:r.item,celebrate:true}),v4h('h3',{tabIndex:-1},V4Content.items[r.item].name+' 선물을 받았어요!'),v4h('button',{className:'v4-primary',onClick:()=>onEdit('reward')},'선물을 정원에 놓기')),
  error&&v4h('p',{role:'alert'},error),v4h('p',{className:'v4-muted'},'기본 소품은 종류마다 1개씩 있어요. 소품함에 보관해도 사라지지 않아요.'));
}
function V4DecorEditor({api,data,change,id,onClose,onLibrary}){
 const item=V4Decor.catalog(data)[id],initial=V4Decor.placements(data)[id],suggested=V4Decor.suggest(data,id),start=initial&&!initial.legacy?initial:V4Decor.reason(data,id,suggested)?V4Decor.suggest(data,id,'breeze'):suggested;
 const [draft,setDraft]=useState(start),[modelState,setModelState]=useState('loading'),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false),draftRef=useRef(draft);draftRef.current=draft;
 const reason=V4Decor.reason(data,id,draft),ref=useRef(null);
 useEffect(()=>{ref.current?.querySelector('h2')?.focus();window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);api.current?.endDecorEdit();};},[]);
 useEffect(()=>{api.current?.editDecoration(id,draft,data,(x,z)=>{if(lock.current)return;setError('');setDraft(old=>({...old,x:Math.round(x*4)/4,z:Math.round(z*4)/4}));});},[draft,data]);
 useEffect(()=>{const timer=setInterval(()=>setModelState(api.current?.decorStatus(id)),300);return()=>clearInterval(timer);},[id]);
 function move(dx,dz){if(lock.current)return;setError('');const step=api.current?.decorStep(dx,dz)||{x:dx,z:dz};setDraft(p=>V4Decor.normalize({...p,x:p.x+step.x,z:p.z+step.z}));}
 async function save(store=false){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await change({type:'decorate',id,placement:store?null:draftRef.current});onClose(store?'소품함에 보관했어요.':'정원에 놓았어요. 다음에도 자리를 바꿀 수 있어요.');}catch{setError('저장하지 못했어요. 미리보기는 그대로예요. 다시 눌러 주세요.');}finally{lock.current=false;setBusy(false);}}
 function cancel(){if(!lock.current)onLibrary();}
 function key(e){if(e.isComposing||lock.current)return;const moves={ArrowUp:[0,-.25],ArrowDown:[0,.25],ArrowLeft:[-.25,0],ArrowRight:[.25,0]};if(moves[e.key]&&e.target.tagName!=='SELECT'){e.preventDefault();move(...moves[e.key]);}if(e.key==='Escape'){e.stopPropagation();cancel();}}
 return v4h('section',{className:'v4-decor-editor',ref,'aria-label':'소품 배치 편집','data-draft':JSON.stringify(draft),'data-valid':!reason},
  v4h('header',null,v4h('div',null,v4h('small',null,'정원을 꾸미는 중'),v4h('h2',{tabIndex:-1},item.name)),v4h('button',{onClick:cancel,disabled:busy,'aria-label':'배치 취소'},'×')),
  v4h('label',{htmlFor:'decor-zone'},'어디에 놓을까요?'),v4h('select',{id:'decor-zone','aria-label':'어디에 놓을까요?',value:draft.zone,disabled:busy,onChange:e=>{setError('');setDraft(V4Decor.suggest(data,id,e.target.value));}},Object.entries(V4Decor.zones).map(([k,g])=>v4h('option',{key:k,value:k},g.name))),
  v4h('p',{className:'v4-decor-instruction'},'빛나는 테두리 안의 바닥을 눌러요.'),
  modelState==='fallback'&&v4h('p',{className:'v4-decor-fallback-note',role:'status'},'소품을 불러오지 못해 간단한 모양으로 보여요. 배치와 보관은 할 수 있어요.'),
  v4h('div',{className:'v4-decor-controls'},v4h('div',{className:'v4-decor-arrows','aria-label':'소품 위치 조정'},[[0,-.25,'위로','↑'],[-.25,0,'왼쪽으로','←'],[.25,0,'오른쪽으로','→'],[0,.25,'아래로','↓']].map(([x,z,name,icon])=>v4h('button',{key:name,disabled:busy,onClick:()=>move(x,z),'aria-label':'소품 '+name},icon))),v4h('div',{className:'v4-decor-rotation'},v4h('div',null,v4h('button',{disabled:busy,onClick:()=>setDraft(p=>V4Decor.normalize({...p,rotation:p.rotation-45})),'aria-label':'소품 왼쪽 회전'},'↶'),v4h('button',{disabled:busy,onClick:()=>setDraft(p=>V4Decor.normalize({...p,rotation:p.rotation+45})),'aria-label':'소품 오른쪽 회전'},'↷')),v4h('small',null,'방향 '+draft.rotation+'°'))),
  v4h('p',{className:'v4-decor-placement-status'+(reason||error?' is-invalid':''),role:'status'},error||reason||'이 자리에 놓을 수 있어요.'),
  v4h('div',{className:'v4-decor-save'},v4h('button',{disabled:busy||!!reason,className:'v4-primary',onClick:()=>save(false)},busy?'저장 중…':'여기에 놓기'),v4h('button',{disabled:busy,onClick:cancel},'취소')),
  initial&&v4h('button',{className:'v4-text v4-decor-store',disabled:busy,onClick:()=>save(true)},'소품함에 보관하기'),
  v4h('small',{className:'v4-decor-key-hint'},'방향키로 미세 이동 · 드래그로 둘러보기'));
}
