/* Authored additions to the existing world. t is distance along its street;
 * x is the east/west surface offset. Rendering and collision share this data. */
import {street,RADIUS,distance,streetPosition} from './world.mjs';
export const CITY_SAVE_KEY='svgn.signal-city.v1';
export const STORY=Object.freeze({hero:'James Vega',crew:'Open Signal',system:'CivicGrid',mission:'The Waterfront File'});
export const coordinates=n=>({t:streetPosition(n),x:Math.asin(Math.max(-1,Math.min(1,n[0])))*RADIUS});
const place=(id,name,t,x,extra={})=>({id,name,t,x,n:street(t,x),...extra});
export const CITY={
 desk:place('desk','SVGN newsroom field desk',-9,-4.2),
 contact:place('contact','Nia / Open Signal',116,12),
 garage:place('garage','Switchback Garage',132,21),
 report:place('report','Beacon Quay field report',206,57),
 roads:[
  {id:'plaza-entry',a:[116,0],b:[116,25],width:6},
  {id:'city-avenue',a:[116,25],b:[213,25],width:7},
  {id:'rear-alley',a:[158,13],b:[195,13],width:2.3},
  {id:'alley-entry',a:[158,13],b:[158,25],width:2.3},
  {id:'alley-exit',a:[195,13],b:[195,25],width:2.3},
  {id:'harbor-bridge',a:[206,25],b:[206,59],width:6},
  {id:'quay-road',a:[195,55],b:[222,55],width:6}
 ],
 buildings:[
  place('garage-shell','Switchback Garage',132,16,{w:7,d:9,h:4,type:'garage',color:'#cfbda2'}),
  place('signal-shop','Open Signal',145,18,{w:6,d:7,h:8,type:'shop',color:'#bdac8b'}),
  place('loft','Bayview Apartments',147,32,{w:6,d:8,h:13,type:'office',color:'#99b4ba'}),
  place('civic-office','CivicGrid',166,33,{w:6,d:10,h:16,type:'office',color:'#668c99'}),
  place('archive','CivicGrid records',189,33,{w:7,d:11,h:7,type:'office',color:'#8dada5'}),
  place('quay-store','Harbor Electric',214,62,{w:6,d:8,h:5,type:'shop',color:'#d1a573'}),
  place('quay-hotel','The Beacon',199,63,{w:7,d:9,h:12,type:'office',color:'#ded2b2'}),
  place('cafe','Copperleaf Cafe',112,19,{w:5,d:4,h:4,type:'shop',color:'#d9956f'})
 ],
 solids:[
  place('west-fence','Service yard fence',182,19,{w:.35,d:22,h:2.5}),
  place('front-fence','Checkpoint fence',170,21,{w:4,d:.3,h:2.5}),
  place('front-right','Checkpoint fence',170,29.5,{w:3,d:.3,h:2.5}),
  place('cover-1','Loading cases',180,21.5,{w:1.5,d:3,h:1.25}),
  place('cover-2','Cable drums',184,28.5,{w:1.5,d:2,h:1.2}),
  place('vault','Low garden barrier',159,15.2,{w:1.7,d:.45,h:.55})
 ],
 gate:place('gate-barrier','Vehicle checkpoint',170,25.5,{w:5,d:.32,h:2.5}),
 devices:[
  place('traffic','Plaza traffic signal',117,22,{kind:'traffic',time:1.1}),
  place('power','Checkpoint power junction',158,24,{kind:'power',time:1.3}),
  place('gate','Service gate control',168,22,{kind:'gate',time:1.5,requires:'power'}),
  place('camera','Yard camera loop',178,27,{kind:'camera',time:1.6}),
  place('speaker','Loading-bay speaker',180,20.5,{kind:'speaker',time:1.1}),
  place('evidence','CivicGrid evidence terminal',190,24,{kind:'evidence',time:2.5})
 ],
 guards:[place('guard-0','CivicGrid patrol',182,25.5,{route:[[175,25.5],[188,25.5]]}),place('guard-1','Quay patrol',213,57,{route:[[201,57],[218,57]]})],
 vehicles:[place('press','SVGN press hatchback',18,4,{color:'#d9a04f',parked:true}),place('taxi','Copper cab',128,26.5,{color:'#e3bd48',parked:false}),place('van','Harbor service car',204,53.5,{color:'#8ca8a9',parked:true})],
 jobs:[place('cafe-job','Cafe courier dispatch',143,21,{reward:45}),place('quay-job','Harbor battery delivery',216,52,{reward:65})]
};
function segmentDistance(t,x,a,b){const dt=b[0]-a[0],dx=b[1]-a[1],q=Math.max(0,Math.min(1,((t-a[0])*dt+(x-a[1])*dx)/(dt*dt+dx*dx)));return Math.hypot(t-a[0]-q*dt,x-a[1]-q*dx);}
export function clearedForCity(n){const {t,x}=coordinates(n);if(t<110||t>228)return false;return CITY.roads.some(r=>segmentDistance(t,x,r.a,r.b)<r.width/2+2.7)||CITY.buildings.some(b=>Math.abs(t-b.t)<b.d/2+2&&Math.abs(x-b.x)<b.w/2+2)||CITY.devices.some(d=>distance(n,d.n)<3);}
export function cityCollision(n,r=.38,alt=0,gateOpen=true){const {t,x}=coordinates(n);const all=[...CITY.buildings,...CITY.solids,...(gateOpen?[]:[CITY.gate])];return all.find(b=>alt<b.h&&Math.abs(t-b.t)<b.d/2+r&&Math.abs(x-b.x)<b.w/2+r);}
// Slab intersection in the same local street chart. This is a small-district
// LOS model, not an earth-scale raycast; blocks and walls have real height.
export function sightBlocked(a,ah,b,bh,gateOpen){const p=coordinates(a),q=coordinates(b);for(const box of [...CITY.buildings,...CITY.solids,...(gateOpen?[]:[CITY.gate])]){
 const starts=[p.t,p.x,ah],ends=[q.t,q.x,bh],mins=[box.t-box.d/2,box.x-box.w/2,0],maxs=[box.t+box.d/2,box.x+box.w/2,box.h];let enter=0,exit=1;
 for(let i=0;i<3;i++){const d=ends[i]-starts[i];if(Math.abs(d)<1e-8){if(starts[i]<mins[i]||starts[i]>maxs[i]){enter=2;break;}}else{const u=(mins[i]-starts[i])/d,v=(maxs[i]-starts[i])/d;enter=Math.max(enter,Math.min(u,v));exit=Math.min(exit,Math.max(u,v));}}
 if(enter<=exit&&exit>.03&&enter<.97)return true;
 }return false;
}
export function cityDistrict(n){const {t,x}=coordinates(n);return x>43&&t>190?'BEACON QUAY':t>110&&x>9?'SIGNAL PLAZA':'SUNRISE TERRACE';}
