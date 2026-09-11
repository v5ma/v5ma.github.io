import {makeBuffer,impulse} from './audio-synthesis.mjs';
import {AUDIO_DEFAULTS,volume} from './audio-design.mjs';
/* Owned buses, shared reverb, limiter, finite voice and cache budgets. */
export function createSoundGraph(context,settings={}){
 const ctx=context,cache=new Map(),voices=new Set(),loops=new Map(),stats={played:0,culled:0,peakVoices:0,byKind:{}};
 const master=ctx.createGain(),limiter=ctx.createDynamicsCompressor(),analyser=ctx.createAnalyser(),buses={},sends={},nodes=[];
 limiter.threshold.value=-9;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.18;
 master.connect(limiter);limiter.connect(analyser);analyser.fftSize=256;analyser.connect(ctx.destination);
 const reverb=ctx.createConvolver(),wet=ctx.createGain();reverb.buffer=impulse(ctx);wet.gain.value=.16;reverb.connect(wet);wet.connect(master);
 for(const name of ['effects','threat','ambience','bed','melody','pulse','tension','ui']){const gain=ctx.createGain();gain.connect(master);buses[name]=gain;const send=ctx.createGain();send.connect(reverb);sends[name]=send;nodes.push(gain,send);}
 let dead=false,mix={intensity:0,listen:false,menu:false};
 const targets=new Map();const param=(p,v,time=ctx.currentTime)=>{if(targets.get(p)===v)return;targets.set(p,v);p.cancelScheduledValues(time);p.setTargetAtTime(v,time,.055);};
 function configure(next=mix){mix={...mix,...next};const music=volume(settings.musicVolume,AUDIO_DEFAULTS.musicVolume),effects=volume(settings.effectsVolume,AUDIO_DEFAULTS.effectsVolume),amb=volume(settings.ambienceVolume,AUDIO_DEFAULTS.ambienceVolume),menu=mix.menu?.30:1,listen=mix.listen;
  param(master.gain,settings.mute?0:volume(settings.masterVolume,75)*.75);master.channelCount=settings.monoAudio?1:2;master.channelCountMode='explicit';
  param(buses.effects.gain,effects*.85);param(buses.threat.gain,effects*(listen?1.32:.8));param(buses.ambience.gain,amb*menu*(listen?.19:.60));
  const musicMix=music*menu*(listen?.22:.65);param(buses.bed.gain,musicMix*(1-mix.intensity*.45));param(buses.melody.gain,musicMix*(1-mix.intensity*.68));param(buses.pulse.gain,musicMix*(.12+mix.intensity*.60));param(buses.tension.gain,musicMix*mix.intensity*.80);param(buses.ui.gain,effects*.24);
  for(const name of Object.keys(buses))param(sends[name].gain,targets.get(buses[name].gain));
  limiter.threshold.value=settings.nightAudio?-22:-9;limiter.ratio.value=settings.nightAudio?14:8;
 }
 function buffer(kind,duration,midi,variant){const key=[kind,duration,midi,variant].join('/');if(!cache.has(key)){cache.set(key,makeBuffer(ctx,kind,duration,78+variant*1789,midi));if(cache.size>144)cache.delete(cache.keys().next().value);}return cache.get(key);}
 function play(kind,{duration=.4,midi=57,gain=.5,bus='effects',pan=0,cutoff=16000,when=ctx.currentTime,variant=0,pitch=1,priority=false,send=.06}={}){
  if(dead)return false;if(voices.size>=(priority?48:36)){stats.culled++;return false;}
  when=Math.max(ctx.currentTime,when);const source=ctx.createBufferSource(),g=ctx.createGain(),panner=ctx.createStereoPanner(),filter=ctx.createBiquadFilter();source.buffer=buffer(kind,duration,midi,variant%4);source.playbackRate.value=pitch;
  g.gain.value=Math.max(0,Math.min(1.5,gain));panner.pan.value=settings.monoAudio?0:Math.max(-1,Math.min(1,pan));filter.type='lowpass';filter.frequency.value=Math.min(cutoff,ctx.sampleRate*.45);
  source.connect(filter);filter.connect(g);g.connect(panner);panner.connect(buses[bus]||buses.effects);const sent=ctx.createGain();sent.gain.value=send;panner.connect(sent);sent.connect(sends[bus]||sends.effects);
  const voice={source,bus,nodes:[source,g,panner,filter,sent]};voices.add(voice);stats.played++;stats.byKind[kind]=(stats.byKind[kind]||0)+1;stats.peakVoices=Math.max(stats.peakVoices,voices.size);
  const done=()=>{voices.delete(voice);voice.nodes.forEach(n=>{try{n.disconnect();}catch{}});};source.onended=done;source.start(when);source.stop(when+duration/pitch+.02);return true;
 }
 function loop(kind,gain=.45){if(dead||loops.has(kind))return;const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=buffer(kind,4,57,0);source.loop=true;g.gain.value=gain;source.connect(g);g.connect(buses.ambience);source.start();loops.set(kind,{source,g});}
 function clear(){for(const v of voices){try{v.source.stop();}catch{}v.nodes.forEach(n=>{try{n.disconnect();}catch{}});}voices.clear();for(const {source,g}of loops.values()){try{source.stop();}catch{}source.disconnect();g.disconnect();}loops.clear();}
 function snapshot(){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);return {...stats,byKind:{...stats.byKind},activeVoices:voices.size,loopCount:loops.size,cacheSize:cache.size,context:ctx.state,level:Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length),buses:Object.fromEntries(Object.entries(buses).map(([k,n])=>[k,n.gain.value])),...mix};}
 configure();return {play,loop,configure,clear,snapshot,get loopCount(){return loops.size;},context:ctx,dispose(){clear();dead=true;[...nodes,master,limiter,analyser,reverb,wet].forEach(n=>n.disconnect());cache.clear();}};
}
