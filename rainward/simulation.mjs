import {HEIGHT,clamp,dist} from './world.mjs';
import {emit,hint,noise} from './state.mjs';
import {move} from './motion.mjs';
import {updatePatrol} from './awareness.mjs';
export function update(s,input,dt){if(s.status!=='playing')return;dt=clamp(dt,0,.05);s.t+=dt;s.stats.seconds=s.t;const p=s.player;
 p.invulnerable=Math.max(0,p.invulnerable-dt);p.shotCD=Math.max(0,p.shotCD-dt);s.hintTime=Math.max(0,s.hintTime-dt);
 if(p.reload>0){p.reload-=dt;if(p.reload<=0){const rounds=Math.min(6-p.mag,p.reserve);p.mag+=rounds;p.reserve-=rounds;p.reload=0;emit(s,'reloaded');}}
 if(p.craft){p.craft.left-=dt;if(p.craft.left<=0){const item=p.craft.item;p[item]++;p.craft=null;emit(s,'crafted',{item});hint(s,item==='medkit'?'Medkit ready (H).':'Smoke cover ready (X).');}}
 if(p.stamina<=5)p.exhausted=true;else if(p.stamina>=25)p.exhausted=false;
 const dx=Number.isFinite(input.x)?input.x:0,dz=Number.isFinite(input.z)?input.z:0,l=Math.hypot(dx,dz),scale=Math.min(1,l),sprint=input.sprint&&p.stance==='stand'&&!p.exhausted&&p.stamina>5&&!input.aim&&!p.craft;
 p.aim=!!input.aim;p.listen=!!input.listen;
 let speed=p.stance==='prone'?.85:p.stance==='crouch'?1.7:3.1;if(sprint)speed=5.3;if(p.aim)speed*=.6;if(p.listen)speed*=.45;if(p.craft)speed=0;
 const old={x:p.x,z:p.z};
 if(p.vault){const v=p.vault;v.t+=dt;const t=clamp(v.t/v.duration,0,1),smooth=t*t*(3-2*t),x=v.start.x+(v.end.x-v.start.x)*smooth,z=v.start.z+(v.end.z-v.start.z)*smooth;move(p,x-p.x,z-p.z,HEIGHT[p.stance],v.ignore);if(t>=1)p.vault=null;}
 else if(p.dodge>0){p.dodge-=dt;move(p,p.dodgeDir.x*6.2*dt,p.dodgeDir.z*6.2*dt,HEIGHT.crouch);}
 else{const a=1-Math.exp(-(l>.01?14:24)*dt),tx=l>.01?dx/l*speed*scale:0,tz=l>.01?dz/l*speed*scale:0;p.vx=(p.vx||0)+(tx-(p.vx||0))*a;p.vz=(p.vz||0)+(tz-(p.vz||0))*a;move(p,p.vx*dt,p.vz*dt,HEIGHT[p.stance]);if(l>.01&&!p.aim)p.yaw=Math.atan2(-dx,-dz);}
 if(p.vault||p.dodge>0){p.vx=0;p.vz=0;}
 p.speed=dist(old,p)/(dt||1);if(input.aim&&Number.isFinite(input.yaw))p.yaw=input.yaw;
 p.stamina=clamp(p.stamina+(sprint&&p.speed>.5?-16:18)*dt,0,100);p.noise=p.speed*(p.stance==='prone'?.3:p.stance==='crouch'?.65:1);
 p.step=(p.step||0)+dt;if(p.step>.6&&p.speed>.2){p.step=0;if(p.noise>1)noise(s,p.x,p.z,p.noise*1.65,'footstep');}
 for(const projectile of s.projectiles){projectile.life-=dt;if(projectile.life<=0&&!projectile.hit){projectile.hit=true;noise(s,projectile.to.x,projectile.to.z,18,'bottle');}}
 s.projectiles=s.projectiles.filter(p=>p.life>0);for(const cloud of s.smokes)cloud.life-=dt;s.smokes=s.smokes.filter(c=>c.life>0);
 for(const e of s.enemies){if(s.status!=='playing')break;updatePatrol(s,e,dt);}for(const sound of s.sounds)sound.life-=dt;s.sounds=s.sounds.filter(s=>s.life>0);
}
