// Run the shipped account/storage handlers only against an isolated in-process DB.
// No Firebase SDK, network, browser, real user records, or credentials are loaded.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
process.env.TZ='Asia/Seoul';
const root=path.resolve(__dirname,'../../../..'),out=path.join(root,'renders/releases/production-transition-20261112');
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
const page=fs.readFileSync(path.join(out,'candidate/index.html'),'utf8');
const assets=path.join(out,'candidate',manifest.assetPath);
const plain=x=>JSON.parse(JSON.stringify(x));
function cut(start,end){const a=page.indexOf(start),b=page.indexOf(end,a);assert(a>=0&&b>a,'Missing source boundary: '+start);return page.slice(a,b);}

function setup(instant='2026-11-12T12:00:00+09:00',initial={}){
 const db=plain(initial),reads=[],writes=[],refs=[],observed={authOpen:true,authView:'register'};let rejectRead=()=>false,rejectWrite=()=>false,tick=0;
 const epoch=new Date(instant).getTime();
 class Clock extends Date{constructor(...args){super(...(args.length?args:[epoch+tick]));}static now(){return epoch+tick++;}}
 const copy=v=>v==null?null:plain(v);
 const parts=p=>String(p).split('/').filter(Boolean);
 function read(p){let value=db;for(const k of parts(p))value=value?.[k];return copy(value);}
 function write(p,value){const ks=parts(p);assert(ks.length,'Root replacement is not expected');let parent=db;for(const k of ks.slice(0,-1))parent=parent[k]||(parent[k]={});if(value==null)delete parent[ks.at(-1)];else parent[ks.at(-1)]=copy(value);}
 function ref(full){
  assert(full==='app/'||full.startsWith('app/'),'Only the local app namespace is permitted');refs.push(full);const p=full.slice(4);
  const snapshot=()=>({val:()=>read(p),exists:()=>read(p)!==null});
  return{
   once:async()=>{reads.push(p);if(rejectRead(p))throw Error('local-read-failure');return snapshot();},
   set:async value=>{if(rejectWrite(p))throw Error('local-write-failure');writes.push(p);write(p,value);},
   remove:async()=>{if(rejectWrite(p))throw Error('local-write-failure');writes.push(p);write(p,null);},
   update:async values=>{const changes=Object.entries(values).map(([k,v])=>[(p?p+'/':'')+k,v]);if(changes.some(([k])=>rejectWrite(k)))throw Error('local-write-failure');for(const[k,v]of changes){writes.push(k);write(k,v);}},
   transaction:async fn=>{if(rejectRead(p))throw Error('local-read-failure');if(rejectWrite(p))throw Error('local-write-failure');const next=fn(read(p));if(next===undefined)return{committed:false,snapshot:snapshot()};writes.push(p);write(p,next);return{committed:true,snapshot:snapshot()};}
  };
 }
 const credentials={teacherId:'local-teacher',teacherPw:crypto.randomUUID(),studentId:'local-student',studentPw:crypto.randomUUID()};
 const ctx=vm.createContext({Date:Clock,crypto:crypto.webcrypto,window:{crypto:crypto.webcrypto},TextEncoder,Set,Map,Promise,
  console:{log(){},warn(){},error(){}},setTimeout:(fn,ms)=>{const t=setTimeout(fn,ms);t.unref();return t;},clearTimeout,
  firebase:{database:()=>({ref})},MEM_ONLY:false,SK:{schools:'t-schools-v3'},genCode:()=> 'SCH_LOCAL_ONLY',
  schoolForm:{schoolName:'검증용 가상학교',teacherName:'검증용 가상교사',teacherId:credentials.teacherId,teacherPw:credentials.teacherPw},
  loginForm:{schoolCode:'',loginId:'',password:'',role:'student'},studentForm:{studentName:'검증학생',loginId:credentials.studentId,password:credentials.studentPw,grade:'3',classNumber:'1'},
  setCU:v=>{observed.user=copy(v);ctx.currentUser=copy(v);},setPage:v=>{observed.page=v;},setMsg:v=>{observed.message=v;},setMS:v=>{observed.students=copy(v);},setME:v=>{observed.entries=copy(v);},
  setSF(){},setLF(){},setStF(){},setAuthOpen:v=>{observed.authOpen=v;},setAuthView:v=>{observed.authView=v;},setTrialUser:()=>{throw Error('Removed trial setter was called');},
  hubStart:()=> 'island',safeEntries:v=>Array.isArray(v)?copy(v):[],
  // Independent landscape rendering is covered by the existing integration suite.
  islandState:()=>[],isleSync:async()=>{},dayMark:async()=>{}});
 const run=code=>vm.runInContext(code,ctx);
 run(cut('function stuKey(code)','var TALK_RETURN_DAYS'));
 run(cut('async function credSetStudent(code, lid, h)','function chatKey(id)'));
 run(cut('function dbRef(k)','// ── 일기 저장 구조 v2'));
 run(cut('function d2Key(id)','// ── ⑥ 바다·친구 섬 저장 계층'));
 run(cut('function isleKey(id)','// Firebase 키 금지문자'));
 run('function dKey(id){return "diary_"+id;}');
 run(cut('function setAccountStorage(user)','async function isleSync(stu, state)'));
 run(cut('async function dLoad(id)','const FONT ='));
 for(const name of ['sharing.js','reward-settings.js','care-model.js','activity-model.js'])run(fs.readFileSync(path.join(assets,name),'utf8'));
 run(cut('  const createSchool = async () => {','  const teacherLogin = async () => {'));
 run(cut('  const teacherLogin = async () => {','  // 학생 로그인 본체.'));
 run(cut('  const studentLoginWith = async','  const studentLogin ='));
 run(cut('  const addStudent = async () => {','  const [bulkCount'));
 return{ctx,run,db,reads,writes,refs,observed,credentials,read,write,
  failReads:fn=>{rejectRead=fn;},failWrites:fn=>{rejectWrite=fn;},
  clearSession(){delete observed.user;delete observed.page;delete observed.entries;ctx.currentUser=null;}};
}

(async()=>{
 const t=setup();await t.run('createSchool()');
 assert.equal(t.observed.page,'teacherDash');assert.equal(t.ctx.MEM_ONLY,false);
 assert.equal(t.observed.authOpen,false,'Successful registration closes the authentication dialog');
 assert.equal(t.observed.authView,'login','Successful registration resets the next authentication view to login');
 const teacher=plain(t.observed.user),code=teacher.schoolCode;assert.equal(code,'SCH_LOCAL_ONLY');assert.equal(teacher.th.length,64);
 assert.equal(t.read('sch/'+code+'/pub').schoolName,'검증용 가상학교');assert.deepEqual(t.read('stu_'+code),[]);
 await t.run('addStudent()');const student=plain(t.observed.students[0]);assert(student.id);assert.equal(student.loginId,t.credentials.studentId);
 assert.equal(t.read('d2/'+student.id)._migrated,true);assert.equal(student.rewardMode,'full');
 // Newly registered teachers immediately use the same private care path as later logins.
 t.ctx.teacher=teacher;t.ctx.students=[student];t.ctx.sid=student.id;
 await t.run("V4Care.save(teacher,students,sid,'acted',['학생과 개별 대화'])");
 assert.equal((await t.run('V4Care.load(teacher)'))[student.id].status,'acted');
 const stored=JSON.stringify(t.db);assert(!stored.includes(t.credentials.teacherPw),'Teacher password is not persisted');assert(!stored.includes(t.credentials.studentPw),'Student password is not persisted');assert(!stored.includes('"th":'),'Session metadata is not persisted');
 // Student auth executes the ordinary path with a real account-owned diary write/reload.
 t.clearSession();t.ctx.code=code;t.ctx.lid=t.credentials.studentId;t.ctx.pw=t.credentials.studentPw;
 assert.equal(await t.run('studentLoginWith(code,lid,pw)'),true);assert.equal(t.observed.page,'island');assert.equal(t.observed.user.id,student.id);assert.equal(t.ctx.MEM_ONLY,false);
 assert.deepEqual(t.observed.entries,[]);assert.equal(t.run('dayStamp()'),'2026-11-12');
 t.ctx.entry={ts:t.run('nowTs()'),date:'2026-11-12',text:'실제 학생 자료가 아닌 저장 검증 기록',analysis:{hits:[],entryDate:'2026-11-12'}};
 await t.run('d2Put(sid,entry)');
 const saved=await t.run('dLoad(sid)');assert.equal(saved.length,1);assert.equal(saved[0].text,t.ctx.entry.text);
 assert.equal(Object.keys(t.read('isle/'+student.id)?.shared||{}).length,0,'A private write does not publish the diary');
 const fresh=setup('2026-11-13T12:00:00+09:00',t.db);fresh.ctx.code=code;fresh.ctx.lid=t.credentials.studentId;fresh.ctx.pw=t.credentials.studentPw;
 assert.equal(await fresh.run('studentLoginWith(code,lid,pw)'),true);assert.equal(fresh.observed.entries.length,1);assert.equal(fresh.observed.entries[0].text,t.ctx.entry.text);
 assert.equal(fresh.run('dayStamp()'),'2026-11-13');assert.equal(fresh.run('dayStamp(0)'),new Date(0).getFullYear()+'-01-01');
 fresh.clearSession();fresh.ctx.loginForm={loginId:t.credentials.teacherId,password:t.credentials.teacherPw,role:'teacher'};await fresh.run('teacherLogin()');
 assert(fresh.observed.user.th===teacher.th,'The same teacher private credential is restored');fresh.ctx.teacher=fresh.observed.user;assert.equal((await fresh.run('V4Care.load(teacher)'))[student.id].status,'acted');
 // Wrong credentials must not create an authenticated session or write migrations.
 const bad=setup('2026-11-12T12:00:00+09:00',t.db);bad.ctx.code=code;bad.ctx.lid=t.credentials.studentId;bad.ctx.pw=crypto.randomUUID();
 assert.equal(await bad.run('studentLoginWith(code,lid,pw)'),false);assert.equal(bad.observed.user,undefined);assert.equal(bad.writes.length,0);
 bad.ctx.loginForm={loginId:t.credentials.teacherId,password:crypto.randomUUID(),role:'teacher'};await bad.run('teacherLogin()');assert.equal(bad.observed.user,undefined);assert.equal(bad.writes.length,0);
 // A typed retired school code is rejected BEFORE any credential/data lookup.
 const retiredStudent=setup();assert.equal(await retiredStudent.run("studentLoginWith('DEMO01','unused','unused')"),false);
 assert.equal(retiredStudent.refs.length,0);assert.equal(retiredStudent.observed.user,undefined);assert(retiredStudent.observed.message.includes('종료'));
 // Valid-looking old teacher credentials must never open or mutate the retired school.
 const retiredTeacher=setup();retiredTeacher.ctx.loginForm={loginId:'retired-teacher',password:crypto.randomUUID(),role:'teacher'};
 const retiredHash=await retiredTeacher.run("pwHash('t','',loginForm.loginId,loginForm.password)");
 retiredTeacher.write('tcred/retired-teacher/'+retiredHash,{schoolCode:'DEMO01',schoolName:'예전 가상 학급'});
 await retiredTeacher.run('teacherLogin()');assert.equal(retiredTeacher.observed.user,undefined);assert.equal(retiredTeacher.writes.length,0);assert(!retiredTeacher.reads.includes('stu_DEMO01'));
 // The old plain-text migration fallback is blocked before it writes credentials.
 const retiredLegacy=setup();retiredLegacy.ctx.loginForm={loginId:'retired-legacy',password:crypto.randomUUID(),role:'teacher'};
 retiredLegacy.write('t-schools-v3',[{schoolCode:'DEMO01',schoolName:'예전 가상 학급',teacherId:'retired-legacy',teacherPw:retiredLegacy.ctx.loginForm.password}]);
 await retiredLegacy.run('teacherLogin()');assert.equal(retiredLegacy.observed.user,undefined);assert.equal(retiredLegacy.writes.length,0);assert(!retiredLegacy.reads.includes('stu_DEMO01'));
 // Every registration write boundary must fail without producing an authenticated UI.
 for(const failedPath of ['tcred/local-teacher','sch/SCH_LOCAL_ONLY/pub','stu_SCH_LOCAL_ONLY']){
  const failed=setup();failed.failWrites(p=>p===failedPath);await failed.run('createSchool()');
  assert.equal(failed.observed.user,undefined,'No session after failed registration write');assert.equal(failed.observed.page,undefined,'No success screen after failed registration write');assert(failed.observed.message);
  assert.equal(failed.observed.authOpen,true,'Failed registration keeps the form visible');
  if(failedPath.startsWith('tcred/'))continue;
  // Successful credentials from a partial create remain usable; login repairs missing
  // public school metadata but never replaces an already-created student roster.
  failed.failWrites(()=>false);
  const emptyRecovery=setup('2026-11-12T12:00:00+09:00',failed.db);
  emptyRecovery.ctx.loginForm={loginId:failed.credentials.teacherId,password:failed.credentials.teacherPw,role:'teacher'};
  await emptyRecovery.run('teacherLogin()');assert.equal(emptyRecovery.observed.page,'teacherDash');assert.deepEqual(emptyRecovery.observed.students,[]);
  assert.equal(emptyRecovery.read('sch/SCH_LOCAL_ONLY/pub').schoolName,'검증용 가상학교');
  assert(!emptyRecovery.writes.includes('stu_SCH_LOCAL_ONLY'),'An absent roster is displayed empty without a destructive reset');
  const retained=[{id:7,loginId:'retained-student',name:'기존 검증학생'}];failed.write('stu_SCH_LOCAL_ONLY',retained);
  failed.ctx.loginForm={loginId:failed.credentials.teacherId,password:failed.credentials.teacherPw,role:'teacher'};
  const writeCount=failed.writes.length;await failed.run('teacherLogin()');
  assert.equal(failed.observed.page,'teacherDash');assert(failed.observed.user);
  assert.equal(failed.read('sch/SCH_LOCAL_ONLY/pub').schoolName,'검증용 가상학교');
  assert.deepEqual(failed.read('stu_SCH_LOCAL_ONLY'),retained);assert.deepEqual(failed.observed.students,retained);
  assert(!failed.writes.slice(writeCount).includes('stu_SCH_LOCAL_ONLY'),'Recovery does not reset an existing roster');
 }
 const failedRecovery=setup('2026-11-12T12:00:00+09:00',t.db);
 failedRecovery.ctx.loginForm={loginId:t.credentials.teacherId,password:t.credentials.teacherPw,role:'teacher'};
 failedRecovery.failReads(p=>p==='stu_'+code);await assert.rejects(failedRecovery.run('teacherLogin()'),/local-read-failure/);assert.equal(failedRecovery.observed.user,undefined);
 const failedRead=setup();failedRead.failReads(()=>true);failedRead.ctx.loginForm={loginId:'unavailable',password:crypto.randomUUID(),role:'teacher'};await failedRead.run('teacherLogin()');assert.equal(failedRead.observed.user,undefined);assert.equal(failedRead.writes.length,0);
 const prior=JSON.stringify(t.read('d2/'+student.id));t.failWrites(p=>p.startsWith('d2/'));await assert.rejects(t.run('d2Put(sid,{...entry,text:"failed replacement"})'),/local-write-failure/);assert.equal(JSON.stringify(t.read('d2/'+student.id)),prior);
 t.failWrites(()=>false);t.failReads(p=>p.startsWith('tpriv/'));await assert.rejects(t.run('V4Care.load(teacher)'),/local-read-failure/);
 const report={pass:true,candidate:manifest.version,productionDatabaseAccessed:false,checks:[
  'new teacher registration and student creation use ordinary storage',
  'successful registration closes the dialog and resets the next view to login',
  'teacher care writes work immediately and after fresh login',
  'student diary save and fresh-session reload preserve private records',
  'current date changes with the clock; old records retain their dates',
  'passwords/session metadata are not copied into stored payloads',
  'incorrect credentials do not create sessions or write migrations',
  'retired student school rejected before any DB reference',
  'retired modern/legacy teachers rejected before writes or roster reads',
  'all registration partial failures refuse authenticated success',
  'partial registration recovers on login without resetting the existing roster',
  'failed teacher roster lookup cannot create a partially-loaded session',
  'failed writes preserve diaries and private read failures remain errors']};
 console.log(JSON.stringify(report));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
