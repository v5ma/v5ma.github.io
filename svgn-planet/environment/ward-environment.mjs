/* Pinned Currentworks adapter. All visual inputs are observations of the host.
 * No clock, renderer, collision, input, save, camera or scoring ownership. */
import Water from './currentworks/water.mjs';
import Optics from './currentworks/water-optics.mjs';
import Trees from './currentworks/trees.mjs';
import Cloudlets from './currentworks/cloudlets.mjs';
import Toon from './currentworks/toon.mjs';
import {environmentPreferences} from './preferences.mjs';
export const WARD_TREES=Object.freeze([
 ['depot',-21,17,'palm',4.7],['west-bank',-5,9,'willow',3.6],['east-quay',6,16,'alder',4.2],
 ['garden',14,-18,'alder',4.6],['workshop',22,15,'palm',4.8],['market',-22,-18,'willow',4.4]
].map(([id,x,z,preset,height])=>Object.freeze({id,position:Object.freeze([x,0,z]),preset,height})));
export const WARD_CLOUDS=Object.freeze([
 Object.freeze({id:'north-cloud',position:Object.freeze([-18,29,-17]),radius:2.4,seed:141}),
 Object.freeze({id:'east-cloud',position:Object.freeze([21,31,12]),radius:2.1,seed:217}),
 Object.freeze({id:'west-cloud',position:Object.freeze([-21,24,16]),radius:1.8,seed:89})
]);
export function createWardEnvironment(T,{world,preferences}={}){
 if(!world?.isObject3D)throw new TypeError('Use the host world group.');
 let prefs=environmentPreferences(preferences),disposed=false,prepared=false,pending=null,lastFrame=null;
 const owned=[],group=new T.Group();group.name='Neighborhood / Currentworks environment';world.add(group);
 const water=Water.create(T,{preset:'lagoon',quality:prefs.quality,width:4.95,length:28,centerZ:1,level:-.75,depth:1.25,shoreDepth:.1,flowZ:.16,seed:781});owned.push(water);
 const optics=Optics.attach(T,water.material);owned.push(optics);water.mesh.position.x=-.5;group.add(water.mesh);
 const forest=Trees.create(T,{trees:WARD_TREES,quality:prefs.quality,hideInAR:false,near:10,far:24});owned.push(forest);group.add(forest.group);
 const clouds=Cloudlets.create(T,{clouds:WARD_CLOUDS,near:12,far:28});owned.push(clouds);group.add(clouds.group);
 const style=Toon.create(T,{bands:[.34,.57,.8,1]});owned.push(style);
 const controls=Object.freeze({teal:style.material({color:0x46878d,name:'Archive / teal equipment'}),paper:style.material({color:0xe6cca0,name:'Archive / paper records'}),signal:style.material({color:0xe7ad57,name:'Archive / signal channel'})});
 function setPreferences(p){prefs=environmentPreferences(p);return {...prefs};}
 function update(s,{viewer,xr=false,ar=false}={}){
  if(disposed)return false;
  if(!s||!Number.isFinite(s.time)||!Number.isFinite(s.x)||!Number.isFinite(s.z))return false;
  if(viewer!==undefined&&(!Array.isArray(viewer)||viewer.length!==3||!viewer.every(Number.isFinite)))return false;
  const mix=s.transition?(s.transition.from==='high'?1-s.transition.t:s.transition.t):(s.water==='high'?1:0),level=-2+Math.max(0,Math.min(1,mix))*1.25;
  const frame={time:s.time,viewer,quiet:prefs.quiet,quality:xr?'light':prefs.quality,xr,ar};
  // s.x/z are already district-local. Translate only the mesh's -0.5 m X offset.
  // No world recenter or eye pose may manufacture boat movement/wakes.
  water.update({...frame,level,opacity:ar?.78:.94,visible:mix>.02,bodies:s.ride==='boat'?[{id:'player-skiff',x:s.x+.5,z:s.z,radius:.55}]:[]});
  optics.update({ar});forest.update({...frame,visible:prefs.scenery,windStrength:.24});clouds.update({...frame,visible:prefs.scenery});
  lastFrame={time:s.time,xr,ar,viewer:viewer?.slice()||null};return true;
 }
 async function prepare(renderer,camera,scene){
  if(disposed||prepared)return;if(pending)return pending;
  pending=(async()=>{await forest.prepare(renderer,camera,scene);if(disposed)return;
   // Compile the actual composed r177 materials, including portal hooks and the
   // two bounded water quality meshes, with the host's lighting/output policy.
   water.setQuality('light');if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
   if(disposed)return;water.setQuality(prefs.quality);if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
   if(!disposed)prepared=true;
  })().finally(()=>{pending=null;});return pending;
 }
 function dispose(){if(disposed)return;disposed=true;group.removeFromParent();optics.dispose();water.dispose();forest.dispose();clouds.dispose();style.dispose();}
 return Object.freeze({group,water,forest,clouds,controls,update,prepare,setPreferences,dispose,
  inspect:()=>({hostThree:T.REVISION,prepared,disposed,preferences:{...prefs},frame:lastFrame?{...lastFrame}:null,water:water.stats,optics:optics.stats,trees:forest.stats,clouds:clouds.stats,toon:style.stats,extraGameplayRenderPasses:0,gameplayOwnership:false})});
}
