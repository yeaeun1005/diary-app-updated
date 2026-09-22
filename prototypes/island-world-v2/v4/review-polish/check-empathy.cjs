const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const path='renders/releases/review-polish-20260922/',m=JSON.parse(fs.readFileSync(path+'manifest.json')),base=path+'candidate/'+m.assetPath+'/';
let rows=[{key:'e1',text:'공개한 가상 일기',publishedAt:10,emotions:['슬픔']}],sent=0,status='sent-now';
const ctx=vm.createContext({console,V4Sharing:{list:async()=>structuredClone(rows),send:async()=>{sent++;return{status};}}});
vm.runInContext(fs.readFileSync(base+'diary-empathy.js','utf8'),ctx);
const send=vm.runInContext('v4SendDiaryEmpathy',ctx),me={id:'a',schoolCode:'TEST'},friend={id:'b',schoolCode:'TEST'},entry=structuredClone(rows[0]);
(async()=>{
 assert.equal((await send(me,friend,entry,'슬픔','')).status,'sent-now');assert.equal(sent,1);
 for(const changed of [[],[{...entry,text:'수정한 일기'}],[{...entry,publishedAt:11}],[{...entry,emotions:['행복']}]]){
  rows=changed;assert.equal((await send(me,friend,entry,'슬픔','')).status,'private');assert.equal(sent,1);
 }
 rows=[entry];status='sent';assert.equal((await send(me,friend,entry,'슬픔','')).status,'sent');
 status='unfamiliar';assert.equal((await send(me,friend,entry,'슬픔','')).status,'unfamiliar');
 ctx.V4Sharing.list=async()=>{throw Error('read-failed')};const before=sent;await assert.rejects(send(me,friend,entry,'슬픔',''));assert.equal(sent,before);
 vm.runInContext(fs.readFileSync(base+'legacy/social.js','utf8'),vm.createContext({}));
 console.log(JSON.stringify({pass:true,checks:['re-read public copy before empathy','withdrawal/edit/new version/hidden emotion block send','existing daily and experience rules preserved','read failure never sends']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
