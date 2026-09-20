// Illustrated welcome screen only. Existing authentication, learning, and sound handlers are retained.
const v4VoyageAssets=new URL('../home-art/',document.currentScript.src).href;
function V4HomeLettering({file,label,className}){
  const [broken,setBroken]=useState(false);
  return v2h('span',{className:'voyage-lettering '+className},broken?v2h('span',{className:'voyage-lettering-fallback'},label):v2h('img',{src:v4VoyageAssets+file,alt:label,draggable:false,onError:()=>setBroken(true)}));
}
function V2Landing({onLogin,onPrivacy,onCredits,authOpen}){
  const opener=useRef(null),wasOpen=useRef(false),[failed,setFailed]=useState(false),[hidden,setHidden]=useState(()=>document.hidden);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
  useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[]);
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      if(authOpen)document.querySelector('.v2-auth-board button')?.focus();
      else if(wasOpen.current)opener.current?.focus();
      wasOpen.current=authOpen;
    });
    function trap(e){
      if(!authOpen||e.key!=='Tab')return;
      const items=[...document.querySelectorAll('.v2-auth-board button,.v2-auth-board input,.v2-auth-board select,.v2-auth-board a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    window.addEventListener('keydown',trap);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',trap);};
  },[authOpen]);
  function login(e){opener.current=e.currentTarget;onLogin();}
  const arrow=v2h('svg',{viewBox:'0 0 24 24',width:22,height:22,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},v2h('path',{d:'M5 12h14m-6-6 6 6-6 6'}));
  function word(file,label,className){return v2h(V4HomeLettering,{file,label,className});}
  function icon(kind){return v2h('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},kind==='privacy'?v2h('path',{d:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-3 9 2 2 4-4'}):v2h(React.Fragment,null,v2h('circle',{cx:12,cy:12,r:9}),v2h('path',{d:'M15 8a5 5 0 1 0 0 8'})));}
  return v2h('main',{className:'v2-landing v4-home v4-voyage-home','data-motion':reduced||authOpen||hidden?'paused':'playing',inert:authOpen?'':undefined},
    v2h('div',{className:'voyage-backdrop','aria-hidden':true},
      v2h('img',{className:'voyage-world',src:v4VoyageAssets+'storybook-world-v1.png',alt:'',fetchPriority:'high',onError:()=>setFailed(true)}),
      v2h('div',{className:'voyage-sea-light'}),
      v2h('div',{className:'voyage-water-glints'},[0,1,2,3,4,5,6].map(i=>v2h('i',{key:i})))),
    v2h('div',{className:'voyage-ripples','aria-hidden':true},v2h('i'),v2h('i'),v2h('i')),
    v2h('div',{className:'voyage-cloud-layer','aria-hidden':true},[0,1,2].map(i=>v2h('img',{key:i,className:'voyage-cloud cloud-'+i,src:v4VoyageAssets+'drifting-cloud-v3.png',alt:'',draggable:false}))),
    v2h('section',{className:'v2-home-copy','aria-labelledby':'v4-home-title'},
      v2h('h1',{id:'v4-home-title','aria-label':'마음 바다 탐험대'},word('user-title-v4.png','초등학생을 위한 감정찰칵! 감정일기를 통한 마음 바다 탐험대','voyage-lockup-art'))),
    v2h('aside',{className:'voyage-curiosity','aria-label':'나의 마음 바다에는 어떤 감정이 숨어 있을까?'},
      v2h('svg',{className:'voyage-question-cloud',viewBox:'0 0 320 180',fill:'none','aria-hidden':true},
        v2h('path',{d:'M40 145C2 143-2 95 28 82 11 53 43 26 76 36 81 3 130 0 151 24 178 2 221 11 226 37 260 20 291 45 284 73 327 86 324 124 291 136 277 164 236 161 220 152 183 174 132 168 110 155 83 170 53 160 40 145Z',fill:'#fffdf0',stroke:'#f4fcff',strokeWidth:4}),
        v2h('path',{d:'M96 157q-7 16-24 15 11-7 9-18',fill:'#fffdf0'})),
      v2h('p',null,v2h('span',{className:'voyage-question-opening'},'나의 마음 바다에는'),v2h('span',{className:'voyage-question-emotion'},'어떤 감정이'),v2h('span',{className:'voyage-question-ending'},'숨어 있을까?'))),
    v2h('div',{className:'voyage-art-layer','aria-hidden':true},
      v2h('div',{className:'voyage-crew'},
        v2h('div',{className:'voyage-boat-wake'},v2h('i'),v2h('i')),
        v2h('img',{src:v4VoyageAssets+'voyage-crew-v1.png',alt:'',draggable:false})),
      v2h('div',{className:'voyage-bubbles'},v2h('i'),v2h('i'),v2h('i')),
      v2h('div',{className:'voyage-sparkles'},[0,1,2,3].map(i=>v2h('i',{key:i})))),
    v2h('div',{className:'v2-home-actions'},v2h('div',{className:'voyage-cta-float'},
      v2h('div',{className:'voyage-cta-aura','aria-hidden':true}),
      v2h('div',{className:'voyage-cta-bubbles','aria-hidden':true},v2h('i'),v2h('i'),v2h('i')),
      v2h('i',{className:'voyage-cta-star star-left','aria-hidden':true}),v2h('i',{className:'voyage-cta-star star-right','aria-hidden':true}),
      v2h('button',{className:'v2-home-start',onClick:login,'aria-label':'로그인하고 시작하기'},
      v2h('svg',{className:'voyage-shell',viewBox:'0 0 340 156',fill:'none','aria-hidden':true},
        v2h('defs',null,
          v2h('clipPath',{id:'v4-welcome-shell-clip'},v2h('path',{d:'M54 105C15 105 11 67 37 49c-6-29 25-44 54-27C108-6 146-1 169 16c25-22 67-17 81 10 33-13 62 10 57 38 29 22 13 49-19 53-30 21-64 25-114 25S83 134 54 105Z'})),
          v2h('linearGradient',{id:'v4-welcome-shell-pearl',x1:0,y1:0,x2:1,y2:0},
            v2h('stop',{offset:'0%',stopColor:'#fffce9',stopOpacity:0}),
            v2h('stop',{offset:'48%',stopColor:'#fffce9',stopOpacity:.7}),
            v2h('stop',{offset:'100%',stopColor:'#fffce9',stopOpacity:0}))),
        v2h('path',{d:'M54 113C15 113 11 75 37 57c-6-29 25-52 54-35C108-6 146-1 169 16c25-22 67-17 81 10 33-13 62 10 57 38 29 22 13 57-19 61-30 21-64 25-114 25s-91-12-120-37Z',fill:'#ca635a',stroke:'#fff5da',strokeWidth:5}),
        v2h('path',{d:'M54 105C15 105 11 67 37 49c-6-29 25-44 54-27C108-6 146-1 169 16c25-22 67-17 81 10 33-13 62 10 57 38 29 22 13 49-19 53-30 21-64 25-114 25S83 134 54 105Z',fill:'#f87973',stroke:'#fff5da',strokeWidth:5}),
        v2h('path',{d:'m169 126-3-99m-10 99L94 32m50 91L51 62m133 63 57-87m-43 91 85-61',stroke:'#e56965',strokeWidth:3,strokeLinecap:'round'}),
        v2h('g',{clipPath:'url(#v4-welcome-shell-clip)'},v2h('rect',{className:'voyage-shell-sheen',x:-110,y:-10,width:82,height:180,fill:'url(#v4-welcome-shell-pearl)'}))),
      v2h('span',{className:'voyage-cta-copy','aria-hidden':true},word('cta-login-v5.svg','로그인하고','voyage-login-art'),word('cta-start-v5.svg','시작하기','voyage-start-art')),v2h('span',{className:'v4-start-arrow','aria-hidden':true},arrow)))),
    failed&&v2h('p',{className:'v2-home-fallback',role:'status'},'섬 미리보기를 불러오지 못했어요. 탐험은 시작할 수 있어요.'),
    v2h('footer',{className:'v2-home-footer'},v2h('nav',{'aria-label':'소리와 안내'},
      v2h(SndBtn,{className:'v2-sound'}),
      v2h('button',{onClick:onPrivacy,'aria-label':'개인정보 안내'},icon('privacy'),'개인정보 안내'),
      v2h('button',{onClick:onCredits,'aria-label':'저작권 안내'},icon('credits'),'저작권 안내'))));
}
