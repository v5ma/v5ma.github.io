import * as T from './vendor/three.module.js';
import {R,ring,unit,dot,cross,scale,add,height,water,rand,distance,target,tangent,riverAxis} from './model.mjs';
const V=a=>new T.Vector3(...a),UP=new T.Vector3(0,1,0);
const shape={box:new T.BoxGeometry(1,1,1),ball:new T.IcosahedronGeometry(1,1),cone:new T.ConeGeometry(1,1,7),cyl:new T.CylinderGeometry(1,1,1,9),ring:new T.TorusGeometry(1,.13,7,24)};
const palette=new Map();function tint(s){if(!palette.has(s))palette.set(s,new T.Color(s));return palette.get(s);}
function frame(n,f){const y=V(n),z=V(f||tangent(n,[0,0,1])),x=new T.Vector3().crossVectors(y,z).normalize();return new T.Matrix4().makeBasis(x,y,z);}
class Batch{
 constructor(){this.p=[];this.n=[];this.c=[];this.base=new T.Matrix4();}
 at(n,f,lift=0){this.base=frame(n,f);this.base.setPosition(V(scale(n,R+height(n)+lift)));return this;}
 part(g,x,y,z,sx,sy,sz,col,rx=0,ry=0,rz=0){const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz)).premultiply(this.base),normal=new T.Matrix3().getNormalMatrix(m),p=g.attributes.position,n=g.attributes.normal,ix=g.index,v=new T.Vector3(),vn=new T.Vector3(),c=tint(col);for(let j=0;j<(ix?ix.count:p.count);j++){const i=ix?ix.getX(j):j;v.fromBufferAttribute(p,i).applyMatrix4(m);vn.fromBufferAttribute(n,i).applyMatrix3(normal).normalize();this.p.push(v.x,v.y,v.z);this.n.push(vn.x,vn.y,vn.z);this.c.push(c.r,c.g,c.b);}}
 box(x,y,z,w,h,d,col,ry=0,rz=0){this.part(shape.box,x,y,z,w,h,d,col,0,ry,rz);}
 cone(x,y,z,r,h,col){this.part(shape.cone,x,y,z,r,h,r,col);}
 ball(x,y,z,rx,ry,rz,col){this.part(shape.ball,x,y,z,rx,ry,rz,col);}
 rod(a,b,r,col){const dir=V(b).sub(V(a)),q=new T.Quaternion().setFromUnitVectors(UP,dir.clone().normalize()),e=new T.Euler().setFromQuaternion(q),mid=V(a).add(V(b)).multiplyScalar(.5);this.part(shape.cyl,mid.x,mid.y,mid.z,r,dir.length(),r,col,e.x,e.y,e.z);}
 tri(a,b,c,col){const n=V(b).sub(V(a)).cross(V(c).sub(V(a))).normalize(),rgb=tint(col);for(const p of[a,b,c]){this.p.push(...p);this.n.push(n.x,n.y,n.z);this.c.push(rgb.r,rgb.g,rgb.b);}}
 finish(parent,roughness=.9,metalness=0){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness,metalness}));m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
}
function cottage(b,n,f,kind){b.at(n,f);const main=kind==='post'?'#dfb678':kind==='market'?'#ddb891':'#e5d2a4',roof=kind==='post'?'#2c7365':kind==='pond'?'#518291':'#bc6c40';
 b.box(0,.2,0,4.9,.4,3.9,'#78877a');b.box(0,1.75,0,4.5,3,3.5,main);
 for(const x of[-2.2,0,2.2])b.box(x,1.8,1.79,.17,3.1,.14,'#654d32');for(const y of[.6,2.9])b.box(0,y,1.81,4.6,.14,.15,'#74553a');
 b.box(-1.32,3.72,0,3.02,.26,4.15,roof,0,.61);b.box(1.32,3.72,0,3.02,.26,4.15,roof,0,-.61);b.box(0,4.63,0,.18,.25,4.3,'#cfb780');
 b.box(0,1.14,1.83,.94,2.02,.16,'#426354');b.ball(.30,1.13,1.96,.075,.075,.075,'#f3d076');
 for(const x of[-1.42,1.42]){b.box(x,1.94,1.9,1.04,1.2,.13,'#f4e1b4');b.box(x,1.94,1.99,.81,.97,.07,'#315c62');b.box(x,1.94,2.05,.045,1,.07,'#dfdba9');b.box(x,1.94,2.05,.84,.05,.07,'#dfdba9');b.box(x,1.19,2.03,1.25,.23,.45,'#916343');for(let k=0;k<3;k++)b.ball(x-.35+k*.35,1.43,2.07,.22,.22,.22,k%2?'#f4c764':'#71964c');}
 b.box(0,.4,2.27,3,.27,.85,'#aa9370');b.box(0,.2,2.8,3.3,.18,.45,'#c4aa7c');b.box(-1.3,4.5,-.6,.5,1.7,.6,'#9b846b');b.box(-1.3,5.37,-.6,.72,.13,.8,'#d6cdb5');
 b.rod([1,2.8,2],[1,2.8,2.8],.055,'#483f33');b.box(1,2.42,2.8,.6,.55,.10,'#2c6460');b.box(1,2.42,2.87,.30,.08,.02,'#f3d587');
}
function avatar(parent){const root=new T.Group(),body=new T.Group(),legs=[],arms=[],mat=c=>new T.MeshStandardMaterial({color:c,flatShading:true,roughness:.8});root.add(body);parent.add(root);
 const part=(g,c,x,y,z,sx,sy,sz,to=body)=>{const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;to.add(m);return m;};
 part(shape.box,'#da983a',0,1.12,0,.55,.65,.34);part(shape.ball,'#edc79c',0,1.70,.04,.24,.27,.23);part(shape.ball,'#347b76',0,1.89,0,.29,.16,.28);part(shape.box,'#3f8c80',0,1.85,.22,.35,.06,.26);part(shape.box,'#9b6b42',0,1.16,-.24,.45,.44,.20);part(shape.box,'#f6deb0',0,1.2,-.36,.27,.17,.02);
 for(const x of[-.18,.18]){const g=new T.Group();g.position.set(x,.88,0);body.add(g);part(shape.box,'#31586a',0,-.31,0,.21,.60,.23,g);part(shape.box,'#ecd9b5',0,-.65,.10,.25,.15,.40,g);legs.push(g);const a=new T.Group();a.position.set(x*2,1.38,0);body.add(a);part(shape.box,'#e4c58f',0,-.24,0,.17,.48,.19,a);arms.push(a);}
 const bike=new T.Group();root.add(bike);const bb=new Batch();bb.base.identity();for(const [a,b]of[[[0,.48,-.64],[0,.95,-.06]],[[0,.95,-.06],[0,.47,.10]],[[0,.47,.10],[0,.48,-.64]],[[0,.95,-.06],[0,1.03,.50]],[[0,1.03,.50],[0,.47,.10]],[[0,1.03,.50],[0,.47,.7]]])bb.rod(a,b,.035,'#e4b55b');bb.box(0,1.03,-.1,.22,.08,.34,'#33585b');bb.rod([0,1.03,.50],[0,1.29,.57],.028,'#c8d7cb');bb.rod([-.3,1.29,.57],[.3,1.29,.57],.026,'#456564');bb.finish(bike,.5,.15);
 const wheels=[];for(const z of[-.67,.7]){const w=part(shape.ring,'#213c41',0,.44,z,.38,.38,.38,bike);w.rotation.y=Math.PI/2;wheels.push(w);}root.scale.setScalar(1.15);return {root,body,legs,arms,bike,wheels};
}
export function createScene(canvas,world,state){
 const low=new URLSearchParams(location.search).get('quality')==='low',renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;renderer.shadowMap.enabled=!low;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(44,1,.15,500),planet=new T.Group();scene.add(planet);scene.background=new T.Color('#173b48');
 const hemi=new T.HemisphereLight('#e3f6db','#56707a',1.7),sun=new T.DirectionalLight('#fff0c2',3.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-46,right:46,top:46,bottom:-46,near:1,far:220});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(hemi,sun,sun.target);
 const fill=new T.DirectionalLight('#b4e4f1',1.15);fill.position.set(-40,10,60);scene.add(fill);
 const geo=new T.IcosahedronGeometry(R,5),p=geo.attributes.position,colors=[];
 for(let i=0;i<p.count;i+=3){const ns=[0,1,2].map(k=>unit([p.getX(i+k),p.getY(i+k),p.getZ(i+k)])),center=unit(ns.reduce((a,b)=>add(a,b),[0,0,0])),wet=water(center),c=new T.Color(wet?'#378c91':Math.abs(dot(center,riverAxis))<.075&&Math.abs(center[2])>.075?'#b7b87a':['#6eaa61','#80b366','#75ad60','#83b568','#73a958'][Math.floor(rand(i)*5)]);for(let j=0;j<3;j++){const v=scale(ns[j],R+height(ns[j]));p.setXYZ(i+j,...v);colors.push(c.r,c.g,c.b);}}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));ground.receiveShadow=true;planet.add(ground);
 const sea=new T.Mesh(new T.IcosahedronGeometry(R-.27,5),new T.MeshStandardMaterial({color:'#55c2b2',flatShading:true,roughness:.35,metalness:.1}));planet.add(sea);
 const roads=new Batch(),props=new Batch(),leaves=new Batch(),wood=new Batch(),stone=new Batch();
 function curve(a,b,t){return unit(add(scale(a,1-t),scale(b,t)));}
 // Ribbon vertices are projected onto the same radial ground the rider uses.
 for(const path of world.paths)for(let j=1;j<path.nodes.length;j++){const a=path.nodes[j-1],b=path.nodes[j],count=Math.max(1,Math.ceil(distance(a,b)/.55));for(let i=0;i<count;i++){
  const u=curve(a,b,i/count),v=curve(a,b,(i+1)/count),side=unit(cross(u,unit(add(b,scale(a,-1))))),w=path.width/2/R;
  const point=(n,s)=>{const q=unit(add(n,scale(side,s*w)));return scale(q,R+height(q)+.075);};const q=[point(u,1),point(v,1),point(v,-1),point(u,-1)];roads.tri(q[0],q[2],q[1],'#d8bb79');roads.tri(q[0],q[3],q[2],'#d8bb79');
 }}roads.finish(planet,1);
 for(const t of world.trees){const {n,seed,size}=t;wood.at(n);wood.part(shape.cyl,0,size*.35,0,.22,size*.7,.22,'#82613d');leaves.at(n);if(t.pine){for(let j=0;j<3;j++)leaves.cone(0,size*(.40+j*.19),0,size*(.37-j*.075),size*.55,['#397e5b','#4b9460','#64a566'][j]);}else{for(let j=0;j<5;j++)leaves.ball(Math.sin(j*2.4)*size*.20,size*.63+rand(seed+j)*.65,Math.cos(j*2.4)*size*.2,size*.36,size*.4,size*.35,['#679948','#78aa55','#8fb65c'][j%3]);}}
 for(const r of world.rocks){stone.at(r.n);stone.ball(0,r.size*.42,0,r.size,r.size*.75,r.size*.8,'#a0ada0');}
 for(const {n,size}of world.mountains){stone.at(n);stone.cone(0,size*.42,0,size*.49,size,'#819a8c');stone.cone(0,size*.79,0,size*.22,size*.38,'#e2e9d1');}
 const windmills=[],mailboxes=[],beaconMeshes=[];
 for(const s of world.stops){const toward=tangent(s.house,add(s.n,scale(s.house,-1)));cottage(props,s.house,toward,s.kind);props.at(s.n,tangent(s.n,ring(s.lon+.1,-.065)));props.part(shape.cyl,0,.52,0,.075,1.04,.075,'#7c5b3b');props.box(0,1.16,0,.60,.38,.42,s.delivery?'#c47643':'#397969');props.box(0,1.25,.23,.34,.05,.04,'#ffdfa1');props.box(.38,1.37,0,.07,.38,.08,'#e2ae55');
  const marker=new T.Mesh(new T.TorusGeometry(.5,.045,5,28),new T.MeshBasicMaterial({color:'#ffe0a0'}));const group=new T.Group();group.matrix.copy(frame(s.n,toward));group.matrix.setPosition(V(scale(s.n,R+height(s.n)+1.95)));group.matrixAutoUpdate=false;group.add(marker);planet.add(group);mailboxes.push({s,group,marker});
  for(const side of[-1,1]){props.at(s.house,toward);props.box(side*3.35,.4,1.1,1.4,.8,.8,'#a37844');for(let j=0;j<3;j++)leaves.at(s.house,toward).ball(side*3.35-.45+j*.45,.97,1.1,.32,.32,.30,'#679c4e');}
  if(s.kind==='mill'){const f=frame(s.house,toward),gr=new T.Group();gr.matrix.copy(f);gr.matrix.setPosition(V(scale(s.house,R+height(s.house))));gr.matrixAutoUpdate=false;planet.add(gr);const hub=new T.Group();hub.position.set(0,3.5,2.45);gr.add(hub);for(let i=0;i<4;i++){const arm=new T.Group();arm.rotation.z=i*Math.PI/2;hub.add(arm);const mesh=new T.Mesh(new T.BoxGeometry(.40,2.4,.12),new T.MeshStandardMaterial({color:'#f1d798'}));mesh.position.y=1.2;mesh.castShadow=true;arm.add(mesh);}windmills.push(hub);}
  if(s.kind==='market'){for(const k of[-1,1]){props.at(ring(s.lon+k*.14,-.12),toward);props.box(0,.6,0,2.8,1.2,1.4,'#a66e3d');props.box(0,2.4,0,3.2,.15,2.2,'#d2ab62');for(const x of[-1.3,1.3])props.rod([x,0,.6],[x,2.5,.6],.06,'#805538');for(let j=0;j<5;j++)props.ball(-1+j*.5,1.4,0,.18,.18,.18,j%2?'#e4a044':'#b8543b');}}
  if(s.kind==='lighthouse'||s.kind==='tower'){const n=ring(s.lon,-.37);props.at(n);props.part(shape.cyl,0,3,0,1.3,6,1.3,'#e6d4b0');props.part(shape.cyl,0,4,0,1.32,.65,1.32,'#c87851');props.box(0,6.8,0,1.9,1.5,1.9,'#628d85');props.cone(0,7.8,0,1.7,1.2,'#39796f');}
 }
 for(const lon of[1.3,1.3+Math.PI]){const n=ring(lon),f=tangent(n,ring(lon+.1));props.at(n,f);for(let i=-5;i<=5;i++){props.box(0,.24,-i*.36,3.15,.15,.33,'#ae854f');for(const x of[-1.55,1.55]){if(i%3===0)props.rod([x,.15,-i*.36],[x,1.3,-i*.36],.085,'#82613d');}}for(const x of[-1.55,1.55])props.rod([x,1.05,-2.1],[x,1.05,2.1],.07,'#b78d52');}
 for(const b of world.beacons){props.at(b.n);props.part(shape.cyl,0,.32,0,.7,.65,.7,'#949d7d');props.part(shape.cyl,0,1.3,0,.18,1.6,.18,'#d8b574');const orb=new T.Mesh(new T.IcosahedronGeometry(.40,1),new T.MeshStandardMaterial({color:'#edc876',emissive:'#6b4720',emissiveIntensity:.4}));orb.position.copy(V(scale(b.n,R+height(b.n)+2.35)));planet.add(orb);beaconMeshes.push({b,orb});}
 // Flower patches, fences, flags and little resting places remain off the lane.
 for(let i=0;i<125;i++){const lon=i*.321,lat=i%2?.13:-.30,n=ring(lon,lat);if(water(n)||world.stops.some(s=>distance(n,s.house)<2.8))continue;leaves.at(n);for(let j=0;j<3;j++){const x=(rand(i+j)-.5)*1.1,z=(rand(i*3+j)-.5)*1.1;leaves.ball(x,.25,z,.16,.23,.16,'#5d9659');leaves.ball(x,.46,z,.11,.11,.11,['#f2cc64','#f0ded0','#d57d68'][i%3]);}}
 for(const lon of[.25,1.8,3.3,4.75]){const n=ring(lon,.13);props.at(n);props.box(0,.64,0,2,.16,.60,'#aa7744');for(const x of[-.72,.72])props.box(x,.3,0,.13,.6,.45,'#75593b');props.box(0,1,-.3,2,.6,.12,'#be9156');}
 for(const lon of[-.14,.14]){props.at(ring(lon,-.075));props.part(shape.cyl,0,2.3,0,.085,4.6,.085,'#b48f51');props.box(.45,3.9,0,.9,.60,.04,lon<0?'#c97a49':'#4f927c');}
 for(const [lon,lat]of[[.43,-.23],[.60,-.23],[.78,-.23],[4.88,.22]]){const n=ring(lon,lat);wood.at(n);wood.rod([0,0,0],[0,1.9,0],.14,'#886c46');leaves.at(n);leaves.ball(0,2.2,0,1.2,1.35,1.15,'#88ad4d');for(let i=0;i<5;i++)leaves.ball(Math.sin(i*2.4),2+rand(i)*.9,Math.cos(i*2.4)*.85,.16,.16,.16,'#da854b');}
 props.finish(planet,.83);leaves.finish(planet,1);wood.finish(planet,1);stone.finish(planet,1);
 // Soft faceted cloud clusters encircle the actual globe, with gaps over paths.
 const clouds=new T.Group();scene.add(clouds);const cb=new Batch();for(let i=0;i<14;i++){const n=ring(i*2.399,.35+rand(i)*.6);cb.at(n,null,6+rand(i+5)*3);for(let j=0;j<4;j++)cb.ball((j-1.5)*1.3,rand(i+j)*.55,0,1.5,1.0,1.1,'#e7f1dd');}const cloud=cb.finish(clouds,1);cloud.castShadow=false;cloud.receiveShadow=false;
 const hero=avatar(scene),npcs=world.stops.map((s,i)=>{const a=avatar(planet);a.root.scale.setScalar(.9);a.bike.visible=false;return {a,s};});
 const tokens=new T.InstancedMesh(new T.OctahedronGeometry(.18),new T.MeshStandardMaterial({color:'#f0cb68',emissive:'#916326',emissiveIntensity:.28,metalness:.35,roughness:.36}),world.coins.length);planet.add(tokens);const tm=new T.Matrix4();
 const marker=new T.Mesh(new T.TorusGeometry(.75,.055,5,32),new T.MeshBasicMaterial({color:'#fff1b0'}));scene.add(marker);
 let initialized=false,orbit=0;const camUp=new T.Vector3(),camPos=new T.Vector3(),look=new T.Vector3(),right=new T.Vector3();
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 function update(dt,s,{view=1,lookDelta=0,steer=0,snap=false}={}){
  orbit+=lookDelta;orbit=clampOrbit(orbit);if(!lookDelta)orbit*=Math.exp(-dt*.8);
  const n=V(s.n),f=V(s.f),x=new T.Vector3().crossVectors(n,f).normalize(),basis=new T.Matrix4().makeBasis(x,n,f);hero.root.quaternion.setFromRotationMatrix(basis);hero.root.position.copy(n).multiplyScalar(R+height(s.n)+s.lift);hero.bike.visible=s.mode==='bike';hero.body.position.y=s.mode==='bike'?.48:0;hero.body.rotation.x=s.mode==='bike'?.13:0;
  const pace=s.distance*(s.mode==='bike'?3.3:4.6);hero.legs.forEach((g,i)=>{g.rotation.x=Math.sin(pace+i*Math.PI)*(s.mode==='bike'?.75:.5)*Math.min(1,Math.abs(s.speed));});hero.arms.forEach((g,i)=>{g.rotation.x=s.mode==='bike'?-1.1:-Math.sin(pace+i*Math.PI)*.30*Math.min(1,Math.abs(s.speed));});hero.wheels.forEach(w=>w.rotation.z=-s.distance/.38);
  for(const {a,s:p}of npcs){const nn=ring(p.lon+.047,-.065),ff=tangent(nn,s.n);a.root.position.copy(V(scale(nn,R+height(nn))));a.root.quaternion.setFromRotationMatrix(frame(nn,ff));a.body.rotation.z=Math.sin(s.time*1.5+p.lon)*.03;}
  for(const {s:p,group,marker:m}of mailboxes){m.visible=p.delivery&&!s.delivered.has(p.id);m.rotation.y=s.time*.8;}
  windmills.forEach(w=>w.rotation.z=s.time*.48);beaconMeshes.forEach(({b,orb})=>{orb.material.emissiveIntensity=s.lit.has(b.id)?2:.2;orb.rotation.y=s.time;});
  for(let i=0;i<world.coins.length;i++){const c=world.coins[i],pos=V(scale(c.n,R+height(c.n)+.6+Math.sin(s.time*2+i)*.08));tm.compose(pos,new T.Quaternion().setFromAxisAngle(V(c.n),s.time),new T.Vector3().setScalar(s.collected.has(c.id)?0:1));tokens.setMatrixAt(i,tm);}tokens.instanceMatrix.needsUpdate=true;
  const dest=target(s,world);marker.visible=!s.completed;marker.position.copy(V(scale(dest.n,R+height(dest.n)+.11)));marker.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),V(dest.n));
  // Radial up follows the traveler even beyond the equator and over the poles.
  right.copy(x);const behind=f.clone().multiplyScalar(-Math.cos(orbit)).addScaledVector(x,Math.sin(orbit));const range=[{h:115,d:40,aim:0},{h:76,d:35,aim:17},{h:49,d:19,aim:31}][view];
  camPos.copy(n).multiplyScalar(range.h).addScaledVector(behind,range.d);camUp.copy(n);look.copy(n).multiplyScalar(range.aim).addScaledVector(f,view===2?3:0);
  if(!initialized||snap){camera.position.copy(camPos);camera.up.copy(camUp);initialized=true;}else{camera.position.lerp(camPos,1-Math.exp(-dt*5));camera.up.lerp(camUp,1-Math.exp(-dt*7)).normalize();}camera.lookAt(look);
  sun.position.copy(n).multiplyScalar(95).addScaledVector(x,-40).addScaledVector(f,-48);sun.target.position.copy(n).multiplyScalar(10);hemi.position.copy(n);fill.position.copy(n).multiplyScalar(45).addScaledVector(x,55).addScaledVector(f,30);
  renderer.render(scene,camera);
 }
 function clampOrbit(a){return Math.max(-1.8,Math.min(1.8,a));}
 resize();return {resize,update,renderer,inspect:()=>({planetRadius:R,geometry:ground.geometry.attributes.position.count,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,curvedPaths:world.paths.length,projection:'perspective',lowPower:low})};
}
