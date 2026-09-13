/* Original procedural extensions use the retained licensed renderer/materials.
 * Only the occupied upper room is built. Nearby labels/residents are culled. */
import {createStoryArt} from './stories-art.mjs';
import * as T from './vendor/three.module.js';
import {Batch,unit,label} from './art.mjs';
import {person} from './guild-art.mjs';
import {animatePerson,inspectMotion} from './character-motion.mjs';
import {heightAt} from './model.mjs';
import {doorLevel,doorElevation,doorLocation,FLOOR_NAMES,doorSites,inDoorSpace} from './doors-core.mjs';
export function createDoorsArt({scene,root,w,m,camera}){
 const storyArt=createStoryArt({scene,w,m,camera});
 const outdoor=new T.Group();outdoor.name='Open Doors ground-floor life';root.add(outdoor);
 const floorRoot=new T.Group(),roof=new T.Group(),tunnels=new T.Group(),actors=new T.Group(),markers=new T.Group();
 floorRoot.name='Occupied upper floor';roof.name='Connected rooftop boardwalks';tunnels.name='Walkable undercity';actors.name='Humanoid guild rivals';
 scene.add(floorRoot,roof,tunnels,actors,markers);
 const residents=[],stairGroups=[],enemies=new Map(),labels=[];let floorKey='',roomMeshes=null,liveMarkers=[],currentMarkers='',lastLevel=0;
 const wood='#a87949',dark='#694d36',gold='#dfb979',stone='#988b71',paper='#eee0bf';
 for(const h of w.doorHomes){
  const g=new T.Group();g.position.set(h.x,heightAt(h.x,h.z),h.z);outdoor.add(g);
  const b=new Batch(),x=h.upperStair.x-h.x,z=h.upperStair.z-h.z;
  for(let k=0;k<7;k++)b.box(x,.1+k*.16,z+k*.23,1.45,.18,.28,wood);
  for(const side of[-1,1]){b.rod([x+side*.85,.2,z],[x+side*.85,2,z+1.7],.045,gold);b.rod([x+side*.85,1,z],[x+side*.85,2.7,z+1.7],.045,dark);}
  b.finish(g,m.trim,'House staircase with handrails');const t=label(g,'UPPER STAIRS\nG / X NEARBY',x,2.35,z,2.1,.68,0,'#385d5a');labels.push(t);stairGroups.push({h,g});
  const npc=person(m);npc.root.position.set(h.desk.x,heightAt(h.x,h.z),h.desk.z+.9);outdoor.add(npc.root);residents.push({h,npc});
 }
 function deck(group,level){const b=new Batch(),rails=new Batch(),base=level===3?15:-10;
  for(const p of w.doorPaths){
   // Subdivide long corridors to follow the same sloped city surface.
   const horizontal=p.hx>p.hz,n=Math.ceil(Math.max(p.hx,p.hz)*2/8);
   for(let i=0;i<n;i++){
    const x=p.x+(horizontal?(-p.hx+(i+.5)*2*p.hx/n):0),z=p.z+(!horizontal?(-p.hz+(i+.5)*2*p.hz/n):0),sx=horizontal?2*p.hx/n:2*p.hx,sz=horizontal?2*p.hz:2*p.hz/n;
    b.box(x,heightAt(x,z)+base+.02,z,sx,.16,sz,level===3?wood:stone);
    if(!p.roof&&i%2===0){
     if(level===3){for(const side of[-1,1]){const xx=x+(horizontal?0:side*(p.hx-.12)),zz=z+(horizontal?side*(p.hz-.12):0);rails.rod([xx,heightAt(xx,zz)+base+.1,zz],[xx,heightAt(xx,zz)+base+1,zz],.055,dark);}}
     else{for(const side of[-1,1]){const xx=x+(horizontal?0:side*(p.hx-.25)),zz=z+(horizontal?side*(p.hz-.25):0);rails.box(xx,heightAt(xx,zz)+base+.8,zz,.45,1.6,.45,'#756e61');rails.ball(xx,heightAt(xx,zz)+base+1.8,zz,.13,.18,.13,'#e9bd76');}}
    }
   }
  }
  b.finish(group,m.trim,level===3?'Continuous rooftop decks':'Continuous stone passage floors');rails.finish(group,m.trim,'Route edges and lantern posts');
  for(const h of w.doorHomes){const p=level===3?h.upperStair:h.hatch,g=new T.Group();g.position.set(p.x,heightAt(p.x,p.z)+base,p.z);group.add(g);const hatch=new Batch();hatch.box(0,.16,0,1.8,.22,1.8,dark);for(let x=-.7;x<.8;x+=.35)hatch.box(x,.29,0,.08,.04,1.7,gold);hatch.finish(g,m.trim,'Return hatch');const tag=label(g,(level===3?'ATTIC':'CELLAR')+'\n'+h.name,0,1.3,0,2.8,.8,0,'#365754');labels.push(tag);}
 }
 deck(roof,3);deck(tunnels,-2);
 function disposeGroup(g){if(!g)return;g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.userData?.doorsOwnMaterial){o.material.map?.dispose();o.material.dispose();}});g.removeFromParent();}
 function room(h,level){
  const g=new T.Group();g.position.set(h.x,heightAt(h.x,h.z)+(level<0?level*5:level*3.8),h.z);floorRoot.add(g);
  const b=new Batch(),detail=new Batch(),up=h.upperStair,down=h.stairs;
  b.box(0,.1,0,h.hx*2-.4,.2,h.hz*2-.4,level===-1?stone:wood);
  for(let z=-h.hz+.4;z<h.hz;z+=.65)b.box(0,.21,z,h.hx*2-.5,.025,.028,dark);
  for(const sign of[-1,1]){b.box(sign*(h.hx-.3),.6,0,.3,1.2,h.hz*2,level===-1?'#777168':'#dfcda7');b.box(0,.45,sign*(h.hz-.3),h.hx*2,.9,.3,level===-1?'#777168':'#dfcda7');}
  for(const sign of[-1,1]){b.box(sign*(h.hx-1),2.2,-h.hz+.4,.2,4.2,.2,dark);b.rod([sign*(h.hx-1),4.3,-h.hz+.4],[0,5,-h.hz+.4],.12,dark);}
  // Bed and shelves stay outside the central route between both staircases.
  b.box(-h.side*(h.hx-1.6),.5,3,2,.7,2.8,dark);b.box(-h.side*(h.hx-1.6),.95,3,1.9,.25,2.7,'#6e8d89');b.box(-h.side*(h.hx-1.6),1.13,2.1,1.5,.18,.6,paper);
  for(let shelf=0;shelf<3;shelf++){b.box(0,.5+shelf*.65,-h.hz+.6,4,.14,.8,dark);for(let i=0;i<10;i++)detail.box(-1.7+i*.35,.75+shelf*.65,-h.hz+.5,.2,.35,.45,['#b97853','#75958c',gold][i%3]);}
  const workZ=-2;b.box(0,.78,workZ,2.5,.18,1.1,dark);for(const x of[-1,1])b.box(x,.4,workZ,.12,.8,.7,wood);b.box(0,.9,workZ,1,.025,.6,paper);
  const type=h.index%8;
  if(type===1||type===6||type===7){detail.add(unit.ring,0,1.3,workZ,.5,.5,.18,gold);detail.rod([-.6,.92,workZ],[.6,1.8,workZ],.055,gold);}
  else if(type===4||type===5){for(const x of[-.6,.4])detail.add(unit.cyl,x,1.12,workZ,.24,.4,.24,type===4?'#81a477':'#638b99');}
  else if(type===2){for(let x=-.9;x<1;x+=.14)detail.rod([x,.95,workZ-.4],[x,1.7,workZ+.4],.02,paper);}
  else if(type===3){detail.ball(0,1.05,workZ,.35,.15,.45,wood);for(let x=-.1;x<.15;x+=.05)detail.rod([x,1.19,workZ-.6],[x,1.19,workZ+.4],.009,paper);}
  for(const [p,title]of [[up,level===2?'ROOFTOP LADDER':'UPSTAIRS'],[down,'DOWNSTAIRS']]){
   const x=p.x-h.x,z=p.z-h.z;for(let k=0;k<6;k++)b.box(x,.2+k*.15,z+k*.2,1.3,.17,.24,wood);
   for(const side of[-1,1])b.rod([x+side*.8,1,z],[x+side*.8,2,z+1.3],.05,gold);
   if(!(level===-1&&p===up)){const tag=label(g,title+'\nG / X',x,2,z,2,.7,0,'#385d5a');tag.userData.doorsOwnMaterial=true;}
  }
  b.finish(g,m.trim,'Furnished playable '+FLOOR_NAMES[level]);detail.finish(g,m.trim,'Household craft equipment');return g;
 }
 const baseBackground=scene.background,baseFog=scene.fog;
 function update(s,dt){const level=doorLevel(s),loc=doorLocation(s,w),extra=!!s.doors.level,insideExtra=extra&&![3,-2].includes(level),h=w.doorHomes.find(h=>h.id===loc.room);
  outdoor.visible=level===0;roof.visible=level===3;tunnels.visible=level===-2;floorRoot.visible=insideExtra;
  for(const {h,g}of stairGroups)g.visible=Math.hypot(s.x-h.x,s.z-h.z)<45;
  for(const {h,npc}of residents){const near=Math.hypot(s.x-h.x,s.z-h.z);npc.root.visible=level===0&&near<30; if(npc.root.visible){animatePerson(npc,s.time,{motion:near<5?'listen':'work'});npc.root.rotation.y=Math.atan2(s.x-npc.root.position.x,s.z-npc.root.position.z);}}
  const key=insideExtra?h?.id+':'+level:'';
  if(key!==floorKey){disposeGroup(roomMeshes);roomMeshes=key&&h?room(h,level):null;floorKey=key;}
  if(extra){scene.background=new T.Color(level<0?'#383e3c':level===3?'#aecbca':'#a89a7a');scene.fog=new T.Fog(level<0?'#383e3c':level===3?'#b8cebd':'#a89a7a',level<0?28:75,level<0?125:350);}
  else if(lastLevel!==0&&level===0){scene.background=baseBackground;scene.fog=baseFog;}
  for(const e of s.doors.enemies){let model=enemies.get(e.id);if(!model){model=person(m,'bandit');const weapon=new Batch();weapon.rod([0,-.65,.03],[0,1.15,.03],e.role===1?.07:.04,e.role===1?'#b4aba0':dark);weapon.finish(model.handSockets[1],m.trim,e.name+' staff');const tag=label(model.root,e.name,0,2.4,0,2.4,.55,0,'#794f3d');model.tag=tag;actors.add(model.root);enemies.set(e.id,model);}
   model.root.visible=inDoorSpace(s,e,w)&&Math.hypot(s.x-e.x,s.z-e.z)<60;
   if(model.root.visible){model.root.position.set(e.x,heightAt(e.x,e.z)+(e.level===3?15:e.level<0?e.level*5:e.level*3.8)+.18,e.z);model.root.rotation.set(0,e.yaw||0,e.hp===0?.45:0);animatePerson(model,s.time,{motion:e.hp===0?'yield':e.phase==='windup'?'guard':e.phase==='recover'?'strike':e.phase==='stagger'?'dodge':'walk',speed:e.phase==='chase'?3:0,level:e.level,action:e.timer});model.tag.visible=Math.hypot(s.x-e.x,s.z-e.z)<13;model.tag.quaternion.copy(model.root.quaternion.clone().invert().multiply(camera.quaternion));}
  }
  const sites=doorSites(s,w).filter(p=>Math.hypot(s.x-p.x,s.z-p.z)<20),mk=sites.map(p=>p.id).join('|')+':'+level;
  if(mk!==currentMarkers){for(const g of liveMarkers)disposeGroup(g);liveMarkers=[];for(const p of sites){const g=new T.Group();g.position.set(p.x,heightAt(p.x,p.z)+doorElevation(s)+.25,p.z);markers.add(g);const b=new Batch();b.add(unit.ring,0,0,0,.48,.48,.05,p.action==='adventure'?'#7acbca':gold,Math.PI/2);b.finish(g,m.trim,'Interaction circle');const tag=label(g,p.name+'\nG / X NEARBY',0,1.9,0,2.6,.65,0,p.action==='adventure'?'#305e63':'#6e563c');tag.userData.doorsOwnMaterial=true;g.userData.tag=tag;liveMarkers.push(g);}currentMarkers=mk;}
  for(const g of liveMarkers){const tag=g.userData.tag;tag.quaternion.copy(camera.quaternion);tag.visible=Math.hypot(s.x-g.position.x,s.z-g.position.z)<7;}
  for(const tag of labels){tag.visible=Math.hypot(s.x-(tag.parent.position.x+tag.position.x),s.z-(tag.parent.position.z+tag.position.z))<12;tag.quaternion.copy(camera.quaternion);}
  storyArt.update(s);lastLevel=level;
 }
 return {update,inspect:()=>({stories:storyArt.inspect(),houses:w.doorHomes.length,floorsPerHouse:4,roofSegments:w.doorPaths.length,undercitySegments:w.doorPaths.length,enemyModels:enemies.size,jointedRivals:[...enemies.values()].filter(e=>e.root.guildRig?.version===2).length,currentFloor:floorKey,level:lastLevel})};
}
