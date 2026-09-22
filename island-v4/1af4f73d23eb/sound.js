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
 CREDITS.sections.find(s=>s.title==='글꼴').items.push({name:'Pretendard Variable 1.3.9',by:'길형진 (Kil Hyung-jin)',note:'긴 본문과 입력칸. SIL Open Font License 1.1. github.com/orioncactus/pretendard'});
 const sources=[['Magic Button Click','humordome','첫 화면 시작','technology-magic-button-click-453255'],['Computer Mouse Click','Universfield','로그인 버튼','film-special-effects-computer-mouse-click-352734'],['Turn a Page','CreatorsHome','튜토리얼 다음','film-special-effects-turn-a-page-336933'],['Water Splash','Universfield','배 출발','film-special-effects-water-splash-199583']];
 for(const [name,by,place,slug]of sources)CREDITS.sections.find(s=>s.title==='소리').items.push({name,by,note:place+'. Pixabay Content License. https://pixabay.com/sound-effects/'+slug+'/'});
})();
