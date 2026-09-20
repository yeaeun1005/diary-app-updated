const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const out='renders/releases/classroom-controls-20260920/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),base=fs.readFileSync(out+'before-work/index.html','utf8'),page=fs.readFileSync(out+'candidate/index.html','utf8'),preview=fs.readFileSync(out+'memory-preview/index.html','utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const cut=(s,a,b)=>{const x=s.indexOf(a),y=s.indexOf(b,x);assert(x>=0&&y>x,a);return s.slice(x,y);};
for(const[a,b]of [['  const teacherLogin = async () => {','  // 학생 로그인 본체.'],['  const studentLoginWith = async','  const studentLogin = () =>'],['function dbRef(k)','// 실패를 그대로 던진다.'],['async function plazaPublic','// 오늘 우리 반이 많이 쓴 어휘']])assert.equal(cut(page,a,b),cut(base,a,b));
assert(!page.includes('const talkReturns = useMemo'));
assert(!page.includes('const [talkMap, setTalkMap]'));
for(const[f,h]of Object.entries(m.files)){const b=fs.readFileSync(out+'candidate/'+f);assert.equal(sha(b),h);if(f.endsWith('.js'))new vm.Script(b.toString());}
for(const html of[page,preview])for(const a of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(a[1].trim())new vm.Script(a[1]);
assert(preview.includes("connect-src 'none'")&&preview.includes('var __DB = {}')&&!/firebase\.initializeApp|firebase-database-compat/.test(preview));
const old=JSON.parse(fs.readFileSync('renders/releases/mind-dialogue-20260920/manifest.json'));
const changed=Object.entries(m.files).filter(([f,h])=>f!=='index.html'&&old.files[f.replace(m.assetPath,old.assetPath)]!==h).map(([f])=>f.slice(m.assetPath.length+1));
assert.deepEqual(changed.sort(),['activities.js','app.js','student-tools.js','scene.js','friend-scene.js','friend-view.js','sea-view.js','legacy/board.js','legacy/landing.js','care-model.js','teacher-tools.js','classroom.css'].sort());
console.log(JSON.stringify({pass:true,version:m.version,files:Object.keys(m.files).length,changed,checks:['all candidate JS and HTML syntax','86 static hashes','unchanged authentication/DB/public boundaries','Firebase removed; connect-src none']}));
