// Original Dino Atlas ranger campaign. Pure rules are shared with automated tests.
export const RANGER_KEY = 'dino-atlas.ranger.v1';
export const HOME = {x:0,z:51};
export const LAKE = {x:-27,z:-32,r:13};
export const STATIONS = {
  gate:{x:0,z:24}, survey:{x:-23,z:5}, power:{x:31,z:-26},
  recorder:{x:47,z:-54}, home:HOME
};
export const ROADS = [
  [[0,60],[0,39],[0,23],[-12,13],[-25,6],[-41,-3],[-48,-15]],
  [[-25,6],[-8,-6],[10,-12],[25,-22],[35,-28],[37,-43],[47,-54]],
  [[0,23],[18,18],[31,7],[30,-7],[25,-22]],
  [[-8,-6],[-6,-28],[-6,-49],[12,-57],[28,-51],[37,-43]]
];
export const ANIMALS = [
  {id:'diplodocus',x:-24,z:1,scale:1.15,kind:'sauropod',color:0x738a57,radius:3.9},
  {id:'stegosaurus',x:-31,z:19,scale:1,kind:'stego',color:0x738b79,radius:2.3},
  {id:'triceratops',x:34,z:3,scale:1.05,kind:'trike',color:0xab8c61,radius:2.4},
  {id:'plateosaurus',x:-51,z:-16,scale:.85,kind:'biped',color:0x877454,radius:1.5},
  {id:'coelophysis',x:19,z:24,scale:.48,kind:'biped',color:0xbc804c,radius:.8},
  {id:'tyrannosaurus',x:50,z:-56,scale:1.35,kind:'rex',color:0x74684b,radius:3}
];
export const MISSIONS = [
  {key:'gate',title:'Beyond the gates',text:'Follow the road through the main park gate.',radio:'Ranger 07, you are cleared for departure. Stay on the marked trail.'},
  {key:'survey',title:'An encounter with giants',text:'Approach a plant-eater. Stop, then press E to record your observation.',radio:'Welcome to the valley. Approach quietly and add a dinosaur to your field journal.'},
  {key:'power',title:'Bring the relay online',text:'Drive to the amber relay station in the northeast. Stop and press E.',radio:'The northern research gate is offline. Restore its relay before proceeding.'},
  {key:'recorder',title:'Recover the field recorder',text:'Enter the northern habitat and retrieve the recorder. Watch the predator.',radio:'Research access restored. A recorder was left inside the northern habitat. Keep your engine ready.'},
  {key:'home',title:'Make it back to base',text:'Return the recorder to the visitor center. Stop in the marked bay and press E.',radio:'Recorder secured. Return to the visitor center, Ranger 07. Do not stop for the tyrannosaur.'},
  {key:'complete',title:'Expedition complete',text:'The recorder is safe. Free-roam the park and discover all six dinosaurs.',radio:'Excellent work, Ranger 07. The data is safe. The island is yours to explore.'}
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function seeded(seed=57241){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function roadDistance(x,z){
  let best=Infinity;
  for(const road of ROADS)for(let i=1;i<road.length;i++){
    const [ax,az]=road[i-1],[bx,bz]=road[i],dx=bx-ax,dz=bz-az;
    const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);
    best=Math.min(best,Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return best;
}
export function emptyRanger(){return {version:1,stage:0,observed:[],meters:0};}
export function sanitizeRanger(value){
  const p=emptyRanger();if(!value||value.version!==1)return p;
  if(Number.isInteger(value.stage))p.stage=clamp(value.stage,0,5);
  if(Array.isArray(value.observed))p.observed=[...new Set(value.observed.filter(id=>ANIMALS.some(a=>a.id===id)))];
  if(Number.isFinite(value.meters))p.meters=clamp(value.meters,0,1e8);
  return p;
}
export function readRanger(storage){try{return sanitizeRanger(JSON.parse(storage.getItem(RANGER_KEY)));}catch{return emptyRanger();}}
export function saveRanger(storage,p){try{storage.setItem(RANGER_KEY,JSON.stringify(sanitizeRanger(p)));return true;}catch{return false;}}
export function advance(p,event){if(p.stage>=5||MISSIONS[p.stage].key!==event)return false;p.stage++;return true;}
export function waypoint(p){return STATIONS[MISSIONS[Math.min(p.stage,4)].key];}
export function makeAnimalState(d,i){return {...d,origin:{x:d.x,z:d.z},angle:i*.9,phase:i*1.7,mood:'roaming',alarm:0};}
export function stepAnimal(a,car,dt,time,powered,hornAge=100){
  dt=clamp(dt,0,.05);const gap=distance(a,car),predator=a.kind==='rex';
  let tx,tz,speed;
  if(predator&&powered&&gap<27&&car.z<-37){
    a.mood=gap<12?'pursuing':'watching';tx=car.x;tz=car.z;speed=gap<12?7:3.4;
  }else if(!predator&&(gap<6||(hornAge<2&&gap<20))){
    a.mood='startled';a.alarm=2.5;
    tx=a.x+(a.x-car.x)*3;tz=a.z+(a.z-car.z)*3;speed=a.kind==='sauropod'?1.7:3.5;
  }else{
    a.alarm=Math.max(0,a.alarm-dt);a.mood=a.alarm?'alert':'roaming';
    tx=a.origin.x+Math.sin(time*.12+a.phase)*5;tz=a.origin.z+Math.cos(time*.12+a.phase)*4;
    speed=predator?1.1:a.kind==='sauropod'?.65:.95;
  }
  const dx=tx-a.x,dz=tz-a.z,len=Math.hypot(dx,dz);
  if(len>.25){const k=Math.min(speed*dt,len)/len;a.x+=dx*k;a.z+=dz*k;
    const aim=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(aim-a.angle),Math.cos(aim-a.angle));a.angle+=delta*Math.min(1,dt*2.3);}
  if(predator){a.x=clamp(a.x,24,68);a.z=clamp(a.z,-72,-40);}
  else{const r=distance(a,a.origin);if(r>11){a.x=a.origin.x+(a.x-a.origin.x)*11/r;a.z=a.origin.z+(a.z-a.origin.z)*11/r;}}
  return a;
}
