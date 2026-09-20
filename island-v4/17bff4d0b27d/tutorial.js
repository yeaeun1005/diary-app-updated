/* Reuse the original warm spotlight/bubble tutorial; store only a local seen flag. */
const V4TutorialMemory={
 key:me=>'mind-island-guide-v1:'+encodeURIComponent(me.schoolCode)+':'+encodeURIComponent(me.id),
 seen(me){try{return localStorage.getItem(this.key(me))==='1';}catch{return false;}},
 mark(me){try{localStorage.setItem(this.key(me),'1');}catch{/* The guide still works when storage is unavailable. */}}
};
function v4IslandTutorialSteps(){
 const target=selector=>()=>document.querySelector(selector);
 const touch=typeof coarsePointer==='function'&&coarsePointer();
 return [
  {id:'walk',target:target('[data-tut="v4-walk"]'),free:true,keys:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'],title:'반가워, 마음 탐험가!',text:touch?'여기는 나만의 마음섬이에요. **아래 방향 패드를 움직이거나 길을 눌러 걸어 보세요.**':'여기는 나만의 마음섬이에요. **방향키로 걸어 보세요. 길을 눌러도 갈 수 있어요.**',next:'button',pad:8,radius:30},
  {id:'write',target:target('[data-tut="v4-write"]'),title:'책을 만나면, 내 이야기 시작',text:'나무 아래 책상은 감정일기 쓰는 곳이에요. 가까이 가면 **E 그림이나 E 키로 열 수 있어요.** 글쓰기 도움도 준비되어 있어요.',next:'button',inert:true,pad:10,radius:24},
  {id:'activities',target:target('.v4-tools button:first-child'),title:'다섯 곳의 마음 활동',text:'책에서 일기를 쓰고, 망원경에서 마음을 살펴봐요. 우체통은 마음 대화, 나침반은 연습, 보물함은 지난 일기예요. **마음 활동에서 바로 열 수도 있어요.**',next:'button',inert:true,pad:8},
  {id:'garden',target:target('.v4-tools button:nth-child(2)'),title:'넓어진 정원을 꾸며요',text:'그네·등대·꽃배도 소품함에 있어요. 정원을 고르고, 소품의 자리와 방향을 바꿔요. **「여기에 놓기」를 누르면 저장돼요.**',next:'button',inert:true,pad:8},
  {id:'dock',target:target('[data-tut="v4-dock"]'),title:'배 타고 친구를 만나러!',text:'부두에서 배를 타면 우리 반 바다로 나가요. 친구 섬에서 공감과 응원 글을 보내 보세요. **친구가 공개한 일기만 볼 수 있어요.**',next:'button',inert:true,pad:10,radius:24},
  {id:'ready',target:target('.v4-quest'),title:'이제 탐험할 준비 끝!',text:'오늘의 마음 탐험부터 차근차근 시작해 볼까요? **궁금하면 「섬 사용법」에서 다시 볼 수 있어요.**',next:'button',inert:true,pad:8}
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
