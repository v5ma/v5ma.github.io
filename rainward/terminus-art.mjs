import * as T from './vendor/three.module.js';
import {CURRENT,OBSTACLES,GRASS,heightAt} from './world.mjs';
import {rnd} from './artkit.mjs';
/* Railway-specific kit: covered nave, long carriage cover, broken roof trusses,
 * warm signs against a cool hall, real power-control lights and physical gate. */
export function buildTerminus(scene,A){
 const {add,label,mesh,mat,geos,buckets}=A,bronze=0x8e7960,stone=0xb0aba0,steel=0x4d5a5d;
 const floorGeo=new T.PlaneGeometry(84,124,42,62);floorGeo.rotateX(-Math.PI/2);floorGeo.translate(0,.005,-14);const floor=new T.Mesh(floorGeo,mat(0xb5b5ad,'paving'));floor.receiveShadow=true;scene.add(floor);
 const gates=[],lights=[];
 for(const o of OBSTACLES){
  if(o.renderSeparately){add('cyl',o.x,o.h/2,o.z,.30,o.h,.30,steel,'metal');add('box',o.x,.28,o.z,1.1,.56,1.1,stone);add('box',o.x,o.h-.3,o.z,1.1,.6,1.1,bronze,'metal');continue;}
  if(o.openWhen){const g=new T.Group();g.position.set(o.x,0,o.z);for(let x=-5.6;x<=5.6;x+=.65){const m=mesh('box',[.12,6,.15],bronze,'metal');m.position.set(x,3,0);g.add(m);}for(const y of[.5,3,5.6]){const m=mesh('box',[12,.14,.18],steel,'metal');m.position.y=y;g.add(m);}scene.add(g);gates.push(g);continue;}
  if(o.kind==='railcar'){
   add('box',o.x,1.1,o.z,o.w,.75,o.d,steel,'metal');add('box',o.x,2.35,o.z,o.w*.94,2,o.d*.92,0x6e5c45,'metal');add('box',o.x,3.45,o.z,o.w*.99,.28,o.d*.96,0x383d3c,'metal');
   for(const side of[-1,1])for(let k=1;k<Math.floor(o.d/2.2);k++){const z=o.z-o.d/2+k*2.2;add('box',o.x+side*(o.w/2+.012),2.65,z,.035,.94,1.42,0x203944,'metal');add('box',o.x+side*(o.w/2+.04),2.13,z,.06,.12,1.55,0x8a8971,'metal');}
   for(const z of[-.32,.32])for(const side of[-1,1])add('cyl',o.x+side*o.w*.38,.6,o.z+z*o.d,.48,.22,.48,0x272e30,'metal',0,0,Math.PI/2);
  }else if(o.kind==='fence'){
   for(let x=o.x-o.w/2;x<o.x+o.w/2;x+=1)add('box',x,o.h/2,o.z,.12,o.h,.15,steel,'metal');for(const y of[1.2,4,6])add('box',o.x,y,o.z,o.w,.18,.2,steel,'metal');
  }else{
   add('box',o.x,o.h/2,o.z,o.w,o.h,o.d,o.kind==='counter'?0x85745d:stone,o.kind==='counter'?'wood':'brick');
   if(o.h>4){add('box',o.x,o.h-.7,o.z,o.w+.15,.22,o.d+.2,0xd0c3a7);add('box',o.x,1.2,o.z,o.w+.15,.3,o.d+.2,0x6b6d63);}
  }
 }
 // Lines of sight and travel run along the platforms, not a copy of the garden.
 for(const x of[-11,11])for(const side of[-.9,.9])add('box',x+side,.07,-22,.12,.14,100,0x7f8786,'metal');
 for(const x of[-11,11])for(let z=-71;z<38;z+=2.2)add('box',x,.045,z,2.4,.09,.25,0x5d5244,'wood');
 for(const x of[-7,7])for(let z=-70;z<37;z+=3)add('box',x,.03,z,.10,.04,1.7,0xe4c783,'paint');
 // Vaulted trusses with physical supports already represented in OBSTACLES.
 for(const z of[-24,-6,12,32]){
  add('box',0,12,z,35,.35,.5,steel,'metal');for(const side of[-1,1]){add('box',side*8.4,14.3,z,18,.27,.35,bronze,'metal',0,0,-side*.27);for(let i=1;i<6;i++){const x=side*i*2.6;add('box',x,12.8+1.8*(1-Math.abs(x)/17),z,.10,2+2*(1-Math.abs(x)/17),.1,steel,'metal',0,0,.24*side);}}
 }
 for(const x of[-16,-10,-4,4,10,16])add('box',x,12.8+(1-Math.abs(x)/17)*3,-2,.12,.16,70,bronze,'metal');
 const glass=new T.MeshStandardMaterial({color:0xacc2c2,transparent:true,opacity:.13,roughness:.4,side:T.DoubleSide,depthWrite:false});
 for(let i=0;i<18;i++){const x=i%2?9:-9,z=-26+Math.floor(i/2)*7;if(i%5===1)continue;const panel=new T.Mesh(new T.PlaneGeometry(13,5),glass);panel.rotation.set(-Math.PI/2,0,(i%2?1:-1)*.28);panel.position.set(x,14.4,z);scene.add(panel);}
 // Clock and departure board are legible environmental destinations.
 label('BELLWEATHER TERMINUS\nNORTHBOUND · PLATFORM 03',0,8,27,15,2.4,'#263c48','#e7d5a8');
 label('POWER ROOM / WEST',-29,5,24,12,1.2,'#35454b','#ecc990');label('DISPATCH / EAST',30,5,24,12,1.2,'#35454b','#c3d3d5');
 label('SERVICE WORKSHOP',-31,5,-25.9,11,1.3);label('TRACTION CONTROL\nSIGNALS · PUMP · PLATFORM',0,6.6,-33.9,12,1.7,'#25383c','#e6c18d');
 const face=document.createElement('canvas');face.width=face.height=256;const c=face.getContext('2d');c.fillStyle='#d1c7a2';c.beginPath();c.arc(128,128,120,0,7);c.fill();c.strokeStyle='#263d40';c.lineWidth=8;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(128+Math.sin(a)*99,128-Math.cos(a)*99);c.lineTo(128+Math.sin(a)*110,128-Math.cos(a)*110);c.stroke();}c.beginPath();c.moveTo(128,65);c.lineTo(128,128);c.lineTo(173,156);c.stroke();const tx=new T.CanvasTexture(face);tx.colorSpace=T.SRGBColorSpace;const clock=new T.Mesh(new T.CircleGeometry(1.8,48),new T.MeshStandardMaterial({map:tx,roughness:.8}));clock.position.set(0,11,27.1);scene.add(clock);
 const circuitMats=[];
 for(const [i,w]of CURRENT.puzzle.wheels.entries()){
  add('box',w.x,.9,w.z,1.5,1.8,1,0x34474b,'metal');const lever=mesh('box',[.13,.7,.13],0xdfc393,'metal');lever.position.set(w.x,1.45,w.z+.63);lever.rotation.x=.45;scene.add(lever);
  label(w.label.toUpperCase(),w.x,2.5,w.z+.64,3,.6,'#263e45','#ebd6a7');
  const m=new T.MeshStandardMaterial({color:0x263b39,emissive:0x23382b,emissiveIntensity:.5});circuitMats.push(m);const lamp=new T.Mesh(new T.SphereGeometry(.16,10,8),m);lamp.position.set(w.x+.44,1.4,w.z+.55);scene.add(lamp);
 }
 label('POWER DIAGRAM\nPRESS E / Y TO READ',-28,2.1,21.5,4.5,1.4,'#34464b','#f0d395');
 for(const z of[-58,-18,12,31])for(const side of[-1,1]){
  const x=side*18.5;add('box',x,4.3,z,.20,1,.22,0xffc780,'glow');const lamp=new T.PointLight(0xffbd70,18,14,2);lamp.position.set(x,4,z);scene.add(lamp);lights.push(lamp);
  const pool=new T.Mesh(new T.CircleGeometry(2.3,24),new T.MeshBasicMaterial({color:0xffc790,transparent:true,opacity:.06,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(x,.027,z);scene.add(pool);
 }
 for(const r of CURRENT.water){const m=new T.Mesh(new T.PlaneGeometry(r.w,r.d),new T.MeshStandardMaterial({color:0x396575,roughness:.16,metalness:.40,transparent:true,opacity:.65}));m.rotation.x=-Math.PI/2;m.position.set(r.x,.08,r.z);m.userData.waterSurface=true;scene.add(m);}
 for(const g of GRASS)for(let i=0;i<160;i++)add('blade',g.x+(rnd(i+g.x)-.5)*g.w,.015,g.z+(rnd(i+g.z)-.5)*g.d,.17,.32+rnd(i)*.6,1,[0x697052,0x78805b,0x56684c][i%3],'grass',0,rnd(i+9)*6.28,.08);
 for(let i=0;i<120;i++)add('box',(rnd(i+36)-.5)*79,.04,-73+rnd(i+9)*110,.10+rnd(i)*.2,.05,.2,0x9c9686,'stone',0,rnd(i)*6,0);
 for(const {geo,mat:m,items}of buckets.values()){const inst=new T.InstancedMesh(geo,m,items.length);items.forEach((x,i)=>inst.setMatrixAt(i,x));inst.instanceMatrix.needsUpdate=true;inst.castShadow=geo!==geos.blade;inst.userData.windFoliage=geo===geos.blade||[...A.mats].some(([k,v])=>v===m&&k.endsWith(':leafcard'));inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst);}for(const [k,m]of A.mats)if(k.endsWith(':grass'))m.side=T.DoubleSide;
 return {update(s,dt){gates.forEach(g=>g.position.y+=((s.puzzle.solved?7:0)-g.position.y)*Math.min(1,dt*4));circuitMats.forEach((m,i)=>{m.color.setHex(s.puzzle.wheels[i]?0xcfd899:0x354440);m.emissive.setHex(s.puzzle.wheels[i]?0xe9c270:0x000000);m.emissiveIntensity=s.puzzle.wheels[i]?1.8:0;});},dispose(){tx.dispose();glass.dispose();}};
}
