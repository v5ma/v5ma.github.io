/* First Steps: short, input-graded browser lessons. No catalog or song-score writes.
 * The normal collision/scoring core, audio transport and pause guards remain in use. */
(function(root){'use strict';
 const C=root.PrismCore||(typeof require==='function'?require('./core'):null);
 const STORE='prism-current.v1.lessons',BUFFER='__prism-lesson__',MODES=['slice','keys','gamepad'];
 const STEPS=[
  {id:'hands',name:'Meet your hands',lanes:[1,2,0,3],beats:[6,8,10,12],dirs:[6,6,6,6],required:3},
  {id:'timing',name:'Find the beat',lanes:[1,2,1,2,0,3],beats:[4,6,8,10,12,14],dirs:[6,6,6,6,6,6],required:4},
  {id:'direction',name:'Follow the arrows',lanes:[1,2,1,2,1,2],beats:[4,6,8,10,12,14],dirs:[0,0,1,1,2,3],required:4},
  {id:'pause',name:'Pause with confidence',lanes:[1,2,0,3],beats:[8,10,12,14],dirs:[6,6,6,6],required:2}
 ];
 function chart(step,mode){
  if(!Number.isInteger(step)||!STEPS[step]||!MODES.includes(mode))throw Error('Unknown lesson or input mode.');
  const p=STEPS[step],bpm=104,duration=(p.beats.at(-1)+3)*60/bpm;
  return {id:'first-light',name:p.name,bpm,bars:5,difficulty:'flow',duration,
   notes:p.lanes.map((lane,id)=>({id,lane,row:0,hand:lane<2?0:1,dir:p.dirs[id],time:p.beats[id]*60/bpm})),
   sections:[{id:p.id,name:p.name,start:0,end:duration,cue:'An input-graded lesson, not a scored song.'}],
   lesson:{version:1,step,mode,required:p.required,countIn:240/bpm}};
 }
 function buffer(context,song){
  if(!song.lesson||!STEPS[song.lesson.step]||song.duration>12)throw Error('Invalid lesson audio plan.');
  const rate=24000,out=context.createBuffer(2,Math.ceil(song.duration*rate),rate);
  for(let ch=0;ch<2;ch++){
   const data=out.getChannelData(ch);
   function tone(time,hz,volume,duration){const begin=Math.round(time*rate),length=Math.round(duration*rate);for(let i=0;i<length&&begin+i<data.length;i++){const t=i/rate;data[begin+i]+=volume*Math.sin(2*Math.PI*hz*t)*Math.sin(Math.PI*i/length)*Math.exp(-t*10);}}
   for(let beat=0;beat*60/song.bpm<song.duration;beat++)tone(beat*60/song.bpm,beat%4?660:880,beat<4?.09:.025,.05);
   for(const n of song.notes)tone(n.time,n.hand?392:293.665,.12,.22);
  }
  return out;
 }
 function assess(state,proof={}){
  const p=state?.song?.lesson;if(!p||!STEPS[p.step])return {passed:false,hits:0,bothHands:false,pause:false};
  const hit=state.song.notes.filter(n=>state.judged[n.id]==='hit'),bothHands=new Set(hit.map(n=>n.hand)).size===2;
  const pause=proof.paused===true&&proof.resumed===true;
  return {passed:state.state==='complete'&&hit.length>=p.required&&bothHands&&(p.step!==3||pause),hits:hit.length,bothHands,pause};
 }
 function load(text){try{const p=JSON.parse(text||'null');return p?.version===1&&Array.isArray(p.completed)?[...new Set(p.completed.filter(x=>MODES.includes(x)))]:[];}catch{return [];}}
 function instructions(step,mode){
  const slice=mode==='slice',buttons=mode==='gamepad'?'LT, LB, RB, RT':'D, F, J, K';
  const action=slice?'Swipe through the near notes with their matching hand.':'Tap '+buttons+' for the four lanes from left to right.';
  return [
   slice?'Mint L is left mouse; coral R is right mouse. On touch, choose L or R, then drag. A dot accepts any deliberate swipe direction.':action+' Mint L is the left pair; coral R is the right pair. Hold does not repeat a hit.',
   action+' Wait until each note reaches the near end of the runway. Listen to the soft beat, not just the screen.',
   slice?'Follow the arrow: down, then up, then inward. Use the correct hand. Dots allow any swipe direction.':action+' Follow this short phrase. Arrows are not graded in timing mode; physical direction is taught in the mouse/touch lesson.',
   'Pause now with '+(mode==='gamepad'?'Menu or B':'P, Escape or the Pause button')+'. Choose Resume, then connect at least two notes. Window changes and disconnection do not earn the pause step.'
  ][step];
 }
 function install(g){const $=id=>document.getElementById(id);let enabled=false,step=0,verdict=null,proof={},completed=[],passedSteps=[],retry=false,last='',progress='';
  try{completed=load(localStorage.getItem(STORE));}catch{}
  const card=document.createElement('section');card.id='lesson-card';card.innerHTML='<p class="eyebrow">FIRST STEPS</p><h2>Learn by connecting.</h2><p>Four short exercises teach your selected input, timing and pause. Mouse/touch also teaches cut direction. No song scores are changed.</p><button id="lesson-start">Learn to play</button><p id="lesson-history"></p>';$('practice-settings').before(card);
  const guide=document.createElement('aside');guide.id='lesson-guide';guide.hidden=true;guide.setAttribute('aria-label','Current lesson');guide.innerHTML='<p id="lesson-position" class="eyebrow"></p><h2 id="lesson-name"></h2><p id="lesson-instruction"></p><p id="lesson-goal"></p><div id="lesson-lanes" aria-label="Lanes from left to right"></div><p id="lesson-progress" role="status" aria-live="polite"></p>';document.body.append(guide);
  const review=document.createElement('p');review.id='lesson-review';review.hidden=true;$('result-detail').after(review);
  const again=document.createElement('button');again.id='lesson-retry';again.textContent='Retry this exercise';again.hidden=true;$('replay').after(again);
  function cancelRun(){enabled=false;verdict=null;proof={};passedSteps=[];step=0;g.audio.cache.delete(BUFFER);}
  function begin(){if(g.immersive||g.busy)return;g.abort();$('session-mode').value='full';$('session-mode').dispatchEvent(new Event('change',{bubbles:true}));enabled=true;step=0;g.track='first-light';g.difficulty='flow';g.syncControls();g.start();}
  function beforeStart(){if(!enabled)return;if(g.immersive){cancelRun();return;}if(g.state?.song.lesson&&g.state.song.lesson.mode!==g.input){step=0;passedSteps=[];verdict=null;}if(g.phase==='complete'&&verdict?.passed&&!retry){if(step===STEPS.length-1){cancelRun();return;}step++;}retry=false;}
  function selection(){return enabled&&!g.immersive?chart(step,g.input):null;}
  function prepare(song){if(!song.lesson)return null;proof={paused:false,resumed:false};verdict=null;last='';progress='';g.audio.cache.set(BUFFER,buffer(g.audio.context(),song));return BUFFER;}
  function paused(reason){if(enabled&&g.state?.song.lesson?.step===3&&['Paused','Paused by controller'].includes(reason))proof.paused=true;}
  function resumed(){if(enabled&&g.state?.song.lesson?.step===3&&proof.paused)proof.resumed=true;}
  function result(){verdict=assess(g.state,proof);if(verdict.passed)passedSteps[step]=true;
   if(step===3&&verdict.passed&&passedSteps.length===4&&passedSteps.every(Boolean)){
    completed=[...new Set([...completed,g.input])];try{localStorage.setItem(STORE,JSON.stringify({version:1,completed}));}catch{g.notice('Lesson complete. Device storage could not save this completion.');}
   }
  }
  function sync(){const active=enabled&&!!g.state?.song.lesson;document.body.dataset.lesson=String(active);guide.hidden=!active||!['playing','paused'].includes(g.phase)||g.immersive;review.hidden=!active||g.phase!=='complete';again.hidden=review.hidden||!verdict?.passed||step===3;
   $('lesson-history').textContent=completed.includes(g.input)?'You have completed First Steps with this input. Replay any time.':'Choose your browser input above, then start. Lessons never begin automatically.';
   if(!active){if(enabled&&g.phase==='menu')$('start').textContent='Retry First Steps';return;}
   $('now-playing').textContent='First Steps / '+STEPS[step].name;
   $('practice-weakest').hidden=$('practice-full-song').hidden=$('practice-stop-repeat').hidden=true;
   if(g.phase==='complete'&&verdict){const success=verdict.passed,finished=success&&step===3;
    $('result-kicker').textContent=finished?'FIRST STEPS COMPLETE':success?'EXERCISE COMPLETE':'TRY THIS EXERCISE AGAIN';
    $('result-title').textContent=finished?'Ready for your first song.':success?'That is the connection.':'Take your time.';
    $('replay').textContent=finished?'Play First Light':success?'Next: '+STEPS[step+1].name:'Retry exercise';
    $('practice-tip').textContent=finished?'Your input-specific lesson completion is separate from all song and practice scores.':instructions(step,g.input);
    review.textContent=finished?'All four exercises completed with '+(g.input==='gamepad'?'controller timing':g.input==='keys'?'keyboard timing':'mouse/touch slicing')+'.':`${verdict.hits}/${g.state.song.notes.length} connections. `+(success?'Exercise goal met. Continue when ready.':!verdict.bothHands?'Connect notes from both hand groups.':step===3&&!verdict.pause?'Use Pause and Resume yourself during the exercise, then connect two notes.':'Connect at least '+STEPS[step].required+' targets to continue.');
   }
  }
  function tick(){if(!enabled||!g.state?.song.lesson)return;const m=g.state.song.lesson,k=step+'/'+g.input;
   if(k!==last){last=k;$('lesson-position').textContent=`EXERCISE ${step+1} OF 4 / ${g.input==='slice'?'DIRECTIONAL SLICING':'TIMING INPUT'}`;$('lesson-name').textContent=STEPS[step].name;$('lesson-instruction').textContent=instructions(step,g.input);$('lesson-goal').textContent='Goal: '+STEPS[step].required+' connections, including both L and R groups.'+(step===3?' Pause and resume once.':'');$('lesson-lanes').replaceChildren();for(const label of g.input==='gamepad'?['LT','LB','RB','RT']:g.input==='keys'?['D','F','J','K']:['L / outer','L / inner','R / inner','R / outer']){const s=document.createElement('span');s.textContent=label;$('lesson-lanes').append(s);}}
   const a=assess(g.state,proof),text=a.hits+' connected'+(step===3?' / '+(a.pause?'Pause and resume demonstrated.':'Pause and resume still needed.'):'');
   if(progress!==text){progress=text;$('lesson-progress').textContent=text;}
   if(g.phase==='playing')$('countdown').textContent=g.state.time<m.countIn?String(Math.min(4,Math.ceil((m.countIn-g.state.time)/(60/g.state.song.bpm)))):'';
  }
  $('lesson-start').onclick=begin;again.onclick=()=>{retry=true;g.start();};sync();
  return {beforeStart,selection,prepare,result,paused,resumed,cancelRun,sync,tick,get snapshot(){return {active:enabled,step,verdict,proof:{...proof},passedSteps:[...passedSteps],completed:[...completed]};},dispose(){cancelRun();card.remove();guide.remove();review.remove();again.remove();}};
 }
 const api={STORE,BUFFER,STEPS,MODES,chart,buffer,assess,load,instructions,install};root.PrismLessons=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
