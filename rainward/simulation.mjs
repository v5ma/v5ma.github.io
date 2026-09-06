import {START,BOUNDS,OBSTACLES,ITEMS,SHELTERS,EXIT,PATROLS,HEIGHT,RAD,clamp,dist,inside,solidAt,rayBox,obstruction,coverAt,findPath} from './world.mjs';
import {forward,emit,hint,noise} from './state.mjs';
import {move,visible} from './motion.mjs';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function patrol(s,e,dt){if(e.hp<=0)return;const p=s.player;const saw=visible(s,e);e.seen=saw;
 if(saw){e.awareness=clamp(e.awareness+dt*(dist(e,p)<4?1.7:.7),0,1);e.target={x:p.x,z:p.z};e.timer=7;if(e.awareness>=1&&e.state!=='chase'){e.state='chase';s.stats.alerts++;emit(s,'alert',{id:e.id});e.repath=0;for(const ally of s.enemies)if(ally!==e&&ally.hp>0&&dist(ally,e)<10){ally.state='search';ally.target={...e.target};ally.timer=5;ally.repath=0;}}}
 else{e.awareness=Math.max(0,e.awareness-dt*.20);e.timer=Math.max(0,e.timer-dt);if(e.state==='chase'&&e.timer<5){e.state='search';e.repath=0;}}
 if(e.state!=='chase')for(const sound of s.sounds){if(sound.id===e.lastNoise)continue;const d=dist(e,sound),occluded=obstruction({x:e.x,y:.5,z:e.z},{x:sound.x,y:.5,z:sound.z});if(d<sound.radius*(occluded?.55:1)){e.lastNoise=sound.id;e.state='investigate';e.target={x:sound.x,z:sound.z};e.timer=5;e.repath=0;emit(s,'investigate',{id:e.id,x:sound.x,z:sound.z});break;}}
 if(e.state!=='patrol'&&e.state!=='chase'&&e.timer<=0){e.state='patrol';e.target=null;e.path=[];e.repath=0;}
 if(e.state==='patrol'&&e.awareness>.2&&saw){e.yaw=Math.atan2(-(p.x-e.x),-(p.z-e.z));return;}
 if(e.state==='chase'&&saw&&dist(e,p)<(e.type==='drifter'?1.55:11)){
  e.yaw=Math.atan2(-(p.x-e.x),-(p.z-e.z));e.attack-=dt;
  if(e.attack<=0){e.attack=e.type==='drifter'?1.1:1.7;emit(s,'enemy-shot',{id:e.id,from:{x:e.x,y:1.35,z:e.z},to:{x:p.x,y:HEIGHT[p.stance]*.8,z:p.z}});if(p.invulnerable<=0){p.hp=Math.max(0,p.hp-17);p.invulnerable=.35;emit(s,'damage');if(!p.hp){s.status='dead';emit(s,'death');}}}return;
 }
 let target=e.state==='patrol'?{x:e.points[e.index][0],z:e.points[e.index][1]}:e.target;
 if(!target)return;
 if(dist(e,target)<.8){if(e.state==='patrol'){e.index=(e.index+1)%e.points.length;e.repath=0;}else{e.yaw+=dt*.8;}return;}
 e.repath-=dt;if(e.repath<=0){e.path=findPath(e,target);e.repath=.9;}
 while(e.path.length&&dist(e,e.path[0])<.25)e.path.shift();const next=e.path[0]||target,dx=next.x-e.x,dz=next.z-e.z,l=Math.hypot(dx,dz),speed=e.state==='chase'?3:e.state==='patrol'?1.05:1.6;
 if(l>.001){move(e,dx/l*speed*dt,dz/l*speed*dt,1.72);const angle=Math.atan2(-dx,-dz);e.yaw+=wrap(angle-e.yaw)*Math.min(1,dt*7);}
}
export function update(s,input,dt){if(s.status!=='playing')return;dt=clamp(dt,0,.05);s.t+=dt;s.stats.seconds=s.t;const p=s.player;
 p.invulnerable=Math.max(0,p.invulnerable-dt);p.shotCD=Math.max(0,p.shotCD-dt);s.hintTime=Math.max(0,s.hintTime-dt);
 if(p.reload>0){p.reload-=dt;if(p.reload<=0){const rounds=Math.min(6-p.mag,p.reserve);p.mag+=rounds;p.reserve-=rounds;p.reload=0;emit(s,'reloaded');}}
 if(p.craft){p.craft.left-=dt;if(p.craft.left<=0){const item=p.craft.item;p[item]++;p.craft=null;emit(s,'crafted',{item});hint(s,item==='medkit'?'Medkit ready (H).':'Smoke cover ready (X).');}}
 const dx=Number.isFinite(input.x)?input.x:0,dz=Number.isFinite(input.z)?input.z:0,l=Math.hypot(dx,dz),scale=Math.min(1,l),sprint=input.sprint&&p.stance==='stand'&&p.stamina>5&&!input.aim;
 p.aim=!!input.aim;p.listen=!!input.listen;
 let speed=p.stance==='prone'?.85:p.stance==='crouch'?1.7:3.1;if(sprint)speed=5.3;if(p.aim)speed*=.6;if(p.listen)speed*=.45;if(p.craft)speed=0;
 const old={x:p.x,z:p.z};
 if(p.vault){const v=p.vault;v.t+=dt;const t=clamp(v.t/v.duration,0,1),smooth=t*t*(3-2*t),x=v.start.x+(v.end.x-v.start.x)*smooth,z=v.start.z+(v.end.z-v.start.z)*smooth;move(p,x-p.x,z-p.z,HEIGHT[p.stance],v.ignore);if(t>=1)p.vault=null;}
 else if(p.dodge>0){p.dodge-=dt;move(p,p.dodgeDir.x*6.2*dt,p.dodgeDir.z*6.2*dt,HEIGHT.crouch);}
 else if(l>.01){move(p,dx/l*speed*scale*dt,dz/l*speed*scale*dt,HEIGHT[p.stance]);if(!p.aim)p.yaw=Math.atan2(-dx,-dz);}
 p.speed=dist(old,p)/(dt||1);if(input.aim&&Number.isFinite(input.yaw))p.yaw=input.yaw;
 p.stamina=clamp(p.stamina+(sprint&&scale>.1?-16:18)*dt,0,100);p.noise=p.speed*(p.stance==='prone'?.3:p.stance==='crouch'?.65:1);
 p.step=(p.step||0)+dt;if(p.step>.6&&p.speed>.2){p.step=0;if(p.noise>1)noise(s,p.x,p.z,p.noise*1.65,'footstep');}
 for(const projectile of s.projectiles){projectile.life-=dt;if(projectile.life<=0&&!projectile.hit){projectile.hit=true;noise(s,projectile.to.x,projectile.to.z,18,'bottle');}}
 s.projectiles=s.projectiles.filter(p=>p.life>0);for(const cloud of s.smokes)cloud.life-=dt;s.smokes=s.smokes.filter(c=>c.life>0);
 for(const e of s.enemies)patrol(s,e,dt);for(const sound of s.sounds)sound.life-=dt;s.sounds=s.sounds.filter(s=>s.life>0);
}
