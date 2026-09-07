import * as T from '../vendor/three.module.js';
import {RADIUS,elevation,position,surfaceRadius,ringPoint,ringHeading,waterAt} from './world.mjs';
import {at,hash,tangent,projected,unit,mul,add,sub,cross,rotate,angle} from './math.mjs';
import {target,phase} from './model.mjs';
const V=a=>new T.Vector3(...a);
const shape={box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,7),trunk:new T.CylinderGeometry(1,1,1,7),rock:new T.IcosahedronGeometry(1,0),ball:new T.IcosahedronGeometry(1,1),ring:new T.TorusGeometry(1,.12,6,24)};
function frame(n,f=tangent(n),alt=0){const right=unit(cross(f,n)),back=mul(f,-1),m=new T.Matrix4().makeBasis(V(right),V(n),V(back));m.setPosition(V(position(n,alt)));return m;}
class Batch {
 constructor(){this.p=[];this.c=[];}
 put(g,base,p,scale,color,rot=[0,0,0]){const q=new T.Quaternion().setFromEuler(new T.Euler(...rot)),mat=new T.Matrix4().compose(V(p),q,V(scale));mat.premultiply(base);const a=g.attributes.position,index=g.index,v=new T.Vector3(),c=new T.Color(color);
 for(let i=0;i<(index?index.count:a.count);i++){const k=index?index.getX(i):i;v.fromBufferAttribute(a,k).applyMatrix4(mat);this.p.push(v.x,v.y,v.z);this.c.push(c.r,c.g,c.b);}}
 box(b,p,s,c,r){this.put(shape.box,b,p,s,c,r);}cone(b,p,s,c,r){this.put(shape.cone,b,p,s,c,r);}rock(b,p,s,c,r){this.put(shape.rock,b,p,s,c,r);}
 rod(base,a,b,r,c){const d=V(b).sub(V(a)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()),m=new T.Matrix4().compose(V(a).add(V(b)).multiplyScalar(.5),q,new T.Vector3(r,d.length(),r));m.premultiply(base);this.put(shape.trunk,m,[0,0,0],[1,1,1],c);}
 finish(parent,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.94,flatShading:true}));mesh.castShadow=mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
}
function ribbon(points,width,color,lift=.09){const vertices=[],normals=[],indices=[];
 for(let i=0;i<points.length;i++){const n=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],f=projected(sub(next,prev),n),side=unit(cross(f,n));
 for(const sign of[-1,1]){const p=unit(add(n,mul(side,sign*width/2/RADIUS))),v=position(p,lift);vertices.push(...v);normals.push(...p);}}
 for(let i=0;i<points.length-1;i++){const k=i*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setIndex(indices);const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.95,side:T.DoubleSide}));mesh.receiveShadow=true;return mesh;
}
function label(text,width=3,bg='#233e43',fg='#f9e6bb'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,128);c.fillStyle=fg;c.font='bold 50px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,65,480);const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshStandardMaterial({map:tx,side:T.DoubleSide,roughness:1}));}
function cottage(batch,h){const f=projected(sub(ringPoint(h.u),h.n),h.n),b=frame(h.n,f),w=h.kind==='newsroom'?5.2:4,d=h.kind==='tower'?3.5:3.4,height=h.kind==='tower'?5.1:2.6;
 const wall=h.kind==='newsroom'?'#debc75':['#dbc592','#9fbca2','#dcbdb0','#b6c9b0'][h.color],roof=h.kind==='newsroom'?'#356b68':['#bd642e','#738769','#d28a3d','#658584'][h.color];
 batch.box(b,[0,.15,0],[w+.5,.30,d+.5],'#aaa77e');batch.box(b,[0,height/2+.3,0],[w,height,d],wall);
 // Roof is an actual pair of planes with a ridge, rather than a cube cap.
 const tilt=.57,half=w/2+.3,slant=half/Math.cos(tilt);
 batch.box(b,[-half/2,height+.8,0],[slant,.24,d+.6],roof,[0,0,tilt]);batch.box(b,[half/2,height+.8,0],[slant,.24,d+.6],roof,[0,0,-tilt]);
 batch.box(b,[0,height+1.4,0],[.20,.18,d+.7],roof);
 for(const x of[-w/2,w/2])batch.box(b,[x,height/2+.32,-d/2-.03],[.15,height,.15],'#f2deb3');
 batch.box(b,[0,1.0,-d/2-.075],[.9,1.65,.17],'#385d60');batch.box(b,[.25,.95,-d/2-.18],[.08,.08,.07],'#ebc46b');
 for(const x of[-1.3,1.3])for(const y of(h.kind==='tower'?[1.5,3.5]:[1.6])){batch.box(b,[x,y,-d/2-.055],[.99,1.10,.16],'#f0ddb7');batch.box(b,[x,y,-d/2-.145],[.73,.81,.06],'#31565c');batch.box(b,[x,y,-d/2-.19],[.06,.88,.04],'#ceb98e');batch.box(b,[x,y,-d/2-.19],[.82,.06,.04],'#ceb98e');}
 for(const x of[-w/2-.02,w/2+.02])for(const z of[-.7,.7]){batch.box(b,[x,1.6,z],[.08,.85,.74],'#eff0ca');batch.box(b,[x*1.015,1.6,z],[.08,.66,.58],'#3f7372');}
 batch.box(b,[0,.25,-d/2-.7],[2.7,.25,1.4],'#cdb78f');batch.box(b,[0,.10,-d/2-1.3],[1.5,.20,.5],'#c8b78e');
 for(const x of[-1.22,1.22])batch.box(b,[x,1.30,-d/2-1.16],[.12,2.1,.12],'#e2d0a6');
 batch.box(b,[0,2.45,-d/2-.65],[2.9,.16,1.8],roof,[.13,0,0]);batch.box(b,[1,height+1.8,.7],[.50,1.2,.6],'#9f7865');
 if(h.kind==='tower'){batch.box(b,[0,height+2,0],[1,1.8,1],wall);batch.cone(b,[0,height+3.15,0],[.95,1.1,.95],'#2c686a');}
 if(h.kind==='cabin')for(let y=.6;y<height;y+=.28)batch.box(b,[0,y,d/2+.04],[w+.1,.10,.12],'#ad8351');
 return {b,f};
}
function tree(batch,t){const b=frame(t.n),s=t.size;
 batch.rod(b,[0,0,0],[0,s*.65,0],.15,'#8b7450');
 if(t.pine){batch.cone(b,[0,s*.44,0],[s*.34,s*.75,s*.34],['#2e7752','#3d9263','#548e54'][t.seed%3]);batch.cone(b,[0,s*.74,0],[s*.26,s*.62,s*.26],['#448b53','#64a668','#377651'][t.seed%3]);}
 else for(let i=0;i<5;i++){const a=i*2.4,dx=Math.cos(a)*s*.19,dz=Math.sin(a)*s*.17;batch.rod(b,[0,s*.35,0],[dx,s*.68,dz],.07,'#a28a58');batch.put(shape.ball,b,[dx,s*(.65+hash(t.seed+i)*.14),dz],[s*.30,s*.27,s*.29],['#6f9c4d','#86aa56','#54853e','#9cb757'][i%4]);}
}
function bike(){const root=new T.Group(),b=new Batch(),I=new T.Matrix4(),wheel=[];
 for(const z of[-.53,.53]){const g=new T.Group();g.position.set(0,.34,z);root.add(g);const a=new Batch();a.put(shape.ring,I,[0,0,0],[.29,.29,.29],'#283d45',[0,Math.PI/2,0]);for(let i=0;i<6;i++)a.rod(I,[0,0,0],[0,Math.sin(i*Math.PI/3)*.26,Math.cos(i*Math.PI/3)*.26],.014,'#d8d6b2');a.finish(g,'Wheel');wheel.push(g);}
 for(const [a,c]of[[[0,.34,.53],[0,.77,.12]],[[0,.77,.12],[0,.40,-.08]],[[0,.40,-.08],[0,.34,.53]],[[0,.77,.12],[0,.86,-.42]],[[0,.86,-.42],[0,.40,-.08]],[[0,.86,-.42],[0,.34,-.53]]])b.rod(I,a,c,.035,'#eea03e');
 b.box(I,[0,.83,.1],[.26,.07,.26],'#394a4b');b.rod(I,[0,.86,-.42],[0,1.02,-.48],.03,'#e8d9ae');b.rod(I,[-.26,1.03,-.48],[.26,1.03,-.48],.028,'#315858');b.box(I,[0,.87,.62],[.38,.32,.34],'#c29352');b.box(I,[0,1.05,.62],[.30,.06,.28],'#f2e4bd');b.finish(root,'SVGN courier bicycle');return {root,wheel};
}
function person(){const root=new T.Group(),b=new Batch(),I=new T.Matrix4(),legs=[];b.box(I,[0,1.07,0],[.39,.43,.26],'#dca13f');b.box(I,[0,1.08,.21],[.33,.40,.16],'#a8683e');b.put(shape.ball,I,[0,1.51,0],[.20,.22,.19],'#d4a078');b.put(shape.ball,I,[0,1.66,.02],[.23,.12,.22],'#294f5b');b.box(I,[0,1.66,-.17],[.29,.035,.20],'#2f5a63');b.rod(I,[-.22,1.24,0],[-.26,.88,-.31],.06,'#d4a078');b.rod(I,[.22,1.24,0],[.26,.88,-.31],.06,'#d4a078');b.finish(root,'Courier');
 for(const x of[-.11,.11]){const g=new T.Group();g.position.set(x,.87,0);root.add(g);const l=new Batch();l.box(I,[0,-.24,0],[.15,.46,.16],'#355965');l.box(I,[0,-.51,-.02],[.12,.20,.13],'#c28e69');l.box(I,[0,-.65,-.10],[.17,.10,.29],'#f0dcb1');l.finish(g,'Animated leg');legs.push(g);}return {root,legs};}
function car(){const root=new T.Group(),b=new Batch(),I=new T.Matrix4(),wheels=[];b.box(I,[0,.48,0],[1.2,.47,2.3],'#e1a145');b.box(I,[0,.91,.05],[1.03,.52,1.28],'#d7983d');b.box(I,[0,1.19,.07],[1.12,.12,1.45],'#ead1a0');b.box(I,[0,.97,-.60],[.91,.37,.06],'#395d68');b.box(I,[0,.96,.71],[.91,.34,.05],'#3c6372');for(const x of[-.62,.62]){b.box(I,[x,.99,.03],[.035,.32,1.03],'#3f6b73');for(const z of[-.74,.76]){const g=new T.Group();g.position.set(x,.3,z);root.add(g);const a=new Batch();a.put(shape.trunk,I,[0,0,0],[.26,.17,.26],'#2b3e46',[0,0,Math.PI/2]);a.finish(g,'Car wheel');wheels.push(g);}}
 for(const x of[-.39,.39])b.box(I,[x,.53,-1.17],[.28,.15,.035],'#f8e3ad');b.finish(root,'SVGN press hatchback');return {root,wheels};}
function deer(){const root=new T.Group(),b=new Batch(),I=new T.Matrix4();b.rock(I,[0,.84,0],[.38,.36,.63],'#b18b57');b.rod(I,[0,.92,-.3],[0,1.32,-.54],.12,'#b99763');b.rock(I,[0,1.4,-.58],[.19,.27,.27],'#c2a16b');for(const x of[-.16,.16])for(const z of[-.32,.33])b.rod(I,[x,.85,z],[x,.12,z],.055,'#bca675');for(const x of[-.14,.14]){b.cone(I,[x,1.67,-.48],[.065,.32,.10],'#826c4b',[0,0,x*2]);b.rod(I,[x,1.55,-.65],[x*1.7,1.92,-.58],.026,'#d2c399');}b.finish(root,'Grove deer');return root;}
export function makeScene(canvas,world,state,{low=false}={}){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;renderer.shadowMap.enabled=!low;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(44,1,.1,550),light=new T.DirectionalLight('#fff1cb',3.15);light.position.set(-40,85,70);light.castShadow=true;Object.assign(light.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:190});light.shadow.mapSize.set(2048,2048);light.shadow.normalBias=.04;scene.add(light);scene.add(new T.AmbientLight('#b4d9d9',1.27));const fill=new T.DirectionalLight('#9cbccf',.7);fill.position.set(0,-40,-70);scene.add(fill);
 const group=new T.Group();group.name='True spherical world';scene.add(group);
 const ico=new T.IcosahedronGeometry(1,5),attr=ico.attributes.position,colors=[];for(let i=0;i<attr.count;i++){const n=unit([attr.getX(i),attr.getY(i),attr.getZ(i)]),p=mul(n,RADIUS+elevation(n));attr.setXYZ(i,...p);const h=hash(Math.floor(i/3)*.937),c=new T.Color(['#76a454','#7ca958','#86ad5d','#6d9951','#8caf65'][Math.floor(h*5)]);colors.push(c.r,c.g,c.b);}ico.setAttribute('color',new T.Float32BufferAttribute(colors,3));ico.computeVertexNormals();const ground=new T.Mesh(ico,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));ground.name='Spherical terrain';ground.receiveShadow=true;group.add(ground);
 const sea=new T.Mesh(new T.IcosahedronGeometry(RADIUS+.061,4),new T.MeshStandardMaterial({color:'#50b6b3',roughness:.60,flatShading:true}));sea.name='Curved bay';group.add(sea);
 group.add(ribbon(world.ring,4.1,'#c9b580',.035),ribbon(world.ring,3.2,'#566d61',.072));
 for(let i=0;i<110;i++){const u=i/110*Math.PI*2;group.add(ribbon([ringPoint(u),ringPoint(u+.018)],.055,'#d8cf91',.089));}
 for(const path of world.trails)group.add(ribbon(path.points,path.width+.5,'#87a35a',.04),ribbon(path.points,path.width,'#caba7a',.095));
 group.add(ribbon(world.river,1.6,'#a3c795',.06),ribbon(world.river,1.15,'#55c4ba',.11));
 const props=new Batch(),foliage=new Batch();
 for(const home of world.homes){const {b,f}=cottage(props,home);const end=unit(add(home.n,mul(f,home.size/RADIUS)));group.add(ribbon([end,ringPoint(home.u)],1.08,'#d3c18c',.13));
  if(home.kind==='newsroom'){const text=label('SVGN CITY',3.8);text.position.set(0,2.8,-2.21);const o=new T.Group();o.matrix.copy(b);o.matrixAutoUpdate=false;o.add(text);group.add(o);}
  if(home.kind==='home')for(const side of[-1,1])for(let j=0;j<8;j++){const z=-2.35+j*.65;props.box(b,[side*2.68,.41,z],[.12,.75,.16],'#d2d3a5');if(j<7)props.box(b,[side*2.68,.58,z+.32],[.07,.09,.60],'#c1c493');}
 }
 for(const treeData of world.trees)tree(foliage,treeData);
 for(const mountain of world.mountains){const b=frame(mountain.n);props.cone(b,[0,mountain.h/2,0],[mountain.r,mountain.h,mountain.r*.84],'#889386',[0,.33,0]);props.cone(b,[0,mountain.h*.86,0],[mountain.r*.30,mountain.h*.32,mountain.r*.27],'#d1d7b9',[0,.33,0]);}
 const bn=ringPoint(world.bridgeU),bf=projected(ringHeading(world.bridgeU),bn),bridge=frame(bn,bf);
 for(let z=-1.8;z<=1.8;z+=.3)props.box(bridge,[0,.12,z],[3.5,.14,.22],'#b69251');
 for(const x of[-1.8,1.8]){for(const z of[-1.8,0,1.8])props.box(bridge,[x,.65,z],[.14,1.3,.14],'#b79557');props.rod(bridge,[x,1.18,-1.8],[x,1.18,1.8],.055,'#c8ab69');}
 for(const l of world.lamps){const b=frame(l.n,l.f);props.rod(b,[0,0,0],[0,2.8,0],.048,'#4a7166');props.box(b,[0,2.9,0],[.30,.24,.30],'#e6d59c');props.cone(b,[0,3.1,0],[.28,.28,.28],'#4b7162');}
 const relayFrame=frame(world.relay.n),relayModel=new T.Group();relayModel.matrixAutoUpdate=false;relayModel.matrix.copy(relayFrame);group.add(relayModel);const b=new Batch();b.box(new T.Matrix4(),[0,1,0],[1.2,2,.8],'#43685f');b.box(new T.Matrix4(),[0,1.12,-.46],[.88,.62,.07],'#83dace');b.rod(new T.Matrix4(),[0,2,0],[0,4.1,0],.05,'#a9b895');b.put(shape.ring,new T.Matrix4(),[0,3.7,0],[.47,.47,.47],'#ebc97c');b.finish(relayModel,'Fictional grove relay');
 // Sparse flowers and stone pebbles keep the globe readable at orbit scale.
 for(let i=0;i<160;i++){const n=at(hash(i+806)*6.28-3.14,Math.asin(hash(i+91)*1.8-.9));if(waterAt(n))continue;const b=frame(n);props.rock(b,[0,.13,0],[.12,.18,.14],i%3?'#d6c87b':'#ede2b0');}
 props.finish(group,'Houses, bridges, mountains and radial street details');foliage.finish(group,'Pines and leafy garden trees');
 const postModels=world.posts.map(p=>{const g=new T.Group();g.matrixAutoUpdate=false;g.matrix.copy(frame(p.n));const b=new Batch(),I=new T.Matrix4();b.rod(I,[0,0,0],[0,1.25,0],.067,'#bba176');b.box(I,[0,1.30,0],[.58,.42,.50],'#d88540');b.finish(g,'Mailbox');const flag=new T.Mesh(new T.BoxGeometry(.31,.23,.05),new T.MeshStandardMaterial({color:'#e8c568'}));flag.position.set(.3,1.60,0);g.add(flag);group.add(g);return {g,flag};});
 const bikeModel=bike(),personModel=person(),carModel=car();scene.add(bikeModel.root,personModel.root,carModel.root);
 const deerModels=world.animals.map(()=>{const d=deer();scene.add(d);return d;});
 const clouds=[];for(let i=0;i<14;i++){const root=new T.Group(),b=new Batch(),I=new T.Matrix4();for(let j=0;j<4;j++)b.put(shape.ball,I,[(j-1.5)*.95,.3*Math.sin(j),0],[1.35,1,1.03],'#d5e2d4');const mesh=b.finish(root,'Slow drifting cloud');mesh.castShadow=false;mesh.receiveShadow=false;scene.add(root);clouds.push(root);}
 const marker=new T.Group(),ring=new T.Mesh(new T.TorusGeometry(.82,.06,6,32),new T.MeshBasicMaterial({color:'#ffe1a1'}));ring.rotation.x=Math.PI/2;marker.add(ring);const needle=new T.Mesh(new T.OctahedronGeometry(.27),new T.MeshBasicMaterial({color:'#ffe1a1'}));needle.position.y=2;marker.add(needle);scene.add(marker);
 const papers=[];for(let i=0;i<8;i++){const p=new T.Mesh(new T.BoxGeometry(.22,.035,.30),new T.MeshStandardMaterial({color:'#fff0c8'}));p.visible=false;scene.add(p);papers.push(p);}
 let zoom=1,zoomTarget=1,orbit=.05,tilt=.44,initialized=false,menu=true,cameraMode='planet';const currentView=new T.Quaternion();
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,low?1:1.5),cap=low?900000:1800000;const r=Math.min(ratio,Math.sqrt(cap/(w*h)));renderer.setSize(Math.max(1,Math.round(w*r)),Math.max(1,Math.round(h*r)),false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function setMode(m){cameraMode=m;zoomTarget=m==='street'?0:m==='neighborhood'?.37:1;}
 function scroll(d){zoomTarget=T.MathUtils.clamp(zoomTarget+d*.0012,0,1);cameraMode=zoomTarget>.8?'planet':zoomTarget<.18?'street':'neighborhood';return cameraMode;}
 function drag(dx,dy){orbit-=dx*.005;tilt=T.MathUtils.clamp(tilt+dy*.003,.03,.88);}
 function pose(root,n,f,alt=0){const matrix=frame(n,f,alt);root.position.setFromMatrixPosition(matrix);root.quaternion.setFromRotationMatrix(matrix);}
 function render(dt,s,{menuVisible=false}={}){
  menu=menuVisible;zoom=T.MathUtils.lerp(zoom,zoomTarget,1-Math.exp(-dt*5));const n=s.n,f=s.f,right=unit(cross(f,n)),local=new T.Matrix4().makeBasis(V(right),V(n),V(mul(f,-1))),q=new T.Quaternion().setFromRotationMatrix(local);
  if(!initialized){currentView.copy(q);initialized=true;}else currentView.slerp(q,1-Math.exp(-dt*7));
  const nn=new T.Vector3(0,1,0).applyQuaternion(currentView),ff=new T.Vector3(0,0,-1).applyQuaternion(currentView),rr=new T.Vector3(1,0,0).applyQuaternion(currentView);
  const facing=ff.clone().multiplyScalar(Math.cos(orbit)).addScaledVector(rr,Math.sin(orbit)),look=facing.clone().multiplyScalar(3*(1-zoom));look.addScaledVector(nn,(RADIUS+1.2)*(1-zoom));
  const normalView=nn.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(facing,-Math.sin(tilt)).normalize();const planetDist=RADIUS*(camera.aspect<.85?4.3:3.45);
  const cam=nn.clone().multiplyScalar(surfaceRadius(n)+4+s.alt*.65).addScaledVector(facing,-7.5);cam.lerp(normalView.multiplyScalar(planetDist),zoom);
  if(menu&&camera.aspect>1.3)look.addScaledVector(rr,-8*zoom);
  camera.position.copy(cam);camera.up.copy(nn);camera.lookAt(look);camera.updateMatrixWorld();
  pose(bikeModel.root,s.vehicle.bike.n,s.vehicle.bike.f,s.mode==='bike'?s.alt:0);pose(carModel.root,s.vehicle.car.n,s.vehicle.car.f,s.mode==='car'?s.alt:0);
  pose(personModel.root,s.n,s.f,s.alt+(s.mode==='bike'?.20:0));personModel.root.visible=s.mode!=='car';
  for(let i=0;i<2;i++)personModel.legs[i].rotation.x=Math.sin((s.mode==='bike'?s.distance*4:s.time*9)+i*Math.PI)*Math.min(.58,Math.abs(s.speed)*.15);
  if(s.mode==='bike')for(const wheel of bikeModel.wheel)wheel.rotation.x+=s.speed*dt/.29;
  if(s.mode==='car')for(const wheel of carModel.wheels)wheel.rotation.x+=s.speed*dt/.26;
  for(let i=0;i<world.animals.length;i++){const a=world.animals[i],v=s.time*.08+a.phase,n2=unit(add(a.base,mul(tangent(a.base),Math.sin(v)*.07)));pose(deerModels[i],n2,projected(tangent(n2),n2));deerModels[i].rotation.z+=Math.sin(s.time*3+i)*.012;}
  clouds.forEach((root,i)=>{const n2=at(i*2.4+s.time*.005,Math.sin(i*3.1)*.88);pose(root,n2,tangent(n2),9+hash(i+7)*5);});
  const goal=target(s,world);pose(marker,goal.n,tangent(goal.n),.1);needle.position.y=2.1+Math.sin(s.time*2)*.2;needle.rotation.y+=dt;ring.scale.setScalar(1+Math.sin(s.time*2)*.07);
  postModels.forEach(({flag},i)=>flag.visible=!s.delivered.has(world.posts[i].id));
  papers.forEach((mesh,i)=>{const p=s.shots[i];mesh.visible=!!p;if(p){mesh.position.copy(V(p.p));mesh.rotation.set(s.time*7,s.time*5,s.time*6);}});
  renderer.render(scene,camera);
 }
 resize();render(.016,state,{menuVisible:true});
 return {render,resize,setMode,scroll,drag,get mode(){return cameraMode;},inspect:()=>({threeD:true,worldKind:'sphere',radius:RADIUS,planetVisible:true,view:cameraMode,camera:camera.position.toArray(),cameraUp:camera.up.toArray(),triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries}),dispose:()=>renderer.dispose()};
}
