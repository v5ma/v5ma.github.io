/* Presentation/input ownership only; no simulation or save writes. */
import {RECIPES} from './state.mjs';
export function selectIsHeld(source){
 return !!source && (source.hand ? source.pinch === true : !!(source.buttons?.[0]?.pressed || source.buttons?.[0]?.value > .65));
}
export function holdOwnerActive(hold,sources){
 return !!hold?.sourceId && selectIsHeld(sources.find(source=>source.id===hold.sourceId));
}
export function hoverTarget(sources){
 // Prefer the right ray when both point at controls; never transfer hold ownership.
 for(const side of ['right','left']){const source=sources.find(s=>s.side===side);if(source?.row)return source.row.id;}
 return null;
}
export function craftReadout(player={}){
 const craft=player.craft;if(!craft)return null;
 const total=RECIPES[craft.item]?.time;
 if(!Number.isFinite(total)||!Number.isFinite(craft.left))return null;
 const percent=Math.max(0,Math.min(100,Math.floor((1-craft.left/total)*100)));
 return {item:craft.item,percent,label:'ASSEMBLING '+craft.item.toUpperCase()+' / '+percent+'% / RELEASE TO CANCEL'};
}
