/* Actual per-eye miniature / first-person geometry, sharing one simulation.
 * Only presentation transforms are changed; restore root before the next pose.
 */
import * as T from './vendor/three.module.js';
import {inQuarter,quarterBlocked} from './quarter-core.mjs';
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
export const APERTURES=Object.freeze(['corner','overhead','front']);
export function aperture(v){return APERTURES.includes(v)?v:'corner';}
export function apertureFaces(v){v=aperture(v);return {topOpen:v!=='front',frontOpen:v!=='overhead'};}
export function changeFace(v,face,open){const f=apertureFaces(v);if(face==='top')f.topOpen=!!open;else if(face==='front')f.frontOpen=!!open;else return aperture(v);if(!f.topOpen&&!f.frontOpen){if(face==='top')f.frontOpen=true;else f.topOpen=true;}return f.topOpen?(f.frontOpen?'corner':'overhead'):'front';}
export function spatialPreferences(raw={}){const number=(v,a,b,d)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;return {aperture:aperture(raw?.aperture),scale:number(raw?.scale,.028,.06,.04),yaw:Number.isFinite(raw?.yaw)?angle(raw.yaw):0,height:number(raw?.height,-.45,.55,0),distance:number(raw?.distance,1.1,2.6,1.8)};}
export function createHeadingLatch(){let heading=null;return {reset(){heading=null;},read(amount,current){if(!Number.isFinite(current))current=0;if(amount<.08){heading=null;return current;}if(heading===null)heading=current;return heading;}};}
export function firstPersonMatrix(actor,origin,phi){const r=new T.Matrix4().makeRotationY(phi),eye=new T.Vector3(actor.x,actor.ground+1.65,actor.z).applyMatrix4(r);r.setPosition(origin.x-eye.x,origin.y-eye.y,origin.z-eye.z);return r;}
export function createSpatialXR({scene,stage,view,getState,release,openOptions}){
 const geometry=view.spatial,mini=new T.Group(),worldDraw=new T.Group(),headWorld=new T.Group();scene.add(headWorld);stage.add(mini);mini.add(worldDraw);
 let prefs=spatialPreferences(),desired='theatre',session=null,sessionMode='immersive-vr',viewer=null,fpOrigin=null,phi=0,snapArmed=true,hitSource=null,hitPose=null,placement='manual',renderedEyes=0,draws=0,headBlocked=false;
 try{prefs=spatialPreferences(JSON.parse(localStorage.getItem('svgn.leonardos-guild.spatial.v1')));}catch{}
 const b=geometry.bounds,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2,width=b.maxX-b.minX+2,depth=b.maxZ-b.minZ+2,height=b.maxY-b.minY+1;
 const shell=new T.Group();mini.add(shell);const shellMat=new T.MeshStandardMaterial({color:'#344b50',roughness:.8,side:T.DoubleSide}),edgeMat=new T.MeshStandardMaterial({color:'#b9905c',roughness:.7});
 const make=(w,h,d,mat=shellMat)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);shell.add(o);return o;};
 const back=make(width,height,.2),left=make(.2,height,depth),right=make(.2,height,depth),top=make(width,.2,depth),front=make(width,height,.2),base=make(width,.25,depth,edgeMat);
 back.position.set(0,b.minY+height/2,-depth/2);left.position.set(-width/2,b.minY+height/2,0);right.position.set(width/2,b.minY+height/2,0);top.position.set(0,b.minY+height,0);front.position.set(0,b.minY+height/2,depth/2);base.position.set(0,-3.85,0);
 const handle=new T.Mesh(new T.BoxGeometry(.38,.065,.12),edgeMat);handle.name='Diorama view handle';mini.add(handle);
 const hitMarker=new T.Mesh(new T.RingGeometry(.06,.08,28),new T.MeshBasicMaterial({color:'#d7f5df',side:T.DoubleSide}));hitMarker.rotation.x=-Math.PI/2;hitMarker.visible=false;scene.add(hitMarker);
 const blocker=new T.Mesh(new T.SphereGeometry(.24,12,8),new T.MeshBasicMaterial({color:'#121e25',side:T.BackSide,depthTest:false,depthWrite:false}));blocker.renderOrder=2000;blocker.visible=false;scene.add(blocker);
 const aim=new T.Mesh(new T.RingGeometry(.004,.0055,24),new T.MeshBasicMaterial({color:'#fff1b3',side:T.DoubleSide,depthTest:false,depthWrite:false}));aim.renderOrder=1000;aim.visible=false;scene.add(aim);
 const basis=createHeadingLatch(),daySky=new T.Color('#a6c7c5');
 function effective(){return geometry.available()&&inQuarter(getState())&&getState().mode==='foot'?desired:'theatre';}
 function persist(){try{localStorage.setItem('svgn.leonardos-guild.spatial.v1',JSON.stringify(prefs));}catch{}}
 function poseYaw(p){return new T.Euler().setFromQuaternion(new T.Quaternion().copy(p.transform.orientation),'YXZ').y;}
 function applyMini(){shell.scale.setScalar(prefs.scale);worldDraw.scale.setScalar(prefs.scale);worldDraw.rotation.y=Math.PI;worldDraw.position.set(cx*prefs.scale,0,cz*prefs.scale);mini.rotation.y=prefs.yaw;if(placement==='manual')mini.position.set(-.45,1.02+prefs.height,-prefs.distance);handle.position.set(0,-3.9*prefs.scale,depth*prefs.scale/2+.055);const faces=apertureFaces(prefs.aperture);top.visible=!faces.topOpen;front.visible=!faces.frontOpen;}
 function setMode(v){if(!['theatre','diorama','first-person'].includes(v)||v!=='theatre'&&!geometry.available()||v==='first-person'&&sessionMode==='immersive-ar')return false;desired=v;fpOrigin=null;snapArmed=false;release();basis.reset();return true;}
 async function begin(value,newSession,reference,type='immersive-vr'){desired=value;session=newSession;sessionMode=type;viewer=fpOrigin=null;hitPose=null;placement='manual';basis.reset();snapArmed=false;applyMini();hitSource?.cancel?.();hitSource=null;
  if(type==='immersive-ar'&&value==='diorama'&&newSession?.requestHitTestSource){try{const space=await newSession.requestReferenceSpace('viewer'),source=await newSession.requestHitTestSource({space});if(session===newSession)hitSource=source;else source.cancel?.();}catch{placement='manual';}}
 }
 function end(){hitSource?.cancel?.();hitSource=null;session=null;viewer=fpOrigin=null;mini.visible=false;headWorld.visible=false;hitMarker.visible=false;blocker.visible=false;aim.visible=false;geometry.setPresentation('desktop');basis.reset();}
 function poll(p,frame,reference){viewer=p;if(!p)return;if(hitSource){try{const h=frame.getHitTestResults(hitSource)[0]?.getPose(reference);if(h?.transform){hitPose=h;hitMarker.position.copy(h.transform.position);hitMarker.visible=desired==='diorama'&&placement==='manual';}else{hitPose=null;hitMarker.visible=false;}}catch{hitPose=null;hitMarker.visible=false;}}
  if(effective()==='first-person'&&!fpOrigin){fpOrigin={...p.transform.position};phi=poseYaw(p)+Math.PI-getState().yaw;}
 }
 function controls(mx,my,turn){const mode=effective();if(mode==='theatre'||!viewer)return null;const headYaw=poseYaw(viewer);if(mode==='first-person'){if(Math.abs(turn)<.25)snapArmed=true;else if(Math.abs(turn)>.65&&snapArmed){phi-=Math.sign(turn)*Math.PI/6;snapArmed=false;basis.reset();}return {heading:angle(headYaw+Math.PI-phi),look:0,blocked:headBlocked};}return {heading:basis.read(Math.hypot(mx,my),angle(headYaw-stage.rotation.y-prefs.yaw)),look:0};}
 function modify(action){if(typeof action!=='string')return false;const before=JSON.stringify(prefs);if(action==='view-theatre')return setMode('theatre');if(action==='view-diorama')return setMode('diorama');if(action==='view-first-person')return setMode('first-person');
  if(action.startsWith('aperture-'))prefs.aperture=aperture(action.slice(9));else if(action==='toggle-top')prefs.aperture=changeFace(prefs.aperture,'top',!apertureFaces(prefs.aperture).topOpen);else if(action==='toggle-front')prefs.aperture=changeFace(prefs.aperture,'front',!apertureFaces(prefs.aperture).frontOpen);
  else if(action==='rotate-left')prefs.yaw-=Math.PI/6;else if(action==='rotate-right')prefs.yaw+=Math.PI/6;else if(action==='scale-up')prefs.scale+=.005;else if(action==='scale-down')prefs.scale-=.005;
  else if(action==='raise'){prefs.height+=.1;placement='manual';}else if(action==='lower'){prefs.height-=.1;placement='manual';}else if(action==='nearer'){prefs.distance-=.15;placement='manual';}else if(action==='farther'){prefs.distance+=.15;placement='manual';}
  else if(action==='place-surface'&&hitPose){stage.updateWorldMatrix(true,false);mini.position.copy(stage.worldToLocal(new T.Vector3().copy(hitPose.transform.position)));mini.position.y+=3.98*prefs.scale;placement='hit-test-surface';hitMarker.visible=false;}
  else if(action==='recenter'){placement='manual';fpOrigin=null;}else return false;
  prefs=spatialPreferences(prefs);applyMini();release();basis.reset();if(before!==JSON.stringify(prefs))persist();return true;
 }
 function hit(ray){if(effective()!=='diorama')return null;mini.updateWorldMatrix(true,true);return ray.intersectObject(handle,false)[0]?{key:'exhibit-handle',kind:'spatial',id:'spatial:exhibit-handle',run:openOptions,hold:null}:null;}
 function draw(renderer,camera){const mode=effective();mini.visible=mode==='diorama';headWorld.visible=mode==='first-person';blocker.visible=aim.visible=false;if(mode!=='first-person')headBlocked=false;if(mode==='theatre')return false;
  const g=geometry.root,parent=g.parent,position=g.position.clone(),rotation=g.quaternion.clone(),scale=g.scale.clone(),s=getState(),previousBackground=scene.background;
  try{if(mode==='diorama'){applyMini();worldDraw.add(g);g.position.set(0,0,0);g.quaternion.identity();g.scale.setScalar(1);geometry.setPresentation('diorama');}
   else{if(!fpOrigin||!viewer)return false;scene.background=daySky;headWorld.matrixAutoUpdate=false;headWorld.matrix.copy(firstPersonMatrix({x:s.x,z:s.z,ground:s.quarter.groundY+(s.lift||0)},fpOrigin,phi));headWorld.updateWorldMatrix(true,false);headWorld.add(g);g.position.set(0,0,0);g.quaternion.identity();g.scale.setScalar(1);geometry.setPresentation('first-person');const head=new T.Vector3().copy(viewer.transform.position).applyMatrix4(headWorld.matrix.clone().invert());headBlocked=Math.hypot(head.x-s.x,head.z-s.z)>.8||quarterBlocked(s,head.x,head.z,.16);blocker.visible=headBlocked;if(headBlocked)blocker.position.copy(viewer.transform.position);aim.visible=!!s.resonance.aim&&!headBlocked;if(aim.visible){const yaw=poseYaw(viewer);aim.position.copy(viewer.transform.position).add(new T.Vector3(-Math.sin(yaw)*.7,0,-Math.cos(yaw)*.7));aim.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),yaw);}}
   g.updateWorldMatrix(true,true);renderer.render(scene,camera);draws++;renderedEyes=renderer.xr.getCamera?.()?.cameras?.length||0;return true;
  }finally{scene.background=previousBackground;parent?.add(g);g.position.copy(position);g.quaternion.copy(rotation);g.scale.copy(scale);g.updateWorldMatrix(true,true);geometry.setPresentation('desktop');}
 }
 applyMini();mini.visible=false;headWorld.visible=false;
 return {begin,end,poll,controls,modify,hit,draw,effective,inspect:()=>({mode:effective(),requested:desired,aperture:prefs.aperture,faces:apertureFaces(prefs.aperture),scale:prefs.scale,yaw:prefs.yaw,height:prefs.height,distance:prefs.distance,placement,hitAvailable:!!hitPose,geometryDraws:draws,renderedEyes,headBlocked,aimVisible:aim.visible,worldIsTexture:false,viewScope:'Waterwheel Quarter; earlier regions retain theatre',hardwareVerified:false})};
}
export function createSpatialOptions({getXR,setPause,getState}){
 const d=document.createElement('dialog');d.id='guild-spatial-options';d.setAttribute('aria-label','XR views and diorama openings');document.body.append(d);d.addEventListener('close',()=>setPause(false));
 function open(){const xr=getXR();if(!xr?.spatialAction)return;d.replaceChildren();const h=document.createElement('h2'),p=document.createElement('p'),status=document.createElement('p');h.textContent='XR views and miniature';p.textContent='One apprentice, one save. Stop before switching views. AR starts with its separate session selection. Presentation changes never grant remote interactions.';status.id='spatial-feedback';status.setAttribute('role','status');d.append(h,p,status);
  const options=[['view-diorama','Third-person diorama'],['view-first-person','First-person VR'],['view-theatre','Seated theatre / all regions'],['aperture-corner','Open top and front'],['aperture-overhead','Open top; close front'],['aperture-front','Open front; close top'],['toggle-top','Toggle top; keep an opening'],['toggle-front','Toggle front; keep an opening'],['scale-up','Larger miniature'],['scale-down','Smaller miniature'],['raise','Raise the exhibit'],['lower','Lower the exhibit'],['nearer','Bring the exhibit closer'],['farther','Move the exhibit farther'],['rotate-left','Rotate exhibit left'],['rotate-right','Rotate exhibit right'],['place-surface','Place on detected surface'],['recenter','Return to manual placement / center eye origin']];
  for(const [id,text]of options){const b=document.createElement('button');b.dataset.spatialAction=id;b.textContent=text;b.onclick=()=>{if(id.startsWith('view-')&&Math.abs(getState().speed)>.15){status.textContent='Return to play and stop before changing views.';return;}status.textContent=xr.spatialAction(id)?'View updated. Your apprentice and progression did not move.':'This needs a compatible active XR session in the Quarter, or a detected surface. Manual placement remains available.';};d.append(b);}
  const back=document.createElement('button');back.textContent='Return / B';back.dataset.padDefault='';back.onclick=()=>d.close();d.append(back);setPause(true);if(!d.open)d.showModal();
 }
 return {open,close(){if(!d.open)return false;d.close();return true;}};
}
