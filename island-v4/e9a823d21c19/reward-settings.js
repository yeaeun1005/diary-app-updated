/* Uses the existing school roster. No secrets, diary text or care flags enter this setting. */
const V4RewardSettings=(()=>{
 const modes=['diary','analysis','full'];
 const group=s=>JSON.stringify([String(s.grade||''),String(s.classNumber||'')]);
 const valid=x=>modes.includes(x)?x:'full';
 function inherited(list,student){const classmates=list.filter(s=>s&&group(s)===group(student));return valid(classmates.find(s=>modes.includes(s.rewardMode))?.rewardMode);}
 async function forStudent(me){
  const list=await sGetStrict(stuKey(me.schoolCode));
  if(!Array.isArray(list))throw Error('roster-unavailable');
  const own=list.find(s=>s&&String(s.id)===String(me.id));if(!own)throw Error('student-boundary');
  return valid(own.rewardMode);
 }
 async function save(user,selected,mode){
  if(!user?.teacherId||!user.schoolCode||!modes.includes(mode))throw Error('teacher-setting-required');
  let found=false;
  const result=await dbRef(stuKey(user.schoolCode)).transaction(raw=>{
   found=false;if(!Array.isArray(raw))return raw;
   return raw.map(s=>{if(!s||group(s)!==selected)return s;found=true;return {...s,rewardMode:mode};});
  },undefined,false);
  if(!result.committed||!found)throw Error('setting-not-saved');
  return result.snapshot.val();
 }
 return {modes,group,valid,inherited,forStudent,save};
})();
function V4RewardSettingsPanel({user,students,onSaved}){
 const groups=[...new Map(students.filter(Boolean).map(s=>[V4RewardSettings.group(s),s])).entries()];
 const [selected,setSelected]=useState(groups[0]?.[0]||''),[mode,setMode]=useState(groups.length?V4RewardSettings.inherited(students,groups[0][1]):'full'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const lock=useRef(false);
 const options=[['diary','1단계 · 감정일기 쓰기','일기를 저장하면 완료해요.'],['analysis','2단계 · 일기 + 분석 확인','일기를 쓰고 분석의 확인 버튼을 눌러요.'],['full','3단계 · 일기 + 분석 확인 + 마음 대화','대화할 내용이 있는 날에는 마음 대화도 저장해요.']];
 useEffect(()=>{if(groups.length&&!groups.some(([id])=>id===selected)){setSelected(groups[0][0]);setMode(V4RewardSettings.inherited(students,groups[0][1]));}},[students]);
 async function save(){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');setError('');try{if(V4_QUERY.get('saveFail')==='1')throw Error('local-failure');const list=await V4RewardSettings.save(user,selected,mode);onSaved(list);setMessage('보상 난이도를 저장했어요. 학생의 다음 활동 확인부터 적용돼요.');}catch{setError('저장하지 못했어요. 선택은 그대로예요. 다시 눌러 주세요.');}finally{setBusy(false);lock.current=false;}}
 return v4h('section',{className:'v4-reward-settings','data-tut':'t-reward','aria-label':'탐험 보상 난이도'},v4h('small',null,'우리 반 활동 설정'),v4h('h2',null,'탐험 보상 난이도'),groups.length?v4h(React.Fragment,null,
 v4h('label',null,'학년·반',v4h('select',{value:selected,disabled:busy,onChange:e=>{setSelected(e.target.value);setMode(V4RewardSettings.inherited(students,groups.find(([id])=>id===e.target.value)[1]));setMessage('');setError('');}},groups.map(([id,s])=>v4h('option',{key:id,value:id},(s.grade||'미지정')+'학년 '+(s.classNumber||'미지정')+'반')))),
 v4h('div',{className:'v4-reward-options'},options.map(([id,title,copy])=>v4h('label',{key:id,className:mode===id?'is-selected':''},v4h('input',{type:'radio',name:'reward-mode',value:id,checked:mode===id,disabled:busy,onChange:()=>{setMode(id);setMessage('');}}),v4h('span',null,v4h('strong',null,title),v4h('small',null,copy))))),
 v4h('button',{className:'v4-primary',disabled:busy,onClick:save},busy?'저장 중…':'난이도 저장하기'),v4h('p',null,'이미 받은 선물은 유지돼요. 기본 소품과 탐험 연습은 자유롭게 이용할 수 있어요.')):v4h('p',null,'학생을 등록한 뒤 학년·반별로 설정할 수 있어요.'),message&&v4h('p',{role:'status'},message),error&&v4h('p',{role:'alert'},error));
}
