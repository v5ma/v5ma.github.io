/* Deterministic enemy decisions. Timers use simulation seconds; no DOM, RNG,
 * hidden player teleport, or damage that bypasses the shared collision tests. */
(function(root){'use strict';
 const names={cantor:'Ash Cantor',stalker:'Rift Hound',warden:'Bell Sentinel'};
 const guardActive=e=>e.kind==='warden'&&!e.dead&&!(e.frozen>0)&&!(e.recovery>0)&&!(e.wind>0);
 function training(kind){kind=names[kind]?kind:'cantor';return {id:0,room:1,p:[0,1.05,-1.8],hp:kind==='warden'?118:70,maxHp:kind==='warden'?118:70,kind,speed:kind==='stalker'?.95:kind==='warden'?.65:.4,cd:1.8,wind:0,slow:0,frozen:0,recovery:0,dead:false,aware:true};}
 function update(s,e,dt,a){
  const {add,sub,mul,unit,len,walkable,route,roomAt,segmentBlocked,emit,shieldHit,block,hurt}=a;
  if(e.dead)return;
  e.slow=Math.max(0,(e.slow||0)-dt);e.frozen=Math.max(0,(e.frozen||0)-dt);e.recovery=Math.max(0,(e.recovery||0)-dt);
  if(e.frozen>0){e.wind=0;e.charge=null;e.phase='frozen';return;}
  const delta=sub(s.head,e.p),distance=len(delta),visible=distance<17&&!segmentBlocked(s.world,add(e.p,[0,.5,0]),s.head);
  if(visible)e.aware=true;if(!e.aware){e.phase='dormant';return;}
  // The charge follows its announced line, never retargets halfway through it.
  if(e.charge){
   e.phase='charging';const c=e.charge,travel=Math.min(c.left,6.4*dt*(e.slow>0?.35:1)),n=Math.max(1,Math.ceil(travel/.10));
   for(let i=0;i<n;i++){
    const next=add(e.p,mul(c.dir,travel/n));
    if(!walkable(s.world,[next[0],0,next[2]],.4)){c.left=0;break;}
    e.p=next;c.left-=travel/n;
    if(Math.hypot(e.p[0]-s.head[0],e.p[2]-s.head[2])<.88&&Math.abs(e.p[1]-s.head[1])<1.25){const hit=shieldHit(s,add(e.p,[0,.45,0]),s.head);if(hit)block(s,hit.p);else hurt(s,17);c.left=0;break;}
   }
   if(c.left<=.01){e.charge=null;e.recovery=1.15;e.phase='recovering';emit(s,'enemy-recover',{id:e.id,kind:e.kind});}return;
  }
  const desired=unit([delta[0],0,delta[2]]);
  // Armor has weight: a flanking player is not instantly faced on the next tick.
  if(e.kind==='warden'&&e.facing){const from=Math.atan2(e.facing[0],e.facing[2]),to=Math.atan2(desired[0],desired[2]),angle=Math.atan2(Math.sin(to-from),Math.cos(to-from)),turn=Math.max(-1.8*dt,Math.min(1.8*dt,angle));e.facing=[Math.sin(from+turn),0,Math.cos(from+turn)];}else e.facing=desired;
  e.cd-=dt;
  if(e.recovery>0){e.phase='recovering';return;}
  if(e.wind>0){
   e.phase='winding';e.wind-=dt;
   if(e.wind<=0){
    if(e.kind==='stalker'){
     const dir=unit([e.aim[0]-e.p[0],0,e.aim[2]-e.p[2]]);e.facing=dir;e.charge={dir,left:Math.min(6.5,Math.hypot(e.aim[0]-e.p[0],e.aim[2]-e.p[2])+.5)};emit(s,'enemy-charge',{id:e.id,kind:e.kind});
    }else{
     // Fire at the committed aim even after a dodge. Stone still stops every bolt.
     const origin=add(e.p,[0,.45,0]),dir=unit(sub(e.aim,origin)),spread=e.kind==='cantor'?.14:.10;
     for(const angle of[0,-spread,spread]){if(s.bolts.length>=24)break;const c=Math.cos(angle),sn=Math.sin(angle);s.bolts.push({p:[...origin],v:mul([dir[0]*c-dir[2]*sn,dir[1],dir[0]*sn+dir[2]*c],e.kind==='warden'?5.5:4.5),life:6,kind:e.kind});}
     e.recovery=e.kind==='warden'?1.4:.75;emit(s,'enemy-shot',{id:e.id,kind:e.kind});
    }
   }return;
  }
  const attackRange=e.kind==='stalker'?6.5:17;
  if(visible&&distance<attackRange&&e.cd<=0){e.wind=e.kind==='stalker'?.9:1.0;e.windTotal=e.wind;e.aim=[...s.head];e.cd=e.kind==='warden'?3.5:e.kind==='stalker'?3.8:4.2;e.phase='winding';emit(s,'enemy-windup',{id:e.id,kind:e.kind,p:[...e.p],aim:[...e.aim]});return;}
  e.phase=guardActive(e)?'guarding':'hunting';
  const stop=e.kind==='cantor'&&visible?8:2.2;
  if(distance>stop){const er=roomAt(s.world,e.p),pr=roomAt(s.world,s.p),path=route(s.world,er,pr),goal=path.length>1?s.world.rooms[path[1]]:{x:s.p[0],z:s.p[2]},dx=goal.x-e.p[0],dz=goal.z-e.p[2],d=Math.hypot(dx,dz)||1,v=e.speed*(e.slow>0?.3:1)*dt;
   const p=[e.p[0]+dx/d*v,0,e.p[2]+dz/d*v];if(walkable(s.world,p,.4)){e.p[0]=p[0];e.p[2]=p[2];}
  }
 }
 root.VesperEncounters=Object.freeze({names,guardActive,training,update});if(typeof module!=='undefined')module.exports=root.VesperEncounters;
})(globalThis);
