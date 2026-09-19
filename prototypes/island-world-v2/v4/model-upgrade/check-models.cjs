/* Actual r147 loader/instance geometry; textures stubbed in Node. Visual review is offline Blender. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root='prototypes/island-world-v2/v4/',out='renders/releases/six-models-20260920/';
const m=JSON.parse(fs.readFileSync(out+'manifest.json')),base=out+'candidate/'+m.assetPath+'/',page=fs.readFileSync(out+'candidate/index.html','utf8');
const three=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('WebGLRenderer')&&s.includes('t.REVISION=e'));
const models=JSON.parse(fs.readFileSync(root+'model-upgrade/manifest.json'));
const ctx=vm.createContext({console,URL,URLSearchParams,TextDecoder,TextEncoder,Blob,ArrayBuffer,Uint8Array,DataView,performance,setTimeout,clearTimeout,atob,location:{search:''}});
ctx.document={currentScript:{src:'http://local/'+m.assetPath+'/assets.js'},createElement:()=>({remove(){}}),head:{appendChild(tag){const rel=new URL(tag.src).pathname.slice(1);assert(rel.startsWith(m.assetPath+'/assets/models/'));vm.runInContext(fs.readFileSync(out+'candidate/'+rel,'utf8'),ctx);tag.onload();}}};
const run=s=>vm.runInContext(s,ctx);run('this.window=this;this.self=this;');run(three);run(fs.readFileSync(base+'GLTFLoader.r147.js','utf8'));
run('THREE.TextureLoader.prototype.load=function(url,onLoad){const t=new THREE.Texture();Promise.resolve().then(()=>onLoad(t));return t;};');
for(const n of['assets.js','scene.js','decor-model.js','decor-scene.js'])run(fs.readFileSync(base+n,'utf8'));
const dimensions=[];
(async()=>{
 for(const record of models){
  const id=record.assetId;ctx.assetId=id;
  assert.equal(run('V4Assets.load(assetId)===V4Assets.load(assetId)'),true,'cached load');
  const t=await run('V4Assets.load(assetId)');ctx.template=t;
  assert.equal(run('V4Assets.stats[assetId].state'),'ready');
  assert.deepEqual([t.size.x,t.size.y,t.size.z].map(n=>+n.toFixed(6)),record.meshLocalBounds.size.map(n=>+n.toFixed(6)));
  let triangles=0;t.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert(o.geometry.userData.v4Shared);assert(o.geometry.attributes.uv);}});assert.equal(triangles,record.triangles);
  let radius,transform;
  if(id.startsWith('decor-')){ctx.itemId=id.slice(6);radius=run('V4Decor.items[itemId].r');transform=run('V4Decor.items[itemId]');}
  else {
   const source=fs.readFileSync(base+'scene.js','utf8'),match=source.match(new RegExp("attach\\('"+id+"',\\w+,({[^}]+}),model=>outlineObject\\('([^']+)'"));assert(match,id+' activity binding');
   transform=run('('+match[1]+')');radius=({'talk-shell':1.15,'practice-compass':1,'journal-chest':.74})[id];
   ctx.action=match[2];ctx.tr=transform;assert(run('Math.hypot(V4.stops[action].x-tr.x,V4.stops[action].z-tr.z)')>radius+.24,'reachable interaction stop '+id);
  }
  const scale=transform.height?transform.height/t.size.y:transform.width/t.size.x;
  assert(radius>=Math.hypot(t.size.x,t.size.z)*scale/2,id+' rotation-safe footprint');
  ctx.transform={...transform,x:0,y:0,z:0,rotation:0};const instance=run('V4Assets.instance(template,transform)');ctx.instance=instance;
  const bounds=run('new THREE.Box3().setFromObject(instance)');assert(Math.abs(bounds.min.y)<1e-6,id+' grounded');
  dimensions.push({id,width:+((bounds.max.x-bounds.min.x).toFixed(2)),height:+((bounds.max.y-bounds.min.y).toFixed(2)),collisionRadius:radius});
  const source=fs.readFileSync(record.originalPath);assert.equal(crypto.createHash('sha256').update(source).digest('hex'),record.sourceSha256,'source untouched');
 }
 for(const id of['swing','lighthouse','flowerBoat']){ctx.itemId=id;const b=run('new THREE.Box3().setFromObject(v4DecorFallback(itemId,V4Decor.items[itemId]))');assert(Number.isFinite(b.min.y)&&b.max.y>0);}
 // Real deployed reducer + persistence module against an isolated transactional memory gateway.
 const saved=new Map();let fail=false;ctx.MEM_ONLY=false;ctx.d2Key=id=>'private/'+id;ctx.sGetStrict=async k=>saved.get(k)||null;
 ctx.dbRef=k=>({transaction:async updater=>{if(fail)throw Error('offline');const v=updater(saved.get(k)||null);saved.set(k,structuredClone(v));return{committed:true,snapshot:{val:()=>structuredClone(v)}};}});
 run(fs.readFileSync(base+'state.js','utf8'));run(fs.readFileSync(base+'persistence.js','utf8'));
 run('var me={id:"model-test-one",schoolCode:"LOCAL"},other={id:"model-test-two",schoolCode:"LOCAL"};');await run('V4Persistence.open(me)');
 for(const id of['bench','swing','lighthouse','flowerBoat']){ctx.itemId=id;const p=run('Object.keys(V4Decor.zones).map(z=>V4Decor.suggest(V4State.load(me),itemId,z)).find(p=>!V4Decor.reason(V4State.load(me),itemId,p))');assert(p,'placement '+id);ctx.place=p;await run('V4State.dispatch(me,{type:"decorate",id:itemId,placement:place})');}
 const before=run('JSON.stringify(V4State.load(me))');fail=true;await assert.rejects(run('V4State.dispatch(me,{type:"decorate",id:"swing",placement:null})'));assert.equal(run('JSON.stringify(V4State.load(me))'),before);fail=false;
 await run('V4Persistence.open(me)');assert.equal(run('JSON.stringify(V4State.load(me))'),before);
 await run('V4State.dispatch(me,{type:"decorate",id:"swing",placement:null})');assert.equal(run('V4Decor.placements(V4State.load(me)).swing'),undefined);
 await run('V4Persistence.open(other)');assert.equal(run('Object.keys(V4Decor.placements(V4State.load(other))).length'),0);
 const beforeHtml=fs.readFileSync(out+'before-work/index.html','utf8');assert.equal(page.split(m.assetPath+'/').join('island-v4/bc840ba1a34a/').replace('content="'+m.version+'"','content="bc840ba1a34a"').replace('<script src="island-v4/bc840ba1a34a/tutorial.js"></script><link rel="stylesheet" href="island-v4/bc840ba1a34a/tutorial.css">',''),beforeHtml,'auth/data/public-sharing HTML unchanged');
 console.log(JSON.stringify({pass:true,dimensions,checks:['all six actual GLBs parse with shipped r147 loader; image decoding stubbed','one cached template per asset; cloned instances grounded','footprints enclose every rotation; activity approach stays reachable','original downloads byte-identical','new props store/reopen, preserve old bench, failed write rollback and account isolation','production HTML adds only tutorial assets and versioned asset paths; no auth/privacy change']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
