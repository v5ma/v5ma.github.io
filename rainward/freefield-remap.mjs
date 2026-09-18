/* Physical buttons map to gameplay actions only. Menu A/B and recovery gestures
 * are deliberately outside remapping, so any saved layout remains recoverable. */
export const REMAP_KEY='svgn.rainward.v1.button-remaps';
export const XR_ACTIONS=Object.freeze(['none','interact','reload','crouch','prone','traverse','fire','aim','listen','sprint','blink','melee','swapGun','selectTool','pack','map']);
export const XR_DEFAULT=Object.freeze({lefttrigger:'aim',leftgrip:'blink',leftstick:'sprint',leftprimary:'crouch',leftsecondary:'traverse',righttrigger:'fire',rightgrip:'interact',rightprimary:'interact',rightsecondary:'reload'});
export const XBOX_SLOTS=Object.freeze([0,1,2,3,4,5,6,7,10,11,12,13,14,15]);
export function normalizeRemaps(value={}){
 const v=value&&typeof value==='object'?value:{},xr={},xbox={};
 for(const [key,fallback]of Object.entries(XR_DEFAULT))xr[key]=XR_ACTIONS.includes(v.xr?.[key])?v.xr[key]:fallback;
 for(const id of XBOX_SLOTS){const n=Number(v.xbox?.[id]);xbox[id]=XBOX_SLOTS.includes(n)&&v.xbox?.[id]!==undefined?n:id;}
 return {xr,xbox};
}
export function loadRemaps(storage){try{return normalizeRemaps(JSON.parse(storage?.getItem(REMAP_KEY)||'{}'));}catch{return normalizeRemaps();}}
export function saveRemaps(storage,value){try{storage.setItem(REMAP_KEY,JSON.stringify(normalizeRemaps(value)));return true;}catch{return false;}}
export function remapPads(pads,mapping,playing){
 if(!playing)return pads;const remap=normalizeRemaps({xbox:mapping}).xbox;
 return Array.from(pads||[],p=>{if(!p||p.mapping!=='standard')return p;
  const buttons=Array.from({length:17},(_,i)=>[8,9,16].includes(i)?p.buttons[i]:{pressed:false,touched:false,value:0});
  for(const i of XBOX_SLOTS){const b=p.buttons?.[i];if(!b)continue;const target=remap[i],old=buttons[target];buttons[target]={pressed:!!(old.pressed||b.pressed),touched:!!(old.touched||b.touched),value:Math.max(old.value||0,b.value||0)};}
  return {id:p.id,index:p.index,connected:p.connected,mapping:p.mapping,axes:p.axes,buttons,timestamp:p.timestamp,vibrationActuator:p.vibrationActuator,hapticActuators:p.hapticActuators};
 });
}
