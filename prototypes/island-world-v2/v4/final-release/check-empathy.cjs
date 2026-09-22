// Verify failure handling using the actual release adapters and click handler.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir='renders/releases/review-polish-20260922/',m=JSON.parse(fs.readFileSync(dir+'manifest.json')),base=dir+'candidate/'+m.assetPath+'/';
let reads=0,writes=0,readFail=false,failAfterWrite=false,writeFail=false;
const me={id:'a',name:'가상 학생',schoolCode:'TEST'},friend={id:'b',schoolCode:'TEST'},word={label:'행복',q:'HA'};
const ctx=vm.createContext({console,Set,Date,Math,Promise,dayStamp:()=> '2026-09-22',nowTs:()=>123,labelKey:s=>s,empKey:id=>'emp/'+id,stuKey:s=>'stu/'+s,isleLoad:async()=>({state:[word]}),sGetStrict:async p=>{if(p.startsWith('stu/'))return[me,friend];reads++;if(readFail||failAfterWrite&&writes)throw Error('read-failed');return {};},empSend:async()=>{if(writeFail)throw Error('write-failed');writes++;return true;}});
vm.runInContext(fs.readFileSync(base+'sharing.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(base+'legacy/social.js','utf8'),ctx);
const sharing=vm.runInContext('V4Sharing',ctx);
(async()=>{
 readFail=true;await assert.rejects(sharing.send(me,friend,'행복',''));assert.equal(writes,0,'no send if empathy read fails');
 readFail=false;writeFail=true;await assert.rejects(sharing.send(me,friend,'행복',''));assert.equal(writes,0);
 writeFail=false;failAfterWrite=true;const sent=await sharing.send(me,friend,'행복','함께 기뻐');assert.equal(sent.status,'sent-now');assert.equal(writes,1);assert(sent.records.some(r=>r.from==='a'&&r.l==='행복'&&r.date==='2026-09-22'),'successful send retained after reread failure');
 // The real friend send handler must reject a second click before React rerenders.
 const source=fs.readFileSync(base+'friend-view.js','utf8');
 const handler=source.slice(source.indexOf(' async function send(){'),source.indexOf('\n useEffect(',source.indexOf(' async function send(){')));
 let calls=0,release,played=0;
 const uiCtx=vm.createContext({ui:{nearGrowth:word},sendLock:{current:false},socialReady:true,me,friend,message:'',alive:{current:true},dayStamp:()=> '2026-09-22',SND:{play:()=>played++},api:{current:{flyEmpathy:(p,done)=>done()}},V4Sharing:{send:()=>{calls++;return new Promise(r=>release=r);}},setSending(){},setNotice(){},setJustSent(){},setCompose(){},setMessage(){},setStar(){},setRecords(){}});
 vm.runInContext(handler,uiCtx);const click=vm.runInContext('send',uiCtx);
 const first=click();await click();assert.equal(calls,1);release({status:'sent-now',records:[]});await first;assert.equal(played,1);
 const duplicate=click();release({status:'sent',records:[]});await duplicate;assert.equal(played,1,'no success sound on duplicate');
 uiCtx.V4Sharing.send=async()=>{throw Error('failed')};await click();assert.equal(played,1,'no success sound on failure');assert.equal(uiCtx.sendLock.current,false,'retry unlocked');
 console.log(JSON.stringify({pass:true,checks:['strict empathy read failure blocks writes','write failure preserved','successful write survives follow-up read failure','rapid clicks send once','sound only on confirmed success','failure releases retry lock']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
