const V4FriendGuideMemory={
 key:me=>'mind-friend-guide-v1:'+encodeURIComponent(me.schoolCode)+':'+encodeURIComponent(me.id),
 seen(me){try{return localStorage.getItem(this.key(me))==='1';}catch{return false;}},
 mark(me){try{localStorage.setItem(this.key(me),'1');}catch{}}
};
function V4FriendGuide({onDone}){
 const [index,setIndex]=useState(0);
 const steps=useMemo(()=>[
  ['.v4-friend-header','친구 섬에 왔어요','길을 **가볍게 누르거나 방향키**로 걸어요.\n화면을 **끌어서** 둘러볼 수 있어요.'],
  ['.v4-friend-header nav button:nth-child(3)','친구의 공개 일기를 읽어요','**「공개 일기」**를 눌러 친구가 보여 준 글을 읽어요.\n내가 느껴 본 쪽의 감정에는 **공감**을 보낼 수 있어요.'],
  ['.v4-friend-menu-toggle','마음 식물도 살펴봐요','**「길 찾기」**에서 마음 식물을 찾을 수 있어요.\n가까이 가면 감정의 뜻을 읽고 **마음 보내기**를 눌러요.'],
  ['.v4-friend-menu-toggle','부두에서 돌아가요','**「길 찾기」 → 「우리 반 바다로」**로 부두를 찾아요.\n배를 타고 바다로 나가 **내 섬**을 골라요.']
 ].map(([q,title,text])=>({target:()=>document.querySelector(q),title,text,next:'button',inert:true,pad:8,radius:18})),[]);
 useEffect(()=>{requestAnimationFrame(()=>document.querySelector('.v4-friend-tour .tut-next')?.focus({preventScroll:true}));},[index]);
 return ReactDOM.createPortal(v4h('div',{className:'v4-activity-tour v4-friend-tour'},v4h(TutorialOverlay,{steps,i:index,tone:'wood',onNext:()=>{if(index+1===steps.length)onDone();else{SND.play('tut');setIndex(i=>i+1);}},onSkip:onDone})),document.body);
}
