// Reuse reviewed offline checks against the current candidate, without editing old tests.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),{spawn}=require('node:child_process');
const release='reward-order-20260923';
const out='renders/releases/'+release+'/';
const manifest=JSON.parse(fs.readFileSync(out+'manifest.json'));
const assets=out+'candidate/'+manifest.assetPath+'/';
const suite=[
 'credits-registration/check-registration.cjs',
 'review-polish/check.cjs','review-polish/check-review.cjs','review-polish/check-land.cjs','review-polish/check-empathy.cjs',
 'final-release/check-audio.cjs','final-release/check-empathy.cjs','final-release/check-guides.cjs','final-release/check-chart.cjs',
 'social-upgrade/check-sharing.cjs','diary-board-fixes/check-flows.cjs','diary-board-fixes/check-dialogue.cjs',
 'student-refinements/check-refinements.cjs','student-refinements/check-persistence.cjs',
 'classroom-upgrade/check-components.cjs','classroom-upgrade/check-care.cjs'
];
if(process.argv[2]==='--one'){
 const name=process.argv[3];if(!suite.includes(name))throw Error('Unknown offline check');
 const file=path.resolve('prototypes/island-world-v2/v4',name);
 let code=fs.readFileSync(file,'utf8').replace(/renders\/releases\/(credits-registration-20260923|review-polish-20260922|diary-board-fixes-20260921|student-refinements-20260921|classroom-controls-20260920)\//g,out);
 if(name==='student-refinements/check-persistence.cjs')process.argv[2]=release;
 // Keep the historical broken fixture while checking the current registration code.
 if(name==='credits-registration/check-registration.cjs')code=code.replace("out+'before-work/index.html'","'renders/releases/credits-registration-20260923/before-work/index.html'");
 // The current preview intentionally omits the earlier audio instrumentation.
 if(name==='final-release/check-audio.cjs')code=code.replace("assert(probe.includes('__audio-probe'));","assert(!probe.includes('__audio-probe'));");
 // Run source-only checks against the exact shipped assets.
 if(name==='final-release/check-guides.cjs')code=code.replace('prototypes/island-world-v2/v4/final-polish/guides.js',assets+'guides.js');
 if(name==='social-upgrade/check-sharing.cjs'){
  code=code.replace("__dirname+'/sharing.js'",JSON.stringify(assets+'sharing.js'));
  for(const file of ['app.js','scene.js','sea-scene.js'])code=code.replace('prototypes/island-world-v2/v4/'+file,assets+file);
 }
 if(name==='classroom-upgrade/check-care.cjs')code=code.replace("__dirname+'/care-model.js'",JSON.stringify(assets+'care-model.js'));
 // Current guides are child components; hook harnesses do not render children.
 if(name==='diary-board-fixes/check-flows.cjs')code=code.replace('v4h:h,','v4h:h,V4ActivityGuide:()=>null,').replaceAll("click('답하기')","click('내 답 쓰기')").replaceAll("click('저장')","click('답 저장하기')");
 if(name==='classroom-upgrade/check-components.cjs')code=code.replace('V4ShareToggle:()=>null,','V4OwnSharedDiaries:()=>null,V4ShareToggle:()=>null,');
 // The approved UI removed leading zeroes from dialogue step buttons.
 if(name==='diary-board-fixes/check-dialogue.cjs')code=code.replaceAll("click('01관찰')","click('1관찰')").replaceAll("click('02느낌')","click('2느낌')").replaceAll("click('05돌아보기')","click('5돌아보기')");
 const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(code,file);
}else{
 const logDir='renders/submission-reward-fix-20260923/suite';fs.mkdirSync(logDir,{recursive:true});
 const prior=process.argv[2]==='--failed'?JSON.parse(fs.readFileSync(logDir+'/suite-results.json')).results:[];
 const selected=prior.length?prior.filter(r=>!r.pass).map(r=>r.name):suite;
 let next=0;const results=prior.filter(r=>r.pass);
 const run=name=>new Promise(resolve=>{
  const child=spawn(process.execPath,[__filename,'--one',name],{stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
  child.on('close',status=>{fs.writeFileSync(logDir+'/'+name.replaceAll('/','-')+'.log',output);const result={name,pass:status===0,status};results.push(result);if(status)result.failure=output.slice(-3000);resolve();});
 });
 Promise.all(Array.from({length:4},async()=>{while(next<selected.length){const name=selected[next++];await run(name);}})).then(()=>{
  const report={candidate:manifest.version,release,passed:results.filter(r=>r.pass).length,total:results.length,results};
  fs.writeFileSync(logDir+'/suite-results.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
 });
}
