/* Original composition and hand-authored phrase charts for Prism Current.
 * One beat grid feeds the soundtrack, note charts and section feedback.
 * No downloaded music, samples, remote services or changes to legacy charts. */
(function(root){'use strict';
 const TRACK={id:'tidal-bloom',name:'Tidal Bloom',subtitle:'An eight-part journey',bpm:116,root:50,bars:56,style:'felt',chartVersion:1,description:'Glass keys and warm strings. Follow a returning melody through eight chapters, with room to breathe before the final bloom.'};
 const PARTS=[
  ['arrival','Arrival',0,4,'Listen, then join the melody.'],
  ['glasswater','Glasswater',4,12,'Let each hand answer the other.'],
  ['gathering','Gathering',12,20,'Open your strokes as the rhythm builds.'],
  ['current','Full Current',20,28,'Follow the alternating down and up cuts.'],
  ['stillwater','Stillwater',28,36,'A quiet passage. Relax your shoulders.'],
  ['return','Return',36,44,'The opening melody returns with new accents.'],
  ['bloom','Bloom',44,52,'Bring the phrases together.'],
  ['release','Release',52,57,'Finish gently. Let the last chord ring.']
 ];
 function sections(){return PARTS.map(([id,name,a,b,cue])=>({id,name,cue,start:a*4*60/TRACK.bpm,end:b*4*60/TRACK.bpm}));}
 // Each tuple is [beat within 2 bars, lane, row, direction]. No random notes.
 // Lane order is left outer, left inner, right inner, right outer.
 const FLOW={
  answer:[[0,1,1,0],[2,2,1,0],[4,1,0,6],[6,2,0,6]],
  open:[[0,0,1,0],[2,3,1,0],[4,1,0,6],[6,2,0,6]],
  rest:[[0,1,0,6],[4,2,0,6]],
  bloom:[[0,1,1,0],[1,2,1,0],[3,0,0,6],[4,3,0,6],[6,1,1,0],[7,2,1,0]]
 };
 const PULSE={
  answer:[[0,1,1,0],[1,2,1,0],[2,1,0,1],[3,2,0,1],[4,0,1,4],[5,3,1,5],[6,1,0,1],[7,2,0,1]],
  open:[[0,0,1,4],[1,3,1,5],[2,1,0,1],[3,2,0,1],[4,1,1,0],[5,2,1,0],[6,0,0,6],[7,3,0,6]],
  rest:[[0,1,1,0],[2,2,1,0],[4,1,0,6],[6,2,0,6]],
  bloom:[[0,0,1,4],[.5,3,1,5],[1.5,1,0,1],[2.5,2,0,1],[4,1,1,0],[4.5,2,1,0],[5.5,0,0,6],[6.5,3,0,6]]
 };
 function chart(difficulty){
  if(!['flow','pulse'].includes(difficulty))throw Error('Unknown Tidal Bloom chart');
  const notes=[],patterns=difficulty==='flow'?FLOW:PULSE;
  for(let bar=2;bar<54;bar+=2){
   if(bar===28)continue; // Four-second full rest at the arrangement's turn.
   const quiet=bar<4||(bar>=30&&bar<36)||bar>=52;
   const key=quiet?'rest':bar>=44?'bloom':bar>=20&&bar<28?'open':bar>=12&&bar<20?'open':'answer';
   for(const [beat,lane,row,dir] of patterns[key]){
    // Space after every eight-bar phrase; never bury a cadence in more notes.
    if(bar%8===2&&bar>4&&beat>=6)continue;
    const time=(bar*4+beat)*60/TRACK.bpm;
    notes.push({id:notes.length,time,lane,row,hand:lane<2?0:1,dir});
   }
  }
  return {...TRACK,difficulty,duration:228*60/TRACK.bpm,notes,sections:sections()};
 }
 function events(){
  const out=[],add=(part,pitch,beat,duration,velocity=.3,pan=0)=>out.push({part,pitch,beat,duration,velocity,pan});
  // Dm9 / Bbmaj7 / Fmaj9 / Cadd9. Original eight-bar call-and-response melody.
  const chords=[[50,57,60,64],[46,53,57,62],[53,60,64,67],[48,55,62,64]];
  const motifs=[
   [[0,74,1],[1.5,77,.5],[2,81,1],[3.5,79,.5]],
   [[0,77,1.5],[2,74,.75],[3,72,.75]],
   [[0,74,.75],[1,77,.75],[2.5,79,.5],[3,81,.75]],
   [[0,77,2],[2.5,74,1]],
   [[0,72,1],[1.5,74,.5],[2,77,1],[3.5,76,.5]],
   [[0,74,1.5],[2,72,.75],[3,69,.75]],
   [[0,72,1],[1.5,76,.5],[2,79,1],[3.5,77,.5]],
   [[0,76,1.5],[2,74,1.75]]
  ];
  for(let bar=0;bar<56;bar++){
   const b=bar*4,ch=chords[Math.floor(bar/2)%4];
   const intro=bar<4,quiet=bar>=28&&bar<36,outro=bar>=52;
   const peak=(bar>=20&&bar<28)||(bar>=44&&bar<52);
   const rise=bar>=12&&bar<20;
   for(let j=0;j<4;j++)add('string',ch[j]+12,b,3.7,quiet?.14:.115,(j-1.5)*.38);
   if(bar<2){add('felt',74,b,2.2,.3,-.15);add('glass',81,b+2,1.3,.15,.2);}
   else for(const [at,pitch,dur] of motifs[bar%8]){
    if((quiet||outro)&&at>2)continue;
    add('felt',pitch+(bar>=44&&bar%4===2?12:0),b+at,dur,quiet?.34:peak?.5:.42,Math.sin(bar*.6)*.12);
    if(peak&&at===0)add('glass',pitch+12,b+at,1.1,.12,.35);
   }
   if(!intro&&!outro){
    for(const at of (quiet?[0]:peak?[0,1.5,2,3.5]:[0,2]))add('bass',ch[0]-12,b+at,.65,quiet?.3:.48);
   }
   if(!intro&&!quiet&&!outro){
    for(const at of (peak?[0,1.5,2,3]:[0,2]))add('kick',0,b+at,.25,peak?.56:.46);
    for(const at of [1,3])add('snare',0,b+at,.15,peak?.23:.16,.08);
    for(let i=0;i<(peak?8:4);i++)add('hat',0,b+i*(peak?.5:1),.035,i%2?.075:.11,-.22);
    if(rise||peak||bar>=36)for(const [i,j] of [0,2,1,3].entries())add('glass',ch[j]+24,b+i+.5,.36,peak?.14:.1,(i%2?1:-1)*.4);
   }
   if(bar===18||bar===42)for(let i=0;i<4;i++)add('felt',ch[i]+24,b+i, .6,.2+i*.025,(i-1.5)*.2);
  }
  for(const [i,pitch] of [50,57,62,65,69,74].entries())add('string',pitch,224,3.8,.11,(i-2.5)*.14);
  return out.sort((a,b)=>a.beat-b.beat);
 }
 const api={TRACK,sections,chart,events};root.PrismTidal=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
