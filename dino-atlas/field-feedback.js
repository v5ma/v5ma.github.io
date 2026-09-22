import {controlCard,guidanceContext} from './ranger-guidance.js?v=clarity2';
export {controlCard} from './ranger-guidance.js?v=clarity2';
import * as T from './vendor/three.module.js';

// Personal, floor-relative information. Never change game progress or the camera.
export const FEEDBACK_BUILD='ranger-field-clarity-20260922.1';
export const FEEDBACK_KEY='dino-atlas.field-feedback.v1';
export const MESSAGE_SECONDS=2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finite=(v,f,a,b)=>Number.isFinite(v)?clamp(v,a,b):f;
const text=id=>document.getElementById(id)?.textContent?.replace(/\s+/g,' ').trim()||'';
export function feedbackSettings(raw){return {version:1,scale:finite(raw?.scale,1,.65,1.6),height:finite(raw?.height,.05,.03,.8),visible:raw?.visible!==false};}
export function messageOpacity(age){return !Number.isFinite(age)||age<0||age>=MESSAGE_SECONDS?0:Math.min(1,(MESSAGE_SECONDS-age)/.4);}
export function focusedPage(rows,element,current=0){const index=rows.findIndex(row=>row.element===element);return index<0?current:Math.floor(index/12);}
export class MessageTrail{
 constructor(){this.current=null;this.history=[];this.serial=0;}
 push(value,now){const message=String(value||'').trim();if(!message||!Number.isFinite(now))return;this.current={text:message,at:now,id:++this.serial};this.history.unshift({...this.current});this.history.length=Math.min(12,this.history.length);}
 opacity(now){return this.current?messageOpacity(now-this.current.at):0;}
}
function surface(width,height,w,h){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);mesh.renderOrder=10050;mesh.frustumCulled=false;
 return {canvas,texture,mesh,c:canvas.getContext('2d')};
}
function lines(c,value,x,y,width,step,count=2){
 let line='',row=0;for(const word of String(value||'').split(/\s+/)){const next=line?line+' '+word:word;if(c.measureText(next).width>width&&line){c.fillText(line,x,y+row*step);if(++row>=count)return;line=word;}else line=next;}if(row<count)c.fillText(line,x,y+row*step);
}
export class FieldFeedback{
 constructor(console){
  this.console=console;this.xr=console.xr;this.trail=new MessageTrail();this.clock=0;this.session=null;this.mapFrames=0;this.lastNotice=0;this.timers=new Map();
  try{this.cfg=feedbackSettings(JSON.parse(this.xr.ctx.storage?.getItem(FEEDBACK_KEY)||'null'));}catch{this.cfg=feedbackSettings();}
  this.root=new T.Group();this.root.name='Floor field guide / outside game portal';this.xr.rig.add(this.root);this.root.visible=false;
  this.guide=surface(1.65,.825,1536,768);this.guide.mesh.name='Live map and interaction floor guide';this.guide.mesh.rotation.x=-Math.PI/2;this.root.add(this.guide.mesh);
  this.notice=surface(1.55,.24,1536,240);this.notice.mesh.name='Two-second floor messages';this.notice.mesh.rotation.x=-Math.PI/2;this.notice.mesh.renderOrder=10060;this.root.add(this.notice.mesh);this.notice.mesh.visible=false;
  this.buttons=[{label:'Map',run:()=>this.xr.ctx.action('map')},{label:'What to do / controls',run:()=>this.help()},{label:'Menu / sizes',run:()=>this.console.workspace()}];
  this.install();this.watchMessages();
  // Standard controller focus and the spatial page must identify the same control.
  document.addEventListener('focusin',event=>{const x=this.xr,root=x.ctx.modal();if(!x.active||!root?.contains(event.target))return;x.page=focusedPage(x.collect(root),event.target,x.page);x.paintClock=1;});
 }
 now(){return performance.now()/1000;}
 save(){try{this.xr.ctx.storage?.setItem(FEEDBACK_KEY,JSON.stringify(this.cfg));}catch{this.xr.ctx.notify('Floor display settings could not be saved. Progress is unchanged.');}}
 install(){
  const c=this.console,menu=document.getElementById('menu-dialog'),workspace=document.getElementById('spatial-console-settings');
  const quick=document.createElement('div');quick.id='field-size-controls';
  const title=document.createElement('h3');title.textContent='Menu and diorama sizes';quick.append(title);
  this.sizeReadout=document.createElement('p');this.sizeReadout.id='field-size-readout';quick.append(this.sizeReadout);
  const resizeMenu=step=>{const e=document.getElementById('spatial-scale');e.value=clamp(Number(e.value)+step,.55,1.8);e.dispatchEvent(new Event('input',{bubbles:true}));this.xr.clear();this.syncSizes();};
  const resizeBox=factor=>{const p=this.xr.presentation;if(!p)return;this.xr.setDisplaySize({width:p.width*factor,height:p.height*factor});this.xr.clear();};
  const height=step=>{if(this.xr.presentation){this.xr.setDisplaySize({height:this.xr.presentation.height+step});this.xr.clear();}};
  for(const [id,label,run] of [['menu-smaller','Menu smaller',()=>resizeMenu(-.15)],['menu-larger','Menu larger',()=>resizeMenu(.15)],['box-smaller','Diorama smaller',()=>resizeBox(.8)],['box-larger','Diorama larger',()=>resizeBox(1.25)],['box-shorter','Box shorter',()=>height(-.3)],['box-taller','Box taller',()=>height(.3)]]){const b=document.createElement('button');b.id='field-'+id;b.textContent=label;b.onclick=run;quick.append(b);}
  workspace.prepend(quick);
  const floor=document.createElement('div');floor.innerHTML='<h3>Floor map and messages</h3><label>Floor guide size <input id="field-guide-scale" type="range" min="0.65" max="1.6" step="0.05"></label><label>Raise floor guide for seated play <input id="field-guide-height" type="range" min="0.03" max="0.8" step="0.05"></label><label><input id="field-guide-visible" type="checkbox"> Show live floor map and interaction help</label><button id="field-guide-place">Bring floor guide here</button><button id="field-guide-help">What do I do? / Controls and recent messages</button>';
  workspace.append(floor);
  for(const key of ['scale','height','visible']){const e=document.getElementById('field-guide-'+key);if(key==='visible')e.checked=this.cfg.visible;else e.value=this.cfg[key];e.addEventListener(key==='visible'?'change':'input',()=>{this.cfg=feedbackSettings({...this.cfg,[key]:key==='visible'?e.checked:Number(e.value)});this.save();this.place();});}
  document.getElementById('field-guide-place').onclick=()=>this.place();document.getElementById('field-guide-help').onclick=()=>this.help();
  const help=document.createElement('dialog');help.id='field-help-dialog';help.style.cssText='background:#173c35;color:#fff4d1;max-width:760px;width:88vw;max-height:85vh;overflow:auto;border:2px solid #edce86;padding:24px';
  for(const [tag,id,value] of [['h2','','What to do now'],['p','field-help-goal',''],['p','field-help-step',''],['p','field-help-interact',''],['h3','','Current controls'],['p','field-help-move',''],['p','field-help-tools',''],['p','field-help-buttons','']]){const e=document.createElement(tag);if(id)e.id=id;e.textContent=value;help.append(e);}
  const instructions=document.createElement('p');instructions.textContent='Move the ranger or vehicle to the gold goal. Stop beside the object and read HERE. Use the shown button; tools are not the same as interacting. Water/Pulse use ammunition. Scan/Recovery require an appropriate vehicle, a clear aim and a steady hold. The map shows a destination, not permission to walk through walls or water.';help.append(instructions);
  for(const [label,run] of [['Open map',()=>this.xr.ctx.action('map')],['Choose a field assignment',()=>this.xr.ctx.action('fieldContracts')],['Sizes and placement',()=>c.workspace()],['Resume game',()=>c.resume()]]){const b=document.createElement('button');b.textContent=label;b.onclick=run;help.append(b);}
  const h=document.createElement('h3');h.textContent='Recent messages';help.append(h);this.history=document.createElement('div');help.append(this.history);help.addEventListener('cancel',e=>{e.preventDefault();this.xr.ctx.action('back');});document.body.append(help);
  const button=document.createElement('button');button.id='field-help-button';button.textContent='What do I do? / Controls';button.onclick=()=>this.help();(menu.querySelector('[data-close]')||menu.firstElementChild).after(button);
 }
 syncSizes(){if(this.sizeReadout)this.sizeReadout.textContent=`Menu: ${Math.round(this.console.cfg.scale*100)}%. Box: ${(this.xr.presentation?.width||2.4).toFixed(1)} m wide / ${(this.xr.presentation?.height||2).toFixed(1)} m tall. Menu size and box size are independent.`;}
 watchMessages(){
  this.observers=[];for(const id of ['toast','radio-text']){const node=document.getElementById(id);if(!node)continue;const owner=id==='toast'?node:document.getElementById('radio');
   const observer=new MutationObserver(()=>{const value=node.textContent?.trim();if(!value)return;this.trail.push(value,this.now());clearTimeout(this.timers.get(id));this.timers.set(id,setTimeout(()=>owner?.classList.remove('show'),MESSAGE_SECONDS*1000));});
   observer.observe(node,{childList:true,subtree:true,characterData:true});this.observers.push(observer);
  }
 }
 card(){return controlCard(guidanceContext(this.xr.ctx));}
 data(){
  const card=this.card(),nav=this.xr.travel.navigation,goal=nav?.goal;
  const raw=text('interact-label').replace(/\s*\/\s*A(?:\s*\/\s*E)?\s*$/,''),button=document.getElementById('interact-button'),ready=!!button&&!button.disabled;
  return {goal:goal?.name||goal?.title||text('mission-title')||'Explore the reserve',step:goal?.detail||goal?.hint||text('mission-copy')||'Choose a field assignment from the menu.',bearing:text('goal-compass'),prompt:ready?card.interact+': '+raw:(raw&&!/^Explore/.test(raw)?raw:'Move closer to an object; stop when its action appears.'),card,tool:text('tool-name')+' / '+text('ammo'),utility:text('field-utility-status')};
 }
 help(){
  const d=this.data();for(const [id,value] of [['goal',d.goal],['step',d.step],['interact','HERE: '+d.prompt],['move',d.card.move],['tools',d.card.tools],['buttons',d.card.buttons]])document.getElementById('field-help-'+id).textContent=value;
  this.history.replaceChildren();for(const m of this.trail.history){const p=document.createElement('p');p.textContent=m.text;this.history.append(p);}
  if(!this.trail.history.length){const p=document.createElement('p');p.textContent='New interaction and radio messages will be kept here after fading from the floor.';this.history.append(p);}
  for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();const dialog=document.getElementById('field-help-dialog');dialog.showModal();this.xr.clear();dialog.querySelector('button').focus({preventScroll:true});
 }
 place(){
  const x=this.xr;if(!x.active)return;
  const head=this.console.head(),forward=new T.Vector3(0,0,-1).applyQuaternion(x.ctx.camera.quaternion);forward.y=0;if(forward.lengthSq()<.01)forward.set(0,0,-1);forward.normalize();
  // A captured horizontal reference pose: head pitch/yaw afterwards cannot drag it.
  this.root.position.set(head.x,this.cfg.height,head.z);this.root.rotation.set(0,Math.atan2(-forward.x,-forward.z),0);this.root.scale.setScalar(this.cfg.scale);
  this.guide.mesh.position.set(0,0,-1.05);this.notice.mesh.position.set(0,.008,-.43);this.root.updateMatrixWorld(true);
 }
 end(){this.root.visible=false;this.notice.mesh.visible=false;this.session=null;}
 update(dt){
  const x=this.xr;if(!x.active){this.end();return;}if(this.session!==x.session){this.session=x.session;this.place();this.clock=1;}
  this.root.visible=!x.invisible&&!document.hidden;
  this.guide.mesh.visible=this.cfg.visible&&!this.console.expanded;
  const now=this.now(),opacity=this.trail.opacity(now);this.notice.mesh.visible=opacity>0;this.notice.mesh.material.opacity=opacity;
  if(opacity>0&&this.trail.current.id!==this.lastNotice){this.lastNotice=this.trail.current.id;const c=this.notice.c;c.fillStyle='#102d29';c.fillRect(0,0,1536,240);c.strokeStyle='#ffe1a2';c.lineWidth=7;c.strokeRect(4,4,1528,232);c.fillStyle='#fff7df';c.textAlign='left';c.font='bold 43px sans-serif';lines(c,this.trail.current.text,25,58,1480,53,3);this.notice.texture.needsUpdate=true;}
  this.clock+=Math.min(.1,dt);if(this.clock>=.2){this.clock=0;this.syncSizes();if(this.guide.mesh.visible)this.paint();}
 }
 paint(){
  const c=this.guide.c,d=this.data();c.fillStyle='#102d29';c.fillRect(0,0,1536,768);c.strokeStyle='#e6cb87';c.lineWidth=6;c.strokeRect(3,3,1530,762);c.textAlign='left';c.fillStyle='#ffe1a2';c.font='bold 30px sans-serif';c.fillText('LIVE MAP',22,44);c.font='bold 22px sans-serif';c.fillText('WHITE: YOU / GOLD: GOAL',22,481,444);
  const map=this.xr.travel.navigation?.liveMap||document.getElementById('minimap');
  if(map?.width){const factor=Math.min(444/map.width,380/map.height),w=map.width*factor,h=map.height*factor;c.drawImage(map,22+(444-w)/2,72+(380-h)/2,w,h);this.mapFrames++;}else{c.fillStyle='#fff4d1';c.font='28px sans-serif';lines(c,'Map initializing. You can still open Map from the menu.',30,130,420,34,3);}
  c.fillStyle='#fff3c8';c.font='bold 36px sans-serif';lines(c,d.goal,495,56,1015,43,2);
  c.font='29px sans-serif';c.fillStyle='#dff0e7';lines(c,d.step,495,155,1015,36,3);
  c.font='bold 27px sans-serif';c.fillStyle='#ffe1a2';lines(c,d.bearing,495,291,1015,33,2);
  c.font='bold 36px sans-serif';c.fillStyle='#ffffff';lines(c,'HERE: '+d.prompt,495,383,1015,43,2);
  c.font='28px sans-serif';c.fillStyle='#dff0e7';lines(c,d.tool+(d.utility?' / '+d.utility:''),22,523,1490,34,2);
  c.font='28px sans-serif';lines(c,d.card.move+' '+d.card.tools,22,605,1490,34,2);
  c.font='bold 31px sans-serif';c.textAlign='center';this.buttons.forEach((button,i)=>{const hot=this.xr.controllers.some(e=>e.hit===button&&e.ray.visible);c.fillStyle=hot?'#e6cb87':'#315b4e';c.fillRect(12+i*508,675,496,80);c.fillStyle=hot?'#102d29':'#fff3c8';c.fillText(button.label,260+i*508,726);});this.guide.texture.needsUpdate=true;
 }
 surfaces(){return [['floor-guide',this.guide.mesh],['floor-notice',this.notice.mesh]];}
 pick(uv){if((1-uv.y)*768>=675)return this.buttons[Math.min(2,Math.floor(uv.x*3))];return null;}
 snapshot(){return {build:FEEDBACK_BUILD,visible:this.root.visible&&this.guide.mesh.visible,mapFrames:this.mapFrames,mapSource:this.xr.travel.navigation?.liveMap?.id||null,latestMessage:this.trail.current?.text||null,messageVisible:this.root.visible&&this.notice.mesh.visible,messageOpacity:this.notice.mesh.material.opacity,historyCount:this.trail.history.length,seconds:MESSAGE_SECONDS,pose:this.root.position.toArray(),settings:{...this.cfg},...this.data()};}
}
