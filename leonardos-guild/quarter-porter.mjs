/* Neri's bounded household relay. Uses the same floor/support and collision
 * callbacks as the player; never changes player position or pays a reward.
 * Save only a named order checkpoint, not a pose, clock or physical-room data. */
export const PORTER_SPEED=3.2;
export const PORTER_RADIUS=.33;
export const PORTER_NODES=Object.freeze([
 ['bench',17.5,-7.8],['door',12,-7],['inside',12,-4],['loading',12,-.8],
 ['gate',17,0],['stairs-low',17,5],['stairs-high',17,10],['gallery-east',17,13.1],
 ['gallery-middle',10,13.1],['gallery-west',-10,14],['descent-high',-10,9],
 ['descent-low',-10,4],['landing',-10,0],['arch-back',-16,0],['latch',-16,-2.35],['bell',-16,-6]
].map(([id,x,z])=>Object.freeze({id,x,z})));
const at=id=>PORTER_NODES.findIndex(p=>p.id===id),HOME=at('loading'),BENCH=0,BELL=at('bell');
const validOrder=new Set(['requested','ready','returning']);
export function normalizePorterOrder(raw,q){
 return q?.reported&&q.delivery===1&&q.goodsAccess&&q.archOpen&&validOrder.has(raw)?raw:'';
}
export function porterState(order=''){
 const node=order==='ready'?BELL:order==='returning'?BENCH:HOME,p=PORTER_NODES[node];
 return {node,to:null,x:p.x,z:p.z,y:0,yaw:0,phase:order==='ready'?'ready':order==='returning'?'returning':'sorting',
  carrying:order==='ready'||order==='returning',dwell:0,moving:false,blocked:false,distance:0};
}
export function porterCanRequest(q){return !!(q?.reported&&q.delivery===1&&q.goodsAccess&&q.archOpen&&!q.porterOrder);}
export function requestPorter(q){
 if(!porterCanRequest(q))return false;
 q.porterOrder='requested';q.porter||=porterState();q.porter.phase='fetching';q.porter.dwell=0;return true;
}
export function cancelPorter(q){
 if(!q?.porterOrder)return false;
 const p=q.porter;
 if(p?.carrying||q.porterOrder==='ready')q.porterOrder='returning';else q.porterOrder='';
 if(p){p.phase=q.porterOrder?'returning':'going-home';p.dwell=0;}return true;
}
export function takeFromPorter(q){
 const p=q?.porter;
 if(q?.delivery!==1||!p?.carrying||!q.porterOrder)return false;
 // Single authoritative inventory transfer. Arrival itself never completes work.
 q.delivery=2;q.porterOrder='';p.carrying=false;p.phase='going-home';p.dwell=0;return true;
}
export function takeFromBench(q){
 if(q?.delivery!==1||q.porterOrder==='ready'||q.porter?.carrying)return false;
 q.delivery=2;q.porterOrder='';if(q.porter){q.porter.phase='going-home';q.porter.dwell=0;}return true;
}
export function porterStatus(q){
 const p=q?.porter,order=q?.porterOrder||'';
 if(order==='returning')return 'Neri is returning the spindle to Marta. You may also meet him and collect it in person.';
 if(order==='ready')return 'Neri is waiting at the bell-bracket arch. The spindle stays available; meet him and press X.';
 if(order==='requested')return p?.blocked?'Neri is waiting at an obstructed goods connection. Manual collection or a return request remains available.':p?.carrying?'Neri has the spindle. Follow the loading stairs, gallery and workshop descent to meet him, or wait by the bell.':'Neri is collecting the spindle at Marta\'s bench. Return to play so his work can continue.';
 if(q?.delivery===2)return 'You carry the spindle. Deliver it personally to Ilaria\'s finishing table.';
 if(q?.delivery===3)return 'The spindle is delivered. Neri has returned to ordinary loading work.';
 if(!q?.goodsAccess)return 'The drive is disconnected. Repair Marta\'s 2:1 drive for reusable porter service; the roof and channel remain independent.';
 if(!q?.archOpen)return 'The loading drive works. Open the bell-bracket arch from its latch side to reconnect household deliveries.';
 return 'The household route is restored. After Leonardo commissions a spindle, collect it at Marta\'s bench or ring this bell for Neri.';
}
export function porterActor(q){
 const p=q.porter||porterState(q.porterOrder);
 return {id:'neri',name:'Neri / '+(p.carrying?'spindle delivery':p.phase),x:p.x,y:p.y,z:p.z,yaw:p.yaw,
  motion:p.moving?'walk':p.phase==='ready'?'listen':'work',carrying:p.carrying,phase:p.phase,blocked:p.blocked};
}
export function porterSite(q){
 const p=q?.porter;if(!p?.carrying||!q.porterOrder)return null;
 return {id:'porter',name:'Neri / collect the commissioned spindle',x:p.x,y:p.y,z:p.z};
}
export function stepPorter(q,dt,{blocked,surface}){
 if(!Number.isFinite(dt)||dt<=0)return;
 const p=q.porter||(q.porter=porterState(q.porterOrder));p.moving=false;p.blocked=false;
 if(q.delivery!==1&&q.porterOrder){q.porterOrder='';p.carrying=false;p.phase='going-home';}
 let goal=HOME;
 if(q.porterOrder==='ready'){goal=BELL;p.phase='ready';}
 else if(q.porterOrder==='returning'){goal=BENCH;p.phase='returning';}
 else if(q.porterOrder==='requested'){goal=p.carrying?BELL:BENCH;p.phase=p.carrying?'carrying':'fetching';}
 else if(p.node!==HOME||p.to!==null)p.phase='going-home';else p.phase='sorting';
 // A changed order finishes the current small segment, then chooses a direction.
 // Never snap to a station or interpolate straight across a wall/canal.
 if(p.to===null&&p.node===goal){
  if(q.porterOrder==='requested'&&!p.carrying){p.phase='collecting';p.dwell+=dt;if(p.dwell>=1.2){p.carrying=true;p.dwell=0;}}
  else if(q.porterOrder==='returning'){p.phase='putting-back';p.dwell+=dt;if(p.dwell>=1.2){p.carrying=false;q.porterOrder='';p.dwell=0;}}
  else if(q.porterOrder==='requested'&&p.carrying){q.porterOrder='ready';p.phase='ready';}
  return;
 }
 if(p.to===null)p.to=p.node+Math.sign(goal-p.node);
 const target=PORTER_NODES[p.to];if(!target)return; // Named, bounded graph only.
 // Substeps prevent large-dt wall tunneling, with no catch-up teleport.
 let remaining=Math.min(dt,.1)*PORTER_SPEED;
 for(let i=0;i<8&&remaining>1e-9;i++){
  const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
  if(d<1e-8){p.node=p.to;p.to=null;p.dwell=0;break;}
  const amount=Math.min(d,remaining,.06),x=p.x+dx/d*amount,z=p.z+dz/d*amount;
  if(blocked(x,z,p.y,PORTER_RADIUS)){p.blocked=true;break;}
  const support=surface(x,z,p.y);if(!support||!Number.isFinite(support.y)){p.blocked=true;break;}
  p.x=x;p.z=z;p.y=support.y;p.yaw=Math.atan2(dx,dz);p.distance+=amount;p.moving=true;remaining-=amount;
  if(amount>=d-1e-8){p.node=p.to;p.to=null;p.dwell=0;break;}
 }
}
