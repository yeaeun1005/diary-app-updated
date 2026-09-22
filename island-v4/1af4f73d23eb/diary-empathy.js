/* Public copies only; sending uses the existing class/visibility/daily guards. */
async function v4SendDiaryEmpathy(me,friend,entry,label,message){
 const fresh=await V4Sharing.list(me,friend.id);
 const current=fresh.find(e=>e.key===entry.key);
 if(!current||current.text!==entry.text||current.publishedAt!==entry.publishedAt||!current.emotions.includes(label))return{status:'private'};
 return V4Sharing.send(me,friend,label,message);
}
function V4DiaryEmpathy({me,friend,entry,records,mine,onRecords}){
 const [open,setOpen]=useState(false),[label,setLabel]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[star,setStar]=useState(0);
 const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const words=entry.emotions.filter(w=>(friend.state||[]).some(s=>!s.hidden&&s.label===w));
 const status=w=>records===null||mine===null?'loading':v2EmpathyRule(me,friend,friend.state,mine,records,w);
 async function send(){
  if(lock.current||status(label)!=='ready')return;lock.current=true;setBusy(true);setNotice('');
  try{const result=await v4SendDiaryEmpathy(me,friend,entry,label,message);if(!alive.current)return;
   if(result.status==='sent-now'){onRecords(result.records);setOpen(false);setMessage('');setStar(n=>n+1);setNotice('별에 마음을 담아 보냈어요!');SND.play('empathy');}
   else{if(result.status==='sent')onRecords(await V4Sharing.records(friend.id));setNotice(result.status==='sent'?'이 마음에는 오늘 이미 보냈어요.':result.status==='private'?'공개 상태가 바뀌었어요. 일기를 다시 열어 주세요.':'같은 쪽 마음을 기록해 본 뒤에 보낼 수 있어요.');}
  }catch{if(alive.current)setNotice('보내지 못했어요. 연락처나 링크 없이 다시 시도해 주세요.');}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 return v4h('section',{className:'v4-diary-empathy','aria-label':'공개 일기에 공감하기'},
  v4h('div',{className:'v4-actions'},words.map(w=>{const rule=status(w);return v4h('button',{key:w,type:'button',disabled:busy||rule!=='ready','aria-pressed':open&&label===w,onClick:()=>{setLabel(w);setNotice('');setOpen(true);}},rule==='sent'?w+' 오늘 공감했어요':rule==='unfamiliar'?w+' 같은 쪽 마음을 기록하면 공감할 수 있어요':rule==='loading'?'공감 확인 중…':'☆ '+w+'에 공감하기');})),
  !words.length&&v4h('p',{className:'v4-fine'},'공개된 감정이 있는 일기에 공감할 수 있어요.'),
  words.length>0&&v4h('small',null,'같은 친구의 같은 감정에는 하루에 한 번 마음을 보낼 수 있어요.'),
  open&&v4h('div',{className:'v4-diary-compose'},v4h('label',{className:'v4-field'},v4h('span',null,'응원 한마디 (선택)'),v4h('textarea',{value:message,disabled:busy,maxLength:100,onChange:e=>setMessage(e.target.value),placeholder:'나도 그런 마음이 든 적 있어.','aria-label':'공개 일기 응원 한마디'})),v4h('small',null,'이름이나 연락처는 쓰지 않아요. '+message.length+'/100'),v4h('div',{className:'v4-actions'},v4h('button',{className:'v4-primary',disabled:busy||status(label)!=='ready',onClick:send},busy?'보내는 중…':'★ 마음 보내기'),v4h('button',{disabled:busy,onClick:()=>setOpen(false)},'취소'))),
  notice&&v4h('p',{role:'status'},notice),star>0&&v4h('span',{key:star,className:'v4-diary-star','aria-hidden':true},'✦'));
}
