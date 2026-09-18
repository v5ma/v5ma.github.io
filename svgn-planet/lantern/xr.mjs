/* Native per-eye geometry, not a render-target theater. Tracking stays in metres. */
import * as T from '../vendor/three.module.js';
import {clamp,lineClear,support,floorHeight} from './core.mjs';
import {watchState,watchRuntime} from './watch.mjs';
import {loadXRPrefs,saveXRPrefs,sourceRoles,motionStrike,guardPose,xrNeutral} from './xr-input.mjs';
export function createXR(view,hooks){
 const {renderer,scene,camera,rig,world}=view;
 const loaded=loadXRPrefs(hooks.storage);let prefs=loaded.prefs,prefsBlocked=loaded.blocked,handActions=false,section='',aiming=false,lastNow=0;
 let motionStrikes=0,menuGestures=0;
 function preference(k,v){prefs={...prefs,[k]:v};if(!prefsBlocked&&!saveXRPrefs(hooks.storage,prefs)){prefsBlocked=true;hooks.message('XR control preferences could not be saved. Current-session controls still work; original preference data retained.');}clear();lastPaint=0;}
 function back(){if(section==='help'){section='controls';page=0;lastPaint=0;clear();return;}if(hooks.confirmation?.()){hooks.cancelConfirmation();lastPaint=0;return;}if(section||missionPage){section='';missionPage=false;page=0;focused=0;lastPaint=0;clear();return;}hooks.pause(false);}
 function field(name){hooks.pause(false);clear();hooks.action(name);}
 let session=null,kind='diorama-vr',pending=false,align=true,origin=new T.Vector3(),heading=0,frames=0,selections=0,tracked=0,lastPaint=0,page=0,wasPaused=true,error='';
 const settings={scale:.04,height:-.9,distance:1.55,rotation:0};let movementYaw=0,lastViewer=null,missionPage=false;
 const panelOrigin=new T.Vector3();let panelHeading=0;
 const panelGroup=new T.Group();rig.add(panelGroup);
 const mapCanvas=document.createElement('canvas');mapCanvas.width=460;mapCanvas.height=390;
 const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d'),tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.4,1.05),new T.MeshBasicMaterial({map:tex,toneMapped:false,side:T.DoubleSide,depthTest:false}));panel.renderOrder=1002;panelGroup.add(panel);panelGroup.visible=false;
 const lineGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-5)]),jointGeo=new T.SphereGeometry(.009,6,4),jointMat=new T.MeshBasicMaterial({color:0xa4e7d9});
 const slots=[0,1].map(()=>{const ray=new T.Line(lineGeo,new T.LineBasicMaterial({color:0x8be5db})),grip=new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(.022,1)),new T.LineBasicMaterial({color:0x87b9b5,transparent:true,opacity:.4,depthWrite:false,depthTest:true})),joints=Array.from({length:25},()=>new T.Mesh(jointGeo,jointMat));rig.add(ray,grip,...joints);return {ray,grip,joints,src:null,prev:[],pinch:false,ready:false,tracked:false,lastHand:null,lastHead:null,motionArmed:true,menuHeld:0,gestureUsed:false};});
 const caster=new T.Raycaster();let rows=[],focused=0,panelSignature='',input={x:0,y:0,boost:false,brake:false},lastSnap=false;
 function clear(){input={x:0,y:0,boost:false,brake:false};for(const s of slots){s.lastRelative=null;s.ready=false;s.prev=[];s.pinch=false;s.lastHand=null;s.lastHead=null;s.motionArmed=true;s.menuHeld=0;s.gestureUsed=false;}hooks.clear();}
 function pause(){hooks.pause(true);clear();}
 function place(v){origin.copy(v.transform.position);panelOrigin.copy(v.transform.position);const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(v.transform.orientation));heading=Math.atan2(-f.x,-f.z);panelHeading=heading;align=false;}
 function setMode(next){if(!session)return;const ar=kind.endsWith('-ar');kind=next==='first'?'first-person-'+(ar?'ar':'vr'):'diorama-'+(ar?'ar':'vr');align=true;pause();lastPaint=-Infinity;}
 function present(state){if(!session||!lastViewer)return;const first=kind.startsWith('first-person');
  if(first){view.stopPortal();rig.rotation.set(0,hooks.yaw()-heading,0);const offset=origin.clone().applyAxisAngle(new T.Vector3(0,1,0),rig.rotation.y);const f=support(state,state.x,state.z,state.y),y=state.lift||watchRuntime(state).travel?state.y:f?floorHeight(f,state.z):state.safe[1];rig.position.set(state.x-offset.x,y+1.65-offset.y,state.z-offset.z);}
  else{rig.position.set(0,0,0);rig.rotation.set(0,0,0);view.presentPortal(state,settings,origin,heading,hooks.yaw());}
  const ar=kind.endsWith('-ar');world.visible=!(first&&ar&&view.curtain.visible);view.curtain.material.transparent=ar;view.curtain.material.opacity=ar?0:1;view.curtain.material.depthWrite=false;
  rig.updateMatrixWorld(true);world.updateMatrixWorld(true);
  if(!first){const eye=world.worldToLocal(rig.localToWorld(new T.Vector3().copy(lastViewer.transform.position)));view.cutaway(state,eye);}
 }
 function finish(){document.body.classList.remove('in-xr');session=null;pending=false;lastViewer=null;missionPage=false;section='';handActions=false;view.stopPortal();world.visible=true;view.curtain.visible=false;panelGroup.visible=false;clear();renderer.xr.enabled=false;renderer.setRenderTarget(null);renderer.shadowMap.enabled=true;renderer.setClearColor(0xabc8cb,1);scene.background=new T.Color(0xabc8cb);scene.fog=new T.Fog(0xabc8cb,55,140);rig.position.set(0,0,0);rig.rotation.set(0,0,0);world.position.set(0,0,0);world.rotation.set(0,0,0);world.scale.setScalar(1);camera.position.set(20,25,30);camera.rotation.set(0,0,0);view.resize();slots.forEach(s=>{s.ray.visible=s.grip.visible=false;s.joints.forEach(j=>j.visible=false);});hooks.pause(true);hooks.message('XR ended. Desktop controls are ready after release.');}
 async function enter(mode){
  if(session||pending)return;pending=true;error='';kind=mode;
  try{
   if(!navigator.xr)throw Error('WebXR is unavailable here. Desktop play remains available.');
   const next=await navigator.xr.requestSession(mode.endsWith('-ar')?'immersive-ar':'immersive-vr',{optionalFeatures:['hand-tracking','local-floor']});session=next;
   if(mode.endsWith('-ar')&&next.environmentBlendMode==='opaque'){await next.end();session=null;throw Error('This session cannot show passthrough. Choose VR or desktop explicitly.');}
   renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFoveation(1);renderer.shadowMap.enabled=false;camera.position.set(0,0,0);camera.rotation.set(0,0,0);
   next.addEventListener('end',()=>queueMicrotask(finish),{once:true});next.addEventListener('inputsourceschange',pause);next.addEventListener('visibilitychange',pause);
   await renderer.xr.setSession(next);document.body.classList.add('in-xr');align=true;pause();panelGroup.visible=true;scene.fog=null;scene.background=mode.endsWith('-ar')?null:new T.Color(0x162b35);renderer.setClearColor(0x162b35,mode.endsWith('-ar')?0:1);
  }catch(e){error=String(e.message||e);if(session)try{await session.end();}catch{}finish();hooks.message(error);}finally{pending=false;}
 }
 function actions(){
  if(hooks.paused()&&section==='help')return [
   [(prefs.swapSticks?'Right':'Left')+' stick moves; click and hold it to sprint in Action.'],
   ['Main hand: '+prefs.dominant+'. '+(prefs.profile==='action'?'Grip interacts; trigger strikes.':'Trigger interacts; grip throws.')],
   ['Hold the other trigger to aim; main trigger fires the selected tool.'],
   ['Other grip guards and brakes. Hold it near your chest, or turn Motion strikes off.'],
   [(prefs.dominant==='right'?'A hops, B mounts. ':'X hops, Y mounts. ')+(prefs.profile==='courier'?(prefs.dominant==='right'?'X or Y opens Menu.':'A or B opens Menu.'):(prefs.dominant==='right'?'X scans, Y opens Menu.':'A scans, B opens Menu.'))],
   ['Click the turning stick to cycle grapple, pulse and smoke.'],
   ['Hands: raise a pinch near your head for Menu. Release before selecting.'],
   ['Low pinch holds walking; ordinary pinch interacts. Release to stop.'],
   ['Motion strikes use a modest forward gesture. Never swing harder.'],
   ['Motion strikes off provides seated trigger attack and button guarding.'],
   ['Courier preset: main trigger interacts, main grip throws; other trigger holds speed.'],
   ['First-person grapples hide virtual motion briefly; AR reveals your room.']
  ];
  if(hooks.paused()&&hooks.confirmation?.())return [['Keep current progress',()=>{hooks.cancelConfirmation();clear();lastPaint=0;}],['Confirm replacement',()=>{hooks.menuAction('replace');clear();lastPaint=0;}]];
  if(hooks.paused()&&section==='controls')return [
   ['Profile: '+prefs.profile,()=>preference('profile',prefs.profile==='action'?'courier':'action')],
   ['Dominant: '+prefs.dominant,()=>preference('dominant',prefs.dominant==='right'?'left':'right')],
   ['Swap sticks: '+(prefs.swapSticks?'on':'off'),()=>preference('swapSticks',!prefs.swapSticks)],
   ['Snap turn: '+prefs.snap,()=>preference('snap',prefs.snap===30?45:30)],
   ['Motion strikes: '+(prefs.motionPunch?'on':'off'),()=>preference('motionPunch',!prefs.motionPunch)],
   ['Hand action panel: '+(handActions?'on':'off'),()=>{handActions=!handActions;clear();lastPaint=0;}],
   ['Controls explained',()=>{section='help';page=0;error='';lastPaint=0;}],
   ['Back to Menu',()=>{section='';page=0;error='';lastPaint=0;}]
  ];
  if(hooks.paused()&&section==='tools')return [['Scanner',()=>field('scan')],['Grapple',()=>field('grapple')],['Pulse',()=>field('pulse')],['Smoke',()=>field('smoke')],['Change approach',()=>field('watch-route')],['Recover at watch desk',()=>field('watch-recover')],['Back to Menu',()=>{section='';page=0;lastPaint=0;}]];
  if(hooks.paused()&&section==='saves')return [['Save progress',()=>hooks.menuAction('save')],['Export current progress',()=>hooks.menuAction('export')],['Export original data',()=>hooks.menuAction('export-original')],['Restore backup',()=>{hooks.menuAction('restore');focused=0;page=0;lastPaint=0;clear();}],['Restart chapter',()=>{hooks.menuAction('restart');focused=0;page=0;lastPaint=0;clear();}],['Back to Menu',()=>{section='';page=0;lastPaint=0;}]];
  if(hooks.paused()&&missionPage)return [...hooks.missions().map(m=>[m.title,()=>{hooks.track(m.id);missionPage=false;hooks.pause(false);}]),['Display settings',()=>{missionPage=false;page=0;lastPaint=0;}]];
  if(hooks.paused())return [
   ['Resume',()=>hooks.pause(false)],['Missions / map',()=>{missionPage=true;page=0;lastPaint=0;}],['Field tools',()=>{section='tools';page=0;lastPaint=0;}],['Controls',()=>{section='controls';page=0;lastPaint=0;}],['Save / recovery',()=>{section='saves';page=0;lastPaint=0;}],['Exit XR',()=>session?.end()],[kind.endsWith('-ar')?'First-person AR':'First-person VR',()=>setMode('first')],[kind.endsWith('-ar')?'Diorama AR':'Diorama VR',()=>setMode('diorama')],
   ['Top open',()=>view.setOpening('top')],['Front open',()=>view.setOpening('front')],['Both open',()=>view.setOpening('both')],
   ['Smaller model',()=>{settings.scale=clamp(settings.scale-.008,.024,.075);pause();}],['Larger model',()=>{settings.scale=clamp(settings.scale+.008,.024,.075);pause();}],
   ['Lower stand',()=>{settings.height=clamp(settings.height-.12,-1.2,-.1);pause();}],['Raise stand',()=>{settings.height=clamp(settings.height+.12,-1.2,-.1);pause();}],
   ['Bring nearer',()=>{settings.distance=clamp(settings.distance-.2,1.2,2.8);pause();}],['Move farther',()=>{settings.distance=clamp(settings.distance+.2,1.2,2.8);pause();}],
   ['Missions / map',()=>{missionPage=true;page=0;lastPaint=0;}],['Rotate stand',()=>{settings.rotation+=Math.PI/4;pause();}],['Recenter',()=>{align=true;pause();}],['Save progress',hooks.save],['Exit XR',()=>session?.end()]
  ];
  return [['Interact',()=>hooks.action('interact')],['Hop',()=>hooks.action('hop')],['Mount / dock',()=>hooks.action('ride')],['Throw',()=>hooks.action('throw')],['Forward (hold)',null,'forward'],['Brake (hold)',null,'brake'],['Turn left',()=>hooks.turn(-Math.PI/6)],['Turn right',()=>hooks.turn(Math.PI/6)],['Bell',()=>hooks.action('bell')],['Missions / map',()=>{missionPage=true;hooks.pause(true);page=0;lastPaint=0;}],['Menu / display',()=>hooks.pause(true)],['Hide hand actions',()=>{handActions=false;clear();}],['Scanner',()=>hooks.action('scan')],['Strike',()=>hooks.action('strike')],['Guard (hold)',null,'guard'],['Grapple',()=>hooks.action('grapple')],['Pulse',()=>hooks.action('pulse')]];
 }
 function paint(now){
  const paused=hooks.paused(),items=actions(),pages=Math.ceil(items.length/6);page=Math.min(page,pages-1);rows=[];
  ctx.fillStyle='#142c36';ctx.fillRect(0,0,1024,768);ctx.fillStyle='#f3dfb5';ctx.font='bold 37px sans-serif';ctx.fillText(paused?(hooks.confirmation?.()?'LANTERN WARD / CONFIRM':missionPage?'LANTERN WARD / MISSIONS & MAP':'LANTERN WARD / '+(section||'MENU').toUpperCase()):'LANTERN WARD / ACTIONS',35,58);
  ctx.font='23px sans-serif';const words=(hooks.confirmation?.()||error||hooks.goal()).split(' ');let line='',y=105;for(const w of words){if(ctx.measureText(line+w).width>935){ctx.fillText(line,35,y);y+=29;line='';if(y>163){line='Open the relevant menu page for more details.';y=163;break;}}line+=w+' ';}ctx.fillText(line,35,y);
  if(paused&&section==='help'){ctx.fillStyle='#fff0cf';ctx.font='25px sans-serif';items.slice(page*6,page*6+6).forEach(([label],i)=>ctx.fillText(label,35,235+i*62,945));}
  else if(paused&&missionPage){hooks.map?.(mapCanvas);ctx.drawImage(mapCanvas,30,210);items.slice(page*6,page*6+6).forEach(([label,fn,hold],i)=>rows.push({label,fn,hold,x:515,y:210+i*65,w:475,h:58}));}
  else items.slice(page*6,page*6+6).forEach(([label,fn,hold],i)=>rows.push({label,fn,hold,x:35+(i%2)*490,y:210+Math.floor(i/2)*130,w:464,h:108}));
  rows.push({label:'Previous',fn:()=>{page=(page+pages-1)%pages;lastPaint=0;},x:35,y:634,w:305,h:92},{label:'Next '+(page+1)+'/'+pages,fn:()=>{page=(page+1)%pages;lastPaint=0;},x:355,y:634,w:310,h:92},{label:paused?'Back / resume':'Menu',fn:()=>hooks.paused()?back():hooks.pause(true),x:680,y:634,w:310,h:92});
  for(const r of rows){ctx.fillStyle=rows.indexOf(r)===focused?'#628782':'#365865';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#fff0cf';ctx.font='28px sans-serif';ctx.fillText(r.label,r.x+18,r.y+r.h/2+10,r.w-30);}tex.needsUpdate=true;lastPaint=now;
 }
 function update(now,frame,state){
  input={x:0,y:0,boost:false,brake:false,guard:false};const delta=lastNow?(now-lastNow)/1000:0;lastNow=now;if(!session||!frame)return input;frames++;
  const ref=renderer.xr.getReferenceSpace(),viewer=ref&&frame.getViewerPose(ref);if(!viewer||session.visibilityState!=='visible'){pause();return input;}
  if(align)place(viewer);
  lastViewer=viewer;const first=kind.startsWith('first-person');present(state);
  movementYaw=hooks.yaw();
  const paused=hooks.paused();if(paused!==wasPaused){wasPaused=paused;page=0;focused=0;clear();lastPaint=0;panelOrigin.copy(viewer.transform.position);const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(viewer.transform.orientation));panelHeading=Math.atan2(-f.x,-f.z);}
  panelGroup.position.copy(paused?panelOrigin:origin);panelGroup.rotation.set(0,paused?panelHeading:heading,0);panel.visible=paused||(handActions&&Array.from(session.inputSources).some(s=>s.hand));panel.position.set(paused?0:-1.25,paused?-.1:-.3,paused?-1.6:-1.15);panel.scale.setScalar(paused?1:.32);panelGroup.updateMatrixWorld(true);
  if(now-lastPaint>120||!lastPaint)paint(now);
  if(!first)view.curtain.visible=false;
  if(first){const p=rig.localToWorld(new T.Vector3().copy(viewer.transform.position));view.curtain.visible=!lineClear(state,{x:state.x,y:state.y+1.65,z:state.z},p);if(view.curtain.visible){input.brake=true;hooks.message('Head near a wall. Lean back or recenter from Menu.');}if(watchRuntime(state).travel)view.curtain.visible=true;}
  const activeSources=Array.from(session.inputSources),offSource=activeSources.find(s=>s.handedness!==prefs.dominant&&!s.hand);aiming=!paused&&prefs.profile==='action'&&!!(offSource?.gamepad?.buttons[0]?.pressed||(offSource?.gamepad?.buttons[0]?.value||0)>.2);
  tracked=0;let consumed=false,hands=false,missing=false,snap=0;
  for(let i=0;i<2;i++){
   const slot=slots[i],src=session.inputSources[i];slot.ray.visible=slot.grip.visible=false;slot.joints.forEach(j=>j.visible=false);
   if(src!==slot.src){slot.src=src;slot.ready=false;slot.prev=[];slot.tracked=false;}if(!src)continue;
   const pose=frame.getPose(src.targetRaySpace,ref);if(!pose){if(slot.tracked)missing=true;slot.ready=false;slot.tracked=false;continue;}
   slot.tracked=true;tracked++;slot.ray.position.copy(pose.transform.position);slot.ray.quaternion.copy(pose.transform.orientation);slot.ray.visible=paused||handActions||aiming;
   const gp=src.gripSpace&&frame.getPose(src.gripSpace,ref);if(gp){slot.grip.position.copy(gp.transform.position);slot.grip.quaternion.copy(gp.transform.orientation);slot.grip.visible=!src.hand;}
   const b=Array.from({length:6},(_,j)=>!!src.gamepad?.buttons[j]?.pressed||(src.gamepad?.buttons[j]?.value||0)>.2);
   if(src.hand){hands=true;let j=0;for(const space of src.hand.values()){const jp=frame.getJointPose(space,ref),mesh=slot.joints[j++];if(jp&&mesh){mesh.position.copy(jp.transform.position);mesh.visible=true;}}
    const a=src.hand.get('thumb-tip'),h=src.hand.get('index-finger-tip'),p=a&&frame.getJointPose(a,ref),q=h&&frame.getJointPose(h,ref);
    if(!p||!q){missing=true;slot.ready=false;continue;}const d=new T.Vector3().copy(p.transform.position).distanceTo(q.transform.position);b[0]=d<(slot.pinch?.043:.024);slot.pinch=b[0];
   }
   const axes=src.gamepad?.axes||[],ax=axes.length>=4?axes[2]:axes[0]||0,ay=axes.length>=4?axes[3]:axes[1]||0;
   if(xrNeutral(b,ax,ay))slot.ready=true;
   const edge=j=>slot.ready&&b[j]&&!slot.prev[j];
   const p=rig.localToWorld(slot.ray.position.clone()),q=rig.getWorldQuaternion(new T.Quaternion()).multiply(slot.ray.quaternion);caster.set(p,new T.Vector3(0,0,-1).applyQuaternion(q));
   const hit=panel.visible?caster.intersectObject(panel)[0]:null,x=hit?.uv.x*1024,y=(1-(hit?.uv.y||0))*768,row=hit&&rows.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
   if(row&&slot.ready&&b[0]){consumed=true;if(row.hold&&!paused){if(row.hold==='forward')input.y=1;else if(row.hold==='guard'){input.guard=true;input.brake=true;}else input.brake=true;}else if(edge(0)){input={x:0,y:0,boost:false,brake:true};row.fn?.();selections++;lastPaint=0;}}
   const wrist=src.hand?.get('wrist'),wristPose=wrist&&frame.getJointPose(wrist,ref);
   const headPos=new T.Vector3().copy(viewer.transform.position),handPos=new T.Vector3().copy((wristPose||gp||pose).transform.position),relative=handPos.clone().sub(headPos).applyAxisAngle(new T.Vector3(0,1,0),-heading).toArray();
   const nearHead=relative[1]>-.12&&relative[1]<.35&&relative[2]<-.08&&relative[2]>-.6&&Math.abs(relative[0])<.65;
   if(src.hand&&b[0]&&nearHead&&!row&&slot.ready){
    slot.menuHeld+=Math.min(.1,Math.max(0,delta));
    if(slot.menuHeld>.55&&!slot.gestureUsed){slot.gestureUsed=true;menuGestures++;if(paused)back();else pause();consumed=true;}
   }else {slot.menuHeld=0;if(!b[0])slot.gestureUsed=false;}
   if(!paused&&slot.ready&&src.hand&&!row&&!consumed&&!nearHead){
    if(b[0]&&relative[1]<-.5){input.y=1;}
    else if(edge(0)){hooks.action('interact');consumed=true;}
   }
   if(!paused&&slot.ready&&!src.hand&&!row&&!consumed){
    const role=sourceRoles(src.handedness,prefs);
    if(role.movement){input.x=Math.abs(ax)>.16?ax:0;input.y=Math.abs(ay)>.16?-ay:0;input.boost=prefs.profile==='action'?b[3]:false;}else snap=ax;
    if(prefs.profile==='courier'){
     if(!role.primary){input.boost=b[0];input.brake=b[1];if(edge(4)||edge(5))pause();}
     else {if(edge(0))hooks.action('interact');if(edge(1))hooks.action('throw');if(edge(4))hooks.action('hop');if(edge(5))hooks.action('ride');}
    }else{
     if(role.primary){
      const o=world.worldToLocal(p.clone()),end=world.worldToLocal(p.clone().add(caster.ray.direction)),d=end.sub(o).normalize(),ray={origin:{x:o.x,y:o.y,z:o.z},direction:{x:d.x,y:d.y,z:d.z}};
      if(edge(1))hooks.action('interact');
      if(edge(0)){hooks.action(aiming?'tool':watchState(state).tracking?'strike':'interact',ray);slot.motionArmed=false;}
      if(edge(4))hooks.action('hop');if(edge(5))hooks.action('ride');
      if(!role.movement&&edge(3))hooks.action('tool-cycle');
      const handDelta=slot.lastHand?handPos.distanceTo(new T.Vector3().fromArray(slot.lastHand)):0;
      const headDelta=slot.lastHead?headPos.distanceTo(new T.Vector3().fromArray(slot.lastHead)):0;
      if(!b[1]||relative[2]>-.28)slot.motionArmed=true;
      if(first&&prefs.motionPunch&&!aiming&&watchState(state).tracking&&handDelta>headDelta+.01&&motionStrike(slot.lastRelative,relative,delta,b[1],slot.motionArmed)){hooks.action('strike',ray);slot.motionArmed=false;motionStrikes++;}
     }else{
      input.brake=b[1];input.guard=b[1]&&(guardPose(relative,true)||!prefs.motionPunch);
      if(edge(4))hooks.action('scan');if(edge(5))pause();if(!role.movement&&edge(3))hooks.action('tool-cycle');
     }
    }
   }
   if(paused&&slot.ready&&!src.hand&&edge(5)&&src.handedness!==prefs.dominant)back();
   slot.lastHand=handPos.toArray();slot.lastHead=headPos.toArray();slot.lastRelative=relative;
   slot.prev=b;
  }
  if(Math.abs(snap)>.65&&!lastSnap)hooks.turn(-Math.sign(snap)*prefs.snap*Math.PI/180);lastSnap=Math.abs(snap)>.3;
  if(hands&&!input.y)input.brake=true;
  if(missing||!tracked){pause();return {x:0,y:0,brake:true};}
  if(hooks.paused()||view.curtain.visible)input={x:0,y:0,boost:false,brake:true};
  return input;
 }
 slots.forEach(s=>{s.ray.visible=s.grip.visible=false;s.joints.forEach(j=>j.visible=false);});
 addEventListener('pagehide',()=>session?.end());
 return {enter,update,present,clear,setMode,settings,openMissions:()=>{missionPage=true;page=0;pause();lastPaint=0;},navigate:(direction,accept,back)=>{if(!session||!hooks.paused())return;if(back){if(hooks.confirmation?.())hooks.cancelConfirmation();else if(section==='help'){section='controls';page=0;}else if(section||missionPage){section='';missionPage=false;page=0;}else hooks.pause(false);clear();lastPaint=0;return;}if(direction){const step=missionPage?Math.sign(direction):direction;focused=(Math.max(0,focused)+step+rows.length)%rows.length;}if(accept){const row=rows[Math.max(0,focused)];row?.fn?.();selections++;}lastPaint=0;},exit:()=>session?.end(),get movementYaw(){return movementYaw;},get active(){return !!session;},get mode(){return kind.startsWith('first-person')?'first':'diorama';},inspect:()=>({active:!!session,kind,stereoGameWorld:!!session,pending,frames,selections,trackedSources:tracked,jointPool:50,environmentBlendMode:session?.environmentBlendMode||null,scale:world.scale.x,settings:{...settings},controls:{...prefs},preferencesBlocked:prefsBlocked,handActionsOptIn:handActions,motionStrikes,menuGestures,section,aiming,visibleRays:slots.filter(s=>s.ray.visible).length,error,input:{...input},actionPanelVisible:panel.visible,headBoundary:view.curtain.visible,headLockedPanels:false,solidControllerProxies:slots.filter(s=>s.grip.isMesh).length,controllerProxyDepthTest:slots.every(s=>s.grip.material.depthTest),arBoundaryTransparent:kind.endsWith('-ar')&&view.curtain.visible&&!world.visible,panelMatrix:panelGroup.matrix.toArray(),missionPage}),
  panelPose:()=>{panel.updateWorldMatrix(true,false);return {matrix:panel.matrixWorld.toArray(),referenceMatrix:rig.matrixWorld.clone().invert().multiply(panel.matrixWorld).toArray(),width:1.4,height:1.05,rows:rows.map(({label,x,y,w,h})=>({label,x,y,w,h}))};}};
}
