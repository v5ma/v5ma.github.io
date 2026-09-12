import {createDetailedHumans} from './rainworn-humans.mjs';
import {createRainwornMaterials} from './rainworn-materials.mjs';
import {createFirstLightArt} from './first-light-art.mjs';
import {createListenArt} from './listen-art.mjs';
import {buildReclaimed} from './reclaimed-art.mjs';
import {createTaskArt} from './task-art.mjs';
import {isMonster} from './monsters.mjs';
import {createCinematic} from './cinematic.mjs';
import {createLivingMaterials} from './living-materials.mjs';
import {createAtmosphere} from './atmosphere.mjs';
import {createXRPreview} from './xr-preview.mjs';
import {createStaticCulling} from './scan-culling.mjs';
import {createScannedAssets} from './scanned-assets.mjs';
import {buildTerminus} from './terminus-art.mjs';
import {graphicsPreset} from './graphics.mjs';
import {buildConservatory,skyEnvironment} from './landscape.mjs';
import {creature,poseCreature} from './creature-art.mjs';
import * as T from './vendor/three.module.js';
import {CURRENT,heightAt,OBSTACLES,GRASS,ITEMS,SHELTERS,EXIT,HEIGHT,BOUNDS} from './world.mjs';
import {artkit,rnd,colors} from './artkit.mjs';
import {buildDistrict} from './district.mjs';
import {actor,pose} from './actors.mjs';
import {followCamera} from './camera-core.mjs';
export function createScene(canvas,{onXRStart=()=>{},onXREnd=()=>{}}={}){
 const chapter=CURRENT;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.info.autoReset=false;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0x819995);scene.fog=new T.FogExp2(0x819995,.013);
 const camera=new T.PerspectiveCamera(55,1,.07,240);scene.add(camera);
 scene.add(new T.HemisphereLight(0xc6d9e8,0x282d29,chapter.id==='terminus'?.48:.65));const sun=new T.DirectionalLight(0xffe1b8,chapter.id==='terminus'?1.7:2.6);sun.position.set(-28,55,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.5,far:110});sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
 if(chapter.id==='breakwater'){sun.intensity=1.4;sun.color.setHex(0xd2dfdf);renderer.toneMappingExposure=.94;}
 const rim=new T.DirectionalLight(0x9fbfd0,.35);rim.position.set(20,6,-30);scene.add(rim);
 const environment=skyEnvironment(scene,renderer);scene.fog=new T.FogExp2(chapter.id==='terminus'?0x637985:0x9aadb3,chapter.id==='terminus'?.014:.007);
 let graphics;const scans=createScannedAssets(scene,renderer,chapter,{heightAt,onEnvironment:texture=>graphics?.setEnvironment(texture)});
 const A=artkit(scene,scans),{mesh,geos}=A;const scenery=['meridian','breakwater','whiteout'].includes(chapter.id)?buildReclaimed(scene,A):chapter.id==='terminus'?buildTerminus(scene,A):chapter.id==='conservatory'?buildConservatory(scene,A):null;if(!scenery)buildDistrict(scene,A);const taskArt=createTaskArt(scene,A),firstLight=createFirstLightArt(scene,A,chapter);
 const itemMeshes=new Map();for(const item of ITEMS){const g=new T.Group();g.position.set(item.x,heightAt(item.x,item.z)+.4,item.z);const bag=mesh('box',[.55,.34,.4],item.type==='objective'?0xb5aa77:0x879877);g.add(bag);const band=mesh('box',[.12,.36,.43],0x414d46);g.add(band);const ring=new T.Mesh(new T.RingGeometry(.39,.43,28),new T.MeshBasicMaterial({color:0xd9d3a5,transparent:true,opacity:.65,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.34;g.add(ring);scene.add(g);itemMeshes.set(item.id,g);}
 const hero=actor(scene,mesh,0x886055),enemies=new Map(),humans=createDetailedHumans(scene,hero,enemies),rainFilm=createRainwornMaterials(A,chapter);let humanEnabled=true,filmEnabled=true;
 const drops=new Float32Array(900*6);for(let i=0;i<900;i++){const x=(rnd(i+68)-.5)*84,y=rnd(i+71)*20,z=-45+rnd(i+811)*86;drops.set([x,y,z,x-.1,y-.7,z+.1],i*6);}
 const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(drops,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:chapter.id==='whiteout'?0xf2f5ee:0xc1d6d0,transparent:true,opacity:chapter.id==='whiteout'?.46:.23,depthWrite:false}));scene.add(rain);
 const lootDrops=new Map(),clouds=new Map(),pulses=[],raycaster=new T.Raycaster();const blockMeshes=[];for(const o of OBSTACLES){const b=new T.Mesh(new T.BoxGeometry(o.w,o.h,o.d),new T.MeshBasicMaterial({visible:false}));b.position.set(o.x,o.bottom+o.h/2,o.z);b.userData.obstacle=o;b.updateMatrixWorld();blockMeshes.push(b);}
 const traceMat=new T.LineBasicMaterial({color:0xf2d4a0,transparent:true,opacity:.7});let lastEvent=0,cameraSet=false,lastState=null;const bottles=new Map();
 const listenArt=createListenArt(scene,enemies);
 const living=createLivingMaterials(scene,chapter,heightAt),atmosphere=createAtmosphere(scene,chapter,heightAt);
 const staticCulling=createStaticCulling(scene);graphics=graphicsPreset(scene,renderer);const cinema=createCinematic(renderer,scene,camera,chapter);
 let requestedLow=false,cinemaEnabled=true,dead=false;const xr=createXRPreview(renderer,scene,chapter,{heightAt,onStart(){graphics.set(true);onXRStart();},onEnd(error){if(dead)return;graphics.set(requestedLow);onXREnd(error);}});scans.start();
 function render(state,view,dt){renderer.info.reset();if(lastState!==state){lastState=state;lastEvent=0;cameraSet=false;}const t=state.t;pose(hero,state.player,t);hero.root.position.y+=heightAt(state.player.x,state.player.z);scenery?.update(state,dt);taskArt.update(state);firstLight.update(state);for(const e of state.enemies){const monster=isMonster(e);if(!enemies.has(e.id))enemies.set(e.id,monster?creature(scene,mesh,e.type):actor(scene,mesh,e.type==='drifter'?0x5e7667:0x7e795c,true,e.type));const model=enemies.get(e.id);if(monster)poseCreature(model,e,t);else{pose(model,{...e,aim:e.state==='chase'&&(e.aimTime||0)>.1},t,true);model.root.position.y+=heightAt(e.x,e.z);}}
  for(const d of state.drops||[]){if(!lootDrops.has(d.id)){const g=new T.Group(),satchel=mesh('box',[.43,.3,.38],0xbca373);satchel.position.y=.2;g.add(satchel);const ring=new T.Mesh(new T.RingGeometry(.33,.38,24),new T.MeshBasicMaterial({color:0xffd88e,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;g.add(ring);scene.add(g);lootDrops.set(d.id,g);}const g=lootDrops.get(d.id);g.position.set(d.x,heightAt(d.x,d.z),d.z);g.visible=Object.values(d.items).some(v=>v>0);}

  for(const item of ITEMS){const mesh=itemMeshes.get(item.id);mesh.visible=!state.taken.has(item.id);mesh.position.y=heightAt(item.x,item.z)+.42+Math.sin(t*1.4+item.x)*.035;}
  for(const fog of state.smokes){if(!clouds.has(fog)){const g=new T.Group();for(let i=0;i<10;i++){const m=new T.Mesh(geos.ball,new T.MeshBasicMaterial({color:0x939f8d,transparent:true,opacity:.16,depthWrite:false}));m.position.set((rnd(i)-.5)*4,.5+rnd(i+8)*2,(rnd(i+1)-.5)*4);m.scale.setScalar(1.6);g.add(m);}scene.add(g);clouds.set(fog,g);}const g=clouds.get(fog);g.position.set(fog.x,heightAt(fog.x,fog.z),fog.z);g.rotation.y=t*.05;g.children.forEach(m=>m.material.opacity=Math.min(.19,fog.life*.05));}
  for(const [fog,g]of clouds)if(!state.smokes.includes(fog)){scene.remove(g);g.traverse(o=>o.material?.dispose());clouds.delete(fog);}
  for(const p of state.projectiles){if(!bottles.has(p)){const bottle=mesh('cyl',[.08,.27,.08],0x96b5a0);scene.add(bottle);bottles.set(p,bottle);}const q=bottles.get(p),f=1-p.life/p.total;q.position.set(p.x+(p.to.x-p.x)*f,heightAt(p.x,p.z)*(1-f)+heightAt(p.to.x,p.to.z)*f+1+Math.sin(f*Math.PI)*2,p.z+(p.to.z-p.z)*f);q.rotation.z=f*7;}
  for(const [p,m]of bottles)if(!state.projectiles.includes(p)){scene.remove(m);bottles.delete(p);}
  for(const ev of state.events)if(ev.seq>lastEvent){lastEvent=ev.seq;if(ev.type==='shot'||ev.type==='enemy-shot'){const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(ev.from.x,ev.from.y,ev.from.z),new T.Vector3(ev.to.x,ev.to.y,ev.to.z)]);const line=new T.Line(geo,traceMat);scene.add(line);pulses.push({mesh:line,life:.08});}}
  for(let i=pulses.length-1;i>=0;i--){pulses[i].life-=dt;if(pulses[i].life<=0){scene.remove(pulses[i].mesh);pulses[i].mesh.geometry.dispose();pulses.splice(i,1);}}
  rain.visible=['district','meridian','breakwater','whiteout'].includes(chapter.id);const fall=chapter.id==='whiteout'?3.2:9;rain.position.set(state.player.x,-(t*fall%16),state.player.z+10);const p=state.player,aim=view.aim,lookY=heightAt(p.x,p.z)+(p.stance==='prone'?.38:p.stance==='crouch'?1.05:1.5)+(p.vault?Math.sin(Math.PI*Math.min(1,p.vault.t/p.vault.duration))*.95:0);
  const yaw=view.yaw,pitch=view.pitch,forward=new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),target=new T.Vector3(p.x,lookY,p.z),distance=aim?2.05:4.8,shoulder=(aim?.52:.72)*(view.shoulder||1);
  let desired=target.clone().addScaledVector(forward,-distance).addScaledVector(right,shoulder).add(new T.Vector3(0,aim?.05:.30,0));
  const safe=followCamera(target,desired,cameraSet?camera.position:null,dt,!cameraSet||view.snap);camera.position.set(safe.x,safe.y,safe.z);cameraSet=true;hero.root.visible=camera.position.distanceTo(target)>.7;
  camera.lookAt(target.clone().addScaledVector(forward,aim?14:5));camera.fov=T.MathUtils.lerp(camera.fov,aim?43:56,Math.min(1,dt*10));camera.updateProjectionMatrix();camera.updateMatrixWorld();
  sun.target.position.set(p.x,heightAt(p.x,p.z)+1,p.z);sun.position.set(p.x-28,heightAt(p.x,p.z)+48,p.z+20);sun.target.updateMatrixWorld();
  humans.update(state);rainFilm.update();listenArt.update(state);graphics.update();living.update(state);atmosphere.update(state);
  if(xr.isActive()){staticCulling.restore();scans.restoreInstances();renderer.render(scene,xr.camera);}else{scans.cull(camera);staticCulling.update(camera,renderer.shadowMap.enabled);cinema.render();}
 }
 function aimDirection(state){const p=state.player,origin=new T.Vector3(p.x,heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,p.z);const center=new T.Vector3(0,0,.5).unproject(camera),dir=center.sub(camera.position).normalize();raycaster.set(camera.position,dir);raycaster.far=60;const targetMeshes=state.enemies.filter(e=>e.hp>0).map(e=>enemies.get(e.id)?.root).filter(Boolean);const hits=raycaster.intersectObjects([...blockMeshes.filter(m=>!m.userData.obstacle.disabled),...targetMeshes],true);const target=hits.length?hits[0].point:camera.position.clone().addScaledVector(dir,60);const d=target.sub(origin).normalize();return {x:d.x,y:d.y,z:d.z};}
 function project(x,y,z){const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<1.3&&Math.abs(p.y)<1.3};}
 function resize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();cinema.resize(w,h);}
 function dispose(){dead=true;listenArt.dispose();humans.dispose();renderer.setAnimationLoop(null);xr.dispose();cinema.dispose();living.dispose();atmosphere.dispose();scans.dispose();graphics.dispose();const gs=new Set(),ms=new Set(),ts=new Set();[scene,...blockMeshes].forEach(root=>root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}}));Object.values(geos).forEach(g=>gs.add(g));for(const m of A.mats.values()){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());scenery?.dispose();environment.dispose();renderer.dispose();}
 return {xrSupported:()=>xr.supported(),enterXR:()=>xr.enter(),exitXR:()=>xr.exit(),xrStatus:()=>xr.stats(),setCinematic(value){cinemaEnabled=!!value;cinema.set(cinemaEnabled,requestedLow);},setMotion:value=>{living.setMotion(value);atmosphere.setMotion(value);},setRainworn(human,film){humanEnabled=!!human;filmEnabled=!!film;humans.set(humanEnabled,requestedLow);rainFilm.set(filmEnabled,requestedLow);},retryHumans:()=>humans.retry(),visualStatus:()=>({rainworn:{humans:humans.stats(),film:rainFilm.stats()},firstLight:firstLight.stats(),characters:{skinned:hero.skin.isSkinnedMesh,bones:hero.bones.length,vertices:hero.skin.geometry.attributes.position.count,humanoids:1+[...enemies.values()].filter(e=>e.skin).length},tasks:taskArt.count,cinema:cinema.stats(),living:living.stats(),atmosphere:atmosphere.stats()}),setScanned:value=>scans.set(value),assetStatus:()=>scans.report(),dispose,renderer,scene,camera,hero,enemies,render,aimDirection,project,resize,stats:()=>({staticInstances:staticCulling.stats(),scannedMeshes:scans.report().texturedMeshes,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),cameraState:()=>({x:camera.position.x,y:camera.position.y,z:camera.position.z,near:camera.near,heroVisible:hero.root.visible}),setQuality(low){requestedLow=!!low;humans.set(humanEnabled,low);rainFilm.set(filmEnabled,low);graphics.set(xr.isActive()?true:low);cinema.set(cinemaEnabled,low);}};
}