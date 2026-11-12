/* Reuse the original warm spotlight/bubble tutorial; store only a local seen flag. */
const V4TutorialMemory={
 key:me=>'mind-island-guide-v2:'+encodeURIComponent(me.schoolCode)+':'+encodeURIComponent(me.id),
 seen(me){try{return localStorage.getItem(this.key(me))==='1';}catch{return false;}},
 mark(me){try{localStorage.setItem(this.key(me),'1');}catch{/* The guide still works when storage is unavailable. */}}
};
function v4IslandTutorialSteps(){
 const target=selector=>()=>document.querySelector(selector);
 const touch=typeof coarsePointer==='function'&&coarsePointer();
 return [
  {id:'walk',target:target('[data-tut="v4-walk"]'),walkMask:true,keys:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'],title:'내 섬에서 걸어 봐요',text:touch?'아래 방향 패드로 걸을 수 있어요.\n**방향 패드를 움직여 보세요.**':'방향키나 W A S D 키로 걸을 수 있어요.\n**방향키를 눌러 보세요.**',next:'button',pad:8,radius:30},
  {id:'write',target:target('[data-tut="v4-write"]'),title:'나무 책상에서 일기를 써요',text:'오늘 있었던 일과 그때의 마음을 적어요.\n가까이 가면 E 표시가 나타나요.\n**E 표시를 누르거나 E 키로 열어요.**',next:'button',inert:true,pad:10,radius:24},
  {id:'review',target:target('[data-tut="v4-review"]'),title:'망원경에서 감정을 살펴봐요',text:'일기에 쓴 감정과 그때의 상황을 살펴봐요.\n**그래프를 읽고 「확인했어요」를 눌러요.**',next:'button',inert:true,pad:10,radius:24},
  {id:'talk',target:target('[data-tut="v4-talk"]'),title:'우체통에서 마음 대화를 해요',text:'마음에 남은 일기를 골라요.\n무슨 일이 있었는지, 무엇을 바랐는지 돌아봐요.\n**질문을 따라 내 생각을 적어요.**',next:'button',inert:true,pad:10,radius:24},
  {id:'activities',target:target('.v4-activities-launch'),title:'다른 마음 활동도 있어요',text:'탐험연습하기에서는 감정 단어를 배워요.\n탐험 일지보기에서는 지난 일기를 읽어요.\n**「마음 활동」에서 원하는 활동을 열어요.**',next:'button',inert:true,pad:8},
  {id:'board',target:target('[data-tut="v4-board"]'),title:'우리 반 게시판',text:'오늘의 질문을 읽고 내 답을 적어요.\n답을 쓰면 친구들의 생각도 읽을 수 있어요.\n**내 이름과 친구 이름은 쓰지 않아요.**',next:'button',inert:true,pad:10,radius:24},
  {id:'garden',target:target('.v4-decor-launch'),title:'내 섬을 꾸며요',text:'**그네, 등대, 꽃배 등**을 놓을 수 있어요.\n정원을 고르고 소품의 자리와 방향을 정해요.\n**「여기에 놓기」를 누르면 저장돼요.**',next:'button',inert:true,pad:8},
  {id:'dock',target:target('[data-tut="v4-dock"]'),title:'배를 타고 친구를 만나요',text:'부두에서 배를 타면 우리 반 바다로 나가요.\n친구를 고르면 그 친구의 섬으로 갈 수 있어요.\n**친구가 공개한 일기를 읽고 마음을 나눠요.**',next:'button',inert:true,pad:10,radius:24},
  {id:'ready',target:target('.v4-quest'),title:'오늘의 탐험을 시작해요',text:'일기를 쓰고 내 마음을 살펴보는 활동이에요.\n**「탐험 시작하기」를 눌러 시작해요.**\n도움이 필요하면 「섬 사용법」을 다시 열어요.',next:'button',inert:true,pad:8}
 ];
}
function V4IslandTutorial({api,onStage,onDone}){
 const steps=useMemo(v4IslandTutorialSteps,[]),[index,setIndex]=useState(0),last=useRef(null),distance=useRef(0),finished=useRef(false);
 const finish=()=>{if(finished.current)return;finished.current=true;onDone();};
 function next(){api.current?.stop();if(index+1===steps.length)finish();else{SND.play('tut');setIndex(i=>Math.min(i+1,steps.length-1));}}
 useEffect(()=>{onStage(steps[index].id);last.current=api.current?.snapshot();distance.current=0;
  if(index!==0)return;const timer=setInterval(()=>{const p=api.current?.snapshot();if(!p)return;if(last.current)distance.current+=Math.hypot(p.x-last.current.x,p.z-last.current.z);last.current=p;if(distance.current>=1.2){clearInterval(timer);api.current?.stop();setIndex(1);SND.play('tut');}},180);return()=>clearInterval(timer);
 },[index]);
 useEffect(()=>()=>{api.current?.stop();api.current?.setTourFocus(null);},[]);
 return v4h(TutorialOverlay,{steps,i:index,tone:'wood',onNext:next,onSkip:finish});
}
