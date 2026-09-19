/* Preserve user-entered emotion words. Their slots do not depend on public/hidden neighbors. */
function v2ExtraSlots(state,seed,reserved,canPlant){
  const result=Object.create(null),known=Object.values(reserved).flat();
  for(const word of state||[]){
    if(!word||!word.label||Object.prototype.hasOwnProperty.call(reserved,word.label)||Object.prototype.hasOwnProperty.call(result,word.label))continue;
    const zone=V2.zones.find(z=>z.key===word.q)||V2.zones.find(z=>z.key==='LA');
    const random=mulberry32(hashSeed(seed+':custom:'+word.label)),slots=[];
    for(let k=0;k<3;k++)for(let n=0;n<240;n++){
      const a=random()*Math.PI*2,r=2+random()*6,x=zone.x+Math.cos(a)*r,z=zone.z+Math.sin(a)*r;
      if(canPlant(x,z)&&!known.some(p=>Math.hypot(p.x-x,p.z-z)<.75)&&!slots.some(p=>Math.hypot(p.x-x,p.z-z)<.75)){slots.push({x,z});break;}
    }
    result[word.label]=slots;
  }
  return result;
}
