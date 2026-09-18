/* Pilgrimage pipeline v1. Original authored encounter modules; no third-party
 * maps or generation code. Metres, stable IDs and independent random streams.
 * Keep both IDs immutable. Old Returning Bell and Endless readers are untouched. */
(function(root){'use strict';
 const IDS=Object.freeze(['lantern-causeway-1','ashen-archive-1']);
 const CHAPTERS=Object.freeze([
  {id:IDS[0],name:'The Lantern Causeway',purpose:'A processional signal road above the service walks.',problem:'Light both relay lanterns, then answer the far beacon.',tiles:['wind-court','split-court'],palette:['#7d989c','#dec594']},
  {id:IDS[1],name:'The Ashen Archive',purpose:'Reading galleries above protected book-service circulation.',problem:'Unseal both archive lenses, then open the reading-room exit.',tiles:['column-hall','split-stacks'],palette:['#89878b','#d2ab79']}
 ]);
 function hash(t){let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
 function random(seed){let a=hash(seed);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const copy=x=>JSON.parse(JSON.stringify(x)),known=id=>IDS.includes(id);
 const signature=w=>hash(JSON.stringify({generator:w.generator,tier:w.pipeline.tier,modules:w.pipeline.modules,solids:w.solids,floors:w.floors,enemies:w.enemies.map(e=>[e.id,e.kind,e.p,e.maxHp]),pickups:w.pickups})).toString(16).padStart(8,'0');
 function initial(w){return {version:1,stage:IDS.indexOf(w.generator),tier:w.pipeline.tier,signature:w.pipeline.signature,shutters:[false,false],gates:[false,false]};}
 function generate(seed,depth,stage,make,tier=0,options={}){
  if(!Number.isInteger(stage)||!CHAPTERS[stage]||!Number.isInteger(tier)||tier<0||tier>2)throw Error('Unsupported pilgrimage rules.');
  const spec=CHAPTERS[stage],streams={};for(const key of ['geometry','encounters','loot','decoration'])streams[key]=random(seed+'|'+spec.id+'|'+key+(key==='decoration'?'|'+(options.decorationSalt||0):''));
  const geo=streams.geometry,enc=streams.encounters,loot=streams.loot,deco=streams.decoration;
  const rooms=[],floors=[],solids=[],edges=[],enemies=[],pickups=[],targets=[],modules=[],controls=[],routeTests=[],blinkTests=[],shotTests=[];
  const floor=(id,x,z,w,d,y,region,extra={})=>floors.push({id,x,z,w,d,y,type:y?'gallery':'stone',region,...extra});
  const box=(id,x,y,z,w,h,d,type,region)=>solids.push({id,min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2],type:type||'wall',region});
  function room(id,label,x,z,w,d){rooms[id]={id,label,x,z,w,d,outer:false,planFamily:'choir',style:stage,outline:[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]]};}
  const addEdge=(a,b)=>edges.push([a,b]);
  function landingSlab(f){if(f.type==='stair'){const n=Math.ceil(f.d/.25);for(let i=0;i<n;i++){const z=f.z-f.d/2+(i+.5)*f.d/n,h=Math.min(f.y+f.slopeZ*(z-f.d/n/2-f.anchorZ),f.y+f.slopeZ*(z+f.d/n/2-f.anchorZ))-.16;if(h>.01)box(f.id+'/riser/'+i,f.x,0,z,f.w,h,f.d/n,'stair-base',f.region);}}
   else if(f.y>0)box(f.id+'/slab',f.x,f.y-.24,f.z,f.w,.12,f.d,'gallery-deck',f.region);}
  function module(slot,x,z,kind,side){
   const region=slot*4+1,uid=spec.id+'/module/'+slot,point=(a,y,b)=>[x+a,y,z+b];
   const m={id:uid,kind,slot,x,z,side,region,front:point(0,0,12),back:point(0,0,-12),socket:{width:4,height:2.6,elevation:0},target:targets.length,
    paths:{direct:[point(0,0,12),point(0,0,2),point(0,0,-7),point(0,0,-12)],
     gallery:[point(0,0,12),point(side*11,0,12),point(side*11,3.2,4),point(side*11,3.2,-10),point(0,3.2,-10),point(-side*11,3.2,-10),point(-side*11,0,0),point(-side*6,0,0),point(-side*6,0,-10),point(0,0,-10),point(0,0,-12)],
     bypass:[point(0,0,12),point(-side*6,0,4),point(-side*6,0,-10),point(0,0,-10),point(0,0,-12)]},
    release:point(side*3.9,1.45,-2.7),winch:point(side*11,3.2,1),latch:point(-side*11,0,7.5)};
   modules.push(m);room(region,(slot?'Far ':'Near ')+(kind.includes('hall')?'Reading Hall':kind==='split-stacks'?'Closed Stacks':'Lantern Court'),x,z,16,24);
   room(region+1,'Overlooking '+(stage?'reading gallery':'wind gallery'),x+side*11,z-2,6,12);
   room(region+2,stage?'Book porters\' walk':'Sheltered service walk',x-side*11,z+5,6,14);
   floor(uid+'/court',x,z,16,24,0,region);
   floor(uid+'/arrival-apron',x,z+11,28,4,0,region);
   floor(uid+'/gallery-stair',x+side*11,z+8,6,8,0,region+1,{type:'stair',slopeZ:-.4,anchorZ:z+12});
   floor(uid+'/gallery',x+side*11,z-2,6,12,3.2,region+1);
   floor(uid+'/overlook-bridge',x,z-10,28,4,3.2,region+1);
   floor(uid+'/service-stair',x-side*11,z-4,6,8,0,region+2,{type:'stair',slopeZ:-.4,anchorZ:z});
   floor(uid+'/service',x-side*11,z+6,6,12,0,region+2);
   // Outer walls enclose the loop, not its three internal approaches.
   box(uid+'/outer-west',x-14.2,0,z,0.4,stage?7.5:5.4,24,'wall',region);
   box(uid+'/outer-east',x+14.2,0,z,0.4,stage?7.5:5.4,24,'wall',region);
   for(const a of[-1,1]){box(uid+'/back-wing/'+a,x+a*8,0,z-12.2,12,.0+7,.4,'wall',region);box(uid+'/front-wing/'+a,x+a*8,0,z+13,12,3.1,.4,'wall',region);}
   // An openable gate, first seen from the arrival apron, becomes a useful
   // refuge connection after reaching its service-side latch from the court.
   box(uid+'/gate',x-side*11,0,z+9.5,6,3.4,.35,'pilgrim-gate',region+2);
   box(uid+'/service-screen',x-side*8,0,z+7.4,.35,3.1,3.7,'wall',region+2);
   box(uid+'/gallery-rail',x+side*8.1,3.2,z-2,.18,.72,8,'balustrade',region+1);
   // The shutter is shared by movement and projectile collision. Its raised
   // position has ample draw/head clearance and never seals the side routes.
   box(uid+'/shutter',x,0,z-4,6,4.6,.4,'pilgrim-shutter',region);
   box(uid+'/release-base',x+side*3.9,0,z-2.7,.45,1,.45,'cover',region);
   box(uid+'/arrival-cover',x+side*3,0,z+6,2.1,1.1,1.2,'cover',region);
   box(uid+'/court-cover',x-side*3.4,0,z,1.5,1.05,1.4,'cover',region);
   box(uid+'/refuge-marker',x-side*11.8,0,z+11.4,.65,2.1,.65,'landmark',region);
   if(kind==='split-court'){
    box(uid+'/broken-wall',x+side*4.2,0,z-7,1.4,2.6,2,'wall',region);
    box(uid+'/windbreak',x-side*4.3,0,z+1.8,.65,2.5,2.5,'wall',region);
   }else if(stage){
    // Alternating stacks/columns interrupt firing lanes, leaving the central
    // shutter route and service flank physically continuous.
    for(const a of[-1,1])for(const b of[kind==='split-stacks'?1:4,-7])box(uid+'/stack/'+a+'/'+b,x+a*3.4,0,z+b,kind==='split-stacks'?1.2:.65,stage?2.7:2,kind==='split-stacks'?3:.65,'wall',region);
    box(uid+'/reading-roof',x,7.1,z,28,.25,24,'roof',region);
   }
   // Target can be shot from the court/gallery OR operated at the lens.
   const t=point(0,4.65,-10);targets.push(t);m.targetPoint=t;
   controls.push({id:uid+'/winch',kind:'shutter',slot,p:m.winch,label:'Turn the '+(stage?'stack':'wind')+' shutter winch'},
    {id:uid+'/latch',kind:'gate',slot,p:m.latch,label:'Unbar the service return gate'},
    {id:uid+'/lens',kind:'lens',slot,p:point(0,3.2,-10),label:stage?'Unseal the archive lens':'Light the relay lantern'});
   addEdge(region,region+1);addEdge(region+1,region+2);addEdge(region,region+2);
   // Three validated role slots per module. Roster choices use their own
   // stream and are frozen by tier; purely decorative edits cannot change them.
   const roles=[{role:'court volley',kind:enc()<.5?'cantor':'archer',p:point(-side*1.5,1.05,-7),room:region},
    {role:'gallery angle',kind:'archer',p:point(side*11,4.25,-4.5),room:region+1},
    {role:'ground pressure',kind:stage&&tier>0?'warden':'stalker',p:point(side*5.5,1.05,1.4),room:region}];
   m.roles=[];for(const r of roles){const e=make(r.kind),id=enemies.length;Object.assign(e,{id,p:r.p,room:r.room,aware:false,required:false,cd:2.5+id*.2});if(r.kind==='archer')e.speed=0;enemies.push(e);m.roles.push({id,stableId:uid+'/enemy/'+r.role,role:r.role,p:[...r.p],radius:e.bodyRadius||.48});}
   pickups.push({id:uid+'/supply',p:point(side*11,3.5,-7),kind:loot()<.5?'frost':'cinder',taken:false},{id:uid+'/refuge-health',p:point(-side*11,.3,6),kind:'health',taken:false});
   routeTests.push({id:uid+'/gallery',points:m.paths.gallery,condition:null},{id:uid+'/bypass',points:m.paths.bypass,condition:null},{id:uid+'/direct',points:m.paths.direct,condition:slot});
   blinkTests.push({id:uid+'/gallery-landing',from:point(side*5,0,3),to:point(side*11,3.2,2.5),recover:m.paths.bypass});
   shotTests.push({id:uid+'/release-shot',from:point(0,1.5,3),to:m.release},{id:uid+'/lens-shot',from:point(0,1.5,3),to:t,condition:slot});
  }
  room(0,'Pilgrim shelter',0,18,8,12);floor('pilgrim/arrival',0,18,8,12,0,0);
  box('pilgrim/start-shelter',0,0,23.8,8,4,.4,'wall',0);
  box('pilgrim/start-pier',-3.5,0,17,.6,3,.6,'landmark',0);
  const gap=geo()<.5?12:16,offset=[-6,0,6][Math.floor(geo()*3)],secondZ=-24-gap;
  module(0,0,0,spec.tiles[Math.floor(geo()*spec.tiles.length)],geo()<.5?-1:1);
  room(4,stage?'Archivist rest bay':'Windbreak refuge',offset/2,-12-gap/2,Math.abs(offset)+6,gap);
  // Socket pair is joined by an L corridor, not by a graph-only connection.
  const zmid=-12-gap/2;
  floor('pilgrim/connector-a',0,(-12+zmid)/2,4,-12-zmid+.06,0,4);
  floor('pilgrim/connector-elbow',offset/2,zmid,Math.abs(offset)+4,4,0,4);
  floor('pilgrim/connector-b',offset,(zmid+secondZ+12)/2,4,zmid-(secondZ+12)+.06,0,4);
  pickups.push({id:'pilgrim/rest-health',p:[offset/2,.3,zmid],kind:'health',taken:false});
  module(1,offset,secondZ,spec.tiles[Math.floor(geo()*spec.tiles.length)],geo()<.5?-1:1);
  const exitZ=secondZ-18;room(8,stage?'The restored reading room':'Far lantern beacon',offset,exitZ,8,12);floor('pilgrim/exit',offset,exitZ,8,12,0,8);
  box('pilgrim/exit-wall',offset,0,exitZ-6,8,4,.4,'wall',8);
  controls.push({id:'pilgrim/exit',kind:'exit',p:[offset,0,exitZ-3],label:stage?'Leave the restored archive':'Continue to the Ashen Archive'});
  for(const [a,b]of[[0,1],[1,4],[4,5],[5,8]])addEdge(a,b);
  for(const f of [...floors])landingSlab(f);
  const links=rooms.map(()=>[]);for(const[a,b]of edges){links[a].push(b);links[b].push(a);}
  const w={seed,depth,generator:spec.id,pilgrimage:true,rooms,floors,solids,edges,links,enemies,pickups,targets,start:[0,0,20],exit:8,
   architecture:{version:1,lofts:[],extraLofts:[],routes:[],blinkPad:blinkTests[0].to,floorIDs:floors.map(f=>f.id)},
   pipeline:{version:1,tier,chapter:stage,name:spec.name,purpose:spec.purpose,problem:spec.problem,modules,controls,routeTests,blinkTests,shotTests,connector:[[0,0,-12],[0,0,zmid],[offset,0,zmid],[offset,0,secondZ+12]],
    streams:{geometry:hash(seed+'|'+spec.id+'|geometry'),encounters:hash(seed+'|'+spec.id+'|encounters'),loot:hash(seed+'|'+spec.id+'|loot'),decoration:hash(seed+'|'+spec.id+'|decoration|'+(options.decorationSalt||0))},
    decoration:modules.map(m=>({id:m.id+'/banner',tone:deco(),x:m.x+m.side*13,z:m.z+3})),palette:spec.palette,signature:''}};
  w.pipeline.signature=signature(w);return w;
 }
 function apply(s){const w=s.world,d=s.pilgrimage;if(!d)return;
  for(const m of w.pipeline.modules){const b=w.solids.find(b=>b.id===m.id+'/shutter'),y=d.shutters[m.slot]?6:0;b.min[1]=y;b.max[1]=y+4.6;
   const gate=m.id+'/gate';w.solids=w.solids.filter(b=>b.id!==gate);if(!d.gates[m.slot])w.solids.push({id:gate,min:[m.x-m.side*11-3,0,m.z+9.325],max:[m.x-m.side*11+3,3.4,m.z+9.675],type:'pilgrim-gate',region:m.region+2});}
 }
 function configure(s){s.pilgrimage=initial(s.world);s.discovered=new Set([0]);s.head=[s.p[0],s.p[1]+1.65,s.p[2]];apply(s);}
 function restore(s,d){if(!d||Object.keys(d).sort().join(',')!=='gates,shutters,signature,stage,tier,version'||d.version!==1||d.stage!==s.world.pipeline.chapter||d.tier!==s.world.pipeline.tier||d.signature!==s.world.pipeline.signature)throw Error('Pilgrimage layout or rule snapshot mismatch.');
  for(const k of['shutters','gates'])if(!Array.isArray(d[k])||d[k].length!==2||d[k].some(x=>typeof x!=='boolean'))throw Error('Invalid pilgrimage mechanism state.');s.pilgrimage=copy(d);apply(s);}
 function roomAt(w,p){const hits=w.floors.filter(f=>Math.abs(p[0]-f.x)<=f.w/2&&Math.abs(p[2]-f.z)<=f.d/2&&Math.abs(p[1]-(f.y+(f.slopeZ||0)*(p[2]-(f.anchorZ||0))))<1.65);return hits.length?hits.at(-1).region:0;}
 function near(s,c,a){return Math.abs(s.p[1]-c.p[1])<.65&&Math.hypot(s.p[0]-c.p[0],s.p[2]-c.p[2])<2.05&&!a.segmentBlocked(s.world,s.head,[c.p[0],c.p[1]+1,c.p[2]],.02);}
 function available(s,a){if(!s.pilgrimage||s.phase!=='playing')return null;return s.world.pipeline.controls.find(c=>near(s,c,a)&&(c.kind!=='gate'||!s.pilgrimage.gates[c.slot]&&s.p[2]<c.p[2]+1.1)&&(c.kind!=='lens'||!s.targets.has(c.slot)))||null;}
 function toggle(s,slot,a,liftOnly=false){const m=s.world.pipeline.modules[slot],up=liftOnly||!s.pilgrimage.shutters[slot];if(up===s.pilgrimage.shutters[slot])return false;
  const b={min:[m.x-3,up?6:0,m.z-4.2],max:[m.x+3,up?10.6:4.6,m.z-3.8]},over=(p,r,h)=>p[0]+r>b.min[0]&&p[0]-r<b.max[0]&&p[2]+r>b.min[2]&&p[2]-r<b.max[2]&&p[1]+h>b.min[1]&&p[1]<b.max[1];
  if(over(s.p,.42,1.8)||s.world.enemies.some(e=>!e.dead&&over([e.p[0],e.p[1]-1.05,e.p[2]],e.bodyRadius||.6,2))){a.emit(s,'pilgrimage-blocked',{text:'The shutter is occupied. Clear the crossing first.'});return false;}
  s.pilgrimage.shutters[slot]=up;apply(s);a.emit(s,'pilgrimage-shutter',{slot,text:up?'Shutter raised. The direct crossing and firing lane are exposed.':'Shutter lowered. Cover restored; gallery and service routes remain open.'});return true;
 }
 function step(s,a){s.discovered.add(roomAt(s.world,s.p));if(!s.portalReady&&s.world.targets.every((_,i)=>s.targets.has(i))){s.portalReady=true;a.emit(s,'pilgrimage-signal',{text:'Both signals restored. The far threshold is ready; you do not need to clear every defender.'});}}
 function interact(s,a){const c=available(s,a);if(!c)return false;
  if(c.kind==='shutter')toggle(s,c.slot,a);
  else if(c.kind==='gate'){s.pilgrimage.gates[c.slot]=true;apply(s);a.emit(s,'pilgrimage-gate',{text:'The familiar refuge is just beyond. This service shortcut stays open in this expedition.'});}
  else if(c.kind==='lens'){s.targets.add(c.slot);a.emit(s,'pilgrimage-lens',{text:'Signal restored. You may also strike these lenses with an ordinary arrow.'});step(s,a);}
  else if(!s.portalReady)a.emit(s,'pilgrimage-locked',{text:'Restore both relay signals first. Reach their galleries or find a clear arrow line.'});
  else{s.phase='reward';s.finished=true;s.sectors++;a.emit(s,'sector-complete');a.emit(s,'pilgrimage-complete',{text:s.pilgrimage.stage===0?'The way into the Ashen Archive is open. Choose your blessing.':'Both new chapters complete. Choose your blessing to continue into Endless.'});}
  return true;
 }
 function objective(s){return s.phase==='reward'?(s.pilgrimage.stage===0?'Choose a blessing to enter The Ashen Archive.':'Pilgrimage complete. A blessing continues into Endless.'):s.portalReady?'Both signals restored. Reach the far threshold.':s.world.pipeline.problem+' '+s.targets.size+' / 2 restored.';}
 function next(s){return s.pilgrimage&&s.pilgrimage.stage===0?{stage:1,tier:s.pilgrimage.tier}:null;}
 // Validate actual body clearance along every authored guaranteed route. This
 // is a bounded catalogue assembler, not a claim of arbitrary-layout proof.
 function validate(w,a){const failures=[];function path(points,id){let p=[...points[0]];for(let j=1;j<points.length;j++){const q=points[j],n=Math.ceil(Math.hypot(q[0]-p[0],q[2]-p[2])/.12),start=[...p];for(let i=1;i<=n;i++){const v=[start[0]+(q[0]-start[0])*i/n,p[1],start[2]+(q[2]-start[2])*i/n];if(!a.walkable(w,v,.42)){failures.push(id);return;}v[1]=a.floorAt(w,v);p=v;}if(Math.abs(p[1]-q[1])>.08){failures.push(id+'/height');return;}}}
  for(const r of w.pipeline.routeTests)if(r.condition===null)path(r.points,r.id);path(w.pipeline.connector,'module sockets');
  for(const e of w.pipeline.modules.flatMap(m=>m.roles))if(!a.walkable(w,[e.p[0],e.p[1]-1.05,e.p[2]],e.radius))failures.push('enemy/'+e.id);
  for(const p of w.pickups)if(!a.walkable(w,[p.p[0],p.p[1]-.3,p.p[2]],.42))failures.push('pickup/'+p.id);
  return {ok:failures.length===0,failures,modules:w.pipeline.modules.length,scope:'Authored ordinary routes and placement footprints against the production collision queries.'};
 }
 const api=Object.freeze({IDS,CHAPTERS,known,generate,initial,configure,restore,apply,roomAt,available,toggle,step,interact,objective,next,validate,hash,random});root.PilgrimageModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
