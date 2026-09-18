/* The live third-person game through a fixed exhibit, plus full-scale VR/AR.
 * Render transforms never enter simulation, collision, interaction or saves. */
import * as T from './vendor/three.module.js';
import {xrPosition,checkedEyeMatrix} from './xr-recovery.mjs';
import {inQuarter,quarterBlocked} from './quarter-core.mjs';
import {PortalMaterials,centeredWorldMatrix,shellMaterial} from './world-portal.mjs';
import {createWorldView} from './world-view.mjs';
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
export const APERTURES=Object.freeze(['corner','overhead','front']);
export function aperture(v){return APERTURES.includes(v)?v:'corner';}
export function apertureFaces(v){v=aperture(v);return {topOpen:v!=='front',frontOpen:v!=='overhead'};}
export function changeFace(v,face,open){const f=apertureFaces(v);if(face==='top')f.topOpen=!!open;else if(face==='front')f.frontOpen=!!open;else return aperture(v);if(!f.topOpen&&!f.frontOpen){if(face==='top')f.frontOpen=true;else f.topOpen=true;}return f.topOpen?(f.frontOpen?'corner':'overhead'):'front';}
export function spatialPreferences(raw={}){const number=(v,a,b,d)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;return {aperture:aperture(raw?.aperture),scale:number(raw?.scale,.028,.06,.04),yaw:Number.isFinite(raw?.yaw)?angle(raw.yaw):0,height:number(raw?.height,-.45,.55,0),distance:number(raw?.distance,1.1,2.6,1.8)};}
export function createHeadingLatch(){let heading=null;return {reset(){heading=null;},read(amount,current){if(amount<.08){heading=null;return current;}if(heading===null)heading=current;return heading;}};}
export function firstPersonMatrix(actor,origin,phi){const r=new T.Matrix4().makeRotationY(phi),eye=new T.Vector3(actor.x,actor.ground+1.65,actor.z).applyMatrix4(r);r.setPosition(origin.x-eye.x,origin.y-eye.y,origin.z-eye.z);return checkedEyeMatrix(r);}
export function createSpatialXR({scene,stage,view,getState,release,openOptions}){
 const geometry=view.scene?createWorldView(view,getState):view.spatial,mini=new T.Group(),worldDraw=new T.Group(),headWorld=new T.Group();scene.add(headWorld);stage.add(mini);mini.add(worldDraw);
 const mask=new PortalMaterials();let prefs=spatialPreferences(),desired='theatre',session=null,sessionMode='immersive-vr',viewer=null,fpOrigin=null,phi=0,snapArmed=true,hitSource=null,hitPose=null,placement='manual',renderedEyes=0,draws=0,headBlocked=false,zoom=2,viewFinite=true;
 try{prefs=spatialPreferences(JSON.parse(localStorage.getItem('svgn.leonardos-guild.spatial.v1')));}catch{}
 // The accepted box dimensions/placement are unchanged. Zoom changes only the
 // amount of game seen through it, not the room-space frame or saved actor.
 const b=geometry.bounds,width=b.maxX-b.minX+2,depth=b.maxZ-b.minZ+2,height=b.maxY-b.minY+1;
 const shell=new T.Group();mini.add(shell);const panels=[];
 function pane(w,h,position,rotation,normal,point){const mat=shellMaterial(new T.Vector3(...normal),new T.Vector3(),mask.uniforms),o=new T.Mesh(new T.PlaneGeometry(w,h),mat);o.position.set(...position);o.rotation.set(...rotation);o.renderOrder=3000;shell.add(o);panels.push({mat,point});return o;}
 const middle=b.minY+height/2;
 pane(width,height,[0,middle,-depth/2],[0,0,0],[0,0,-1],[0,height/2,-depth/2]);
 pane(depth,height,[-width/2,middle,0],[0,Math.PI/2,0],[-1,0,0],[-width/2,height/2,0]);
 pane(depth,height,[width/2,middle,0],[0,Math.PI/2,0],[1,0,0],[width/2,height/2,0]);
 const top=pane(width,depth,[0,b.minY+height,0],[Math.PI/2,0,0],[0,1,0],[0,height,0]);
 const front=pane(width,height,[0,middle,depth/2],[0,0,0],[0,0,1],[0,height/2,depth/2]);
 const outline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(width,height,depth)),new T.LineBasicMaterial({color:'#b9905c',transparent:true,opacity:.6,depthTest:false}));outline.position.y=middle;outline.renderOrder=3001;shell.add(outline);
 const handle=new T.Mesh(new T.BoxGeometry(.38,.065,.12),new T.MeshBasicMaterial({color:'#b9905c'}));handle.name='Show or hide XR controls';mini.add(handle);
 const hitMarker=new T.Mesh(new T.RingGeometry(.06,.08,28),new T.MeshBasicMaterial({color:'#d7f5df',side:T.DoubleSide}));hitMarker.rotation.x=-Math.PI/2;hitMarker.visible=false;scene.add(hitMarker);
 const blocker=new T.Mesh(new T.SphereGeometry(.24,12,8),new T.MeshBasicMaterial({color:'#121e25',side:T.BackSide,depthTest:false,depthWrite:false}));blocker.renderOrder=2000;blocker.visible=false;scene.add(blocker);
 const aim=new T.Mesh(new T.RingGeometry(.004,.0055,24),new T.MeshBasicMaterial({color:'#fff1b3',side:T.DoubleSide,depthTest:false,depthWrite:false}));aim.renderOrder=1000;aim.visible=false;scene.add(aim);
 const sky=new T.Mesh(new T.SphereGeometry(1200,16,8),new T.MeshBasicMaterial({color:'#9bcceb',side:T.BackSide,depthWrite:false}));sky.renderOrder=-1000;scene.add(sky);sky.visible=false;mask.attach(sky.material);
 const portalBase=new T.Matrix4(),center=new T.Vector3();
 function effective(){return geometry.available()?desired:'theatre';}
 function persist(){try{localStorage.setItem('svgn.leonardos-guild.spatial.v1',JSON.stringify(prefs));}catch{}}
 function poseYaw(p){return new T.Euler().setFromQuaternion(new T.Quaternion().copy(p.transform.orientation),'YXZ').y;}
 function actor(){const s=getState();return geometry.anchor?.()||{x:s.x,y:(s.quarter?.groundY||0)+(s.lift||0),z:s.z};}
 function applyMini(){shell.scale.setScalar(prefs.scale);mini.rotation.y=prefs.yaw;if(placement==='manual')mini.position.set(-.45,1.02+prefs.height,-prefs.distance);handle.position.set(0,-3.9*prefs.scale,depth*prefs.scale/2+.055);const f=apertureFaces(prefs.aperture);top.visible=!f.topOpen;front.visible=!f.frontOpen;for(const p of panels)p.mat.uniforms.shellPoint.value.set(...p.point).multiplyScalar(prefs.scale);}
 function setMode(v){
  if(!['theatre','diorama','first-person','first-person-ar'].includes(v)||v!=='theatre'&&!geometry.available())return false;
  if(v==='first-person'&&sessionMode==='immersive-ar'||v==='first-person-ar'&&sessionMode!=='immersive-ar')return false;
  desired=v==='first-person-ar'?'first-person':v;fpOrigin=null;headBlocked=false;snapArmed=false;release();return true;
 }
 async function begin(value,newSession,reference,type='immersive-vr'){
  desired=value;session=newSession;sessionMode=type;headBlocked=false;viewer=fpOrigin=null;hitPose=null;placement='manual';snapArmed=false;applyMini();hitSource?.cancel?.();hitSource=null;
  if(type==='immersive-ar'&&newSession?.requestHitTestSource){try{const space=await newSession.requestReferenceSpace('viewer'),source=await newSession.requestHitTestSource({space});if(session===newSession)hitSource=source;else source.cancel?.();}catch{placement='manual';}}
 }
 function end(){hitSource?.cancel?.();hitSource=null;session=null;viewer=fpOrigin=null;mini.visible=headWorld.visible=hitMarker.visible=blocker.visible=aim.visible=sky.visible=false;mask.active=false;geometry.setPresentation('desktop');}
 function poll(p,frame,reference){
  viewer=p;if(!p)return;
  if(hitSource){try{const h=frame.getHitTestResults(hitSource)[0]?.getPose(reference);hitPose=h?.transform?h:null;hitMarker.visible=!!hitPose&&desired==='diorama'&&placement==='manual'&&!!globalThis.document?.getElementById('guild-spatial-options')?.open;if(hitPose)hitMarker.position.copy(hitPose.transform.position);}catch{hitPose=null;hitMarker.visible=false;}}
  if(effective()==='first-person'&&!fpOrigin){fpOrigin=xrPosition(p.transform.position);phi=poseYaw(p)+Math.PI-getState().yaw;}
 }
 function controls(mx,my,turn){
  // Diorama uses the ORIGINAL third-person camera/right stick. A head glance
  // changes only observation, never travel direction or the game's yaw.
  if(effective()!=='first-person'||!viewer)return null;
  if(Math.abs(turn)<.25)snapArmed=true;else if(Math.abs(turn)>.65&&snapArmed){phi+=Math.sign(turn)*Math.PI/6;snapArmed=false;}
  return {heading:angle(poseYaw(viewer)+Math.PI-phi),look:0,blocked:headBlocked};
 }
 function modify(action){
  if(typeof action!=='string')return false;const before=JSON.stringify(prefs);
  if(action.startsWith('view-'))return setMode(action.slice(5));
  if(action.startsWith('aperture-'))prefs.aperture=aperture(action.slice(9));else if(action==='toggle-top')prefs.aperture=changeFace(prefs.aperture,'top',!apertureFaces(prefs.aperture).topOpen);else if(action==='toggle-front')prefs.aperture=changeFace(prefs.aperture,'front',!apertureFaces(prefs.aperture).frontOpen);
  else if(action==='zoom-in')zoom=Math.min(4,zoom+.5);else if(action==='zoom-out')zoom=Math.max(1,zoom-.5);
  else if(action==='rotate-left')prefs.yaw-=Math.PI/6;else if(action==='rotate-right')prefs.yaw+=Math.PI/6;else if(action==='scale-up')prefs.scale+=.005;else if(action==='scale-down')prefs.scale-=.005;
  else if(action==='raise'){prefs.height+=.1;placement='manual';}else if(action==='lower'){prefs.height-=.1;placement='manual';}else if(action==='nearer'){prefs.distance-=.15;placement='manual';}else if(action==='farther'){prefs.distance+=.15;placement='manual';}
  else if(action==='place-surface'&&hitPose&&desired==='diorama'){stage.updateWorldMatrix(true,false);mini.position.copy(stage.worldToLocal(new T.Vector3().copy(hitPose.transform.position)));mini.position.y+=3.98*prefs.scale;placement='hit-test-surface';hitMarker.visible=false;}
  else if(action==='recenter'){placement='manual';fpOrigin=null;}else return false;
  prefs=spatialPreferences(prefs);applyMini();release();if(before!==JSON.stringify(prefs))persist();return true;
 }
 function hit(ray){if(effective()!=='diorama')return null;mini.updateWorldMatrix(true,true);return ray.intersectObject(handle,false)[0]?{key:'exhibit-handle',kind:'spatial',id:'spatial:exhibit-handle',run:openOptions,hold:null}:null;}
 function draw(renderer,camera){
  const mode=effective();mini.visible=mode==='diorama';headWorld.visible=mode==='first-person';blocker.visible=aim.visible=sky.visible=false;
  if(mode!=='first-person')headBlocked=false;if(mode==='theatre')return false;
  const a=actor(),g=geometry.root,parent=g.parent,position=g.position.clone(),rotation=g.quaternion.clone(),scale=g.scale.clone(),previousBackground=scene.background,previousVisible=g.visible;
  let acquired=false;
  try{
   geometry.acquire?.(mode);acquired=true;
   if(mode==='diorama'){
    applyMini();worldDraw.add(g);g.position.set(0,0,0);g.quaternion.identity();g.scale.setScalar(1);
    worldDraw.matrixAutoUpdate=false;worldDraw.matrix.copy(centeredWorldMatrix(a,prefs.scale*zoom,view.heading?.()??getState().yaw,view.portalPitch?.()||0));mini.updateWorldMatrix(true,true);
    portalBase.copy(mini.matrixWorld).multiply(new T.Matrix4().makeTranslation(0,b.minY*prefs.scale,0));
    mask.configure(portalBase,{width:width*prefs.scale,height:height*prefs.scale,depth:depth*prefs.scale});
    center.set(a.x,a.y,a.z);worldDraw.localToWorld(center);
    if(viewer&&geometry.reveal){const eye=new T.Vector3().copy(viewer.transform.position),right=new T.Vector3(1,0,0).applyQuaternion(new T.Quaternion().copy(viewer.transform.orientation));geometry.reveal([eye.clone().addScaledVector(right,-.033),eye.clone().addScaledVector(right,.033)],center,prefs.scale*zoom,m=>mask.originalClone(m),new T.Vector3(0,1,0).transformDirection(worldDraw.matrixWorld));}
    mask.collect(g);mask.active=true;
    sky.position.copy(viewer?.transform.position||new T.Vector3());sky.material.color.copy(geometry.background?.()||new T.Color('#9bcceb'));sky.visible=true;scene.background=sessionMode==='immersive-ar'?null:previousBackground;
    center.set(a.x,a.y,a.z);worldDraw.localToWorld(center);
    if(!geometry.acquire)geometry.setPresentation('diorama');
   }else{
    if(!fpOrigin||!viewer)return false;
    scene.background=sessionMode==='immersive-ar'?null:geometry.background?.()||new T.Color('#a6c7c5');
    headWorld.matrixAutoUpdate=false;headWorld.matrix.copy(firstPersonMatrix({x:a.x,z:a.z,ground:a.y},fpOrigin,phi));headWorld.updateWorldMatrix(true,false);headWorld.add(g);g.position.set(0,0,0);g.quaternion.identity();g.scale.setScalar(1);
    if(!geometry.acquire)geometry.setPresentation('first-person');
    const head=new T.Vector3().copy(viewer.transform.position).applyMatrix4(headWorld.matrix.clone().invert()),s=getState();
    headBlocked=Math.hypot(head.x-s.x,head.z-s.z)>.8||(geometry.blocked?geometry.blocked(head.x,head.z,.16):inQuarter(s)&&quarterBlocked(s,head.x,head.z,.16));
    blocker.visible=headBlocked&&sessionMode!=='immersive-ar';if(blocker.visible)blocker.position.copy(viewer.transform.position);
    // AR always reveals passthrough on a clipping guard, never a dark wall.
    if(headBlocked&&sessionMode==='immersive-ar')g.visible=false;
    aim.visible=!!s.resonance.aim&&!headBlocked;if(aim.visible){const yaw=poseYaw(viewer);aim.position.copy(viewer.transform.position).add(new T.Vector3(-Math.sin(yaw)*.7,0,-Math.cos(yaw)*.7));aim.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),yaw);}
   }
   g.updateWorldMatrix(true,true);viewFinite=g.matrixWorld.elements.every(Number.isFinite);checkedEyeMatrix(g.matrixWorld);renderer.render(scene,camera);draws++;renderedEyes=renderer.xr.getCamera?.()?.cameras?.length||0;return true;
  }finally{mask.active=false;sky.visible=false;g.visible=previousVisible;scene.background=previousBackground;if(parent)parent.add(g);else g.removeFromParent();g.position.copy(position);g.quaternion.copy(rotation);g.scale.copy(scale);if(acquired)geometry.release?.();g.updateWorldMatrix(true,true);geometry.setPresentation('desktop');}
 }
 applyMini();mini.visible=headWorld.visible=false;
 return {begin,end,poll,controls,modify,hit,draw,effective,inspect:()=>({mode:effective(),requested:desired,aperture:prefs.aperture,faces:apertureFaces(prefs.aperture),scale:prefs.scale,zoom,yaw:prefs.yaw,height:prefs.height,distance:prefs.distance,placement,hitAvailable:!!hitPose,geometryDraws:draws,renderedEyes,viewFinite,firstPersonHeading:viewer?angle(poseYaw(viewer)+Math.PI-phi):null,headBlocked,aimVisible:aim.visible,worldIsTexture:false,viewScope:geometry.scope?.()||'test fixture',playerCentered:true,playerDisplay:center.toArray(),boxPosition:mini.getWorldPosition(new T.Vector3()).toArray(),boxSize:[width*prefs.scale,height*prefs.scale,depth*prefs.scale],portalMaterials:mask.entries.size,cameraPitch:view.portalPitch?.()||0,occluders:geometry.occluders?.()||[],maskedBeyondWalls:true,automaticNearWallTransparency:true,hardwareVerified:false})};
}
export function createSpatialOptions({getXR,setPause,getState}){
 const d=document.createElement('dialog');d.id='guild-spatial-options';d.setAttribute('aria-label','XR views and diorama openings');document.body.append(d);d.addEventListener('close',()=>setPause(false));
 function open(){const xr=getXR();if(!xr?.spatialAction)return;d.replaceChildren();const h=document.createElement('h2'),p=document.createElement('p'),status=document.createElement('p');h.textContent='Game portal and first-person views';p.textContent='The regular game moves around your centered character. Right stick turns the original game camera. The box stays placed; looking around does not steer. Near enclosure panels are automatically transparent. AR needs a separately selected AR session.';status.id='spatial-feedback';status.setAttribute('role','status');d.append(h,p,status);
  const options=[['view-diorama','Third-person world portal'],['view-first-person','First-person VR'],['view-theatre','Seated theatre'],['aperture-corner','Open top and front'],['aperture-overhead','Open top; close front'],['aperture-front','Open front; close top'],['toggle-top','Toggle top; keep an opening'],['toggle-front','Toggle front; keep an opening'],['scale-up','Larger exhibit'],['scale-down','Smaller exhibit'],['raise','Raise exhibit'],['lower','Lower exhibit'],['nearer','Bring exhibit closer'],['farther','Move exhibit farther'],['rotate-left','Rotate exhibit left'],['rotate-right','Rotate exhibit right'],['place-surface','Place on detected surface'],['recenter','Manual placement / center eye origin'],['zoom-in','Zoom game in; keep box size'],['zoom-out','Zoom game out; keep box size'],['view-first-person-ar','First-person AR / passthrough']];
  for(const [id,text]of options){const b=document.createElement('button');b.dataset.spatialAction=id;b.textContent=text;b.onclick=()=>{if(id.startsWith('view-')&&Math.abs(getState().speed)>.15){status.textContent='Return to play and stop before changing views.';return;}status.textContent=xr.spatialAction(id)?'View updated. Your character and progression did not move.':'Select the matching VR or AR session at the title/pause screen, or detect a placement surface. Manual placement remains available.';};d.append(b);}
  const back=document.createElement('button');back.textContent='Return / B';back.dataset.padDefault='';back.onclick=()=>d.close();d.append(back);setPause(true);if(!d.open)d.showModal();
 }
 return {open,close(){if(!d.open)return false;d.close();return true;}};
}
