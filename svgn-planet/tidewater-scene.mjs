import * as T from './vendor/three.module.js';
import {street,point,norm,add,mul,distance,localPosition} from './world.mjs';
import {BASINS,TIDEWATER,WATER_LOOP,waterLocal,basinAt} from './tidewater-layout.mjs';
import {waterTarget,waterJob} from './tidewater-core.mjs';
import {mesh,anchor,batchStatic,faceSurface} from './neighborhood.mjs';
import {road} from './art.mjs';
import {patchBasinShader} from './tidewater-shaders.mjs';
export function createTidewater({root,courier,jewel,sun}){
 const district=new T.Group();district.name='Tidewater / playable pool and marina';root.add(district);
 const center=street(-88,73),staticArt=new T.Group();district.add(staticArt);
 const waterMeshes=[],buoys=[],debris=[],lit=[];let visible=false,lastWake=-100,events=new WeakSet(),impulseCount=0;
 const white='#e2dbc7',teal='#32767c',wood='#9e7854',ink='#24444e',metal='#bdcbc5';
 function item(shape,c,n,pos,size,group=staticArt,rotation){const g=anchor(group,n);return mesh(g,shape,c,pos,size,rotation);}
 function path(points,width=3.8,color='#b7ae97',lift=.23,parent=staticArt){const n=[];for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],steps=Math.max(2,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/2));for(let i=0;i<steps;i++)n.push(street(a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps));}n.push(street(...points.at(-1)));return road(parent,n,width,color,lift);}
 function sign(text,t,x,width=3.5,y=2.3,angle=Math.PI,parent=staticArt){const c=document.createElement('canvas');c.width=768;c.height=192;const q=c.getContext('2d');q.fillStyle='#173e4b';q.fillRect(0,0,c.width,c.height);q.strokeStyle='#bfaa79';q.lineWidth=6;q.strokeRect(8,8,752,176);q.fillStyle='#f4e8c8';q.textAlign='center';q.font='600 47px system-ui';const lines=text.split('|');lines.forEach((v,i)=>q.fillText(v,384,lines.length===1?115:77+i*66,710));const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const g=anchor(parent,street(t,x));g.rotation.y+=angle;const m=new T.Mesh(new T.PlaneGeometry(width,width*.25),new T.MeshStandardMaterial({map:tex,roughness:.78,side:T.DoubleSide}));m.position.y=y;g.add(m);return g;}
 path(WATER_LOOP,4.8,'#aab3ab');path([[-40,0],[-40,25]],5.2,'#637773');
 for(const x of[22.3,27.7])path([[-42,x],[-140,x]],.13,'#e3d5ac',.27);
 // Walking decks sit above existing terrain; the shader refracts a virtual
 // submerged tiled basin without an extra scene capture.
 for(let t=-81;t<=-46;t+=2){const acrossPool=t>-75.4&&t<-52.6;if(acrossPool){path([[t,36],[t,42.7]],1.94,white);path([[t,59.3],[t,68]],1.94,white);}else path([[t,36],[t,68]],1.94,white);}
 path([[-40,25],[-48,38]],3.2,white);path([[-79,38],[-89,46],[-92,49]],3.5,white);
 path([[-89,30],[-89,123]],4.4,white);path([[-139,30],[-139,123]],4.4,white);path([[-89,30],[-139,30]],4.4,white);path([[-89,120],[-139,120]],4.4,white);
 path([[-91.5,48],[-103.9,48]],5.9,wood,.35);
 for(let t=-103;t<-91;t+=.75)path([[t,45.1],[t,50.9]],.06,'#d2b88b',.37);
 for(const b of BASINS){
  const n=street(b.t,b.x),g=anchor(district,n),inverse=new T.Matrix4();g.updateMatrixWorld(true);inverse.copy(g.matrixWorld).invert();
  const geo=new T.PlaneGeometry(b.halfX*2,b.halfT*2,b.id==='pool'?32:64,b.id==='pool'?44:40);geo.rotateX(-Math.PI/2);const a=geo.attributes.position,coords=new Float32Array(a.count*2),v=new T.Vector3();
  for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);coords[i*2]=x;coords[i*2+1]=z;v.set(...point(street(b.t-z,b.x+x),.275)).applyMatrix4(inverse);a.setXYZ(i,v.x,v.y,v.z);}geo.setAttribute('aBasinCoord',new T.BufferAttribute(coords,2));geo.computeVertexNormals();
  const uniforms={uWaterTime:{value:0},uWaterDepth:{value:b.depth},uWaterClarity:{value:.55},uWaterRain:{value:0},uWaterDetail:{value:1},uWaterCanal:{value:b.id==='canal'?1:0},uWaterHalf:{value:new T.Vector2(b.halfX,b.halfT)},uWaterEye:{value:new T.Vector3()},uWaterNormal:{value:new T.Matrix3()},uWaterImpulses:{value:Array.from({length:8},()=>new T.Vector4(0,0,-100,0))}};
  const mat=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.13,metalness:.11,clearcoat:.75,clearcoatRoughness:.08,envMapIntensity:.65});mat.userData.keepOptics=true;mat.name='Tidewater / '+b.name+' / refracted tiles';mat.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);patchBasinShader(shader);};mat.customProgramCacheKey=()=> 'tidewater-basin-0100';
  const m=new T.Mesh(geo,mat);m.receiveShadow=true;g.add(m);waterMeshes.push({b,g,m,uniforms,cursor:0});
  for(const sign of[-1,1]){path([[b.t-b.halfT,b.x+sign*b.halfX],[b.t+b.halfT,b.x+sign*b.halfX]],.40,teal,.31);path([[b.t+sign*b.halfT,b.x-b.halfX],[b.t+sign*b.halfT,b.x+b.halfX]],.40,teal,.31);}
 }
 sign('TIDEWATER COMMONS|POOL / CANAL / BOARDWALK',-38,32,6.5,3.25);sign('SEAGLASS POOL|SERVICE KIT AT THE CORNER',-46,53,5,2.8);sign('LANTERN CANAL|Y / X TO BOARD AT THE DOCK',-90,56,5,2.6);
 for(const t of[-47,-78])for(const x of[38,65]){const n=street(t,x);item('box',wood,n,[0,.7,0],[1.9,.15,.65]);for(const s of[-.65,.65])item('box',ink,n,[s,.38,0],[.12,.65,.42]);item('box',wood,n,[0,1.03,.28],[1.9,.50,.08]);}
 const pavilion=anchor(staticArt,street(-48,65));for(const x of[-2.6,2.6])for(const z of[-2,2])mesh(pavilion,'box',white,[x,1.7,z],[.17,3.4,.17]);mesh(pavilion,'box',teal,[0,3.5,0],[5.8,.25,4.7]);mesh(pavilion,'box',wood,[0,.55,0],[1.35,.95,.65]);mesh(pavilion,'cylinder',metal,[.5,1.6,0],[.045,2.2,.045]);const net=new T.Mesh(new T.TorusGeometry(.42,.033,7,24),new T.MeshStandardMaterial({color:metal,metalness:.5,roughness:.4}));net.position.set(.5,2.4,0);pavilion.add(net);
 const pump=anchor(staticArt,street(-79,56));mesh(pump,'box','#456970',[0,.85,0],[2,1.4,.75]);mesh(pump,'box',white,[0,1.59,0],[2.2,.12,.88]);for(const x of[-.6,0,.6]){const valve=new T.Mesh(new T.TorusGeometry(.20,.043,7,20),new T.MeshStandardMaterial({color:'#ce8052',metalness:.4,roughness:.3}));valve.position.set(x,1.0,.42);pump.add(valve);}sign('POOL > FILTER > RETURN',-78.5,56,3,2.2);
 for(const z of[-.55,.55])for(const y of[.6,.9])item('cylinder',metal,street(-55,59),[0,y,z],[.045,1.5,.045]);
 const harbor=anchor(staticArt,street(-87,41));mesh(harbor,'box',white,[0,1.8,0],[7.2,3.3,4.2]);mesh(harbor,'box',teal,[0,3.55,0],[8,.28,5]);for(const x of[-2.3,0,2.3]){mesh(harbor,'box',ink,[x,1.7,2.16],[1.45,1.55,.05]);mesh(harbor,'box',wood,[x,.53,2.45],[1.7,.16,.5]);}sign('THE FLOATING POST|HARBOR DISPATCH',-89.2,41,5,2.8,0);
 // Water lip is the physical boundary; low decorative railings stay out of
 // the front deck and pier approaches.
 for(const t of[-138,-90])for(let x=61;x<115;x+=4){const n=street(t,x);item('cylinder',ink,n,[0,.78,0],[.06,1.1,.06]);item('box',wood,n,[0,1.33,0],[4,.065,.10]);}
 for(const [t,x]of[[-81,35],[-83,77],[-141,28],[-141,119],[-90,120]]){const n=street(t,x);item('cylinder',ink,n,[0,2.1,0],[.065,4.2,.065]);const lamp=item('ball','#ffdf99',n,[0,4.2,0],[.15,.15,.15]);lamp.material=new T.MeshStandardMaterial({color:'#f8dea2',emissive:'#e7b066',emissiveIntensity:.2});lit.push(lamp);}
 for(const [t,x]of[[-46,35],[-80,68],[-83,28],[-87,124],[-140,72],[-134,123]]){const n=street(t,x);item('cylinder',wood,n,[0,1.8,0],[.17,3.6,.17]);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;item('round',i%2?'#658b5d':'#73986c',n,[Math.sin(a)*1.3,3.7,Math.cos(a)*1.3],[1.8,.14,.47],staticArt,[0,-a,Math.sin(a)*.2]);}}
 for(const [t,x]of[[-57,44.3],[-69,44.4],[-64,57.9]]){const g=anchor(district,street(t,x),.30);for(let i=0;i<7;i++)mesh(g,'round',i%2?'#9b8742':'#79883f',[(i%3-1)*.24,0,(Math.floor(i/3)-1)*.22],[.22,.018,.10],[0,i*1.8,0]);batchStatic(g);debris.push(g);}
 for(const [t,x]of[[-114,69],[-125,100],[-103,102]]){const g=anchor(district,street(t,x),.35);mesh(g,'cylinder','#ddaf59',[0,.32,0],[.40,.64,.4]);mesh(g,'cylinder',white,[0,.42,0],[.42,.17,.42]);mesh(g,'cylinder',ink,[0,.94,0],[.045,.74,.045]);mesh(g,'box',teal,[.20,1.17,0],[.4,.24,.025]);batchStatic(g);buoys.push(g);}
 const parcel=anchor(district,street(-125,100),.65);mesh(parcel,'box','#e5c886',[.8,0,0],[.6,.35,.50]);mesh(parcel,'box',teal,[.8,.19,0],[.10,.015,.53]);batchStatic(parcel);
 const marker=anchor(district,street(...TIDEWATER.landing),.2);const torus=new T.Mesh(new T.TorusGeometry(1.8,.072,7,40),new T.MeshStandardMaterial({color:'#f4ca72',emissive:'#ba8b37',emissiveIntensity:.23,roughness:.5}));marker.add(torus);
 const tip=new T.Mesh(new T.OctahedronGeometry(.24),torus.material);marker.add(tip);
 // Original playable pedal skiff; fixed geometry and bounded shader impulses.
 const boat=new T.Group();boat.name='Tidewater pedal skiff';district.add(boat);const structure=new T.Group();boat.add(structure);
 for(const x of[-.84,.84]){mesh(structure,'round',teal,[x,.12,0],[.34,.42,1.7]);mesh(structure,'box',white,[x,.29,.05],[.48,.15,2.65]);}
 mesh(structure,'box',wood,[0,.40,0],[1.65,.15,2.3]);mesh(structure,'box',ink,[0,.72,.2],[.68,.20,.64]);mesh(structure,'box',ink,[0,1.12,.47],[.74,.75,.11]);for(const x of[-.65,.65]){mesh(structure,'cylinder',metal,[x,.88,-.40],[.035,.87,.035]);mesh(structure,'box',metal,[x,1.31,-.64],[.05,.05,.85]);}mesh(structure,'box',metal,[0,1.32,-.99],[1.35,.05,.05]);mesh(structure,'box',teal,[0,.80,-1.14],[1.2,.15,.12]);batchStatic(structure);
 const paddle=new T.Group();paddle.position.set(0,.19,1.35);boat.add(paddle);for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(paddle,'box',white,[0,Math.sin(a)*.35,Math.cos(a)*.35],[1.12,.10,.29],[a,0,0]);}batchStatic(paddle);
 batchStatic(staticArt);district.updateMatrixWorld(true);
 const mv=new T.Matrix4(),cam=new T.Vector3(),up=new T.Vector3(),fwd=new T.Vector3(),right=new T.Vector3();
 function impulse(n,time,amplitude){const b=basinAt(n,5);if(!b)return;const w=waterMeshes.find(w=>w.b.id===b.id),p=waterLocal(n);w.uniforms.uWaterImpulses.value[w.cursor].set(T.MathUtils.clamp(p.x-b.x,-b.halfX+.3,b.halfX-.3),T.MathUtils.clamp(b.t-p.t,-b.halfT+.3,b.halfT-.3),time,amplitude);w.cursor=(w.cursor+1)%8;impulseCount++;}
 return {update(dt,s,camera,{low=false,quiet=false,overview=false,rain=0,night=0}={}){
  visible=!overview&&distance(s.n,center)<280;district.visible=visible;if(!visible)return;
  district.updateMatrixWorld(true);
  for(const w of waterMeshes){const u=w.uniforms;u.uWaterTime.value=quiet?0:s.time;u.uWaterClarity.value=w.b.id==='pool'?(s.tide.poolClean?.96:.40):.65;u.uWaterRain.value=quiet?0:rain;u.uWaterDetail.value=low?0:1;cam.copy(camera.position);w.g.worldToLocal(cam);u.uWaterEye.value.copy(cam);mv.multiplyMatrices(camera.matrixWorldInverse,w.m.matrixWorld);u.uWaterNormal.value.getNormalMatrix(mv);if(w.m.material.envMap!==jewel.library.environment){w.m.material.envMap=jewel.library.environment;w.m.material.needsUpdate=true;}w.m.material.envMapRotation.setFromQuaternion(w.g.quaternion);w.m.material.envMapIntensity=low?.35:.65;w.m.material.roughness=low?.19:.12;}
  for(const e of s.events){if(events.has(e))continue;events.add(e);if(e.type==='water-skim'||e.type==='water-splash'||e.type==='water-board')impulse(e.n||s.n,s.time,.9);}
  if(!quiet&&s.tide.boat&&s.speed>.6&&s.time-lastWake>.20){impulse(s.n,s.time,Math.min(1,s.speed/7));lastWake=s.time;}
  const j=waterJob(s),r=s.tide.active;debris.forEach((g,i)=>{g.visible=j?.type==='pool'?r.index<=i+1:!s.tide.poolClean;g.children[0].rotation.y=quiet?0:Math.sin(s.time*.4+i)*.08;});parcel.visible=j?.type==='canal'&&r.index<=3;
  for(const [i,g]of buoys.entries())g.children[0].position.y=quiet?0:Math.sin(s.time*1.1+i)*.065;
  const t=waterTarget(s);marker.visible=!!t;if(t){faceSurface(marker,t.n,distance(s.n,t.n)>.1?add(s.n,mul(t.n,-1)):s.facing);torus.visible=t.kind.endsWith('-pass');torus.position.y=1.95;tip.visible=!torus.visible;tip.position.y=2.7+(quiet?0:Math.sin(s.time*2)*.10);tip.rotation.y=quiet?0:s.time*.6;}
  const boatN=s.tide.boat?s.n:street(...TIDEWATER.launch);boat.position.set(...point(boatN,.40));up.set(...boatN);fwd.set(...(s.tide.boat?s.facing:add(street(-120,72),mul(boatN,-1)))).projectOnPlane(up).normalize();right.crossVectors(fwd,up).normalize();boat.quaternion.setFromRotationMatrix(mv.makeBasis(right,up,fwd.clone().negate()));paddle.rotation.x=quiet?0:s.tide.boat?s.distance*1.7:0;
  if(s.tide.boat){courier.unicycle.visible=courier.bicycle.visible=false;courier.body.position.y=-.32;courier.body.rotation.x=0;courier.g.position.set(...point(s.n,.63));for(const [i,l]of courier.legs.entries())l.rotation.x=.85+(quiet?0:Math.sin(s.distance*2+i*Math.PI)*.18);for(const a of courier.arms)a.rotation.x=.9;}
  lit.forEach(m=>m.material.emissiveIntensity=.15+night*1.8);
 },inspect:()=>({version:'0.10.0',visible,basins:2,waterDraws:visible?2:0,reflectionPasses:0,impulseCapacity:16,impulsesEmitted:impulseCount,method:'Analytic tiled-basin refraction + caustic-style interference, standard PBR lights/shadows, existing environment reflections; not a live-scene mirror',boat:'Playable pedal skiff; explicit dock entry/exit'}),restored(){waterMeshes.forEach(w=>w.m.material.needsUpdate=true);}};
}
