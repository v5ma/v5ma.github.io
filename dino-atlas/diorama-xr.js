import * as T from './vendor/three.module.js';
import {ReserveXR} from './xr-reserve.js?v=rotunda2';
import {readPresentation,savePresentation,settings,openings,stageMatrix,gameRay} from './diorama-core.js';
import {PORTAL_BUILD,PORTAL_SPAN,dimensions,boxInverse,enterPortal,PortalMaterials,shellMaterial} from './diorama-portal.js';
// The physical simulation stays at its original scale. The miniature transform is
// applied only while rendering and undone in finally, including on render failure.
export class DioramaXR extends ReserveXR {
 constructor(ctx){
  super(ctx);this.presentation=readPresentation(ctx.storage);
  try{if(ctx.presentationDefault&&!ctx.storage?.getItem('dino-atlas.presentation.v1'))this.presentation.view=ctx.presentationDefault;}catch{if(ctx.presentationDefault)this.presentation.view=ctx.presentationDefault;}
  this.actualView=null;this.sessionMode=null;
  this.anchor=new T.Vector3(0,.8,-1.5);this.displayYaw=0;this.center=new T.Vector3();this.displayMatrix=new T.Matrix4();this.portal=new PortalMaterials();this.materials=this.portal.entries;this.worldSaved=null;this.lastRenderError=null;
  this.stage=new T.Group();this.stage.name='Diorama enclosure';ctx.scene.add(this.stage);this.stage.visible=false;
  const rim=new T.MeshBasicMaterial({color:0xc3ad7b,depthTest:false,toneMapped:false});
  const cube=new T.BoxGeometry(1,1,1),slab=normal=>{const m=new T.Mesh(cube,shellMaterial(new T.Vector3(...normal),new T.Vector3(),this.portal.uniforms));m.renderOrder=100;this.stage.add(m);return m;};
  this.floor=slab([0,-1,0]);this.backWall=slab([0,0,-1]);this.leftWall=slab([-1,0,0]);this.rightWall=slab([1,0,0]);this.frontWall=slab([0,0,1]);this.lid=slab([0,1,0]);
  this.edges=Array.from({length:12},()=>{const m=new T.Mesh(cube,rim);m.renderOrder=110;this.stage.add(m);return m;});this.rim=this.edges[0];
  this.sky=new T.Mesh(new T.SphereGeometry(1,16,12),new T.MeshBasicMaterial({color:0xb7d3d0,side:T.BackSide,depthWrite:false,toneMapped:false,fog:false}));this.sky.renderOrder=-1000;this.sky.frustumCulled=false;this.stage.add(this.sky);this.portal.attach(this.sky.material);
  const controls=document.createElement('div');controls.className='settings';controls.innerHTML='<label>XR presentation <select id="xr-presentation"><option value="first-person-vr">First-person VR</option><option value="diorama-vr">Third-person VR diorama</option><option value="diorama-ar">Third-person AR diorama / passthrough</option></select></label><label>Diorama openings <select id="xr-aperture"><option value="both">Top and front open / automatic cutaway</option><option value="top">Top open / front auto-transparent</option><option value="front">Front open / top auto-transparent</option></select></label><label>Display width in meters <input id="xr-width" type="range" min="1.2" max="3.2" step="0.2"></label><button id="xr-recenter">Place diorama in front of me</button><button id="xr-change-view">Switch first-person / diorama VR</button>';
  document.getElementById('menu-dialog').append(controls);
  const select=document.getElementById('xr-presentation');select.value=this.presentation.view;select.onchange=()=>{this.presentation=settings({...this.presentation,view:select.value});this.persist();this.refreshButtons();};
  const aperture=document.getElementById('xr-aperture');aperture.value=this.presentation.aperture;aperture.onchange=()=>{this.presentation=settings({...this.presentation,aperture:aperture.value});this.persist();this.updateStage();};
  const width=document.getElementById('xr-width');width.value=this.presentation.width;width.oninput=()=>{this.presentation=settings({...this.presentation,width:Number(width.value)});this.persist();this.updateStage();};
  document.getElementById('xr-recenter').onclick=()=>this.place();document.getElementById('xr-change-view').onclick=()=>this.toggleView();
  this.checkSupport();
 }
 get diorama(){return this.active&&this.actualView!=='first-person-vr';}
 persist(){if(!savePresentation(this.ctx.storage,this.presentation))this.ctx.notify('This browser could not save the XR preference. Gameplay progress is unchanged.');}
 async checkSupport(){
  let vr=false,ar=false;try{[vr,ar]=await Promise.all(['immersive-vr','immersive-ar'].map(mode=>navigator.xr?.isSessionSupported(mode).catch(()=>false)||false));}catch{}
  this.supported=!!vr;this.supportedAR=!!ar;
  if(this.presentation)this.refreshButtons();
 }
 refreshButtons(){
  const view=this.presentation.view,available=view==='diorama-ar'?this.supportedAR:this.supported;
  for(const id of ['xr-enter','xr-intro']){const b=document.getElementById(id);if(b){b.disabled=!this.active&&!available;b.textContent=this.active?'Leave XR':view==='diorama-ar'?'Enter AR diorama':view==='diorama-vr'?'Enter VR diorama':'Enter first-person VR';}}
  const s=document.getElementById('xr-presentation');if(s)s.disabled=this.active;
  const b=document.getElementById('xr-change-view');if(b)b.disabled=!this.active||this.sessionMode!=='immersive-vr';
  const p=document.getElementById('xr-recenter');if(p)p.disabled=!this.diorama;
  if(this.status)this.status.textContent=this.active?this.diorama?'Portal: the character stays centered while the normal world moves through a stationary box. Camera-facing panels clear automatically. Point + trigger or pinch selects menus.':'First-person VR. Right B opens settings.':available?'XR mode available. Choose a presentation in Settings before entering.':'Selected immersive mode is unavailable here. Desktop play is unchanged; AR never silently starts VR.';
 }
 async enter(){
  if(this.pending)return;if(this.active){try{await this.session.end();}catch{}return;}
  this.pending=true;let session=null;const selected=this.presentation.view,mode=selected==='diorama-ar'?'immersive-ar':'immersive-vr';
  try{
   session=await navigator.xr.requestSession(mode,{optionalFeatures:['local-floor','hand-tracking']});
   this.saved={position:this.ctx.camera.position.clone(),quaternion:this.ctx.camera.quaternion.clone()};this.session=session;this.sessionMode=mode;this.actualView=selected;
   session.addEventListener('end',()=>this.end(),{once:true});
   session.addEventListener('visibilitychange',()=>{this.invisible=session.visibilityState!=='visible';this.clear();if(this.invisible&&!this.ctx.modal())this.ctx.action('menu');});
   session.addEventListener('inputsourceschange',e=>{for(const s of e.removed||[]){this.holds.delete(s);this.consumed.delete(s);this.gate.remove(s);}this.clear();if(e.removed?.length&&!this.ctx.modal())this.ctx.action('menu');});
   this.originOffset.set(0,0,0);this.rig.position.set(0,0,0);this.rig.rotation.set(0,selected==='first-person-vr'?this.ctx.yaw():0,0);this.ctx.camera.position.set(0,0,0);this.ctx.camera.quaternion.identity();
   await this.ctx.renderer.xr.setSession(session);if(this.session!==session)return;
   this.active=true;this.invisible=false;this.context=null;this.clear();this.position();this.place();this.refreshButtons();
  }catch(e){if(session)try{await session.end();}catch{}this.end();this.ctx.notify('XR entry failed: '+(e?.message||'unavailable')+'. Desktop and saves are unchanged.');}
  finally{this.pending=false;}
 }
 end(){super.end();this.actualView=null;this.sessionMode=null;if(this.stage)this.stage.visible=false;this.portal.active=false;this.restoreWorld();if(this.presentation)this.refreshButtons();}
 position(){if(this.diorama){this.rig.position.set(0,0,0);this.rig.rotation.set(0,0,0);this.rig.updateMatrixWorld(true);}else super.position();}
 place(){
  if(!this.diorama)return;this.position();const c=this.headCamera(),p=c.getWorldPosition(new T.Vector3()),q=c.getWorldQuaternion(new T.Quaternion());
  const direction=new T.Vector3(0,0,-1).applyQuaternion(q);direction.y=0;if(direction.lengthSq()<.01)direction.set(0,0,-1);direction.normalize();
  this.displayYaw=Math.atan2(-direction.x,-direction.z);this.anchor.copy(p).addScaledVector(direction,1.7);this.anchor.y=Math.max(.4,Math.min(1.1,(p.y||1.65)-.68));this.updateStage();
 }
 toggleView(){
  if(!this.active||this.sessionMode!=='immersive-vr')return;
  this.actualView=this.diorama?'first-person-vr':'diorama-vr';this.presentation.view=this.actualView;this.persist();this.originOffset.set(0,0,0);this.clear();this.restoreWorld();
  if(this.diorama){this.position();this.place();}else{this.stage.visible=false;this.rig.rotation.y=this.ctx.yaw();this.position();}
  document.getElementById('xr-presentation').value=this.actualView;this.refreshButtons();
 }
 snap(amount){if(!this.diorama)return super.snap(amount);this.displayYaw+=amount;this.updateStage();}
 updateStage(){
  if(!this.stage)return;const {width:w,depth:d,height:h}=this.size=dimensions(this.presentation.width);
  this.stage.position.copy(this.anchor);this.stage.rotation.y=this.displayYaw;
  const setup=(m,x,y,z,sx,sy,sz)=>{m.position.set(x,y,z);m.scale.set(sx,sy,sz);if(m.material.uniforms?.shellPoint)m.material.uniforms.shellPoint.value.set(x,y,z);};
  setup(this.floor,0,-.015,0,w,.03,d);
  setup(this.backWall,0,h/2,-d/2,w,h,.003);setup(this.leftWall,-w/2,h/2,0,.003,h,d);setup(this.rightWall,w/2,h/2,0,.003,h,d);
  setup(this.frontWall,0,h/2,d/2,w,h,.003);setup(this.lid,0,h,0,w,.003,d);
  const v=openings(this.presentation.aperture);this.frontWall.visible=!v.front;this.lid.visible=!v.top;
  let i=0;for(const y of [0,h]){for(const z of [-d/2,d/2])setup(this.edges[i++],0,y,z,w+.02,.012,.012);for(const x of [-w/2,w/2])setup(this.edges[i++],x,y,0,.012,.012,d+.02);}for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])setup(this.edges[i++],x,h/2,z,.012,h,.012);
  this.sky.position.set(0,h/2,0);this.sky.scale.setScalar(Math.min(200,this.ctx.camera.far*.65));
  this.center.copy(this.ctx.fleet.position); // includes walking, jumps and vehicles
  const middle=this.anchor.clone().add(new T.Vector3(0,h/2,0));
  this.displayMatrix.copy(stageMatrix(middle,this.displayYaw,w/PORTAL_SPAN,this.center));
  this.portal.configure(this.anchor,this.displayYaw,this.size);this.stage.updateMatrixWorld(true);
 }
 restoreWorld(){
  const saved=this.worldSaved;if(!saved)return;const root=this.ctx.worldRoot;
  root.position.copy(saved.position);root.quaternion.copy(saved.quaternion);root.scale.copy(saved.scale);root.matrix.copy(saved.matrix);root.matrixAutoUpdate=saved.auto;root.updateMatrixWorld(true);this.worldSaved=null;
 }
 adoptWorld(){
  // Classic's builders retain their original objects and local coordinates. New
  // effects added to the scene are adopted too; no parallel miniature scene.
  if(this.ctx.adoptSceneWorld)for(const o of [...this.ctx.scene.children])if(o!==this.ctx.worldRoot&&o!==this.stage&&o!==this.rig&&o!==this.ctx.camera)this.ctx.worldRoot.add(o);
 }
 render(){
  const {scene,camera,renderer,worldRoot}=this.ctx;if(!this.diorama){this.portal.active=false;this.stage.visible=false;renderer.render(scene,camera);return;}
  this.adoptWorld();this.updateStage();
  const saved={background:scene.background,fog:scene.fog,shadow:renderer.shadowMap.enabled,alpha:renderer.getClearAlpha(),color:renderer.getClearColor(new T.Color()).clone()};
  this.worldSaved={position:worldRoot.position.clone(),quaternion:worldRoot.quaternion.clone(),scale:worldRoot.scale.clone(),matrix:worldRoot.matrix.clone(),auto:worldRoot.matrixAutoUpdate};
  try{
   this.portal.collect(worldRoot);this.portal.active=true;
   this.displayMatrix.decompose(worldRoot.position,worldRoot.quaternion,worldRoot.scale);worldRoot.matrixAutoUpdate=true;worldRoot.updateMatrixWorld(true);this.stage.visible=true;
   if(saved.background?.isColor)this.sky.material.color.copy(saved.background);
   scene.background=this.sessionMode==='immersive-ar'?null:new T.Color(0x152c32);scene.fog=null;renderer.shadowMap.enabled=false;renderer.setClearColor(0x152c32,this.sessionMode==='immersive-ar'?0:1);
   renderer.render(scene,camera);
  }finally{
   this.portal.active=false;this.restoreWorld();scene.background=saved.background;scene.fog=saved.fog;renderer.shadowMap.enabled=saved.shadow;renderer.setClearColor(saved.color,saved.alpha);
  }
 }
 aimFrom(origin,fallback){
  if(!this.aimRay)return {origin,direction:fallback};if(!this.diorama)return this.aimRay;
  this.updateStage();const entry=enterPortal(this.aimRay,boxInverse(this.anchor,this.displayYaw),this.size);
  if(!entry)return {origin,direction:fallback};
  const ray=gameRay(entry,this.displayMatrix),hit=this.ctx.rayTarget?.(ray);
  if(!hit)return {origin,direction:fallback};const direction=new T.Vector3().subVectors(hit,origin);if(direction.lengthSq()<.01)return {origin,direction:fallback};
  // A tabletop pointer chooses aim only. Tools still originate at the ranger,
  // consume the same ammunition and collide with real walls at the same range.
  return {origin,direction:direction.normalize()};
 }
 positionPanel(){
  if(this.console){this.console.positionPanel();return;}
  if(!this.diorama){this.panel.scale.setScalar(1);return;}
  // ReserveXR asks hit() before evaluating held actions. Reposition here, not
  // only after super.update(), so hover, selection and holds share one pose.
  this.panel.scale.setScalar(.67);
  const side=new T.Vector3(-this.presentation.width/2-.58,.36,0).applyAxisAngle(new T.Vector3(0,1,0),this.displayYaw);
  this.panel.position.copy(this.anchor).add(side);
  this.panel.lookAt(this.headCamera().getWorldPosition(new T.Vector3()));
  this.panel.updateWorldMatrix(true,false);
 }
 hit(entry){this.positionPanel();return super.hit(entry);}
 update(dt){
  this.panel.scale.setScalar(this.diorama?.67:1);
  const motion=super.update(dt);if(!this.active)return motion;
  this.controlYaw=this.diorama?this.viewYaw-this.displayYaw:this.viewYaw;
  this.positionPanel();return motion;
 }
 snapshot(){return {...super.snapshot(),build:this.ctx.build||'diorama-20260915.1',portalBuild:PORTAL_BUILD,framing:'character-centered-depth-portal',portalSpan:PORTAL_SPAN,center:{x:this.center.x,y:this.center.y,z:this.center.z},mask:'per-eye-ray-box-aperture',automaticWallTransparency:true,view:this.actualView||this.presentation.view,sessionMode:this.sessionMode,arSupported:!!this.supportedAR,aperture:this.presentation?.aperture||'both',openings:openings(this.presentation?.aperture),width:this.presentation?.width,worldScaleRestored:this.ctx.worldRoot?.scale.x===1,anchoring:'manual-session-placement',hardwareVerified:false};}
}
