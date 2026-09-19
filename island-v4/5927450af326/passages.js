/* Local world transitions. Completion invokes the existing activity/sea handler once. */
function v4CreatePassages({scene,actor,boat,host,walkY,walkable,findPath,snapshot,onState,onComplete,reduced}){
  const T=THREE,clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const splash=buildSplash();splash.visible=false;splash.scale.setScalar(1.7);scene.add(splash);
  const wake=new T.Group(),wm=new T.MeshBasicMaterial({color:'#e8fff1',transparent:true,opacity:.55,depthWrite:false});wake.visible=false;scene.add(wake);
  for(const side of [-1,1]){const curve=new T.CatmullRomCurve3([new T.Vector3(side*.35,0,-.65),new T.Vector3(side*.7,0,-1.9),new T.Vector3(side*1.35,0,-4)]);wake.add(new T.Mesh(new T.TubeGeometry(curve,18,.036,5,false),wm));}
  const rings=[];for(let i=0;i<3;i++){const m=new T.Mesh(new T.RingGeometry(.24,.28,32).rotateX(-Math.PI/2),wm.clone());m.position.z=-.8-i*.8;wake.add(m);rings.push(m);}
  let active=null,phase='',completionCount=0,focus=null,zoom=1;
  const shell=host.parentElement;
  function wash(n){shell.style.setProperty('--v2-wash',String(clamp(n)));}
  function announce(p){if(p===phase)return;phase=p;host.dataset.v2Passage=JSON.stringify({action:active?.action||null,phase:p,completions:completionCount});onState(active?{action:active.action,phase:p}:null);}
  function restore(){if(!active)return;actor.position.copy(active.origin);actor.visible=true;actor.userData.step(0,false,active.face);actor.userData.face?.(active.face);boat.position.copy(active.boatHome);boat.rotation.copy(active.boatRotation);splash.visible=false;wake.visible=false;focus=null;zoom=1;}
  function finish(){if(!active)return;const action=active.action;restore();active=null;completionCount++;announce('complete');wash(1);onComplete(action);}
  function cancel(){if(!active)return;restore();active=null;announce('cancelled');wash(0);}
  function begin(action){
    if(active)return false;
    if(action!=='sea'&&action!=='diary'){onComplete(action);return true;}
    if(reduced){onComplete(action);return true;}
    const goal=action==='sea'?{x:6.5,z:20.5}:{x:17,z:5.65};
    const route=findPath(goal.x,goal.z),points=[actor.position.clone(),...route.map(p=>new T.Vector3(p.x,walkY(p.x,p.z),p.z))];
    if(!route.length&&Math.hypot(actor.position.x-goal.x,actor.position.z-goal.z)>1.2)return false;
    const end=new T.Vector3(goal.x,walkY(goal.x,goal.z),goal.z);
    // Only append the precise staging point if the short final segment is walkable.
    const tail=points[points.length-1];let safe=true;
    for(let i=1;i<=12;i++){const p=tail.clone().lerp(end,i/12);if(!walkable(p.x,p.z))safe=false;}
    if(safe)points.push(end);
    const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]));
    const total=lengths[lengths.length-1];
    active={action,origin:actor.position.clone(),face:actor.userData.body.rotation.y,boatHome:boat.position.clone(),boatRotation:boat.rotation.clone(),saved:snapshot(),points,lengths,total,t:0,walkDuration:Math.max(.25,total/2.8),stage:points[points.length-1].clone()};
    shell.dataset.passage=action;wash(0);announce('approach');return true;
  }
  function samplePath(dist){const {points,lengths}=active;for(let i=1;i<points.length;i++){if(dist<=lengths[i]){const f=clamp((dist-lengths[i-1])/Math.max(.001,lengths[i]-lengths[i-1]));return {p:points[i-1].clone().lerp(points[i],f),dir:Math.atan2(points[i].x-points[i-1].x,points[i].z-points[i-1].z)};}}return {p:active.stage,dir:0};}
  function tick(dt,t){
    if(!active)return;active.t+=dt;const elapsed=active.t-active.walkDuration;
    if(elapsed<0){const p=samplePath(active.total*clamp(active.t/active.walkDuration));actor.position.copy(p.p);actor.userData.step(t,true,p.dir);focus=actor.position.clone();zoom=1;return;}
    if(active.action==='sea'){
      const boardTime=1.05,sailTime=2.6,b=clamp(elapsed/boardTime),s=clamp((elapsed-boardTime)/sailTime),dir=.20;
      if(elapsed<boardTime){announce('boarding');actor.position.copy(active.stage).lerp(new T.Vector3(active.boatHome.x,active.boatHome.y+.13,active.boatHome.z),smooth(b));actor.position.y+=Math.sin(Math.PI*b)*.38;actor.userData.step(t,b<.7,Math.atan2(active.boatHome.x-active.stage.x,active.boatHome.z-active.stage.z),b>.78?'board':'walk');}
      else {announce('sailing');const away=smooth(s)*8;boat.position.set(active.boatHome.x+Math.sin(dir)*away,active.boatHome.y+Math.sin(t*2)*.025,active.boatHome.z+Math.cos(dir)*away);actor.position.set(boat.position.x,boat.position.y+.13,boat.position.z);actor.userData.step(t,false,dir,'sail');wake.visible=true;wake.position.set(boat.position.x,.045,boat.position.z);wake.rotation.y=dir;wm.opacity=.25+.35*Math.sin(Math.PI*s);rings.forEach((r,i)=>{const k=(t*.7+i/3)%1;r.scale.setScalar(.8+k*2);r.material.opacity=(1-k)*.32;});}
      focus=active.stage.clone().lerp(boat.position,.65);focus.y=1;zoom=.86;wash(smooth((s-.72)/.28));
      if(elapsed>=boardTime+sailTime)finish();
    }else{
      const waterY=walkY(17,7.8)+.14,jumpTime=1.05,sinkTime=1.2,j=clamp(elapsed/jumpTime),sink=clamp((elapsed-jumpTime)/sinkTime);
      const to=new T.Vector3(17,waterY,7.8);
      if(elapsed<jumpTime){announce('diving');actor.position.copy(active.stage).lerp(to,j);actor.position.y+=Math.sin(Math.PI*j)*.95;actor.userData.step(t,false,0,'dive',j);}
      else {announce('splash');actor.position.copy(to);actor.position.y-=smooth(sink)*2.6;actor.userData.step(t,false,0,'dive',1);actor.visible=sink<.83;const sp=clamp((elapsed-jumpTime)/1.15);splash.visible=sp<1;splash.position.set(17,waterY+.04,7.8);splash.userData.at(sp);}
      focus=to.clone();focus.y-=smooth(sink)*.7;zoom=.80;wash(smooth((sink-.40)/.60));
      if(elapsed>=jumpTime+sinkTime)finish();
    }
  }
  return {begin,tick,cancel,skip:finish,get busy(){return !!active;},get focus(){return focus;},get zoom(){return zoom;},clearWash(){wash(0);},get status(){return {action:active?.action||null,phase,completions:completionCount};},safeSnapshot(){return active?active.saved:null;}};
}
