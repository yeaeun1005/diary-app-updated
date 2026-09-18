/* r147 static asset cache. Source models remain untouched; no generation service. */
const V4Assets=(()=>{
 const base=new URL('assets/models/',document.currentScript.src),cache=new Map(),stats={};
 const query=new URLSearchParams(location.search),mode=query.get('assets')||'on';
 function load(id){
  if(cache.has(id))return cache.get(id);
  const promise=new Promise((resolve,reject)=>{
   let settled=false;const start=performance.now(),timer=setTimeout(()=>finish(Error('timeout')),8000);stats[id]={state:'loading'};
   function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);stats[id]=error?{state:'fallback',reason:error.message}:{state:'ready',ms:performance.now()-start};error?reject(error):resolve(value);}
   if(mode==='slow')return;
   if(mode==='off'||mode==='fail'){finish(Error(mode));return;}
   const tag=document.createElement('script');tag.src=new URL(id+'-data.js',base).href;
   tag.onerror=()=>{tag.remove();finish(Error('file-missing'));};tag.onload=()=>{tag.remove();if(settled){if(window.V4_BYTES)delete window.V4_BYTES[id];return;}try{
    const bytes=Uint8Array.from(atob(window.V4_BYTES[id]),c=>c.charCodeAt(0));delete window.V4_BYTES[id];
    const dv=new DataView(bytes.buffer);if(bytes.length<20||dv.getUint32(0,true)!==0x46546c67)throw Error('invalid-glb');
    const doc=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+dv.getUint32(12,true))));if([...(doc.buffers||[]),...(doc.images||[])].some(x=>x.uri)||doc.extensionsRequired?.length)throw Error('external-or-decoder-required');
    if(THREE.REVISION!=='147')throw Error('revision');
    const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('blob:'))throw Error('external-resource');return url;});
    const loader=new THREE.GLTFLoader(manager);loader.register(parser=>{parser.textureLoader=new THREE.TextureLoader(manager);return{name:'V4_EMBEDDED_TEXTURES'};});
    loader.parse(bytes.buffer,'',gltf=>{if(settled){const maps=new Set();gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){Object.values(m).forEach(t=>{if(t?.isTexture)maps.add(t);});m.dispose();}}});maps.forEach(t=>t.dispose());return;}
     const root=gltf.scene,bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());if(![size.x,size.y,size.z].every(v=>v>0&&Number.isFinite(v))){finish(Error('bounds'));return;}
     root.traverse(o=>{if(o.isMesh){o.geometry.userData.v4Shared=true;for(const m of Array.isArray(o.material)?o.material:[o.material])Object.values(m).forEach(t=>{if(t?.isTexture)t.userData.v4Shared=true;});}});finish(null,{root,bounds,size});
    },e=>finish(e));
   }catch(e){finish(e);}};document.head.appendChild(tag);
  });cache.set(id,promise);return promise;
 }
 function instance(t,{height,width,x=0,y=0,z=0,rotation=0}){const group=new THREE.Group(),root=t.root.clone(true),s=height?height/t.size.y:width/t.size.x,c=t.bounds.getCenter(new THREE.Vector3());root.scale.multiplyScalar(s);root.position.set(-c.x*s,-t.bounds.min.y*s,-c.z*s);root.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=o.receiveShadow=true;}});group.add(root);group.position.set(x,y,z);group.rotation.y=rotation;group.userData.center=new THREE.Vector3(x,y+(height||t.size.y*s)*.7,z);return group;}
 return {load,instance,stats,mode};
})();
