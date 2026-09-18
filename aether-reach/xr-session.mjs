import {WINDOW_CONTROLS,windowControls,stepWindowLook,windowAim} from './window-controls.mjs';
import {createDiorama} from './diorama-view.mjs';
import {createARView} from './ar-view.mjs';
import {goalGuide} from './goal-guide.mjs';
import {createPresentationUI} from './presentation-ui.mjs';
import {sessionKind,dioramaMove} from './diorama-core.mjs';
/* Independent tracked head/controller poses. Hand pinches are spatial UI only.
 * Software preview, not physical Quest 3 acceptance or a comfort guarantee. */
import {T} from './scene.mjs';
import {roomMove} from './model.mjs';
import {InputSampler,SnapTurn,xrControls} from './input-core.mjs';
import {HandPinchSampler} from './hand-input.mjs';
import {spatialPage,spatialHit} from './spatial-menu.mjs';
export function createXR(view,api){
 const {renderer,scene,camera}=view,diorama=createDiorama(view),ar=createARView(view),rig=new T.Group(),inputs=new InputSampler(),turn=new SnapTurn(),padTurner=new SnapTurn(),pinches=new HandPinchSampler();
 rig.name='XR locomotion rig';scene.add(rig);renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(.8);renderer.xr.setFoveation?.(1);
 let session=null,entering=false,offsetYaw=0,lastHead=null,head=null,suspended=false,lastPaint=0,aim=null,powerAim=null,shadowBefore=true,handMode=false,menuRoot=null,trackedHands=0,trackedControllers=0,selected=0,hover=null,sessionMode='first-person-vr',placed=false,supportEpoch=0;
 const button=document.createElement('button');button.id='enter-vr';button.textContent='Checking VR support...';button.disabled=true;document.querySelector('.start-actions').append(button);
 const exit=document.createElement('button');exit.id='exit-vr';exit.textContent='Exit VR';exit.hidden=true;document.getElementById('masthead').append(exit);
 const status=document.createElement('p');status.id='xr-status';status.className='fine';status.textContent='Experimental Quest 3 target. Physical headset tracking, comfort and performance are not yet certified.';document.querySelector('.title-copy').append(status);
 const panelCanvas=document.createElement('canvas');panelCanvas.width=1024;panelCanvas.height=768;const ink=panelCanvas.getContext('2d'),tex=new T.CanvasTexture(panelCanvas);tex.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.36,1.02),new T.MeshBasicMaterial({map:tex,transparent:true,depthTest:false}));panel.position.set(0,0,-1.4);panel.name="XR menu / explicit pause only";panel.material.depthWrite=false;panel.renderOrder=1000;panel.visible=false;panel.userData.xrUI=true;camera.add(panel);
 const hudCanvas=document.createElement('canvas');hudCanvas.width=1024;hudCanvas.height=256;const hi=hudCanvas.getContext('2d'),ht=new T.CanvasTexture(hudCanvas);ht.colorSpace=T.SRGBColorSpace;
 const hud=new T.Mesh(new T.PlaneGeometry(.95,.2375),new T.MeshBasicMaterial({map:ht,transparent:true,depthTest:false}));hud.position.set(0,-.37,-1.1);hud.name="XR status dock";hud.material.depthWrite=false;hud.renderOrder=999;hud.visible=false;hud.userData.xrUI=true;camera.add(hud);
 const jointMesh=new T.InstancedMesh(new T.SphereGeometry(1,8,6),new T.MeshBasicMaterial({color:0x8cf1d5}),50);jointMesh.name='Tracked hand joints';jointMesh.frustumCulled=false;jointMesh.count=0;jointMesh.visible=false;rig.add(jointMesh);
 const jointMatrix=new T.Matrix4(),jointScale=new T.Vector3(),jointQ=new T.Quaternion();
 const handRays=['left','right'].map(side=>{const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0x9cf4db}));line.scale.z=3;line.visible=false;rig.add(line);return {side,line};});
 const controllers=[];
 for(let i=0;i<2;i++){
  const ray=renderer.xr.getController(i),grip=renderer.xr.getControllerGrip(i);rig.add(ray,grip);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0x91e8d1}));line.scale.z=4;ray.add(line);
  const shell=new T.Mesh(new T.BoxGeometry(.06,.085,.15),new T.MeshStandardMaterial({color:0xd3b47b,metalness:.4,roughness:.6}));shell.position.z=-.04;grip.add(shell);
  const barrel=new T.Mesh(new T.CylinderGeometry(.012,.02,.2,8),new T.MeshStandardMaterial({color:0x5cc6bc,emissive:0x17483f}));barrel.rotation.x=Math.PI/2;barrel.position.z=-.15;grip.add(barrel);
  const item={ray,grip,source:null,line,shell,barrel};controllers.push(item);
  ray.addEventListener('connected',e=>{item.source=e.data;shell.visible=!e.data.hand;barrel.visible=!e.data.hand&&e.data.handedness==='right';});
  ray.addEventListener('disconnected',()=>{item.source=null;clearTracking();});
 }
 const vector=new T.Vector3(),originVector=new T.Vector3(),rotation=new T.Quaternion(),raycaster=new T.Raycaster(),hits=[];
 const validPose=pose=>pose?.transform&&['x','y','z'].every(k=>Number.isFinite(pose.transform.position[k]))&&['x','y','z','w'].every(k=>Number.isFinite(pose.transform.orientation[k]));
 function clearTracking(){for(const h of handRays)h.line.visible=false;aim=powerAim=null;lastHead=null;inputs.reset();pinches.reset();turn.reset();padTurner.reset();hover=null;jointMesh.count=0;trackedHands=trackedControllers=0;}
 function wrapped(ctx,text,x,y,max,line=36){let row='';for(const word of String(text).split(/\s+/)){if(ctx.measureText(row+word).width>max){ctx.fillText(row,x,y);row='';y+=line;}row+=word+' ';}ctx.fillText(row,x,y);return y+line;}
 function paint(menu,items){
  const s=api.state();hud.visible=!!session&&!menu;panel.visible=!!session&&!!menu;
  hi.clearRect(0,0,1024,256);if(!diorama.active){hi.fillStyle='#123540e8';hi.fillRect(0,0,1024,256);}hi.fillStyle='#e7d4a2';hi.font='bold 31px sans-serif';hi.fillText(sessionMode==='first-person-ar'?'AETHER REACH / FIRST-PERSON WINDOW':sessionMode==='first-person-vr'?'AETHER REACH / VR PREVIEW':'AETHER REACH / WORLD PORTAL',28,44);hi.fillStyle='#d2efe5';hi.font='29px sans-serif';hi.fillText(`Health ${Math.ceil(s.p.health)}   Shield ${Math.ceil(s.p.shield)}   Ammo ${s.p.ammo}`,28,88);
  const goal=goalGuide(s);hi.font='23px sans-serif';wrapped(hi,(goal?'NEXT: '+goal.name+' / '+goal.distance+' m / '+goal.level+' / ':'')+(diorama.active?'L stick move / R stick aim / R trigger fire / B reload':api.hint()||'Left stick: move / right stick: snap turn / Y: pause'),28,125,965,29);if(!diorama.active){hi.fillStyle='#376273';hi.fillRect(20,199,984,48);}hi.fillStyle='#fff0c6';hi.fillText('PAUSE MENU - point and pinch, or left Y',40,232);ht.needsUpdate=true;
  if(!menu)return;ink.clearRect(0,0,1024,768);ink.fillStyle='#133846f8';ink.fillRect(0,0,1024,768);ink.strokeStyle='#c6b785';ink.lineWidth=4;ink.strokeRect(3,3,1018,762);ink.fillStyle='#ffe6b5';ink.font='bold 36px sans-serif';ink.fillText(menu.title.slice(0,45),34,55);ink.font='24px sans-serif';ink.fillStyle='#c8e1d6';wrapped(ink,menu.description.slice(0,330),34,98,952,31);
  if(menu.root?.id==='map-dialog')ink.drawImage(document.getElementById('map'),30,80,964,200);
  if(menu.root?.id==='field-dialog'&&document.getElementById('field-circuit')){ink.fillStyle='#12303d';ink.fillRect(24,70,976,210);ink.strokeStyle='#dfc382';ink.lineWidth=5;s.tactics.circuit.forEach((mask,i)=>{const x=380+(i%3)*64,y=76+Math.floor(i/3)*64;ink.fillStyle='#244e60';ink.fillRect(x,y,58,58);ink.beginPath();for(const [bit,dx,dy]of [[1,29,0],[2,58,29],[4,29,58],[8,0,29]])if(mask&bit){ink.moveTo(x+29,y+29);ink.lineTo(x+dx,y+dy);}ink.stroke();ink.fillStyle='#fff';ink.font='16px sans-serif';ink.fillText(String(i+1),x+3,y+54);});}
  for(const item of items){const active=item===hover||item.focused;ink.fillStyle=item.disabled?'#24434b':active?'#dec083':'#255665';ink.fillRect(item.x,item.y,item.w,item.h);ink.fillStyle=item.disabled?'#849b9c':active?'#102d3b':'#e7eee0';ink.font=(item.kind==='activate'?'25':'22')+'px sans-serif';ink.fillText(item.label.slice(0,item.kind==='activate'?64:24),item.x+15,item.y+34);}
  ink.font='20px sans-serif';ink.fillStyle='#b9d6cf';ink.fillText(`Page ${Math.floor(menu.index/5)+1}/${Math.max(1,Math.ceil(menu.items.length/5))} / Point + trigger or pinch / A selects focus`,34,744);tex.needsUpdate=true;
 }
 async function end(){if(session)try{await session.end();}catch(e){status.textContent='Unable to close XR session: '+e.message;}}
 const presentation=createPresentationUI(api,{
  change(config){diorama.configure({...config,mode:session?sessionMode:diorama.preview?'diorama-vr':config.mode});checkSupport();},
  preview(on){if(session||entering)return;api.clear();api.start();diorama.set(on,{...presentation.config,mode:'diorama-vr'},api.state(),{desktop:true});},
  recenter(){diorama.center(api.state(),head);api.clear();},active:()=>!!session
 });
 async function checkSupport(){if(session||entering)return;const epoch=++supportEpoch,kind=sessionKind(presentation.config.mode),name=({'first-person-ar':'First-person AR window','diorama-ar':'Third-person AR window','diorama-vr':'Third-person VR window','first-person-vr':'First-person VR'})[presentation.config.mode];button.disabled=true;
  try{const supported=isSecureContext&&await navigator.xr?.isSessionSupported?.(kind);if(epoch!==supportEpoch)return;button.disabled=!supported;button.textContent=supported?'Enter '+name+' (preview)':name+' headset not available';}
  catch{if(epoch===supportEpoch)button.textContent='WebXR unavailable';}
 }
 function finish(){session=null;entering=false;head=null;handMode=false;suspended=false;clearTracking();ar.set(false);diorama.set(false,presentation.config,api.state());camera.add(panel,hud);panel.position.set(0,0,-1.4);panel.quaternion.identity();hud.position.set(0,-.37,-1.1);hud.quaternion.identity();renderer.shadowMap.enabled=shadowBefore;scene.add(camera);camera.scale.setScalar(1);rig.position.set(0,0,0);rig.rotation.set(0,0,0);rig.scale.setScalar(1);hud.visible=panel.visible=jointMesh.visible=false;document.body.classList.remove('in-xr');exit.hidden=true;api.clear();api.pause();view.resize(innerWidth,innerHeight);presentation.refresh();checkSupport();}
 button.onclick=async()=>{
  if(entering||session)return;entering=true;button.disabled=true;api.clear();diorama.set(false,presentation.config,api.state());shadowBefore=renderer.shadowMap.enabled;
  try{
   sessionMode=presentation.config.mode;placed=false;
   const next=await navigator.xr.requestSession(sessionKind(sessionMode),{requiredFeatures:['local-floor'],optionalFeatures:['hand-tracking']});session=next;if(sessionKind(sessionMode)==='immersive-ar'&&next.environmentBlendMode==='opaque')throw new Error('This session cannot provide passthrough AR');
   next.addEventListener('end',finish,{once:true});await renderer.xr.setSession(next);renderer.shadowMap.enabled=false;
   api.start();offsetYaw=api.state().p.yaw;rig.add(camera);camera.position.set(0,0,0);camera.quaternion.identity();camera.scale.setScalar(1);head=null;handMode=false;menuRoot=null;clearTracking();document.body.classList.add('in-xr');exit.hidden=false;
   diorama.set(sessionMode.startsWith('diorama-')||sessionMode==='first-person-ar',presentation.config,api.state());ar.set(false);
   renderer.xr.getReferenceSpace()?.addEventListener?.('reset',()=>{placed=false;clearTracking();api.clear();api.pause();});
   next.addEventListener('visibilitychange',()=>{suspended=next.visibilityState!=='visible';if(suspended){api.pause();api.clear();clearTracking();}lastHead=null;});
   presentation.refresh();status.textContent='XR preview: tracked controllers play; hands point and pinch through menus. Open your hand before selecting. Physical Quest 3 QA pending.';
  }catch(error){const failed=session;session=null;try{await failed?.end();}catch{}finish();status.textContent='XR could not start: '+error.message+'. Desktop and controller play remain available.';}
  finally{entering=false;}
 };
 exit.onclick=end;checkSupport();
 function syncRig(){if(diorama.active){diorama.syncRig(rig);return;}if(!head)return;const p=api.state().p,c=Math.cos(offsetYaw),s=Math.sin(offsetYaw);rig.rotation.y=-offsetYaw;rig.position.set(p.x-(head.x*c-head.z*s),p.y,p.z-(head.x*s+head.z*c));rig.updateMatrixWorld(true);}
 function worldRay(pose){const p=pose.transform.position,q=pose.transform.orientation;originVector.set(p.x,p.y,p.z).applyMatrix4(rig.matrixWorld);rotation.set(q.x,q.y,q.z,q.w).premultiply(rig.quaternion);vector.set(0,0,-1).applyQuaternion(rotation);raycaster.set(originVector,vector);}
 function hitPanel(object){object.updateWorldMatrix(true,false);hits.length=0;raycaster.intersectObject(object,false,hits);return hits[0];}
 function activate(item){if(!item)return;if(item.kind==='exit')end();else api.spatial(item.kind,item.element);selected++;pinches.reset();lastPaint=0;}
 function frame(frame,dt){
  if(!session)return null;
  if(!frame||suspended||session.visibilityState==='hidden'){clearTracking();return {move:[0,0],held:{},edges:{}};}
  const space=renderer.xr.getReferenceSpace(),pose=frame.getViewerPose(space);if(!validPose(pose)){api.pause();api.clear();clearTracking();return null;}
  const sourceList=Array.from(session.inputSources),controllerPoses=[];for(const source of sourceList){if(source.hand)continue;let pose;try{pose=frame.getPose(source.targetRaySpace,space);}catch{}if(validPose(pose))controllerPoses.push({source,pose});}
  trackedControllers=controllerPoses.length;const handSources=sourceList.filter(s=>s.hand).slice(0,2);pinches.prune(handSources);
  let menu=api.menu();const controls=diorama.active&&!menu?windowControls(inputs,controllerPoses.map(v=>v.source)):xrControls(inputs,controllerPoses.map(v=>v.source));
  let standardPresent=false;try{standardPresent=Array.from(navigator.getGamepads?.()||[]).some(p=>p?.connected&&p.mapping==='standard');}catch{}
  const nextHandMode=handSources.length>0&&!trackedControllers&&!standardPresent;if(nextHandMode&&!handMode&&!menu){api.pause();api.clear();menu=api.menu();}handMode=nextHandMode;
  const newMenu=menu?.root!==menuRoot;if(newMenu){pinches.reset();menuRoot=menu?.root;lastPaint=0;}
  const p=api.state().p,raw=pose.transform.position;
  rotation.set(pose.transform.orientation.x,pose.transform.orientation.y,pose.transform.orientation.z,pose.transform.orientation.w);vector.set(0,0,-1).applyQuaternion(rotation);
  if(!diorama.active){
   if(!menu){offsetYaw+=turn.update(controls.turn);if(lastHead)roomMove(api.state(),(raw.x-lastHead.x)*Math.cos(offsetYaw)-(raw.z-lastHead.z)*Math.sin(offsetYaw),(raw.x-lastHead.x)*Math.sin(offsetYaw)+(raw.z-lastHead.z)*Math.cos(offsetYaw));}else turn.reset();
   p.yaw=offsetYaw+Math.atan2(vector.x,-vector.z);p.pitch=Math.asin(Math.max(-1,Math.min(1,vector.y)));
  }else if(!menu&&!api.standardInput?.()){stepWindowLook(p,controls.look,dt,{fine:controls.held.aim,...api.lookSettings?.()});} // Both stick axes aim; head and pointing rays cannot overwrite them.
  head={x:raw.x,y:raw.y,z:raw.z,forward:{x:vector.x,z:vector.z}};
  if(diorama.active&&!placed){diorama.center(api.state(),head);placed=true;}
  lastHead={...head};if(diorama.active)diorama.follow(p);syncRig();
  if(diorama.active){
   if(panel.parent!==rig)rig.add(panel,hud);const a=diorama.stats().anchor;hud.position.set(a.x,a.y-.25,a.z+.85);hud.quaternion.identity();
   if(newMenu&&menu){const yaw=Math.atan2(head.forward.x,-head.forward.z);panel.position.set(head.x+Math.sin(yaw)*1.4,head.y,head.z-Math.cos(yaw)*1.4);panel.rotation.set(0,-yaw,0);}
  }
  camera.updateWorldMatrix(true,true);panel.visible=!!menu;hud.visible=!menu;
  // Window combat is stick-aimed. A visible controller laser or gun would lie
  // about shot direction; expose those only for actual pointing/VR actions.
  for(const item of controllers){const windowPlay=diorama.active&&!menu;item.line.visible=!windowPlay;item.shell.visible=!windowPlay&&!!item.source&&!item.source.hand;item.barrel.visible=!diorama.active&&!!item.source&&!item.source.hand&&item.source.handedness==='right';}
  const items=spatialPage(menu);hover=null;aim=powerAim=null;
  for(const {source,pose}of controllerPoses){worldRay(pose);const output={origin:{x:originVector.x,y:originVector.y,z:originVector.z},direction:{x:vector.x,y:vector.y,z:vector.z}};
   if(source.handedness==='right'){aim=diorama.active&&!menu?windowAim(api.state()):output;if(menu){const hit=hitPanel(panel);hover=hit?.uv?spatialHit(items,hit.uv.x,hit.uv.y):null;if(hover?.element)api.spatial('focus',hover.element);if(controls.edges.confirm){activate(hover);controls.edges.confirm=false;controls.edges.fire=false;}}}
   else if(source.handedness==='left')powerAim=diorama.active&&!menu?windowAim(api.state()):output;
  }
  trackedHands=0;jointMesh.count=0;for(const h of handRays)h.line.visible=false;let pinchUsed=false;
  for(const source of handSources){const hand=pinches.sample(source,frame,space);if(!hand?.tracked)continue;trackedHands++;const beam=handRays.find(h=>h.side===source.handedness)?.line;if(beam){const p=hand.ray.transform.position,q=hand.ray.transform.orientation;beam.position.set(p.x,p.y,p.z);beam.quaternion.set(q.x,q.y,q.z,q.w);beam.visible=true;}
   for(const joint of source.hand.values()){if(jointMesh.count>=50)break;let pose;try{pose=frame.getJointPose(joint,space);}catch{}if(!validPose(pose))continue;const p=pose.transform.position;vector.set(p.x,p.y,p.z);jointScale.setScalar(Math.max(.004,Math.min(.014,pose.radius||.007)));jointMatrix.compose(vector,jointQ,jointScale);jointMesh.setMatrixAt(jointMesh.count++,jointMatrix);}
   worldRay(hand.ray);const hit=hitPanel(menu?panel:hud),target=menu&&hit?.uv?spatialHit(items,hit.uv.x,hit.uv.y):null;
   if(target)hover=target;if(!pinchUsed&&hand.pressed){if(menu&&target){activate(target);pinchUsed=true;}else if(!menu&&hit?.uv&&hit.uv.y<.23){api.pause();api.clear();pinches.reset();pinchUsed=true;selected++;}}
  }
  jointMesh.visible=jointMesh.count>0;if(jointMesh.count)jointMesh.instanceMatrix.needsUpdate=true;
  if(performance.now()-lastPaint>90){paint(menu,items);lastPaint=performance.now();}
  if(diorama.active&&!diorama.cameraWindow&&!menu&&!p.rail&&!p.climb)controls.move=dioramaMove(controls.move,p.yaw,diorama.viewYaw);
  return controls;
 }
 return {frame,syncRig,end,present(s,dt,playing){if(!playing&&!session&&diorama.preview)diorama.set(false,presentation.config,s);diorama.update(s,dt,{followAim:true});ar.update();},get cameraWindow(){return diorama.cameraWindow&&diorama.active},get dioramaActive(){return diorama.active},get desktopDiorama(){return diorama.preview},get tableYaw(){return diorama.viewYaw},padTurn(axis){if(!diorama.active){offsetYaw+=padTurner.update(axis);syncRig();}},presentationStats:()=>({...diorama.stats(),firstPersonAR:{...ar.stats(),active:!!session&&diorama.cameraWindow,lifeSize:false,windowed:!!session&&diorama.cameraWindow,alpha:renderer.getClearAlpha()},windowControls:diorama.active?WINDOW_CONTROLS:null,hudOpaqueBackground:!diorama.active,hudBackgroundAlpha:hi.getImageData(0,0,1,1).data[3],uiHeadLocked:!diorama.active,menuVisible:panel.visible,hudDocked:diorama.active&&hud.parent===rig,hudStage:hud.position.toArray(),menuStage:panel.position.toArray()}),reset(){inputs.reset();pinches.reset();turn.reset();padTurner.reset();},stats:()=>({trackedHands,trackedControllers,handMode,windowPointerVisible:controllers.filter(i=>i.source&&i.line.visible).length,controllerBarrelsVisible:controllers.filter(i=>i.source&&i.barrel.visible).length,aimSource:diorama.active?'twin-stick':'tracked-ray',weaponAim:aim,selections:selected,jointCount:jointMesh.count,handUIOnly:true,presentation:sessionMode,diorama:diorama.stats()}),get active(){return !!session},get powerAim(){return powerAim},get aim(){return aim},get supported(){return !button.disabled},get rig(){return rig}};
}
