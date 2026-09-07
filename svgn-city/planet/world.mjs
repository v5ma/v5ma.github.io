import {at,unit,dot,geo,tangent,mul,hash,rotate,cross,angle} from './math.mjs';
export const RADIUS=32, VERSION='0.2.0', SAVE_KEY='svgn.city.planet.v1';
const bay=at(1.7,-.95);
export function elevation(n){const land=.45+.2*Math.sin(n[0]*11+n[2]*4)*Math.cos(n[1]*9-n[2]*6);const sea=Math.max(0,(dot(n,bay)-.76)/.24);return land-2.7*sea;}
export const surfaceRadius=n=>RADIUS+Math.max(.06,elevation(n));
export const waterAt=n=>elevation(n)<.08;
export const position=(n,lift=0)=>mul(n,surfaceRadius(n)+lift);
export function ringPoint(t){return at(t,.025*Math.sin(3*t));}
export function ringHeading(t){const a=ringPoint(t-.001),b=ringPoint(t+.001);return unit(b.map((v,i)=>v-a[i]));}
export const roadDistance=n=>Math.abs(Math.asin(Math.max(-1,Math.min(1,n[2])))-.025*Math.sin(Math.atan2(n[0],n[1])*3))*RADIUS;
export function makeWorld(){
 const homes=[],obstacles=[],trees=[],mountains=[],lamps=[];
 function building(id,u,v,kind){const n=at(u,v),f=tangent(n),size=kind==='tower'?2.2:kind==='newsroom'?3:kind==='cabin'?2:2.3;const h={id,n,f,u,v,kind,size,color:Math.floor(hash(id.length+u*70)*4)};homes.push(h);obstacles.push({id,n,r:size+.25});return h;}
 building('newsroom',-.13,.19,'newsroom');
 for(const [i,u,v,kind]of [[0,.27,.20,'home'],[1,.53,-.20,'home'],[2,.89,.20,'home'],[3,-.45,-.19,'home'],[4,-.77,.22,'home'],[5,1.27,-.2,'home'],[6,2.08,.24,'tower'],[7,2.36,.19,'tower'],[8,2.55,-.17,'tower'],[9,2.83,.17,'tower'],[10,-2.7,-.18,'cabin'],[11,-1.83,.19,'cabin'],[12,.49,.65,'cabin']])building('house-'+i,u,v,kind);
 const posts=[{id:'maple',name:'Maple Cottage',n:at(.27,.102),route:true},{id:'willow',name:'Willow Row',n:at(.53,-.103),route:true},{id:'fern',name:'Fern House',n:at(.89,.102),route:true},{id:'cove',name:'Cove Steps',n:at(1.27,-.103)},{id:'metro',name:'Skyline Corner',n:at(2.55,-.093)},{id:'pine',name:'Pine Grove',n:at(-1.83,.098)}];
 const relay={id:'grove-relay',name:'Grove relay',n:at(1.23,.23)},depot={n:at(-.14,.082),name:'SVGN world desk'};
 for(let i=0;i<32;i++){const u=i/32*Math.PI*2;lamps.push({n:at(u,i%2?.07:-.07),f:tangent(at(u,0))});}
 const river=[];for(let i=0;i<=64;i++){const t=i/64,u=.04+1.23*t+.09*Math.sin(t*8),v=.98-1.8*t;river.push(at(u,v));}
 const bridgeU=.04+1.23*(.98/1.8)+.09*Math.sin(.98/1.8*8);
 const trails=[{id:'grove',width:1.55,points:Array.from({length:80},(_,i)=>at(-.9+i/79*2.3,.46+.14*Math.sin(i/79*Math.PI*2)))},{id:'forest',width:1.35,points:Array.from({length:75},(_,i)=>at(-1.2-i/74*2.8,-.43+.10*Math.sin(i/74*7)))},{id:'uphill',width:1.4,points:Array.from({length:26},(_,i)=>at(.49,.03+i/25*.60))}];
 const meadow=at(-.28,-.63);
 for(let i=0;i<260;i++){
  const u=hash(i*9+2)*Math.PI*2-Math.PI,v=Math.asin(hash(i*4+6)*2-1),n=at(u,v);
  if(waterAt(n)||roadDistance(n)<3.3||homes.some(h=>geo(n,h.n,RADIUS)<h.size+2)||geo(n,relay.n,RADIUS)<3.2||river.some(p=>geo(n,p,RADIUS)<2.0)||trails.some(t=>t.points.some(p=>geo(n,p,RADIUS)<1.55)))continue;
  const pine=Math.abs(u)>1.1||v>.48,size=2.9+hash(i+50)*3.7;trees.push({n,f:tangent(n),pine,size,seed:i});
  obstacles.push({id:'tree-'+i,n,r:.30});
 }
 for(const [u,v,r,h]of [[-.60,.97,3.5,8],[.08,1.20,4.3,11],[.54,1.06,3.1,7.2],[-2.3,.75,4.3,8.6],[-2.75,.6,3.1,6]]){const n=at(u,v);mountains.push({n,r,h});obstacles.push({id:'rock-'+u,n,r:r*.72});}
 const animals=Array.from({length:5},(_,i)=>({id:i,base:at(-.65+i*.19,-.43-.12*(i%2)),phase:hash(i)*6.28}));
 const districts=[{id:'terrace',name:'Sunrise Terrace',n:at(0,0)},{id:'grove',name:'Cloudpine Grove',n:at(-1.8,.3)},{id:'harbor',name:'Harbor Quarter',n:at(2.4,-.05)}];
 return {radius:RADIUS,homes,obstacles,trees,mountains,posts,relay,depot,lamps,river,bridgeU,trails,animals,districts,ring:Array.from({length:257},(_,i)=>ringPoint(i/256*Math.PI*2))};
}
export function district(n,w){return [...w.districts].sort((a,b)=>angle(n,a.n)-angle(n,b.n))[0].name;}
