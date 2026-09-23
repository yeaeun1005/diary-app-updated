// Execute the shipped dialogue component with React hooks and in-memory IO; no browser or network.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('renders/releases/reward-order-20260923/candidate/index.html','utf8'),out='renders/releases/reward-order-20260923/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),src=out+'candidate/'+m.assetPath+'/';
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

let sequence=100,opened=0,left=[];
function state(ts,checked=false){return {q:{active:true},reward:{available:false},choices:{},talk:{},selectedEntryTs:ts,daily:{'2026-09-20':{entryTs:ts,writtenAt:10,mode:'full',talkStatus:'pending',...(checked?{analysisCheckedAt:11}:{})}}};}
async function change(event){if(fail)throw Error('save failed');ctx.data=props.data;ctx.event=event;ctx.now=sequence++;if(event.type.startsWith('daily'))run('V4Daily.apply(data,event,now)');else if(event.type==='selectEntry')props.data.selectedEntryTs=event.ts;dirty=true;return props.data;}
const negative=ts=>({ts,date:'2026-09-20',text:'친구와 다퉈서 슬프고 속상했다.',analysis:{}});
async function mount(entries,data){cells=[];effects=[];db={};fail=false;props={me:{id:'test-'+sequence++,schoolCode:'LOCAL'},entries,data,change,onLeavePlace:(...v)=>left.push(v),onEarned:()=>opened++};await render();}
async function save(){await click('5돌아보기');await click('도움이 되었어.');await click('내 생각 저장하기');}
(async()=>{
 // Save the conversation first. Analysis remains required; the next action is visible.
 await mount([negative(1)],state(1));await save();
 assert.equal(props.data.daily['2026-09-20'].talkStatus,'done');assert(!props.data.reward.available);
 assert(words(tree).includes('분석 확인이 아직 남아 있어요'));
 await click('분석 확인하러 가기');assert.equal(left.at(-1)[0],'review');
 await change({type:'dailyAnalysis',ts:1});await render();assert(props.data.reward.available);
 const completed=props.data.daily['2026-09-20'].completedAt;
 await click('완료 선물 확인하기');assert.equal(opened,1);assert.equal(props.data.daily['2026-09-20'].completedAt,completed);
 // Saving another diary never completes today's task. The CTA chooses today's diary.
 await mount([negative(1),negative(2)],{...state(2,true),selectedEntryTs:1});await save();
 assert(!props.data.reward.available);assert.equal(db['chat/'+props.me.id][0].entryTs,1);
 await click('오늘 탐험의 일기로 대화하기');assert.equal(nodes().find(n=>n.type==='select').props.value,'2');
 await save();assert(props.data.reward.available);assert.equal(db['chat/'+props.me.id].length,2);
 // Positive-only day: explicit skip after analysis; failure is visible and retry works.
 const positive={ts:9,date:'2026-09-20',text:'나는 행복하고 즐거웠다.',analysis:{}};
 await mount([positive],state(9));assert(!nodes().some(n=>n.type==='button'&&words(n)==='오늘은 대화할 내용이 없어요'));
 await change({type:'dailyAnalysis',ts:9});await render();assert(!props.data.reward.available);
 fail=true;await click('오늘은 대화할 내용이 없어요');assert(words(tree).includes('완료를 저장하지 못했어요'));assert(!props.data.reward.available);
 fail=false;await click('오늘은 대화할 내용이 없어요');assert(props.data.reward.available);assert.equal(props.data.daily['2026-09-20'].talkStatus,'skipped');
 // Ordinary diaries use creation time within a date; edited timestamps aren't synthesized.
 ctx.entries=[{ts:10,date:'2026-09-19'},{ts:2,date:'2026-09-20'},{ts:5,date:'2026-09-20'}];
 assert.deepEqual(plain(run("V4ActivityModel.inRange(entries,'all','2026-09-20').map(e=>e.ts)")),[5,2,10]);
 console.log(JSON.stringify({pass:true,checks:['saved chat → missing analysis CTA → completion','reopen completion without new entitlement','different diary → choose today → completion; both chats retained','positive-only explicit skip with visible failure and retry','same date newest first; date ordering retained']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
