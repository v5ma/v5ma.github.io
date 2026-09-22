/* An original in-scene workspace, independent of the private hub implementation.
 * All coordinates below are physical local-floor coordinates, under the XR rig,
 * never the camera or the miniature world. Existing modal actions remain canonical. */
import * as T from './vendor/three.module.js';
import {ROTUNDA_KEY,cleanWorkspace,workspaceStep,createWorkspacePlacement,resetWorkspacePlacement} from './rotunda-core.mjs';
/* Three's union-camera broad-phase can reject a physically visible thin room
 * panel under the inverse diorama scale. Keep only the bounded room UI in the
 * per-eye draw; normal visibility, picking, world culling and portal masks stay. */
export function keepRoomUIInEyeViews(mesh){mesh.frustumCulled=false;return mesh;}
export function createFieldRotunda({rig,panel,hud,texture,api,onRecall}){
 let panelDraws=0;keepRoomUIInEyeViews(panel);panel.onAfterRender=()=>{panelDraws++;};
 let config;try{config=cleanWorkspace(JSON.parse(localStorage.getItem(ROTUNDA_KEY)||'null'));}catch{config=cleanWorkspace();}
 const placement=createWorkspacePlacement();
 const root=new T.Group();root.name='Field rotunda / room space';root.userData.xrUI=true;root.visible=false;rig.add(root);
 const lift=new T.Group();root.add(lift);lift.add(panel);panel.position.set(0,0,0);panel.rotation.set(0,0,0);
 const baseMat=new T.MeshBasicMaterial({color:0x194249,transparent:true,opacity:.96,depthTest:false,depthWrite:false});
 const base=new T.Mesh(new T.CylinderGeometry(.55,.55,.035,48),baseMat);base.renderOrder=996;lift.add(base);
 const rim=new T.Mesh(new T.TorusGeometry(.535,.009,6,48),new T.MeshBasicMaterial({color:0xd4b878,depthTest:false,depthWrite:false}));rim.rotation.x=Math.PI/2;rim.renderOrder=997;lift.add(rim);
 const summonCanvas=document.createElement('canvas');summonCanvas.width=512;summonCanvas.height=128;const ink=summonCanvas.getContext('2d');ink.clearRect(0,0,512,128);ink.fillStyle='#edd59b';ink.font='bold 40px sans-serif';ink.textAlign='center';ink.fillText('MENU / Y',256,72);
 const summon=new T.Mesh(new T.PlaneGeometry(.44,.11),new T.MeshBasicMaterial({map:new T.CanvasTexture(summonCanvas),transparent:true,side:T.DoubleSide,depthTest:false,depthWrite:false}));summon.name='Rotunda floor summon';summon.userData.xrUI=true;summon.rotation.x=-Math.PI/2;summon.renderOrder=1001;rig.add(summon);summon.visible=false;
 rig.add(hud);hud.userData.xrUI=true;
 const buttons=[],side=new T.MeshBasicMaterial({color:0x698d86,transparent:true,depthTest:false,depthWrite:false}),front=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false});
 const point=new T.Mesh(new T.SphereGeometry(.009,8,6),new T.MeshBasicMaterial({color:0xffefa3,depthTest:false,depthWrite:false}));point.renderOrder=1100;point.visible=false;rig.add(point);
 let anchor=null,lastHead=null,progress=0,wasOpen=false,active=false,pressedKey=null,pressedUntil=0,lastItems=[],hudDock='floor';
 const key=i=>i?.element?.id||i?.key||i?.kind;
 function buttonMeshes(items,hover){lastItems=items;for(let i=0;i<Math.max(items.length,buttons.length);i++){
  const item=items[i];if(!buttons[i]&&item){const g=new T.BoxGeometry(1,1,1),m=new T.Mesh(g,[side,side,side,side,front,side]);m.renderOrder=1002;m.userData.xrUI=true;keepRoomUIInEyeViews(m);panel.add(m);buttons.push(m);}
  const b=buttons[i];if(!b)continue;b.visible=!!item;if(!item)continue;b.userData.item=item;b.scale.set(item.w/1024*1.36,item.h/768*1.02,.025);
  b.position.set(((item.x+item.w/2)/1024-.5)*1.36,(.5-(item.y+item.h/2)/768)*1.02,pressedKey===key(item)&&performance.now()<pressedUntil?.012:item===hover||item.focused?.036:.023);
  const uv=b.geometry.attributes.uv;for(let j=16;j<20;j++){const u=(j%2),v=j<18?1:0;uv.setXY(j,(item.x+u*item.w)/1024,1-(item.y+(1-v)*item.h)/768);}uv.needsUpdate=true;
 }}
 function place(head,recall=true){anchor=placement.locate(head||lastHead,config,recall);root.position.set(anchor.x,0,anchor.z);root.rotation.set(0,anchor.yaw,0);summon.position.set(anchor.x,.035,anchor.z);summon.rotation.set(-Math.PI/2,0,-anchor.yaw);}
 function update({enabled,menu,head,frame,space,sources,dt,items,hover}){
  active=!!enabled;lastHead=head||lastHead;const open=active&&!!menu;
  if(!active){root.visible=panel.visible=hud.visible=summon.visible=point.visible=false;wasOpen=false;progress=0;return;}
  if(!anchor||open&&!wasOpen)place(head);wasOpen=open;
  progress=workspaceStep(progress,open,dt,config.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.visible=true;lift.position.y=.035+progress*(config.height-.035);lift.scale.setScalar(config.scale);
  panel.visible=open;panel.position.set(0,0,0);panel.rotation.x=-Math.PI/2*(1-progress);
  base.position.set(0,-.53*progress,0);rim.position.copy(base.position);rim.position.y+=.022;
  base.visible=rim.visible=progress>.01;panel.scale.setScalar(1);summon.visible=!open;point.visible=false;
  hud.visible=!open&&config.hud!=='hidden';hudDock='floor';
  if(hud.visible&&['left','right'].includes(config.hud)){
   const source=(sources||[]).find(s=>s.handedness===config.hud&&!s.hand);let pose;
   try{if(source?.gripSpace)pose=frame?.getPose(source.gripSpace,space);}catch{}
   if(pose?.transform){const p=pose.transform.position,q=pose.transform.orientation;if([p.x,p.y,p.z,q.x,q.y,q.z,q.w].every(Number.isFinite)){
    hud.position.set(p.x+(config.hud==='left'?-.14:.14),p.y+.16,p.z+.035);hud.quaternion.set(q.x,q.y,q.z,q.w);hud.scale.setScalar(.58);hudDock=config.hud;
   }}
  }
  if(hudDock==='floor'){hud.position.set(anchor.x,.12,anchor.z+.12);hud.rotation.set(-Math.PI/2,0,-anchor.yaw);hud.scale.setScalar(.75);}
  buttonMeshes(items||[],hover);root.updateWorldMatrix(true,true);hud.updateWorldMatrix(true,false);summon.updateWorldMatrix(true,false);
 }
 function hit(raycaster,menu){
  if(!active)return null;
  // Invisible or dismissed controls are never submitted to a raycast.
  const targets=menu&&panel.visible?buttons.filter(b=>b.visible&&!b.userData.item.disabled):[summon,hud].filter(o=>o.visible);
  const hits=raycaster.intersectObjects(targets,false),h=hits[0];if(!h)return null;
  point.position.copy(h.point);rig.worldToLocal(point.position);point.visible=true;
  return menu?h.object.userData.item:{kind:'summon',label:'Open rotunda'};
 }
 function press(item){pressedKey=key(item);pressedUntil=performance.now()+150;}
 function save(){config=cleanWorkspace(config);try{localStorage.setItem(ROTUNDA_KEY,JSON.stringify(config));}catch{}if(lastHead)place(lastHead,false);fill();}
 const dialog=document.createElement('dialog');dialog.id='workspace-dialog';dialog.setAttribute('aria-labelledby','workspace-title');
 dialog.innerHTML='<p class="eyebrow">IN-SCENE FIELD ROTUNDA</p><h2 id="workspace-title">Your workspace, out of the way.</h2><p>Y or Xbox Menu summons the workspace. It rests at floor level during play and rises only when selected. Height, distance, rotation and size change this workspace, not the diorama. Point and trigger or pinch to select. Looking down alone never pauses. Use the standard focus controls to reach every setting.</p><div class="settings-grid"><label>Working height<input id="workspace-height" type="range" min="0.55" max="1.65" step="0.05"></label><label>Distance<input id="workspace-distance" type="range" min="0.65" max="1.8" step="0.05"></label><label>Panel size<input id="workspace-scale" type="range" min="0.45" max="1.6" step="0.05"></label><label>Rotation<input id="workspace-yaw" type="range" min="-3.14159" max="3.14159" step="0.1"></label><label><input id="workspace-map" type="checkbox">Live floor map and next step</label><label>Floor guide size<input id="workspace-mapScale" type="range" min="0.6" max="1.8" step="0.1"></label><label>Floor guide height (seated reach)<input id="workspace-floorHeight" type="range" min="0.035" max="0.65" step="0.05"></label><label>Compact status<select id="workspace-hud"><option value="left">Left controller</option><option value="right">Right controller</option><option value="floor">Floor dock</option><option value="hidden">Hidden</option></select></label><label><input id="workspace-motion" type="checkbox">Animate the workspace</label><label><input id="workspace-guidedAim" type="checkbox">Guided third-person aim: steady horizontal sweep; hold fine aim for full elevation</label></div><button id="workspace-recall">Recall workspace here</button><button id="workspace-reset">Reset workspace placement</button><form method="dialog"><button id="workspace-back">Back</button></form>';
 document.body.append(dialog);
 function fill(){for(const k of ['height','distance','scale','yaw','hud','motion','guidedAim','map','mapScale','floorHeight']){const el=document.getElementById('workspace-'+k);if(el.type==='checkbox')el.checked=config[k];else el.value=config[k];}}
 for(const k of ['height','distance','scale','yaw','hud','motion','guidedAim','map','mapScale','floorHeight']){const el=document.getElementById('workspace-'+k);el.addEventListener(el.type==='range'?'input':'change',()=>{config[k]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;save();});}
 document.getElementById('workspace-recall').onclick=()=>{place(lastHead);onRecall?.(lastHead);};
 document.getElementById('workspace-reset').onclick=()=>{config=resetWorkspacePlacement(config);save();};
 for(const [target,id]of [['.start-actions','workspace-button'],['#pause-dialog','pause-workspace'],['#settings-dialog','settings-workspace']]){const parent=document.querySelector(target);if(!parent)continue;const b=document.createElement('button');b.id=id;b.textContent='Menu size / floor map / placement';b.onclick=()=>{fill();api.show('workspace-dialog');};parent.append(b);}
 fill();
 return {update,hit,press,recall:()=>place(lastHead),get config(){return {...config};},reset(){placement.reset();anchor=null;wasOpen=false;progress=0;root.visible=panel.visible=hud.visible=summon.visible=point.visible=false;active=false;},stats:()=>({active,panelDraws,open:wasOpen,progress,config:{...config},anchor:anchor?{...anchor}:null,panelRoomPosition:anchor?{x:anchor.x,y:lift.position.y,z:anchor.z}:null,panelScale:config.scale,panelRotation:[panel.rotation.x,root.rotation.y,0],hudDock,headLocked:false,attachedToWindow:false,visibleButtons:wasOpen?lastItems.length:0,interactiveButtons:wasOpen?lastItems.filter(i=>!i.disabled).length:0,summonVisible:summon.visible})};
}
