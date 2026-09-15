/* Hardware-independent XR input rules. No game-state or DOM writes. */
export const XR_PINCH_CLOSE=.022,XR_PINCH_OPEN=.034;
const finite=n=>Number.isFinite(n)?n:0;
export function axis(n,dead=.18){n=finite(n);return Math.abs(n)<=dead?0:Math.sign(n)*Math.min(1,(Math.abs(n)-dead)/(1-dead));}
export function xrButtons(source){
 const p=source?.gamepad;
 if(!p||p.mapping!=='xr-standard')return {buttons:Array(6).fill(false),x:0,y:0};
 const axes=p.axes||[],buttons=p.buttons||[],offset=axes.length>=4?2:0;
 return {buttons:Array.from({length:6},(_,i)=>!!buttons[i]&&(buttons[i].pressed||buttons[i].value>.5)),x:axis(axes[offset]),y:axis(axes[offset+1])};
}
export function pinchDistance(a,b){
 if(!a||!b||![a.x,a.y,a.z,b.x,b.y,b.z].every(Number.isFinite))return null;
 return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
}
export function pinchDown(distance,previous=false){
 return Number.isFinite(distance)&&distance>=0&&distance<(previous?XR_PINCH_OPEN:XR_PINCH_CLOSE);
}
/** Connecting/reacquiring while held never activates. A release must arm it. */
export function createXRPress(){
 let armed=false,was=false;
 return {reset(){armed=false;was=false;},read(present,down){
  if(!present){const released=was;armed=false;was=false;return {down:false,pressed:false,released};}
  if(!down){const released=was;was=false;armed=true;return {down:false,pressed:false,released};}
  if(!armed)return {down:false,pressed:false,released:false};
  const pressed=!was;was=true;return {down:true,pressed,released:false};
 }};
}
export function neutralXR(){return {throttle:0,steer:0,look:0,lookY:0,fire:false,aim:false,hack:false,boost:false,brake:false,consoleCamera:true};}
export function xrLocomotion(state,x,y,turn,held,heading,dt){
 const out=neutralXR(),amount=Math.min(1,Math.hypot(x,y));
 out.look=-axis(turn,0)*Math.min(.05,Math.max(0,finite(dt)))*1.6;out.cameraYaw=heading;
 out.aim=!!held.aim;out.fire=!!held.fire;out.hack=!!held.hack;out.boost=!!held.sprint;
 if(state.mode==='foot'){
  out.analog=true;out.throttle=amount;out.moveYaw=amount>.01?heading-Math.atan2(x,-y):undefined;
 }else{
  out.throttle=-y;out.steer=x;out.brake=!!held.aim;out.boost=!!held.fire||held.sprint;out.consoleCamera=false;
 }
 return out;
}

/** A thumbstick must return to center after a UI handoff or tracking loss.
 * Otherwise a wheel selection also turns the game camera on the next frame. */
export function createXRAxisGate(){
 let armed=false;
 return {reset(){armed=false;},read(present,x,y){
  x=Math.max(-1,Math.min(1,finite(x)));y=Math.max(-1,Math.min(1,finite(y)));
  if(!present){armed=false;return {x:0,y:0};}
  if(!armed&&Math.hypot(x,y)<=.2)armed=true;
  return armed?{x,y}:{x:0,y:0};
 }};
}
/** Directional menu/variant repeat, deliberately separate from game movement. */
export function createXRRepeat(){
 let last='',next=0,previousTime=-Infinity;
 return {reset(){last='';next=0;previousTime=-Infinity;},read(x,y,now){
  if(!Number.isFinite(now)||now<previousTime){last='';next=0;return '';}
  previousTime=now;x=finite(x);y=finite(y);
  const direction=Math.max(Math.abs(x),Math.abs(y))<.55?'':Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
  if(!direction){last='';return '';}
  if(direction!==last||now>=next){next=now+(direction!==last?340:140);last=direction;return direction;}
  return '';
 }};
}
/** Right B mirrors Xbox X: reload an aimed sling, with held interaction access.
 * A normal interaction never acquires a second delayed interaction. */
export function createXRContextButton(){
 let started=null,holdInteraction=false;
 return {reset(){started=null;holdInteraction=false;},read({pressed=false,down=false,released=false,now,canReload=false,blocked=false}){
  if(blocked||!Number.isFinite(now)||(started!==null&&now<started)){started=null;holdInteraction=false;return null;}
  if(pressed){started=now;holdInteraction=!!canReload;return canReload?'reload':'interact';}
  if(released||!down){started=null;holdInteraction=false;return null;}
  if(holdInteraction&&started!==null&&now-started>=450){holdInteraction=false;return 'interact';}
  return null;
 }};
}
/** Cancel wins if A and B arrive together. Only the opening grip can commit
 * on release; releasing an unrelated grip must not select a pointer-open wheel. */
export function xrWheelCommand(hand,input,edges,{owner=false,direction=''}={}){
 if(hand==='right'&&edges[5]?.pressed)return {close:false};
 if((hand==='right'&&edges[4]?.pressed)||(hand==='left'&&owner&&edges[1]?.released))return {close:true};
 return {close:null,x:hand==='right'?finite(input.x):0,y:hand==='right'?finite(input.y):0,variant:hand==='left'?(direction==='left'?-1:direction==='right'?1:0):0};
}
