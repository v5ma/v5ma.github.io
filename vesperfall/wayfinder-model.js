/* Presentation and input targeting only. Existing model interaction rules remain
 * authoritative: this module cannot grant a signal, move an actor or unlock an exit. */
(function(root){'use strict';
 function current(s,C,P,R){
  if(s.phase!=='playing')return null;
  if(s.pilgrimage){const c=P.available(s,C);return c?{...c,point:C.add(c.p,[0,c.kind==='lens'?1.45:1.08,0])}:null;}
  if(s.chapter){const id=R.available(s,C);if(!id)return null;const c=R.controls[id];return {id,kind:id,p:c.p,point:C.add(c.p,[0,1.08,0]),label:c.label||({winch:'Turn the screen winch',latch:'Unbar the return gate',bell:'Ring the signal bell',refuge:'Complete chapter / choose blessing'})[id]};}
  if(s.world.ar||s.unscored)return null;
  const r=s.world.rooms[s.world.exit],p=[r.x,0,r.z-3.8];
  if(Math.abs(s.p[1])>=.5||Math.hypot(s.p[0]-p[0],s.p[2]-p[2])>=2.7)return null;
  return {id:'endless-exit',kind:'exit',p,point:C.add(p,[0,1.3,0]),label:s.portalReady?'Complete sector / choose blessing':'Defeat the remaining wardens to open this exit'};
 }
 function aimed(s,c,p,dir,C){
  if(!c||![...p,...dir].every(Number.isFinite)||C.len(C.sub(p,s.head))>1.6)return false;
  const d=C.sub(c.point,p),n=C.len(d);
  return n<3&&(!C.segmentBlocked(s.world,p,c.point,.02))&&(n<.65||C.dot(C.unit(d),C.unit(dir))>.90);
 }
 function goal(s,P,R){
  if(s.pilgrimage){
   const next=s.pilgrimage.stage===0?'The Ashen Archive':'Endless';
   if(s.phase==='reward')return {text:'Chapter complete. Choose a blessing.',detail:'Next: '+next,point:null};
   const total=s.world.targets.length;
   if(s.portalReady){const c=s.world.pipeline.controls.find(c=>c.kind==='exit');return {text:'EXIT READY / '+total+'/'+total+' signals',detail:'Use the beacon to continue to '+next,point:c.p};}
   const m=s.world.pipeline.modules.filter(m=>!s.targets.has(m.target)).sort((a,b)=>Math.hypot(a.x-s.p[0],a.z-s.p[2])-Math.hypot(b.x-s.p[0],b.z-s.p[2]))[0];
   return {text:(s.pilgrimage.stage?'Unseal archive lenses':'Light relay lanterns')+' / '+s.targets.size+'/'+total,detail:'Reach a lens or shoot it. Kills do not unlock the exit.',point:m?.targetPoint||null};
  }
  if(s.chapter)return {text:R.objective(s),detail:s.chapter.bellRung?'Return to the refuge and interact.':'Ring the bell by shooting or nearby interaction.',point:s.chapter.bellRung?R.controls.refuge.p:R.controls.bell.p};
  return {text:s.portalReady?'EXIT READY / choose a blessing there':'Defeat the wardens to open the beacon',detail:'Use the exit to proceed to the next sector.',point:s.portalReady?[s.world.rooms[s.world.exit].x,0,s.world.rooms[s.world.exit].z-3.8]:null};
 }
 function status(s,c){if(!c)return '';if(s.pilgrimage&&c.kind==='exit'&&!s.portalReady)return s.targets.size+'/'+s.world.targets.length+' signals restored / exit locked';return c.label;}
 const api=Object.freeze({current,aimed,goal,status});root.WayfinderModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
