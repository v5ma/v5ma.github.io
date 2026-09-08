/* Same authored assets at every quality tier. Expensive PBR texture sampling is
 * reserved for Quality/Balanced; Battery retains real meshes and color maps.
 * Far facades use the retained original shells, never alter collision/quests. */
import * as T from './vendor/three.module.js';
export const DETAIL_BUDGETS=Object.freeze({low:{range:65,count:8},balanced:{range:100,count:16},high:{range:150,count:26}});
export function selectFacades(facades,p,quality='high'){
 const b=DETAIL_BUDGETS[quality]||DETAIL_BUDGETS.high;
 return new Set(facades.map((f,i)=>({i,d:Math.hypot(f.h.x-p.x,f.h.z-p.z)})).filter(x=>x.d<b.range).sort((a,b)=>a.d-b.d||a.i-b.i).slice(0,b.count).map(x=>x.i));
}
export function makeMaterialTiers(original){
 const battery=new T.MeshLambertMaterial({name:original.name+' / battery',map:original.map,color:original.color.clone(),vertexColors:original.vertexColors,side:original.side,alphaTest:original.alphaTest,transparent:original.transparent,opacity:original.opacity,depthWrite:original.depthWrite,emissive:original.emissive?.clone()||new T.Color(0)});
 // Native material and all original PBR maps are retained for immediate restore.
 const key=original.uuid;original.userData.guildArtKey=key;battery.userData.guildArtKey=key;
 return {key,high:original,balanced:original,low:battery};
}
export function windowBacking(parent,x,y,z,width,height,rotation,material){
 // Recessed infill belongs only behind window modules, not door openings.
 const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
 const pane=new T.Mesh(new T.PlaneGeometry(width,height),material);pane.position.set(0,height/2,-.335);g.add(pane);return g;
}
