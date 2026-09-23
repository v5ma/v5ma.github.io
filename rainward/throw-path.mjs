/* One source of truth for tool preview, launch and visible flight.
 * A bounded, conservative lob planner, not a rigid-body/bounce simulation.
 * Curves are checked against expanded authored collision, not decorative art.
 */
import {BOUNDS,OBSTACLES,HEIGHT,heightAt,rayBox} from './world.mjs';
export const THROW_LIMITS=Object.freeze({bottle:11,smoke:8,duration:.65,radius:.08});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
export function throwPosition(path,progress){
 const t=clamp(Number.isFinite(progress)?progress:0,0,1),a=path.from,b=path.to;
 if(t===0)return {...a};if(t===1)return {...b};
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t+Math.sin(Math.PI*t)*path.arc,z:a.z+(b.z-a.z)*t};
}
export function throwReadiness(s,kind){
 const p=s?.player;
 if(!p||s.status!=='playing')return 'The expedition is not active.';
 if(!['bottle','smoke'].includes(kind))return 'Select a bottle or smoke.';
 if(p.waterMode==='swim')return 'Reach dry ground before throwing.';
 if(p.craft||p.healing||p.melee)return 'Finish or cancel the current action before throwing.';
 if(!(p[kind==='bottle'?'bottles':'smoke']>0))return kind==='bottle'?'No bottles. Search existing supplies.':'No smoke. Craft one from fabric and salvage.';
 return '';
}
export function predictThrow(player,yaw,kind,world={bounds:BOUNDS,obstacles:OBSTACLES,height:heightAt}){
 const empty={valid:false,reason:'No clear throw. Step away from the wall or turn toward an opening.',kind,points:[],path:null,range:0,shortened:false};
 if(!player||![player.x,player.z,yaw].every(Number.isFinite)||!['bottle','smoke'].includes(kind))return {...empty,reason:'No valid throw direction.'};
 const {bounds:b,obstacles,height}=world,r=THROW_LIMITS.radius,limit=THROW_LIMITS[kind];
 const from={x:player.x,y:height(player.x,player.z)+Math.max(.30,(HEIGHT[player.stance]||HEIGHT.stand)*.72),z:player.z};
 if(!finite(from)||from.x<b.x0+r||from.x>b.x1-r||from.z<b.z0+r||from.z>b.z1-r)return empty;
 const dx=-Math.sin(yaw),dz=-Math.cos(yaw);let reach=limit;
 for(const [v,d,lo,hi]of [[from.x,dx,b.x0+r,b.x1-r],[from.z,dz,b.z0+r,b.z1-r]])if(Math.abs(d)>1e-8)reach=Math.min(reach,((d>0?hi:lo)-v)/d);
 if(reach<.6)return empty;
 // Filter once to the narrow horizontal corridor before trying shorter lobs.
 const far={x:from.x+dx*reach,z:from.z+dz*reach};
 const boxes=obstacles.filter(o=>!o.disabled&&o.x+o.w/2+r>=Math.min(from.x,far.x)&&o.x-o.w/2-r<=Math.max(from.x,far.x)&&o.z+o.d/2+r>=Math.min(from.z,far.z)&&o.z-o.d/2-r<=Math.max(from.z,far.z)).map(o=>({...o,w:o.w+2*r,d:o.d+2*r,bottom:o.bottom-r,h:o.h+2*r}));
 const occupied=p=>boxes.some(o=>p.x>=o.x-o.w/2&&p.x<=o.x+o.w/2&&p.z>=o.z-o.d/2&&p.z<=o.z+o.d/2&&p.y>=o.bottom&&p.y<=o.bottom+o.h);
 if(occupied(from))return empty;
 // A blocked distant landing falls back toward the player. Try low arcs too
 // so indoor ceilings do not forbid a legal, short underhand throw.
 for(let distance=reach;distance>=.6;distance-=.25){
  const to={x:from.x+dx*distance,z:from.z+dz*distance};to.y=height(to.x,to.z)+.12;
  if(!finite(to)||occupied(to))continue;
  for(const arc of [Math.min(2,distance*.3),.6,.2,0]){
   const path={from:{...from},to:{...to},arc},steps=Math.max(12,Math.ceil(distance/.15)),points=[{...from}];let clear=true;
   for(let i=1;i<=steps;i++){
    const next=throwPosition(path,i/steps),prev=points.at(-1),length=Math.hypot(next.x-prev.x,next.y-prev.y,next.z-prev.z);
    if(next.y<height(next.x,next.z)+r||occupied(next)){clear=false;break;}
    const direction={x:(next.x-prev.x)/length,y:(next.y-prev.y)/length,z:(next.z-prev.z)/length};
    if(boxes.some(box=>rayBox(prev,direction,box,length)!==null)){clear=false;break;}
    points.push(next);
   }
   if(clear)return {valid:true,reason:'',kind,path,points,range:distance,shortened:distance<limit-.01};
  }
 }
 return empty;
}
export function launchThrowable(s,yaw,kind){
 const reason=throwReadiness(s,kind);if(reason)return {valid:false,reason};
 const plan=predictThrow(s.player,yaw,kind);if(!plan.valid)return plan;
 const p=s.player;p[kind==='bottle'?'bottles':'smoke']--;
 s.projectiles.push({x:p.x,z:p.z,to:{...plan.path.to},kind,life:THROW_LIMITS.duration,total:THROW_LIMITS.duration,trajectory:plan.path});
 return plan;
}
