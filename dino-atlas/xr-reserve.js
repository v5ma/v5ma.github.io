import * as T from './vendor/three.module.js';
import {focusable} from './ranger-input.js?v=grounded1';
import {GROUNDED_BUILD} from './grounded-motion.js?v=grounded1';
import {EdgeGate,emptyMotion,trackedMotion,mergeMotion,readControls,saveControls} from './xr-actions.js?v=grounded1';
const labels={interact:'Interact',board:'Board / exit',reload:'Reload',water:'Water',zapper:'Zapper',nextTool:'Next tool',horn:'Horn',menu:'Menu / pause',map:'Map'};
const holdControls={Forward:{z:1,throttle:1},Reverse:{z:-1,throttle:-1},Left:{x:-1,steer:1},Right:{x:1,steer:-1},Fire:{fire:true,aim:true},Rise:{climb:1},Descend:{climb:-1},Jump:{jump:true},Brake:{brake:true}};
const $=id=>document.getElementById(id);
const visible=e=>!e.closest('[hidden]')&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
function wrap(text,width=68){const words=String(text).replace(/\s+/g,' ').trim().split(' '),lines=[];let line='';for(const w of words){if(line.length+w.length>width){lines.push(line);line='';}line+=(line?' ':'')+w;}if(line)lines.push(line);return lines;}
export class ReserveXR{
 constructor(ctx){
  this.ctx=ctx;this.active=false;this.pending=false;this.session=null;this.gate=new EdgeGate();this.sources=new Map();this.holds=new Map();this.consumed=new Set();this.page=0;this.rows=[];this.tiles=[];this.context=null;this.paintClock=0;this.snapHeld=false;this.invisible=false;this.aimRay=null;
  this.preferences=readControls(ctx.storage);ctx.input.quickTools=this.preferences.quickTools;
  this.originOffset=new T.Vector3();this.rig=new T.Group();ctx.scene.add(this.rig);this.rig.add(ctx.camera);
  ctx.renderer.xr.enabled=true;ctx.renderer.xr.setReferenceSpaceType('local-floor');
  this.raycaster=new T.Raycaster();this.rotation=new T.Matrix4();this.vector=new T.Vector3();this.quaternion=new T.Quaternion();
  this.canvas=document.createElement('canvas');this.canvas.width=1024;this.canvas.height=1024;this.paint=this.canvas.getContext('2d');
  this.texture=new T.CanvasTexture(this.canvas);this.texture.colorSpace=T.SRGBColorSpace;
  this.panel=new T.Mesh(new T.PlaneGeometry(1.45,1.45),new T.MeshBasicMaterial({map:this.texture,transparent:false,depthTest:false,toneMapped:false}));this.panel.renderOrder=10000;this.panel.visible=false;this.rig.add(this.panel);
  this.controllers=[0,1].map(i=>{
   const ray=ctx.renderer.xr.getController(i),grip=ctx.renderer.xr.getControllerGrip(i),hand=ctx.renderer.xr.getHand(i);this.rig.add(ray,grip,hand);
   const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0x9ff2db}));line.scale.z=3;ray.add(line);
   const shape=new T.Mesh(new T.BoxGeometry(.045,.08,.11),new T.MeshStandardMaterial({color:0x7cd9c4,roughness:.65}));grip.add(shape);
   const joints=new T.InstancedMesh(new T.SphereGeometry(.008,6,4),new T.MeshBasicMaterial({color:0xe6c9a4}),25);joints.frustumCulled=false;hand.add(joints);joints.visible=false;
   const entry={ray,grip,hand,joints,line,source:null,hit:null};
   ray.addEventListener('connected',e=>{entry.source=e.data;this.sources.set(e.data,entry);this.gate.neutral.add(e.data);});
   ray.addEventListener('disconnected',()=>{const s=entry.source;this.sources.delete(s);this.gate.remove(s);this.holds.delete(s);this.consumed.delete(s);entry.source=null;this.clear();if(this.active&&!ctx.modal())ctx.action('menu');});
   ray.addEventListener('selectstart',e=>this.selectStart(e.data||entry.source,entry));
   ray.addEventListener('selectend',e=>{const s=e.data||entry.source;this.holds.delete(s);this.consumed.delete(s);});
   return entry;
  });
  const settings=document.createElement('label');settings.innerHTML='<input id="quick-tools-toggle" type="checkbox"> Direct D-pad tools: left water, right zapper (RB still cycles)';$('menu-dialog').querySelector('.settings').append(settings);
  $('quick-tools-toggle').checked=this.preferences.quickTools;$('quick-tools-toggle').onchange=e=>{this.preferences.quickTools=e.target.checked;ctx.input.quickTools=e.target.checked;if(!saveControls(ctx.storage,this.preferences))ctx.notify('Control preference could not be saved in this browser.');};
  this.button=document.createElement('button');this.button.id='xr-enter';this.button.textContent='Enter VR / Quest controllers and hands';this.button.onclick=()=>this.enter();$('menu-dialog').querySelector('.menu-grid').append(this.button);
  const introButton=this.button.cloneNode(true);introButton.id='xr-intro';introButton.onclick=()=>this.enter();$('intro').querySelector('.intro-copy').append(introButton);
  this.status=document.createElement('p');this.status.id='xr-status';this.status.textContent='VR uses tracked controllers or hand-ray pinches. Physical Quest testing is pending.';$('menu-dialog').append(this.status);
  window.addEventListener('blur',()=>this.clear());document.addEventListener('visibilitychange',()=>{this.clear();if(this.active&&document.hidden&&!ctx.modal())ctx.action('menu');});
  this.checkSupport();
 }
 async checkSupport(){let supported=false;try{supported=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');}catch{}this.supported=supported;this.status.textContent=supported?'VR available. Select Enter VR in a headset. Smooth locomotion; 30-degree snap turns.':'Immersive VR is unavailable here. Desktop, touch and Xbox play remain available.';for(const id of ['xr-enter','xr-intro'])$(id).disabled=!supported;}
 async enter(){
  if(this.pending)return;if(this.active){try{await this.session.end();}catch{}return;}
  this.pending=true;let session=null;
  try{
   // Called directly by a user gesture. Hand tracking is optional, never required.
   session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','hand-tracking']});
   this.saved={position:this.ctx.camera.position.clone(),quaternion:this.ctx.camera.quaternion.clone()};this.session=session;
   session.addEventListener('end',()=>this.end(),{once:true});
   session.addEventListener('visibilitychange',()=>{this.invisible=session.visibilityState!=='visible';this.clear();if(this.invisible&&!this.ctx.modal())this.ctx.action('menu');});
   session.addEventListener('inputsourceschange',e=>{for(const source of e.removed||[]){this.holds.delete(source);this.consumed.delete(source);this.gate.remove(source);}this.clear();if(e.removed?.length&&!this.ctx.modal())this.ctx.action('menu');});
   this.originOffset.set(0,0,0);this.rig.rotation.y=this.ctx.yaw();this.ctx.camera.position.set(0,0,0);this.ctx.camera.quaternion.identity();
   await this.ctx.renderer.xr.setSession(session);if(this.session!==session)return;this.active=true;this.invisible=false;this.clear();this.context=null;this.position();
   this.button.textContent='Leave VR';this.status.textContent='VR active. Point and trigger or pinch to select. Right B opens menus. Release all inputs after closing a panel.';
  }catch(error){if(session)try{await session.end();}catch{}this.end();this.ctx.notify('VR could not start: '+(error?.message||'permission or device unavailable')+'. Desktop play is unchanged.');}
  finally{this.pending=false;}
 }
 end(){this.active=false;this.session=null;this.invisible=false;this.clear();this.panel.visible=false;this.originOffset.set(0,0,0);this.rig.position.set(0,0,0);this.rig.rotation.set(0,0,0);if(this.saved){this.ctx.camera.position.copy(this.saved.position);this.ctx.camera.quaternion.copy(this.saved.quaternion);this.saved=null;}this.button.textContent='Enter VR / Quest controllers and hands';this.ctx.restoreSize();}
 clear(){this.holds.clear();this.consumed.clear();this.gate.reset(this.session?.inputSources||[]);this.aimRay=null;this.ctx.input.clear();}
 position(){const p=this.ctx.fleet.position;this.rig.position.set(p.x,p.y+(this.ctx.fleet.mode==='foot'?-.9:.5),p.z).add(this.originOffset);this.rig.updateMatrixWorld(true);}
 snap(amount){const camera=this.ctx.renderer.xr.getCamera(),before=camera.getWorldPosition(new T.Vector3());this.rig.rotation.y+=amount;this.rig.updateMatrixWorld(true);const after=camera.getWorldPosition(new T.Vector3());this.originOffset.add(before.sub(after));this.position();this.paintClock=1;}
 rayFor(entry){if(!entry.ray.visible)return null;entry.ray.updateWorldMatrix(true,false);this.rotation.extractRotation(entry.ray.matrixWorld);return {origin:new T.Vector3().setFromMatrixPosition(entry.ray.matrixWorld),direction:new T.Vector3(0,0,-1).applyMatrix4(this.rotation).normalize()};}
 hit(entry){const ray=this.rayFor(entry);if(!ray||!this.panel.visible)return null;this.raycaster.set(ray.origin,ray.direction);const hit=this.raycaster.intersectObject(this.panel,false)[0];if(!hit?.uv)return null;const x=hit.uv.x*1024,y=(1-hit.uv.y)*1024;return this.tiles.find(t=>x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h)||null;}
 selectStart(source,entry){
  if(!this.active||this.invisible||!source)return;
  const tile=this.hit(entry);if(!tile)return;this.consumed.add(source);
  if(this.gate.neutral.has(source))return;
  if(tile.hold){this.holds.set(source,{tile,context:this.ctx.modal()});return;}
  tile.run?.();this.paintClock=1;
 }
 collect(root){
  if(!root)return [];
  const rows=[];
  for(const e of root.querySelectorAll('h1,h2,h3,p,button,a[href],input,select,canvas')){
   if(!visible(e)||e.closest('button')&&e.tagName!=='BUTTON')continue;
   if(e.matches('button,a[href],input,select')){
    if(e.disabled)continue;
    const label=(e.closest('label')?.textContent||e.textContent||e.getAttribute('aria-label')||e.id).replace(/\s+/g,' ').trim();
    const value=e.tagName==='SELECT'?e.options[e.selectedIndex]?.textContent:e.type==='checkbox'?(e.checked?'On':'Off'):e.type==='range'?e.value:'';
    rows.push({label:label+(value?' : '+value:''),element:e});
   }else if(e.tagName==='CANVAS'){while(rows.length%12)rows.push({spacer:true});rows.push({image:e});for(let i=0;i<8;i++)rows.push({spacer:true});}
   else for(const text of wrap(e.textContent))rows.push({text});
  }
  return rows;
 }
 changeElement(e,dir=1){e.focus({preventScroll:true});if(e.tagName==='SELECT'){e.selectedIndex=(e.selectedIndex+dir+e.options.length)%e.options.length;e.dispatchEvent(new Event('change',{bubbles:true}));}else if(e.type==='range'){dir>0?e.stepUp():e.stepDown();e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}else e.click();this.paintClock=1;}
 draw(root){
  const c=this.paint;this.tiles=[];c.fillStyle='#0c2523';c.fillRect(0,0,1024,1024);c.fillStyle='#ecf8ed';c.font='bold 32px sans-serif';c.fillText('DINO ATLAS / '+(root?'MENU':'FIELD CONTROLS'),32,44);
  const tile=(label,x,y,w,h,run,hold=null)=>{c.fillStyle='#24564d';c.fillRect(x,y,w,h);c.strokeStyle='#7dbca7';c.strokeRect(x,y,w,h);c.fillStyle='#f2f5df';c.font='23px sans-serif';wrap(label,Math.floor(w/13)).slice(0,2).forEach((line,i)=>c.fillText(line,x+12,y+29+i*27));this.tiles.push({label,x,y,w,h,run,hold});};
  if(root){
   this.rows=this.collect(root);const count=12,pages=Math.max(1,Math.ceil(this.rows.length/count));this.page=Math.max(0,Math.min(pages-1,this.page));
   const slice=this.rows.slice(this.page*count,(this.page+1)*count);let y=78;
   for(const row of slice){if(row.spacer)continue;if(row.image){try{c.drawImage(row.image,212,y,600,600);}catch{}y+=603;}else if(row.element){const e=row.element;if(e.tagName==='SELECT'||e.type==='range'){tile('-',32,y,62,60,()=>this.changeElement(e,-1));tile(row.label,104,y,786,60,()=>this.changeElement(e,1));tile('+',900,y,92,60,()=>this.changeElement(e,1));}else tile(row.label,32,y,960,60,()=>this.changeElement(e));y+=67;}else{c.font='22px sans-serif';c.fillStyle='#d8e8da';c.fillText(row.text,32,y+27);y+=40;}}
   tile('Previous',32,914,220,65,()=>{this.page--;this.paintClock=1;});tile('Page '+(this.page+1)+' / '+pages,268,914,224,65,()=>{this.page=(this.page+1)%pages;this.paintClock=1;});tile('Next',508,914,220,65,()=>{this.page++;this.paintClock=1;});tile('Back / B',744,914,248,65,()=>this.ctx.action('back'));
  }else{
   const objective=$('mission-title')?.textContent||'Patrol the reserve',detail=$('interact-label')?.textContent||'';
   c.font='22px sans-serif';c.fillText(objective.slice(0,75),32,80);c.fillText(detail.slice(0,75),32,110);c.fillText(this.ctx.fleet.mode.toUpperCase()+' / '+$('tool-name').textContent+' / '+$('ammo').textContent,32,140);
   const actions=Object.keys(labels).map(key=>({label:labels[key],run:()=>this.ctx.action(key)}));
   for(const [label,hold] of Object.entries(holdControls))actions.push({label:'Hold '+label,hold});
   actions.push({label:'Turn left',run:()=>this.snap(Math.PI/6)},{label:'Turn right',run:()=>this.snap(-Math.PI/6)},{label:'Leave VR',run:()=>this.enter()});
   actions.forEach((a,i)=>tile(a.label,32+(i%3)*326,170+Math.floor(i/3)*112,308,94,a.run,a.hold));
   c.font='19px sans-serif';c.fillStyle='#d8e8da';c.fillText('Point + pinch / trigger. Release or leave a tile to stop a held action.',32,995);
  }
  this.texture.needsUpdate=true;
 }
 update(dt){
  if(!this.active)return emptyMotion();this.position();const root=this.ctx.modal();
  if(root!==this.context){this.context=root;this.page=0;this.clear();this.paintClock=1;}
  const camera=this.ctx.renderer.xr.getCamera(),localHead=this.rig.worldToLocal(camera.getWorldPosition(new T.Vector3()));
  camera.getWorldQuaternion(this.quaternion);const facing=new T.Vector3(0,0,-1).applyQuaternion(this.quaternion);this.viewYaw=Math.atan2(-facing.x,-facing.z);
  // An upright, head-relative panel remains reachable without a DOM overlay.
  const localYaw=this.viewYaw-this.rig.rotation.y;this.panel.rotation.set(0,localYaw,0);this.panel.position.copy(localHead).add(new T.Vector3(-Math.sin(localYaw)*1.65,root?-.10:-.80,-Math.cos(localYaw)*1.65));this.panel.visible=true;this.panel.updateWorldMatrix(true,false);
  this.paintClock+=dt;if(this.paintClock>.18){this.paintClock=0;this.draw(root);}
  const sources=Array.from(this.session?.inputSources||[]);this.aimRay=null;let turn=0;
  for(const e of this.controllers){const s=e.source;if(!s)continue;e.hit=this.hit(e);e.line.scale.z=e.hit?1.7:3;e.line.visible=e.ray.visible;
   e.joints.visible=!!s.hand&&e.hand.visible;if(s.hand&&e.hand.joints){let i=0;for(const joint of Object.values(e.hand.joints)){if(i>=25)break;const matrix=joint.visible?new T.Matrix4().makeTranslation(joint.position.x,joint.position.y,joint.position.z):new T.Matrix4().makeScale(0,0,0);e.joints.setMatrixAt(i++,matrix);}e.joints.count=i;e.joints.instanceMatrix.needsUpdate=true;}
   if(!s.hand&&s.handedness==='right'&&!e.hit)this.aimRay=this.rayFor(e);
   const edges=this.gate.read(s);if(!s.hand){if(edges[5])this.ctx.action(s.handedness==='right'?(root?'back':'menu'):'board');if(edges[4]){if(s.handedness==='right'){if(root)this.ctx.input.activate();else this.ctx.action('interact');}else if(!root)this.ctx.action('reload');}
    const x=s.handedness==='right'?(s.gamepad?.axes?.[2]||0):0;if(Math.abs(x)>.65)turn=x;if(root&&edges[3]){this.page++;this.paintClock=1;}else if(!root&&s.handedness==='right'&&edges[3])this.ctx.action('nextTool');}
  }
  if(!root&&Math.abs(turn)>.65&&!this.snapHeld){this.snap(-Math.sign(turn)*Math.PI/6);this.snapHeld=true;}if(Math.abs(turn)<.25)this.snapHeld=false;
  const blocked=new Set([...this.consumed,...this.gate.neutral]);for(const e of this.controllers)if(e.source&&(e.hit||!e.ray.visible))blocked.add(e.source);
  if(root||this.invisible||document.hidden){this.holds.clear();this.aimRay=null;return emptyMotion();}
  let motion=trackedMotion(sources,this.ctx.fleet.mode,blocked);
  for(const [source,h] of this.holds){const e=this.sources.get(source);if(!e?.ray.visible||h.context!==root||!e.hit||e.hit.hold!==h.tile.hold){this.holds.delete(source);continue;}motion=mergeMotion(motion,h.tile.hold);if(h.tile.hold.fire)this.aimRay={origin:camera.getWorldPosition(new T.Vector3()),direction:facing.clone().normalize()};}
  return motion;
 }
 snapshot(){return {build:GROUNDED_BUILD,available:!!this.supported,active:this.active,quickTools:this.preferences.quickTools,controllers:[...this.sources.keys()].filter(s=>!s.hand).length,hands:[...this.sources.keys()].filter(s=>s.hand).length,held:this.holds.size,page:this.page,rows:this.rows.length,renderLoop:'renderer.setAnimationLoop',hardwareVerified:false};}
}
