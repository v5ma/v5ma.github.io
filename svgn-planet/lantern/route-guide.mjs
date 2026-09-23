/* Advisory wayfinding through the existing floors and openings. Never moves
 * actors, unlocks routes, changes missions or stores progress. Gold stays the
 * final objective; cyan identifies a useful next entrance or elevation change. */
import {ARCHIVE_GUIDE} from './archive.mjs';
import {HIGHLINE_GUIDE_POINTS} from './highline-layout.mjs';
import {walls,floors,inside,floorHeight,canal,lineClear} from './core.mjs';
const point=(label,x,y,z)=>({label,x,y,z});
export const GUIDE_POINTS=Object.freeze([
 point('Depot benches',-12,0,15),point('Depot west quay',-4.5,0,18),
 point('Depot crossing',0,0,18),point('Blue door / court side',4.5,0,18),
 point('West street',-6,0,8.3),point('Market outer lane',-23,0,8),
 point('Market north corner',-23,0,-13.5),point('Arcade stair entrance',-18.5,0,-12.3),
 point('Storehouse doorway',-10,0,-14.5),point('Storehouse interior',-10,0,-17.5),
 point('North quay approach',-5,0,-13.5),point('North loop / west',-4,0,-20.2),
 point('North loop crossing',0,0,-20.2),point('North loop / east',4.5,0,-20.2),
 point('Pump approach',5,0,-14),point('Pump gallery',6.5,0,-12.4),
 point('Hoist repair approach',6.5,0,-8),point('Receiving court',6.5,0,8),
 point('Workshop front entrance',15,0,13),point('Workshop hall',15,0,10.7),
 point('Receiving bench',14,0,6),point('Workshop stair entrance',19.5,0,10.7),
 point('Greenhouse approach',12,0,-12),point('Greenhouse doorway',18,0,-13),
 point('Greenhouse interior',18,0,-17),point('Kitchen doorway',-20.5,0,3.4),
 point('Kitchen counter',-20.5,0,0),point('Print shop doorway',-12.5,0,8.3),
 point('Print public stair entrance',-12.5,0,5.1),point('Print room aisle',-9.6,0,5.1),
 point('Print receiver',-9.6,0,2.3),point('Print stair landing',-12.5,4.4,-3.2),
 point('Arcade upper landing',-18.5,4.4,-3.9),point('Terrace connection',-17,4.4,-4),
 point('Drying terrace',-14.5,4.4,-4.5),point('Roof bridge / west',-6.3,4.4,-3.5),
 point('Roof bridge',2,4.4,-3.5),point('Loading loft entry',10.5,4.4,-3.5),
 point('Loading loft',14,4.4,0),point('Workshop stair landing',19.5,4.4,2.4),
 point('South channel steps',-.5,0,15),point('South channel bed',-.5,-2,10.8),
 point('Maintenance channel',-.5,-2,1),point('North channel bed',-.5,-2,-9),
 point('North channel steps',-.5,0,-13.4)
].map(Object.freeze));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
// Mirrors static collision and support clearance, deliberately not moving cart
// timing or enemy positions. A suggested route is not a promise of no traffic.
export function walkLink(s,a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.18));let y=a.y;
 const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minZ=Math.min(a.z,b.z),maxZ=Math.max(a.z,b.z);
 const crosses=(r,p=0)=>r.x+r.w/2+p>=minX&&r.x-r.w/2-p<=maxX&&r.z+r.d/2+p>=minZ&&r.z-r.d/2-p<=maxZ;
 const localFloors=floors.filter(f=>crosses(f)),localWalls=walls.filter(w=>crosses(w,.31));
 for(let i=0;i<=n;i++){
  const u=i/n,x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u;
  if(Math.abs(x)>23.6||Math.abs(z)>20.6)return false;
  let next=-Infinity;
  for(const floor of localFloors){
   if(floor.low&&s.water!=='low'||!inside(x,z,floor))continue;
   const h=floorHeight(floor,z);if(h<=y+.31&&h>next)next=h;
  }
  if(!Number.isFinite(next))return false;
  // Use actual stepped support, not a straight diagonal through the landing.
  // A modest downward step is traversable; large drops need another approach.
  if(next>y+.31||y-next>.8)return false;y=next;
  if(s.water!=='low'&&y<.5&&inside(x,z,canal,-.08))return false;
  if(localWalls.some(w=>!(w.gate&&s.gate)&&y+.1<w.y+w.h&&y+1.7>w.y&&inside(x,z,w,.31)))return false;
 }
 return Math.abs(y-b.y)<.23;
}
const networks=new Map(),cache=new WeakMap();
function network(s,high){
 const key=String(!!s.gate)+'/'+s.water+'/'+high;if(networks.has(key))return networks.get(key);
 // Ordinary deliveries do not need the upper graph. Deduplicate shared stair
 // endpoints before building the high graph, keeping geometry checks unchanged.
 const points=high?[...new Map([...GUIDE_POINTS,...HIGHLINE_GUIDE_POINTS,...ARCHIVE_GUIDE].map(p=>[[p.x,p.y,p.z].join('/'),p])).values()]:GUIDE_POINTS;
 const edges=points.map(()=>[]);
 for(let i=0;i<edges.length;i++)for(let j=0;j<edges.length;j++)if(i!==j&&walkLink(s,points[i],points[j]))edges[i].push([j,dist(points[i],points[j])]);
 const result={points,edges};networks.set(key,result);return result;
}
function calculate(s,target){
 const start=point('You',s.x,s.y,s.z),goal={...target};
 if(s.ride==='boat'){
  const z=target.z<0?-11.5:12,cue=point('Public pier / dock to continue',-.5,-.72,z);
  return {target:goal,cue,path:[start,cue],hint:'Follow the canal to the pier, then use Mount / dock.',status:'dock',remaining:dist(start,cue)};
 }
 const base=network(s,s.y>6||target.y>6),nodes=[...base.points,start,goal],begin=nodes.length-2,end=nodes.length-1;
 const edges=base.edges.map(a=>a.slice());edges.push([],[]);
 for(const index of [begin,end])for(let j=0;j<index;j++){
  const cost=dist(nodes[index],nodes[j]);
  if(walkLink(s,nodes[index],nodes[j]))edges[index].push([j,cost]);
  if(walkLink(s,nodes[j],nodes[index]))edges[j].push([index,cost]);
 }
 const cost=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),seen=new Set();cost[begin]=0;
 for(let step=0;step<nodes.length;step++){
  let at=-1;for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&(at<0||cost[i]<cost[at]))at=i;
  if(at<0||!Number.isFinite(cost[at]))break;if(at===end)break;seen.add(at);
  for(const [to,d]of edges[at])if(cost[at]+d<cost[to]){cost[to]=cost[at]+d;prev[to]=at;}
 }
 if(!Number.isFinite(cost[end]))return {target:goal,cue:null,path:[],hint:'Use the marked public entrances; the gold marker is your destination.',status:'explore',remaining:dist(start,goal)};
 const path=[];for(let at=end;at!==-1;at=prev[at])path.unshift({...nodes[at]});
 const cue=path[1],near=dist(start,goal)<1.75&&lineClear(s,{...start,y:start.y+1},{...goal,y:goal.y+1});
 const climb=path.some((p,i)=>i&&Math.abs(p.y-path[i-1].y)>.5);
 const hint=near?'At the destination. Use its interaction.':s.ride==='bicycle'&&climb?'Dismount for the public stairs; follow the cyan way-in marker.':path.length>2?'Via '+cue.label+'.':'Continue to the gold objective marker.';
 return {target:goal,cue:near?null:cue,path,hint,status:near?'nearby':s.ride==='bicycle'&&climb?'dismount':'walk',remaining:cost[end]};
}
export function routeGuide(s,target){
 if(!target)return {target:null,cue:null,path:[],hint:'Choose an available mission.',status:'none',remaining:0};
 const key=[target.x,target.y,target.z,target.label,s.gate,s.water,s.ride].join('|'),old=cache.get(s);
 if(old&&old.key===key&&dist(old.from,s)<.25)return old.value;
 const value=calculate(s,target);cache.set(s,{key,from:{x:s.x,y:s.y,z:s.z},value});return value;
}
