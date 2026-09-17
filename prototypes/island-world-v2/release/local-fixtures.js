/* Loaded only in the CSP-isolated preview. Never shipped in the static candidate. */
if(typeof __DB!=='object'||!document.querySelector('meta[http-equiv="Content-Security-Policy"]'))throw Error('Memory DB required');
var V2_TEST_CHOICE='a';
var V2_TEST_AUTH=Object.fromEntries(['a','b','empty','teacher'].map(k=>[k,{schoolCode:'CHECKV2',loginId:'check-'+k,password:crypto.randomUUID().replaceAll('-','').slice(0,16)}]));
var V2_TEST_READY=(async function(){
  const code='CHECKV2',students=[{id:'check-a',name:'탐험이',loginId:'check-a'},{id:'check-b',name:'여울',loginId:'check-b'},{id:'check-empty',name:'산호',loginId:'check-empty'},{id:'check-c',name:'모래',loginId:'check-c'}];
  __set('app/'+stuKey(code),students);await sSet(schPubKey(code),{schoolName:'로컬 연결 검증 학급'});
  for(const role of ['a','b','empty']){const a=V2_TEST_AUTH[role];await credSetStudent(code,a.loginId,await pwHash('s',code,a.loginId,a.password));}
  const teacher=V2_TEST_AUTH.teacher;await sSet(tcredKey(teacher.loginId,await pwHash('t','',teacher.loginId,teacher.password)),{schoolCode:code,schoolName:'로컬 연결 검증 학급',teacherName:'연습 선생님'});
  for(const s of students){await d2Update(s.id,{_migrated:true});__set('app/'+isleKey(s.id),{name:s.name,code,v:{}});}
  function entry(days,text,labels){const ts=Date.now()-days*86400000;return {ts,date:dayStamp(ts),text,analysis:safeAnalysis({hits:labels.map(label=>{const em=EMOTIONS_28.find(e=>e.label===label);return {label,q:em.q,valStd:(em.val-5)/4,aroStd:(em.aro-5)/4};})})};}
  const aEntries=[entry(8,'친구와 산책하며 마음이 편안했다.',['편안']),entry(2,'약속한 놀이를 하지 못해서 슬펐다.',['슬픔'])];
  const bEntries=[entry(7,'즐거운 소풍을 가서 신났다.',['신남']),entry(1,'비가 와서 놀이를 못 해서 슬펐다.',['슬픔','우울'])];
  for(const [student,entries] of [[students[0],aEntries],[students[1],bEntries]]){for(const e of entries)await d2Put(student.id,e);await isleSync({...student,schoolCode:code},islandState(entries));}
  await isleHide({...students[1],schoolCode:code},'우울',true);
  const qid=await plazaAsk(code,'오늘 내 마음이 잠깐 편안해졌던 순간은 언제였나요?','자기 이해',true,null,null);
  for(const [i,stu] of students.slice(1).entries()){
    await plazaAnswerPut(code,qid,stu,{o:['창가에서 바람을 느끼니 마음이 편안해졌어요.','햇살 아래 잠깐 쉬어서 차분해졌어요.','친구와 함께 문제를 풀고 나니 든든했어요.'][i],fl:[]});
    await plazaSetState(code,qid,await plazaMyAnswer(code,qid,stu.id),1);
  }
  // Safe diagnostic counters in the local document; no text, credentials, hashes or production data.
  const audit=document.createElement('meta');audit.id='v2-local-audit';document.head.appendChild(audit);
  function summarize(){const users={};for(const s of students){const d=__get('app/'+d2Key(s.id))||{},isle=__get('app/'+isleKey(s.id))||{};users[s.id]={entries:Object.keys(d).filter(k=>k.startsWith('e')).length,words:Object.keys(isle.v||{}).length,hidden:Object.values(isle.v||{}).filter(v=>v.h).length};}audit.dataset.state=JSON.stringify({memory:true,users,writes:(window.__DBW||[]).length});}
  summarize();setInterval(summarize,500);
})();
