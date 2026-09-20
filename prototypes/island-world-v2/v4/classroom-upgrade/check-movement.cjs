const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const[name,yFn]of [['scene.js','v4WalkY'],['friend-scene.js','v2WalkY']]){
 const source=fs.readFileSync('prototypes/island-world-v2/v4/'+name,'utf8');const a=source.indexOf('    if(!paused&&!passages.busy){let ix='),b=source.indexOf('\n    if(passages.busy)',a);assert(a>0&&b>a);
 const ctx=vm.createContext({Math,Object,paused:false,passages:{busy:false},keys:{d:true},inputVec:{x:0,z:0},yaw:0,route:[],actor:{position:{x:0,y:0,z:0}},V4:{speed:4.5},V2:{speed:3},dt:1/60,vx:0,vz:0,moving:false,walkable:(x,z)=>Math.abs(x)<5&&Math.abs(z)<5,[yFn]:()=>0});
 const run=()=>vm.runInContext(source.slice(a,b),ctx);
 for(let i=0;i<60;i++)run();assert(Math.abs(ctx.actor.position.x-4.5)<1e-6,'50% faster; same speed in '+name);
 for(let i=0;i<100;i++)run();assert(ctx.actor.position.x<5,'collision retained');
 ctx.actor.position.x=0;ctx.actor.position.z=0;ctx.keys={d:true,w:true};for(let i=0;i<60;i++)run();assert(Math.abs(Math.hypot(ctx.actor.position.x,ctx.actor.position.z)-4.5)<1e-6,'diagonal speed normalized');
 ctx.keys={};ctx.actor.position.x=0;ctx.actor.position.z=0;ctx.route=[{x:1,z:0}];ctx.dt=.04;for(let i=0;i<40;i++)run();assert.equal(ctx.route.length,0,'click route finishes without overshooting');
 ctx.inputVec={x:.5,z:0};ctx.actor.position.x=0;ctx.dt=1/60;for(let i=0;i<60;i++)run();assert(Math.abs(ctx.actor.position.x-2.25)<1e-6,'analogue joystick preserved');
}
console.log(JSON.stringify({pass:true,checks:['both islands move 4.5 units/s vs 3','normalised diagonals','collision boundary retained','click route completes at capped 40ms step','analogue joystick half speed']}));
