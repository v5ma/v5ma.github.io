/* Optional seated WebXR theatre for the EXISTING game. The game scene, save,
 * reducers and camera remain authoritative. Both tracked controllers and hands
 * operate the same in-headset UI. This is not room-scale first-person gameplay.
 * Pinned local Three.js; no remote runtime, model, permission or account service.
 */
import * as T from './vendor/three.module.js';
import {createXRPress,xrButtons,pinchDistance,pinchDown,xrLocomotion,neutralXR} from './xr-input.mjs';
import {createXRPanel,createXRToolbar} from './xr-panel.mjs';
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
const validPose=p=>p?.transform&&[p.transform.position.x,p.transform.position.y,p.transform.position.z,p.transform.orientation.x,p.transform.orientation.y,p.transform.orientation.z,p.transform.orientation.w].every(Number.isFinite);
export function createGuildXR({renderer,view,getState,playing,active,actions,ui,consoleUI,clearInput}){
 let session=null,supported=false,requesting=false,status='Checking immersive VR support.',referenceType='local-floor',ending=false,theatrePlaced=false;
 let gameTarget=null,savedRenderer=null,hadTracking=false,frames=0,tracked=0,handCount=0,controllerCount=0,readbackCopies=0;
 let turn=0,x=0,y=0,held={},hoverPanel='',hoverBar='',xrActivity=false;
 const scene=new T.Scene();scene.background=new T.Color('#101b27');
 const camera=new T.PerspectiveCamera(55,1,.05,30),stage=new T.Group();scene.add(stage);
 const sources=new Map(),visuals=[];
 const geo=new T.SphereGeometry(1,6,4),handleGeo=new T.BoxGeometry(.042,.042,.12),rayGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-4)]);
 const handMaterial=new T.MeshBasicMaterial({color:'#d4b68e',toneMapped:false}),leftMaterial=new T.MeshBasicMaterial({color:'#83cfdf',toneMapped:false}),rightMaterial=new T.MeshBasicMaterial({color:'#f5cf8f',toneMapped:false}),rayMaterial=new T.LineBasicMaterial({color:'#def8ff',toneMapped:false});
 const raycaster=new T.Raycaster(),pointer=new T.Vector3(),direction=new T.Vector3(),orientation=new T.Quaternion();
 const panel=createXRPanel({ui,actions,getState,consoleUI,exit:()=>exit()}),bar=createXRToolbar(actions);
 const screenMaterial=new T.MeshBasicMaterial({side:T.DoubleSide,toneMapped:false});
 const screen=new T.Mesh(new T.PlaneGeometry(2.85,1.603125),screenMaterial);screen.position.set(-.44,1.63,-2.65);stage.add(screen);
 const reticle=new T.Mesh(new T.RingGeometry(.011,.015,32),new T.MeshBasicMaterial({color:'#fff4de',toneMapped:false,side:T.DoubleSide}));reticle.position.copy(screen.position);reticle.position.z+=.008;reticle.visible=false;stage.add(reticle);
 const panelMesh=new T.Mesh(new T.PlaneGeometry(1.10,1.65),new T.MeshBasicMaterial({map:panel.texture,side:T.DoubleSide,toneMapped:false}));panelMesh.position.set(1.61,1.60,-2.37);panelMesh.rotation.y=-.42;stage.add(panelMesh);
 const toolbar=new T.Mesh(new T.PlaneGeometry(2.85,.7125),new T.MeshBasicMaterial({map:bar.texture,side:T.DoubleSide,toneMapped:false}));toolbar.position.set(-.44,.43,-2.38);toolbar.rotation.x=-.16;stage.add(toolbar);
 const notice=document.createElement('p');notice.id='guild-xr-status';notice.setAttribute('role','status');notice.textContent=status;
 const titleButton=document.createElement('button');titleButton.id='guild-xr-enter';titleButton.textContent='Enter seated XR (Quest)';titleButton.disabled=true;titleButton.setAttribute('aria-describedby',notice.id);
 const pauseButton=titleButton.cloneNode(true);pauseButton.id='guild-xr-pause';
 document.getElementById('start').after(titleButton,notice);document.getElementById('resume').after(pauseButton);
 const buttons=[titleButton,pauseButton];
 // Menu/region handlers sometimes request an immediate ordinary scene update.
 // Never let WebXRManager replace that game's camera with the headset camera.
 const updateGame=view.update;
 view.update=(...args)=>{const enabled=renderer.xr.enabled;if(session&&renderer.xr.isPresenting)renderer.xr.enabled=false;try{return updateGame(...args);}finally{renderer.xr.enabled=enabled;}};
 function message(text){status=text;notice.textContent=text;for(const b of buttons){b.disabled=requesting||(!supported&&!session);b.textContent=session?'Exit seated XR':'Enter seated XR (Quest)';}}
 function resetInput(){held={};x=y=turn=0;xrActivity=false;clearInput?.();for(const s of sources.values()){s.capture=null;s.pinch=false;s.presses.forEach(p=>p.reset());}}
 function makeVisual(){
  const root=new T.Group(),ray=new T.Line(rayGeo,rayMaterial),grip=new T.Mesh(handleGeo,rightMaterial),joints=new Map();root.add(ray,grip);scene.add(root);root.visible=false;
  return {root,ray,grip,joints};
 }
 function acquire(source){
  if(sources.has(source))return sources.get(source);
  if(sources.size>=4)return null;
  let visual=visuals.find(v=>!v.source);if(!visual){visual=makeVisual();visuals.push(visual);}visual.source=source;visual.grip.material=source.handedness==='left'?leftMaterial:rightMaterial;
  const value={visual,presses:Array.from({length:7},createXRPress),pinch:false,capture:null};sources.set(source,value);return value;
 }
 function release(source){const v=sources.get(source);if(!v)return;v.visual.root.visible=false;v.visual.source=null;v.presses.forEach(p=>p.reset());sources.delete(source);}
 function trackedPose(frame,space,reference){try{return space?frame?.getPose(space,reference):null;}catch{return null;}}
 function jointPose(frame,space,reference){try{return space?frame?.getJointPose(space,reference):null;}catch{return null;}}
 function applyPose(object,pose){object.position.copy(pose.transform.position);object.quaternion.copy(pose.transform.orientation);object.updateMatrixWorld(true);}
 function hitTarget(pose){
  pointer.copy(pose.transform.position);orientation.copy(pose.transform.orientation);direction.set(0,0,-1).applyQuaternion(orientation).normalize();raycaster.set(pointer,direction);raycaster.far=8;
  stage.updateWorldMatrix(true,true);const hits=raycaster.intersectObjects([panelMesh,toolbar],false);
  if(!hits.length)return null;const h=hits[0],kind=h.object===panelMesh?'panel':'bar',b=kind==='panel'?panel.hit(h.uv.x,h.uv.y):bar.hit(h.uv.x,h.uv.y);
  return b?{...b,kind,id:kind+':'+b.key}:null;
 }
 function invoke(hit){if(hit.kind==='panel')panel.invoke(hit.key);else if(!ui.root()&&!actions.wheelActive()&&active())hit.run?.();}
 async function enter(){
  if(session){await exit();return;}if(requesting||!supported)return;
  actions.gesture?.();requesting=true;message('Requesting optional hand tracking and immersive VR.');
  let requested=null;
  try{
   requested=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','hand-tracking']});
   try{await requested.requestReferenceSpace('local-floor');referenceType='local-floor';}catch{referenceType='local';}
   renderer.xr.setReferenceSpaceType(referenceType);renderer.xr.setFramebufferScaleFactor(.85);renderer.xr.enabled=true;
   session=requested;ending=false;requested.addEventListener('end',()=>queueMicrotask(onEnd),{once:true});
   requested.addEventListener('visibilitychange',()=>{resetInput();if(requested.visibilityState!=='visible'&&playing())actions.pause();});
   requested.addEventListener('inputsourceschange',()=>{for(const src of sources.keys())if(!Array.from(requested.inputSources).includes(src))release(src);});
   await renderer.xr.setSession(requested);
   theatrePlaced=false;renderer.xr.getReferenceSpace()?.addEventListener?.('reset',()=>{theatrePlaced=false;resetInput();});
   gameTarget ||= new T.WebGLRenderTarget(1024,576,{depthBuffer:true});gameTarget.texture.colorSpace=T.SRGBColorSpace;screenMaterial.map=gameTarget.texture;screenMaterial.needsUpdate=true;
   resetInput();hadTracking=false;message('Seated XR. Point and trigger or pinch; release to stop. Exit XR is on the panel.');
  }catch(error){
   session=null;renderer.xr.enabled=false;
   if(requested)try{await requested.end();}catch{}
   message('XR did not start: '+(error?.message||String(error))+'. The ordinary game remains available.');
  }finally{requesting=false;message(status);}
 }
 function onEnd(){
  session=null;ending=false;resetInput();for(const src of sources.keys())release(src);
  renderer.xr.enabled=false;renderer.setRenderTarget(null);savedRenderer=null;view.setQuality(view.inspect().quality);
  if(playing())actions.pause();message('XR ended. Progress is preserved. Resume with the usual controls.');
 }
 async function exit(){
  if(!session||ending)return;ending=true;resetInput();if(playing())actions.pause();
  try{await session.end();}catch(error){ending=false;message('Could not end XR: '+(error?.message||String(error))+'. Use the headset system exit.');}
 }
 for(const b of buttons)b.onclick=()=>enter();
 renderer.xr.enabled=false;
 if(navigator.xr?.isSessionSupported&&globalThis.isSecureContext!==false){navigator.xr.isSessionSupported('immersive-vr').then(ok=>{supported=!!ok;message(ok?'Optional seated XR: tracked controllers and hand-pointer UI. Physical Quest testing is pending.':'Immersive VR is unavailable in this browser. The ordinary game is unchanged.');}).catch(()=>message('XR support could not be checked. The ordinary game is unchanged.'));}
 else message('XR requires a compatible secure WebXR browser. The ordinary game is unchanged.');
 function poll(now,dt,frame){
  held={};x=y=turn=0;hoverPanel=hoverBar='';xrActivity=false;tracked=handCount=controllerCount=0;
  if(!session||!renderer.xr.isPresenting||!frame||ending){if(session)resetInput();return;}
  const reference=renderer.xr.getReferenceSpace();
  const viewer=frame.getViewerPose(reference);
  if(!validPose(viewer)){resetInput();if(hadTracking&&playing())actions.pause();hadTracking=false;return;}
  // Anchor once in front of this viewer, not at an assumed room origin. Keep
  // the theatre stationary afterwards; head movement never moves the player.
  if(!theatrePlaced){const p=viewer.transform.position;orientation.copy(viewer.transform.orientation);stage.position.set(p.x,p.y-1.6,p.z);stage.rotation.y=new T.Euler().setFromQuaternion(orientation,'YXZ').y;theatrePlaced=true;}
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
   const select=edges[0],hit=present?hitTarget(pose):null;
   if(!present){value.capture=null;continue;}
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
   if(modal){
    if(edges[5]?.pressed&&src.handedness==='right')ui.back();
    if(edges[4]?.pressed&&src.handedness==='right'){const e=document.activeElement;if(e)ui.activate(e);}
    continue;
   }
   if(wheel){
    if(edges[5]?.pressed&&src.handedness==='right')actions.closeWheel(false);
    if(src.handedness==='left'&&edges[1]?.released)actions.closeWheel(true);
    continue;
   }
   if(!active())continue;
   if(src.handedness==='left'){
    x+=input.x;y+=input.y;held.aim ||= select.down&&!value.capture&&!hit;
    if(edges[4]?.pressed)actions.quickTool();if(edges[5]?.pressed)actions.dispatch();
    if(edges[1]?.pressed)actions.openWheel('tools');
    if(edges[3]?.down)held.sprint=true;
   }else if(src.handedness==='right'){
    turn+=input.x;held.fire ||= select.down&&!value.capture&&!hit;
    if(edges[4]?.pressed)actions.jump();if(edges[5]?.pressed)actions.interact();
    if(edges[1]?.pressed)actions.dodge();if(edges[3]?.pressed)actions.recenter();
   }
   xrActivity ||= Math.abs(input.x)+Math.abs(input.y)>.01||edges.some(e=>e.down);
  }
  if(!tracked&&hadTracking){resetInput();if(playing())actions.pause();}hadTracking=tracked>0;
  reticle.visible=active()&&getState().mode==='foot'&&!!getState().resonance.aim;reticle.material.color.set(getState().resonance.lock?'#80e2bd':'#fff4de');panel.draw(now,hoverPanel);bar.draw(hoverBar);frames++;
 }
 function controls(dt,fallback={}){
  if(!session||ending||!active()||ui.root()||actions.wheelActive())return neutralXR();
  if(!xrActivity&&!Object.values(held).some(Boolean))return fallback;
  const mx=cap(x+(held.right?1:0)-(held.left?1:0),-1,1),my=cap(y+(held.backward?1:0)-(held.forward?1:0),-1,1),look=cap(turn+(held.turnRight?1:0)-(held.turnLeft?1:0),-1,1);
  return xrLocomotion(getState(),mx,my,look,held,actions.heading(),dt);
 }
 function beforeGame(){
  if(!session||!renderer.xr.isPresenting||!gameTarget)return;
  savedRenderer={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),scissorTest:renderer.getScissorTest()};
  // Render the existing camera once into a bounded texture, not once per eye.
  // The following immersive render uses that same GPU texture; no readPixels or
  // DOM/canvas capture, additional WebGL context or frame-by-frame allocation.
  renderer.xr.enabled=false;if(renderer.getPixelRatio()!==1)renderer.setPixelRatio(1);renderer.setRenderTarget(gameTarget);renderer.setScissorTest(false);renderer.setViewport(0,0,1024,576);
  view.camera.aspect=16/9;view.camera.updateProjectionMatrix();
 }
 function afterGame(){
  if(!savedRenderer||!session)return;
  const old=savedRenderer;savedRenderer=null;renderer.setRenderTarget(old.target);renderer.setViewport(old.viewport);renderer.setScissor(old.scissor);renderer.setScissorTest(old.scissorTest);
  renderer.xr.enabled=true;renderer.render(scene,camera);
 }
 return {poll,controls,beforeGame,afterGame,presenting:()=>!!session&&renderer.xr.isPresenting,inspect:()=>({supported,presenting:!!session&&renderer.xr.isPresenting,mode:'seated-theatre',referenceType,theatreOrigin:{x:stage.position.x,y:stage.position.y,z:stage.position.z,yaw:stage.rotation.y},status,tracked,handCount,controllerCount,frames,renderTargets:gameTarget?1:0,targetSize:gameTarget?[gameTarget.width,gameTarget.height]:null,sourceCapacity:4,sources:sources.size,readbackCopies,reticleVisible:reticle.visible,panel:panel.inspect(),physicalQuestVerified:false})};
}
