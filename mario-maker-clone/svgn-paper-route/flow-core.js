/* Flow Lab: physics-aware, finite-sample route certificates.
 * This is a development model, not a mathematical proof of every input.
 * Actual rail riding, flight, contact, whip and release come from GrappleCore.
 * No nearest-neighbor lines are presented as traversable edges.
 */
(function(root){
  'use strict';
  const K=root.GrappleCore||(typeof require==='function'?require('./grapple-core.js'):null);
  if(!K)throw Error('FlowCore requires GrappleCore');
  const VERSION='flow-phrases-2';
  const DEFAULTS={speeds:[10,12,14,16,18,19],clearance:76,bodyRadius:18,maxFlight:180,minimumRetention:.30,robustFraction:.75};
  const controls={throttle:{right:true},coast:{},brake:{left:true}};
  const clone=o=>JSON.parse(JSON.stringify(o));
  function pointSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(l||1)));return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);}
  function segmentDistance(a,b,c,d){if(K.sweep(...a,...b,...c,...d))return 0;return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b));}
  function bounds(pts){let x=Infinity,y=Infinity,x2=-Infinity,y2=-Infinity;for(const p of pts){x=Math.min(x,p[0]);x2=Math.max(x2,p[0]);y=Math.min(y,p[1]);y2=Math.max(y2,p[1]);}return {x,y,x2,y2,w:x2-x,h:y2-y};}
  function gapBounds(a,b){return Math.hypot(Math.max(0,a.x-b.x2,b.x-a.x2),Math.max(0,a.y-b.y2,b.y-a.y2));}
  function compile(paths){if(!Array.isArray(paths)||paths.length>192)throw Error('Flow analysis supports 192 surfaces per pass.');const used=new Set();let total=0;return paths.map((v,i)=>{const pts=v.points||v.pts||v,tag=v.meta||v.sky||{id:'curve-'+i};if(!Array.isArray(pts)||pts.length<2||pts.length>6000||pts.some(p=>!Array.isArray(p)||p.length<2||!p.every(Number.isFinite)))throw Error('Invalid curve '+i);if(tag.kind!=='open'&&Number.isFinite(tag.begin)&&tag.begin>0&&tag.end<1)throw Error('Timed closed loops require the original loop adapter; select open-rail surfaces for this audit.');total+=pts.length;if(total>16000)throw Error('Analyze a smaller section: at most 16000 vertices per audit.');const id=tag.id||'curve-'+i;if(used.has(id))throw Error('Duplicate surface ID: '+id);used.add(id);const t=K.rail(pts,{...tag,id,kind:tag.kind||'open'});if(t.len<1)throw Error('Zero-length curve');t.bounds=bounds(pts);return t;});}
  function surfaceConflicts(rails,clearance=DEFAULTS.clearance){const issues=[];for(let i=0;i<rails.length;i++)for(let j=i+1;j<rails.length;j++){
    const a=rails[i],b=rails[j];if(gapBounds(a.bounds,b.bounds)>=clearance)continue;let best=Infinity,where=null;
    for(let k=1;k<a.pts.length;k++)for(let m=1;m<b.pts.length;m++){const d=segmentDistance(a.pts[k-1],a.pts[k],b.pts[m-1],b.pts[m]);if(d<best){best=d;where=[(a.pts[k][0]+b.pts[m][0])/2,(a.pts[k][1]+b.pts[m][1])/2];}}
    if(best<clearance)issues.push({from:a.sky.id,to:b.sky.id,kind:best<.001?'intersection':'clearance',distance:+best.toFixed(2),required:clearance,where});
  }return issues;}
  function bodyAt(rail,s,speed){const p={w:26,h:30,x:0,y:0,vx:0,vy:0,speed,track:rail,trackS:s,roll:0,trackCD:0,_airTicks:0};K.pose(p,rail,s);return p;}
  const center=p=>[p.x+p.w/2,p.y+p.h/2];
  function solidAt(doc,x,y){const tx=Math.floor(x/36),ty=Math.floor(y/36);return tx>=0&&ty>=0&&tx<doc.width&&ty<doc.height&&doc.solids.has(doc.cells[ty*doc.width+tx]);}
  function environment(course){if(!course||!Number.isInteger(course.width)||!Number.isInteger(course.height)||course.width<1||course.width>1024||course.height<1||course.height>512||!Number.isFinite(course.ground))throw Error('Invalid course dimensions or ground plane.');if(course.cells&&course.cells.length!==course.width*course.height)throw Error('Tile data size mismatch');const solids=new Set(course.solidIDs||[1,2,3,9,10,31,32,33,67,84]);return {...course,solids,ground:course.ground*36};}
  function blockedTile(a,b,doc,radius=12){if(!doc.cells)return false;const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/6));for(let i=1;i<=steps;i++){const x=a[0]+(b[0]-a[0])*i/steps,y=a[1]+(b[1]-a[1])*i/steps;for(const [dx,dy]of[[0,0],[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]])if(solidAt(doc,x+dx,y+dy))return true;}return false;}
  function corridorConflicts(trace,rails,exclude=[]){const skip=new Set(exclude),hits=[];for(const t of rails){if(skip.has(t.sky.id))continue;let closest=Infinity;for(let i=1;i<trace.length;i++){const a=trace[i-1],b=trace[i];if(gapBounds(bounds([a,b]),t.bounds)>60)continue;for(let j=1;j<t.pts.length;j++){const d=segmentDistance(a,b,t.pts[j-1],t.pts[j]);closest=Math.min(closest,d);}}if(closest<DEFAULTS.bodyRadius+34)hits.push({surface:t.sky.id,distance:+closest.toFixed(2)});}return hits;}
  function flight(p,rails,doc,policy='throttle',blockedId=null,limit=180){const trace=[center(p)];let hit=null;for(let tick=0;tick<limit;tick++){
    const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;K.flight(p,controls[policy]);p._airTicks++;const before={vx:p.vx,vy:p.vy};
    hit=K.catchRail(p,old,rails,blockedId);trace.push(center(p));
    if(hit&&blockedTile(trace.at(-2),trace.at(-1),doc))return {to:'blocked',state:p,ticks:tick+1,trace};
    if(hit){const incoming=Math.hypot(before.vx,before.vy),retention=Math.max(0,p.speed)/(incoming||1);return {to:hit.tr.sky.id,state:p,ticks:tick+1,trace,landingS:hit.s,landingFraction:hit.s/hit.tr.len,incomingSpeed:incoming,landingSpeed:p.speed,retention,impactAngle:Math.acos(Math.min(1,Math.max(-1,p.speed/(incoming||1))))*180/Math.PI};}
    if(p.y+p.h>=doc.ground)return {to:'road',state:p,ticks:tick+1,trace};
    if(blockedTile(trace.at(-2),trace.at(-1),doc))return {to:'blocked',state:p,ticks:tick+1,trace};
    if(p.x<-100||p.x>doc.width*36+100||p.y<0)return {to:'out-of-bounds',state:p,ticks:tick+1,trace};
  }return {to:'timeout',state:p,ticks:limit,trace};}
  function departure(t,speed,rails,doc,policy='throttle'){
    const p=bodyAt(t,t.len,speed),q=K.sample(t,t.len);p.track=null;p.onGround=false;p.trackCD=6;p.vx=q.tx*speed;p.vy=q.ty*speed;
    const result=flight(p,rails,doc,policy,t.sky.id);result.launchSpeed=speed;result.policy=policy;result.from=t.sky.id;return result;
  }
  function entrySamples(t,rails,doc){const list=[],first=t.pts[0];if(!t.sky.entry)return list;
    // Default rider, native platform jump (held), no double jump or nitro.
    for(const speed of [6,7.5,9])for(const offset of [70,90,110,130,150,170]){
      const p={x:first[0]-offset,y:doc.ground-30,w:26,h:30,vx:speed,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};let result=null,trace=[center(p)];
      for(let tick=0;tick<80;tick++){const old={x:p.x,y:p.y};p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;p._airTicks++;const h=K.catchRail(p,old,rails);trace.push(center(p));if(h){result={to:h.tr.sky.id,state:p,ticks:tick+1,trace,speed,offset};break;}if(p.y+p.h>=doc.ground||blockedTile(trace.at(-2),trace.at(-1),doc))break;}
      if(result&&result.to===t.sky.id)list.push(result);
    }return list;
  }
  function analyze(course,options={}){
    const opt={...DEFAULTS,...options};if(!Array.isArray(opt.speeds)||opt.speeds.length<1||opt.speeds.length>24||opt.speeds.some(s=>!Number.isFinite(s)||s<=0||s>35)||!Number.isFinite(opt.clearance)||opt.clearance<0||opt.clearance>300)throw Error('Invalid audit sample settings.');const doc=environment(course),rails=compile(course.ct),nodes=rails.map(t=>({id:t.sky.id,label:t.sky.label||t.sky.id,shape:t.sky.shape||'custom',entry:!!t.sky.entry,bounds:t.bounds,length:t.len,start:K.sample(t,0),exit:K.sample(t,t.len)})),edges=[],entries=[];
    const conflicts=surfaceConflicts(rails,opt.clearance);
    for(const t of rails){const seeds=entrySamples(t,rails,doc);if(t.sky.entry)entries.push({to:t.sky.id,samples:18,successes:seeds.length,rate:seeds.length/18,trace:seeds[0]?.trace||[],settings:seeds.map(s=>({speed:s.speed,offset:s.offset}))});
      for(const policy of ['throttle','coast','brake']){
        const results=opt.speeds.map(s=>departure(t,s,rails,doc,policy));
        for(const target of new Set(results.map(r=>r.to))){if(target===t.sky.id)continue;const valid=results.filter(r=>r.to===target),best=valid[Math.floor(valid.length/2)],blocked=target==='road'?[]:corridorConflicts(best.trace,rails,[t.sky.id,target]);const rate=valid.length/opt.speeds.length,retention=valid.reduce((s,r)=>s+(r.retention??1),0)/valid.length;
          edges.push({id:t.sky.id+'>'+target+':'+policy,from:t.sky.id,to:target,action:policy,samples:opt.speeds.length,successes:valid.length,rate,acceptedSpeeds:valid.map(r=>r.launchSpeed),ticks:best.ticks,landingSpeed:best.landingSpeed??0,retention,landingFraction:best.landingFraction??null,impactAngle:best.impactAngle??null,corridorBlockers:blocked,trace:best.trace,robust:rate>=opt.robustFraction&&retention>=opt.minimumRetention&&!blocked.length,scope:'Finite departure-port sample; not a compositional path proof'});
        }
      }
    }
    function reach(useRobust){const set=new Set(entries.filter(e=>e.successes>0).map(e=>e.to));let changed=true;while(changed){changed=false;for(const e of edges)if(set.has(e.from)&&nodes.some(n=>n.id===e.to)&&!e.corridorBlockers.length&&(!useRobust||e.robust)&&!set.has(e.to)){set.add(e.to);changed=true;}}return [...set];}
    const reached=reach(false),robust=reach(true);return {version:VERSION,limits:opt,scope:'One-sided rail dynamics from GrappleCore; sampled launch states, conservative clearance; ground entries use default platform jump. Peg paths require separate certificates.',nodes,edges,entries,conflicts,reachable:reached,robustReachable:robust,unresolved:nodes.filter(n=>!reached.includes(n.id)).map(n=>n.id),summary:{surfaces:nodes.length,conflicts:conflicts.length,intersections:conflicts.filter(c=>c.kind==='intersection').length,sampledReachable:reached.length,unresolved:nodes.length-reached.length,robustReachable:robust.length,edges:edges.filter(e=>nodes.some(n=>n.id===e.to)&&!e.corridorBlockers.length).length}};
  }
  function replay(rails,start,doc,{speed=7.5,maxTicks=5000,flightPolicy='throttle',jumpOn=null,initial=null,brake=null}={}){
    const entryRail=rails.find(t=>t.sky.id===start);if(!entryRail)throw Error('Unknown replay entry');
    let p=initial?{...initial.state,_bside:initial.state._bside?{...initial.state._bside}:null}:bodyAt(entryRail,1,speed);
    let events=[],trace=initial?initial.trace.map(v=>v.slice()):[center(p)],from=null,seen=new Set([start]),flights=[],blockers=[];
    let elapsed=initial?.ticks||0;
    for(let tick=0;tick<maxTicks;tick++){
      if(p.track){const tr=p.track;if(p.trackCD>0)p.trackCD--;const jumped=jumpOn&&jumpOn.id===tr.sky.id&&p.trackS/tr.len>=jumpOn.fraction;
        const left=brake&&brake.surface===tr.sky.id&&tr.len-p.trackS<brake.remaining;
        const out=K.ride(p,{right:!left,left:!!left,jump:!!jumped});elapsed++;trace.push(center(p));
        if(out){from=tr.sky.id;p._airTicks=0;events.push({type:'launch',from,tick:elapsed,at:center(p),speed:Math.hypot(p.vx,p.vy)});}}
      else {const f=flight(p,rails,doc,flightPolicy,from);trace.push(...f.trace.slice(1));tick+=f.ticks-1;elapsed+=f.ticks;
        const blocked=corridorConflicts(f.trace,rails,[from,f.to]);blockers.push(...blocked.map(b=>({...b,from,to:f.to})));
        flights.push({from,to:f.to,ticks:f.ticks,trace:f.trace,landingSpeed:f.landingSpeed,retention:f.retention,landingFraction:f.landingFraction,impactAngle:f.impactAngle,blockers:blocked});
        if(f.to==='road')return {completed:true,exit:'road',events,flights,blockers,trace,visited:[...seen],ticks:elapsed,state:p};
        if(!p.track)return {completed:false,exit:f.to,events,flights,blockers,trace,visited:[...seen],ticks:elapsed,state:p};
        events.push({type:'catch',from,to:f.to,tick:elapsed,landingSpeed:f.landingSpeed,retention:f.retention,airTicks:f.ticks});
        if(seen.has(f.to))return {completed:false,exit:'cycle',events,flights,blockers,trace,visited:[...seen],ticks:elapsed,state:p};seen.add(f.to);}
    }return {completed:false,exit:'timeout',events,flights,blockers,trace,visited:[...seen],ticks:elapsed,state:p};
  }
  function bestRoutes(report,start,maxSteps=24){
    // Reward is credited once per surface. A cycle cannot create infinite reward.
    const outgoing=id=>report.edges.filter(e=>e.from===id&&e.robust&&(e.to==='road'||report.nodes.some(n=>n.id===e.to)));
    let beam=[{at:start,path:[start],seen:new Set([start]),ticks:0,reward:0,score:0}],finished=[];
    for(let i=0;i<maxSteps&&beam.length;i++){const next=[];for(const b of beam)for(const e of outgoing(b.at)){if(b.seen.has(e.to))continue;const seen=new Set(b.seen);seen.add(e.to);const ticks=b.ticks+e.ticks+(report.nodes.find(n=>n.id===b.at)?.length||0)/15,reward=b.reward+(e.to==='road'?0:100),state={at:e.to,path:b.path.concat(e.to),seen,ticks,reward,score:reward-2*ticks/60};if(e.to==='road')finished.push(state);else next.push(state);}beam=next.sort((a,b)=>b.score-a.score).slice(0,48);}
    return finished.sort((a,b)=>b.score-a.score).slice(0,3).map(({seen,...r})=>({...r,scope:'Suggested order from sampled graph; validate actual chained states before publication'}));
  }
  function blueprintKey(course){return JSON.stringify({width:course.width,height:course.height,ground:course.ground,cells:Array.from(course.cells||[]),ct:course.ct.map((p,i)=>({points:p.points||p.pts||Array.from(p),id:(p.meta||p.sky)?.id||'curve-'+i,kind:(p.meta||p.sky)?.kind||'open'}))});}
  function routeCredit(ledger,id,amount){if(!(ledger instanceof Set)||typeof id!=='string'||!Number.isFinite(amount)||amount<0||amount>1000)throw Error('Invalid reward request');if(ledger.has(id))return 0;ledger.add(id);return amount;}
  const api={blueprintKey,routeCredit,VERSION,DEFAULTS,compile,bounds,gapBounds,segmentDistance,pointSegment,surfaceConflicts,bodyAt,center,environment,blockedTile,corridorConflicts,flight,departure,entrySamples,analyze,replay,bestRoutes};root.FlowCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
