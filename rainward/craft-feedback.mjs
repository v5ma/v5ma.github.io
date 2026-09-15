/* Text and progress only. Input, inventory and cancellation remain in the game. */
import {craftReadout} from './xr-interaction.mjs';
export function craftFeedback(player={},connected=false){
 const progress=craftReadout(player),survival=player.survival!==false;
 const choose=connected?'D-pad / left stick: choose. ':'Tab / arrows: choose. ';
 const hold=connected?'Hold A':'Hold Enter, Space, or the recipe button';
 const close=connected?' B: close.':' Esc: close.';
 if(!progress)return {percent:null,label:'Crafting progress',status:choose+(survival?hold+' to craft; release to cancel.':'Select a recipe to craft.')+close,overlay:''};
 const held=!!player.craft?.hold,name=progress.item.toUpperCase();
 return {percent:progress.percent,label:'Crafting '+progress.item,status:held?hold+' to assemble '+progress.item+'; release to cancel.':'Assembling '+progress.item+'. Crafting continues while the world moves.',overlay:'ASSEMBLING '+name+' / '+progress.percent+'%'+(held?' / '+(connected?'HOLD A':'HOLD ENTER / SPACE / RECIPE')+'; RELEASE CANCELS':'')};
}
