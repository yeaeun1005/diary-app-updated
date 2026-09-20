// Offline release checks. Never loads a Firebase SDK or reads real accounts.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const out='renders/releases/'+(process.argv[2]||'daily-exploration-20260920')+'/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),source=fs.readFileSync(out+'before-work/index.html','utf8'),candidate=fs.readFileSync(out+'candidate/index.html','utf8'),preview=fs.readFileSync(out+'memory-preview/index.html','utf8'),assets=out+'candidate/'+m.assetPath+'/',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const cut=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);};
const db=new Map(),locks=new Map(),reads=[],writes=[];let failRead=false,failWrite=false,retries=0;
const clone=v=>v==null?null:JSON.parse(JSON.stringify(v));
function context(temporary=false){
 const ctx=vm.createContext({Date,Map,Promise,console,MEM_ONLY:temporary,React:{createElement(){}},d2Key:id=>'d2/'+id,sGetStrict:async p=>{assert(!temporary,'Trial read');reads.push(p);if(failRead)throw Error('read-failed');return clone(db.get(p));},dbRef:p=>{assert(!temporary,'Trial DB reference');return{transaction:fn=>{const prev=locks.get(p)||Promise.resolve(),next=prev.catch(()=>{}).then(()=>{if(failWrite)throw Error('write-failed');fn(null);retries++;const nextValue=fn(clone(db.get(p)));if(nextValue===undefined)return{committed:false,snapshot:{val:()=>clone(db.get(p))}};db.set(p,clone(nextValue));writes.push(p);return{committed:true,snapshot:{val:()=>clone(nextValue)}};});locks.set(p,next);return next;}};}});
 if(fs.existsSync(assets+'decor-model.js'))vm.runInContext(fs.readFileSync(assets+'decor-model.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(assets+'daily-model.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(assets+'state.js','utf8'),ctx);vm.runInContext(fs.readFileSync(assets+'persistence.js','utf8'),ctx);
 return{run:s=>vm.runInContext(s,ctx),ctx};
}
(async()=>{
 const a=context(),b=context(),me="{id:'a',schoolCode:'CLASS'}";
 db.set('d2/a/e-original',{text:'kept',ts:123});db.set('d2/b/e-original',{text:'other-kept',ts:456});
 await a.run('V4Persistence.open('+me+')');await a.run("V4State.dispatch("+me+",{type:'source',source:{kind:'personal',entryTs:123.5}})");
 await a.run("V4State.dispatch("+me+",{type:'choices',ts:123.5,labels:['슬픔']})");
 await a.run("V4State.dispatch("+me+",{type:'response',choices:['짜증'],thought:'saved reflection'})");
 await b.run('V4Persistence.open('+me+')');
 await Promise.all([a.run('V4State.dispatch('+me+",{type:'feedback'})"),b.run('V4State.dispatch('+me+",{type:'feedback'})")]);
 await Promise.all([a.run('V4State.dispatch('+me+",{type:'choose',item:'flower'})"),b.run('V4State.dispatch('+me+",{type:'choose',item:'lantern'})")]);
 await b.run('V4State.dispatch('+me+",{type:'place',spot:'desk-garden'})");
 const fresh=context();await fresh.run('V4Persistence.open('+me+')');
 const restored=JSON.parse(fresh.run('JSON.stringify(V4State.load('+me+'))'));
 assert.equal(restored.reward.item,'flower');assert.equal(restored.reward.spot,'desk-garden');assert.equal(restored.q.stage,'complete');assert.equal(restored.choices['123.5'][0],'슬픔');assert.equal(restored.q.response.thought,'saved reflection');
 if(fs.existsSync(assets+'decor-model.js')){
  await fresh.run('V4State.dispatch('+me+",{type:'decorate',id:'bench',placement:V4Decor.suggest(V4State.load("+me+"),'bench','shade')})");
  const reload=context();await reload.run('V4Persistence.open('+me+')');assert.equal(reload.run('V4State.load('+me+').decor.bench.zone'),'shade');
  await Promise.all([fresh.run('V4State.dispatch('+me+",{type:'decorate',id:'bench',placement:null})"),reload.run('V4State.dispatch('+me+",{type:'draft',text:'separate draft retained'})")]);
  const again=context();await again.run('V4Persistence.open('+me+')');assert.equal(again.run('V4State.load('+me+').decor.bench'),null);assert.equal(again.run('V4State.load('+me+').draft'),'separate draft retained');
  const overlap=await Promise.allSettled([fresh.run('V4State.dispatch('+me+",{type:'decorate',id:'sunflower',placement:{zone:'breeze',x:6,z:2.35,rotation:45}})"),reload.run('V4State.dispatch('+me+",{type:'decorate',id:'whiteflower',placement:{zone:'breeze',x:6,z:2.35,rotation:90}})")]);assert.equal(overlap.filter(x=>x.status==='fulfilled').length,1,'Concurrent overlap must reject one write');
  const latest=context();await latest.run('V4Persistence.open('+me+')');assert.equal(latest.run('Object.keys(V4Decor.placements(V4State.load('+me+'))).length'),2);assert.equal(latest.run('V4State.load('+me+').reward.item'),'flower');
  const prior=JSON.stringify(db.get('d2/a/_mindIslandV4'));failWrite=true;await assert.rejects(latest.run('V4State.dispatch('+me+",{type:'decorate',id:'sunflower',placement:null})"));failWrite=false;assert.equal(JSON.stringify(db.get('d2/a/_mindIslandV4')),prior);
 }
 await fresh.run("V4Persistence.open({id:'b',schoolCode:'CLASS'})");assert.equal(fresh.run("V4State.load({id:'b',schoolCode:'CLASS'}).reward.available"),false);
 const savedBefore=JSON.stringify(db.get('d2/a/_mindIslandV4'));failWrite=true;await assert.rejects(fresh.run('V4State.dispatch('+me+",{type:'place',spot:'water-garden'})"));assert.equal(JSON.stringify(db.get('d2/a/_mindIslandV4')),savedBefore);assert.equal(fresh.run('V4State.load('+me+').reward.spot'),'desk-garden');failWrite=false;
 failRead=true;await assert.rejects(context().run('V4Persistence.open('+me+')'));failRead=false;
 await assert.rejects(context().run("V4Persistence.open({id:'a',schoolCode:'OTHER'})"));
 db.set('d2/b/_mindIslandV4',{schema:99});await assert.rejects(context().run("V4Persistence.open({id:'b',schoolCode:'CLASS'})"));assert.equal(db.get('d2/b/_mindIslandV4').schema,99);
 const n=reads.length,w=writes.length,trial=context(true);
 await trial.run('V4Persistence.open('+me+')');await trial.run('V4State.dispatch('+me+",{type:'draft',text:'temporary'})");await trial.run('V4Persistence.open('+me+')');assert.equal(trial.run('V4State.load('+me+').draft'),'temporary');assert.equal(reads.length,n);assert.equal(writes.length,w);
 assert.deepEqual(db.get('d2/a/e-original'),{text:'kept',ts:123});assert.deepEqual(db.get('d2/b/e-original'),{text:'other-kept',ts:456});
 assert(writes.every(p=>p==='d2/a/_mindIslandV4'));assert(reads.every(p=>/^d2\/[ab]\/_mindIslandV4$/.test(p)));
 const diary=vm.createContext({sGet:async p=>p==='d2/a'?{_migrated:true,e123:{text:'original',ts:123},_mindIslandV4:db.get('d2/a/_mindIslandV4')}:null,d2Key:id=>'d2/'+id,dKey:id=>'diary_'+id,safeEntries:x=>x});vm.runInContext(cut(candidate,'async function dLoad(id)','const FONT ='),diary);assert.equal((await vm.runInContext("dLoad('a')",diary)).length,1);
 // Reopen the actual new daily state, and retry a failed analysis acknowledgement.
 const dailyMe="{id:'a',schoolCode:'CLASS'}";
 await fresh.run("V4State.dispatch("+dailyMe+",{type:'dailyWrite',ts:789,date:V4Daily.date(Date.now()),mode:'full'})");
 failWrite=true;await assert.rejects(fresh.run("V4State.dispatch("+dailyMe+",{type:'dailyAnalysis',ts:789})"));failWrite=false;
 await fresh.run("V4State.dispatch("+dailyMe+",{type:'dailyAnalysis',ts:789})");
 await fresh.run("V4State.dispatch("+dailyMe+",{type:'dailyInsight',ts:789,text:'saved privately'})");
 const reopened=context();await reopened.run('V4Persistence.open('+dailyMe+')');
 assert.equal(reopened.run("V4State.load("+dailyMe+").daily[V4Daily.date(Date.now())].insight"),'saved privately');
 console.log(JSON.stringify({pass:true,checks:['actual candidate transactions/retries','gift and decor preservation','daily progress and private insight restored','failed acknowledgement retry','account/class boundaries','no diary/public rewrites'],transactionRetries:retries}));

})().catch(e=>{console.error(e);process.exitCode=1;});
