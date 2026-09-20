// Execute the shipped dialogue component with React hooks and in-memory IO; no browser or network.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('renders/releases/daily-exploration-20260920/candidate/index.html','utf8'),out='renders/releases/daily-exploration-20260920/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),src=out+'candidate/'+m.assetPath+'/';
const cut=(a,b)=>{const x=html.indexOf(a),y=html.indexOf(b,x);assert(x>=0&&y>x);return html.slice(x,y);};
let cells=[],cursor=0,effects=[],dirty=false,db={},fail=false,readFail=false,writes=0;
const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==undefined&&x!==false)});
const ctx=vm.createContext({console,Map,Set,Date,React:{createElement:h,Fragment:'fragment'},v4h:h,
 useState:init=>{const i=cursor++;if(!(i in cells))cells[i]=typeof init==='function'?init():init;return[cells[i],v=>{cells[i]=typeof v==='function'?v(cells[i]):v;dirty=true;}];},
 useRef:init=>{const i=cursor++;if(!(i in cells))cells[i]={current:init};return cells[i];},useMemo:fn=>fn(),
 useEffect:(fn,deps)=>{const i=cursor++;if(!cells[i]||deps.some((d,j)=>d!==cells[i][j])){cells[i]=deps;effects.push(fn);}},
 V4_QUERY:{get:()=>null},requestAnimationFrame:()=>{},dayStamp:()=> '2026-09-20',chatKey:id=>'chat/'+id,
 sGetStrict:async k=>{if(readFail)throw Error('read failure');return structuredClone(db[k]??null);},
 dbRef:k=>({set:async v=>{if(fail)throw Error('write failure');writes++;db[k]=structuredClone(v);}})
});
for(const code of[cut('function normalizeKorean(t)','function safeAnalysis(a)'),cut('const SITUATION_MAP =','function MindChat({'),cut('function extractSituations(textArray)','function fmtDate(d)'),'function v4Analyze(t){return analyzeEntry(t)}',fs.readFileSync(src+'activity-model.js','utf8'),fs.readFileSync(src+'student-tools-model.js','utf8'),fs.readFileSync(src+'content.js','utf8'),fs.readFileSync(src+'daily-model.js','utf8'),fs.readFileSync(src+'activities.js','utf8')])vm.runInContext(code,ctx);
const run=s=>vm.runInContext(s,ctx),plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(run('V4StudentTools.talkSteps.map(s=>s.label)')),['관찰','느낌','욕구','행동','돌아보기']);
assert.deepEqual(plain(run('V4StudentTools.reflections.map(r=>r.value)')),['도움이 되었어.','보통이야.','안됐어.']);
const text='오늘 학교에서 발표를 했다. 긴장했다. 끝나고 뿌듯했다.';ctx.raw=text;
const seed=plain(run('V4StudentTools.talkSeed(raw)'));assert.equal(seed.observation,'오늘 학교에서 발표를 했다.');assert(seed.feeling.includes('긴장'));assert(seed.feeling.includes('뿌듯'));
assert.equal(run("V4StudentTools.talkSeed('연필을 꺼냈다.').feeling"),'');assert.equal(run("V4StudentTools.talkSeed('').observation"),'');
const entry={ts:1,date:'2026-09-20',text,analysis:{hits:[]}},before=structuredClone(entry);
let tree,props={me:{id:'a',schoolCode:'TEST'},entries:[entry],data:{selectedEntryTs:1,choices:{},talk:{}},change:async()=>{},onLeavePlace:()=>{}};
const nodes=()=>{const all=[];function visit(n){if(typeof n!=='object')return;all.push(n);for(const c of n.children||[])visit(c);}visit(tree);return all;};
const words=n=>typeof n==='object'?(n.children||[]).map(words).join(''):String(n);
async function render(){for(let i=0;i<8;i++){dirty=false;cursor=0;ctx.props=props;tree=run('V4Talk(props)');const fns=effects.splice(0);for(const fn of fns)fn();await Promise.resolve();await Promise.resolve();if(!dirty)break;}return tree;}
async function click(label){const n=nodes().find(n=>n.type==='button'&&words(n)===label);assert(n,'button '+label);assert(!n.props.disabled,'enabled '+label);await n.props.onClick();await render();}
async function fill(label,value){const l=nodes().find(n=>n.type==='label'&&n.children.some(c=>words(c)===label));assert(l,label);const n=l.children.find(c=>c.type==='textarea');n.props.onChange({target:{value}});await render();}
(async()=>{
 db['chat/a']=[{entryTs:2,feeling:'다른 일기',nextPlan:'기존 계획'}];
 await render();assert.equal(nodes().find(n=>n.type==='textarea').props.value,seed.observation);
 await fill('일어난 일','발표할 때 친구 두 명이 내 쪽을 봤어.');await click('다음 질문 →');await fill('그때 느낀 감정','설렘');
 await click('다음 질문 →');await click('인정받고 싶었어.');await fill('내가 원했던 것','노력한 것을 알아주길 바랐어.');
 await click('다음 질문 →');await click('내 마음을 말로 표현했어.');await click('다음 질문 →');
 await click('보통이야.예: 마음은 조금 편해졌지만, 원했던 일은 아직 그대로야.');
 fail=true;await click('내 생각 저장하기');assert.equal(writes,0);assert(words(tree).includes('저장하지 못했어요'));assert.equal(run("V4ActivityDrafts.get('TEST:a:1').feeling"),'설렘');
 fail=false;await click('내 생각 저장하기');assert.equal(writes,1);const saved=db['chat/a'].find(c=>c.entryTs===1);
 assert.equal(saved.observation,'발표할 때 친구 두 명이 내 쪽을 봤어.');assert.equal(saved.feeling,'설렘');assert.equal(saved.helpful,'보통이야.');assert.equal(saved.step,7);assert.equal(saved.completed,true);assert.deepEqual(entry,before);assert.equal(db['chat/a'][0].entryTs,2);
 await click('조금 더 생각하기');await click('01관찰');assert.equal(nodes().find(n=>n.type==='textarea').props.value,saved.observation);
 // Switching diary and account cannot overwrite the edited draft or read another account's saved list.
 props={...props,entries:[entry,{...entry,ts:3,text:'친구와 놀았다. 즐거웠다.'}]};await render();let select=nodes().find(n=>n.type==='select');select.props.onChange({target:{value:'3'}});await render();assert.notEqual(nodes().find(n=>n.type==='textarea').props.value,saved.observation);
 select=nodes().find(n=>n.type==='select');select.props.onChange({target:{value:'1'}});await render();assert.equal(nodes().find(n=>n.type==='textarea').props.value,saved.observation);
 cells=[];props={...props,me:{id:'b',schoolCode:'TEST'}};await render();assert.equal(nodes().find(n=>n.type==='textarea').props.value,seed.observation);assert(!words(tree).includes('남겨 둔 생각 다시 보기'));
 // Existing conversations remain usable including the old freeform reflection and next plan.
 cells=[];props={...props,me:{id:'legacy',schoolCode:'TEST'}};db['chat/legacy']=[{entryTs:1,observation:'기존 관찰',feeling:'기존 느낌',need:'기존 욕구',action:'기존 행동',helpful:'조금 도움이 되었어요',nextPlan:'기존 다음 계획',completed:true,step:7}];await render();await click('이 생각에서 이어 쓰기');await click('05돌아보기');await click('내 생각 저장하기');assert.equal(db['chat/legacy'][0].nextPlan,'기존 다음 계획');assert.equal(db['chat/legacy'][0].helpful,'조금 도움이 되었어요');
 cells=[];props={...props,me:{id:'read-failure',schoolCode:'TEST'}};readFail=true;await render();await click('05돌아보기');assert(nodes().find(n=>n.type==='button'&&words(n)==='내 생각 저장하기').props.disabled);assert(words(tree).includes('지난 대화를 불러오지 못했어요'));
 console.log(JSON.stringify({pass:true,checks:['five questions and three reflection choices','real dictionary prefills; no invented emotion','editable observation/feeling and example/custom need/action','actual component save failure preserves draft; retry saves','original diary unchanged; other chats preserved','switch diary/account isolation','legacy freeform reflection/next plan preserved','read failure blocks destructive overwrite']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
