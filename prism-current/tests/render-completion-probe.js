/* TEST-ONLY, opt-in completion observations. No game loop or quality adaptation.
 * Timer queries are optional; unavailable/disjoint values are NEVER estimated.
 * Paused draw variants temporarily hide graphics only and restore them in finally.
 */
(function(root){'use strict';
 const VERSION='0.1.0';
 function install(scene){
  const r=scene.renderer,gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),original=r.render;
  const pending=[],samples=[];let disposed=false,disjoint=0,skipped=0,total=0;
  const state=()=>{const s=root.River?.snapshot();return {phase:s?.phase,time:s?.time,mode:s?.mode,drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight]};};
  const push=x=>{samples.push(x);if(samples.length>96)samples.shift();};
  function poll(){
   if(!ext||disposed)return;
   if(gl.getParameter(ext.GPU_DISJOINT_EXT)){disjoint++;for(const x of pending)gl.deleteQuery(x.query);pending.length=0;return;}
   for(let i=pending.length-1;i>=0;i--){const x=pending[i];if(gl.getQueryParameter(x.query,gl.QUERY_RESULT_AVAILABLE)){
     const elapsed=gl.getQueryParameter(x.query,gl.QUERY_RESULT);gl.deleteQuery(x.query);pending.splice(i,1);
     if(Number.isFinite(elapsed)&&elapsed>=0)push({...x.state,gpuElapsedMs:elapsed/1e6,resultDelayMs:performance.now()-x.at});
    }}
  }
  const replacement=function(s,c){
   if(disposed||s!==scene.object3D)return original.call(this,s,c);
   poll();let q=null,entry=null;
   if(ext&&total<192&&pending.length<4&&!gl.getQuery(ext.TIME_ELAPSED_EXT,gl.CURRENT_QUERY)){
    q=gl.createQuery();if(q){entry={query:q,state:state(),at:performance.now()};gl.beginQuery(ext.TIME_ELAPSED_EXT,q);total++;}
   }else if(ext)skipped++;
   try{return original.call(this,s,c);}finally{if(q){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(entry);}}
  };
  r.render=replacement;
  return {snapshot(){poll();const debug=gl.getExtension('WEBGL_debug_renderer_info');return {version:VERSION,timerQueryAvailable:!!ext,gpuSamples:samples.slice(),disjoint,skipped,pending:pending.length,totalQueries:total,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,scope:'Optional elapsed GPU query for the actual scene; result delay is host observation delay, not GPU duration.'};},dispose(){if(disposed)return;disposed=true;if(r.render===replacement)r.render=original;for(const x of pending)gl.deleteQuery(x.query);pending.length=0;}};
 }
 function pausedVariants(scene){
  const before=root.River?.snapshot();if(before?.phase!=='paused')return {skipped:'Requires the encounter to already be paused; no pause/state assignment is performed.'};
  const r=scene.renderer,gl=r.getContext(),water=scene.object3D.getObjectByName('Currentworks Water / local-space surface'),scenery=scene.object3D.getObjectByName('prism-ar-archipelago');
  if(!water||!scenery)return {skipped:'Known graphics objects unavailable.'};
  const saved={water:water.visible,scenery:scenery.visible},samples=[];
  const queueStart=performance.now();gl.finish();const initialQueueWaitMs=performance.now()-queueStart;
  try{
   for(const [name,w,s] of [['full',saved.water,saved.scenery],['without-water',false,saved.scenery],['without-scenery',saved.water,false],['without-both',false,false],['full-restored',saved.water,saved.scenery]]){
    water.visible=w;scenery.visible=s;
    for(let iteration=0;iteration<3;iteration++){
     gl.finish();const start=performance.now();r.render(scene.object3D,scene.camera);const submitted=performance.now();gl.finish();const completed=performance.now();
     samples.push({name,iteration,submitMs:submitted-start,completionWaitMs:completed-submitted,totalMs:completed-start,calls:r.info.render.calls,triangles:r.info.render.triangles});
    }
   }
  }finally{water.visible=saved.water;scenery.visible=saved.scenery;}
  const after=root.River.snapshot();
  if(before.time!==after.time||JSON.stringify(before.result)!==JSON.stringify(after.result)||after.phase!=='paused')throw Error('Paused diagnostic changed the encounter.');
  return {initialQueueWaitMs,drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],samples,statePreserved:true,scope:'Explicit frozen-scene draw-completion experiment after failure, not ordinary gameplay or pure GPU timestamps. Hiding graphics temporarily is diagnostic only, not a shipped quality change.'};
 }
 root.RenderCompletionProbe={VERSION,install,pausedVariants};
})(globalThis);
