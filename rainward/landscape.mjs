import {buildTerrain} from './terrain-art.mjs';
/* Hand-built scene composition, procedural materials, original architecture.
 * All effects run in the renderer; no screenshot/backplate is used as a level. */
import * as T from './vendor/three.module.js';
import {CURRENT,OBSTACLES,heightAt,GRASS} from './world.mjs';
import {rnd} from './artkit.mjs';
export function skyEnvironment(scene,renderer){
 const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d'),grad=g.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#314e63');grad.addColorStop(.42,'#9ab6b4');grad.addColorStop(.56,'#ebe0b7');grad.addColorStop(.65,'#6d806b');grad.addColorStop(1,'#1b2921');g.fillStyle=grad;g.fillRect(0,0,1024,512);
 for(let i=0;i<100;i++){const x=rnd(i)*1024,y=40+rnd(i+190)*190,r=18+rnd(i+800)*80;const glow=g.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'#f2efdf55');glow.addColorStop(1,'#f2efdf00');g.fillStyle=glow;g.fillRect(x-r,y-r,2*r,2*r);}
 const tex=new T.CanvasTexture(c);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;scene.background=tex;const pm=new T.PMREMGenerator(renderer),env=pm.fromEquirectangular(tex);scene.environment=env.texture;scene.environmentIntensity=.45;pm.dispose();return {dispose(){env.dispose();tex.dispose();}};
}
export function buildConservatory(scene,A){
 const {add,mesh,label,ivy,mat,geos,buckets}=A;const dynamic={gates:[],wheels:[],water:[],lights:[]};
 const stone=0x8e8e72,light=0xb9af8a,dark=0x4a5b51,bronze=0x80795a;
 // Continuous terraced floor matches heightAt used by movement and perception.
 buildTerrain(scene,A);
 // Physical obstacles are always represented, and moving gates remain separate.
 for(const o of OBSTACLES){if(o.kind==='rock'||o.renderSeparately)continue;
  if(o.openWhen){const gate=new T.Group();gate.position.set(o.x,o.bottom,o.z);for(let x=-5.5;x<=5.5;x+=.55){const b=mesh('box',[.18,7,.24],bronze,'metal');b.position.set(x,3.5,0);gate.add(b);}for(const y of[1,3.5,6]){const b=mesh('box',[12,.19,.3],bronze,'metal');b.position.y=y;gate.add(b);}scene.add(gate);dynamic.gates.push(gate);continue;}
  add('box',o.x,o.bottom+o.h/2,o.z,o.w,o.h,o.d,stone,o.kind==='shelf'?'wood':'stone');
  if(o.h>3){add('box',o.x,o.bottom+o.h+.1,o.z,o.w+.35,.35,o.d+.3,light,'stone');if(o.w>5)ivy(o.x,o.bottom+.4,o.z+o.d/2+.05,o.w,o.h*.6,Math.round(o.x*9));}
  if(o.kind==='planter')for(let i=0;i<14;i++)add('cone',o.x+(rnd(i)-.5)*o.w,o.bottom+1.3,o.z+(rnd(i+25)-.5)*o.d,.45,1,.4,0x567041,'leaf');
 }
 // A deep facade of arches leads the eye along the wet central nave.
 function column(x,z,h=9,base=0){add('box',x,base+.3,z,1.9,.6,1.9,light);add('cyl',x,base+h/2,z,.57,h,.57,stone);add('box',x,base+h,z,1.8,.55,1.8,light);for(let j=0;j<8;j++){const a=j*Math.PI/4;add('cyl',x+Math.sin(a)*.5,base+h/2,z+Math.cos(a)*.5,.045,h-.7,.045,dark);}}
 function arch(x,z,width=9,base=0,depth=.95){const radius=width/2;for(let i=0;i<15;i++){const a=(i+.5)*Math.PI/15;add('box',x+Math.cos(a)*radius,base+6+Math.sin(a)*radius,z,width*.115,1.05,depth,light,'stone',0,0,a+Math.PI/2);}}
 for(const z of[16,2,-12])for(const side of[-1,1]){column(side*11,z,8.5);add('box',side*11,8.8,z-6,1,1,12,stone);}
 for(const z of [16,2,-12])arch(0,z,21,2,1.3);
 // Shattered glass conservatory: ribs converge into an incomplete dome.
 for(let k=0;k<12;k++){const a=k*Math.PI/6;const pts=[];for(let i=0;i<=15;i++){const t=i/15*Math.PI/2;pts.push(new T.Vector3(Math.cos(a)*18*Math.cos(t),9+12*Math.sin(t),-6+Math.sin(a)*18*Math.cos(t)));}
  const curve=new T.CatmullRomCurve3(pts),rib=new T.Mesh(new T.TubeGeometry(curve,24,.13,5,false),mat(bronze,'metal'));scene.add(rib);
 }
 for(const y of[10,15,19]){const radius=Math.sqrt(Math.max(0,1-((y-9)/12)**2))*18,ring=new T.Mesh(new T.TorusGeometry(radius,.13,5,64),mat(bronze,'metal'));ring.rotation.x=Math.PI/2;ring.position.set(0,y,-6);scene.add(ring);}
 for(let k=0;k<14;k++){const a=k*.52;add('plane',Math.cos(a)*16,12+rnd(k)*4,-6+Math.sin(a)*16,1.5,4,1,0x8fbbac,'glass',Math.PI/3,a,0);}
 const glass=mat(0x8fbbac,'glass');glass.transparent=true;glass.opacity=.16;glass.side=T.DoubleSide;glass.depthWrite=false;
 // North shrine and sculpted, original geometric guardians.
 for(const x of[-13,13]){column(x,-64,14,5);add('box',x,7,-59,5,4,4,dark);add('box',x,13,-59,2.2,8,2,stone);add('ball',x,18,-59,1.8,2.4,1.7,light);add('box',x,18,-60.5,2.5,.4,.3,dark);add('box',x,12,-60.3,3.7,.75,.6,bronze,'metal');}
 arch(0,-62,25,12,2);for(const x of[-12,-6,6,12])column(x,-76,10,5);
 add('box',0,20,-77,36,2,3,stone);add('box',0,22,-77,31,2,3,light);add('box',0,24,-77,25,2,3,stone);
 // Separate side chambers with vaulted ceilings, niches, lanterns and beams.
 for(const side of[-1,1])for(const z of[7,-3,-13,-23]){column(side*35,z,7.5);for(const x of[side*25,side*45]){add('box',x,2,z,2,4,1.4,dark);add('box',x,4,z,2.4,.35,1.7,light);}}
 for(const side of[-1,1])for(let i=0;i<10;i++){const z=6-i*3;add('box',side*35,8.5,z,25,.5,.35,bronze,'metal',0,0,side*.02);}
 // Far canyon geometry creates parallax and skyline, not a flat backdrop.
 for(let side of[-1,1])for(let i=0;i<13;i++){const x=side*(57+rnd(i+side)*22),z=52-i*11,h=18+rnd(i+77)*37;add('ball',x,h*.32,z,8+rnd(i)*7,h,9+rnd(i+19)*8,[0x6b7665,0x858773,0x59665a][i%3],'rock',rnd(i),rnd(i+3),rnd(i+11)*.3);}
 for(let i=0;i<7;i++){const x=-70+i*23,h=40+rnd(i+49)*30;add('cone',x,h*.5,-118,17,h,17,0x869887,'rock');}
 // Visible side waterfalls, fine spray, layered water surface and lily mats.
 const waterMaterial=new T.MeshStandardMaterial({color:0x3a7c6c,transparent:true,opacity:.68,roughness:.18,metalness:.35,side:T.DoubleSide});
 for(const p of CURRENT.water){const m=new T.Mesh(new T.PlaneGeometry(p.w,p.d,12,16),waterMaterial);m.rotation.x=-Math.PI/2;m.position.set(p.x,.16,p.z);scene.add(m);dynamic.water.push(m);
  for(let i=0;i<25;i++){const x=p.x+(rnd(i+3)-.5)*p.w,z=p.z+(rnd(i+99)-.5)*p.d;add('cyl',x,.19,z,.16+rnd(i)*.18,.018,.24,0x708246,'leaf');}}
 const fallMat=new T.MeshBasicMaterial({color:0xd5eee1,transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide});for(const [x,z]of[[-49,-8],[49,-19]])for(let i=0;i<4;i++){const m=new T.Mesh(new T.PlaneGeometry(2.8,30,1,8),fallMat);m.position.set(x+(i-.5)*.16,15,z+i*.18);scene.add(m);dynamic.water.push(m);}
 // Warm niches counterbalance the cool fog: original light shafts, no images.
 const glowMat=new T.MeshBasicMaterial({color:0xffd58b,transparent:true,opacity:.085,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 for(const [x,z]of[[-25,7],[-25,-10],[25,7],[25,-10],[-10,-58],[10,-58]]){const floor=heightAt(x,z);add('cyl',x,floor+1.2,z,.18,2.4,.18,bronze,'metal');add('ball',x,floor+2.6,z,.18,.32,.18,0xffd082,'glow');const lamp=new T.PointLight(0xffb55c,14,13,2);lamp.position.set(x,floor+2.6,z);scene.add(lamp);dynamic.lights.push(lamp);
 const beam=new T.Mesh(new T.ConeGeometry(3.4,7,16,1,true),glowMat);beam.position.set(x+1.8,floor+3.8,z);beam.rotation.z=.48;scene.add(beam);}
 // Ground-cover polygons and varied branching trees break repetitive boxes.
 const leafTex=document.createElement('canvas');leafTex.width=leafTex.height=64;const lg=leafTex.getContext('2d');lg.clearRect(0,0,64,64);lg.fillStyle='#dbe5c2';for(let i=0;i<16;i++){lg.beginPath();lg.ellipse(8+rnd(i)*48,8+rnd(i+9)*48,7,3,rnd(i+22)*6,0,7);lg.fill();}const tex=new T.CanvasTexture(leafTex);tex.colorSpace=T.SRGBColorSpace;
 for(const g of GRASS)for(let i=0;i<220;i++){const x=g.x+(rnd(i+g.x)-.5)*g.w,z=g.z+(rnd(i+g.z+99)-.5)*g.d,h=.4+rnd(i)*.65;add('blade',x,heightAt(x,z)+.02,z,.24,h,1,[0x668148,0x889554,0x52713e][i%3],'grass',0,rnd(i)*6.28,.15);}
 for(let i=0;i<26;i++){const side=i%2?1:-1,x=side*(18+rnd(i)*30),z=24-rnd(i+6)*66,base=heightAt(x,z),h=6+rnd(i+9)*7;add('cyl',x,base+h/2,z,.20,h,.27,0x555441,'wood',0,0,.06);
 for(let j=0;j<9;j++){const a=j*2.4,r=1+rnd(i+j)*3;add('cyl',x+Math.sin(a)*r/2,base+h*.78,z+Math.cos(a)*r/2,.06,r*1.8,.06,0x555441,'wood',Math.cos(a),0,Math.sin(a));add('plane',x+Math.sin(a)*r,base+h+Math.sin(j)*1.2,z+Math.cos(a)*r,3.5,2.7,1,0x81985a,'leafcard',rnd(j)*.5,rnd(j+2)*6,rnd(j+3));}}
 const lm=mat(0x81985a,'leafcard');lm.map=tex;lm.alphaTest=.45;lm.side=T.DoubleSide;lm.roughness=1;
 // Landmark and puzzle texts remain readable in the game world.
 label('THE DROWNED\nCONSERVATORY',-8,9.2,47,3.5,.8,'#3a4e43','#ddcf9d');label('ARCHIVE / WEST',-34,5,9.8,12,1.5);label('GLASSHOUSE / EAST',35,5,10.8,13,1.5);
 label('SUN · LEAF · WAVE\nGARDEN → NORTH',-28,2.4,7.1,5.8,1.6,'#39463c','#e3d3aa');
 for(const [i,w]of CURRENT.puzzle.wheels.entries()){
  add('box',w.x,1,w.z,1.7,2,1.6,dark);const wheel=new T.Mesh(new T.TorusGeometry(.64,.10,8,24),mat(0xc5a76a,'metal'));wheel.position.set(w.x,1.85,w.z+.86);scene.add(wheel);dynamic.wheels.push(wheel);
  for(let j=0;j<4;j++){const a=j*Math.PI/2;add('ball',w.x+Math.sin(a)*.63,1.85+Math.cos(a)*.63,w.z+.89,.07,.07,.05,0xdebc7b,'metal');}
  label(['GARDEN','ARCHIVE','DEEP'][i],w.x,2.9,w.z+.88,2.1,.6);}
 // Baked instancing; the renderer still uses real scene objects and collisions.
 for(const {geo,mat:m,items}of buckets.values()){const inst=new T.InstancedMesh(geo,m,items.length);items.forEach((v,i)=>inst.setMatrixAt(i,v));inst.instanceMatrix.needsUpdate=true;inst.castShadow=!['grass','glass','leafcard'].some(t=>[...A.mats].find(([k,v])=>v===m)?.[0].endsWith(':'+t));inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst);}
 for(const [key,m]of A.mats)if(key.endsWith(':grass'))m.side=T.DoubleSide;
 return {update(s,dt){dynamic.gates.forEach(g=>g.position.y+=((s.puzzle?.solved?8:0)-g.position.y)*Math.min(1,dt*3));dynamic.wheels.forEach((w,i)=>w.rotation.z=-(s.puzzle?.wheels[i]||0)*Math.PI/2);for(const [i,w]of dynamic.water.entries())if(w.rotation.x)w.position.y=.16+Math.sin(s.t*.7+i)*.014;},dispose(){tex.dispose();waterMaterial.dispose();fallMat.dispose();glowMat.dispose();}};
}
