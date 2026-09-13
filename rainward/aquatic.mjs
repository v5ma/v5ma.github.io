import {waterAt,clamp} from './world.mjs';
import {emit,hint} from './state.mjs';
import {cancelAction} from './survival.mjs';
export const WATER={surfaceDepth:.64,diveSeconds:28,drownDamage:12};
export function deepWater(p){const w=waterAt(p);return w?.swimmable&&w.depth>=.8?w:null;}
export function canUseWeapon(p){return !p.submerged&&p.waterMode!=='swim';}
export function toggleSubmerge(s){const p=s.player,w=deepWater(p);if(s.status!=='playing'||!w)return false;if(p.reload||p.craft||p.healing||p.melee)return false;p.submerged=!p.submerged;p.stance='stand';p.vx=p.vz=0;if(p.submerged){p.swimDepth=Math.min(w.depth-.35,1.7);emit(s,'submerge',{x:p.x,z:p.z});hint(s,'Underwater. Watch your air; surface to refill it.');}else{p.swimDepth=WATER.surfaceDepth;emit(s,'surface',{x:p.x,z:p.z});hint(s,'Back at the surface.');}return true;}
export function surfaceWater(s){const p=s.player;if(s.status!=='playing'||p.waterMode!=='swim')return false;if(p.submerged){p.submerged=false;p.swimDepth=WATER.surfaceDepth;emit(s,'surface',{x:p.x,z:p.z});hint(s,'Surface reached.');}return true;}
export function updateAquatic(s,input,dt){const p=s.player,w=waterAt(p),deep=w?.swimmable&&w.depth>=.8,prior=p.waterMode||'dry';
 if(!w){p.waterMode='dry';p.submerged=false;p.swimDepth=Math.max(0,(p.swimDepth||0)-dt*3);p.oxygen=clamp((p.oxygen??100)+dt*36,0,100);if(prior!=='dry')emit(s,'water-exit',{x:p.x,z:p.z});return;}
 if(!deep){p.waterMode='wade';p.submerged=false;p.swimDepth=0;p.oxygen=clamp((p.oxygen??100)+dt*36,0,100);if(prior==='dry')emit(s,'water-enter',{x:p.x,z:p.z,deep:false});return;}
 p.waterMode='swim';p.stance='stand';p.dodge=0;p.vault=null;p.aim=false;p.listen=false;if(prior!=='swim'){cancelAction(s,'Dry actions cancelled on entering deep water.');p.reload=0;p.reloadTotal=0;p.melee=null;p.submerged=false;p.swimDepth=WATER.surfaceDepth;emit(s,'water-enter',{x:p.x,z:p.z,deep:true});hint(s,'Deep water. Gear is stowed. Check the water controls to dive or surface.');}
 const target=p.submerged?Math.min(w.depth-.35,1.7):WATER.surfaceDepth;p.swimDepth+=(target-(p.swimDepth||0))*Math.min(1,dt*6);
 if(p.submerged){p.oxygen=clamp((p.oxygen??100)-100/WATER.diveSeconds*dt,0,100);if(p.oxygen<=0){p.hp=Math.max(0,p.hp-WATER.drownDamage*dt);if(p.hp<=0)s.status='dead';}}else p.oxygen=clamp((p.oxygen??100)+dt*24,0,100);
}
