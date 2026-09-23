/* Route shared screen controls only while the integrated ward owns play.
 * Preserve the original city's handlers and the XR controller/hand paths. */
export function installFieldControls({document,window,canvas,active,paused,inXR,map,help,recenter,orbit,cancelTravel}){
 const cleanups=[];let drag=null;
 const on=(node,name,fn)=>{node?.addEventListener(name,fn,{capture:true});cleanups.push(()=>node?.removeEventListener(name,fn,{capture:true}));};
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
 for(const [id,fn]of [['atlas',map],['help',help],['view',recenter]])on(document.getElementById(id),'click',e=>{if(!active())return;stop(e);fn();});
 on(window,'keydown',e=>{if(!document.getElementById('ward-loading')?.open||!['Escape','KeyP'].includes(e.code))return;stop(e);if(!e.repeat)cancelTravel();});
 on(canvas,'pointerdown',e=>{if(!active()||paused()||inXR()||e.button!==0||e.isPrimary===false)return;stop(e);drag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture?.(e.pointerId);});
 on(canvas,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;stop(e);if(!active()||paused()||inXR()){drag=null;return;}const dx=e.clientX-drag.x;drag.x=e.clientX;if(Number.isFinite(dx))orbit(-dx*.005);});
 const release=e=>{if(!drag||drag.id!==e.pointerId)return;stop(e);drag=null;if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])on(canvas,type,release);
 on(window,'blur',()=>{drag=null;});
 return {dispose(){drag=null;cleanups.splice(0).forEach(f=>f());}};
}
export function fieldControlHint({ride='foot',gamepad=false,touch=false,combat=false,canGlide=false}={}){
 if(touch&&!gamepad)return 'Move pad to travel. Drag the scene to look. Interact uses nearby objects; Mission map shows the way in.';
 if(gamepad){
  if(ride!=='foot')return 'LS steer | RT accelerate | LT/B brake | Y '+(ride==='boat'?'dock at a pier':'dismount')+' | View map';
  return 'LS move | '+(combat?'L3 run':'RT run')+' | X interact | A hop | View map'+(canGlide?' | Hold LB+RB glide':'');
 }
 return 'WASD move | Shift '+(ride==='foot'?'run':'accelerate')+' | E interact | F '+(ride==='foot'?'mount':ride==='boat'?'dock':'dismount')+' | M map'+(canGlide?' | Hold K glide':'');
}
