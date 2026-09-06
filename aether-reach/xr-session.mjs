/* Immersive WebXR adapter. Local-floor tracked head pose is never replaced by
 * rail camera steering. Public placeholder world only. Hardware QA is pending. */
import {T} from './scene.mjs';
import {forward,roomMove} from './model.mjs';
import {InputSampler,SnapTurn,xrControls} from './input-core.mjs';
export function createXR(view,api){
 const {renderer,scene,camera}=view,rig=new T.Group(),inputs=new InputSampler(),turn=new SnapTurn();
 rig.name='XR locomotion rig';scene.add(rig);renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(.8);renderer.xr.setFoveation?.(1);
 let session=null,entering=false,offsetYaw=0,lastHead=null,head=null,suspended=false,lastPaint=0,aim=null,shadowBefore=true;
 const button=document.createElement('button');button.id='enter-vr';button.textContent='Checking VR support…';button.disabled=true;document.querySelector('.start-actions').append(button);
 const exit=document.createElement('button');exit.id='exit-vr';exit.textContent='Exit VR';exit.hidden=true;document.getElementById('masthead').append(exit);
 const status=document.createElement('p');status.id='xr-status';status.className='fine';status.textContent='Experimental Quest 3 target. Physical headset tracking, comfort and performance are not yet certified.';document.querySelector('.title-copy').append(status);
 const panelCanvas=document.createElement('canvas');panelCanvas.width=1024;panelCanvas.height=768;const ink=panelCanvas.getContext('2d'),tex=new T.CanvasTexture(panelCanvas);tex.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.36,1.02),new T.MeshBasicMaterial({map:tex,transparent:true,depthTest:false}));panel.position.set(0,0,-1.4);panel.renderOrder=1000;panel.visible=false;camera.add(panel);
 const hudCanvas=document.createElement('canvas');hudCanvas.width=1024;hudCanvas.height=256;const hi=hudCanvas.getContext('2d'),ht=new T.CanvasTexture(hudCanvas);ht.colorSpace=T.SRGBColorSpace;
 const hud=new T.Mesh(new T.PlaneGeometry(.95,.2375),new T.MeshBasicMaterial({map:ht,transparent:true,depthTest:false}));hud.position.set(0,-.37,-1.1);hud.renderOrder=999;hud.visible=false;camera.add(hud);
 const controllers=[];
 for(let i=0;i<2;i++){
  const ray=renderer.xr.getController(i),grip=renderer.xr.getControllerGrip(i);rig.add(ray,grip);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0x91e8d1}));line.scale.z=4;ray.add(line);
  const shell=new T.Mesh(new T.BoxGeometry(.06,.085,.15),new T.MeshStandardMaterial({color:0xd3b47b,metalness:.4,roughness:.6}));shell.position.z=-.04;grip.add(shell);
  const barrel=new T.Mesh(new T.CylinderGeometry(.012,.02,.2,8),new T.MeshStandardMaterial({color:0x5cc6bc,emissive:0x17483f}));barrel.rotation.x=Math.PI/2;barrel.position.z=-.15;grip.add(barrel);
  const item={ray,grip,source:null,line};controllers.push(item);ray.addEventListener('connected',e=>{item.source=e.data;barrel.visible=e.data.handedness==='right';});ray.addEventListener('disconnected',()=>{item.source=null;aim=null;inputs.reset();});
 }
 const vector=new T.Vector3(),rotation=new T.Quaternion(),raycaster=new T.Raycaster();
 function wrapped(ctx,text,x,y,max,line=36){let row='';for(const word of String(text).split(/\s+/)){if(ctx.measureText(row+word).width>max){ctx.fillText(row,x,y);row='';y+=line;}row+=word+' ';}ctx.fillText(row,x,y);return y+line;}
 function paint(menu){
  const s=api.state();hud.visible=!!session&&!menu;panel.visible=!!session&&!!menu;
  hi.clearRect(0,0,1024,256);hi.fillStyle='#123540e8';hi.fillRect(0,0,1024,256);hi.fillStyle='#e7d4a2';hi.font='bold 31px sans-serif';hi.fillText('AETHER REACH · VR PREVIEW',28,44);hi.fillStyle='#d2efe5';hi.font='29px sans-serif';hi.fillText(`Health ${Math.ceil(s.p.health)}   Shield ${Math.ceil(s.p.shield)}   Ammo ${s.p.ammo}/8`,28,88);hi.fillText(`Relays ${s.relays.size}/3 · Right grip: interact · A: jump/release`,28,130);hi.font='23px sans-serif';wrapped(hi,api.hint()||'Left stick: move · right stick: snap turn · Y: pause / controls',28,173,965,30);ht.needsUpdate=true;
  if(!menu)return;ink.clearRect(0,0,1024,768);ink.fillStyle='#133846f8';ink.fillRect(0,0,1024,768);ink.strokeStyle='#c6b785';ink.lineWidth=4;ink.strokeRect(3,3,1018,762);ink.fillStyle='#ffe6b5';ink.font='bold 36px sans-serif';ink.fillText(menu.title.slice(0,45),34,55);ink.font='24px sans-serif';ink.fillStyle='#c8e1d6';wrapped(ink,menu.description.slice(0,460),34,98,952,31);
  if(menu.root?.id==='map-dialog')ink.drawImage(document.getElementById('map'),30,80,964,210);
  menu.items.slice(0,6).forEach((item,i)=>{const y=302+i*60;ink.fillStyle=item.focused?'#dec083':'#255665';ink.fillRect(25,y,974,51);ink.fillStyle=item.focused?'#102d3b':'#e7eee0';ink.font='25px sans-serif';ink.fillText(item.label.slice(0,64),40,y+34);});ink.font='20px sans-serif';ink.fillStyle='#b9d6cf';ink.fillText('Left stick / ray: select · right trigger: confirm · B: back',34,736);tex.needsUpdate=true;
 }
 async function end(){if(session)try{await session.end();}catch(e){status.textContent='Unable to close XR session: '+e.message;}}
 button.onclick=async()=>{
  if(entering||session)return;entering=true;button.disabled=true;api.clear();
  try{
   const next=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});session=next;await renderer.xr.setSession(next);shadowBefore=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
   api.start();offsetYaw=api.state().p.yaw;rig.add(camera);camera.position.set(0,0,0);camera.quaternion.identity();lastHead=null;head=null;inputs.reset();turn.reset();aim=null;document.body.classList.add('in-xr');exit.hidden=false;
   next.addEventListener('visibilitychange',()=>{suspended=next.visibilityState!=='visible';if(suspended){api.pause();api.clear();inputs.reset();}lastHead=null;});
   next.addEventListener('end',()=>{session=null;entering=false;head=lastHead=null;aim=null;suspended=false;inputs.reset();turn.reset();renderer.shadowMap.enabled=shadowBefore;scene.add(camera);rig.position.set(0,0,0);rig.rotation.set(0,0,0);hud.visible=panel.visible=false;button.disabled=false;button.textContent='Enter VR (preview)';document.body.classList.remove('in-xr');exit.hidden=true;api.clear();api.pause();view.resize(innerWidth,innerHeight);});
   status.textContent='Immersive preview running. Y opens controls; the VR menu offers Exit VR.';
  }catch(error){const failed=session;session=null;try{await failed?.end();}catch{}scene.add(camera);renderer.shadowMap.enabled=shadowBefore;button.disabled=false;status.textContent='VR could not start: '+error.message+'. Desktop and controller play remain available.';}
  finally{entering=false;}
 };
 exit.onclick=end;
 if(isSecureContext&&navigator.xr?.isSessionSupported){navigator.xr.isSessionSupported('immersive-vr').then(ok=>{button.disabled=!ok;button.textContent=ok?'Enter VR (preview)':'VR headset not available';}).catch(()=>{button.textContent='WebXR unavailable';});}else{button.textContent='WebXR unavailable in this browser';}
 function syncRig(){if(!head)return;const p=api.state().p,c=Math.cos(offsetYaw),s=Math.sin(offsetYaw);rig.rotation.y=-offsetYaw;rig.position.set(p.x-(head.x*c-head.z*s),p.y,p.z-(head.x*s+head.z*c));rig.updateMatrixWorld(true);}
 function frame(frame,dt){
  if(!session)return null;
  if(!frame||suspended||session.visibilityState==='hidden'){lastHead=null;return {move:[0,0],held:{},edges:{}};}
  const pose=frame.getViewerPose(renderer.xr.getReferenceSpace());if(!pose){api.pause();api.clear();lastHead=null;return null;}
  const p=api.state().p,raw=pose.transform.position,controls=xrControls(inputs,session.inputSources);const menu=api.menu();
  if(!menu){offsetYaw+=turn.update(controls.turn);if(lastHead)roomMove(api.state(),(raw.x-lastHead.x)*Math.cos(offsetYaw)-(raw.z-lastHead.z)*Math.sin(offsetYaw),(raw.x-lastHead.x)*Math.sin(offsetYaw)+(raw.z-lastHead.z)*Math.cos(offsetYaw));}else turn.reset();
  head={x:raw.x,y:raw.y,z:raw.z};lastHead={...head};syncRig();
  rotation.set(pose.transform.orientation.x,pose.transform.orientation.y,pose.transform.orientation.z,pose.transform.orientation.w);vector.set(0,0,-1).applyQuaternion(rotation);p.yaw=offsetYaw+Math.atan2(vector.x,-vector.z);p.pitch=Math.asin(Math.max(-1,Math.min(1,vector.y)));
  aim=null;const hand=controllers.find(c=>c.source?.handedness==='right');if(hand){const inputPose=frame.getPose(hand.source.targetRaySpace,renderer.xr.getReferenceSpace());if(inputPose){const pos=inputPose.transform.position,q=inputPose.transform.orientation;vector.set(pos.x,pos.y,pos.z).applyMatrix4(rig.matrixWorld);const origin={x:vector.x,y:vector.y,z:vector.z};rotation.set(q.x,q.y,q.z,q.w).premultiply(rig.quaternion);vector.set(0,0,-1).applyQuaternion(rotation);aim={origin,direction:{x:vector.x,y:vector.y,z:vector.z}};
   if(menu){panel.updateWorldMatrix(true,false);raycaster.set(new T.Vector3(origin.x,origin.y,origin.z),vector);const hit=raycaster.intersectObject(panel)[0];if(hit?.uv){const row=Math.floor(((1-hit.uv.y)*768-302)/60);if(row>=0&&row<menu.items.length)api.focus(menu.items[row].element);}}
  }}
  if(performance.now()-lastPaint>120){paint(menu);lastPaint=performance.now();}
  return controls;
 }
 return {frame,syncRig,end,reset(){inputs.reset();turn.reset();},get active(){return !!session},get aim(){return aim},get supported(){return !button.disabled},get rig(){return rig}};
}
