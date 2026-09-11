/* Authored city and coastal environments, with playable geometry from the same
 * level definitions used for navigation. The distant skyline is decorative. */
import * as T from './vendor/three.module.js';
import {CURRENT,OBSTACLES,GRASS,heightAt,inside} from './world.mjs';
import {rnd} from './artkit.mjs';
import {streetVehicle,streetTree,bakeStreet} from './prop-kit.mjs';
export function buildReclaimed(scene,A){
 const {add,mesh,label,mat}=A,c=CURRENT,coast=c.id==='breakwater',snow=c.id==='whiteout',b=c.bounds,width=b.x1-b.x0+12,length=b.z1-b.z0+12,mid=(b.z0+b.z1)/2;
 const gates=[],wheels=[],lights=[],ground=[];
 function surface(x,z,w,d,tint,type,y=.005){const g=new T.PlaneGeometry(w,d,Math.ceil(w/3),Math.ceil(d/3));g.rotateX(-Math.PI/2);g.translate(x,0,z);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,heightAt(p.getX(i),p.getZ(i))+y);g.computeVertexNormals();const m=new T.Mesh(g,mat(tint,type));m.receiveShadow=true;scene.add(m);ground.push(m);return m;}
 surface(0,mid,width,length,snow?0xc8cbc2:coast?0x797d6f:0x858577,'ground');surface(0,mid,14,length,snow?0x8f9692:0x66706b,'road',.016);
 for(const z of[45,3,-42])surface(0,z,width-4,12,snow?0xa2a8a4:0x737c73,'road',.018);
 for(const x of[-53,53])surface(x,mid,5,length-4,0x92998a,'paving',.024);
 for(const x of[-8.5,8.5])surface(x,mid,2.6,length,0xb2b6a5,'paving',.027);
 for(let z=b.z0+3;z<b.z1;z+=2){const y=heightAt(0,z);for(const x of[-10,10])add('box',x,y+.085,z,.22,.17,1.94,0x979e8c,'stone');if(z%8<4){add('box',-.15,y+.033,z,.08,.01,.9,0xb6b594,'paint');add('box',.15,y+.033,z,.08,.01,.9,0xb6b594,'paint');}}
 for(const z of[48,7,-39])for(let i=-5;i<=5;i++)add('box',i, heightAt(i,z)+.039,z,.50,.009,2.6,0xb3b7a2,'paint');
 for(const o of OBSTACLES){
  if(o.renderAsTask)continue;
  if(['bus','truck','car'].includes(o.kind)){streetVehicle(A,o);continue;}
  if(o.openWhen){const g=new T.Group();g.position.set(o.x,o.bottom,o.z);for(let x=-o.w/2+.25;x<o.w/2;x+=.6){const m=mesh('box',[.065,o.h,.08],0x4f625c,'metal');m.position.set(x,o.h/2,0);g.add(m);}for(const y of[.3,o.h/2,o.h-.2]){const m=mesh('box',[o.w,.10,.14],0x7e8971,'metal');m.position.y=y;g.add(m);}scene.add(g);gates.push({g,base:o.bottom});continue;}
  if(o.kind==='lighthouse'){
   add('cyl',o.x,o.bottom+o.h/2,o.z,o.w*.45,o.h,o.d*.45,0xb2b4a4,'stone');for(const y of[5,10,15])add('cyl',o.x,o.bottom+y,o.z,o.w*.458,1.0,o.d*.458,0x5e7878,'metal');add('cyl',o.x,o.bottom+o.h+.25,o.z,3.8,.5,3.8,0x647573,'metal');add('cyl',o.x,o.bottom+o.h+2,o.z,2.2,3,2.2,0x718d87,'window');add('cone',o.x,o.bottom+o.h+4,o.z,3.5,1.4,3.5,0x465c5b,'metal');continue;
  }
  const boundary=o.id.includes('edge'),tint=snow&&o.kind==='planter'?0xc7c8bd:o.kind==='fence'?0x6a756e:o.kind==='planter'?0x969c82:o.kind==='counter'||o.kind==='shelf'?0x777665:boundary?0x727b71:coast?0x97958a:0x9f9583;
  add('box',o.x,o.bottom+o.h/2,o.z,o.w,o.h,o.d,tint,o.kind==='brick'?'brick':o.kind==='counter'?'wood':'stone');
  if(o.h>3&&!boundary){add('box',o.x,o.bottom+o.h-.08,o.z,o.w+.18,.21,o.d+.18,0xb6b39e,'stone');if(o.w>4){for(let x=o.x-o.w/2+.8;x<o.x+o.w/2-.4;x+=2.4)for(let y=2.9;y<o.h-1;y+=2.7){add('box',x,o.bottom+y,o.z+o.d/2+.021,1.32,1.65,.025,0x344746,'window');add('box',x,o.bottom+y-.82,o.z+o.d/2+.13,1.49,.13,.28,0xa9ab98,'stone');add('box',x,o.bottom+y,o.z+o.d/2+.046,.055,1.65,.04,0x889380,'metal');}}}
  if(o.kind==='shelf')for(let y=.45;y<o.h;y+=.48){add('box',o.x,y,o.z,o.w+.08,.045,o.d+.05,0xaaa487,'wood');for(let j=0;j<8;j++)add('box',o.x+.03,y+.14,o.z-o.d*.4+j*o.d*.10,.38,.24,.19,0x53665e,'cloth');}
  if(o.kind==='counter')add('box',o.x,o.h+.018,o.z,o.w+.1,.046,o.d+.1,0xb8b5a1,'wood');
  if(o.kind==='planter'){add('box',o.x,o.bottom+o.h+.03,o.z,o.w-.22,.05,o.d-.22,0x414f3c,'ground');streetTree(A,o.x,o.bottom+o.h,o.z,7.8+rnd(o.x+o.z)*3,Math.abs(o.x*9+o.z));}
 }
 for(const [i,building]of c.buildings.entries()){
  const {x,z,w,d,h}=building;
  // Broken ceilings preserve interiors, light shafts and alternate side doors.
  surface(x,z,w-.9,d-.9,0xa5a494,'paving',.05);
  for(const side of[-1,1]){add('box',x+side*(w/2-1.8),h-.3,z,2.6,.3,d-.8,0x696f66,'wood');for(let k=-d/2+2;k<d/2;k+=3)add('box',x,h-.35,z+k,w-1,.18,.12,0x626b5e,'wood');}
  add('box',x,h-.25,z-d/2+3,w-1,.25,5,0x737970,'stone');
  label(building.label,x,3.45,z+d/2+.57,Math.min(13,w-3),1.25,i%2?'#354e4e':'#475449','#e7d4a4');
  for(const side of[-1,1]){label('SIDE PASSAGE',x+side*(w/2+.55),2.6,z,4,.65,'#414f47','#d4d0b3',side*Math.PI/2);add('box',x+side*(w/2+1.1),4.0,z,.6,.14,5,0x6f7861,'metal');}
  const lamp=new T.PointLight(0xffd596,12,12,2);lamp.position.set(x,3,z+d/2-2.7);scene.add(lamp);lights.push(lamp);add('box',x,3.4,z+d/2-.63,.22,.13,.15,0xffce82,'glow');
  // Thin ivy sheets and drainpipes sit on existing walls, never across entrances.
  for(const side of[-1,1]){A.ivy(x+side*(w*.32),.8,z+d/2+.55,3.2,h*.78,i*311+side);add('cyl',x+side*(w/2-1),h*.48,z+d/2+.70,.062,h*.94,.062,0x5d7065,'metal');}
  // Interior signage makes the main objective side visibly different.
  if(i===0)label(coast?'BATTERY STORE / WEST':'WATER FILTER / WEST',x,2.55,z+1.5,6,.75,'#576050','#f5dbae');
 }
 // High background architecture has parallax but lies beyond world bounds.
 for(let i=0;i<(coast?9:22);i++){const side=i%2?1:-1,x=side*(72+rnd(i+7)*35),z=b.z1-10-Math.floor(i/2)*18,h=17+rnd(i+18)*35;
  if(coast&&side>0)continue;add('box',x,h/2,z,13,h,14,[0x7d8981,0x919a91,0x69776f][i%3],'brick');
  for(let y=3;y<h-1;y+=3)for(let k=-5;k<=5;k+=2.4){add('box',x-side*6.56,y,z+k,.025,1.7,1.2,0x405556,'window');add('box',x+k,y,z+7.02,1.2,1.7,.024,0x405556,'window');}
  add('box',x,h+.2,z,13.5,.4,14.5,0x829184,'metal');
 }
 // Snow banks preserve lane readability and provide visual cover cues without changing collision.
 if(snow){for(let z=b.z0+7,i=0;z<b.z1-5;z+=9,i++){for(const side of[-1,1]){const x=side*(12.2+(i%3)*.45);add('box',x,heightAt(x,z)+.12,z,1.2,.20,5.6,0xe1e2d8,'stone',0,(rnd(i+side*9)-.5)*.12,0);}}for(const x of[-55,55])for(let z=b.z0+10;z<b.z1-6;z+=13)add('box',x,.16,z,2.4,.28,7.2,0xd9dbd3,'stone',0,rnd(z)*.18,0);}
 // Dense ground vegetation marks exactly the playable concealment patches.
 for(const [j,g]of GRASS.entries())for(let i=0;i<650;i++){const x=g.x+(rnd(i+j*3001)-.5)*g.w,z=g.z+(rnd(i+j*4017+73)-.5)*g.d;if(OBSTACLES.some(o=>inside({x,z},o,.2)))continue;add('blade',x,heightAt(x,z)+.03,z,.08+rnd(i+31)*.10,.38+rnd(i+9)*.65,1,[0x72844d,0x879355,0x506e43][i%3],'grass',0,rnd(i+33)*6.28,(rnd(i+23)-.5)*.28);}
 for(let i=0;i<10;i++){const side=i%2?1:-1;streetTree(A,side*(b.x1+4),heightAt(side*b.x1,20-i*12),20-i*12,10+rnd(i)*6,i*87);}
 for(let i=0;i<350;i++){const x=(rnd(i+41)-.5)*(width-15),z=b.z0+4+rnd(i+23)*(length-15);add('box',x,heightAt(x,z)+.032,z,.07+rnd(i+6)*.19,.04,.10+rnd(i+24)*.21,[0x878977,0x6a7667,0xb0ab91][i%3],'stone',0,rnd(i)*6,0);}
 for(const s of c.shelters){const y=heightAt(s.x,s.z);label('SHELTER / CHECKPOINT',s.x,y+2.5,s.z-1.5,3.5,.62,'#305b51','#d8e1b6');add('box',s.x+.9,y+.09,s.z,.7,.18,1.65,0x687b62,'cloth');const light=new T.PointLight(0xffd194,6,7,2);light.position.set(s.x,y+2,s.z);scene.add(light);}
 for(const [i,w]of c.puzzle.wheels.entries()){
  const y=heightAt(w.x,w.z),group=new T.Group();group.position.set(w.x,y+1.1,w.z-.65);const casing=mesh('box',[.72,1.3,.38],0x567166,'metal');casing.position.y=-.4;group.add(casing);const wheel=new T.Mesh(new T.TorusGeometry(.27,.034,8,24),mat(0xc7ac75,'metal'));wheel.position.z=.23;group.add(wheel);const spoke=mesh('box',[.50,.037,.037],0xc7ac75,'metal');wheel.add(spoke);scene.add(group);const lamp=new T.Mesh(new T.SphereGeometry(.07,12,8),new T.MeshStandardMaterial({color:0x725c43,emissive:0xdd9858,emissiveIntensity:1}));lamp.position.set(.23,.37,.2);group.add(lamp);wheels.push({wheel,lamp});label((i+1)+' / '+w.label.toUpperCase(),w.x,y+2.05,w.z-.42,3.2,.63,'#3d5750','#e6d1a1');
 }
 const clue=c.puzzle.clue,cy=heightAt(clue.x,clue.z);label('READ THE DIAGRAM\nPRESS E / Y',clue.x,cy+1.72,clue.z-.7,2.4,.83,'#79755f','#f4ecd1');
 for(const r of c.water){const m=new T.Mesh(new T.PlaneGeometry(r.w,r.d,6,6),new T.MeshStandardMaterial({color:0x65857e,roughness:.16,metalness:.4,transparent:true,opacity:.66}));m.rotation.x=-Math.PI/2;m.position.set(r.x,heightAt(r.x,r.z)+.07,r.z);m.userData.waterSurface=true;scene.add(m);}
 let ocean=null,beam=null,beaconLamp=null;
 if(coast){
  const geo=new T.PlaneGeometry(220,340,110,170);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,Math.sin(x*.25+z*.31)*.20+Math.sin(z*.13)*.17);}geo.computeVertexNormals();ocean=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x52696c,roughness:.23,metalness:.35}));ocean.position.set(154,-1.4,-33);ocean.name='Coastal water beyond the seawall';scene.add(ocean);
  for(let z=b.z0+4;z<b.z1;z+=4){const y=heightAt(58,z);add('box',58,y+.55,z,.23,1.1,.15,0x858f80,'metal');add('box',58,y+1.07,z,.16,.11,4.1,0x7d8b7b,'metal');}
  const pole=new T.Group();pole.position.set(-7,24.3,-97);const light=new T.PointLight(0xffdfa1,0,38,2);pole.add(light);beaconLamp=light;
  beam=new T.Mesh(new T.ConeGeometry(4,45,24,1,true),new T.MeshBasicMaterial({color:0xf5dfab,transparent:true,opacity:.055,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));beam.rotation.z=-Math.PI/2;beam.position.x=22.5;pole.add(beam);scene.add(pole);beam.userData.pole=pole;
  label('BREAKWATER / SIGNAL ROAD',0,heightAt(0,-70)+4,-72,10,1.2,'#3a5356','#ddd8b5');
 }else if(snow){label('WHITEOUT MARKET\nNORTH TRANSIT',0,5.4,-86,14,1.8,'#4a5858','#eef0e2');label('PHARMACY  <     >  WINTER MARKET',0,3.4,50,10,1.0,'#4d5b5a','#f1ead6');}else{label('MERIDIAN WARD\nNORTH QUARANTINE',0,5.4,-62,14,1.8,'#394e47','#ded2aa');label('FIELD CLINIC  <     >  MARKET',0,3.4,49,9,1.0,'#3c5b4e','#ead9b0');}
 bakeStreet(scene,A);
 return {update(s,dt){for(const {g,base}of gates)g.position.y+=((base+(s.puzzle.solved?7.3:0))-g.position.y)*Math.min(1,dt*5);wheels.forEach(({wheel,lamp},i)=>{wheel.rotation.z=-(s.puzzle.wheels[i]||0)*Math.PI*2/3;const ok=s.puzzle.wheels[i]===c.puzzle.targets[i];lamp.material.color.setHex(ok?0xaddc8b:0xc89459);lamp.material.emissive.setHex(ok?0x72954c:0x7c3e21);});if(ocean)ocean.position.y=-1.4+Math.sin(s.t*.63)*.085;if(beam){const on=(s.completedTasks||[]).includes('coast-beacon');beam.visible=on;beaconLamp.intensity=on?55:0;beam.userData.pole.rotation.y=s.t*.17;}},dispose(){}};
}
