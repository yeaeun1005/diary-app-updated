const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const out='renders/releases/review-polish-20260922/',m=JSON.parse(fs.readFileSync(out+'manifest.json')),page=fs.readFileSync(out+'candidate/index.html','utf8'),src=out+'candidate/'+m.assetPath+'/';
const storage=new Map(),played=[];
const audio=()=>({paused:true,currentTime:0,addEventListener(){},play(){this.paused=false;played.push(this.src);return Promise.resolve();},pause(){this.paused=true;}});
const ctx=vm.createContext({URL,console,setTimeout,clearTimeout,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{currentScript:{src:'https://local.test/'+m.assetPath+'/sound.js'},createElement:()=>audio()},window:{},CREDITS:{sections:[{title:'글꼴',items:[]},{title:'소리',items:[]}]}});
vm.runInContext(page.slice(page.indexOf('var SND = {'),page.indexOf('// 작은 나무 팻말 모양')),ctx);
vm.runInContext(fs.readFileSync(src+'sound.js','utf8'),ctx);const S=ctx.SND;
for(const name of ['start','login','tut','boat','empathy'])S.play(name);assert.equal(Object.keys(S.els).length,0);assert.equal(played.length,0);
S.set(true);S.play('start');assert(played.at(-1).endsWith('humordome-magic-button-click-453255.mp3'));
S.play('login');assert(S.els.start.paused);assert(played.at(-1).endsWith('universfield-computer-mouse-click-352734.mp3'));
S.play('tut');assert(S.els.login.paused);assert.equal(S.els.tut.playbackRate,1);S.els.tut.currentTime=.4;S.play('tut');assert.equal(S.els.tut.currentTime,0);
S.play('boat');assert(S.els.tut.paused);S.play('empathy');assert(S.els.boat.paused);assert(played.at(-1).endsWith('shidenbeatsmusic-sound-effect-twinklesparkle-115095.mp3'));assert.equal(S.els.empathy.volume,.22);S.set(false);assert(Object.values(S.els).every(a=>a.paused));const n=played.length;S.play('start');assert.equal(played.length,n);
assert(page.includes('SND.play("login");'));assert(fs.readFileSync(src+'legacy/landing.js','utf8').includes("SND.play('start')"));assert(fs.readFileSync(src+'passages.js','utf8').includes("if(p==='sailing')SND.play('boat')"));
const probe=fs.readFileSync(out+'memory-preview/index.html','utf8');assert(!page.includes('__audio-probe'));assert(probe.includes('__audio-probe'));
const files=[...JSON.parse(fs.readFileSync('prototypes/island-world-v2/v4/audio-type/ASSETS.json')),...JSON.parse(fs.readFileSync('prototypes/island-world-v2/v4/final-release/ASSETS.json'))];
for(const f of files){const name=(f.file.endsWith('.mp3')?'sounds/':'fonts/')+f.file;assert.equal(crypto.createHash('sha256').update(fs.readFileSync(src+name)).digest('hex'),f.sha256);}
assert.equal(fs.readFileSync(src+'fonts/PretendardVariable.woff2').subarray(0,4).toString(),'wOF2');
const guides=fs.readFileSync(src+'guides.js','utf8');assert(guides.includes("'1. 날짜를 확인해요'"));assert(!/'[1-5]  /.test(guides));
console.log(JSON.stringify({pass:true,checks:['muted default creates no audio','five supplied originals mapped, including empathy','switching effects stops overlap','repeat tutorial restarts at original speed','mute stops active effects','original audio and font hashes','preview instrumentation absent from production','numbered guide punctuation']}));
