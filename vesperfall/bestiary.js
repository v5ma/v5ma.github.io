/* Hollow Dominions: original combat archetypes. Shared collision, fixed-step
 * timers, committed aim, bounded effects, and no attacks through masonry. */
(function(root){'use strict';
 const definitions=[
  ['lancer','Grave Lancer','melee','#a5bac9',100,3.8,.85,4.2,'A lowered spear warns of a long thrust. Step sideways after the aim locks.'],
  ['duelist','Thorn Duelist','duelist','#bd5f7c',85,3.1,.6,2.7,'A sidestep precedes two short cuts. Keep your guard until the second cut ends.'],
  ['archer','Penitent Archer','sniper','#d6c7a0',64,20,1.25,4.5,'The raised longbow commits to one fast arrow. Break sight or move after the draw.'],
  ['hexer','Lantern Hexer','fan','#af82d2',76,16,1.2,5.1,'Five violet bolts spread from the lantern. Use stone cover or a directional shield.'],
  ['alchemist','Cinder Alchemist','bomb','#e68c55',80,14,1.1,5.2,'An amber ground circle marks a delayed explosion. Leave the circle before it flashes.'],
  ['abbess','Frost Abbess','frost','#8bdee2',92,17,1.15,4.6,'Twin icy bolts briefly slow your movement. A block prevents the chill.'],
  ['leech','Choir Leech','heal','#8bbd91',72,15,1.4,5.5,'Green light restores a wounded ally. Interrupt the channel with Frost or focus the healer.'],
  ['gaoler','Chain Gaoler','chain','#b2a497',115,12,1.05,4.5,'A heavy chain bolt briefly hinders movement. The shield can stop the tether.'],
  ['mirror','Mirror Acolyte','mirror','#d7c4ef',94,15,1.0,4.8,'A frontal mirror turns body shots aside. Its guard drops while it casts and recovers.'],
  ['gargoyle','Ash Gargoyle','swoop','#89928e',105,8,1.05,4.2,'Spread wings announce a committed rushing swoop. Dodge across its path.'],
  ['colossus','Reliquary Colossus','quake','#b5a077',185,6,1.5,6,'A raised reliquary warns of a circular ground blast. Retreat beyond the amber ring.'],
  ['widow','Rift Widow','blink','#a37bcb',88,16,1.0,5,'The veil fades before a short reposition and crossed bolts. Watch the new silhouette.']
 ];
 const kinds=definitions.map(d=>d[0]),catalog=Object.fromEntries(definitions.map(([id,name,attack,color,hp,range,wind,cooldown,hint])=>[id,Object.freeze({id,name,attack,color,hp,range,wind,cooldown,hint})]));
 function make(kind,id,room={id:1,x:0,z:-1.8},depth=1){const d=catalog[kind]||catalog.lancer,hp=d.hp+Math.max(0,depth-1)*7;return {id,room:room.id,p:[room.x,1.05,room.z],hp,maxHp:hp,kind:d.id,speed:d.attack==='duelist'?1.7:d.attack==='quake'?.65:1.05,cd:2.2+(id%4)*.3,wind:0,recovery:0,frozen:0,slow:0,dead:false,aware:false,required:false,bodyRadius:kind==='colossus'?.78:.48,headRadius:kind==='colossus'?.34:.25};}
 const guardActive=e=>e.kind==='mirror'&&!e.dead&&!(e.frozen>0)&&!(e.wind>0)&&!(e.recovery>0);
 function update(s,e,dt,a){
  const d=catalog[e.kind];if(!d||e.dead)return;
  const {add,sub,mul,len,unit,walkable,floorAt,segmentBlocked,emit,shieldHit,block,hurt,route,roomAt}=a;
  e.slow=Math.max(0,(e.slow||0)-dt);e.frozen=Math.max(0,(e.frozen||0)-dt);e.recovery=Math.max(0,(e.recovery||0)-dt);
  if(e.frozen>0){e.wind=0;e.charge=null;e.combo=0;e.phase='frozen';return;}
  const origin=()=>add(e.p,[0,.45,0]);
  const delta=sub(s.head,origin()),distance=len(delta),visible=distance<d.range+6&&!segmentBlocked(s.world,origin(),s.head);
  if(visible)e.aware=true;if(!e.aware){e.phase='dormant';return;}
  function advance(dir,amount){const n=Math.max(1,Math.ceil(amount/.09));for(let j=0;j<n;j++){const p=[e.p[0]+dir[0]*amount/n,e.p[1]-1.05,e.p[2]+dir[2]*amount/n];if(!walkable(s.world,p,.42))return false;const y=floorAt(s.world,p);if(y===null)return false;e.p=[p[0],y+1.05,p[2]];}return true;}
  function strike(reach,damage){const o=origin();if(len(sub(s.head,o))>reach||segmentBlocked(s.world,o,s.head))return;const hit=shieldHit(s,o,s.head);if(hit)block(s,hit.p);else hurt(s,damage);}
  function bolts(angles,speed,slow=0){const o=origin(),u=unit(sub(e.aim,o));for(const angle of angles){if(s.bolts.length>=24)break;const c=Math.cos(angle),sn=Math.sin(angle);s.bolts.push({p:[...o],v:mul([u[0]*c-u[2]*sn,u[1],u[0]*sn+u[2]*c],speed),life:5,kind:e.kind,slow,damage:e.kind==='archer'?18:12});}emit(s,'enemy-shot',{id:e.id,kind:e.kind});}
  if(e.charge){e.phase='charging';const c=e.charge,step=Math.min(c.left,c.speed*dt*(e.slow>0?.4:1));if(!advance(c.dir,step))c.left=0;else c.left-=step;if(Math.hypot(e.p[0]-s.head[0],e.p[2]-s.head[2])<1.05){strike(1.8,19);c.left=0;}if(c.left<=.01){e.charge=null;e.recovery=1.4;}return;}
  if(e.combo>0){e.phase='striking';e.comboTime-=dt;if(e.comboTime<=0){strike(2.6,13);e.combo--;e.comboTime=.9;if(!e.combo)e.recovery=1.1;}return;}
  e.facing=unit([delta[0],0,delta[2]]);e.cd-=dt;
  if(e.recovery>0){e.phase='recovering';return;}
  if(e.wind>0){e.phase='winding';e.wind-=dt;if(e.wind>0)return;
   if(d.attack==='melee'||d.attack==='swoop'){e.charge={dir:unit([e.aim[0]-e.p[0],0,e.aim[2]-e.p[2]]),left:Math.min(d.range,Math.hypot(e.aim[0]-e.p[0],e.aim[2]-e.p[2])),speed:d.attack==='swoop'?8.4:5.5};}
   else if(d.attack==='duelist'){strike(2.6,13);e.combo=1;e.comboTime=.9;}
   else if(d.attack==='bomb'||d.attack==='quake'){
    if((s.hazards||=[]).length<12){const p=d.attack==='quake'?[e.p[0],e.p[1]-1.05,e.p[2]]:[e.aim[0],e.aim[1]-1.65,e.aim[2]];s.hazards.push({p,radius:d.attack==='quake'?4.6:2.3,life:.9,kind:e.kind,owner:e.id});}
    e.recovery=1.4;
   }else if(d.attack==='heal'){
    const ally=s.world.enemies.filter(x=>x!==e&&!x.dead&&x.hp<x.maxHp&&len(sub(x.p,e.p))<16&&!segmentBlocked(s.world,origin(),x.p)).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
    if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+22);s.sparks.push({p:[...ally.p],life:.6,type:'frost'});emit(s,'enemy-heal',{id:e.id,target:ally.id});}else bolts([0],5);e.recovery=1;
   }else{
    if(d.attack==='blink'){const dir=unit([delta[2],0,-delta[0]]),sign=e.id%2?1:-1;advance(mul(dir,sign),2.2);s.sparks.push({p:[...e.p],life:.5,type:'frost'});}
    const angles=d.attack==='fan'?[-.24,-.12,0,.12,.24]:d.attack==='frost'?[-.055,.055]:d.attack==='blink'?[-.13,.13]:d.attack==='mirror'?[-.09,0,.09]:[0];
    bolts(angles,d.attack==='sniper'?14:d.attack==='chain'?9:6,d.attack==='frost'?2.4:d.attack==='chain'?1.8:0);e.recovery=d.attack==='mirror'?2:1;
   }return;
  }
  if(visible&&distance<d.range&&e.cd<=0){e.wind=d.wind;e.windTotal=d.wind;e.aim=[...s.head];e.cd=d.cooldown;e.phase='winding';if(d.attack==='duelist'){const u=unit([delta[2],0,-delta[0]]);advance(u,.65);}emit(s,'enemy-windup',{id:e.id,kind:e.kind,p:[...e.p],aim:[...e.aim]});return;}
  e.phase=guardActive(e)?'guarding':'hunting';
  const stop=['sniper','fan','frost','bomb','heal','chain','mirror','blink'].includes(d.attack)?8:2;
  if(distance>stop||!visible){const er=roomAt(s.world,e.p),pr=roomAt(s.world,s.p),path=route(s.world,er,pr),goal=path.length>1?s.world.rooms[path[1]]:{x:s.p[0],z:s.p[2]};advance(unit([goal.x-e.p[0],0,goal.z-e.p[2]]),e.speed*dt*(e.slow>0?.35:1));}
 }
 function hazards(s,dt,a){if(!s.hazards)return;for(const h of s.hazards){h.life-=dt;if(h.life>0)continue;const origin=a.add(h.p,[0,.4,0]);if(Math.hypot(s.p[0]-h.p[0],s.p[2]-h.p[2])<h.radius&&Math.abs(s.p[1]-h.p[1])<1.4&&!a.segmentBlocked(s.world,origin,s.head)){const guard=a.shieldHit(s,origin,s.head);if(guard)a.block(s,guard.p);else a.hurt(s,h.kind==='colossus'?24:18);}s.sparks.push({p:origin,life:.6,type:'blast'});a.emit(s,'ground-blast',{p:h.p,kind:h.kind});}s.hazards=s.hazards.filter(h=>h.life>0);}
 const api=Object.freeze({catalog,kinds,make,guardActive,update,hazards});root.VesperBestiary=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
