// Actual shipped components, React hook harness and isolated memory IO. No browser/Firebase.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const out='renders/releases/diary-board-fixes-20260921/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),src=out+'candidate/'+m.assetPath+'/',html=fs.readFileSync(out+'candidate/index.html','utf8');
const cut=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,a);return html.slice(i,j);};
let cells=[],cursor=0,effects=[],dirty=false,tree,props,component,fail=false,boardSaved=null,boardWrites=0,entryWrites=0,left=false,now=new Date(2026,8,21,9).getTime();
const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==undefined&&x!==false)});
const ctx=vm.createContext({console:{...console,error:()=>{}},Date,Set,Map,URL,React:{createElement:h,Fragment:'fragment'},v4h:h,
 useState:init=>{const i=cursor++;if(!(i in cells))cells[i]=typeof init==='function'?init():init;return[cells[i],v=>{cells[i]=typeof v==='function'?v(cells[i]):v;dirty=true;}];},
 useRef:init=>{const i=cursor++;return cells[i]||(cells[i]={current:init});},useMemo:f=>f(),
 useEffect:(f,deps)=>{const i=cursor++;if(!cells[i]||deps.some((d,j)=>d!==cells[i][j])){cells[i]=deps;effects.push(f);}},
 requestAnimationFrame:()=>{},nowTs:()=>now,dayStamp:()=>new Date(now).getFullYear()+'-'+String(new Date(now).getMonth()+1).padStart(2,'0')+'-'+String(new Date(now).getDate()).padStart(2,'0'),
 document:{currentScript:{src:'http://localhost/app.js'},querySelector:()=>null,getElementById:()=>null},
 window:{innerWidth:1280,addEventListener(){},removeEventListener(){}},localStorage:{getItem:()=>null},coarsePointer:()=>false,
 V4_QUERY:{get:()=>null},v2BoardNote:()=> '체험 중',PLAZA_MAX:500,PLZ:{SLOTS:30},QC:{LA:'#aaa',LV:'#bbb',HA:'#ccc',HV:'#ddd'},QB:{LA:'#eee',LV:'#eee',HA:'#eee',HV:'#eee'},bSoft:{},emoMeaning:()=>'',anonKey:()=> 'anon-a',plazaKey:()=> 'board',stuKey:()=> 'roster',
 plazaChips:()=>['행복','슬픔','감사','긴장','분노'].map(l=>({l,q:'LA',mine:false})),
 sGetStrict:async()=>true,sGet:async()=>[{name:'가상학생'},{name:'가상친구'}],plazaCurrent:async()=>({id:'q',t:'질문',nm:true}),dayWords:async()=>({words:[]}),dayTone:async()=>({tone:.5}),plazaMyAnswer:async()=>boardSaved,plazaCount:async()=>[],plazaPublic:async()=>[],
 dbRef:()=>({update:async values=>{if(fail)throw Error('write failed');boardWrites++;ctx.lastWrite=values;}})
});
const run=s=>vm.runInContext(s,ctx),plain=x=>JSON.parse(JSON.stringify(x));
for(const code of[cut('function normalizeKorean(t)','function safeAnalysis(a)'),cut('function safeAnalysis(a)','// 사분면 색.'),cut('const SITUATION_MAP =','function MindChat({'),cut('function extractSituations(textArray)','function fmtDate(d)'),cut('function islandState(entries)','// 영역별 식생 규칙.'),'function v4Analyze(t){return analyzeEntry(t)}',cut('function plazaCleanText(t)','// 현재 열린 질문.'),cut('function plazaAnswerShape(sid','// 내 답(학생).'),cut('async function plazaAnswerPut','// 답을 쓴 아이들의 익명 키.'),cut('var PLAZA_JOSA =','// 일기 읽기.')])run(code);
for(const n of ['content.js','activity-model.js','student-tools-model.js','student-tools.js','daily-model.js','state.js','activities.js','legacy/board.js'])run(fs.readFileSync(src+n,'utf8'));
let app=fs.readFileSync(src+'app.js','utf8');run(app);
const words=n=>typeof n==='object'?(n.children||[]).map(words).join(''):String(n);
const nodes=()=>{let all=[];function walk(n){if(typeof n!=='object')return;all.push(n);for(const c of n.children||[])walk(c);}walk(tree);return all;};
async function render(){for(let n=0;n<12;n++){cursor=0;dirty=false;ctx.props=props;tree=run(component+'(props)');for(const f of effects.splice(0))f();await new Promise(setImmediate);if(!dirty)break;}}
async function mount(name,p){cells=[];effects=[];component=name;props=p;await render();}
async function click(label){const b=nodes().find(n=>n.type==='button'&&words(n)===label);assert(b,label);assert(!b.props.disabled,label+' enabled');await b.props.onClick();await render();}
async function input(selector,value){const n=nodes().find(selector);assert(n);n.props.onChange({target:{value}});await render();}
(async()=>{
 // New and legacy helper choices survive normalization, enter chart/talk/island and retain automatic evidence.
 for(const labels of [['슬픔'],['행복','슬픔'],['몽글몽글함']]){ctx.labels=labels;ctx.e=run('V4StudentTools.prepare("",labels,["친구"],"2026-09-21",123)');ctx.e=run('safeEntries([e])[0]');assert.deepEqual(plain(run('V4StudentTools.refresh([e])[0].analysis.hits.map(h=>h.label)')),labels);assert.deepEqual(plain(run('islandState([e]).map(h=>h.label)')),labels);assert.equal(run('V4StudentTools.summarize([e]).chartEntries[0].analysis.hits.length'),labels.length);assert.equal(run('V4StudentTools.hasNegative(e)'),labels.includes('슬픔'));assert.equal(run('V4ActivityModel.recordDate(e)'),'2026-09-21');}
 ctx.e={ts:1,text:'친구 상황\n내가 고른 감정: 슬픔',analysis:{studentSelection:['슬픔'],automaticText:'',hits:[]}};assert.equal(run('V4StudentTools.refresh([e])[0].analysis.negPct'),100);
 // Writer: entering always uses today, without losing draft text or chosen emotions.
 let data=run('V4State.fresh()'),entries=[],failedStage='';ctx.key='TEST:a';run('V4WritingDrafts.set(key,{date:"2025-01-01",emotions:["슬픔"],situations:[]})');
 const writerProps={me:{id:'a',schoolCode:'TEST'},data,entries,panel:'write',onLeavePlace:()=>left=true,onClose:()=>left=true,onUpdate:async()=>{},onAdd:async e=>{if(failedStage==='diary')throw Error('diary failed');entryWrites++;},setEntries:fn=>{entries=fn(entries);props.entries=entries;},change:async e=>{if(failedStage==='progress'&&e.type==='dailyWrite')throw Error('progress failed');data=run('V4State.reduce')(data,{...e,mode:'diary'},now);props.data=data;return data;}};
 await mount('V4Activities',writerProps);assert.equal(nodes().find(n=>n.type==='input'&&n.props.type==='date').props.value,'2026-09-21');
 await input(n=>n.type==='textarea'&&n.props.id==='v4-diary','친구와 놀았다.');failedStage='diary';await click('일기 저장하기');assert.equal(entries.length,0);assert.equal(nodes().find(n=>n.props.id==='v4-diary').props.value,'친구와 놀았다.');
 failedStage='progress';await click('일기 저장하기');assert.equal(entries.length,1);const ts=entries[0].ts;assert(!left);failedStage='';await click('일기 저장하기');assert.equal(entries.length,1);assert.equal(entries[0].ts,ts);assert.equal(entryWrites,1);assert.equal(nodes().find(n=>n.props.id==='v4-diary').props.value,'');assert(words(tree).includes('오늘의 마음 탐험도 완료'));assert(!left);assert.equal(run('V4Daily.quest')(data).stage,'complete');
 // New second diary is independent; draft-date reset is specific to reentry.
 now+=100;await input(n=>n.type==='input'&&n.props.type==='date','2024-02-29');await input(n=>n.props.id==='v4-diary','과거 일기');await click('일기 저장하기');assert.equal(entries.length,2);assert.equal(entries[1].analysis.entryDate,'2024-02-29');
 // Custom board emotion: empty rejected, 5-slot cap, saved/reopened value, failed writes retain input.
 await mount('V2Board',{me:{id:'a',name:'가상학생',schoolCode:'TEST'},myState:[],onBack(){}});await click('답하기');await input(n=>n.type==='textarea','친구가 기다려 주었다.');await click('기타');await click('저장');assert(words(tree).includes('기타 감정을 적어 주세요'));assert.equal(boardWrites,0);
 await input(n=>n.type==='input','몽글몽글함');for(const label of ['행복','슬픔','감사','긴장'])await click(label);await click('분노');assert(words(tree).includes('최대 5개'));fail=true;await click('저장');assert.equal(boardWrites,0);assert.equal(nodes().find(n=>n.type==='input').props.value,'몽글몽글함');fail=false;await click('저장');assert.equal(boardWrites,1);assert.equal(ctx.lastWrite['a/q/a/fl'].length,5);assert.deepEqual(plain(ctx.lastWrite['a/q/a/fl'].at(-1)),{l:'몽글몽글함',q:''});assert(ctx.lastWrite['pub/q/anon-a']);await click('고치기');assert.equal(nodes().find(n=>n.type==='input').props.value,'몽글몽글함');
 // Names in OTHER follow the same warning -> hidden pending review path, including one's own name.
 await input(n=>n.type==='input','가상학생');await click('저장');assert.equal(boardWrites,1);assert(words(tree).includes('나와 친구의 이름은 쓰지 않아요'));await click('저장');assert.equal(boardWrites,2);assert.equal(ctx.lastWrite['pub/q/anon-a'],null);assert.equal(ctx.lastWrite['a/q/a/s'],2);
 assert(html.includes('S("t-reward", "탐험 보상 난이도"'));assert(!cut('function teacherTourSteps()','// ── 바다 투어').includes('광장'));assert(!cut('  const plzCode =','  const [myEntries, setME]').includes('광장'));
 // Regression: completed takes precedence even if active was previously left true by start.
 assert(app.indexOf("if(q.stage==='complete'){setLit(null)")<app.indexOf('else if(q.active)guide(destination)'));
 console.log(JSON.stringify({pass:true,checks:['today on entry; cross-year explicit dates','writer remains open and recent list updates; diary/progress failure idempotent retry','helper selection reaches charts/dialogue/island and survives safeEntries','neutral custom diary selection is saved without invented valence','board custom empty/max5/reopen/failure retry','own/friend-name protection covers custom labels and anonymous copies','teacher terminology and reward tutorial','completion clears destination before active guidance']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
