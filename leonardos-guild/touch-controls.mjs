/* Pointer-owned, genuinely analogue thumb input. No synthetic keyboard events.
 * Each finger has one owner; cancellation always returns the stick to zero. */
export function stickVector(dx,dy,radius,deadzone=.1){
 if(![dx,dy,radius,deadzone].every(Number.isFinite)||radius<=0||deadzone<0||deadzone>=1)return {x:0,y:0,strength:0};
 const len=Math.hypot(dx,dy),raw=Math.min(1,len/radius),strength=Math.max(0,(raw-deadzone)/(1-deadzone));
 return {x:len?dx/len*strength:0,y:len?-dy/len*strength:0,strength};
}
export class StickState{
 constructor(){this.reset();}
 begin(id,x,y,radius){if(this.pointer!==null||![x,y,radius].every(Number.isFinite)||radius<=0)return false;this.pointer=id;this.center={x,y};this.radius=radius;return true;}
 move(id,x,y){if(id!==this.pointer||this.pointer===null)return false;this.value=stickVector(x-this.center.x,y-this.center.y,this.radius);return true;}
 end(id){if(id!==this.pointer||this.pointer===null)return false;this.reset();return true;}
 reset(){this.pointer=null;this.center={x:0,y:0};this.radius=1;this.value={x:0,y:0,strength:0};}
}
export function createTouchControls({stick,surface,active,onPress,onHold,show}){
 const axis=new StickState(),knob=stick.querySelector('.stick-knob'),presses=new Map();let camera=null,lookX=0,lookY=0;const controller=new AbortController(),listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:controller.signal});
 function paint(){const v=axis.value;knob.style.transform=`translate(${v.x*axis.radius}px,${-v.y*axis.radius}px)`;stick.classList.toggle('engaged',axis.pointer!==null);stick.setAttribute('aria-valuetext',v.strength>.01?`Forward ${v.y.toFixed(2)}, steering ${v.x.toFixed(2)}`:'Centered');}
 function release(el,id){try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch{}}
 function reset(){const id=axis.pointer;axis.reset();if(id!==null)release(stick,id);camera=null;lookX=lookY=0;for(const [pointer,{button,code}]of [...presses]){presses.delete(pointer);if(code)onHold(code,false);button.classList.remove('held');release(button,pointer);}paint();}
 listen(stick,'pointerdown',e=>{if(!active()||e.button>0)return;e.preventDefault();e.stopPropagation();show();const r=stick.getBoundingClientRect();if(axis.begin(e.pointerId,r.left+r.width/2,r.top+r.height/2,r.width*.31)){stick.setPointerCapture(e.pointerId);axis.move(e.pointerId,e.clientX,e.clientY);paint();}});
 listen(stick,'pointermove',e=>{if(axis.move(e.pointerId,e.clientX,e.clientY)){e.preventDefault();paint();}});
 for(const name of['pointerup','pointercancel','lostpointercapture'])listen(stick,name,e=>{if(axis.end(e.pointerId)){release(stick,e.pointerId);paint();}});
 for(const button of document.querySelectorAll('#touch-controls [data-hold],#touch-controls [data-action]')){
  listen(button,'pointerdown',e=>{if(!active()||e.button>0)return;e.preventDefault();e.stopPropagation();if([...presses.values()].some(p=>p.button===button))return;
   const code=button.dataset.hold;presses.set(e.pointerId,{button,code});button.setPointerCapture(e.pointerId);button.classList.add('held');
   if(code)onHold(code,true);else onPress(button.dataset.action);
  });
  for(const name of['pointerup','pointercancel','lostpointercapture'])listen(button,name,e=>{const entry=presses.get(e.pointerId);if(!entry||entry.button!==button)return;presses.delete(e.pointerId);button.classList.remove('held');if(entry.code)onHold(entry.code,false);release(button,e.pointerId);});
  // Keyboard users can activate touch controls after explicitly showing them.
  listen(button,'click',e=>{if(e.detail!==0||!active()||!button.dataset.action)return;onPress(button.dataset.action);});
 }
 listen(surface,'pointerdown',e=>{if(!active()||camera!==null||e.button>0)return;e.preventDefault();camera={id:e.pointerId,x:e.clientX,y:e.clientY};surface.setPointerCapture(e.pointerId);});
 listen(surface,'pointermove',e=>{if(camera?.id!==e.pointerId)return;e.preventDefault();lookX-=(e.clientX-camera.x)*.005;lookY+=(e.clientY-camera.y)*.008;camera.x=e.clientX;camera.y=e.clientY;});
 for(const name of['pointerup','pointercancel','lostpointercapture'])listen(surface,name,e=>{if(camera?.id===e.pointerId){camera=null;release(surface,e.pointerId);}});
 listen(window,'blur',reset);listen(window,'resize',reset);listen(document,'visibilitychange',()=>{if(document.hidden)reset();});
 return {reset,axes:()=>({...axis.value}),consumeLook(){const v={x:lookX,y:lookY};lookX=lookY=0;return v;},inspect:()=>({pointer:axis.pointer,axes:{...axis.value},cameraPointer:camera?.id??null,buttons:presses.size}),destroy(){reset();controller.abort();}};
}
