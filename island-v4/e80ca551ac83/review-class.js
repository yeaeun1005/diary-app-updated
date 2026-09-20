/* Public fictional review class. Does not read, write, or provision a Firebase account. */
const V4ReviewClass=(()=>{
 let enabled=false,prepared=null,root={};
 const pw=crypto.randomUUID().replaceAll('-','');
 const forms={student:{schoolCode:'DEMO01',loginId:'d07',password:pw,role:'student'},teacher:{schoolCode:'DEMO01',loginId:'demoteacher',password:pw,role:'teacher'}};
 const clone=v=>v==null?null:JSON.parse(JSON.stringify(v));
 function parts(k){const p=String(k).split('/').filter(Boolean);if(p.some(x=>['__proto__','prototype','constructor'].includes(x)))throw Error('Invalid review path');return p;}
 function get(k){let o=root;for(const p of parts(k)){if(!o||!Object.hasOwn(o,p))return null;o=o[p];}return clone(o);}
 function put(k,v){const p=parts(k);if(!p.length){root=clone(v)||{};return;}let o=root;for(const s of p.slice(0,-1))o=o[s]&&typeof o[s]==='object'?o[s]:(o[s]={});if(v==null)delete o[p.at(-1)];else o[p.at(-1)]=clone(v);}
 function snap(k){const value=get(k);return{val:()=>clone(value),exists:()=>value!==null,key:parts(k).at(-1)};}
 function ref(k){
  if(!enabled)throw Error('Review class is not active');parts(k);
  return{once:async()=>snap(k),set:async v=>put(k,v),remove:async()=>put(k,null),update:async values=>{for(const [key,v]of Object.entries(values||{}))put(k+'/'+key,v);},transaction:async fn=>{const next=fn(get(k));if(next===undefined)return{committed:false,snapshot:snap(k)};put(k,next);return{committed:true,snapshot:snap(k)};}};
 }
 async function start(){
  if(!prepared)prepared=(async()=>{
   const generated=DEMO_GEN.generate(new Date(DEMO_CLOCK+'T12:00:00'),'bright',{analyzeEntry,EMOTIONS_28,SAD_EMOS,CESD_KEYWORDS,labelKey,anonKey,entryKey,dayStamp,fmtDate,hashSeed,mulberry32});
   if(generated.code!=='DEMO01'||!generated.students.some(s=>s.loginId==='d07'))throw Error('Review scenario mismatch');
   put(schPubKey('DEMO01'),{schoolName:generated.schoolName});put(stuKey('DEMO01'),generated.students);
   for(const s of generated.students){
    const diary={_migrated:true};for(const e of generated.entries[s.id]||[])diary[entryKey(e.ts)]={ts:e.ts,date:e.date,text:e.text,analysis:e.analysis};
    put(d2Key(s.id),diary);put(isleKey(s.id),generated.isle[s.id]);
    if(s.loginId===forms.student.loginId)put(scredKey('DEMO01',s.loginId,await pwHash('s','DEMO01',s.loginId,pw)),true);
   }
   const h=await pwHash('t','',forms.teacher.loginId,pw);
   put(tcredKey(forms.teacher.loginId,h),{schoolCode:'DEMO01',schoolName:generated.schoolName,teacherName:'심사용 선생님'});
   put('tpriv/'+forms.teacher.loginId+'/'+h+'/talk',generated.talk);
   put('day/DEMO01/'+generated.day.date,generated.day.node);
   for(const[id,v]of Object.entries(generated.emp))put('emp/'+id,v);
   put('plaza/DEMO01',generated.plaza);
  })().catch(e=>{prepared=null;root={};throw e;});
  await prepared;enabled=true;
 }
 return{active:()=>enabled,start,leave:()=>{enabled=false;},ref,form:role=>({...forms[role==='teacher'?'teacher':'student']})};
})();
