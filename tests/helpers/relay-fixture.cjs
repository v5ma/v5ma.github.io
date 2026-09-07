/* Model-only, continuous from a declared road-jump seed. No per-rail resets. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {context,T}=require('./flow-fixture.cjs');
function setup(){const c=context();vm.runInContext(fs.readFileSync(path.join(__dirname,'../../mario-maker-clone/svgn-paper-route/sky-relay.js'),'utf8'),c);return c;}
function compile(c){const d=c.GroundCampaign.make(0,T),fork=c.RailGripCore.create(),K=fork.physics;
 const rails=d.ct.map(p=>{const t=K.rail(p,p.sky);t.bounds={x:Math.min(...p.map(q=>q[0]))-70,y:Math.min(...p.map(q=>q[1]))-70,x2:Math.max(...p.map(q=>q[0]))+70,y2:Math.max(...p.map(q=>q[1]))+70};return t;});return {d,K,fork,rails};}
function clearance(a,b,rails,radius=20){const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5));
 for(const t of rails){const z=t.bounds;if(Math.max(a.x,b.x)<z.x||Math.min(a.x,b.x)>z.x2||Math.max(a.y,b.y)<z.y||Math.min(a.y,b.y)>z.y2)continue;
  for(let j=1;j<t.pts.length;j++){const u=t.pts[j-1],v=t.pts[j],dx=v[0]-u[0],dy=v[1]-u[1],l=Math.hypot(dx,dy);if(l<.01)continue;
   for(let k=0;k<=count;k++){const f=k/count,x=a.x+(b.x-a.x)*f-u[0],y=a.y+(b.y-a.y)*f-u[1],along=(x*dx+y*dy)/l,n=(x*dy-y*dx)/l;if(Math.hypot(along-Math.max(0,Math.min(l,along)),n-Math.max(-34,Math.min(0,n)))<radius-.01)return t.sky.id;}
  }
 }return null;}
function replay({castX=4530,angle=.94,speed=7.5,offset=120,mode='forgiving',coast=false,record=true}={}){
 const c=setup(),{d,K,fork,rails}=compile(c);fork.grip.configure({mode});
 const p={x:500-offset,y:2160-30,w:26,h:30,vx:speed,vy:-13,onGround:false,trackCD:0,_airTicks:0,roll:0};
 let entered=false,cast=false,released=false,from=null,turns=0;const events=[],frames=[],warnings=[];const start={...p};
 for(let tick=0;tick<2000;tick++){
  const a={x:p.x+13,y:p.y+15},old={x:p.x,y:p.y};
  if(entered&&!cast&&!p.track&&from==='m5'&&a.x>=castX){const target=K.target(p,[c.SkyRelay.PEG]);if(target&&K.cast(p,target)){cast=true;events.push({type:'cast',tick,r:p.peg.r,x:a.x,y:a.y});}}
  if(p.trackCD>0)p.trackCD--;
  if(p.peg){const phase=((p.peg.th%(Math.PI*2))+Math.PI*2)%(Math.PI*2);if(p.peg.loops>=1&&phase>=angle&&phase<angle+.14){const r=K.release(p);turns=r.loops;released=true;from='peg';events.push({type:'release',tick,...r});}else K.swing(p,{right:true});}
  else if(p.track){const tr=p.track;if(K.ride(p,{right:true})){from=tr.sky.id;p._airTicks=0;events.push({type:'exit',id:from,tick,vx:p.vx,vy:p.vy});}}
  else {if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:true});p._airTicks++;
   const nearby=rails.filter(t=>t.bounds.x<p.x+50&&t.bounds.x2>p.x-30&&t.bounds.y<p.y+50&&t.bounds.y2>p.y-30),hit=K.catchRail(p,old,nearby,from);
   if(hit){entered=true;events.push({type:'catch',id:hit.tr.sky.id,tick,face:hit.face,speed:p.speed,airTicks:p._airTicks});from=null;p._airTicks=0;}
  }
  const b={x:p.x+13,y:p.y+15},bad=clearance(a,b,rails);if(bad&&!warnings.includes(bad))warnings.push(bad);
  if(p.peg){const rope=clearance({x:p.peg.x,y:p.peg.y},b,rails,2);if(rope&&!warnings.includes('rope:'+rope))warnings.push('rope:'+rope);}
  if(record)frames.push({tick,...b,rail:p.track?.sky.id||null,peg:!!p.peg,vx:p.vx,vy:p.vy});
  if(!p.track&&!p.peg&&p.y+p.h>=2160)return {status:'road',start,events,frames,warnings,cast,released,turns};
  if(p.x<0||p.x>d.width*36||p.y<0)return {status:'bounds',events,frames,warnings,cast,released,turns};
 }
 return {status:'horizon',events,frames,warnings,cast,released,turns};
}
module.exports={setup,T,compile,clearance,replay};
