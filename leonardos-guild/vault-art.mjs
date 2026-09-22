import * as T from './vendor/three.module.js';
import {Batch,label} from './art-primitives.mjs';
import {VAULT_WALLS,VAULT_GATES,VAULT_NODES,VAULT_ROOMS,vaultGround,opticalOpen,serviceOpen,MIRROR_DIRECTIONS} from './vault-data.mjs';
/* Reused static batches and two gate meshes. No new lights, targets or audio. */
export function createVaultArt(root){
 const group=new T.Group();group.name='Lantern Vault survey wing';root.add(group);
 const stone=new Batch(),metal=new Batch(),tile=new Batch();
 for(const b of VAULT_WALLS){const y=vaultGround(b.x,b.z);stone.box(b.x,y+b.h/2,b.z,b.hx*2,b.h,b.hz*2,'#71858b');stone.box(b.x,y+b.h,b.z,b.hx*2+.1,.13,b.hz*2+.1,'#d3bc8c');}
 // Room names are on the local survey map; object labels stay near their controls.
 // Ground-conforming paving preserves the original terrain and movement height.
 for(let x=328;x<388;x+=4)for(let z=10;z<40;z+=3){const p=(a,b)=>[a,vaultGround(a,b)+.012,b];tile.tri(p(x,z),p(x,z+2.94),p(x+3.94,z+2.94),'#66756f');tile.tri(p(x,z),p(x+3.94,z+2.94),p(x+3.94,z),'#66756f');}
 const labels=[];
 for(const n of VAULT_NODES){const y=vaultGround(n.x,n.z);metal.box(n.x,y+.45,n.z,.55,.9,.55,'#b59a68');const tag=label(group,n.name+'\nINTERACT',n.x,y+1.75,n.z,3.3,.65,0,'#203b3b','#fff0ce');labels.push({n,tag});}
 metal.rod([362,vaultGround(362,28)+.9,28],[362,2.55,25],.04,'#b59a68');
 for(const x of [342,356,370])stone.box(x,3.05,25,.55,.4,4.5,'#baa979');
 stone.finish(group,new T.MeshStandardMaterial({roughness:1,vertexColors:true}),'Survey masonry');metal.finish(group,new T.MeshStandardMaterial({roughness:.7,vertexColors:true}),'Survey instruments');tile.finish(group,new T.MeshStandardMaterial({roughness:1,vertexColors:true,side:T.DoubleSide}),'Survey paving');
 const gateMaterial=new T.MeshStandardMaterial({color:'#527c80',metalness:.35,roughness:.7});
 const gates=VAULT_GATES.map(b=>{const m=new T.Mesh(new T.BoxGeometry(b.hx*2,b.h,b.hz*2),gateMaterial);m.position.set(b.x,vaultGround(b.x,b.z)+b.h/2,b.z);group.add(m);return m;});
 const shutter=new T.Mesh(new T.BoxGeometry(.25,1,1.3),gateMaterial);shutter.position.set(350,2.55,25);group.add(shutter);
 const glow=new T.MeshBasicMaterial({color:'#ffe397'}),blue=new T.MeshBasicMaterial({color:'#91dbe4'});
 const lens=new T.Mesh(new T.TorusGeometry(.35,.07,6,18),blue);lens.position.set(339,2.55,25);lens.rotation.y=Math.PI/2;group.add(lens);
 const weight=new T.Mesh(new T.CylinderGeometry(.2,.32,.5,8),new T.MeshStandardMaterial({color:'#c2a461'}));group.add(weight);
 const reflector=new T.Mesh(new T.BoxGeometry(.08,.85,.85),new T.MeshStandardMaterial({color:'#c9eff6',metalness:.8,roughness:.25}));reflector.position.set(362,2.55,25);group.add(reflector);
 const receiver=new T.Mesh(new T.OctahedronGeometry(.32),blue);receiver.position.set(369.3,2.55,25);group.add(receiver);
 const plans=new T.Mesh(new T.BoxGeometry(.8,.07,.65),new T.MeshStandardMaterial({color:'#f3dd9c'}));plans.position.set(381,1.05+vaultGround(381,25),25);group.add(plans);
 const beams=Array.from({length:2},()=>{const m=new T.Mesh(new T.BoxGeometry(1,.055,.055),glow);group.add(m);return m;});
 function beam(m,ax,az,bx,bz){const len=Math.hypot(bx-ax,bz-az);m.position.set((ax+bx)/2,2.55,(az+bz)/2);m.scale.x=Math.max(.01,len);m.rotation.y=-Math.atan2(bz-az,bx-ax);}
 let lastRevision=-1,reads=0;
 label(group,'LANTERN VAULT / EAST\nSURVEY TOOLS AT THE BENCH',310,2.3,23,4.6,.8,0,'#314846','#ffe6ae');
 const entry=label(group,'LANTERN VAULT\nSURVEY WING / EAST OF CAMP',326.7,2.7,25,5,1,-Math.PI/2,'#314846','#ffe6ae');
 return {update(s,camera){const v=s.vault||{revision:0,mirror:0};if(lastRevision!==v.revision){lastRevision=v.revision;reads++;gates[0].visible=!opticalOpen(v);gates[1].visible=!serviceOpen(v);shutter.position.y=v.weight==='shutter'?3.7:2.55;lens.visible=v.accepted&&v.lens==='emitter';weight.visible=v.accepted&&v.weight!=='pack';const at=v.weight==='service'?[347,36]:[347,28];weight.position.set(at[0],vaultGround(...at)+1.25,at[1]);reflector.rotation.y=-v.mirror*Math.PI/2+Math.PI/4;plans.visible=!v.record;receiver.material=opticalOpen(v)?glow:blue;beams[0].visible=lens.visible;beam(beams[0],339,25,v.weight==='shutter'?362:350,25);beams[1].visible=lens.visible&&v.weight==='shutter';const ends=[[362,18.4],[369.3,25],[362,31.6],[356.5,25]][v.mirror];beam(beams[1],362,25,...ends);}
  for(const {n,tag}of labels){tag.visible=Math.hypot(s.x-n.x,s.z-n.z)<8.5;if(tag.visible)tag.quaternion.copy(camera.quaternion);}entry.visible=Math.hypot(s.x-328,s.z-25)<22;
 },inspect:()=>({layout:'lantern-vault-1',spaces:VAULT_ROOMS.length,mechanismUpdates:reads})};
}
