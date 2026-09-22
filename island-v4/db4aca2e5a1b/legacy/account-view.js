/* No diary writes or schema changes. Read only the signed-in class and island summaries. */
function v2SummaryState(o){
  return Object.keys((o&&o.v)||{}).map(k=>{const e=o.v[k]||{};return {label:e.l||labelUnkey(k),q:e.q||'LA',valStd:e.vs||0,aroStd:e.as||0,hidden:!!e.h};});
}
async function v2LoadOwnIsland(me){
  if(!me||!me.id||!me.schoolCode)throw Error('Missing signed-in student');
  return v2SummaryState(await sGetStrict(isleKey(me.id)));
}
async function v2LoadPublicIsland(me,info){
  if(!me||!me.id||!me.schoolCode||!info||!info.id||String(info.id)===String(me.id))throw Error('Invalid visit');
  const roster=await sGetStrict(stuKey(me.schoolCode));
  const member=Array.isArray(roster)&&roster.find(s=>s&&String(s.id)===String(info.id));
  if(!member)throw Error('Not in the signed-in class');
  const raw=await sGetStrict(isleKey(member.id));
  if(raw&&raw.code&&raw.code!==me.schoolCode)throw Error('Island class mismatch');
  return {id:member.id,name:member.name||'친구',state:v2PublicState(v2SummaryState(raw))};
}
