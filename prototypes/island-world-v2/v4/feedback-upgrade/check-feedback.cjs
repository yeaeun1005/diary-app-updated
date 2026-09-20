/* Regression checks execute shipped input, dock-selection, reward and persistence functions. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const out='renders/releases/island-feedback-models-20260920/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),base=out+'candidate/'+m.assetPath+'/';
const read=n=>fs.readFileSync(base+n,'utf8');
function section(s,a,b){const x=s.indexOf(a),y=s.indexOf(b,x);assert(x>=0&&y>x,a);return s.slice(x,y);}
for(const file of ['scene.js','friend-scene.js']){
 const src=read(file),ctx=vm.createContext({hero:false,paused:false,editing:null,passages:{busy:false},nearest:{action:'talk'},interact(){},keys:{},route:[1],yaw:0,distance:32,host:{clientHeight:720}});
 vm.runInContext(section(src,'  function wheel(e){','  function resize()'),ctx);
 const run=s=>vm.runInContext(s,ctx),ev=(key,code,target='CANVAS')=>({key,code,isComposing:true,keyCode:229,target:{tagName:target},preventDefault(){}});
 for(const [ko,code,k]of [['ㅈ','KeyW','w'],['ㅁ','KeyA','a'],['ㄴ','KeyS','s'],['ㅇ','KeyD','d']]){
  for(const key of [ko,k,'Process']){ctx.event=ev(key,code);run('keydown(event)');assert.equal(ctx.keys[k],true);assert.equal(ctx.route.length,0);ctx.event=ev('Process',code);run('keyup(event)');assert.equal(ctx.keys[k],undefined);}
  ctx.event=ev(ko,undefined);run('keydown(event)');assert.equal(ctx.keys[k],true);run('keyup(event)');
  ctx.event=ev(ko,code,'TEXTAREA');run('keydown(event)');assert.equal(ctx.keys[k],undefined);
 }
 ctx.event={deltaY:120,deltaX:0,deltaMode:0,preventDefault(){}};run('wheel(event)');assert(ctx.yaw>0);assert.equal(ctx.distance,32);const yaw=ctx.yaw;ctx.paused=true;run('wheel(event)');assert.equal(ctx.yaw,yaw);
}
const src=read('friend-scene.js'),dockCode=section(src,"if(t-lastUI>.10)","\n      const zoneNear=")+ '}';
const ctx=vm.createContext({t:1,lastUI:0,dockArmed:false,nearest:null,actor:{position:{x:-7,z:26}},V2:{stops:{dock:{x:-7,z:27,action:'sea'},board:{x:-8,z:0,action:'board'}}}});
const detect=(x,z)=>{ctx.actor.position={x,z};ctx.t++;vm.runInContext(dockCode,ctx);return ctx.nearest?.action;};
assert.equal(detect(-7,26),undefined);assert.equal(detect(-7,24),undefined);assert.equal(detect(-7,21),undefined);assert(ctx.dockArmed);assert.equal(detect(-7,24),undefined);assert.equal(detect(-7,25.1),'sea');assert.equal(detect(-7,24.6),'sea');assert.equal(detect(-7,23.9),undefined);assert.equal(detect(-8,1),'board');assert.equal(detect(-7,25.1),'sea');
assert(read('social.css').includes('[data-friend-anchor],[data-world-anchor]{visibility:hidden;'));
assert(read('friend-view.js').includes('친구가 선택해 공개한 마음과 일기만 보여요.'));
// Use the production adapter path with transactional memory; verify disk-independent account isolation.
const saved=new Map();let fail=false;
const c=vm.createContext({console,Date,MEM_ONLY:false,d2Key:id=>'private/'+id,sGetStrict:async k=>saved.get(k)||null,dbRef:k=>({transaction:async updater=>{if(fail)throw Error('offline');const v=updater(saved.get(k)||null);saved.set(k,structuredClone(v));return{committed:true,snapshot:{val:()=>structuredClone(v)}};}})}),run=s=>vm.runInContext(s,c);
for(const n of ['decor-model.js','state.js','persistence.js'])run(read(n));
(async()=>{
 for(const gift of ['swing','lighthouse','flowerBoat']){
  c.gift=gift;run('var me={id:gift,schoolCode:"LOCAL"};');await run('V4Persistence.open(me)');assert.equal(run('Object.keys(V4Decor.catalog(V4State.load(me))).length'),6);
  await assert.rejects(run('V4State.dispatch(me,{type:"decorate",id:gift,placement:null})'));
  for(const event of [{type:'start'},{type:'source',source:{kind:'fiction',caseId:'Q01-case-1'}},{type:'response',choices:['아직 어려워요']},{type:'feedback'},{type:'choose',item:gift}]){c.event=event;await run('V4State.dispatch(me,event)');}
  assert.equal(run('V4Decor.catalog(V4State.load(me)).reward.modelId'),gift);
  const p=run('Object.keys(V4Decor.zones).map(z=>V4Decor.suggest(V4State.load(me),"reward",z)).find(p=>!V4Decor.reason(V4State.load(me),"reward",p))');assert(p);c.placement=p;await run('V4State.dispatch(me,{type:"decorate",id:"reward",placement})');
  const before=run('JSON.stringify(V4State.load(me))');fail=true;await assert.rejects(run('V4State.dispatch(me,{type:"decorate",id:"reward",placement:null})'));assert.equal(run('JSON.stringify(V4State.load(me))'),before);fail=false;
  await run('V4Persistence.open(me)');assert.equal(run('JSON.stringify(V4State.load(me))'),before);await run('V4State.dispatch(me,{type:"choose",item:"flower"})');assert.equal(run('V4State.load(me).reward.item'),gift);
  await run('V4State.dispatch(me,{type:"decorate",id:"reward",placement:null})');assert.equal(run('Object.keys(V4Decor.placements(V4State.load(me))).length'),0);
 }
 assert.equal(saved.size,3);
 run('var legacy=V4State.fresh();legacy.decor={swing:null,lighthouse:{x:11,z:11,zone:"coast",rotation:45}};');assert.equal(run('Object.keys(V4Decor.catalog(legacy)).length'),8);assert.equal(run('V4Decor.placements(legacy).lighthouse.rotation'),45);
 const page=fs.readFileSync(out+'candidate/index.html','utf8'),old=fs.readFileSync(out+'before-work/index.html','utf8');assert.equal(page.replaceAll(m.assetPath+'/', 'island-v4/02192a6ab4f5/').replace('content="'+m.version+'"','content="02192a6ab4f5"'),old,'production HTML unchanged except asset version');
 console.log(JSON.stringify({pass:true,version:m.version,checks:['Korean/English/physical composing keys and language switch key release on both islands','typing does not move character; wheel rotates without changing distance and pauses in dialogs','no dock prompt on arrival; leave and return; hysteresis; board to dock','projected labels hidden until positioned','six basics; locked gifts; each new gift persists, can be stored, retains failures, cannot duplicate','existing placed or stored props preserved; three accounts isolated','production auth and data HTML byte-identical except asset version']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
