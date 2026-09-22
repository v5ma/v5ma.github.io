import {FieldFeedback} from './field-feedback.js?v=clarity1';
import * as T from './vendor/three.module.js';

export const SPATIAL_BUILD='ranger-field-clarity-20260921.1';
// A layout class must never override the browser's closed-dialog hiding.
export const WORKSPACE_VISIBILITY_CSS='#spatial-console-settings:not([open]){display:none!important}';
export const SPATIAL_KEY='dino-atlas.spatial-console.v1';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const finite=(v,f,a,b)=>typeof v==='number'&&Number.isFinite(v)?clamp(v,a,b):f;
export function consoleSettings(v={}){
 return {version:1,height:finite(v?.height,1.15,.55,1.8),distance:finite(v?.distance,1.25,.8,2.2),scale:finite(v?.scale,.8,.55,1.8),rotation:finite(v?.rotation,0,-60,60),wrist:v?.wrist!==false};
}
export function readConsole(storage){try{return consoleSettings(JSON.parse(storage?.getItem(SPATIAL_KEY)||'null'));}catch{return consoleSettings();}}
export function saveConsole(storage,v){try{storage?.setItem(SPATIAL_KEY,JSON.stringify(consoleSettings(v)));return !!storage;}catch{return false;}}
// Capture one reference-space pose. Looking around NEVER updates this transform.
export function summonPose(head,yaw,options={}){
 const cfg=consoleSettings(options),distance=cfg.distance;
 return {x:head.x-Math.sin(yaw)*distance,y:cfg.height,z:head.z-Math.cos(yaw)*distance,yaw};
}
// All console surfaces share the late transparent pass so world labels cannot
// render over an otherwise opaque menu after the main opaque pass has finished.
export const consoleMaterial=options=>new T.MeshBasicMaterial({...options,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
// Invisible ancestors do not participate in picking, even when a mesh was
// reparented to a tracked grip. Blank visible pixels still own their input.
export function surfaceVisible(mesh){for(let p=mesh;p;p=p.parent)if(!p.visible)return false;return !!mesh;}
export const UI_BACKGROUND=Object.freeze({label:'',occludesUI:true});
export function flightHint(active=true){return active?'right stick up/down: altitude':'RT/LT: altitude / left grip: aim';}
const text=id=>document.getElementById(id)?.textContent?.replace(/\s+/g,' ').trim()||'';
function makeSurface(w,h,width,height){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const material=consoleMaterial({map:texture});
 const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);mesh.renderOrder=10030;
 return {canvas,texture,mesh,paint:canvas.getContext('2d')};
}
function lines(c,value,x,y,width,step,max=2){
 let line='',row=0;for(const word of String(value).split(/\s+/)){
  if(c.measureText(line+word).width>width&&line){c.fillText(line,x,y+row*step);row++;line='';if(row>=max)return;}
  line+=word+' ';
 }if(row<max)c.fillText(line,x,y+row*step);
}

export class SpatialConsole{
 constructor(xr){
  this.xr=xr;this.cfg=readConsole(xr.ctx.storage);this.trayOpen=false;this.placed=false;this.expanded=false;this.clock=0;this.progress=0;this.lastRoot=null;this.lastSession=null;this.pose=null;this.feedbackKey='';
  xr.panel.material.transparent=true;xr.panel.material.depthWrite=false;xr.panel.material.needsUpdate=true;
  this.root=new T.Group();this.root.name='Personal spatial console / not miniature world';xr.rig.add(this.root);
  this.rotunda=new T.Mesh(new T.CylinderGeometry(.36,.40,.035,32),consoleMaterial({color:0x294f48,opacity:.8}));this.rotunda.renderOrder=9998;this.root.add(this.rotunda);
  this.column=new T.Mesh(new T.CylinderGeometry(.026,.10,1,12),consoleMaterial({color:0xc2b37a,opacity:.7}));this.column.renderOrder=9997;this.root.add(this.column);
  this.dock=makeSurface(512,192,.48,.18);this.dock.mesh.name='Floor menu dock';this.dock.mesh.rotation.x=-Math.PI/2;this.root.add(this.dock.mesh);
  this.rail=makeSurface(1200,140,1.45,.17);this.rail.mesh.name='Workspace direct tabs';xr.panel.add(this.rail.mesh);this.rail.mesh.position.set(0,.82,.025);
  this.wrist=makeSurface(768,384,.40,.20);this.wrist.mesh.name='Compact wrist status and menu access';this.root.add(this.wrist.mesh);
  this.buttonPool=[];this.box=new T.BoxGeometry(1,1,1);this.capMaterial=consoleMaterial({map:xr.texture});
  this.pointerMaterial=consoleMaterial({color:0xffefab});
  this.dots=xr.controllers.map(e=>{const dot=new T.Mesh(new T.SphereGeometry(.009,8,6),this.pointerMaterial);dot.renderOrder=10100;dot.visible=false;e.ray.add(dot);return dot;});
  this.shortcuts=[{label:'Menu',run:()=>this.menu()},{label:'Field controls',run:()=>this.field()}];
  this.tabs=[{label:'Resume',run:()=>this.resume()},{label:'Map',run:()=>xr.ctx.action('map')},{label:'Missions',run:()=>document.getElementById('menu-field-contracts').click()},{label:'Field',run:()=>{this.resume();this.field();}},{label:'Workspace',run:()=>this.workspace()},{label:'Leave XR',run:()=>xr.enter()}];
  this.installSettings();this.feedback=new FieldFeedback(this);this.paintRail();this.paintDock();this.root.visible=false;this.wrist.mesh.visible=false;
 }
 installSettings(){
  const visibility=document.createElement('style');visibility.textContent=WORKSPACE_VISIBILITY_CSS;document.head.append(visibility);
  const settings=document.createElement('dialog');settings.className='settings';settings.style.cssText='max-height:85vh;overflow:auto;background:#183c35;color:#fff1d1;border:2px solid #d4bc7e;padding:24px';settings.id='spatial-console-settings';
  settings.innerHTML='<h3>Spatial workspace</h3><p>B opens or closes the menu. Point and pinch at the floor dock or wrist to open it without controllers. The workspace stays where summoned, not on your head.</p><button id="spatial-field">Open field controls / hand movement</button><button id="spatial-place">Bring workspace here</button><label>Workspace height <input id="spatial-height" type="range" min="0.55" max="1.8" step="0.05"></label><label>Workspace distance <input id="spatial-distance" type="range" min="0.8" max="2.2" step="0.1"></label><label>Workspace size <input id="spatial-scale" type="range" min="0.55" max="1.8" step="0.05"></label><label>Workspace rotation <input id="spatial-rotation" type="range" min="-60" max="60" step="15"></label><label><input id="spatial-wrist" type="checkbox"> Compact wrist status</label><button id="spatial-reset">Reset workspace for seated / standing view</button>';
  const menu=document.getElementById('menu-dialog');document.body.append(settings);const button=document.createElement('button');button.id='spatial-workspace-button';button.textContent='Spatial workspace / height and size';button.onclick=()=>this.workspace();menu.querySelector('[data-close]').after(button);settings.addEventListener('cancel',e=>{e.preventDefault();this.xr.ctx.action('back');});const back=document.createElement('button');back.textContent='Resume game';back.onclick=()=>this.resume();settings.append(back);
  for(const key of ['height','distance','scale','rotation','wrist']){
   const e=document.getElementById('spatial-'+key);if(key==='wrist')e.checked=this.cfg[key];else e.value=this.cfg[key];
   const update=()=>{this.cfg=consoleSettings({...this.cfg,[key]:key==='wrist'?e.checked:Number(e.value)});this.persist();if(key==='distance')this.summon();this.positionPanel();};
   e.addEventListener(key==='wrist'?'change':'input',update);
  }
  document.getElementById('spatial-field').onclick=()=>{this.resume();this.field();};
  document.getElementById('spatial-place').onclick=()=>this.summon();
  document.getElementById('spatial-reset').onclick=()=>{const h=this.head();this.cfg=consoleSettings({height:clamp(h.y-.35,.65,1.5)});this.persist();for(const k of ['height','distance','scale','rotation'])document.getElementById('spatial-'+k).value=this.cfg[k];document.getElementById('spatial-wrist').checked=true;this.summon();};
 }
 // A direct Resume is not a one-level Back: Classic can return to its parent menu.
 resume(){for(let n=0;n<6&&this.xr.ctx.modal()?.tagName==='DIALOG';n++)this.xr.ctx.action('back');this.hideField();}
 workspace(){for(const d of document.querySelectorAll('dialog[open]'))d.close();const d=document.getElementById('spatial-console-settings');d.showModal();this.xr.clear();d.querySelector('button').focus({preventScroll:true});}
 paintRail(){const c=this.rail.paint;c.fillStyle='#172f2b';c.fillRect(0,0,1200,140);c.textAlign='center';c.font='bold 28px sans-serif';this.tabs.forEach((t,i)=>{const hot=this.xr.controllers.some(e=>e.hit===t&&e.ray.visible);c.fillStyle=hot?'#d8bc79':'#32584a';c.fillRect(i*200+6,6,188,128);c.fillStyle=hot?'#102d29':'#ffe1a2';c.fillText(t.label,i*200+100,84);});this.rail.texture.needsUpdate=true;}
 persist(){if(!saveConsole(this.xr.ctx.storage,this.cfg))this.xr.ctx.notify('Workspace preference could not be saved. Game progress is unchanged.');}
 head(){const p=this.xr.headCamera().getWorldPosition(new T.Vector3());return this.xr.rig.worldToLocal(p);}
 summon(){
  const head=this.head(),q=this.xr.ctx.camera.quaternion,d=new T.Vector3(0,0,-1).applyQuaternion(q);d.y=0;if(d.lengthSq()<.01)d.set(0,0,-1);d.normalize();
  const yaw=Math.atan2(-d.x,-d.z);this.pose=summonPose(head,yaw,this.cfg);this.placed=true;
  this.dock.mesh.position.set(head.x+d.x*.46,.04,head.z+d.z*.46);this.dock.mesh.rotation.set(-Math.PI/2,0,-yaw);
  this.positionPanel();this.feedback?.place();
 }
 menu(){if(!this.xr.active)return;this.trayOpen=false;if(!this.xr.ctx.modal())this.xr.ctx.action('menu');this.summon();}
 field(){if(!this.xr.active)return;this.trayOpen=true;this.xr.clear();this.summon();this.xr.paintClock=1;this.positionPanel();}
 hideField(){this.trayOpen=false;this.expanded=!!this.xr.ctx.modal();this.xr.clear();this.positionPanel();this.placeWrist();this.dots.forEach(d=>d.visible=false);}
 end(){this.feedback?.end();this.trayOpen=false;this.placed=false;this.expanded=false;this.pose=null;this.progress=0;this.root.visible=false;this.wrist.mesh.visible=false;this.xr.panel.visible=false;this.dots.forEach(d=>d.visible=false);}
 update(dt,root){
  if(!this.xr.active){this.end();return;}
  if(this.lastSession!==this.xr.session){this.end();this.lastSession=this.xr.session;this.summon();}
  if(root&&root!==this.lastRoot){this.trayOpen=false;if(!this.expanded)this.summon();}
  this.lastRoot=root;
  const wants=!!root||this.trayOpen;
  if(wants&&!this.expanded)this.summon();this.expanded=wants;
  // Motion is visual only; ray tests use the exact current rendered pose.
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  this.progress=reduced?Number(wants):this.progress+(Number(wants)-this.progress)*(1-Math.exp(-Math.min(.1,dt)*22));
  this.root.visible=!this.xr.invisible;this.positionPanel();this.placeWrist();this.feedback?.update(dt,root);
  this.clock+=dt;if(this.clock>.16){this.clock=0;this.paintStatus();}
 }
 positionPanel(){
  if(!this.pose)return;const x=this.xr,p=this.pose,open=x.active&&!x.invisible&&(!!x.ctx.modal()||this.trayOpen);
  x.panel.visible=open;x.panel.scale.setScalar(this.cfg.scale);
  x.panel.position.set(p.x,open?this.cfg.height-.16*(1-this.progress):.04,p.z);
  x.panel.rotation.set(-.10,p.yaw+(this.cfg.rotation||0)*Math.PI/180,0,'YXZ');x.panel.updateWorldMatrix(true,false);
  this.rotunda.position.set(p.x,.025+this.progress*Math.max(0,this.cfg.height-.75*this.cfg.scale-.08),p.z);
  const h=Math.max(.01,this.rotunda.position.y);this.column.position.set(p.x,h/2,p.z);this.column.scale.y=h;this.column.visible=open;
  this.dock.mesh.visible=x.active&&!x.invisible&&!open;
 }
 placeWrist(){
  const x=this.xr,entries=x.controllers.filter(e=>e.source&&e.ray.visible),entry=entries.find(e=>e.source.handedness==='left')||entries[0];
  let parent=null;if(entry){if(entry.source.hand)parent=entry.hand.joints?.wrist?.visible?entry.hand.joints.wrist:null;else if(entry.grip.visible)parent=entry.grip;}
  const mesh=this.wrist.mesh;
  if(parent){if(mesh.parent!==parent)parent.add(mesh);mesh.position.set(.08,.10,.025);mesh.rotation.set(-.75,0,0);mesh.scale.setScalar(1);}
  else{if(mesh.parent!==this.root)this.root.add(mesh);mesh.position.copy(this.dock.mesh.position);mesh.position.y=.045;mesh.rotation.copy(this.dock.mesh.rotation);mesh.scale.setScalar(1.3);}
  mesh.visible=x.active&&!x.invisible&&!this.expanded&&this.cfg.wrist;mesh.updateWorldMatrix(true,false);
  // With no tracked wrist the floor slate itself supplies both menu actions.
  if(mesh.visible&&!parent)this.dock.mesh.visible=false;
 }
 paintDock(){const c=this.dock.paint;c.fillStyle='#173c35';c.fillRect(0,0,512,192);c.strokeStyle='#edcf86';c.lineWidth=8;c.strokeRect(4,4,504,184);c.font='bold 33px sans-serif';c.textAlign='center';for(let i=0;i<2;i++){const hot=this.xr.controllers.some(e=>e.hit===this.shortcuts[i]&&e.ray.visible);if(hot){c.fillStyle='#d8bc79';c.fillRect(10+i*256,10,236,172);}c.fillStyle=hot?'#102d29':'#fff2ca';c.fillText(i?'FIELD':'MENU',128+i*256,107);}this.dock.texture.needsUpdate=true;}
 paintStatus(){
  const x=this.xr,f=x.ctx.fleet,c=this.wrist.paint;c.fillStyle='#102d29';c.fillRect(0,0,768,384);c.strokeStyle='#d4bc7e';c.lineWidth=7;c.strokeRect(3,3,762,378);c.textAlign='left';c.fillStyle='#ffedb6';c.font='bold 34px sans-serif';
  const vehicle=f.current?.name||f.mode;lines(c,vehicle+' / '+(f.mode==='foot'?'Y: board':'Y: exit when stopped'),22,48,720,38,1);
  c.fillStyle='#dcf2e4';c.font='29px sans-serif';lines(c,text('tool-name')+' / '+text('ammo'),22,92,720,32,1);
  const status=f.mode==='helicopter'?Math.round(f.position.y)+' m / '+flightHint(x.travel?.activeLayout!==false):Math.round(Math.abs(f.actor.speed||0)*3.6)+' km/h / '+(x.travel?.activeLayout?'LS: move / LT: aim / RT: tool':'Legacy controls / field for help');
  lines(c,status,22,130,720,32,1);lines(c,text('goal-compass')||text('mission-title'),22,170,720,32,2);
  c.fillStyle='#f4d48c';c.font='bold 26px sans-serif';lines(c,text('interact-label')||(x.travel?.activeLayout?'Grip: interact / B: menu':'A: interact / B: menu'),22,242,720,30,1);
  c.textAlign='center';c.font='bold 32px sans-serif';for(let i=0;i<2;i++){const hot=x.controllers.some(e=>e.hit===this.shortcuts[i]&&e.ray.visible);c.fillStyle=hot?'#d8bc79':'#355e50';c.fillRect(12+i*378,280,366,92);c.fillStyle=hot?'#102d29':'#fff2cd';c.fillText(i?'FIELD CONTROLS':'MENU / B',194+i*379,339);}this.wrist.texture.needsUpdate=true;
 }
 hit(entry){
  const x=this.xr,ray=x.rayFor(entry);entry.uiDistance=null;
  if(!ray||!x.active||x.invisible)return null;
  x.raycaster.set(ray.origin,ray.direction);const candidates=[];
  // Choose the nearest visible personal surface, then classify the exact pixel.
  // Nonbutton areas absorb a trigger/pinch but have no action or hold behavior.
  for(const [kind,mesh] of [['rail',this.rail.mesh],['panel',x.panel],['wrist',this.wrist.mesh],['dock',this.dock.mesh],...(this.feedback?.surfaces()||[])]){
   if(!surfaceVisible(mesh))continue;mesh.updateWorldMatrix(true,false);
   const h=x.raycaster.intersectObject(mesh,false)[0];if(h?.uv)candidates.push({kind,...h});
  }
  candidates.sort((a,b)=>a.distance-b.distance);const h=candidates[0];if(!h)return null;entry.uiDistance=h.distance;
  if(h.kind==='floor-guide')return this.feedback.pick(h.uv)||UI_BACKGROUND;
  if(h.kind==='floor-notice')return UI_BACKGROUND;
  if(h.kind==='rail')return this.tabs[Math.min(5,Math.floor(h.uv.x*6))]||UI_BACKGROUND;
  if(h.kind==='dock'||h.kind==='wrist'&&h.uv.y<.27)return this.shortcuts[h.uv.x<.5?0:1];
  if(h.kind==='panel'){
   const u=h.uv.x*1024,v=(1-h.uv.y)*1024;
   return x.tiles.find(t=>u>=t.x&&u<=t.x+t.w&&v>=t.y&&v<=t.y+t.h)||UI_BACKGROUND;
  }
  return UI_BACKGROUND;
 }
 decorate(){
  const x=this.xr;let i=0;for(const tile of x.tiles){
   let b=this.buttonPool[i];if(!b){const group=new T.Group(),material=consoleMaterial({color:0x749c85}),base=new T.Mesh(this.box,material),cap=new T.Mesh(new T.PlaneGeometry(1,1),this.capMaterial);base.renderOrder=10010;cap.renderOrder=10011;group.add(base,cap);x.panel.add(group);b={group,base,cap};this.buttonPool.push(b);}
   const {x:tx,y:ty,w,h}=tile,bw=w/1024*1.45,bh=h/1024*1.45;b.tile=tile;b.group.visible=true;b.group.position.set(((tx+w/2)/1024-.5)*1.45,(.5-(ty+h/2)/1024)*1.45,.008);b.base.scale.set(bw,bh,.017);b.cap.position.z=.011;b.cap.scale.set(bw-.008,bh-.008,1);
   const u=b.cap.geometry.attributes.uv;u.setXY(0,tx/1024,1-ty/1024);u.setXY(1,(tx+w)/1024,1-ty/1024);u.setXY(2,tx/1024,1-(ty+h)/1024);u.setXY(3,(tx+w)/1024,1-(ty+h)/1024);u.needsUpdate=true;i++;
  }
  for(;i<this.buttonPool.length;i++)this.buttonPool[i].group.visible=false;
 }
 afterInput(){
  const x=this.xr;for(const b of this.buttonPool){
   // Several settings have identical '+'/'-' labels; identity is the hit target.
   const hot=x.panel.visible&&x.controllers.some(e=>e.hit===b.tile&&e.ray.visible);
   b.base.material.color.setHex(hot?0xffd784:0x749c85);b.group.position.z=hot?.019:.008;
  }
  const key=x.controllers.map(e=>e.ray.visible?`${this.tabs?.indexOf(e.hit)}:${this.shortcuts?.indexOf(e.hit)}`:'-').join('|');
  if(key!==this.feedbackKey){this.feedbackKey=key;if(this.tabs?.length)this.paintRail();if(this.wrist?.paint)this.paintStatus();if(this.dock?.paint)this.paintDock();}
  x.controllers.forEach((e,i)=>{const d=this.dots[i];d.visible=!!e.hit&&!!e.ray.visible&&!x.invisible;if(d.visible){d.position.set(0,0,-Math.max(.01,e.uiDistance||1));d.scale.setScalar(e.hit.occludesUI?.6:1);}});
 }
 snapshot(){return {feedback:this.feedback?.snapshot(),build:SPATIAL_BUILD,expanded:this.expanded,fieldOpen:this.trayOpen,settings:{...this.cfg},pose:this.pose?{...this.pose}:null,panelVisible:this.xr.panel.visible,headLocked:false,physicalHardwareVerified:false};}
}
