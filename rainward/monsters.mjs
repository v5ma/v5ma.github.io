/* Original melee creatures with different silhouettes and attack commitments.
 * Charges aim at the last visible point once, not homing on a hidden player. */
import {dist,solidAt,obstruction,findPath,heightAt} from './world.mjs';
import {move} from './motion.mjs';
import {emit} from './state.mjs';
export const isMonster=e=>e.type==='prowler'||e.type==='brute';
export function updateMonster(s,e,dt){
 if(e.hp<=0){e.state='down';e.seen=false;return;}
 const p=s.player,d=dist(p,e),large=e.type==='brute',base=heightAt(e.x,e.z);
 const seeing=d<(large?13:16)&&!obstruction({x:e.x,y:base+(large?1.8:.75),z:e.z},{x:p.x,y:heightAt(p.x,p.z)+.5,z:p.z})&&!s.smokes.some(c=>dist(c,p)<c.radius&&d>2);
 e.seen=seeing;e.awareness=seeing?1:Math.max(0,e.awareness-dt*.15);e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.speed=0;
 if(e.phase==='windup'){
  e.phaseTime-=dt;if(e.phaseTime<=0){e.phase=large?'slam':'charge';e.phaseTime=large?.1:.7;emit(s,'monster-attack',{id:e.id,x:e.x,z:e.z});}return;
 }
 if(e.phase==='charge'||e.phase==='slam'){
  if(e.phase==='charge'){const old={x:e.x,z:e.z};move(e,e.chargeDir.x*8*dt,e.chargeDir.z*8*dt,1.2);e.speed=dist(old,e)/(dt||1);}
  if(!e.attackHit&&dist(e,p)<(large?3.1:1.25)&&!obstruction({x:e.x,y:heightAt(e.x,e.z)+.6,z:e.z},{x:p.x,y:heightAt(p.x,p.z)+.6,z:p.z})){
   e.attackHit=true;if(p.invulnerable<=0){p.hp=Math.max(0,p.hp-(large?30:19));p.invulnerable=.5;emit(s,'damage');if(p.hp===0){s.status='dead';emit(s,'death');}}
  }
  e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='recover';e.phaseTime=large?1.4:1.1;}return;
 }
 if(e.phase==='recover'){e.phaseTime-=dt;if(e.phaseTime<=0){e.phase=null;e.cooldown=1;}return;}
 if(seeing){e.target={x:p.x,z:p.z};e.timer=7;e.state='chase';}
 else{e.timer=Math.max(0,(e.timer||0)-dt);for(const n of s.sounds)if(n.id>(e.lastNoise||0)&&dist(n,e)<n.radius){e.target={x:n.x,z:n.z};e.timer=5;e.state='investigate';}if(!e.timer){e.target=null;e.state='patrol';}}
 for(const n of s.sounds)e.lastNoise=Math.max(e.lastNoise||0,n.id);
 if(seeing&&d<(large?3.2:7)&&!e.cooldown){
  const dx=p.x-e.x,dz=p.z-e.z,l=Math.hypot(dx,dz)||1;e.chargeDir={x:dx/l,z:dz/l};e.yaw=Math.atan2(-dx,-dz);e.phase='windup';e.phaseTime=large?1.2:.9;e.attackHit=false;e.aimTime=.5;
  emit(s,'callout',{id:e.id,x:e.x,z:e.z,text:large?'A heavy footfall. Get clear of the ring.':'A low growl. The creature is about to lunge.'});return;
 }
 const q=e.target||{x:e.points[e.index][0],z:e.points[e.index][1]};if(dist(e,q)<.7){if(e.state==='patrol')e.index=(e.index+1)%e.points.length;return;}
 e.repath-=dt;if(e.repath<=0){e.path=findPath(e,q);e.repath=.7;}while(e.path.length&&dist(e,e.path[0])<.3)e.path.shift();const next=e.path[0];if(!next)return;
 const dx=next.x-e.x,dz=next.z-e.z,l=Math.hypot(dx,dz)||1,speed=e.state==='chase'?(large?1.4:2.8):.8;const old={x:e.x,z:e.z};move(e,dx/l*speed*dt,dz/l*speed*dt,1.5);e.speed=dist(old,e)/(dt||1);e.yaw=Math.atan2(-dx,-dz);
}
