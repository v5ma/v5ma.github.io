/* Deterministic device-to-action normalization. No DOM, timers or game state. */
export const BUTTONS=Object.freeze({jump:0,back:1,reload:2,interact:3,pulse:4,reverse:5,fire:7,map:8,pause:9,boost:10});
const finite=n=>Number.isFinite(n)?n:0;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stick(x,y,dead=.18){x=finite(x);y=finite(y);const len=Math.hypot(x,y);if(len<=dead)return [0,0];const scale=(Math.min(1,len)-dead)/(1-dead)/len;return [x*scale,y*scale];}
export function pressed(pad,index){const b=pad?.buttons?.[index];return !!b&&(b.pressed===true||finite(b.value)>.55);}
export class InputSampler{
 constructor(){this.previous=new Map();this.blocked=new Map();}
 reset(){this.previous.clear();this.blocked.clear();}
 read(pad,key='desktop',xr=false){
  if(!pad||pad.connected===false||pad.mapping!==(xr?'xr-standard':'standard')){this.previous.delete(key);this.blocked.delete(key);return null;}
  const mapping=xr?{fire:0,interact:1,jump:4,reload:5,boost:3}:BUTTONS;
  const now=Object.fromEntries(Object.entries(mapping).map(([action,i])=>[action,pressed(pad,i)]));
  const old=this.previous.get(key);if(!old)this.blocked.set(key,new Set(Object.keys(now).filter(k=>now[k])));const blocked=this.blocked.get(key)||new Set();for(const k of [...blocked]){if(!now[k])blocked.delete(k);else now[k]=false;}this.previous.set(key,now);
  const edges=Object.fromEntries(Object.entries(now).map(([k,v])=>[k,!!old&&v&&!old[k]]));
  const move=xr?stick(pad.axes?.[2]??pad.axes?.[0],pad.axes?.[3]??pad.axes?.[1]):stick(pad.axes?.[0],pad.axes?.[1]);
  const look=xr?[0,0]:stick(pad.axes?.[2],pad.axes?.[3]);
  // New/reconnected controllers must be neutral before a held trigger can fire.
  if(!old)now.fire=false;
  return {move,look,held:now,edges};
 }
}
export function xrControls(sampler,sources){
 let left=null,right=null;const present=new Set();
 for(const s of sources||[]){if(!['left','right'].includes(s.handedness)||s.gamepad?.mapping!=='xr-standard')continue;present.add(s.handedness);const p=sampler.read(s.gamepad,s.handedness,true);if(s.handedness==='left')left=p;else right=p;}
 for(const hand of ['left','right'])if(!present.has(hand))sampler.previous.delete(hand);
 return {move:left?.move||[0,0],turn:right?.move?.[0]||0,menuAxis:left?.move||[0,0],held:{fire:right?.held.fire||false,boost:left?.held.boost||false},edges:{jump:right?.edges.jump||false,reload:right?.edges.reload||false,interact:right?.edges.interact||false,pulse:left?.edges.fire||false,reverse:left?.edges.interact||false,map:left?.edges.jump||false,pause:left?.edges.reload||false,confirm:right?.edges.fire||false,back:right?.edges.reload||false}};
}
export class SnapTurn{
 constructor(){this.latched=false;}
 update(axis,angle=Math.PI/6){if(Math.abs(axis)<.25)this.latched=false;if(Math.abs(axis)>.7&&!this.latched){this.latched=true;return Math.sign(axis)*angle;}return 0;}
 reset(){this.latched=false;}
}
