const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let db={},reads=[],writes=[],fail=false,hook=null;const copy=o=>o==null?o:JSON.parse(JSON.stringify(o));
const get=p=>p.split('/').filter(Boolean).reduce((a,k)=>a?.[k],db)??null;
function set(p,v){const ks=p.split('/').filter(Boolean);let o=db;for(const k of ks.slice(0,-1))o=o[k]||(o[k]={});if(v==null)delete o[ks.at(-1)];else o[ks.at(-1)]=copy(v);}
const me={id:'a',name:'가상학생',schoolCode:'TEST'},friend={id:'b',schoolCode:'TEST'};
const ctx=vm.createContext({console,Date,Math,Set,JSON,Error,Promise,nowTs:()=>123,entryKey:n=>'e'+n,d2Clean:copy,d2Key:id=>'d2/'+id,isleKey:id=>'isle/'+id,stuKey:code=>'stu/'+code,sGetStrict:async p=>{reads.push(p);return copy(get(p));},dbRef:p=>({update:async o=>{if(fail)throw Error('failure');writes.push(copy(o));Object.entries(o).forEach(([k,v])=>set(p+'/'+k,v));},transaction:async fn=>{if(hook){const f=hook;hook=null;await f();}if(fail)throw Error('failure');const n=fn(copy(get(p)));if(n===undefined)return{committed:false};set(p,n);return{committed:true,snapshot:{val:()=>copy(n)}};}})});
vm.runInContext(fs.readFileSync(__dirname+'/sharing.js','utf8'),ctx);const api=vm.runInContext('V4Sharing',ctx);
(async()=>{
set('stu/TEST',[me,friend]);set('stu/OTHER',[{id:'x'}]);set('isle/a',{code:'TEST',v:{happy:{l:'기쁨'}}});set('isle/b',{code:'TEST',v:{happy:{l:'기쁨'}}});
const e={ts:1,date:'2026-09-20',text:'가상의 친구와 함께 그림을 그려서 기뻤어요.',analysis:{hits:[{label:'기쁨',q:'HA'}]}};
await api.write(me.id,e);assert.equal((await api.list(friend,me.id)).length,0,'new diary defaults private');
await api.publish(me,e,true);reads=[];const pub=await api.list(friend,me.id);assert.equal(pub[0].text,e.text);assert(!reads.some(x=>x.startsWith('d2/')),'visitor never reads private diary');assert.deepEqual(Object.keys(get('isle/a/shared/e1')).sort(),['date','emotions','public','publishedAt','schoolCode','text']);
await assert.rejects(api.list(me,'x'));await assert.rejects(api.publish(me,{...e,text:'stale'},true));
fail=true;const before=JSON.stringify(db);await assert.rejects(api.write(me.id,{...e,text:'edit'}));assert.equal(JSON.stringify(db),before,'failed atomic edit preserves both');fail=false;
await api.write(me.id,{...e,text:'수정한 가상 일기'});assert.equal((await api.list(friend,me.id)).length,0,'edit revokes public copy');
const changed={...e,text:'수정한 가상 일기'};await api.publish(me,changed,true);await api.publish(me,changed,false);assert.equal((await api.list(friend,me.id)).length,0,'unpublish');
hook=()=>api.write(me.id,{...changed,text:'다른 기기의 수정'});await assert.rejects(api.publish(me,changed,true));assert.equal((await api.list(friend,me.id)).length,0,'concurrent edit prevents stale publication');
const latest={...e,text:'다른 기기의 수정'};await api.publish(me,latest,true);await api.write(me.id,latest,true);assert.equal(get('d2/a/e1'),null);assert.equal((await api.list(friend,me.id)).length,0,'delete revokes');
await api.write(me.id,e);await api.publish(me,e,true);await api.clear(me.id);assert.equal((await api.list(friend,me.id)).length,0,'teacher clear revokes');assert.equal(get('d2/a/_migrated'),true);
assert.equal(api.cleanMessage('a'.repeat(120)).length,100);await assert.rejects(api.send(me,friend,'기쁨','01012345678'));
const app=fs.readFileSync('prototypes/island-world-v2/v4/app.js','utf8'),scene=fs.readFileSync('prototypes/island-world-v2/v4/scene.js','utf8'),sea=fs.readFileSync('prototypes/island-world-v2/v4/sea-scene.js','utf8');
assert(!app.includes('autoHome:true'));assert(!app.includes("button('다시 연습'"));assert(!scene.includes('const boardTitle=new T.Sprite'));assert(sea.includes('g=v4SeaOwnIsland(null,{miniature:true})'));
console.log(JSON.stringify({pass:true,checks:['private by default','explicit publication and class boundary','visitor reads only public summary','failed edits atomic','edit/delete/clear revoke','concurrent edit blocks stale publish','message length/contact checks','sea return and new miniatures','removed repeat and floating board sign']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
