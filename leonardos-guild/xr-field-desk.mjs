/* Original game-only spatial desk. No private launcher, portal or hub code.
 * Panel commands still call the established game handlers. Scene transforms
 * and bounded preferences never enter player movement, inventory or saves. */
import * as T from './vendor/three.module.js';
import {xrPosition} from './xr-recovery.mjs';
export const DESK_KEY='svgn.leonardos-guild.field-desk.v1';
const bound=(v,lo,hi,d)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d;
export function deskPreferences(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const scale=bound(raw.scale,.6,.96,.74);
 // Keep the entire desk and its controls above the reference floor even
 // when enlarged or lowered. A size change must not bury its own controls.
 return {height:Math.max(bound(raw.height,.7,1.6,1.08),scale*1.35+.08),distance:bound(raw.distance,.85,1.9,1.3),scale,status:['wrist','floor','off'].includes(raw.status)?raw.status:'wrist'};
}
export function deskPlacement(pose,preferences,referenceType='local-floor'){
 const p=xrPosition(pose.transform.position),q=new T.Quaternion().copy(pose.transform.orientation),yaw=new T.Euler().setFromQuaternion(q,'YXZ').y;
 if(!Number.isFinite(yaw))throw new TypeError('Desk orientation is unavailable.');
 const floor=referenceType==='local-floor'?0:p.y-1.6;
 return {x:p.x-Math.sin(yaw)*preferences.distance,y:floor+preferences.height,z:p.z-Math.cos(yaw)*preferences.distance,yaw,floor,foot:{x:p.x,z:p.z}};
}
function labelTexture(text){
 const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');g.fillStyle='#20373e';g.fillRect(0,0,256,96);g.strokeStyle='#e6cd94';g.lineWidth=5;g.strokeRect(3,3,250,90);g.fillStyle='#fff3d7';g.textAlign='center';g.font='bold 27px sans-serif';g.fillText(text,128,58,240);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}
export function createFieldDesk({panel,stage,back,release,getState,getObjective,summon}){
 const home={position:panel.position.clone(),quaternion:panel.quaternion.clone(),scale:panel.scale.clone()},frame=new T.Group(),base=new T.Group();
 frame.name='Summonable Vinci field desk';stage.parent.add(frame,base);
 const bronze=new T.MeshBasicMaterial({color:'#b29660',depthTest:false,depthWrite:false});
 const rim=new T.Mesh(new T.TorusGeometry(.27,.012,6,40),bronze);rim.rotation.x=-Math.PI/2;rim.renderOrder=3990;base.add(rim);
 const stem=new T.Mesh(new T.CylinderGeometry(.012,.018,1,8),bronze);stem.renderOrder=3990;base.add(stem);
 const pad=new T.Mesh(new T.CylinderGeometry(.32,.32,.028,40),new T.MeshBasicMaterial({color:'#1c3439',transparent:true,opacity:.85,depthTest:false,depthWrite:false}));pad.renderOrder=3991;pad.position.set(0,-1.35,-.03);frame.add(pad);
 panel.material.depthTest=false;panel.material.depthWrite=false;panel.renderOrder=4000;
 let prefs=deskPreferences(),spatial=false,visible=false,pose=null,referenceType='local-floor',anchor=null,placements=0,now=0,hover='';
 try{prefs=deskPreferences(JSON.parse(localStorage.getItem(DESK_KEY)));}catch{}
 const controls=[];
 function save(){try{localStorage.setItem(DESK_KEY,JSON.stringify(prefs));}catch{}}
 function place(){if(!pose)return;anchor=deskPlacement(pose,prefs,referenceType);frame.position.set(anchor.x,anchor.y,anchor.z);frame.rotation.set(0,anchor.yaw,0);placements++;}
 function modify(id){
  if(id==='raise')prefs.height+=.1;else if(id==='lower')prefs.height-=.1;
  else if(id==='near')prefs.distance-=.1;else if(id==='far')prefs.distance+=.1;
  else if(id==='larger')prefs.scale+=.04;else if(id==='smaller')prefs.scale-=.04;
  else if(id==='status')prefs.status=prefs.status==='wrist'?'floor':prefs.status==='floor'?'off':'wrist';
  else if(id==='back'){release?.();back?.();return true;}
  else if(id!=='recenter')return false;
  prefs=deskPreferences(prefs);if(id==='recenter')place();else if(anchor){
   frame.position.y=anchor.floor+prefs.height;
   frame.position.x=anchor.foot.x-Math.sin(anchor.yaw)*prefs.distance;frame.position.z=anchor.foot.z-Math.cos(anchor.yaw)*prefs.distance;
  }
  save();release?.();layout();return true;
 }
 const commands=[['raise','Raise'],['lower','Lower'],['near','Closer'],['far','Farther'],['larger','Larger'],['smaller','Smaller'],['recenter','Place here'],['status','HUD mode'],['back','Back / B']];
 for(const [i,[id,text]] of commands.entries()){
  const body=new T.Mesh(new T.BoxGeometry(.32,.105,.035),new T.MeshBasicMaterial({color:'#244b56',depthTest:false,depthWrite:false}));body.position.set((i%3-1)*.35,-.97-Math.floor(i/3)*.13,.045);body.renderOrder=4001;frame.add(body);
  const face=new T.Mesh(new T.PlaneGeometry(.30,.09),new T.MeshBasicMaterial({map:labelTexture(text),depthTest:false,depthWrite:false,toneMapped:false}));face.position.z=.02;face.renderOrder=4002;body.add(face);controls.push({id,body,run:()=>modify(id)});
 }
 const statusCanvas=document.createElement('canvas');statusCanvas.width=640;statusCanvas.height=240;const context=statusCanvas.getContext('2d'),texture=new T.CanvasTexture(statusCanvas);texture.colorSpace=T.SRGBColorSpace;
 const status=new T.Mesh(new T.PlaneGeometry(.28,.105),new T.MeshBasicMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide}));status.name='Compact tool and objective status';status.renderOrder=3998;stage.parent.add(status);let statusText='',statusAt=-Infinity,tracking=null;
 function updateStatus(){
  if(now-statusAt<150)return;statusAt=now;const s=getState(),goal=getObjective?.()||{},tool=s.resonance?.tool||s.mode;
  statusText=(goal.title||'Explore Vinci')+' | '+tool;context.fillStyle='#122b34';context.fillRect(0,0,640,240);context.fillStyle='#fff2cf';context.font='bold 30px sans-serif';context.fillText('LEO / '+String(tool).toUpperCase(),16,39,455);context.font='26px sans-serif';context.fillText('Health '+Math.round(s.health||0)+' / Sling '+(s.resonance?.ready??0),16,80,455);context.fillText(String(goal.title||'Explore Vinci'),16,124,455);context.fillText(String(goal.hint||'Y: Dispatch / B: interact, then back'),16,168,455);context.fillText('HUD: '+prefs.status+' / field desk adjusts placement',16,212,600);
  const map=document.getElementById('minimap');if(map?.width)context.drawImage(map,478,12,150,150);texture.needsUpdate=true;
 }
 function layout(){
  if(!spatial)return;
  frame.scale.setScalar(prefs.scale);base.visible=true;
  if(anchor){base.position.set(visible?frame.position.x:anchor.foot.x-Math.sin(anchor.yaw)*.35,anchor.floor+.025,visible?frame.position.z:anchor.foot.z-Math.cos(anchor.yaw)*.35);rim.scale.setScalar(visible?1:.5);stem.visible=visible;stem.position.y=Math.max(.02,(frame.position.y-anchor.floor)*.5);stem.scale.y=Math.max(.01,frame.position.y-anchor.floor);}
  frame.visible=visible;panel.visible=visible;controls.forEach(c=>c.body.material.color.set(c.id===hover?'#547c87':'#244b56'));
  status.visible=spatial&&!visible&&prefs.status!=='off';
  if(status.visible&&prefs.status==='wrist'&&tracking){const p=xrPosition(tracking.transform.position),q=new T.Quaternion().copy(tracking.transform.orientation);status.position.copy(p).add(new T.Vector3(-.045,.075,.045).applyQuaternion(q));status.quaternion.copy(q).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2));}
  else if(status.visible){status.position.set(stage.position.x,stage.position.y+.25,stage.position.z);status.position.add(new T.Vector3(0,0,-.6).applyAxisAngle(new T.Vector3(0,1,0),stage.rotation.y));status.rotation.set(-Math.PI/3,stage.rotation.y,0);status.scale.setScalar(1.6);}
  if(prefs.status==='wrist'&&tracking)status.scale.setScalar(1);
  frame.updateWorldMatrix(true,true);base.updateWorldMatrix(true,true);status.updateWorldMatrix(true,false);
 }
 function update(real,root,shown,nextPose){
  pose=nextPose||pose;
  if(!real){if(spatial){stage.add(panel);panel.position.copy(home.position);panel.quaternion.copy(home.quaternion);panel.scale.copy(home.scale);}spatial=false;frame.visible=base.visible=status.visible=false;visible=false;return;}
  if(!spatial){frame.add(panel);panel.position.set(0,0,0);panel.quaternion.identity();panel.scale.setScalar(1);spatial=true;visible=false;}
  if((shown&&!visible)||(!anchor&&pose))place();visible=!!shown;layout();
 }
 function tick(time,leftPose,type){now=Number.isFinite(time)?time:now;tracking=leftPose||null;referenceType=type||referenceType;hover='';updateStatus();layout();}
 function hit(ray){if(!spatial)return null;if(!visible){const h=ray.intersectObject(rim,false)[0];return h?{key:'desk-summon',kind:'desk',id:'desk:summon',distance:h.distance,run:()=>summon?.()}:null;}frame.updateWorldMatrix(true,true);const h=ray.intersectObjects(controls.map(c=>c.body),false)[0];if(!h)return null;const c=controls.find(c=>c.body===h.object);hover=c.id;return {key:'desk-'+c.id,kind:'desk',id:'desk:'+c.id,run:c.run,distance:h.distance};}
 function reset(){visible=false;anchor=null;pose=null;tracking=null;frame.visible=base.visible=status.visible=false;}
 frame.visible=base.visible=status.visible=false;
 return {update,tick,hit,modify,reset,inspect:()=>{panel.updateWorldMatrix(true,false);return {matrix:panel.matrixWorld.toArray(),placements,depthTest:panel.material.depthTest,spatial,reference:'stationary-floor-desk',preferences:{...prefs},visible,statusVisible:status.visible,statusText,controls:controls.map(c=>({id:c.id,matrix:c.body.matrixWorld.toArray()}))};}};
}
