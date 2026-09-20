/* Actual r147 loader/instance geometry; textures stubbed in Node. Visual review is the isolated memory browser. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root='prototypes/island-world-v2/v4/',out='renders/releases/island-feedback-models-20260920/';
const m=JSON.parse(fs.readFileSync(out+'manifest.json')),base=out+'candidate/'+m.assetPath+'/',page=fs.readFileSync(out+'candidate/index.html','utf8');
const three=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.includes('WebGLRenderer')&&s.includes('t.REVISION=e'));
const models=JSON.parse(fs.readFileSync(root+'feedback-upgrade/models-manifest.json'));
const ctx=vm.createContext({console,URL,URLSearchParams,TextDecoder,TextEncoder,Blob,ArrayBuffer,Uint8Array,DataView,performance,setTimeout,clearTimeout,atob,location:{search:''}});
ctx.document={currentScript:{src:'http://local/'+m.assetPath+'/assets.js'},createElement:()=>({remove(){}}),head:{appendChild(tag){const rel=new URL(tag.src).pathname.slice(1);assert(rel.startsWith(m.assetPath+'/assets/models/'));vm.runInContext(fs.readFileSync(out+'candidate/'+rel,'utf8'),ctx);tag.onload();}}};
const run=s=>vm.runInContext(s,ctx);run('this.window=this;this.self=this;');run(three);run(fs.readFileSync(base+'GLTFLoader.r147.js','utf8'));
run('THREE.TextureLoader.prototype.load=function(url,onLoad){const t=new THREE.Texture();Promise.resolve().then(()=>onLoad(t));return t;};');
for(const n of['assets.js','scene.js','decor-model.js','decor-scene.js'])run(fs.readFileSync(base+n,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),dimensions=[];
(async()=>{
 const scene=fs.readFileSync(base+'scene.js','utf8');
 assert(!scene.includes("attach('talk-shell'"),'old shell is no longer mounted');
 for(const record of models){
  const id=record.assetId;ctx.assetId=id;
  assert(run('V4Assets.load(assetId)===V4Assets.load(assetId)'),'cached model');
  ctx.template=await run('V4Assets.load(assetId)');assert.equal(run('V4Assets.stats[assetId].state'),'ready');
  const size=ctx.template.size;
  assert.deepEqual([size.x,size.y,size.z].map(v=>+v.toFixed(6)),record.meshLocalBounds.size.map(v=>+v.toFixed(6)));
  let triangles=0;ctx.template.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert(o.geometry.userData.v4Shared);assert(o.geometry.attributes.uv);}});assert.equal(triangles,record.triangles);
  const match=scene.match(new RegExp("attach\\('"+id+"',\\w+,({[^}]+}),model=>"));assert(match,id+' scene binding');ctx.transform=run('('+match[1]+')');
  assert.equal(ctx.transform.y,run('v4Height(transform.x,transform.z)'),id+' terrain contact');
  ctx.instance=run('V4Assets.instance(template,transform)');const box=run('new THREE.Box3().setFromObject(instance)');
  assert(Math.abs(box.min.y-ctx.transform.y)<1e-6,id+' grounded');
  if(id==='talk-mailbox'){
   assert(Math.hypot(size.x,size.z)*ctx.transform.height/size.y/2<=1.15,'mailbox fits existing collision bounds');
   assert(run('Math.hypot(V4.stops.talk.x-transform.x,V4.stops.talk.z-transform.z)')>1.15+.24,'mailbox approach reachable');
  }else{
   const fallback=id==='tree-willow'?'willowFallback':'bonsaiFallback';
   assert(scene.includes('trees[trees.indexOf('+fallback+')]=model'),'canopy fades when it hides the player');
  }
  assert.equal(sha(fs.readFileSync(record.originalPath)),record.sourceSha256,'download original preserved');
  assert.equal(sha(fs.readFileSync(root+'feedback-upgrade/model-source/'+id+'.glb')),record.sourceSha256,'preserved source');
  assert.equal(sha(fs.readFileSync(root+'feedback-upgrade/model-runtime/'+id+'.glb')),record.runtimeSha256,'runtime provenance');
  dimensions.push({id,height:ctx.transform.height,width:+(box.max.x-box.min.x).toFixed(2),x:ctx.transform.x,z:ctx.transform.z,triangles});
 }
 console.log(JSON.stringify({pass:true,dimensions,checks:['three actual GLBs parse with shipped r147 loader; image decoding stubbed','source hashes preserved; shared geometry cached once','all models sit on terrain; mailbox fits its collision and approach','willow and bonsai join player visibility fading; shell no longer mounted']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
