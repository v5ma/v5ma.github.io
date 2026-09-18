/* Fieldwork pickup rules. Selection never moves actors or grants resources.
 * The existing simulation owns line-of-sight checks and one-time collection. */
(function(root){'use strict';
 const C=root.VesperCore||(typeof require!=='undefined'?require('./core.js'):null);
 const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 const names={health:'Vitality',relic:'Reliquary',frost:'Frost arrows',cinder:'Cinder arrows',volley:'Volley arrows',ricochet:'Ricochet arrows'};
 function target(s,origin,direction,allowPull=true){
  if(!valid(origin)||!valid(direction)||!valid(s.head)||C.len(C.sub(origin,s.head))>1.6||C.segmentBlocked(s.world,s.head,origin,.015))return null;
  const forward=C.unit(direction);let best=null,rank=Infinity;
  s.world.pickups.forEach((p,index)=>{
   if(p.taken)return;const delta=C.sub(p.p,origin),d=C.len(delta);
   if(d>7||C.segmentBlocked(s.world,origin,p.p,.015))return;
   const near=d<=.5,alignment=d<.001?1:C.dot(C.mul(delta,1/d),forward);
   if(!near&&(!allowPull||alignment<.97))return;
   const r=near?d:10+(1-alignment)*40+d*.03;
   if(r<rank){rank=r;best={index,near,distance:d,usable:p.kind!=='health'||s.health<s.maxHealth,label:names[p.kind]||p.label||'Supply'};}
  });return best;
 }
 function contact(s,p){return !p.taken&&Math.hypot(p.p[0]-s.p[0],p.p[2]-s.p[2])<=.85&&p.p[1]>=s.p[1]-.15&&p.p[1]<=s.p[1]+1.75;}
 function confirmation(s,item,before){
  if(item.kind==='health')return 'Vitality +'+Math.round(s.health-before.health)+' / '+Math.ceil(s.health)+' of '+s.maxHealth;
  if(item.kind==='relic')return 'Reliquary +100 score'+(s.health>before.health?' / vitality +'+Math.round(s.health-before.health):'');
  return (names[item.kind]||'Arrows')+' +'+(s.ammo[item.kind]-before.ammo)+' / '+s.ammo[item.kind]+' ready';
 }
 const api={target,contact,confirmation,names};root.FieldworkModel=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
