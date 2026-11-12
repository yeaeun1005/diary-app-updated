/* User-selected effects, sharing the existing sound preference and audio elements. */
(()=>{
 const base=new URL('sounds/',document.currentScript.src),effects={
  start:{file:'humordome-magic-button-click-453255.mp3',vol:.18},
  login:{file:'universfield-computer-mouse-click-352734.mp3',vol:.28},
  tut:{file:'creatorshome-turn-a-page-336933.mp3',vol:.22},
  boat:{file:'universfield-water-splash-199583.mp3',vol:.18},
  empathy:{file:'shidenbeatsmusic-sound-effect-twinklesparkle-115095.mp3',vol:.22}
 };
 for(const [name,c]of Object.entries(effects))SND.cfg[name]={src:new URL(c.file,base).href,vol:c.vol};
 const play=SND.play,set=SND.set;
 SND.play=function(name,rate){
  if(!SND.on())return;
  if(effects[name])for(const other of Object.keys(effects)){if(other!==name&&SND.els[other]){SND.els[other].pause();SND.els[other].currentTime=0;}}
  play(name,rate);
 };
 SND.set=function(on){
  set(on);
  if(!on)for(const a of Object.values(SND.els)){a.pause();try{a.currentTime=0;}catch{}}
  else for(const name of Object.keys(effects))SND.el(name);
 };
})();
