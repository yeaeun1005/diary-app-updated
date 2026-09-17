// Existing data functions and the new view guard, without browser/network/real data.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('index.html','utf8'),page=fs.readFileSync('renders/harness/world-v2.html','utf8');
const cut=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const ctx=vm.createContext({console,Date,QC:{HA:1,LA:1,LV:1,HV:1}});
vm.runInContext(`var DB={},reads=[];function get(p){reads.push(p);return p.split('/').reduce((v,k)=>v&&v[k],DB)||null;}function set(p,v){var k=p.split('/'),o=DB;for(var i=0;i<k.length-1;i++)o=o[k[i]]||(o[k[i]]={});if(v==null)delete o[k.at(-1)];else o[k.at(-1)]=JSON.parse(JSON.stringify(v));}function dbRef(p){return {update:async o=>Object.keys(o).forEach(k=>set(p+'/'+k,o[k])),set:async v=>set(p,v)}};var sGet=async p=>get(p),sGetStrict=sGet;`,ctx);
vm.runInContext(cut(src,'function mulberry32(','// 클레이 디오라마.'),ctx);
vm.runInContext(cut(src,'function isleKey(','// 최근 days일 동안 받은'),ctx);
vm.runInContext(fs.readFileSync('prototypes/island-world-v2/social.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
(async()=>{
 run(`var me={id:'self',name:'나'},friend={id:'peer',name:'친구'};set('isle/self',{v:{[labelKey('만족')]:{l:'만족',q:'LA'}}});set('isle/peer',{v:{[labelKey('편안')]:{l:'편안',q:'LA'},[labelKey('차분')]:{l:'차분',q:'LA'},[labelKey('우울')]:{l:'우울',q:'LV',h:true},[labelKey('긴장')]:{l:'긴장',q:'HV'}}});`);
 assert.equal(await run(`isleLoad('peer').then(r=>v2PublicState(r.state).some(e=>e.label==='우울'))`),false);
 assert.equal(await run(`v2SendEmpathy(me,friend,'우울').then(r=>r.status)`),'private');
 assert.equal(await run(`v2SendEmpathy(me,friend,'긴장').then(r=>r.status)`),'unfamiliar');
 const concurrent=await run(`Promise.all([v2SendEmpathy(me,friend,'편안'),v2SendEmpathy(me,friend,'편안')]).then(r=>r.map(x=>x.status).sort().join(','))`);
 assert.equal(concurrent,'busy,sent-now');
 assert.equal(await run(`v2SendEmpathy(me,friend,'편안').then(r=>r.status)`),'sent');
 assert.equal(await run(`empLoad('peer').then(a=>a.length)`),1);
 assert.equal(await run(`v2SendEmpathy(me,friend,'차분').then(r=>r.status)`),'sent-now');
 assert.equal(await run(`empLoad('peer').then(a=>a.length)`),2);
 await run(`isleHide(me,'만족',true)`);
 assert.equal(await run(`isleLoad('self').then(r=>r.state.length)`),1,'Hidden growth remains on own island');
 assert.equal(await run(`isleLoad('self').then(r=>v2PublicState(r.state).length)`),0);
 // Simulate a word being hidden after the scene was created. Sending rechecks it.
 await run(`isleHide(friend,'편안',true)`);
 assert.equal(await run(`v2SendEmpathy(me,friend,'편안').then(r=>r.status)`),'private');
 assert.equal(run(`reads.some(p=>p.startsWith('d2/')||p.startsWith('d-'))`),false);
 for(const [a,b] of [['  const teacherLogin = async () => {','  // 학생 로그인 본체.'],['  const studentLoginWith = async','  const studentLogin = () =>']])assert.equal(cut(page,a,b),cut(src,a,b),'Authentication handler changed');
 assert(!page.includes('root.render(React.createElement(V2App))'));
 for(const f of ['world.js','social.js','landing.js'])new vm.Script(fs.readFileSync('prototypes/island-world-v2/'+f,'utf8'));
 console.log('PASS: hidden words excluded; same-quadrant empathy; duplicate/concurrent prevention; different word allowed; stale privacy recheck; own hidden growth retained; no diary read; student/teacher login handlers unchanged.');
})().catch(e=>{console.error(e);process.exit(1);});
