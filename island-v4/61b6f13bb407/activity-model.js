/* Date/record helpers shared by the student's calendar and report. No storage. */
const V4ActivityModel=(()=>{
 const DAY=86400000;
 function dateNumber(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
  const [y,m,d]=value.split('-').map(Number),n=Date.UTC(y,m-1,d),dt=new Date(n);
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?n:null;
 }
 function dateString(n){return new Date(n).toISOString().slice(0,10);}
 function recordDate(entry){
  if(dateNumber(entry?.date)!==null)return entry.date;
  if(dateNumber(entry?.analysis?.entryDate)!==null){const d=entry.analysis.entryDate;if(entry.date===Number(d.slice(5,7))+'.'+Number(d.slice(8)))return d;}
  // Legacy entries store M.D. Display them in their saved year without rewriting them.
  const parts=/^(\d{1,2})\.(\d{1,2})$/.exec(entry?.date||'');
  if(!parts||!Number.isFinite(entry.ts))return null;
  const year=new Date(entry.ts).getFullYear(),date=year+'-'+parts[1].padStart(2,'0')+'-'+parts[2].padStart(2,'0');
  return dateNumber(date)===null?null:date;
 }
 function inRange(entries,days,today){
  const end=dateNumber(today);
  return entries.filter(e=>{const n=dateNumber(recordDate(e));return days==='all'||(end!==null&&n!==null&&n<=end&&n>=end-(Number(days)-1)*DAY);}).slice().sort((a,b)=>(recordDate(b)||'').localeCompare(recordDate(a)||'')||b.ts-a.ts);
 }
 function monthGrid(month){
  const n=dateNumber(month+'-01');if(n===null)return [];
  const first=new Date(n).getUTCDay(),last=new Date(n);last.setUTCMonth(last.getUTCMonth()+1);
  return Array.from({length:Math.ceil((first+(last-n)/DAY)/7)*7},(_,i)=>i<first||n+(i-first)*DAY>=last?null:dateString(n+(i-first)*DAY));
 }
 function shiftMonth(month,delta){const d=new Date(dateNumber(month+'-01'));d.setUTCMonth(d.getUTCMonth()+delta);return d.toISOString().slice(0,7);}
 const unique=values=>[...new Set(values.filter(v=>typeof v==='string'&&v.trim()))];
 function words(entry,choices){
  return {auto:unique((entry.analysis?.automaticAnalysis?.hits||entry.analysis?.hits||[]).filter(h=>!h.corrected&&h.token!=='직접선택').map(h=>h.label)),chosen:unique([...(entry.analysis?.studentSelection||[]),...(entry.analysis?.hits||[]).filter(h=>h.corrected||h.token==='직접선택').map(h=>h.label),...(choices?.[String(entry.ts)]||[])])};
 }
 function summarize(entries,choices){
  const auto=new Set(),chosen=new Set(),days=new Set();
  for(const e of entries){const date=recordDate(e);if(date)days.add(date);const w=words(e,choices);w.auto.forEach(v=>auto.add(v));w.chosen.forEach(v=>chosen.add(v));}
  return {count:entries.length,days:days.size,auto:[...auto],chosen:[...chosen]};
 }
 function upsertChat(existing,record){
  if(existing!=null&&!Array.isArray(existing))throw Error('chat-format');
  if(!Number.isFinite(record.entryTs))throw Error('chat-entry');
  return [...(existing||[]).filter(c=>c.entryTs!==record.entryTs),record];
 }
 return {dateNumber,dateString,recordDate,inRange,monthGrid,shiftMonth,words,summarize,upsertChat};
})();
if(typeof module==='object')module.exports=V4ActivityModel;
