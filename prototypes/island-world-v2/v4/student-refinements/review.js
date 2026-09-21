/* Visible UI-only review controls, copied ONLY into the Firebase-free preview. */
function V4ReviewControls({api,stops,label}){
 const [info,setInfo]=useState(null),[open,setOpen]=useState(true);useEffect(()=>{const id=setInterval(()=>setInfo(api.current?.info()),300);return()=>clearInterval(id);},[]);
 return v4h('aside',{style:{position:'absolute',left:14,top:440,maxWidth:260,maxHeight:'calc(100% - 530px)',overflowY:'auto',zIndex:20,padding:10,borderRadius:12,background:'#fffbeeee',fontSize:12},'aria-label':label},v4h('button',{onClick:()=>setOpen(!open)},label+(open?' 접기':' 펼치기')),open&&v4h('div',{style:{display:'flex',flexWrap:'wrap',gap:4}},Object.entries(stops).filter(([,p])=>p.action).map(([id,p])=>v4h('button',{key:id,onClick:()=>api.current.walkTo(id==='board'?{...p,z:p.z-2.5}:p)},p.title+'까지 걷기'))),v4h('output',{'data-review-info':JSON.stringify(info)},open&&(info?'현재 위치 '+info.position.map(x=>x.toFixed(1)).join(', '):'준비 중')));
}
function V4Inspect(props){return v4h(V4ReviewControls,{...props,stops:V4.stops,label:'내 섬 로컬 검수'});}
function V4FriendInspect(props){return v4h(V4ReviewControls,{...props,stops:V2.stops,label:'친구 섬 로컬 검수'});}
function V4SeaInspect(){return null;}
