/* Rainward browser game: fictional NPC state machine. Targets come only from
 * simulated sight/sound/ally reports; no external input or real-world control. */
import {clamp,dist,findPath,solidAt,obstruction} from './world.mjs';
import {emit} from './state.mjs';
import {move,visible} from './motion.mjs';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const copy=p=>({x:p.x,z:p.z});
export function say(s,e,text){e.callout=text;e.calloutUntil=s.t+2.8;emit(s,'callout',{id:e.id,x:e.x,z:e.z,text});}
function investigate(s,e,point,kind){
 e.target=copy(point);e.lastKnown=copy(point);e.state=kind==='sight'?'search':'investigate';e.timer=kind==='sight'?11:8;e.repath=0;e.path=[];e.searchIndex=0;e.sweep=null;e.scan=0;e.aimTime=0;
 say(s,e,kind==='sight'?'Lost sight. Check the cover.':'Something moved over there.');
}
function searchPoints(e){const origin=e.lastKnown||e.target;const points=[copy(origin)];
 const offset=Number(e.id.replace(/\D/g,''))||0;
 for(let i=0;i<5;i++){const a=(i+offset)*2.399,r=i<2?2.3:4.2,p={x:origin.x+Math.sin(a)*r,z:origin.z+Math.cos(a)*r};if(!solidAt(p.x,p.z,1.72,.6)&&findPath(origin,p).length)points.push(p);}
 return points;
}
export function updatePatrol(s,e,dt){
 if(e.hp<=0){e.seen=false;e.aimTime=0;return;}
 const p=s.player,wasSeen=e.seen,saw=visible(s,e);e.seen=saw;e.aimTime=e.aimTime||0;e.speed=0;
 if(saw){
  e.awareness=clamp(e.awareness+dt*(dist(e,p)<4?1.7:.7),0,1);e.lastKnown=copy(p);e.target=copy(p);e.timer=11;
  if(e.awareness>=1&&e.state!=='chase'){
   const alreadyAlert=e.alerted;e.state='chase';e.alerted=true;e.repath=0;e.path=[];e.attack=0;e.aimTime=0;
   if(!alreadyAlert){s.stats.alerts++;emit(s,'alert',{id:e.id});say(s,e,'Contact!');
    for(const ally of s.enemies)if(ally!==e&&ally.hp>0&&ally.state!=='chase'&&dist(ally,e)<10){investigate(s,ally,e.lastKnown,'report');ally.state='search';ally.alerted=true;}}
  }
 }else{
  e.awareness=Math.max(0,e.awareness-dt*.2);e.timer=Math.max(0,e.timer-dt);e.aimTime=0;
  if(e.state==='chase')investigate(s,e,e.lastKnown||e.target||e,'sight');
 }
 let heard=null,best=-Infinity,seenID=e.lastNoise||0;
 if(e.state!=='chase')for(const n of s.sounds){if(n.id<=seenID)continue;const d=dist(e,n),occluded=obstruction({x:e.x,y:.5,z:e.z},{x:n.x,y:.5,z:n.z}),radius=n.radius*(occluded?.55:1);if(d>=radius)continue;const score=(n.type==='bottle'||n.type==='shot'?2:0)+1-d/radius;if(score>best){heard=n;best=score;}}
 for(const n of s.sounds)e.lastNoise=Math.max(e.lastNoise||0,n.id);
 if(heard&&!saw){investigate(s,e,heard,'sound');emit(s,'investigate',{id:e.id,x:heard.x,z:heard.z});}
 if(!saw&&e.state!=='patrol'&&e.timer<=0){e.state='patrol';e.target=null;e.lastKnown=null;e.path=[];e.sweep=null;e.repath=0;e.alerted=false;e.awareness=0;s.stats.escapes=(s.stats.escapes||0)+1;say(s,e,'All clear. Returning to patrol.');}
 if(e.state==='patrol'&&e.awareness>.2&&saw){e.yaw=Math.atan2(-(p.x-e.x),-(p.z-e.z));if(!wasSeen)say(s,e,'Did I see something?');return;}
 if(e.state==='chase'&&saw&&dist(e,p)<(e.type==='drifter'?1.55:11)){
  e.yaw=Math.atan2(-(p.x-e.x),-(p.z-e.z));e.aimTime+=dt;e.attack=Math.max(0,e.attack-dt);
  const windup=e.type==='drifter'?.55:.85;
  if(e.aimTime>=windup&&e.attack<=0){e.attack=e.type==='drifter'?1.1:1.7;e.aimTime=0;
   emit(s,'enemy-shot',{id:e.id,from:{x:e.x,y:1.35,z:e.z},to:{x:p.x,y:p.stance==='prone'?.32:p.stance==='crouch'?.8:1.38,z:p.z}});
   if(p.invulnerable<=0){p.hp=Math.max(0,p.hp-17);p.invulnerable=.35;emit(s,'damage');if(!p.hp){s.status='dead';emit(s,'death');}}
  }return;
 }
 if(e.state!=='chase')e.aimTime=0;
 let target=e.state==='patrol'?{x:e.points[e.index][0],z:e.points[e.index][1]}:e.target;if(!target)return;
 if(dist(e,target)<.8){
  if(e.state==='patrol'){e.index=(e.index+1)%e.points.length;e.repath=0;}
  else if(!saw){if(!e.sweep)e.sweep=searchPoints(e);e.scan=(e.scan||0)+dt;e.yaw+=dt*.9;
   if(e.scan>1.1){e.scan=0;e.searchIndex=((e.searchIndex||0)+1)%e.sweep.length;e.target=copy(e.sweep[e.searchIndex]);e.repath=0;}}
  return;
 }
 e.repath-=dt;if(e.repath<=0){e.path=findPath(e,target);e.repath=.9;}
 while(e.path.length&&dist(e,e.path[0])<.25)e.path.shift();const next=e.path[0];if(!next){e.yaw+=dt*.6;return;}
 const dx=next.x-e.x,dz=next.z-e.z,l=Math.hypot(dx,dz),speed=e.state==='chase'?3:e.state==='patrol'?1.05:1.6;
 if(l>.001){const old=copy(e);move(e,dx/l*speed*dt,dz/l*speed*dt,1.72);e.speed=dist(old,e)/(dt||1);e.yaw+=wrap(Math.atan2(-dx,-dz)-e.yaw)*Math.min(1,dt*7);}
}
