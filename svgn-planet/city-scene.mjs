/* Add the city to the existing renderer; no separate canvas/runtime island. */
import * as T from './vendor/three.module.js';
import {CITY,clearedForCity} from './city-world.mjs';
import {selectedDevice,mission,focus} from './city-model.mjs';
import {street,point,add,mul,tangent,distance,norm} from './world.mjs';
import {mesh,anchor,road,batchStatic} from './art.mjs';
import {faceSurface,groundShadow} from './neighborhood.mjs';
import {createCourier,createCar} from './vehicles.mjs';
const front=n=>tangent(add(street(Math.atan2(-n[2],n[1])*110+1,Math.asin(n[0])*110),mul(n,-1)),n);
function sign(parent,text,p,width=4,color='#17495b'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const g=canvas.getContext('2d');g.fillStyle=color;g.fillRect(0,0,512,128);g.fillStyle='#fff0d1';g.font='bold 39px system-ui';g.textAlign='center';g.fillText(text,256,79,485);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:tex,side:T.FrontSide,roughness:1}));m.position.set(...p);parent.add(m);return m;}
function posed(parent,n){const g=new T.Group();parent.add(g);faceSurface(g,n,front(n));return g;}
export function createCityVisual(root){
 const fixed=new T.Group();root.add(fixed);
 for(const r of CITY.roads){const length=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]);const pts=Array.from({length:Math.ceil(length)+1},(_,i)=>street(r.a[0]+(r.b[0]-r.a[0])*i/Math.ceil(length),r.a[1]+(r.b[1]-r.a[1])*i/Math.ceil(length)));
  road(root,pts,r.width+2,'#d0c9b5',.23);road(root,pts,r.width,'#4b6068',.25);
  if(r.width>3)for(let i=2;i<pts.length-2;i+=4){const g=posed(fixed,pts[i]);if(r.a[0]===r.b[0])g.rotateY(Math.PI/2);mesh(g,'box','#e2cc88',[0,.29,0],[.1,.02,1.65]);}
 }
 for(const b of CITY.buildings){const g=posed(fixed,b.n),w=b.w,d=b.d,h=b.h;
  mesh(g,'box',b.color,[0,h/2,0],[w,h,d]);mesh(g,'box','#263f50',[0,.35,0],[w+.3,.7,d+.3]);mesh(g,'box','#ddd8c3',[0,h+.12,0],[w+.35,.26,d+.35]);
  for(let level=1.5;level<h-1;level+=2.2){for(let z=-d/2+1.2;z<d/2;z+=1.8)for(const side of [-1,1]){mesh(g,'box','#416980',[side*(w/2+.025),level,z],[.06,1.45,1.2]);mesh(g,'box','#bdd5d4',[side*(w/2+.07),level+.56,z],[.05,.05,1.25]);}
   for(let x=-w/2+.95;x<w/2;x+=1.65)for(const side of [-1,1])mesh(g,'box','#436c79',[x,level,side*(d/2+.04)],[1.15,1.4,.06]);}
  mesh(g,'box','#24434c',[0,1.2,d/2+.08],[1.7,2.4,.14]);sign(g,b.name,[0,h-.6,d/2+.15],Math.min(w-.3,5));
  const balcony=mesh(g,'box','#b4c9c3',[0,3.6,d/2+.65],[w+.7,.17,1.4]);if(h>6){for(const x of [-w/2,w/2])mesh(g,'box','#4f6064',[x,4,d/2+1.2],[.07,.9,.07]);mesh(g,'box','#4f6064',[0,4.4,d/2+1.2],[w,.08,.08]);}
  if(b.type==='garage'){sign(g,'SERVICE / NITRO',[w/2+.08,2.6,0],5).rotation.y=Math.PI/2;for(let k=0;k<7;k++)mesh(g,'box','#597070',[w/2+.07,.2+k*.32,0],[.08,.04,5]);}
  groundShadow(fixed,b.n,w*.6,d*.6);
 }
 for(const b of CITY.solids){const g=posed(fixed,b.n);mesh(g,'box',b.h>2?'#8faaa3':'#a98a5a',[0,b.h/2,0],[b.w,b.h,b.d]);if(b.h>2)for(let i=-b.d/2;i<=b.d/2;i+=2)mesh(g,'box','#526f76',[0,b.h/2,i],[.17,b.h+.25,.17]);}
 const bridge=posed(fixed,street(206,41));for(const side of [-1,1]){for(let x=-12;x<=12;x+=3)mesh(bridge,'box','#d6b475',[x,1,side*3.55],[.12,1.8,.12]);mesh(bridge,'box','#dec28e',[0,1.83,side*3.55],[25,.12,.12]);}
 const gate=posed(root,CITY.gate.n),arm=new T.Group();gate.add(arm);arm.position.set(-CITY.gate.w/2,.4,0);for(let i=0;i<10;i++)mesh(arm,'box',i%2?'#e8d9a5':'#b8754a',[(i+.5)*CITY.gate.w/10,.6,0],[CITY.gate.w/10,1.2,.19]);
 const entry=posed(fixed,street(116,4));mesh(entry,'cylinder','#687c7d',[0,2.4,0],[.07,4.8,.07]);sign(entry,'SIGNAL PLAZA  →',[0,4.1,0],4.6);
 const yardSign=posed(fixed,street(168,30.5));sign(yardSign,'CIVICGRID',[0,2.5,0],2.7);
 const contact=createCourier(root,'#d88465');contact.unicycle.visible=contact.bicycle.visible=false;faceSurface(contact.g,CITY.contact.n,front(CITY.contact.n));
 const desk=posed(fixed,CITY.desk.n);mesh(desk,'box','#496f72',[0,.6,0],[.9,1.2,.8]);sign(desk,'OPEN SIGNAL',[0,1.5,.41],1.8);
 const devices=CITY.devices.map(d=>{const g=posed(root,d.n);mesh(g,'box','#35525c',[0,.75,0],[.5,1.5,.4]);const lamp=mesh(g,'box','#73d3c8',[0,1.03,.22],[.31,.4,.03]);lamp.material=lamp.material.clone();
  if(d.kind==='camera'){mesh(g,'cylinder','#57797b',[0,2,0],[.06,4,.06]);mesh(g,'box','#d0d5c5',[0,3.8,.33],[.4,.23,.75]);}
  if(d.kind==='traffic'){mesh(g,'cylinder','#46616e',[0,2,0],[.055,4,.055]);mesh(g,'box','#293f4c',[0,3.8,0],[.43,.95,.38]);}
  const ring=new T.Mesh(new T.TorusGeometry(.7,.04,6,24),new T.MeshBasicMaterial({color:'#70ead5',depthTest:false}));ring.position.y=2.2;ring.renderOrder=100;g.add(ring);return {d,g,ring,lamp};});
 for(const j of CITY.jobs){const g=posed(fixed,j.n);mesh(g,'box','#caa165',[0,.4,0],[.6,.8,.6]);sign(g,'DISPATCH',[0,1.1,.33],1.35);}
 const report=posed(fixed,CITY.report.n);mesh(report,'cylinder','#657f86',[0,1.3,0],[.06,2.6,.06]);sign(report,'BEACON QUAY',[0,2.5,0],4.2);
 batchStatic(fixed);
 const vehicles=CITY.vehicles.map(v=>{const g=createCar(root,v.color);for(const side of[-1,1]){const logo=sign(g,v.id==='press'?'SVGN':'CITY',[side*.835,.67,0],1.25);logo.rotation.y=side*Math.PI/2;}return g;});
 const guards=CITY.guards.map(()=>{const a=createCourier(root,'#5c7175');a.bicycle.visible=a.unicycle.visible=false;return a;});
 const drone=new T.Group();root.add(drone);mesh(drone,'box','#344853',[0,0,0],[.48,.16,.42]);mesh(drone,'round','#77e2d2',[0,-.1,-.17],[.1,.08,.08]);const rotors=[];for(const x of[-.42,.42])for(const z of[-.35,.35]){mesh(drone,'box','#d9c797',[x/2,0,z/2],[.5,.06,.07],[0,-Math.atan2(z,x),0]);const m=mesh(drone,'box','#254249',[x,.07,z],[.48,.025,.06]);rotors.push(m);}
 const marker=posed(root,CITY.desk.n);const ring=new T.Mesh(new T.TorusGeometry(1.15,.055,6,32),new T.MeshBasicMaterial({color:'#efc77d'}));ring.rotation.x=Math.PI/2;ring.position.y=.3;marker.add(ring);const beacon=mesh(marker,'cone','#efc77d',[0,2.4,0],[.2,.5,.2],[Math.PI,0,0]);
 const coneGeometry=new T.ConeGeometry(1,1,28,1,true);coneGeometry.translate(0,-.5,0);coneGeometry.rotateX(-Math.PI/2);
 const cones=guards.map(()=>{const m=new T.Mesh(coneGeometry,new T.MeshBasicMaterial({color:'#e7bc78',transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}));root.add(m);return m;});
 function update(dt,s,c,camera){if(!c)return;const selected=selectedDevice(s,c),f=focus(s,c);
  vehicles.forEach((g,i)=>{const v=c.vehicles[i];faceSurface(g,v.n,mul(v.f,-1));});
  arm.rotation.z=T.MathUtils.lerp(arm.rotation.z,c.gate?Math.PI/2:0,Math.min(1,dt*7));
  drone.visible=c.drone.active;if(drone.visible){faceSurface(drone,c.drone.n,c.drone.facing);drone.position.set(...point(c.drone.n,c.drone.lift));rotors.forEach(r=>r.rotation.y+=dt*42);}
  devices.forEach(({d,g,ring,lamp})=>{ring.visible=c.scan>0&&distance(f.n,d.n)<20;ring.lookAt(camera.position);ring.scale.setScalar(selected?.id===d.id?1.4:1);ring.material.color.set(selected?.id===d.id?'#ffe3a1':'#70ead5');if(d.kind==='traffic')lamp.material.color.set(c.red>0?'#ee735e':'#71cf9e');});
  guards.forEach((a,i)=>{const g=c.guards[i];faceSurface(a.g,g.n,mul(g.f,-1));a.body.rotation.z=g.stun>0?.65:0;a.legs.forEach((l,k)=>l.rotation.x=g.stun>0?0:Math.sin(s.time*5+k*Math.PI)*.32);
   const cone=cones[i];cone.visible=c.scan>0&&g.stun===0;faceSurface(cone,g.n,g.f);cone.position.set(...point(g.n,1.4));cone.scale.set(7,4,12);});
  marker.visible=c.active&&!c.completed;if(marker.visible){faceSurface(marker,mission(c).site.n,front(mission(c).site.n));beacon.position.y=2.4+Math.sin(s.time*2)*.15;}
 }
 return {update,obstacles:CITY.buildings,inspect:()=>({roads:CITY.roads.length,buildings:CITY.buildings.length,devices:devices.length,vehicles:vehicles.length,guards:guards.length,renderer:'shared'})};
}
