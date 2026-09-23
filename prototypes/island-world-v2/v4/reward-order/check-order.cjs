const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const out='renders/releases/reward-order-20260923/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),page=fs.readFileSync(out+'candidate/index.html','utf8');
const cut=(s,a,b)=>{const x=s.indexOf(a),y=s.indexOf(b,x);assert(x>=0&&y>x,a);return s.slice(x,y);};

(async()=>{
for(const instant of ['2026-09-23T09:08:00+09:00','2027-01-01T00:00:00+09:00','2026-09-23T20:00:00+09:00']){
 const epoch=new Date(instant).getTime();class Clock extends Date{constructor(...args){super(...(args.length?args:[epoch]));}static now(){return epoch;}}
 let realCalls=0;

const ctx=vm.createContext({console,Date:Clock,crypto:crypto.webcrypto,TextEncoder,setTimeout,clearTimeout,DEMO_CODE:'DEMO01',window:{},firebase:{database:()=>({ref:()=>{realCalls++;return{realSentinel:true};}})}});
vm.runInContext('window=this;',ctx);
for(const[a,b]of [['function normalizeKorean(','const FONT ='],['const SITUATION_MAP =','var NEED_OPTIONS ='],['var SAD_EMOS =','var CREATURES ='],['var CAUSAL_ENDINGS =','var ISLE = {'],['function islandState(entries)','// 영역별 식생 규칙.']])vm.runInContext(cut(page,a,b),ctx);
for(const f of ['review-data.js','review-generator.js','review-class.js','sharing.js'])vm.runInContext(fs.readFileSync(out+'candidate/'+m.assetPath+'/'+f,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);

 run(fs.readFileSync(out+'candidate/'+m.assetPath+'/activity-model.js','utf8'));
 await run('V4ReviewClass.start()');assert.equal(realCalls,0);
 const students=await run('V4ReviewClass.ref(stuKey("DEMO01")).once().then(s=>s.val())');
 for(const student of students){ctx.id=student.id;const diary=await run('V4ReviewClass.ref(d2Key(id)).once().then(s=>s.val())');
  const entries=Object.values(diary).filter(e=>e&&typeof e.text==='string');assert(entries.length>0);assert(entries.every(e=>e.ts<epoch));assert.equal(new Set(entries.map(e=>e.ts)).size,entries.length);
  for(const e of entries){ctx.e=e;assert.equal(run('V4ActivityModel.recordDate(e)'),e.analysis.entryDate);}
  if(student.loginId==='d07'){
   ctx.entries=[...entries,{ts:epoch,date:run('DEMO_CLOCK'),text:'first'},{ts:epoch+1,date:run('DEMO_CLOCK'),text:'second'}];
   const ordered=run("V4ActivityModel.inRange(entries,'all',DEMO_CLOCK)");assert.equal(ordered[0].text,'second');assert.equal(ordered[1].text,'first');
  }
 }
 assert.equal(realCalls,0);
}
console.log(JSON.stringify({pass:true,checks:['morning/midnight/year boundary/evening','all 25 students: unique examples before session time','represented dates preserved','same-day second new entry before first and examples','zero real DB references']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
