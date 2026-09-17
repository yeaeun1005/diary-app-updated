/* Island World V2 — local prototype only. THREE r147 / existing React globals.
   No network, no production mount, no seed generator. All fixtures live in __DB. */
'use strict';
const V2 = { version:'coast-2', seed:'local-garden-self', speed:3.0, spawn:{x:-8,z:20}, camera:{yaw:-2.35,pitch:.65,distance:23},
  zones:[{key:'HA',name:'활기',sub:'꽃과 열매의 길',x:-6,z:-17,color:'#d29470'},
    {key:'LA',name:'평온',sub:'물빛이 쉬어 가는 정원',x:17,z:-4,color:'#799981'},
    {key:'LV',name:'슬픔',sub:'흰 꽃과 작은 등불',x:10,z:17,color:'#9a9bbb'},
    {key:'HV',name:'떨림',sub:'바람을 듣는 언덕',x:-21,z:0,color:'#819baf'}],
  stops:{dock:{x:-7,z:27,title:'바다로',action:'sea'}, court:{x:-5,z:9,title:'중앙 마당'}, board:{x:-8,z:0,title:'우리 반 게시판',action:'board'}, garden:{x:17,z:-5,title:'평온 정원'}, dive:{x:17,z:6,title:'내 안으로',action:'diary'}} };
const V2_ME = {id:'local-v2-self',name:'탐험이',schoolCode:'LOCALV2',schoolName:'로컬 연습 학급'};
const V2_QUERY = new URLSearchParams(location.search);
const V2_EMPTY = V2_QUERY.get('empty') === '1';
const V2_HITS = ['HA','LA','LV','HV'].flatMap(q=>EMOTIONS_28.filter(e=>e.q===q).slice(0,2));
const V2_ENTRIES = V2_EMPTY ? [] : [{ts:1700000000000,date:'2023-11-14',text:'로컬 시제품의 가상 마음 기록',analysis:safeAnalysis({hits:V2_HITS.map(e=>({label:e.label,q:e.q,valStd:(e.val-5)/4,aroStd:(e.aro-5)/4}))})}];
let V2_SESSION = null;
const V2_SESSIONS={};
let V2_QUALITY=V2_QUERY.get('quality')==='low'?'low':'standard';
const V2_AUTH={student:{schoolCode:V2_ME.schoolCode,loginId:'explorer',password:crypto.randomUUID().replaceAll('-','').slice(0,16),role:'student'},teacher:{schoolCode:'',loginId:'local-teacher',password:crypto.randomUUID().replaceAll('-','').slice(0,16),role:'teacher'}};
async function v2Fixtures(){
  if(typeof __DB !== 'object' || !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) throw Error('Memory harness required');
  const code=V2_ME.schoolCode, qid='local-question';
  const p={cur:V2_QUERY.get('board')==='none'?null:qid,q:{[qid]:{t:'오늘 내 마음이 잠깐 편안해졌던 순간은 언제였나요?',cat:'자기 이해',nm:true,open:true,ts:1700000000000}},a:{[qid]:{}},pub:{[qid]:{}},n:{[qid]:{}}};
  const bodies=['창가에서 바람을 느낄 때 마음이 차분해졌어요.','어려운 문제를 친구와 같이 풀어서 든든했어요.','쉬는 시간에 하늘을 보니 한결 편안했어요.'];
  const n=V2_QUERY.get('board')==='few'?2:3;
  for(let i=0;i<n;i++){const id='local-peer-'+i,ak=anonKey(id);p.pub[qid][ak]={o:bodies[i],f:'',w:'',fl:[]};p.n[qid][ak]=1;}
  __set('app/plaza/'+code,p);
  const roster=[{...V2_ME,loginId:V2_AUTH.student.loginId},...['모래','여울','산호'].map((name,i)=>({id:'local-peer-'+i,name,schoolCode:code}))];
  __set('app/'+stuKey(code),roster);
  const moods=[null,[['신남',false],['희열',false],['편안',false],['우울',true]],[],[['편안',false],['슬픔',false],['긴장',false],['희열',true]]];
  roster.forEach((st,i)=>{const v={};const words=i===0?islandState(V2_ENTRIES):moods[i].map(([label,hidden])=>({...EMOTIONS_28.find(e=>e.label===label),hidden}));words.forEach(h=>v[labelKey(h.label)]={l:h.label,q:h.q,vs:0,as:0,h:!!h.hidden});__set('app/'+isleKey(st.id),{name:st.name,code,v});});
  await sSet(schPubKey(code),{schoolName:V2_ME.schoolName});
  const sh=await pwHash('s',code,V2_AUTH.student.loginId,V2_AUTH.student.password);
  await credSetStudent(code,V2_AUTH.student.loginId,sh);
  const th=await pwHash('t','',V2_AUTH.teacher.loginId,V2_AUTH.teacher.password);
  await sSet(tcredKey(V2_AUTH.teacher.loginId,th),{schoolCode:code,schoolName:V2_ME.schoolName,teacherName:'연습 선생님'});
  await d2Update(V2_ME.id,{_migrated:true});
  for(const entry of V2_ENTRIES)await d2Put(V2_ME.id,entry);
}
const V2_READY=v2Fixtures();
const v2Clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function v2Pond(x,z){const dx=x-9,dz=z;return Math.sqrt(dx*dx/29+dz*dz/79)*(1+.06*Math.sin(Math.atan2(dz,dx)*5));}
function v2Radius(x,z){const a=Math.atan2(z/29,x/34);return Math.sqrt(x*x/1156+z*z/841)/(1+.07*Math.sin(a*3+.5)+.036*Math.sin(a*7)-.18*Math.exp(-(((a-.62)/.30)**2)));}
function v2Height(x,z){
  const r=v2Radius(x,z),shore=v2Clamp((1-r)/.13,0,1);
  const base=1.18+.17*Math.sin(x*.15)*Math.cos(z*.18)+1.5*Math.exp(-((x+20)**2+(z+6)**2)/95)+.55*Math.exp(-((x+2)**2+(z+19)**2)/120);
  let y=-.35+(base+.35)*(shore*shore*(3-2*shore));
  const p=v2Pond(x,z);if(p<1.19){const t=v2Clamp((p-.86)/.33,0,1);y=.12+(y-.12)*t*t*(3-2*t);}
  return y;
}
const V2_BRIDGE={x0:2.5,x1:15.4,z:-3,half:1.0};
function v2BridgeY(x,z){const b=V2_BRIDGE;if(x>=b.x0&&x<=b.x1&&Math.abs(z-b.z)<b.half){const t=(x-b.x0)/(b.x1-b.x0);return 1.34+1.05*Math.sin(t*Math.PI);}return null;}
function v2Dock(x,z){return x>-8.45&&x<-5.55&&z>23&&z<31;}
function v2WalkY(x,z){const b=v2BridgeY(x,z);return b!==null?b:v2Dock(x,z)?1.2:Math.hypot(x+5,z-9)<3.1?v2Height(-5,9)+.075:v2Height(x,z);}
function v2BaseWalk(x,z){return v2BridgeY(x,z)!==null||v2Dock(x,z)||(v2Radius(x,z)<.94&&v2Pond(x,z)>1.08&&v2Height(x,z)>.5);}
const V2_PATHS=[ [[-7,27],[-7,19],[-5,12],[-5,8],[-7,3],[-8,0]], [[-8,0],[-3,-3],[2.5,-3]],[[15.4,-3],[17,-5],[20,0],[17,6],[15,12],[10,17],[2,17],[-5,12]], [[-8,0],[-12,-6],[-7,-15],[-1,-19],[6,-17],[15,-12],[17,-5]], [[-8,0],[-16,3],[-21,0],[-22,-8],[-16,-15],[-7,-15]] ];
function v2CreateWorld(host,state,callbacks,saved,options={}){
  const started=performance.now(), T=THREE; T.ColorManagement.legacyMode=false; const scene=new T.Scene();scene.background=new T.Color('#8fcedc');scene.fog=new T.Fog('#8fcedc',65,155);
  const low=(options.quality||V2_QUALITY)==='low',isGuest=!!options.friend,hero=!!options.hero,worldSeed=options.islandId||V2.seed;
  if(hero){scene.fog.near=145;scene.fog.far=310;}
  const ren=new T.WebGLRenderer({antialias:!low,alpha:false});ren.setPixelRatio(Math.min(devicePixelRatio,low?1:1.5));ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=.90;ren.shadowMap.enabled=!low;ren.shadowMap.type=T.PCFSoftShadowMap;
  host.appendChild(ren.domElement);ren.domElement.setAttribute('aria-label','마음 섬 3D 산책 공간');ren.domElement.tabIndex=hero?-1:0;if(hero)ren.domElement.setAttribute('aria-hidden','true');
  const cam=new T.PerspectiveCamera(38,1,.1,hero?400:180), clock=new T.Clock(), random=mulberry32(hashSeed(V2.seed));
  const hemi=new T.HemisphereLight('#d5edf0','#7c8660',.55);scene.add(hemi);
  const sun=new T.DirectionalLight('#fff3db',1.55);sun.position.set(-24,37,18);sun.castShadow=!low;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-43,right:43,top:43,bottom:-43,near:1,far:110});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;scene.add(sun);
  const fill=new T.DirectionalLight('#d2e7df',.35);fill.position.set(16,14,-25);scene.add(fill);
  const mats={},geo={ball:new T.SphereGeometry(1,14,10),rock:new T.IcosahedronGeometry(1,2),box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(.72,1,1,9),petal:new T.SphereGeometry(1,6,4)};
  const crownGeo=geo.ball.clone();{const p=crownGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.038*Math.sin(x*7+z*5)*Math.cos(y*6-z*3);p.setXYZ(i,x*n,y*n,z*n);}crownGeo.computeVertexNormals();}
  const batches=new Map(),colliders=[], trees=[],growth=[];
  const mat=(col,rough=1)=>mats[col]||(mats[col]=new T.MeshStandardMaterial({color:col,roughness:rough}));
  function put(g,col,x,y,z,sx=1,sy=1,sz=1,rot=0){const key=g+'|'+col; if(!batches.has(key))batches.set(key,[]);const dummy=new T.Object3D();dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.y=rot;dummy.updateMatrix();batches.get(key).push(dummy.matrix.clone());}
  function mesh(g,m,x,y,z){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
  function beam(a,b,r,col){const d=new T.Vector3().subVectors(b,a),o=mesh(new T.CylinderGeometry(r*.86,r,d.length(),8),mat(col),...(a.clone().add(b).multiplyScalar(.5).toArray()));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
  // One continuous terrain; the rendered surface and navigation use v2Height.
  const g=new T.PlaneGeometry(80,74,160,148);g.rotateX(-Math.PI/2);const pos=g.attributes.position,colors=[];
  const sand=new T.Color('#e6c58a'),grass=new T.Color('#65a34b'),dirt=new T.Color('#92ad52'),deep=new T.Color('#b0c2a5');
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=v2Height(x,z);pos.setY(i,y);const r=v2Radius(x,z),p=v2Pond(x,z);let c=grass.clone();c.lerp(dirt,(Math.sin(x*.32+Math.sin(z*.2))*Math.cos(z*.36)+1)*.1);if(r>.73)c.lerp(sand,v2Clamp((r-.73)/.13,0,1));if(p<1.21)c.lerp(sand,v2Clamp((1.21-p)/.18,0,.85));if(y<.2)c.copy(deep);const n=(Math.sin(x*5.6+z*3.1)+Math.sin(z*7.2-x*2.1))*.007;c.offsetHSL(0,0,n);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const land=mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.98}),0,0,0);land.castShadow=false;
  // Water uses small world-space waves, restrained glints, and a shallow shoreline.
  const waterTime={value:0};
  const waterMat=v2WaterMaterial({time:waterTime,coast:true});
  const water=mesh(new T.PlaneGeometry(380,380),waterMat,0,0,0);water.rotation.x=-Math.PI/2;water.castShadow=false;water.receiveShadow=true;
  const pondGeo=new T.CircleGeometry(1,90);pondGeo.rotateX(-Math.PI/2);const pp=pondGeo.attributes.position;for(let i=1;i<pp.count;i++){const a=Math.atan2(pp.getZ(i),pp.getX(i)),m=1/(1+.06*Math.sin(a*5));pp.setXYZ(i,pp.getX(i)*5.7*m,0,pp.getZ(i)*9.3*m);}const pondMat=v2WaterMaterial({time:waterTime,pond:true});const pond=mesh(pondGeo,pondMat,9,.64,0);pond.castShadow=false;pond.receiveShadow=true;
  // Paths are ribbons draped on the same terrain, with a scattering of inset stones.
  const pathSamples=[];
  for(const pts of V2_PATHS){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],0,p[1]))),samples=curve.getPoints(100);pathSamples.push(...samples);const vs=[],cs=[],ix=[];
    samples.forEach((p,i)=>{const d=curve.getTangent(i/100),nx=-d.z,nz=d.x,width=1.05+.09*Math.sin(i*.6);for(const side of [-1,1]){const x=p.x+nx*width*side,z=p.z+nz*width*side;vs.push(x,v2Height(x,z)+.026,z);const c=new T.Color(side<0?'#b9a887':'#c6b996');cs.push(c.r,c.g,c.b);}if(i<100){let k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}});
    const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(vs,3));pg.setAttribute('color',new T.Float32BufferAttribute(cs,3));pg.setIndex(ix);pg.computeVertexNormals();const path=mesh(pg,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),0,0,0);path.castShadow=false;
    for(let i=3;i<samples.length;i+=5){const p=samples[i],d=curve.getTangent(i/100);for(let side of [-1,1]){const x=p.x-d.z*.54*side,z=p.z+d.x*.54*side;put('rock',i%2?'#cec3a7':'#c4b99a',x,v2Height(x,z)+.045,z,.35,.055,.28,random()*3);}}
  }
  function nearPath(x,z,pad=1.65){return pathSamples.some(p=>(p.x-x)**2+(p.z-z)**2<pad*pad)||(x>-1&&x<16&&Math.abs(z+3)<1.8);}
  function tree(x,z,size=1,kind='oak',record){const y=v2Height(x,z);if(v2Radius(x,z)>.88)return;colliders.push({x,z,r:.36*size,kind:'tree'});const palette=kind==='willow'?['#579451','#3d7a49','#83ae59']:['#42823d','#77a847','#2a6c3a'];
    put('cyl','#8b7253',x,y+1.3*size,z,.25*size,2.6*size,.25*size);
    // A tapered trunk with spreading branch forks and asymmetrical soft crowns.
    beam(new T.Vector3(x,y+1.2*size,z),new T.Vector3(x+.72*size,y+2.6*size,z-.3*size),.1*size,'#8b7253');
    const crown=new T.Group();scene.add(crown);crown.userData.center=new T.Vector3(x,y+3.1*size,z);trees.push(crown);
    for(let k=0;k<7;k++){const a=k*2.4,rr=k===0?0:.62*size,c=new T.Mesh(crownGeo,mat(palette[k%3]).clone());c.position.set(x+Math.sin(a)*rr,y+(k===0?3.9:3.1+(k%2)*.3)*size,z+Math.cos(a)*rr);c.scale.set((k===0?.83:.94)*size,(kind==='willow'?1.25:1.02)*size,.83*size);c.castShadow=true;c.receiveShadow=true;crown.add(c);}
    if(record)growth.push({x,z,label:record.label,q:record.q});
  }
  function shrub(x,z,s=1,col='#7f995e'){const y=v2Height(x,z);for(let k=0;k<3;k++)put('ball',col,x+(k-1)*.28*s,y+.32*s,z+Math.sin(k*3)*.2,.42*s,.4*s,.37*s);}
  function rock(x,z,s=.5){const y=v2Height(x,z);put('rock','#a6aba0',x,y+.29*s,z,.65*s,.45*s,.52*s,random()*6);colliders.push({x,z,r:.45*s,kind:'rock'});}
  function flower(x,z,scale=1,col='#e6d4bd'){const y=v2Height(x,z),h=.33*scale;put('cyl','#627e52',x,y+h*.5,z,.018,h,.018);put('petal','#819655',x+.06*scale,y+h*.45,z,.1*scale,.025,.042,1);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;put('petal',col,x+Math.cos(a)*.075*scale,y+h,z+Math.sin(a)*.075*scale,.087*scale,.034*scale,.055*scale,a);}put('ball','#dfb75e',x,y+h+.02,z,.036*scale,.024,.036*scale);}
  function flowers(cx,cz,n,col,spread=1.2){for(let i=0;i<n;i++){const a=random()*6.28,r=Math.sqrt(random())*spread,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(v2BaseWalk(x,z)&&!nearPath(x,z,1.05))flower(x,z,.85+random()*.65,col);}}
  function lantern(x,z,h=1.7){const y=v2Height(x,z);put('cyl','#806d4d',x,y+h*.5,z,.065,h,.065);put('box','#77694c',x,y+h,z,.3,.08,.3);put('box','#e9dca3',x,y+h+.24,z,.24,.4,.24);put('cyl','#6b775b',x,y+h+.5,z,.23,.15,.23);for(const dx of [-.14,.14])for(const dz of [-.14,.14])put('box','#6b775b',x+dx,y+h+.23,z+dz,.025,.46,.025);}
  function bench(x,z,rot){const y=v2Height(x,z),group=new T.Group();group.position.set(x,y,z);group.rotation.y=rot;scene.add(group);function b(w,h,d,xx,yy,zz,col){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat(col));o.position.set(xx,yy,zz);o.castShadow=true;group.add(o);}for(let i=0;i<4;i++)b(2.2,.12,.16,0,.55,(i-1.5)*.18,'#b5a17a');for(let i=0;i<3;i++)b(2.2,.16,.11,0,.85+i*.2,-.42,'#b5a17a');for(let xx of [-.82,.82]){b(.12,.6,.7,xx,.28,0,'#69765c');b(.12,1.15,.12,xx,.62,-.42,'#69765c');}colliders.push({x,z,r:1.15,kind:'bench'});}
  // Bridge: walk surface and visual arch share exactly the same function.
  for(let i=0;i<=38;i++){const x=V2_BRIDGE.x0+(V2_BRIDGE.x1-V2_BRIDGE.x0)*i/38,y=v2BridgeY(x,-3);put('box',i%3?'#bb9b70':'#c5a879',x,y-.095,-3,.32,.19,1.98);if(i%5===0){for(let z of [-4.05,-1.95]){put('cyl','#8e7555',x,y+.45,z,.065,.9,.065);put('ball','#d0b486',x,y+.92,z,.09,.075,.09);}}}
  for(let zz of [-4.05,-1.95])for(let i=0;i<38;i++){const x=V2_BRIDGE.x0+(V2_BRIDGE.x1-V2_BRIDGE.x0)*i/38,nx=V2_BRIDGE.x0+(V2_BRIDGE.x1-V2_BRIDGE.x0)*(i+1)/38;beam(new T.Vector3(x,v2BridgeY(x,-3)+.78,zz),new T.Vector3(nx,v2BridgeY(nx,-3)+.78,zz),.055,'#977c59');}
  // Dock and small moored boat.
  for(let i=0;i<27;i++)put('box',i%4?'#ad9069':'#c4a781',-7,1.08,23+i*.3,2.9,.24,.28);
  for(let z of [24,27,30])for(let x of [-8.25,-5.75]){put('cyl','#7f7254',x,.45,z,.12,2.15,.12);put('cyl','#bfa981',x,1.62,z,.17,.13,.17);}
  const boat=new T.Group();boat.position.set(-3.7,.28,29.2);boat.rotation.y=.2;scene.add(boat);const hull=new T.Mesh(new T.SphereGeometry(1,20,12,0,Math.PI*2,Math.PI/2,Math.PI/2),mat('#a88357'));hull.scale.set(.9,.55,2.1);boat.add(hull);const inside=new T.Mesh(new T.SphereGeometry(1,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2),mat('#d1b989'));inside.scale.set(.77,.38,1.85);inside.position.y=.12;inside.material.side=T.DoubleSide;hull.material.side=T.DoubleSide;hull.castShadow=true;boat.add(inside);for(let z of [-.75,.5]){const seat=new T.Mesh(new T.BoxGeometry(1.5,.12,.34),mat('#b39b73'));seat.position.set(0,.07,z);boat.add(seat);}
  // Center courtyard, board pavilion. Signs contain no question or answer text.
  const court=mesh(new T.CylinderGeometry(3.15,3.25,.14,48),mat('#c6b997'),-5,v2Height(-5,9)+.005,9);court.castShadow=false;
  for(let i=0;i<16;i++){let a=i*6.28/16;put('rock','#e5dbc0',-5+Math.cos(a)*3.1,v2Height(-5,9)+.08,9+Math.sin(a)*3.1,.27,.1,.2,a);}
  function sign(x,z,text,subtitle='마음을 나누는 작은 자리'){const y=v2Height(x,z);for(let dx of [-1,1])put('cyl','#8c7553',x+dx,y+1.0,z,.09,2,.09);put('box','#897450',x,y+1.72,z,2.4,1.24,.2);put('box','#c6b28c',x,y+1.72,z+.12,2.18,1.04,.045);const cv=document.createElement('canvas');cv.width=768;cv.height=256;const c=cv.getContext('2d');c.fillStyle='#f0e8cf';c.fillRect(0,0,768,256);c.fillStyle='#49665a';c.font='bold 62px Maplestory, sans-serif';c.textAlign='center';c.fillText(text,384,142);c.font='26px sans-serif';c.fillText(subtitle,384,205);const tx=new T.CanvasTexture(cv);tx.encoding=T.sRGBEncoding;const o=mesh(new T.PlaneGeometry(2.05,.74),new T.MeshBasicMaterial({map:tx}),x,y+1.76,z+.15);o.castShadow=false;if(text==='우리 반 바다'){const back=mesh(new T.PlaneGeometry(2.05,.74),o.material,x,y+1.76,z-.15);back.rotation.y=Math.PI;back.castShadow=false;}colliders.push({x,z,r:1.25,kind:'board'});}
  sign(-8,-1.6,'우리 반 게시판');
  sign(-4,22,'우리 반 바다','부두에서 배를 타요');
  // Rounded shelter roof and notice slips on the rear make the back view intentional.
  put('box','#70896d',-8,v2Height(-8,-1.6)+2.52,-1.6,3.05,.22,1.05);put('box','#f0e7cb',-8.35,v2Height(-8,-1.6)+1.65,-1.74,.48,.62,.02);put('box','#d9d7ae',-7.7,v2Height(-8,-1.6)+1.68,-1.74,.45,.55,.02);
  bench(-12,1,.65);lantern(-10,2.5);lantern(-2,6,1.5);
  // Dive entrance: a stone-rimmed inlet, ladder and a hand-built timber arch.
  const dx=17,dz=7.8,dy=v2Height(dx,dz);const basin=mesh(new T.CylinderGeometry(1.35,1.5,.12,48),mat('#577f7c'),dx,dy+.08,dz);basin.castShadow=false;
  for(let i=0;i<13;i++){const a=i*6.283/13;put('rock','#c4c4ad',dx+Math.sin(a)*1.47,dy+.18,dz+Math.cos(a)*1.47,.42,.28,.32,a);}
  if(!isGuest){for(let xx of [16.55,17.45])put('cyl','#b79b72',xx,dy+.6,6.7,.05,1.2,.05);for(let y=.25;y<1.2;y+=.23)put('box','#cbb38a',17,dy+y,6.7,.9,.055,.08);}else{for(let k=-2;k<=2;k++)put('box','#af9776',17+k*.44,dy+.25,7.8,.40,.12,2.3);put('box','#566c64',17,dy+.39,7.8,.3,.25,.2);}
  for(let xx of [15,19])put('cyl','#9b8360',xx,dy+1.75,7.8,.1,3.5,.1);beam(new T.Vector3(15,dy+3.4,7.8),new T.Vector3(19,dy+3.4,7.8),.13,'#9b8360');lantern(15,6.2,1.7);colliders.push({x:17,z:7.8,r:1.7,kind:'basin'});
  // Composed landmark trees, planted borders, ferns and stone edges.
  const placements=[[-15,6,1.3],[-14,-4,1.12],[-3,-8,1.23],[1,-15,1.55],[13,-15,1.12],[21,-8,1.25],[22,3,1.2],[24,10,1.0],[16,15,.95],[2,21,1.15],[-15,17,1.15],[-22,12,1.3],[-25,-4,1.1],[-18,-17,1.4],[-5,-23,1.3],[22,-17,1.1],[27,-3,1.2]];
  placements.forEach(([x,z,s],i)=>tree(x,z,s,i%3===0?'willow':'oak'));
  // A waterside grove, with space to see and walk between the trunks.
  tree(16,-9,1.45,'willow');bench(20,-5,-1.15);lantern(15.8,-6.5,1.8);lantern(2.1,-5.2,1.55);lantern(15.5,-.7,1.55);
  for(const [x,z,n,c,s] of [[19,-10,52,'#f1e5c8',2.2],[19,-1,42,'#e7d8ce',1.6],[15,-12,40,'#d2cadc',1.6],[-10,3,32,'#f1e5c8',1.2],[-2,7,28,'#ecd6af',1.1],[-11,-4,35,'#dcc5b7',1.3],[22,7,36,'#f1e5c8',1.6],[-3,16,30,'#e8dcc4',1.4]])flowers(x,z,n,c,s);
  for(let i=0;i<45;i++){const a=random()*6.28,r=1.14+random()*.08,x=9+Math.cos(a)*5.9*r,z=Math.sin(a)*9*r;if(nearPath(x,z,1.6)||Math.abs(z+3)<1.5)continue;rock(x,z,.25+random()*.45);if(i%3===0)shrub(x+.3,z,.6,'#849e75');}
  // Low, layered planting drifts guide the eye along the first garden route.
  for(const [x,z,n,c,spread] of [[1,3,42,'#d1bed6',1.4],[2,6,40,'#dfb1b0',1.25],[-1,1,38,'#eee5c8',1.25],[4,-7,34,'#d6c19d',1.0],[17,-11,44,'#e7d7ca',1.3],[21,-2,36,'#c6bfdb',1.1],[12,11,35,'#dfc2b0',1.2]]){flowers(x,z,n,c,spread);shrub(x-.8,z+.5,.65,'#789665');}
  // Lily pads are quiet details in the pond, distinct from vocabulary plants.
  for(let i=0;i<12;i++){const x=10.8+Math.sin(i*2.4)*1.3,z=3+Math.cos(i*2.4)*2.5;put('ball','#789a77',x,.667,z,.24,.018,.2,i);if(i%4===0){for(let j=0;j<5;j++)put('petal','#e1b9b3',x+Math.sin(j*1.256)*.06,.705,z+Math.cos(j*1.256)*.06,.075,.03,.038,j);}}
  // Neutral landscape is clearly distinct from record-linked growth.
  for(let i=0;i<250;i++){const x=(random()-.5)*65,z=(random()-.5)*53;if(!v2BaseWalk(x,z)||v2Radius(x,z)>.88||nearPath(x,z,2.15)||colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.8))continue;const y=v2Height(x,z);if(i%5===0)shrub(x,z,.7+random()*.45);else if(i%7===0)rock(x,z,.25+random()*.5);else for(let k=0;k<4;k++){const a=random()*6.28;put('petal','#859e67',x+Math.cos(a)*.14,y+.15,z+Math.sin(a)*.14,.035,.24,.05,a);}}
  // Neutral coast scenery: never counted as learning plants.
  const coastLeaves={};
  function palm(x,z,size=1){
    const y=v2Height(x,z);if(y<.25||nearPath(x,z,1.5))return;
    colliders.push({x,z,r:.38*size,kind:'palm'});
    const top=new T.Vector3(x+.7*size,y+4.2*size,z+.15*size);
    for(let i=0;i<5;i++){const t=i/5,nt=(i+1)/5,a=new T.Vector3(x+.7*size*t*t,y+4.2*size*t,z+.15*size*t),b=new T.Vector3(x+.7*size*nt*nt,y+4.2*size*nt,z+.15*size*nt),d=b.clone().sub(a),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()),r=(.16-.055*t)*size,key='cyl|#a17746';if(!batches.has(key))batches.set(key,[]);batches.get(key).push(new T.Matrix4().compose(a.add(b).multiplyScalar(.5),q,new T.Vector3(r,d.length(),r)));}
    for(let k=0;k<7;k++){
      const angle=k*Math.PI*2/7,vs=[],idx=[];
      for(let i=0;i<=10;i++){const t=i/10,l=t*2.6*size,w=Math.sin(Math.PI*t)*.42*size,yy=top.y+Math.sin(t*Math.PI)*.48*size-t*t*.8*size;
        for(const side of [-1,0,1])vs.push(top.x+Math.cos(angle)*l-Math.sin(angle)*w*side,yy-Math.abs(side)*.14*size,top.z+Math.sin(angle)*l+Math.cos(angle)*w*side);
        if(i<10){const j=i*3;idx.push(j,j+3,j+1,j+1,j+3,j+4,j+1,j+4,j+2,j+2,j+4,j+5);}}
      const col=k%2?'#27744b':'#4d9546',buffer=coastLeaves[col]||(coastLeaves[col]={vs:[],idx:[]}),offset=buffer.vs.length/3;buffer.vs.push(...vs);buffer.idx.push(...idx.map(i=>i+offset));
    }
    for(let i=0;i<3;i++)put('ball','#8b603d',top.x+Math.cos(i*2.1)*.18,top.y-.15,top.z+Math.sin(i*2.1)*.18,.17,.21,.17);
  }
  for(const p of [[-15,21,1.15],[-2,24,.95],[17,19,1.1],[-28,4,1.1],[24,-15,1.1]])palm(...p);
  for(const [col,b] of Object.entries(coastLeaves)){const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(b.vs,3));pg.setIndex(b.idx);pg.computeVertexNormals();const pm=mat(col).clone();pm.side=T.DoubleSide;mesh(pg,pm,0,0,0);}
  for(const [x,z,sc] of [[-22,19,2.0],[-25,16,1.4],[25,13,2.1],[23,16,1.3],[29,-10,1.7],[-29,-8,1.8]]){
    if(v2Height(x,z)>.1){rock(x,z,sc);rock(x+sc*.55,z+.3,sc*.6);}}
  // Sparse shell clusters, salt grass and weathered driftwood leave the beach open.
  for(let i=0;i<90;i++){const a=random()*6.28,r=.84+random()*.085,x=Math.cos(a)*34*r,z=Math.sin(a)*29*r;if(v2Radius(x,z)<.8||!v2BaseWalk(x,z)||nearPath(x,z,1.6))continue;
    const y=v2Height(x,z);if(i%3===0){put('petal','#faf1d7',x,y+.05,z,.12,.055,.095,a);put('petal','#f0bfa2',x+.2,y+.04,z+.1,.09,.04,.07,a);}
    else for(let k=0;k<4;k++)put('petal','#829d49',x+k*.055,y+.18,z,.025,.27,.05,k*.8);
  }
  // Distant rocky outcrops are scenery, not additional student islands.
  for(const [x,z,sc] of [[-37,48,3.3],[28,49,4.2],[55,11,2.8]]){put('rock','#527f7d',x,.4,z,sc,sc*.48,sc*.6);put('rock','#75966d',x-.5,1.0,z-.3,sc*.57,sc*.37,sc*.4);}
  // Coral marker on the pier: easy to spot without floating text.
  put('cyl','#86643c',-8.2,2.6,29.5,.07,2.8,.07);put('box','#e97b54',-7.72,3.55,29.5,.95,.55,.025);
  // Stable per-label slots: all 30 vocabulary labels reserve three slots in their own region.
  // Slots are independent of list order/count; additions never move existing vocabulary.
  const allSlots={};for(const zone of V2.zones){const words=EMOTIONS_28.filter(e=>e.q===zone.key);words.forEach((em,wi)=>{const rr=mulberry32(hashSeed(worldSeed+':'+em.label));allSlots[em.label]=[];for(let k=0;k<3;k++){let found=null;for(let n=0;n<180;n++){const a=rr()*6.283,r=2+rr()*6,x=zone.x+Math.cos(a)*r,z=zone.z+Math.sin(a)*r;if(v2BaseWalk(x,z)&&v2Radius(x,z)<.87&&!nearPath(x,z,1.6)&&!colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.6)&&!Object.values(allSlots).flat().some(p=>Math.hypot(p.x-x,p.z-z)<.75)){found={x,z};break;}}if(found)allSlots[em.label].push(found);}});}
  state.forEach(em=>{(allSlots[em.label]||[]).forEach((p,k)=>{growth.push({...p,label:em.label,q:em.q,key:labelKey(em.label),kind:k,top:v2Height(p.x,p.z)+(em.q==='LA'?1.8:.6)});const y=v2Height(p.x,p.z);if(em.q==='LA'){if(k===0)shrub(p.x,p.z,.8,'#779c86');else tree(p.x,p.z,.45,'willow');}else if(em.q==='HA'){flowers(p.x,p.z,9,k===0?'#e9b19f':'#e4c58b',.44);}else if(em.q==='LV'){if(k===2)lantern(p.x,p.z,.7);else if(k===1)flowers(p.x,p.z,8,'#f4ebd6',.42);else for(let j=0;j<5;j++){put('cyl','#8c9671',p.x+j*.065,y+.5,p.z,.016,1,.016);put('cyl','#b2a17f',p.x+j*.065,y+1,p.z,.033,.2,.033);}}else rock(p.x,p.z,.55+.18*k);put('rock','#d6c99c',p.x,y+.04,p.z,.34,.055,.28);});});

  // Batch repeated small meshes; foliage stays separate for camera occlusion fading.
  for(const [key,ms] of batches){const [gn,col]=key.split('|'),o=new T.InstancedMesh(geo[gn],mat(col),ms.length);ms.forEach((m,i)=>o.setMatrixAt(i,m));o.castShadow=gn!=='petal';o.receiveShadow=true;scene.add(o);}
  const actor=buildExplorerCharacter();actor.scale.setScalar(1.4);actor.userData.step(0,false,V2.camera.yaw);scene.add(actor);const validSaved=saved&&saved.version===V2.version&&v2BaseWalk(saved.x,saved.z),pos0=validSaved?saved:V2_QUERY.get('compare')==='1'&&!isGuest?{x:-4,z:8}:isGuest?{x:-7,z:26}:V2.spawn;actor.position.set(pos0.x,v2WalkY(pos0.x,pos0.z),pos0.z);
  let yaw=saved?.yaw??V2.camera.yaw,pitch=saved?.pitch??V2.camera.pitch,distance=saved?.distance??V2.camera.distance,follow=actor.position.clone(),keys={},pointers=new Map(),drag=null,pinchDist=0,route=[],paused=false,raf,disposed=false,lastUI=0,frameTimes=[],frameSum=0,frameN=0,nearest=null,passageZoom=1;
  if(V2_QUERY.get('compare')==='1'&&!validSaved&&!isGuest){yaw=-.45;pitch=.68;distance=22;}
  const ray=new T.Raycaster(),ndc=new T.Vector2();let inputVec={x:0,z:0};const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function walkable(x,z){if(x>=V2_BRIDGE.x0&&x<=V2_BRIDGE.x1&&Math.abs(z+3)>.72&&Math.abs(z+3)<1.5)return false;return v2BaseWalk(x,z)&&!colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+.24);}
  function findPath(tx,tz){const step=.7,key=(x,z)=>x+','+z,start=[Math.round(actor.position.x/step),Math.round(actor.position.z/step)],end=[Math.round(tx/step),Math.round(tz/step)],queue=[{x:start[0],z:start[1],g:0,f:0}],seen=new Map([[key(...start),{g:0}]]);let last=null;
    for(let n=0;n<18000&&queue.length;n++){queue.sort((a,b)=>a.f-b.f);const cur=queue.shift();if(Math.hypot(cur.x-end[0],cur.z-end[1])<1.3){last=cur;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){let x=cur.x+dx,z=cur.z+dz;if(Math.abs(v2WalkY(x*step,z*step)-v2WalkY(cur.x*step,cur.z*step))>.18+Math.hypot(dx,dz)*step*.8||!walkable(x*step,z*step)||!walkable((cur.x+dx*.5)*step,(cur.z+dz*.5)*step)||!walkable((cur.x+dx)*step,cur.z*step)||!walkable(cur.x*step,(cur.z+dz)*step))continue;const g=cur.g+Math.hypot(dx,dz),k=key(x,z);if(seen.has(k)&&seen.get(k).g<=g)continue;const next={x,z,g,f:g+Math.hypot(x-end[0],z-end[1]),parent:cur};seen.set(k,next);queue.push(next);}}
    const out=[];while(last&&last.parent){out.unshift({x:last.x*step,z:last.z*step});last=last.parent;}return out;
  }
  const ffRes=ffResources();let ffGroup=null,flights=[];
  function setEmpathy(records){if(ffGroup){scene.remove(ffGroup);ffGroup.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}ffGroup=buildFireflies(fireflySpots(records,growth),ffRes);if(ffGroup)scene.add(ffGroup);}
  function flyEmpathy(p,done){if(reduced){done();return;}const g=new T.Group();g.add(new T.Mesh(ffRes.coreGeo,ffRes.coreMat),new T.Mesh(ffRes.haloGeo,ffRes.haloMat));g.scale.setScalar(2.5);const from=actor.position.clone().add(new T.Vector3(0,2.1,0)),to=new T.Vector3(p.x,p.top+.2,p.z),mid=from.clone().lerp(to,.5).add(new T.Vector3(.6,2,0));scene.add(g);flights.push({g,from,to,mid,t:0,done});}
  const passages=v2CreatePassages({scene,actor,boat,host,walkY:v2WalkY,walkable,findPath,snapshot:()=>({version:V2.version,x:actor.position.x,z:actor.position.z,yaw,pitch,distance}),reduced,onState:callbacks.motion,onComplete:a=>{clear();callbacks.open(a);}});
  function interact(action){if(hero||paused||passages.busy)return;clear();if(isGuest&&action==='diary'){callbacks.open('private');return;}passages.begin(action);}
  function clear(){keys={};inputVec={x:0,z:0};pointers.clear();drag=null;pinchDist=0;route=[];}
  const canvas=ren.domElement;
  function down(e){if(hero||paused||passages.busy||e.button>0)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};if(pointers.size===2){const a=[...pointers.values()];pinchDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);drag.moved=true;}}
  function move(e){if(!pointers.has(e.pointerId)||paused||passages.busy)return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDist)distance=v2Clamp(distance*pinchDist/d,10,30);pinchDist=d;drag.moved=true;return;}const dx=e.clientX-prev.x,dy=e.clientY-prev.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;if(drag.moved){yaw-=dx*.006;pitch=v2Clamp(pitch+dy*.004,.42,1.13);}}
  function up(e){if(!pointers.has(e.pointerId))return;const clicked=drag&&!drag.moved&&pointers.size===1;pointers.delete(e.pointerId);pinchDist=0;if(clicked&&!paused&&!passages.busy){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);const hits=ray.intersectObject(land);if(hits[0])route=findPath(hits[0].point.x,hits[0].point.z);}if(!pointers.size)drag=null;else{const p=[...pointers.values()][0];drag={startX:p.x,startY:p.y,moved:true};}}
  function wheel(e){if(paused||passages.busy)return;e.preventDefault();distance=v2Clamp(distance+e.deltaY*.018,10,30);}
  function keydown(e){if(hero)return;if(e.key==='Escape'&&passages.busy){passages.cancel();return;}if(paused||passages.busy||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)||e.target.isContentEditable)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright',' '].includes(k)){e.preventDefault();keys[k]=true;route=[];}if(k==='e'&&nearest)interact(nearest.action);}
  function keyup(e){delete keys[e.key.toLowerCase()];}
  function resize(){const w=host.clientWidth||800,h=host.clientHeight||600;ren.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',clear);canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
  const api={interact,setEmpathy,flyEmpathy,walkToGrowth(){if(paused||passages.busy)return;const choices=[];for(const p of growth)for(let i=0;i<12;i++){const a=i*Math.PI/6,x=p.x+Math.cos(a)*1.15,z=p.z+Math.sin(a)*1.15;if(walkable(x,z))choices.push({x,z,d:Math.hypot(x-actor.position.x,z-actor.position.z)});}choices.sort((a,b)=>a.d-b.d);for(const p of choices.slice(0,24)){const path=findPath(p.x,p.z);const last=path[path.length-1]||actor.position,steps=Math.max(1,Math.ceil(Math.hypot(last.x-p.x,last.z-p.z)/.15));let clearEnd=true,prev=last;for(let j=1;j<=steps;j++){const x=last.x+(p.x-last.x)*j/steps,z=last.z+(p.z-last.z)*j/steps;if(!walkable(x,z)||Math.abs(v2WalkY(x,z)-v2WalkY(prev.x,prev.z))>.18+Math.hypot(x-prev.x,z-prev.z)*.8){clearEnd=false;break;}prev={x,z};}if(clearEnd){path.push({x:p.x,z:p.z});route=path;canvas.focus({preventScroll:true});return true;}}return false;},skipPassage:()=>passages.skip(),cancelPassage:()=>passages.cancel(),pause(v){if(v)passages.cancel();paused=v;clear();if(!v)passages.clearWash();},reset(){({yaw,pitch,distance}=V2.camera);},rotate(d){yaw+=d;},tilt(d){pitch=v2Clamp(pitch+d,.42,1.13);},zoom(d){distance=v2Clamp(distance+d,10,30);},stick(x,z){inputVec=(paused||passages.busy)?{x:0,z:0}:{x,z};route=[];},walkTo(stop){if(paused||passages.busy)return 0;route=findPath(stop.x,stop.z);canvas.focus({preventScroll:true});return route.length;},snapshot(){return passages.safeSnapshot()||{version:V2.version,x:actor.position.x,z:actor.position.z,yaw,pitch,distance};},info(){return {revision:T.REVISION,position:actor.position.toArray(),yaw,pitch,distance,paused,route:route.length,drawCalls:ren.info.render.calls,triangles:ren.info.render.triangles,growth: growth.length,words:state.length,slots:allSlots,frameMs:frameN?frameSum/frameN:0,fps:frameN?1000/(frameSum/frameN):0,readyMs:performance.now()-started};},walkable,findPath,stop:clear};
  const marker=mesh(new T.RingGeometry(.22,.32,32),new T.MeshBasicMaterial({color:'#f8edd0',transparent:true,opacity:.8,side:T.DoubleSide}),0,0,0);marker.rotation.x=-Math.PI/2;marker.castShadow=false;
  let heroFrame=0;if(hero){ren.shadowMap.autoUpdate=false;ren.shadowMap.needsUpdate=true;}
  function tick(){if(disposed)return;raf=requestAnimationFrame(tick);if(hero){const now=performance.now();if(now-heroFrame<32)return;heroFrame=now;}const rawDt=clock.getDelta(),dt=document.hidden?0:Math.min(rawDt,.04),t=clock.elapsedTime;if(!paused&&rawDt<.25){frameSum+=rawDt*1000;frameN++;}let vx=0,vz=0,moving=false;
    if(!paused&&!passages.busy){let ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+inputVec.x,iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+inputVec.z;vx=ix*Math.cos(yaw)+iz*Math.sin(yaw);vz=-ix*Math.sin(yaw)+iz*Math.cos(yaw);if(!ix&&!iz&&route.length){const goal=route[0],dx=goal.x-actor.position.x,dz=goal.z-actor.position.z;if(Math.hypot(dx,dz)<.22)route.shift();else{vx=dx;vz=dz;}}const l=Math.hypot(vx,vz),strength=(route.length||Object.values(keys).some(Boolean))?1:Math.min(1,Math.hypot(inputVec.x,inputVec.z));if(l>.01){vx=vx/l*V2.speed*dt*strength;vz=vz/l*V2.speed*dt*strength;let x=actor.position.x,z=actor.position.z;const can=(nx,nz)=>walkable(nx,nz)&&Math.abs(v2WalkY(nx,nz)-actor.position.y)<.18+Math.hypot(nx-x,nz-z)*.8;if(can(x+vx,z+vz)){actor.position.x+=vx;actor.position.z+=vz;moving=true;}else{if(can(x+vx,z)){actor.position.x+=vx;moving=true;}if(can(actor.position.x,z+vz)){actor.position.z+=vz;moving=true;}}}actor.position.y=v2WalkY(actor.position.x,actor.position.z);}
    if(passages.busy)passages.tick(dt,t);else actor.userData.step(t,moving,moving?Math.atan2(vx,vz):null);
    passageZoom+=(passages.zoom-passageZoom)*(1-Math.exp(-dt*6));
    follow.lerp(passages.focus||actor.position,reduced?1:1-Math.exp(-dt*7));const target=follow.clone().add(new T.Vector3(0,1.1,0)),viewDistance=distance*passageZoom,horizontal=Math.cos(pitch)*viewDistance;cam.position.set(target.x+Math.sin(yaw)*horizontal,target.y+Math.sin(pitch)*viewDistance,target.z+Math.cos(yaw)*horizontal);cam.position.y=Math.max(cam.position.y,v2Height(cam.position.x,cam.position.z)+1.8);cam.lookAt(target);if(hero){actor.visible=false;cam.position.set(-49,58,78);cam.lookAt(0,1,0);}
    // Canopies soften when they intersect the view toward the child. The original silhouette also remains.
    const line=cam.position.clone().sub(target),len=line.length();line.normalize();for(const tr of trees){const v=tr.userData.center.clone().sub(target),along=v.dot(line),dist=v.addScaledVector(line,-along).length(),fade=!hero&&along>0&&along<len&&dist<2.3;tr.children.forEach(o=>{o.material.transparent=fade||o.material.opacity<.99;o.material.opacity+=( (fade?.25:1)-o.material.opacity)*Math.min(1,dt*8);o.material.depthWrite=o.material.opacity>.85;});}
    waterTime.value=reduced?0:t;if(!passages.busy)boat.position.y=.28+(reduced?0:Math.sin(t*.8)*.04);marker.visible=route.length>0;if(route.length){const dest=route[route.length-1];marker.position.set(dest.x,v2WalkY(dest.x,dest.z)+.08,dest.z);}
    if(ffGroup)ffGroup.userData.at(reduced?0:t);for(let i=flights.length-1;i>=0;i--){const f=flights[i];f.t+=dt;const u=Math.min(1,f.t/.85),v=1-u;f.g.position.copy(f.from).multiplyScalar(v*v).addScaledVector(f.mid,2*v*u).addScaledVector(f.to,u*u);if(u===1){scene.remove(f.g);flights.splice(i,1);f.done();}}
    ren.render(scene,cam);
    if(t-lastUI>.18){lastUI=t;nearest=null;let best=3.6;for(const s of Object.values(V2.stops)){if(!s.action)continue;const d=Math.hypot(actor.position.x-s.x,actor.position.z-s.z);if(d<best){best=d;nearest=s;}}
      const zoneNear=V2.zones.reduce((a,b)=>Math.hypot(actor.position.x-a.x,actor.position.z-a.z)<Math.hypot(actor.position.x-b.x,actor.position.z-b.z)?a:b);const zone=actor.position.z>19?{name:'바람 부두',sub:isGuest?'내 섬으로 돌아가는 배가 기다려요':'바다 건너, 친구의 마음 섬으로'}:v2Radius(actor.position.x,actor.position.z)>.76?{name:'모래 해안',sub:'물결을 따라 천천히 걸어요'}:Math.hypot(actor.position.x+5,actor.position.z-7)<10?{name:'마음 마당',sub:'나의 이야기가 시작되는 곳'}:{...zoneNear,name:zoneNear.name+' 숲길'};const nearGrowth=growth.find(g=>Math.hypot(g.x-actor.position.x,g.z-actor.position.z)<1.85);
      host.dataset.v2Metrics=JSON.stringify({quality:low?'low':'standard',island:options.islandId||'self',hero,x:actor.position.x,z:actor.position.z,y:actor.position.y,transition:passages.status,yaw,pitch,distance,paused,inputX:inputVec.x,inputZ:inputVec.z,route:route.length,calls:ren.info.render.calls,triangles:ren.info.render.triangles,fps:frameN?1000/(frameSum/frameN):0,frameMs:frameN?frameSum/frameN:0,readyMs:api.readyMs,words:state.length,growth:growth.length,slotCounts:Object.fromEntries(Object.entries(allSlots).map(([k,v])=>[k,v.length]))});callbacks.update?.({zone,nearest,nearGrowth,x:actor.position.x,z:actor.position.z,walking:route.length>0});}
  }
  tick();api.readyMs=performance.now()-started;
  host.dataset.v2Routes=JSON.stringify(Object.fromEntries([...Object.entries(V2.stops),...V2.zones.map(z=>[z.key,z])].map(([k,p])=>{const path=findPath(p.x,p.z);return [k,{steps:path.length,valid:path.every(p=>walkable(p.x,p.z)),crossesBridge:path.some(p=>v2BridgeY(p.x,p.z)!==null)}]})));
  api.dispose=()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();clear();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',clear);canvas.removeEventListener('wheel',wheel);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);if(m.map)textures.add(m.map);});});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());ffRes.dispose();ren.dispose();canvas.remove();};
  return api;
}
const v2h=React.createElement;
function V2Joystick({onMove,paused}){
  const base=useRef(null),knob=useRef(null),active=useRef(null),moveRef=useRef(onMove);moveRef.current=onMove;
  function stop(){active.current=null;if(knob.current)knob.current.style.transform='translate(0px,0px)';if(base.current)base.current.dataset.active='false';moveRef.current(0,0);}
  function move(e){if(paused||active.current!==e.pointerId)return;const r=base.current.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,l=Math.hypot(dx,dz),radius=r.width*.31,f=Math.min(1,radius/Math.max(l,.01));knob.current.style.transform=`translate(${dx*f}px,${dz*f}px)`;moveRef.current(l<radius*.14?0:dx*f/radius,l<radius*.14?0:dz*f/radius);}
  useEffect(()=>{if(paused)stop();},[paused]);
  useEffect(()=>{window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};},[]);
  return v2h('div',{className:'v2-joystick-wrap'},v2h('div',{ref:base,className:'v2-joystick',role:'group','aria-label':'이동 조이스틱',onPointerDown:e=>{if(paused||active.current!==null)return;e.preventDefault();active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.dataset.active='true';move(e);},onPointerMove:move,onPointerUp:e=>{if(active.current===e.pointerId)stop();},onPointerCancel:stop,onLostPointerCapture:stop},v2h('span',{className:'v2-stick-axis','aria-hidden':true},'✧'),v2h('span',{ref:knob,className:'v2-stick-knob','aria-hidden':true})),v2h('small',null,'밀어서 걷기'));
}
function V2World({state,onOpen,panel,profile=V2_ME,friend=null,myState=state,onLogout,onHidden}){
  const isFriend=!!friend;
  const [quality,setQuality]=useState(V2_QUALITY),[records,setRecords]=useState([]),[socialReady,setSocialReady]=useState(false),[notice,setNotice]=useState(''),[sending,setSending]=useState(false),[justSent,setJustSent]=useState({});
  const alive=useRef(true);
  const host=useRef(null),api=useRef(null),openRef=useRef(onOpen);openRef.current=onOpen;
  const [ui,setUI]=useState({zone:{name:'바람 부두',sub:'바다 건너, 친구의 마음 섬으로'},x:V2.spawn.x,z:V2.spawn.z});
  const [motion,setMotion]=useState(null);
  const [mapOpen,setMapOpen]=useState(()=>innerWidth>700);
  const [help,setHelp]=useState(false),[guide,setGuide]=useState(false),[failed,setFailed]=useState('');
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{try{api.current=v2CreateWorld(host.current,state,{open:a=>openRef.current(a),update:setUI,motion:setMotion},V2_SESSIONS[profile.id],{friend,islandId:isFriend?profile.id:undefined,quality});window.__V2=api.current;return()=>{V2_SESSIONS[profile.id]=api.current.snapshot();api.current.dispose();delete window.__V2;};}catch(e){console.error('V2 renderer:',e);setFailed('3D 화면을 열지 못했어요. 아래 바로가기를 이용해 주세요.');}},[state,profile.id,quality]);
  useEffect(()=>{api.current?.pause(!!panel||help);},[panel,help,state,quality]);
  useEffect(()=>{let active=true;setSocialReady(false);empLoad(profile.id).then(list=>{if(active){setRecords(list);setSocialReady(true);}}).catch(()=>{if(active)setNotice('마음 연결을 불러오지 못했어요. 다시 방문해 주세요.');});return()=>{active=false;};},[profile.id]);
  useEffect(()=>{api.current?.setEmpathy(records);},[records,state,quality]);
  async function send(){const p=ui.nearGrowth;if(!p||sending||!socialReady)return;setSending(true);setNotice('');try{const result=await v2SendEmpathy(V2_ME,friend,p.label);if(!alive.current)return;if(result.status==='sent-now'){setJustSent(m=>({...m,[dayStamp()+':'+p.label]:true}));setNotice('작은 반딧불에 마음을 담아 보냈어요.');api.current?.flyEmpathy(p,()=>{if(alive.current)setRecords(result.records);});}else setNotice(result.status==='sent'?'이 마음에는 오늘 이미 보냈어요.':result.status==='private'?'지금은 공개되지 않은 마음이에요.':'같은 쪽 마음을 기록해 본 뒤에 보낼 수 있어요.');}catch(e){if(alive.current)setNotice('보내지 못했어요. 잠시 후 다시 눌러 주세요.');}finally{if(alive.current)setSending(false);}}
  async function hide(){const p=ui.nearGrowth;if(!p||sending)return;setSending(true);try{const hidden=!(state.find(e=>e.label===p.label)?.hidden);await isleHide(V2_ME,p.label,hidden);if(alive.current){onHidden?.(p.label,hidden);setNotice(hidden?'내 섬에는 그대로, 친구에게는 보이지 않아요.':'친구에게 다시 보이는 마음이에요.');}}catch(e){if(alive.current)setNotice('변경하지 못했어요. 다시 눌러 주세요.');}finally{if(alive.current)setSending(false);}}
  useEffect(()=>{if(!help)return;const onKey=e=>{if(e.key==='Escape')setHelp(false);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[help]);
  function button(text,label,fn,cls){return v2h('button',{onClick:fn,'aria-label':label||text,className:cls||'',type:'button'},text);}
  return v2h('main',{className:'v2-world'+(motion?' v2-busy':'')},
    v2h('div',{className:'v2-canvas',ref:host}),
    v2h('div',{className:'v2-vignette'}),
    v2h('div',{className:'v2-passage-wash','aria-hidden':true}),
    motion&&v2h('div',{className:'v2-passage-shield'},v2h('div',{className:'v2-passage-caption'},v2h('p',{role:'status'},({approach:motion.action==='sea'?'부두 끝으로 걸어가요':'잠수 입구로 걸어가요',boarding:'배에 올라요',sailing:isFriend?'내 섬으로 돌아가요':'친구들의 바다로 출발해요',diving:'내 마음속으로, 풍덩!',splash:'물결 아래, 나의 이야기'})[motion.phase]),button('바로 들어가기',null,()=>api.current?.skipPassage()),button('취소',null,()=>api.current?.cancelPassage()))),
    v2h('header',{className:'v2-header'},v2h('div',{className:'v2-emblem','aria-hidden':true},'⚓'),v2h('div',null,v2h('small',null,'마음 바다 탐험대'),v2h('h1',null,profile.name+'의 마음 섬'))),
    v2h('div',{className:'v2-local'},v2h('i'), '로컬 연습 공간 · 기록은 이 창에만'),
    v2h('nav',{className:'v2-shortcuts','aria-label':'마음 활동 바로가기'},!isFriend&&button('✎  내 안으로',null,()=>onOpen('diary')),button('▤  우리 반 게시판',null,()=>onOpen('board')),button('⚑  부두로 걷기',null,()=>api.current?.walkTo(V2.stops.dock)),!isFriend&&onLogout&&button('처음으로',null,onLogout)),
    v2h('section',{className:'v2-location'},v2h('span',{className:'v2-eyebrow'},'오늘의 산책'),v2h('h2',null,ui.zone.name),v2h('p',null,ui.zone.sub)),
    button(mapOpen?'지도 접기':'섬 지도',null,()=>{setMapOpen(!mapOpen);setGuide(false);},'v2-map-toggle'),
    mapOpen&&v2h('aside',{className:'v2-map'},v2h('div',{className:'v2-map-title'},isFriend?'친구 섬 지도':'나의 섬 지도',v2h('small',null,'구역은 섬에 고정돼요')),
      v2h('svg',{viewBox:'0 0 140 118','aria-label':'활기 북쪽, 평온 동쪽, 슬픔 남쪽, 떨림 서쪽'},
        v2h('path',{d:Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2,x=Math.cos(a)*34,z=Math.sin(a)*29,r=.94/v2Radius(x,z);return (i?'L':'M')+(70+x*r*1.5).toFixed(1)+' '+(57+z*r*1.4).toFixed(1);}).join(' ')+' Z',fill:'#9bac84',stroke:'#c8d6b8',strokeWidth:5}),
        v2h('ellipse',{cx:87,cy:52,rx:9,ry:19,fill:'#87baba'}),
        v2h('path',{d:'M56 101 L59 75 L53 53 L78 45 L99 45 L107 70 M53 53 L42 42 L56 24 L78 20 L101 31 L99 45 M53 53 L30 59 L24 40',stroke:'#f0e5c7',strokeWidth:3,fill:'none'}),
        V2.zones.map(z=>v2h('text',{key:z.key,x:70+z.x*1.5,y:57+z.z*1.4,textAnchor:'middle',fill:'#43594d',fontSize:10},z.name)),
        v2h('circle',{cx:70+ui.x*1.5,cy:57+ui.z*1.4,r:4,fill:'#fff9e6',stroke:'#567964',strokeWidth:2})),
      isFriend?v2h('p',null,'공개한 마음이 풍경이 돼요'):v2h('p',null,'마음 말 ',v2h('strong',null,state.length),'가지가 자라고 있어요'),button(guide?'산책 안내 접기':'길을 따라 둘러보기',null,()=>setGuide(!guide),'v2-text-button')),
    guide&&v2h('div',{className:'v2-guide'},v2h('strong',null,'어디로 걸어갈까요?'),[...Object.values(V2.stops),...V2.zones.map(z=>({...z,title:z.name+' 구역'}))].map(s=>button(s.title,null,()=>{api.current?.walkTo(s);setGuide(false);})),state.length>0&&button('마음이 자란 곳으로 걷기',null,()=>{if(!api.current?.walkToGrowth())setNotice('주변의 마음 식물에 가까이 걸어가 보세요.');setGuide(false);})),
    v2h('div',{className:'v2-controls'},v2h('div',{className:'v2-camera'},button('↶','시점 왼쪽 회전',()=>api.current?.rotate(-Math.PI/4)),button('↷','시점 오른쪽 회전',()=>api.current?.rotate(Math.PI/4)),v2h('span',{className:'v2-divider'}),button('−','축소',()=>api.current?.zoom(2)),button('+','확대',()=>api.current?.zoom(-2)),button('⌂  기본 시점',null,()=>api.current?.reset()),button('?','조작 도움말',()=>setHelp(true)))),
    v2h('div',{className:'v2-movement-hint'},'W A S D / 방향키로 걷기',v2h('span',null,'·'), '드래그로 둘러보기',v2h('span',null,'·'),'길을 누르면 걸어가요'),
    v2h(V2Joystick,{paused:!!panel||help||!!motion,onMove:(x,z)=>api.current?.stick(x,z)}),
    v2h('div',{className:'v2-touch-look'},'오른쪽 화면을 밀어',v2h('br'),'둘러보세요'),
    ui.nearest&&!panel&&!motion&&v2h('button',{className:'v2-interact',onClick:()=>api.current?.interact(ui.nearest.action)},v2h('kbd',null,'E'),isFriend&&ui.nearest.action==='sea'?'내 섬으로':isFriend&&ui.nearest.action==='diary'?'친구의 안으로':ui.nearest.title,ui.nearest.action==='sea'?' · 배 타기':isFriend&&ui.nearest.action==='diary'?' · 잠겨 있어요':' · 열기'),
    ui.nearGrowth&&!ui.nearest&&!panel&&!motion&&v2h('div',{className:'v2-growth'},v2h('strong',null,'✧ ',ui.nearGrowth.label),v2h('small',null,emoMeaning(ui.nearGrowth.label)||'기록에서 자란 마음 말'),isFriend?(()=>{const rule=justSent[dayStamp()+':'+ui.nearGrowth.label]?'sent':v2EmpathyRule(V2_ME,friend,state,myState,records,ui.nearGrowth.label);return v2h('button',{className:'v2-empathy-button',disabled:!socialReady||sending||rule!=='ready',onClick:send},sending?'마음을 보내는 중…':rule==='sent'?'이 마음에는 오늘 이미 보냈어요':rule==='unfamiliar'?'같은 쪽 마음을 기록하면 보낼 수 있어요':'✧ 나도 그래');})():v2h('button',{className:'v2-empathy-button',disabled:sending,onClick:hide},state.find(e=>e.label===ui.nearGrowth.label)?.hidden?'친구에게 다시 보이게':'친구에게 안 보이게')),
    notice&&!panel&&v2h('div',{className:'v2-notice',role:'status'},notice,button('×','안내 닫기',()=>setNotice(''))),
    isFriend&&!panel&&v2h('div',{className:'v2-visitor'},'친구의 마음 섬을 산책 중',v2h('small',null,'친구의 일기와 숨긴 마음은 열리지 않아요.')),
    failed&&v2h('div',{className:'v2-failure',role:'alert'},failed),
    help&&v2h('div',{className:'v2-modal-shade'},v2h('section',{className:'v2-help',role:'dialog','aria-modal':true,'aria-label':'조작 도움말'},v2h('h2',null,'천천히, 내 마음을 산책해요'),v2h('p',null,'방향키 또는 WASD로 걸어요. 길을 한 번 누르면 그곳까지 걸어갑니다.'),v2h('p',null,'휴대폰은 왼쪽 아래 조작을 밀어 걸어요. 오른쪽 화면을 밀면 둘러보고, 두 손가락을 벌리면 확대돼요.'),v2h('p',null,'화면을 드래그하면 좌우 360°·위아래로 둘러볼 수 있어요. 휠이나 두 손가락으로 거리를 조절해요.'),v2h('p',null,'기본 시점은 지금 서 있는 곳에서 카메라만 돌려놓아요. 게시판을 닫아도 서 있던 곳과 시점이 그대로예요.'),v2h('p',null,'정원의 기본 풍경과 내 기록에서 자란 식물은 달라요. 기록 식물 가까이에서는 마음 말이 표시돼요.'),v2h('div',{className:'v2-quality'},v2h('strong',null,'화면이 느리게 느껴지나요?'),v2h('p',null,'가벼운 화질은 그림자와 화면 해상도를 낮춰요. 기록과 이동 범위는 같아요.'),['standard','low'].map(q=>v2h('button',{key:q,'aria-pressed':quality===q,onClick:()=>{V2_QUALITY=q;setQuality(q);}},q==='standard'?'표준 화질':'가벼운 화질'))),button('산책 계속하기',null,()=>setHelp(false),'v2-primary'))));
}
function V2App({initialEntries=V2_ENTRIES,me=V2_ME,onLogout}={}){
  const [view,setView]=useState('world'),[panel,setPanel]=useState(null),[entries,setEntries]=useState(initialEntries),[state,setState]=useState(()=>islandState(initialEntries)),[friend,setFriend]=useState(null),[seaFrom,setSeaFrom]=useState(null);
  const [visitError,setVisitError]=useState('');
  useEffect(()=>{let active=true;isleLoad(me.id).then(r=>{if(active)setState(r.state);});return()=>{active=false;};},[me.id]);
  async function visit(info){setPanel(null);setVisitError('');setView('loading');try{const r=await isleLoad(info.id);setFriend({id:info.id,name:info.name,state:v2PublicState(r.state)});setView('friend');}catch(e){setVisitError('친구 섬을 불러오지 못했어요. 다시 선택해 주세요.');setView('sea');}}
  async function sync(e,all){await isleSync(V2_ME,islandState([e]));await dayMark(V2_ME,all);const s=await isleLoad(V2_ME.id);setState(s.state);}
  function open(where){if(where==='private'){setPanel('private');}else if(where==='board'){setPanel('board');}else if(where==='diary'){setPanel(view==='friend'?'private':'diary');}else if(where==='sea'){setSeaFrom(view==='friend'?{fromId:friend.id,autoHome:true}:null);setView('sea');}}
  function close(){setPanel(null);setTimeout(()=>document.querySelector('.v2-canvas canvas')?.focus({preventScroll:true}),0);}
  useEffect(()=>{if(!panel)return;function keys(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...document.querySelectorAll('[role="dialog"] button,[role="dialog"] textarea,[role="dialog"] input,[role="dialog"] select')].filter(n=>!n.disabled&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);},[panel]);
  if(view==='loading')return v2h('div',{className:'v2-loading',role:'status'},'친구의 마음 섬에 닿고 있어요…');
  if(view==='sea')return v2h('div',{className:'v2-legacy'},v2h(SeaView,{me:V2_ME,entries,arrive:seaFrom,onBack:()=>setView('world'),onGo:(where,info)=>{if(where==='friend')visit(info)}}),v2h('div',{className:'v2-legacy-note'},visitError||'로컬 연습 바다 · 가상 친구들의 독립된 섬'));
  return v2h(React.Fragment,null,v2h(V2World,{key:view==='friend'?friend.id:me.id,state:view==='friend'?friend.state:state,profile:view==='friend'?friend:me,friend:view==='friend'?friend:null,myState:state,onOpen:open,panel,onLogout,onHidden:(label,hidden)=>setState(s=>s.map(e=>e.label===label?{...e,hidden}:e))}),
    panel==='private'&&v2h('div',{className:'v2-modal-shade'},v2h('section',{className:'v2-help',role:'dialog','aria-modal':true,'aria-label':'친구의 개인 공간'},v2h('h2',null,'이곳은 친구만의 공간이에요'),v2h('p',null,'친구의 일기는 친구만 볼 수 있어요. 섬에 공개한 마음을 함께 산책해요.'),v2h('button',{onClick:close,autoFocus:true},'산책 계속하기'))),
    panel==='board'&&v2h(V2Board,{me:V2_ME,myState:state,onBack:close}),
    panel==='diary'&&v2h('div',{className:'v2-diary',role:'dialog','aria-modal':true,'aria-label':'내 안으로'},v2h('header',null,v2h('div',null,v2h('small',null,'수면 아래, 나의 마음'),v2h('h2',null,'내 안으로')),v2h('button',{onClick:close,autoFocus:true},'섬으로 돌아가기 ×')),v2h('p',{className:'v2-diary-notice'},'로컬 연습 공간 · 이 창을 새로고침하면 기록이 사라져요.'),v2h(DiaryView,{entries,setEntries,onAdd:async e=>{await d2Put(V2_ME.id,e);await sync(e,[...entries,e]);},onUpdate:async e=>{await d2Put(V2_ME.id,e);await sync(e,entries.map(x=>x.ts===e.ts?e:x));},onDelete:async e=>d2Del(V2_ME.id,e),readOnly:false,userId:V2_ME.id})));
}
