/* Shared cached models; every instance owns only its cloned materials. */
function v4DisposeDecor(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry&&!o.geometry.userData.v4Shared)gs.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
function v4DecorFallback(id,item){
 const T=THREE;if(item.reward){const g=v4BuildReward(T,item.reward);g.scale.setScalar(1.8);return g;}
 if(id==='sunflower'||id==='whiteflower'||id==='stoneLight'){const g=v4BuildReward(T,id==='stoneLight'?'lantern':'flower');g.scale.setScalar(item.height);if(id!=='stoneLight')g.traverse(o=>{if(o.isMesh&&o.material.color.getHexString()==='eeb4bd')o.material.color.set(id==='sunflower'?'#e9b558':'#f5eddb');});return g;}
 const g=new T.Group(),mats={};function mesh(geo,color,x,y,z){const m=mats[color]||(mats[color]=new T.MeshStandardMaterial({color,roughness:.9})),o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 if(id==='bench'){mesh(new T.BoxGeometry(1.85,.15,.78),'#c79b62',0,.55,0);mesh(new T.BoxGeometry(1.85,.58,.13),'#d8b17b',0,1.05,-.34);for(const x of[-.7,.7])mesh(new T.BoxGeometry(.14,.55,.65),'#b38a57',x,.25,0);}
 else if(id==='mossRock'){const o=mesh(new T.IcosahedronGeometry(1,2),'#adb095',0,.35,0);o.scale.set(.62,.43,.60);const top=mesh(new T.SphereGeometry(1,12,8),'#9dab70',0,.57,0);top.scale.set(.48,.20,.46);}
 else for(let i=0;i<3;i++){const x=(i-1)*.22,h=1.2-i*.18;mesh(new T.CylinderGeometry(.025,.04,h,8),'#809561',x,h/2,0);mesh(new T.CapsuleGeometry(.08,.25,4,8),'#b6a079',x,h,0);}
 return g;
}
function v4DecorObject(id,item){
 const T=THREE,root=new T.Group();let dead=false;
 const fallback=v4DecorFallback(id,item);
 root.add(fallback);root.userData.asset=item.reward?'built-in':'loading';
 if(!item.reward)V4Assets.load('decor-'+id).then(template=>{if(dead)return;const model=V4Assets.instance(template,item);root.remove(fallback);v4DisposeDecor(fallback);root.add(model);root.userData.asset='ready';}).catch(()=>{root.userData.asset='fallback';});
 root.userData.release=()=>{dead=true;v4DisposeDecor(root);};return root;
}
function v4CreateDecorScene({scene,ground,host}){
 const T=THREE,nodes=new Map(),guide=new T.Group();scene.add(guide);guide.visible=false;
 const borderMat=new T.MeshBasicMaterial({color:'#ffefba',transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide});
 for(const [id,g]of Object.entries(V4Decor.zones)){
  const points=[];for(let edge=0;edge<4;edge++)for(let i=0;i<24;i++){const t=i/24;let x,z;if(edge===0){x=g.x-g.halfX+t*g.halfX*2;z=g.z-g.halfZ;}if(edge===1){x=g.x+g.halfX;z=g.z-g.halfZ+t*g.halfZ*2;}if(edge===2){x=g.x+g.halfX-t*g.halfX*2;z=g.z+g.halfZ;}if(edge===3){x=g.x-g.halfX;z=g.z+g.halfZ-t*g.halfZ*2;}points.push(new T.Vector3(x,ground(x,z)+.05,z));}
  points.push(points[0]);const curve=new T.CatmullRomCurve3(points,false,'catmullrom',0),tube=new T.Mesh(new T.TubeGeometry(curve,96,.025,4,false),borderMat);tube.userData.zone=id;guide.add(tube);
 }
 const ring=new T.Mesh(new T.RingGeometry(.88,1,48),new T.MeshBasicMaterial({color:'#f9e79d',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;guide.add(ring);
 function render(data,edit){const placements=V4Decor.placements(data),catalog=V4Decor.catalog(data);if(edit)placements[edit.id]=edit.placement;
  for(const [id,o]of nodes)if(!placements[id]){scene.remove(o);o.userData.release();nodes.delete(id);}
  for(const [id,p]of Object.entries(placements)){let o=nodes.get(id);if(!o){o=v4DecorObject(id,catalog[id]);nodes.set(id,o);scene.add(o);}o.position.set(p.x,ground(p.x,p.z),p.z);o.rotation.y=p.rotation*Math.PI/180;}
  guide.visible=!!edit;if(edit){const p=edit.placement,r=catalog[edit.id].r;ring.position.set(p.x,ground(p.x,p.z)+.075,p.z);ring.scale.setScalar(r+.14);ring.material.color.set(V4Decor.reason(data,edit.id,p)?'#dc886c':'#fff0ad');guide.children.forEach(o=>{if(o.userData.zone)o.visible=o.userData.zone===p.zone;});}
  host.dataset.decorations=JSON.stringify({saved:V4Decor.placements(data),preview:edit||null,count:nodes.size});
 }
 function status(){return Object.fromEntries([...nodes].map(([id,o])=>[id,o.userData.asset]));}
 function dispose(){for(const o of nodes.values()){scene.remove(o);o.userData.release();}nodes.clear();scene.remove(guide);v4DisposeDecor(guide);}
 return {render,status,dispose};
}
/* A single temporary renderer creates catalog photographs, then releases itself. */
const V4_DECOR_PHOTOS={};
function V4DecorPhotos({onReady}){
 useEffect(()=>{let dead=false,renderer=null;const T=THREE,models=[];
  if(Object.keys(V4_DECOR_PHOTOS).length===Object.keys(V4Decor.items).length){onReady({...V4_DECOR_PHOTOS});return;}
  (async()=>{try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(320,250);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
   const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff6df','#94ad92',1));const sun=new T.DirectionalLight('#fff1d6',1.4);sun.position.set(-4,7,5);scene.add(sun);const camera=new T.PerspectiveCamera(34,320/250,.1,30),photos={};
   for(const [id,item]of Object.entries(V4Decor.items)){let template;try{template=await V4Assets.load('decor-'+id);}catch{continue;}if(dead)return;const model=V4Assets.instance(template,{height:1});models.push(model);scene.add(model);const size=new T.Box3().setFromObject(model).getSize(new T.Vector3()),distance=Math.max(3.15,size.x*2.1);camera.position.set(distance*.40,1.7,distance);camera.lookAt(0,.5,0);renderer.render(scene,camera);photos[id]=renderer.domElement.toDataURL('image/png');V4_DECOR_PHOTOS[id]=photos[id];scene.remove(model);v4DisposeDecor(model);models.pop();if(!dead)onReady({...photos});}
  }catch{/* The text and silhouette remain usable without WebGL. */}finally{renderer?.dispose();renderer?.forceContextLoss();renderer=null;}})();
  return()=>{dead=true;models.forEach(v4DisposeDecor);renderer?.dispose();renderer?.forceContextLoss();};
 },[]);return null;
}
