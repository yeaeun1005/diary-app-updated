/* Original procedural explorer. No downloaded model, texture, API or saved avatar data. */
function buildExplorerCharacter(){
  const T=THREE,root=new T.Group(),body=new T.Group(),head=new T.Group();root.add(body);
  const colors={skin:'#edb78c',blush:'#d87d69',hair:'#50352b',cream:'#fff0ce',hat:'#e1b86f',teal:'#287b78',dark:'#274856',coral:'#d96848',bag:'#cd9447',gold:'#dfb969',sole:'#eee1bc'};
  const materials=Object.fromEntries(Object.entries(colors).map(([k,c])=>[k,new T.MeshStandardMaterial({color:c,roughness:.9})]));
  materials.skin.emissive=new T.Color('#604437');materials.skin.emissiveIntensity=.12;
  const sphere=new T.SphereGeometry(1,16,12);
  function ball(parent,color,x,y,z,sx,sy,sz){const m=new T.Mesh(sphere,materials[color]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  function roundBox(w,h,d,r){const g=new T.BoxGeometry(w,h,d,4,4,4),p=g.attributes.position,n=new T.Vector3();for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),cx=Math.max(-w/2+r,Math.min(w/2-r,x)),cy=Math.max(-h/2+r,Math.min(h/2-r,y)),cz=Math.max(-d/2+r,Math.min(d/2-r,z));n.set(x-cx,y-cy,z-cz).normalize().multiplyScalar(r);p.setXYZ(i,cx+n.x,cy+n.y,cz+n.z);}g.computeVertexNormals();return g;}
  function box(parent,color,x,y,z,w,h,d,r=.035){const m=new T.Mesh(roundBox(w,h,d,r),materials[color]);m.position.set(x,y,z);parent.add(m);return m;}
  function cylinder(parent,color,x,y,z,rt,rb,h){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,24),materials[color]);m.position.set(x,y,z);parent.add(m);return m;}
  function group(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
  // Round boots and distinct hands keep the child readable at play distance.
  const legs=[],knees=[],arms=[];
  for(const side of [-1,1]){
    const hip=group(body,side*.105,.47,0);legs.push(hip);
    box(hip,'teal',0,-.07,0,.18,.23,.22,.045);
    const knee=group(hip,0,-.18,0);knees.push(knee);
    ball(knee,'skin',0,-.065,0,.063,.105,.067);
    box(knee,'cream',0,-.15,0,.14,.085,.14,.02);
    box(knee,'dark',0,-.205,.035,.17,.135,.25,.05);
    box(knee,'sole',0,-.255,.04,.18,.035,.255,.014);
    for(let i=0;i<2;i++)box(knee,'cream',0,-.15,.075+i*.04,.09,.012,.018,.005);
    const arm=group(body,side*.238,.82,0);arms.push(arm);
    ball(arm,'cream',side*.012,-.055,0,.085,.12,.083);
    ball(arm,'skin',side*.015,-.205,.005,.058,.11,.058);
    ball(arm,'skin',side*.015,-.29,.015,.068,.073,.067);
  }
  box(body,'cream',0,.71,0,.43,.39,.28,.09);
  box(body,'teal',0,.545,0,.34,.085,.25,.03);
  // Front straps, pocket and a little compass badge.
  for(const side of [-1,1])box(body,'bag',side*.145,.76,.145,.046,.28,.023,.01);
  box(body,'cream',.08,.655,.149,.10,.085,.015,.01);
  const badge=cylinder(body,'gold',-.085,.735,.16,.036,.036,.012);badge.rotation.x=Math.PI/2;
  box(body,'dark',-.085,.735,.172,.009,.046,.005,.002);
  ball(body,'skin',0,.956,0,.075,.065,.07);
  const scarf=new T.Mesh(new T.TorusGeometry(.108,.027,8,24),materials.coral);scarf.rotation.x=Math.PI/2;scarf.position.set(0,.925,0);body.add(scarf);
  const triangle=new T.Shape();triangle.moveTo(-.085,.917);triangle.lineTo(.085,.917);triangle.lineTo(.005,.74);triangle.closePath();const tail=new T.Mesh(new T.ShapeGeometry(triangle),materials.coral);tail.position.z=.172;body.add(tail);
  // A bag and rolled map make the back view an explorer, too.
  box(body,'bag',0,.72,-.215,.34,.37,.18,.075);
  box(body,'hat',0,.84,-.325,.32,.13,.048,.025);
  box(body,'hat',0,.645,-.323,.22,.135,.06,.025);
  for(const side of [-1,1])box(body,'cream',side*.095,.73,-.355,.027,.17,.014,.006);
  for(const side of [-1,1])ball(body,'gold',side*.095,.755,-.37,.017,.017,.009);
  const roll=cylinder(body,'teal',0,.963,-.19,.06,.06,.33);roll.rotation.z=Math.PI/2;
  for(const side of [-1,1]){const strap=cylinder(body,'cream',side*.10,.963,-.19,.063,.063,.02);strap.rotation.z=Math.PI/2;}
  cylinder(body,'cream',.23,.75,-.20,.045,.045,.27);cylinder(body,'coral',.23,.75,-.20,.048,.048,.035);
  // Face, hair and soft bucket hat. Model faces +Z.
  body.add(head);head.position.y=1.135;
  ball(head,'skin',0,0,0,.247,.259,.23);
  for(const side of [-1,1])ball(head,'skin',side*.247,-.015,0,.046,.07,.05);
  const hair=new T.Mesh(new T.SphereGeometry(.254,20,14,0,Math.PI*2,0,Math.PI*.48),materials.hair);hair.scale.set(1,1.04,.96);head.add(hair);
  ball(head,'hair',0,.008,-.115,.224,.20,.135);
  for(let i=0;i<4;i++){const b=ball(head,'hair',-.135+i*.08,.147-Math.sin(i)*.017,.179,.065,.056,.045);b.rotation.z=-.35;}
  const eyes=[];
  for(const side of [-1,1]){
    const eye=group(head,side*.083,.005,.220);eyes.push(eye);ball(eye,'dark',0,0,0,.027,.038,.015);ball(eye,'cream',-.006,.012,.014,.009,.01,.006);
    ball(head,'blush',side*.145,-.067,.193,.042,.019,.012);
  }
  ball(head,'skin',0,-.042,.235,.038,.032,.032);
  const mouthCurve=new T.CatmullRomCurve3([new T.Vector3(-.055,-.096,.208),new T.Vector3(0,-.11,.224),new T.Vector3(.055,-.096,.208)]);
  head.add(new T.Mesh(new T.TubeGeometry(mouthCurve,10,.007,5,false),materials.hair));
  cylinder(head,'hat',0,.19,0,.34,.35,.038);
  cylinder(head,'hat',0,.275,-.005,.218,.263,.15);
  ball(head,'hat',0,.347,-.005,.22,.055,.216);
  cylinder(head,'teal',0,.225,-.003,.263,.269,.053);
  const emblem=cylinder(head,'gold',0,.279,.252,.035,.035,.014);emblem.rotation.x=Math.PI/2;
  box(head,'cream',0,.279,.265,.009,.049,.009,.003);
  // Merge static pieces within each animated joint/material; the pose hierarchy stays intact.
  function mergeStatic(parent){for(const child of [...parent.children])if(child.isGroup)mergeStatic(child);const byMaterial=new Map();for(const child of [...parent.children]){if(!child.isMesh)continue;child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();g.applyMatrix4(child.matrix);if(!byMaterial.has(child.material))byMaterial.set(child.material,[]);byMaterial.get(child.material).push(g);parent.remove(child);}
    for(const [m,parts] of byMaterial){const p=[],n=[];for(const g of parts){p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));parent.add(new T.Mesh(g,m));}}
  mergeStatic(body);
  body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.renderOrder=999;}});
  // One simple translucent silhouette reveals the child behind scenery without doubling the model.
  const silhouette=new T.Group(),silMat=new T.MeshBasicMaterial({color:'#f1b888',depthTest:false,depthWrite:false,transparent:true,opacity:.3});
  for(const [y,sx,sy,sz] of [[.70,.25,.32,.15],[1.14,.25,.25,.22]]){const m=new T.Mesh(sphere,silMat);m.position.y=y;m.scale.set(sx,sy,sz);m.renderOrder=998;silhouette.add(m);}root.add(silhouette);
  root.userData.body=body;root.userData.silhouette=silhouette;
  let face=0,lastT=null;
  root.userData.step=(t,moving,dir,pose='walk',progress=0)=>{
    const dt=lastT===null?1:Math.max(0,Math.min(.08,t-lastT));lastT=t;
    if(dir!=null){const delta=Math.atan2(Math.sin(dir-face),Math.cos(dir-face));face+=delta*Math.min(1,dt*13);}
    const sw=moving?Math.sin(t*9):0,bob=moving?Math.abs(sw)*.024:Math.sin(t*2)*.004;
    legs[0].rotation.x=sw*.47;legs[1].rotation.x=-sw*.47;knees.forEach((k,i)=>k.rotation.x=Math.max(0,Math.sin(t*9+i*Math.PI))*(moving?.22:0));
    arms[0].rotation.x=-sw*.42;arms[1].rotation.x=sw*.42;arms[0].rotation.z=.06;arms[1].rotation.z=-.06;
    body.position.y=bob;body.rotation.set(0,face,sw*.025);head.rotation.z=Math.sin(t*1.3)*.012;
    const blink=!moving&&t%5.2>5.05?.16:1;eyes.forEach(e=>e.scale.y=blink);
    if(pose==='board'||pose==='sail'){arms[0].rotation.x=-.55;arms[1].rotation.x=-.55;legs.forEach(l=>l.rotation.x=-.55);knees.forEach(k=>k.rotation.x=1.1);body.position.y=-.12;}
    if(pose==='dive'){const p=Math.min(1,progress*2.4);arms.forEach(a=>a.rotation.x=-Math.PI*.91*p);body.rotation.x=.22*p;legs.forEach(l=>l.rotation.x=.15*p);head.rotation.x=-.1*p;}
    else head.rotation.x=0;
    silhouette.position.copy(body.position);silhouette.rotation.copy(body.rotation);silhouette.visible=pose!=='dive';
  };
  root.userData.face=dir=>{face=dir;body.rotation.y=dir;silhouette.rotation.y=dir;};
  root.userData.step(0,false,0);lastT=null;
  return root;
}
// Only this memory page loads this module. Legacy sea/visit keep the same builder contract.
// Scale the model, not its root: the legacy head marker measures world height once.
buildCharacter=function(){const c=buildExplorerCharacter();c.userData.body.scale.setScalar(.71);c.userData.silhouette.scale.setScalar(.71);return c;};
