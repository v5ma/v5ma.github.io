/* Small, independently testable narration and resume primitives. */
(function(root){'use strict';
 const KEY='theology:listening:v1';
 function plain(s){return String(s).replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2').replace(/\[\[([^\]]+)\]\]/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]*>/g,'').replace(/^#{1,6}\s+/gm,'').replace(/[`*_]/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();}
 function segment(markdown,max=550){
  const clean=String(markdown).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');let section='Opening',notes=false,blocks=[];
  for(const p of clean.split(/\r?\n\s*\r?\n/)){
   if(/^#{1,6} /.test(p.trim())){section=plain(p);if(/^Source conversations$|^External sources and access notes$|^Visual context$/.test(section))notes=true;}
   const text=plain(p);if(!text||/^[-=]+$/.test(text))continue;
   let rest=text;while(rest){let n=rest.length<=max?rest.length:rest.lastIndexOf(' ',max);if(n<1)n=max;const part=rest.slice(0,n).trim();if(part)blocks.push({id:'segment-'+String(blocks.length+1).padStart(4,'0'),section,notes,text:part});rest=rest.slice(n).trim();}
  }return blocks;
 }
 function readResume(raw,slug,hash,total){try{const x=JSON.parse(raw);const p=x?.version===1?x.positions?.[slug]:null;if(!p||p.hash!==hash||!Number.isInteger(p.index)||p.index<0||p.index>=total)return null;return p.index;}catch{return null;}}
 class Speaker{
  constructor(synth,Utterance,onState){this.synth=synth;this.Utterance=Utterance;this.onState=onState||(()=>{});this.parts=[];this.index=0;this.generation=0;this.state='stopped';this.rate=1;this.voice=null;this.timer=null;}
  emit(state,error=''){this.state=state;this.onState({state,index:this.index,total:this.parts.length,error});}
  load(parts,index=0){this.stop();this.parts=parts;this.index=Math.max(0,Math.min(parts.length-1,index));this.emit('ready');}
  stop(){++this.generation;clearTimeout(this.timer);this.synth?.cancel();this.emit('stopped');}
  play(){if(!this.synth||!this.Utterance||!this.voice){this.emit('unavailable','Choose an available voice. Recorded audio and the full transcript remain usable.');return;}if(!this.parts.length)return;
   if(this.state==='paused'){this.synth.resume();this.emit('playing');return;}
   if(this.state==='playing'||this.state==='starting')return;
   if(this.state==='ended')this.index=0;
   this.generation++;this.synth.cancel();this.speak(this.generation);
  }
  speak(token){if(token!==this.generation)return;if(this.index>=this.parts.length){this.index=Math.max(0,this.parts.length-1);this.emit('ended');return;}
   if(!this.voice){this.stop();this.emit('unavailable','The selected voice is no longer available. Choose another voice or use the recording.');return;}
   const u=new this.Utterance(this.parts[this.index].text);u.voice=this.voice;u.lang=this.voice.lang;u.rate=this.rate;this.utterance=u;this.emit('starting');
   this.timer=setTimeout(()=>{if(token===this.generation&&this.state==='starting'){this.stop();this.emit('unavailable','The voice did not start. Choose another voice or use the recording.');}},12000);
   u.onstart=()=>{if(token!==this.generation||this.utterance!==u)return;clearTimeout(this.timer);if(this.state!=='paused')this.emit('playing');};
   u.onend=()=>{if(token!==this.generation||this.utterance!==u)return;clearTimeout(this.timer);this.index++;this.speak(token);};
   u.onerror=e=>{if(token!==this.generation||this.utterance!==u)return;clearTimeout(this.timer);++this.generation;this.utterance=null;this.synth.cancel();this.emit('error','Speech stopped: '+(e.error||'voice unavailable')+'. Your paragraph position is retained.');};this.synth.speak(u);
  }
  pause(){if(this.state==='starting'||this.state==='playing'){clearTimeout(this.timer);this.synth.pause();this.emit('paused');}}
  seek(index){const playing=this.state==='playing'||this.state==='starting';this.stop();this.index=Math.max(0,Math.min(this.parts.length-1,index));this.emit('ready');if(playing)this.play();}
  setRate(rate){if(!Number.isFinite(rate)||rate<.6||rate>1.6)throw Error('Invalid reading speed');const playing=this.state==='playing'||this.state==='starting';this.stop();this.rate=rate;this.emit('ready');if(playing)this.play();}
 }
 const api={KEY,plain,segment,readResume,Speaker};if(typeof module!=='undefined')module.exports=api;root.TheologyListeningCore=api;
})(typeof window==='undefined'?globalThis:window);
