import {buildCity} from './city-data.mjs';
/* Shared spherical world coordinates, plus an authored multi-street neighborhood. */
export const RADIUS=880;
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const mul=(a,t)=>a.map(v=>v*t);
export const norm=a=>{const l=Math.hypot(...a);return l>1e-9?mul(a,1/l):[0,1,0];};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const tangent=(v,n)=>norm(add(v,mul(n,-dot(v,n))));
export function rotate(v,axis,angle){const c=Math.cos(angle),s=Math.sin(angle);return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)));}
export const at=(x,z)=>{const a=x/RADIUS,b=z/RADIUS;return [Math.sin(a)*Math.cos(b),Math.cos(a)*Math.cos(b),Math.sin(b)];};
export const distance=(a,b)=>Math.acos(clamp(dot(a,b),-1,1))*RADIUS;
export const street=(t,lateral=0)=>{const a=t/RADIUS,b=lateral/RADIUS;return [Math.sin(b),Math.cos(b)*Math.cos(a),-Math.cos(b)*Math.sin(a)];};
export const streetPosition=n=>Math.atan2(-n[2],n[1])*RADIUS;
export const localPosition=n=>({t:streetPosition(n),x:Math.asin(clamp(n[0],-1,1))*RADIUS});
// Keep streets above sea level everywhere, including the far side and poles.
export function height(n){const a=Math.atan2(-n[2],n[1]);return Math.max(.04,.6*Math.sin(a*3)+.3*Math.cos(n[0]*9+a*2));}
export const point=(n,lift=0)=>mul(n,RADIUS+height(n)+lift);
export const rand=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const sample=(t0,x0,t1,x1,steps)=>Array.from({length:steps+1},(_,i)=>{const q=i/steps;return {t:t0+(t1-t0)*q,x:x0+(x1-x0)*q,n:street(t0+(t1-t0)*q,x0+(x1-x0)*q)};});
function roadDef(id,name,t0,x0,t1,x1,width,steps=90){const coords=sample(t0,x0,t1,x1,steps),horizontal=Math.abs(t1-t0)>=Math.abs(x1-x0),offset=width/2+1.05;const sidewalks=horizontal?[sample(t0,x0-offset,t1,x1-offset,steps).map(p=>p.n),sample(t0,x0+offset,t1,x1+offset,steps).map(p=>p.n)]:[sample(t0-offset,x0,t1-offset,x1,steps).map(p=>p.n),sample(t0+offset,x0,t1+offset,x1,steps).map(p=>p.n)];return {id,name,width,a:[t0,x0],b:[t1,x1],coords,points:coords.map(p=>p.n),sidewalks};}
const circumference=Math.PI*2*RADIUS;
export const ROADS=[roadDef('main','Sunrise Boulevard',0,0,circumference,0,6.4,552),roadDef('oak','Oak Avenue',-12,-20,136,-20,5.6,150),roadDef('market','Market Street',-12,20,136,20,5.6,150),roadDef('ridge','Ridge Road',18,36,128,36,5.2,112),...[18,42,66,90,114].map((t,i)=>roadDef('cross-'+i,['1st Street','2nd Street','3rd Street','4th Street','5th Street'][i],t,-20,t,36,4.8,58))];
const CROSS_T=[18,42,66,90,114];
export const ROAD_LABELS=[{name:'OAK AVE',t:18,x:-20},{name:'MARKET ST',t:42,x:20},{name:'RIDGE RD',t:66,x:36},{name:'3RD ST',t:66,x:0},{name:'5TH ST',t:114,x:20}];
const nearRoad=n=>{const {t,x}=localPosition(n);if(Math.abs(x)<5.8)return true;if(t>-15&&t<140&&(Math.abs(x+20)<5||Math.abs(x-20)<5||((t>15&&t<132)&&Math.abs(x-36)<4.8)))return true;if(CROSS_T.some(c=>Math.abs(t-c)<4.5)&&x>-25&&x<42)return true;return false;};
function mainSite(id,name,t,side,color,type='cabin'){return {id,name,t,side,x:side*9.3,color,type,n:street(t,side*9.3),mail:street(t,side*5.1),message:id==='post'?'Pick any route. Deliver to the raised mailbox flags, then return here.':id==='garden'?'The neighborhood now opens into Oak Avenue, Market Street and Ridge Road.':'Thanks for bringing the neighborhood news!'};}
function bonusSite(id,name,t,roadX,outward,sign){const x=roadX+outward*8.3,mailX=roadX+outward*4.0;return {id,name,t,x,roadX,side:outward,color:['#e7c49d','#c9d7c4','#d2c8da','#c6d8de'][Math.abs(id.length+t)%4],type:'bonus',bonus:true,sign,n:street(t,x),mail:street(t,mailX),message:'BONUS DELIVERY · '+name};}
export function world(){const specs=[['post','SVGN delivery depot',-9,-1,'#efca83','post'],['cabin','01 · Cedar House',12,-1,'#f0d3ae','cabin'],['fern','02 · Fern Terrace',24,1,'#b7cfb4','cabin'],['mill','03 · Willow Cottage',36,-1,'#e9b39f','mill'],['terrace','04 · Bayview Terrace',48,1,'#c3d5cf','cabin'],['beacon','05 · Observatory House',60,-1,'#e6d6b2','cabin'],['market','06 · Corner Store',72,1,'#e7bd8c','post'],['quay','07 · Seabreeze House',84,-1,'#b8c4d9','cabin'],['harbor','08 · Harbor House',96,1,'#e0c1bc','cabin'],['garden','Community garden',111,-1,'#bfcf9a','garden']];const sites=specs.map(v=>mainSite(...v)),homes=sites.filter(s=>!['post','garden'].includes(s.id));
 const bonusStops=[bonusSite('bonus-oak-1','Oak Books',30,-20,-1,'BOOKS'),bonusSite('bonus-oak-2','Juniper Bakery',58,-20,-1,'BAKERY'),bonusSite('bonus-oak-3','Westside Records',102,-20,-1,'RECORDS'),bonusSite('bonus-market-1','Market Arcade',26,20,1,'ARCADE'),bonusSite('bonus-market-2','Sunrise Camera',54,20,1,'CAMERA'),bonusSite('bonus-market-3','Bay Repair',82,20,1,'REPAIR'),bonusSite('bonus-market-4','Harbor Cafe',122,20,1,'CAFE'),bonusSite('bonus-ridge-1','Ridge Flowers',38,36,1,'FLOWERS'),bonusSite('bonus-ridge-2','Skyline Market',76,36,1,'MARKET'),bonusSite('bonus-ridge-3','Lookout News',110,36,1,'NEWS')];
 const trees=[];for(let i=0;i<260;i++){const z=rand(i+991)*2-1,a=rand(i)*Math.PI*2,n=[Math.sqrt(1-z*z)*Math.sin(a),Math.sqrt(1-z*z)*Math.cos(a),z];if(nearRoad(n)||[...sites,...bonusStops].some(s=>distance(s.n,n)<5)||height(n)<-.3)continue;trees.push({id:'tree-'+i,n,size:1.15+rand(i+2)*1.55,style:i%5===0?'fir':'oak',seed:i});}
 for(let i=0;i<12;i++)for(const side of[-1,1])trees.push({id:'avenue-'+i+'-'+side,n:street(i*12+5,side*6.8),size:1.15+rand(i)*.5,style:'oak',seed:i+300});for(const [r,x] of [['oak',-20],['market',20],['ridge',36]])for(let i=0;i<8;i++){const t=8+i*15,side=(i%2?1:-1),n=street(t,x+side*7.2);if(![...sites,...bonusStops].some(s=>distance(s.n,n)<4))trees.push({id:'street-tree-'+r+'-'+i,n,size:1.1+rand(i+700+x)*.42,style:'oak',seed:700+i+Math.round(x)});}
 const rocks=[[65,-46,21],[100,54,27],[140,48,28],[35,51,18],[220,-30,15]].map(([t,x,size],i)=>({n:street(t,x),size,id:'rock-'+i}));const stars=Array.from({length:24},(_,i)=>({id:'stamp-'+i,n:street(7+i*7.5,[0,-20,20,36][i%4])}));const stuntGates=[{id:'stunt-1',name:'Oak sprint gate',n:street(42,-20),minSpeed:14},{id:'stunt-2',name:'Market speed gate',n:street(90,20),minSpeed:14},{id:'stunt-3',name:'Ridge boost gate',n:street(114,36),minSpeed:16}];
 const mirror=homes.map((h,i)=>({...h,id:'scenery-main-'+i,type:'cabin',side:-h.side,x:-h.x,n:street(h.t,-h.side*9.3),mail:street(h.t,-h.side*5.1),color:['#d5c9b8','#e2c8a1','#bdd0c2'][i%3]}));const branchScenery=bonusStops.map((h,i)=>({...h,id:'scenery-branch-'+i,bonus:false,sign:null,type:'cabin',x:h.roadX-h.side*8.4,n:street(h.t,h.roadX-h.side*8.4),mail:street(h.t,h.roadX-h.side*4.1),floors:i%3===0?3:i%2===0?2:1,color:['#d8c7a8','#aac2bd','#c8b3a8','#b7c3d0'][i%4]}));const buildings=[...sites,...mirror,...bonusStops,...branchScenery];return {sites,homes,bonusStops,buildings,trees,rocks,stars,stuntGates,roads:ROADS,roadLabels:ROAD_LABELS};}
export const WORLD=world();

export const CITY=buildCity(RADIUS);
WORLD.bonusStops.push(...CITY.districts);
WORLD.stars.push(...CITY.stars);
WORLD.stuntGates.push(...CITY.gates);
// The former mountain props must not obstruct the new street connections.
WORLD.rocks=WORLD.rocks.filter(r=>CITY.roads.every(road=>road.points.every(n=>distance(n,r.n)>r.size*.43+4))&&CITY.nearby(r.n).every(b=>distance(r.n,b.n)>r.size*.43+Math.hypot(b.w,b.d)/2));
