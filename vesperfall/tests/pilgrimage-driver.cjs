/* Deterministic live-combat driver, not a browser or physical-player study.
 * Uses actual movement, simulation, shooting and interaction. No actor-state
 * assignments, healing, enemy removal or fabricated objective progression. */
'use strict';
const C=require('../core.js'),P=require('../pilgrimage-model.js'),S=require('../pilgrim-save.js');
const DT=1/90;
function walk(s,x,z){let frames=0,distance=0,stalled=0;
 while(Math.hypot(x-s.p[0],z-s.p[2])>.03&&frames++<5000&&s.phase==='playing'){
  const old=[...s.p],d=Math.hypot(x-old[0],z-old[2]),v=Math.min(3.6*DT,d);
  C.move(s,(x-old[0])/d*v,(z-old[2])/d*v);C.step(s,DT,C.add(s.p,[0,1.65,0]));
  const moved=C.len(C.sub(s.p,old));distance+=moved;stalled=moved<1e-7?stalled+1:0;
  if(stalled>12)throw Error('Blocked at '+JSON.stringify(s.p)+' toward '+[x,z]);
 }
 if(frames>=5000||s.phase!=='playing')throw Error('Route failed: '+s.phase+' at '+s.p);
 return distance;
}
const path=(s,ps)=>ps.reduce((n,p)=>n+walk(s,p[0],p[2]),0);
function aim(from,to,charge=1,type='plain',high=false){const d=C.sub(to,from),h=Math.hypot(d[0],d[2]),v=type==='blink'?7+charge*10:12+24*charge,disc=v**4-9.8*(9.8*h*h+2*d[1]*v*v);if(disc<0||h<.001)throw Error('No ballistic arc');const pitch=Math.atan((v*v+(high?1:-1)*Math.sqrt(disc))/(9.8*h)),u=C.unit([d[0],0,d[2]]);return [u[0]*Math.cos(pitch),Math.sin(pitch),u[2]*Math.cos(pitch)];}
function shoot(s,p,type='plain',charge=1){if(!C.fire(s,s.head,aim(s.head,p,charge,type),charge,type))throw Error('Shot rejected');let i=0;while(s.arrows.length&&s.phase==='playing'&&i++<600)C.step(s,DT,C.add(s.p,[0,1.65,0]));}
function resume(s){const meta={id:'pilgrimage-model-run',banked:0,receipt:{},yaw:0,pitch:0,focus:1};const cp=S.capture(s,meta);const d=S.decode(S.encode({},cp));if(!d.ok)throw Error('Save rejected: '+d.error);return d.restored.game;}
function chapter(seed,stage=0,kind='gallery',reload=true,tier=0){let s=C.create(seed,stage+1,{pilgrimage:{stage,tier}}),distance=0;const places=[];
 for(const m of s.world.pipeline.modules){
  if(m.slot)distance+=path(s,s.world.pipeline.connector);
  else distance+=path(s,[m.front]);
  if(kind==='gallery'){
   distance+=path(s,m.paths.gallery.slice(1,3));distance+=walk(s,m.winch[0],m.winch[2]);
   if(!C.interact(s)||!s.pilgrimage.shutters[m.slot])throw Error('Winch not usable');
   if(!C.interact(s)||s.pilgrimage.shutters[m.slot])throw Error('Winch not reversible');
   distance+=path(s,m.paths.gallery.slice(3,5));if(!C.interact(s)||!s.targets.has(m.target))throw Error('Lens not usable');
   distance+=path(s,m.paths.gallery.slice(5,7));distance+=walk(s,m.latch[0],m.latch[2]);
   if(!C.interact(s)||!s.pilgrimage.gates[m.slot])throw Error('Latch not usable');
   distance+=walk(s,m.latch[0],m.z+9.5);if(reload)s=resume(s);
   distance+=path(s,[[m.latch[0],0,m.z+12],m.front,...m.paths.bypass.slice(1)]);
  }else{
   distance+=walk(s,m.x,m.z+3);shoot(s,m.release);if(!s.pilgrimage.shutters[m.slot])throw Error('Release shot missed');
   // The target is on a balcony: this is a real ballistic line, not an
   // objective awarded for standing on an invisible preferred-route trigger.
   for(let tries=0;tries<3&&!s.targets.has(m.target);tries++)shoot(s,m.targetPoint);
   if(!s.targets.has(m.target))throw Error('Lens remains obscured');
   if(reload)s=resume(s);
   distance+=path(s,m.paths.direct.slice(2));
  }
  places.push({module:m.kind,signal:s.targets.has(m.target),health:s.health,shots:s.shots,gates:[...s.pilgrimage.gates]});
 }
 const exit=s.world.pipeline.controls.find(c=>c.kind==='exit');distance+=walk(s,exit.p[0],exit.p[2]);if(!C.interact(s)||s.phase!=='reward')throw Error('Exit refused');
 const out={chapter:s.world.pipeline.name,seed,kind,distanceMetres:distance,simulationSeconds:s.time,health:s.health,damageTaken:s.damageTaken,shots:s.shots,kills:s.kills,phase:s.phase,places};
 return {s,out};
}
module.exports={C,P,S,DT,walk,path,aim,shoot,resume,chapter};
if(require.main===module){const results=[];for(const stage of[0,1])for(const kind of['gallery','direct'])results.push(chapter('BELL-01',stage,kind).out);console.log(JSON.stringify(results,null,2));}
