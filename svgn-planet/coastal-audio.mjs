/* Original procedural score and Foley for Neighborhood Missions. One musical
 * transport, bounded polyphony, click-free envelopes and independent buses.
 * No remote audio dependency, advertising, microphone use or copied music. */
import {preferences,setPreference} from './coastal-prefs.mjs';
import {CITY,distance} from './world.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hz=n=>440*Math.pow(2,(n-69)/12);
const CHORDS=[[50,57,61,66],[47,54,57,62],[43,50,54,59],[45,52,57,59],[50,57,61,64],[47,54,59,62],[43,50,57,59],[45,52,56,62]];
const MOTIFS=[[0,-1,2,3,-1,2,1,-1],[2,1,-1,0,3,-1,2,1],[0,-1,-1,2,1,-1,3,-1],[3,2,1,-1,0,1,-1,-1]];
export function scoreStep(step,energy=0){
 const bar=Math.floor(step/8),e=step%8,chord=CHORDS[Math.floor(bar/2)%CHORDS.length],section=Math.floor(bar/8)%4,notes=[];
 if(e===0)for(const n of chord)notes.push({midi:n+12,kind:'keys',duration:2.45,level:.019});
 if(e===0||e===4||(energy>.4&&e===7))notes.push({midi:chord[0]-12+(e===7?7:0),kind:'bass',duration:.44,level:.075});
 const pick=MOTIFS[(Math.floor(bar/2)+section)%4][e];
 if(pick>=0&&(section!==2||e%2===0))notes.push({midi:chord[pick]+(section===3?36:24),kind:section===1?'bell':'pluck',duration:section===3?.6:1.05,level:.042});
 if(e===0||e===4)notes.push({kind:'kick',level:.10});
 if(e===2||e===6)notes.push({kind:'snare',level:.027});
 if(energy>.18||e%2===1)notes.push({kind:'hat',level:e%2?.012:.007});
 return notes;
}
export function createCoastalAudio(){
 let ctx=null,master,compressor,analyser,buses={},wet,delay,feedback,noiseBuffer,motor,tire,wind,rainBed,playing=false,ready=false,next=0,step=0,energy=0,lastFoot=0,lastBird=-100,lastPass=-100,lastBrake=false,lastLift=0,lastSpeed=0,mutedByVisibility=false;
 const nodes=new Set(),seen=new WeakSet(),gates=new Map(),counts={},recent=[];let dropped=0,scheduled=0,lastStatus='Sound starts with play. Music, effects and ambience have separate controls.';
 const ramp=(param,value,time=.06)=>{if(ctx)param.setTargetAtTime(value,ctx.currentTime,time);};
 function mixer(){if(!ctx)return;ramp(master.gain,preferences.muted?0:preferences.master);ramp(buses.music.gain,playing?preferences.music:0,.12);ramp(buses.effects.gain,preferences.effects);ramp(buses.ambience.gain,playing?preferences.ambience:0,.14);}
 function own(source,chain,bus){const record={source,chain,bus};nodes.add(record);source.onended=()=>{nodes.delete(record);for(const node of[source,...chain])try{node.disconnect();}catch{}};return record;}
 function route(bus,level,when,duration,pan=0){
  const amp=ctx.createGain(),p=ctx.createStereoPanner();p.pan.value=clamp(pan,-1,1);amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,level),when+.008);amp.gain.exponentialRampToValueAtTime(.0001,when+Math.max(.025,duration));amp.connect(p);p.connect(buses[bus]);return {amp,p};
 }
 function tone(freq,duration,level,kind='pluck',when=ctx?.currentTime||0,bus='effects',pan=0){
  if(!ctx||ctx.state!=='running'||nodes.size>=64){dropped++;return;}
  const source=ctx.createOscillator(),filter=ctx.createBiquadFilter(),{amp,p}=route(bus,level,when,duration,pan);
  source.type=kind==='bass'?'triangle':kind==='keys'?'triangle':'sine';source.frequency.setValueAtTime(freq,when);
  filter.type='lowpass';filter.frequency.setValueAtTime(kind==='bass'?460:kind==='keys'?2400:6500,when);filter.Q.value=.5;
  source.connect(filter);filter.connect(amp);own(source,[filter,amp,p],bus);source.start(when);source.stop(when+duration+.04);
  if((kind==='keys'||kind==='bell')&&nodes.size<56){const overtone=ctx.createOscillator(),part=route(bus,level*(kind==='bell'?.16:.12),when,duration*.57,pan);overtone.type='sine';overtone.frequency.value=freq*(kind==='bell'?2.76:3);overtone.connect(part.amp);own(overtone,[part.amp,part.p],bus);overtone.start(when);overtone.stop(when+duration*.57+.04);}
 }
 function hiss(duration,level,freq=1700,when=ctx?.currentTime||0,bus='effects',pan=0,q=.7){
  if(!ctx||ctx.state!=='running'||nodes.size>=64){dropped++;return;}
  const source=ctx.createBufferSource(),f=ctx.createBiquadFilter(),{amp,p}=route(bus,level,when,duration,pan);source.buffer=noiseBuffer;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;source.connect(f);f.connect(amp);own(source,[f,amp,p],bus);source.start(when,0,duration+.05);
 }
 function drum(kind,level,when){if(kind==='kick'){const source=ctx.createOscillator(),{amp,p}=route('music',level,when,.19);source.frequency.setValueAtTime(115,when);source.frequency.exponentialRampToValueAtTime(42,when+.15);source.connect(amp);own(source,[amp,p],'music');source.start(when);source.stop(when+.23);}else hiss(kind==='hat'?.045:.11,level,kind==='hat'?7300:1800,when,'music',kind==='hat'?.18:-.08);}
 function sustained(type,frequency,bus){const source=type==='noise'?ctx.createBufferSource():ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();gain.gain.value=0;filter.type='lowpass';filter.frequency.value=frequency;if(type==='noise'){source.buffer=noiseBuffer;source.loop=true;}else{source.type='sine';source.frequency.value=frequency;}source.connect(filter);filter.connect(gain);gain.connect(buses[bus]);source.start();return {source,filter,gain};}
 function init(){
  if(ctx)return;const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Constructor){lastStatus='This browser does not expose Web Audio. The game remains playable.';return;}
  ctx=new Constructor({latencyHint:'interactive'});master=ctx.createGain();master.gain.value=0;compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=14;compressor.ratio.value=4;compressor.attack.value=.004;compressor.release.value=.18;analyser=ctx.createAnalyser();analyser.fftSize=256;master.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination);
  for(const name of['music','effects','ambience']){buses[name]=ctx.createGain();buses[name].gain.value=0;buses[name].connect(master);}
  delay=ctx.createDelay(1);delay.delayTime.value=60/92*.75;feedback=ctx.createGain();feedback.gain.value=.12;wet=ctx.createGain();wet.gain.value=.095;buses.music.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
  noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=noiseBuffer.getChannelData(0);let seed=104729,low=0;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;const white=seed/2147483648-1;low=low*.65+white*.35;data[i]=low;}
  motor=sustained('sine',100,'ambience');tire=sustained('noise',1300,'ambience');wind=sustained('noise',650,'ambience');rainBed=sustained('noise',4600,'ambience');ready=true;ctx.onstatechange=()=>{lastStatus=ctx.state==='running'?'Coastal Pulse | original adaptive score and spatial street sound.':'Browser audio is suspended. Press Enter or select Enable sound.';};mixer();
 }
 async function unlock(){try{init();if(ctx?.state==='suspended')await ctx.resume();if(ctx?.state==='running'){next=Math.max(next,ctx.currentTime+.035);mixer();}}catch(e){lastStatus='Audio is unavailable: '+e.message;}}
 function stopMusic(){for(const node of nodes)if(node.bus==='music')try{node.source.stop();}catch{}next=ctx?ctx.currentTime+.08:0;}
 function setPlaying(value){value=!!value&&!document.hidden;if(value===playing)return;playing=value;if(!value){stopMusic();if(motor){ramp(motor.gain.gain,0);ramp(tire.gain.gain,0);ramp(wind.gain.gain,0);ramp(rainBed.gain.gain,0);}}else{next=ctx?ctx.currentTime+.08:0;}mixer();}
 function allowed(name,spacing){const now=ctx?.currentTime||0;if(now-(gates.get(name)??-100)<spacing)return false;gates.set(name,now);return true;}
 function cue(name,pan=0){
  if(!ctx||ctx.state!=='running'||preferences.muted||!allowed(name,name==='ui'?.12:name==='foot'?.22:name==='pickup'?.15:name==='bird'?6:name==='talk'?8:.10))return;
  const quiet=preferences.audioDensity==='quiet',now=ctx.currentTime;
  if(quiet&&['foot','talk','bird','chain'].includes(name))return;
  counts[name]=(counts[name]||0)+1;recent.push(name);if(recent.length>20)recent.shift();
  switch(name){
   case 'throw': hiss(.20,.15,2800,now,'effects',pan);hiss(.09,.035,700,now+.05,'effects',pan);break;
   case 'delivery': case 'bonus-delivery': hiss(.07,.13,1900,now);tone(hz(74),.24,.095,'bell',now+.04);tone(hz(81),.5,.055,'bell',now+.15);break;
   case 'jump':hiss(.13,.10,950,now);tone(155,.10,.06,'bass',now);break;
   case 'collision':case 'land':hiss(.12,.17,210,now);tone(76,.12,.08,'bass',now);break;
   case 'brake':hiss(.25,.075,2100,now);break;
   case 'foot':hiss(.075,.12,180+(counts[name]%3)*55,now,'ambience',pan);break;
   case 'chain':hiss(.03,.025,3800,now,'ambience');break;
   case 'bell':tone(1250,.75,.12,'bell',now);tone(1690,.55,.075,'bell',now+.085);break;
   case 'stamp':case 'pickup':tone(hz(86),.32,.07,'bell',now);hiss(.10,.055,1600,now);break;
   case 'job-stage':case 'handoff':tone(hz(69),.20,.06,'keys',now);tone(hz(74),.32,.06,'keys',now+.08);break;
   case 'job-start':for(const [i,n]of[62,66,69,74].entries())tone(hz(n),.35,.075,'keys',now+i*.09);break;
   case 'chapter-complete':case 'job-complete':case 'complete':case 'stunt':for(const [i,n]of[62,66,69,73,81].entries())tone(hz(n),.70,.085,'bell',now+i*.12);ramp(buses.music.gain,preferences.music*.55,.02);setTimeout(mixer,1000);break;
   case 'photo':hiss(.035,.18,3200,now);hiss(.03,.15,1500,now+.085);break;
   case 'repair':case 'signal-good':tone(hz(78),.2,.085,'keys',now);tone(hz(85),.35,.07,'bell',now+.08);break;
   case 'signal-miss':tone(146,.18,.045,'bass',now);break;
   case 'ride':case 'customize':hiss(.08,.085,800,now);tone(hz(69),.3,.055,'keys',now+.04);break;
   case 'transit':hiss(.6,.045,720,now,'ambience');for(const [i,n]of[62,69,78].entries())tone(hz(n),.5,.055,'keys',now+i*.1);break;
   case 'bird':for(let i=0;i<3;i++)tone(2100+i*350,.095,.035,'pluck',now+i*.15,'ambience',pan);break;
   case 'talk':for(let i=0;i<3;i++){tone(145+i*23,.17,.025,'keys',now+i*.22,'ambience',pan);hiss(.13,.035,750+i*170,now+i*.22,'ambience',pan);}break;
   case 'passby':hiss(.8,.065,700,now,'ambience',pan);tone(94,.7,.024,'bass',now,'ambience',pan);break;
   case 'ui':tone(740,.045,.021,'pluck',now);break;
  }
 }
 const interval=setInterval(()=>{
  if(!ctx||ctx.state!=='running'||!playing||preferences.muted)return;
  if(next<ctx.currentTime-.2)next=ctx.currentTime+.05;
  let budget=4;while(next<ctx.currentTime+.14&&budget-->0){
   for(const event of scoreStep(step,energy)){
    if(nodes.size>=60){dropped++;continue;}
    if(event.midi)tone(hz(event.midi),event.duration,event.level,event.kind,next,'music',event.kind==='pluck'?.22:event.kind==='keys'?-.12:0);
    else if(preferences.audioDensity!=='quiet'||event.kind==='kick')drum(event.kind,event.level,next);
   }
   next+=60/92/2;step=(step+1)%256;scheduled++;
  }
 },25);
 function update(s,{active,vehicle,brake=false,traffic=null,rain=0}={}){
  setPlaying(active);if(!ctx||ctx.state!=='running')return;
  for(const e of s.events){if(seen.has(e))continue;seen.add(e);cue(e.type);}
  if(!playing)return;
  ramp(rainBed.gain.gain,.16*clamp(rain),.22);
  energy=clamp(s.speed/30);ramp(motor.source.frequency,vehicle==='bicycle'?70+s.speed*2:88+s.speed*8,.12);ramp(motor.gain.gain,s.ride&&vehicle!=='bicycle'?.018*energy:0,.1);ramp(tire.filter.frequency,700+s.speed*48,.1);ramp(tire.gain.gain,s.ride?.11*energy:0,.1);ramp(wind.gain.gain,.018+.07*energy*energy,.18);
  if(!s.ride&&s.distance-lastFoot>.8&&s.lift<.01){cue('foot',(Math.floor(s.distance)%2?.15:-.15));lastFoot=s.distance;}
  if(s.ride&&vehicle==='bicycle'&&s.speed>1&&s.distance-lastFoot>3.5){cue('chain');lastFoot=s.distance;}
  if(brake&&!lastBrake&&lastSpeed>5)cue('brake');lastBrake=brake;
  if(lastLift>.01&&s.lift<=.001)cue('land');lastLift=s.lift;lastSpeed=s.speed;
  const now=ctx.currentTime;if(now-lastBird>(preferences.audioDensity==='full'?10:20)){cue('bird',Math.sin(now*.7)*.8);lastBird=now;}
  if(traffic&&traffic.distance<12&&now-lastPass>5){cue('passby',traffic.pan||0);lastPass=now;}
 }
 window.addEventListener('nm-preferences',mixer);
 const gesture=()=>unlock();window.addEventListener('pointerdown',gesture,{passive:true});window.addEventListener('keydown',gesture);window.addEventListener('nm-action',gesture);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){mutedByVisibility=true;setPlaying(false);ctx?.suspend().catch(()=>{});}else if(mutedByVisibility){mutedByVisibility=false;unlock();}});
 window.addEventListener('pagehide',()=>setPlaying(false));
 return {unlock,update,setPlaying,cue,toggleMute(){setPreference('muted',!preferences.muted);},inspect(){const data=new Float32Array(256);if(analyser)analyser.getFloatTimeDomainData(data);return {version:'0.7.0',ready,state:ctx?.state||'not-started',playing,rainAmbience:rainBed?.gain.gain.value||0,transportCount:ctx?1:0,activeVoices:nodes.size,scheduledSteps:scheduled,droppedVoices:dropped,rms:Math.sqrt(data.reduce((a,v)=>a+v*v,0)/data.length),counts:{...counts},recent:[...recent],mix:{...preferences},status:lastStatus};},dispose(){clearInterval(interval);stopMusic();for(const n of nodes)try{n.source.stop();}catch{}for(const v of[motor,tire,wind,rainBed])try{v?.source.stop();}catch{}ctx?.close();}};
}
