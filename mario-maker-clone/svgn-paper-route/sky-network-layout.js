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
/* Authored first-chapter data, carried forward from PR28 and retuned to the
 * current two-sided grip. No route ID or graph edge drives the actual rider. */
(function(r){'use strict';r.FlowRouteData={"version":"flow-routes-3","paths":[{"spec":{"x":500,"y":2090,"heading":0,"ops":[{"curve":[[146.66666666666666,0],[293.3333333333333,-15],[440,-15]]},{"turn":-36,"radius":200},{"line":80}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":1,"sector":0,"id":"m0","label":"Post Office rising runway","shape":"entry","entry":true,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":1479.831597359677,"y":1876.974061281689,"heading":-0.309394837288294,"ops":[{"line":120},{"turn":-54.690605162711705,"radius":178.5},{"line":95}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":2,"sector":0,"id":"m1","label":"Crescent lift","shape":"crescent","roadDepth":34,"authoredFlow":true}},{"spec":{"x":1936.6948741923713,"y":1579.444883347857,"heading":-41.822024963162434,"ops":[{"line":75},{"turn":-268.17797503683755,"radius":131.75},{"line":70}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":2,"sector":1,"id":"m2","label":"Clocktower open curl","shape":"open-curl","roadDepth":34,"authoredFlow":true}},{"spec":{"x":1938.050533750191,"y":1741.853954470198,"heading":33.66970191535643,"ops":[{"line":120},{"turn":-75.66970191535643,"radius":185},{"line":95}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":2,"sector":1,"id":"m3","label":"Clocktower landing cradle","shape":"crescent","roadDepth":34,"authoredFlow":true}},{"spec":{"x":2658.1284746453643,"y":1580.7285282002356,"heading":-5.332075514504313,"ops":[{"line":115},{"turn":-67.66792448549569,"radius":195.5},{"turn":35,"radius":293.25},{"line":95}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":2,"sector":2,"id":"m4","label":"Canal fork: hold pace or brake","shape":"ribbon","roadDepth":34,"authoredFlow":true}},{"spec":{"x":3870.0289510042094,"y":1245.3217708484917,"heading":28.89539445117243,"ops":[{"line":120},{"turn":-88.89539445117242,"radius":247.24999999999997},{"line":95}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":2,"sector":2,"id":"m5","label":"High garden climb","shape":"crescent","roadDepth":34,"authoredFlow":true}},{"spec":{"x":4802.033020591092,"y":875.5610147762314,"heading":17.291736484722307,"ops":[{"line":190},{"turn":-222.29173648472232,"radius":115},{"line":40}]},"meta":{"version":1,"kind":"open","optional":true,"network":true,"begin":0,"end":1,"tier":2,"sector":3,"id":"m6","label":"Bellflower open hook","shape":"open-curl","roadDepth":34,"authoredFlow":true}},{"spec":{"x":6410.551814986567,"y":1465.9668054530619,"heading":-9.30844001229205,"ops":[{"curve":[[359.82202173542856,-58.97754239083321],[879.4481850134334,689.0331945469381],[1139.4481850134334,689.0331945469381]]}]},"meta":{"version":1,"kind":"open","id":"m8","label":"Festival downhill glide","shape":"landing","network":true,"optional":true,"begin":0,"end":1,"sector":4,"tier":1,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":3160,"y":1430,"heading":-30,"ops":[{"curve":[[50,0],[78.19366849987512,-162.86300939501234],[140,-130]]},{"line":820},{"turn":-62,"radius":155},{"line":210}]},"meta":{"version":1,"kind":"open","network":true,"optional":true,"id":"b0","begin":0,"end":1,"shape":"choice-funnel","label":"Broad canal collector","sector":2,"tier":1,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":4827.566315636221,"y":1473.360206007359,"heading":10.019289090246708,"ops":[{"line":120},{"turn":44.98071090975329,"radius":100},{"line":95}]},"meta":{"version":1,"kind":"open","id":"b1","label":"Brassbank curved descent","shape":"crescent","optional":true,"network":true,"begin":0,"end":1,"tier":1,"sector":2,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":5183.944672786415,"y":1822.6987153009745,"heading":56.381758115900695,"ops":[{"line":150},{"turn":-106.3817581159007,"radius":90},{"line":600}]},"meta":{"version":1,"kind":"open","id":"b2","label":"Long lower swoop","shape":"crescent","optional":true,"network":true,"begin":0,"end":1,"tier":1,"sector":2,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":4702.287240836888,"y":884.5950850154077,"heading":128.75890716075023,"ops":[{"line":110},{"turn":-163.75890716075023,"radius":100},{"curve":[[60.469093689073404,-42.340915229798384],[125.39927501910411,162.74161730597052],[185.8683687081775,120.40070207617214]]}]},"meta":{"version":1,"kind":"open","id":"m7","label":"Leftward drop and return cradle","shape":"hairpin","optional":true,"network":true,"begin":0,"end":1,"sector":4,"tier":2,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":5380,"y":1170,"heading":0,"ops":[{"line":460}]},"meta":{"version":1,"kind":"open","id":"m9","label":"Orchard arrival shelf","shape":"resting-shelf","optional":true,"network":true,"begin":0,"end":1,"sector":4,"tier":2,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":3760,"y":2090,"heading":0,"ops":[{"curve":[[170,0],[340,-15],[510,-15]]},{"turn":-30,"radius":140},{"line":165}]},"meta":{"version":1,"kind":"open","id":"e4","label":"Orchard underpass entry","shape":"entry","optional":true,"network":true,"entry":true,"begin":0,"end":1,"sector":2,"tier":1,"roadDepth":34,"authoredFlow":true}},{"spec":{"x":2391.959144821577,"y":2090,"heading":0,"ops":[{"curve":[[83.33333333333333,0],[166.66666666666666,-15],[250,-15]]},{"turn":-60,"radius":140},{"line":525.0874887766821}]},"meta":{"version":1,"kind":"open","id":"e2","label":"Canal road re-entry","shape":"entry","optional":true,"network":true,"entry":true,"begin":0,"end":1,"sector":1,"tier":1,"roadDepth":34,"authoredFlow":true}}],"routes":[{"id":"sky","name":"Clocktower and Bellflower","hint":"Hold D through the rising runway. The hook turns you left before the lower cradle turns you right again.","expected":["m0","m1","m2","m3","m4","m5","m6","m7","m9","m8"],"brake":null,"entry":"m0"},{"id":"canal","name":"Canal sprint","hint":"Brake with A over the marked final part of Canal Fork. Resume D after leaving its lip.","expected":["m0","m1","m2","m3","m4","b0","b1","b2","m8"],"brake":{"surface":"m4","remaining":140},"entry":"m0"},{"id":"reentry","name":"Re-enter from the canal road","hint":"Jump earlier at the canal entrance, then keep moving along its long rising ramp.","expected":["e2","b0","b1","b2","m8"],"brake":null,"entry":"e2"},{"id":"orchard","name":"Orchard underside recovery","hint":"Jump from the later road entry. Carry momentum onto the underside of the lower swoop, then return to the festival glide.","expected":["e4","b2","m8"],"brake":null,"entry":"e4"}],"sourceScope":"Retuned first-chapter geometry under v0.12 two-sided, momentum-preserving rail physics. Route labels do not drive the rider.","peg":{"id":"bell-buoy","x":4446,"y":1422}};})(globalThis);

/* Coherent first-chapter routes. Geometry alone is changed: no auto-steering,
 * captured rider states, altered catch tolerance or per-route physics caps. */
(function(root){
 'use strict';
 const previous=GroundCampaign,campaign=DeliveryCampaign,RAD=Math.PI/180;
 function path(spec){
  let x=spec.x,y=spec.y,a=spec.heading*RAD;const points=[[x,y]];
  for(const op of spec.ops){
   if(op.curve){const [u,v,end]=op.curve,ox=x,oy=y,n=Math.max(24,Math.ceil(Math.hypot(...end)/9));for(let i=1;i<=n;i++){const t=i/n,s=1-t;x=ox+3*s*s*t*u[0]+3*s*t*t*v[0]+t*t*t*end[0];y=oy+3*s*s*t*u[1]+3*s*t*t*v[1]+t*t*t*end[1];points.push([x,y]);}a=Math.atan2(end[1]-v[1],end[0]-v[0]);}
   else if(op.line!==undefined){const n=Math.max(1,Math.ceil(Math.abs(op.line)/14)),d=op.line/n;for(let i=0;i<n;i++){x+=Math.cos(a)*d;y+=Math.sin(a)*d;points.push([x,y]);}}
   else {const angle=op.turn*RAD,r=op.radius;if(!Number.isFinite(r)||r<40||!Number.isFinite(angle))throw Error('Invalid authored turn');const n=Math.max(3,Math.ceil(Math.abs(angle)*r/10)),da=angle/n,k=Math.sign(angle)/r;for(let i=0;i<n;i++){const next=a+da;x+=(Math.sin(next)-Math.sin(a))/k;y+=(-Math.cos(next)+Math.cos(a))/k;a=next;points.push([x,y]);}}
  }return points;
 }
 const sectors=[{id:'post',name:'Post Office runway',x:300,y:1690,w:930,h:480},{id:'clock',name:'Clocktower curl and drop',x:1270,y:1130,w:1140,h:1040},{id:'fork',name:'Canal fork and collector',x:2450,y:980,w:1880,h:1190},{id:'bell',name:'Bellflower hook and return',x:4380,y:480,w:1080,h:1690},{id:'finish',name:'Orchard swoop and festival',x:5420,y:1020,w:2400,h:1150}];
 function build(n,T){
  const d=previous.make(n,T);if(n!==0)return d;
  // Remove the former elevated puzzle. Street terrain, encounters, characters,
  // checkpoints, music and goal remain the existing first chapter's document.
  for(let y=0;y<d.ground-3;y++)d.cells.fill(0,y*d.width,(y+1)*d.width);
  d.ct=FlowRouteData.paths.map((p,i)=>{const pts=path(p.spec);pts.sky={...p.meta,stage:i};return pts;});
  const put=(x,y,id)=>{const a=Math.round((x-18)/36),b=Math.round((y-18)/36);if(a>2&&a<d.width-5&&b>2&&b<d.ground-2&&!d.cells[b*d.width+a])d.cells[b*d.width+a]=id;};
  put(FlowRouteData.peg.x,FlowRouteData.peg.y,T.PEG);
  for(const p of d.ct){const t=GrappleCore.rail(p,p.sky),step=['m2','m6','m7'].includes(p.sky.id)?85:145;for(let s=55;s<t.len-30;s+=step){const q=GrappleCore.sample(t,s);put(q.x+q.nx*48,q.y+q.ny*48,T.GEAR);}}
  // A separate trail rewards the underside recovery without a required pickup.
  const under=d.ct.find(p=>p.sky.id==='b2'),ut=GrappleCore.rail(under,under.sky);
  for(let s=90;s<ut.len-70;s+=140){const q=GrappleCore.sample(ut,s);put(q.x-q.nx*82,q.y-q.ny*82,T.GEAR);}
  const routes=JSON.parse(JSON.stringify(FlowRouteData.routes)),links=[];
  for(const r of routes)for(let i=1;i<r.expected.length;i++)if(!links.some(e=>e.from===r.expected[i-1]&&e.to===r.expected[i]))links.push({from:r.expected[i-1],to:r.expected[i],type:'authored-route-candidate'});
  d.gp.skyNetwork={version:1,sectors:sectors.map(s=>({...s})),links,mainIDs:routes[0].expected,pegCount:1,groundOptional:true};
  d.gp.flowRoutes={version:3,id:'clocktower-lines',routes:routes.map(r=>({id:r.id,name:r.name,hint:r.hint,entry:r.entry,expected:r.expected,brake:r.brake}))};
  d.boxes=[];for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)if(d.cells[y*d.width+x]===T.MAILBOX)d.boxes.push({x,y});d.mail=d.boxes.map(p=>p.x);
  for(const c of d.gp.cast||[]){if(c.id==='milo')c.text='A long runway leads to the open clocktower curl. At Canal Fork, keep moving for the high line or brake for the low route.';if(c.id==='fern')c.text='The bellflower hook sends you left; its cradle turns you right again. A later road entrance joins the lower swoop.';}
  d.description='Ride the clocktower curl, choose the high hook or canal sprint, and re-enter from the street. The ground still finishes.';d.difficulty='LOOPING LINES / OPTIONAL SKY';return d;
 }
 const ids={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
 const buildRoute=(i,T)=>i<4?campaign.build(i,T):build(i-4,T);
 SkyRoutes.build=buildRoute;root.GroundCampaign=Object.freeze({...previous,make:build,build:buildRoute});
 root.DeliveryCampaign=Object.freeze({...campaign,build:buildRoute,routes:campaign.routes.map((r,i)=>i===4?(()=>{const {ct,cells,...v}=build(0,ids);return v;})():r)});
 root.FlowRoutes=Object.freeze({path,build,previous:previous.make});
})(globalThis);
