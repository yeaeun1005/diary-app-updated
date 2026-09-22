/* Local memory-preview observation only; absent from production. */
(()=>{
 const out=document.createElement('output');out.id='local-audio-observation';out.hidden=true;document.body.appendChild(out);
 const events=[],original=SND.el;
 SND.el=function(name){const a=original(name);if(a&&!a.dataset.observed){a.dataset.observed='1';for(const type of ['playing','ended','error'])a.addEventListener(type,()=>{events.push({name,type});refresh();});}return a;};
 function refresh(){out.dataset.audio=JSON.stringify({enabled:SND.on(),events:events.slice(-40),fontLoaded:document.fonts.check('400 17px Pretendard','마음 일기'),elements:Object.fromEntries(Object.entries(SND.els).map(([n,a])=>[n,{file:a.src.split('/').pop(),paused:a.paused,time:a.currentTime,duration:a.duration,ready:a.readyState,error:a.error?.code||null}]))});}
 setInterval(refresh,200);refresh();
})();
