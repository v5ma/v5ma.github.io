/* Deterministic visual placements constrained to existing scenery/cover.
 * These do not create or remove walkable geometry, objectives or enemies. */
export const SCAN_KEYS=['stone','brick','paving','ground'];
export const MODEL_IDS=['boulder_01','rock_moss_set_01','fern_02'];
const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function fernPlacements(chapter){
 const protectedPoints=[...chapter.items,...chapter.shelters,...(chapter.tasks||[]),...(chapter.puzzle?[chapter.puzzle.clue,...chapter.puzzle.wheels]:[])];const result=[];
 for(const [g,patch]of chapter.grass.entries())for(let i=0;i<12;i++){
  const seed=g*100+i,x=patch.x+(random(seed+19)-.5)*patch.w*.88,z=patch.z+(random(seed+79)-.5)*patch.d*.88;
  if(protectedPoints.some(p=>Math.hypot(x-p.x,z-p.z)<2.2))continue;
  if(chapter.obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.6&&Math.abs(z-o.z)<o.d/2+.6))continue;
  result.push({x,z,yaw:random(seed+144)*Math.PI*2,scale:.72+random(seed+77)*.48,variant:i%4});
 }return result.slice(0,88);
}
export function planterRockPlacements(chapter){return chapter.obstacles.filter(o=>o.kind==='planter').map((o,i)=>({x:o.x,z:o.z,y:o.bottom+o.h,scale:Math.min(o.w,o.d)*.28,variant:i%6}));}
export function scanStatus(s){if(!s.enabled)return 'Enhanced assets off';if(s.pending)return `Loading enhanced assets · ${s.done}/${s.total}`;return s.errors.length?'Enhanced assets partial · fallback active':'Enhanced assets ready';}
