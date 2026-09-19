/* Shared placement rules. Basic scenery never depends on diary/learning scores. */
const V4Decor=(()=>{
 const items={
  sunflower:{name:'햇살 꽃',icon:'✿',desc:'따뜻한 노란빛 한 송이',height:1.2,r:.56,color:'#e8be70'},
  whiteflower:{name:'흰 꽃',icon:'✾',desc:'정원에 내려앉은 작은 구름',height:1.05,r:.51,color:'#e4dfc2'},
  stoneLight:{name:'작은 돌등',icon:'☼',desc:'산책 끝에 만나는 포근한 불빛',height:1.10,r:.62,color:'#b6b398'},
  mossRock:{name:'이끼 바위',icon:'◒',desc:'초록 이불을 덮은 둥근 돌',width:1.25,r:.89,color:'#9cad7b'},
  reeds:{name:'갈대',icon:'❧',desc:'가늘게 자라난 풀 한 무리',height:1.50,r:.59,color:'#baa976'},
  bench:{name:'목재 벤치',icon:'▰',desc:'쉬어 가고 싶은 나만의 자리',width:1.85,r:1.11,color:'#c89964'}
 };
 const zones={shade:{name:'나무 곁 정원',sub:'차분한 초록 사이, 넓어진 쉼터',x:-4.7,z:-6.45,halfX:2.75,halfZ:2.65},breeze:{name:'산책길 곁 정원',sub:'햇살을 따라 소품을 모아 봐요',x:6,z:2.35,halfX:2.6,halfZ:2.65},meadow:{name:'큰 나무 뒤뜰',sub:'커다란 나무 뒤에 나만의 정원',x:.3,z:-11.8,halfX:3.8,halfZ:2.25},coast:{name:'바다가 보이는 정원',sub:'바다 가까이 펼쳐진 작은 마당',x:11.2,z:10.8,halfX:3.3,halfZ:2.0}};
 zones.sunset={name:'노을빛 꽃마당',sub:'분홍 나무 곁, 넓게 펼쳐진 정원',x:-12,z:-11.5,halfX:3.8,halfZ:2.5};zones.picnic={name:'남쪽 소풍 정원',sub:'산책길 아래 포근한 나만의 자리',x:-3,z:13.0,halfX:4.0,halfZ:2.2};
 const oldSpots={'desk-garden':{x:.2,z:-3.8},'water-garden':{x:9,z:3},'bench-garden':{x:-8,z:1}};
 const obstacles=[[-6.2,-5.3,.4],[3,-9,.65],[-9,-7,.48],[-12,-2,.4],[-6,-10,.4],[9,-10,.4],[14,4,.35],[-16,3,.48],[-14,-8,.45],[-9,11,.4],[17,-8,.45],[17,6,.43],[3,-6.5,1.45],[-8,-5.3,1.15],[-10,5.5,1],[6.2,-5,.6],[-3.8,8.7,1.3],[-5,-2,.45],[7,5,.45],[-5,6,.45],[5,-5,.45]].map(([x,z,r])=>({x,z,r}));
 const paths=[[[6.5,19],[6.5,14],[6.5,10],[2,6],[0,1],[0,-2],[3,-4.5]],[[0,1],[-5,-2],[-8,-4],[-10,-1],[-9,5],[-4,7],[2,6]],[[0,-2],[5,-3],[8,-1],[11,-1],[10,3],[6,7],[2,6]],[[-8,-4],[-14,-5],[-16,1],[-13,8],[-5,11],[2,6]],[[3,-4.5],[7,-7],[13,-9],[17,-5],[17,3],[12,8],[6,7]]];
 function pathGap(x,z){let best=Infinity;for(const path of paths)for(let i=1;i<path.length;i++){const[a,b]=path[i-1],[c,d]=path[i],u=Math.max(0,Math.min(1,((x-a)*(c-a)+(z-b)*(d-b))/((c-a)**2+(d-b)**2)));best=Math.min(best,Math.hypot(x-a-(c-a)*u,z-b-(d-b)*u));}return best;}
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
 function catalog(s){return {...items,...(s?.reward?.item?{reward:{name:({flower:'도톰한 꽃',lantern:'작은 정원 등불',shrub:'둥근 관목'})[s.reward.item],icon:'✦',desc:'마음 탐험 01에서 받은 선물',reward:s.reward.item,r:({flower:.87,lantern:.82,shrub:1.46})[s.reward.item]}}:{})};}
 function placements(s){const out={};for(const id of Object.keys(catalog(s))){if(own(s?.decor,id)){if(s.decor[id])out[id]={...s.decor[id]};}else if(id==='reward'&&oldSpots[s.reward.spot])out[id]={...oldSpots[s.reward.spot],rotation:0,legacy:true};}return out;}
 function reserved(x,z,pad=0){return Object.values(zones).some(g=>Math.abs(x-g.x)<=g.halfX+pad&&Math.abs(z-g.z)<=g.halfZ+pad);}
 function reason(s,id,p){const item=catalog(s)[id];if(!item)return '이 소품을 아직 가지고 있지 않아요.';if(p===null)return '';if(!p||![p.x,p.z,p.rotation].every(Number.isFinite)||!own(zones,p.zone))return '정원 안에서 자리를 골라 주세요.';
  const g=zones[p.zone],r=item.r;if(Math.abs(p.x-g.x)>g.halfX-r||Math.abs(p.z-g.z)>g.halfZ-r)return '소품이 정원 밖으로 나가요. 안쪽으로 옮겨 주세요.';
  if(Math.hypot(p.x/23,p.z/19)+r/19>.9||Math.hypot((p.x-12)/3,(p.z+3)/5)<1+r/3)return '물가에서 조금 떨어진 풀밭에 놓아 주세요.';
  if(Math.hypot(p.x,p.z-1)<3.7+r||pathGap(p.x,p.z)<r+1.25)return '친구가 걸어 다닐 길을 비워 주세요.';
  if(obstacles.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<r+q.r+.22))return '원래 있던 나무나 물건과 가까워요. 조금 옮겨 주세요.';
  for(const [other,q]of Object.entries(placements(s)))if(other!==id&&Math.hypot(p.x-q.x,p.z-q.z)<r+catalog(s)[other].r+.12)return '다른 소품과 가까워요. 조금 떨어뜨려 주세요.';
  return '';
 }
 function normalize(p){return p===null?null:{zone:p.zone,x:Math.round(p.x*100)/100,z:Math.round(p.z*100)/100,rotation:((Math.round(p.rotation/45)*45)%360+360)%360};}
 function suggest(s,id,zone='shade'){const g=zones[zone],points=[{x:g.x,z:g.z}];for(let z=g.z-g.halfZ;z<=g.z+g.halfZ;z+=.25)for(let x=g.x-g.halfX;x<=g.x+g.halfX;x+=.25)points.push({x,z});return points.map(p=>normalize({...p,zone,rotation:0})).find(p=>!reason(s,id,p))||{zone,x:g.x,z:g.z,rotation:0};}
 function apply(s,event){if(!own(catalog(s),event.id))throw Error('decor-owner');const p=normalize(event.placement);if(reason(s,event.id,p))throw Error('decor-placement');s.decor={...(s.decor||{}),[event.id]:p};return s;}
 return {items,zones,catalog,placements,reserved,reason,normalize,suggest,apply};
})();
if(typeof module==='object')module.exports=V4Decor;
