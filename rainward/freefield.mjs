/* Preferences, never save-state or inventory. New defaults express the owner's
 * September 17 brief; the historical movement and XR layouts remain selectable. */
export const FREEFIELD_KEY='svgn.rainward.v1.freefield';
export const FREEFIELD_DEFAULTS=Object.freeze({freeStride:true,runSpeed:9,blink:true,footsteps:0,waterVolume:15,score:'quiet',xrLayout:'direct',pinnedXR:false,scope:true});
export function freefieldOptions(value={}){
 const v=value&&typeof value==='object'?value:{};
 const bounded=(key,min,max)=>Number.isFinite(v[key])?Math.max(min,Math.min(max,v[key])):FREEFIELD_DEFAULTS[key];
 return {freeStride:v.freeStride!==false,runSpeed:bounded('runSpeed',6,14),blink:v.blink!==false,footsteps:bounded('footsteps',0,100),waterVolume:bounded('waterVolume',0,100),score:['quiet','legacy','off'].includes(v.score)?v.score:'quiet',xrLayout:v.xrLayout==='legacy'?'legacy':'direct',pinnedXR:v.pinnedXR===true,scope:v.scope!==false};
}
export function readFreefield(storage){try{return freefieldOptions(JSON.parse(storage?.getItem(FREEFIELD_KEY)||'{}'));}catch{return freefieldOptions();}}
export function saveFreefield(storage,value){try{storage.setItem(FREEFIELD_KEY,JSON.stringify(freefieldOptions(value)));return true;}catch{return false;}}
export function locomotionPolicy(input,player,swimming=false){
 const free=input.freeStride===true;
 const sprint=!!input.sprint&&player.stance==='stand'&&(free||!player.exhausted&&player.stamina>5)&&!input.aim&&!player.craft;
 const speed=swimming?(sprint?(free?7:3.65):2.45):sprint?(free?freefieldOptions({runSpeed:input.runSpeed}).runSpeed:5.3):null;
 return {free,sprint,speed};
}
/* Sparse original motif with quiet bars; no continuous tick/drum ostinato. */
export function quietScore(chapter,step){
 const roots={district:50,meridian:52,conservatory:57,terminus:45,breakwater:48,whiteout:54,natatorium:43},root=roots[chapter]||50;
 const notes=[],bar=Math.floor(step/8),slot=step%8;
 if(bar%3===0&&slot===0)notes.push({bus:'bed',kind:'bow',midi:root-12,duration:6,gain:.055,pan:0});
 if(bar%3===0&&[0,3,6].includes(slot))notes.push({bus:'melody',kind:'felt',midi:root+12+[0,7,3][slot/3],duration:3.4,gain:.10,pan:(slot-3)*.05});
 return {notes,seconds:.65,theme:'After the Rain / sparse score'};
}
