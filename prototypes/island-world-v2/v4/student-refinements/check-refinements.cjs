// Real candidate models and correction component; memory only, never Firebase.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process');
const out='renders/releases/student-refinements-20260921/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),src=out+'candidate/'+m.assetPath+'/',html=fs.readFileSync(out+'candidate/index.html','utf8'),original=cp.execFileSync('git',['show','347e610:index.html'],{maxBuffer:8e6,encoding:'utf8'});
const cut=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
let cells=[],cursor=0,props,tree,fail=false,saved=null,closed=false;
const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==undefined&&x!==false)});
const ctx=vm.createContext({console,Date,Map,Set,React:{createElement:h,Fragment:'fragment'},v4h:h,useMemo:fn=>fn(),useRef:v=>{const i=cursor++;return cells[i]||(cells[i]={current:v});},useState:v=>{const i=cursor++;if(!(i in cells))cells[i]=typeof v==='function'?v():v;return[cells[i],x=>{cells[i]=typeof x==='function'?x(cells[i]):x;}];}});
for(const c of[cut(html,'function normalizeKorean(t)','function safeAnalysis(a)'),cut(html,'function safeAnalysis(a)','// 사분면 색.'),cut(html,'const SITUATION_MAP =','function MindChat({'),cut(html,'function extractSituations(textArray)','function fmtDate(d)'),'function v4Analyze(t){return analyzeEntry(t)}',fs.readFileSync(src+'activity-model.js','utf8'),fs.readFileSync(src+'student-tools-model.js','utf8'),fs.readFileSync(src+'student-tools.js','utf8')])vm.runInContext(c,ctx);
const run=s=>vm.runInContext(s,ctx),plain=x=>JSON.parse(JSON.stringify(x));
const old=vm.createContext({});vm.runInContext(cut(original,'const EMOTIONS_28 =','const PERSON_WORDS'),old);
assert.deepEqual(plain(run('EMOTIONS_28')),plain(vm.runInContext('EMOTIONS_28',old)),'dictionary changed');
const dict=plain(run('EMOTIONS_28'));
for(const emo of dict){ctx.entry={text:'',analysis:{corrected:true,hits:[{label:emo.label,val9:emo.val}]}};assert.equal(run('V4StudentTools.hasNegative(entry)'),emo.val<5,emo.label);}
for(const [text,negative]of[['나는 행복했다. 즐거웠다.',false],['나는 슬펐다.',true],['행복했지만 나중에는 슬펐다.',true],['친구가 슬펐다. 나는 즐거웠다.',false],['나는 슬프지 않았다.',false],['설 다',false],['연필을 꺼냈다.',false]]){ctx.entry={text};assert.equal(run('V4StudentTools.hasNegative(entry)'),negative,text);}
assert.equal(run('analyzeEntry("설 다").hits.length'),0);assert(!fs.readFileSync(src+'review-data.js','utf8').includes('설렜다.'));
ctx.entry={ts:100,date:'9.16',text:'친구와 놀아서 행복했다.',analysis:run('analyzeEntry("친구와 놀아서 행복했다.")')};const before=JSON.stringify(ctx.entry);
let corrected=plain(run("V4StudentTools.correct(entry,['슬픔'])"));assert.equal(JSON.stringify(ctx.entry),before);assert.equal(corrected.text,ctx.entry.text);assert.equal(corrected.analysis.negPct,100);assert(corrected.analysis.automaticAnalysis.hits.some(h=>h.label==='행복'));
ctx.edited=corrected;assert.deepEqual(plain(run('V4StudentTools.refresh(safeEntries([edited]))[0].analysis.hits')),corrected.analysis.hits);assert.equal(run('safeEntries([edited])[0].analysis.corrected'),true);assert.deepEqual(plain(run('V4StudentTools.refresh([edited])[0]')),corrected);assert(run('V4StudentTools.hasNegative(edited)'));assert.equal(run("V4StudentTools.summarize([edited]).negative[0].label"),'슬픔');
ctx.edited=plain(run("V4StudentTools.correct(edited,['행복'])"));assert(!run('V4StudentTools.hasNegative(edited)'));assert.equal(ctx.edited.analysis.matchedNeg.length,0);assert.equal(ctx.edited.analysis.negPct,0);
ctx.edited=plain(run("V4StudentTools.correct(entry,[],'머쓱함','neu','low')"));assert.equal(ctx.edited.analysis.negPct,0);assert.equal(ctx.edited.analysis.posPct,0);assert.equal(ctx.edited.analysis.hits[0].aro9,3);
assert.throws(()=>run('V4StudentTools.correct(entry,[])'));
for(const date of ['2026-09-16','2025-12-31','2024-02-29']){ctx.date=date;const e=plain(run('V4StudentTools.prepare("즐거웠다.",[],[],date,1790000000000)'));ctx.dated=e;assert.equal(e.date,Number(date.slice(5,7))+'.'+Number(date.slice(8)));assert.equal(run('V4ActivityModel.recordDate(dated)'),date);assert.equal(run('V4ActivityModel.recordDate(safeEntries([dated])[0])'),date);assert.equal(run('V4ActivityModel.recordDate(V4StudentTools.correct(dated,["행복"]))'),date);}
ctx.dated={date:'2026-09-16',ts:1790000000000};assert.equal(run('V4ActivityModel.recordDate(dated)'),'2026-09-16');ctx.dated={date:'9.16',ts:new Date(2026,8,16).getTime()};assert.equal(run('V4ActivityModel.recordDate(dated)'),'2026-09-16');
const nodes=()=>{const all=[];function visit(n){if(typeof n!=='object')return;all.push(n);for(const c of n.children||[])visit(c);}visit(tree);return all;};const words=n=>typeof n==='object'?(n.children||[]).map(words).join(''):String(n);
function render(){cursor=0;ctx.props=props;tree=run('V4EmotionCorrection(props)');}
async function click(text){const n=nodes().find(n=>n.type==='button'&&words(n)===text);assert(n,text);assert(!n.props.disabled);await n.props.onClick();render();}
(async()=>{
 props={entry:ctx.entry,onClose:()=>closed=true,onUpdate:async v=>{if(fail)throw Error('write failed');saved=plain(v);}};render();await click('슬픔');fail=true;await click('이 감정으로 저장하기');assert(!closed&&!saved);assert(words(tree).includes('고른 내용은 그대로'));assert(nodes().find(n=>n.type==='button'&&words(n)==='슬픔').props['aria-pressed']);fail=false;await click('이 감정으로 저장하기');assert(closed);assert.equal(saved.analysis.negPct,100);assert.equal(saved.text,ctx.entry.text);
 cells=[];closed=false;props={...props,entry:saved};render();assert(nodes().find(n=>n.type==='button'&&words(n)==='슬픔').props['aria-pressed']);
 const app=fs.readFileSync(src+'app.js','utf8');assert(app.includes('date:writing.date'));assert(app.includes('let ts=nowTs()'));assert(!app.includes('마음 분석하기'));
 assert(fs.readFileSync(src+'legacy/world.js','utf8').includes("MEM_ONLY?'체험 중'"));
 console.log(JSON.stringify({pass:true,dictionary:{total:dict.length,positive:dict.filter(e=>e.val>5).map(e=>e.label),negative:dict.filter(e=>e.val<5).map(e=>e.label)},checks:['dictionary unchanged from original 347e610','all labels and mixed/positive/negative/other/negated input eligibility','malformed hope phrase absent','manual override persists through reanalysis and conversation eligibility','original text/automatic evidence retained','neutral/custom valence and energy','same-format dates with cross-year/leap-day compatibility','correction component failure retains selection and retries','saved correction reopens','demo date clock and board/analysis labels']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
