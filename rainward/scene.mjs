import * as T from './vendor/three.module.js';
import {OBSTACLES,GRASS,ITEMS,SHELTERS,EXIT,HEIGHT,BOUNDS} from './world.mjs';
import {artkit,rnd,colors} from './artkit.mjs';
import {buildDistrict} from './district.mjs';
import {actor,pose} from './actors.mjs';
export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0x819995);scene.fog=new T.FogExp2(0x819995,.013);
 const camera=new T.PerspectiveCamera(55,1,.07,240);scene.add(camera);
 scene.add(new T.HemisphereLight(0xc0d9d1,0x2b3023,2.15));const sun=new T.DirectionalLight(0xe3e7c8,3.1);sun.position.set(-22,38,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:44,bottom:-44,near:.5,far:100});sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;scene.add(sun);
 const rim=new T.DirectionalLight(0x9fbfd0,.8);rim.position.set(20,6,-30);scene.add(rim);
 const A=artkit(scene),{mesh,geos}=A;buildDistrict(scene,A);
 const itemMeshes=new Map();for(const item of ITEMS){const g=new T.Group();g.position.set(item.x,.4,item.z);const bag=mesh('box',[.55,.34,.4],item.type==='objective'?0xb5aa77:0x879877);g.add(bag);const band=mesh('box',[.12,.36,.43],0x414d46);g.add(band);const ring=new T.Mesh(new T.RingGeometry(.39,.43,28),new T.MeshBasicMaterial({color:0xd9d3a5,transparent:true,opacity:.65,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.34;g.add(ring);scene.add(g);itemMeshes.set(item.id,g);}
 const hero=actor(scene,mesh,0x886055),enemies=new Map();
 const drops=new Float32Array(900*6);for(let i=0;i<900;i++){const x=(rnd(i+68)-.5)*84,y=rnd(i+71)*20,z=-45+rnd(i+811)*86;drops.set([x,y,z,x-.1,y-.7,z+.1],i*6);}
 const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(drops,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xc1d6d0,transparent:true,opacity:.23,depthWrite:false}));scene.add(rain);
 const clouds=new Map(),pulses=[],raycaster=new T.Raycaster();const blockMeshes=[];for(const o of OBSTACLES){const b=new T.Mesh(new T.BoxGeometry(o.w,o.h,o.d),new T.MeshBasicMaterial({visible:false}));b.position.set(o.x,o.bottom+o.h/2,o.z);b.updateMatrixWorld();blockMeshes.push(b);}
 const traceMat=new T.LineBasicMaterial({color:0xf2d4a0,transparent:true,opacity:.7});let lastEvent=0,cameraSet=false,lastState=null;const bottles=new Map();
 function render(state,view,dt){if(lastState!==state){lastState=state;lastEvent=0;cameraSet=false;}const t=state.t;pose(hero,state.player,t);for(const e of state.enemies){if(!enemies.has(e.id))enemies.set(e.id,actor(scene,mesh,e.type==='drifter'?0x5e7667:0x7e795c,true));pose(enemies.get(e.id),e,t,true);}
  for(const item of ITEMS){const mesh=itemMeshes.get(item.id);mesh.visible=!state.taken.has(item.id);mesh.position.y=.42+Math.sin(t*1.4+item.x)*.035;}
  for(const fog of state.smokes){if(!clouds.has(fog)){const g=new T.Group();for(let i=0;i<10;i++){const m=new T.Mesh(geos.ball,new T.MeshBasicMaterial({color:0x939f8d,transparent:true,opacity:.16,depthWrite:false}));m.position.set((rnd(i)-.5)*4,.5+rnd(i+8)*2,(rnd(i+1)-.5)*4);m.scale.setScalar(1.6);g.add(m);}scene.add(g);clouds.set(fog,g);}const g=clouds.get(fog);g.position.set(fog.x,0,fog.z);g.rotation.y=t*.05;g.children.forEach(m=>m.material.opacity=Math.min(.19,fog.life*.05));}
  for(const [fog,g]of clouds)if(!state.smokes.includes(fog)){scene.remove(g);g.traverse(o=>o.material?.dispose());clouds.delete(fog);}
  for(const p of state.projectiles){if(!bottles.has(p)){const bottle=mesh('cyl',[.08,.27,.08],0x96b5a0);scene.add(bottle);bottles.set(p,bottle);}const q=bottles.get(p),f=1-p.life/p.total;q.position.set(p.x+(p.to.x-p.x)*f,1+Math.sin(f*Math.PI)*2,p.z+(p.to.z-p.z)*f);q.rotation.z=f*7;}
  for(const [p,m]of bottles)if(!state.projectiles.includes(p)){scene.remove(m);bottles.delete(p);}
  for(const ev of state.events)if(ev.seq>lastEvent){lastEvent=ev.seq;if(ev.type==='shot'||ev.type==='enemy-shot'){const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(ev.from.x,ev.from.y,ev.from.z),new T.Vector3(ev.to.x,ev.to.y,ev.to.z)]);const line=new T.Line(geo,traceMat);scene.add(line);pulses.push({mesh:line,life:.08});}}
  for(let i=pulses.length-1;i>=0;i--){pulses[i].life-=dt;if(pulses[i].life<=0){scene.remove(pulses[i].mesh);pulses[i].mesh.geometry.dispose();pulses.splice(i,1);}}
  rain.position.y=-(t*9%16);const p=state.player,aim=view.aim,lookY=p.stance==='prone'?.55:p.stance==='crouch'?1.05:1.5;
  const yaw=view.yaw,pitch=view.pitch,forward=new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),target=new T.Vector3(p.x,lookY,p.z),distance=aim?2.05:4.8,shoulder=aim?.52:.72;
  let desired=target.clone().addScaledVector(forward,-distance).addScaledVector(right,shoulder).add(new T.Vector3(0,aim?.05:.30,0));
  const delta=desired.clone().sub(target);raycaster.set(target,delta.clone().normalize());raycaster.far=delta.length();const hits=raycaster.intersectObjects(blockMeshes,false);if(hits.length)desired=target.clone().addScaledVector(delta.normalize(),Math.max(.65,hits[0].distance-.18));
  desired.y=Math.max(.35,desired.y);if(!cameraSet||view.snap){camera.position.copy(desired);cameraSet=true;}else camera.position.lerp(desired,1-Math.exp(-dt*14));camera.lookAt(target.clone().addScaledVector(forward,aim?14:5));camera.fov=T.MathUtils.lerp(camera.fov,aim?43:56,Math.min(1,dt*10));camera.updateProjectionMatrix();camera.updateMatrixWorld();
  renderer.render(scene,camera);
 }
 function aimDirection(state){const p=state.player,origin=new T.Vector3(p.x,HEIGHT[p.stance]*.82,p.z);const center=new T.Vector3(0,0,.5).unproject(camera),dir=center.sub(camera.position).normalize();raycaster.set(camera.position,dir);raycaster.far=60;const targetMeshes=state.enemies.filter(e=>e.hp>0).map(e=>enemies.get(e.id)?.root).filter(Boolean);const hits=raycaster.intersectObjects([...blockMeshes,...targetMeshes],true);const target=hits.length?hits[0].point:camera.position.clone().addScaledVector(dir,60);const d=target.sub(origin).normalize();return {x:d.x,y:d.y,z:d.z};}
 function project(x,y,z){const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<1.3&&Math.abs(p.y)<1.3};}
 function resize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 return {renderer,scene,camera,hero,enemies,render,aimDirection,project,resize,stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),setQuality(low){renderer.setPixelRatio(low?1:Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!low;}};
}
