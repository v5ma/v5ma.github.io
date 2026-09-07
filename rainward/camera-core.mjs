/* Conservative swept camera boom: expand boxes by a near-plane allowance,
 * shorten on impact, and recheck smoothing so it cannot cut across a corner. */
import {OBSTACLES,rayBox} from './world.mjs';
export function clipBoom(target,desired,radius=.20,boxes=OBSTACLES){
 desired={...desired,y:Math.max(radius+.04,desired.y)};
 const dx=desired.x-target.x,dy=desired.y-target.y,dz=desired.z-target.z,length=Math.hypot(dx,dy,dz);if(length<1e-8)return {...target};
 const direction={x:dx/length,y:dy/length,z:dz/length};let limit=length;
 for(const b of boxes){const expanded={...b,w:b.w+radius*2,d:b.d+radius*2,h:b.h+radius*2,bottom:b.bottom-radius};const hit=rayBox(target,direction,expanded,length);if(hit!==null)limit=Math.min(limit,Math.max(0,hit-.025));}
 return {x:target.x+direction.x*limit,y:target.y+direction.y*limit,z:target.z+direction.z*limit};
}
export function followCamera(target,desired,previous,dt,snap=false){
 const safe=clipBoom(target,desired);if(!previous||snap)return safe;
 const oldSafe=clipBoom(target,previous),rate=1-Math.exp(-Math.max(0,dt)*14),blend={x:oldSafe.x+(safe.x-oldSafe.x)*rate,y:oldSafe.y+(safe.y-oldSafe.y)*rate,z:oldSafe.z+(safe.z-oldSafe.z)*rate};return clipBoom(target,blend);
}
