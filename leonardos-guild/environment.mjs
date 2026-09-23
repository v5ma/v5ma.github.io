/* Guild adapter for the unchanged shared Currentworks library.
 * Cosmetic state only. Existing world coordinates, clocks and colliders win. */
import * as T from './vendor/three.module.js';
import Trees from '../prism-current/modules/environment/trees.mjs';
export const ENVIRONMENT_BUILD='guild-currentworks-20260922';
export function environmentOptions(raw={}){
 return {quiet:raw?.quiet===true,arWaterOpacity:Number.isFinite(raw?.arWaterOpacity)?Math.min(1,Math.max(0,raw.arWaterOpacity)):.65};
}
export function environmentQuality(quality,xr=false){return quality==='low'||xr?'light':'balanced';}
export function townSpecimens(list){
 return list.filter(t=>Math.abs(t.x)<20&&t.z<130).slice(0,6);
}
export function createGuildVegetation(root,list,ground){
 const specimens=townSpecimens(list);
 const descriptors=specimens.map((p,i)=>({id:'vinci-bank-'+p.seed,seed:p.seed+4103,preset:i%3===0?'willow':'alder',height:6.2,position:[p.x,ground(p.x,p.z),p.z],yaw:p.seed*.37}));
 const forest=Trees.create(T,{trees:descriptors,windStrength:.18,near:14,far:30,hideInAR:false});
 forest.group.name='Vinci Currentworks specimens';root.add(forest.group);
 let settings=environmentOptions(),lastTime=0,active=false;
 return {
  prepare:(renderer,camera,scene)=>forest.prepare(renderer,camera,scene),
  configure(raw){settings=environmentOptions(raw);},
  update(s,quality,xr=false){
   lastTime=s.time;active=s.frontier?.zone!=='badlands'&&!s.quarter?.active&&!s.life?.inside&&(!s.doors?.level||s.doors.level===3);
   // This is the ordinary world frame before XR temporarily reparents it.
   // One actor-local observer supplies the same LOD decision to both eyes.
   forest.group.updateWorldMatrix(true,false);
   forest.update({time:s.time,quality:environmentQuality(quality,xr),quiet:settings.quiet,xr,ar:false,visible:active,viewer:[s.x,ground(s.x,s.z)+1.6,s.z]});
  },
  inspect:()=>({build:ENVIRONMENT_BUILD,three:T.REVISION,active,time:lastTime,settings:{...settings},trees:forest.stats}),
  dispose:()=>forest.dispose()
 };
}
