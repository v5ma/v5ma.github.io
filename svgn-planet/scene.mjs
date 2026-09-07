import * as T from './vendor/three.module.js';
import {RADIUS,WORLD,at,height,point,norm,add,mul,cross,distance,rand,target} from './model.mjs';
import {mesh,anchor,tree,building,mailbox,bridge,avatar,road,batchStatic} from './art.mjs';
export function createScene(canvas){
 const low=new URLSearchParams(location.search).get('quality')==='low';
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=!low;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1,.1,500);scene.background=new T.Color('#123140');
 scene.add(new T.HemisphereLight('#ceeeee','#62786a',1.4));const sun=new T.DirectionalLight('#ffe3af',3.1);sun.position.set(-35,65,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:150});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;scene.add(sun);
 const fill=new T.DirectionalLight('#90cfde',1.2);fill.position.set(30,0,-30);scene.add(fill);
 const root=new T.Group();root.name='Entire walkable spherical world';scene.add(root);
 // Faceted terrestrial mesh, not a disc. Radius is the same function used by
 // foot placement and local gravity, including the shallow traversable river.
 let landGeo=new T.IcosahedronGeometry(RADIUS,32);const pos=landGeo.attributes.position,color=[],c=new T.Color();
 for(let i=0;i<pos.count;i+=3){let avg=[0,0,0];for(let j=0;j<3;j++){const n=norm([pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j)]);avg=add(avg,n);const p=point(n);pos.setXYZ(i+j,...p);}avg=norm(avg);const wet=height(avg)<-.3;const k=rand(i*.003);c.set(wet?'#b9b374':k>.75?'#7eae57':k>.35?'#75a950':'#73a64d');for(let j=0;j<3;j++)color.push(c.r,c.g,c.b);}
 landGeo.setAttribute('color',new T.Float32BufferAttribute(color,3));landGeo.computeVertexNormals();const land=new T.Mesh(landGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));land.receiveShadow=true;root.add(land);
 const sea=new T.Mesh(new T.IcosahedronGeometry(RADIUS-.20,24),new T.MeshStandardMaterial({color:'#48bfc1',roughness:.27,metalness:.12,flatShading:true}));root.add(sea);
 // Narrow circumplanet road: it actually wraps around, with no world boundary.
 const ring=Array.from({length:361},(_,i)=>at((i-180)/180*Math.PI*RADIUS,0));road(root,ring,1.7,'#69877b',.16);
 for(const [a,b] of [[[0,0],[-9,-5]],[[0,0],[9,-10]],[[0,0],[11,6]],[[0,0],[-11,12]],[[0,0],[0,7]]]){
  const p=[];for(let i=0;i<=60;i++){const t=i/60;p.push(at(a[0]+(b[0]-a[0])*t+.7*Math.sin(t*Math.PI),a[1]+(b[1]-a[1])*t));}road(root,p,1.3,'#e4c782',.14);
 }
 for(let x=-60;x<=60;x+=2.6){const g=anchor(root,at(x,0),.19);mesh(g,'box','#cce0b4',[0,0,0],[.6,.035,.07]);}
 const buildings=WORLD.sites.map(s=>({site:s,...building(root,s)})),boxes=WORLD.sites.map(s=>({site:s,...mailbox(root,s)}));bridge(root);
 const grove=new T.Group();root.add(grove);for(const t of WORLD.trees)tree(grove,t);batchStatic(grove);
 for(const r of WORLD.rocks){const g=anchor(root,r.n);const stone=mesh(g,'ball','#9ca68e',[0,r.size*.37,0],[r.size*.55,r.size*.8,r.size*.48],[0,rand(r.size)*3,0]);mesh(g,'cone','#e8e4cb',[0,r.size*.97,0],[r.size*.32,r.size*.48,r.size*.3]);}
 // A small fenced vegetable plot, crates, seating, flowers and stepping stones.
 const plot=anchor(root,at(-5,9));for(let x=-2;x<=2;x+=.5){mesh(plot,'box','#be9763',[x,.35,-1.2],[.10,.7,.10]);mesh(plot,'box','#be9763',[x,.35,1.2],[.10,.7,.10]);}for(const z of[-1.2,1.2])mesh(plot,'box','#edd09a',[0,.53,z],[4.3,.09,.09]);for(let i=0;i<3;i++)for(let k=0;k<7;k++){mesh(plot,'ball',i===0?'#df8c46':i===1?'#78aa5c':'#b288b6',[-1.5+k*.48,.21,-.7+i*.65],[.16,.17,.18]);}
 const flowers=new T.Group();root.add(flowers);
 for(let i=0;i<100;i++){const n=at((rand(i+11)-.5)*35,(rand(i+42)-.5)*30);if(height(n)<-.3||WORLD.sites.some(s=>distance(n,s.n)<2.5))continue;const g=anchor(flowers,n);for(let j=0;j<3;j++)mesh(g,'ball',['#f3d67a','#ecb3c3','#dce3b7'][i%3],[j*.14,.16+rand(i)*.15,rand(j+i)*.3],[.07,.09,.07]);}
 batchStatic(flowers);
 const stamps=WORLD.stars.map(s=>{const g=anchor(root,s.n,.55);const m=mesh(g,'box','#ffe5a0',[0,0,0],[.42,.32,.05],[0,0,.2]);mesh(g,'box','#bb9953',[0,.06,.04],[.25,.02,.01]);return {s,g,m};});
 const courier=avatar(root),residents=[];for(const site of WORLD.sites){const a=avatar(root);a.unicycle.visible=false;a.g.scale.setScalar(.77);residents.push({site,a});}
 // Fluffy low-poly clouds orbit above the sphere and cast no false road shadow.
 const clouds=[];for(let i=0;i<12;i++){const n=at((rand(i+8)-.5)*100,(rand(i+38)-.5)*38),g=anchor(root,n,4.7+rand(i)*2);for(let j=0;j<5;j++){const m=mesh(g,'ball','#e1eece',[(j-2)*.58,Math.sin(j)*.15,rand(j+i)*.32],[.8,.48+rand(j)*.24,.62]);m.castShadow=false;m.receiveShadow=false;}clouds.push({g,n,offset:i});}
 const starsGeo=new T.BufferGeometry(),coords=[];for(let i=0;i<200;i++){const theta=rand(i)*6.28,u=rand(i+93)*2-1;coords.push(150*Math.sqrt(1-u*u)*Math.cos(theta),150*u,150*Math.sqrt(1-u*u)*Math.sin(theta));}starsGeo.setAttribute('position',new T.Float32BufferAttribute(coords,3));scene.add(new T.Points(starsGeo,new T.PointsMaterial({color:'#aacacf',size:.18,transparent:true,opacity:.45})));
 const moon=mesh(scene,'ball','#8aada4',[-55,22,-62],[4.5,4.5,4.5]);moon.castShadow=false;
 const targetRing=new T.Mesh(new T.TorusGeometry(.75,.05,6,32),new T.MeshBasicMaterial({color:'#ffe8a8'}));targetRing.rotation.x=-Math.PI/2;const ringAnchor=new T.Group();root.add(ringAnchor);ringAnchor.add(targetRing);
 const footprint=new T.Mesh(new T.CircleGeometry(.42,24),new T.MeshBasicMaterial({color:'#183c37',transparent:true,opacity:.22,depthWrite:false}));footprint.rotation.x=-Math.PI/2;const footRoot=new T.Group();root.add(footRoot);footRoot.add(footprint);
 let far=1,orbit=0,camReady=false;const defaultDistance=90,up=new T.Vector3(),behind=new T.Vector3(),position=new T.Vector3(),north=new T.Vector3();
 function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
 function setCamera(kind){far=kind==='close'?.55:kind==='wide'?1.16:1;}
 function orbitBy(v){orbit+=v;}
 function movementBasis(s){const north=s.north,east=cross(north,s.n),forward=add(mul(north,Math.cos(orbit)),mul(east,-Math.sin(orbit)));return {forward,right:cross(forward,s.n)};}
 function update(dt,s,{snap=false,menu=false}={}){
  if(menu)orbit+=dt*.035;
  const n=new T.Vector3(...s.n),f=new T.Vector3(...s.facing),right=new T.Vector3().crossVectors(f,n).normalize(),back=f.clone().negate();const frame=new T.Matrix4().makeBasis(right,n,back);
  courier.g.position.set(...point(s.n,s.lift+.04));courier.g.quaternion.setFromRotationMatrix(frame);courier.unicycle.visible=s.ride;courier.body.position.y=s.ride?.23:-.26;courier.wheel.rotation.x+=s.speed*dt*2;courier.legs.forEach((l,i)=>l.rotation.x=s.ride?.14:Math.sin(s.time*11+i*Math.PI)*Math.min(.65,s.speed*.14));
  footRoot.position.set(...point(s.n,.075));footRoot.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);footprint.material.opacity=.24/(1+s.lift);
  for(const b of buildings)if(b.wheel)b.wheel.rotation.x+=dt*.8;
  for(const b of boxes){b.flag.material.color.set(s.delivered.has(b.site.id)?'#70c5a4':'#eaa44f');b.flag.rotation.z=s.delivered.has(b.site.id)?Math.PI/2:0;}
  stamps.forEach(({g,m,s:star},i)=>{g.visible=!s.stamps.has(star.id);m.rotation.y=s.time*.8+i;m.position.y=Math.sin(s.time*2+i)*.1;});
  residents.forEach(({site,a},i)=>{const p=anchorPosition(site,i,s.time);a.g.position.set(...point(p));a.g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...p));a.g.rotateY(s.time*.08+i);a.legs.forEach((l,j)=>l.rotation.x=Math.sin(s.time*3+i+j*3.14)*.12);});
  clouds.forEach(({g,n,offset})=>{const spin=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.sin(s.time*.035+offset)*.045);const nn=new T.Vector3(...n).applyQuaternion(spin);g.position.copy(nn).multiplyScalar(RADIUS+5.5);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),nn);});
  const dest=target(s);ringAnchor.visible=!s.complete;if(dest){ringAnchor.position.set(...point(dest.mail,.07));ringAnchor.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...dest.mail));targetRing.scale.setScalar(1+Math.sin(s.time*3)*.06);}
  const basis=movementBasis(s);up.copy(n);north.set(...basis.forward);behind.copy(north).negate();const widthComp=far<.8?Math.sqrt(1/Math.min(camera.aspect,1)):1/Math.min(camera.aspect,1);
  const length=defaultDistance*far*widthComp;position.copy(n).multiplyScalar(length*.86).addScaledVector(behind,length*.46);
  if(!camReady||snap){camera.position.copy(position);camera.up.copy(up);camReady=true;}else{camera.position.lerp(position,1-Math.exp(-dt*7));camera.up.lerp(up,1-Math.exp(-dt*7)).normalize();}
  const aim=far<.8?n.clone().multiplyScalar(RADIUS*.75):new T.Vector3(0,0,0);camera.lookAt(aim);camera.updateMatrixWorld();
  // Light follows the visible hemisphere, retaining warm-key / cool-fill depth.
  sun.position.copy(n).multiplyScalar(70).addScaledVector(new T.Vector3(...basis.right),-38).addScaledVector(behind,35);
  renderer.render(scene,camera);
 }
 function anchorPosition(site,i,time){const n=site.n,side=cross([0,0,1],n);return norm(add(n,mul(norm(side),(.105+Math.sin(time*.3+i)*.007))));}
 resize();return {update,resize,setCamera,orbitBy,movementBasis,renderer,scene,camera,inspect:()=>({triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,camera:camera.position.toArray(),radius:RADIUS,webgl:!!renderer.getContext(),low})};
}
