/* Only Sunrise Borough changes. Ground, encounters, music and finish progression
 * remain native. No baked graph edge can move or attach the player. */
(function(r){'use strict';
 const prior=GroundCampaign,old=DeliveryCampaign;
 function build(n,T){const d=prior.make(n,T);if(n!==0)return d;const ground=d.ground*36;
  // Remove the abandoned upper puzzle, not the populated road and its pickups.
  for(let y=0;y<d.ground-3;y++)for(let x=0;x<d.width;x++)d.cells[y*d.width+x]=0;
  d.ct=PhraseData.paths.map((p,i)=>{const pts=PhraseGeometry.path(p.spec);pts.sky={...p.meta,stage:i};return pts;});
  const point=(x,y,id)=>{const tx=Math.round((x-18)/36),ty=Math.round((y-18)/36);if(tx>2&&tx<d.width-5&&ty>2&&ty<d.ground-2)d.cells[ty*d.width+tx]=id;};
  const peg=PhraseData.routes.find(p=>p.peg).peg;point(peg.x,peg.y,T.PEG);
  for(const path of d.ct){const tr=GrappleCore.rail(path);const step=['m2','m6','m7'].includes(path.sky.id)?85:145;for(let s=55;s<tr.len-30;s+=step){const p=GrappleCore.sample(tr,s);point(p.x+p.nx*48,p.y+p.ny*48,T.GEAR);}}
  const sectors=[{id:'post',name:'Post Office runway',x:280,y:1690,w:950,h:480},{id:'clock',name:'Clocktower curl and drop',x:1270,y:1130,w:1140,h:1040},{id:'fork',name:'Canal fork and collector',x:2450,y:980,w:1880,h:1190},{id:'bell',name:'Bellflower hook and return',x:4380,y:480,w:1080,h:1690},{id:'finish',name:'Orchard swoop and festival',x:5420,y:1020,w:2400,h:1150}];
  const links=[];for(const route of PhraseData.routes)for(let i=1;i<route.expected.length;i++)if(!links.some(e=>e.from===route.expected[i-1]&&e.to===route.expected[i]))links.push({from:route.expected[i-1],to:route.expected[i],type:route.peg?'rehearsal-route':'carried-state-route'});
  d.gp.skyNetwork={version:1,sectors,links,mainIDs:PhraseData.routes[0].expected,pegCount:1,groundOptional:true};
  d.gp.flowPlan={version:2,id:'authored-first-chapter',solidRoads:true,routeNames:PhraseData.routes.map(p=>p.name)};
  d.boxes=[];for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)if(d.cells[y*d.width+x]===T.MAILBOX)d.boxes.push({x,y});d.mail=d.boxes.map(p=>p.x);
  for(const c of d.gp.cast||[]){if(c.id==='milo')c.text='Follow the rising runway. At the canal, keep your pace to climb or brake to take the lower sprint.';if(c.id==='fern')c.text='The high hook turns you left, then the cradle brings you right. Missing a trick can return you to the street. Try it again.';}
  d.description='Authored arcs, a real left-turning hook, a lower sprint, road re-entries and an expert whip transfer. Read the shape, choose your line, and recover onto the street.';d.difficulty='AUTHORED ROUTES / OPTIONAL SKY';return d;
 }
 const make=(i,T)=>i<4?old.build(i,T):build(i-4,T),ids={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
 SkyRoutes.build=make;r.GroundCampaign=Object.freeze({...prior,make:build,build:make});r.DeliveryCampaign=Object.freeze({...old,build:make,routes:old.routes.map((p,i)=>i===4?(()=>{const {ct,cells,...a}=build(0,ids);return a;})():p)});r.PhraseLayout=Object.freeze({build});
})(globalThis);
