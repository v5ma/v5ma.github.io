/* Pure basin/deck layout shared by rendering, camera clearance and tests.
 * Land navigation keeps its original elevation; only the water camera samples
 * the recessed basin floor. All dimensions are metres. */
export const BASIN_SLAB=.16;
export function basinLayout(pool){
 const floorY=-pool.depth, surfaceY=pool.surface??-.08;
 return {floorY,surfaceY,slabHeight:BASIN_SLAB,slabCenterY:floorY-BASIN_SLAB/2,
  laneY:floorY+.014,causticY:floorY+.035,wallHeight:pool.depth,wallCenterY:floorY/2};
}
export function poolContains(pool,x,z,inset=0){
 return Math.abs(x-pool.x)<pool.w/2-inset&&Math.abs(z-pool.z)<pool.d/2-inset;
}
export function poolCameraFloor(pools,x,z,land=0){
 const p=pools.find(p=>p.swimmable&&poolContains(p,x,z,.24));
 return p?land+basinLayout(p).floorY:land;
}
export function dryDeckRectangles(bounds,pools){
 const xs=[...new Set([bounds.x0,bounds.x1,...pools.flatMap(p=>[Math.max(bounds.x0,p.x-p.w/2),Math.min(bounds.x1,p.x+p.w/2)])])].sort((a,b)=>a-b);
 const zs=[...new Set([bounds.z0,bounds.z1,...pools.flatMap(p=>[Math.max(bounds.z0,p.z-p.d/2),Math.min(bounds.z1,p.z+p.d/2)])])].sort((a,b)=>a-b);
 const result=[];
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  const x=(xs[i-1]+xs[i])/2,z=(zs[j-1]+zs[j])/2,w=xs[i]-xs[i-1],d=zs[j]-zs[j-1];
  if(w>0&&d>0&&!pools.some(p=>poolContains(p,x,z)))result.push({x,z,w,d});
 }
 return result;
}

/* Shorten the submerged boom before land-floor correction can lift its endpoint
 * out of the water. A positive inset reserves room for the near plane. */
export function underwaterBoom(pool,target,desired,inset=.30){
 let t=1;
 for(const [axis,half] of [['x',pool.w/2-inset],['z',pool.d/2-inset]]){
  const delta=desired[axis]-target[axis];
  if(Math.abs(delta)>1e-9){const edge=pool[axis]+(delta>0?half:-half);t=Math.min(t,Math.max(0,(edge-target[axis])/delta));}
 }
 return {x:target.x+(desired.x-target.x)*t,y:target.y+(desired.y-target.y)*t,z:target.z+(desired.z-target.z)*t};
}
