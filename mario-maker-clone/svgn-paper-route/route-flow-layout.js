/* Graph-first level repair. Receiver candidates must fit live motion traces,
 * respect road clearance and preserve already accepted trajectories.
 * Existing unsolved layouts remain importable; play does not use a solver.
 */
(function(root){'use strict';
 const F=root.RouteFlow||require('./route-flow-core.js'),K=root.GrappleCore||require('./grapple-core.js');
 const line=(a,b,n=24)=>Array.from({length:n+1},(_,i)=>[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);
 function bez(a,b,c,d,n=22){return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];});}
 function addPath(points,id,label,extra={}){points.sky={version:1,kind:'open',optional:true,id,stage:0,begin:0,end:1,label,network:true,tier:2,sector:0,...extra};return F.rail(points,points.sky);}
 function position(points,x,y){return points.map(p=>[p[0]+x,p[1]+y]);}
 function receiver(type=0){if(type===0)return bez([-145,-95],[-115,-10],[-55,0],[50,0]).concat(bez([50,0],[145,0],[170,-50],[215,-100]).slice(1));
 if(type===1)return bez([-140,-95],[-100,30],[-60,55],[75,55]).concat(line([75,55],[190,55],8).slice(1));
 if(type===2)return bez([-110,-125],[-120,80],[130,135],[185,-15]);
 if(type===3)return bez([-145,-95],[-115,-10],[-55,0],[50,0]).concat(bez([50,0],[120,0],[175,-160],[150,-220]).slice(1));
 if(type===5){const p=bez([-145,-95],[-115,-10],[-55,0],[50,0]);for(let i=1;i<=60;i++){const a=(90-i/60*210)*Math.PI/180;p.push([50+150*Math.cos(a),-150+150*Math.sin(a)]);}return p;}
 return bez([-120,-130],[-70,-50],[-20,0],[190,0]);}
 function build(course,options={}){
  const ground=course.ground*36,width=course.width*36,old=(course.ct||[]).map(p=>F.rail(p,p.sky)),oldIDs=new Set(course.gp.skyNetwork.mainIDs);
  let rails=old.filter(t=>oldIDs.has(F.id?F.id(t):t.sky.id)); // Existing proven main itinerary, not unattached ornaments.
  const proofs=[],states=new Map(),stats={trials:0,rejectedClearance:0,rejectedInterception:0};
  function trace(p,plan,rs=rails){return F.trace(p,rs,{...plan,ground,worldWidth:width,doc:course,maxTicks:420});}
  const entry=F.actor(rails[0],100,7.5);
  let p=entry;
  states.set(rails[0].sky.id,[F.clone(p)]);
  for(let i=0;i<rails.length+1;i++){const r=trace(p,{mode:'throttle'});if(r.status!=='caught')break;
   proofs.push({from:p.track.sky.id,to:r.target,start:{s:p.trackS,speed:p.speed},control:{mode:'throttle'},witness:F.compact(r)});
   p=r.p;const a=states.get(r.target)||[];if(a.length>=3)break;a.push(F.clone(p));states.set(r.target,a);
  }
  // Never keep a main piece merely because it has a claimed link.
  rails=rails.filter(t=>states.has(t.sky.id));
  function stable(rs){for(const w of proofs){const t=rs.find(t=>t.sky.id===w.from);const r=trace(F.actor(t,w.start.s,w.start.speed),w.control,rs);if((r.target|| (r.status==='ground'?'road':null))!==w.to)return false;}return true;}
  
  // Additional road entrances are roots with an explicit held-jump witness.
  // They are accepted only if clear of the main geometry and its flight paths.
  for(const t of old.filter(t=>t.sky.entry&&!states.has(t.sky.id))){
   if(rails.some(a=>F.separation(t.pts,a.pts,100)<100))continue;
   const seeds=F.groundSeed(t,[...rails,t],ground,course);if(!seeds.length||!stable([...rails,t]))continue;
   rails.push(t);states.set(t.sky.id,[F.clone(seeds[0].p)]);
  }
  const desired=options.target||26;

  for(let pass=0;pass<3&&rails.length<desired;pass++){
   const sources=[...rails];
   for(const source of sources){
    if(rails.length>=desired)break;
    const starts=states.get(source.sky.id)||[];
    const base=starts[0];if(!base)continue;
    let accepted=0;
    for(const plan of [{mode:'throttle',jumpAt:.55},{mode:'throttle',jumpAt:.70},{mode:'throttle',jumpAt:.85},{mode:'brake-air',brakeTicks:32},{mode:'coast'}]){
     if(accepted>=1+pass||rails.length>=desired)break;
     const free=F.trace(base,[],{...plan,ground,worldWidth:width,maxTicks:420});if(!free.launch)continue;
     let shot={w:26,h:30,x:free.launch.x,y:free.launch.y,vx:free.launch.vx,vy:free.launch.vy,track:null,trackCD:6,_airTicks:0};
     const samples=[];for(let tick=0;tick<90;tick++){K.flight(shot,plan.mode==='brake-air'&&tick<32?{left:true}:plan.mode==='coast'?{}:{right:true});if(tick>=15&&tick<=65&&tick%6===0&&shot.vy>-.5)samples.push([shot.x+13,shot.y+15,tick]);}
     let chosen=null;
     for(const [x,y,tick]of samples){for(const type of[5,0,1,2,3,4]){
      const points=position(receiver(type),x,y+24),b=F.bounds(points);if(b.x<450||b.x+b.w>width-400||b.y<280||b.y+b.h>ground-75)continue;
      stats.trials++;
      if(rails.some(t=>F.separation(points,t.pts,90)<90)){stats.rejectedClearance++;continue;}
      const t=addPath(points,'flow-'+rails.length, ['Swooping bypass','Low recovery shelf','Curved return bowl','Partial-loop branch','Straight gallery','C-shaped return'][type],{sector:source.sky.sector,shape:['swoop','recovery','bowl','quarter','gallery','hanging-C'][type],tier:pass?3:2,flow:true});
      const rs=[...rails,t],catchResult=trace(base,plan,rs);if(catchResult.target!==t.sky.id||catchResult.retention<.50||catchResult.p.speed<5)continue;
      const out=trace(catchResult.p,{mode:'throttle'},rs);if(out.status!=='caught'&&!(out.status==='ground'&&(source.sky.entry||pass>=1)))continue; // Branches rejoin another rail or the safe lower route.
      if(!stable(rs)){stats.rejectedInterception++;continue;}
      chosen={t,r:catchResult,out,plan};break;
     }if(chosen)break;}
     if(chosen){
      const {t,r,out,plan}=chosen;rails.push(t);states.set(t.sky.id,[F.clone(r.p)]);
      proofs.push({from:source.sky.id,to:t.sky.id,start:{s:base.trackS,speed:base.speed},control:plan,witness:F.compact(r)});
      proofs.push({from:t.sky.id,to:out.target||'road',start:{s:r.p.trackS,speed:r.p.speed},control:{mode:'throttle'},witness:F.compact(out)});
      accepted++;
     }
    }
   }
  }
  rails.forEach((t,i)=>{t.sky.stage=i;t.pts.sky=t.sky;});
  return {rails,proofs,states,stats,entry:{id:rails[0]?.sky.id,s:100,speed:7.5},oldCount:old.length};
 }
 root.FlowLayout=Object.freeze({build,receiver,bez,line});if(typeof module!=='undefined')module.exports=root.FlowLayout;
})(globalThis);
