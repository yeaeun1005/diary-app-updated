const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('prototypes/island-world-v2/v4/final-polish/guides.js','utf8');
const effect=source.slice(source.indexOf(' useEffect(()=>{\n  let seen='),source.indexOf('\n useEffect(()=>{if(!active)',source.indexOf(' useEffect(()=>{\n  let seen=')));
function run(action){
 let timer=null,cleanup,begun=0;const listeners=new Map();
 const engaged=new Set();
 const ctx=vm.createContext({V4ActivityGuideEngaged:engaged,key:'local-guide',begin:()=>begun++,localStorage:{getItem:()=>null},setTimeout:fn=>{timer=fn;return 1;},clearTimeout:()=>timer=null,useEffect:fn=>cleanup=fn(),document:{addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)}});
 vm.runInContext(effect,ctx);assert.equal(listeners.size,4);
 if(action==='close')cleanup();else if(action)listeners.get(action)({type:action});
 if(timer)timer();
 assert.equal(begun,action?0:1);assert.equal(listeners.size,0);
 if(action&&action!=='close'){vm.runInContext(effect,ctx);assert.equal(timer,null);assert.equal(listeners.size,0,'saving/remounting never reopens an interrupted guide');}
}
for(const action of [null,'pointerdown','keydown','beforeinput','input','close'])run(action);
console.log(JSON.stringify({pass:true,checks:['idle first visit still shows guide','click/typing/composition input cancels delayed guide','unmount clears timer and listeners']}));
