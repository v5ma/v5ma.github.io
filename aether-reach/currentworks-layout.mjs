/* Rendering-only placements. Existing districts/patches remain the gameplay
 * authority. Cloud formations sit off the actual travel corridors. */
import {DISTRICTS} from './model.mjs';
export const CURRENTWORKS_TREE_DISTRICTS=Object.freeze(['bellmarket','garden']);
export const CURRENTWORKS_TREES=Object.freeze(DISTRICTS.filter(d=>CURRENTWORKS_TREE_DISTRICTS.includes(d.id)).flatMap(d=>Array.from({length:6},(_,i)=>Object.freeze({
 id:d.id+'-planter-'+i,preset:d.id==='garden'?'willow':'alder',seed:771+i+(d.id==='garden'?100:0),
 position:Object.freeze([d.x+(i%2?1:-1)*d.w*.4,d.y+.55,d.z+(i/6-.5)*d.d*.65]),height:d.id==='garden'?3.4:3.2,yaw:i*.71
}))));
// Positions are local to a six-times-scaled formation; convert the authored
// world-space coordinates once, never move the formation with the viewer.
export const CURRENTWORKS_CLOUD_SCALE=6;
export const CURRENTWORKS_CLOUDS=Object.freeze([
 [-38,-12,24],[38,-13,-55],[-120,-16,12],[72,-12,-74],[-66,3,-139],[20,16,-235]
].map((p,i)=>Object.freeze({id:'freight-cloud-'+i,seed:610+i,position:Object.freeze(p.map(n=>n/CURRENTWORKS_CLOUD_SCALE)),radius:1.4+(i%3)*.3,drift:.04,bob:.02,yaw:i*.81})));
export function currentworksQuality(mode='balanced',xr=false){
 return {water:xr||mode!=='prismatic'?'light':'balanced',trees:xr||mode==='low'?'light':mode==='prismatic'?'cinematic':'balanced',clouds:xr||mode==='low'?'light':mode==='prismatic'?'cinematic':'balanced'};
}
