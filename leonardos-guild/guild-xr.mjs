import {createFieldDesk} from './xr-field-desk.mjs';
import {beginXRPass,restoreXRPass} from './xr-frame-pass.mjs';
import {createSpatialXR} from './spatial-xr.mjs';
import {XR_REPAIR_BUILD,createMenuAnchor,createDialogBridge,guardFrame} from './xr-recovery.mjs';
import {XR_ENTRY_BUILD,XR_MODES,xrEnvironmentProblem,xrFailureText,probeXRMode,bindXREntry,immersiveVisible} from './xr-entry.mjs';
/* Optional seated WebXR theatre for the EXISTING game. The game scene, save,
 * reducers and camera remain authoritative. Both tracked controllers and hands
 * operate the same in-headset UI. This is not room-scale first-person gameplay.
 * Pinned local Three.js; no remote runtime, model, permission or account service.
 */
import * as T from './vendor/three.module.js';
import {createXRPress,xrButtons,pinchDistance,pinchDown,xrLocomotion,neutralXR,createXRAxisGate,createXRRepeat,createXRContextButton,xrWheelCommand} from './xr-input.mjs';
import {createXRPanel,createXRToolbar} from './xr-panel.mjs';
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
const validPose=p=>p?.transform&&[p.transform.position.x,p.transform.position.y,p.transform.position.z,p.transform.orientation.x,p.transform.orientation.y,p.transform.orientation.z,p.transform.orientation.w].every(Number.isFinite);
export function createGuildXR({renderer,view,getState,playing,active,actions,ui,consoleUI,clearInput}){
 let spatial=null,sessionMode='immersive-vr',modeSelect=null,pauseMode=null,arSupported='checking',vrSupported='checking';
 let session=null,supported=false,requesting=false,status='Checking immersive VR support.',referenceType='local-floor',ending=false,theatrePlaced=false;
 let gameTarget=null,savedRenderer=null,hadTracking=false,frames=0,tracked=0,handCount=0,controllerCount=0,readbackCopies=0;
 let turn=0,lookPitch=0,x=0,y=0,held={},hoverPanel='',hoverBar='',xrActivity=false,hudRequested=false,suppressGameRender=false;
 const rawRender=renderer.render;renderer.render=function(s,c){if(suppressGameRender&&s===view.scene)return;return rawRender.call(this,s,c);};
 let lastContext=null,frameContext=null,frameBlocked=false,wheelOwner=null;
 let entry=null,entryPhase='idle',entryError='',entrySelection=null,entryAutoStart=false,entryReady=false,entryFrames=0,viewerReady=false,startupTimer=null,probeId=0;
 // Keep a UI exception from stopping Three's next-frame scheduling. Desktop
 // behavior is untouched; immersive failure exits to an explicit saved-game error.
 if(renderer.setAnimationLoop){const setLoop=renderer.setAnimationLoop.bind(renderer);renderer.setAnimationLoop=fn=>{if(!fn)return setLoop(fn);const guarded=guardFrame(fn,error=>{console.error(error);fail(error);});return setLoop((...args)=>session?guarded(...args):fn(...args));};}
 const environmentProblem=()=>xrEnvironmentProblem();
 const inputContext=()=>ui.root()||actions.wheelActive()||(active()?'play':'inactive');
 const dialogs=createDialogBridge(()=>!!session&&entryReady&&!ending);let menuPose=null;
 const scene=new T.Scene();scene.background=new T.Color('#101b27');
 const camera=new T.PerspectiveCamera(55,1,.05,1800),stage=new T.Group();scene.add(stage);
 const sources=new Map(),visuals=[];
 const geo=new T.SphereGeometry(1,6,4),handleGeo=new T.CapsuleGeometry(.023,.065,4,8),rayGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-4)]);
 const handMaterial=new T.MeshBasicMaterial({color:'#d4b68e',toneMapped:false}),leftMaterial=new T.MeshBasicMaterial({color:'#83cfdf',toneMapped:false}),rightMaterial=new T.MeshBasicMaterial({color:'#f5cf8f',toneMapped:false}),rayMaterial=new T.LineBasicMaterial({color:'#def8ff',toneMapped:false,depthTest:false,depthWrite:false});
 const raycaster=new T.Raycaster(),pointer=new T.Vector3(),direction=new T.Vector3(),orientation=new T.Quaternion();
 const panel=createXRPanel({ui,actions,getState,consoleUI,exit:()=>exit()}),bar=createXRToolbar(actions);
 const screenMaterial=new T.MeshBasicMaterial({side:T.DoubleSide,toneMapped:false});
 const screen=new T.Mesh(new T.PlaneGeometry(2.85,1.603125),screenMaterial);screen.position.set(-.44,1.63,-2.65);stage.add(screen);
 const reticle=new T.Mesh(new T.RingGeometry(.011,.015,32),new T.MeshBasicMaterial({color:'#fff4de',toneMapped:false,side:T.DoubleSide}));reticle.position.copy(screen.position);reticle.position.z+=.008;reticle.visible=false;stage.add(reticle);
 const panelMesh=new T.Mesh(new T.PlaneGeometry(1.10,1.65),new T.MeshBasicMaterial({map:panel.texture,side:T.DoubleSide,toneMapped:false}));panelMesh.position.set(1.61,1.60,-2.37);panelMesh.rotation.y=-.42;stage.add(panelMesh);
 const toolbar=new T.Mesh(new T.PlaneGeometry(2.85,.7125),new T.MeshBasicMaterial({map:bar.texture,side:T.DoubleSide,toneMapped:false}));toolbar.position.set(-.44,.43,-2.38);toolbar.rotation.x=-.16;stage.add(toolbar);
 const hudToggle=new T.Mesh(new T.SphereGeometry(.045,12,8),new T.MeshBasicMaterial({color:'#d8bd86'}));hudToggle.name='Show or hide controls';hudToggle.position.set(1.25,1.45,-1.0);stage.add(hudToggle);
 function toggleHUD(){hudRequested=!hudRequested;resetInput();updateHUD();}
 const menuAnchor=createFieldDesk({panel:panelMesh,stage,back:()=>ui.back(),release:resetInput,getState,getObjective:actions.objective,summon:()=>actions.pause()});
 function updateHUD(){const real=!!session&&!!spatial&&spatial.effective()!=='theatre',root=ui.root()||actions.wheelActive(),modal=!!root;panelMesh.visible=!real||modal||hudRequested;toolbar.visible=!real||hudRequested&&!modal;hudToggle.visible=real&&!modal;menuAnchor.update(real,root,panelMesh.visible,menuPose);}
 const notice=document.createElement('p');notice.id='guild-xr-status';notice.setAttribute('role','status');notice.textContent=status;
 const titleButton=document.createElement('button');titleButton.id='guild-xr-enter';titleButton.textContent='Enter seated XR (Quest)';titleButton.disabled=true;titleButton.setAttribute('aria-describedby',notice.id);
 const pauseButton=titleButton.cloneNode(true);pauseButton.id='guild-xr-pause';
 (document.getElementById('xr-launcher')||document.getElementById('start')).after(titleButton,notice);(document.getElementById('xr-pause-launcher')||document.getElementById('resume')).after(pauseButton);
 const buttons=[titleButton,pauseButton];
 if(view.spatial){
  const label=document.createElement('label');label.textContent='XR presentation ';modeSelect=document.createElement('select');modeSelect.id='guild-xr-mode';
  for(const [value,text]of [['diorama-vr','Third-person diorama VR'],['first-person','First-person VR'],['diorama-ar','Diorama AR / passthrough'],['theatre','Seated theatre / all regions'],['first-person-ar','First-person AR / passthrough']]){const o=document.createElement('option');o.value=value;o.textContent=text;modeSelect.append(o);}
  modeSelect.value=getState().quarter?.active?'diorama-vr':'theatre';label.append(modeSelect);titleButton.before(label);pauseMode=modeSelect.cloneNode(true);pauseMode.id='guild-xr-pause-mode';pauseButton.before(pauseMode);
  modeSelect.onchange=()=>{pauseMode.value=modeSelect.value;message(status);};pauseMode.onchange=()=>{modeSelect.value=pauseMode.value;message(status);};
  spatial=createSpatialXR({scene,stage,view,getState,release:()=>{resetInput();frameBlocked=true;},openOptions:toggleHUD});
 }

 // Menu/region handlers sometimes request an immediate ordinary scene update.
 // Never let WebXRManager replace that game's camera with the headset camera.
 const updateGame=view.update;
 view.update=(...args)=>{const enabled=renderer.xr.enabled,old=suppressGameRender;if(session&&renderer.xr.isPresenting){renderer.xr.enabled=false;suppressGameRender=spatial?.effective()!=='theatre';}try{return updateGame(...args);}finally{renderer.xr.enabled=enabled;suppressGameRender=old;}};
 function message(text){
  status=text;notice.textContent=text;const problem=environmentProblem();
  for(const b of buttons){const availability=modeSelect?.value.endsWith('-ar')?arSupported:vrSupported;b.disabled=requesting||(!session&&(!!problem||availability===false));b.textContent=session?'Exit XR safely':modeSelect?'Enter selected XR view':'Enter seated XR (Quest)';}
  entry?.render({vr:vrSupported,ar:arSupported,problem,busy:requesting,presenting:!!session,status:entryError||status});
 }
 async function checkSupport(){
  const id=++probeId,problem=environmentProblem();
  if(problem){supported=false;vrSupported=arSupported=false;message(entryError||problem);return;}
  supported=true;vrSupported=arSupported='checking';message(entryError||'Choose a view. XR permission is requested only when you select a mode.');
  await Promise.all([['vr','immersive-vr'],['ar','immersive-ar']].map(async([kind,mode])=>{
   const value=await probeXRMode(navigator.xr,mode);if(id!==probeId)return;
   if(kind==='vr')vrSupported=value;else arSupported=value;
   supported=vrSupported!==false||arSupported!==false;message(status);
  }));
 }
 function resetInput(){held={};x=y=turn=lookPitch=0;xrActivity=false;clearInput?.();for(const s of sources.values()){s.capture=null;s.pinch=false;s.presses.forEach(p=>p.reset());s.axisGate.reset();s.repeat.reset();s.contextButton.reset();}}
 function makeVisual(){
  const root=new T.Group(),ray=new T.Line(rayGeo,rayMaterial),grip=new T.Mesh(handleGeo,rightMaterial),joints=new Map(),dot=new T.Mesh(geo,new T.MeshBasicMaterial({color:'#ffe6aa',depthTest:false,depthWrite:false}));dot.scale.setScalar(.008);dot.renderOrder=4501;ray.renderOrder=4500;dot.visible=false;root.add(ray,grip,dot);scene.add(root);root.visible=false;
  return {root,ray,grip,joints,dot};
 }
 function acquire(source){
  if(sources.has(source))return sources.get(source);
  if(sources.size>=4)return null;
  let visual=visuals.find(v=>!v.source);if(!visual){visual=makeVisual();visuals.push(visual);}visual.source=source;visual.grip.material=source.handedness==='left'?leftMaterial:rightMaterial;
  const value={visual,presses:Array.from({length:7},createXRPress),pinch:false,capture:null,axisGate:createXRAxisGate(),repeat:createXRRepeat(),contextButton:createXRContextButton()};sources.set(source,value);return value;
 }
 function release(source){const v=sources.get(source);if(!v)return;if(wheelOwner===source){actions.closeWheel(false);wheelOwner=null;}v.visual.root.visible=false;v.visual.source=null;v.presses.forEach(p=>p.reset());sources.delete(source);}
 function trackedPose(frame,space,reference){try{return space?frame?.getPose(space,reference):null;}catch{return null;}}
 function jointPose(frame,space,reference){try{return space?frame?.getJointPose(space,reference):null;}catch{return null;}}
 function applyPose(object,pose){object.position.copy(pose.transform.position);object.quaternion.copy(pose.transform.orientation);object.updateMatrixWorld(true);}
 function hitTarget(pose){
  pointer.copy(pose.transform.position);orientation.copy(pose.transform.orientation);direction.set(0,0,-1).applyQuaternion(orientation).normalize();raycaster.set(pointer,direction);raycaster.far=8;
  updateHUD();stage.updateWorldMatrix(true,true);const deskHit=menuAnchor.hit(raycaster);if(deskHit)return deskHit;if(hudToggle.visible&&raycaster.intersectObject(hudToggle,false).length)return {key:'hud-toggle',kind:'spatial',id:'spatial:hud-toggle',run:toggleHUD};const hits=raycaster.intersectObjects([panelMesh,toolbar].filter(o=>o.visible),false);
  if(!hits.length)return spatial?.hit(raycaster)||null;const h=hits[0],kind=h.object===panelMesh?'panel':'bar',b=kind==='panel'?panel.hit(h.uv.x,h.uv.y):bar.hit(h.uv.x,h.uv.y);
  return b?{...b,kind,distance:h.distance,id:kind+':'+b.key}:null;
 }
 function invoke(hit){if(hit.kind==='desk'){hit.run?.();return;}if(hit.kind==='panel'){panel.invoke(hit.key);if(!ui.root()&&!actions.wheelActive()&&!/^(page-|text-)/.test(hit.key)){hudRequested=false;updateHUD();}}else if(!ui.root()&&!actions.wheelActive()&&active())hit.run?.();}
 async function enter(selected=modeSelect?.value||'theatre',autoStart=false){
  if(session){await exit();return;}if(requesting)return;
  const choice=XR_MODES[selected],problem=environmentProblem();
  if(!choice||problem){message(problem||'Choose one of the available XR modes.');return;}
  const available=choice.session==='immersive-ar'?arSupported:vrSupported;
  if(available===false){message(choice.label+' is unavailable in this browser. Choose another mode or play on screen.');return;}
  entrySelection=selected;sessionMode=choice.session;entryAutoStart=autoStart;entryReady=false;entryFrames=0;entryError='';entryPhase='requesting';
  if(modeSelect){modeSelect.value=pauseMode.value=selected;}
  requesting=true;message('Starting '+choice.label+'. Accept the headset permission prompt.');
  let requested=null,ended=false;
  try{
   // Request in THIS click/keyboard activation. Never await support checks,
   // audio, network imports or a reference-space promise before this call.
   const request=navigator.xr.requestSession(choice.session,{optionalFeatures:['local-floor','hand-tracking',...(choice.session==='immersive-ar'&&choice.presentation==='diorama'?['hit-test']:[])]});
   try{actions.gesture?.();}catch{}
   requested=await request;session=requested;ending=false;hudRequested=false;
   requested.addEventListener('end',()=>{ended=true;queueMicrotask(()=>onEnd(requested));},{once:true});
   requested.addEventListener('visibilitychange',()=>{if(session!==requested)return;resetInput();if(requested.visibilityState!=='visible'&&active())actions.pause();});
   requested.addEventListener('inputsourceschange',()=>{if(session!==requested)return;for(const src of sources.keys())if(!Array.from(requested.inputSources).includes(src))release(src);});
   if(choice.session==='immersive-ar'&&requested.environmentBlendMode==='opaque')throw new DOMException('This AR session does not expose passthrough blending','NotSupportedError');
   entryPhase='initializing';message('Initializing '+choice.label+' rendering and tracking.');
   try{await requested.requestReferenceSpace('local-floor');referenceType='local-floor';}catch{referenceType='local';}
   if(ended)throw new DOMException('The headset ended the session during startup','AbortError');
   renderer.xr.setReferenceSpaceType(referenceType);renderer.xr.setFramebufferScaleFactor(.85);renderer.xr.enabled=true;
   await renderer.xr.setSession(requested);
   if(ended||session!==requested)throw new DOMException('The headset ended the session during renderer setup','AbortError');
   scene.background=choice.session==='immersive-ar'?null:new T.Color('#101b27');renderer.setClearAlpha?.(choice.session==='immersive-ar'?0:1);
   await spatial?.begin(choice.presentation,requested,renderer.xr.getReferenceSpace(),choice.session);
   theatrePlaced=false;renderer.xr.getReferenceSpace()?.addEventListener?.('reset',()=>{theatrePlaced=false;resetInput();if(active())actions.pause();});
   gameTarget ||= new T.WebGLRenderTarget(1024,576,{depthBuffer:true});gameTarget.texture.colorSpace=T.SRGBColorSpace;screenMaterial.map=gameTarget.texture;screenMaterial.needsUpdate=true;
   resetInput();hadTracking=false;entryReady=true;entryPhase='waiting-for-frame';
   message('Waiting for the first tracked '+choice.label+' frame. Keep your headset tracking visible.');
   clearTimeout(startupTimer);startupTimer=setTimeout(()=>{
    if(session!==requested||entryFrames>0)return;
    entryError='XR opened but no tracked frame arrived. Check headset tracking, exit other immersive apps, then choose a mode again.';entryPhase='failed';entryAutoStart=false;message(entryError);void exit();
   },12000);startupTimer.unref?.();
  }catch(error){
   entryError=xrFailureText(error);entryPhase='failed';entryAutoStart=false;entryReady=false;clearTimeout(startupTimer);
   if(requested){try{await requested.end();}catch{}onEnd(requested);}
   else {session=null;renderer.xr.enabled=false;renderer.setClearAlpha?.(1);}
   message(entryError);
  }finally{requesting=false;message(entryError||status);}
 }
 function onEnd(endedSession){
  if(endedSession&&session!==endedSession)return;
  clearTimeout(startupTimer);entryAutoStart=entryReady=false;menuPose=null;menuAnchor.reset();dialogs.restore();
  spatial?.end();view.spatial?.setSkipRender(false);renderer.setClearAlpha?.(1);session=null;ending=false;hudRequested=false;suppressGameRender=false;resetInput();for(const src of sources.keys())release(src);
  renderer.xr.enabled=false;renderer.setRenderTarget(null);savedRenderer=null;view.setQuality(view.inspect().quality);
  if(playing())actions.pause();if(!entryError)entryPhase='idle';message(entryError||'XR ended. Progress is preserved. Choose any mode or resume on screen.');
 }
 async function exit(){
  if(!session||ending)return;ending=true;resetInput();if(playing())actions.pause();
  try{await session.end();}catch(error){ending=false;message('Could not end XR: '+(error?.message||String(error))+'. Use the headset system exit.');}
 }
 for(const b of buttons)b.onclick=()=>enter();
 entry=bindXREntry({enter,recheck:checkSupport});
 renderer.xr.enabled=false;void checkSupport();
 function poll(now,dt,frame){
  viewerReady=false;held={};x=y=turn=lookPitch=0;hoverPanel=hoverBar='';xrActivity=false;tracked=handCount=controllerCount=0;
  if(!session||!entryReady||!renderer.xr.isPresenting||!frame||ending){frameBlocked=true;if(session)resetInput();return;}
  frames++;frameBlocked=false;
  if(session.visibilityState!=='visible'){
   frameBlocked=true;resetInput();reticle.visible=false;for(const v of visuals)v.root.visible=false;
   if(active())actions.pause();return;
  }
  frameContext=inputContext();
  if(frameContext!==lastContext){
   for(const v of sources.values()){
    v.axisGate.reset();v.repeat.reset();v.contextButton.reset();
    // A menu/wheel close is not a fresh gameplay button press.
    if(frameContext==='play'){hudRequested=false;v.presses.forEach(p=>p.reset());v.capture=null;}
   }
   if(!actions.wheelActive())wheelOwner=null;lastContext=frameContext;
  }
  const reference=renderer.xr.getReferenceSpace();
  const viewer=frame.getViewerPose(reference);
  if(!validPose(viewer)){frameBlocked=true;resetInput();reticle.visible=false;for(const v of visuals)v.root.visible=false;if(hadTracking&&active())actions.pause();hadTracking=false;return;}
  viewerReady=true;menuPose=viewer;
  // Anchor once in front of this viewer, not at an assumed room origin. Keep
  // the theatre stationary afterwards; head movement never moves the player.
  if(!theatrePlaced){const p=viewer.transform.position;orientation.copy(viewer.transform.orientation);stage.position.set(p.x,p.y-1.6,p.z);stage.rotation.y=new T.Euler().setFromQuaternion(orientation,'YXZ').y;theatrePlaced=true;}
  spatial?.poll(viewer,frame,reference);const leftSource=Array.from(session.inputSources).find(s=>s.handedness==='left');menuAnchor.tick(now,trackedPose(frame,leftSource?.gripSpace||leftSource?.targetRaySpace,reference),referenceType);
  for(const src of sources.keys())if(!Array.from(session.inputSources).includes(src))release(src);
  for(const src of Array.from(session.inputSources).slice(0,4)){
   const value=acquire(src);if(!value)continue;const {visual}=value;
   const pose=trackedPose(frame,src.targetRaySpace,reference),present=validPose(pose);
   visual.root.visible=present;visual.grip.visible=present&&!src.hand;
   for(const j of visual.joints.values())j.visible=false;
   if(present){tracked++;applyPose(visual.ray,pose);const grip=trackedPose(frame,src.gripSpace,reference);applyPose(visual.grip,validPose(grip)?grip:pose);}
   const input=xrButtons(src);let press=input.buttons[0],pinchValid=true;
   if(src.hand){
    if(present)handCount++;
    const a=jointPose(frame,src.hand.get('thumb-tip'),reference),b=jointPose(frame,src.hand.get('index-finger-tip'),reference);
    const distance=pinchDistance(a?.transform?.position,b?.transform?.position);pinchValid=distance!==null;value.pinch=pinchDown(distance,value.pinch);press=value.pinch;
    for(const [name,space]of src.hand){
     const jp=jointPose(frame,space,reference);if(!validPose(jp))continue;
     let j=visual.joints.get(name);if(!j){if(visual.joints.size>=25)break;j=new T.Mesh(geo,handMaterial);visual.joints.set(name,j);visual.root.add(j);}
     applyPose(j,jp);j.scale.setScalar(cap(jp.radius||.008,.004,.018));j.visible=true;
    }
    input.buttons[0]=press;
    if(distance===null){value.presses[0].reset();value.capture=null;}
   }else if(present)controllerCount++;
   const edges=input.buttons.map((down,i)=>value.presses[i].read(present&&(i!==0||pinchValid),down));
   const stick=value.axisGate.read(present,input.x,input.y),menuDirection=value.repeat.read(stick.x,stick.y,now);
   const select=edges[0],hit=present?hitTarget(pose):null;visual.dot.visible=!!hit&&Number.isFinite(hit.distance);visual.ray.scale.z=visual.dot.visible?Math.max(.01,hit.distance)/4:1;if(visual.dot.visible)visual.dot.position.copy(pointer).addScaledVector(direction,hit.distance);
   if(!present){if(wheelOwner===src){actions.closeWheel(false);wheelOwner=null;frameBlocked=true;}value.capture=null;value.contextButton.reset();value.repeat.reset();continue;}
   if(inputContext()!==frameContext){frameBlocked=true;continue;}
   if(hit){if(hit.kind==='panel')hoverPanel=hit.key;else hoverBar=hit.key;}
   const modal=!!ui.root(),wheel=actions.wheelActive();
   if(select.pressed){
    value.capture=hit?.id||(modal||wheel?'blocked':null);
    if(hit){invoke(hit);xrActivity=true;}
   }
   // A trigger used in a UI never leaks into an attack if the pointer moves.
   if(select.down&&hit&&!value.capture)value.capture='blocked';
   if(select.down&&value.capture===hit?.id&&hit?.hold&&!ui.root()&&!actions.wheelActive()&&active()){held[hit.hold]=true;xrActivity=true;}
   if(select.released)value.capture=null;
   if(inputContext()!==frameContext){frameBlocked=true;continue;}
   if(modal){
    if(src.handedness==='left'){
     if(menuDirection)ui.navigate(menuDirection);
     if(edges[1]?.pressed)ui.tabs(-1);
    }else if(src.handedness==='right'){
     if(edges[5]?.pressed)ui.back();else if(edges[4]?.pressed)ui.confirm();
     if(edges[1]?.pressed)ui.tabs(1);
     if(Math.abs(stick.y)>.1)ui.scroll(stick.y*dt*460);
    }
    continue;
   }
   if(wheel){
    const command=xrWheelCommand(src.handedness,stick,edges,{owner:wheelOwner===src,direction:menuDirection});
    if(command.close!==null){actions.closeWheel(command.close);wheelOwner=null;frameBlocked=true;}
    else actions.updateWheel(command.x,command.y,command.variant,0);
    continue;
   }
   if(hudRequested&&src.handedness==='right'&&edges[5]?.pressed){hudRequested=false;resetInput();frameBlocked=true;updateHUD();continue;}
   if(!active())continue;
   if(src.handedness==='left'){
    x+=stick.x;y+=stick.y;held.aim ||= select.down&&!value.capture&&!hit;
    if(edges[4]?.pressed)actions.quickTool();if(edges[5]?.pressed)actions.dispatch();
    if(edges[1]?.pressed){actions.openWheel('tools');wheelOwner=src;}
    if(edges[3]?.down)held.sprint=true;
   }else if(src.handedness==='right'){
    turn+=stick.x;lookPitch+=stick.y;held.fire ||= select.down&&!value.capture&&!hit;
    if(edges[4]?.pressed)actions.jump();
    const state=getState(),command=value.contextButton.read({...edges[5],now,canReload:state.mode==='foot'&&state.resonance.tool==='sling'&&(held.aim||state.resonance.aim)});
    if(command==='reload')actions.reload();else if(command==='interact')actions.interact();
    if(edges[1]?.pressed)actions.dodge();if(edges[3]?.pressed)actions.recenter();
   }
   xrActivity ||= Math.abs(stick.x)+Math.abs(stick.y)>.01||edges.some(e=>e.down);
  }
  if(!tracked&&hadTracking){frameBlocked=true;resetInput();if(active())actions.pause();}hadTracking=tracked>0;
  reticle.visible=active()&&getState().mode==='foot'&&!!getState().resonance.aim;reticle.material.color.set(getState().resonance.lock?'#80e2bd':'#fff4de');frameBlocked ||= inputContext()!==frameContext;updateHUD();if(panelMesh.visible)panel.draw(now,hoverPanel);if(toolbar.visible)bar.draw(hoverBar);
 }
 function controls(dt,fallback={}){
  if(!session||ending||frameBlocked||session.visibilityState!=='visible'||!active()||ui.root()||actions.wheelActive())return neutralXR();
  if(!xrActivity&&!Object.values(held).some(Boolean)){
   const turn=cap(-(fallback.look||0)/(Math.max(.001,dt)*1.6),-1,1),pose=spatial?.controls(Math.abs(fallback.throttle||0),0,turn);if(!pose)return {...neutralXR(),...fallback};if(pose.blocked)return neutralXR();
   const delta=pose.heading-actions.heading();return {...neutralXR(),...fallback,cameraYaw:pose.heading,moveYaw:Number.isFinite(fallback.moveYaw)?fallback.moveYaw+delta:undefined,look:0};
  }
  const mx=cap(x+(held.right?1:0)-(held.left?1:0),-1,1),my=cap(y+(held.backward?1:0)-(held.forward?1:0),-1,1),look=cap(turn+(held.turnRight?1:0)-(held.turnLeft?1:0),-1,1);
  const pose=spatial?.controls(mx,my,look);if(pose?.blocked)return neutralXR();return {...xrLocomotion(getState(),mx,my,pose?0:look,held,pose?.heading??actions.heading(),dt),lookY:pose||spatial?.effective()==='diorama'?0:cap(lookPitch,-1,1)*dt*2.1};
 }
 function beforeGame(){
  if(!session||!renderer.xr.isPresenting||!gameTarget)return;
  suppressGameRender=!!spatial&&spatial.effective()!=='theatre';view.spatial?.setSkipRender(suppressGameRender);
  savedRenderer=beginXRPass(renderer,gameTarget,suppressGameRender);
  if(!suppressGameRender){view.camera.aspect=16/9;view.camera.updateProjectionMatrix();}
 }
 function fail(error){
  entryError=xrFailureText(error);entryPhase='failed';entryAutoStart=false;
  if(savedRenderer){const old=savedRenderer;savedRenderer=null;restoreXRPass(renderer,old);}
  suppressGameRender=false;view.spatial?.setSkipRender(false);renderer.xr.enabled=true;message(entryError);
  void exit().catch(endError=>{console.error(endError);onEnd(session);});
 }
 function afterGame(){
  if(!savedRenderer||!session)return;
  const old=savedRenderer;savedRenderer=null;restoreXRPass(renderer,old);
  renderer.xr.enabled=true;suppressGameRender=false;updateHUD();
  const real=spatial&&spatial.effective()!=='theatre';screen.visible=!real;reticle.visible=reticle.visible&&!real;toolbar.position.set(-.44,real?.6:.43,real?-.6:-2.38);toolbar.scale.setScalar(real?.55:1);
  try{
   if(!spatial?.draw(renderer,camera))renderer.render(scene,camera);
   if(entryReady&&viewerReady){
    entryFrames++;
    if(entryFrames===1){clearTimeout(startupTimer);entryPhase='running';message((XR_MODES[entrySelection]?.label||'XR')+' is running. Select the small gold control or exhibit handle for menus.');
     if(entryAutoStart){entryAutoStart=false;if(!playing())actions.start();else if(document.getElementById('pause-dialog')?.open)document.getElementById('resume').click();}
    }
   }
  }catch(error){fail(error);}
  finally{view.spatial?.setSkipRender(false);}

 }
 return {fail,visible:()=>immersiveVisible(!!session&&renderer.xr.isPresenting,session?.visibilityState,entryReady,ending),poll,controls,beforeGame,afterGame,spatialAction:action=>{if(!session||!spatial)return false;return spatial.modify(action);},presenting:()=>!!session&&renderer.xr.isPresenting,inspect:()=>({supported,presenting:!!session&&renderer.xr.isPresenting,mode:spatial?.effective()==='first-person'?(sessionMode==='immersive-ar'?'first-person-ar':'first-person-vr'):spatial?.effective()==='diorama'?(sessionMode==='immersive-ar'?'diorama-ar':'diorama-vr'):'seated-theatre',sessionMode,arSupported,spatial:spatial?.inspect()||null,entry:{build:XR_ENTRY_BUILD,phase:entryPhase,selection:entrySelection,frames:entryFrames,error:entryError,vr:vrSupported,ar:arSupported},referenceType,theatreOrigin:{x:stage.position.x,y:stage.position.y,z:stage.position.z,yaw:stage.rotation.y},status,tracked,handCount,controllerCount,frames,renderTargets:gameTarget?1:0,targetSize:gameTarget?[gameTarget.width,gameTarget.height]:null,sourceCapacity:4,sources:sources.size,readbackCopies,reticleVisible:reticle.visible,repair:XR_REPAIR_BUILD,dialogs:dialogs.inspect(),hud:{panel:menuAnchor.inspect(),panelVisible:panelMesh.visible,toolbarVisible:toolbar.visible,requested:hudRequested,toggle:hudToggle.position.toArray()},panel:panel.inspect(),physicalQuestVerified:false})};
}
