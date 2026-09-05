/* Load precomputed fitted geometry. No solver, camera trick or actor
 * repositioning runs while the player rides. Old custom documents still load.
 */
(function(root){'use strict';
 function apply(d,plan,T){
  const ground=d.ground;
  for(let y=1;y<ground-3;y++)for(let x=0;x<d.width;x++)if([T.GEAR,T.PEG,T.MAILBOX,T.SHIELD,T.STAR,T.NITRO].includes(d.cells[y*d.width+x]))d.cells[y*d.width+x]=0;
  d.ct=plan.tracks.map(p=>{const a=p.points.map(q=>[...q]);a.sky={...p.meta};return a;});
  // Remove only elevated solid clutter inside the new reserved riding corridors.
  // The populated street and low obstacle course remain the original design.
  for(let y=1;y<ground-3;y++)for(let x=0;x<d.width;x++){
   const v=d.cells[y*d.width+x];if(![1,2,3,7,9,84].includes(v))continue;
   const q=[x*36+18,y*36+18];
   if(d.ct.some(p=>p.some(a=>Math.hypot(a[0]-q[0],a[1]-q[1])<72)))d.cells[y*d.width+x]=0;
  }
  function put(x,y,t){x=Math.round((x-18)/36);y=Math.round((y-18)/36);if(x<2||x>=d.width-5||y<2||y>=ground-3||d.cells[y*d.width+x])return false;d.cells[y*d.width+x]=t;return true;}
  for(const p of d.ct){const tr=GrappleCore.rail(p);for(let s=50;s<tr.len-30;s+=120){const q=GrappleCore.sample(tr,s);put(q.x+q.nx*24,q.y+q.ny*24,T.GEAR);}}
  for(const p of plan.pegs||[])put(p.x,p.y,T.PEG);
  for(const p of plan.flightRewards||[])put(p[0],p[1],T.GEAR);
  const boxes=[];for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)if(d.cells[y*d.width+x]===T.MAILBOX)boxes.push({x,y});
  d.boxes=boxes;d.mail=boxes.map(b=>b.x);
  d.gp.skyNetwork={...d.gp.skyNetwork,links:plan.links,sectors:plan.sectors,mainIDs:plan.mainIDs,pegCount:(plan.pegs||[]).length,flowVersion:plan.version};
  d.gp.flow={version:1,planID:plan.id,model:'GrappleCore rail/flight 60 Hz',rules:plan.modelHash,clearance:76,scope:'Sampled composed trajectories; full game replay is a separate gate.'};
  d.description='Ride the ground or follow fitted launch-and-catch routes. Optional return curves and reward detours rejoin the main flow.';
  return d;
 }
 root.FlowWorld={apply};
 if(root.FLOW_PLANS&&root.DeliveryCampaign){
  const previous=root.DeliveryCampaign,ground=root.GroundCampaign,cache=new Map();
  const build=(i,T)=>{if(i<4)return previous.build(i,T);return apply(previous.build(i,T),root.FLOW_PLANS.chapters[i-4],T);};
  const ids={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
  root.SkyRoutes.build=build;
  root.DeliveryCampaign=Object.freeze({...previous,build,routes:previous.routes.map((r,i)=>i<4?r:(()=>{const {cells,ct,...meta}=build(i,ids);return meta;})())});
  root.GroundCampaign=Object.freeze({...ground,make:(n,T)=>build(n+4,T),build});
 }
 if(typeof module!=='undefined')module.exports=root.FlowWorld;
})(globalThis);
