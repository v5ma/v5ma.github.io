import * as T from './vendor/three.module.js';
import {ROADS,ANIMALS,HOME,LAKE,seeded,roadDistance,distance} from './ranger-data.js';
import {material,part,box,ellipsoid,bone,label} from './ranger-art.js';
export function buildPark(scene,physics){
  const rand=seeded(),grass=0x849466,soil=0xbca779,rock=0x747d69,wood=0x665942;
  scene.background=new T.Color(0xc4d0b8);scene.fog=new T.Fog(0xc4d0b8,80,190);
  const hemi=new T.HemisphereLight(0xfff2d5,0x354d41,2.2);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffe4b5,3.1);sun.position.set(-30,60,35);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:160});sun.shadow.normalBias=.045;sun.shadow.bias=-.00015;scene.add(sun,sun.target);
  const water=part(scene,new T.PlaneGeometry(1800,1800),new T.MeshStandardMaterial({color:0x517e7a,roughness:.43,metalness:.15}),0,-1.8,0);water.rotation.x=-Math.PI/2;water.castShadow=false;
  part(scene,new T.CylinderGeometry(86,89,3,96),material(soil),0,-1.54,0);
  const ground=part(scene,new T.CircleGeometry(85.4,96),grass,0,.005,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  // Continuous spline ribbons keep every road drivable without loading map assets.
  function road(points,width,color,height){
    const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,height,z))),verts=[],uv=[],indices=[];
    for(let i=0;i<=120;i++){const t=i/120,p=curve.getPoint(t),tan=curve.getTangent(t),nx=-tan.z,nz=tan.x;verts.push(p.x+nx*width,p.y,p.z+nz*width,p.x-nx*width,p.y,p.z-nz*width);uv.push(0,t*20,1,t*20);if(i<120){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=part(scene,g,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}),0,0,0);m.castShadow=false;
  }
  ROADS.forEach(p=>{road(p,3.75,0x8a865d,.045);road(p,3.15,0xc3ac7d,.065);road(p,.85,0xb9a677,.07);});
  const pondBank=part(scene,new T.CircleGeometry(LAKE.r+1.7,50),0xc1b388,LAKE.x,.08,LAKE.z);pondBank.rotation.x=-Math.PI/2;
  const pond=part(scene,new T.CircleGeometry(LAKE.r,50),new T.MeshStandardMaterial({color:0x639a90,roughness:.24,metalness:.18}),LAKE.x,.12,LAKE.z);pond.rotation.x=-Math.PI/2;
  physics.cylinder(LAKE.x,LAKE.z,LAKE.r,.35,.45);
  const o=new T.Object3D();
  function batch(geo,color,items){
    const m=new T.InstancedMesh(geo,material(color),items.length);items.forEach((v,i)=>{o.position.set(...v.p);o.scale.set(...v.s);o.rotation.set(...(v.r||[0,0,0]));o.updateMatrix();m.setMatrixAt(i,o.matrix);if(v.c)m.setColorAt(i,new T.Color(v.c));});m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
  }
  const trunks=[],crowns=[],ferns=[],rocks=[],patches=[];
  function clear(x,z){return roadDistance(x,z)>6.4&&distance({x,z},HOME)>19&&distance({x,z},LAKE)>16&&ANIMALS.every(d=>distance({x,z},d)>(d.kind==='sauropod'?14:7))&&distance({x,z},{x:31,z:-26})>9&&distance({x,z},{x:-48,z:-15})>8&&!(x>17&&x<73&&z< -34);}
  for(let i=0;i<380;i++){
    const a=rand()*Math.PI*2,r=16+rand()*67,x=Math.sin(a)*r,z=Math.cos(a)*r;if(!clear(x,z))continue;
    const h=4.8+rand()*7,lean=(rand()-.5)*.12;
    trunks.push({p:[x,h/2,z],s:[.38,h,.38],r:[lean,rand()*6,lean]});
    physics.cylinder(x,z,.53,h/2,h/2);
    const palette=[0x41624d,0x557756,0x69865d,0x799264,0x52745c];
    for(let j=0;j<3;j++)crowns.push({p:[x+(rand()-.5)*2,h-.6+j*.78,z+(rand()-.5)*2],s:[2.6-j*.4,1.6,2.35-j*.3],r:[0,rand()*6,0],c:palette[Math.floor(rand()*palette.length)]});
  }
  for(let i=0;i<750;i++){
    const x=(rand()-.5)*161,z=(rand()-.5)*161;if(Math.hypot(x,z)>82||roadDistance(x,z)<4||distance({x,z},LAKE)<15)continue;
    const size=.4+rand()*1.4;patches.push({p:[x,.023,z],s:[size*2,.04,size],r:[0,rand()*6,0],c:[0x809164,0x8d9a6a,0x7d8f63][i%3]});
    if(i%3===0)for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ferns.push({p:[x+Math.sin(a)*.6,.38,z+Math.cos(a)*.6],s:[.2,.12,1.1],r:[-.38,a,0],c:i%2?0x607f4c:0x758c54});}
  }
  for(let i=0;i<95;i++){
    const a=rand()*Math.PI*2,r=73+rand()*11,x=Math.sin(a)*r,z=Math.cos(a)*r,s=1+rand()*2.5;
    rocks.push({p:[x,s*.34,z],s:[s,s*.7,s*.8],r:[rand(),rand()*6,rand()*.3]});if(i%2===0)physics.cylinder(x,z,s*.8,s*.35,s*.5);
  }
  batch(new T.CylinderGeometry(.65,.85,1,6),wood,trunks);batch(new T.IcosahedronGeometry(1,1),0x608059,crowns);
  batch(new T.IcosahedronGeometry(1,0),rock,rocks);batch(new T.IcosahedronGeometry(1,0),grass,patches);batch(new T.IcosahedronGeometry(1,0),0x729451,ferns);
  for(let i=0;i<15;i++){const a=i/15*Math.PI*2;const m=ellipsoid(scene,0x66796a,Math.sin(a)*115,-4,Math.cos(a)*115,12+rand()*9,13+rand()*14,14+rand()*7);m.rotation.y=a;m.castShadow=false;}
  function sign(text,x,z,w=7){const g=new T.Group();g.position.set(x,0,z);box(g,wood,-w*.38,1.35,0,.12,2.7,.15);box(g,wood,w*.38,1.35,0,.12,2.7,.15);const s=label(text,w,1.25);s.position.set(0,2.1,.08);g.add(s);scene.add(g);return g;}
  function fence(ax,az,bx,bz){
    const length=Math.hypot(bx-ax,bz-az),angle=Math.atan2(bx-ax,bz-az),g=new T.Group();g.position.set((ax+bx)/2,0,(az+bz)/2);g.rotation.y=angle;scene.add(g);
    const posts=[];for(let d=-length/2;d<=length/2+.01;d+=Math.min(4,length))posts.push({p:[Math.sin(angle)*d+(ax+bx)/2,1.65,Math.cos(angle)*d+(az+bz)/2],s:[.2,3.3,.2]});batch(new T.BoxGeometry(1,1,1),0x5a6456,posts);
    for(const y of [.65,1.55,2.45])box(g,0x717966,0,y,0,.055,.055,length);
    physics.box((ax+bx)/2,1.2,(az+bz)/2,.12,1.2,length/2,{angle});
  }
  // Visitor center and equipment yard.
  box(scene,0xa99672,-13,1.65,53,10,3.3,6);physics.box(-13,1.5,53,5,1.5,3);
  box(scene,0x354e42,-13,3.45,53,11,.35,7.4);
  const roof=part(scene,new T.ConeGeometry(7.2,2.4,4),0x415c49,-13,4.55,53,1,.8,.75);roof.rotation.y=Math.PI/4;
  for(const x of [-16,-13,-10]){box(scene,0x2e5147,x,1.8,56.02,1.7,1.3,.03);box(scene,0xc6b794,x,1.8,56.04,.07,1.3,.035);}
  const baseSign=label('DINO ATLAS / FIELD STATION',9,1.1);baseSign.position.set(-13,3.37,56.75);scene.add(baseSign);
  const bay=part(scene,new T.RingGeometry(4.5,4.63,50),new T.MeshBasicMaterial({color:0xf1d998,side:T.DoubleSide}),0,.095,51);bay.rotation.x=-Math.PI/2;
  sign('RANGER BAY',5.8,55,4);
  const heli=part(scene,new T.CircleGeometry(7,48),0x6c7a64,19,.08,54);heli.rotation.x=-Math.PI/2;
  const h=label('H',5,5,'#6c7a64','#d4c49a');h.rotation.x=-Math.PI/2;h.position.set(19,.1,54);scene.add(h);
  // Monumental main gate with open, angled leaves.
  for(const x of [-7.6,7.6]){
    box(scene,0x7b7960,x,3.85,30,3.1,7.7,3);box(scene,0xb6a782,x,7.8,30,3.7,.55,3.6);physics.box(x,3.8,30,1.55,3.8,1.5);
    box(scene,0x334d3d,x,4.1,31.56,1.3,4,.09);const l=ellipsoid(scene,new T.MeshStandardMaterial({color:0xf0c174,emissive:0xfbba52,emissiveIntensity:.8}),x,8.4,30,.22,.4,.22);
  }
  box(scene,0x3e5841,0,8.1,30,17.8,1.5,1.35);const gateTitle=label('D I N O  A T L A S',16.3,1.35,'#324d3b','#ebdab0');gateTitle.position.set(0,8.1,30.7);scene.add(gateTitle);
  for(const x of [-5.9,5.9]){const leaf=new T.Group();leaf.position.set(x,0,30);leaf.rotation.y=x<0?1.1:-1.1;for(let i=0;i<6;i++)box(leaf,0x534d36,(x<0?1:-1)*i*.72,2.5,0,.18,5,.18);for(const y of [.6,2.5,4.6])box(leaf,0x6a644b,(x<0?1:-1)*1.8,y,0,4,.14,.16);scene.add(leaf);}
  fence(-30,30,-9.2,30);fence(9.2,30,37,30);sign('VALLEY ROUTE / KEEP LEFT',-8.8,20,7);
  sign('GIANT MEADOW',-33,10,6);sign('FOSSIL FIELD',-47,-8,5);sign('NORTH RELAY',31,-18,5);
  // Fossil dig, built from original geometric bones.
  const pit=part(scene,new T.CircleGeometry(6,30),0xc9b38a,-48,.09,-15);pit.rotation.x=-Math.PI/2;
  for(let i=0;i<7;i++){bone(scene,0xe1d6b8,[-50+i*.6,.3,-16.5],[-50+i*.6,.4,-13.5],.1,.1);}
  bone(scene,0xe9dfc4,[-51,.28,-15],[-45,.28,-15],.16,.16);ellipsoid(scene,0xded1b0,-44.5,.3,-15,.65,.3,.6);
  // Relay and the enclosed northern habitat.
  const relay=new T.Group();relay.position.set(31,0,-26);scene.add(relay);
  box(relay,0x505f4f,0,.2,0,4,.4,3);box(relay,0xba944f,0,1.35,0,2.5,2.3,1.8);box(relay,0x314c40,0,1.58,1.01,1.55,.8,.06);
  const relayLamp=ellipsoid(relay,new T.MeshStandardMaterial({color:0xffbf64,emissive:0xe3923e,emissiveIntensity:1}),.75,2.7,0,.13,.13,.13);
  bone(relay,0x7c8977,[-1.5,0,0],[-1.5,6,0],.08);const panel=box(relay,0x385966,-1,4.8,0,3,.12,2);panel.rotation.z=.3;physics.box(31,1.2,-26,1.4,1.2,1.1);
  fence(20,-39,32,-39);fence(42,-39,70,-39);fence(20,-39,20,-76);fence(70,-39,70,-76);fence(20,-76,70,-76);
  const north=new T.Group();north.position.set(37,0,-39);scene.add(north);
  const gateParts=[];for(const side of [-1,1]){const leaf=new T.Group();leaf.position.x=side*2.5;box(leaf,0x758570,0,1.5,0,4.9,3,.2);for(const y of [.45,1.55,2.65])box(leaf,0x333f32,0,y,.15,4.9,.16,.1);north.add(leaf);gateParts.push(leaf);}
  const northTitle=label('RESEARCH ACCESS / CAUTION',11,1.1,'#6a502c','#f7df99');northTitle.position.set(37,4,-39);scene.add(northTitle);
  const gateBody=physics.box(37,1.5,-39,5,1.5,.3);
  const recorder=new T.Group();recorder.position.set(47,0,-54);scene.add(recorder);box(recorder,0x3b4e43,0,.65,0,1.5,1.3,1);box(recorder,0xe2ac50,0,1.4,0,1.65,.18,1.15);bone(recorder,0xb8b99a,[.5,1.5,0],[.5,2.3,0],.02);
  sign('PREDATOR HABITAT',57,-35,8);
  // Bumpable supply crates and a real convex ramp.
  const props=[];
  for(let i=0;i<9;i++){const x=12+(i%3)*1.25,z=39+Math.floor(i/3)*1.4;const m=new T.Group();box(m,0xa58d5e,0,0,0,.85,.85,.85);box(m,0x5f6349,0,0,.43,.9,.12,.02);scene.add(m);props.push({mesh:m,body:physics.box(x,.6,z,.43,.43,.43,{dynamic:true})});}
  const rampGeo=new T.BufferGeometry();rampGeo.setAttribute('position',new T.Float32BufferAttribute([-3,0,5,3,0,5,-3,1.5,-5,3,0,5,3,1.5,-5,-3,1.5,-5],3));rampGeo.computeVertexNormals();part(scene,rampGeo,new T.MeshStandardMaterial({color:0xa39470,side:T.DoubleSide,roughness:.9}),13,.01,23);physics.ramp(13,23);
  // Objective ring and slim marker stay subordinate to the landscape.
  const beacon=new T.Group();const ring=part(beacon,new T.TorusGeometry(3,.075,5,48),new T.MeshBasicMaterial({color:0xffd479}),0,.18,0);ring.rotation.x=-Math.PI/2;
  const diamond=part(beacon,new T.OctahedronGeometry(.55),new T.MeshStandardMaterial({color:0xffd479,emissive:0xf4ac3c,emissiveIntensity:.6}),0,4.2,0);scene.add(beacon);
  const dust=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:0xc6b890,transparent:true,opacity:.16,depthWrite:false}),50);dust.frustumCulled=false;scene.add(dust);for(let i=0;i<50;i++){o.position.set(0,-20,0);o.scale.setScalar(.01);o.updateMatrix();dust.setMatrixAt(i,o.matrix);}const particles=[];
  let gateOpen=false,gateSlide=0;
  return {sun,hemi,beacon,props,pond,gateBody,
    setPowered(power){if(power!==gateOpen){gateOpen=power;gateBody.setTranslation({x:37,y:power?-8:1.5,z:-39},true);}relayLamp.material.emissive.set(power?0x83cba1:0xe3923e);},
    update(dt,time,car,night,reduced){
      const p=car.position;gateSlide+=(Number(gateOpen)-gateSlide)*Math.min(1,dt*3);
      gateParts.forEach((g,i)=>g.position.x=(i===0?-1:1)*(2.5+gateSlide*4.5));
      if(!reduced){diamond.rotation.y=time*.6;diamond.position.y=4.2+Math.sin(time*2)*.2;}
      props.forEach(({mesh,body})=>{mesh.position.copy(body.translation());mesh.quaternion.copy(body.rotation());});
      sun.position.set(p.x-30,65,p.z+32);sun.target.position.set(p.x,0,p.z);
      sun.intensity=night?.6:3.1;hemi.intensity=night?.85:2.2;
      scene.background.set(night?0x34494b:0xc4d0b8);scene.fog.color.copy(scene.background);
      if(!reduced&&Math.abs(car.speed)>3&&car.grounded>1&&particles.length<50){particles.push({x:p.x+(rand()-.5)*1.8,y:.4,z:p.z,age:0});}
      for(let i=particles.length-1;i>=0;i--){particles[i].age+=dt;if(particles[i].age>1.3)particles.splice(i,1);}
      for(let i=0;i<50;i++){const d=particles[i];if(d){o.position.set(d.x,d.y+d.age*.8,d.z);o.scale.setScalar(.2+d.age*.7);}else{o.position.set(0,-20,0);o.scale.setScalar(.001);}o.rotation.set(0,0,0);o.updateMatrix();dust.setMatrixAt(i,o.matrix);}dust.instanceMatrix.needsUpdate=true;
    }
  };
}
