/* Model-only fixture: actual isolated grip/ride/flight, carried between catches.
 * Road entry is an explicit default jump sample, not an assertion about all play. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../../mario-maker-clone/svgn-paper-route');
function context(){const c={console,btoa,atob,TextEncoder,escape,unescape,stepPlayer(){}};c.window=c;vm.createContext(c);for(const f of['campaign.js','sky-routes.js','grapple-core.js','rail-grip-core.js','open-course.js','ground-courses.js','sky-network-layout.js','workshop-core.js','bezier-core.js','ride-lab-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});return c;}
const T={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
function replay(c,route,{speed=7.5,offset=120,remaining=route.brake?.remaining,mode='forgiving',jump=null,brakeAfter=0}={}){
 const d=c.GroundCampaign.make(0,T),fork=c.RailGripCore.create(),K=fork.physics;
 fork.grip.configure({mode});const rails=d.ct.map(p=>K.rail(p,p.sky)),t=rails.find(t=>t.sky.id===route.entry);
 const p={x:t.pts[0][0]-offset,y:d.ground*36-30,w:26,h:30,vx:speed,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
 const events=[],frames=[],visits=new Set(),warnings=[];let from=null,entered=false,jumped=false;
 const save=tick=>frames.push({tick,x:p.x+13,y:p.y+15,vx:p.vx,vy:p.vy,rail:p.track?.sky.id||null,face:p.track?p._railFace:null});
 const boxes=rails.map(t=>({t,x:Math.min(...t.pts.map(p=>p[0])),y:Math.min(...t.pts.map(p=>p[1])),x2:Math.max(...t.pts.map(p=>p[0])),y2:Math.max(...t.pts.map(p=>p[1]))}));
 // A 20-pixel swept circle contains the 26-by-30 rider body. It checks even
 // the launch and receiving decks, not just unrelated third-party obstacles.
 function checkBody(a,b){const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));
  for(let step=1;step<=count;step++){const x=a[0]+(b[0]-a[0])*step/count,y=a[1]+(b[1]-a[1])*step/count;
   for(const box of boxes){if(x<box.x-60||x>box.x2+60||y<box.y-60||y>box.y2+60)continue;const t=box.t;
    for(let i=1;i<t.pts.length;i++){const a=t.pts[i-1],b=t.pts[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.001)continue;
     const u=((x-a[0])*dx+(y-a[1])*dy)/len,n=((x-a[0])*dy-(y-a[1])*dx)/len;
     if(Math.hypot(u-Math.max(0,Math.min(len,u)),n-Math.max(-fork.grip.depth(t),Math.min(0,n)))<20)return {id:t.sky.id,at:[x,y]};
    }
   }
  }return null;
 }
 for(let tick=0;tick<1400;tick++){
  const old={x:p.x,y:p.y},a=[p.x+13,p.y+15],tr=p.track;
  if(p.trackCD>0)p.trackCD--;
  if(tr){
   const brake=remaining!=null&&tr.sky.id===route.brake?.surface&&tr.len-p.trackS<remaining;
   const hop=jump&&!jumped&&tr.sky.id===jump.id&&p.trackS/tr.len>=jump.fraction;if(hop)jumped=true;
   const exit=K.ride(p,{right:!brake,left:!!brake,jump:!!hop});if(exit){from=tr.sky.id;p._airTicks=0;events.push({type:'exit',id:from,tick,vx:p.vx,vy:p.vy});}
  }else{
   if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:!(from===route.brake?.surface&&p._airTicks<brakeAfter),left:from===route.brake?.surface&&p._airTicks<brakeAfter});p._airTicks++;
   const v=Math.hypot(p.vx,p.vy),hit=K.catchRail(p,old,rails,from);
   if(hit){entered=true;visits.add(hit.tr.sky.id);events.push({type:'catch',id:hit.tr.sky.id,tick,face:hit.face,speed:p.speed,retention:Math.abs(p.speed)/(v||1),airTicks:p._airTicks});from=null;p._airTicks=0;}
  }
  save(tick);
  const warning=checkBody(a,[p.x+13,p.y+15]);if(warning&&!warnings.some(w=>w.id===warning.id))warnings.push(warning);
  if(!p.track&&p.y+p.h>=d.ground*36)return {exit:'road',visits:[...visits],events,frames,warnings};
  if(p.x<0||p.x>d.width*36||p.y<0)return {exit:'bounds',visits:[...visits],events,frames,warnings};
 }
 return {exit:'timeout',visits:[...visits],events,frames,warnings};
}
module.exports={context,T,replay};
