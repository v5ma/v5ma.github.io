/* Practice Lab: derived section charts and bounded, local-only rehearsal audio.
 * Full-song charts, audio buffers, timing windows and records are never edited.
 * Slower sample-rate playback lowers pitch; hit windows remain real-time. */
(function(root){'use strict';
 const C=root.PrismCore||(typeof require==='function'?require('./core.js'):null);
 const F=root.PrismPhrases||(typeof require==='function'?require('./phrases.js'):null);
 const STORE='prism-current.v1.practice',BUFFER='__prism-practice__',SPEEDS=[.6,.75,.9,1];
 const stamp=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
 function sections(song){return F.sections(song).filter(p=>song.notes.some(n=>n.time>=p.start&&n.time<p.end));}
 function chart(song,sectionId,speed=.75){
  if(!SPEEDS.includes(speed))throw Error('Choose 60%, 75%, 90% or 100% practice speed.');
  const p=sections(song).find(p=>p.id===sectionId);if(!p||!Number.isFinite(p.start)||!Number.isFinite(p.end)||p.end<=p.start)throw Error('Choose a section with playable notes.');
  const countIn=240/song.bpm/speed,duration=countIn+(p.end-p.start)/speed+.25;
  if(!Number.isFinite(duration)||duration>120)throw Error('This practice section is too long.');
  const notes=song.notes.filter(n=>n.time>=p.start&&n.time<p.end).map((n,id)=>({...n,id,sourceId:n.id,time:countIn+(n.time-p.start)/speed}));
  return {...song,bpm:song.bpm*speed,duration,notes,sections:[{id:'practice-count-in',name:'Count-in',start:0,end:countIn,cue:'Four beats to settle in. The selected phrase comes next.'},{...p,start:countIn,end:duration}],practice:{section:sectionId,name:p.name,speed,sourceBpm:song.bpm,sourceStart:p.start,sourceEnd:p.end,countIn,chartVersion:song.chartVersion||1}};
 }
 function buffer(context,source,song,audible=true){
  const p=song.practice;if(!p||!SPEEDS.includes(p.speed)||!source?.getChannelData)throw Error('Practice audio is not ready.');
  const rate=source.sampleRate*p.speed;
  if(!Number.isInteger(rate)||rate<8000||rate>96000)throw Error('This audio sample rate is unsupported for practice.');
  const count=Math.round(p.countIn*rate),begin=Math.round(p.sourceStart*source.sampleRate),end=Math.round(p.sourceEnd*source.sampleRate),body=end-begin;
  if(begin<0||end>source.length||body<1||song.duration>120)throw Error('The practice range exceeds the soundtrack.');
  const length=count+body+Math.ceil(.25*rate),out=context.createBuffer(2,length,rate),fade=Math.max(1,Math.round(rate*.008));
  for(let ch=0;ch<2;ch++){
   const data=out.getChannelData(ch),original=source.getChannelData(Math.min(ch,source.numberOfChannels-1));data.set(original.subarray(begin,end),count);
   // Fade only the cropped copy; the cached original music is immutable.
   for(let i=0;i<Math.min(fade,body/2);i++){data[count+i]*=i/fade;data[count+body-1-i]*=i/fade;}
   if(audible)for(let beat=0;beat<4;beat++){
    const at=Math.round(beat*p.countIn/4*rate),len=Math.round(.055*rate),hz=beat===0?880:660;
    for(let i=0;i<len&&at+i<count;i++){const t=i/rate;data[at+i]=Math.sin(2*Math.PI*hz*t)*.1*Math.sin(Math.PI*i/len)*Math.exp(-t*45);}
   }
  }
  return out;
 }
 function key(song,mode){const p=song.practice;if(!p||!['keys','slice','gamepad'].includes(mode))throw Error('Invalid practice record mode.');return [song.id,song.difficulty,mode,p.section,'speed-'+Math.round(p.speed*100),'chart-'+p.chartVersion].join('/');}
 function load(text){const clean={};try{const data=JSON.parse(text||'{}');if(!data||Array.isArray(data)||typeof data!=='object')return clean;for(const [k,r]of Object.entries(data).slice(-512))if(/^[a-z0-9-]+\/(flow|pulse)\/(keys|slice|gamepad)\/[a-z0-9-]+\/speed-(60|75|90|100)\/chart-\d+$/.test(k)&&r&&Number.isSafeInteger(r.score)&&r.score>=0&&Number.isFinite(r.accuracy)&&r.accuracy>=0&&r.accuracy<=100&&Number.isSafeInteger(r.passes)&&r.passes>0)clean[k]={score:r.score,accuracy:r.accuracy,passes:r.passes};}catch{}return clean;}
 function record(records,song,mode,result){if(!result.complete||!Number.isSafeInteger(result.score)||result.score<0||!Number.isFinite(result.accuracy)||result.accuracy<0||result.accuracy>100)throw Error('Only completed practice results can be saved.');const k=key(song,mode),old=records[k];return {...records,[k]:{score:Math.max(old?.score||0,result.score),accuracy:Math.max(old?.accuracy||0,result.accuracy),passes:Math.min(Number.MAX_SAFE_INTEGER,(old?.passes||0)+1)}};}
 class RepeatGate{constructor(){this.deadline=null;}arm(now){this.deadline=now+5000;}cancel(){this.deadline=null;}due(now,ready){if(!ready){this.cancel();return false;}if(this.deadline===null||now<this.deadline)return false;this.cancel();return true;}}
 function install(g){const $=id=>document.getElementById(id);let mode='full',section='',speed=.75,repeat=false,audible=true,records={};let optionKey='',pass=0,runKey='',savedKey='',disposed=false;const gate=new RepeatGate();
  try{records=load(localStorage.getItem(STORE));}catch{}
  function cancelRepeat(){gate.cancel();$('practice-repeat-status').textContent='';}
  function cancelRun(){cancelRepeat();pass=0;runKey='';savedKey='';g.audio.cache.delete(BUFFER);}
  function selection(song){if(mode!=='practice'||g.immersive)return song;return chart(song,section,speed);}
  function prepare(song){cancelRepeat();if(!song.practice){pass=0;runKey='';return song.id;}const k=key(song,g.runMode);pass=k===runKey?pass+1:1;runKey=k;savedKey='';const data=buffer(g.audio.context(),g.audio.cache.get(song.id),song,audible);g.audio.cache.set(BUFFER,data);return BUFFER;}
  function result(r){const song=g.state.song;try{records=record(records,song,g.runMode,r);records=Object.fromEntries(Object.entries(records).slice(-512));localStorage.setItem(STORE,JSON.stringify(records));savedKey=key(song,g.runMode);}catch{g.notice('Practice result is visible, but device storage could not save it.');}if(repeat&&!document.hidden&&document.hasFocus()&&(!g.control||!g.control.mixerOpen))gate.arm(performance.now());}
  function launch(id){if(g.immersive)return;const source=C.chart(g.track,g.difficulty);if(!sections(source).some(p=>p.id===id))return;g.abort();mode='practice';section=id;g.syncControls();g.start();}
  function sync(){
   const source=C.chart(g.track,g.difficulty),parts=sections(source),k=g.track+'/'+g.difficulty;
   if(k!==optionKey){optionKey=k;$('practice-section').replaceChildren();for(const p of parts){const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' / '+stamp(p.start);$('practice-section').append(o);}if(!parts.some(p=>p.id===section))section=parts[0]?.id||'';}
   $('session-mode').value=mode;$('practice-section').value=section;$('practice-speed').value=String(speed);$('practice-repeat').checked=repeat;$('practice-clicks').checked=audible;$('practice-options').hidden=mode!=='practice';
   if(mode==='practice'){
    const plan=chart(source,section,speed),best=records[key(plan,g.input)];$('practice-description').textContent=`${plan.notes.length} targets / ${Math.ceil(plan.duration)} seconds with a four-beat count-in. Slower music also has a lower pitch. Timing windows stay the same.`;
    $('practice-best').textContent=best?`Practice only: ${best.passes} completed passes / ${best.accuracy}% best quality / ${best.score.toLocaleString()} best score.`:'No completed practice pass for this section, speed, chart and input yet.';
    if(g.phase==='menu')$('start').textContent='Practice this section';
   }
   const active=!!g.state?.song.practice,complete=g.phase==='complete';document.body.dataset.session=active?'practice':'full';$('result-kicker').textContent=active?'PRACTICE COMPLETE':'TRACK COMPLETE';$('replay').textContent=active?'Repeat section':'Play again';$('practice-ribbon').hidden=!active||!['playing','paused'].includes(g.phase)||g.immersive;
   if(active){const p=g.state.song.practice;$('practice-ribbon').textContent=`PRACTICE / ${p.name} / ${Math.round(p.speed*100)}% / attempt ${pass}`;if(complete){$('result-title').textContent='Practice pass complete.';$('practice-tip').textContent=`${p.name} at ${Math.round(p.speed*100)}%. Full-song records are unchanged. ${savedKey?'This completed pass is saved separately.':'This pass has not been saved to device storage.'}`;}}
   $('practice-weakest').hidden=!complete||active||g.immersive;$('practice-full-song').hidden=!complete||!active;$('practice-stop-repeat').hidden=!complete||!active||gate.deadline===null;
   if(complete&&!active){const weak=F.summary(g.state).sections.find(p=>p.id===F.summary(g.state).weakest);$('practice-weakest').textContent=weak?'Practice '+weak.name+' at '+Math.round(speed*100)+'%':'Practice a section';}
  }
  for(const [id,apply]of [['session-mode',v=>{mode=v==='practice'?'practice':'full';}],['practice-section',v=>{section=v;}],['practice-speed',v=>{const s=Number(v);if(SPEEDS.includes(s))speed=s;}],['practice-repeat',v=>{repeat=v;}],['practice-clicks',v=>{audible=v;}]])$(id).onchange=e=>{const value=e.target.type==='checkbox'?e.target.checked:e.target.value;g.abort();apply(value);g.syncControls();};
  $('practice-weakest').onclick=()=>{if(g.state)launch(F.summary(g.state).weakest);};
  $('practice-full-song').onclick=()=>{g.abort();mode='full';g.syncControls();g.start();};
  $('practice-stop-repeat').onclick=()=>{cancelRepeat();g.notice('Automatic repeat stopped. Choose another pass when ready.');sync();};
  function tick(){
   if(disposed)return;
   if(g.state?.song.practice&&g.phase==='playing'){const p=g.state.song.practice,t=g.state.time;$('countdown').textContent=t<p.countIn?String(Math.min(4,Math.ceil((p.countIn-t)/(p.countIn/4)))):'';}
   if(gate.deadline===null)return;
   const ready=g.phase==='complete'&&!g.immersive&&!document.hidden&&document.hasFocus()&&!g.control?.mixerOpen&&(g.runMode!=='gamepad'||g.control?.connected);
   if(!ready){cancelRepeat();sync();return;}
   const left=Math.max(0,Math.ceil((gate.deadline-performance.now())/1000));$('practice-repeat-status').textContent=`Next practice pass in ${left}s. Any input stops automatic repeat.`;
   if(gate.due(performance.now(),ready)){g.start();}
  }
  const interact=()=>{if(gate.deadline!==null){cancelRepeat();sync();}},hidden=()=>{if(document.hidden)interact();};
  document.addEventListener('visibilitychange',hidden);document.addEventListener('keydown',interact,true);document.addEventListener('pointerdown',interact,true);window.addEventListener('blur',interact);
  sync();return {selection,prepare,result,sync,tick,cancelRun,interact,launch,get snapshot(){return {mode,section,speed,repeat,attempt:pass,active:g.state?.song.practice||null,pendingRepeat:gate.deadline!==null,records:{...records}};},dispose(){disposed=true;cancelRepeat();document.removeEventListener('visibilitychange',hidden);document.removeEventListener('keydown',interact,true);document.removeEventListener('pointerdown',interact,true);window.removeEventListener('blur',interact);g.audio.cache.delete(BUFFER);}};
 }
 const api={SPEEDS,STORE,BUFFER,sections,chart,buffer,key,load,record,RepeatGate,install};root.PrismPractice=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
