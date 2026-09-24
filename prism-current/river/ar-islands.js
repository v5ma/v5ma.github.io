/* Prism AR Archipelago 0.1.1. Explicit adapter over the full Friendly Current game.
 * New scenery is not collision, target, camera, score or input state.
 */
(function(root){'use strict';
 const VERSION='0.1.1';
 const ISLANDS=Object.freeze([
  Object.freeze({id:'palm-shoal',seed:412,position:Object.freeze([-4.7,.24,-6.8]),radius:.94,depth:.72,yaw:.2}),
  Object.freeze({id:'willow-shoal',seed:816,position:Object.freeze([4.8,.34,-8.4]),radius:1,depth:.78,yaw:-.25})
 ]);
 const CLOUDS=Object.freeze([
  Object.freeze({id:'cloud-left',seed:417,position:Object.freeze([-4.5,3.0,-9.4]),radius:.58,drift:.06,bob:.025}),
  Object.freeze({id:'cloud-right',seed:811,position:Object.freeze([4.7,3.2,-11.2]),radius:.70,drift:.06,bob:.025})
 ]);
 function install(T,scene,art){
  const objects=[],style=root.SVGNToon.create(T,{bands:[.34,.58,.8,1]}),scenery=new T.Group();scenery.name='prism-ar-archipelago';art.stage.add(scenery);
  let islands,forest,clouds,grass,optics,water,disposed=false,ready=false,pending=null,currentMode='islands',shown=false;
  const cameraEye=new T.Vector3(),worldEye=new T.Vector3(),viewer=[0,1.65,0];
  try{
   islands=root.SVGNIslands.create(T,{islands:ISLANDS,material:style.material({vertexColors:true,color:0xffffff})});objects.push(islands);scenery.add(islands.group);
   forest=root.SVGNTrees.create(T,{trees:[
    {id:'ar-palm',seed:137,preset:'palm',height:1.75,position:islands.socket('palm-shoal'),yaw:.2},
    {id:'ar-willow',seed:881,preset:'willow',height:1.6,position:islands.socket('willow-shoal'),yaw:-.35}
   ],windStrength:.20,hideInAR:false,near:8,far:18});objects.push(forest);scenery.add(forest.group);
   clouds=root.SVGNCloudlets.create(T,{clouds:CLOUDS});objects.push(clouds);scenery.add(clouds.group);
   // Slightly bury roots in the domed turf; no collider or gameplay state.
   grass=root.SVGNGrass.create(T,{patches:ISLANDS.map((d,i)=>{const p=islands.socket(d.id);p[1]-=.018;return {id:d.id+'-grass',position:p,seed:311+i*417,radius:i?.46:.43,height:i?.19:.18,blades:36};}),windStrength:.025});
   objects.push(grass);scenery.add(grass.group);grass.update({xr:true,quality:'light',quiet:true});
   water=art.stage.getObjectByName('Currentworks Water / local-space surface');
   if(!water)throw Error('AR islands require the current River water.');optics=root.SVGNWaterOptics.attach(T,water.material);
  }catch(e){for(const o of objects)o.dispose();style.dispose();scenery.removeFromParent();throw e;}
  scenery.visible=false;
  const update=art.update,reset=art.reset,dispose=art.dispose,prepare=art.prepare,getStats=Object.getOwnPropertyDescriptor(art,'stats').get;
  // Simple opaque scenery uses existing standard/toon shaders. Warm its actual
  // buffers offscreen during cancellable loading, never while the song runs.
  function warm(renderer,camera){
   if(!renderer?.isWebGLRenderer)return;
   const target=new T.WebGLRenderTarget(24,24,{depthBuffer:true,stencilBuffer:false}),scratch=new T.Scene(),cam=new T.PerspectiveCamera(55,1,.01,20);
   const vp=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4());
   const saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),xr:renderer.xr.enabled,clear:renderer.autoClear,scissor:renderer.getScissorTest()};
   target.isXRRenderTarget=!saved.target||saved.target.isXRRenderTarget===true;target.texture.colorSpace=target.isXRRenderTarget?(saved.target?.texture.colorSpace||renderer.outputColorSpace):T.ColorManagement.workingColorSpace;
   cam.position.z=4;scene.object3D.traverseVisible(o=>{if(o.isLight)scratch.add(o.clone(false));});
   // Trees prepare their own complete LOD set separately. Proxy meshes here own
   // no geometry or materials and never reparent or expose the actual objects.
   for(const group of [islands.group,clouds.group,grass.group])for(const m of group.children){const proxy=new T.Mesh(m.geometry,m.material);proxy.frustumCulled=false;scratch.add(proxy);}
   try{renderer.initTexture(style.gradient);renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.render(scratch,cam);renderer.getContext().finish();}
   finally{scratch.clear();renderer.setRenderTarget(saved.target,saved.face,saved.mip);renderer.setViewport(vp);renderer.setScissor(sc);renderer.setScissorTest(saved.scissor);renderer.autoClear=saved.clear;renderer.xr.enabled=saved.xr;target.dispose();}
  }
  art.update=function(s,time,dt,ar,quiet,playing){
   if(disposed)return;update.call(art,s,time,dt,ar,quiet,playing);
   const g=scene.components?.['river-game'];currentMode=g?.dock?.prefs.arScenery||'islands';
   shown=!!ar&&(s?.chapter||'duck-armada')==='duck-armada'&&currentMode==='islands';scenery.visible=shown;
   optics.update({ar:!!ar});
   if(!shown){grass.update({time,quiet,xr:!!ar,quality:'light',visible:false});return;}
   const camera=scene.renderer?.xr?.isPresenting?scene.renderer.xr.getCamera():scene.camera;
   if(camera){camera.getWorldPosition(cameraEye);cameraEye.toArray(viewer);worldEye.copy(cameraEye);}
   forest.update({time,quiet,ar:true,xr:true,quality:'light',viewer:camera?viewer:undefined,visible:true});
   clouds.update({time,quiet,xr:true,quality:'light',viewer:camera?viewer:undefined,visible:true});
   grass.update({time,quiet,xr:true,quality:'light',viewer:camera?viewer:undefined,visible:true});
   // Hide whole nearby island/tree assemblies rather than putting rock in a
   // user's face. This never pauses or confines the player, or detects furniture.
   for(let i=0;i<islands.group.children.length;i++){
    const m=islands.group.children[i];m.updateWorldMatrix(true,false);const distance=camera?m.getWorldPosition(cameraEye).distanceTo(worldEye):99;
    const v=distance>2.0;m.visible=v;
    if(forest.group.children[i])forest.group.children[i].visible=v;
    if(grass.group.children[i])grass.group.children[i].visible=v;
   }
  };
  art.prepare=function(renderer,camera){
   if(disposed)return Promise.resolve();if(pending)return pending;
   pending=Promise.resolve().then(async()=>{
    if(prepare)await prepare.call(art,renderer,camera);if(disposed||ready)return;
    await forest.prepare(renderer,camera,scene.object3D);if(disposed)return;
    clouds.update({time:0,quiet:true,xr:true,visible:true});
    grass.update({time:0,quiet:true,xr:true,quality:'light',visible:true});
    await renderer.compileAsync?.(scenery,camera,scene.object3D);if(disposed)return;
    warm(renderer,camera);
    await optics.prepare(renderer,camera,scene.object3D,water);if(disposed)return;ready=true;
   }).finally(()=>{pending=null;});return pending;
  };
  art.reset=function(){if(disposed)return;reset.call(art);forest.reset();clouds.reset();grass.reset();};
  art.dispose=function(){if(disposed)return;disposed=true;optics.dispose();for(const o of objects)o.dispose();style.dispose();scenery.removeFromParent();dispose.call(art);};
  Object.defineProperty(art,'stats',{configurable:true,get:()=>({...getStats.call(art),arScenery:{version:VERSION,mode:currentMode,visible:shown&&!disposed,prepared:ready,islands:islands.stats,trees:forest.stats,clouds:clouds.stats,grass:grass.stats,optics:optics.stats}})});
  return art;
 }
 const api=Object.freeze({VERSION,ISLANDS,CLOUDS,install});
 if(root.RiverArt&&!root.RiverArt.arArchipelago){const build=root.RiverArt.build;root.RiverArt.build=function(T,scene){const art=build.call(this,T,scene);try{return install(T,scene,art);}catch(e){art.dispose();throw e;}};root.RiverArt.arArchipelago=VERSION;}
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PrismARIslands=api;
})(globalThis);
