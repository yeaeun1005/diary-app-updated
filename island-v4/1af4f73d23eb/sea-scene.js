/* Local V4 sea presentation only. Friend identities, public state and routes stay in SeaView. */
const V4_SEA_BEFORE=V4_QUERY.get('seaVisual')==='before';
function v4SeaDispose(root){
 root.traverse(o=>{o.userData.v4SeaDead=true;if(o.geometry&&!o.geometry.userData.v4Shared&&!o.geometry.userData.v2TreeShared&&!o.geometry.userData.v2BoardShared)o.geometry.dispose();
  if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{for(const t of Object.values(m))if(t?.isTexture&&t.userData.v4SeaOwned)t.dispose();m.dispose();});});
}
function v4SeaLights(scene,half,far){
 const T=THREE,key=new T.DirectionalLight('#fff0d1',1.2);key.position.set(-18,32,18);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-half,right:half,top:half,bottom:-half,near:1,far});key.shadow.normalBias=.035;key.shadow.bias=-.00015;scene.add(key,new T.HemisphereLight('#e0f1ed','#8c896c',.63));const fill=new T.DirectionalLight('#dcebe0',.23);fill.position.set(16,12,-20);scene.add(fill);return key;
}
function v4SeaTag(name,mine){
 const T=THREE,canvas=document.createElement('canvas');canvas.width=640;canvas.height=168;const c=canvas.getContext('2d');
 c.fillStyle=mine?'#deebd8':'#fff6e2';c.strokeStyle=mine?'#7caa92':'#caae80';c.lineWidth=5;c.beginPath();c.roundRect(6,6,628,140,38);c.fill();c.stroke();
 c.beginPath();c.moveTo(304,145);c.lineTo(320,164);c.lineTo(336,145);c.fill();
 const text=mine?'내 마음섬':name;let size=48;c.font='700 '+size+'px Maplestory,sans-serif';while(c.measureText(text).width>552&&size>20)c.font='700 '+(--size)+'px Maplestory,sans-serif';c.fillStyle=mine?'#426c58':'#635e4b';c.textAlign='center';c.textBaseline='middle';c.fillText(text,320,78,568);
 const tx=new T.CanvasTexture(canvas);tx.encoding=T.sRGBEncoding;tx.userData.v4SeaOwned=true;
 const tag=new T.Mesh(new T.PlaneGeometry(5.3,1.4),new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));tag.rotation.set(-.545,Math.PI/4,0,'YXZ');tag.position.y=4.4;tag.renderOrder=900;tag.frustumCulled=false;return tag;
}
function v4SeaSurface(tone,spots,time){
 const T=THREE,g=new T.Group(),t=Math.max(0,Math.min(1,tone??.5));
 const deep=new T.Color('#5297ac').lerp(new T.Color('#60b4b8'),t*.3),shallow=new T.Color('#96cfbf');
 const water=new T.MeshStandardMaterial({color:deep,roughness:.84,metalness:0});
 water.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{v4SeaTime:time,v4SeaDeep:{value:deep},v4SeaShallow:{value:shallow}});sh.vertexShader='varying vec3 v4SeaPos;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nv4SeaPos=(modelMatrix*vec4(transformed,1.)).xyz;');sh.fragmentShader='varying vec3 v4SeaPos;uniform float v4SeaTime;uniform vec3 v4SeaDeep,v4SeaShallow;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 p=v4SeaPos.xz;float swell=sin(p.x*.22+p.y*.32-v4SeaTime*.40)+sin(p.x*-.14+p.y*.24+v4SeaTime*.24)*.45;
 diffuseColor.rgb=v4SeaDeep*(1.+swell*.028);float ribbons=pow(max(0.,sin(p.x*.12+p.y*.18+sin(p.x*.07-v4SeaTime*.08)*1.3)),28.);
 diffuseColor.rgb=mix(diffuseColor.rgb,v4SeaShallow,ribbons*.075);`);};water.customProgramCacheKey=()=> 'v4-sea-water';
 const plane=new T.Mesh(new T.CircleGeometry(420,64),water);plane.rotation.x=-Math.PI/2;plane.position.y=-.04;plane.receiveShadow=true;g.add(plane);
 const mist=new T.MeshBasicMaterial({color:'#ade1cf',transparent:true,depthWrite:false,opacity:.25});mist.onBeforeCompile=sh=>{sh.vertexShader='varying vec2 v4SeaUv;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nv4SeaUv=uv;');sh.fragmentShader='varying vec2 v4SeaUv;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=1.-smoothstep(.38,.50,length(v4SeaUv-.5));');};mist.customProgramCacheKey=()=> 'v4-sea-shallows';
 const coast=new T.InstancedMesh(new T.CircleGeometry(11,48).rotateX(-Math.PI/2),mist,spots.length),m=new T.Matrix4();spots.forEach((p,i)=>coast.setMatrixAt(i,m.makeTranslation(p.x,-.005,p.z)));coast.frustumCulled=false;g.add(coast);g.userData.tone=t;g.userData.fogColor=deep.clone();return g;
}
function v4SeaFriendIsland(seed,options){const g=v4SeaOwnIsland(null,{miniature:true});v4CompactMiniature(g);g.userData.v4NewIsland=true;return g;}
function v4CompactMiniature(root){
 const T=THREE,groups=new Map(),parts=[];root.updateMatrixWorld(true);
 root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material.vertexColors)return;for(let p=o;p;p=p.parent)if(p===root.userData.boat)return;parts.push(o);});
 for(const o of parts){if(!groups.has(o.material))groups.set(o.material,{p:[],n:[],ix:[],count:0});const b=groups.get(o.material),count=o.isInstancedMesh?o.count:1;
  for(let j=0;j<count;j++){const matrix=o.matrixWorld.clone();if(o.isInstancedMesh){const instance=new T.Matrix4();o.getMatrixAt(j,instance);matrix.multiply(instance);}const geo=o.geometry.clone().applyMatrix4(matrix),p=geo.attributes.position,n=geo.attributes.normal;b.p.push(...p.array);b.n.push(...n.array);const indices=geo.index?geo.index.array:Array.from({length:p.count},(_,i)=>i);for(const k of indices)b.ix.push(k+b.count);b.count+=p.count;geo.dispose();}o.removeFromParent();
 }
 for(const[material,b]of groups){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geo.setIndex(b.ix);geo.computeBoundingSphere();root.add(new T.Mesh(geo,material));}
 // Source geometries are unique to this miniature; keep any still used by the retained boat.
 const keep=new Set();root.traverse(o=>{if(o.geometry)keep.add(o.geometry);});for(const geo of new Set(parts.map(o=>o.geometry)))if(!keep.has(geo))geo.dispose();
}
function v4SeaLearningPlants(state,seed){
 const T=THREE,g=new T.Group(),ball=new T.SphereGeometry(1,7,5),mats={},colors={HA:'#eeb29f',LA:'#84b9a0',HV:'#b0aec8',LV:'#d3c392'},zones={HA:[-9,-7],LA:[2,-8],HV:[-9,5],LV:[11,6]},items={};
 for(const e of state||[]){if(e.hidden)continue;const r=mulberry32(hashSeed(seed+':'+e.label)),z=zones[e.q]||zones.LA;for(let k=0;k<2;k++){const x=z[0]+(r()-.5)*3,zz=z[1]+(r()-.5)*2,c=colors[e.q]||colors.LA;if(!items[c])items[c]=[];const d=new T.Object3D();d.position.set(x*.28,(v4Height(x,zz)+.5)*.28,zz*.28);d.scale.set(.16,.20,.16);d.updateMatrix();items[c].push(d.matrix.clone());}}
 for(const[c,ms]of Object.entries(items)){const o=new T.InstancedMesh(ball,new T.MeshStandardMaterial({color:c,roughness:1}),ms.length);ms.forEach((m,i)=>o.setMatrixAt(i,m));o.frustumCulled=false;g.add(o);}return g;
}
function v4SeaBoat(){
 const T=THREE,g=new T.Group(),wood=new T.MeshStandardMaterial({color:'#be9461',roughness:.88}),cream=new T.MeshStandardMaterial({color:'#fff0cc',roughness:.92,side:T.DoubleSide}),dark=new T.MeshStandardMaterial({color:'#9d774c',roughness:.95});
 const hull=new T.Mesh(new T.SphereGeometry(1,20,12,0,Math.PI*2,Math.PI/2,Math.PI/2),wood);hull.scale.set(1.55,.5,.65);hull.material.side=T.DoubleSide;g.add(hull);
 const box=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);};
 box(2.4,.13,.90,0,-.02,0,dark);box(.32,.13,1.04,-.52,.2,0,wood);box(.09,2,.09,.28,1.03,0,dark);
 const s=new T.Shape();s.moveTo(.30,.45);s.lineTo(.30,1.97);s.quadraticCurveTo(1.24,1.10,1.13,.45);s.closePath();g.add(new T.Mesh(new T.ShapeGeometry(s,8),cream));g.userData.v4SeaBoat=true;return g;
}
function v4SeaOwnIsland(reward,options={}){
 const T=THREE,g=new T.Group(),S=.28,materials={},ball=new T.SphereGeometry(1,10,7),cube=new T.BoxGeometry(1,1,1),items=new Map();
 const mat=c=>materials[c]||(materials[c]=new T.MeshStandardMaterial({color:c,roughness:.94}));
 function add(shape,c,x,y,z,sx,sy,sz,parent=g){const o=new T.Mesh(shape,mat(c));o.position.set(x*S,y*S,z*S);o.scale.set(sx*S,sy*S,sz*S);parent.add(o);return o;}
 function put(c,x,y,z,sx,sy,sz){if(!items.has(c))items.set(c,[]);const o=new T.Object3D();o.position.set(x*S,y*S,z*S);o.scale.set(sx*S,sy*S,sz*S);o.updateMatrix();items.get(c).push(o.matrix.clone());}
 const land=new T.PlaneGeometry(60*S,52*S,options.miniature?24:54,options.miniature?22:46);land.rotateX(-Math.PI/2);const p=land.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i)/S,z=p.getZ(i)/S,r=v4Radius(x,z);p.setY(i,v4Height(x,z)*S);const c=new T.Color('#90af68');c.lerp(new T.Color('#dbc795'),v4Clamp((r-.74)/.15,0,1));colors.push(c.r,c.g,c.b);}land.setAttribute('color',new T.Float32BufferAttribute(colors,3));land.computeVertexNormals();g.add(new T.Mesh(land,new T.MeshStandardMaterial({vertexColors:true,roughness:1})));
 for(const pts of V4_PATHS){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],0,p[1]))),vs=[],ix=[];for(let i=0;i<=40;i++){const p=curve.getPoint(i/40),d=curve.getTangent(i/40);for(const side of [-1,1]){const x=p.x-d.z*.55*side,z=p.z+d.x*.55*side;vs.push(x*S,(v4WalkY(x,z)+.04)*S,z*S);}if(i<40){const j=i*2;ix.push(j,j+1,j+2,j+1,j+3,j+2);}}const path=new T.BufferGeometry();path.setAttribute('position',new T.Float32BufferAttribute(vs,3));path.setIndex(ix);path.computeVertexNormals();g.add(new T.Mesh(path,mat('#e2d0a6')));}
 add(new T.CylinderGeometry(1,1,.15,40),'#e9d6aa',0,v4Height(0,1),1,3.5,1,3.5);
 for(let i=0;i<60;i++){const a=i*Math.PI*2/60,x=Math.cos(a)*V4_ISLAND.coastX,z=Math.sin(a)*V4_ISLAND.coastZ;if(v4Dock(x,z))continue;put('#b9baa4',x,.15,z,.75,.6,.7);}
 function tree(x,z,s,c){const t=new T.Group();g.add(t);const y=v4Height(x,z);add(cube,'#9f7950',x,y+1.1*s,z,.4*s,2.2*s,.4*s,t);for(let k=0;k<4;k++){const a=k*2.4;add(ball,c,x+Math.sin(a)*.6*s,y+(2.4+(k===0?.6:0))*s,z+Math.cos(a)*.5*s,1*s,1.1*s,1*s,t);}return t;}
 const fallback=tree(3,-9,1.85,'#93b464');
 [[-9,-7,1.35,'#dca5b3'],[-12,-2,1.05,'#b293bd'],[-6,-10,1.05,'#a5bb82'],[9,-10,1.1,'#86b59c'],[14,4,.8,'#8cbbae'],[-16,3,1.25,'#9cb588'],[-14,-8,1.2,'#d8adb7'],[-9,11,1,'#b1a8bd'],[17,-8,1.12,'#8bb5a4'],[17,6,1.1,'#95b581']].forEach(p=>tree(...p));
 const dy=v4Height(3,-6.5);add(cube,'#d5af7a',3,dy+1.56,-6.5,3.8,.23,2.1);for(const x of [1.6,4.4])for(const z of [-7.2,-5.8])add(cube,'#b98d5f',x,dy+.8,z,.25,1.6,.25);
 const fakeBook=add(cube,'#fff0cb',3,dy+1.84,-6.5,1.8,.25,1.2);
 add(new T.CylinderGeometry(1,1,.18,28),'#d1aa78',11,v4Ground(11,-2.3)+.12,-2.3,2.7,1,2.7);
 const fakeScope=new T.Group();g.add(fakeScope);add(cube,'#b68f58',11,v4Ground(11,-2.3)+1,-2.3,.18,1.7,.18,fakeScope);add(ball,'#c8a56c',11,v4Ground(11,-2.3)+2,-2.3,1.1,.26,.26,fakeScope);
 const fakeBoard=add(cube,'#c49c6e',-3.8,v4Height(-3.8,8.7)+1.2,8.7,2.6,1.6,.25);
 for(let i=0;i<22;i++)add(cube,i%3?'#cda36e':'#d9b681',6.5,1.18,15.2+i*.3,2.8,.23,.29);
 for(const [x,z,c]of[[-8,-6,'#edbac1'],[-10,5,'#baa6ce'],[5,-8,'#f3dcaa'],[12,4,'#eee6cf']])for(let i=0;i<14;i++){const a=i*2.4,r=.5+Math.sqrt(i/14)*2.4;put(c,x+Math.cos(a)*r,v4Height(x,z)+.32,z+Math.sin(a)*r,.19,.22,.19);}
 for(const [c,ms]of items){const batch=new T.InstancedMesh(ball,mat(c),ms.length);ms.forEach((m,i)=>batch.setMatrixAt(i,m));batch.frustumCulled=false;g.add(batch);}
 // Batch fixed miniature pieces; asynchronous model fallbacks keep independent visibility.
 const protectedFallbacks=new Set([fallback,fakeBook,fakeScope,fakeBoard]),batches=new Map(),fixed=[];
 g.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||![ball,cube].includes(o.geometry))return;for(let p=o;p&&p!==g;p=p.parent)if(protectedFallbacks.has(p))return;fixed.push(o);});
 for(const o of fixed){const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,{geometry:o.geometry,material:o.material,matrices:[]});o.updateMatrix();batches.get(key).matrices.push(o.matrix.clone());o.removeFromParent();}
 for(const b of batches.values()){const mesh=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.frustumCulled=false;g.add(mesh);}
 function attach(id,fallback,transform){if(options.miniature)return;V4Assets.load(id).then(t=>{if(g.userData.v4SeaDead)return;const model=V4Assets.instance(t,transform);model.position.multiplyScalar(S);model.scale.setScalar(S);g.add(model);fallback.visible=false;}).catch(()=>{});}
 attach('tree',fallback,{height:8,x:3,y:v4Height(3,-9),z:-9});attach('book',fakeBook,{width:1.8,x:3,y:dy+1.71,z:-6.5,rotation:.12});attach('telescope',fakeScope,{height:2.9,x:11,y:v4Ground(11,-2.3)+.2,z:-2.3,rotation:.45});attach('board',fakeBoard,{width:2.6,x:-3.8,y:v4Height(-3.8,8.7),z:8.7});
 if(reward?.item&&reward.spot){const spot=V4Content.spots[reward.spot];if(spot){const object=v4BuildReward(T,reward.item);object.position.set(spot.x*S,v4Height(spot.x,spot.z)*S,spot.z*S);object.scale.setScalar(1.8*S);g.add(object);}}
 const boat=v4SeaBoat();boat.position.set(9.3*S,.10,21*S);g.add(boat);g.userData={...g.userData,boat,boatDir:Math.PI/2-.2,dockTh:Math.PI/2-.2,r:7.2,coast:()=>7.2};return g;
}
function v4SeaWake(){const T=THREE,g=new T.Group(),m=new T.MeshBasicMaterial({color:'#e4f4d9',transparent:true,opacity:.45,depthWrite:false});for(const side of [-1,1]){const path=new T.CatmullRomCurve3([new T.Vector3(-1,0,side*.3),new T.Vector3(-2.3,0,side*.65),new T.Vector3(-4.4,0,side*1.25)]);g.add(new T.Mesh(new T.TubeGeometry(path,16,.035,4,false),m));}g.visible=false;return g;}
