/* A true stereo 3D cutaway, not a rendered image on a panel. The simulation stays
 * in its original meter coordinates. Only the view rig applies the inverse
 * table transform, keeping actual head/hand motion out of character movement. */
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {prepareRig,cloneRig} from './cast-rig.mjs';
import {createGrounding,strideRate} from './grounded-motion.mjs';
import {cleanDiorama,openingState,worldPoint} from './diorama-core.mjs';
import {DISTRICTS,SOLIDS,groundAt,rayBox,raySphere} from './model.mjs';
export function createDiorama(view){
 const {scene,renderer,camera}=view,root=new T.Group();root.name='Diorama enclosure and player';root.visible=false;scene.add(root);
 const material=new T.MeshStandardMaterial({color:0x243e4a,roughness:.7,metalness:.2,side:T.DoubleSide});
 const gold=new T.MeshBasicMaterial({color:0xc8a363});
 const plane=new T.PlaneGeometry(1,1),walls={};
 for(const name of ['floor','left','right','back','top','front']){const m=new T.Mesh(plane,material);m.name='Diorama '+name;root.add(m);walls[name]=m;}
 const rim=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(60,35,48)),new T.LineBasicMaterial({color:0xd1b579}));root.add(rim);
 const hero=new T.Group();hero.name='Player courier / render only';scene.add(hero);hero.visible=false;
 const fallback=new T.Mesh(new T.CapsuleGeometry(.23,1.05,4,8),gold);fallback.position.y=.83;hero.add(fallback);
 const marker=new T.Mesh(new T.RingGeometry(.6,.76,32),new T.MeshBasicMaterial({color:0xffd682,side:T.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.06;hero.add(marker);
 const reticle=new T.Mesh(new T.RingGeometry(.24,.32,24),new T.MeshBasicMaterial({color:0xffe4a1,side:T.DoubleSide,depthTest:false}));reticle.rotation.x=-Math.PI/2;reticle.visible=false;scene.add(reticle);
 const aimGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-5)]),aimLine=new T.Line(aimGeometry,new T.LineBasicMaterial({color:0xffd88d,transparent:true,opacity:.75}));aimLine.name='Courier aiming direction';hero.add(aimLine);
 const planes=[new T.Plane(new T.Vector3(1,0,0)),new T.Plane(new T.Vector3(-1,0,0)),new T.Plane(new T.Vector3(0,0,1)),new T.Plane(new T.Vector3(0,0,-1)),new T.Plane(new T.Vector3(0,1,0)),new T.Plane(new T.Vector3(0,-1,0))];
 const priorMaterials=new Map(),hiddenObjects=new Map(),saved={};let active=false,preview=false,config=cleanDiorama(),focus={x:0,y:0,z:0},anchor={x:0,y:.5,z:-1.45},lastScan=0,rig=null,actor=null,actorStatus='loading',actorError=null,lastPosition=null;
 new GLTFLoader().loadAsync(new URL('./art/characters/courier.glb',import.meta.url).href).then(gltf=>{
  const source=prepareRig(gltf),model=cloneRig(source.source),height=1.76,k=height/source.height;model.scale.setScalar(k);model.position.set(-source.centerX*k,-source.feet*k,-source.centerZ*k);hero.add(model);const pistol=model.getObjectByName('Pistol');if(pistol)pistol.visible=true;
  const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(source.clips.map(c=>[c.name,mixer.clipAction(c)]));
  actor={model,mixer,actions,action:null,pose:'',grounding:createGrounding(model,groundAt)};fallback.visible=false;actorStatus='ready';lastScan=0;
 }).catch(e=>{actorStatus='fallback';actorError=String(e.message||e);});
 function center(s,head=null){const p=s.p,d=DISTRICTS.find(d=>Math.abs(p.x-d.x)<=d.w/2&&Math.abs(p.z-d.z)<=d.d/2);focus={x:p.x,y:d?.y??p.y,z:p.z};if(head){anchor={x:head.x+(head.forward?.x??0)*1.45,y:config.height,z:head.z+(head.forward?.z??-1)*1.45};}else anchor.y=config.height;}
 function restore(){for(const[m,v]of priorMaterials){m.clippingPlanes=v.planes;m.clipShadows=v.shadows;m.needsUpdate=true;}priorMaterials.clear();for(const[o,v]of hiddenObjects)o.visible=v;hiddenObjects.clear();}
 function set(on,cfg,state,{desktop=false,head=null}={}){
  config=cleanDiorama(cfg);preview=on&&desktop;
  if(on&&!active){saved.fog=scene.fog;saved.background=scene.background;saved.clear=renderer.getClearColor(new T.Color());saved.alpha=renderer.getClearAlpha();saved.clipping=renderer.localClippingEnabled;active=true;center(state,head);lastScan=0;}
  if(!on&&active){restore();active=false;preview=false;scene.fog=saved.fog;scene.background=saved.background;renderer.setClearColor(saved.clear,saved.alpha);renderer.localClippingEnabled=saved.clipping;if(rig){rig.scale.setScalar(1);rig=null;}lastPosition=null;actor?.grounding.reset();}
  document.body.classList.toggle('diorama-preview',preview);root.visible=hero.visible=active;reticle.visible=false;
 }
 function configure(cfg){config=cleanDiorama(cfg);anchor.y=config.height;lastScan=0;}
 function hide(o,yes){if(!hiddenObjects.has(o))hiddenObjects.set(o,o.visible);o.visible=yes?false:hiddenObjects.get(o);}
 function scan(){
  const openings=openingState(config.opening),seen=new Set();
  function visit(o){if(o===rig||o===camera||o===root)return;
   if(o.userData.roomShell)hide(o,!!openings[o.userData.roomShell+'Open']);
   if(o.name==='Aether sky')hide(o,true);
   if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    if(m.isShaderMaterial)continue; // The sky is hidden; stock injected shaders retain clipping support.
    seen.add(m);if(!priorMaterials.has(m)){priorMaterials.set(m,{planes:m.clippingPlanes,shadows:m.clipShadows});m.clippingPlanes=planes;m.clipShadows=true;m.needsUpdate=true;}
   }
   for(const child of o.children)visit(child);
  }visit(scene);for(const[m,v]of priorMaterials)if(!seen.has(m)){m.clippingPlanes=v.planes;m.clipShadows=v.shadows;m.needsUpdate=true;priorMaterials.delete(m);}
 }
 function syncRig(target){if(!active||preview)return;rig=target;const pos=worldPoint({x:0,y:0,z:0},focus,anchor,config);rig.position.set(pos.x,pos.y,pos.z);rig.rotation.set(0,-config.yaw,0);rig.scale.setScalar(1/config.scale);rig.updateMatrixWorld(true);}
 function update(s,dt){if(!active)return;
  const p=s.p,d=DISTRICTS.find(d=>Math.abs(p.x-d.x)<=d.w/2&&Math.abs(p.z-d.z)<=d.d/2),base=d?.y??p.y;
  // A bounded follow-window keeps the character visible without moving the user's head.
  const blend=1-Math.exp(-Math.max(0,Math.min(.12,dt))*5);focus.x+=(p.x-focus.x)*blend;focus.z+=(p.z-focus.z)*blend;focus.y+=(base-focus.y)*blend;
  if(Math.hypot(p.x-focus.x,p.z-focus.z)>18){focus.x=p.x;focus.z=p.z;} // checkpoint or fast rail arrival
  scene.fog=null;scene.background=null;renderer.setClearColor(config.mode==='diorama-ar'&&!preview?0x000000:0x0d202b,config.mode==='diorama-ar'&&!preview?0:1);renderer.localClippingEnabled=true;
  const {x,y,z}=focus,low=y-3,high=y+32;planes[0].constant=30-x;planes[1].constant=30+x;planes[2].constant=24-z;planes[3].constant=24+z;planes[4].constant=-low;planes[5].constant=high;
  root.position.set(x,low,z);walls.floor.position.set(0,0,0);walls.floor.rotation.x=-Math.PI/2;walls.floor.scale.set(60,48,1);
  walls.top.position.set(0,35,0);walls.top.rotation.x=Math.PI/2;walls.top.scale.set(60,48,1);
  for(const [name,zz]of [['back',-24],['front',24]]){walls[name].position.set(0,17.5,zz);walls[name].rotation.set(0,0,0);walls[name].scale.set(60,35,1);}
  for(const [name,xx]of [['left',-30],['right',30]]){walls[name].position.set(xx,17.5,0);walls[name].rotation.y=Math.PI/2;walls[name].scale.set(48,35,1);}
  const open=openingState(config.opening);walls.top.visible=!open.topOpen;walls.front.visible=!open.frontOpen;rim.position.set(0,17.5,0);
  hero.position.set(p.x,p.y,p.z);hero.rotation.y=Math.PI-p.yaw;const a=aimGeometry.attributes.position;a.setXYZ(0,0,1.45,0);a.setXYZ(1,0,1.45+Math.sin(p.pitch)*7,Math.cos(p.pitch)*7);a.needsUpdate=true;aimGeometry.computeBoundingSphere();
  if(actor){const moving=Math.hypot(p.vx||0,p.vz||0),pose=!p.grounded?'Idle_Neutral':moving>.3?(moving>2.8?'Run':'Walk'):'Idle_Neutral',action=actor.actions[pose]||actor.actions.Walk||actor.actions.Idle_Neutral;
   actor.grounding.restore();if(action!==actor.action){actor.action?.fadeOut(.16);action.reset().fadeIn(.16).play();actor.action=action;actor.pose=pose;}action.setEffectiveTimeScale(strideRate(moving,pose));actor.mixer.update(Math.min(.08,Math.max(0,dt)));hero.updateMatrixWorld(true);actor.grounding.update(dt,{x:p.x,y:p.y,z:p.z,heading:p.yaw,grounded:!!p.grounded,reset:!lastPosition||Math.hypot(p.x-lastPosition.x,p.y-lastPosition.y,p.z-lastPosition.z)>1});
  }lastPosition={x:p.x,y:p.y,z:p.z};
  if(performance.now()-lastScan>400||lastScan===0){scan();lastScan=performance.now();}
  // Async environment loaders can re-show the sky; enforce its presentation flag every render.
  const sky=scene.getObjectByName('Aether sky');if(sky)hide(sky,true);
  if(preview){for(const child of camera.children)if(!child.userData.xrUI)hide(child,true);const q=config.yaw;camera.position.set(x-Math.sin(q)*46,y+43,z+Math.cos(q)*46);camera.lookAt(x,y+6,z);}
  else if(rig)syncRig(rig);
 }
 function aim(s,o,d){if(!active||!o||!d)return null;const p=s.p;let t=Infinity,target=null;
  // Choose a pointed enemy or a physical surface, never originate a shot at the giant user's hand.
  for(const b of SOLIDS){const hit=rayBox(o,d,b,1800);if(hit!==null&&hit>0&&hit<t)t=hit;}
  if(d.y<-.001){const floor=(p.y+.08-o.y)/d.y;if(floor>0&&floor<t)t=floor;}
  for(const enemy of s.drones){if(enemy.hp<=0)continue;const hit=raySphere(o,d,enemy,.9);if(hit!==null&&hit<t){t=hit;target=enemy;}}
  if(!Number.isFinite(t)||t>1800){reticle.visible=false;return null;}
  const end=target?{x:target.x,y:target.y+.2,z:target.z}:{x:o.x+d.x*t,y:o.y+d.y*t,z:o.z+d.z*t};
  const origin={x:p.x,y:p.y+(p.crouched?.9:1.5),z:p.z},delta={x:end.x-origin.x,y:end.y-origin.y,z:end.z-origin.z},length=Math.hypot(delta.x,delta.y,delta.z);if(length<.15||length>100){reticle.visible=false;return null;}
  reticle.position.set(end.x,end.y+.04,end.z);reticle.visible=true;return {origin,direction:{x:delta.x/length,y:delta.y/length,z:delta.z/length}};
 }
 return {set,configure,center,syncRig,update,aim,get active(){return active},get preview(){return preview},get config(){return {...config}},stats:()=>({active,preview,...config,...openingState(config.opening),focus:{...focus},anchor:{...anchor},widthMeters:60*config.scale,avatar:actorStatus,avatarError:actorError,avatarHeight:1.76,avatarPose:actor?.pose||null,clippedMaterials:priorMaterials.size,roomAnchored:true,headMovesCharacter:false})};
}
