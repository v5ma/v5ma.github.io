/* Finite design samples. This runs private copies, never the live player. The
 * initial road jump is an explicit model assumption; browsers start at Spawn. */
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../../mario-maker-clone/svgn-paper-route');
global.window=global;global.stepPlayer=()=>{};
for(const f of ['campaign.js','sky-routes.js','grapple-core.js','rail-grip-core.js','open-course.js','ground-courses.js','sky-network-layout.js','sky-post-route.js'])require(path.join(root,f));
const T={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
const document=GroundCampaign.make(0,T),peg=SkyPostRoute.peg;
function bodyChecker(rails){const boxes=rails.map(t=>({t,x:Math.min(...t.pts.map(p=>p[0]))-65,y:Math.min(...t.pts.map(p=>p[1]))-65,x2:Math.max(...t.pts.map(p=>p[0]))+65,y2:Math.max(...t.pts.map(p=>p[1]))+65}));
 return (a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5));for(let s=0;s<=n;s++){const x=a.x+(b.x-a.x)*s/n,y=a.y+(b.y-a.y)*s/n;for(const box of boxes){if(x<box.x||x>box.x2||y<box.y||y>box.y2)continue;
  for(let j=1;j<box.t.pts.length;j++){const p=box.t.pts[j-1],q=box.t.pts[j],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy);if(!l)continue;const u=((x-p[0])*dx+(y-p[1])*dy)/l,v=((x-p[0])*dy-(y-p[1])*dx)/l,d=Math.hypot(u-Math.max(0,Math.min(l,u)),v-Math.max(-34,Math.min(0,v)));if(d<19.9)return {id:box.t.sky.id,x,y,d};}
 }}return null;};
}
function replay({castX=4540,angle=.95,speed=7.5,offset=120,mode='forgiving',turns=1}={}){
 const fork=RailGripCore.create(),K=fork.physics;fork.grip.configure({mode});
 const rails=document.ct.map(p=>{const t=K.rail(p,p.sky);t.bounds={x:Math.min(...p.map(q=>q[0]))-90,x2:Math.max(...p.map(q=>q[0]))+90,y:Math.min(...p.map(q=>q[1]))-90,y2:Math.max(...p.map(q=>q[1]))+90};return t;});
 const check=bodyChecker(rails),p={x:500-offset,y:2130,w:26,h:30,vx:speed,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
 let entered=false,cast=false,released=false,from=null;const events=[],frames=[],warnings=[];
 for(let tick=0;tick<1400;tick++){
  const old={x:p.x,y:p.y},a={x:p.x+13,y:p.y+15};
  if(!cast&&from==='m5'&&p.x+13>=castX){const target=K.target(p,[peg]);if(target&&K.cast(p,target)){cast=true;events.push({type:'cast',tick,x:a.x,y:a.y,r:p.peg.r});}}
  if(p.trackCD>0)p.trackCD--;
  if(p.peg){K.swing(p,{right:true});const th=((p.peg.th%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
   if(p.peg.loops>=turns&&th>=angle&&th<angle+.16){const release=K.release(p);released=true;from=peg.id;events.push({type:'release',tick,...release});}
  }else if(p.track){const tr=p.track,exit=K.ride(p,{right:true});if(exit){from=tr.sky.id;p._airTicks=0;events.push({type:'exit',id:from,tick});}}
  else{
   if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:true});p._airTicks++;
   const near=rails.filter(t=>p.x>=t.bounds.x&&p.x<=t.bounds.x2&&p.y>=t.bounds.y&&p.y<=t.bounds.y2),hit=K.catchRail(p,old,near,from);
   if(hit){entered=true;events.push({type:'catch',id:hit.tr.sky.id,face:hit.face,tick,airTicks:p._airTicks,speed:p.speed,from});from=null;p._airTicks=0;}
  }
  const b={x:p.x+13,y:p.y+15};const warning=check(a,b);if(warning&&!warnings.some(w=>w.id===warning.id))warnings.push(warning);
  frames.push({...b,tick,vx:p.vx,vy:p.vy,rail:p.track?.sky.id||null,peg:!!p.peg});
  if(!p.track&&!p.peg&&p.y+30>=2160)return {status:'road',cast,released,events,frames,warnings};
  if(p.x<0||p.x>8064||p.y<0)return {status:'bounds',cast,released,events,frames,warnings};
 }
 return {status:'timeout',cast,released,events,frames,warnings};
}
module.exports={replay,document,peg,T,bodyChecker};
