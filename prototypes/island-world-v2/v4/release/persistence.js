/* Account-owned V4 metadata. Uses the existing private diary path and DB gateway.
 * No migration, friend-diary access, auth/rules changes or model-service calls. */
const V4Persistence=(()=>{
 const sessions=new Map(),memory=new Map(),copy=x=>JSON.parse(JSON.stringify(x));
 const key=me=>{if(!me?.id||!me?.schoolCode||/[.#$\[\]/\x00-\x1f\x7f]/.test(me.id))throw Error('account');return encodeURIComponent(me.schoolCode)+':'+encodeURIComponent(me.id);};
 function decode(raw,code){
  if(raw==null)return V4State.fresh();
  if(raw.schema!==1||raw.schoolCode!==code||typeof raw.stateJson!=='string')throw Error('state-format');
  const s=JSON.parse(raw.stateJson);
  if(s.schema!==1||!Number.isInteger(s.revision)||!s.q||!s.reward||!s.choices||!s.talk)throw Error('state-format');
  return s;
 }
 const encode=(s,code)=>({schema:1,schoolCode:code,stateJson:JSON.stringify(s)});
 async function open(me){
  const k=key(me),temporary=!!MEM_ONLY,path=d2Key(me.id)+'/_mindIslandV4';
  // Explicit snapshot: an account switch must not redirect pending operations.
  const raw=temporary?memory.get(k):await sGetStrict(path);
  const session={path,code:me.schoolCode,temporary,state:decode(raw,me.schoolCode)};
  sessions.set(k,session);return copy(session.state);
 }
 function read(k){if(!sessions.has(k))throw Error('state-not-loaded');return copy(sessions.get(k).state);}
 async function dispatch(k,event){
  const session=sessions.get(k);if(!session)throw Error('state-not-loaded');
  const {path,code,temporary}=session,now=Date.now();
  if(temporary){session.state=V4State.reduce(session.state,event,now);memory.set(k,encode(session.state,code));return copy(session.state);}
  if(MEM_ONLY)throw Error('account-changed');
  const ref=dbRef(path);if(typeof ref.transaction!=='function')throw Error('transaction-unavailable');
  let rejected=null;
  const result=await ref.transaction(raw=>{
   try{rejected=null;return encode(V4State.reduce(decode(raw,code),event,now),code);}
   // RTDB can first call with an empty local cache; returning the current value
   // allows its conflict retry. Invalid final state is preserved, never reset.
   catch(error){rejected=error;return raw;}
  },undefined,false);
  if(!result.committed)throw Error('save-not-committed');
  const saved=decode(result.snapshot.val(),code);session.state=saved;
  if(rejected)throw rejected;
  return copy(saved);
 }
 V4State.configure({read,dispatch});
 return {open,decode,encode};
})();

function V4App(props){
 const [ready,setReady]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setReady(false);setError(false);V4Persistence.open(props.me).then(()=>{if(active)setReady(true);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[props.me.id,props.me.schoolCode,attempt]);
 if(!ready)return React.createElement('main',{className:'v2-loading',role:error?'alert':'status'},React.createElement('div',null,React.createElement('p',null,error?'섬의 저장 상태를 불러오지 못했어요. 기존 기록은 그대로예요.':'내 마음섬을 준비하고 있어요…'),error&&React.createElement('button',{onClick:()=>setAttempt(n=>n+1)},'다시 불러오기'),error&&React.createElement('button',{onClick:props.onLogout},'처음으로')));
 return React.createElement(V4AppInner,props);
}
