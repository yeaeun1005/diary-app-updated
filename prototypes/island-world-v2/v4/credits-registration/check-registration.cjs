// Execute the actual registration/login handlers and care model against local memory.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const out='renders/releases/credits-registration-20260923/';
const manifest=JSON.parse(fs.readFileSync(out+'manifest.json'));
const page=fs.readFileSync(out+'candidate/index.html','utf8');
const before=fs.readFileSync(out+'before-work/index.html','utf8');
const care=fs.readFileSync(out+'candidate/'+manifest.assetPath+'/care-model.js','utf8');
function cut(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>a,start);return text.slice(a,b);}
function setup(html){
  const db={},writes=[],observed={};let failWrite=false,failRead=false;
  const clone=v=>v==null?null:structuredClone(v);
  function read(path){let value=db;for(const key of path.split('/'))value=value?.[key];return clone(value);}
  function write(path,value){const keys=path.split('/');let parent=db;for(const key of keys.slice(0,-1))parent=parent[key]||(parent[key]={});parent[keys.at(-1)]=clone(value);writes.push(path);}
  const ctx=vm.createContext({crypto:crypto.webcrypto,window:{crypto:crypto.webcrypto},TextEncoder,Date,Set,console,
    DEMO_CODE:'DEMO01',SK:{schools:'legacy-schools'},genCode:()=> 'SCH_LOCAL_ONLY',nowTs:()=>Date.now(),
    schoolForm:{schoolName:'가상학교',teacherName:'가상교사',teacherId:'local-teacher',teacherPw:crypto.randomUUID()},
    sGet:async path=>read(path),sGetStrict:async path=>{if(failRead)throw Error('read-failed');return read(path);},
    sSet:async(path,value)=>write(path,value),dbRef:path=>({set:async value=>{if(failWrite)throw Error('write-failed');write(path,value);}}),
    setCU:value=>{observed.user=value;},setMsg:value=>{observed.message=value;},setPage:value=>{observed.page=value;},
    setMS:value=>{observed.students=value;},setSF(){},setLF(){},setAuthOpen(){}});
  const run=code=>vm.runInContext(code,ctx);
  run(cut(html,'function stuKey(code)','var TALK_RETURN_DAYS'));
  run(cut(html,'function setDemoClock(user)','function dayStamp'));
  run(cut(html,'  const createSchool = async () => {','  // 학생 로그인 본체.'));
  run(care);
  return{ctx,run,observed,db,writes,read,setFailWrite:v=>{failWrite=v;},setFailRead:v=>{failRead=v;}};
}
(async()=>{
  // First reproduce the reported bug with the previous implementation.
  const original=setup(before);await original.run('createSchool()');
  original.ctx.me=original.observed.user;
  await assert.rejects(original.run('V4Care.load(me)'),/teacher-required/);

  // A newly registered teacher can immediately read and save a private care record.
  const test=setup(page);await test.run('createSchool()');
  assert.equal(test.observed.page,'teacherDash');
  const me=test.observed.user;assert.equal(typeof me.th,'string');assert.equal(me.th.length,64);
  assert.equal(test.ctx.MEM_ONLY,false);
  test.ctx.me=me;test.ctx.students=[{id:'local-student',schoolCode:me.schoolCode}];
  assert.equal(JSON.stringify(await test.run('V4Care.load(me)')),'{}');
  await test.run("V4Care.save(me,students,'local-student','acted',['학생과 개별 대화'])");
  let record=await test.run('V4Care.load(me)');assert.equal(record['local-student'].status,'acted');

  // Session metadata must not be copied into school or credential payloads.
  const saved=JSON.stringify(test.db);assert(!saved.includes(test.ctx.schoolForm.teacherPw));
  assert(!saved.includes('"th":'));assert(!saved.includes('"teacherPw":'));
  assert.deepEqual(Object.keys(test.read('sch/'+me.schoolCode+'/pub')),['schoolName']);
  const careWrites=test.writes.filter(path=>path.startsWith('tpriv/'));
  assert(careWrites.length===1&&careWrites[0]===test.run("V4Care.key(me)+'/local-student'"));

  // Normal login opens the same private record, without changed credentials.
  test.ctx.loginForm={loginId:test.ctx.schoolForm.teacherId,password:test.ctx.schoolForm.teacherPw};
  await test.run('teacherLogin()');assert.equal(test.observed.user.th,me.th);
  test.ctx.me=test.observed.user;
  assert.equal((await test.run('V4Care.load(me)'))['local-student'].status,'acted');
  await assert.rejects(test.run("V4Care.save(me,students,'another-student','observe',[])"),/student-boundary/);
  assert.equal(JSON.stringify(await test.run("V4Care.load({...me,teacherId:'another-teacher'})")),'{}');
  test.setFailWrite(true);await assert.rejects(test.run("V4Care.save(me,students,'local-student','observe',[])"));
  test.setFailWrite(false);assert.equal((await test.run('V4Care.load(me)'))['local-student'].status,'acted');
  test.setFailRead(true);await assert.rejects(test.run('V4Care.load(me)'));test.setFailRead(false);
  const failed=setup(page);failed.setFailWrite(true);await failed.run('createSchool()');
  assert.equal(failed.observed.user,undefined);assert.equal(failed.observed.page,undefined);
  console.log(JSON.stringify({pass:true,checks:['previous bug reproduced','new teacher immediate care read/write','same private record after login','no password/session metadata in stored payloads','teacher and student boundaries','read/write failures remain errors','failed registration does not sign in']}));
})().catch(error=>{console.error(error);process.exitCode=1;});
