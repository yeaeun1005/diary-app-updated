/* V4 visitor presentation: cached local assets; no data access. */
const V4_FRIEND_CAMERA={yaw:-.2,pitch:.78,distance:30};
const V4_FRIEND_SESSIONS={};
const V4_FRIEND_BEFORE=V4_QUERY.get('friendVisual')==='before';
function v4FriendWater(options){
 const m=v2WaterMaterial(options),original=m.onBeforeCompile;m.roughness=.78;m.metalness=0;
 m.onBeforeCompile=sh=>{original(sh);sh.uniforms.v2Deep.value.set(options.pond?'#74b8b7':'#4e9eaf');sh.uniforms.v2Shallow.value.set(options.pond?'#a0d1be':'#a0d7c5');sh.fragmentShader=sh.fragmentShader.replace('swell*.075+crossing*.025','swell*.027+crossing*.010').replace('glint*.14','glint*.016').replace('clamp(foam+outer,0.,.72)','clamp((foam+outer)*.5,0.,.38)');};
 m.customProgramCacheKey=()=>`v4-friend-water-${options.coast}-${options.pond}`;return m;
}
function v4FriendTree(template,x,y,z,size){
 const group=V4Assets.instance(template,{height:4.8*size,x,y:y-.055*size,z,rotation:Math.sin(x*2.71+z*1.37)*.42});
 group.scale.set(.76,1,.78);group.userData.center=new THREE.Vector3(x,y+3.1*size,z);return group;
}
function v4FriendMergeBeams(scene){
 scene.updateMatrixWorld(true);const groups=new Map();scene.traverse(o=>{if(o.userData.v4FriendBeam&&o.parent===scene){if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(o);}});
 for(const [material,parts]of groups){if(parts.length<2)continue;const positions=[],normals=[],indices=[];let count=0;
  for(const o of parts){const g=o.geometry.clone().applyMatrix4(o.matrixWorld),p=g.attributes.position,n=g.attributes.normal;positions.push(...p.array);normals.push(...n.array);const idx=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i);indices.push(...idx.map(i=>i+count));count+=p.count;g.dispose();o.geometry.dispose();o.removeFromParent();}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setIndex(indices);geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
 }
}
function v4FriendBeacon(scene){
 const T=THREE,g=new T.Group(),materials=[];
 for(const [inner,outer,opacity]of[[1.65,1.9,.46],[0,1.62,.12]]){const m=new T.MeshBasicMaterial({color:'#fff0ad',transparent:true,opacity,depthWrite:false,side:T.DoubleSide});materials.push(m);const ring=new T.Mesh(new T.RingGeometry(inner,outer,48).rotateX(-Math.PI/2),m);ring.position.y=.06;g.add(ring);}
 const sparks=new T.InstancedMesh(new T.SphereGeometry(.06,6,4),new T.MeshBasicMaterial({color:'#fff1c4',transparent:true,opacity:.75}),8);sparks.frustumCulled=false;g.add(sparks);g.visible=false;scene.add(g);const transform=new T.Object3D();
 return{group:g,at(time,reduced){if(!g.visible)return;materials[0].opacity=reduced?.46:.38+.10*Math.sin(time*1.8);for(let i=0;i<8;i++){const a=i*Math.PI/4+(reduced?0:time*.13);transform.position.set(Math.cos(a)*1.55,.3+(reduced?.4:(time*.3+i*.17)%1.3),Math.sin(a)*1.55);transform.updateMatrix();sparks.setMatrixAt(i,transform.matrix);}sparks.instanceMatrix.needsUpdate=true;}};
}
