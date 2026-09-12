/* Coastal Pulse motion primitives. Simulation remains fixed-step; presentation
 * interpolates. No exhausted-energy gate and no quantised traffic positions. */
import {RADIUS,add,mul,norm,dot,cross,clamp,tangent} from './world.mjs';
export const CRUISE_SPEED=30;
export function driveSpeed(s,input,dt,direction){
 const brake=typeof input.brake==='number'?clamp(input.brake,0,1):input.brake?1:0;
 const throttle=Number.isFinite(input.throttle)?clamp(input.throttle,0,1):1;
 const accelerate=!!input.boost&&brake<.05&&s.ride;
 if(s.ride&&!direction&&(s.speed>.005||accelerate))direction=tangent(s.facing,s.n);
 s.boosting=accelerate;s.energy=1; // Retained in old saves/HUD, never a throttle limiter.
 let wanted=0;
 if(brake>.05)wanted=0;
 else if(s.ride)wanted=accelerate?CRUISE_SPEED:Math.max(s.speed,direction?7.5*throttle:0);
 else wanted=direction?(input.boost?6.2:4.1)*throttle:0;
 s.speed+=(wanted-s.speed)*(1-Math.exp(-dt*(brake>.05?6+brake*13:accelerate?3.8:8)));
 if(s.speed<.004)s.speed=0;
 return direction;
}
export function capturePose(s){return {n:[...s.n],north:[...s.north],facing:[...s.facing],time:s.time,lift:s.lift,speed:s.speed,distance:s.distance};}
export function renderPose(previous,s,alpha){
 if(!previous||dot(previous.n,s.n)<.999)return s;
 const t=clamp(alpha,0,1),blend=(a,b)=>norm(add(mul(a,1-t),mul(b,t)));
 return {...s,n:blend(previous.n,s.n),north:blend(previous.north,s.north),facing:blend(previous.facing,s.facing),time:previous.time+(s.time-previous.time)*t,lift:previous.lift+(s.lift-previous.lift)*t,speed:previous.speed+(s.speed-previous.speed)*t,distance:previous.distance+(s.distance-previous.distance)*t};
}
export function makePath(points,closed=false){
 if(!Array.isArray(points)||points.length<2)throw Error('A route needs two or more points.');
 const p=points.map(n=>norm(n));if(closed&&dot(p[0],p.at(-1))<1-1e-12)p.push([...p[0]]);
 const cumulative=[0];for(let i=1;i<p.length;i++)cumulative.push(cumulative.at(-1)+Math.acos(clamp(dot(p[i-1],p[i]),-1,1))*RADIUS);
 if(cumulative.at(-1)<.001)throw Error('A route must have positive length.');
 return {points:p,cumulative,length:cumulative.at(-1),closed};
}
export function samplePath(path,meters,lane=0){
 const L=path.length,cycle=((meters%(path.closed?L:2*L))+(path.closed?L:2*L))%(path.closed?L:2*L);
 const reverse=!path.closed&&cycle>L,d=reverse?2*L-cycle:cycle;
 let lo=0,hi=path.cumulative.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(path.cumulative[mid]<=d)lo=mid;else hi=mid;}
 const u=(d-path.cumulative[lo])/Math.max(1e-6,path.cumulative[hi]-path.cumulative[lo]);
 let n=norm(add(mul(path.points[lo],1-u),mul(path.points[hi],u)));
 const f=tangent(mul(add(path.points[hi],mul(path.points[lo],-1)),reverse?-1:1),n);
 if(lane)n=norm(add(n,mul(norm(cross(f,n)),lane/RADIUS)));
 return {n,forward:tangent(f,n),reverse,meters:d};
}
/* Rounded, closed spherical block routes: cars turn through corners rather than
 * jumping between road samples or reversing in place at a loop seam. */
export function roundedLoop(corners,round=.10){
 const result=[],mix=(a,b,t)=>norm(add(mul(a,1-t),mul(b,t)));
 for(let i=0;i<corners.length;i++){
  const a=corners[(i+corners.length-1)%corners.length],b=corners[i],c=corners[(i+1)%corners.length],start=mix(b,a,round),end=mix(b,c,round);
  for(let k=0;k<9;k++){const t=k/8;result.push(mix(mix(start,b,t),mix(b,end,t),t));}
 }
 return makePath(result,true);
}
