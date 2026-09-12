/* Resonant Hunt / bounded Web Audio graph. Original modal score, layered
 * weapon transients, physical listener pose and occluded HRTF point sources.
 * No external audio service, autoplay bypass, or prerecorded third-party work. */
(function(root){'use strict';
 const Score=root.ResonanceScore||(typeof require!=='undefined'?require('./resonance-score.js'):null);
 const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class Engine{
  constructor(ctx,config=Score.defaults){
   this.ctx=ctx;this.config=Score.clean(config);this.voices=new Set();this.limit=34;this.muted=false;this.log=[];this.metrics={played:0,culled:0,spatial:0,occluded:0,peakVoices:0};this.theme='cloister';this.pendingTheme='cloister';this.beat=0;this.nextBeat=0;this.dangerUntil=0;this.active=false;this.eye=[0,1.65,0];
   this.master=ctx.createGain();this.compressor=ctx.createDynamicsCompressor();this.master.connect(this.compressor);this.compressor.connect(ctx.destination);
   this.buses={};for(const key of['music','effects','ambience']){const bus=ctx.createGain();bus.connect(this.master);this.buses[key]=bus;}
   this.reverb=ctx.createConvolver();this.reverb.buffer=this.impulse();this.wet=ctx.createGain();this.wet.gain.value=.18;this.reverb.connect(this.wet);this.wet.connect(this.master);
   this.noise=this.noiseBuffer(2);this.choirWave=this.choir();this.apply(config,false);this.nextBell=9;
  }
  impulse(){const c=this.ctx,n=Math.floor(c.sampleRate*1.65),b=c.createBuffer(2,n,c.sampleRate);let seed=43291;for(let ch=0;ch<2;ch++){const a=b.getChannelData(ch);let smooth=0;for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;smooth=.7*smooth+.3*(seed/2147483648-1);a[i]=smooth*Math.pow(1-i/n,3.2)*.5;}}return b;}
  noiseBuffer(seconds){const c=this.ctx,b=c.createBuffer(1,Math.ceil(c.sampleRate*seconds),c.sampleRate),a=b.getChannelData(0);let seed=28191;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/2147483648-1;}return b;}
  choir(){const real=new Float32Array(14),imag=new Float32Array(14);for(let i=1;i<14;i++)imag[i]=i===1?1:i<5?.4/i:i<9?.14/i:.05/i;return this.ctx.createPeriodicWave(real,imag);}
  apply(config,muted=false){this.config=Score.clean(config);this.muted=muted;const c=this.ctx,t=c.currentTime;
   this.master.gain.setTargetAtTime(muted?0:this.config.master,t,.045);
   const quiet=this.config.dynamic==='quiet',wide=this.config.dynamic==='wide';
   this.compressor.threshold.setValueAtTime(quiet?-28:wide?-9:-17,t);this.compressor.knee.setValueAtTime(quiet?20:12,t);this.compressor.ratio.setValueAtTime(quiet?8:wide?4:6,t);this.compressor.attack.setValueAtTime(.004,t);this.compressor.release.setValueAtTime(.18,t);
   this.buses.effects.gain.setTargetAtTime(this.config.effects*(quiet?.8:1),t,.045);this.buses.ambience.gain.setTargetAtTime(this.config.ambience,t,.15);this.buses.music.gain.setTargetAtTime(this.config.music,t,.15);
  }
  listener(p,q){if(!finite(p))return;this.eye=[...p];const l=this.ctx.listener,t=this.ctx.currentTime;const rotate=root.RitualModel?.rotate;const f=rotate?rotate([0,0,-1],q):[0,0,-1],u=rotate?rotate([0,1,0],q):[0,1,0];
   if(l.positionX){for(const [a,i]of[['X',0],['Y',1],['Z',2]]){l['position'+a].value=p[i];l['forward'+a].value=f[i];l['up'+a].value=u[i];}}
   else{l.setPosition?.(...p);l.setOrientation?.(...f,...u);}
  }
  stopVoice(v){if(!this.voices.has(v))return;this.voices.delete(v);for(const source of v.sources)try{source.stop();}catch{}for(const node of v.nodes)try{node.disconnect();}catch{}}
  clear(category=null){for(const v of [...this.voices])if(!category||v.category===category)this.stopVoice(v);if(!category||category==='ambience'){if(this.wind){try{this.wind.source.stop();}catch{}for(const n of this.wind.nodes)try{n.disconnect();}catch{}this.wind=null;}}}
  sound(recipe,options={}){
   const {ctx:c}=this;if(this.muted||this.config.master===0||!recipe)return null;const category=options.category||'effects';if(this.config[category]===0)return null;
   const at=Math.max(c.currentTime,options.at??c.currentTime),duration=clamp(options.duration||recipe.duration,.04,8),priority=options.priority??(category==='effects'?2:0);
   if(finite(options.position)&&Math.hypot(...options.position.map((x,i)=>x-this.eye[i]))>55){this.metrics.culled++;return null;}
   for(const v of [...this.voices])if(v.end<c.currentTime-.03)this.stopVoice(v);
   if(this.voices.size>=this.limit){const steal=[...this.voices].find(v=>v.priority<priority);if(steal)this.stopVoice(steal);else{this.metrics.culled++;return null;}}
   const env=c.createGain(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=options.occluded?Math.min(900,recipe.filter):recipe.filter||3000;filter.Q.value=.6;env.connect(filter);
   const nodes=[env,filter],sources=[],v={nodes,sources,end:at+duration+.08,category,priority};this.voices.add(v);
   let tail=filter;
   if(finite(options.position)){const p=c.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=2.4;p.rolloffFactor=1.15;p.maxDistance=55;p.coneInnerAngle=360;p.coneOuterAngle=360;if(p.positionX){p.positionX.value=options.position[0];p.positionY.value=options.position[1];p.positionZ.value=options.position[2];}else p.setPosition(...options.position);tail.connect(p);tail=p;nodes.push(p);this.metrics.spatial++;if(options.occluded)this.metrics.occluded++;}
   const gain=c.createGain();gain.gain.value=options.occluded?.42:1;tail.connect(gain);gain.connect(this.buses[category]);nodes.push(gain);
   const send=c.createGain();send.gain.value=(category==='music'?.22:category==='ambience'?.16:.12)*this.config[category];gain.connect(send);send.connect(this.reverb);nodes.push(send);
   const volume=clamp((options.volume??1)*recipe.level,0,.5),attack=Math.min(duration*.45,recipe.attack||.007);env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(volume,at+attack);
   if(recipe.sustain)env.gain.linearRampToValueAtTime(volume*.72,at+duration*.67);
   env.gain.exponentialRampToValueAtTime(.00001,at+duration);
   const pitch=options.pitch||1,base=Math.max(25,recipe.freq*pitch),end=Math.max(25,(recipe.end||recipe.freq)*pitch);
   const partials=recipe.tone==='bell'?[[1,.64],[2.71,.22],[5.18,.09]]:recipe.tone==='choir'?[[1,.38],[1.004,.28],[.996,.28]]:[[1,.8],[2,.12]];
   for(const [factor,level]of partials){const o=c.createOscillator(),g=c.createGain();g.gain.value=level;o.type=['sine','triangle'].includes(recipe.tone)?recipe.tone:'sine';if(recipe.tone==='choir')o.setPeriodicWave(this.choirWave);o.frequency.setValueAtTime(base*factor,at);o.frequency.exponentialRampToValueAtTime(Math.min(14000,end*factor),at+duration*.8);o.connect(g);g.connect(env);o.start(at);o.stop(at+duration+.02);sources.push(o);nodes.push(o,g);}
   if(recipe.noise){const noise=c.createBufferSource(),g=c.createGain();noise.buffer=this.noise;noise.loop=true;g.gain.value=recipe.noise*.32;noise.connect(g);g.connect(env);noise.start(at,(this.metrics.played*.137)%1);noise.stop(at+duration+.02);sources.push(noise);nodes.push(noise,g);}
   sources[0].onended=()=>this.stopVoice(v);
   this.metrics.played++;this.metrics.peakVoices=Math.max(this.metrics.peakVoices,this.voices.size);return v;
  }
  play(id,options={}){const recipe=Score.recipes[id];if(!recipe)return;this.log.push({id,time:this.ctx.currentTime,position:finite(options.position)?[...options.position]:null,occluded:!!options.occluded});if(this.log.length>96)this.log.shift();const v=this.sound(recipe,options);
   if(recipe.repeat&&v)for(let i=1;i<recipe.repeat;i++)this.sound({...recipe,repeat:0,duration:.1,level:recipe.level*.42},{...options,at:(options.at??this.ctx.currentTime)+i*.12,priority:0});return v;
  }
  note(instrument,midi,at,duration,volume=.08){return this.sound({freq:Score.midi(midi),end:Score.midi(midi),duration,level:volume,tone:instrument==='pluck'?'triangle':instrument,noise:instrument==='pluck'?.08:0,filter:instrument==='choir'?1350:instrument==='pluck'?2400:4300,attack:instrument==='choir'?Math.min(.8,duration*.25):.012,sustain:instrument==='choir'},{category:'music',at,duration});}
  startWind(){if(this.wind||this.muted||!this.config.ambience)return;const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.noise;source.loop=true;filter.type='bandpass';filter.frequency.value=330;filter.Q.value=.3;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(this.buses.ambience);gain.gain.setTargetAtTime(.023,c.currentTime,1);source.start();this.wind={source,filter,gain,nodes:[source,filter,gain]};}
  music(active,threat,theme,focus=false){const t=this.ctx.currentTime;this.pendingTheme=theme in Score.themes?theme:'cloister';
   if(!active||this.muted||this.ctx.state==='closed'){if(this.active){this.clear('music');this.clear('ambience');}this.active=false;this.nextBeat=0;return;}
   if(!this.active){this.theme=this.pendingTheme;this.beat=0;this.nextBeat=t+.06;this.nextBell=t+8;this.active=true;}
   this.startWind();if(this.wind)this.wind.filter.frequency.setTargetAtTime(this.theme==='ember'?160:this.theme==='ivory'?540:330,t,2);
   this.buses.music.gain.setTargetAtTime(this.config.music*(focus?.55:1)*(t<this.dangerUntil?.48:1),t,.16);
   if(this.nextBeat<t-.3)this.nextBeat=t+.04; // Never burst a backlog after hidden tabs / lost frames.
   let budget=0;while(this.nextBeat<t+.14&&budget++<2){if(this.beat%32===0)this.theme=this.pendingTheme;const th=Score.themes[this.theme],beat=this.beat%32,bar=Math.floor(beat/4),bpm=th.bpm+(threat>.6?8:0),quarter=60/bpm,at=this.nextBeat,chord=th.chords[bar];
    if(beat%4===0){this.note('choir',th.root+chord[0]-12,at,quarter*3.8,.035);this.note('choir',th.root+chord[1],at+.025,quarter*3.8,.021);this.note('choir',th.root+chord[2],at+.045,quarter*3.8,.018);}
    const melody=th.melody[beat];if(melody!==null)this.note('pluck',th.root+melody,at,quarter*1.65,.035);
    if(beat%8===6)this.note('bell',th.root+chord[2]+12,at+.1,quarter*2,.013);
    if(threat>.2&&(beat%2===0||threat>.65)){this.sound({freq:82,end:34,duration:.32,level:.045*threat,tone:'sine',noise:.4,filter:490},{category:'music',at});this.note('pluck',th.root+chord[0]-12,at,quarter*.7,.025*threat);}
    this.beat++;this.nextBeat+=quarter;
   }
  }
  dispose(){this.clear();for(const n of [...Object.values(this.buses),this.reverb,this.wet,this.master,this.compressor])try{n.disconnect();}catch{}}
 }
 function install(g){
  const C=VesperCore,T=g.T,$=id=>document.getElementById(id);let engine=null,game=null,seen=0,steps=0,prevP=null,prevTime=0,drawWas=false,guardWas=false,lastTension=0,lastHealthBeat=0,captionUntil=0,manualPreview=0;
  const configIDs={master:'sound-master',music:'sound-music',effects:'sound-effects',ambience:'sound-ambience',dynamic:'sound-dynamic'};let config=Score.defaults,stored=null;
  try{stored=JSON.parse(localStorage.getItem('vesperfall-audio-v1')||'null');config=Score.clean(stored);}catch{config=Score.defaults;}
  const group=document.createElement('fieldset');group.className='resonance-settings';group.innerHTML='<legend>Resonant Hunt / Sound & music</legend><p>Original adaptive choir, plucked strings and bells. Positional attacks stay clearer than the music. Headphones are recommended.</p>';
  for(const key of['master','music','effects','ambience']){const label=document.createElement('label');label.textContent={master:'Master volume',music:'Music',effects:'Combat & interface',ambience:'World ambience'}[key]+' ';const select=document.createElement('select');select.id=configIDs[key];select.setAttribute('aria-label',label.textContent);const values=[...new Set([0,.2,.35,.42,.5,.65,.8,1,config[key]])].sort((a,b)=>a-b);for(const v of values){const option=document.createElement('option');option.value=String(v);option.textContent=Math.round(v*100)+'%';select.append(option);}select.value=String(config[key]);label.append(select);group.append(label);}
  group.insertAdjacentHTML('beforeend','<label>Mix <select id="sound-dynamic"><option value="headphones">Headphones / balanced</option><option value="quiet">Quiet / reduced peaks</option><option value="wide">Wide / cinematic</option></select></label><label><input type="checkbox" id="sound-captions" checked> Brief sound captions</label><button id="sound-preview" type="button">Sound check / unlock audio</button><p id="sound-status" role="status">Audio starts after a browser-approved interaction.</p>');
  document.querySelector('.settings').after(group);$('sound-dynamic').value=config.dynamic;
  if(stored&&typeof stored.enabled==='boolean')$('audio').checked=stored.enabled;else{let old={};try{old=JSON.parse(localStorage.getItem('vesperfall-controls-v1')||'{}');}catch{}if(!Object.hasOwn(old,'audio'))$('audio').checked=true;}
  function values(){return Score.clean(Object.fromEntries(Object.entries(configIDs).map(([k,id])=>[k,k==='dynamic'?$(id).value:Number($(id).value)])));}
  function save(){config=values();try{localStorage.setItem('vesperfall-audio-v1',JSON.stringify({...config,enabled:$('audio').checked}));}catch{}engine?.apply(config,!$('audio').checked);$('sound-status').textContent=$('audio').checked?'Audio enabled. Music responds to nearby threats and districts.':'All audio is muted.';}
  for(const id of[...Object.values(configIDs),'audio'])$(id).addEventListener('change',save);
  function ensure(){if(engine)return engine;try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return null;g.audio??=new Context({latencyHint:'interactive'});engine=new Engine(g.audio,values());engine.apply(values(),!$('audio').checked);return engine;}catch(e){$('sound-status').textContent='Audio is unavailable here; the game remains playable.';return null;}}
  async function unlock(){if(!$('audio').checked)return;const e=ensure();if(!e)return;try{if(e.ctx.state==='suspended')await e.ctx.resume();$('sound-status').textContent=e.ctx.state==='running'?'Spatial audio ready.':'Use Sound check if this browser requires an audio gesture.';}catch{$('sound-status').textContent='The browser has not enabled audio. Use Sound check.';}}
  const onGesture=()=>{if($('audio').checked)void unlock();};window.addEventListener('pointerdown',onGesture,{passive:true});window.addEventListener('keydown',onGesture,{passive:true});
  function onXR(){void unlock();const session=g.scene.renderer.xr.getSession();session?.addEventListener('selectstart',onGesture);session?.addEventListener('end',()=>session.removeEventListener('selectstart',onGesture),{once:true});}g.scene.addEventListener('enter-vr',onXR);
  const caption=document.createElement('div');caption.id='sound-caption';caption.setAttribute('aria-live','polite');caption.hidden=true;document.body.append(caption);
  function say(text){if(!$('sound-captions').checked)return;caption.textContent=text;captionUntil=performance.now()+1400;api.caption=text;}
  function positionOf(event,s){if(finite(event.p))return event.p;if(finite(event.origin))return event.origin;const enemy=Number.isInteger(event.id)?s.world.enemies.find(e=>e.id===event.id):null;return enemy?.p||null;}
  function cue(id,position=null,options={}){const e=ensure();if(!e||e.ctx.state!=='running'||!$('audio').checked)return;const occluded=finite(position)&&C.segmentBlocked(g.game.world,g.game.head,position,.015);return e.play(id,{...options,position,occluded});}
  function preview(){void unlock().then(()=>{if(!engine||engine.ctx.state!=='running')return;manualPreview=performance.now()+6200;engine.clear();const now=engine.ctx.currentTime;engine.note('choir',50,now,3,.08);engine.note('choir',57,now,3,.04);engine.note('pluck',74,now+.6,1.2,.06);engine.play('bow',{at:now+1.6});engine.play('stone',{at:now+2,position:[engine.eye[0]-2,engine.eye[1],engine.eye[2]-2]});engine.play('shield',{at:now+2.8,position:[engine.eye[0]+2,engine.eye[1],engine.eye[2]-2]});engine.play('bell',{at:now+3.5});$('sound-status').textContent='Sound check: choir, plucked string, bow, left stone, right shield, bell.';});}
  $('sound-preview').onclick=preview;
  function visibility(){if(!document.hidden)return;engine?.clear();engine&&(engine.active=false);engine?.ctx.suspend?.().catch(()=>{});}document.addEventListener('visibilitychange',visibility);
  const sound=g.sound.bind(g);g.sound=()=>{}; // Semantic events replace the old unpositioned sine tones.
  function update(){
   const s=g.game,now=performance.now();if(game!==s){game=s;seen=0;prevP=null;prevTime=s.time;steps=0;drawWas=false;guardWas=false;if(engine){engine.clear();engine.active=false;}}
   const active=g.running&&!g.paused&&s.phase==='playing'&&!document.hidden;
   caption.hidden=!active||g.xr||now>captionUntil||!$('sound-captions').checked;if(now>captionUntil)api.caption='';
   if(!$('audio').checked){for(const event of s.events){if(event.seq<=seen)continue;if(event.type==='enemy-windup')say((VesperEncounters.names[event.kind]||'Enemy')+' prepares an attack.');if(event.type==='block')say('Wardglass blocks the attack.');if(event.type==='guard-broken')say('Wardglass breaks.');}if(engine){engine.music(false,0,'cloister');engine.apply(values(),true);}seen=s.eventSeq||0;return;}
   if(!engine||engine.ctx.state!=='running'){seen=s.eventSeq||0;return;}
   const eye=g.head.object3D.getWorldPosition(new T.Vector3()),q=g.head.object3D.getWorldQuaternion(new T.Quaternion());engine.listener(eye.toArray(),q);engine.limit=g.xr?28:34;
   if(now>manualPreview)engine.music(active,Score.threat(s),Score.themeFor(s.world.rooms[C.roomAt(s.world,s.p)],g.arMode),g.ritual?.focus.open);
   for(const event of s.events){if(event.seq<=seen)continue;const id=Score.cue(event),p=positionOf(event,s);if(id&&(active||['death','gate-open','sector-complete','hurt'].includes(event.type)))cue(id,p,{priority:event.type==='enemy-windup'||event.type==='hurt'?3:2,volume:event.type==='shot'?.85:1});
    if(event.type==='enemy-windup'){engine.dangerUntil=engine.ctx.currentTime+.85;const name=VesperEncounters.names[event.kind]||'Enemy';say(name+' prepares an attack.');}
    if(event.type==='block')say('Wardglass blocks the attack.');if(event.type==='guard-broken')say('Wardglass breaks.');if(event.type==='ricochet')say('Ricochet rings from stone.');
    if(event.type==='hit'&&event.arrow==='frost')cue('frost',p,{volume:.7});
    if(event.type==='death'){cue('enemy-choir',null,{pitch:.5,volume:.7});cue('bell',null,{pitch:.5,volume:.65});}
    if(event.type==='sector-complete'){for(let i=0;i<3;i++)engine.note('bell',[62,69,74][i],engine.ctx.currentTime+i*.22,2,.065);}
   }seen=s.eventSeq||0;
   if(!active){drawWas=false;guardWas=false;prevP=null;return;}
   if(g.drawHeld&&!drawWas&&s.weapon==='bow')cue('nock',g.bowHolder.position.toArray(),{volume:.7});
   if(g.drawHeld&&g.charge>.08&&now-lastTension>145){lastTension=now;cue('nock',g.bowHolder.position.toArray(),{volume:.06+g.charge*.17,pitch:.7+g.charge*.7,priority:0});}
   if(s.shield&&!guardWas)cue('ward',s.shield.p,{volume:.6});drawWas=g.drawHeld;guardWas=!!s.shield;
   if(prevP&&s.time!==prevTime){const dist=Math.hypot(s.p[0]-prevP[0],s.p[2]-prevP[2]);if(dist<1.4)steps+=dist;else steps=0;if(steps>.85){steps%=.85;cue('footstep',[s.p[0],s.p[1]+.12,s.p[2]],{pitch:1+(s.shots%3)*.05,priority:0});}}
   prevP=[...s.p];prevTime=s.time;
   for(const bolt of s.bolts){if(bolt.soundPassed)continue;const near=C.len(C.sub(bolt.p,s.head));if(near<1.6&&near>.23){bolt.soundPassed=true;cue('whiz',bolt.p,{priority:1});}}
   if(engine.ctx.currentTime>engine.nextBell&&!g.arMode){engine.nextBell=engine.ctx.currentTime+13+(C.hash(s.world.seed)%7);const room=s.world.rooms[C.roomAt(s.world,s.p)];cue('bell',[room.x,7,room.z-6],{category:'ambience',volume:.2,priority:0});}
   if(s.health<s.maxHealth*.25&&engine.ctx.currentTime-lastHealthBeat>1.5){lastHealthBeat=engine.ctx.currentTime;cue('hurt',null,{volume:.12,priority:0});}
  }
  const visual=g.visuals.bind(g);g.visuals=function(){visual();update();};
  const pause=g.setPaused.bind(g);g.setPaused=function(value){pause(value);if(value){engine?.clear();if(engine)engine.active=false;}else void unlock();};
  const remove=g.remove.bind(g);g.remove=function(){window.removeEventListener('pointerdown',onGesture);window.removeEventListener('keydown',onGesture);g.scene.removeEventListener('enter-vr',onXR);document.removeEventListener('visibilitychange',visibility);engine?.dispose();caption.remove();remove();};
  const api={update,unlock,cue,preview,get engine(){return engine;},get settings(){return values();},caption:''};save();return api;
 }
 root.ResonanceAudio=Object.freeze({Engine,install});if(typeof module!=='undefined')module.exports=root.ResonanceAudio;
})(globalThis);
