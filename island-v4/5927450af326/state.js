/* V4 local prototype state. No production adapter; explicit, serialized writes. */
const V4State=(()=>{
 const ITEMS=['flower','lantern','shrub'],SPOTS=['desk-garden','water-garden','bench-garden'];
 const fresh=()=>({schema:1,revision:0,draft:'',selectedEntryTs:null,context:null,choices:{},q:{active:false,stage:'offer',source:null,response:null,feedbackSeen:false,completedAt:null},reward:{id:'Q01:v1',available:false,item:null,spot:null},talk:{}});
 function reduce(input,event,now=Date.now()){
  const s=JSON.parse(JSON.stringify(input||fresh())),q=s.q,r=s.reward;
  switch(event.type){
   case 'start':q.active=true;if(q.stage==='offer')q.stage='write';break;
   case 'defer':q.active=false;break;
   case 'restart':q.active=true;q.stage='write';q.source=null;q.response=null;q.feedbackSeen=false;break;
   case 'draft':s.draft=String(event.text);break;
   case 'source':if(!['personal','fiction'].includes(event.source?.kind))throw Error('source');if(event.source.kind==='personal'&&!Number.isFinite(event.source.entryTs))throw Error('entry');if(event.source.kind==='fiction'&&event.source.caseId!=='Q01-case-1')throw Error('case');q.source=event.source;s.context=event.source;q.response=null;q.feedbackSeen=false;q.stage='compare';s.selectedEntryTs=event.source.kind==='personal'?event.source.entryTs:null;s.draft='';break;
   case 'response':if(!q.source)throw Error('source-required');if(!Array.isArray(event.choices)||!event.choices.length||event.choices.some(x=>!['짜증','화남','분노','원래 표현','아직 어려워요'].includes(x)))throw Error('response-required');q.response={choices:[...new Set(event.choices)],thought:String(event.thought||''),savedAt:now};q.feedbackSeen=false;q.stage='feedback';break;
   case 'feedback':if(!q.source||!q.response)throw Error('response-required');q.feedbackSeen=true;q.completedAt=q.completedAt||now;q.stage='complete';q.active=false;r.available=true;break;
   case 'choose':if(!q.completedAt||!r.available||!ITEMS.includes(event.item))throw Error('reward-unavailable');if(!r.item)r.item=event.item;break;
   case 'decorate':(typeof V4Decor==='undefined'?require('./decor-model.js'):V4Decor).apply(s,event);break;
   case 'place':if(!r.item||!(event.spot===null||SPOTS.includes(event.spot)))throw Error('placement');r.spot=event.spot;if(s.decor)delete s.decor.reward;break;
   case 'selectEntry':s.selectedEntryTs=event.ts;s.context={kind:'personal',entryTs:event.ts};break;
   case 'choices':s.choices[String(event.ts)]=event.labels.slice();break;
   case 'talk':s.talk[String(event.ts||'fiction')]=String(event.text);break;
   case 'forget':if(s.context?.kind==='personal'&&s.context.entryTs===event.ts)s.context=null;delete s.choices[String(event.ts)];delete s.talk[String(event.ts)];if(s.selectedEntryTs===event.ts)s.selectedEntryTs=null;if(q.source?.kind==='personal'&&q.source.entryTs===event.ts){q.source=null;q.response=null;q.feedbackSeen=false;q.stage=q.completedAt?'complete':'write';}s.draft='';break;
   case 'edit':if(q.source?.kind==='personal'&&q.source.entryTs===event.ts){q.response=null;q.feedbackSeen=false;q.stage='compare';}break;
   default:throw Error('unknown-event');
  }
  s.revision++;return s;
 }
 const queues=new Map();let adapter=null;
 function configure(a){adapter=a;}
 const key=me=>{if(!me?.id||!me?.schoolCode)throw Error('account');return encodeURIComponent(me.schoolCode)+':'+encodeURIComponent(me.id);};
 function load(me){if(!adapter)throw Error('adapter-required');return JSON.parse(JSON.stringify(adapter.read(key(me))||fresh()));}
 function dispatch(me,event){const k=key(me),previous=queues.get(k)||Promise.resolve();const next=previous.catch(()=>{}).then(async()=>{if(adapter.dispatch)return adapter.dispatch(k,event);const state=reduce(load(me),event);await adapter.write(k,state);return state;});queues.set(k,next);next.finally(()=>{if(queues.get(k)===next)queues.delete(k);}).catch(()=>{});return next;}
 return {fresh,reduce,configure,load,dispatch,ITEMS,SPOTS};
})();
if(typeof module==='object')module.exports=V4State;
