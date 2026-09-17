import {PortalMaterials,createPortalFrame,followPosition} from './portal.mjs';
import {createCityView} from './city-view.mjs';
import * as T from '../vendor/three.module.js';
import {createMarketView} from './market-view.mjs';
import {createCourier} from '../vehicles.mjs';
import {placeChain} from '../grounded-motion.mjs';
import {floors,walls,canal,floorHeight,actors,clamp,inside,support} from './core.mjs';
import {openingState,panelsFor} from '../design/chapter-contract.mjs';
export function createView(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0xabc8cb);scene.fog=new T.Fog(0xabc8cb,55,140);
 const rig=new T.Group(),camera=new T.PerspectiveCamera(55,1,.05,220);rig.add(camera);scene.add(rig);
 scene.add(new T.HemisphereLight(0xffefd3,0x496e75,2));
 const sun=new T.DirectionalLight(0xffe6b7,3);sun.position.set(-25,40,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:100});sun.shadow.normalBias=.04;scene.add(sun);
 const world=new T.Group(),decor=new T.Group();scene.add(world);world.add(decor);
 const material=new Map(),boxGeo=new T.BoxGeometry(1,1,1),cylGeo=new T.CylinderGeometry(1,1,1,10);
 function mat(color){if(!material.has(color))material.set(color,new T.MeshStandardMaterial({color,roughness:.84}));return material.get(color);}
 function box(g,c,x,y,z,w,h,d,rot=0){const m=new T.Mesh(boxGeo,mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=rot;m.castShadow=m.receiveShadow=true;g.add(m);return m;}
 function cyl(g,c,x,y,z,r,h){const m=new T.Mesh(cylGeo,mat(c));m.position.set(x,y,z);m.scale.set(r,h,r);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
 function label(text,x,y,z,w=4,h=.7,background='#203e48',color='#f8e4be',parent=decor){
  const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,768,128);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.strokeRect(8,8,752,112);ctx.fillStyle=color;ctx.textAlign='center';ctx.font='bold 38px sans-serif';ctx.fillText(text,384,79,726);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,toneMapped:false}));m.position.set(x,y,z);parent.add(m);return m;
 }
 // Bounded terrain, a physical canal bed, and a layered plinth instead of an infinite flat map.
 box(decor,0x415b60,0,-3.3,0,49,1.5,43);box(decor,0x254047,0,-4.15,0,49.5,.22,43.5);
 const lowGroup=new T.Group();world.add(lowGroup);const decks=[];
 for(const f of floors){
  const group=f.low?lowGroup:new T.Group();if(!f.low)world.add(group);
  if(f.stairs){const n=24;for(let i=0;i<n;i++){const z=f.z-f.d/2+(i+.5)*f.d/n,y=floorHeight(f,z);box(group,f.low?0x8d9d95:0xb8b6a1,f.x,y-.13,z,f.w,.26,f.d/n+.03);}for(const x of[f.x-f.w/2,f.x+f.w/2])for(let i=0;i<9;i++){const z=f.z-f.d/2+i*f.d/8,y=floorHeight(f,z);cyl(group,0x45616a,x,y+.48,z,.042,.95);}}
  else box(group,f.low?0x8a9b8e:f.y>1?0xc1aa87:0xbbbfae,f.x,f.y-.18,f.z,f.w,.36,f.d);
  if(!f.low&&f.y>1&&!f.stairs)decks.push({f,group});
 }
 box(decor,0x657d78,canal.x,-2.35,canal.z,canal.w,.7,canal.d);
 for(const x of[-3.25,2.25]){box(decor,0x6d8280,x,-1.2,1,.5,2.4,28);for(let z=-12;z<15;z+=1.25)box(decor,0x93a39a,x,-.11,z,.65,.25,1.18);}
 // Walkway cobbles and functional route marking are instanced below.
 for(let z=-13;z<=19;z+=1.2)for(const x of[-22.4,-21.2,-20,-18.8,-6.2,-5,5.2,6.4,7.6])box(decor,0xa8afa3,x,.018,z,1.07,.025,1.05);
 for(let x=-22;x<10;x+=1.2)for(const z of[-14.6,-13.4,-12.2])box(decor,0xa3aca2,x,.02,z,1.04,.03,1.05);
 const cutWalls=[],wallMeshes=[];let gate;
 for(const w of walls){const m=box(world,w.color,w.x,w.y+w.h/2,w.z,w.w,w.h,w.d);wallMeshes.push({w,m});if(w.gate)gate=m;else if(w.cut)cutWalls.push(m);
  if(!w.gate)box(decor,0x536d70,w.x,w.y+w.h+.06,w.z,w.w+.14,.12,w.d+.12);
 }
 // A visible doorway, latch and lintel anchor the return revelation.
 box(decor,0xf4ddb3,3,3.35,18,.7,.35,3.4);const latch=box(world,0xe8b558,3.28,1.15,18,.12,.15,.46);
 const gateSign=label('BLUE SERVICE DOOR',3.35,2.55,18,2.4,.45);gateSign.rotation.y=Math.PI/2;
 label('MARA / POSTAL DEPOT',-12,3.3,17,7,.9,'#803e35');
 for(const x of[-15.8,-8.2])box(decor,0x634b3c,x,1.5,16.8,.18,3,.18);
 box(decor,0xa96d4e,-12,3.9,16.5,8.5,.22,2.6);box(decor,0x8b7257,-12,.8,15,3,.22,1);
 const parcel=box(world,0xe3b465,-12,1.08,15,.52,.34,.43);box(decor,0x735744,-15,.6,16,.7,1.2,.8);
 label('PRINT SHOP  /  STAIRS',-12.4,3,7.24,5,.65,'#526a73');
 label('TO DRYING TERRACES',-12.5,1.8,4.3,2.5,.45);
 // Roof-route boundaries, drying lines and a return stair visible from the arcade.
 for(const z of[-5,-2])for(let x=-6;x<=9;x+=1.5){cyl(decor,0x53686a,x,4.95,z,.045,1.1);box(decor,0x53686a,x,5.45,z,1.5,.07,.07);}
 for(const x of[-15.8,-7])cyl(decor,0x685842,x,5.65,-4,.06,2.5);
 box(decor,0x706953,-11.4,6.4,-4,8.8,.03,.035);
 for(let i=0;i<7;i++)box(decor,[0xf0deb5,0x9fbbb4,0xcc977d][i%3],-15+i*1.1,5.96,-4,.65,.82,.04);
 // Arcade: columns and arches frame a real circulation route and a passing bay.
 for(const z of[-10,-6,0,5]){for(const x of[-23,-18])cyl(decor,0xe2c9a3,x,1.5,z,.15,3);box(decor,0x4f7479,-20.5,3.2,z,5.6,.25,.65);}
 label('MARKET ARCADE',-20.5,3.75,6,5,.66,'#486861');
 label('NORTH QUAY / KEEP RIDING',-22.3,1.5,-8,2.6,.42);
 for(let z=-3;z<2;z+=1.1)for(const x of[-21.3,-20.1]){box(decor,0x8f724f,x,1.27,z,.8,.5,.9);for(let i=0;i<3;i++)cyl(decor,0xdfb76e,x-.24+i*.23,1.61,z,.1,.23);}
 for(let x=-16;x<=-5;x+=2.6){box(decor,0x41616c,x,2.5,-15.45,1.6,2,.1);box(decor,0xefdfb6,x,2.5,-15.34,.06,2,.06);}
 // Workshop has actual ground-floor circulation, an upper loft, and south stairs.
 label('LANTERN WORKSHOP',15.4,3.2,12.25,6,.78,'#855447');
 box(decor,0x765a44,14,.82,6,3,.25,1.1);label('RECEIVING BENCH',14,1.5,5.4,3,.4);
 for(const x of[11,13,15,17]){cyl(decor,0x695541,x,4.1,1,.04,2);cyl(decor,0xffc36f,x,3,1,.25,.45);}
 const bellTower=new T.Group();world.add(bellTower);box(bellTower,0xb7b2a0,20,7,-3,2.5,5,2.7);
 for(const x of[19,21])for(const z of[-4,-2])box(bellTower,0x5a6361,x,10.3,z,.16,2,.16);
 box(bellTower,0x447078,20,11.4,-3,3,.24,3);cyl(bellTower,0xca9b48,20,10.1,-3,.6,.6);cyl(bellTower,0x536461,20,12.1,-3,.05,1.2);
 // Three small overlooked rest areas give observation a purpose.
 for(const [x,z]of[[-9,11],[-21,11],[12,-11]]){box(decor,0x7d644d,x,.6,z,2.1,.18,.65);box(decor,0x7d644d,x,1.05,z+.35,2.1,.72,.12);for(const a of[-.8,.8])box(decor,0x3d5859,x+a,.3,z,.09,.6,.6);}
 for(const [x,z]of[[-21,17],[-5,9],[6,16],[14,-18],[22,15],[-22,-18]]){
  cyl(decor,0x765f4b,x,1.6,z,.2,3.2);const crown=new T.Mesh(new T.IcosahedronGeometry(1,1),mat(0x648a73));crown.position.set(x,3.7,z);crown.scale.set(1.7,2,1.6);decor.add(crown);box(decor,0x748977,x,.2,z,2.3,.4,2.3);
 }
 const lanterns=[];for(const [x,z]of[[-6,17],[-18,10],[-21,-12],[4,-12],[7,11],[22,8],[-6,-8]]){
  cyl(decor,0x425861,x,2,z,.05,4);box(decor,0x536266,x,4,z,.55,.14,.55);const bulb=box(decor,0xffd38b,x,3.66,z,.3,.48,.3);bulb.material=new T.MeshStandardMaterial({color:0xffd38b,emissive:0xffa04c,emissiveIntensity:.4});lanterns.push(bulb);
 }
 // Pump and local repair mechanism overlook the actual waterline.
 label('PUMP GALLERY / SLUICE',5.8,2.8,-12.8,5,.65,'#456777');
 box(decor,0x42656a,5.8,.7,-13,.8,1.4,.6);const wheel=cyl(world,0xd8b45e,5.8,1.45,-12.7,.38,.12);wheel.rotation.x=Math.PI/2;
 box(decor,0x637e7d,2.4,-.6,-11,.2,3,.8);const gauge=box(world,0xead68f,2.24,-.8,-11,.15,.16,.65);
 box(decor,0x62665d,6,.7,-8,.6,1.4,.7);label('HOIST REPAIR',6,1.8,-7.65,2.5,.4);
 const liftPlatform=box(world,0xb99764,6.8,-.09,.5,2,.18,2);
 for(const x of[5.7,7.9]){box(decor,0x536568,x,2.8,-.6,.15,5.6,.15);box(decor,0x9c875f,x,2.8,-.45,.025,5.6,.025);}
 label('GOODS HOIST',6.8,5.8,-.6,2.7,.4);
 // Boats are pooled at public piers. No navigation pointer can hand off a parcel remotely.
 function boat(){const b=new T.Group();box(b,0x92704d,0,.08,0,1.2,.22,2.15);for(const x of[-.62,.62])box(b,0x6a9690,x,.3,0,.12,.45,2.25);for(const z of[-1.06,1.06])box(b,0x6a9690,0,.3,z,1.24,.4,.12);box(b,0xcbb382,0,.35,.25,1.15,.12,.5);world.add(b);return b;}
 const boats=[boat(),boat(),boat()];boats[0].position.set(-.5,-.72,12);boats[1].position.set(-.5,-.72,-11.5);
 label('CANAL PIER / Y',-4.5,1.8,13.8,2.8,.45);label('PUBLIC PIER / Y',3,1.8,-13.4,2.8,.45);
 const waterGeo=new T.PlaneGeometry(5,28,1,1),waterMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},tint:{value:new T.Color(0x509caa)}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;uniform vec3 tint;varying vec2 uv0;void main(){float w=sin(uv0.x*70.+uv0.y*95.+time*1.3)+sin(uv0.x*130.-uv0.y*85.+time*.9);float glint=pow(max(0.,w*.5),10.);gl_FragColor=vec4(tint+glint*.3+w*.025,.88);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const water=new T.Mesh(waterGeo,waterMat);water.rotation.x=-Math.PI/2;water.position.set(-.5,-.75,1);world.add(water);
 const hero=createCourier(world);hero.unicycle.visible=false;hero.bicycle.visible=false;
 const flyingPaper=box(world,0xf5e7c5,0,0,0,.25,.025,.16);flyingPaper.visible=false;
 const people=[0x9e6651,0x709378,0xc6a25c].map(c=>{const a=createCourier(world,c);a.unicycle.visible=a.bicycle.visible=false;return a;});
 // Independent metre-space contact locks: never call the planet-ground projector here.
 const locks=[null,null],feet=[0,0];let phase=0,lastDistance=0,lastRide='',lastPosition=new T.Vector3(),maxError=0;
 function pose(a,s,dt,main=false){
  a.g.position.set(s.x,s.y+.08,s.z);a.g.rotation.set(0,s.yaw||0,0);a.bicycle.visible=s.ride==='bicycle';
  if(main){phase+=(s.distance-lastDistance)/1.65;lastDistance=s.distance;if(lastRide!==s.ride||a.g.position.distanceTo(lastPosition)>2||Math.abs(s.vy||0)>.1){locks.fill(null);}lastRide=s.ride;lastPosition.copy(a.g.position);}
  const p0=main?phase:s.time*.33;a.body.position.set(0,s.ride==='bicycle'?.3:s.ride==='boat'?-.2:0,0);a.body.rotation.x=s.ride==='bicycle'?-.2:0;a.g.updateMatrixWorld(true);maxError=0;
  for(let i=0;i<2;i++){
   const side=i?1:-1,p=(p0+i*.5)%1,angle=p*Math.PI*2;
   let foot=new T.Vector3(side*.125,.09,Math.sin(angle)*Math.min(.25,(s.speed||0)*.08)),hand=new T.Vector3(side*.27,1.02,-Math.sin(angle)*Math.min(.14,(s.speed||0)*.06));
   if(s.ride==='bicycle'){foot.set(side*.22,.43+Math.cos(angle)*.14,Math.sin(angle)*.14);hand.set(side*.33,1.21,-.48);a.pedals[i].position.set(side*.22,.4+Math.cos(angle)*.14,Math.sin(angle)*.14);}
   else if(s.ride==='boat'){foot.set(side*.16,.12,-.3);hand.set(side*.3,1.05,-.25);}
   else if(main&&Math.abs(s.vy||0)<.1){
    const stance=p<.58||s.speed<.05;
    if(stance){if(!locks[i]||!feet[i]){foot.z=s.speed>.05?-.25:0;locks[i]=foot.clone().applyQuaternion(a.g.quaternion).add(a.g.position);const sf=support(s,locks[i].x,locks[i].z,s.y);locks[i].y=(sf?floorHeight(sf,locks[i].z):s.y)+.17;}foot.copy(locks[i].clone().sub(a.g.position).applyQuaternion(a.g.quaternion.clone().invert()));if(Math.hypot(foot.x,foot.z)>.6){locks[i]=null;foot.set(side*.125,.09,0);}}
    else {locks[i]=null;foot.y+=Math.sin((p-.58)/.42*Math.PI)*.2;}feet[i]=stance;
   }else foot.y+=Math.max(0,Math.cos(angle))*.12;
   const root=new T.Vector3(side*.125,.96,0).applyEuler(a.body.rotation).add(a.body.position);
   const r=placeChain(a.legChains[i],root,foot,new T.Vector3(0,0,-1));maxError=Math.max(maxError,r.error);
   const sh=new T.Vector3(side*.235,1.43,0).applyEuler(a.body.rotation).add(a.body.position);placeChain(a.armChains[i],sh,hand,new T.Vector3(0,0,1));
  }
  a.wheels.forEach(w=>w.rotation.x=-(s.distance||0)/.34);
 }
 // Instanced static pieces keep the authored district bounded on mobile/XR.
 function batch(group){const bins=new Map();group.updateMatrixWorld(true);for(const m of [...group.children])if(m.isMesh&&(m.geometry===boxGeo||m.geometry===cylGeo)){const key=m.geometry.uuid+m.material.uuid;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(m);}
  for(const meshes of bins.values()){if(meshes.length<3)continue;const m=new T.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);meshes.forEach((o,i)=>{o.updateMatrix();m.setMatrixAt(i,o.matrix);group.remove(o);});m.castShadow=m.receiveShadow=true;group.add(m);}}
 batch(decor);batch(lowGroup);for(const g of world.children)if(g!==decor&&g!==lowGroup&&g.isGroup&&g.children.some(m=>m.geometry===boxGeo))batch(g);
 const marketView=createMarketView({world,box,cyl,label,batch});
 const cityView=createCityView({world,box,cyl,label});
 const portalMaterials=new PortalMaterials();portalMaterials.collect(world);
 const portalFrame=createPortalFrame(scene,portalMaterials),anchor=new T.Vector3(),portalSize=new T.Vector3();
 let aperture='both',centerError=0;
 function setOpening(value){aperture=openingState(value);return aperture;}
 function stopPortal(){portalMaterials.active=false;portalFrame.group.visible=false;world.position.set(0,0,0);world.scale.setScalar(1);world.rotation.set(0,0,0);}
 function presentPortal(s,settings,origin,heading,yaw){
  const size=settings.scale;portalSize.set(49*size,17*size,43*size);
  anchor.copy(origin).add(new T.Vector3(0,0,-settings.distance).applyAxisAngle(new T.Vector3(0,1,0),heading));anchor.y=origin.y+settings.height-4*size;
  const rotation=heading+(settings.rotation||0),gameRotation=rotation-yaw,gameScale=size*2;
  world.scale.setScalar(gameScale);world.rotation.set(0,gameRotation,0);world.position.copy(followPosition(anchor,s,gameRotation,gameScale,4*size));world.updateMatrixWorld(true);
  portalMaterials.configure(anchor,rotation,portalSize);portalMaterials.active=true;portalFrame.group.visible=true;portalFrame.update(anchor,rotation,portalSize,aperture);
  centerError=world.localToWorld(new T.Vector3(s.x,s.y,s.z)).distanceTo(anchor.clone().add(new T.Vector3(0,4*size,0)));
 }
 function cutaway(s,eye){
  const target=new T.Vector3(s.x,s.y+1,s.z),ray=new T.Ray(eye.clone(),target.clone().sub(eye).normalize()),distance=eye.distanceTo(target),hit=new T.Vector3();
  for(const {w,m}of wallMeshes){const bounds=new T.Box3(new T.Vector3(w.x-w.w/2,w.y,w.z-w.d/2),new T.Vector3(w.x+w.w/2,w.y+w.h,w.z+w.d/2));m.visible=!(w.gate&&s.gate)&&!(ray.intersectBox(bounds,hit)&&eye.distanceTo(hit)<distance-.25);}
 }
 const curtain=new T.Mesh(new T.SphereGeometry(.12,12,8),new T.MeshBasicMaterial({color:0x101c23,side:T.BackSide,depthTest:false}));curtain.renderOrder=1000;curtain.visible=false;camera.add(curtain);
 let cameraYaw=0,view='third',pitch=.58;
 function resize(){if(renderer.xr.isPresenting)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
 function update(s,dt,{mode='third',yaw=cameraYaw,started=true}={}){
  view=mode;cameraYaw=yaw;marketView.update(s);cityView.update(s,yaw);pose(hero,s,dt,true);const as=actors(s);as.forEach((a,i)=>pose(people[i],{...a,ride:'foot',yaw:a.yaw||0,time:s.time,speed:a.speed??1,distance:a.distance??s.time*.6},dt));
  flyingPaper.visible=!!s.paper;if(s.paper){const p=s.paper;flyingPaper.position.set(p.x+p.dx*p.t*6,p.y+Math.sin(p.t*Math.PI)*.5-p.t*.8,p.z+p.dz*p.t*6);flyingPaper.rotation.set(p.t*8,p.t*3,p.t*5);}
  gate.visible=!s.gate;latch.visible=!s.gate;parcel.visible=!s.parcel;lowGroup.visible=s.water==='low';
  const mix=s.transition?s.transition.from==='high'?1-s.transition.t:s.transition.t:s.water==='high'?1:0;water.position.y=-2+mix*1.25;water.visible=mix>.02;waterMat.uniforms.time.value=s.time;gauge.position.y=water.position.y;wheel.rotation.z=s.transition?s.transition.t*Math.PI*2:0;
  liftPlatform.position.y=(s.hoistY||0)-.09;
  boats[0].visible=boats[1].visible=s.water==='high';boats[2].visible=s.ride==='boat';boats[2].position.set(s.x,-.72,s.z);boats[2].rotation.y=s.yaw;
  const spatial=mode.startsWith('diorama'),first=mode==='first';if(!spatial)stopPortal();for(const {w,m}of wallMeshes)m.visible=!(w.gate&&s.gate);
  for(const m of cutWalls)m.visible=first||!spatial&&Math.hypot(m.position.x-s.x,m.position.z-s.z)>8;
  for(const d of decks)d.group.visible=first||s.y>=d.f.y-1||!inside(s.x,s.z,d.f,1.5);
  hero.g.visible=!first;if(!renderer.xr.isPresenting)curtain.visible=false;
  if(!renderer.xr.isPresenting){world.position.set(0,0,0);world.scale.setScalar(1);world.rotation.y=0;rig.position.set(0,0,0);rig.rotation.set(0,0,0);
   if(!started||mode==='overview'){camera.position.set(37,34,42);camera.lookAt(0,1,0);portalFrame.group.visible=false;}
   else if(first){camera.position.set(s.x,s.y+1.65,s.z);camera.rotation.order='YXZ';camera.rotation.set(0,yaw,0);}
   else if(mode==='diorama'){presentPortal(s,{scale:.04,height:-.9,distance:1.55,rotation:0},new T.Vector3(),0,yaw);camera.position.set(0,0,0);camera.lookAt(anchor.x,anchor.y+.18,anchor.z);cutaway(s,world.worldToLocal(camera.position.clone()));}
   else{const dist=11;const to=new T.Vector3(s.x+Math.sin(yaw)*dist,s.y+dist*(mode==='diorama'?.9:.65),s.z+Math.cos(yaw)*dist);camera.position.lerp(to,1-Math.exp(-dt*7));camera.lookAt(s.x,s.y+1,s.z);}
  }
 }
 resize();addEventListener('resize',resize);
 return {renderer,scene,camera,rig,world,hero,curtain,setOpening,resize,update,presentPortal,stopPortal,cutaway,get yaw(){return cameraYaw;},get opening(){return aperture;},inspect:()=>({market:marketView.inspect(),city:cityView.inspect(),portal:{active:portalMaterials.active,centerError,anchor:anchor.toArray(),size:portalSize.toArray(),materials:portalMaterials.entries.size,worldPosition:world.position.toArray(),worldYaw:world.rotation.y,kind:'perspective-ray-aperture',opaqueEnclosurePlanes:0},clearAlpha:renderer.getClearAlpha(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,aperture,topOpen:panelsFor(aperture).topOpen,frontOpen:panelsFor(aperture).frontOpen,stereoGameWorld:renderer.xr.isPresenting,eyes:renderer.xr.isPresenting?renderer.xr.getCamera().cameras.length:0,sceneMeshes:scene.children.length,contactError:maxError})};
}
