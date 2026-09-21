/* Room-space workspace preferences. Never stored in the expedition save. */
export const ROTUNDA_KEY='aether-reach.workspace.v1';
const bounded=(x,d,a,b)=>Number.isFinite(x)?Math.max(a,Math.min(b,x)):d;
export function cleanWorkspace(v={}){
 v=v&&typeof v==='object'?v:{};
 return {height:bounded(v.height,1.12,.55,1.65),distance:bounded(v.distance,1.05,.65,1.8),scale:bounded(v.scale,.82,.55,1.2),yaw:bounded(v.yaw,0,-Math.PI,Math.PI),hud:['left','right','floor','hidden'].includes(v.hud)?v.hud:'left',motion:v.motion!==false,guidedAim:v.guidedAim!==false};
}
export function workspaceAnchor(head,config){
 const c=cleanWorkspace(config),x=Number.isFinite(head?.x)?head.x:0,z=Number.isFinite(head?.z)?head.z:0;
 const yaw=Math.atan2(head?.forward?.x||0,-(head?.forward?.z??-1))+c.yaw;
 return {x:x+Math.sin(yaw)*c.distance,y:c.height,z:z-Math.cos(yaw)*c.distance,yaw:-yaw};
}
export function workspaceStep(value,open,dt,motion=true){
 const target=open?1:0;if(!motion)return target;
 return value+(target-value)*Math.min(1,Math.max(0,Number.isFinite(dt)?dt:0)*14);
}
