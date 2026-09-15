/* Native per-eye geometry, not a render-target theater. Tracking stays in metres. */
import * as T from '../vendor/three.module.js';
import {clamp,lineClear,support,floorHeight} from './core.mjs';
export function createXR(view,hooks){
 const {renderer,scene,camera,rig,world}=view;
 let session=null,kind='diorama-vr',pending=false,align=true,origin=new T.Vector3(),heading=0,frames=0,selections=0,tracked=0,lastPaint=0,page=0,wasPaused=true,error='';
 const settings={scale:.047,height:-.6,distance:1.75,rotation:0};
 const panelGroup=new T.Group();rig.add(panelGroup);
 const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d'),tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.4,1.05),new T.MeshBasicMaterial({map:tex,toneMapped:false,side:T.DoubleSide}));panelGroup.add(panel);panelGroup.visible=false;
 const lineGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-5)]),jointGeo=new T.SphereGeometry(.009,6,4),jointMat=new T.MeshBasicMaterial({color:0xa4e7d9});
 const slots=[0,1].map(()=>{const ray=new T.Line(lineGeo,new T.LineBasicMaterial({color:0x8be5db})),grip=new T.Mesh(new T.BoxGeometry(.045,.05,.11),jointMat),joints=Array.from({length:25},()=>new T.Mesh(jointGeo,jointMat));rig.add(ray,grip,...joints);return {ray,grip,joints,src:null,prev:[],pinch:false,ready:false,tracked:false};});
 const caster=new T.Raycaster();let rows=[],focused=-1,panelSignature='',input={x:0,y:0,boost:false,brake:false},lastSnap=false;
 function clear(){input={x:0,y:0,boost:false,brake:false};for(const s of slots){s.ready=false;s.prev=[];s.pinch=false;}hooks.clear();}
 function pause(){hooks.pause(true);clear();}
 function place(v){origin.copy(v.transform.position);const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(v.transform.orientation));heading=Math.atan2(-f.x,-f.z);align=false;}
 function setMode(next){if(!session)return;if(kind==='diorama-ar'&&next==='first'){error='First-person VR needs a VR session. Exit AR, then choose First-person VR.';return;}kind=next==='first'?'first-person-vr':kind==='diorama-ar'?'diorama-ar':'diorama-vr';align=true;pause();lastPaint=-Infinity;}
 function finish(){session=null;pending=false;panelGroup.visible=false;clear();renderer.xr.enabled=false;renderer.setRenderTarget(null);renderer.shadowMap.enabled=true;renderer.setClearColor(0xabc8cb,1);scene.background=new T.Color(0xabc8cb);scene.fog=new T.Fog(0xabc8cb,55,140);rig.position.set(0,0,0);rig.rotation.set(0,0,0);world.position.set(0,0,0);world.rotation.set(0,0,0);world.scale.setScalar(1);camera.position.set(20,25,30);camera.rotation.set(0,0,0);view.resize();slots.forEach(s=>{s.ray.visible=s.grip.visible=false;s.joints.forEach(j=>j.visible=false);});hooks.pause(true);hooks.message('XR ended. Desktop controls are ready after release.');}
 async function enter(mode){
  if(session||pending)return;pending=true;error='';kind=mode;
  try{
   if(!navigator.xr)throw Error('WebXR is unavailable here. Desktop play remains available.');
   const next=await navigator.xr.requestSession(mode==='diorama-ar'?'immersive-ar':'immersive-vr',{optionalFeatures:['hand-tracking','local-floor']});session=next;
   if(mode==='diorama-ar'&&next.environmentBlendMode==='opaque'){await next.end();session=null;throw Error('This session cannot show passthrough. Choose VR or desktop explicitly.');}
   renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFoveation(1);renderer.shadowMap.enabled=false;camera.position.set(0,0,0);camera.rotation.set(0,0,0);
   next.addEventListener('end',()=>queueMicrotask(finish),{once:true});next.addEventListener('inputsourceschange',pause);next.addEventListener('visibilitychange',pause);
   await renderer.xr.setSession(next);align=true;pause();panelGroup.visible=true;scene.fog=null;scene.background=mode==='diorama-ar'?null:new T.Color(0x162b35);renderer.setClearColor(0x162b35,mode==='diorama-ar'?0:1);
  }catch(e){error=String(e.message||e);if(session)try{await session.end();}catch{}finish();hooks.message(error);}finally{pending=false;}
 }
 function actions(){
  if(hooks.paused())return [
   ['Resume',()=>hooks.pause(false)],['First-person VR',()=>setMode('first')],['Diorama VR',()=>setMode('diorama')],
   ['Top open',()=>view.setOpening('top')],['Front open',()=>view.setOpening('front')],['Both open',()=>view.setOpening('both')],
   ['Smaller model',()=>{settings.scale=clamp(settings.scale-.008,.024,.075);pause();}],['Larger model',()=>{settings.scale=clamp(settings.scale+.008,.024,.075);pause();}],
   ['Lower stand',()=>{settings.height=clamp(settings.height-.12,-1.2,-.1);pause();}],['Raise stand',()=>{settings.height=clamp(settings.height+.12,-1.2,-.1);pause();}],
   ['Bring nearer',()=>{settings.distance=clamp(settings.distance-.2,1.2,2.8);pause();}],['Move farther',()=>{settings.distance=clamp(settings.distance+.2,1.2,2.8);pause();}],
   ['Rotate stand',()=>{settings.rotation+=Math.PI/4;pause();}],['Recenter',()=>{align=true;pause();}],['Save progress',hooks.save],['Exit XR',()=>session?.end()]
  ];
  return [['Interact',()=>hooks.action('interact')],['Hop',()=>hooks.action('hop')],['Mount / dock',()=>hooks.action('ride')],['Throw',()=>hooks.action('throw')],['Forward (hold)',null,'forward'],['Brake (hold)',null,'brake'],['Turn left',()=>hooks.turn(-Math.PI/6)],['Turn right',()=>hooks.turn(Math.PI/6)],['Bell',()=>hooks.action('bell')],['Menu / display',()=>hooks.pause(true)]];
 }
 function paint(now){
  const paused=hooks.paused(),items=actions(),pages=Math.ceil(items.length/6);page=Math.min(page,pages-1);rows=[];
  ctx.fillStyle='#142c36';ctx.fillRect(0,0,1024,768);ctx.fillStyle='#f3dfb5';ctx.font='bold 37px sans-serif';ctx.fillText(paused?'LANTERN WARD / DISPLAY':'LANTERN WARD / ACTIONS',35,58);
  ctx.font='23px sans-serif';const words=(error||hooks.goal()).split(' ');let line='',y=105;for(const w of words){if(ctx.measureText(line+w).width>935){ctx.fillText(line,35,y);y+=29;line='';}line+=w+' ';}ctx.fillText(line,35,y);
  items.slice(page*6,page*6+6).forEach(([label,fn,hold],i)=>rows.push({label,fn,hold,x:35+(i%2)*490,y:210+Math.floor(i/2)*130,w:464,h:108}));
  rows.push({label:'Previous',fn:()=>{page=(page+pages-1)%pages;lastPaint=0;},x:35,y:634,w:305,h:92},{label:'Next '+(page+1)+'/'+pages,fn:()=>{page=(page+1)%pages;lastPaint=0;},x:355,y:634,w:310,h:92},{label:paused?'Back / resume':'Menu',fn:()=>hooks.pause(!hooks.paused()),x:680,y:634,w:310,h:92});
  for(const r of rows){ctx.fillStyle=rows.indexOf(r)===focused?'#628782':'#365865';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#fff0cf';ctx.font='28px sans-serif';ctx.fillText(r.label,r.x+18,r.y+r.h/2+10,r.w-30);}tex.needsUpdate=true;lastPaint=now;
 }
 function update(now,frame,state){
  input={x:0,y:0,boost:false,brake:false};if(!session||!frame)return input;frames++;
  const ref=renderer.xr.getReferenceSpace(),viewer=ref&&frame.getViewerPose(ref);if(!viewer||session.visibilityState!=='visible'){pause();return input;}
  if(align)place(viewer);
  const first=kind==='first-person-vr';
  if(first){world.position.set(0,0,0);world.scale.setScalar(1);world.rotation.set(0,0,0);rig.rotation.set(0,hooks.yaw()-heading,0);const offset=origin.clone().applyAxisAngle(new T.Vector3(0,1,0),rig.rotation.y);const floor=support(state,state.x,state.z,state.y),eyeY=state.lift?state.y:floor?floorHeight(floor,state.z):state.safe[1];rig.position.set(state.x-offset.x,eyeY+1.65-offset.y,state.z-offset.z);}
  else{rig.position.set(0,0,0);rig.rotation.set(0,0,0);world.scale.setScalar(settings.scale);world.rotation.y=heading+settings.rotation;const forward=new T.Vector3(0,0,-settings.distance).applyAxisAngle(new T.Vector3(0,1,0),heading);world.position.copy(origin).add(forward);world.position.y=origin.y+settings.height;}
  rig.updateMatrixWorld(true);world.updateMatrixWorld(true);
  const paused=hooks.paused();if(paused!==wasPaused){wasPaused=paused;page=0;clear();lastPaint=0;}
  panelGroup.position.copy(viewer.transform.position);panelGroup.quaternion.copy(viewer.transform.orientation);panel.position.set(0,paused?-.1:-.65,paused?-1.6:-1.5);panel.scale.setScalar(paused?1:.73);panelGroup.updateMatrixWorld(true);
  if(now-lastPaint>120||!lastPaint)paint(now);
  // Fade the world if the physically tracked head crosses a metre-space wall.
  if(first){const p=rig.localToWorld(new T.Vector3().copy(viewer.transform.position));view.curtain.visible=!lineClear(state,{x:state.x,y:state.y+1.65,z:state.z},p);if(view.curtain.visible){input.brake=true;hooks.message('Head near a wall. Lean back or recenter from Menu.');}}
  tracked=0;let consumed=false,hands=false,missing=false,snap=0;
  for(let i=0;i<2;i++){
   const slot=slots[i],src=session.inputSources[i];slot.ray.visible=slot.grip.visible=false;slot.joints.forEach(j=>j.visible=false);
   if(src!==slot.src){slot.src=src;slot.ready=false;slot.prev=[];slot.tracked=false;}if(!src)continue;
   const pose=frame.getPose(src.targetRaySpace,ref);if(!pose){if(slot.tracked)missing=true;slot.ready=false;slot.tracked=false;continue;}
   slot.tracked=true;tracked++;slot.ray.position.copy(pose.transform.position);slot.ray.quaternion.copy(pose.transform.orientation);slot.ray.visible=true;
   const gp=src.gripSpace&&frame.getPose(src.gripSpace,ref);if(gp){slot.grip.position.copy(gp.transform.position);slot.grip.quaternion.copy(gp.transform.orientation);slot.grip.visible=!src.hand;}
   const b=Array.from({length:6},(_,j)=>!!src.gamepad?.buttons[j]?.pressed||(src.gamepad?.buttons[j]?.value||0)>.2);
   if(src.hand){hands=true;let j=0;for(const space of src.hand.values()){const jp=frame.getJointPose(space,ref),mesh=slot.joints[j++];if(jp&&mesh){mesh.position.copy(jp.transform.position);mesh.visible=true;}}
    const a=src.hand.get('thumb-tip'),h=src.hand.get('index-finger-tip'),p=a&&frame.getJointPose(a,ref),q=h&&frame.getJointPose(h,ref);
    if(!p||!q){missing=true;slot.ready=false;continue;}const d=new T.Vector3().copy(p.transform.position).distanceTo(q.transform.position);b[0]=d<(slot.pinch?.043:.024);slot.pinch=b[0];
   }
   const axes=src.gamepad?.axes||[],ax=axes.length>=4?axes[2]:axes[0]||0,ay=axes.length>=4?axes[3]:axes[1]||0;
   if(!b.some(Boolean)&&Math.abs(ax)<.15&&Math.abs(ay)<.15)slot.ready=true;
   const edge=j=>slot.ready&&b[j]&&!slot.prev[j];
   const p=rig.localToWorld(slot.ray.position.clone()),q=rig.getWorldQuaternion(new T.Quaternion()).multiply(slot.ray.quaternion);caster.set(p,new T.Vector3(0,0,-1).applyQuaternion(q));
   const hit=caster.intersectObject(panel)[0],x=hit?.uv.x*1024,y=(1-(hit?.uv.y||0))*768,row=hit&&rows.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
   if(row&&slot.ready&&b[0]){consumed=true;if(row.hold&&!paused){if(row.hold==='forward')input.y=1;else input.brake=true;}else if(edge(0)){input={x:0,y:0,boost:false,brake:true};row.fn?.();selections++;lastPaint=0;}}
   if(!paused&&slot.ready&&!src.hand&&!row&&!consumed){
    if(src.handedness==='left'){input.x=Math.abs(ax)>.16?ax:0;input.y=Math.abs(ay)>.16?-ay:0;input.boost=b[0];input.brake=b[1];if(edge(4)||edge(5))hooks.pause(true);}
    else{snap=ax;if(edge(0))hooks.action('interact');if(edge(1))hooks.action('throw');if(edge(4))hooks.action('hop');if(edge(5))hooks.action('ride');}
   }
   if(paused&&slot.ready&&!src.hand&&edge(4)&&src.handedness==='left')hooks.pause(false);
   slot.prev=b;
  }
  if(first&&Math.abs(snap)>.65&&!lastSnap)hooks.turn(-Math.sign(snap)*Math.PI/6);lastSnap=Math.abs(snap)>.3;
  if(hands&&!input.y)input.brake=true;
  if(missing||!tracked){pause();return {x:0,y:0,brake:true};}
  if(hooks.paused()||view.curtain.visible)input={x:0,y:0,boost:false,brake:true};
  return input;
 }
 slots.forEach(s=>{s.ray.visible=s.grip.visible=false;s.joints.forEach(j=>j.visible=false);});
 addEventListener('pagehide',()=>session?.end());
 return {enter,update,clear,setMode,settings,navigate:(direction,accept,back)=>{if(!session||!hooks.paused())return;if(back){hooks.pause(false);return;}if(direction)focused=(Math.max(0,focused)+direction+rows.length)%rows.length;if(accept){const row=rows[Math.max(0,focused)];row?.fn?.();selections++;}lastPaint=0;},exit:()=>session?.end(),get active(){return !!session;},get mode(){return kind==='first-person-vr'?'first':'diorama';},inspect:()=>({active:!!session,kind,stereoGameWorld:!!session,pending,frames,selections,trackedSources:tracked,jointPool:50,environmentBlendMode:session?.environmentBlendMode||null,scale:world.scale.x,settings:{...settings},error,input:{...input},headBoundary:view.curtain.visible}),
  // Read-only panel transform allows a synthetic tracking fixture to aim real rays.
  panelPose:()=>{panel.updateWorldMatrix(true,false);return {matrix:panel.matrixWorld.toArray(),referenceMatrix:rig.matrixWorld.clone().invert().multiply(panel.matrixWorld).toArray(),width:1.4,height:1.05,rows:rows.map(({label,x,y,w,h})=>({label,x,y,w,h}))};}};
}
