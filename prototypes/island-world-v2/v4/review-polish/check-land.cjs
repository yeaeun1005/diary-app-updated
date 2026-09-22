/* Actual terrain/path functions and miniature meshes, without a browser renderer. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir='renders/releases/review-polish-20260922/',m=JSON.parse(fs.readFileSync(dir+'manifest.json')),base=dir+'candidate/'+m.assetPath+'/';
const page=fs.readFileSync(dir+'candidate/index.html','utf8'),scene=fs.readFileSync(base+'scene.js','utf8');
const three=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('WebGLRenderer')&&s.includes('t.REVISION=e'));
const ctx=vm.createContext({console,URLSearchParams,location:{search:''},V4Content:{spots:{}},hashSeed:s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0),mulberry32:n=>()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;}});const run=s=>vm.runInContext(s,ctx);run(three);
for(const f of['scene.js','decor-model.js','sea-scene.js'])run(fs.readFileSync(base+f,'utf8'));
const oldContext=vm.createContext({});vm.runInContext(fs.readFileSync('island-v4/02192a6ab4f5/decor-model.js','utf8'),oldContext);const old=vm.runInContext('V4Decor',oldContext);ctx.old=old;
const compatibility=run(`(()=>{let preserved=0;const areas={};for(const[id,g]of Object.entries(old.zones)){const now=V4Decor.zones[id];areas[id]=+(100*(now.halfX*now.halfZ/(g.halfX*g.halfZ)-1)).toFixed(1);for(const item of Object.keys(old.items))for(let x=g.x-g.halfX;x<=g.x+g.halfX;x+=.2)for(let z=g.z-g.halfZ;z<=g.z+g.halfZ;z+=.2){const p={x,z,zone:id,rotation:0};if(old.reason({reward:{}},item,p))continue;if(V4Decor.reason({reward:{},decor:{[item]:null}},item,p))throw Error('Old placement rejected');preserved++;}}return{preserved,areaIncreasePercent:areas};})()`);assert(compatibility.preserved>29000);
// Use the more conservative decoration obstacle set plus the telescope for path checks.
const decor=fs.readFileSync(base+'decor-model.js','utf8');run(decor.slice(decor.indexOf(' const obstacles='),decor.indexOf('\n const paths='))+';this.colliders=[...obstacles,{x:11,z:-2.3,r:.85}];');
run('var decorColliders=[],actor={position:{x:0,z:4}};');run(scene.slice(scene.indexOf('  function walkable('),scene.indexOf('  const ffRes=')));
const routes=run(`Object.fromEntries(Object.entries(V4.stops).map(([id,p])=>{const candidates=[p,...Array.from({length:16},(_,i)=>({x:p.x+Math.cos(i*Math.PI/8)*1.8,z:p.z+Math.sin(i*Math.PI/8)*1.8}))];const path=candidates.filter(q=>walkable(q.x,q.z)).map(q=>findPath(q.x,q.z)).find(path=>path.length&&path.every(q=>walkable(q.x,q.z))&&Math.hypot(path.at(-1).x-p.x,path.at(-1).z-p.z)<(p.radius||2.15));if(!path)throw Error('Unreachable '+id);return[id,path.length];}))`);
const miniatures=run(`(()=>{const all=[];for(let i=0;i<25;i++){const g=v4SeaFriendIsland('fake-'+i,{detail:.5});let meshes=0,triangles=0;g.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.material.vertexColors&&!o.geometry.attributes.color)throw Error('No terrain colors');for(const x of o.geometry.attributes.position.array)if(!Number.isFinite(x))throw Error('Nonfinite');}});if(!g.userData.boat)throw Error('No boat');all.push({meshes,triangles});}return{count:all.length,...all[0]};})()`);

run('var route=[],paused=false,passages={busy:false},canvas={focus(){},setPointerCapture(){}};');
run(scene.slice(scene.indexOf('  api.walkToPlace=function'),scene.indexOf('  const ambient=',scene.indexOf('  api.walkToPlace=function'))).replace('api.walkToPlace=','this.walkToPlace='));
for(const [fromX,fromZ]of[[0,4],[3,-3.3],[6.4,19.5],[-2,7.5]]){ctx.fromX=fromX;ctx.fromZ=fromZ;run('actor.position={x:fromX,z:fromZ};');for(const id of['write','review','talk','practice','archive','board','dock']){ctx.place=id;assert(run('walkToPlace(place)'),id+' from '+fromX+','+fromZ);assert(run('route.every(p=>walkable(p.x,p.z))'));}}
run('var hero=false,editing=null,pointers=new Map(),drag=null,pinchDist=0,yaw=0,pitch=.8,distance=32;');
run(scene.slice(scene.indexOf('  function down(e)'),scene.indexOf('  function movementKey(e)')));
run('var prevented=0;function event(x,y,button=1){return{pointerId:1,clientX:x,clientY:y,button,preventDefault(){prevented++;}}}down(event(10,10));move(event(70,40));up(event(70,40));');
assert(run('prevented===1&&yaw===-.36&&pitch===.92&&pointers.size===0&&drag===null'),'middle drag rotates and releases');
run('yaw=0;down(event(10,10,2));move(event(70,40,2));up(event(70,40,2));');assert.equal(run('yaw'),0,'right mouse ignored');
run('paused=true;down(event(10,10));move(event(70,40));');assert.equal(run('yaw'),0,'paused modal blocks rotation');
run('paused=false;auxclick(event(1,1));');assert.equal(run('prevented'),2,'middle browser action suppressed');
assert(fs.readFileSync(base+'friend-view.js','utf8').includes('api.current=v4CreateWorld('),'same scene for friend and home');
console.log(JSON.stringify({pass:true,compatibility,routes,miniatures,checks:['preserve old garden placements','all seven destinations reachable from spawn, desk, board and visitor dock','middle drag rotates yaw/pitch without click walking','release/right mouse/pause/auxclick guards','shared terrain and models for own and friend island','25 miniatures valid']},null,2));
