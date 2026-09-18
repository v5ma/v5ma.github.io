import {heightAt,waterAt,solidAt,HEIGHT,dist} from './world.mjs';
import {move} from './motion.mjs';
import {emit,hint} from './state.mjs';
export function previewBlink(s,direction,range=24){
 const p=s.player,dx=direction?.x,dz=direction?.z,len=Math.hypot(dx,dz);
 const fail=reason=>({valid:false,reason,point:{x:p.x,y:heightAt(p.x,p.z),z:p.z},distance:0});
 if(s.status!=='playing'||p.craft||p.healing||p.vault||p.dodge>0)return fail('Finish the current action before blinking.');
 if(p.waterMode==='swim')return fail('Leave deep water before using blink.');
 if(!Number.isFinite(len)||len<.01)return fail('Point toward a clear route.');
 const max=Math.max(1,Math.min(32,Number.isFinite(range)?range:24)),ux=dx/len,uz=dz/len,q={x:p.x,z:p.z};let lastY=heightAt(q.x,q.z);
 for(let t=.1;t<=max+.001;t+=.1){const x=p.x+ux*t,z=p.z+uz*t,y=heightAt(x,z),water=waterAt({x,z});
  if(solidAt(x,z,HEIGHT[p.stance])||!Number.isFinite(y)||Math.abs(y-lastY)>.12||water?.swimmable&&water.depth>=.8)break;
  q.x=x;q.z=z;lastY=y;
 }
 const distance=dist(p,q);return {valid:distance>=1,reason:distance<1?'No clear blink route.':'Release to blink along the clear route.',point:{...q,y:lastY},distance};
}
export function blink(s,direction,enabled=true){
 if(!enabled){hint(s,'Blink is disabled in movement settings.');return false;}
 const target=previewBlink(s,direction);if(!target.valid){hint(s,target.reason);return false;}
 const p=s.player,from={x:p.x,y:heightAt(p.x,p.z),z:p.z};
 move(p,target.point.x-p.x,target.point.z-p.z,HEIGHT[p.stance]);p.vx=p.vz=0;
 emit(s,'blink',{from,to:{x:p.x,y:p.y,z:p.z}});return true;
}
