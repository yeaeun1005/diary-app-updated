/* Restored student helpers use the existing local dictionaries. No storage or network. */
const V4StudentTools=(()=>{
 const unique=xs=>[...new Set(xs.filter(x=>typeof x==='string'&&x.trim()))];
 const displayWords=new Map();
 function displayWord(word){
  if(!displayWords.has(word)){
   const labels=unique((v4Analyze(word||'').hits||[]).map(h=>h.label));
   displayWords.set(word,labels.length===1?labels[0]:word);
  }
  return displayWords.get(word);
 }
 function detected(text){
  const analysis=v4Analyze(text||'');
  const situations=detectSituations(text||'');
  return {analysis,situations,words:unique((analysis.hits||[]).filter(h=>h.token!=='직접선택').map(h=>h.label)),suggested:getSuggestions(situations)};
 }
 function compose(text,emotions,situations){
  const labels=unique(emotions),contexts=unique(situations);
  return {text:text.trim()?text:[contexts.length?contexts.join(', ')+' 상황':'',labels.length?'내가 고른 감정: '+labels.join(', '):''].filter(Boolean).join('\n'),labels};
 }
 function prepare(text,emotions,situations,date,ts){
  const composed=compose(text,emotions,situations);
  // Generated choice-only text is not evidence of automatic detection.
  const analysis=v4Analyze(text.trim()?text:'');
  const [year,month,day]=date.split('-').map(Number);
  const entry={ts,date:month+'.'+day,text:composed.text,analysis:{...analysis,entryDate:date,automaticText:text.trim()?text:'',studentSelection:[]}};
  return composed.labels.length?correct(entry,composed.labels):entry;
 }
 function refresh(entries){
  return entries.map(e=>{
   const a=e.analysis||{};
   if(a.corrected)return e;
   const generated=(!a.automaticText&&a.studentSelection?.length&&/^(?:[^\n]+ 상황\n)?내가 고른 감정:/.test(e.text||''));
   const raw=typeof a.automaticText==='string'?a.automaticText:generated?'':e.text;
   const fresh=v4Analyze(raw||'');
   const updated={...e,analysis:{...a,...fresh,studentSelection:[]}};
   const chosen=unique(a.studentSelection||[]);
   return chosen.length?correct(updated,chosen):{...updated,analysis:{...updated.analysis,studentSelection:a.studentSelection||[]}};
  });
 }
 function summarize(entries){
  const positive=new Map(),negative=new Map(),positiveTexts=[],negativeTexts=[];
  const add=(map,label)=>map.set(label,(map.get(label)||0)+1);
  for(const e of entries){
   const a=e.analysis||{};if(a.status==='unavailable')continue;
   const p=new Set(),n=new Set();
   for(const h of a.hits||[]){if(h.token==='직접선택'&&!a.corrected)continue;const val=Number.isFinite(h.val9)?h.val9:Number.isFinite(h.valStd)?5+4*h.valStd:EMOTIONS_28.find(e=>e.label===h.label)?.val;if(val>5)p.add(h.label);else if(val<5)n.add(h.label);}
   for(const h of a.matchedPos||[])p.add(displayWord(h.word));
   for(const h of a.matchedNeg||[])n.add(displayWord(h.word));
   p.forEach(label=>add(positive,label));n.forEach(label=>add(negative,label));
   if(p.size)positiveTexts.push(e.text);if(n.size)negativeTexts.push(e.text);
  }
  const colors={positive:['#3c9b87','#62b8a4','#83cbb5','#a6d9c1','#368474'],negative:['#b36f83','#c98b99','#dba8b3','#c9a3c4','#9e718c']};
  const top=(map,kind)=>[...map].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko')).slice(0,10).map(([label,count],i)=>({label,count,color:colors[kind][i%5]}));
  const chartEntries=entries.filter(e=>e.analysis?.status!=='unavailable').map(e=>({...e,analysis:{...e.analysis,hits:(e.analysis?.hits||[]).filter(h=>(h.token!=='직접선택'||e.analysis.corrected)&&Number.isFinite(h.valStd)&&Number.isFinite(h.aroStd))}}));
  const trendEntries=entries.filter(e=>{const a=e.analysis;return a?.status!=='unavailable'&&Number.isFinite(a?.posPct)&&Number.isFinite(a?.negPct)&&a.posPct+a.negPct>0;}).slice().reverse();
  return {positive:top(positive,'positive'),negative:top(negative,'negative'),situations:extractSituations(entries.map(e=>e.text)),positiveSituations:extractSituations(positiveTexts),negativeSituations:extractSituations(negativeTexts),chartEntries,trendEntries};
 }
 function actionExamples(situations){
  const contexts=new Set(situations.map(s=>s.ctx));
  const examples=[];
  if(['친구','다툼','혼남'].some(s=>contexts.has(s)))examples.push('나는 그 말에 속상했어. 내 이야기도 들어줄래?','잠깐 쉬었다가 차분하게 다시 이야기해 볼게.');
  if(['시험','발표','공부/숙제','학교'].some(s=>contexts.has(s)))examples.push('어려운 부분을 하나씩 나눠서 해 볼게.','선생님, 이 부분을 다시 설명해 주실 수 있나요?');
  if(['가족','선생님','혼자','아픔/병원'].some(s=>contexts.has(s)))examples.push('지금 내 마음을 믿을 수 있는 어른에게 이야기해 볼게.');
  if(contexts.has('친구/놀이'))examples.push('친구에게 내가 하고 싶은 것을 차분하게 부탁해 볼게.');
  if(['칭찬/성과','생일/축하'].some(s=>contexts.has(s)))examples.push('함께해 줘서 고마웠다고 말해 볼게.');
  return unique([...examples,...NEXT_OPTIONS]).slice(0,8);
 }
 function talkSeed(text){
  const found=detected(text);
  const sentences=String(text||'').match(/[^.!?。！？\n]+[.!?。！？]?/g)||[];
  const observations=sentences.map(s=>s.trim()).filter(s=>s&&detectSituations(s).length);
  return {observation:observations.slice(0,2).join(' ')||sentences[0]?.trim()||'',feeling:found.words.join(' · ')};
 }
 const talkSteps=[
  {key:'observation',label:'관찰',question:'무슨 일이 있었나요?'},
  {key:'feeling',label:'느낌',question:'어떤 감정이 들었나요?'},
  {key:'need',label:'욕구',question:'무엇을 원했기 때문에 그런 마음이 들었을까요?'},
  {key:'action',label:'행동',question:'그래서 어떤 행동을 했나요?'},
  {key:'helpful',label:'돌아보기',question:'그 행동이 내가 원했던 일에 도움이 되었나요?'}
 ];
 const reflections=[{value:'도움이 되었어.'},{value:'보통이야.'},{value:'안됐어.'}];
 function hasNegative(entry){
  const a=refresh([entry])[0].analysis||{};
  return (a.hits||[]).some(h=>Number.isFinite(h.val9)?h.val9<5:Number.isFinite(h.valStd)&&h.valStd<0)||(a.matchedNeg||[]).length>0||(!a.corrected&&(a.studentSelection||[]).some(w=>EMOTIONS_28.some(e=>e.label===w&&e.val<5)));
 }
 function correct(entry,labels,custom='',valence='neu',energy='mid'){
  const hits=EMOTIONS_28.filter(e=>labels.includes(e.label)).map(e=>({name:e.name,label:e.label,q:e.q,val9:e.val,aro9:e.aro,token:'직접선택',corrected:true}));
  for(const label of unique(labels).filter(label=>!EMOTIONS_28.some(e=>e.label===label)))hits.push({name:'custom_'+entry.ts+'_'+hits.length,label:label.trim().slice(0,40),q:'',val9:5,aro9:5,token:'직접입력',corrected:true,custom:true});
  if(custom.trim()){const v=valence==='pos'?7:valence==='neg'?3:5,a=energy==='high'?7:energy==='low'?3:5;hits.push({name:'custom_'+entry.ts,label:custom.trim().slice(0,40),q:v===5?'':v>5?(a>=5?'HA':'LA'):(a>=5?'HV':'LV'),val9:v,aro9:a,token:'직접입력',corrected:true,custom:true});}
  if(!hits.length)throw Error('emotion-required');
  for(const h of hits){h.valStd=(h.val9-5)/4;h.aroStd=(h.aro9-5)/4;}
  const pos=hits.filter(h=>h.val9>5).length,neg=hits.filter(h=>h.val9<5).length,val=hits.reduce((s,h)=>s+h.val9,0)/hits.length,aro=hits.reduce((s,h)=>s+h.aro9,0)/hits.length;
  const original=refresh([entry])[0].analysis||{};
  return {...entry,analysis:{...original,automaticAnalysis:original.automaticAnalysis||{hits:original.hits||[],matchedPos:original.matchedPos||[],matchedNeg:original.matchedNeg||[]},corrected:true,status:'ready',hits,studentSelection:hits.map(h=>h.label),matchedPos:[],matchedNeg:[],posScore:pos,negScore:neg,posPct:pos/hits.length*100,negPct:neg/hits.length*100,valence9:val,arousal9:aro,valStd:(val-5)/4,aroStd:(aro-5)/4}};
 }
 return {detected,compose,prepare,refresh,summarize,actionExamples,talkSeed,talkSteps,reflections,hasNegative,correct};
})();
