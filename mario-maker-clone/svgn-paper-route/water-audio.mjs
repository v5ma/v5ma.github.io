/* One two-source ambience rig on the existing effects bus. No AudioContext or music owner. */
import {waterSamples} from './sensory-core.mjs';
const buffers=new WeakMap();
export function createWaterAudio(context, output) {
  if(!context||!output)throw new TypeError('An existing audio context and effects bus are required');
  let nodes=[],sources=[],gain=null,disposed=false,starts=0;
  const own=n=>(nodes.push(n),n);
  function stop(){
    if(gain){gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setValueAtTime(0,context.currentTime);}
    for(const s of sources){try{s.stop();}catch{}}
    for(const n of nodes){try{n.disconnect();}catch{}}
    sources=[];nodes=[];gain=null;
  }
  function setLevel(level){
    level=Number.isFinite(level)?Math.min(0.12,Math.max(0,level)):0;
    if(disposed)return;
    if(level===0||context.state!=='running'){stop();return;}
    if(!gain){
      try{
        let buffer=buffers.get(context);
        if(!buffer){const data=waterSamples();buffer=context.createBuffer(1,data.length,12000);buffer.copyToChannel(data,0);buffers.set(context,buffer);}
        gain=own(context.createGain());gain.gain.value=0;gain.connect(output);
        const noise=own(context.createBufferSource()),filter=own(context.createBiquadFilter());
        noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=900;filter.Q.value=0.5;
        noise.connect(filter);filter.connect(gain);
        const delay=own(context.createDelay(0.2)),wet=own(context.createGain());delay.delayTime.value=0.083;wet.gain.value=0.14;
        filter.connect(delay);delay.connect(wet);wet.connect(gain); // Early reflection only, no feedback.
        const pump=own(context.createOscillator()),pumpGain=own(context.createGain());pump.type='sine';pump.frequency.value=53;pumpGain.gain.value=0.025;
        pump.connect(pumpGain);pumpGain.connect(gain);
        sources=[noise,pump];noise.start();pump.start();starts++;
      }catch(error){stop();throw error;}
    }
    gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(level,context.currentTime,0.06);
  }
  return Object.freeze({setLevel,stop,dispose(){stop();disposed=true;},get diagnostics(){return {sources:sources.length,nodes:nodes.length,starts,disposed};}});
}
