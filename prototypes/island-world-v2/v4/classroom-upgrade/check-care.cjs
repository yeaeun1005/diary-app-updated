const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');let db={},reads=[],writes=[],fail=false;
const ctx=vm.createContext({console,Set,Date,Object,Number,tprivKey:(id,h)=>'tpriv/'+id+'/'+h,nowTs:()=>42,sGetStrict:async k=>{reads.push(k);if(fail)throw Error('failure');return db[k]??null;},dbRef:k=>({set:async v=>{if(fail)throw Error('failure');writes.push(k);const n=k.lastIndexOf('/');db[k.slice(0,n)]={...(db[k.slice(0,n)]||{}),[k.slice(n+1)]:JSON.parse(JSON.stringify(v))};}})});
vm.runInContext(fs.readFileSync(__dirname+'/care-model.js','utf8'),ctx);const api=vm.runInContext('V4Care',ctx),teacher={teacherId:'teacher-a',th:'fake-hash',schoolCode:'FAKE'},students=[{id:'s1',schoolCode:'FAKE'},{id:'s2',schoolCode:'FAKE'}];
(async()=>{
 assert.equal(JSON.stringify(await api.load(teacher)),'{}');await assert.rejects(api.load({id:'student',schoolCode:'FAKE'}));
 await assert.rejects(api.save(teacher,students,'other','observe',[]));await assert.rejects(api.save(teacher,students,'s1','acted',[]));
 const picked=[api.actions[0],api.actions[1]];await api.save(teacher,students,'s1','acted',picked);await api.save(teacher,students,'s2','observe',[]);
 let data=await api.load(teacher);assert.equal(data.s1.status,'acted');assert.equal(data.s1.actions.length,2);assert.equal(data.s2.status,'observe');
 const before=JSON.stringify(db);fail=true;await assert.rejects(api.save(teacher,students,'s1','observe',[]));assert.equal(JSON.stringify(db),before);await assert.rejects(api.load(teacher));fail=false;
 await api.save(teacher,students,'s1','observe',picked);data=await api.load(teacher);assert.equal(data.s1.status,'observe');assert.equal(data.s1.actions.length,2,'preserve previously recorded actions');
 assert.equal(JSON.stringify(await api.load({...teacher,teacherId:'teacher-b'})),'{}');assert(writes.every(k=>k.startsWith('tpriv/teacher-a/fake-hash/care/')));assert(!writes.some(k=>/stu_|plaza|isle|d2/.test(k)));
 assert.equal(api.clean({status:'acted',actions:['unapproved text'],updatedAt:42}),null);
 console.log(JSON.stringify({pass:true,checks:['teacher-private choices only','same-class roster boundary','two statuses and allowlisted actions','multiple actions and previous action preservation','write/read failure surfaced without optimistic success','separate teachers and unchanged student/public records']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
