import * as T from './vendor/three.module.js';
import {readFieldDesk,writeFieldDesk,parseFieldDesk,deskProgress,controlCaption} from './field-desk-state.mjs';
/* All meshes are in reference-space UI, never parented to the headset camera or
 * transformed with either game world. This is not the private studio launcher. */
export function createFieldDesk({panel,ui,storage,state,status,drawMap,message}){
 const loaded=readFieldDesk(storage);let settings=loaded.settings,blocked=loaded.blocked,progress=0,lastHUD=-Infinity,anchored=false,floorKnown=false;
 const anchor=new T.Vector3(),yawQ=new T.Quaternion(),up=new T.Vector3(0,1,0),pitchQ=new T.Quaternion();
 const plinth=new T.Group();plinth.name='Summonable Neighborhood field desk';ui.add(plinth);
 const mat=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthTest:false,depthWrite:false,toneMapped:false});
 const deck=new T.Mesh(new T.CylinderGeometry(.48,.50,.035,48),mat(0x173a46,.94));deck.renderOrder=9997;plinth.add(deck);
 const rim=new T.Mesh(new T.TorusGeometry(.49,.009,6,48),mat(0x93e0c7));rim.rotation.x=Math.PI/2;rim.renderOrder=9998;plinth.add(rim);
 const stem=new T.Mesh(new T.CylinderGeometry(.022,.038,1,8),mat(0x477c82));stem.renderOrder=9997;plinth.add(stem);
 const backing=new T.Mesh(new T.BoxGeometry(1.42,1.42,.032),mat(0x0d2530));backing.position.z=-.020;backing.renderOrder=9999;panel.add(backing);
 const glow=new T.Mesh(new T.PlaneGeometry(1,1),mat(0x8effd1,.19));glow.position.z=.006;glow.renderOrder=10001;glow.visible=false;panel.add(glow);
 const dot=new T.Mesh(new T.SphereGeometry(.008,8,6),mat(0xffffff));dot.renderOrder=10004;ui.add(dot);dot.visible=false;
 const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d'),texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
 const hud=new T.Mesh(new T.PlaneGeometry(.48,.24),new T.MeshBasicMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide}));hud.name='Wrist mission map and next step';hud.renderOrder=9996;ui.add(hud);hud.visible=false;plinth.visible=false;
 const mapCanvas=document.createElement('canvas');mapCanvas.width=256;mapCanvas.height=256;
 function capture(transform,floorY){
  const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(transform.orientation));
  const heading=Math.atan2(-f.x,-f.z);yawQ.setFromAxisAngle(up,heading);
  floorKnown=Number.isFinite(floorY);anchor.copy(transform.position);anchor.y=floorKnown?floorY:transform.position.y-1.65;anchored=true;
 }
 function text(copy,x,y,width,maxLines,font='28px sans-serif'){
  ctx.font=font;let line='',count=0;for(const word of String(copy||'').split(/\s+/)){if(line&&ctx.measureText(line+' '+word).width>width){ctx.fillText(line,x,y);line='';y+=35;if(++count>=maxLines)return;}line+=(line?' ':'')+word;}if(line&&count<maxLines)ctx.fillText(line,x,y);
 }
 function paintHUD(now){
  if(now-lastHUD<180)return;lastHUD=now;const info=status?.()||{};
  ctx.fillStyle='#102c37';ctx.fillRect(0,0,1024,512);ctx.fillStyle='#83e4cf';text(info.district||'Neighborhood Missions',28,46,930,1,'bold 30px sans-serif');
  ctx.fillStyle='#fff0ba';text(info.goal||'Open Missions to choose your next activity.',310,103,682,3,'bold 29px sans-serif');
  ctx.fillStyle='#d5ecee';text(info.detail||'',310,225,680,2);text(info.notice||'',310,305,680,2,'24px sans-serif');
  ctx.fillStyle='#ffffff';text(controlCaption(settings,state()),28,431,970,1,'bold 26px sans-serif');
  ctx.fillStyle='#aacfd3';text('Y / application Menu: map, missions and field desk',28,482,970,1,'24px sans-serif');
  if(drawMap){drawMap(mapCanvas);ctx.drawImage(mapCanvas,28,93,252,294);}texture.needsUpdate=true;
 }
 function update(now,dt,open,frame,ref,sources,dominant){
  progress=open?deskProgress(progress,true,dt,settings.reducedMotion):0;const e=progress*progress*(3-2*progress);
  if(anchored){
   const p=new T.Vector3(0,.06+settings.height*e,-settings.distance).applyQuaternion(yawQ).add(anchor);
   panel.position.copy(p);panel.quaternion.copy(yawQ).multiply(pitchQ.setFromAxisAngle(new T.Vector3(1,0,0),-(1-e)*Math.PI/2));panel.scale.setScalar(.8*settings.size);
   plinth.position.copy(anchor).add(new T.Vector3(0,0,-settings.distance).applyQuaternion(yawQ));plinth.quaternion.copy(yawQ);
   deck.position.y=.035+(settings.height-.63*settings.size)*e;rim.position.y=deck.position.y+.023;stem.scale.y=Math.max(.02,deck.position.y);stem.position.y=stem.scale.y/2;
  }
  plinth.visible=progress>.001;panel.visible=progress>.001;dot.visible=false;glow.visible=false;
  hud.visible=false;if(open||settings.hud==='off')return;
  let pose=null;
  if(settings.hud==='wrist'){
   const source=sources.find(s=>s.handedness!==dominant&&(s.gripSpace||s.hand))||sources.find(s=>s.gripSpace||s.hand);
   if(source?.hand){const wrist=source.hand.get('wrist');pose=wrist&&frame.getJointPose(wrist,ref);}else if(source?.gripSpace)pose=frame.getPose(source.gripSpace,ref);
  }
  if(pose?.transform){hud.position.copy(pose.transform.position);hud.quaternion.copy(pose.transform.orientation);hud.position.add(new T.Vector3(0,.09,.06).applyQuaternion(hud.quaternion));hud.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-.65));hud.scale.setScalar(1);}
  else if(anchored){hud.position.copy(anchor).add(new T.Vector3(0,.16,-.42).applyQuaternion(yawQ));hud.quaternion.copy(yawQ).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-1.05));hud.scale.setScalar(1.45);}
  else return;
  hud.visible=true;paintHUD(now);
 }
 function highlight(hit,row){if(!hit||!row||progress<.99)return;dot.visible=true;dot.position.copy(hit.point);glow.visible=true;glow.position.x=((row.x+row.w/2)/1024-.5)*1.4;glow.position.y=(.5-(row.y+row.h/2)/1024)*1.4;glow.scale.set(row.w/1024*1.4,row.h/1024*1.4,1);}
 function preference(key,value){const next=parseFieldDesk({...settings,[key]:value});settings=next;lastHUD=-Infinity;if(!blocked&&!writeFieldDesk(storage,next)){blocked=true;message?.('Field-desk settings work for this session; storage is unavailable.');}else if(blocked)message?.('Existing field-desk data was retained. Settings apply to this session only.');}
 return {capture,update,highlight,preference,get settings(){return {...settings};},get ready(){return progress>=.99;},hide(){progress=0;panel.visible=plinth.visible=hud.visible=dot.visible=glow.visible=false;anchored=false;},invalidate(){lastHUD=-Infinity;},inspect:()=>({progress,menuVisible:panel.visible,hudVisible:hud.visible,hudPlacement:settings.hud,headLocked:false,anchored,floorKnown,settings:{...settings},preferenceWriteBlocked:blocked,anchor:anchor.toArray()})};
}
