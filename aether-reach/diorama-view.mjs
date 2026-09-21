/* A true stereo 3D cutaway, not a rendered image on a panel. The simulation stays
 * in its original meter coordinates. Only the view rig applies the inverse
 * table transform, keeping actual head/hand motion out of character movement. */
import * as T from './vendor/three.module.js';
import {PortalMaterials,enterPortal} from './portal-aperture.mjs';
import {FirstPersonWindow} from './first-person-window.mjs';
import {windowAim} from './window-controls.mjs';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {prepareRig,cloneRig} from './cast-rig.mjs';
import {createGrounding,strideRate} from './grounded-motion.mjs';
import {cleanDiorama,openingState,worldPoint} from './diorama-core.mjs';
import {DISTRICTS,SOLIDS,groundAt,rayBox,raySphere,presentationSolids} from './model.mjs';
export function createDiorama(view){
 const {scene,renderer,camera}=view,root=new T.Group();root.name='Diorama enclosure and player';root.visible=false;scene.add(root);
 const portal=new PortalMaterials(),inverse=new T.Matrix4();
 const firstWindow=new FirstPersonWindow();
 const gold=new T.MeshBasicMaterial({color:0xc8a363});
 // No filled or translucent shell faces: only the thin room-fixed frame.
 const rim=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(60,35,48)),new T.LineBasicMaterial({color:0xd1b579,depthTest:false,depthWrite:false}));rim.renderOrder=800;root.add(rim);
 const hero=new T.Group();hero.name='Player courier / render only';scene.add(hero);hero.visible=false;
 const fallback=new T.Mesh(new T.CapsuleGeometry(.23,1.05,4,8),gold);fallback.position.y=.83;hero.add(fallback);
 const marker=new T.Mesh(new T.RingGeometry(.6,.76,32),new T.MeshBasicMaterial({color:0xffd682,side:T.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.06;hero.add(marker);
 const reticle=new T.Mesh(new T.RingGeometry(.24,.32,24),new T.MeshBasicMaterial({color:0xffe4a1,side:T.DoubleSide,depthTest:false}));reticle.rotation.x=-Math.PI/2;reticle.visible=false;scene.add(reticle);
 const aimGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-5)]),aimLine=new T.Line(aimGeometry,new T.LineBasicMaterial({color:0xffd88d,transparent:true,opacity:.75}));aimLine.name='Courier aiming direction';hero.add(aimLine);
 const hiddenObjects=new Map(),saved={};let active=false,preview=false,config=cleanDiorama(),focus={x:0,y:0,z:0},anchor={x:0,y:.5,z:-1.45},lastScan=0,heading=0,rig=null,actor=null,actorStatus='loading',actorError=null,lastPosition=null;
 const viewConfig=()=>({...config,yaw:heading+config.yaw});
 const cameraWindow=()=>config.mode==='first-person-ar';
 new GLTFLoader().loadAsync(new URL('./art/characters/courier.glb',import.meta.url).href).then(gltf=>{
  const source=prepareRig(gltf),model=cloneRig(source.source),height=1.76,k=height/source.height;model.scale.setScalar(k);model.position.set(-source.centerX*k,-source.feet*k,-source.centerZ*k);hero.add(model);const pistol=model.getObjectByName('Pistol');if(pistol)pistol.visible=true;
  const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(source.clips.map(c=>[c.name,mixer.clipAction(c)]));
  actor={model,mixer,actions,action:null,pose:'',grounding:createGrounding(model,groundAt)};fallback.visible=false;actorStatus='ready';lastScan=0;
 }).catch(e=>{actorStatus='fallback';actorError=String(e.message||e);});
 function center(s,head=null){const p=s.p;view.scene.userData.windowPlayer=p;focus={x:p.x,y:p.y,z:p.z};heading=p.yaw;if(head){const n=Math.hypot(head.forward?.x??0,head.forward?.z??-1)||1;anchor={x:head.x+(head.forward?.x??0)/n*1.45,y:config.height,z:head.z+(head.forward?.z??-1)/n*1.45};if(cameraWindow())firstWindow.center(head,anchor,config.scale);}else anchor.y=config.height;}
 function restore(){portal.active=false;for(const[o,v]of hiddenObjects)o.visible=v;hiddenObjects.clear();}
 function set(on,cfg,state,{desktop=false,head=null}={}){
  config=cleanDiorama(cfg);preview=on&&desktop;
  if(on&&!active){saved.fog=scene.fog;saved.background=scene.background;saved.clear=renderer.getClearColor(new T.Color());saved.alpha=renderer.getClearAlpha();saved.clipping=renderer.localClippingEnabled;active=true;center(state,head);lastScan=0;}
  if(!on&&active){restore();active=false;preview=false;scene.fog=saved.fog;scene.background=saved.background;renderer.setClearColor(saved.clear,saved.alpha);renderer.localClippingEnabled=saved.clipping;if(rig){rig.scale.setScalar(1);rig=null;}lastPosition=null;actor?.grounding.reset();firstWindow.reset();root.scale.setScalar(1);}
  scene.userData.thirdPersonWindow=active&&!cameraWindow();document.body.classList.toggle('diorama-preview',preview);root.visible=active;hero.visible=active&&!cameraWindow();reticle.visible=false;
 }
 function configure(cfg){config=cleanDiorama(cfg);anchor.y=config.height;if(cameraWindow()&&firstWindow.ready)firstWindow.center(firstWindow.reference,anchor,config.scale);lastScan=0;}
 function hide(o,yes){if(!hiddenObjects.has(o))hiddenObjects.set(o,o.visible);o.visible=yes?false:hiddenObjects.get(o);}
 function scan(){
  const open=openingState(config.opening);scene.traverse(o=>{if(o.userData.roomShell)hide(o,!!open[o.userData.roomShell+'Open']);if(o.userData.portalBackdrop)hide(o,true);});
  portal.collect(scene,new Set([rig,camera,root]));
 }
 function syncRig(target){if(!active||preview)return;rig=target;if(cameraWindow()){firstWindow.sync(rig,view.scene.userData.windowPlayer);return;}const pos=worldPoint({x:0,y:0,z:0},focus,anchor,viewConfig());rig.position.set(pos.x,pos.y,pos.z);rig.rotation.set(0,-viewConfig().yaw,0);rig.scale.setScalar(1/config.scale);rig.updateMatrixWorld(true);}
 function update(s,dt,{followAim=preview}={}){scene.userData.thirdPersonWindow=active&&!cameraWindow();if(!active)return;
  const p=s.p;view.scene.userData.windowPlayer=p;focus={x:p.x,y:p.y,z:p.z};if(followAim)heading=p.yaw;
  scene.fog=null;scene.background=null;renderer.setClearColor(config.mode.endsWith('-ar')&&!preview?0x000000:0x0d202b,config.mode.endsWith('-ar')&&!preview?0:1);portal.active=true;
  const {x,y,z}=focus,low=y-3,q=viewConfig().yaw;
  if(cameraWindow()&&rig){firstWindow.sync(rig,p);firstWindow.boxMatrix(rig,anchor,config.scale).decompose(root.position,root.quaternion,root.scale);}
  else{root.position.set(x,low,z);root.rotation.set(0,-q,0);root.scale.setScalar(1);}
  root.updateMatrixWorld(true);portal.configure(root.matrixWorld);portal.uniforms.aetherPortalNearGate.value=cameraWindow()?0:1;inverse.copy(root.matrixWorld).invert();rim.position.set(0,17.5,0);
  hero.visible=!cameraWindow();
  hero.position.set(p.x,p.y,p.z);hero.rotation.y=Math.PI-p.yaw;const a=aimGeometry.attributes.position;a.setXYZ(0,0,1.45,0);a.setXYZ(1,0,1.45+Math.sin(p.pitch)*7,Math.cos(p.pitch)*7);a.needsUpdate=true;aimGeometry.computeBoundingSphere();
  if(actor){const moving=Math.hypot(p.vx||0,p.vz||0),pose=!p.grounded?'Idle_Neutral':moving>.3?(moving>2.8?'Run':'Walk'):'Idle_Neutral',action=actor.actions[pose]||actor.actions.Walk||actor.actions.Idle_Neutral;
   actor.grounding.restore();if(action!==actor.action){actor.action?.fadeOut(.16);action.reset().fadeIn(.16).play();actor.action=action;actor.pose=pose;}action.setEffectiveTimeScale(strideRate(moving,pose));actor.mixer.update(Math.min(.08,Math.max(0,dt)));hero.updateMatrixWorld(true);actor.grounding.update(dt,{x:p.x,y:p.y,z:p.z,heading:p.yaw,grounded:!!p.grounded,reset:!lastPosition||Math.hypot(p.x-lastPosition.x,p.y-lastPosition.y,p.z-lastPosition.z)>1});
  }lastPosition={x:p.x,y:p.y,z:p.z};
  showAim(s);
  scan(); // Patch late-loaded and transient materials before their FIRST rendered frame.
  // Async environment loaders can re-show the sky; enforce its presentation flag every render.
  const sky=scene.getObjectByName('Aether sky');if(sky)hide(sky,true);
  for(const child of camera.children)if(!child.userData.xrUI)hide(child,true);
  if(preview){camera.position.set(x-Math.sin(q)*46,y+(config.opening==='front'?12:config.opening==='top'?78:34),z+Math.cos(q)*46);camera.lookAt(x,y+1,z);}
  else if(rig)syncRig(rig);
 }
 function showAim(s){
  const ray=windowAim(s),o=ray.origin,d=ray.direction;let t=80;
  for(const box of presentationSolids(s)){const hit=rayBox(o,d,box,80);if(hit!==null&&hit>0)t=Math.min(t,hit);}
  for(const enemy of s.drones){if(enemy.hp<=0)continue;const hit=raySphere(o,d,enemy,.9);if(hit!==null&&hit>0)t=Math.min(t,hit);}
  reticle.position.set(o.x+d.x*t,o.y+d.y*t,o.z+d.z*t);reticle.rotation.set(s.p.pitch,-s.p.yaw,0,'YXZ');reticle.scale.setScalar(cameraWindow()?Math.max(.1,t*.012):1);reticle.visible=true;
 }
 function aim(s,o,d){if(!active||!o||!d)return null;const entered=enterPortal(o,d,inverse);if(!entered){reticle.visible=false;return null;}o=entered.origin;d=entered.direction;const p=s.p;let t=Infinity,target=null;
  // Choose a pointed enemy or a physical surface, never originate a shot at the giant user's hand.
  for(const b of presentationSolids(s)){const hit=rayBox(o,d,b,1800);if(hit!==null&&hit>0&&hit<t)t=hit;}
  if(d.y<-.001){const floor=(p.y+.08-o.y)/d.y;if(floor>0&&floor<t)t=floor;}
  for(const enemy of s.drones){if(enemy.hp<=0)continue;const hit=raySphere(o,d,enemy,.9);if(hit!==null&&hit<t){t=hit;target=enemy;}}
  if(!Number.isFinite(t)||t>1800){reticle.visible=false;return null;}
  const end=target?{x:target.x,y:target.y+.2,z:target.z}:{x:o.x+d.x*t,y:o.y+d.y*t,z:o.z+d.z*t};
  const origin={x:p.x,y:p.y+(p.crouched?.9:1.5),z:p.z},delta={x:end.x-origin.x,y:end.y-origin.y,z:end.z-origin.z},length=Math.hypot(delta.x,delta.y,delta.z);if(length<.15||length>100){reticle.visible=false;return null;}
  reticle.position.set(end.x,end.y+.04,end.z);reticle.visible=true;return {origin,direction:{x:delta.x/length,y:delta.y/length,z:delta.z/length}};
 }
 return {set,configure,center,syncRig,update,aim,follow(p){heading=p.yaw;},orbit(delta){heading+=delta;},get viewYaw(){return viewConfig().yaw},get cameraWindow(){return cameraWindow()},get active(){return active},get preview(){return preview},get config(){return {...config}},stats:()=>({active,preview,...config,...openingState(config.opening),focus:{...focus},anchor:{...anchor},widthMeters:60*config.scale,avatar:actorStatus,avatarError:actorError,avatarHeight:1.76,avatarPose:actor?.pose||null,clippedMaterials:portal.entries.size,portalMaterials:portal.entries.size,portalBuild:"aether-window-20260918.1",cameraWindow:cameraWindow(),shellFaces:root.children.filter(o=>o.isMesh).length,backdropSpritesHidden:[...hiddenObjects.keys()].filter(o=>o.userData.portalBackdrop&&!o.visible).length,fullDepth:true,playerCentered:true,viewYaw:viewConfig().yaw,roomAnchored:true,headMovesCharacter:false})};
}
