// Meaningful regression checks using the production pure/data functions, entirely in RAM.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('index.html','utf8');
const ctx=vm.createContext({console,QC:{HA:1,LA:1,LV:1,HV:1},PLAZA_MAX:240,PLAZA_MIN_PUB:3,Date});
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
vm.runInContext(`var DB={}; function get(p){return p.split('/').reduce((v,k)=>v&&v[k],DB)||null;} function set(p,v){var k=p.split('/'),o=DB;for(var i=0;i<k.length-1;i++)o=o[k[i]]||(o[k[i]]={}); if(v==null)delete o[k.at(-1)];else o[k.at(-1)]=JSON.parse(JSON.stringify(v));} function dbRef(p){return {update:async o=>Object.keys(o).forEach(k=>set(p+'/'+k,o[k])),set:async v=>set(p,v),remove:async()=>set(p,null)}};var sGet=async p=>get(p);function nowTs(){return 1700000000000;}function plazaKey(c){return 'plaza/'+c;}`,ctx);
vm.runInContext(between('function mulberry32(', '// 클레이 디오라마.'),ctx);
vm.runInContext(between('function anonKey(', '// 오늘 날짜 키'),ctx);
vm.runInContext(between('function plazaCleanText(', '// 오늘 우리 반이 많이 쓴 어휘'),ctx);
vm.runInContext(between('var PLAZA_JOSA =', '// 일기 읽기.'),ctx);
vm.runInContext(between('function islandState(', '// 영역별 식생 규칙.'),ctx);
(async()=>{
 const run=s=>vm.runInContext(s,ctx);
 await run(`plazaAsk('LOCAL','로컬 질문','자기 이해',true,null,null).then(id=>qid=id)`);
 assert.equal(await run(`plazaCurrent('LOCAL').then(q=>q.t)`),'로컬 질문');
 assert.equal(await run(`plazaMyAnswer('LOCAL',qid,'self')`),null);
 for(let i=0;i<3;i++){
  await run(`plazaAnswerPut('LOCAL',qid,{id:'p${i}',name:'가상'}, {o:'익명 답 ${i}',fl:[]})`);
  await run(`plazaMyAnswer('LOCAL',qid,'p${i}').then(a=>plazaSetState('LOCAL',qid,a,1))`);
  assert.equal(await run(`plazaPublic('LOCAL',qid,'self').then(a=>a.length)`),i<2?0:3);
 }
 await run(`plazaAnswerPut('LOCAL',qid,{id:'self',name:'나'},{o:'연습 답',fl:[{l:'편안',q:'LA'}]})`);
 assert.equal(await run(`plazaMyAnswer('LOCAL',qid,'self').then(a=>a.s)`),0);
 assert.equal(run(`JSON.stringify(get('plaza/LOCAL/pub/'+qid)).includes('sid')`),false);
 assert.equal(run(`get('isle')`),null,'Board must not grow the island');
 await run(`plazaMyAnswer('LOCAL',qid,'self').then(a=>plazaSetState('LOCAL',qid,a,1))`);
 assert.equal(await run(`plazaPublic('LOCAL',qid,'self').then(a=>a.filter(x=>x.mine).length)`),1);
 await run(`plazaAnswerPut('LOCAL',qid,{id:'self',name:'나'},{o:'수정',fl:[],flagged:true})`);
 assert.equal(await run(`plazaMyAnswer('LOCAL',qid,'self').then(a=>a.s)`),2);
 assert.equal(run(`get('plaza/LOCAL/pub/'+qid+'/'+anonKey('self'))`),null,'Editing removes old public copy');
 assert.equal(run(`plazaNameHit('모래가 도와줬어요',['모래'],'탐험이')`),'모래');
 assert.equal(run(`plazaNameFix('모래가 도와줬어요','모래')`),'친구가 도와줬어요');
 assert.equal(run(`islandState([{analysis:{hits:[{label:'편안',q:'LA'},{label:'편안',q:'LA'}]}},{analysis:{hits:[{label:'슬픔',q:'LV'}]}}]).length`),2);
 const generated=fs.readFileSync('prototypes/island-world-v2/board.generated.js','utf8');assert(!generated.includes('new THREE.WebGLRenderer'));assert(generated.includes('if (a) { var pl = await plazaPublic'));assert(generated.includes('plazaNameHit'));assert(generated.includes('plazaAnswerPut'));
 const page=fs.readFileSync('renders/harness/world-v2.html','utf8');assert(page.includes("connect-src 'none'"));assert(!page.includes('firebase.initializeApp(firebaseConfig);'));assert(!page.includes('firebase-database-compat.js'));assert(!/<script[^>]+src="demo\//.test(page));
 // Script boundaries are valid; no accidental insertion into the report HTML template.
 for(const m of page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[1].trim())new vm.Script(m[1]);}
 console.log('PASS: memory board read/write; 0/2/3 public answer threshold; reviewer state; anonymous public copy; edit revocation; name protection; no island writes; vocabulary deduplication; no second renderer; Firebase isolation; HTML script syntax.');
})().catch(e=>{console.error(e);process.exit(1);});
