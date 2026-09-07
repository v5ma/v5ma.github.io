/* A pilotable courier craft in the same world. No fast travel or scene swap. */
import {DOCKS} from './city-world.mjs';
import {skiffDock} from './city-state.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function makeSkiff(){return {...DOCKS[0],yaw:0};}
export function boardSkiff(s){
 const p=s.p,v=s.skiff;
 if(!s.city.flags.includes('permit')||p.vehicle||p.rail||p.gliding||!p.grounded||Math.hypot(p.x-v.x,p.y-v.y,p.z-v.z)>3)return false;
 Object.assign(p,{x:v.x,y:v.y,z:v.z,vx:0,vy:0,vz:0,vehicle:'kestrel',grounded:true,scoped:false});s.events.push({type:'city-message',text:'KESTREL · Movement steers, SPACE rises, C descends. Park with E on a marked pad.'});return true;
}
export function parkSkiff(s){
 if(!s.p.vehicle)return false;const d=skiffDock(s.p);if(!d||!s.p.grounded){s.events.push({type:'city-message',text:'Descend onto a marked landing pad before parking. SPACE rises; C descends.'});return true;}
 Object.assign(s.skiff,{x:s.p.x,y:s.p.y,z:s.p.z,yaw:s.p.yaw});s.p.vehicle=null;s.p.vx=s.p.vy=s.p.vz=0;
 if(d.id==='garden'&&s.city.flags.includes('parcel'))s.cityFlightArrived=true;
 s.events.push({type:'city-message',text:'Parked at '+d.name+'. E interacts with people and objects again.'});return true;
}
export function vehicleStep(s,input,dt,world){
 const p=s.p,ix=Number.isFinite(input.moveX)?input.moveX:(input.right?1:0)-(input.left?1:0),iz=Number.isFinite(input.moveZ)?input.moveZ:(input.forward?1:0)-(input.back?1:0),l=Math.max(1,Math.hypot(ix,iz));
 const speed=input.boost?18:11,blend=1-Math.exp(-dt*3.5),sine=Math.sin(p.yaw),cosine=Math.cos(p.yaw);
 const tx=(sine*iz+cosine*ix)*speed/l,tz=(-cosine*iz+sine*ix)*speed/l,up=input.rise||s.vehicleRise>0,down=input.descend||s.vehicleDescend>0;
 s.vehicleRise=Math.max(0,(s.vehicleRise||0)-dt);s.vehicleDescend=Math.max(0,(s.vehicleDescend||0)-dt);
 p.vx+=(tx-p.vx)*blend;p.vz+=(tz-p.vz)*blend;p.vy+=(((up?1:0)-(down?1:0))*5-p.vy)*blend;
 const radius=1.1;
 const obstructed=(x,y,z)=>[[-radius,0],[radius,0],[0,-radius],[0,radius],[0,0]].some(([dx,dz])=>world.blocked(x+dx,y,z+dz));
 const old={x:p.x,y:p.y,z:p.z};let nx=p.x+p.vx*dt,ny=clamp(p.y+p.vy*dt,-20,58),nz=p.z+p.vz*dt;
 if(obstructed(nx,p.y,p.z)){nx=p.x;p.vx=0;}if(obstructed(nx,p.y,nz)){nz=p.z;p.vz=0;}
 if(obstructed(nx,ny,nz)){ny=p.y;p.vy=0;}
 // World bounds are a prototype airspace limit, never a destination warp.
 p.x=clamp(nx,-105,112);p.z=clamp(nz,-161,73);p.y=ny;
 const ground=world.groundAt(p.x,p.z,old.y+.6);p.grounded=false;
 if(Number.isFinite(ground.y)&&p.vy<=0&&p.y<=ground.y+.025){p.y=ground.y;p.vy=0;p.grounded=true;}
 if(p.x!==nx)p.vx=0;if(p.z!==nz)p.vz=0;
 s.stats.skiffDistance=(s.stats.skiffDistance||0)+Math.hypot(p.x-old.x,p.z-old.z);
 Object.assign(s.skiff,{x:p.x,y:p.y,z:p.z,yaw:p.yaw});
}
