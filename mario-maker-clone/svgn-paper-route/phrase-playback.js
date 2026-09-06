/* Bounded, deterministic geometry rehearsal. It uses the live movement core;
 * it NEVER moves the live player. Evidence excludes enemies and render timing.
 * A path is evaluated with its carried landing state, never a fresh per-edge seed.
 */
(function(root){'use strict';
 const K=root.GrappleCore||(typeof require==='function'&&require('./grapple-core.js'));
 function compile(paths){return paths.map(p=>{const t=K.rail(p.points||p,p.meta||p.sky);t.box={x:Math.min(...t.pts.map(p=>p[0])),y:Math.min(...t.pts.map(p=>p[1])),x2:Math.max(...t.pts.map(p=>p[0])),y2:Math.max(...t.pts.map(p=>p[1]))};return t;});}
 function volumeContacts(c,rails,radius=20){const bad=[];
  for(const tr of rails){const b=tr.box;if(c[0]<b.x-55||c[0]>b.x2+55||c[1]<b.y-55||c[1]>b.y2+55)continue;
   for(let i=1;i<tr.pts.length;i++){const a=tr.pts[i-1],b=tr.pts[i],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<.01)continue;const t=((c[0]-a[0])*dx+(c[1]-a[1])*dy)/l;const n=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/l;const dt=t-Math.max(0,Math.min(l,t)),dn=n-Math.max(-34,Math.min(0,n));if(Math.hypot(dt,dn)<radius){bad.push(tr.sky.id);break;}}
  }return bad;
 }
 function sweepBody(a,b,rails,radius=20){
  const distance=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(distance/5));
  for(let k=1;k<=steps;k++){const c=[a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps];
   for(const tr of rails){const bb=tr.box;if(c[0]<bb.x-56||c[0]>bb.x2+56||c[1]<bb.y-56||c[1]>bb.y2+56)continue;
    for(let i=1;i<tr.pts.length;i++){const p=tr.pts[i-1],q=tr.pts[i],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy);if(l<.01)continue;const tx=dx/l,ty=dy/l,nx=ty,ny=-tx,u=(c[0]-p[0])*tx+(c[1]-p[1])*ty,v=(c[0]-p[0])*nx+(c[1]-p[1])*ny,uc=Math.max(0,Math.min(l,u)),vc=Math.max(-34,Math.min(0,v));let du=u-uc,dv=v-vc,d=Math.hypot(du,dv);if(d>=radius)continue;
     if(d<1e-8){const ends=[{d:u,du:-1,dv:0},{d:l-u,du:1,dv:0},{d:-v,du:0,dv:1},{d:v+34,du:0,dv:-1}].sort((a,b)=>a.d-b.d);du=ends[0].du;dv=ends[0].dv;d=1;}
     const normal=[(du*tx+dv*nx)/d,(du*ty+dv*ny)/d];return {id:tr.sky.id,point:[c[0]+normal[0]*(radius-d+.6),c[1]+normal[1]*(radius-d+.6)],normal,fraction:k/steps};
    }
   }
  }return null;
 }
 function deflect(p,hit){if(p.peg)K.release(p);p.x=hit.point[0]-p.w/2;p.y=hit.point[1]-p.h/2;const dot=p.vx*hit.normal[0]+p.vy*hit.normal[1];if(dot<0){p.vx-=1.20*dot*hit.normal[0];p.vy-=1.20*dot*hit.normal[1];}p.track=null;p.onGround=false;p.trackCD=6;p._networkAir=true;}
 function enter(paths,{entry='m0',speed=7.5,offset=190,ground=2160,jump=-13,gravity=.55,maxTicks=100}={}){
  const rails=compile(paths),tr=rails.find(t=>t.sky.id===entry);if(!tr)throw Error('Missing route entrance');
  const p={w:26,h:30,x:tr.pts[0][0]-offset,y:ground-30,vx:speed,vy:jump,trackCD:0,_airTicks:0,onGround:false,roll:0};
  const trace=[[p.x+13,p.y+15]];
  for(let tick=1;tick<=maxTicks;tick++){
   const old={x:p.x,y:p.y},a=[p.x+13,p.y+15];p.vy=Math.min(13,p.vy+gravity);p.x+=p.vx;p.y+=p.vy;p._airTicks++;
   const hit=K.catchRail(p,old,rails),b=[p.x+13,p.y+15];trace.push(b);
   const contact=sweepBody(a,b,rails);
   if(contact)return {success:false,to:'body-blocked',contact,trace,ticks:tick,speed,offset};
   if(hit)return {success:hit.tr.sky.id===entry,to:hit.tr.sky.id,state:p,trace,ticks:tick,speed,offset};
   if(p.y+p.h>=ground)return {success:false,to:'road',trace,ticks:tick,speed,offset};
  }return {success:false,to:'timeout',trace,speed,offset};
 }
 function run(paths,{entry='m0',speed=7.5,seed=null,brake=null,jump=null,peg=null,castX=4400,releaseAngle=75,windups=1,air='throttle',maxTicks=4000,ground=2160,width=8064,keepFrames=true,solidRoads=false}={}){
  const rails=compile(paths),first=rails.find(r=>r.sky.id===entry);if(!first)throw Error('Missing route entrance');
  let p=seed?{...seed.state,_bside:seed.state._bside?{...seed.state._bside}:null}:{w:26,h:30,x:0,y:0,vx:0,vy:0,speed,track:first,trackS:1,trackCD:0,_airTicks:0,roll:0};if(seed)p.track=rails.find(r=>r.sky.id===seed.to);else K.pose(p,first,1);
  const trace=[],events=[],contacts=[],visited=new Set([entry]),ranges={},rewards=new Set(),turns={};let from=null,jumped=false,casted=false,released=false,airTicks=0;
  function frame(t){const c=[p.x+13,p.y+15];if(keepFrames)trace.push([c[0],c[1],p.vx,p.vy,p.track?.sky.id||null,p.peg?'peg':null,t]);{const v=volumeContacts(c,rails);for(const id of v)if(!contacts.some(a=>a.id===id))contacts.push({id,t,at:c,on:p.track?.sky.id||null});}}
  for(let t=0;t<maxTicks;t++){const previous=[p.x+13,p.y+15];
   if(peg&&!casted&&p.x>=castX&&(p.track?.sky.id==='b0'||from==='b0')){const hit=K.target(p,[peg]);if(hit){K.cast(p,hit);casted=true;events.push({type:'cast',t,x:p.x,y:p.y,r:p.peg.r});}}
   if(p.peg){
    const phase=Math.atan2(Math.sin(p.peg.th),Math.cos(p.peg.th))*180/Math.PI;
    if(p.peg.loops>=windups&&phase>=releaseAngle&&phase<releaseAngle+18){const r=K.release(p);released=true;from='peg';events.push({type:'release',t,...r});}
    else K.swing(p,{right:true});
   }else if(p.track){
    const tr=p.track,id=tr.sky.id;let range=ranges[id]||(ranges[id]={min:p.trackS,max:p.trackS,len:tr.len,ticks:0});range.min=Math.min(range.min,p.trackS);range.max=Math.max(range.max,p.trackS);range.ticks++;
    const left=brake&&brake.surface===id&&tr.len-p.trackS<brake.remaining;
    const hop=jump&&!jumped&&jump.id===id&&p.trackS/tr.len>=jump.fraction;if(hop)jumped=true;
    const exit=K.ride(p,{right:!left,left:!!left,jump:hop});if(exit){from=id;airTicks=0;p._airTicks=0;range.max=Math.max(range.max,tr.len);events.push({type:'launch',id,t,vx:p.vx,vy:p.vy});}
   }else{
    const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;K.flight(p,air==='brake'?{left:true}:air==='coast'?{}:{right:true});p._airTicks++;airTicks++;
    const v={vx:p.vx,vy:p.vy};const hit=K.catchRail(p,old,rails,from);if(hit){const id=hit.tr.sky.id;visited.add(id);rewards.add(id);events.push({type:'catch',from,id,t,airTicks,s:hit.s,fraction:hit.s/hit.tr.len,retention:p.speed/Math.hypot(v.vx,v.vy),speed:p.speed});from=null;airTicks=0;}
    if(!p.track&&p.y+p.h>=ground){frame(t);return finish('road',t+1);}
    if(p.x<0||p.x>width||p.y<0){frame(t);return finish('bounds',t+1);}
   }
   if(solidRoads&&!p.track){const hit=sweepBody(previous,[p.x+13,p.y+15],rails);if(hit){deflect(p,hit);events.push({type:'brush',id:hit.id,t});from=hit.id;}}
   frame(t);
  }
  return finish('timeout',maxTicks);
  function finish(exit,ticks){return {exit,completed:exit==='road',ticks,visited:[...visited],events,contacts,trace,ranges,casted,released,routeCredit:visited.size*100,final:{x:p.x,y:p.y,vx:p.vx,vy:p.vy}};}
 }
 const api={enter,compile,volumeContacts,sweepBody,deflect,run};root.PhrasePlayback=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
