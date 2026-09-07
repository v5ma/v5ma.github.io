import {START,BOUNDS,OBSTACLES,ITEMS,SHELTERS,EXIT,PATROLS,HEIGHT,RAD,clamp,dist,inside,solidAt,rayBox,obstruction,coverAt,findPath} from './world.mjs';
import {forward,emit,hint,noise} from './state.mjs';
export function bottle(s,yaw){const p=s.player;if(s.status!=='playing'||!p.bottles||p.craft)return false;const f=forward(yaw),target={x:clamp(p.x+f.x*11,BOUNDS.x0+1,BOUNDS.x1-1),y:.4,z:clamp(p.z+f.z*11,BOUNDS.z0+1,BOUNDS.z1-1)},a={x:p.x,y:1,z:p.z},hit=obstruction(a,target);
 if(hit){const range=Math.max(.6,hit.t-.6);target.x=p.x+f.x*range;target.z=p.z+f.z*range;}p.bottles--;s.projectiles.push({x:p.x,z:p.z,to:target,life:.65,total:.65});s.stats.bottles++;emit(s,'throw',{x:p.x,z:p.z,to:target});return true;}
export function fire(s,direction){const p=s.player;if(s.status!=='playing'||p.reload||p.shotCD||p.craft)return false;if(!p.mag){hint(s,'Empty. Reload or find ammunition.');return false;}
 const len=Math.hypot(direction.x,direction.y,direction.z);if(!Number.isFinite(len)||len<.001)return false;const d={x:direction.x/len,y:direction.y/len,z:direction.z/len},o={x:p.x,y:HEIGHT[p.stance]*.82,z:p.z};p.mag--;p.shotCD=.38;s.stats.shots++;noise(s,p.x,p.z,26,'shot');let nearest=60,victim=null;
 for(const b of OBSTACLES){const hit=rayBox(o,d,b,nearest);if(hit!==null)nearest=Math.min(nearest,hit);}
 for(const e of s.enemies){if(e.hp<=0)continue;const hit=rayBox(o,d,{x:e.x,z:e.z,w:.68,d:.68,bottom:0,h:1.8},nearest);if(hit!==null&&hit<nearest){nearest=hit;victim=e;}}
 if(victim){victim.hp--;s.stats.hits++;victim.state=victim.hp<=0?'down':'chase';victim.target={x:p.x,z:p.z};victim.awareness=1;victim.repath=0;}
 emit(s,'shot',{from:o,to:{x:o.x+d.x*nearest,y:o.y+d.y*nearest,z:o.z+d.z*nearest},hit:victim?.id||null});return true;
}
export function vaultCandidate(p,dx,dz){
 const length=Math.hypot(dx,dz);if(length<.1){const f=forward(p.yaw);dx=f.x;dz=f.z;}else{dx/=length;dz/=length;}
 const wall=OBSTACLES.find(o=>o.bottom===0&&o.h<=1.15&&inside({x:p.x+dx*.9,z:p.z+dz*.9},o,RAD));if(!wall)return null;
 const span=Math.abs(dx)>Math.abs(dz)?wall.w:wall.d,range=span+1.25,end={x:p.x+dx*range,z:p.z+dz*range};
 if(range>=6||solidAt(end.x,end.z,HEIGHT.stand))return null;
 for(let d=0;d<=range;d+=.08)if(solidAt(p.x+dx*d,p.z+dz*d,HEIGHT.stand,RAD,wall.id))return null;
 return {start:{x:p.x,z:p.z},end,t:0,duration:.62,ignore:wall.id};
}
export function dodgeOrVault(s,dx,dz){const p=s.player;if(s.status!=='playing'||p.dodge>0||p.vault||p.craft||p.stamina<28)return false;
 const v=vaultCandidate(p,dx,dz);if(v){p.vault=v;p.stance='stand';p.stamina-=25;p.vx=p.vz=0;emit(s,'vault',{id:v.ignore});return true;}
 const l=Math.hypot(dx,dz);if(l<.1){const f=forward(p.yaw);dx=f.x;dz=f.z;}else{dx/=l;dz/=l;}
 // A crawlspace cannot turn into a crouched dodge through its ceiling.
 if(solidAt(p.x,p.z,HEIGHT.crouch)){hint(s,'Crawl into clear space before dodging.');return false;}
 p.stamina-=28;p.dodge=.38;p.invulnerable=.26;p.dodgeDir={x:dx,z:dz};p.stance='crouch';p.vx=p.vz=0;emit(s,'dodge');return true;
}
