function V2Landing({onLogin,onTrial,onPrivacy,onCredits,authOpen}){
  const host=useRef(null),api=useRef(null),loginButton=useRef(null),wasOpen=useRef(false),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false);
  useEffect(()=>{try{api.current=v2CreateWorld(host.current,EMOTIONS_28.filter(e=>['신남','희열','만족','편안','슬픔','우울','분노','긴장'].includes(e.label)).map(e=>({label:e.label,q:e.q})),{open:()=>{},update:()=>{},motion:()=>{}},null,{hero:true});return()=>api.current?.dispose();}catch(e){setFailed(true);}},[]);
  useEffect(()=>{api.current?.pause(!!authOpen);},[authOpen]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>{if(authOpen)document.querySelector('.v2-auth-board button')?.focus();else if(wasOpen.current)loginButton.current?.focus();wasOpen.current=authOpen;});function trap(e){if(!authOpen||e.key!=='Tab')return;const items=[...document.querySelectorAll('.v2-auth-board button,.v2-auth-board input')].filter(n=>!n.disabled&&n.getClientRects().length);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}window.addEventListener('keydown',trap);return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',trap);};},[authOpen]);
  async function start(){if(busy)return;setBusy(true);try{await onTrial();}finally{setBusy(false);}}
  return v2h('main',{className:'v2-landing',inert:authOpen?'':undefined},
    v2h('div',{className:'v2-hero-scene',ref:host,'aria-hidden':true}),
    v2h('div',{className:'v2-hero-soften','aria-hidden':true}),
    v2h('header',{className:'v2-home-nav'},v2h('div',{className:'v2-home-brand'},v2h('span',{'aria-hidden':true},'⚓'),v2h('strong',null,'마음 바다 탐험대')),v2h('button',{onClick:onLogin,ref:loginButton},'로그인',v2h('span',{'aria-hidden':true},' ↗'))),
    v2h('section',{className:'v2-home-copy'},v2h('p',{className:'v2-home-kicker'},'나를 알아가는 작은 항해'),
      v2h('h1',null,'오늘의 마음에,',v2h('br'),v2h('em',null,'닻을 내려요.')),
      v2h('p',{className:'v2-home-description'},'마음을 기록하면 나만의 섬이 자라나요.',v2h('br'),'가끔은 배를 타고, 친구의 마음에 닿아 보세요.'),
      v2h('div',{className:'v2-home-actions'},v2h('button',{className:'v2-home-start',onClick:start,disabled:busy},busy?'섬을 준비하고 있어요…':'탐험 시작하기',v2h('span',{'aria-hidden':true},' →')),v2h('small',null,'계정 없이, 연습 섬부터 둘러봐요')),
      v2h('div',{className:'v2-home-moods','aria-label':'어떤 마음도 괜찮아요'},['활기','평온','슬픔','떨림'].map((name,i)=>v2h('span',{key:name},v2h('i',{className:'mood-'+i,'aria-hidden':true}),name)),v2h('small',null,'어떤 마음도, 나의 일부니까.'))),
    v2h('div',{className:'v2-home-coordinate','aria-hidden':true},v2h('span',null,'✧'),v2h('p',null,'한 사람, 하나의 마음 섬'),v2h('small',null,'물결을 따라, 서로의 마음으로')),
    failed&&v2h('p',{className:'v2-home-fallback',role:'status'},'이 기기에서는 섬 미리보기를 쉬고 있어요. 위 버튼으로 시작할 수 있어요.'),
    v2h('footer',{className:'v2-home-footer'},v2h('span',null,v2h('i'), V2_LOCAL?'로컬 연결 검증 · 실제 기록에 영향을 주지 않아요':'한 사람, 하나의 마음 섬 · 마음 바다 탐험대'),v2h('nav',null,v2h(SndBtn,{small:true,className:'v2-sound'}),v2h('button',{onClick:onPrivacy},'개인정보 안내'),v2h('button',{onClick:onCredits},'출처와 저작권'))));
}
