/* One soundtrack voice. Independently persisted music/effects buses, bounded
 * feedback, and cancellable async resume. No remote audio or telemetry. */
(function(root){'use strict';
 const KEY='prism-current.v1.audio';
 const clamp=(v,fallback)=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):fallback;
 class AudioTransport{
  constructor(){this.a=null;this.source=null;this.startAt=0;this.offset=0;this.playing=false;this.cache=new Map();this.pending=null;this.serial=0;this.voices=new Set();this.lastHit=-Infinity;this.volume=.55;this.effectsVolume=.22;this.muted=false;this.feedbackRate='balanced';
   try{const s=JSON.parse(root.localStorage?.getItem(KEY)||'{}');if(s&&typeof s==='object'){this.volume=clamp(s.music,.55);this.effectsVolume=clamp(s.effects,.22);this.muted=s.muted===true;if(['all','balanced','minimal','off'].includes(s.rate))this.feedbackRate=s.rate;}}catch{}
  }
  context(){if(!this.a){this.a=new (root.AudioContext||root.webkitAudioContext)();this.gain=this.a.createGain();this.gain.gain.value=this.muted?0:this.volume;this.gain.connect(this.a.destination);this.effects=this.a.createGain();this.effects.gain.value=this.muted?0:this.effectsVolume;this.effects.connect(this.a.destination);}return this.a;}
  save(){try{root.localStorage?.setItem(KEY,JSON.stringify({music:this.volume,effects:this.effectsVolume,muted:this.muted,rate:this.feedbackRate}));}catch{}}
  mix(){if(this.a){this.gain.gain.setTargetAtTime(this.muted?0:this.volume,this.a.currentTime,.02);this.effects.gain.setTargetAtTime(this.muted?0:this.effectsVolume,this.a.currentTime,.02);}}
  level(value,muted=this.muted){this.volume=clamp(value,this.volume);this.muted=!!muted;this.mix();this.save();}
  effectLevel(value){this.effectsVolume=clamp(value,this.effectsVolume);this.mix();this.save();}
  rate(value){if(['all','balanced','minimal','off'].includes(value)){this.feedbackRate=value;this.save();}}
  async prepare(id){this.context();if(this.cache.has(id))return;if(this.pending?.id===id)return this.pending.promise;
   const promise=new Promise((resolve,reject)=>{const w=new Worker('./music-worker.js'),timer=setTimeout(()=>{w.terminate();reject(Error('Music preparation timed out.'));},20000);w.onmessage=e=>{clearTimeout(timer);w.terminate();if(e.data.error){reject(Error(e.data.error));return;}const d=e.data,b=this.a.createBuffer(2,d.left.length,d.rate);b.copyToChannel(d.left,0);b.copyToChannel(d.right,1);this.cache.set(id,b);if(this.cache.size>3)this.cache.delete(this.cache.keys().next().value);resolve();};w.onerror=()=>{clearTimeout(timer);w.terminate();reject(Error('Could not prepare original soundtrack.'));};w.postMessage({id});});const pending={id,promise};this.pending=pending;try{await promise;}finally{if(this.pending===pending)this.pending=null;}
  }
  async play(id,offset=0){this.stop();const token=this.serial,a=this.context();let timer;
   try{await Promise.race([a.resume(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Browser audio is locked. Press a keyboard key or tap Play once, then use your controller.')),1800);})]);}finally{clearTimeout(timer);}
   if(token!==this.serial)return false;if(a.state!=='running')throw Error('Audio is suspended. Press a key or tap Play once.');const b=this.cache.get(id);if(!b)throw Error('Music is not ready');
   this.offset=Math.max(0,Math.min(Number.isFinite(offset)?offset:0,b.duration-.001));const source=a.createBufferSource();source.buffer=b;source.connect(this.gain);this.source=source;this.startAt=a.currentTime+.65;source.start(this.startAt,this.offset);this.playing=true;this.lastHit=-Infinity;return true;
  }
  time(){return this.playing?Math.max(this.offset,this.offset+this.a.currentTime-this.startAt):this.offset;}
  pause(){if(this.playing)this.offset=this.time();this.stop();return this.offset;}
  stop(){this.serial++;if(this.source){try{this.source.stop();}catch{}try{this.source.disconnect();}catch{}this.source=null;}for(const v of this.voices){try{v.o.stop();}catch{}v.o.disconnect();v.g.disconnect();}this.voices.clear();this.playing=false;}
  hit(hand,quality){if(!this.a||this.a.state!=='running'||this.muted||this.effectsVolume===0||this.feedbackRate==='off'||!Number.isFinite(quality))return false;const a=this.a,t=a.currentTime,gap={all:.025,balanced:.11,minimal:.4}[this.feedbackRate];if(t-this.lastHit<gap||this.voices.size>=4)return false;this.lastHit=t;
   const o=a.createOscillator(),g=a.createGain(),v={o,g};this.voices.add(v);o.type='sine';o.frequency.setValueAtTime(hand?640:470,t);o.frequency.exponentialRampToValueAtTime(hand?1000:720,t+.045);g.gain.setValueAtTime(.08*clamp(quality,0),t);g.gain.exponentialRampToValueAtTime(.0001,t+.065);o.connect(g);g.connect(this.effects);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(v);};o.start(t);o.stop(t+.07);return true;
  }
 }
 root.PrismAudio=AudioTransport;if(typeof module!=='undefined')module.exports=AudioTransport;
})(globalThis);
