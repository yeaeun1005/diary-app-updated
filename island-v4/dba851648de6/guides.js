/* Read-only walkthroughs. Opening or completing a guide never saves student work. */
const V4ActivityGuides={
 write:[['.v4-write-date','1. 날짜를 확인해요','**오늘 날짜**가 먼저 들어 있어요.\n지난 일을 쓰려면 날짜를 바꿔요.'],['#v4-diary','2. 여기에 일기를 써요','어떤 일이 있었는지 적고 그때의 마음도 써요.\n글이 떠오르지 않으면 **「감정과 상황 도움받기」**를 열어요.'],['.v4-write-submit','3. 일기를 저장해요','**「일기 저장하기」**를 누르면 아래 최근 일기에 보여요.\n저장한 글은 **나와 선생님만** 볼 수 있어요.'],['.v4-recent-heading','4. 쓴 일기를 다시 읽어요','내가 쓴 글과 감정 분석을 함께 볼 수 있어요.\n감정이 다르게 보이면 **「내 감정은 달라요」**로 고쳐요.']],
 review:[['.v4-restored-analysis .v4-restored-card','1. 살펴볼 일기를 골라요','**기간**을 고르거나 **일기 한 편**을 선택해요.'],['.v4-restored-analysis .v4-restored-card:nth-child(2) h4','2. 그래프와 질문을 읽어요','아래로 내려가며 **감정 변화**와 **자주 쓴 감정**을 살펴봐요.\n각 그래프 위 질문을 읽고 내 경험을 떠올려요.'],['.v4-analysis-check','3. 살펴본 뒤 확인해요','오늘 일기가 있으면 **「확인했어요」**를 누를 수 있어요.\n알게 된 점은 써도 되고 다음에 써도 돼요.']],
 talk:[['.v4-context-card','1. 이야기할 일기를 골라요','부정 감정이 담긴 일기를 골라 다시 읽어요.\n연습하고 싶으면 가상 이야기를 골라도 돼요.'],['.v4-step-nav','2. 다섯 질문을 따라가요','일어난 일, 감정, 원했던 것, 한 행동을 돌아봐요.\n마지막에는 그 행동이 도움이 됐는지 생각해요.'],['.v4-talk-question','3. 내 생각을 적어요','미리 적힌 내용이 내 생각과 다르면 고쳐요.\n예시를 고른 뒤 내 말로 바꿔도 돼요.'],['.v4-activity-footer','4. 마지막에 저장해요','**「다음 질문」**으로 넘어가요.\n**다섯 번째 질문**에서 **「내 생각 저장하기」**를 눌러요.']],
 practice:[['.v4-practice-grid','연습할 활동을 골라요','감정 단어의 뜻을 살펴보거나 놀이로 연습해요.\n이곳의 연습은 **개인 일기로 저장되지 않아요.**']],
 archive:[['.v4-archive-nav','기록을 보는 방법을 골라요','달력에서 하루를 고르거나 **「모든 일기」**를 눌러요.\n**「나의 리포트」**에서는 여러 날의 마음을 함께 살펴봐요.'],['.v4-own-shared','공개한 일기를 확인해요','친구에게 보여 주기로 한 글을 모아 볼 수 있어요.\n일기마다 공개를 선택하거나 취소할 수 있어요.']],
 board:[['[data-tut="plz-q"]','1. 오늘의 질문을 읽어요','질문을 읽고 내 경험을 떠올려요.'],['[data-tut="plz-how"], [data-tut="plz-mine"]','2. 내 답을 써요','**「내 답 쓰기」**를 누르고 내 생각과 그때의 마음을 적어요.\n이미 쓴 답은 **「고치기」**로 수정할 수 있어요.'],['[data-tut="plz-pub"], [data-tut="plz-wait"]','3. 친구들의 답을 읽어요','내 답을 쓴 뒤 친구들의 답을 읽어요.\n공개된 답이 **3개 이상** 모이면 이름 없이 보여요.']],
 'board-write':[['[data-tut="plz-q"]','1. 질문을 다시 읽어요','이 질문에 대한 내 생각을 적을 거예요.'],['[data-tut="plz-answer"]','2. 여기에 답을 써요','질문에 대한 답과 그때의 마음을 자유롭게 써요.\n**나와 친구의 이름은 쓰지 않아요.**'],['[data-tut="plz-emotions"]','3. 느꼈던 감정을 골라요','그때의 감정을 **최대 5개**까지 고를 수 있어요.\n목록에 없으면 **「기타」**에 적어요.'],['[data-tut="plz-save"]','4. 답을 저장해요','**「답 저장하기」**를 누르면 이름 없이 공개돼요.\n이름이 들어간 답은 선생님이 확인한 뒤에 보여요.']]
};
const V4ActivityGuideEngaged=new Set();
function V4ActivityGuide({me,kind}){
 const [active,setActive]=useState(false),[index,setIndex]=useState(0),[steps,setSteps]=useState([]),returnFocus=useRef(null);
 const key='mind-activity-guide-v1:'+encodeURIComponent(me.schoolCode)+':'+encodeURIComponent(me.id)+':'+kind;
 function begin(){returnFocus.current=document.activeElement;const available=(V4ActivityGuides[kind]||[]).filter(([q])=>document.querySelector(q));setSteps(available.map(([q,title,text])=>({target:()=>document.querySelector(q),title,text,next:'button',inert:true,pad:7,radius:16})));setIndex(0);setActive(available.length>0);}
 function finish(){setActive(false);try{localStorage.setItem(key,'1');}catch{}returnFocus.current?.isConnected&&returnFocus.current.focus?.({preventScroll:true});}
 useEffect(()=>{
  let seen=false;try{seen=localStorage.getItem(key)==='1';}catch{}if(seen||V4ActivityGuideEngaged.has(key))return;
  // Do not steal focus if the student starts using the activity before the delayed guide.
  const events=['pointerdown','keydown','beforeinput','input'];
  const stop=event=>{if(event)V4ActivityGuideEngaged.add(key);clearTimeout(t);events.forEach(type=>document.removeEventListener(type,stop,true));};
  const t=setTimeout(()=>{stop();begin();},500);
  events.forEach(type=>document.addEventListener(type,stop,true));return stop;
 },[key]);
 useEffect(()=>{if(!active)return;requestAnimationFrame(()=>document.querySelector('.v4-activity-tour .tut-next')?.focus({preventScroll:true}));},[active,index]);
 function next(){SND.play('tut');if(index+1===steps.length)finish();else setIndex(n=>n+1);}
 return v4h('div',{className:'v4-guide-bar'},v4h('span',null,({write:'날짜 확인 → 일기 쓰기 → 저장',review:'그래프 읽기 → 확인하기',talk:'일기 고르기 → 다섯 질문 → 저장',practice:'활동 고르기 → 연습하기',archive:'날짜 선택 → 일기 읽기',board:'질문 읽기 → 내 답 쓰기 → 친구 답 읽기','board-write':'질문 읽기 → 답 쓰기 → 저장'})[kind]),v4h('button',{type:'button',onClick:begin},'사용법 보기'),active&&ReactDOM.createPortal(v4h('div',{className:'v4-activity-tour'},v4h(TutorialOverlay,{steps,i:index,tone:'wood',onNext:next,onSkip:finish})),document.body));
}
