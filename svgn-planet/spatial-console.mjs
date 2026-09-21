/* Neighborhood-only in-scene console. Scene/reference/controller coordinates;
 * no DOM overlay, camera child, browser navigation, hub code or gameplay writes. */
import * as T from './vendor/three.module.js';
import {floorAnchor,consoleTransform,loadConsolePrefs,saveConsolePrefs,parseConsolePrefs} from './console-state.mjs';
const up=new T.Vector3(0,1,0),unitScale=new T.Vector3(1,1,1);
export function createSpatialConsole(ui,panel,atlas,hooks){
 // Draw after the transparent world queue; depthTest=false alone is insufficient.
 panel.material.transparent=true;panel.material.needsUpdate=true;
 const loaded=loadConsolePrefs(hooks.storage);let prefs=loaded.prefs,blocked=loaded.blocked,anchor=null,amount=0,opened=false,rows=[],lastHUD=-Infinity,signature='',hostHand=null,controllerDocked=false;
 const base=new T.Group();base.name='Floor rotunda (reference-space anchored)';ui.add(base);
 const surface=(color,extra={})=>new T.MeshBasicMaterial({color,transparent:true,toneMapped:false,depthTest:false,depthWrite:false,...extra});
 const disc=new T.Mesh(new T.CylinderGeometry(.24,.26,.025,40),surface(0x294652));disc.renderOrder=9997;base.add(disc);
 const rim=new T.Mesh(new T.TorusGeometry(.255,.006,6,48),surface(0xdce9bb));rim.rotation.x=Math.PI/2;rim.renderOrder=9998;base.add(rim);
 const post=new T.Mesh(new T.CylinderGeometry(.028,.045,1,12),surface(0x416977));post.renderOrder=9996;base.add(post);
 const markerCanvas=document.createElement('canvas');markerCanvas.width=512;markerCanvas.height=512;
 const mc=markerCanvas.getContext('2d');mc.fillStyle='#193743';mc.fillRect(0,0,512,512);mc.fillStyle='#fff2d6';mc.textAlign='center';mc.font='bold 64px sans-serif';mc.fillText('MISSIONS',256,243);mc.font='32px sans-serif';mc.fillText('Point + select',256,302);
 const marker=new T.Mesh(new T.CircleGeometry(.235,40),surface(0xffffff,{map:new T.CanvasTexture(markerCanvas)}));marker.rotation.x=-Math.PI/2;marker.position.y=.016;marker.renderOrder=9999;base.add(marker);
 const controls=Array.from({length:9},()=>{
  const group=new T.Group(),body=new T.Mesh(new T.BoxGeometry(1,1,.016),surface(0x3f6874)),map=atlas.clone();map.needsUpdate=true;
  const face=new T.Mesh(new T.PlaneGeometry(1,1),surface(0xffffff,{map}));face.position.z=.012;body.renderOrder=10001;face.renderOrder=10002;group.add(body,face);panel.add(group);group.visible=false;
  return {group,body,face,map,row:null};
 });
 const cursor=new T.Mesh(new T.SphereGeometry(.009,8,6),surface(0xffef8c));cursor.renderOrder=10005;cursor.visible=false;ui.add(cursor);
 const hc=document.createElement('canvas');hc.width=768;hc.height=512;const hctx=hc.getContext('2d'),ht=new T.CanvasTexture(hc);ht.colorSpace=T.SRGBColorSpace;
 const hud=new T.Mesh(new T.PlaneGeometry(.38,.25),surface(0xffffff,{map:ht,side:T.DoubleSide}));hud.name='Controller or floor objective card';hud.renderOrder=9999;hud.visible=false;ui.add(hud);
 function configure(key,value){
  const next=parseConsolePrefs({...prefs,[key]:value});prefs=next;
  if(!blocked&&!saveConsolePrefs(hooks.storage,next)){blocked=true;hooks.message?.('Console settings work for this session; storage is unavailable.');}
  hooks.clear?.();return {...prefs};
 }
 function locate(viewer,floorY){anchor=floorAnchor(viewer.transform||viewer,floorY);}
 function mountPose(pose,scale,offset){
  const q=new T.Quaternion().copy(pose.transform.orientation),v=new T.Vector3().copy(pose.transform.position).add(offset.applyQuaternion(q));
  return new T.Matrix4().compose(v,q.multiply(new T.Quaternion().setFromEuler(new T.Euler(-.45,0,0))),new T.Vector3().setScalar(scale));
 }
 function step({viewer,floorY,open,dt,frame,ref,sources,dominant,now}){
  if(!anchor||open&&!opened)locate(viewer,floorY);opened=open;
  const moving=prefs.motion&&!(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  amount=moving?T.MathUtils.clamp(amount+(open?1:-1)*Math.min(.1,Math.max(0,dt))/.24,0,1):Number(open);
  panel.matrixAutoUpdate=false;panel.matrix.copy(consoleTransform(anchor,prefs,amount));panel.matrixWorldNeedsUpdate=true;
  const source=sources.find(s=>s.handedness!=='none'&&s.handedness!==dominant)||sources[0];
  const wrist=source?.hand?.get('wrist'),host=wrist?frame.getJointPose(wrist,ref):source?.gripSpace?frame.getPose(source.gripSpace,ref):null;hostHand=host?source.handedness:null;
  controllerDocked=!!(open&&prefs.mount==='controller'&&host&&sources.length>1);
  if(controllerDocked){panel.matrix.copy(mountPose(host,prefs.size*.6,new T.Vector3(source.handedness==='left'?-.2:.2,.12,-.05)));panel.matrixWorldNeedsUpdate=true;}
  const b=new T.Vector3(0,0,-prefs.distance).applyAxisAngle(up,anchor.yaw);base.position.set(anchor.x+b.x,anchor.y+.025,anchor.z+b.z);base.rotation.y=anchor.yaw;
  const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(viewer.transform.orientation)),lookingDown=f.y<-.48;
  base.visible=!controllerDocked&&(open||lookingDown);post.visible=open;post.scale.y=Math.max(.025,panel.matrix.elements[13]-anchor.y-.2);post.position.y=post.scale.y/2;
  marker.visible=!open;cursor.visible=false;controls.forEach(c=>{c.body.material.color.setHex(0x3f6874);c.group.position.z=.008;});
  const hp=new T.Vector3().copy(viewer.transform.position),grip=host&&new T.Vector3().copy(host.transform.position);
  const holding=source?.hand?false:source?.gamepad?.buttons?.some(b=>b.pressed||b.value>.2);
  const glance=!!grip&&grip.distanceTo(hp)>.18&&grip.distanceTo(hp)<1&&grip.y>hp.y-.6&&grip.y<hp.y+.15&&!holding;
  hud.visible=!open&&prefs.hud!=='off'&&(prefs.hud==='wrist'?glance:lookingDown);
  if(hud.visible){
   hud.matrixAutoUpdate=false;
   if(prefs.hud==='wrist'&&host)hud.matrix.copy(mountPose(host,1,new T.Vector3(source.handedness==='left'?-.1:.1,.13,0)));
   else hud.matrix.compose(base.position.clone().add(new T.Vector3(0,.055,.3).applyAxisAngle(up,anchor.yaw)),new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,anchor.yaw,0,'YXZ')),unitScale);
   hud.matrixWorldNeedsUpdate=true;
   if(now-lastHUD>400){drawHUD(hooks.hud?.()||{goal:hooks.goal?.()||'Open Missions to choose your next goal.'});lastHUD=now;}
  }
  ui.updateMatrixWorld(true);
 }
 function drawHUD(data){
  hctx.fillStyle='#122e3a';hctx.fillRect(0,0,768,512);hctx.fillStyle='#f6d689';hctx.font='bold 31px sans-serif';hctx.fillText((data.title||'NEIGHBORHOOD MISSIONS').slice(0,34),22,44);
  hctx.fillStyle='#ffffff';hctx.font='30px sans-serif';let line='',y=96;
  for(const word of String(data.goal||'Choose a mission').split(/\s+/)){if(hctx.measureText(line+word).width>710){hctx.fillText(line,22,y);line='';y+=36;if(y>168)break;}line+=word+' ';}hctx.fillText(line,22,y);
  hctx.font='26px sans-serif';hctx.fillStyle='#cde9e1';hctx.fillText(String(data.detail||'').slice(0,53),22,228);hctx.fillText(String(data.equipment||'').slice(0,38),22,277);
  if(data.map){hctx.drawImage(data.map,510,272,238,220);}
  hctx.font='24px sans-serif';hctx.fillText('Menu: '+(data.menu||'Y')+' / raised pinch',22,332);hctx.fillText('Lower hand to clear view',22,368);hctx.fillText(String(data.controls||'').slice(0,35),22,415);
  if(data.health!=null)hctx.fillText('Health: '+data.health,22,466);ht.needsUpdate=true;
 }
 function sync(newRows){
  rows=newRows;signature=rows.map(r=>r.id||r.label).join('|');
  controls.forEach((c,i)=>{
   const r=rows[i];c.row=r||null;c.group.visible=!!r;if(!r)return;
   c.group.position.set(((r.x+r.w/2)/1024-.5)*1.4,(.5-(r.y+r.h/2)/1024)*1.4,.008);
   c.group.scale.set(r.w/1024*1.4,r.h/1024*1.4,1);c.map.repeat.set(r.w/1024,r.h/1024);c.map.offset.set(r.x/1024,1-(r.y+r.h)/1024);c.map.needsUpdate=true;
  });
 }
 function hit(caster,open,pressed=false){
  if(!open){if(!base.visible||!marker.visible)return null;const h=caster.intersectObject(marker)[0];return h?{hit:h,summon:true}:null;}
  for(const c of controls){if(!c.group.visible)continue;const h=caster.intersectObject(c.face)[0];if(h){cursor.visible=true;cursor.position.copy(h.point);c.body.material.color.setHex(0xf6d689);c.group.position.z=pressed?.001:.008;return {hit:h,row:c.row,u:h.uv.x};}}
  return null;
 }
 function end(){panel.visible=base.visible=hud.visible=cursor.visible=false;anchor=null;opened=false;amount=0;controllerDocked=false;rows=[];controls.forEach(c=>c.group.visible=false);}
 return {step,sync,hit,end,configure,recenter:()=>{anchor=null;},get prefs(){return {...prefs};},get ready(){return !opened||amount>=.99;},inspect:()=>({mount:prefs.mount,controllerDocked,preferences:{...prefs},storageBlocked:blocked,open:opened,progress:amount,anchor:anchor&&{...anchor},floorMeasured:!!anchor?.measured,headAttached:false,buttonMeshes:controls.filter(c=>c.group.visible&&panel.visible).length,hoverVisible:cursor.visible,hudVisible:hud.visible,hudHost:hostHand,panelMatrix:panel.matrixWorld.toArray(),hudMatrix:hud.matrixWorld.toArray(),signature})};
}
