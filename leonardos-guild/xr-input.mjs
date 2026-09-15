/* Hardware-independent XR input rules. No game-state or DOM writes. */
export const XR_PINCH_CLOSE=.022,XR_PINCH_OPEN=.034;
const finite=n=>Number.isFinite(n)?n:0;
export function axis(n,dead=.18){n=finite(n);return Math.abs(n)<=dead?0:Math.sign(n)*Math.min(1,(Math.abs(n)-dead)/(1-dead));}
export function xrButtons(source){
 const p=source?.gamepad;
 if(!p||p.mapping!=='xr-standard')return {buttons:Array(6).fill(false),x:0,y:0};
 const offset=p.axes.length>=4?2:0;
 return {buttons:Array.from({length:6},(_,i)=>!!p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>.5)),x:axis(p.axes[offset]),y:axis(p.axes[offset+1])};
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
