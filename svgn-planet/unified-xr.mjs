import {hideTrackedSources} from './xr-session-cleanup.mjs';
import {createSpatialConsole} from './spatial-console.mjs';
import {triggerVehicleSpeed} from './console-state.mjs';
import {mountNativeChrome,nativeMenuDescription} from './native-ui.mjs';
/* One native WebXR session for every district. No canvas/video world screen. */
import * as T from './vendor/three.module.js';
import {MODES,modeInfo,modeLabel} from './spatial-modes.mjs';
import {xrInput,clearXRInput} from './xr-input.mjs';
import {loadXRPrefs,saveXRPrefs,sourceRoles,motionStrike,guardPose,xrNeutral} from './lantern/xr-input.mjs';
import {holsterZone,capeGesture} from './lantern/xr-embodiment.mjs';
export function createUnifiedXR(hooks){
 mountNativeChrome();
 const renderer=hooks.renderer,ui=new T.Group();ui.name='Native XR menu and tracked input';
 const c=document.createElement('canvas');c.width=1024;c.height=1024;const ctx=c.getContext('2d'),tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.4,1.4),new T.MeshBasicMaterial({map:tex,toneMapped:false,side:T.DoubleSide,depthTest:false,depthWrite:false}));panel.renderOrder=10000;ui.add(panel);panel.visible=false;
 const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-3)]),jointGeo=new T.SphereGeometry(.009,6,4),jointMat=new T.MeshBasicMaterial({color:0x9edbc8});
 const slots=[0,1].map(()=>{const ray=new T.Line(geometry,new T.LineBasicMaterial({color:0xb6eee1})),grip=new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(.022,1)),new T.LineBasicMaterial({color:0xa9ccc1,transparent:true,opacity:.45})),joints=Array.from({length:25},()=>new T.Mesh(jointGeo,jointMat));ui.add(ray,grip,...joints);return {ray,grip,joints,source:null,previous:[],ready:false,pinch:false,menuTime:0,menuUsed:false,relative:null,hand:null,head:null,armed:true};});
 let session=null,pending=false,kind='third-person-vr',origin=new T.Vector3(),heading=0,viewer=null,aligned=false,rootBefore=null,page=0,rows=[],lastPaint=0,last=0,frames=0,selections=0,error='',lastSnap=false,modeChanges=0;
 let prefs=loadXRPrefs(hooks.storage).prefs,preferencesBlocked=loadXRPrefs(hooks.storage).blocked;
 const settings={scale:.04,height:-.9,distance:1.55,rotation:0};let handActions=false,floorSpace=null;
 const consoleUI=createSpatialConsole(ui,panel,tex,{storage:hooks.storage,goal:hooks.goal,hud:hooks.hud,message:hooks.message,clear});
 const $=id=>document.getElementById(id),visible=e=>!!e&&!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length>0;
 const root=()=>visible($('failure'))?$('failure'):['ward-confirm','confirm-reset','save-confirm'].map($).find(visible)||[...document.querySelectorAll('dialog[open]')].at(-1)||(visible($('welcome'))?$('welcome'):null);
 function clear(){clearXRInput();hooks.clear();for(const s of slots){s.ready=false;s.previous=[];s.relative=s.hand=s.head=null;s.menuTime=0;s.menuUsed=false;s.armed=true;}lastSnap=false;}
 function resetRoot(){rootBefore=null;lastPaint=0;page=0;clear();}
 function pause(){hooks.pause();resetRoot();}
 function place(){if(!viewer)return;origin.copy(viewer.transform.position);const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(viewer.transform.orientation));heading=Math.atan2(-f.x,-f.z);aligned=true;}
 function finish(){floorSpace=null;consoleUI.end();session=null;pending=false;aligned=false;clear();hideTrackedSources(slots);viewer=null;rows=[];rootBefore=null;lastPaint=0;last=0;ui.removeFromParent();panel.visible=false;hooks.spatial().end();renderer.xr.enabled=false;renderer.setRenderTarget(null);renderer.setClearColor(0xabc8cb,1);document.body.classList.remove('in-xr');hooks.pause();hooks.message('XR ended. Your district and progress are retained.');hooks.changed?.();}
 async function enter(mode){
  const info=modeInfo(mode);if(session){if(info.session===modeInfo(kind).session){kind=info.id;modeChanges++;clear();lastPaint=0;return;}error='AR and VR use different headset sessions. Exit XR, then select '+modeLabel(mode)+'.';hooks.message(error);return;}
  if(pending)return;pending=true;error='';kind=info.id;
  try{if(!navigator.xr)throw Error('WebXR is not available in this browser. Desktop play remains available.');
   const next=await navigator.xr.requestSession(info.session,{optionalFeatures:['hand-tracking','local-floor']});
   if(info.ar&&next.environmentBlendMode==='opaque'){await next.end();throw Error('This device did not supply passthrough. AR was not replaced with VR.');}
   session=next;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFoveation(1);renderer.shadowMap.enabled=false;
   next.addEventListener('end',()=>queueMicrotask(finish),{once:true});next.addEventListener('visibilitychange',pause);next.addEventListener('inputsourceschange',pause);
   await renderer.xr.setSession(next);floorSpace=null;
   next.requestReferenceSpace?.('local-floor').then(space=>{if(session===next)floorSpace=space;}).catch(()=>{});aligned=false;document.body.classList.add('in-xr');pause();hooks.changed?.();
  }catch(e){error=String(e.message||e);if(session){try{await session.end();}catch{}}else{pending=false;hooks.message(error);} }finally{pending=false;}
 }
 function adjust(el,u){el.focus({preventScroll:true});if(el.tagName==='SELECT'){const opts=[...el.options].filter(o=>!o.disabled),i=opts.indexOf(el.selectedOptions[0]);el.value=opts[(i+(u<.33?-1:1)+opts.length)%opts.length].value;el.dispatchEvent(new Event('change',{bubbles:true}));}else if(el.type==='range'){el.value=String(T.MathUtils.clamp(Number(el.value)+(Number(el.step)||1)*(u<.5?-1:1),Number(el.min)||0,Number(el.max)||100));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}else if(el.tagName==='TEXTAREA')el.scrollTop+=el.clientHeight*.6;else el.click();}
 function back(r){
  const keep=[...r.querySelectorAll('#cancel-reset,#save-cancel,#keep,[data-cancel]')].find(visible);if(keep){keep.click();return;}
  const el=r.querySelector('[data-pad-back],#resume,#map-close,#help-close');if(visible(el))el.click();else if(r.tagName==='DIALOG')r.close();else hooks.resume();
 }
 function paint(r){
  rows=[];ctx.fillStyle='#142e39';ctx.fillRect(0,0,1024,1024);ctx.fillStyle='#fff0ca';ctx.font='bold 32px sans-serif';ctx.fillText((r?.querySelector('h1,h2')?.textContent||'Neighborhood Missions').slice(0,53),36,52);
  ctx.font='23px sans-serif';const description=nativeMenuDescription(r,hooks.goal());const copy=(error||description||hooks.goal()).split(/\s+/);let line='',y=99;for(const w of copy){if(ctx.measureText(line+w).width>920){ctx.fillText(line,36,y);line='';y+=28;if(y>177)break;}line+=w+' ';}ctx.fillText(line,36,y);
  if(r){const all=[...r.querySelectorAll('button,select,input,a[href],textarea')].filter(visible),pages=Math.max(1,Math.ceil(all.length/6));page=Math.max(0,Math.min(page,pages-1));
   all.slice(page*6,page*6+6).forEach((el,i)=>{let label=(el.labels?.[0]?.textContent||el.textContent||el.getAttribute('aria-label')||el.id).trim();if(el.tagName==='SELECT')label+=': '+el.selectedOptions[0]?.textContent;if(el.type==='range')label+=': '+el.value;if(el.type==='checkbox')label=(el.checked?'[on] ':'[off] ')+label;rows.push({label,id:el.id,x:36,y:212+i*101,w:952,h:85,act:u=>adjust(el,u)});});
   rows.push({label:'Previous page',x:36,y:854,w:300,h:70,act:()=>{page=(page+pages-1)%pages;}},{label:'Next '+(page+1)+'/'+pages,x:361,y:854,w:300,h:70,act:()=>{page=(page+1)%pages;}},{label:'Back / resume',x:686,y:854,w:300,h:70,act:()=>back(r)});
   // The actual map is available as its own full native page, not a label promising a map.
   const map=r.querySelector('canvas');if(map&&!map.hidden&&r.dataset.xrMap==='1'){ctx.drawImage(map,38,190,948,610);rows=rows.filter(x=>x.y>800);}
  }else if(handActions){for(const [i,a]of [['Interact','interact'],['Move (hold)','move'],['Brake (hold)','brake'],['Menu','pause']].entries())rows.push({label:a[0],x:40,y:210+i*145,w:944,h:120,hold:a[1]==='move'||a[1]==='brake'?a[1]:null,act:()=>hooks.action(a[1])});}
  for(const row of rows){ctx.fillStyle='#365866';ctx.fillRect(row.x,row.y,row.w,row.h);ctx.fillStyle='#fff3d5';ctx.font='27px sans-serif';ctx.fillText(row.label.replace(/\s+/g,' '),row.x+15,row.y+row.h/2+9,row.w-30);}tex.needsUpdate=true;consoleUI.sync(rows);lastPaint=performance.now();
 }
 const caster=new T.Raycaster();
 function update(now,frame){
  clearXRInput();if(!session||!frame)return;frames++;const dt=Math.min(.1,last?(now-last)/1000:0);last=now;const ref=renderer.xr.getReferenceSpace();viewer=ref&&frame.getViewerPose(ref);
  if(!viewer||session.visibilityState!=='visible'){pause();return;}if(!aligned)place();const sv=hooks.spatial();if(ui.parent!==sv.view.scene){sv.view.scene.add(ui);resetRoot();}
  const r=root();if(r!==rootBefore){rootBefore=r;page=0;clear();lastPaint=0;}
  const sources=Array.from(session.inputSources),hasHands=sources.some(s=>s.hand);panel.visible=!!r||(handActions&&hasHands);
  const floorPose=floorSpace&&frame.getPose(floorSpace,ref);consoleUI.step({viewer,floorY:floorPose?.transform?.position?.y,open:panel.visible,dt,frame,ref,sources,dominant:prefs.dominant,now});
  if(panel.visible&&(!lastPaint||now-lastPaint>120))paint(r);ui.updateMatrixWorld(true);
  const vehicleDrive=prefs.profile==='action'&&triggerVehicleSpeed(hooks.state(),consoleUI.prefs.triggerDrive);
  const ar=modeInfo(kind),off=sources.find(s=>!s.hand&&s.handedness!==prefs.dominant),aiming=!r&&!vehicleDrive&&prefs.profile==='action'&&((off?.gamepad?.buttons[0]?.value||0)>.2||off?.gamepad?.buttons[0]?.pressed);
  let tracked=0,consumed=false,bodyHands=[],bodyGrips=[];
  for(let i=0;i<slots.length;i++){
   const slot=slots[i],source=sources[i];slot.ray.visible=slot.grip.visible=false;slot.joints.forEach(j=>j.visible=false);if(source!==slot.source){slot.source=source;slot.ready=false;slot.previous=[];}if(!source)continue;
   const pose=frame.getPose(source.targetRaySpace,ref);if(!pose){slot.ready=false;continue;}tracked++;
   slot.ray.position.copy(pose.transform.position);slot.ray.quaternion.copy(pose.transform.orientation);slot.ray.visible=panel.visible||aiming;
   const gp=source.gripSpace&&frame.getPose(source.gripSpace,ref);if(gp){slot.grip.position.copy(gp.transform.position);slot.grip.quaternion.copy(gp.transform.orientation);slot.grip.visible=!source.hand;}
   const b=Array.from({length:6},(_,j)=>!!source.gamepad?.buttons[j]?.pressed||(source.gamepad?.buttons[j]?.value||0)>.2);
   if(source.hand){let j=0;for(const joint of source.hand.values()){const p=frame.getJointPose(joint,ref),mesh=slot.joints[j++];if(p&&mesh){mesh.position.copy(p.transform.position);mesh.visible=true;}}
    const a=frame.getJointPose(source.hand.get('thumb-tip'),ref),q=frame.getJointPose(source.hand.get('index-finger-tip'),ref);if(!a||!q){tracked--;slot.ready=false;continue;}b[0]=new T.Vector3().copy(a.transform.position).distanceTo(q.transform.position)<(slot.pinch?.04:.024);slot.pinch=b[0];}
   const axes=source.gamepad?.axes||[],offset=axes.length>=4?2:0,ax=axes[offset]||0,ay=axes[offset+1]||0;if(xrNeutral(b,ax,ay))slot.ready=true;const edge=j=>slot.ready&&b[j]&&!slot.previous[j];
   const rayOrigin=new T.Vector3().copy(pose.transform.position),rayDirection=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(pose.transform.orientation));caster.set(rayOrigin,rayDirection);
   const picked=consoleUI.ready?consoleUI.hit(caster,panel.visible,b[0]):null,hit=picked?.hit,row=picked?.row;
   slot.ray.scale.z=hit?Math.min(1,hit.distance/3):1;
   if(picked?.summon){slot.ray.visible=true;if(edge(0)){pause();consumed=true;}}
   if(row&&slot.ready&&b[0]){consumed=true;if(row.hold&&!r){if(row.hold==='move')xrInput.y=1;else xrInput.brake=true;}else if(edge(0)){row.act?.(picked.u);selections++;lastPaint=0;clear();}}
   const wrist=source.hand?.get('wrist'),wp=wrist&&frame.getJointPose(wrist,ref),hand=new T.Vector3().copy((wp||gp||pose).transform.position),head=new T.Vector3().copy(viewer.transform.position),relative=hand.clone().sub(head).applyAxisAngle(new T.Vector3(0,1,0),-heading).toArray();
   bodyHands.push(relative);bodyGrips.push(b[1]&&slot.ready);
   const nearHead=relative[1]>-.12&&relative[1]<.35&&relative[2]<-.08&&relative[2]>-.6&&Math.abs(relative[0])<.65;
   if(source.hand&&b[0]&&nearHead&&slot.ready&&!row){slot.menuTime+=dt;if(slot.menuTime>.55&&!slot.menuUsed){slot.menuUsed=true;if(r)back(r);else pause();consumed=true;}}else {slot.menuTime=0;if(!b[0])slot.menuUsed=false;}
   if(!r&&slot.ready&&!consumed){
    if(source.hand){if(b[0]&&relative[1]<-.5)xrInput.y=1;else if(edge(0)&&!nearHead)hooks.action('interact');}
    else{
     const role=sourceRoles(source.handedness,prefs),ray=sv.ray(rayOrigin,rayDirection),zone=hooks.embodied?.()?holsterZone(relative):null;
     if(role.movement){xrInput.x=Math.abs(ax)>.16?ax:0;xrInput.y=Math.abs(ay)>.16?-ay:0;if(prefs.profile==='action'&&!vehicleDrive)xrInput.boost=b[3];}
     else{if(Math.abs(ax)>.65&&!lastSnap)hooks.turn(-Math.sign(ax)*prefs.snap*Math.PI/180);lastSnap=Math.abs(ax)>.3;if(edge(3))hooks.action('tool-cycle');}
     if(prefs.profile==='courier'){
      if(role.primary){if(edge(0))hooks.action('interact',ray);if(edge(1))hooks.action('throw');if(edge(4))hooks.action('hop');if(edge(5))hooks.action('ride');}
      else{xrInput.boost=b[0];xrInput.brake=b[1];if(edge(4)||edge(5))pause();}
     }else if(role.primary){
      if(edge(1)){if(zone)hooks.action('holster-'+zone);else hooks.action('interact',ray);}
      if(vehicleDrive)xrInput.boost=b[0];
      else if(edge(0)){hooks.action(aiming?'tool':hooks.combat?.()?'strike':'interact',ray);slot.armed=false;}
      if(edge(4))hooks.action('hop');if(edge(5))hooks.action('ride');
      if(!b[1]||relative[2]>-.28)slot.armed=true;
      const hd=slot.hand?hand.distanceTo(slot.hand):0,vd=slot.head?head.distanceTo(slot.head):0;
      if(ar.first&&prefs.motionPunch&&hooks.combat?.()&&!aiming&&hd>vd+.01&&motionStrike(slot.relative,relative,dt,b[1],slot.armed)){hooks.action('strike',ray);slot.armed=false;}
     }else{xrInput.brake=b[1]&&!zone;xrInput.guard=b[1]&&!zone&&(!prefs.motionPunch||guardPose(relative,true));if(edge(1)&&zone)hooks.action('holster-'+zone);if(edge(4))hooks.action('scan');if(edge(5))pause();}
    }
   }else if(r&&slot.ready&&!source.hand&&edge(5)&&source.handedness!==prefs.dominant)back(r);
   slot.relative=relative;slot.hand=hand;slot.head=head;slot.previous=b;
  }
  if(!r&&hooks.canGlide?.()&&capeGesture(bodyHands,bodyGrips)){xrInput.glide=true;xrInput.brake=xrInput.guard=false;}
  if(hasHands&&!xrInput.y)xrInput.brake=true;
  if(tracked!==sources.length||tracked===0){pause();clearXRInput();}
  if(root()||!hooks.playing())clearXRInput();
 }
 function present(){if(!session||!viewer)return;const sv=hooks.spatial();sv.present(hooks.state(),kind,origin,heading,settings,hooks.yaw());renderer.render(sv.view.scene,sv.view.camera);}
 return {enter,update,present,flatRender:draw=>{hooks.spatial().restore();draw();},prepare:()=>hooks.spatial().restore(),retarget:()=>{resetRoot();if(viewer)place();},clear,exit:()=>session?.end(),get active(){return !!session;},get mode(){return kind;},settings,
  preference(k,v){const n={...prefs,[k]:v};if(!preferencesBlocked&&!saveXRPrefs(hooks.storage,n)){preferencesBlocked=true;hooks.message('XR preference storage is unavailable. Current-session settings still work.');}prefs=n;clear();},get preferences(){return {...prefs};},
  setOpening:value=>hooks.spatial().setOpening(value),recenter:()=>{aligned=false;consoleUI.recenter();clear();},
  consolePreference:(k,v)=>consoleUI.configure(k,v),get consolePreferences(){return consoleUI.prefs;},recenterConsole:()=>{consoleUI.recenter();clear();},
  panelPose(){panel.updateWorldMatrix(true,false);return {matrix:panel.matrixWorld.toArray(),referenceMatrix:panel.matrixWorld.toArray(),width:1.4,height:1.4,rows:rows.map(({label,id,x,y,w,h})=>({label,id,x,y,w,h}))};},
  inspect:()=>({active:!!session,pending,kind,frames,selections,error,modeChanges,console:consoleUI.inspect(),environmentBlendMode:session?.environmentBlendMode,actionPanelVisible:panel.visible,visibleRays:slots.filter(s=>s.ray.visible).length,headLockedPanels:false,stereoGameWorld:!!session,renderTargetScreen:false,eyes:session?renderer.xr.getCamera().cameras.length:0,panelMatrix:panel.matrixWorld.toArray(),input:{...xrInput},spatial:hooks.spatial().inspect(),controls:{...prefs}})};
}
