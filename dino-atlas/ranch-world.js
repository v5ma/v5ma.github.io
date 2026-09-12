import * as T from './vendor/three.module.js';
import {box,part,bone,ellipsoid,label,material} from './ranger-art.js';
import {bakeStatics} from './frontier-art.js?v=ranch1';
import {seeded} from './ranger-data.js';
import {BUILDINGS,BONEYARDS,HARBORS,SALVAGE,RACE_GATES,EXTRA_ROADS,LAND_RADIUS,distance,seaWater,segmentDistance} from './ranch-data.js';
const WHITE=0xf0ddaf;
export function buildRanchWorld(scene,physics){
 const sites=[],markers=[],wavePool=[],rays=[],splashes=[],halos=new Map(),rng=seeded(91127);
 const waterMat=new T.MeshStandardMaterial({color:0x387e89,roughness:.29,metalness:.28,side:T.DoubleSide});
 const sea=part(scene,new T.RingGeometry(LAND_RADIUS,538,160),waterMat,0,.16,0);sea.rotation.x=-Math.PI/2;sea.castShadow=false;
 const canal=part(scene,new T.PlaneGeometry(258,36),waterMat,-350,.17,-152);canal.rotation.x=-Math.PI/2;canal.castShadow=false;
 for(let i=0;i<13;i++)for(const s of [-1,1]){const g=new T.Group();g.position.set(-235-i*18,0,-152+s*15);box(g,0x455f58,0,1,0,.18,2,.18);part(g,new T.SphereGeometry(.17,6,4),new T.MeshBasicMaterial({color:s>0?0x8feac5:0xf5bd75}),0,2.1,0);scene.add(bakeStatics(g));}
 // Drivable service roads connect every new district to the original network.
 for(const points of EXTRA_ROADS){const c=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,.085,z))),v=[],idx=[];for(let i=0;i<=100;i++){const p=c.getPoint(i/100),t=c.getTangent(i/100);v.push(p.x-t.z*3.8,.09,p.z+t.x*3.8,p.x+t.z*3.8,.09,p.z-t.x*3.8);if(i<100){let n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();part(scene,geo,new T.MeshStandardMaterial({color:0xb5a482,roughness:1,side:T.DoubleSide}),0,0,0).castShadow=false;}
 for(const b of BUILDINGS){
  const root=new T.Group();root.position.set(b.x,0,b.z);scene.add(root);const shell=new T.Group(),inside=new T.Group(),roof=new T.Group();root.add(shell,inside,roof);
  const solid=(g,c,x,y,z,sx,sy,sz)=>{box(g,c,x,y,z,sx,sy,sz);physics.box(b.x+x,y,b.z+z,sx/2,sy/2,sz/2);};
  // A real 1.7 m doorway and solid bollards keep vehicles outside; the ranger fits.
  solid(shell,0x818a79,0,b.h/2,-b.hz,b.hx*2,b.h,.5);
  for(const x of [-b.hx,b.hx])solid(shell,0x8f9988,x,b.h/2,0,.5,b.h,b.hz*2);
  const wing=b.hx-.85;for(const s of [-1,1])solid(shell,0x929b87,s*(.85+wing/2),b.h/2,b.hz,wing,b.h,.55);
  solid(shell,0x708476,0,(b.h+3.2)/2,b.hz,1.7,b.h-3.2,.55);
  for(const x of [-1.3,1.3]){solid(inside,0xd7b257,x,.62,b.hz+2,.4,1.24,.4);}
  // Mezzanine galleries wrap the open atrium. The inner railings are physical.
  for(const s of [-1,1]){solid(inside,0x586e66,s*(b.hx-3),6,0,5.5,.35,b.hz*2-1);solid(inside,0x677c70,s*(b.hx-6),6.75,0,.16,1.25,b.hz*2-2);}
  solid(inside,0x586e66,0,6,-b.hz+3,(b.hx-5)*2,.35,5.5);
  solid(inside,0x677c70,0,6.75,-b.hz+6,(b.hx-5)*2,1.25,.14);
  // Switchback corridor: the archive is not accessible from a parked vehicle.
  solid(inside,0x697e73,-5,1.5,3,b.hx+2,3,.3);
  solid(inside,0x6e8171,8,1.5,-2,.3,3,b.hz+1);
  solid(inside,0x748579,-8,1.5,-8,12,3,.3);
  // Ground-to-mezzanine stairs have 0.3 m risers and a handrail.
  for(let i=0;i<20;i++)solid(inside,0x839086,-b.hx+3,(i+1)*.15,b.hz-2-i*.64,2.6,(i+1)*.3,.66);
  for(let i=0;i<20;i++){box(inside,0xc6ba92,-b.hx+4.5,1.1+i*.3,b.hz-2-i*.64,.1,1.1,.1);}
  // Rooftop landing slab and perimeter rails remain solid when the roof is cut away.
  solid(roof,0x4b645a,0,b.h-.2,0,b.hx*2,.4,b.hz*2);
  for(const x of [-b.hx+.5,b.hx-.5])solid(roof,0x92ac9b,x,b.h+.55,0,.16,1.1,b.hz*2-1);
  for(const z of [-b.hz+.5,b.hz-.5])solid(roof,0x92ac9b,0,b.h+.55,z,b.hx*2-1,1.1,.16);
  const landing=part(roof,new T.RingGeometry(7.8,8.05,56),new T.MeshBasicMaterial({color:b.color,side:T.DoubleSide}),2,b.h+.015,1);landing.rotation.x=-Math.PI/2;landing.castShadow=false;
  const H=label('H',8,8,'#3e594f','#c7e9d3');H.rotation.x=-Math.PI/2;H.position.set(2,b.h+.025,1);roof.add(H);
  for(const x of [-8,12])for(const z of [-9,11])part(roof,new T.SphereGeometry(.25,6,5),new T.MeshBasicMaterial({color:0x9ef1d1}),x,b.h+.2,z);
  for(let y=5;y<b.h-2;y+=4)for(let x=-b.hx+3;x<b.hx;x+=5){box(shell,0x304f4b,x,y,b.hz+.31,3.5,2,.05);box(shell,b.color,x,y-1.15,b.hz+.4,4,.14,.6);if(rng()>.4)box(shell,0x48684a,x,y-1.1,b.hz+.45,1.6,1.2,.5);}
  for(let i=0;i<12;i++){let x=(i%4-1.5)*6,z=-b.hz+4+Math.floor(i/4)*3;box(inside,0x977e57,x,1,z,3,.16,1.5);for(const dx of [-1.2,1.2])box(inside,0x3f514a,x+dx,.5,z,.1,1,.1);box(inside,0x37574e,x,1.32,z,.6,.5,.5);}
  for(let i=0;i<5;i++){box(inside,0x526e60,b.hx-2,1.1,3+i*2,1,2.2,1.5);box(inside,0xacbb98,b.hx-2.52,1.1,3+i*2,.04,.8,.8);}
  for(const [x,z] of [[-15,10],[15,-12],[17,12],[-17,-12]]){box(inside,0x746c51,x,.4,z,1.6,.8,1.6);ellipsoid(inside,0x617f55,x,1.2,z,.9,1.4,.9);}
  // Visible lift cabins on all three levels; A moves between floors.
  for(const y of [0,6,b.h]){const g=y===b.h?roof:inside;box(g,0x31584f,-12,y+.13,-9,3.6,.2,3.6);box(g,0xb9d4b6,-10.4,y+1.1,-9,.2,2.2,.3);const l=label('A / LIFT',3,.6);l.position.set(-12,y+2.5,-10.5);g.add(l);}
  const sign=label(b.name.toUpperCase(),23,1.5);sign.position.set(0,4.2,b.hz+.7);shell.add(sign);
  const onFoot=label('PARK OUTSIDE / Y EXIT / ON FOOT ONLY',15,1);onFoot.position.set(0,2.9,b.hz+3);inside.add(onFoot);
  const record=new T.Group();record.position.set(13,1.1,-10);box(record,0x37635b,0,0,0,1.2,1.7,.9);part(record,new T.OctahedronGeometry(.4),new T.MeshBasicMaterial({color:0xf8db8f}),0,1.25,0);inside.add(record);
  const l=label('A / ARCHIVE',5,.7);l.position.set(13,3.3,-10);inside.add(l);
  const roofBox=new T.Group();roofBox.position.set(10,b.h+1,8);box(roofBox,0x3c6660,0,0,0,1.6,1.7,1.3);const rl=label('A / SKYLINE BEACON',7,.8);rl.position.set(0,1.8,0);roofBox.add(rl);roof.add(roofBox);
  bakeStatics(shell);bakeStatics(inside);bakeStatics(roof);sites.push({b,shell,roof,inside});
 }
 for(const [j,b] of BONEYARDS.entries()){
  const g=new T.Group();g.position.set(b.x,0,b.z);const soil=part(g,new T.CircleGeometry(18,40),0xaba284,0,.055,0);soil.rotation.x=-Math.PI/2;
  for(let k=0;k<3;k++){const x=(k-1)*8,z=k*3;for(let i=0;i<10;i++){ellipsoid(g,0xd4c9a4,x,.9,z+i*1.1,.45,.4,.5);const rib=part(g,new T.TorusGeometry(2.5-i*.09,.11,5,18,Math.PI),0xd5ceb0,x,.5,z+i*1.1);rib.rotation.z=0;}ellipsoid(g,0xcbbe99,x,1.1,z-1,1.1,.8,1.9);bone(g,0xd7cdaf,[x,.8,z+10],[x+3,.35,z+18],.3,.055);}
  const title=label(b.name.toUpperCase()+' / FOOT SURVEY',18,1.4);title.position.set(0,4,0);g.add(title);box(g,0x476658,0,.65,-4,1.2,1.3,1.2);scene.add(bakeStatics(g));
 }
 for(const d of HARBORS.slice(1)){
  const g=new T.Group();g.position.set(d.x,0,d.z);const a=Math.atan2(d.boat.x-d.x,d.boat.z-d.z);g.rotation.y=a;
  for(let i=-3;i<24;i++)box(g,0xb2a07d,0,.4,i,3.4,.22,.91);
  for(const x of [-1.7,1.7])for(let z=-2;z<23;z+=4){box(g,0x5e766a,x,1,z,.14,2,.14);part(g,new T.SphereGeometry(.14,6,4),new T.MeshBasicMaterial({color:0xa6e7de}),x,2,z);}
  const title=label(d.name.toUpperCase()+' / Y BOAT',14,1);title.position.set(0,3,-2);g.add(title);scene.add(bakeStatics(g));
  physics.box(d.x,.3,d.z,1.7,.1,12,{angle:a});
 }
 // Start buoy and ordered gates form a full ocean lap, outside the enlarged island.
 for(const [i,p] of RACE_GATES.entries()){
  const group=new T.Group();group.position.set(p.x,0,p.z);group.rotation.y=-p.angle;scene.add(group);
  for(const x of [-13,13]){part(group,new T.CylinderGeometry(.65,1,1.8,8),0xc99d51,x,1,0);part(group,new T.SphereGeometry(.32,8,5),new T.MeshBasicMaterial({color:i?0x8cdacc:0xfbd886}),x,2.1,0);}
  const ring=part(group,new T.TorusGeometry(13,.12,6,42),new T.MeshBasicMaterial({color:0xfbd886,transparent:true,opacity:.7}),0,3,0);ring.scale.y=.55;ring.visible=i===0;
  const tag=label(i?'BUOY '+i:'COASTAL TIME TRIAL / START',i?5:16,1.2);tag.position.set(0,8,0);group.add(tag);markers.push({group,ring,p,tag});
 }
 const cargo=[];for(const p of SALVAGE){const g=new T.Group();g.position.set(p.x,.7,p.z);box(g,0xe4b15e,0,0,0,2.4,1.5,2.4);for(const x of [-1.25,1.25])box(g,0x71919b,x,-.6,0,.45,.6,3.2);const t=label('SALVAGE / A',8,1);t.position.set(0,3,0);g.add(t);scene.add(bakeStatics(g));cargo.push({p,g});}
 // Affordable outer forest: instances, with every road and discovery site kept clear.
 const forest=[];for(let i=0;i<360;i++){const a=rng()*Math.PI*2,r=310+rng()*99,x=Math.cos(a)*r,z=Math.sin(a)*r,p={x,z};if(seaWater(x,z,7)||BUILDINGS.some(b=>distance(b,p)<45)||BONEYARDS.some(b=>distance(b,p)<27)||HARBORS.some(b=>distance(b,p)<25)||EXTRA_ROADS.some(road=>road.some((v,j)=>j&&segmentDistance(p,{x:road[j-1][0],z:road[j-1][1]},{x:v[0],z:v[1]})<8)))continue;forest.push({x,z,h:6+rng()*10});}
 const mat=new T.Object3D();for(const [geo,c,leaf] of [[new T.CylinderGeometry(.3,.48,1,6),0x6c674e,false],[new T.IcosahedronGeometry(1,1),0x567b63,true]]){const m=new T.InstancedMesh(geo,material(c),forest.length);forest.forEach((v,i)=>{mat.position.set(v.x,leaf?v.h:v.h/2,v.z);mat.scale.set(leaf?3.2:1,leaf?2.8:v.h,leaf?3:1);mat.updateMatrix();m.setMatrixAt(i,mat.matrix);});m.castShadow=true;scene.add(m);}
 // Pooled effects: thick streams, droplets, electrical arcs and expanding horn waves.
 for(let i=0;i<28;i++){const m=part(scene,new T.RingGeometry(.92,1,48),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),0,-10,0);m.rotation.x=-Math.PI/2;m.visible=false;wavePool.push({m,t:9,life:1,radius:1});}
 for(let i=0;i<30;i++){const m=part(scene,new T.CylinderGeometry(1,1,1,5),new T.MeshBasicMaterial({color:0x96eaff,transparent:true,opacity:0,depthWrite:false}),0,-10,0);m.visible=false;rays.push({m,t:9,life:.2});}
 for(let i=0;i<48;i++){const m=part(scene,new T.IcosahedronGeometry(.13,0),new T.MeshBasicMaterial({color:0xc1f4ff,transparent:true,opacity:0}),0,-10,0);m.visible=false;splashes.push({m,t:9,life:.5,v:new T.Vector3()});}
 let wi=0,ri=0,si=0,hornCount=0,shotCount=0,wake=0;const up=new T.Vector3(0,1,0);
 function wave(p,color,radius=10,life=1.1,y=.22){const o=wavePool[wi++%wavePool.length];o.m.position.set(p.x,y,p.z);o.m.material.color.setHex(color);o.radius=radius;o.life=life;o.t=0;o.m.visible=true;return o;}
 function ray(a,b,color,width,life){const o=rays[ri++%rays.length],v=new T.Vector3(b.x-a.x,b.y-a.y,b.z-a.z);o.m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);o.m.quaternion.setFromUnitVectors(up,v.clone().normalize());o.m.scale.set(width,Math.max(.01,v.length()),width);o.m.material.color.setHex(color);o.life=life;o.t=0;o.m.visible=true;}
 function shot(kind,a,b,targets=[]){shotCount++;if(kind==='water'){ray(a,b,0x91e6ff,.105,.16);for(let i=0;i<5;i++){const o=splashes[si++%48],f=rng();o.m.position.set(a.x+(b.x-a.x)*f+(rng()-.5)*.5,a.y+(b.y-a.y)*f,a.z+(b.z-a.z)*f+(rng()-.5)*.5);o.v.set((rng()-.5)*2,-rng()*2,(rng()-.5)*2);o.t=0;o.life=.4;o.m.visible=true;}wave(b,0xa4edff,1.5,.32,Math.max(.2,b.y));}
  else{let last=a;for(let i=1;i<=9;i++){const f=i/9,n={x:a.x+(b.x-a.x)*f+(i<9?(rng()-.5)*.8:0),y:a.y+(b.y-a.y)*f+(i<9?(rng()-.5)*.6:0),z:a.z+(b.z-a.z)*f+(i<9?(rng()-.5)*.8:0)};ray(last,n,0xc5b9ff,.075,.28);last=n;}wave(b,0xb9a1ff,3,.5,Math.max(.2,b.y));}
  for(const t of targets){wave(t,kind==='water'?0x83e9fb:0xc4b0ff,t.radius+1.5,.8);}
 }
 function horn(p,reduced=false){hornCount++;for(let i=0;i<(reduced?1:5);i++){const w=wave(p,0xffd38a,42,1.55+i*.1,.18+i*.09);w.t=-i*.09;}}
 function update(dt,time,p,mode,state,race,animals,reduced){
  for(const s of sites){const within=Math.abs(p.x-s.b.x)<s.b.hx&&Math.abs(p.z-s.b.z)<s.b.hz&&p.y<s.b.h-2;s.roof.visible=!within;s.shell.visible=!within;}
  for(const m of markers){const near=distance(p,m.p)<190;m.group.visible=near;m.ring.visible=near&&race.active&&(race.index%24===m.p.id);m.tag.visible=near&&(m.p.id===0||m.ring.visible);}
  for(const c of cargo){c.g.visible=!state.salvage.includes(c.p.id)&&distance(p,c.p)<210;if(!reduced)c.g.position.y=.8+Math.sin(time*1.6+c.p.x)*.12;}
  for(const w of wavePool){w.t+=dt;const f=w.t/w.life;w.m.visible=f>=0&&f<1;if(w.m.visible){w.m.scale.setScalar(reduced?w.radius:Math.max(.3,w.radius*f));w.m.material.opacity=(1-f)*(reduced?.28:.8);}}
  for(const r of rays){r.t+=dt;r.m.visible=r.t<r.life;r.m.material.opacity=Math.max(0,1-r.t/r.life);}
  for(const s of splashes){s.t+=dt;s.m.visible=s.t<s.life;if(s.m.visible){s.m.position.addScaledVector(s.v,dt);s.v.y-=dt*4;s.m.material.opacity=1-s.t/s.life;}}
  for(const a of animals){let h=halos.get(a.uid);if(a.deter>0&&a.model.visible){if(!h){h=part(scene,new T.TorusGeometry(1,.06,5,24),new T.MeshBasicMaterial({color:0x9de8fc,transparent:true,opacity:.7}),0,0,0);h.rotation.x=-Math.PI/2;halos.set(a.uid,h);}h.visible=true;h.position.set(a.x,.23,a.z);h.scale.setScalar(a.radius+.55);h.material.color.setHex(a.effect==='horn'?0xffd38a:a.effect==='zapper'?0xc4b0ff:0x8deaff);}else if(h)h.visible=false;}
  wake+=dt;if(mode==='boat'&&wake>.2){wake=0;wave(p,0xbedde0,3.2,.85);}
 }
 return {sites,markers,wave,shot,horn,update,get stats(){return {shots:shotCount,horns:hornCount,buildings:sites.length,boneyards:BONEYARDS.length,buoys:markers.length,activeWaves:wavePool.filter(w=>w.m.visible).length};}};
}
