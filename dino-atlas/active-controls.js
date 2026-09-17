// Pure input/travel policy. Existing save/remap keys are never rewritten.
export const ACTIVE_BUILD='ranger-express-20260917.1';
export const TRAVEL_KEY='dino-atlas.travel-controls.v1';
export const DEFAULT_TRAVEL=Object.freeze({version:1,xrLayout:'active',xboxLayout:'legacy',multiplier:4,guidance:true});
export function travelSettings(raw){return {...DEFAULT_TRAVEL,xrLayout:raw?.xrLayout==='legacy'?'legacy':'active',xboxLayout:raw?.xboxLayout==='active'?'active':'legacy',multiplier:[2,4,8].includes(raw?.multiplier)?raw.multiplier:4,guidance:raw?.guidance!==false};}
export function readTravel(storage){try{return travelSettings(JSON.parse(storage?.getItem(TRAVEL_KEY)||'null'));}catch{return travelSettings(null);}}
export function writeTravel(storage,value){try{if(!storage)return false;storage.setItem(TRAVEL_KEY,JSON.stringify(travelSettings(value)));return true;}catch{return false;}}
const button=(p,i)=>Math.max(0,Math.min(1,Number(p?.buttons?.[i]?.value??(p?.buttons?.[i]?.pressed?1:0))||0));
const axis=(p,i,d=.2)=>{const n=Number(p?.axes?.[i]);return Number.isFinite(n)&&Math.abs(n)>d?Math.sign(n)*(Math.min(1,Math.abs(n))-d)/(1-d):0;};
export function activeTrackedMotion(sources,mode='foot',blocked=new Set()){
 let left=null,right=null;
 for(const s of sources||[])if(!s.hand&&s.gamepad?.mapping==='xr-standard'&&!blocked.has(s)){if(s.handedness==='left')left=s.gamepad;if(s.handedness==='right')right=s.gamepad;}
 const x=axis(left,2),z=-axis(left,3)||0,aim=button(left,0)>.3,fire=button(right,0)>.15;
 // Triggers NEVER drive or change altitude in this layout. A stops/holds a craft.
 return {x,z,steer:-x,throttle:mode==='foot'||mode==='helicopter'?0:z,climb:mode==='helicopter'?(-axis(right,3)||0):0,aim,fire,brake:mode!=='foot'&&button(right,4)>.35,boost:mode==='foot'&&button(left,3)>.35,jump:mode==='foot'&&button(right,4)>.35,lookX:0,lookY:0,independentTools:!!(left||right)};
}
export function activeXboxMotion(p,mode='foot'){
 const x=axis(p,0,.18),z=-axis(p,1,.18)||0;
 return {x,z,steer:-x,throttle:['foot','helicopter'].includes(mode)?0:z,climb:mode==='helicopter'?(button(p,12)-button(p,13)):0,aim:button(p,6)>.3,fire:button(p,7)>.12,brake:button(p,1)>.35,boost:mode==='foot'&&button(p,10)>.35,jump:mode==='foot'&&button(p,12)>.35,lookX:axis(p,2,.14),lookY:axis(p,3,.14),independentTools:true};
}
export function cruiseFactor(input){return [2,4,8].includes(input?.cruise)?input.cruise:1;}
export function normalizedStick(x=0,z=0){const n=Math.max(1,Math.hypot(x,z));return {x:x/n,z:z/n};}
// No timer, stamina, fuel charge or cooldown. Safety transitions explicitly disarm it.
export class CruiseState{
 constructor(multiplier=4){this.multiplier=travelSettings({multiplier}).multiplier;this.active=false;this.mode=null;}
 toggle(mode){if(mode==='foot')return false;this.mode=mode;this.active=!this.active;return this.active;}
 reset(){this.active=false;}
 apply(v,mode,blocked=false){if(blocked||mode!==this.mode||mode==='foot'||v.brake)this.reset();this.mode=mode;v.cruise=this.active?this.multiplier:1;if(this.active)v.boost=false;return v;}
}
export function navigationBearing(player,target,yaw=0){
 if(!target||![target.x,target.z,player.x,player.z].every(Number.isFinite))return null;
 const dx=target.x-player.x,dz=target.z-player.z,distance=Math.hypot(dx,dz);
 const angle=Math.atan2(dx,-dz),relative=Math.atan2(Math.sin(angle+yaw),Math.cos(angle+yaw));
 const heading=((Math.round(angle/(Math.PI/4))%8)+8)%8;
 return {distance,relative,compass:['N','NE','E','SE','S','SW','W','NW'][heading],height:Number.isFinite(target.y)?target.y-(player.y||0):0};
}
