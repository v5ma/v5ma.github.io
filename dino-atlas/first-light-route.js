// Advisory foot routes on verified existing ground. No input, storage or progress owner.
import {CHAPTER_STEPS,livingEligibility} from './living-reserve-core.js';
export const TRAIL_BUILD='first-light-trail-20260922.1';
const node=(id,name,x,z)=>Object.freeze({id,name,x,y:0,z});
export const TRAIL_NODES=Object.freeze([
 node('bay','Visitor parking',-4,54),node('home','Visitor center',-4,45),
 node('mara','Mara / ranger bay',5,44),node('leena','Dr. Leena Rao',-4,44),
 node('south','Main gate approach',0,39),node('north','Through the main gate',0,24),
 node('watch','Valley overlook',-12,13),node('fork','Valley junction',0,16),
 node('west','North side of the practice ramp',8,14),node('east','Beyond the practice ramp',18,14),
 node('ivo','Ivo / service stop',24,17),node('road','East service road',31,7),
 node('bend','Service-road bend',30,-7),node('relayApproach','Relay approach',29,-20),
 node('relay','Amber relay',31,-23),node('approach','Research road',35,-28),
 node('front','Research gate entrance',37,-34),node('back','Through the research gate',37,-43),
 node('recorder','Survey recording',47,-51)
]);
export const TRAIL_EDGES=Object.freeze([
 ['bay','home'],['home','mara'],['home','leena'],['mara','south'],['leena','south'],
 ['south','north'],['north','watch'],['north','fork'],['watch','fork'],['fork','west'],
 ['west','east'],['east','ivo'],['ivo','road'],['road','bend'],['bend','relayApproach'],
 ['relayApproach','relay'],['relay','approach'],['relayApproach','approach'],
 ['approach','front'],['front','back'],['back','recorder']
].map(e=>Object.freeze(e)));
const nodes=new Map(TRAIL_NODES.map(n=>[n.id,n]));
const goals=['mara','watch','ivo','relay','relay','recorder','leena'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=p=>({x:p.x,y:0,z:p.z});
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
// Seven tiny, immutable goal tables. Gate availability follows the chapter;
// no speculative connection crosses the closed habitat boundary.
const tables=goals.map((goal,stage)=>{
 const edges=TRAIL_EDGES.filter(e=>stage>=5||!(e.includes('front')&&e.includes('back')));
 const costs=new Map(TRAIL_NODES.map(n=>[n.id,Infinity])),next=new Map(),todo=new Set(nodes.keys());costs.set(goal,0);
 while(todo.size){const id=[...todo].sort((a,b)=>costs.get(a)-costs.get(b))[0];todo.delete(id);if(!Number.isFinite(costs.get(id)))break;
  for(const e of edges){if(!e.includes(id))continue;const other=e[0]===id?e[1]:e[0],cost=costs.get(id)+distance(nodes.get(id),nodes.get(other));if(cost<costs.get(other)){costs.set(other,cost);next.set(other,id);}}
 }
 return {edges,costs,next,goal};
});
export function firstLightRoute(stage,position,mode='foot'){
 const table=tables[stage],step=CHAPTER_STEPS[stage];
 if(!Number.isInteger(stage)||!table||!finite(position))return null;
 const base={build:TRAIL_BUILD,destination:point(step.target),points:[],ids:[],distance:0,next:null};
 if(mode!=='foot')return {...base,mode:'vehicle'};
 if(Math.abs(position.y)>3)return {...base,mode:'elevated'};
 if(distance(position,step.target)<=(stage===1?12:4.4))return {...base,mode:'at-goal'};
 let best=null;
 for(const [aId,bId] of table.edges){
  if(!Number.isFinite(table.costs.get(aId))||!Number.isFinite(table.costs.get(bId)))continue;
  const a=nodes.get(aId),b=nodes.get(bId),dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(dx*dx+dz*dz)));
  const projected={x:a.x+t*dx,y:0,z:a.z+t*dz},gap=distance(position,projected);
  const aCost=distance(projected,a)+table.costs.get(aId),bCost=distance(projected,b)+table.costs.get(bId);
  const id=aCost<bCost?aId:bId,cost=Math.min(aCost,bCost);
  // At shared corners, prefer the forward route, not a turn back to a passed point.
  if(!best||gap<best.gap-.2||(Math.abs(gap-best.gap)<=.2&&cost<best.cost))best={projected,gap,id,cost};
 }
 if(!best)return {...base,mode:'off-route'};
 const ids=[];let id=best.id;
 for(let i=0;id&&i<TRAIL_NODES.length;i++){ids.push(id);id=table.next.get(id);}
 while(ids.length>1&&distance(best.projected,nodes.get(ids[0]))<1)ids.shift();
 const points=[best.projected,...ids.map(id=>point(nodes.get(id)))];
 return {...base,mode:best.gap<=3?'trail':'off-route',points,ids,distance:best.cost,
  gap:best.gap,next:{...nodes.get(ids[0])}};
}
export function firstLightTask(state,context={}){
 const step=CHAPTER_STEPS[state?.stage];if(!state?.active||!step)return null;
 const route=firstLightRoute(state.stage,context.position,context.mode),reason=livingEligibility(state,context);
 let detail=step.detail;
 if(!reason){
  const animal=state.stage===1&&context.animal?String(context.animal.species||'A plant-eater').replaceAll('-',' ')+' is visible. ':'';
  detail=animal+'READY: '+step.label+'. Use the interaction shown on HERE; no tool firing is needed.';
 }else if(route?.mode==='at-goal')detail=reason+' '+(state.stage===1?'Keep the herd in view and leave it room. No weapon is needed.':step.label+' when HERE shows the action.');
 else if(route?.mode==='trail')detail='NEXT: '+route.next.name+'. Follow the amber foot trail ('+Math.round(route.distance)+' m along the route). '+step.label+' at the gold goal.';
 else if(route?.mode==='off-route'&&route.next)detail='Join the foot trail near '+route.next.name+'. The map shows the known route, not a path through nearby obstacles. '+step.detail;
 else if(route?.mode==='elevated')detail='The foot trail is at ground level. Return by a safe route. '+step.detail;
 else if(route?.mode==='vehicle'&&distance(context.position,step.target)<16)detail='Park and step out. '+step.label+' using the interaction shown on HERE.';
 return {name:'First Light / '+step.name,detail,hint:detail,target:point(step.target),done:state.stage,total:CHAPTER_STEPS.length,route};
}
// Prebounded static ground marks. A paused game cannot animate this trail.
export function trailMarks(route,{spacing=2.4,limit=24,length=42}={}){
 if(route?.mode!=='trail'||!Array.isArray(route.points)||route.points.length<2)return [];
 spacing=Number.isFinite(spacing)?Math.max(1,spacing):2.4;limit=Number.isFinite(limit)?Math.max(0,Math.min(24,Math.floor(limit))):24;length=Number.isFinite(length)?Math.max(0,Math.min(42,length)):42;
 const out=[];let walked=0,at=1;
 for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i];if(!finite(a)||!finite(b))return [];
  const d=distance(a,b);if(d<.001)continue;
  while(at<walked+d&&at<=length&&out.length<limit){const t=(at-walked)/d,p={x:a.x+(b.x-a.x)*t,y:.105,z:a.z+(b.z-a.z)*t};
   if(distance(p,route.destination)>3)out.push({...p,yaw:Math.atan2(b.x-a.x,b.z-a.z)});at+=spacing;
  }
  walked+=d;if(walked>=length||out.length>=limit)break;
 }
 return out;
}
