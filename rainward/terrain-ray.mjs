/* Continuous relief blocks sight and shots as well as placing feet.
 * The caller enables this only for the newly reshaped Meridian heightfield. */
export function intersectHeightfield(origin,direction,maxDistance,heightAt){
 if(![origin?.x,origin?.y,origin?.z,direction?.x,direction?.y,direction?.z,maxDistance].every(Number.isFinite)||maxDistance<=0)return null;
 if(Math.hypot(direction.x,direction.y,direction.z)<1e-8)return null;
 const horizontal=Math.hypot(direction.x,direction.z),step=horizontal>.001?Math.min(.5,.25/horizontal):.25;
 const clearance=t=>origin.y+direction.y*t-heightAt(origin.x+direction.x*t,origin.z+direction.z*t);
 let before=0;if(clearance(0)<-.025)return 0;
 for(let t=Math.min(step,maxDistance);;t=Math.min(t+step,maxDistance)){
  if(clearance(t)<-.015){let a=before,b=t;for(let i=0;i<9;i++){const mid=(a+b)*.5;if(clearance(mid)>0)a=mid;else b=mid;}return (a+b)*.5;}
  if(t>=maxDistance)break;before=t;
 }
 return null;
}
