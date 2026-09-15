/* The Returning Bell: an authored, immutable layout; metres and seconds.
 * No DOM. The same floors and solids drive movement, arrows, Blink and art.
 * Keep returning-bell-1 immutable for saved expeditions. Legacy generation is
 * deliberately untouched. Changes to collision layout need another identity.
 */
(function(root){'use strict';
 const ID='returning-bell-1', HEIGHT=3.2;
 const controls=Object.freeze({
  winch:{p:[-12.1,HEIGHT,-11.5],label:'Turn the screen winch'},
  latch:{p:[7.3,0,8],label:'Open the return gate'},
  bell:{p:[0,HEIGHT,-24],label:'Ring the processional bell'},
  refuge:{p:[0,0,8],label:'Answer the bell at the refuge'}
 });
 const initial=()=>({version:1,gateOpen:false,screensRaised:false,bellRung:false,returned:false});
 const box=(id,min,max,type='wall',region=1)=>({id,min,max,type,region});
 function generate(seed,depth,make){
  const rooms=[
   ['Basin Refuge',0,8,12,8,'choir'],['The Bellcourt',0,-6,18,20,'nave'],
   ['West Cloister',-14,5,6,10,'transept'],['Choir Gallery',-14,-11,6,22,'choir'],
   ['Returning Bell Tower',0,-24.5,10,11,'belfry'],['Lower Ambulatory',12,-10,6,32,'transept'],
   ['Service Undercroft',20,-3,4,26,'archive']
  ].map(([label,x,z,w,d,planFamily],id)=>({id,label,x,z,w,d,planFamily,style:id%3,outer:false,outline:[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]]}));
  const floors=[];
  function floor(id,x,z,w,d,y=0,region=1,more={}){floors.push({id,x,z,w,d,y,type:y?'gallery':'stone',region,...more});}
  floor('refuge',0,8,12,8,0,0);floor('bellcourt',0,-6,18,20,0,1);
  floor('west-threshold',-10.5,9,13,4,0,2);
  floor('west-stair',-14,4,6,8,0,2,{type:'stair',slopeZ:-.4,anchorZ:8});
  floor('choir-gallery',-14,-11.5,6,23,HEIGHT,3);
  floor('choir-bridge',-5,-21,12,4,HEIGHT,3);
  floor('bell-tower',0,-24.5,10,11,HEIGHT,4);
  floor('east-threshold',10.5,0,9,5,0,5);
  floor('ambulatory',12,-7,6,18,0,5);
  floor('east-stair',12,-21,6,10,0,5,{type:'stair',slopeZ:-.32,anchorZ:-16});
  floor('tower-east-landing',12.5,-28,19,4,HEIGHT,4);
  floor('service-stair',20,-21,4,10,0,6,{type:'stair',slopeZ:-.32,anchorZ:-16});
  floor('undercroft',20,-3,4,26,0,6);
  floor('return-passage',14,8,16,4,0,6);
  const solids=[];
  const wall=(id,a,b,r=1)=>solids.push(box(id,a,b,'wall',r));
  // A sheltered first view, then a wide court. Openings are genuine gaps.
  wall('refuge-south',[-6.4,0,12],[6.4,5.3,12.4],0);
  wall('refuge-east-south',[6,0,10],[6.4,5.3,12],0);
  wall('refuge-east-north',[6,0,4],[6.4,5.3,6],0);
  wall('refuge-west',[-6.4,0,10.8],[-6,5.3,12],0);
  wall('threshold-left',[-9,0,3.75],[-2.2,3.8,4.15]);
  wall('threshold-right',[2.2,0,3.75],[6,3.8,4.15]);
  wall('court-west-north',[-9.4,0,-18],[-9,5.6,-13.8]);
  wall('court-west-aperture',[-9.4,0,-13.8],[-9,1,-5]);
  wall('court-west-south',[-9.4,0,-5],[-9,3.2,3.75]);
  wall('court-east',[9,0,-16],[9.4,5.8,-2.5]);
  wall('court-north-left',[-9.4,0,-18],[-1.6,6,-17.6]);
  wall('court-north-right',[1.6,0,-18],[9.4,6,-17.6]);
  // The ordinary lower route stays on the east; the quiet service route is
  // screened off on its outside. No route requires an optional ability.
  wall('east-outer',[15,0,-26],[15.4,6.1,-2.5],5);
  wall('service-west',[17.6,0,-26],[18,6.1,5.8],6);
  wall('service-east',[22,0,-26],[22.4,6.1,10.3],6);
  wall('return-south',[6.2,0,10],[22.4,3.2,10.4],6);
  wall('return-north',[6.2,0,5.6],[18,3.2,6],6);
  // Gallery edges are guarded; the forward part of the west gallery has a
  // broad open landing aperture for Blink, not an invisible barrier.
  wall('gallery-west',[-17.4,HEIGHT,-23],[-17,7.6,0],3);
  solids.push(box('west-stair-outer',[-17.4,0,0],[-17,4.1,8],'wall',2));
  wall('tower-north',[-5.4,HEIGHT,-30.4],[22.4,8.8,-30],4);
  wall('tower-left',[-5.4,HEIGHT,-30],[-5,8.8,-23.2],4);
  wall('tower-front-pier',[-1.6,HEIGHT,-19],[1.6,7,-18.6],4);
  wall('tower-front-left',[-5,HEIGHT,-19],[-1.6,8.1,-18.6],4);
  wall('tower-front-right',[1.6,HEIGHT,-19],[5,8.1,-18.6],4);
  solids.push(box('gallery-rail-a',[-11.1,HEIGHT,-18.7],[-10.85,4.05,-10],'balustrade',3));
  solids.push(box('gallery-rail-b',[-11.1,HEIGHT,-5],[-10.85,4.05,0],'balustrade',3));
  solids.push(box('bridge-rail',[-10.8,HEIGHT,-19.2],[-5.4,4.05,-18.95],'balustrade',3));
  // Solid slabs prevent upward arrow tunnelling. Stairs are closed risers;
  // their small boxes remain below the exact sloping support query.
  for(const f of floors){
   if(f.type==='stair'){
    const n=Math.ceil(f.d/.25);
    for(let i=0;i<n;i++){const z=f.z-f.d/2+i*f.d/n,z2=z+f.d/n,y0=f.y+f.slopeZ*(z-f.anchorZ),y1=f.y+f.slopeZ*(z2-f.anchorZ),h=Math.min(y0,y1)-.04;
     if(h>.02)solids.push(box(f.id+'-riser-'+i,[f.x-f.w/2,0,z],[f.x+f.w/2,h,z2],'stair-base',f.region));}
   }else if(f.y>0)solids.push(box(f.id+'-slab',[f.x-f.w/2,f.y-.22,f.z-f.d/2],[f.x+f.w/2,f.y-.03,f.z+f.d/2],'gallery-deck',f.region));
  }
  for(const [id,x,z,w,d]of[['shelter',-3,1.6,2.6,1],['crossing-a',-4,-3,2.4,1.3],['crossing-b',3.8,-7,2.3,1.3],['tower-rest',12,-12,1.5,1.5]])
   solids.push(box(id,[x-w/2,0,z-d/2],[x+w/2,1.08,z+d/2],'cover',id==='tower-rest'?5:1));
  solids.push(box('screen',[-5,0,-13.2],[5,3.6,-12.8],'screen',1));
  solids.push(box('return-gate',[5.8,0,5.8],[6.2,3.4,10.2],'return-gate',6));
  solids.push(box('cracked-basin',[-4,.0,9.3],[-2.4,.7,10.9],'basin',0));
  solids.push(box('pale-statue',[2.55,0,9.55],[3.45,2.2,10.45],'statue',0));
  solids.push(box('service-roof',[18,3.15,-15],[22,3.4,6],'roof',6));
  const edges=[[0,1],[0,2],[2,3],[3,4],[1,5],[5,4],[4,6]],links=rooms.map(()=>[]);
  for(const [a,b]of edges){links[a].push(b);links[b].push(a);}
  const enemies=[['cantor',[-2,1.05,-8],1],['stalker',[4,1.05,-11],1],['warden',[12,1.05,-7],5],['archer',[3,4.25,-24],4],['archer',[-2,1.05,-15.5],1]].map(([kind,p,room],id)=>{
   const e=make(kind);Object.assign(e,{id,p,room,aware:false,required:false,cd:2.4+id*.25});if(kind==='archer')e.speed=0;return e;
  });
  const pickups=[['shelter-health',[-3,.3,7],'health'],['gallery-cache',[-14,3.5,-17],'frost'],['ambulatory-cache',[13.5,.3,-13],'cinder'],['service-health',[20,.3,-8],'health']].map(([id,p,kind])=>({id,p,kind,taken:false}));
  return {seed,depth,generator:ID,returningBell:true,rooms,links,edges,floors,solids,start:[0,0,8],exit:0,enemies,pickups,targets:[[0,5,-24]],architecture:{version:1,lofts:[],extraLofts:[],routes:[{a:[-14,HEIGHT,-21],b:[0,HEIGHT,-24]}],blinkPad:[-14,HEIGHT,-7],floorIDs:floors.map(f=>f.id)}};
 }
 function apply(s){const d=s.chapter,w=s.world,screen=w.solids.find(b=>b.id==='screen');screen.min[1]=d.screensRaised?4.8:0;screen.max[1]=d.screensRaised?8.4:3.6;
  w.solids=w.solids.filter(b=>b.id!=='return-gate');
  if(!d.gateOpen)w.solids.push(box('return-gate',[5.8,0,5.8],[6.2,3.4,10.2],'return-gate',6));
  for(const id of [0,6])w.links[id]=w.links[id].filter(n=>n!==(id===0?6:0));
  w.edges=w.edges.filter(([a,b])=>!(a===0&&b===6));if(d.gateOpen){w.links[0].push(6);w.links[6].push(0);w.edges.push([0,6]);}
 }
 function configure(s){s.chapter=initial();s.discovered=new Set([0]);s.head=[s.p[0],s.p[1]+1.65,s.p[2]];apply(s);}
 function restore(s,raw){if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join(',')!=='bellRung,gateOpen,returned,screensRaised,version'||raw.version!==1)throw Error('Unsupported Returning Bell state.');
  for(const k of ['gateOpen','screensRaised','bellRung','returned'])if(typeof raw[k]!=='boolean')throw Error('Invalid Returning Bell flag.');
  if(raw.returned&&!raw.bellRung)throw Error('Cannot return before the bell rings.');s.chapter={...raw};apply(s);
 }
 function roomAt(w,p){const inside=w.floors.filter(f=>Math.abs(p[0]-f.x)<=f.w/2&&Math.abs(p[2]-f.z)<=f.d/2&&Math.abs(p[1]-(f.y+(f.slopeZ||0)*(p[2]-(f.anchorZ||0))))<1.7);return inside.length?inside.at(-1).region:0;}
 function near(s,which,a){const p=controls[which].p;return Math.abs(s.p[1]-p[1])<.6&&Math.hypot(s.p[0]-p[0],s.p[2]-p[2])<2.15&&!a.segmentBlocked(s.world,s.head,[p[0],p[1]+1.05,p[2]],.02);}
 function available(s,a){if(!s.chapter||s.phase!=='playing')return null;
  if(near(s,'winch',a))return 'winch';
  if(!s.chapter.gateOpen&&s.p[0]>6.2&&near(s,'latch',a))return 'latch';
  if(!s.chapter.bellRung&&near(s,'bell',a))return 'bell';
  if(s.chapter.bellRung&&!s.chapter.returned&&near(s,'refuge',a))return 'refuge';return null;
 }
 function ring(s,a){if(s.chapter.bellRung)return;s.chapter.bellRung=true;s.targets.add(0);s.portalReady=true;a.emit(s,'returning-bell',{text:'The signal carries. Return to the basin refuge.',p:[0,5,-24]});}
 function occupied(s,b){const overlaps=(p,r,h)=>p[0]+r>b.min[0]&&p[0]-r<b.max[0]&&p[2]+r>b.min[2]&&p[2]-r<b.max[2]&&p[1]+h>b.min[1]&&p[1]<b.max[1];
  return overlaps(s.p,.42,1.8)||s.world.enemies.some(e=>!e.dead&&overlaps([e.p[0],e.p[1]-1.05,e.p[2]],e.bodyRadius||.6,2));}
 function interact(s,a){const action=available(s,a);if(!action)return false;
  if(action==='winch'){
   const next=!s.chapter.screensRaised,b=box('next',[-5,next?4.8:0,-13.2],[5,next?8.4:3.6,-12.8]);
   if(occupied(s,b)){a.emit(s,'returning-blocked',{text:'Screen occupied. Clear the crossing before lowering it.'});return true;}
   s.chapter.screensRaised=next;apply(s);a.emit(s,'returning-screen',{text:next?'Screens raised: lower shot lane open; crossing exposed.':'Screens lowered: crossing sheltered; lower shot lane blocked.'});
  }else if(action==='latch'){s.chapter.gateOpen=true;apply(s);a.emit(s,'returning-shortcut',{text:'The basin refuge. The return gate stays open in this expedition.'});}
  else if(action==='bell')ring(s,a);
  else {s.chapter.returned=true;s.phase='reward';s.finished=true;s.sectors++;a.emit(s,'sector-complete');a.emit(s,'returning-home',{text:'The Returning Bell is complete. Choose a blessing to enter the Endless cloisters.'});}
  return true;
 }
 function step(s,a){if(s.targets.has(0))ring(s,a);s.discovered.add(roomAt(s.world,s.p));}
 function objective(s){return s.chapter.returned?'The signal is restored. You found your way home.':s.chapter.bellRung?'Return to the basin refuge. Answer the bell there.':'Restore the tower signal. Find the gallery or lower ambulatory.';}
 // Inspection is a discovery-limited snapshot, not a second mutable expedition.
 function survey(s){return {layout:ID,discovered:s?.chapter?[...s.discovered].filter(i=>i>=0&&i<7):[0],chapter:s?.chapter?{...s.chapter}:initial()};}
 const api={ID,HEIGHT,controls,initial,generate,configure,restore,apply,roomAt,available,interact,step,objective,survey};root.ReturningBellModel=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
