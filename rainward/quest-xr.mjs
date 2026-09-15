/* Immersive first-person adapter for the existing Rainward simulation.
 * Headset poses never replace collision checks or grant items. Assets are original.
 * Physical Quest 3 acceptance remains an explicit, separate release gate. */
import * as T from './vendor/three.module.js';
import {createXRInput,emptyXR,pinchDown,handStick} from './xr-input.mjs';
import {createXRPanel} from './xr-panel.mjs';
import {heightAt,HEIGHT,solidAt} from './world.mjs';
import {move} from './motion.mjs';
const Y=new T.Vector3(0,1,0),V=()=>new T.Vector3(),Q=()=>new T.Quaternion();
const instructions='Controllers: left stick moves, click sprints. Right stick snaps 30 degrees; up swaps guns, down cycles tools; click melees. Right trigger fires; right grip interacts. Left trigger aims; left grip listens. A vaults or surfaces; left grip + A dodges. Tap B crouches; hold B goes prone or dives. X reloads. Tap Y opens satchel; hold Y pauses. A or trigger selects in menus, B returns. System buttons stay reserved. Hands: point and pinch to use menus. Left pinch away from a panel anchors a virtual movement stick: shift that hand horizontally, release to stop. Right pinch interacts by default; select FIRE mode to aim and hold pinch to shoot, throw or bandage. Field controls include turning, weapons, posture and every other action. Raise an open left palm facing you to pause and recenter. Menus and hand switching require released inputs. Locomotion follows your head, not the gun. This is immersive VR, not passthrough AR.';
export function createQuestXR(E){
 const rig=new T.Group(),camera=new T.PerspectiveCamera(65,1,.06,220);rig.name='Rainward XR locomotion rig';rig.add(camera);
 let scene=null,renderer=null,session=null,pending=false,disposed=false,active=false,preference='controllers',lastMode='',layout=0,calibration=null,previousHead=null,headPose=null,eye=null,turn=0,slow=true,handFire=false,handSprint=false,handListen=false,tracking='Awaiting tracking',safe=false,lastSources='',missing=false,palmTime=0,palmLatch=false;
 let currentRay={origin:V(),direction:new T.Vector3(0,0,-1)},sourceSeq=0,cycle=0,stamp=0;const identities=new WeakMap(),pinches=new WeakMap(),anchors=new WeakMap();
 const input=createXRInput(),rays={};let sample=emptyXR();
 const status=()=>{const p=E.state().player;return (safe?'':'RELEASE INPUTS / ')+tracking+' | HP '+Math.ceil(p.hp)+' | '+(p.waterMode==='swim'?'AIR '+Math.ceil(p.oxygen):p.equipped+' '+p.mag+'/'+p.reserve)+(handFire?' | HAND FIRE ARMED':'');};
 const reset=()=>{input.reset();sample=emptyXR();safe=false;layout++;};
 const action=(label,id,fn)=>({label,id,run:fn});
 const command=(label,id)=>action(label,id,()=>E.act(id));
 const panel=createXRPanel({mode:E.mode,hint:()=>E.state().hint||'Right grip: interact / Point and select field controls',status,instructions:()=>instructions,reset,
  actions:()=>[
   command('INTERACT / PICK UP / SAVE','interact'),action(handFire?'HAND MODE: FIRE (select for USE)':'HAND MODE: USE (select for FIRE)','hand-fire',()=>{handFire=!handFire;}),
   command('RELOAD','reload'),command('JUMP / VAULT / SURFACE','traverse'),command('CROUCH / STAND','crouch'),command('PRONE / DIVE / SURFACE','prone'),command('SATCHEL / CRAFT','pack'),command('PAUSE / SETTINGS','pause'),
   action('TURN LEFT 30','turn-left',()=>snap(Math.PI/6)),action('TURN RIGHT 30','turn-right',()=>snap(-Math.PI/6)),command('RIFLE','selectRifle'),command('SIDEARM','selectPistol'),command('CYCLE MEDKIT / BOTTLE / SMOKE','selectTool'),command('MELEE','melee'),command('DODGE','evade'),command('JOURNAL / MAP','map'),
   action(handSprint?'HAND SPRINT: ON':'HAND SPRINT: OFF','hand-sprint',()=>{handSprint=!handSprint;}),action(handListen?'HAND LISTEN: ON':'HAND LISTEN: OFF','hand-listen',()=>{handListen=!handListen;}),action(slow?'MOVE SPEED: COMFORT':'MOVE SPEED: NORMAL','comfort-speed',()=>{slow=!slow;}),command('SELECT MEDKIT','heal')],
  back(){if(E.mode()==='play')E.act('pause');else E.back();},recenter(){recenter();},exit(){void exit();},isHeld:el=>E.isHeld(el),hold:(row,on)=>E.hold(row.element,on)});
 const badgeCanvas=document.createElement('canvas');badgeCanvas.width=1024;badgeCanvas.height=192;const bc=badgeCanvas.getContext('2d'),badgeTexture=new T.CanvasTexture(badgeCanvas);badgeTexture.colorSpace=T.SRGBColorSpace;
 const badge=new T.Mesh(new T.PlaneGeometry(1.20,.225),new T.MeshBasicMaterial({map:badgeTexture,toneMapped:false,depthTest:false,depthWrite:false}));badge.renderOrder=10001;badge.name='XR vitals and pause target';rig.add(panel.mesh,badge);
 const veil=new T.Mesh(new T.SphereGeometry(.12,12,8),new T.MeshBasicMaterial({color:0x000000,side:T.BackSide,transparent:true,opacity:0,depthTest:false,depthWrite:false}));veil.renderOrder=20000;camera.add(veil);
 const visuals={};for(const side of ['left','right']){
  const group=new T.Group(),laser=new T.Line(new T.BufferGeometry().setFromPoints([V(),new T.Vector3(0,0,-4)]),new T.LineBasicMaterial({color:side==='left'?0x8bdbc7:0xefdcad,depthTest:false}));laser.renderOrder=9999;group.add(laser);rig.add(group);
  const grip=new T.Group(),body=new T.Mesh(new T.CylinderGeometry(.018,.024,.11,8),new T.MeshBasicMaterial({color:0x818b8c}));body.rotation.x=-.3;grip.add(body);rig.add(grip);
  const joints=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshBasicMaterial({color:side==='left'?0x8bdbc7:0xefdcad}),25);joints.frustumCulled=false;rig.add(joints);
  const jointLines=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(48*3),3)),new T.LineBasicMaterial({color:0xd8ece5}));jointLines.frustumCulled=false;rig.add(jointLines);
  group.visible=grip.visible=joints.visible=jointLines.visible=false;visuals[side]={group,laser,grip,joints,jointLines};
 }
 function bind(next){scene=next.scene;renderer=next.renderer;scene.add(rig);next.bindXR(api);calibration=null;previousHead=null;eye=null;reset();}
 function detach(){rig.removeFromParent();scene=null;}
 function snap(angle){turn+=angle;previousHead=null;reset();recenter();}
 function recenter(){if(headPose)calibration={x:headPose.position.x,y:headPose.position.y,z:headPose.position.z};previousHead=null;stamp=-1;layout++;}
 function end(error){if(!active&&!session&&!pending)return;session=null;active=false;safe=false;input.reset();sample=emptyXR();tracking=error?'XR failed: '+error.message:'XR ended';document.body.classList.remove('immersive-rainward');E.hold(null,false);queueMicrotask(()=>E.end(error));}
 async function enter(kind='controllers'){
  if(disposed||pending||active)return false;pending=true;preference=kind;E.audio();let candidate;
  try{
   if(!globalThis.navigator?.xr)throw Error('WebXR is unavailable. Use Meta Quest Browser over HTTPS.');
   candidate=await navigator.xr.requestSession('immersive-vr',kind==='hands'?{requiredFeatures:['hand-tracking'],optionalFeatures:['local-floor']}:{optionalFeatures:['local-floor','hand-tracking']});
   if(disposed){await candidate.end();return false;}session=candidate;
   candidate.addEventListener('end',()=>{if(session===candidate)end();},{once:true});
   candidate.addEventListener('visibilitychange',()=>{if(candidate.visibilityState!=='visible'){reset();E.pause();}});
   renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFramebufferScaleFactor(.75);await renderer.xr.setSession(candidate);renderer.xr.setFoveation(.8);
   if(disposed||session!==candidate){await candidate.end();return false;}
   active=true;calibration=null;previousHead=null;eye=null;lastSources='';missing=false;turn=E.view().yaw;handFire=false;handListen=false;handSprint=false;reset();recenter();document.body.classList.add('immersive-rainward');E.start();return true;
  }catch(error){if(session===candidate)session=null;try{await candidate?.end();}catch{}end(error);return false;}finally{pending=false;}
 }
 async function exit(){try{await session?.end();}catch(error){end(error);}}
 function viewer(frame){try{return frame?.getViewerPose(renderer.xr.getReferenceSpace());}catch{return null;}}
 function pose(frame,space,joint=false){try{return space?(joint?frame.getJointPose(space,renderer.xr.getReferenceSpace()):frame.getPose(space,renderer.xr.getReferenceSpace())):null;}catch{return null;}}
 function align(state,dt){if(!headPose)return;const p=state.player,h=headPose.position;
  if(!calibration)calibration={x:h.x,y:h.y,z:h.z};
  const target=heightAt(p.x,p.z)+(p.waterMode==='swim'?(p.submerged?-(p.swimDepth||0)+.35:.5):p.stance==='prone'?.40:p.stance==='crouch'?1.06:1.62);
  eye=eye===null?target:eye+(target-eye)*(1-Math.exp(-dt*14));
  rig.rotation.y=turn;const offset=new T.Vector3(h.x,h.y,h.z).applyAxisAngle(Y,turn);rig.position.set(p.x-offset.x,eye-calibration.y,p.z-offset.z);rig.updateMatrixWorld(true);
 }
 function drawBadge(){bc.fillStyle='#10232a';bc.fillRect(0,0,1024,192);bc.fillStyle='#efdcad';bc.font='bold 29px sans-serif';bc.fillText('PAUSE / RECENTER MENU',22,42);bc.fillStyle='#ffffff';bc.font='24px sans-serif';const s=status();bc.fillText(s.slice(0,77),22,82);bc.fillText(s.slice(77,154),22,111);const p=E.state().player;bc.fillStyle=p.submerged&&p.oxygen<=25?'#ffd0ba':'#c3ded4';bc.fillText(p.submerged&&p.oxygen<=25?'LOW AIR: A OR FIELD SURFACE BUTTON':p.healing?'HOLD FIRE / BANDAGING':p.craft?'HOLD SELECT / ASSEMBLING':E.state().hint?.slice(0,77)||'Point and select. Raise left open palm to pause.',22,161);badgeTexture.needsUpdate=true;}
 function placePanels(){if(!headPose)return;const q=new T.Quaternion().copy(headPose.orientation),f=new T.Vector3(0,0,-1).applyQuaternion(q);const yaw=Math.atan2(-f.x,-f.z),h=headPose.position;
  const put=(mesh,x,y,z)=>{const v=new T.Vector3(x,y,z).applyAxisAngle(Y,yaw);mesh.position.set(h.x+v.x,h.y+v.y,h.z+v.z);mesh.rotation.set(0,yaw,0);};
  const playing=E.mode()==='play';panel.mesh.scale.setScalar(playing?.60:1);put(panel.mesh,playing?-.85:0,playing?-.56:-.06,playing?-1.55:-1.55);put(badge,0,playing?-.62:.89,playing?-1.80:-1.60);rig.updateMatrixWorld(true);
 }
 function poll(state,view,dt,frame){
  if(!active)return null;sample=emptyXR();cycle++;
  if(!frame||session?.visibilityState!=='visible'){reset();return sample;}
  const v=viewer(frame);if(!v){if(!missing){missing=true;E.pause();}tracking='Head tracking lost';reset();veil.material.opacity=1;return sample;}
  missing=false;headPose=v.transform;const h=headPose.position;
  if(!calibration){calibration={x:h.x,y:h.y,z:h.z};previousHead={x:h.x,z:h.z};}
  // Room-scale displacement uses the same swept movement as ordinary gameplay.
  if(previousHead&&E.mode()==='play'){let dx=h.x-previousHead.x,dz=h.z-previousHead.z;
   if(Math.hypot(dx,dz)<.35){const c=Math.cos(turn),s=Math.sin(turn);move(state.player,c*dx+s*dz,-s*dx+c*dz,HEIGHT[state.player.stance]);}
   else {reset();E.pause();tracking='Tracking reset. Recenter and release inputs.';}
  }
  previousHead={x:h.x,z:h.z};align(state,dt);
  const hd=new T.Vector3(0,0,-1).applyQuaternion(headPose.orientation).applyAxisAngle(Y,turn);view.yaw=Math.atan2(-hd.x,-hd.z);view.pitch=Math.asin(Math.max(-1,Math.min(1,hd.y)));
  if(lastMode!==E.mode()||stamp!==layout){lastMode=E.mode();stamp=layout;placePanels();}panel.collect();
  const available=[...session.inputSources].filter(s=>['left','right'].includes(s.handedness));const list=[];
  for(const side of ['left','right']){
   const matches=available.filter(s=>s.handedness===side),src=matches.find(s=>preference==='hands'?s.hand:!s.hand)||matches[0],visual=visuals[side];
   visual.group.visible=visual.grip.visible=visual.joints.visible=visual.jointLines.visible=false;rays[side]=null;if(!src)continue;
   const rayPose=pose(frame,src.targetRaySpace),gripPose=pose(frame,src.gripSpace);if(!rayPose)continue;
   if(!identities.has(src))identities.set(src,'source-'+(++sourceSeq));const data={id:identities.get(src),side,hand:!!src.hand,axes:[],buttons:[]};
   if(src.hand){
    const a=pose(frame,src.hand.get('thumb-tip'),true),b=pose(frame,src.hand.get('index-finger-tip'),true),w=pose(frame,src.hand.get('wrist'),true);
    if(!a||!b||!w){pinches.delete(src);anchors.delete(src);continue;}
    const d=Math.hypot(a.transform.position.x-b.transform.position.x,a.transform.position.y-b.transform.position.y,a.transform.position.z-b.transform.position.z),down=pinchDown(d,pinches.get(src));data.pinch=down;pinches.set(src,down);
    if(!down)anchors.delete(src);else if(!anchors.has(src))anchors.set(src,{x:w.transform.position.x,y:w.transform.position.y,z:w.transform.position.z});
    const localYaw=view.yaw-turn;data.move=down?handStick(anchors.get(src),w.transform.position,localYaw):[0,0];
    const dummy=new T.Object3D(),points=[];let i=0;for(const joint of src.hand.values()){const p=pose(frame,joint,true);if(!p)break;dummy.position.copy(p.transform.position);dummy.scale.setScalar(Math.max(.005,p.radius||.009));dummy.updateMatrix();visual.joints.setMatrixAt(i++,dummy.matrix);points.push(dummy.position.clone());}visual.joints.count=i;visual.joints.instanceMatrix.needsUpdate=true;visual.joints.visible=i===25;
    if(i===25){const arr=visual.jointLines.geometry.attributes.position.array;let o=0;for(let k=1;k<25;k++){const parent=[1,5,10,15,20].includes(k)?0:k-1;points[parent].toArray(arr,o);o+=3;points[k].toArray(arr,o);o+=3;}visual.jointLines.geometry.attributes.position.needsUpdate=true;visual.jointLines.visible=true;}
    if(side==='left'){
     const palm=new T.Vector3(0,-1,0).applyQuaternion(w.transform.orientation),toward=new T.Vector3(h.x-w.transform.position.x,h.y-w.transform.position.y,h.z-w.transform.position.z);const facing=toward.length()<.75&&w.transform.position.y>h.y-.3&&palm.dot(toward.normalize())>.70&&!down;
     palmTime=facing?palmTime+dt:0;if(!facing)palmLatch=false;if(palmTime>.7&&!palmLatch){palmLatch=true;E.pause();recenter();reset();}
    }
   }else if(src.gamepad?.mapping==='xr-standard'){data.buttons=src.gamepad.buttons;data.axes=src.gamepad.axes;if(gripPose){visual.grip.position.copy(gripPose.transform.position);visual.grip.quaternion.copy(gripPose.transform.orientation);visual.grip.visible=true;}}
   visual.group.position.copy(rayPose.transform.position);visual.group.quaternion.copy(rayPose.transform.orientation);visual.group.visible=true;rig.updateMatrixWorld(true);
   const origin=visual.group.getWorldPosition(V()),direction=new T.Vector3(0,0,-1).applyQuaternion(visual.group.getWorldQuaternion(Q())).normalize(),caster=new T.Raycaster(origin,direction,0,8);
   const hits=caster.intersectObjects([panel.mesh,badge],false);const hit=hits[0];data.overUI=!!hit;data.row=hit?.object===panel.mesh?panel.hit(hit.uv):hit?{id:'badge',run:()=>{E.pause();recenter();}}:null;
   if(data.overUI)anchors.delete(src);visual.laser.scale.z=hit?hit.distance/4:1;
   rays[side]={origin,direction};list.push(data);
  }
  const signature=list.map(s=>s.id).sort().join('|');if(lastSources&&signature!==lastSources){E.pause();reset();handFire=false;handListen=false;handSprint=false;}lastSources=signature;
  if(!list.length){tracking='No tracked controllers or hands';E.pause();reset();return sample;}
  tracking=list.map(s=>s.side+' '+(s.hand?'hand':'controller')).join(' + ');
  sample=input.sample(list,dt,{mode:E.mode(),key:E.mode()+':'+layout,handFire});safe=input.isArmed();
  for(const side of ['right','left']){const data=list.find(s=>s.side===side);if(!data)continue;
   if(sample.select[side]&&data.row){if(data.row.id==='badge'){data.row.run();reset();}else panel.select(data.row);sample=emptyXR();return sample;}
   if(data.overUI&&side==='right')sample.fire=false;
   if(data.overUI&&side==='left'){if(data.hand)sample.move=[0,0];sample.aim=false;}
  }
  const anySelect=list.some(s=>s.hand?s.pinch:s.buttons[0]?.pressed||s.buttons[0]?.value>.65);if(panel.held()&&!anySelect)panel.release();
  if(E.mode()!=='play')sample.fire=false;
  if(sample.turn){const angle=sample.turn;turn+=angle;previousHead=null;align(E.state(),dt);view.yaw+=angle;recenter();sample.move=[0,0];}
  if(slow)sample.move=sample.move.map(x=>x*.62);
  if(list.some(s=>s.side==='left'&&s.hand)){sample.sprint=handSprint;sample.sprintDirect=true;sample.listen=handListen;}
  if(safe){currentRay=rays.right||{origin:camera.getWorldPosition(V()),direction:hd};}else sample.fire=false;
  const p=E.state().player;const localHeadY=h.y-calibration.y;veil.material.opacity=Math.abs(localHeadY)>.65||solidAt(p.x,p.z,Math.max(.2,eye-heightAt(p.x,p.z)))?.92:0;
  if(cycle%8===0)drawBadge();return sample;
 }
 function update(state,view,dt){if(active){align(state,dt);if(stamp!==layout){stamp=layout;placePanels();}panel.collect();}}
 const api={camera,rig,bind,detach,poll,update,enter,exit,reset,recenter,isActive:()=>active,supported:async()=>{try{return !!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');}catch{return false;}},ray:()=>currentRay,aimYaw:()=>Math.atan2(-currentRay.direction.x,-currentRay.direction.z),
  stats:()=>({active,pending,mode:'immersive-first-person',preference,tracking,armed:safe,handFire,comfortSpeed:slow,hardwareVerified:false,panelPage:panel.page(),panelRows:panel.rows(),panelMatrix:panel.mesh.matrix.toArray(),rig:{x:rig.position.x,y:rig.position.y,z:rig.position.z,yaw:turn},handJoints:Object.fromEntries(Object.entries(visuals).map(([k,v])=>[k,v.joints.visible?v.joints.count:0]))}),
  dispose(){disposed=true;void exit();panel.dispose();rig.removeFromParent();const gs=new Set(),ms=new Set();rig.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());badgeTexture.dispose();}
 };
 return api;
}
