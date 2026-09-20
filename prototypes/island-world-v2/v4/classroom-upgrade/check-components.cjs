// Actual candidate components with hook state and memory IO; no browser/network.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const out='renders/releases/classroom-controls-20260920/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),src=out+'candidate/'+m.assetPath+'/';
let cells=[],cursor=0,effects=[],dirty=false,db={},fail=false,reads=[];
const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==undefined&&x!==false)});
const ctx=vm.createContext({console,Date,Set,Map,React:{createElement:h,Fragment:'fragment'},v4h:h,
 useState:init=>{const i=cursor++;if(!(i in cells))cells[i]=typeof init==='function'?init():init;return[cells[i],v=>{cells[i]=typeof v==='function'?v(cells[i]):v;dirty=true;}];},
 useRef:init=>{const i=cursor++;if(!(i in cells))cells[i]={current:init};return cells[i];},useMemo:f=>f(),
 useEffect:(f,deps)=>{const i=cursor++;if(!cells[i]||deps.some((d,j)=>d!==cells[i][j])){cells[i]=deps;effects.push(f);}},
 tprivKey:(id,hash)=>'private/'+id+'/'+hash,nowTs:()=>99,dayStamp:()=> '2026-09-20',dKey:id=>'old/'+id,d2Key:id=>'new/'+id,safeEntries:a=>Array.isArray(a)?structuredClone(a):[],
 sGetStrict:async k=>{reads.push(k);if(fail)throw Error('read failure');return structuredClone(db[k]??null);},
 dbRef:k=>({set:async v=>{if(fail)throw Error('write failure');db[k]=structuredClone(v);}}),
 V4_QUERY:{get:()=>null},V4ShareToggle:()=>null,V4ReceivedMessages:()=>null,V4AnalysisTools:()=>null,
 document:{body:{classList:{add(){},remove(){}}}}
});
for(const n of['care-model.js','teacher-tools.js','activity-model.js','activities.js'])vm.runInContext(fs.readFileSync(src+n,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),words=n=>typeof n==='object'?(n.children||[]).map(words).join(''):String(n);
const all=t=>{let nodes=[];function walk(n){if(typeof n!=='object')return;nodes.push(n);for(const c of n.children||[])walk(c);}walk(t);return nodes;};
let tree,component,props;
async function render(){for(let n=0;n<10;n++){cursor=0;dirty=false;ctx.props=props;tree=run(component+'(props)');for(const f of effects.splice(0))f();await new Promise(setImmediate);if(!dirty)break;}return tree;}
async function start(name,p){cells=[];effects=[];component=name;props=p;return render();}
async function click(label){const b=all(tree).find(n=>n.type==='button'&&words(n)===label);assert(b,label);assert(!b.props.disabled,label+' enabled');await b.props.onClick();await render();}
(async()=>{
 const user={teacherId:'teacher',th:'test-only',schoolCode:'TEST'},students=[{id:'a',schoolCode:'TEST'}],watchList=[{id:'a',name:'학생',count:3,days:[]}];
 await start('V4TeacherWatch',{user,students,watchList});
 const card=()=>all(tree).find(n=>typeof n.type==='function'&&n.type.name==='V4CareCard');
 assert(card().props.ready);fail=true;assert.equal(await card().props.onSave('acted',['Wee클래스 상담선생님께 전달']),false);await render();assert(!card().props.record);assert(card().props.error.includes('저장하지 못했어요'));
 fail=false;assert.equal(await card().props.onSave('acted',['Wee클래스 상담선생님께 전달']),true);await render();assert.equal(card().props.record.status,'acted');assert(!card().props.error);
 fail=true;await start('V4TeacherWatch',{user,students,watchList});assert(!card().props.ready);assert(words(tree).includes('조치 기록을 불러오지 못했어요'));fail=false;await click('다시 불러오기');assert(card().props.ready);
 let saveOkay=false;await start('V4CareCard',{student:watchList[0],ready:true,onSave:async()=>saveOkay});await click('이렇게 조치했어요');let checkbox=all(tree).find(n=>n.type==='input');checkbox.props.onChange();await render();await click('조치 저장');assert(all(tree).find(n=>n.type==='input').props.checked,'failed save retains selection');saveOkay=true;await click('조치 저장');assert(!all(tree).some(n=>n.type==='input'));
 // Same date ordering and read-only teacher controls use the actual archive.
 const entries=[{ts:1,date:'2026-09-18',text:'이전 기록',analysis:{hits:[]}},{ts:2,date:'2026-09-20',text:'최신 기록',analysis:{hits:[]}}],data={choices:{'2':['기쁨']},q:{}};
 let selected;const archiveProps={me:{id:'a'},entries,data,onInspect:ts=>selected=ts,readOnly:true};
 await start('V4Archive',archiveProps);await click('모든 일기');assert(words(tree).indexOf('최신 기록')<words(tree).indexOf('이전 기록'));assert(!words(tree).includes('원문 수정'));assert(!words(tree).includes('삭제'));assert(!all(tree).some(n=>n.type===ctx.V4ShareToggle));await click('이 마음 살펴보기');assert.equal(selected,2);
 await start('V4Archive',{...archiveProps,readOnly:false});assert(words(tree).includes('원문 수정'));assert(all(tree).some(n=>n.type===ctx.V4ShareToggle));
 await start('V4Report',{me:{id:'a'},entries,data,readOnly:true});assert(!words(tree).includes('내가 고른 마음 말'));await start('V4Report',{me:{id:'a'},entries,data});assert(words(tree).includes('내가 고른 마음 말1가지 표현'));
 // Strict teacher read: fallback, migrated entries, read failure and separate students.
 db['old/a']=entries;ctx.id='a';assert.equal((await run('v4LoadTeacherDiary(id)')).length,2);db['new/a']={_migrated:true,e1:entries[1]};assert.equal((await run('v4LoadTeacherDiary(id)'))[0]._k,'e1');ctx.id='b';assert.equal((await run('v4LoadTeacherDiary(id)')).length,0);fail=true;await assert.rejects(run('v4LoadTeacherDiary(id)'));
 console.log(JSON.stringify({pass:true,checks:['actual teacher load failure disables writes and retry recovers','actual save failure has no saved status and keeps selection','same newest-first archive and selected-entry analysis','teacher read-only; student controls unchanged','unread choices not reported as zero','strict legacy/migrated diary reads and account separation']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
