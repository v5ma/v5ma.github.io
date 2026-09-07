import * as T from './vendor/three.module.js';
import {RADIUS,WORLD,point,street,at,norm,add,mul,cross,rand,target,distance} from './model.mjs';
import {road,mailbox} from './art.mjs';
import {home,avenueTree,streetLamp,mesh,anchor,batchStatic,faceSurface,groundShadow} from './neighborhood.mjs';
import {createCourier,createCar} from './vehicles.mjs';
import {createSky} from './sky.mjs';
import {CAMERA_PRESETS,chooseGraphics} from './presentation.mjs';
export function createScene(canvas){
 const touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
 let requested=new URLSearchParams(location.search).get('quality')||'auto',quality=chooseGraphics({touch,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,requested});
 const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'default',stencil:false,preserveDrawingBuffer:false});
 const recoveryExtension=renderer.getContext().getExtension('WEBGL_lose_context');
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=quality.shadows;renderer.shadowMap.type=T.PCFShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(62,1,.1,RADIUS*8);scene.background=new T.Color('#87c9df');scene.fog=new T.Fog('#b8d7d7',65,190);
 scene.add(new T.HemisphereLight('#c9e8f1','#8a9670',2));const sun=new T.DirectionalLight('#ffe1b0',2.4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27,near:1,far:100});sun.shadow.normalBias=.055;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
 const streetFog=scene.fog,sky=createSky(scene,RADIUS*4);
 const root=new T.Group();scene.add(root);const landGeo=new T.SphereGeometry(RADIUS,96,64),p=landGeo.attributes.position,colors=[],color=new T.Color();
 for(let i=0;i<p.count;i++){const n=norm([p.getX(i),p.getY(i),p.getZ(i)]);p.setXYZ(i,...point(n));color.set('#809c61').multiplyScalar(.96+rand(i)*.09);colors.push(color.r,color.g,color.b);}landGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));landGeo.computeVertexNormals();const land=new T.Mesh(landGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));land.receiveShadow=true;root.add(land);
 const sea=new T.Mesh(new T.SphereGeometry(RADIUS-.38,64,40),new T.MeshStandardMaterial({color:'#4faeb8',roughness:.6}));root.add(sea);
 const route=offset=>Array.from({length:553},(_,i)=>street(i/552*Math.PI*2*RADIUS,offset));
 const asphalt=road(root,route(0),6.4,'#79847b',.16);const uv=[];for(let i=1;i<=552;i++)for(const j of[(i-1)*2,i*2,(i-1)*2+1,i*2,i*2+1,(i-1)*2+1])uv.push(j%2,Math.floor(j/2)*Math.PI*2*RADIUS/552/4);asphalt.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const grain=document.createElement('canvas');grain.width=grain.height=128;const gc=grain.getContext('2d'),image=gc.createImageData(128,128);for(let i=0;i<128*128;i++){const v=180+Math.floor(rand(i)*22);image.data.set([v,v,v,255],i*4);}gc.putImageData(image,0,0);const tex=new T.CanvasTexture(grain);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;asphalt.material.map=tex;for(const side of[-1,1]){road(root,route(side*4.22),1.78,'#d4cbb5',.2);road(root,route(side*3.26),.18,'#eee5cf',.23);}
 // The optional equatorial footpath yields to the asphalt at its crossings.
 const trail=Array.from({length:361},(_,i)=>at(i/360*Math.PI*2*RADIUS,0));road(root,trail.slice(6,176),2.4,'#c6b98d',.13);road(root,trail.slice(186,356),2.4,'#c6b98d',.13);
 const stat=new T.Group();root.add(stat);
 for(let t=0;t<Math.PI*2*RADIUS;t+=4){const g=new T.Group();stat.add(g);faceSurface(g,street(t),add(street(t+1),mul(street(t),-1)));mesh(g,'box','#eadca6',[0,.22,0],[.085,.018,1.65]);}
 for(const [i,s] of WORLD.buildings.entries()){if(s.type!=='garden')home(stat,s,i);groundShadow(stat,s.n,3.2,3);const ps=Array.from({length:17},(_,i)=>street(s.t,s.side*(4.7+i*.11)));road(root,ps,1.35,'#c7c1ad',.24);}
 for(const t of WORLD.trees){avenueTree(stat,t);groundShadow(stat,t.n,1.7*t.size,1.4*t.size);}
 for(let i=0;i<8;i++)streetLamp(stat,9+i*15,i%2?1:-1);
 for(const r of WORLD.rocks){const g=anchor(stat,r.n);mesh(g,'ball','#839182',[0,r.size*.35,0],[r.size*.43,r.size*.9,r.size*.42]);mesh(g,'cone','#c9ccb6',[0,r.size*1.05,0],[r.size*.29,r.size*.65,r.size*.28]);}
 const garden=anchor(stat,WORLD.sites.at(-1).n);for(let i=0;i<4;i++)for(let j=0;j<7;j++){mesh(garden,'box','#7c694c',[(j-3)*.45,.1,(i-1.5)*.65],[.43,.15,.5]);mesh(garden,'ball',i%2?'#dca14e':'#68a064',[(j-3)*.45,.3,(i-1.5)*.65],[.19,.25,.2]);}
 batchStatic(stat);
 const boxes=WORLD.sites.map(site=>({site,...mailbox(root,site)}));
 const clouds=new T.Group();root.add(clouds);for(let i=0;i<26;i++){const g=anchor(clouds,street(40+i*7,(rand(i+1)-.5)*75),12+rand(i)*8);for(let j=0;j<5;j++){const m=mesh(g,'ball',j%2?'#f5f0d8':'#e4eddf',[(j-2)*1.6,Math.sin(j)*.55,rand(j+i)*1.1],[2.3,1.2+rand(j),1.7]);m.castShadow=m.receiveShadow=false;}}batchStatic(clouds);clouds.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
 const courier=createCourier(root),shadow=groundShadow(root,street(0),.48,.64);
 const neighbors=[createCourier(root,'#bc7653'),createCourier(root,'#739a65')];neighbors.forEach(a=>{a.unicycle.visible=a.bicycle.visible=false;});
 const cars=[createCar(root,'#be7253'),createCar(root,'#93a89c')];
 const stamps=WORLD.stars.map(s=>{const g=anchor(root,s.n,.65),m=mesh(g,'box','#f1d987',[0,0,0],[.38,.28,.04]);return {s,g,m};});
 const paper=mesh(root,'box','#fff0d1',[0,0,0],[.34,.045,.21]);paper.visible=false;
 let mode='street',orbit=0,ready=false,screenHeight=0;const up=new T.Vector3(),forward=new T.Vector3(),right=new T.Vector3(),aim=new T.Vector3(),desired=new T.Vector3();
 function resize(){const r=canvas.getBoundingClientRect();quality=chooseGraphics({touch,width:r.width,height:r.height,dpr:devicePixelRatio,requested});renderer.setPixelRatio(quality.pixelRatio);renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(.1,r.width/Math.max(1,r.height));camera.fov=CAMERA_PRESETS[mode].fov+(camera.aspect<1&&mode==='street'?10:0);camera.updateProjectionMatrix();}
 function setQuality(value){requested=value;renderer.shadowMap.enabled=value==='low'?false:!touch;resize();}
 function setCamera(kind){mode=({close:'street',planet:'adventure',wide:'overview'})[kind]||kind;if(!CAMERA_PRESETS[mode])mode='street';camera.fov=CAMERA_PRESETS[mode].fov+(camera.aspect<1&&mode==='street'?10:0);camera.updateProjectionMatrix();ready=false;}
 function orbitBy(v){orbit+=v;}
 function movementBasis(s){const east=cross(s.north,s.n),f=add(mul(s.north,Math.cos(orbit)),mul(east,-Math.sin(orbit)));return {forward:f,right:cross(f,s.n)};}
 function update(dt,s,{snap=false,vehicle='unicycle'}={}){
  const n=new T.Vector3(...s.n),f=new T.Vector3(...s.facing),r=new T.Vector3().crossVectors(f,n).normalize();courier.g.position.set(...point(s.n,s.lift+.1));courier.g.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(r,n,f.clone().negate()));courier.unicycle.visible=s.ride&&vehicle==='unicycle';courier.bicycle.visible=s.ride&&vehicle==='bicycle';courier.body.position.y=s.ride?(vehicle==='bicycle'?.22:.26):0;courier.body.rotation.x=s.ride&&vehicle==='bicycle'?-.1:0;
  courier.legs.forEach((l,i)=>l.rotation.x=s.ride?(vehicle==='bicycle'?Math.sin(s.time*9+i*Math.PI)*.45:.09):Math.sin(s.time*10+i*Math.PI)*Math.min(.62,s.speed*.16));courier.arms.forEach((a,i)=>a.rotation.x=s.ride?(vehicle==='bicycle'?.95:-.22):Math.sin(s.time*10+i*Math.PI)*Math.min(.35,s.speed*.12));courier.wheels.forEach(w=>w.rotation.x+=s.speed*dt/.34);
  shadow.position.set(...point(s.n,.25));shadow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n);
  boxes.forEach(({flag,site})=>{flag.rotation.z=s.delivered.has(site.id)?Math.PI/2:0;flag.material.color.set(s.delivered.has(site.id)?'#77b694':'#da6044');});
  stamps.forEach(({g,m,s:star},i)=>{g.visible=!s.stamps.has(star.id);m.rotation.y=s.time+i;});
  neighbors.forEach((a,i)=>{const t=18+i*24+Math.sin(s.time*.25+i)*2,nn=street(t,i?4.5:-4.5);faceSurface(a.g,nn,add(street(t+1,i?4.5:-4.5),mul(nn,-1)));a.legs.forEach((l,j)=>l.rotation.x=Math.sin(s.time*3+j*Math.PI)*.2);});
  cars.forEach((g,i)=>{const t=(s.time*(i?-2.4:3.2)+55+i*50)%(Math.PI*2*RADIUS),nn=street(t,i?1.45:-1.45);faceSurface(g,nn,add(street(t+(i?1:-1),i?1.45:-1.45),mul(nn,-1)));});
  paper.visible=!!s.paper;if(s.paper){const t=s.paper.t,nn=norm(add(mul(s.paper.from,1-t),mul(s.paper.to,t)));paper.position.set(...point(nn,1+Math.sin(t*Math.PI)*2.2));paper.rotation.set(s.time*8,0,s.time*6);}
  const basis=movementBasis(s);up.copy(n);forward.set(...basis.forward);right.set(...basis.right);aim.set(...point(s.n,1.02+s.lift*.4));const preset=CAMERA_PRESETS[mode];
  if(mode==='overview'){desired.copy(n).multiplyScalar(RADIUS*(camera.aspect<1?4.2:3.05)).addScaledVector(forward,-RADIUS*.9);aim.set(0,0,0);scene.fog=null;}else{scene.fog=streetFog;desired.copy(aim).addScaledVector(up,preset.height).addScaledVector(forward,-preset.distance);const ray=new T.Ray(aim.clone(),desired.clone().sub(aim).normalize()),hit=new T.Vector3();let clearance=desired.distanceTo(aim);for(const h of WORLD.buildings){if(h.type==='garden')continue;const sphere=new T.Sphere(new T.Vector3(...point(h.n,1.5)),2.7);if(ray.intersectSphere(sphere,hit)){const d=aim.distanceTo(hit)-.4;if(d>2&&d<clearance)clearance=d;}}desired.copy(aim).addScaledVector(ray.direction,clearance);}
  if(!ready||snap){camera.position.copy(desired);ready=true;}else camera.position.lerp(desired,1-Math.exp(-dt*9));camera.up.copy(up);camera.lookAt(aim);camera.updateMatrixWorld();
  sun.position.set(...point(s.n,35)).addScaledVector(right,-22).addScaledVector(forward,-18);sun.target.position.set(...point(s.n));
  sky.update(camera,up,mode!=='overview');
  renderer.render(scene,camera);const bottom=new T.Vector3(...point(s.n,.1+s.lift)).project(camera),top=new T.Vector3(...point(s.n,2.12+s.lift+(s.ride?.26:0))).project(camera);screenHeight=Math.abs(top.y-bottom.y)/2;
 }
 resize();return {update,resize,setCamera,setQuality,restoreGraphics:()=>recoveryExtension?.restoreContext(),orbitBy,movementBasis,renderer,scene,camera,get fps(){return quality.fps;},inspect:()=>({triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,low:quality.low,shadows:renderer.shadowMap.enabled,pixelRatio:renderer.getPixelRatio(),cameraMode:mode,playerScreenHeight:screenHeight,webgl:!renderer.getContext().isContextLost(),radius:RADIUS})};
}
