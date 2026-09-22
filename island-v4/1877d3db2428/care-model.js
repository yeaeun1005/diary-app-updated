/* Teacher-only choices. No messages are sent and no student/public path is written. */
const V4Care=(()=>{
 const actions=['Wee클래스 상담선생님께 전달','법적 보호자님께 전달','학생과 개별 대화','학교 상담 담당자와 상의'];
 function key(user){if(!user?.teacherId||!user.th||!user.schoolCode)throw Error('teacher-required');return tprivKey(user.teacherId,user.th)+'/care';}
 function clean(value){
  if(!value||!['observe','acted'].includes(value.status)||!Number.isFinite(value.updatedAt))return null;
  const selected=Array.isArray(value.actions)?[...new Set(value.actions.filter(v=>actions.includes(v)))]:[];
  if(value.status==='acted'&&!selected.length)return null;
  return {status:value.status,actions:selected,updatedAt:value.updatedAt};
 }
 async function load(user){const value=await sGetStrict(key(user));if(value==null)return{};if(typeof value!=='object'||Array.isArray(value))throw Error('care-format');return Object.fromEntries(Object.entries(value).map(([id,v])=>[id,clean(v)]).filter(([,v])=>v));}
 async function save(user,students,id,status,selected){
  if(!students.some(s=>String(s.id)===String(id)&&(!s.schoolCode||s.schoolCode===user.schoolCode)))throw Error('student-boundary');
  if(!/^[^.#$\[\]/]+$/.test(String(id)))throw Error('student-id');
  const record=clean({status,actions:selected,updatedAt:nowTs()});if(!record)throw Error('care-choice-required');
  await dbRef(key(user)+'/'+String(id)).set(record);return record;
 }
 return {actions,key,clean,load,save};
})();
