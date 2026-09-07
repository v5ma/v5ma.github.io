import {heightAt,START,BOUNDS,OBSTACLES,ITEMS,SHELTERS,EXIT,PATROLS,HEIGHT,RAD,clamp,dist,inside,solidAt,rayBox,obstruction,coverAt,findPath} from './world.mjs';
import {forward,emit,hint} from './state.mjs';
export function visible(s,e,p=s.player){
 const d=dist(e,p);if(d<1.35)return !obstruction({x:e.x,y:heightAt(e.x,e.z)+1.5,z:e.z},{x:p.x,y:heightAt(p.x,p.z)+HEIGHT[p.stance]*.7,z:p.z});
 if(e.type==='drifter')return false;
 const f=forward(e.yaw),dot=((p.x-e.x)*f.x+(p.z-e.z)*f.z)/d;
 let range=18;if(p.stance==='crouch')range*=.78;if(p.stance==='prone')range*=.55;if(coverAt(p)&&p.stance!=='stand')range*=p.stance==='prone'?.30:.5;
 if(d>range||dot<Math.cos(Math.PI*.31))return false;
 if(obstruction({x:e.x,y:heightAt(e.x,e.z)+1.52,z:e.z},{x:p.x,y:heightAt(p.x,p.z)+HEIGHT[p.stance]*.72,z:p.z}))return false;
 for(const fog of s.smokes){const dx=p.x-e.x,dz=p.z-e.z,l=dx*dx+dz*dz,t=clamp(((fog.x-e.x)*dx+(fog.z-e.z)*dz)/(l||1),0,1);if(Math.hypot(e.x+t*dx-fog.x,e.z+t*dz-fog.z)<fog.radius&&d>1.5)return false;}
 return true;
}
export function move(p,dx,dz,height,ignore=null){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));for(let i=0;i<n;i++){const x=p.x+dx/n,z=p.z+dz/n;if(!solidAt(x,p.z,height,RAD,ignore))p.x=x;if(!solidAt(p.x,z,height,RAD,ignore))p.z=z;}p.y=heightAt(p.x,p.z);}
export function stance(s,value){const p=s.player;if(!['stand','crouch','prone'].includes(value)||s.status!=='playing'||p.vault)return false;if(solidAt(p.x,p.z,HEIGHT[value])){hint(s,'Not enough headroom to stand here.');return false;}p.stance=value;p.vx=p.vz=0;return true;}
