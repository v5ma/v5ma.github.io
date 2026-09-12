/* Crosswind Arsenal combat spaces. Geometry is original and data-driven. */
export const RAIL_TUNING=Object.freeze({cruise:48,accelerate:64,boost:96,brake:8,arrival:10,acceleration:58,boostAcceleration:82,braking:92});
export const COMBAT_DECKS=Object.freeze([
 {id:'customs-yard',name:'Customs Freight Yard',home:'harbor',x:24,y:0,z:15,w:44,d:34},
 {id:'pump-court',name:'Glasshouse Pump Court',home:'garden',x:88,y:6,z:-37,w:42,d:34},
 {id:'loading-yard',name:'Copperlight Loading Yard',home:'foundry',x:-49,y:12,z:-97,w:46,d:36}
]);
export const ARENA_CONSOLES=Object.freeze(COMBAT_DECKS.map(d=>({id:'arena-'+d.id,name:d.name+' combat trial',x:d.x-d.w*.36,y:d.y,z:d.z+d.d*.32})));
export const ARENA_TASKS=Object.freeze(COMBAT_DECKS.map((d,i)=>({id:'arena-'+d.id,name:['Crosswind Qualification','Pump Court Sweep','Copperlight Counterattack'][i],flag:'arena-'+d.id+'-done',reward:150+i*40})));
export const ARENA_LOADOUTS=Object.freeze(['carbine','sniper','scatter']);
export const ARENA_SPAWNS=Object.freeze(COMBAT_DECKS.map(d=>({id:d.id,points:[
 [d.x+d.w*.32,d.y+1.05,d.z-d.d*.28],[d.x+d.w*.18,d.y+1.05,d.z+d.d*.28],[d.x-d.w*.05,d.y+1.05,d.z-d.d*.10]
]})));
export const RIFTS=Object.freeze([
 {id:'rift-quay-cover',type:'cover',x:17,y:0,z:11,w:6,d:1.1,h:2.2},
 {id:'rift-quay-medic',type:'medical',x:29,y:0,z:9,w:2.2,d:2.2,h:2},
 {id:'rift-garden-turret',type:'turret',x:90,y:6,z:-29,w:2,d:2,h:2.4},
 {id:'rift-foundry-cover',type:'cover',x:-45,y:12,z:-90,w:7,d:1.2,h:2.4}
]);
export const asBox=r=>({x1:r.x-r.w/2,x2:r.x+r.w/2,y1:r.y,y2:r.y+r.h,z1:r.z-r.d/2,z2:r.z+r.d/2});
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
const bridgeNear=(p,b)=>{const ax=b.a[0],az=b.a[2],bx=b.b[0],bz=b.b[2],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.z-az)*dz)/(l2||1)));return Math.hypot(p.x-(ax+dx*t),p.z-(az+dz*t))<4;};
export function buildCombatCover(districts,{solids=[],keepouts=[],bridges=[],rails=[]}={}){
 const pieces=[];let serial=0;const railNear=c=>rails.some(r=>r.pts?.some(p=>Math.hypot(c.x-p.x,c.z-p.z)<3.2));const blocked=c=>keepouts.some(k=>near(c,k,3.2))||solids.some(s=>c.x>s.x1-1&&c.x<s.x2+1&&c.z>s.z1-1&&c.z<s.z2+1)||bridges.some(b=>bridgeNear(c,b))||railNear(c);
 const add=(d,x,z,w,h,depth,kind='crate')=>{const c={id:'combat-cover-'+(++serial),x,y:d.y,z,w,h,d:depth,kind};if(!blocked(c))pieces.push(c);};
 // Preserve the original streets and transfer shelves. Cover is concentrated in
 // the three deliberately enlarged combat annexes, which overlap their host island.
 for(const d of COMBAT_DECKS){for(const [rx,rz,w,h,depth] of [[0,0,8,1.45,2.3],[.24,.18,5,2.2,1.1],[-.25,-.18,6,1.25,2],[.22,-.25,4.5,1.0,2.2],[-.22,.27,5.5,1.65,1.2],[.34,-.02,4,1.15,1.6],[-.34,.04,5,1.8,1.1]])add(d,d.x+rx*d.w,d.z+rz*d.d,w,h,depth,h>1.7?'wall':'freight');}
 return pieces;
}
