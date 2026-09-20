/* Component/hook behavior in memory, not a browser click test. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir='renders/releases/island-feedback-models-20260920/',m=JSON.parse(fs.readFileSync(dir+'manifest.json')),base=dir+'candidate/'+m.assetPath+'/';
const storage=new Map(),timers=new Map();let timerId=0,current=null,position={x:0,z:4},stops=0,done=0,stage='';
function harness(){let cursor=0,slots=[],effects=[];return{
 begin(){cursor=0;effects=[];current=this;},
 state(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];},
 ref(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},
 memo(fn,deps){const i=cursor++;if(!(i in slots))slots[i]=fn();return slots[i];},
 effect(fn,deps){const i=cursor++,old=slots[i];if(!old||!deps||deps.some((v,j)=>v!==old.deps[j]))effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});},
 flush(){effects.forEach(f=>f());},unmount(){slots.forEach(s=>s?.cleanup?.());}
};}
const ctx=vm.createContext({console,requestAnimationFrame:()=>0,URL,URLSearchParams,innerWidth:1280,location:{search:''},document:{currentScript:{src:'http://local/app.js'},querySelector:()=>null},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},coarsePointer:()=>false,SND:{play(){},playing:()=>false},React:{createElement:(type,props,...children)=>({type,props:props||{},children}),Fragment:'fragment'},useState:x=>current.state(x),useRef:x=>current.ref(x),useMemo:(f,d)=>current.memo(f,d),useEffect:(f,d)=>current.effect(f,d),setInterval:f=>{const id=++timerId;timers.set(id,f);return id;},clearInterval:id=>timers.delete(id),TutorialOverlay(){},V2Joystick(){},V4DecorEditor(){},V4Inspect(){}});
const run=s=>vm.runInContext(s,ctx);for(const f of['scene.js','content.js','app.js','tutorial.js'])run(fs.readFileSync(base+f,'utf8'));
ctx.me={id:'first',schoolCode:'LOCAL'};ctx.other={id:'other',schoolCode:'LOCAL'};
assert.equal(run('V4TutorialMemory.seen(me)'),false);run('V4TutorialMemory.mark(me)');assert.equal(run('V4TutorialMemory.seen(me)'),true);assert.equal(run('V4TutorialMemory.seen(other)'),false);
const old=ctx.localStorage;ctx.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(run('V4TutorialMemory.seen(me)'),false);run('V4TutorialMemory.mark(me)');ctx.localStorage=old;storage.clear();
const steps=run('v4IslandTutorialSteps()');assert.equal(steps.length,6);assert(steps.every(s=>s.next==='button'));assert(steps[0].free&&steps[0].keys.includes('ArrowUp'));
ctx.props={api:{current:{snapshot:()=>position,stop:()=>stops++,setTourFocus(){}}},onStage:id=>stage=id,onDone:()=>done++};
const t=harness();function renderTour(){t.begin();const tree=run('V4IslandTutorial(props)');t.flush();return tree;}
let tree=renderTour();assert.equal(tree.props.i,0);position={x:1.3,z:4};[...timers.values()].forEach(f=>f());tree=renderTour();assert.equal(tree.props.i,1);assert.equal(stage,'write');assert(stops>0);
for(let i=1;i<6;i++){assert.equal(tree.props.i,i);tree.props.onNext();tree=renderTour();}assert.equal(done,1);tree.props.onSkip();assert.equal(done,1,'finish idempotent');t.unmount();assert.equal(timers.size,0);
// First-entry invitation, skip, and replay path use actual V4World component callbacks.
ctx.worldProps={me:ctx.me,data:{q:{stage:'offer',active:false},reward:{},decor:{}},change:async()=>{},panel:null,onOpen(){},onLogout(){}};
function find(tree,predicate){if(!tree||typeof tree!=='object')return null;if(predicate(tree))return tree;for(const c of tree.children||[]){for(const v of Array.isArray(c)?c:[c]){const hit=find(v,predicate);if(hit)return hit;}}return null;}
const w=harness();w.begin();let world=run('V4World(worldProps)');assert(find(world,n=>n.props.title==='마음섬에 온 걸 환영해요!'));
find(world,n=>n.children?.includes('먼저 놀러 갈래요')).props.onClick();w.begin();world=run('V4World(worldProps)');assert(!find(world,n=>n.props.title==='마음섬에 온 걸 환영해요!'));assert.equal(run('V4TutorialMemory.seen(me)'),true);
find(world,n=>n.props.className==='v4-tour-launch').props.onClick();w.begin();world=run('V4World(worldProps)');assert(world.props.className.includes('is-touring'));assert(find(world,n=>n.props.onStage&&n.props.onDone));
assert(!fs.readFileSync(base+'tutorial.js','utf8').includes('dbRef('));
console.log(JSON.stringify({pass:true,steps:steps.map(s=>s.id),checks:['original spotlight/bubble component reused','walk advancement and manual Next fallback','finish/skip once; movement/timer cleanup','first-entry invitation, dismissal and replay','local seen flag scoped to student and handles disabled storage','no diary/reward/DB writes; not browser visual verification']}));
