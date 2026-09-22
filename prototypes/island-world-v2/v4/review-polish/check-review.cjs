const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const out='renders/releases/review-polish-20260922/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),page=fs.readFileSync(out+'candidate/index.html','utf8');
const cut=(s,a,b)=>{const x=s.indexOf(a),y=s.indexOf(b,x);assert(x>=0&&y>x,a);return s.slice(x,y);};
let realCalls=0;
const ctx=vm.createContext({console,crypto:crypto.webcrypto,TextEncoder,setTimeout,clearTimeout,DEMO_CODE:'DEMO01',window:{},firebase:{database:()=>({ref:()=>{realCalls++;return{realSentinel:true};}})}});
vm.runInContext('window=this;',ctx);
for(const[a,b]of [['function normalizeKorean(','const FONT ='],['const SITUATION_MAP =','var NEED_OPTIONS ='],['var SAD_EMOS =','var CREATURES ='],['var CAUSAL_ENDINGS =','var ISLE = {'],['function islandState(entries)','// 영역별 식생 규칙.']])vm.runInContext(cut(page,a,b),ctx);
for(const f of ['review-data.js','review-generator.js','review-class.js','sharing.js'])vm.runInContext(fs.readFileSync(out+'candidate/'+m.assetPath+'/'+f,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
run('var observed={};function setMsg(v){observed.message=v;}function setCU(v){observed.user=v;}function setMS(v){observed.students=v;}function setME(v){observed.entries=v;}function setPage(v){observed.page=v;}function setLF(){}function setAuthOpen(){}function setTrialUser(){}function hubStart(){return "island";}var DEMO_TRIAL={};var loginForm={};');
run(cut(page,'  const teacherLogin = async () => {','  // 학생 로그인 본체.')+cut(page,'  const studentLoginWith = async','  const studentLogin = () =>'));
(async()=>{
 await run('V4ReviewClass.start()');assert.equal(realCalls,0);
 await run('loginForm=V4ReviewClass.form("teacher");teacherLogin()');
 assert.equal(run('observed.user.schoolCode'),'DEMO01');assert.equal(run('observed.students.length'),25);assert.equal(run('observed.page'),'teacherDash');
 await run('V4ReviewClass.leave();V4ReviewClass.start()');
 await run('loginForm=V4ReviewClass.form("student");studentLoginWith(loginForm.schoolCode,loginForm.loginId,loginForm.password,true)');
 assert.equal(run('observed.user.loginId'),'d07');assert(run('observed.entries.length')>5);assert.equal(run('observed.page'),'island');
 await run('d2Put(observed.user.id,{ts:123456789,date:"2026-09-16",text:"review-shared-check",analysis:{hits:[]}})');
 await run('V4ReviewClass.leave();V4ReviewClass.start()');await run('loginForm=V4ReviewClass.form("teacher");teacherLogin()');
 assert(await run('dLoad(700000000007).then(es=>es.some(e=>e.text==="review-shared-check"))'));
 assert.equal(realCalls,0,'Review must make zero real DB references');
 assert.throws(()=>run('V4ReviewClass.ref("__proto__/bad")'));
 run('V4ReviewClass.leave();setDemoClock(null)');assert.equal(run('dbRef("real-class-sentinel").realSentinel'),true);assert.equal(realCalls,1,'Real login still delegates to original gateway');
 const students=run('observed.students');
 for(const student of students){ctx.who=student.id;const rows=await run('V4ReviewClass.start().then(()=>V4ReviewClass.ref(isleKey(who)).once("value")).then(s=>s.val().shared)');assert.equal(Object.keys(rows).length,6);for(const e of Object.values(rows)){assert.equal(e.public,true);assert.equal(e.schoolCode,'DEMO01');assert(e.text.length>5);}}
 assert.equal(realCalls,1,'New fictional examples must not touch Firebase');
 console.log(JSON.stringify({pass:true,students:students.length,publicExamples:students.length*6,checks:['shared student and teacher memory class','actual auth handlers','public examples for every fictional friend','normal gateway unchanged','zero production reads/writes']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
