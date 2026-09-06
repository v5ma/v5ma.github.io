/* Ride Lab runs a separate copy of the LIVE two-face rail dynamics. A trace is
 * an explicit input scenario, not a proof of reachability or an autopilot.
 * No player, save, score, global collision mode or telemetry is modified. */
(function(root){
 'use strict';
 const VERSION='ride-lab-1',W=root.WorkshopCore,B=root.BezierCore;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
 const unit=v=>{const l=Math.hypot(...v);if(l<1e-6)throw Error('Endpoint has no usable tangent.');return v.map(x=>x/l);};
 const center=p=>[p.x+p.w/2,p.y+p.h/2];
 const DEFAULT_SOLIDS=[1,2,3,9,10,31,32,33,67,84];
 function compile(doc,solidIDs=DEFAULT_SOLIDS){
  W.validate(doc);if(doc.paths.reduce((n,p)=>n+p.points.length,0)>32000)throw Error('Analyze a smaller draft: at most 32000 curve points per rehearsal.');
  const rails=doc.paths.map((p,i)=>{const t=root.GrappleCore.rail(p.points,{...p.meta,id:p.meta?.id||'draft-'+i});t.custom=true;t.index=i;const b=W.bounds([p]);t.bounds={x:b.x-110,y:b.y-110,x2:b.x+b.w+110,y2:b.y+b.h+110};return t;});
  const ids=new Set(solidIDs),at=(x,y)=>{const a=Math.floor(x/36),b=Math.floor(y/36);return a>=0&&b>=0&&a<doc.w&&b<doc.h&&ids.has(doc.cells[b*doc.w+a]);};
  return {rails,at,w:doc.w*36,h:doc.h*36};
 }
 function neighborhood(world,a,b){const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),x2=Math.max(a[0],b[0]),y2=Math.max(a[1],b[1]);return world.rails.filter(t=>t.bounds.x<=x2&&t.bounds.x2>=x&&t.bounds.y<=y2&&t.bounds.y2>=y);}
 function terrain(a,b,at){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));for(let k=0;k<=n;k++){const f=k/n,x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;for(const [dx,dy]of[[0,0],[-12,-14],[12,-14],[-12,14],[12,14]])if(at(x+dx,y+dy))return [x,y];}return null;}
 function deckWarning(a,b,rails,depth){
  // A 12-pixel body circle against the material behind each rail face. This
  // conservative audit warns about cross-throughs the contact engine can miss.
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));
  for(const t of rails)for(let j=1;j<t.pts.length;j++){
   const u=t.pts[j-1],v=t.pts[j],dx=v[0]-u[0],dy=v[1]-u[1],l=Math.hypot(dx,dy);if(l<.001)continue;
   const tx=dx/l,ty=dy/l,deep=depth(t);
   for(let k=0;k<=n;k++){const f=k/n,x=a[0]+(b[0]-a[0])*f-u[0],y=a[1]+(b[1]-a[1])*f-u[1],along=x*tx+y*ty,normal=x*ty-y*tx;
    const d=Math.hypot(Math.max(0,-along,along-l),Math.max(0,normal,-deep-normal));
    if(d<11.8)return {id:t.sky.id,at:[x+u[0],y+u[1]]};
   }
  }return null;
 }
 function seed(world,settings){
  const index=Number(settings.index??0),t=world.rails[index];if(!t)throw Error('Select an existing rail.');
  if(t.sky.kind!=='open')throw Error('Timed legacy loops use a different controller. Rehearse an open/custom rail instead.');
  const speed=Number(settings.speed??14),fraction=Number(settings.fraction??.15),face=Number(settings.face??1);
  if(!Number.isFinite(speed)||Math.abs(speed)>28||Math.abs(speed)<.1||!Number.isFinite(fraction)||fraction<0||fraction>1||![1,-1].includes(face))throw Error('Choose a speed of 0.1-28, a valid position and a rail face.');
  return {x:0,y:0,w:26,h:30,vx:0,vy:0,track:t,trackS:t.len*fraction,speed,_railFace:face,trackCD:0,_airTicks:0,nitroT:settings.nitro?55:0,roll:0,_gripSlow:0};
 }
 function trace(doc,settings={},liveSeed=null){
  const world=compile(doc,settings.solids),fork=root.RailGripCore.create(),K=fork.physics;
  fork.grip.configure({mode:settings.mode||'forgiving',solid:world.at});
  const max=Number(settings.ticks??600);if(!Number.isInteger(max)||max<1||max>900)throw Error('Rehearsal limit is 1-900 physics ticks.');
  if(!['forward','reverse','coast'].includes(settings.control||'forward'))throw Error('Unknown control policy.');
  let p;
  if(liveSeed){
   const {railIndex,...fields}=liveSeed;p={...fields,peg:fields.peg?{...fields.peg}:null,track:railIndex===null?null:world.rails[railIndex]};
   if(![p.x,p.y,p.vx,p.vy,p.w,p.h].every(Number.isFinite)||p.w<=0||p.h<=0)throw Error('Invalid observed rider state.');
   if(p.peg){K.release(p);p._railAir=true;}
   if(p.track?.sky.kind!=='open'&&p.track)throw Error('Timed loops are not predicted.');
  }else{p=seed(world,settings);K.pose(p,p.track,p.trackS);}
  const policy={right:(settings.control||'forward')==='forward',left:settings.control==='reverse'};
  const frames=[],events=[],visited=new Set();let blockedId=null,status='horizon',warning=null;
  const save=tick=>{const [x,y]=center(p);frames.push({tick,x,y,vx:p.vx,vy:p.vy,rail:p.track?.sky.id||null,face:p.track?p._railFace:null});};
  if(p.track)visited.add(p.track.sky.id);save(0);
  for(let tick=1;tick<=max;tick++){
   const old={x:p.x,y:p.y},a=center(p),tr=p.track;
   if(p.trackCD>0)p.trackCD--;
   if(p.nitroT>0){p.nitroT--;if(tr)p.speed=Math.sign(p.speed||1)*Math.min(28,Math.abs(p.speed)+.4);else{const s=Math.hypot(p.vx,p.vy),nx=s>.5?p.vx/s:1,ny=s>.5?p.vy/s:0;p.vx=nx*Math.min(28,s+.24);p.vy=ny*Math.min(28,s+.24);}}
   if(tr){
    if(tr.sky.kind!=='open'){status='unsupported-timed-loop';break;}
    const exit=K.ride(p,{...policy,jump:!!settings.jump&&tick===1});
    if(exit){blockedId=tr.sky.id;p._airTicks=0;events.push({type:'exit',tick,id:blockedId,face:frames.at(-1).face,speed:p.speed,reason:exit.type});}
   }else{
    K.flight(p,policy);p._airTicks=(p._airTicks||0)+1;
    const b=center(p),tile=terrain(a,b,world.at);
    if(tile){save(tick);status=p.vy>0?'terrain-landing':'terrain-blocked';warning={at:tile};break;}
    const near=neighborhood(world,a,b),beforeSpeed=Math.hypot(p.vx,p.vy),hit=K.catchRail(p,old,near,blockedId);
    if(hit){visited.add(hit.tr.sky.id);events.push({type:'catch',tick,id:hit.tr.sky.id,face:hit.face,speed:p.speed,retention:Math.abs(p.speed)/(beforeSpeed||1),assist:hit.assist,airTicks:p._airTicks});blockedId=null;p._airTicks=0;}
   }
   const b=center(p),tile=terrain(a,b,world.at),near=neighborhood(world,a,b),collision=deckWarning(a,b,near,fork.grip.depth);
   save(tick);
   if(tile){status='terrain-blocked';warning={at:tile};break;}
   if(collision){status='clearance-warning';warning=collision;break;}
   if(p.x<0||p.x>world.w-p.w||p.y<0||p.y>world.h-p.h){status='world-edge';break;}
   if(p.track&&Math.abs(p.speed)<.05){status='stopped';break;}
  }
  return {version:VERSION,settings:{...settings},status,warning,events,frames,visited:[...visited],ticks:frames.at(-1).tick,scope:'Empty-rail scenario using live grip/ride/flight functions and conservative terrain/deck clearance. Ends on terrain. No enemies, pickups, moving platforms, timed loops or automatic whip casting.'};
 }
 function compare(doc,settings){const speed=Math.abs(Number(settings.speed??14)),sign=Math.sign(Number(settings.speed??14));const speeds=[...new Set([-2,-1,0,1,2].map(d=>Math.round(clamp(speed+d,.1,28)*10)/10*sign))];return speeds.map(s=>trace(doc,{...settings,speed:s}));}
 function endpoints(p){const nodes=p.bezier,pts=p.points;let out,incoming;
  if(nodes){incoming=nodes[0].o;out=nodes.at(-1).i.map(v=>-v);}
  if(!incoming||Math.hypot(...incoming)<.001)incoming=sub(pts[1],pts[0]);
  if(!out||Math.hypot(...out)<.001)out=sub(pts.at(-1),pts.at(-2));
  return {start:{p:pts[0],v:unit(incoming)},end:{p:pts.at(-1),v:unit(out)}};
 }
 function smoothJoin(doc,indices){
  if(indices.length!==2||indices[0]===indices[1]||indices.some(i=>!Number.isInteger(i)||!doc.paths[i]))throw Error('Shift-select exactly two different open rails.');
  const [i,j]=[...indices].sort((a,b)=>a-b),original=[doc.paths[i],doc.paths[j]];
  if(original.some(p=>p.meta?.kind!=='open'))throw Error('Timed legacy loops cannot be silently converted by joining.');
  const choices=[];
  for(const ra of[false,true])for(const rb of[false,true]){
   const copies=original.map(p=>W.clone(p));
   for(const [k,r]of [[0,ra],[1,rb]])if(r){if(copies[k].bezier)B.reverse(copies[k]);else copies[k].points.reverse();}
   const a=endpoints(copies[0]).end,b=endpoints(copies[1]).start,gap=Math.hypot(...sub(b.p,a.p));choices.push({copies,a,b,gap});
  }
  choices.sort((a,b)=>a.gap-b.gap);const {copies,a,b,gap}=choices[0];
  if(gap<8)throw Error('Endpoints are already close. Use the straight join for a touching seam.');
  if(gap>600)throw Error('Move endpoints within 600 world pixels before creating a bridge.');
  const length=clamp(gap*.34,12,160),nodes=[B.node(a.p,[0,0],a.v.map(v=>v*length),'corner'),B.node(b.p,b.v.map(v=>-v*length),[0,0],'corner')];
  const bridge={points:B.sample(nodes),meta:{kind:'open'},bezier:nodes};
  const world=compile(doc),inner=bridge.points.slice(3,-3);
  for(let k=1;k<inner.length;k++){
   if(terrain(inner[k-1],inner[k],world.at))throw Error('The bridge intersects occupied terrain. Move the endpoints first.');
   for(const t of world.rails)for(let m=1;m<t.pts.length;m++){
    const nearSeam=[a.p,b.p].some(port=>Math.min(Math.hypot(...sub(t.pts[m-1],port)),Math.hypot(...sub(t.pts[m],port)))<20);
    if((t.index===i||t.index===j)&&nearSeam)continue;
    if(root.GrappleCore.sweep(...inner[k-1],...inner[k],...t.pts[m-1],...t.pts[m]))throw Error('The bridge crosses another rail. Move it before joining.');
   }
  }
  for(const p of copies)if(!p.bezier)p.bezier=B.convert(p).bezier;
  const left=copies[0].bezier.at(-1),right=copies[1].bezier[0];left.o=nodes[0].o;right.i=nodes[1].i;left.mode=right.mode='smooth';
  const joined={...copies[0],bezier:copies[0].bezier.concat(copies[1].bezier),anchors:null,meta:{...original[0].meta,label:'Smooth joined roadway',kind:'open',begin:0,end:1}};delete joined.arc;B.rebuild(joined);
  const next={...doc,paths:[...doc.paths]};next.paths[i]=joined;next.paths.splice(j,1);W.validate(next);
  // Commit only after all validation; a failed operation never damages handles.
  doc.paths=next.paths;W.syncNetwork(doc);return {index:i,gap,tangentAgreement:dot(a.v,unit(nodes[0].o)),bridge:bridge.points};
 }
 root.RideLabCore=Object.freeze({VERSION,compile,trace,compare,smoothJoin,endpoints,terrain,deckWarning});
 if(typeof module!=='undefined')module.exports=root.RideLabCore;
})(globalThis);
