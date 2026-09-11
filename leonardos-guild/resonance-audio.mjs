/* Web Audio mixer + original locally hosted score. Audio is optional: browser
 * activation failures never block movement, dialogs or saved progress. */
import {AUDIO_KEY,audioPreferences,MUSIC,scoreFor,spatialMix,surfaceFor} from './resonance-data.mjs';
import {doorLocation} from './doors-core.mjs';
import {validTargets,clearShot} from './resonance-core.mjs';
const files=new URL('./assets/resonance/',import.meta.url);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cueMap={
 swing:['swing'],hit:['impact','Staff connects'], 'doors-rival-hit':['impact','Staff connects'],
 'doors-rival-strike':['hurt','Rival strike'], 'blocked-hit':['block','Staff strike braced'],
 'duel-hit':['hurt','Guard strike'], 'doors-rival-yields':['success','Rival yields'],
 'duel-won':['success','The guard yields'], 'town-duel':['success','Opponent yields'],
 'town-windup':['windup','Staff raised: brace or dodge'], 'town-hit':['hurt','Staff strike'],
 throw:['paper'],delivery:['success','Letter delivered'], chapter:['discovery','New commission stage'],
 relay:['lever','Waterwheel restored'],signals:['bell','Market bell'],folio:['discovery','Folio recovered'],
 complete:['success','Commission complete'],trade:['coin','Purchase complete'],refill:['loaded','Supplies restored'],
 recover:['enter','Returned to the workshop'],enter:['enter','Mounted vehicle'],exit:['exit','Dismounted'],
 scan:['magic','Mechanisms revealed'],collision:['collision','Collision'],jump:['jump'],
 'resonance-sling':['sling'], 'resonance-reload':['reload','Reloading the sling pouch'],
 'resonance-loaded':['loaded','Sling ready'], 'resonance-impact':['impact','Pellet connects'],
 'resonance-wall':['impact','Pellet strikes a surface'], 'resonance-cover':['cover','In cover'],
 'resonance-special':['special','Special ability active'], 'resonance-denied':['empty'],
 'resonance-empty':['empty','Pouch empty: X reloads'], 'resonance-discipline':['switch'],
};
export function createResonanceAudio({getState,world,onStatus=()=>{}}){
 let config;try{config=audioPreferences(JSON.parse(localStorage.getItem(AUDIO_KEY)));}catch{config=audioPreferences();}
 let ctx=null,master=null,musicBus=null,effectsBus=null,ambienceBus=null,worldGain=null,compressor=null,analyser=null,wet=null;
 let initialized=false,available=true,unlocked=false,blocked=false,hidden=false,paused=false,session=false;
 let listener={x:0,z:0,yaw:0},lastState=null,snapshot=null,stepDistance=0,stepIndex=0,ambientClock=0,birdAt=6,bellHour=-1;
 let requests=0,played=0,loadFailures=0,dropped=0,desired='vinci',desiredAge=0,chosen=null,nowPlaying='',fade=null,slot=null,oldSlot=null,worldRoom=0;
 let windups=new Set(),seen=new WeakSet(),captionUntil=0,statusAt=0,haptic=()=>{},lastCue='',lastStation='',motion=0,initPromise=null;
 const buffers=new Map(),voices=new Set(),loops=new Map(),eventCounts={};
 const status=document.createElement('div');status.id='audio-status';status.setAttribute('role','status');status.hidden=true;document.body.append(status);
 const captions=document.createElement('div');captions.id='sound-caption';captions.setAttribute('role','status');captions.setAttribute('aria-live','polite');captions.hidden=true;document.body.append(captions);
 const now=document.createElement('div');now.id='now-playing';now.hidden=true;document.body.append(now);let nowUntil=0;
 const save=()=>{try{localStorage.setItem(AUDIO_KEY,JSON.stringify(config));}catch{}};
 function report(){onStatus(inspect());const button=document.getElementById('sound');if(button){button.textContent=config.enabled?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(config.enabled));}}
 function caption(text,source){if(!config.captions||!text||hidden)return;const mix=spatialMix(listener,source);const side=mix.pan<-.4?'Left: ':mix.pan>.4?'Right: ':'';captions.textContent=side+text;captions.hidden=false;captionUntil=performance.now()+2100;}
 function gain(node,value,time=.08){if(ctx&&node)node.gain.setTargetAtTime(Math.max(0,value),ctx.currentTime,time);}
 function mix(){if(!ctx)return;gain(master,config.enabled?config.master:0);gain(musicBus,config.music*(paused?.34:1),.16);gain(effectsBus,config.effects);gain(ambienceBus,config.ambience);gain(worldGain,paused?.12:1,.16);
  const values=config.range==='night'?[-30,8,.015,.2]:config.range==='full'?[-9,3,.01,.2]:[-19,5,.008,.18];compressor.threshold.value=values[0];compressor.ratio.value=values[1];compressor.attack.value=values[2];compressor.release.value=values[3];
 }
 function graph(){
  if(ctx||!available)return !!ctx;const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C){available=false;status.textContent='Audio is unavailable in this browser. Visual cues remain available.';status.hidden=false;return false;}
  try{
   ctx=new C({latencyHint:'interactive'});master=ctx.createGain();musicBus=ctx.createGain();effectsBus=ctx.createGain();ambienceBus=ctx.createGain();worldGain=ctx.createGain();compressor=ctx.createDynamicsCompressor();analyser=ctx.createAnalyser();analyser.fftSize=512;
   musicBus.connect(master);effectsBus.connect(master);ambienceBus.connect(worldGain);worldGain.connect(master);master.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination);
   const reverb=ctx.createConvolver(),impulse=ctx.createBuffer(2,Math.floor(ctx.sampleRate*.62),ctx.sampleRate);
   for(let c=0;c<2;c++){const d=impulse.getChannelData(c);let seed=419+c;for(let i=0;i<d.length;i++){seed=(seed*16807)%2147483647;d[i]=(seed/1073741823.5-1)*Math.exp(-i/(ctx.sampleRate*.11))*.12;}}
   reverb.buffer=impulse;wet=ctx.createGain();wet.gain.value=.02;effectsBus.connect(reverb);reverb.connect(wet);wet.connect(master);mix();initialized=true;
   ctx.onstatechange=()=>{unlocked=ctx.state==='running';if(unlocked){blocked=false;status.hidden=true;}report();};return true;
  }catch{available=false;loadFailures++;return false;}
 }
 async function unlock(){
  if(!config.enabled||hidden||!graph())return false;
  // resume() may remain pending when a Gamepad event is not trusted activation.
  try{const result=ctx.resume();result?.catch(()=>{});await Promise.race([result,new Promise(resolve=>setTimeout(resolve,180))]);}catch{}
  unlocked=ctx.state==='running';blocked=!unlocked;
  if(blocked){status.textContent='Browser sound permission: press Enter once to enable audio. No mouse is needed. Gameplay remains available.';status.hidden=false;}
  else{status.hidden=true;startLoops();if(session&&!slot&&config.station!=='off')startMusic(config.station==='auto'?(chosen||'vinci'):config.station);for(const p of[slot,oldSlot])if(p?.element.paused)p.element.play().catch(()=>{});}
  report();return unlocked;
 }
 // Only browser-trusted user input can satisfy stricter autoplay policies.
 const gesture=e=>{if(e.isTrusted&&config.enabled&&!hidden){unlock();}};
 window.addEventListener('pointerdown',gesture,{passive:true});window.addEventListener('keydown',gesture);
 // Handle visibility immediately: a hidden tab may stop requestAnimationFrame
 // before the normal frame-level audio update can suspend its sound graph.
 document.addEventListener('visibilitychange',()=>{
  hidden=document.hidden;
  if(hidden){for(const p of[slot,oldSlot])p?.element.pause();ctx?.suspend().catch(()=>{});}
  else if(config.enabled)unlock();
 });
 async function buffer(name,loop=false){const file=loop?'ambient-'+name+'.ogg':name+'.wav';if(!buffers.has(file))buffers.set(file,fetch(new URL(file,files)).then(r=>{if(!r.ok)throw Error(file+' '+r.status);return r.arrayBuffer();}).then(a=>ctx.decodeAudioData(a)).catch(()=>{loadFailures++;return null;}));return buffers.get(file);}
 function play(name,{source=null,volume=.55,rate=1,caption:words=null,ui=false}={}){
  requests++;lastCue=name;eventCounts[name]=(eventCounts[name]||0)+1;if(words)caption(words,source);
  if(!config.enabled||!unlocked||!ctx||hidden)return;
  if(voices.size>=24){dropped++;return;}
  // Reserve before the asynchronous fetch so bursts cannot overrun the cap.
  const reservation={};voices.add(reservation);
  buffer(name).then(b=>{
   if(!b||!config.enabled||!unlocked||hidden||(!ui&&paused)){voices.delete(reservation);return;}
   const mix=spatialMix(listener,source,18,config.mono),s=ctx.createBufferSource(),g=ctx.createGain(),pan=ctx.createStereoPanner();
   s.buffer=b;s.playbackRate.value=clamp(rate,.65,1.5);g.gain.value=clamp(volume*mix.gain,0,.8);pan.pan.value=mix.pan;s.connect(g);g.connect(pan);pan.connect(effectsBus);reservation.source=s;reservation.gain=g;
   s.onended=()=>{s.disconnect();g.disconnect();pan.disconnect();voices.delete(reservation);};s.start();played++;
  }).catch(()=>{voices.delete(reservation);loadFailures++;});
 }
 async function startLoops(){
  if(initPromise)return initPromise;
  initPromise=Promise.all(['wind','water','room','wheel','chain'].map(async name=>{const b=await buffer(name,true);if(!b||!ctx)return;const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=b;src.loop=true;g.gain.value=0;src.connect(g);g.connect(ambienceBus);src.start();loops.set(name,{src,g});}));return initPromise;
 }
 function disposeSlot(p){if(!p)return;p.element.pause();p.element.removeAttribute('src');p.element.load();p.source.disconnect();p.gain.disconnect();}
 function startMusic(id){
  if(!ctx||!unlocked||hidden||!config.enabled||config.station==='off')return;
  const entry=MUSIC.find(t=>t.id===id);if(!entry)return;
  if(slot?.id===id)return;
  if(oldSlot){disposeSlot(oldSlot);oldSlot=null;}
  const element=new Audio(new URL(entry.file,files).href);element.loop=true;element.preload='auto';const source=ctx.createMediaElementSource(element),g=ctx.createGain();g.gain.value=0;source.connect(g);g.connect(musicBus);
  oldSlot=slot;slot={id,element,source,gain:g};const current=slot;fade={elapsed:0,duration:oldSlot?3.5:1.8};chosen=id;
  element.play().then(()=>{if(slot!==current)return;nowPlaying=entry.name;now.textContent='Now playing: '+entry.name;now.hidden=false;nowUntil=performance.now()+4200;report();}).catch(()=>{if(slot===current){blocked=true;status.textContent='Music is waiting for browser permission. Press Enter once to start it.';status.hidden=false;}loadFailures++;});
 }
 function setStation(id){set({station:id});caption(id==='off'?'Music off':id==='auto'?'Adaptive score selected':MUSIC.find(t=>t.id===id)?.name);}
 function set(values){const before=config;config=audioPreferences({...config,...values});save();mix();if(before.enabled&&!config.enabled){for(const p of[slot,oldSlot])p?.element.pause();for(const v of voices)try{v.source?.stop();}catch{};if(ctx)ctx.suspend().catch(()=>{});unlocked=false;}
  if(config.enabled&&!before.enabled)unlock();if(config.station!==before.station){desiredAge=999;chosen=null;if(config.station==='off'){disposeSlot(slot);disposeSlot(oldSlot);slot=oldSlot=null;nowPlaying='';}else if(config.station!=='auto')startMusic(config.station);}report();
 }
 function update(s,dt,{playing=false,paused:isPaused=false,hidden:isHidden=false,cameraYaw=s.yaw}={}){
  session=playing;paused=isPaused;listener={x:s.x,z:s.z,yaw:cameraYaw};
  if(isHidden!==hidden){hidden=isHidden;if(hidden){for(const p of[slot,oldSlot])p?.element.pause();ctx?.suspend().catch(()=>{});}else if(config.enabled)unlock();}
  if(s!==lastState){lastState=s;snapshot={distance:s.distance,lift:s.lift,mode:s.mode,location:JSON.stringify(doorLocation(s,world)),credits:s.credits,health:s.health,focus:s.life.focus,guarding:s.guarding};seen=new WeakSet(s.events);stepDistance=0;windups=new Set();}
  const nowTime=performance.now();if(nowTime>captionUntil)captions.hidden=true;if(nowTime>nowUntil)now.hidden=true;
  if(!session||hidden){mix();return;}
  const loc=doorLocation(s,world),threats=validTargets(s,world).filter(e=>Math.hypot(e.x-s.x,e.z-s.z)<12&&clearShot(s,world,s,e));
  const auto=scoreFor({level:loc.level,room:loc.room,minute:s.city.minute,z:s.z,danger:s.mode==='foot'&&threats.length>0});
  const target=config.station==='auto'?auto:config.station;
  if(target!==desired){desired=target;desiredAge=0;}else desiredAge+=dt;
  if(target!=='off'&&unlocked&&(slot===null||target!==chosen&&desiredAge>(target==='pursuit'?.5:5)))startMusic(target);
  if(fade&&slot&&ctx){fade.elapsed+=dt;const f=clamp(fade.elapsed/fade.duration,0,1);gain(slot.gain,Math.sin(f*Math.PI/2),.08);if(oldSlot)gain(oldSlot.gain,Math.cos(f*Math.PI/2),.08);if(f>=1){disposeSlot(oldSlot);oldSlot=null;fade=null;}}
  mix();worldRoom=loc.level<0?.3:loc.room?.12:.015;gain(wet,worldRoom,.3);
  if(paused)return;
  motion=Math.min(1,Math.abs(s.speed)/14);
  const bed=(name,value,rate=1)=>{const b=loops.get(name);if(b){gain(b.g,value,.2);b.src.playbackRate.setTargetAtTime(rate,ctx.currentTime,.2);}};
  const outside=!loc.room&&loc.level>=0;
  bed('wind',outside?(loc.level===3?.25:.065):.013);bed('water',loc.level<0?.14:outside&&s.z>275?.095:Math.max(0,1-Math.hypot(s.x-11,s.z-190)/35)*.1);
  bed('room',loc.room?.12:.0);bed('wheel',s.mode!=='foot'?motion*(s.mode==='car'?.2:.10):0,.72+motion*.6);bed('chain',s.mode!=='foot'?motion*.085:0,.65+motion*.7);
  const traveled=s.distance-snapshot.distance;
  if(s.mode==='foot'&&s.lift<.02&&traveled>0&&traveled<4){stepDistance+=traveled;const stride=Math.abs(s.speed)>5?1.5:1.15;if(stepDistance>=stride){stepDistance%=stride;play('step-'+surfaceFor(s,world)+'-'+(stepIndex++%3),{volume:.23+Math.min(.12,Math.abs(s.speed)*.014),rate:.94+(stepIndex%5)*.025});}}
  if(snapshot.lift>.08&&s.lift===0)play('land',{volume:.36});
  const location=JSON.stringify(loc);if(snapshot.location!==location){play('door',{volume:.4,caption:loc.level===3?'Rooftop wind':loc.level<0?'Cellar echoes':loc.room?'Inside '+loc.room.replaceAll('-',' '):'Back on the street'});stepDistance=0;}
  if(s.credits!==snapshot.credits)play(s.credits>snapshot.credits?'coin':'coin',{volume:.23});
  if(s.health<snapshot.health&&!s.events.some(e=>!seen.has(e)&&['collision','duel-hit','doors-rival-strike','town-hit'].includes(e.type))){play(s.guarding?'block':'hurt',{volume:.43,caption:s.guarding?'Strike braced':'Vitality lost'});haptic('hurt');}
  if(s.life.focus<snapshot.focus-8&&s.life.aura>0)play('magic',{volume:.42});
  const nextWindups=new Set();
  for(const e of threats){const winding=e.kind==='rival'?e.actor.phase==='windup':e.kind==='guard'?s.banditPhase==='windup':s.life.attackPending;if(winding){nextWindups.add(e.id);if(!windups.has(e.id)){play('windup',{source:e,volume:.65,caption:e.name+' raises a weapon: brace or dodge'});haptic('warning');}}}windups=nextWindups;
  for(const e of s.events){if(seen.has(e))continue;seen.add(e);let cue=cueMap[e.type];
   if(!cue&&/complete|reward|finish/.test(e.type))cue=['success','Work complete'];else if(!cue&&/door|stairs|transition/.test(e.type))cue=['door'];else if(!cue&&/craft|repair|work/.test(e.type))cue=['lever'];
   if(cue){const important=['collision','duel-hit','doors-rival-strike','resonance-impact','doors-rival-yields'].includes(e.type);play(cue[0],{source:Number.isFinite(e.x)?e:null,volume:cue[0]==='success'?.35:.46,caption:cue[1]});if(important)haptic(e.type==='doors-rival-yields'?'success':'impact');}}
  ambientClock+=dt;
  if(outside&&ambientClock>=birdAt){birdAt=ambientClock+9+(stepIndex%5)*2;play('bird',{source:{x:s.x+16,z:s.z+12},volume:.13,rate:.9+(stepIndex%3)*.1});}
  const hour=Math.floor(s.city.minute/60);if(bellHour<0)bellHour=hour;else if(hour!==bellHour){bellHour=hour;if(outside)play('bell',{source:{x:-10,z:139},volume:.35,caption:'Town clock: '+String(hour).padStart(2,'0')+':00'});}
  snapshot={distance:s.distance,lift:s.lift,mode:s.mode,location,credits:s.credits,health:s.health,focus:s.life.focus,guarding:s.guarding};
 }
 function inspect(){let rms=0;if(analyser&&ctx?.state==='running'){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((a,v)=>a+v*v,0)/data.length);}return {preferences:{...config},available,initialized,context:ctx?.state||'not-created',unlocked,blocked,nowPlaying,station:config.station,chosen,desired,voices:voices.size,musicVoices:Number(!!slot)+Number(!!oldSlot),loops:loops.size,requests,played,loadFailures,dropped,rms,lastCue,eventCounts:{...eventCounts},paused,hidden,worldRoom};}
 report();return {unlock,update,play,set,setStation,inspect,caption,get preferences(){return {...config};},setHaptics(fn){haptic=fn||(()=>{});},toggle(){set({enabled:!config.enabled});},setPaused(v){paused=v;mix();},start(){session=true;unlock();},preview(name='success'){unlock().then(()=>play(name,{volume:.5,ui:true,caption:'Sound preview'}));}};
}
