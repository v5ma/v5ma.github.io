/* Steady Steps: continuous camera-boom collision, independent of simulation.
 * Expanded AABBs give conservative near-plane clearance; no scene mesh scan.
 * World geometry is cached. Floors use separate geometry, never street walls
 * projected infinitely into rooftops or cellars. This never moves the player. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function segmentBox(a,b,box,padding=0){
 if(!finite(a)||!finite(b)||!finite(box.min)||!finite(box.max))return null;
 let enter=0,exit=1;
 for(const k of ['x','y','z']){
  const lo=box.min[k]-padding,hi=box.max[k]+padding,d=b[k]-a[k];
  if(Math.abs(d)<1e-10){if(a[k]<lo||a[k]>hi)return null;continue;}
  let u=(lo-a[k])/d,v=(hi-a[k])/d;if(u>v)[u,v]=[v,u];
  enter=Math.max(enter,u);exit=Math.min(exit,v);if(enter>exit)return null;
 }
 return {enter,exit};
}
export function clipBoom(anchor,desired,boxes,radius=.22){
 if(!finite(anchor)||!finite(desired))throw new TypeError('Camera positions must be finite.');
 let fraction=1,obstacle=null;const length=distance(anchor,desired);
 for(const box of boxes){const hit=segmentBox(anchor,desired,box,radius);if(hit&&hit.enter<fraction){fraction=hit.enter;obstacle=box.id;}}
 // A small world-space margin avoids floating point chatter at the hit plane.
 if(obstacle!==null)fraction=Math.max(0,fraction-.035/Math.max(.001,length));
 return {position:mix(anchor,desired,fraction),fraction,obstacle};
}
export function corridorFraction(anchor,desired,paths,radius=.22){
 // Merge intersections with the UNION of passage rectangles. Sampling just
 // the destination misses holes; clipping each rectangle independently would
 // incorrectly stop at otherwise connected crossings.
 const intervals=[];
 for(const p of paths){const box={min:{x:p.x-p.hx+radius,y:-1e6,z:p.z-p.hz+radius},max:{x:p.x+p.hx-radius,y:1e6,z:p.z+p.hz-radius}};const hit=segmentBox(anchor,desired,box);if(hit)intervals.push(hit);}
 intervals.sort((a,b)=>a.enter-b.enter);let end=0;
 for(const span of intervals){if(span.enter>end+1e-7)break;end=Math.max(end,span.exit);}
 return clamp(end,0,1);
}
export function createCameraSafety(world,heightAt){
 const radius=.22;
 const fromRect=(b,h)=>({id:b.id,min:{x:b.x-b.hx,y:heightAt(b.x,b.z)-.3,z:b.z-b.hz},max:{x:b.x+b.hx,y:heightAt(b.x,b.z)+h,z:b.z+b.hz}});
 const street=world.colliders.map(b=>fromRect(b,Number.isFinite(b.cameraHeight)?b.cameraHeight:b.low?1.18:b.id.includes('counter')?1.35:b.id==='kiosk'?4.6:b.id==='newsroom'?12.6:b.id.includes('north-wall')?5.3:10.8));
 // Headroom above the real entrance opening matters when looking upward.
 for(const r of world.rooms){const x=r.x-r.side*(r.hx-.2),y=heightAt(r.x,r.z);street.push({id:r.id+'-lintel',min:{x:x-.25,y:y+3.3,z:r.z-1.6},max:{x:x+.25,y:y+10.8,z:r.z+1.6}});}
 const gates=(world.gates||[]).map(b=>fromRect(b,1.5)),north=world.townGate?fromRect(world.townGate,4.4):null;
 let previous=null,lastSpace=null,last={};
 function solve(anchor,desired,{level=0,roomId=null,ground=0,garden=false,relay=false}={}){
  let result={position:{...desired},fraction:1,obstacle:null};
  if(level===0)result=clipBoom(anchor,desired,[...street,...(!relay?gates:[]),...(!garden&&north?[north]:[])],radius);
  else if(level===-2){const f=corridorFraction(anchor,desired,world.doorPaths,radius);if(f<1)result={position:mix(anchor,desired,Math.max(0,f-.006)),fraction:f,obstacle:'passage-edge'};}
  else if(level!==3){
   const r=world.rooms.find(h=>h.id===roomId);
   if(r){const box={min:{x:r.x-r.hx+.55,y:ground+.4,z:r.z-r.hz+.55},max:{x:r.x+r.hx-.55,y:ground+3.45,z:r.z+r.hz-.55}},hit=segmentBox(anchor,desired,box);
    if(hit&&hit.exit<1)result={position:mix(anchor,desired,Math.max(0,hit.exit-.006)),fraction:hit.exit,obstacle:'room-boundary'};
   }
  }
  // Terrain is curved rather than boxed. Bound the short boom's ground check;
  // all thin walls above are still handled analytically, not by this sampling.
  const length=distance(anchor,result.position),steps=Math.min(128,Math.max(1,Math.ceil(length/.1)));
  const depth=level===3?15:level<0?level*5:level*3.8;
  for(let i=1;i<=steps;i++){const p=mix(anchor,result.position,i/steps),floor=roomId&&![3,-2].includes(level)?ground:heightAt(p.x,p.z)+depth;
   if(p.y<floor+.38){const f=(i-1)/steps;result={position:mix(anchor,result.position,f),fraction:result.fraction*f,obstacle:'floor'};break;}
  }
  return result;
 }
 function update(anchor,desired,options={}){
  const level=options.level||0,space=level+':'+([0,3,-2].includes(level)?'network':options.roomId||'network');
  const transition=lastSpace!==space;lastSpace=space;
  const target=solve(anchor,desired,options),dt=clamp(Number.isFinite(options.dt)?options.dt:0,0,.1);
  const snap=!!options.snap||!previous||transition||distance(previous,anchor)>35;
  const proposed=snap?target.position:mix(previous,target.position,1-Math.exp(-dt*8));
  // Recheck AFTER smoothing. Otherwise the old camera can remain inside a
  // newly encountered wall even though the desired position is collision-free.
  const safe=solve(anchor,proposed,options);previous={...safe.position};
  last={anchor:{...anchor},desired:{...desired},position:{...previous},distance:distance(anchor,previous),desiredDistance:distance(anchor,desired),obstacle:target.obstacle||safe.obstacle,occluded:!!(target.obstacle||safe.obstacle),level:options.level||0,room:options.roomId||null,transition,clearance:radius,valid:finite(previous)};
  return {...previous};
 }
 return {update,solve,reset(){previous=null;lastSpace=null;},inspect:()=>({...last,position:last.position?{...last.position}:null})};
}
