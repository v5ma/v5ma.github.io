/* Isolated Web Audio API mocks, not physical or audible browser evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResonanceAudio} from '../resonance-audio.mjs';
function harness(){
 const originals=new Map(),elements=[],nodes=[];let starts=0;const swaps={
  localStorage:{getItem:()=>null,setItem:()=>{}},
  document:{hidden:false,createElement:()=>({setAttribute(){},textContent:'',hidden:true}),body:{append(){}},getElementById:()=>null,addEventListener(){}},
  window:{addEventListener(){}},fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)}),
 };
 const param=()=>({value:0,setTargetAtTime(){}}),node=()=>({gain:param(),playbackRate:param(),connect(){},disconnect(){}});
 class C{constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.destination=node();}async resume(){this.state='running';}async suspend(){this.state='suspended';}createGain(){return node();}createDynamicsCompressor(){return {...node(),threshold:param(),ratio:param(),attack:param(),release:param()};}createAnalyser(){return {...node(),fftSize:512,getFloatTimeDomainData(a){a.fill(0);}};}createConvolver(){return node();}createBuffer(c,n){return {getChannelData(){return new Float32Array(n);}};}async decodeAudioData(){return {}; }createBufferSource(){const n={...node(),start(){starts++;},stop(){this.onended?.();}};nodes.push(n);return n;}createMediaElementSource(){return node();}createStereoPanner(){return {...node(),pan:param()};}}
 class A{constructor(src){this.src=src;this.paused=true;elements.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){}removeAttribute(){}}
 swaps.AudioContext=C;swaps.Audio=A;
 for(const [k,v]of Object.entries(swaps)){originals.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});}
 return {elements,get starts(){return starts;},restore(){for(const [k,d]of originals)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}};
}
const flush=()=>new Promise(r=>setTimeout(r,0));
test('Rapid controller audio unlocks initialize only five ambient sources, not duplicate loops',async()=>{const h=harness();try{const a=createResonanceAudio({world:{}});await Promise.all(Array.from({length:20},()=>a.unlock()));await flush();assert.equal(h.starts,5);assert.equal(a.inspect().loops,5);await Promise.all(Array.from({length:10},()=>a.unlock()));await flush();assert.equal(h.starts,5);}finally{h.restore();}});
test('Rapid station changes retain one active score stream and the last requested title',async()=>{const h=harness();try{const a=createResonanceAudio({world:{}});await a.unlock();for(const id of['vinci','market','lamplight','underways','pursuit'])a.setStation(id);await flush();assert.equal(a.inspect().musicVoices,1);assert.equal(h.elements.filter(e=>!e.paused).length,1);assert.equal(a.inspect().chosen,'pursuit');assert.equal(a.inspect().nowPlaying,'Across the Copper Roofs');a.setStation('off');await a.unlock();assert.equal(a.inspect().musicVoices,0);assert.equal(h.elements.filter(e=>!e.paused).length,0);}finally{h.restore();}});
test('Quiet density and independently chosen mixer levels are not reset by the new story release',async()=>{const h=harness();try{const a=createResonanceAudio({world:{}});assert.equal(a.preferences.density,'quiet');a.set({music:0,effects:.15,ambience:.1,master:.6});assert.equal(a.preferences.music,0);assert.equal(a.preferences.effects,.15);assert.equal(a.preferences.ambience,.1);assert.equal(a.preferences.master,.6);assert.equal(a.preferences.density,'quiet');}finally{h.restore();}});
