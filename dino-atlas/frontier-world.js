import * as T from './vendor/three.module.js';
import {PENS,OUTPOSTS,TRAILS,WATER,DOCK,CHECKPOINTS,penState,penTerminal,isWater} from './frontier-data.js?v=storm2';
import {seeded,distance,clamp} from './ranger-data.js';
import {material,part,box,ellipsoid,bone,label} from './ranger-art.js';
import {bakeStatics} from './frontier-art.js?v=storm2';
const unit=new T.BoxGeometry(1,1,1);
export function buildFrontier(scene,physics,state){
 const rng=seeded(265911),batches=new Map(),matrix=new T.Object3D(),gates=[],crates=[],flags=[],water=[],rings=[];
 function addBatch(geo,color,p,s=[1,1,1],ry=0){const key=geo.uuid+':'+color;if(!batches.has(key))batches.set(key,{geo,color,items:[]});batches.get(key).items.push({p,s,ry});}
 function rail(x,y,z,sx,sy,sz,color=0x657660,ry=0){addBatch(unit,color,[x,y,z],[sx,sy,sz],ry);}
 const geoTrunk=new T.CylinderGeometry(.42,.59,1,6),geoCrown=new T.IcosahedronGeometry(1,1),geoStone=new T.IcosahedronGeometry(1,0);
 function trackDistance(x,z){let best=1e9;for(const road of TRAILS)for(let i=1;i<road.length;i++){const [ax,az]=road[i-1],[bx,bz]=road[i],dx=bx-ax,dz=bz-az,k=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(x-ax-dx*k,z-az-dz*k));}return best;}
 for(const points of TRAILS){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,.078,z)));for(const [width,color,y] of [[4.3,0x7b8760,.079],[3.6,0xc1ac7e,.082]]){const pos=[],indices=[];for(let i=0;i<=200;i++){const t=i/200,p=curve.getPoint(t),v=curve.getTangent(t);pos.push(p.x-v.z*width,y,p.z+v.x*width,p.x+v.z*width,y,p.z-v.x*width);if(i<200){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();const road=part(scene,geo,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}),0,0,0);road.castShadow=false;}}
 // A navigable wetland, with a visible jetty and open-water room to turn the boat.
 for(const w of WATER){const bank=part(scene,new T.CircleGeometry(1,72),0xb9b18b,w.x,.09,w.z,w.rx+2,w.rz+2,1);bank.rotation.x=-Math.PI/2;bank.castShadow=false;const lake=part(scene,new T.CircleGeometry(1,72),new T.MeshStandardMaterial({color:0x548b88,roughness:.24,metalness:.18}),w.x,.145,w.z,w.rx,w.rz,1);lake.rotation.x=-Math.PI/2;lake.castShadow=false;water.push(lake);}
 for(let i=0;i<26;i++){const a=i*Math.PI*2/26;const x=WATER[0].x+Math.cos(a)*77,z=WATER[0].z+Math.sin(a)*58;for(let k=0;k<4;k++)rail(x+k*.17,.7,z,.055,1.4,.055,0x637959);}
 const dock=new T.Group();dock.position.set(DOCK.x,0,DOCK.z);for(let x=-8;x<=5;x++)box(dock,0xa79970,x,.4,0,.88,.17,4);for(const x of [-7,0,5])for(const z of [-1.8,1.8]){bone(dock,0x6e6950,[x,-.1,z],[x,1.4,z],.12);}
 const ds=label('WETLAND DOCK / Y TO BOARD',10,1.25);ds.position.set(1,2.2,2);dock.add(ds);scene.add(bakeStatics(dock));physics.box(DOCK.x-1.5,.32,DOCK.z,7,.25,2);
 // Dense outer forest, all away from routes, stations, gates and the navigable water.
 for(let i=0;i<1450;i++){const a=rng()*Math.PI*2,r=92+rng()*207,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(trackDistance(x,z)<8||isWater(x,z,8)||OUTPOSTS.some(o=>distance(o,{x,z})<24||distance(o.pad,{x,z})<16)||PENS.some(p=>Math.abs(x-p.x)<p.hx+9&&Math.abs(z-p.z)<p.hz+19)||distance({x,z},DOCK)<19)continue;
  const h=5+rng()*9,c=x>100?0x899466:x< -90?0x557b62:0x6e9379;addBatch(geoTrunk,0x695f48,[x,h/2,z],[1,h,1],rng()*6);
  for(let j=0;j<3;j++)addBatch(geoCrown,c,[x+(rng()-.5)*1.7,h-.4+j*.55,z+(rng()-.5)*1.7],[2.1-j*.2,1.55,2.1-j*.15],rng()*6);
  physics.cylinder(x,z,.45,h/2,h/2);
  if(i%3===0)addBatch(geoStone,0x83936b,[x+2,.35,z+2],[1.4,.5,1]);
 }
 for(let i=0;i<500;i++){const a=rng()*6.28,r=90+rng()*208,x=Math.sin(a)*r,z=Math.cos(a)*r;if(trackDistance(x,z)<5||isWater(x,z,2))continue;addBatch(geoStone,i%2?0x9daa79:0x728b62,[x,.11,z],[1+rng()*4,.12,1+rng()*2],rng()*6);}
 function fenceSegment(ax,az,bx,bz){const len=Math.hypot(bx-ax,bz-az),ry=Math.atan2(bx-ax,bz-az);for(let i=0;i<=Math.ceil(len/4);i++){const k=i/Math.ceil(len/4);rail(ax+(bx-ax)*k,1.85,az+(bz-az)*k,.22,3.7,.22);}
  for(const y of [.55,1.5,2.5,3.25])rail((ax+bx)/2,y,(az+bz)/2,.055,.065,len,0x83957d,ry);
  physics.box((ax+bx)/2,1.6,(az+bz)/2,.1,1.6,len/2,{angle:ry});}
 for(const p of PENS){const x=p.x,z=p.z,a=p.hx,b=p.hz;
  const soil=part(scene,new T.PlaneGeometry(a*2,b*2),p.color,x,.027,z);soil.rotation.x=-Math.PI/2;soil.castShadow=false;
  fenceSegment(x-a,z-b,x+a,z-b);fenceSegment(x-a,z-b,x-a,z+b);fenceSegment(x+a,z-b,x+a,z+b);fenceSegment(x-a,z+b,x-6,z+b);fenceSegment(x+6,z+b,x+a,z+b);
  const gate=new T.Group();gate.position.set(x,0,z+b);for(const y of [.5,1.5,2.6])box(gate,0x687e68,0,y,0,11.7,.24,.25);for(const xx of [-5.5,-3,-.6,1.8,4.5])box(gate,0x819777,xx,1.5,0,.14,3.2,.16);scene.add(gate);
  const body=physics.box(x,1.6,z+b,6,1.6,.14);gates.push({p,gate,body,slide:0,open:null});
  const sign=label(p.name.toUpperCase(),12,1.35);sign.position.set(x,4.8,z+b);scene.add(sign);for(const xx of [-6.4,6.4])rail(x+xx,2.6,z+b,.24,5.2,.24);
  const t=penTerminal(p),station=new T.Group();station.position.set(t.x,0,t.z);box(station,0x35574b,0,.8,0,1,1.6,.8);box(station,0xe1bd6d,0,1.65,0,1.4,.12,1);const s=label('A / MANAGE',2.3,.55);s.position.set(0,2.3,0);station.add(s);scene.add(bakeStatics(station));physics.box(t.x,.8,t.z,.5,.8,.4);
  const trough=new T.Group();trough.position.set(x,0,z-4);box(trough,0x665b42,0,.35,0,5,.6,1.7);box(trough,0xb8ad70,0,.68,0,4.6,.15,1.4);scene.add(bakeStatics(trough));
  // A shelter gives each paddock an identifiable interior landmark.
  for(const xx of [-4,4])for(const zz of [-3,3])rail(x-a+8+xx,2,z-b+7+zz,.18,4,.18,0x727156);rail(x-a+8,4,z-b+7,10,.25,8,0x526a55);
 }
 for(const [i,o] of OUTPOSTS.entries()){
  const g=new T.Group();g.position.set(o.x,0,o.z);
  if(i>0){box(g,0xb4a37b,-8,1.9,6,9,3.8,7);box(g,0x465f50,-8,4,6,10,.34,8.4);for(const xx of [-10.5,-7.8,-5]){box(g,0x315649,xx,2.1,9.52,1.7,1.45,.04);box(g,0xdbcea5,xx,2.1,9.55,.08,1.45,.035);}physics.box(o.x-8,1.9,o.z+6,4.5,1.9,3.5);
   box(g,0x7d7960,0,.1,0,5,.2,5);box(g,0x4d7262,0,.7,1,1.9,1.4,.8);
   const pad=part(scene,new T.CircleGeometry(7,40),0x6c7e65,o.pad.x,.095,o.pad.z);pad.rotation.x=-Math.PI/2;pad.castShadow=false;const h=label('H',4,4,'#6c7e65','#dbcba3');h.rotation.x=-Math.PI/2;h.position.set(o.pad.x,.1,o.pad.z);scene.add(h);
  }
  const title=label(o.name.toUpperCase(),10,1.3);title.position.set(-7,4.8,10);g.add(title);
  // Tower, resting bench, water tank and battery cabinet.
  bone(g,0x737d64,[5,0,5],[5,10,5],.12,.06);for(let j=0;j<3;j++)box(g,o.color,5,9-j*.55,5,2.8,.12,.2);
  box(g,0x887954,2,.75,-2,3.3,.16,.55);for(const xx of [.8,3.2])box(g,0x4c5f4a,xx,.4,-2,.16,.8,.5);
  const tank=part(g,new T.CylinderGeometry(.65,.65,2.1,14),0x8cbbbb,4,1.05,-.4);box(g,0x8eaa7d,5.6,.75,-.4,.9,1.5,.8);
  const marker=part(g,new T.TorusGeometry(3.2,.08,6,48),new T.MeshBasicMaterial({color:o.color}),0,.13,0);marker.rotation.x=-Math.PI/2;
  const f=part(g,new T.OctahedronGeometry(.45),new T.MeshStandardMaterial({color:o.color,emissive:o.color,emissiveIntensity:.3}),0,3.2,0);flags.push({o,f});scene.add(bakeStatics(g,[f]));
 }
 // Sequential patrol hoops use the road network and have no timer pressure.
 const ringGeo=new T.TorusGeometry(4,.12,6,36);
 for(const [i,c] of CHECKPOINTS.entries()){const mesh=part(scene,ringGeo,new T.MeshBasicMaterial({color:0xe5c87f,transparent:true,opacity:.75}),c.x,3.8,c.z);rings.push(mesh);}
 const positions=[[17,40],[18,18],[-124,53],[202,87],[67,-199],[-80,205],[189,-54],[-205,66],[117,197],[-42,-213]];
 for(const [i,[x,z]] of positions.entries()){
  const id='blast-'+i,g=new T.Group();box(g,0x9d4e36,0,0,0,1.2,1.2,1.2);for(const yy of [-.43,.43])box(g,0xdfbd62,0,yy,.62,1.24,.15,.03);const sign=label('!',.7,.7,'#9d4e36','#f1cd71');sign.position.z=.64;g.add(sign);scene.add(bakeStatics(g));const body=physics.box(x,.7,z,.6,.6,.6,{dynamic:true});crates.push({id,mesh:g,body,exploded:state.exploded.includes(id)});
 }
 const blastPool=[];for(let i=0;i<8;i++){const m=part(scene,new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color:0xfbc982,transparent:true,opacity:0}),0,-100,0);m.visible=false;blastPool.push({m,age:10});}
 function detonate(c){if(c.exploded)return false;c.exploded=true;state.exploded.push(c.id);const p={...c.body.translation()};c.body.setEnabled(false);c.mesh.visible=false;const f=blastPool.find(f=>f.age>1.2)||blastPool[0];f.age=0;f.m.position.copy(p);f.m.visible=true;f.m.material.opacity=.7;return p;}
 for(const b of batches.values()){const m=new T.InstancedMesh(b.geo,material(b.color),b.items.length);b.items.forEach((v,i)=>{matrix.position.set(...v.p);matrix.scale.set(...v.s);matrix.rotation.set(0,v.ry,0);matrix.updateMatrix();m.setMatrixAt(i,matrix.matrix);});m.castShadow=true;m.receiveShadow=true;scene.add(m);}
 let clock=0;
 return {gates,crates,detonate,
  update(dt,time,player,reduced){clock+=dt;
   for(const f of flags){f.f.material.emissiveIntensity=state.outposts.includes(f.o.id)?.2:.75;if(!reduced)f.f.rotation.y=time*.5;}
   for(const e of gates){const open=penState(state,e.p).open;if(open!==e.open){e.open=open;e.body.setTranslation({x:e.p.x,y:open?-8:1.6,z:e.p.z+e.p.hz},true);}e.slide+=(Number(open)-e.slide)*Math.min(1,dt*5);e.gate.position.x=e.p.x+e.slide*12.4;}
   for(const c of crates){c.mesh.visible=!c.exploded;if(c.exploded){if(c.body.isEnabled())c.body.setEnabled(false);}else{c.mesh.position.copy(c.body.translation());c.mesh.quaternion.copy(c.body.rotation());}}
   rings.forEach((m,i)=>{m.visible=state.tracked==='patrol'&&!state.patrolDone&&i===state.patrol;m.material.opacity=.45+Math.sin(time*2)*.15;});
   for(const f of blastPool){f.age+=dt;if(f.age<1.2){f.m.scale.setScalar(.4+f.age*8);f.m.material.opacity=(1-f.age/1.2)*.6;}else f.m.visible=false;}
   for(const l of water)l.position.y=.145+(reduced?0:Math.sin(time*.8)*.025);
  }
 };
}
