// Ranger Operations expansion. Fictional reserve behavior, not paleoecology.
import {ANIMALS, HOME, clamp, distance, seeded} from './ranger-data.js';
import {seaWater,WORLD_EDGE} from './ranch-data.js';
export const BUILD='ranch-coast-20260911.1';
export const FRONTIER_KEY='dino-atlas.frontier.v2';
export const WORLD_RADIUS=WORLD_EDGE;
export const WATER=[{x:-164,z:-155,rx:76,rz:57},{x:-238,z:-152,rx:38,rz:25}];
export const DOCK={x:-78,z:-151};
export const isWater=(x,z,margin=0)=>seaWater(x,z,margin)||WATER.some(w=>((x-w.x)/(w.rx+margin))**2+((z-w.z)/(w.rz+margin))**2<1);
export const OUTPOSTS=[
 {id:'base',name:'Visitor Center',x:0,z:51,pad:{x:19,z:54},color:0xe3bf77},
 {id:'redwood',name:'Redwood Lookout',x:-178,z:42,pad:{x:-158,z:42},color:0xaac783},
 {id:'wetland',name:'Wetland Research',x:-89,z:-78,pad:{x:-69,z:-78},color:0x7bc2c8},
 {id:'north',name:'Northstar Station',x:70,z:-222,pad:{x:90,z:-222},color:0xc4c5e0},
 {id:'mesa',name:'Amber Mesa',x:223,z:-143,pad:{x:243,z:-143},color:0xd4a77e},
 {id:'coast',name:'Coastal Watch',x:214,z:99,pad:{x:234,z:99},color:0xe0ca9d}
];
// Each enclosure has an accessible southern gate and a terminal outside it.
export const PENS=[
 {id:'redwood-giants',name:'Redwood Giants',x:-152,z:-4,hx:26,hz:23,color:0x6a8558,species:['brachiosaurus','diplodocus','brachiosaurus','diplodocus']},
 {id:'armored-valley',name:'Armored Valley',x:-194,z:121,hx:25,hz:23,color:0x869363,species:['ankylosaurus','stegosaurus','ankylosaurus','stegosaurus']},
 {id:'crest-meadow',name:'Crest Meadow',x:-58,z:174,hx:26,hz:24,color:0x9aab70,species:['parasaurolophus','iguanodon','parasaurolophus','iguanodon']},
 {id:'raptor-run',name:'Raptor Run',x:105,z:161,hx:25,hz:23,color:0xad9570,species:['velociraptor','velociraptor','velociraptor','velociraptor']},
 {id:'predator-ridge',name:'Predator Ridge',x:184,z:-20,hx:27,hz:24,color:0x917759,species:['allosaurus','tyrannosaurus','allosaurus','allosaurus']},
 {id:'sail-marsh',name:'Sail Marsh',x:26,z:-148,hx:26,hz:26,color:0x5a8c78,species:['spinosaurus','coelophysis','spinosaurus','coelophysis']},
 {id:'highland-herd',name:'Highland Herd',x:151,z:-168,hx:26,hz:23,color:0x8d926e,species:['pachycephalosaurus','triceratops','pachycephalosaurus','triceratops']},
 {id:'north-nursery',name:'North Nursery',x:-63,z:-245,hx:25,hz:23,color:0x799985,species:['iguanodon','plateosaurus','brachiosaurus','ankylosaurus']}
];
export const penTerminal=p=>({x:p.x+10,z:p.z+p.hz+5});
export const insidePen=(a,p,inset=0)=>Math.abs(a.x-p.x)<=p.hx-inset+1e-7&&Math.abs(a.z-p.z)<=p.hz-inset+1e-7;
export const SPECIES=[
 ...ANIMALS.map(a=>({...a,species:a.id,name:({diplodocus:'Diplodocus',stegosaurus:'Stegosaurus',triceratops:'Triceratops',plateosaurus:'Plateosaurus',coelophysis:'Coelophysis',tyrannosaurus:'Tyrannosaurus rex'})[a.id],role:a.kind==='rex'?'Territorial predator. Watch for a shoulder charge.':'Observe quietly. Water can guide the animal away from a road.'})),
 {id:'brachiosaurus',species:'brachiosaurus',name:'Brachiosaurus',kind:'brachio',color:0x7b9671,scale:1.23,radius:3.9,role:'A towering resident of Redwood Giants. Allow room for its turn.'},
 {id:'ankylosaurus',species:'ankylosaurus',name:'Ankylosaurus',kind:'ankylosaur',color:0x927f59,scale:1.05,radius:2.4,role:'An armored resident. Herd from a distance rather than crowd its tail.'},
 {id:'parasaurolophus',species:'parasaurolophus',name:'Parasaurolophus',kind:'crested',color:0xbc8753,scale:.95,radius:1.8,role:'A crested herd animal. Short water bursts make it move away.'},
 {id:'iguanodon',species:'iguanodon',name:'Iguanodon',kind:'iguanodon',color:0x779c91,scale:1,radius:2,role:'A meadow resident. Refilled feeders help guide it home.'},
 {id:'velociraptor',species:'velociraptor',name:'Velociraptor',kind:'raptor',color:0x829395,scale:.58,radius:.95,role:'A small, feather-styled park predator. A zapper pulse interrupts its pursuit.'},
 {id:'allosaurus',species:'allosaurus',name:'Allosaurus',kind:'allosaur',color:0x986d4e,scale:1.13,radius:2.8,role:'A mobile predator. Keep an exit route when approaching.'},
 {id:'spinosaurus',species:'spinosaurus',name:'Spinosaurus',kind:'spinosaur',color:0x678e89,scale:1.22,radius:3,role:'A sail-backed marsh resident. Use the service road or survey from the air.'},
 {id:'pachycephalosaurus',species:'pachycephalosaurus',name:'Pachycephalosaurus',kind:'dome',color:0xab9175,scale:.78,radius:1.5,role:'A compact highland resident. Give it space when it becomes alert.'}
];
export const speciesById=id=>SPECIES.find(s=>s.id===id);
export const PREDATORS=new Set(['rex','allosaur','raptor','spinosaur']);
export const ALL_ANIMALS=[...ANIMALS.map((a,i)=>({...a,uid:'legacy-'+i,species:a.id,pen:null})),
 ...PENS.flatMap(p=>p.species.map((id,i)=>({...speciesById(id),uid:p.id+'-'+i,species:id,pen:p.id,x:p.x+[-8,7,0,0][i],z:i===3?p.z+p.hz+13:p.z+[-7,-5,8][i],scale:speciesById(id).scale*(p.id==='north-nursery'?.65:1)}))),
 {...speciesById('parasaurolophus'),uid:'wild-meadow',species:'parasaurolophus',pen:null,x:-22,z:-102},
 {...speciesById('allosaurus'),uid:'wild-forest',species:'allosaurus',pen:null,x:-244,z:0}
];
export const TRAILS=[
 [[0,60],[0,98],[-32,138],[-58,203],[-126,202],[-194,151],[-216,83],[-178,42],[-117,43],[-66,19],[-41,-3]],
 [[0,98],[57,113],[105,190],[157,160],[214,99],[227,29],[194,11],[176,-67],[223,-143],[196,-204],[151,-196],[110,-233],[70,-222],[-5,-227],[-63,-215],[-109,-202]],
 [[-48,-15],[-90,-38],[-89,-78],[-72,-109],[-77,-151]],
 [[-6,-49],[-3,-93],[26,-118],[60,-157],[70,-222]],
 [[31,-26],[88,-38],[135,-18],[184,9]],
 [[-89,-78],[-152,-74],[-207,-38],[-178,42]],
 [[-3,-93],[-65,-111],[-89,-78]],
 [[214,99],[160,91],[93,53],[35,48]],
 [[-63,-215],[-18,-170],[26,-118]]
];
export const FLEET_START=[
 {id:'jeep',type:'jeep',name:'Ranger Jeep 07',x:HOME.x,z:HOME.z,heading:Math.PI},
 {id:'helicopter',type:'helicopter',name:'Survey Helicopter',x:19,z:54,heading:Math.PI},
 {id:'boat',type:'boat',name:'Wetland Patrol Boat',x:-93,z:-151,heading:-Math.PI/2},
 {id:'buggy',type:'buggy',name:'Electric Field Buggy',x:-158,z:49,heading:Math.PI}
];
export const TOOLS=[
 {id:'water',name:'Pressure hose',capacity:100,reserve:400,reload:2.0,rate:20,range:38,color:0x86d8f2},
 {id:'zapper',name:'Herding zapper',capacity:12,reserve:48,reload:1.5,rate:1,range:32,color:0xbedaff}
];
export const CHECKPOINTS=[{x:0,z:96},{x:-58,z:210},{x:-197,z:151},{x:-174,z:45},{x:-86,z:-83},{x:24,z:-115},{x:66,z:-220},{x:218,z:-140},{x:212,z:98},{x:103,z:188}];
export function emptyFrontier(){return {version:2,outposts:['base'],checkpoint:'base',observed:[],pens:{},tool:0,ammo:[100,12],reserve:[400,48],toolHits:{water:0,zapper:0},exploded:[],rides:[],patrol:0,patrolDone:false,active:'jeep',poses:{},foot:{x:0,y:1,z:55},tracked:'outposts',settings:{camera:'orbit',night:false,low:false,reduced:false,sensitivity:1,vibration:true}};}
export function sanitizeFrontier(v){
 const s=emptyFrontier();if(!v||v.version!==2)return s;
 for(const key of ['outposts','observed','exploded','rides'])if(Array.isArray(v[key]))s[key]=[...new Set(v[key].filter(x=>typeof x==='string'&&(key==='outposts'?OUTPOSTS.some(o=>o.id===x):key==='observed'?SPECIES.some(d=>d.id===x):key==='rides'?FLEET_START.some(f=>f.type===x):/^blast-\d{1,2}$/.test(x))))].slice(0,100);
 if(!s.outposts.includes('base'))s.outposts.unshift('base');if(s.outposts.includes(v.checkpoint))s.checkpoint=v.checkpoint;
 for(const p of PENS){const a=v.pens?.[p.id];if(a&&typeof a==='object')s.pens[p.id]={open:!!a.open,fed:!!a.fed,secured:!!a.secured};}
 for(const k of ['ammo','reserve'])if(Array.isArray(v[k]))s[k]=TOOLS.map((t,i)=>Number.isFinite(v[k][i])?clamp(v[k][i],0,k==='ammo'?t.capacity:t.reserve):s[k][i]);
 s.tool=v.tool===1?1:0;
 for(const key of ['water','zapper'])if(Number.isFinite(v.toolHits?.[key]))s.toolHits[key]=clamp(Math.floor(v.toolHits[key]),0,1e6);
 s.patrol=Number.isInteger(v.patrol)?clamp(v.patrol,0,CHECKPOINTS.length):0;s.patrolDone=!!v.patrolDone;
 if(v.active==='foot'||FLEET_START.some(f=>f.id===v.active))s.active=v.active;
 for(const f of FLEET_START){const p=v.poses?.[f.id];if(p&&[p.x,p.y,p.z,p.heading].every(Number.isFinite)&&Math.hypot(p.x,p.z)<WORLD_RADIUS-4)s.poses[f.id]={x:p.x,y:clamp(p.y,.7,85),z:p.z,heading:p.heading};}
 if(v.foot&&[v.foot.x,v.foot.y,v.foot.z].every(Number.isFinite)&&Math.hypot(v.foot.x,v.foot.z)<WORLD_RADIUS-4)s.foot={x:v.foot.x,y:clamp(v.foot.y,1,85),z:v.foot.z};
 if(['outposts','pens','species','patrol','vehicles','tools'].includes(v.tracked))s.tracked=v.tracked;
 if(v.settings&&typeof v.settings==='object'){for(const k of ['night','low','reduced','vibration'])if(typeof v.settings[k]==='boolean')s.settings[k]=v.settings[k];if(['orbit','chase'].includes(v.settings.camera))s.settings.camera=v.settings.camera;if(Number.isFinite(v.settings.sensitivity))s.settings.sensitivity=clamp(v.settings.sensitivity,.4,2);}
 return s;
}
export function readFrontier(storage){try{return sanitizeFrontier(JSON.parse(storage.getItem(FRONTIER_KEY)));}catch{return emptyFrontier();}}
export function saveFrontier(storage,s){try{storage.setItem(FRONTIER_KEY,JSON.stringify(sanitizeFrontier(s)));return true;}catch{return false;}}
export function penState(s,p){return s.pens[p.id]??(s.pens[p.id]={open:true,fed:false,secured:false});}
export function nearestOutpost(p){return [...OUTPOSTS].sort((a,b)=>distance(a,p)-distance(b,p))[0];}
export function operations(s){return [
 {id:'outposts',name:'Establish the ranger network',detail:'Visit and rest at all six outpost terminals.',done:s.outposts.length,total:6,target:OUTPOSTS.find(o=>!s.outposts.includes(o.id))},
 {id:'pens',name:'Restore containment',detail:'Refill feeders, guide each resident inside, and close its gate.',done:PENS.filter(p=>s.pens[p.id]?.secured).length,total:8,target:(()=>{const p=PENS.find(p=>!s.pens[p.id]?.secured);return p&&penTerminal(p);})()},
 {id:'species',name:'Complete the reserve survey',detail:'Observe all 14 species. The original field journal stays intact.',done:s.observed.length,total:14},
 {id:'vehicles',name:'Land, sky and water',detail:'Board and operate the jeep, helicopter, boat and field buggy.',done:s.rides.length,total:4,target:FLEET_START.find(f=>!s.rides.includes(f.type))},
 {id:'tools',name:'Ranger equipment training',detail:'Guide animals with both the pressure hose and electric herding tool.',done:Number(s.toolHits.water>0)+Number(s.toolHits.zapper>0),total:2},
 {id:'patrol',name:'Island perimeter patrol',detail:'Pass through each marked checkpoint in order. No time limit.',done:s.patrolDone?CHECKPOINTS.length:s.patrol,total:CHECKPOINTS.length,target:CHECKPOINTS[Math.min(s.patrol,CHECKPOINTS.length-1)]}
 ];}
// Stateful arcade behavior. A tool pushes away from the ranger and suppresses charges.
export function createResident(d,i){return {...d,origin:{x:d.x,z:d.z},angle:i*.83,phase:i*1.39,mood:'roaming',deter:0,stun:0,toolVector:{x:0,z:1},attackCooldown:0};}
export function deterAnimal(a,origin,kind){const dx=a.x-origin.x,dz=a.z-origin.z,l=Math.hypot(dx,dz)||1;a.toolVector={x:dx/l,z:dz/l};a.deter=kind==='zapper'?7.5:kind==='horn'?4.5:6;a.stun=kind==='zapper'?1.1:0;a.effect=kind;a.herdSpeed=kind==='horn'?4.4:5.6;a.mood=kind==='zapper'?'stunned':'being herded';}
export function stepResident(a,player,dt,time,state,hornAge=100){
 dt=clamp(dt,0,.05);a.attackCooldown=Math.max(0,a.attackCooldown-dt);a.deter=Math.max(0,a.deter-dt);a.stun=Math.max(0,a.stun-dt);
 const pen=PENS.find(p=>p.id===a.pen),ps=pen?penState(state,pen):null,old={x:a.x,z:a.z},gap=distance(a,player);let tx,tz,speed=.8;
 if(a.deter>0){tx=a.x+a.toolVector.x*12;tz=a.z+a.toolVector.z*12;speed=(a.herdSpeed||5.6)*(a.kind==='sauropod'||a.kind==='brachio'?.68:1);a.mood=a.stun?'stunned':'being herded';if(a.stun)speed=0;}
 else if(PREDATORS.has(a.kind)&&gap<21&&player.y<5&&(!pen||!ps.open?(!pen||insidePen(player,pen)):true)&&!(a.uid==='legacy-5'&&player.z> -38)){
  tx=player.x;tz=player.z;speed=gap<14?5.5:2.2;a.mood='pursuing';
 }else if(!PREDATORS.has(a.kind)&&(gap<4.5||hornAge<1.8&&gap<23)){
  tx=a.x+(a.x-player.x);tz=a.z+(a.z-player.z);speed=2.8;a.mood='startled';
 }else if(pen&&ps.fed){
  const outside=!insidePen(a,pen,0),south=pen.z+pen.hz;tx=pen.x+Math.sin(a.phase)*7;tz=pen.z-4+Math.cos(a.phase)*7;
  if(outside){if(a.z<south+3&&Math.abs(a.x-pen.x)>5){tx=pen.x+Math.sign(a.x-pen.x)*(pen.hx+4);tz=south+7;}else if(Math.abs(a.x-pen.x)>2.5){tx=pen.x;tz=south+7;}else{tx=pen.x;tz=ps.open?south-7:south+5;}}speed=2.5;a.mood='returning to feeder';
 }else{tx=a.origin.x+Math.sin(time*.16+a.phase)*7;tz=a.origin.z+Math.cos(time*.13+a.phase)*5;speed=a.kind==='sauropod'||a.kind==='brachio'?.65:1;a.mood='roaming';}
 const dx=tx-a.x,dz=tz-a.z,len=Math.hypot(dx,dz);if(len>.2&&speed){a.x+=dx/len*Math.min(speed*dt,len);a.z+=dz/len*Math.min(speed*dt,len);const want=Math.atan2(dx,dz);a.angle+=Math.atan2(Math.sin(want-a.angle),Math.cos(want-a.angle))*Math.min(1,dt*3);}
 if(pen){
  // Rectangular wall crossing is blocked except at the real southern gate.
  const r=Math.min(a.radius*.6,1.5),was=insidePen(old,pen,0),now=insidePen(a,pen,0),gateX=Math.abs(a.x-pen.x)<5-r;
  if(was&&!insidePen(a,pen,r)&&!(ps.open&&gateX&&a.z>pen.z)){a.x=clamp(a.x,pen.x-pen.hx+r,pen.x+pen.hx-r);a.z=clamp(a.z,pen.z-pen.hz+r,pen.z+pen.hz-r);}
  if(!was&&now&&!(ps.open&&gateX&&old.z>pen.z+pen.hz-3)){a.x=old.x;a.z=old.z;}
  if(distance(a,pen)>70){a.x=old.x;a.z=old.z;}
 }else if(a.uid==='legacy-5'){a.x=clamp(a.x,24,68);a.z=clamp(a.z,-72,-40);}
 else if(distance(a,a.origin)>20){const l=distance(a,a.origin);a.x=a.origin.x+(a.x-a.origin.x)*20/l;a.z=a.origin.z+(a.z-a.origin.z)*20/l;}
 if(isWater(a.x,a.z,2)){a.x=old.x;a.z=old.z;}
 return a;
}
