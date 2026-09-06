/* Original geometric equipment and district art. Static decor is instanced by
 * the existing scene builder; dynamics are bounded and reused, not leaked. */
import {WEAPONS,ENEMIES,DEPOTS,CACHES} from './arsenal.mjs';
import {loot,railTarget} from './model.mjs';
export function combatScene(T,{scene,camera,part,box,label,material,movingPart}){
 // Quay bazaar: fabric roofs, striped stalls and a survey range.
 for(const [x,z,color] of [[-12,-5,'#b95246'],[12,9,'#2c8790']]){
  for(const dx of[-2,2])for(const dz of[-1.3,1.3])part('cylinder',x+dx,1.75,z+dz,.055,3.5,.055,'#cca568');
  box(x,3.45,z,4.5,.14,3.5,color);for(let i=-2;i<=2;i+=2)box(x+i*.8,3.56,z,.7,.04,3.5,'#f2d6a9');
  box(x,.65,z,3.7,1.3,1.5,'#764f3f');box(x,1.36,z,4,.1,1.6,'#cfad72');
 }
 label('QUAY OUTFITTERS\nB / EQUIPMENT + UPGRADES',3,3.25,7.85,5,1.3,'#713f35');
 label('SURVEY RANGE\nTRY THE LONGGLASS',14,3.6,-4.9,4,1,'#294760');
 // Each district has an unmistakable skyline detail, not another cone roof.
 for(const z of[-37,-33,-29]){box(74,21.8,z,10,.12,.14,'#609c96');for(const x of[69,79])part('cylinder',x,19.5,z,.1,4,.1,'#4f998d');}
 for(let i=0;i<7;i++){const x=53+i*4;box(x,6.35,-39,2.5,.7,1.5,'#325e56');for(let j=0;j<3;j++)part('sphere',x+(j-1)*.5,7.1,-39,.6,.6,.55,['#e6afc8','#dea966','#a0ccae'][i%3]);}
 // Suspended glass roof keeps the walkable apron open.
 const glass=new T.Mesh(new T.SphereGeometry(1,18,10,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:'#5fb5af',transparent:true,opacity:.35,roughness:.22,metalness:.1,side:T.DoubleSide,depthWrite:false}));glass.scale.set(5.7,4,6);glass.position.set(74,22,-34);scene.add(glass);
 for(const x of[-42,-29]){part('cylinder',x,31,-95,.9,12,.9,'#594847');part('torus',x,35,-95,1.1,1.1,1.1,'#db8c55',Math.PI/2);}
 box(-29,22,-75,25,.7,.9,'#435664');for(const x of[-41,-17]){box(x,17,-75,.6,10,.6,'#79543d');for(let y=13;y<=21;y+=2)box(x,y,-74.5,.85,.5,.2,'#e0b24e');}
 label('COPPERLIGHT\nFOUNDRY / SALVAGE',-24,22.9,-74.3,10,2.3,'#7a402f');
 for(let i=0;i<4;i++){box(29+i*2,25.5,-127,1.8,.15,3.7,'#547bad',.15);part('cylinder',29+i*2,23.7,-127,.06,3.6,.06,'#a2b5c4');}
 const beacon=new T.Group();beacon.position.set(45,60,-132);scene.add(beacon);const gem=movingPart('rock',material('#a6abef','metal'),[0,0,0],[2.2,4,2.2],beacon);for(const r of[0,Math.PI/2]){const ring=movingPart('torus',material('#7ae5d0','glow'),[0,0,0],[4,4,4],beacon);ring.rotation.x=r;}
 // Orchard-like park rather than the quay's potted trees.
 for(const x of[-7,7]){part('cylinder',x,6,-45,.25,5,.25,'#866458');for(const dx of[-1,0,1])part('sphere',x+dx,8,-45,1.8,1.3,1.8,'#d49aac');}
 for(const d of DEPOTS){const g=new T.Group();g.position.set(d.x,d.y,d.z);scene.add(g);movingPart('box',material('#294f58','metal'),[0,.9,0],[1.4,1.8,.85],g);movingPart('box',material('#e2bb78','metal'),[0,1.4,.45],[1.2,.8,.1],g);label('BUY / UPGRADE\nEARNED CREDITS',d.x,d.y+1.4,d.z+.52,1.12,.65,'#183f4b');}
 const bots=new Map();
 for(const b of ENEMIES){const g=new T.Group();scene.add(g);const type=b.kind;
  if(type==='heavy'){movingPart('box',material('#965b3d','metal'),[0,0,0],[2.1,1.6,1.3],g);for(const x of[-1.1,1.1]){movingPart('cylinder',material('#313f49','metal'),[x,-.6,0],[.4,1.5,.4],g);movingPart('box',material('#d5a354','metal'),[x,.25,.8],[.7,.5,1.3],g);}}
  else if(type==='sentry'){movingPart('cone',material('#727dae','metal'),[0,0,0],[1.25,1.7,1.25],g);for(const x of[-1,1])movingPart('box',material('#394760','metal'),[x,0,0],[1.1,.22,.45],g);movingPart('cylinder',material('#d9c789','metal'),[0,.15,1],[.15,1.7,.15],g).rotation.x=Math.PI/2;}
  else if(type==='target'){movingPart('cylinder',material('#576476','metal'),[0,-.85,0],[.12,1.5,.12],g);movingPart('torus',material('#bc8355','metal'),[0,0,0],[.75,.75,.75],g);movingPart('box',material('#32525c'),[0,0,0],[1.1,1.4,.18],g);}
  else{movingPart('sphere',material('#317d83','metal'),[0,0,0],[.85,.66,.7],g);for(const x of[-1.2,1.2]){const rotor=movingPart('torus',material('#90b4ad','metal'),[x,0,0],[.7,.7,.7],g);rotor.rotation.x=Math.PI/2;}}
  const eye=movingPart('sphere',new T.MeshBasicMaterial({color:WEAPONS.sniper.color}),[0,.55,.65],[.23,.23,.18],g);const hp=movingPart('box',new T.MeshBasicMaterial({color:'#79ddc0'}),[0,1.3,0],[1.7,.09,.09],g);const beam=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,1)]),new T.LineBasicMaterial({color:'#f07568',transparent:true,opacity:.4}));scene.add(beam);bots.set(b.id,{g,eye,hp,beam});
 }
 const drops=new Map();for(const d of [...CACHES,...ENEMIES.map(b=>({id:'drop-'+b.id,x:b.x,y:b.y,z:b.z}))]){const g=new T.Group();scene.add(g);movingPart('box',material(d.weapon?WEAPONS[d.weapon].color:'#a0c7b5','metal'),[0,.5,0],[.85,.8,.7],g);movingPart('box',material('#f4d8a1','metal'),[0,.52,0],[.14,.87,.75],g);const halo=movingPart('torus',material('#a4eacf','glow'),[0,.16,0],[.9,.9,.9],g);halo.rotation.x=Math.PI/2;drops.set(d.id,{g,halo});}
 const guns=new Map();
 for(const w of Object.values(WEAPONS)){const g=new T.Group();camera.add(g);const color=material(w.color,'metal'),dark=material('#223b45','metal'),brass=material('#c99d61','metal');
  movingPart('box',dark,[.35,-.39,-.55],[.19,.25,.27],g);
  if(w.id==='sniper'){movingPart('box',dark,[.35,-.29,-.94],[.16,.18,1.13],g);movingPart('cylinder',brass,[.35,-.25,-1.6],[.037,.65,.037],g).rotation.x=Math.PI/2;movingPart('cylinder',color,[.35,-.1,-.99],[.085,.45,.085],g).rotation.x=Math.PI/2;movingPart('torus',brass,[.35,-.1,-.76],[.092,.092,.092],g);movingPart('box',color,[.35,-.48,-.93],[.13,.28,.19],g);}
  else if(w.id==='scatter'){movingPart('box',brass,[.35,-.3,-1.03],[.3,.19,.78],g);for(const x of[.26,.44])movingPart('cylinder',dark,[x,-.27,-1.4],[.073,.65,.073],g).rotation.x=Math.PI/2;movingPart('box',color,[.35,-.43,-1.22],[.35,.12,.3],g);}
  else if(w.id==='carbine'){movingPart('box',color,[.35,-.29,-1.0],[.2,.27,.65],g);movingPart('box',dark,[.35,-.5,-.95],[.15,.36,.2],g);movingPart('cylinder',dark,[.35,-.23,-1.45],[.045,.52,.045],g).rotation.x=Math.PI/2;movingPart('torus',brass,[.35,-.12,-.92],[.06,.06,.06],g);}
  else{movingPart('box',brass,[.35,-.29,-.9],[.21,.22,.6],g);for(let i=0;i<5;i++)movingPart('torus',color,[.35,-.26,-.82-i*.085],[.085,.085,.085],g);}
  guns.set(w.id,g);
 }
 const marker=new T.Mesh(new T.TorusGeometry(.4,.06,6,24),new T.MeshBasicMaterial({color:'#acfff0',depthTest:true}));scene.add(marker);let recoil=0;
 function effect(e){if(e.type==='shot')recoil=1;}
 function update(s,dt,menu=false,reduced=false,xr=false){
  recoil=Math.max(0,recoil-dt*7);for(const [id,g] of guns){g.visible=!menu&&!xr&&s.p.weapon===id&&!(s.p.scoped&&id==='sniper');g.position.z=recoil*.08;g.rotation.x=recoil*.035;g.position.x=s.p.scoped?-.22:0;g.position.y=s.p.scoped?.12:0;}
  for(const b of s.drones){const v=bots.get(b.id);if(!v)continue;v.g.visible=b.hp>0;v.beam.visible=!menu&&b.hp>0&&b.telegraph>.03&&b.kind==='sentry';if(b.hp<=0)continue;v.g.position.set(b.x,b.y,b.z);v.g.lookAt(s.p.x,b.y,s.p.z);v.eye.material.color.set(b.stun>0?'#a1ffee':b.telegraph>.1?'#ff8063':'#c7b8ee');v.hp.scale.x=Math.max(0,b.hp/b.maxHp);if(v.beam.visible){const a=v.beam.geometry.attributes.position;a.setXYZ(0,b.x,b.y,b.z);a.setXYZ(1,s.p.x,s.p.y+1.1,s.p.z);a.needsUpdate=true;v.beam.geometry.computeBoundingSphere();}}
  for(const d of drops.values())d.g.visible=false;for(const item of loot(s)){const d=drops.get(item.id);if(!d)continue;d.g.visible=true;d.g.position.set(item.x,item.y,item.z);if(!reduced)d.halo.rotation.z=s.time*.8;}
  const target=menu?null:railTarget(s);marker.visible=!!target&&!s.p.grounded;if(target){marker.position.set(target.point.x,target.point.y,target.point.z);marker.quaternion.copy(camera.quaternion);}
  if(!reduced){gem.rotation.y+=dt*.25;beacon.rotation.y+=dt*.08;}
 }
 return {update,effect};
}
