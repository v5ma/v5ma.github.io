/* Working Quay: one visible traffic rule shared by every presentation.
 * Transient routines are deliberately not rewards or save-layout mutations. */
export const QUAY=Object.freeze({x:0,loadingZ:-14.05,bayZ:-17.8,width:1.8,depth:1.4,
 speed:2.5,loadingSeconds:5,clearSeconds:6,signalSeconds:8,signalReach:9});
const rectDepth=(x,z,cx,cz,hx,hz)=>Math.max(0,Math.min(hx-Math.abs(x-cx),hz-Math.abs(z-cz)));
function overlap(s,z,r=.32){
 if(s.ride==='boat'||s.y>=1.75||s.y+1.7<=0)return 0;
 return Math.max(rectDepth(s.x,s.z,0,z,QUAY.width/2+r,QUAY.depth/2+r),
  rectDepth(s.x,s.z,0,z-1.05,.3+r,.3+r));
}
export function resetMarket(s){
 // Old saves may resume on the new cart's ordinary stop. Move the routine's
 // initial stop, never the player or a saved objective, to avoid spawning inside it.
 const bay=overlap(s,QUAY.loadingZ)>0;
 s.market={z:bay?QUAY.bayZ:QUAY.loadingZ,phase:bay?'clear':'loading',timer:0,request:0,
  speed:0,distance:0,heldForPlayer:false,signals:0,accepted:0,rejected:0,waitSeconds:0,holds:0};
 return s.market;
}
export function marketState(s){return s.market||resetMarket(s);}
export function marketActor(s){const m=marketState(s);return {id:'porter',name:'Ivo / quay porter',x:0,z:m.z-1.05,y:0,
 yaw:m.phase==='returning'?Math.PI:0,speed:m.speed,distance:m.distance,
 tip:'I take the crates across the quay. Signal here and I will pull north into the loading bay. You can also ride around the north shoulder, or bypass me by roof or canal.'};}
export function marketBlocks(s,x,y,z,r=.3){return overlap({...s,x,y,z},marketState(s).z,r)>0;}
export function requestPass(s,visible=true){
 const m=marketState(s);m.signals++;
 if(!visible||Math.hypot(s.x,s.y,s.z-m.z)>QUAY.signalReach){m.rejected++;return false;}
 m.accepted++;m.request=QUAY.signalSeconds;m.timer=0;
 if(m.phase!=='clear')m.phase='withdrawing';
 return true;
}
export function marketStatus(s){
 const m=marketState(s),clear=m.z< -16.35;
 return {clear,phase:m.phase,held:m.heldForPlayer,
  text:m.heldForPlayer?'Ivo is waiting for you to clear his cart lane. Use the north shoulder.':
   clear?'QUAY CLEAR / CROSS NOW':m.phase==='withdrawing'?'CART MOVING NORTH / WAIT FOR CLEAR':'LOADING / SIGNAL OR USE NORTH SHOULDER'};
}
export function advanceMarket(s,dt){
 const m=marketState(s);m.request=Math.max(0,m.request-dt);m.speed=0;m.heldForPlayer=false;
 if(m.phase==='loading'){
  m.timer+=dt;if(m.timer>=QUAY.loadingSeconds){m.phase='withdrawing';m.timer=0;}
 }else if(m.phase==='clear'){
  m.timer+=dt;if(m.timer>=QUAY.clearSeconds&&!m.request){m.phase='returning';m.timer=0;}
 }
 if(m.phase==='withdrawing'||m.phase==='returning'){
  const target=m.phase==='withdrawing'?QUAY.bayZ:QUAY.loadingZ;
  const dz=Math.sign(target-m.z)*Math.min(Math.abs(target-m.z),QUAY.speed*dt),next=m.z+dz;
  // Never run the cart into a courier. Movement that reduces an existing
  // overlap is allowed so a restored fixture cannot deadlock its own recovery.
  const movingAway=Math.abs(s.z-next)>Math.abs(s.z-m.z)+1e-9;
  if(overlap(s,next)>0&&!(overlap(s,m.z)>0&&movingAway&&overlap(s,next)<=overlap(s,m.z)+1e-9)){
   m.heldForPlayer=true;m.holds++;
   if(m.phase==='returning'){m.phase='withdrawing';m.timer=0;m.request=Math.max(m.request,2);}
  }else{m.z=next;m.speed=Math.abs(dz)/dt;m.distance+=Math.abs(dz);}
  if(Math.abs(m.z-target)<1e-8){m.phase=m.phase==='withdrawing'?'clear':'loading';m.timer=0;}
 }
}
export function marketCue(s){
 if(s.y>2||s.y<-.2||Math.abs(s.x)>8||s.z> -8||s.z< -20)return '';
 const a=marketStatus(s);
 return a.held?a.text:a.clear?'Quay clear. The north shoulder remains a recovery loop.':
  'Loading crossing ahead. L3 / L rings; X near either signal. North shoulder bypasses the cart.';
}
