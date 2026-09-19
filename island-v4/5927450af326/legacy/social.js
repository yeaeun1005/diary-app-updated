/* View adapters only. Existing isleLoad/isleHide/empLoad/empSend retain their schema. */
function v2PublicState(state){return (state||[]).filter(e=>e&&!e.hidden).map(e=>({label:e.label,q:e.q,valStd:e.valStd,aroStd:e.aroStd}));}
function v2EmpathyRule(me,friend,state,mine,list,label){
  const word=v2PublicState(state).find(e=>e.label===label);
  if(!me||!friend||String(me.id)===String(friend.id)||!word)return 'private';
  if(!(mine||[]).some(e=>e.q===word.q))return 'unfamiliar';
  if((list||[]).some(e=>String(e.from)===String(me.id)&&e.date===dayStamp()&&e.l===labelKey(label)))return 'sent';
  return 'ready';
}
const V2_EMP_BUSY=new Set();
async function v2SendEmpathy(me,friend,label){
  const lock=me.id+':'+friend.id+':'+labelKey(label);
  if(V2_EMP_BUSY.has(lock))return {status:'busy'};
  V2_EMP_BUSY.add(lock);
  try{
    // Recheck the current public summary. A stale visit must not expose a hidden word.
    const [theirs,mine,list]=await Promise.all([isleLoad(friend.id),isleLoad(me.id),empLoad(friend.id)]);
    const status=v2EmpathyRule(me,friend,theirs.state,mine.state,list,label);
    if(status!=='ready')return {status};
    const word=theirs.state.find(e=>e.label===label);
    await empSend(me,friend.id,word.q,labelKey(label));
    return {status:'sent-now',records:await empLoad(friend.id)};
  }finally{V2_EMP_BUSY.delete(lock);}
}
