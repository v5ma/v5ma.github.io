import * as T from './vendor/three.module.js';
import {material,part,box,bone,ellipsoid,label} from './ranger-art.js';
import {ROADS,seeded,distance} from './ranger-data.js';
import {MAP_RADIUS,LAGOON,inWater,ENCLOSURES,OUTPOSTS,ROUTES,CHECKPOINTS,CRATES,VEHICLES,gatePosition,gateConsole,feederPosition,insidePen,segmentDistance} from './frontier-data.js';
export function expandPark(scene,physics,state){
 const rand=seeded(611206),wood=0x675e49,leaf=0x53775a,steel=0x536d66,o=new T.Object3D();
 scene.fog.near=125;scene.fog.far=410;
 const ground=part(scene,new T.CircleGeometry(MAP_RADIUS,128),0x85956c,0,.001,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 part(scene,new T.CylinderGeometry(MAP_RADIUS,MAP_RADIUS+4,4,128),0xb5a178,0,-2.04,0);
 const lagoon=part(scene,new T.CircleGeometry(1,96),new T.MeshStandardMaterial({color:0x4d949a,metalness:.15,roughness:.32}),LAGOON.x,.16,LAGOON.z,LAGOON.rx,LAGOON.rz,1);lagoon.rotation.x=-Math.PI/2;lagoon.castShadow=false;
 const edge=part(scene,new T.RingGeometry(1,1.04,96),0xc5b891,LAGOON.x,.15,LAGOON.z,LAGOON.rx,LAGOON.rz,1);edge.rotation.x=-Math.PI/2;edge.castShadow=false;
 function ribbon(points,width,color,y=.072){
  // Straight segments match collision-free forest placement and map navigation.
  for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i],len=Math.hypot(bx-ax,bz-az),m=box(scene,color,(ax+bx)/2,y,(az+bz)/2,width,.015,len+1);m.rotation.y=Math.atan2(bx-ax,bz-az);m.castShadow=false;}
  for(const [x,z] of points){const m=part(scene,new T.CircleGeometry(width/2,12),color,x,y+.012,z);m.rotation.x=-Math.PI/2;m.castShadow=false;}
 }
 for(const route of ROUTES){ribbon(route,8.2,0x8b8a65,.06);ribbon(route,6.5,0xc3ac7d,.078);}
 function batch(geo,color,items){if(!items.length)return;const m=new T.InstancedMesh(geo,material(color),items.length);items.forEach((v,i)=>{o.position.set(...v.p);o.scale.set(...v.s);o.rotation.set(...(v.r||[0,0,0]));o.updateMatrix();m.setMatrixAt(i,o.matrix);if(v.c)m.setColorAt(i,new T.Color(v.c));});m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 const allRoads=[...ROADS,...ROUTES],nearRoad=p=>allRoads.some(r=>r.slice(1).some((b,i)=>segmentDistance(p,{x:r[i][0],z:r[i][1]},{x:b[0],z:b[1]})<8.5));
 const trunks=[],crowns=[],shrubs=[],rocks=[];
 for(let i=0;i<1900;i++){
  const a=rand()*6.283,r=94+rand()*208,x=Math.sin(a)*r,z=Math.cos(a)*r,p={x,z};
  if(inWater(p,6)||nearRoad(p)||OUTPOSTS.some(t=>distance(t,p)<17)||VEHICLES.some(v=>distance(v,p)<13)||ENCLOSURES.some(e=>insidePen(p,e,-8)))continue;
  const h=5+rand()*10,s=.32+rand()*.25;trunks.push({p:[x,h/2,z],s:[s,h,s]});physics.cylinder(x,z,s*.8,h/2,h/2);
  for(let j=0;j<3;j++)crowns.push({p:[x+(rand()-.5),h+j*.5,z+(rand()-.5)],s:[2.2-j*.2,1.6,2.3-j*.15],r:[0,rand()*6.28,0],c:[0x537459,0x66865b,0x749664][i%3]});
  if(i%3===0)shrubs.push({p:[x+2,.4,z+1],s:[1.4,.7,1.2],c:0x778d5c});
 }
 for(let i=0;i<130;i++){const a=i/130*Math.PI*2,r=303+rand()*3,s=1+rand()*2;rocks.push({p:[Math.sin(a)*r,.6,Math.cos(a)*r],s:[s,s*.7,s],r:[.3,rand()*6,0]});}
 batch(new T.CylinderGeometry(.65,.85,1,5),wood,trunks);batch(new T.IcosahedronGeometry(1,0),leaf,crowns);batch(new T.IcosahedronGeometry(1,0),0x6f8b59,shrubs);batch(new T.IcosahedronGeometry(1,0),0x84917c,rocks);
 const fencePieces=[],posts=[],pens=[];
 function fence(ax,az,bx,bz){const len=Math.hypot(bx-ax,bz-az),angle=Math.atan2(bx-ax,bz-az),x=(ax+bx)/2,z=(az+bz)/2;
  for(let n=0;n<=Math.ceil(len/4);n++){const k=Math.min(1,n/Math.ceil(len/4));posts.push({p:[ax+(bx-ax)*k,1.85,az+(bz-az)*k],s:[.22,3.7,.22]});}
  for(const y of [.6,1.65,2.7])fencePieces.push({p:[x,y,z],s:[.09,.075,len],r:[0,angle,0]});
  physics.box(x,1.4,z,.12,1.4,len/2,{angle});
 }
 function board(text,x,z,w=7){const g=new T.Group();g.position.set(x,0,z);for(const x of [-w*.4,w*.4])box(g,wood,x,1.1,0,.12,2.2,.14);const sign=label(text,w,1);sign.position.y=1.9;g.add(sign);scene.add(g);return g;}
 for(const e of ENCLOSURES){
  const {x,z,w,d}=e,l=x-w/2,r=x+w/2,t=z-d/2,b=z+d/2;
  const floor=box(scene,e.color,x,.025,z,w-.1,.018,d-.1);floor.castShadow=false;
  fence(l,t,r,t);fence(l,t,l,b);fence(r,t,r,b);fence(l,b,x-6,b);fence(x+6,b,r,b);
  const gate=new T.Group();gate.position.set(x,0,b);scene.add(gate);
  for(const gx of [-3,3]){box(gate,0x748976,gx,1.55,0,5.95,3.1,.18);for(const y of [.35,1.6,2.8])box(gate,0x354a3e,gx,y,.13,5.95,.1,.1);}
  for(const gx of [-6.3,6.3])box(scene,steel,x+gx,2.1,b,.4,4.2,.5);
  const title=label(e.name.toUpperCase(),12,1.1,'#344f43','#efdbac');title.position.set(x,4.35,b);scene.add(title);
  const body=physics.box(x,1.5,b,6,1.5,.22);
  const cp=gateConsole(e),fp=feederPosition(e);
  for(const [p,color,name] of [[cp,0x80c2b0,'GATE / E'],[fp,0xd4b06a,'FEED / E']]){box(scene,0x526257,p.x,.72,p.z,1.1,1.45,.8);box(scene,color,p.x,1.52,p.z,1.18,.13,.88);const b=label(name,2.8,.55);b.position.set(p.x,2.5,p.z);scene.add(b);physics.box(p.x,.6,p.z,.55,.6,.4);}
  // A trough, shallow pool, shade shelter, and observation tower make every habitat usable.
  box(scene,0x615d49,x, .35,z,5,.7,2.6);box(scene,0xabc08a,x,.75,z,4.7,.11,2.3);
  const pool=part(scene,new T.CircleGeometry(4,20),0x659b92,x-w*.25,.09,z-d*.2);pool.rotation.x=-Math.PI/2;pool.castShadow=false;
  const sx=r-8,sz=t+8;for(const dx of [-4,4])for(const dz of [-3,3])box(scene,wood,sx+dx,2.1,sz+dz,.2,4.2,.2);box(scene,0x6b8066,sx,4.3,sz,9,.23,7);
  const tx=l-3,tz=b-8;for(const dx of [-1.2,1.2])for(const dz of [-1.2,1.2])box(scene,wood,tx+dx,2.5,tz+dz,.2,5,.2);box(scene,0xa59773,tx,4.5,tz,3.2,.18,3.2);box(scene,0x466153,tx,6,tz,3.9,.2,3.9);
  for(let i=0;i<9;i++)box(scene,wood,tx+1.4,.35+i*.46,tz+1.5,.65,.09,.16);
  pens.push({data:e,gate,body,slide:state.gates[e.id]?1:0});
 }
 batch(new T.BoxGeometry(1,1,1),steel,posts);batch(new T.BoxGeometry(1,1,1),0x849784,fencePieces);
 const flags=[];
 for(const p of OUTPOSTS){
  if(p.id!=='base'){
   const x=p.x-10,z=p.z;box(scene,0xb19e79,x,1.55,z,8,3.1,6);physics.box(x,1.55,z,4,1.55,3);box(scene,0x3e6251,x,3.4,z,10,.3,8);
   for(const dx of [-2.3,2.3])box(scene,0x63968e,x+dx,1.75,z+3.03,1.45,1.2,.04);
   box(scene,0x546655,x,1.3,z+3.05,1.1,2.6,.08);for(const dx of [-4,4])bone(scene,wood,[x+dx,0,z+6],[x+dx,3.2,z+6],.1);box(scene,0xbeb18d,x,3.22,z+4.4,9,.16,3.4);
   board(p.name.toUpperCase(),p.x,p.z-5,8);
   box(scene,wood,x+9,.5,z-4,3,.2,.9);for(const dx of [-1,1])box(scene,wood,x+9+dx,.25,z-4,.15,.5,.7);
  }
  const ring=part(scene,new T.RingGeometry(4.2,4.5,32),new T.MeshBasicMaterial({color:0x89c6b2,side:T.DoubleSide}),p.x,.12,p.z);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  bone(scene,steel,[p.x+5,0,p.z],[p.x+5,6,p.z],.07);const flag=box(scene,0xd4bd7d,p.x+5.9,5.3,p.z,1.8,.9,.025);flags.push({data:p,mesh:flag});
  const supply=box(scene,0x628c95,p.x+4,1,p.z+3,1.2,2,1.1);physics.box(p.x+4,1,p.z+3,.6,1,.55);const lab=label('REST / REFILL',4,.7);lab.position.set(p.x,1.2,p.z-3);scene.add(lab);
 }
 // Walkable jetties connect land to the launches; boarding also works from their shore ends.
 for(const d of [{x:-144,z:65,w:22,l:3},{x:-208,z:-112,w:3,l:19}]){
  box(scene,0xa79673,d.x,.27,d.z,d.w,.28,d.l);for(const side of [-1,1])for(const end of [-1,1])bone(scene,wood,[d.x+side*d.w*.45,-.5,d.z+end*d.l*.43],[d.x+side*d.w*.45,1.45,d.z+end*d.l*.43],.13);
 }
 board('LAGOON LAUNCH / V TO BOARD',-138,71,9);board('NORTH SHORE / DOCK',-208,-119,8);
 const routes=CHECKPOINTS.map(c=>{const ring=part(scene,new T.TorusGeometry(4,.13,5,32),new T.MeshStandardMaterial({color:0x91d4db,emissive:0x5db0b7,emissiveIntensity:.5}),c.x,2.8,c.z);ring.scale.y=.74;return {data:c,mesh:ring};});
 const crates=CRATES.map(c=>{const g=new T.Group();box(g,0xcf7438,0,0,0,1.3,1.3,1.3);for(const x of [-.45,.45]){const stripe=box(g,0x393f30,x,.01,.665,.16,1.27,.02);stripe.rotation.z=.4;}const icon=label('!',.6,.7,'#d58137','#263a30');icon.position.set(0,0,.68);g.add(icon);scene.add(g);return {...c,mesh:g,body:physics.box(c.x,.8,c.z,.65,.65,.65,{dynamic:true}),spent:false,armedAt:1};});
 board('ROLLOVER YARD / BLAST CRATES',22,44,10);
 const objective=part(scene,new T.RingGeometry(3,3.25,40),new T.MeshBasicMaterial({color:0x8fd7cf,side:T.DoubleSide}),0,.13,0);objective.rotation.x=-Math.PI/2;
 const beacon=part(scene,new T.OctahedronGeometry(.7),new T.MeshStandardMaterial({color:0x98dacf,emissive:0x58b9ad,emissiveIntensity:.5}),0,5,0);
 const particles=[],fx=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:0xffffff}),240);fx.frustumCulled=false;scene.add(fx);
 function burst(p,color,count=24,power=8){for(let i=0;i<count&&particles.length<240;i++)particles.push({x:p.x,y:p.y||1,z:p.z,vx:(rand()-.5)*power,vy:rand()*power*.75,vz:(rand()-.5)*power,age:0,life:.4+rand()*.8,size:.1+rand()*.2,color});}
 const beamGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);const beam=new T.Line(beamGeo,new T.LineBasicMaterial({color:0x87e0ff,transparent:true,opacity:.8}));beam.visible=false;beam.frustumCulled=false;scene.add(beam);
 let beamTime=0;
 function stream(from,to,tool){beamTime=.12;beam.visible=true;beam.material.color.set(tool==='zap'?0xf1df87:0x7ad5f0);const a=beamGeo.attributes.position;a.setXYZ(0,from.x,from.y,from.z);a.setXYZ(1,to.x,to.y,to.z);a.needsUpdate=true;burst(to,tool==='zap'?0xffdca1:0x98e2ed,tool==='zap'?12:2,3);}
 const lureMesh=new T.Group();part(lureMesh,new T.CylinderGeometry(.55,.7,.35,8),0xc7ad67,0,.2,0);const lr=part(lureMesh,new T.RingGeometry(1.4,1.6,32),new T.MeshBasicMaterial({color:0xe5cc80,side:T.DoubleSide}),0,.08,0);lr.rotation.x=-Math.PI/2;lureMesh.visible=false;scene.add(lureMesh);
 function update(dt,time,target,state,lure){
  for(const p of pens){const open=!!state.gates[p.data.id];p.slide+=(Number(open)-p.slide)*Math.min(1,dt*4);p.gate.position.y=p.slide*4.1;p.body.setTranslation({x:p.data.x,y:open?-15:1.5,z:p.data.z+p.data.d/2},true);}
  for(const c of crates){if(!c.spent){c.mesh.position.copy(c.body.translation());c.mesh.quaternion.copy(c.body.rotation());}}
  for(const p of flags)p.mesh.material=material(state.outposts.includes(p.data.id)?0x8ac6aa:0xe1bb6d);
  for(const c of routes)c.mesh.visible=!state.checkpoints.includes(c.data.id)&&distance(c.data,target)<160;
  beamTime-=dt;beam.visible=beamTime>0;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>p.life){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=9*dt;}
  for(let i=0;i<240;i++){const p=particles[i];if(p){o.position.set(p.x,p.y,p.z);o.scale.setScalar(p.size*(1-p.age/p.life));fx.setColorAt(i,new T.Color(p.color));}else{o.position.set(0,-20,0);o.scale.setScalar(0);}o.rotation.set(0,0,0);o.updateMatrix();fx.setMatrixAt(i,o.matrix);}fx.instanceMatrix.needsUpdate=true;if(fx.instanceColor)fx.instanceColor.needsUpdate=true;
  lureMesh.visible=!!lure;if(lure){lureMesh.position.set(lure.x,0,lure.z);lr.scale.setScalar(1+Math.sin(time*3)*.1);}
 }
 return {pens,crates,update,burst,stream,lureMesh,objective,beacon,treeCount:trunks.length};
}
