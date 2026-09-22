/* Authored Prism-only placement; no enemy, score, physics or input responsibilities. */
(function(root){'use strict';
 const TREES=Object.freeze([
  {id:'arrival-left',preset:'palm',seed:137,height:3.9,position:[-6.45,.96,-6.6],yaw:.2},
  {id:'arrival-right',preset:'palm',seed:281,height:4.2,position:[6.65,.96,-8.1],yaw:-.45},
  {id:'bend-left',preset:'alder',seed:557,height:3.7,position:[-6.65,.96,-15.5],yaw:1.1},
  {id:'bend-right',preset:'alder',seed:619,height:4,position:[6.7,.96,-14.2],yaw:-1.6},
  {id:'gate-left',preset:'willow',seed:881,height:4.1,position:[-6.6,.96,-26],yaw:.8},
  {id:'gate-right',preset:'willow',seed:941,height:4.3,position:[6.65,.96,-24],yaw:-.3},
  {id:'horizon-left',preset:'palm',seed:1093,height:4.3,position:[-6.8,.96,-38.5],yaw:.65},
  {id:'horizon-right',preset:'palm',seed:1229,height:4.3,position:[6.8,.96,-36.7],yaw:-.8}
 ].map(d=>Object.freeze({...d,position:Object.freeze(d.position)})));
 const WIND=.35;
 function install(T,scene,art){
  const forest=root.SVGNTrees.create(T,{trees:TREES,windStrength:WIND,near:16,far:30,hideInAR:true});
  art.stage.add(forest.group);const eye=new T.Vector3(),eyeArray=[0,1.65,0];
  const update=art.update,reset=art.reset,dispose=art.dispose,prepare=art.prepare,stats=Object.getOwnPropertyDescriptor(art,'stats').get;let disposed=false;
  art.update=function(s,time,dt,ar,quiet,playing){
   if(disposed)return;update.call(art,s,time,dt,ar,quiet,playing);
   const g=scene.components?.['river-game'],camera=scene.renderer?.xr?.isPresenting?scene.renderer.xr.getCamera():scene.camera;
   if(camera){camera.getWorldPosition(eye);eye.toArray(eyeArray);}
   forest.update({time,quiet,quality:g?.quality||'balanced',visible:(s?.chapter||'duck-armada')!=='mothership',ar:!!ar,xr:scene.is('vr-mode')||!!ar,viewer:camera?eyeArray:undefined});
  };
  art.prepare=async function(renderer,camera){if(disposed)return;if(prepare)await prepare.call(art,renderer,camera);if(!disposed)await forest.prepare(renderer,camera,scene.object3D);};
  art.reset=function(){if(!disposed){reset.call(art);forest.reset();}};
  art.dispose=function(){if(disposed)return;disposed=true;forest.dispose();dispose.call(art);};
  Object.defineProperty(art,'stats',{configurable:true,get:()=>({...stats.call(art),trees:forest.stats})});
  return art;
 }
 const api=Object.freeze({TREES,WIND,install});
 if(root.RiverArt&&!root.RiverArt.currentworksTrees){const build=root.RiverArt.build;root.RiverArt.build=function(T,scene){const art=build.call(this,T,scene);try{return install(T,scene,art);}catch(e){art.dispose();throw e;}};root.RiverArt.currentworksTrees='0.1.3';}
 root.PrismBankTrees=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
