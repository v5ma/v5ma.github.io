/* Read-only presentation helpers. No input sampling, progression or storage. */
import {TASKS} from './expedition-world.mjs';

// Old saves may still track a completed task (notably Bellwether's own reward
// path). Suggest the next unfinished task without rewriting the player's save.
export function focusedTask(s){
 const flags=s.expedition?.flags||[],selected=TASKS.find(t=>t.id===s.expedition?.tracked);
 return selected&&!flags.includes(selected.flag)?selected:TASKS.find(t=>!flags.includes(t.flag))||null;
}
export function goalDirection(player,goal){
 const dx=goal.x-player.x,dz=goal.z-player.z,dy=goal.y-player.y;
 if(Math.hypot(dx,dz)<1)return Math.abs(dy)<2?'Here':dy>0?'Directly above':'Directly below';
 const a=Math.atan2(Math.sin(Math.atan2(dx,-dz)-player.yaw),Math.cos(Math.atan2(dx,-dz)-player.yaw));
 if(Math.abs(a)<=Math.PI/8)return 'Ahead';
 if(Math.abs(a)>=7*Math.PI/8)return 'Behind you';
 if(a>0)return a<3*Math.PI/8?'Ahead right':a>5*Math.PI/8?'Behind right':'To your right';
 return a>-3*Math.PI/8?'Ahead left':a<-5*Math.PI/8?'Behind left':'To your left';
}
export function usePromptLabel({xr=false,standard=false,controllerUsed=false,connected=false,binding='X'}={}){
 return xr?(standard?binding:'Right grip'):controllerUsed&&connected?binding:'E';
}
export function stripUsePrefix(text){
 return String(text||'').replace(/^(?:X\s*\/\s*)?E(?=\s|[.:/\-]|\u00b7|$)\s*(?:[.:/\-]|\u00b7)?\s*/i,'');
}
export function objectiveReminder(goal){
 return goal?'NEXT: '+goal.name+' / '+goal.direction+' / '+goal.distance+' m / '+goal.level+'. Bearing only; use stairs, doors and routes.':'All adventures complete. Explore freely or finish the Silent Network relays.';
}
