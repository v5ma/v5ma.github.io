/* One connected upper world, not a row of isolated optional attractions.
 * Main transfers are placed using the same ballistic integrator as the rider.
 * This design-time calculation only positions geometry; it never moves a player. */
(function(root){'use strict';
 const K=GrappleCore,previous=GroundCampaign,oldCampaign=DeliveryCampaign;
 function line(points,step=18){const out=[points[0]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let j=1;j<=n;j++)out.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}return out;}
 function bez(a,b,c,d,n=32){const out=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;out.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return out;}
 function arc(cx,cy,r,a,b,n=48){return Array.from({length:n+1},(_,i)=>{const t=(a+(b-a)*i/n)*Math.PI/180;return [cx+r*Math.cos(t),cy+r*Math.sin(t)];});}
 function append(a,b){a.push(...b.slice(Math.hypot(a.at(-1)[0]-b[0][0],a.at(-1)[1]-b[0][1])<.01?1:0));return a;}
 function arrival(points,ticks){const t=K.rail(points),q=K.sample(t,t.len),p={x:q.x+q.nx*24-13,y:q.y+q.ny*24-15,vx:q.tx*19,vy:q.ty*19};for(let i=0;i<ticks;i++)K.flight(p,{right:true});return [p.x+13,p.y+15];}
 const names=['Post Office Steps','Hanging Junction','Copper Galleries','Orchard Switchback','Waterfall Exchange','Canal Spires','Canopy Crossing','Festival Rooftops','East Lookout','Conservatory'];
 function build(n,T){
  const d=previous.make(n,T),ground=d.ground*36,width=d.width*36,paths=[],pegs=[],links=[],sectors=[];
  const put=(x,y,id)=>{if(x>=0&&x<d.width&&y>=0&&y<d.height)d.cells[y*d.width+x]=id;};
  for(let y=0;y<d.ground-2;y++)for(let x=0;x<d.width;x++)if([T.GEAR,T.PEG,T.MAILBOX].includes(d.cells[y*d.width+x]))put(x,y,0);
  function add(points,shape,sector,tier,label,extra={}){points=points.filter((p,i)=>!i||Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>.01);points.sky={version:1,kind:'open',optional:true,id:'loop-'+paths.length,stage:paths.length,begin:0,end:1,label,network:true,shape,sector,tier,...extra};paths.push(points);return points;}
  function peg(x,y,sector){const tx=Math.round(x/36),ty=Math.round(y/36);if(tx<3||tx>d.width-6||ty<2||ty>d.ground-3)return;put(tx,ty,T.PEG);if(!pegs.some(p=>p.tx===tx&&p.ty===ty))pegs.push({tx,ty,x:tx*36+18,y:ty*36+18,sector});}
  const first=add(line([[710,ground-85],[1200,ground-85],[1490,ground-275]]),'wedge',0,1,'Long run-up and wedge launch',{entry:true});
  const main=[first],times=[0,38,44,34,46,38,52,43,47],max=7+n;
  for(let i=1;i<max;i++){
   const [ax,ay]=arrival(main.at(-1),times[i]),x=ax-15,y=ay+22;if(x+520>width-380)break;
   const p=bez([x-160,y-175],[x-125,y-50],[x-80,y],[x+25,y],24),style=i%4;
   if(style===1)append(p,line([[x+25,y],[x+170,y],[x+365,y-135]]));
   else if(style===2)append(p,bez([x+25,y],[x+210,y],[x+200,y-185],[x+365,y-260]));
   else if(style===3)append(p,line([[x+25,y],[x+260,y],[x+370,y-85]]));
   else append(p,bez([x+25,y],[x+185,y],[x+235,y-115],[x+350,y-200]));
   const q=add(p,['hook','wedge-bowl','quarter-pipe','gallery'][style],i,2,names[i]+' through-line');links.push({from:main.at(-1).sky.id,to:q.sky.id,type:'free-flight'});main.push(q);
  }
  for(let i=0;i<main.length;i++){
   const p=main[i],xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),x=Math.min(...xs),end=Math.max(...xs),bottom=Math.max(...ys),high=Math.max(430,Math.min(...ys)-290),sx=Math.max(650,x-240),sy=Math.max(250,high-330);
   sectors.push({id:'sector-'+i,name:names[i],x:sx,y:sy,w:Math.min(width-250-sx,1000),h:ground-sy});
   const down=add(line([[end+12,bottom-170],[end+220,ground-85],[end+385,ground-85]]),'descent',i,1,'Groundward exit '+(i+1));links.push({from:p.sky.id,to:down.sky.id,type:'drop'});
   if(i>0){const ex=x-130;
    const entry=add(append(line([[ex,ground-78],[ex+92,ground-78]]),bez([ex+92,ground-78],[ex+180,ground-90],[ex+235,ground-190],[ex+280,ground-275])),'road-entry',i,1,'Road entrance '+(i+1),{entry:true});
    const stop=add(append(bez([ex+360,ground-380],[ex+400,ground-210],[ex+420,ground-235],[ex+525,ground-235]),line([[ex+525,ground-235],[ex+590,ground-300]])),'re-entry',i,1,'Lower re-entry shelf '+(i+1));
    links.push({from:entry.sky.id,to:stop.sky.id,type:'optional-jump'});
    for(let h=ground-440;h>high-30;h-=200)peg(ex+470+(Math.floor(h/200)%2)*115,h,i);
   }
   const c=add(arc(x+210,high+100,150,165,i%3===1?-70:20),'hanging-C',i,3,'Open hanging curve '+(i+1));
   const shelf=add(append(line([[x+420,high-12],[x+650,high-12]]),bez([x+650,high-12],[x+700,high-12],[x+705,high-65],[x+725,high-100])),'shelf',i,3,'Upper gallery '+(i+1));
   const reverse=add(bez([x+665,high+85],[x+680,high+320],[x+545,high+350],[x+455,high+290]),'reverse-hook',i,2,'Return hook '+(i+1));
   const recovery=add(arc(x+430,ground-270,185,168,15),'recovery-U',i,1,'Recovery bowl '+(i+1));
   links.push({from:p.sky.id,to:c.sky.id,type:'peg-assisted'},{from:c.sky.id,to:shelf.sky.id,type:'peg-assisted'},{from:shelf.sky.id,to:reverse.sky.id,type:'drop-or-grapple'},{from:reverse.sky.id,to:recovery.sky.id,type:'drop'});
   peg(x+275,high-90,i);peg(x+455,high-170,i);peg(x+665,high-210,i);
   const px=Math.round((x+560)/36),py=Math.round((high-68)/36);if(px<d.width-5&&py>1&&!d.cells[py*d.width+px])put(px,py,i%2?T.NITRO:T.STAR);
  }
  const kept=paths.filter(p=>p.every(([x,y])=>x>=250&&x<=width-170&&y>=180&&y<=ground-55)),ids=new Set(kept.map(p=>p.sky.id));
  // Old elevated bonus blocks must not unexpectedly obstruct the new peg lanes.
  for(let y=0;y<d.ground-3;y++)for(let x=0;x<d.width;x++)if([T.CRATE,T.BCRATE,T.QBLOCK,T.BRICK].includes(d.cells[y*d.width+x])&&pegs.some(p=>Math.hypot(p.x-(x*36+18),p.y-(y*36+18))<255))put(x,y,0);
  for(const p of kept){const t=K.rail(p);for(let s=50;s<t.len-20;s+=135){const q=K.sample(t,s),x=Math.round((q.x+q.nx*48)/36),y=Math.round((q.y+q.ny*48)/36);if(x>3&&x<d.width-5&&y>1&&y<d.ground-2&&!d.cells[y*d.width+x])put(x,y,T.GEAR);}}
  const boxes=[];for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)if(d.cells[y*d.width+x]===T.MAILBOX)boxes.push({x,y});
  d.ct=kept;d.boxes=boxes;d.mail=boxes.map(p=>p.x);d.gp.skyNetwork={version:1,sectors,links:links.filter(l=>ids.has(l.from)&&ids.has(l.to)),mainIDs:main.map(p=>p.sky.id).filter(id=>ids.has(id)),pegCount:pegs.length,groundOptional:true};
  for(const c of d.gp.cast||[]){if(c.id==='milo')c.text='The upper world goes on for whole neighborhoods. M opens its map. The road still finishes.';if(c.id==='fern')c.text='Hold Z on a peg and release to reach a higher shelf. Falling back to the road is fine.';}
  d.description='One layered world of wedge ramps, suspended open curves, galleries and peg ladders above a complete street route.';d.difficulty='STREET + CONNECTED UPPER WORLD';return d;
 }
 const ids={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
 const makeRoute=(i,T)=>i<4?oldCampaign.build(i,T):build(i-4,T);
 SkyRoutes.build=makeRoute;
 root.DeliveryCampaign=Object.freeze({...oldCampaign,build:makeRoute,routes:oldCampaign.routes.map((r,i)=>i<4?r:(()=>{const {cells,ct,...v}=build(i-4,ids);return v;})())});
 root.GroundCampaign=Object.freeze({...previous,make:build,build:makeRoute});
 root.SkyNetworkLayout=Object.freeze({build,line,bez,arc,arrival});
})(globalThis);
