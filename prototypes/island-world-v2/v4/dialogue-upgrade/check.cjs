const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const out='renders/releases/mind-dialogue-20260920/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),base=fs.readFileSync(out+'before-work/index.html','utf8'),page=fs.readFileSync(out+'candidate/index.html','utf8'),preview=fs.readFileSync(out+'memory-preview/index.html','utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(page,base.replaceAll('island-v4/17bff4d0b27d/','island-v4/'+m.version+'/').replace('content="17bff4d0b27d"','content="'+m.version+'"'),'only asset references change in HTML; auth and DB unchanged');
for(const[f,h]of Object.entries(m.files)){const b=fs.readFileSync(out+'candidate/'+f);assert.equal(sha(b),h);if(f.endsWith('.js'))new vm.Script(b.toString());}
for(const html of[page,preview])for(const a of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(a[1].trim())new vm.Script(a[1]);
assert(preview.includes("connect-src 'none'")&&preview.includes('var __DB = {}')&&!/firebase\.initializeApp|firebase-database-compat/.test(preview));
const old=JSON.parse(fs.readFileSync('renders/releases/island-feedback-models-20260920/manifest.json'));
const changed=Object.entries(m.files).filter(([f,h])=>f!=='index.html'&&old.files[f.replace(m.assetPath,old.assetPath)]!==h).map(([f])=>f.slice(m.assetPath.length+1));
assert.deepEqual(changed.sort(),['activities.js','app.js','student-tools-model.js','student-tools.css','student-tools.js'].sort());
console.log(JSON.stringify({pass:true,version:m.version,files:Object.keys(m.files).length,changed,checks:['all candidate JS and HTML syntax','83 static hashes','unchanged authentication/DB/other world assets','Firebase removed; connect-src none']}));
