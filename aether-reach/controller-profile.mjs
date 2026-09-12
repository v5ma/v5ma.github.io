/* Saved gameplay bindings. Menu controls deliberately remain fixed so a custom
 * layout can never take away A/confirm, B/back or Menu/pause. No device IDs saved. */
export const PAD_NAMES = Object.freeze(['A','B','X','Y','LB','RB','LT','RT','View','Menu','L3','R3','D-pad Up','D-pad Down','D-pad Left','D-pad Right']);
export const PAD_DEFAULTS = Object.freeze({jump:0,back:1,reload:2,interact:3,pulse:4,reverse:5,aim:6,fire:7,map:8,pause:9,boost:10,survey:11,next:12,previous:13,field:14,shop:15});
export const PAD_ACTIONS = Object.freeze({jump:'Jump / aimed hook / release',back:'Crouch / foldwing / leave ladder',reload:'Use / reload; hold for rift or drop',interact:'Swap carried weapon',pulse:'Cast; hold and release for trap',reverse:'Recent power; hold for power wheel',aim:'Aim / scope',fire:'Fire weapon',boost:'Sprint / rail boost',survey:'Wrist melee',next:'Objective reminder',previous:'Survey target',field:'Field rig',shop:'Outfitters / loadout'});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const number=(v,def,a,b)=>Number.isFinite(v)?clamp(v,a,b):def;
export function cleanControllerProfile(value){
 const v=value&&typeof value==='object'?value:{};
 // Accept complete permutations only. Duplicated, missing or unknown binds
 // cannot silently make actions unreachable after corrupted storage/imports.
 const bindings={...PAD_DEFAULTS},keys=Object.keys(PAD_ACTIONS),allowed=keys.map(k=>PAD_DEFAULTS[k]);
 if(v.bindings&&keys.every(k=>Number.isInteger(v.bindings[k])&&allowed.includes(v.bindings[k]))&&new Set(keys.map(k=>v.bindings[k])).size===keys.length)
  for(const key of keys)bindings[key]=v.bindings[key];
 return {version:1,moveDeadzone:number(v.moveDeadzone,.18,.08,.4),lookDeadzone:number(v.lookDeadzone,.18,.08,.4),lookCurve:number(v.lookCurve,1.35,1,2.4),toggleSprint:v.toggleSprint===true,toggleAim:v.toggleAim===true,vibration:v.vibration!==false,bindings};
}
export function swapBinding(profile,action,index){
 const next=cleanControllerProfile(profile);
 if(!Object.hasOwn(PAD_ACTIONS,action)||!Number.isInteger(index)||![...Object.keys(PAD_ACTIONS)].some(k=>PAD_DEFAULTS[k]===index))return next;
 const other=Object.keys(PAD_ACTIONS).find(k=>next.bindings[k]===index),previous=next.bindings[action];
 next.bindings[action]=index;if(other&&other!==action)next.bindings[other]=previous;return next;
}
export function curveStick(values,exponent=1){const length=Math.hypot(...values);if(!length)return [0,0];const k=Math.pow(Math.min(1,length),number(exponent,1,1,2.4))/length;return values.map(v=>v*k);}
export class RepeatInput{
 constructor(delay=.34,interval=.11){this.delay=delay;this.interval=interval;this.reset();}
 reset(){this.direction=0;this.next=0;}
 update(value,now){const direction=Math.abs(value)>.58?Math.sign(value):0;if(!direction){if(Math.abs(value)<.3)this.reset();return 0;}if(direction!==this.direction){this.direction=direction;this.next=now+this.delay;return direction;}if(now>=this.next){this.next=now+this.interval;return direction;}return 0;}
}
