/* Pure presentation configuration. Never changes mission, position, or save data. */
export const DIORAMA_KEY='aether-reach.diorama.v1';
export const PRESENTATIONS=Object.freeze(['first-person-vr','diorama-vr','diorama-ar']);
export const OPENINGS=Object.freeze(['both','top','front']);
const finite=(v,f)=>Number.isFinite(v)?v:f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cleanDiorama(v={}){
 v=v&&typeof v==='object'?v:{};
 return {mode:PRESENTATIONS.includes(v.mode)?v.mode:'first-person-vr',opening:OPENINGS.includes(v.opening)?v.opening:'both',scale:clamp(finite(v.scale,.03),.02,.055),height:clamp(finite(v.height,.5),.35,1.15),yaw:finite(v.yaw,0)%(Math.PI*2)};
}
export function openingState(value){return {topOpen:value!=='front',frontOpen:value!=='top'};}
export function setOpening(value,part,open){
 const state=openingState(value);if(part!=='top'&&part!=='front')return value;
 state[part+'Open']=!!open;if(!state.topOpen&&!state.frontOpen)state[(part==='top'?'front':'top')+'Open']=true;
 return state.topOpen?(state.frontOpen?'both':'top'):'front';
}
export const sessionKind=mode=>mode==='diorama-ar'?'immersive-ar':'immersive-vr';
export function stagePoint(world,focus,anchor,config){
 const {scale:s,yaw:r}=cleanDiorama(config),x=world.x-focus.x,z=world.z-focus.z,c=Math.cos(r),q=Math.sin(r);
 return {x:anchor.x+s*(c*x+q*z),y:anchor.y+s*(world.y-focus.y),z:anchor.z+s*(-q*x+c*z)};
}
export function worldPoint(stage,focus,anchor,config){
 const {scale:s,yaw:r}=cleanDiorama(config),x=(stage.x-anchor.x)/s,z=(stage.z-anchor.z)/s,c=Math.cos(r),q=Math.sin(r);
 return {x:focus.x+c*x-q*z,y:focus.y+(stage.y-anchor.y)/s,z:focus.z+q*x+c*z};
}
// Table-relative movement stays independent of the character's aiming direction.
export function dioramaMove(move,playerYaw,tableYaw){
 const x=finite(move?.[0],0),f=-finite(move?.[1],0),d=tableYaw-playerYaw,c=Math.cos(d),s=Math.sin(d);
 return [x*c+f*s,x*s-f*c];
}
