/* Opt-in bounded test diagnostics. No clock, input, renderer setting or game-state
 * writes. Durations measure CPU submission/callback time, NOT GPU completion. */
(function(root){'use strict';
 function install(g){
  const scene=g.el,r=scene.renderer,undo=[],frames=[],slow=[],inputs=[],pauses=[],resizes=[],tasks=[];
  let current=null,lastStart=null,disposed=false;const now=()=>performance.now();
  const push=(a,x,n)=>{a.push(x);if(a.length>n)a.shift();};
  const state=()=>({phase:g.phase,time:g.state?.time??0,mode:g.runMode,pointerHeld:!!g.mouse,quality:g.quality});
  const wrap=(o,k,f)=>{const old=o?.[k];if(typeof old!=='function')return;const replacement=function(...args){return f(old,this,args);};o[k]=replacement;undo.push(()=>{if(o[k]===replacement)o[k]=old;});};
  wrap(g,'tick',(old,self,args)=>{
   const begin=now();if(current){current.unattributedAfterMs=Math.max(0,begin-current.end);push(frames,current,360);if(current.intervalMs>75||current.tickMs>40||current.renderMs>40)push(slow,{...current},32);}
   current={...state(),at:begin,intervalMs:lastStart===null?0:begin-lastStart,tickMs:0,artMs:0,menuMs:0,renderMs:0,renders:0,end:begin};lastStart=begin;
   try{return old.apply(self,args);}finally{current.tickMs=now()-begin;current.end=now();}
  });
  for(const [o,k,name]of [[g.art,'update','artMs'],[g.dock,'update','menuMs']])wrap(o,k,(old,self,args)=>{const t=now();try{return old.apply(self,args);}finally{if(current)current[name]+=now()-t;}});
  wrap(r,'render',(old,self,args)=>{const t=now();try{return old.apply(self,args);}finally{const elapsed=now()-t;if(args[0]===scene.object3D&&current){current.renderMs+=elapsed;current.renders++;current.end=now();current.calls=r.info.render.calls;current.triangles=r.info.render.triangles;current.programs=r.info.programs.length;}else if(elapsed>75)push(slow,{...state(),at:t,scratchRenderMs:elapsed},32);}});
  wrap(r,'setPixelRatio',(old,self,args)=>{push(resizes,{...state(),at:now(),from:r.getPixelRatio(),to:args[0]},96);return old.apply(self,args);});
  wrap(g,'pauseRun',(old,self,args)=>{if(g.phase==='playing')push(pauses,{...state(),at:now(),reason:args[0],audioGap:g.audio.time()-g.lastTime,previous:frames.at(-1)||null,current:current?{...current}:null},16);return old.apply(self,args);});
  const input=e=>{if(e.type==='keydown'&&!['KeyF','KeyP','KeyR','KeyT','KeyQ','KeyE','Escape','F2'].includes(e.code))return;push(inputs,{at:now(),type:e.type,code:e.code||null,...state()},128);};
  for(const name of ['keydown','pointerdown','pointerup','pointercancel','lostpointercapture'])scene.addEventListener(name,input,true);
  // Key events may target the scene's parent rather than the a-scene element.
  document.addEventListener('keydown',input,true);
  let observer=null;if(typeof PerformanceObserver!=='undefined')try{observer=new PerformanceObserver(list=>{for(const e of list.getEntries())push(tasks,{start:e.startTime,duration:e.duration,name:e.name},32);});observer.observe({type:'longtask',buffered:false});}catch{}
  return {snapshot(){return {scope:'CPU callbacks and submission; unattributed gaps are not a proven GPU or scheduling diagnosis.',frames:frames.map(x=>({...x})),current:current?{...current}:null,slow:slow.map(x=>({...x})),inputs:inputs.map(x=>({...x})),pauses:pauses.map(x=>({...x})),resizes:resizes.map(x=>({...x})),longTasks:tasks.map(x=>({...x})),drawingBuffer:[r.domElement.width,r.domElement.height],pixelRatio:r.getPixelRatio()};},dispose(){if(disposed)return;disposed=true;for(const restore of undo.reverse())restore();observer?.disconnect();for(const n of ['keydown','pointerdown','pointerup','pointercancel','lostpointercapture'])scene.removeEventListener(n,input,true);document.removeEventListener('keydown',input,true);}};
 }
 root.RiverFrameTrace={install};
})(globalThis);
