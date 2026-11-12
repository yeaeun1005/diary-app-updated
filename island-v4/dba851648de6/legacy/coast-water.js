/* Local preview only: shared sea surface; no requests or data reads. */
function v2WaterMaterial({time,coast=false,tone=.5,pond=false}){
  const T=THREE;
  const deep=new T.Color(pond?'#168d9c':'#087aa5');
  const shallow=new T.Color(pond?'#59c3b5':'#42cfbd');
  // Keep the existing class sea's tone input meaningful, without reading new data.
  if(!coast&&!pond)deep.lerp(new T.Color('#258fc0'),Math.max(0,Math.min(1,tone))*.35);
  const m=new T.MeshStandardMaterial({color:deep,roughness:.32,metalness:.04});
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,{v2Time:time,v2Deep:{value:deep},v2Shallow:{value:shallow}});
    sh.vertexShader='varying vec3 v2WaterPos;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nv2WaterPos=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader='varying vec3 v2WaterPos; uniform float v2Time; uniform vec3 v2Deep; uniform vec3 v2Shallow;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 p=v2WaterPos.xz;
      float a=atan(p.y/29.,p.x/34.);
      float bay=exp(-pow((a-.62)/.30,2.))*.18;
      float bound=1.+.07*sin(a*3.+.5)+.036*sin(a*7.)-bay;
      float r=length(p/vec2(34.,29.))/bound;
      float swell=sin(p.x*.46+p.y*.72-v2Time*.75+sin(p.x*.21+v2Time*.15));
      float crossing=sin(p.x*.87-p.y*.37+v2Time*.38);
      float depthMix=${coast?'smoothstep(.97,1.32,r)':pond?'0.22':'0.78+.13*sin(p.x*.025+p.y*.012)'};
      diffuseColor.rgb=mix(v2Shallow,v2Deep,depthMix);
      diffuseColor.rgb*=1.+swell*.075+crossing*.025;
      float glint=pow(max(0.,sin(p.x*7.3+p.y*1.5+sin(p.y*5.4-v2Time*.9))*sin(p.y*8.5-p.x*.3+v2Time*.7)),32.);
      diffuseColor.rgb+=vec3(.55,.85,.8)*glint*.14;
      ${coast?`float front=.971+sin(v2Time*.6+a*7.)*.006;
      float foam=(1.-smoothstep(.002,.013,abs(r-front)))*(.55+.25*sin(a*33.+v2Time*.4));
      float outer=(1.-smoothstep(.001,.005,abs(r-(1.017+sin(v2Time*.45+a*4.)*.008))))*.18;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8,.96,.9),clamp(foam+outer,0.,.72));`:''}
    `);
  };
  m.customProgramCacheKey=()=>`v2-coast-water-${coast}-${pond}`;
  return m;
}
// The existing SeaView keeps all friend selection, sailing, and privacy behavior.
const v2OriginalSeaWide=buildSeaWide;
buildSeaWide=function(tone,spots){
  const group=v2OriginalSeaWide(tone,spots),deep=group.children[0];
  deep.material.dispose();deep.material=v2WaterMaterial({time:SEA_UNI.uTime,tone});
  return group;
};
