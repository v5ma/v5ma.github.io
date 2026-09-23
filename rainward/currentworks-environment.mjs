import * as T from './vendor/three.module.js';
import Water from './vendor/currentworks/water.mjs';
import Trees from './vendor/currentworks/trees.mjs';
import {enableDioramaClipping} from './diorama-shaders.mjs';

// Read-only graphics adapter. Geometry, AI, inventory and the pausable clock
// remain Rainward's. Upstream r184 modules are independently tested on r177.
export const CURRENTWORKS_BUILD='rainward-currentworks-garden-20260922';
export function gardenTrees(chapter){
 if(chapter.id!=='conservatory')return [];
 return ['garden-bed-w','garden-bed-e','glass-cover','causeway-cover-w','causeway-cover-e'].map((id,i)=>{
  const o=chapter.obstacles.find(v=>v.id===id);
  if(!o)throw Error('Currentworks tree needs its authored planter: '+id);
  return {id:'garden-'+id,seed:731+i*83,preset:i===2?'willow':'alder',height:i===2?4.0:5.2,position:[o.x,o.bottom+o.h,o.z],yaw:i*.79};
 });
}
export function createCurrentworksEnvironment(scene,chapter){
 const root=new T.Group();root.name='Rainward / Currentworks environment';root.visible=false;
 const surfaces=[],legacy=[],trees=chapter.id==='conservatory'?gardenTrees(chapter):[];
 let forest=null,disposed=false,prepared=trees.length===0,preparing=null,error=null,enabled=true,quiet=false,low=false,lastState=null,lastTime=0;
 let preparations=0,warmupDraws=0;
 if(trees.length){
  scene.traverse(o=>{if(o.userData.waterSurface||o.userData.legacyConservatoryTrees)legacy.push({object:o,visible:o.visible});});
  try{
   forest=Trees.create(T,{trees,windStrength:.28,near:18,far:36,hideInAR:false,quality:'light'});
   forest.group.traverse(o=>{if(o.material)o.material.userData.currentworksNative=true;});
   root.add(forest.group);
   for(const [i,p]of chapter.water.entries()){
    const water=Water.create(T,{preset:'lagoon',quality:'light',width:p.w,length:p.d,centerZ:0,level:.16,depth:p.depth,shoreDepth:Math.min(.12,p.depth),opacity:.76,seed:431+i*17});
    water.mesh.position.set(p.x,0,p.z);water.mesh.userData.currentworksSurface=true;water.mesh.name='Currentworks / Conservatory pool '+(i+1);
    root.add(water.mesh);surfaces.push({water,footprint:p,index:i});
   }
   // Review deformation-aware clipping once, before compiling the water. Trees
   // use built-in clipping. PortalMaterials wraps these same shaders later.
   enableDioramaClipping(root);scene.add(root);
  }catch(e){error=String(e.message||e);forest?.dispose();for(const {water}of surfaces)water.dispose();surfaces.length=0;root.removeFromParent();}
 }
 function visibility(){const active=!!forest&&enabled&&prepared&&!disposed&&!error;root.visible=active;for(const l of legacy)l.object.visible=active?false:l.visible;return active;}
 function settings(value={}){if(typeof value.enabled==='boolean')enabled=value.enabled;if(typeof value.quiet==='boolean')quiet=value.quiet;if(typeof value.low==='boolean')low=value.low;visibility();}
 // Warm up the real water buffers without painting into the canvas or XR eye.
 // r177 selects output policy via isXRRenderTarget too. No target is retained.
 async function prepareWater(renderer){
  const warm=new T.Scene(),cam=new T.PerspectiveCamera(55,1,.01,50);cam.position.set(0,3,4);cam.lookAt(0,0,0);
  for(const {water}of surfaces){renderer.initTexture?.(water.uniforms.waterNoise.value);for(const quality of ['light','balanced']){water.setQuality(quality);const m=new T.Mesh(water.mesh.geometry,water.material);m.frustumCulled=false;warm.add(m);}water.setQuality('light');}
  try{
   if(renderer.compileAsync)await renderer.compileAsync(warm,cam);else renderer.compile(warm,cam);
   if(disposed||!renderer.isWebGLRenderer)return;
   const old={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),xr:renderer.xr.enabled,auto:renderer.autoClear,scissor:renderer.getScissorTest(),view:renderer.getViewport(new T.Vector4()),rect:renderer.getScissor(new T.Vector4())};
   const target=new T.WebGLRenderTarget(24,24,{depthBuffer:true,stencilBuffer:false});
   target.isXRRenderTarget=!old.target||old.target.isXRRenderTarget===true;target.texture.colorSpace=target.isXRRenderTarget?(old.target?.texture.colorSpace||renderer.outputColorSpace):T.ColorManagement.workingColorSpace;
   try{renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.render(warm,cam);renderer.getContext().finish();warmupDraws++;}
   finally{renderer.setRenderTarget(old.target,old.face,old.mip);renderer.setViewport(old.view);renderer.setScissor(old.rect);renderer.setScissorTest(old.scissor);renderer.autoClear=old.auto;renderer.xr.enabled=old.xr;target.dispose();}
  }finally{warm.clear();}
 }
 function prepare(renderer,camera){
  if(disposed||error||!forest||prepared)return Promise.resolve(!error&&!disposed);if(preparing)return preparing;
  preparations++;
  preparing=(async()=>{
   try{await forest.prepare(renderer,camera,scene);if(disposed)return false;await prepareWater(renderer);if(disposed)return false;prepared=true;visibility();return true;}
   catch(e){error=String(e.message||e);visibility();return false;}
   finally{preparing=null;}
  })();return preparing;
 }
 function update(state,{viewer,xr=false,ar=false}={}){
  if(disposed||!forest||!state?.player)return;
  const active=visibility(),time=Number.isFinite(state.t)?Math.max(0,state.t):lastTime;
  if(lastState!==state||time<lastTime){forest.reset();for(const {water}of surfaces)water.reset(time);lastState=state;}lastTime=time;
  const quality=low||xr?'light':'balanced';
  // One game-world viewpoint for both eyes. Diorama transforms are applied by
  // the existing compositor AFTER this update, not mistaken for game coords.
  const p=state.player,v=viewer||[p.x,1.6,p.z];
  forest.update({time,quality,quiet,xr,ar,viewer:v,visible:active});
  root.updateWorldMatrix(true,true);
  for(const {water,footprint:f}of surfaces){
   const inside=Math.abs(p.x-f.x)<f.w/2&&Math.abs(p.z-f.z)<f.d/2;
   const local=new T.Vector3(p.x,0,p.z);water.mesh.worldToLocal(local);
   water.update({time,quality,quiet,xr,visible:active,opacity:.76,bodies:inside?[{id:'survivor',x:local.x,z:local.z,radius:.32}]:[]});
  }
 }
 function dispose(){if(disposed)return;disposed=true;visibility();forest?.dispose();for(const {water}of surfaces)water.dispose();root.removeFromParent();}
 return {root,prepare,update,settings,dispose,needsPreparation:()=>!!forest&&!prepared&&!disposed&&!error,
  stats:()=>({build:CURRENTWORKS_BUILD,chapter:chapter.id,hostThree:T.REVISION,active:root.visible&&!disposed,prepared,preparing:!!preparing,error,enabled,quiet,preparations,warmupDraws,trees:forest?.stats||null,water:surfaces.map(s=>s.water.stats),renderTargets:0,disposed})};
}
