/* Private daily progress; existing gifts stay owned, including earlier completions. */
const V4Daily=(()=>{
 const modes=['diary','analysis','full'];
 const date=now=>{const d=new Date(now);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
 const current=(s,day=dayStamp())=>s.daily?.[day]||{};
 function quest(s){const d=current(s);return {...s.q,stage:d.completedAt?'complete':d.analysisCheckedAt?'talk':d.entryTs?'compare':s.q.active?'write':'offer'};}
 function apply(s,e,now){
  const day=typeof dayStamp==='function'?dayStamp():date(now),old=s.daily?.[day]||{};
  let d={...old};
  if(e.type==='dailyWrite'){
   if(e.date!==day)return;
   if(!Number.isFinite(e.ts))throw Error('entry-required');
   if(old.completedAt)return;
   if(d.entryTs!==e.ts)d={entryTs:e.ts,writtenAt:now,mode:modes.includes(e.mode)?e.mode:'full',talkStatus:'pending',insight:'',insightDeferred:false};
   s.selectedEntryTs=e.ts;s.context={kind:'personal',entryTs:e.ts};s.q.source=s.context;s.q.active=true;s.draft='';
  }else{
   if(!d.entryTs||d.entryTs!==e.ts)throw Error('today-entry-required');
   if(modes.includes(e.mode))d.mode=e.mode;
   if(e.type==='dailyAnalysis')d.analysisCheckedAt=now;
   else if(e.type==='dailyInsight'){d.insight=String(e.text||'').slice(0,1000);d.insightDeferred=!!e.deferred;}
   else if(e.type==='dailyTalk'){if(!['done','skipped'].includes(e.status))throw Error('talk-status');d.talkStatus=e.status;d.talkSavedAt=now;}
   else throw Error('daily-event');
  }
  if(d.writtenAt&&(d.mode==='diary'||(d.analysisCheckedAt&&(d.mode==='analysis'||['done','skipped'].includes(d.talkStatus))))){
   d.completedAt=d.completedAt||now;s.q.completedAt=s.q.completedAt||now;s.q.stage='complete';s.q.active=false;s.reward.available=true;
  }else s.q.stage=d.analysisCheckedAt?'talk':'compare';
  s.daily={...(s.daily||{}),[day]:d};
 }
 function invalidate(s,ts){for(const d of Object.values(s.daily||{}))if(d.entryTs===ts){delete d.analysisCheckedAt;delete d.completedAt;d.talkStatus='pending';}return s;}
 return {date,current,quest,apply,invalidate,modes};
})();
if(typeof module==='object')module.exports=V4Daily;
