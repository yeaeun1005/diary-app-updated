// Release integration tests. No browser automation, network, Firebase SDK or real accounts.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),crypto=require('crypto');
const base='renders/releases/island-v2-20260917',src=fs.readFileSync(base+'/before-work/index.html','utf8'),candidate=fs.readFileSync(base+'/candidate/index.html','utf8'),preview=fs.readFileSync(base+'/memory-preview/index.html','utf8'),manifest=JSON.parse(fs.readFileSync(base+'/manifest.json'));
const liveHash=crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
assert([manifest.sourceSha256,manifest.candidateSha256].includes(liveHash),'Project index differs from both reviewed source and candidate');
const cut=(s,a,b)=>{assert(s.includes(a)&&s.includes(b));return s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));};
const assets=base+'/candidate/'+manifest.assetPath;
for(const [a,b] of [
 ['  const teacherLogin = async () => {','  // 학생 로그인 본체.'],
 ['  const studentLoginWith = async','  const studentLogin = () =>'],
 ['  const syncIsland = useCallback','  // 첫 화면 배경음'],
 ['function d2Key(','// 클레이 디오라마.'],
 ['  const judgeOn = function (role)','  const [authView,']
])assert.equal(cut(candidate,a,b),cut(src,a,b),'Changed protected logic: '+a);
const diaryOriginal=cut(src,'function DiaryView({','function AppMain(');
const diaryCandidate=cut(candidate,'function DiaryView({','function AppMain(');
const expectedDiary=diaryOriginal
 .replace('  const [showEmoFix, setShowEmoFix] = useState(false);','  const [showEmoFix, setShowEmoFix] = useState(false);\n  const [editNotice, setEditNotice] = useState("");\n  useEffect(function(){if(!editNotice)return;var timer=setTimeout(function(){setEditNotice("");},5000);return function(){clearTimeout(timer);};},[editNotice]);')
 .replace('  const renderInput = () => React.createElement("div", null,','  const renderInput = () => React.createElement("div", null, editNotice && React.createElement("p", {role:"status",className:"v2-edit-notice"}, editNotice),')
 .replace('      setMsg("✅ 감정이 수정되었습니다.");','      setEditNotice("✅ 감정이 수정되었습니다.");');
assert.equal(diaryCandidate,expectedDiary,'Only the missing emotion-correction notice may change in DiaryView');
assert.equal(crypto.createHash('sha256').update(src).digest('hex'),manifest.sourceSha256);
assert.equal(fs.readFileSync(base+'/previous/index.html','utf8'),src);
assert(candidate.includes('firebase.initializeApp(firebaseConfig);'));
assert(!candidate.includes('var __DB = {}')&&!candidate.includes('__local-fixtures.js')&&!candidate.includes('V2_TEST_AUTH'));
assert(preview.includes("connect-src 'none'")&&preview.includes('var __DB = {}'));
assert(!preview.includes('firebase.initializeApp(firebaseConfig);')&&!preview.includes('firebase-database-compat.js'));
assert(!/<script[^>]+src="(?:https?:|demo\/)/.test(preview));
assert(!candidate.includes('127.0.0.1'));
for(const file of fs.readdirSync(assets).filter(f=>f.endsWith('.js'))){const code=fs.readFileSync(path.join(assets,file),'utf8');new vm.Script(code);assert(!/V2_ME|V2_AUTH|V2_ENTRIES|v2Fixtures|__set\(/.test(code),'Fixture leaked into '+file);}
for(const html of [candidate,preview])for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
const adapter=fs.readFileSync(assets+'/integrated-app.js','utf8');assert(!/d2Put|d2Del|dayMark|isleSync|DiaryView/.test(adapter),'Adapter must use original learning page');
const ctx=vm.createContext({console:{...console,error:()=>{}},Date,QC:{HA:1,LA:1,LV:1,HV:1}});
const shapeCtx=vm.createContext({console,URLSearchParams,React:{createElement:()=>{}},location:{search:''}});
vm.runInContext(cut(src,'function mulberry32(','// 클레이 디오라마.'),shapeCtx);
vm.runInContext(fs.readFileSync(assets+'/world.js','utf8'),shapeCtx);
vm.runInContext(fs.readFileSync(assets+'/custom-growth.js','utf8'),shapeCtx);
assert(fs.readFileSync(assets+'/world.js','utf8').includes('islandId:profile.id'),'Own and friend views must use the same student seed');
const customResult=vm.runInContext(`(()=>{let slots=0;const words=[{label:'몽글몽글',q:'LA'},{label:'두근두근',q:'HA'},{label:'constructor',q:'LV'}];for(let n=0;n<64;n++){const reserved=Object.create(null);reserved.편안=[{x:18,z:-5}];const before=JSON.stringify(reserved),can=(x,z)=>v2BaseWalk(x,z)&&v2Radius(x,z)<.87;const a=v2ExtraSlots(words,'student-'+n,reserved,can),b=v2ExtraSlots(words.slice().reverse(),'student-'+n,reserved,can),alone=v2ExtraSlots([words[0]],'student-'+n,reserved,can);if(JSON.stringify(reserved)!==before)throw Error('Reserved vocabulary moved');for(const w of words){if(a[w.label].length!==3||JSON.stringify(a[w.label])!==JSON.stringify(b[w.label]))throw Error('Custom placement failed');for(const p of a[w.label]){if(!can(p.x,p.z))throw Error('Unwalkable placement');slots++;}}if(JSON.stringify(a[words[0].label])!==JSON.stringify(alone[words[0].label]))throw Error('Visibility of a neighbor moved a word');}return slots;})()`,shapeCtx);
assert.equal(customResult,576);

const run=s=>vm.runInContext(s,ctx);
run(`var DB={},reads=[],writes=[],failPrefix='';function get(p){reads.push(p);return p.split('/').reduce((v,k)=>v&&v[k],DB)||null;}function set(p,v){if(failPrefix&&p.startsWith(failPrefix))throw Error('Injected write failure');writes.push(p);var ks=p.split('/'),o=DB;for(var i=0;i<ks.length-1;i++)o=o[ks[i]]||(o[ks[i]]={});if(v==null)delete o[ks.at(-1)];else o[ks.at(-1)]=JSON.parse(JSON.stringify(v));}function dbRef(p){return {update:async o=>Object.keys(o).forEach(k=>set(p+'/'+k,o[k])),set:async v=>set(p,v),remove:async()=>set(p,null)}};var sGet=async p=>get(p),sGetStrict=sGet;function stuKey(c){return 'stu_'+c;}function useCallback(f){return f;}var currentUser={id:'a',name:'A',schoolCode:'CLASS'},myEntries=[];`);
run(cut(src,'function mulberry32(','// 클레이 디오라마.'));
run(cut(src,'function d2Key(','// 기록 비우기.'));
run(cut(src,'function isleKey(','// 최근 days일 동안 받은'));
run(cut(src,'function islandState(','// 영역별 식생 규칙.'));
run(cut(src,'  const syncIsland = useCallback','  const logout ='));
run(fs.readFileSync(assets+'/social.js','utf8'));
run(fs.readFileSync(assets+'/account-view.js','utf8'));
(async()=>{
 run(`var b={id:'b',name:'B',schoolCode:'CLASS'};set('stu_CLASS',[currentUser,b,{id:'empty',name:'새 친구'}]);set('isle/a',{name:'A',code:'CLASS',v:{}});set('isle/b',{name:'B',code:'CLASS',v:{[labelKey('편안')]:{l:'편안',q:'LA'},[labelKey('우울')]:{l:'우울',q:'LV',h:true}}});set('isle/outsider',{code:'OTHER',v:{}});var entry={ts:1700000000100,date:dayStamp(),text:'가상 기록',analysis:{hits:[{label:'편안',q:'LA'}]}};`);
 await run('myAdd(entry)');
 assert.equal(run(`Object.keys(get('d2/a')).filter(k=>k.startsWith('e')).length`),1);
 assert.equal(run(`get('d2/b')`),null,'A write reached B diary');
 assert.equal(await run(`v2LoadOwnIsland(currentUser).then(s=>s.length)`),1);
 assert.equal(await run(`v2LoadPublicIsland(currentUser,b).then(f=>f.state.map(e=>e.label).join(','))`),'편안');
 assert.equal(await run(`v2LoadPublicIsland(currentUser,{id:'empty'}).then(f=>f.state.length)`),0);
 assert.equal(await run(`v2LoadPublicIsland(currentUser,{id:'outsider'}).then(()=>false,()=>true)`),true);
 assert.equal(run(`reads.some(p=>p==='d2/b')`),true); // This test's explicit assertion read, never the visit.
 run('reads=[]');await run('v2LoadPublicIsland(currentUser,b)');assert.equal(run(`reads.some(p=>p.startsWith('d2/')||p.startsWith('diary_'))`),false);
 await run(`isleHide(currentUser,'편안',true)`);
 await run(`myUpdate({...entry,text:'가상 수정',analysis:{hits:[{label:'편안',q:'LA'},{label:'신남',q:'HA'}]}})`);
 assert.equal(run(`get('isle/a').v[labelKey('편안')].h`),true,'Updating diary changed visibility');
 assert.equal(await run(`v2LoadOwnIsland(currentUser).then(s=>s.length)`),2);
 await run('myDelete(entry)');assert.equal(run(`Object.keys(get('d2/a')).filter(k=>k.startsWith('e')).length`),0);assert.equal(await run(`v2LoadOwnIsland(currentUser).then(s=>s.length)`),2,'Cumulative landscape was erased by diary delete');
 run(`currentUser=b;myEntries=[];`);await run(`myAdd({...entry,ts:1700000000200})`);
 assert.equal(run(`Object.keys(get('d2/b')).filter(k=>k.startsWith('e')).length`),1);
 assert.equal(run(`Object.keys(get('d2/a')).filter(k=>k.startsWith('e')).length`),0);
 // Original save semantics: a secondary island-summary failure does not discard the diary.
 run(`currentUser={id:'failure',schoolCode:'CLASS'};failPrefix='isle/failure';`);await run(`myAdd({...entry,ts:1700000000300})`);
 assert.equal(run(`Object.keys(get('d2/failure')).filter(k=>k.startsWith('e')).length`),1);
 run(`currentUser={id:'blocked',schoolCode:'CLASS'};failPrefix='d2/blocked';writes=[];`);
 assert.equal(await run(`myAdd(entry).then(()=>false,()=>true)`),true);
 assert.equal(run(`writes.some(p=>p.startsWith('isle/blocked'))`),false);
 console.log('PASS: unchanged authentication/learning/save handlers; custom-word placement across 64 student seeds; A/B diary routing; hidden-state preservation; cumulative growth after edit/delete; class boundary; no friend diary reads; write failure behavior; no fixture or localhost in candidate; isolated preview; syntax; rollback archive source.');
})().catch(e=>{console.error(e.message);process.exit(1);});
