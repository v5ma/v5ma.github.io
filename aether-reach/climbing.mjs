/* Continuous, reversible ladder motion; no teleport, save position or cheat API. */
import {LADDERS as ROOF_LADDERS} from './rooftop-world.mjs';
import {TIDE_LADDERS} from './tideglass-world.mjs';
const LADDERS=[...ROOF_LADDERS,...TIDE_LADDERS];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),pos=a=>({x:a[0],y:a[1],z:a[2]});
export function ladderLength(r){return r.points.slice(1).reduce((sum,p,i)=>sum+dist(pos(p),pos(r.points[i])),0);}
export function ladderPoint(r,d){let left=Math.max(0,Math.min(ladderLength(r),d));for(let i=1;i<r.points.length;i++){const a=pos(r.points[i-1]),b=pos(r.points[i]),length=dist(a,b);if(left<=length||i===r.points.length-1){const t=left/length;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};}left-=length;}}
export function createClimbing({occupied,clearLine,emit}){
 function nearby(s){const p=s.p;if(p.climb)return{type:'ladder',id:p.climb.id,label:'Climbing: forward/up ascends, back/down descends; jump or Foldwing button lets go'};if((!p.grounded&&!p.water?.swimming)||p.rail||p.ride)return null;
  if(p.water?.swimming){for(const r of TIDE_LADDERS){const a=pos(r.points[0]),b=pos(r.points[1]);if(Math.hypot(p.x-a.x,p.z-a.z)<1.45&&p.y>=a.y-.15&&p.y<=b.y&&clearLine({...p,y:p.y+1},{...a,y:p.y+1},s))return{type:'ladder',id:r.id,d:Math.max(0,p.y-a.y),label:'X / E - Climb out of the reservoir'};}}
  for(const r of LADDERS)for(const end of[0,1]){const q=pos(end?r.points.at(-1):r.points[0]);if(Math.abs(p.y-q.y)<.7&&dist(p,q)<2.1&&clearLine({...p,y:p.y+1},{...q,y:q.y+1},s))return{type:'ladder',id:r.id,end,label:'E / Climb '+r.name};}return null;}
 function leave(s,jump=false){const p=s.p;if(!p.climb)return false;p.climb=null;p.vx=p.vz=0;p.vy=jump?5.5:0;p.grounded=false;p.hookCooldown=.3;emit(s,'climb-leave');return true;}
 function enter(s){const n=nearby(s);if(!n)return false;if(s.p.climb)return leave(s);const r=LADDERS.find(r=>r.id===n.id),p=s.p;p.climb={id:r.id,d:n.d??(n.end?ladderLength(r):0),approach:true};if(p.water)p.water={swimming:false,submerged:false,diving:false,pool:null};p.gliding=false;p.hookRequest=0;p.vx=p.vy=p.vz=0;p.grounded=false;emit(s,'climb-start',{id:r.id});return true;}
 function step(s,input,dt){const p=s.p,c=p.climb;if(!c)return false;const r=LADDERS.find(r=>r.id===c.id);if(!r){leave(s);return false;}
  const length=ladderLength(r),axis=Number.isFinite(input.moveZ)?Math.max(-1,Math.min(1,input.moveZ)):(input.forward?1:0)-(input.back?1:0);let q;
  if(c.approach){const target=ladderPoint(r,c.d),l=dist(p,target),f=l?Math.min(1,dt*4/l):1;q={x:p.x+(target.x-p.x)*f,y:p.y+(target.y-p.y)*f,z:p.z+(target.z-p.z)*f};if(l<.02)c.approach=false;}
  else{const next=Math.max(0,Math.min(length,c.d+axis*3.3*dt));q=ladderPoint(r,next);if(!occupied(q.x,q.y,q.z,s))c.d=next;}
  if(!occupied(q.x,q.y,q.z,s)){Object.assign(p,q);p.vx=p.vy=p.vz=0;p.grounded=false;}
  else{leave(s);return true;}
  if(!c.approach&&((c.d===length&&axis>.1)||(c.d===0&&axis<-.1)))leave(s);
  return true;
 }
 return{nearby,enter,leave,step};
}
