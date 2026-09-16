/* Open the Line: the next immutable Returning Bell layout, not a rewrite of
 * returning-bell-1. All distances are metres. No grants, hidden teleports or AI
 * shortcuts. The same authored stair and aperture govern play and inspection. */
(function(root){'use strict';
 const M=root.ReturningBellModel||(typeof require!=='undefined'?require('./returning-bell-model.js'):null);
 const ID='returning-bell-2',RELEASE=Object.freeze({p:Object.freeze([-7,1.65,-12.35]),radius:.4});
 const isWorld=w=>w?.generator===ID;
 function generate(seed,depth,make){
  const w=M.generate(seed,depth,make);w.generator=ID;
  // A short exposed processional approach reconnects the existing court and
  // tower. The familiar flanking stairs remain reachable with screens down.
  const f={id:'processional-stair',x:0,z:-14.4,w:2.8,d:8,y:0,type:'stair',region:1,slopeZ:-.4,anchorZ:-10.4};
  const landing={id:'processional-landing',x:0,z:-18.8,w:2.8,d:.8,y:3.2,type:'gallery',region:4};
  w.floors.push(f,landing);w.architecture.floorIDs.push(f.id,landing.id);
  const pier=w.solids.find(b=>b.id==='tower-front-pier');pier.min[1]=6.1; // Door lintel, not an invisible facade.
  for(let i=0;i<40;i++){
   const z=-18.4+i*.2,h=(z+.2+10.4)*f.slopeZ-.04;
   if(h>.02)w.solids.push({id:'processional-riser-'+i,min:[-1.4,0,z],max:[1.4,h,z+.2],type:'stair-base',region:1});
  }
  w.solids.push({id:'processional-landing-slab',min:[-1.4,2.98,-19.2],max:[1.4,3.17,-18.4],type:'gallery-deck',region:4});
  w.links[1].push(4);w.links[4].push(1);w.edges.push([1,4]);
  // The existing rear archer now watches the same lane the player opens. No
  // added enemy, range buff, retargeting, or fabricated climbing is needed.
  const watcher=w.enemies.find(e=>e.id===4);watcher.p=[0,4.25,-22.5];watcher.room=4;
  w.solids.push({id:'release-pedestal',min:[-7.18,0,-12.58],max:[-6.82,1.15,-12.22],type:'cover',region:1});
  return w;
 }
 function apply(s){
  if(!isWorld(s.world))return;
  // A graph edge describes a walkable connection, not merely a geometric seam.
  const w=s.world;for(const id of[1,4])w.links[id]=w.links[id].filter(n=>n!==(id===1?4:1));
  w.edges=w.edges.filter(([a,b])=>!(a===1&&b===4));
  if(s.chapter.screensRaised){w.links[1].push(4);w.links[4].push(1);w.edges.push([1,4]);}
 }
 function release(s,a){
  if(!isWorld(s.world)||s.phase!=='playing'||s.chapter.screensRaised)return false;
  const overlap=(p,r,h)=>p[0]+r>-5&&p[0]-r<5&&p[2]+r>-13.2&&p[2]-r<-12.8&&p[1]+h>4.8&&p[1]<8.4;
  if(overlap(s.p,.42,1.8)||s.world.enemies.some(e=>!e.dead&&overlap([e.p[0],e.p[1]-1.05,e.p[2]],e.bodyRadius||.6,2))){a.emit(s,'returning-blocked',{text:'Screen travel occupied. Clear it before lifting.'});return false;}
  s.chapter.screensRaised=true;M.apply(s);apply(s);
  a.emit(s,'returning-screen',{source:'arrow-release',p:[...RELEASE.p],text:'Brass release struck. Screens up: the short stair and enemy shot lane are open. The gallery winch can lower them.'});return true;
 }
 function objective(s){return s.chapter.bellRung||s.chapter.returned?M.objective(s):s.chapter.screensRaised?'Signal ahead: the short stair is open but exposed. Flanking stairs remain available.':'Restore the signal. Gallery winch or brass release lifts the screens; flanking stairs stay open.';}
 const api=Object.freeze({ID,RELEASE,isWorld,generate,apply,release,objective});root.ReturningBellLanes=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
