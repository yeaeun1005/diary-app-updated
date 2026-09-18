// Offline release checks. Never loads a Firebase SDK or reads real accounts.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const out='renders/releases/mind-island-v4-20260919/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),source=fs.readFileSync(out+'before-work/index.html','utf8'),candidate=fs.readFileSync(out+'candidate/index.html','utf8'),preview=fs.readFileSync(out+'memory-preview/index.html','utf8'),assets=out+'candidate/'+m.assetPath+'/',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const cut=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);};
for(const[a,b]of[['  const teacherLogin = async () => {','  // 학생 로그인 본체.'],['  const studentLoginWith = async','  const studentLogin = () =>'],['  const syncIsland = useCallback','  const logout ='],['function dbRef(k)','// ── 일기 저장 구조'],['function d2Key(','// ── ⑥ 바다'],['async function dLoad(id)','const FONT =']])assert.equal(cut(candidate,a,b),cut(source,a,b),'Protected handler '+a);
for(const html of [candidate,preview])for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);
for(const[f,sha]of Object.entries(m.files)){assert.equal(hash(fs.readFileSync(out+'candidate/'+f)),sha);if(f.endsWith('.js'))new vm.Script(fs.readFileSync(out+'candidate/'+f,'utf8'));}
assert(candidate.includes('firebase.initializeApp(firebaseConfig);'));assert(!/V2_TEST_AUTH|__local-fixtures|127\.0\.0\.1|var __DB = \{\}/.test(candidate));
assert(preview.includes("connect-src 'none'")&&preview.includes('var __DB = {}'));assert(!/firebase\.initializeApp|firebase-database-compat\.js|<script[^>]+src=["']https?:/.test(preview));
for(const match of candidate.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)){const f=match[1];if(!/^(https?:|data:|#)/.test(f))assert(fs.existsSync(out+'candidate/'+f)||fs.existsSync(f),'Missing '+f);}
for(const f of ['scene.js','assets.js'])assert(fs.readFileSync(assets+f,'utf8').includes('new URLSearchParams()'));
assert(!fs.readFileSync(assets+'app.js','utf8').includes('window.__V4'));
assert(!Object.keys(m.files).some(f=>/inspect|review|fixture|local-transaction|\.glb$/.test(f)));
const before=JSON.parse(fs.readFileSync(out+'protected-before.json'));for(const[p,h]of Object.entries(before))assert.equal(hash(fs.readFileSync(p)),h,'Preserved source '+p);

const db=new Map(),locks=new Map(),reads=[],writes=[];let failRead=false,failWrite=false,retries=0;
const clone=v=>v==null?null:JSON.parse(JSON.stringify(v));
function context(temporary=false){
 const ctx=vm.createContext({Date,Map,Promise,console,MEM_ONLY:temporary,React:{createElement(){}},d2Key:id=>'d2/'+id,sGetStrict:async p=>{assert(!temporary,'Trial read');reads.push(p);if(failRead)throw Error('read-failed');return clone(db.get(p));},dbRef:p=>{assert(!temporary,'Trial DB reference');return{transaction:fn=>{const prev=locks.get(p)||Promise.resolve(),next=prev.catch(()=>{}).then(()=>{if(failWrite)throw Error('write-failed');fn(null);retries++;const nextValue=fn(clone(db.get(p)));if(nextValue===undefined)return{committed:false,snapshot:{val:()=>clone(db.get(p))}};db.set(p,clone(nextValue));writes.push(p);return{committed:true,snapshot:{val:()=>clone(nextValue)}};});locks.set(p,next);return next;}};}});
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
 console.log(JSON.stringify({pass:true,version:m.version,files:Object.keys(m.files).length,checks:['unchanged auth/DB gateway/diary handlers','no fixture or debug query in production','Firebase stripped isolated preview','all assets/syntax/hashes','prior V4 source/assets preserved','two independent clients and transaction retry','one stable reward choice','new context state restoration including fractional diary timestamps','account/class separation','read/write failure leaves state unchanged','invalid schema preserved','trial state makes zero DB calls','diary listing excludes V4 metadata'],transactionRetries:retries},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
