/* A route is a graph of motion states, not a line between two nearby shapes.
 * All rail/flight transitions forward-propagate the SAME GrappleCore as play.
 * Evidence is sampled, conditional and invalidated by geometry changes.
 */
(function(root){'use strict';
 const K=root.GrappleCore||require('./grapple-core.js');
 const VERSION='flow-1',SOLID=new Set([1,2,3,9,10,31,32,33,67,84]),DEFAULTS=Object.freeze({clearance:76,speeds:[12,16,19],maxTicks:360,maxStates:900});
 const clone=p=>({...p,_bside:p._bside?{...p._bside}:null,peg:p.peg?{...p.peg}:null});
 function rail(points,tag){const t=K.rail(points,tag||points.sky||{});t.bounds=bounds(points);return t;}
 function actor(t,s=1,speed=16){const p={w:26,h:30,x:0,y:0,vx:0,vy:0,speed,track:t,trackS:s,trackCD:0,_airTicks:0,onGround:false,roll:0};K.pose(p,t,s);return p;}
 function id(t){return t.sky.id;}
 function fingerprint(d){let h=2166136261;const data=JSON.stringify([VERSION,K.G,K.OFFSET,d.extra?.gp?.ground??d.gp?.ground??60,d.w??d.width,d.h??d.height,Array.from(d.cells||[]),(d.paths||d.ct||[]).map(p=>[p.points||p,p.meta||p.sky])]);for(let i=0;i<data.length;i++){h^=data.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
 function bounds(points){let x=Infinity,y=Infinity,X=-Infinity,Y=-Infinity;for(const p of points){x=Math.min(x,p[0]);y=Math.min(y,p[1]);X=Math.max(X,p[0]);Y=Math.max(Y,p[1]);}return {x,y,w:X-x,h:Y-y};}
 function pointSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
 function segmentDistance(a,b,c,d){const q=K.sweep(...a,...b,...c,...d);if(q)return 0;return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b));}
 function separation(a,b,stop=0){const A=bounds(a),B=bounds(b);if(A.x>B.x+B.w+stop||B.x>A.x+A.w+stop||A.y>B.y+B.h+stop||B.y>A.y+A.h+stop)return Infinity;let m=Infinity;for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++){m=Math.min(m,segmentDistance(a[i-1],a[i],b[j-1],b[j]));if(m===0)return 0;}return m;}
 function overlaps(rails,clearance=DEFAULTS.clearance){const r=[];for(let i=0;i<rails.length;i++)for(let j=i+1;j<rails.length;j++){const d=separation(rails[i].pts,rails[j].pts,clearance);if(d<clearance)r.push({a:id(rails[i]),b:id(rails[j]),distance:+d.toFixed(1),kind:d<.01?'crossing':'clearance'});}return r;}
 function tileContact(d,p){if(!d?.cells)return false;const w=d.w??d.width,h=d.h??d.height;for(let y=Math.floor(p.y/36);y<=Math.floor((p.y+p.h-.01)/36);y++)for(let x=Math.floor(p.x/36);x<=Math.floor((p.x+p.w-.01)/36);x++)if(x>=0&&x<w&&y>=0&&y<h&&SOLID.has(d.cells[y*w+x]))return true;return false;}
 function trace(start,rails,opts={}){
  const p=clone(start),source=p.track&&id(p.track),points=[[p.x+p.w/2,p.y+p.h/2]],actions=[],ground=opts.ground??3000,doc=opts.doc;
  let launched=!p.track,air=0,launch=null,minRetention=1,mode=opts.mode||'throttle',jumped=false;
  for(let tick=0;tick<(opts.maxTicks||DEFAULTS.maxTicks);tick++){
   const old={x:p.x,y:p.y},q=p.track&&K.sample(p.track,p.trackS);
   let input={right:true};
   if(p.track){
    if(mode==='brake')input={left:true};
    if(!jumped&&opts.jumpAt!=null&&p.trackS>=p.track.len*opts.jumpAt){input.jump=true;jumped=true;}
    if(p.trackCD>0)p.trackCD--;
    const result=K.ride(p,input);
    if(result){launched=true;launch={x:p.x,y:p.y,vx:p.vx,vy:p.vy,speed:Math.hypot(p.vx,p.vy),tick};}
   }else{
    air++;
    if(mode==='coast')input={};
    if(mode==='brake-air'&&air<=(opts.brakeTicks||24))input={left:true};
    if(p.trackCD>0)p.trackCD--;p._airTicks++;
    const before={vx:p.vx,vy:p.vy};
    K.flight(p,input);
    // Terrain failure and safety landing are distinct from rail catches.
    if(p.y+p.h>=ground&&p.vy>=0&&(!doc?.cells||SOLID.has(doc.cells[Math.floor(ground/36)*(doc.w??doc.width)+Math.floor((p.x+13)/36)]))){points.push([p.x+13,ground-15]);return {status:'ground',source,p,ticks:tick+1,airTicks:air,points,launch,mode,jumpAt:opts.jumpAt??null};}
    if(doc&&tileContact(doc,p))return {status:'blocked',source,p,ticks:tick+1,airTicks:air,points,launch,mode};
    const x0=Math.min(old.x,p.x)-32,x1=Math.max(old.x,p.x)+p.w+32,y0=Math.min(old.y,p.y)-32,y1=Math.max(old.y,p.y)+p.h+32;
    const nearby=rails.filter(t=>{const b=t.bounds||bounds(t.pts);return b.x<=x1&&b.x+b.w>=x0&&b.y<=y1&&b.y+b.h>=y0;});
    const hit=K.catchRail(p,old,nearby,source);
    if(hit){const retention=Math.abs(p.speed)/Math.max(.1,Math.hypot(before.vx,before.vy));minRetention=Math.min(minRetention,retention);points.push([p.x+13,p.y+15]);return {status:'caught',source,target:id(hit.tr),p,ticks:tick+1,airTicks:air,points,launch,retention:minRetention,mode,jumpAt:opts.jumpAt??null};}
   }
   if(tick%2===0)points.push([p.x+13,p.y+15]);
   if(!Number.isFinite(p.x+p.y)||p.x<-100||p.x>(opts.worldWidth||24000)+100||p.y<-200)return {status:'bounds',source,p,ticks:tick+1,points,launch,mode};
  }
  return {status:launched?'missed':'stalled',source,p,ticks:opts.maxTicks||DEFAULTS.maxTicks,points,launch,mode};
 }

 function groundSeed(t,rails,ground,doc){
  const x=t.pts[0][0],found=[];
  // Default EUC at normal speed, held jump, platform gravity .55.
  // This is a bounded entry model; native replay is the separate release gate.
  for(const offset of [-110,-80,-50,-20,10])for(const speed of [7.5,9.2]){
   const p={w:26,h:30,x:x+offset,y:ground-30-.01,vx:speed,vy:-13,track:null,trackCD:0,_airTicks:0,onGround:false,roll:0};
   const pts=[[p.x+13,p.y+15]];
   for(let tick=0;tick<55;tick++){
    const old={x:p.x,y:p.y};p.vy=Math.min(18,p.vy+.55);p.x+=p.vx;p.y+=p.vy;pts.push([p.x+13,p.y+15]);p._airTicks++;
    if(p.y+p.h>=ground&&p.vy>0)break;
    if(doc&&tileContact(doc,p))break;
    const hit=K.catchRail(p,old,rails);if(hit){if(id(hit.tr)===id(t))found.push({p:clone(p),offset,speed,ticks:tick+1,points:pts});break;}
   }
  }return found;
 }
 function witnesses(d,options={}){
  const rs=(d.paths||d.ct).map((p,i)=>rail(p.points||p,{...(p.meta||p.sky),id:(p.meta||p.sky)?.id||'track-'+i})),ground=(d.extra?.gp?.ground??d.gp?.ground??60)*36,width=(d.w??d.width)*36;
  const queue=[],seen=new Set(),routes={},transitions=[],entries=[];
  for(const t of rs.filter(t=>t.sky.entry||(ground-t.pts[0][1]>0&&ground-t.pts[0][1]<190))){const seeds=groundSeed(t,rs,ground,d);if(seeds.length){const s=seeds[0];entries.push({id:id(t),offset:s.offset,speed:s.speed,ticks:s.ticks,points:s.points,samplePasses:seeds.length,sampleTotal:10});for(const seed of seeds)queue.push({p:seed.p,steps:[],entry:id(t),entrySpec:{offset:seed.offset,speed:seed.speed}});}}
  for(let at=0;at<queue.length&&seen.size<(options.maxStates||DEFAULTS.maxStates);at++){
   const item=queue[at],t=item.p.track,key=id(t)+':'+Math.floor(item.p.trackS/24)+':'+Math.floor(item.p.speed/2);
   if(seen.has(key))continue;seen.add(key);
   if(!routes[id(t)])routes[id(t)]={entry:item.entry,entrySpec:item.entrySpec,controls:item.steps,arrival:{s:item.p.trackS,speed:item.p.speed}};
   for(const plan of plans()){
    const r=trace(item.p,rs,{...plan,ground,worldWidth:width,doc:d});
    if(r.status==='caught'&&r.target!==id(t)&&r.p.speed>1){
     transitions.push({from:id(t),to:r.target,control:plan,route:{entry:item.entry,entrySpec:item.entrySpec,controls:item.steps},start:{s:item.p.trackS,speed:item.p.speed},witness:compact(r)});
     if(item.steps.length<18)queue.push({p:r.p,steps:[...item.steps,{from:id(t),to:r.target,...plan}],entry:item.entry,entrySpec:item.entrySpec});
    }else if(r.status==='ground')transitions.push({from:id(t),to:'road',control:plan,route:{entry:item.entry,entrySpec:item.entrySpec,controls:item.steps},start:{s:item.p.trackS,speed:item.p.speed},witness:compact(r)});
   }
  }
  const ids=rs.map(id),reached=new Set(Object.keys(routes)),seenTransitions=new Map();
  for(const e of transitions){const k=e.from+'>'+e.to+':'+e.control.mode+':'+(e.control.jumpAt||0);if(!seenTransitions.has(k))seenTransitions.set(k,e);}
  return {entries,routes,transitions:[...seenTransitions.values()],reached:[...reached],unproven:ids.filter(x=>!reached.has(x)),states:seen.size,truncated:seen.size>=(options.maxStates||DEFAULTS.maxStates),stateLimit:options.maxStates||DEFAULTS.maxStates};
 }

 function propose(d,sourceID,options={}){
  const rs=(d.paths||[]).map(p=>rail(p.points,p.meta)),source=rs.find(t=>id(t)===sourceID);
  if(!source||source.sky.kind!=='open')throw Error('Select one open roadway.');
  const ground=(d.extra?.gp?.ground||60)*36,width=d.w*36,plan={mode:'throttle',...(options.jump?{jumpAt:.82}:{})},start=actor(source,Math.min(source.len*.2,80),16);
  const free=trace(start,[],{...plan,ground,worldWidth:width});if(!free.launch)throw Error('The selected track has no sampled forward exit.');
  const launch=free.launch,p={w:26,h:30,x:launch.x,y:launch.y,vx:launch.vx,vy:launch.vy,track:null};
  function curve(a,b,c,e,n=24){return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*e[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*e[1]];});}
  let best=null;
  for(let tick=0;tick<80;tick++){
   K.flight(p,{right:true});if(tick<18||tick%4||p.vy<0)continue;
   const x=p.x+13,y=p.y+15+24;
   const points=curve([x-130,y-105],[x-100,y-20],[x-40,y],[x+70,y]).concat(curve([x+70,y],[x+150,y],[x+180,y-30],[x+210,y-80]).slice(1));
   const b=bounds(points);if(b.x<20||b.x+b.w>width-30||b.y<40||b.y+b.h>ground-60)continue;
   if(rs.some(t=>separation(points,t.pts,DEFAULTS.clearance)<DEFAULTS.clearance))continue;
   const meta={version:1,kind:'open',id:'proposal',stage:0,begin:0,end:1,label:'Fitted receiving ramp',network:!!source.sky.network,tier:source.sky.tier||2,sector:source.sky.sector||0,optional:true};
   const tr=rail(points,meta),rr=[...rs,tr],r=trace(start,rr,{...plan,ground,worldWidth:width,doc:d});
   if(r.target!=='proposal'||r.retention<.4)continue;
   const speeds=[];for(const v of [14,16,18,19])if(trace(actor(source,start.trackS,v),rr,{...plan,ground,worldWidth:width,doc:d}).target==='proposal')speeds.push(v);
   if(speeds.length<3)continue;
   best={points,meta,anchors:null,fingerprint:fingerprint(d),evidence:{entryAssumed:true,start:{s:start.trackS,speed:16},control:plan,speeds,attempts:4,witness:compact(r)}};break;
  }
  if(!best)throw Error('No clear receiver found in the sampled launch corridor. Make space or reshape the lip.');
  return best;
 }
 function plans(){return [{mode:'throttle'},{mode:'coast'},{mode:'brake-air',brakeTicks:20},{mode:'brake-air',brakeTicks:32},{mode:'throttle',jumpAt:.55},{mode:'throttle',jumpAt:.70},{mode:'throttle',jumpAt:.85},{mode:'throttle',jumpAt:.9}];}
 function compact(r){return {source:r.source,target:r.target||null,status:r.status,mode:r.mode,jumpAt:r.jumpAt??null,ticks:r.ticks,airTicks:r.airTicks||0,retention:r.retention??null,start:r.points[0],end:r.points.at(-1),points:r.points,launch:r.launch||null,arrival:r.p.track?{track:r.target,s:r.p.trackS,speed:r.p.speed,vx:r.p.vx,vy:r.p.vy}:null};}
 function audit(d,options={}){
  const rails=(d.paths||d.ct||[]).map((p,i)=>rail(p.points||p,{...(p.meta||p.sky),id:(p.meta||p.sky)?.id||'track-'+i})),ground=(d.extra?.gp?.ground??d.gp?.ground??60)*36,edges=[],issues=overlaps(rails),nodes=rails.map(t=>({id:id(t),label:t.sky.label||id(t),entry:!!t.sky.entry,bounds:bounds(t.pts),length:t.len,kind:t.sky.kind||'legacy',network:!!t.sky.network}));
  for(const t of rails){
   if(t.sky.kind!=='open')continue;
   const groups=new Map();
   for(const speed of options.speeds||DEFAULTS.speeds)for(const plan of plans()){
    const r=trace(actor(t,Math.min(36,t.len*.06),speed),rails,{...plan,ground,doc:d,worldWidth:(d.w??d.width)*36});
    if(r.status!=='caught'&&r.status!=='ground')continue;
    const key=(r.target||'road')+':'+plan.mode+':'+(plan.jumpAt||0);let group=groups.get(key);
    if(!group){group={from:id(t),to:r.target||'road',control:plan.mode,jumpAt:plan.jumpAt??null,samples:0,speeds:[],witness:compact(r)};groups.set(key,group);}
    group.samples++;group.speeds.push(speed);
   }
   edges.push(...groups.values());
  }
  const reach=new Set(nodes.filter(n=>n.entry).map(n=>n.id));let changed=true;while(changed){changed=false;for(const e of edges)if(reach.has(e.from)&&e.to!=='road'&&!reach.has(e.to)){reach.add(e.to);changed=true;}}
  // This coarse projection is labelled as candidate access. Entry and speed
  // compatibility still need composed-state witnesses / native gameplay.
  const unproven=nodes.filter(n=>!reach.has(n.id)).map(n=>n.id),exits=new Set(edges.filter(e=>e.to==='road').map(e=>e.from));changed=true;while(changed){changed=false;for(const e of edges)if(exits.has(e.to)&&!exits.has(e.from)){exits.add(e.from);changed=true;}}
  return {version:VERSION,fingerprint:fingerprint(d),scope:'Bounded rail/flight samples. No proof of all player states, automatic peg routes or enemy timing.',nodes,edges,issues,unproven,noSampledReturn:nodes.filter(n=>!exits.has(n.id)).map(n=>n.id),entryAssumptions:nodes.filter(n=>n.entry).map(n=>n.id),metrics:{surfaces:nodes.length,candidateEdges:edges.length,crossings:issues.filter(x=>x.kind==='crossing').length,clearanceConflicts:issues.length,unprovenAccess:unproven.length},constants:DEFAULTS};
 }
 const api={VERSION,DEFAULTS,rail,actor,clone,bounds,fingerprint,separation,overlaps,tileContact,trace,compact,audit,plans,groundSeed,witnesses,propose};root.RouteFlow=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
