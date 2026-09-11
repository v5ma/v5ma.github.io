// Extra world spectacle layered over Ranger Operations. Effects are visual/audio only: no health or damage forces.
import * as T from './vendor/three.module.js';
import {buildFrontier as buildBase} from './frontier-world.js?base=ops1';
import {OUTPOSTS} from './frontier-data-expanded.js?v=spectacle1';
import {makeBuggy} from './frontier-art.js?v=ops1';
import {makeJeep} from './ranger-art.js';

const SONIC_GATES=[
 {x:0,z:98,color:0x7adfff,name:'Visitor Sonic Gate'},
 {x:-172,z:44,color:0x9ff59a,name:'Redwood Resonance Gate'},
 {x:72,z:-204,color:0xc8a9ff,name:'Northstar Sonic Gate'},
 {x:205,z:86,color:0xffca79,name:'Coastal Sonic Gate'}
];
const GRAVITY_NODES=[
 {x:42,z:-52,color:0x8fdcff,name:'Gravity Ripple Alpha'},
 {x:-118,z:-112,color:0xb7a2ff,name:'Gravity Ripple Beta'},
 {x:154,z:-92,color:0xff9fd5,name:'Gravity Ripple Gamma'}
];
const RIVAL_DEFS=[
 {name:'Meridian Rangers',color:0x67d8ff,phase:.04,speed:.018,model:'buggy',points:[[-150,42],[-105,38],[-56,70],[-20,103],[45,114],[100,157],[155,150],[205,100]]},
 {name:'FossilWorks Operations',color:0xffb56f,phase:.37,speed:.014,model:'jeep',points:[[205,-138],[174,-86],[137,-32],[89,-38],[37,-24],[-5,-82],[-70,-108],[-89,-76]]},
 {name:'Greenline Logistics',color:0x8ff59c,phase:.71,speed:.016,model:'buggy',points:[[-55,-214],[-4,-206],[49,-216],[105,-203],[151,-170],[195,-145],[217,-89],[224,-24],[208,37]]}
];

function event(type,detail={}){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('dino-spectacle',{detail:{type,...detail}}));}
function mesh(scene,geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);scene.add(m);return m;}

export function buildFrontier(scene,physics,state){
 const base=buildBase(scene,physics,state);
 const beacons=[],gateVisuals=[],gravityVisuals=[],rivals=[],pulses=[];
 const pulseGeo=new T.RingGeometry(.86,1,64),orbGeo=new T.IcosahedronGeometry(.22,1);

 for(const o of OUTPOSTS){
  const pole=mesh(scene,new T.CylinderGeometry(.055,.085,5,8),new T.MeshBasicMaterial({color:o.color}),o.x,4.5,o.z);
  const lamp=new T.PointLight(o.color,22,32,2);lamp.position.set(o.x,7.1,o.z);scene.add(lamp);
  const orb=mesh(scene,orbGeo,new T.MeshBasicMaterial({color:o.color}),o.x,7.05,o.z);
  beacons.push({lamp,orb,pole,phase:beacons.length*.73});
 }

 for(const [i,g] of SONIC_GATES.entries()){
  const group=new T.Group();group.position.set(g.x,0,g.z);scene.add(group);
  const mat=new T.MeshStandardMaterial({color:0x334c4b,metalness:.65,roughness:.3,emissive:g.color,emissiveIntensity:.24});
  for(const x of [-4.8,4.8]){const p=new T.Mesh(new T.BoxGeometry(.45,7.5,.45),mat);p.position.set(x,3.75,0);group.add(p);const l=new T.PointLight(g.color,26,22,2);l.position.set(x,5.5,0);group.add(l);}
  const ring=new T.Mesh(new T.TorusGeometry(4.75,.09,8,72),new T.MeshBasicMaterial({color:g.color,transparent:true,opacity:.75}));ring.position.y=4.2;group.add(ring);
  const floor=new T.Mesh(new T.RingGeometry(3.7,4.1,64),new T.MeshBasicMaterial({color:g.color,transparent:true,opacity:.24,side:T.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=.12;group.add(floor);
  gateVisuals.push({def:g,group,ring,floor,cool:0,phase:i*1.2});
 }

 for(const [i,g] of GRAVITY_NODES.entries()){
  const group=new T.Group();group.position.set(g.x,.1,g.z);scene.add(group);
  const core=new T.Mesh(new T.IcosahedronGeometry(.8,2),new T.MeshStandardMaterial({color:0x172b34,metalness:.8,roughness:.16,emissive:g.color,emissiveIntensity:.85}));core.position.y=1.25;group.add(core);
  const rings=[];for(let r=0;r<3;r++){const ring=new T.Mesh(new T.TorusGeometry(1.8+r*.72,.055,8,64),new T.MeshBasicMaterial({color:g.color,transparent:true,opacity:.55-r*.08}));ring.position.y=1.25;ring.rotation.set(r*.8,(r+1)*.7,r*.33);group.add(ring);rings.push(ring);}
  const light=new T.PointLight(g.color,24,28,2);light.position.y=2.4;group.add(light);
  gravityVisuals.push({def:g,group,core,rings,light,cool:3+i*2,phase:i*.9});
 }

 for(const [i,r] of RIVAL_DEFS.entries()){
  const model=r.model==='jeep'?makeJeep():makeBuggy();scene.add(model);
  model.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();if(o.material.color)o.material.color.lerp(new T.Color(r.color),.18);}});
  const lamp=new T.PointLight(r.color,18,18,2);lamp.position.set(0,2.4,0);model.add(lamp);
  const halo=new T.Mesh(new T.TorusGeometry(1.6,.04,6,32),new T.MeshBasicMaterial({color:r.color,transparent:true,opacity:.52}));halo.rotation.x=Math.PI/2;halo.position.y=.18;model.add(halo);
  const curve=new T.CatmullRomCurve3(r.points.map(([x,z])=>new T.Vector3(x,.55,z)),true,'catmullrom',.28);
  rivals.push({...r,model,curve,lamp,halo,near:false,index:i});
 }

 for(let i=0;i<18;i++){
  const ring=new T.Mesh(pulseGeo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));
  ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);pulses.push({ring,age:10,life:1,color:0xffffff,height:.18});
 }
 let pulseCursor=0,last={x:0,z:0,ready:false},burstCount=0,rivalNotice=0;
 function spawnPulse(p,color=0x8fdcff,life=1.15,height=.2,delay=0){
  const slot=pulses[pulseCursor++%pulses.length];slot.age=-delay;slot.life=life;slot.color=color;slot.height=height;slot.ring.material.color.setHex(color);slot.ring.position.set(p.x,height,p.z);slot.ring.scale.setScalar(.35);slot.ring.material.opacity=0;slot.ring.visible=true;return slot;
 }
 function burst(p,type='celebration',color=0xffc66f){
  burstCount++;for(let i=0;i<4;i++)spawnPulse(p,color,1.05+i*.14,.16+i*.06,i*.055);
  const light=new T.PointLight(color,120,38,2);light.position.set(p.x,2.4,p.z);scene.add(light);setTimeout(()=>scene.remove(light),380);
  event(type,{x:p.x,z:p.z,count:burstCount});
 }
 function sonic(g){for(let i=0;i<5;i++)spawnPulse(g.def,g.def.color,1.25+i*.12,.18+i*.03,i*.045);event('sonic',{name:g.def.name,x:g.def.x,z:g.def.z});burstCount++;}
 function gravity(g){for(let i=0;i<6;i++)spawnPulse(g.def,g.def.color,1.65+i*.16,.14+i*.09,i*.07);event('gravity',{name:g.def.name,x:g.def.x,z:g.def.z});burstCount++;}
 if(typeof window!=='undefined')window.__dinoSpectacle={get bursts(){return burstCount;},rivals:RIVAL_DEFS.map(r=>r.name),sonicGates:SONIC_GATES.length,gravityNodes:GRAVITY_NODES.length};

 return {...base,
  detonate(c){const p=base.detonate(c);if(p)burst(p,'celebration',0xffc86f);return p;},
  update(dt,time,player,reduced){
   base.update(dt,time,player,reduced);const safeDt=Math.max(dt,1/120);let speed=0;if(last.ready)speed=Math.hypot(player.x-last.x,player.z-last.z)/safeDt;last={x:player.x,z:player.z,ready:true};
   for(const [i,b] of beacons.entries()){const q=.7+.3*Math.sin(time*2.1+b.phase);b.lamp.intensity=18+q*16;b.orb.scale.setScalar(.85+q*.45);}
   for(const g of gateVisuals){g.cool=Math.max(0,g.cool-dt);g.ring.rotation.z=time*.35+g.phase;g.floor.material.opacity=.15+(reduced?0:Math.sin(time*3+g.phase)*.08)+Math.min(speed/80,.12);if(g.cool<=0&&speed>7&&Math.hypot(player.x-g.def.x,player.z-g.def.z)<7){g.cool=5;sonic(g);}}
   for(const g of gravityVisuals){g.cool=Math.max(0,g.cool-dt);g.core.rotation.y+=dt*.55;g.rings.forEach((r,i)=>{if(!reduced){r.rotation.x+=dt*(.2+i*.05);r.rotation.y-=dt*(.16+i*.06);}});g.light.intensity=18+Math.sin(time*2+g.phase)*7;if(g.cool<=0&&Math.hypot(player.x-g.def.x,player.z-g.def.z)<9){g.cool=12;gravity(g);}}
   rivalNotice=Math.max(0,rivalNotice-dt);
   for(const r of rivals){const u=(time*r.speed+r.phase)%1,p=r.curve.getPointAt(u),n=r.curve.getPointAt((u+.006)%1);r.model.position.copy(p);r.model.lookAt(n);r.halo.rotation.z=time*.6+r.index;const near=Math.hypot(player.x-p.x,player.z-p.z)<13;if(near&&!r.near&&rivalNotice<=0){rivalNotice=10;event('rival',{name:r.name});}r.near=near;}
   for(const p of pulses){p.age+=dt;if(p.age<0){p.ring.visible=false;continue;}if(p.age<p.life){p.ring.visible=true;const f=p.age/p.life;p.ring.scale.setScalar(.35+f*14);p.ring.material.opacity=(1-f)*(.72-(reduced?.22:0));p.ring.position.y=p.height+f*.08;}else p.ring.visible=false;}
  }
 };
}
