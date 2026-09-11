// Wild Frontier II: deterministic reserve layout and save-safe management rules.
import {ANIMALS,clamp,distance} from './ranger-data.js';
export const FRONTIER_KEY='dino-atlas.frontier.v2';
export const MAP_RADIUS=310;
export const LAGOON={x:-208,z:14,rx:65,rz:124};
export const inWater=(p,margin=0)=>((p.x-LAGOON.x)/(LAGOON.rx+margin))**2+((p.z-LAGOON.z)/(LAGOON.rz+margin))**2<1;
export const OUTPOSTS=[
 {id:'base',name:'Visitor Center',x:0,z:51},
 {id:'lakeside',name:'Lagoon Outpost',x:-131,z:65},
 {id:'east',name:'Ridge Station',x:126,z:9},
 {id:'north',name:'Highland Research',x:42,z:-132},
 {id:'south',name:'Southern Lookout',x:0,z:157},
 {id:'lagoon-north',name:'North Shore Dock',x:-208,z:-124}
];
export const ENCLOSURES=[
 {id:'fern',name:'Fern Hollow',x:-91,z:85,w:60,d:48,color:0x6b9369},
 {id:'horn',name:'Horn Prairie',x:105,z:79,w:72,d:58,color:0x94966b},
 {id:'armor',name:'Armored Ridge',x:186,z:-9,w:66,d:56,color:0x909d76},
 {id:'raptor',name:'Raptor Basin',x:122,z:-133,w:62,d:52,color:0x718471},
 {id:'giant',name:'Giant Valley',x:-20,z:-184,w:84,d:64,color:0x819773},
 {id:'spino',name:'Spinosaur Wetlands',x:-118,z:-130,w:54,d:56,color:0x679183},
 {id:'amber',name:'Amber Uplands',x:76,z:208,w:64,d:54,color:0xaba076}
];
export const gatePosition=e=>({x:e.x,z:e.z+e.d/2});
export const gateConsole=e=>({x:e.x-9,z:e.z+e.d/2+4});
export const feederPosition=e=>({x:e.x+9,z:e.z+e.d/2+4});
export const insidePen=(p,e,margin=0)=>Math.abs(p.x-e.x)<e.w/2-margin&&Math.abs(p.z-e.z)<e.d/2-margin;
export const NEW_SPECIES=[
 {id:'ankylosaurus',name:'Ankylosaurus',kind:'anky',scale:1,color:0x82866a,radius:2.2,diet:'Plant-eater',note:'Look for the low armored silhouette and the club at the end of the tail.'},
 {id:'parasaurolophus',name:'Parasaurolophus',kind:'para',scale:1.05,color:0xaa8052,radius:1.8,diet:'Plant-eater',note:'A duck-billed dinosaur distinguished here by its long backward-curving crest.'},
 {id:'brachiosaurus',name:'Brachiosaurus',kind:'brachio',scale:1.35,color:0x68856b,radius:4.1,diet:'Plant-eater',note:'An enormous long-necked sauropod. Leave plenty of turning room around the herd.'},
 {id:'allosaurus',name:'Allosaurus',kind:'allo',scale:1.12,color:0x9c7353,radius:2.4,diet:'Meat-eater',note:'A large Jurassic predator. In this fictional reserve it investigates nearby vehicles.'},
 {id:'spinosaurus',name:'Spinosaurus',kind:'spino',scale:1.35,color:0x647e78,radius:3,diet:'Meat-eater',note:'Recognize the long snout and tall back sail. Its behavior here is designed for gameplay.'},
 {id:'velociraptor',name:'Velociraptor',kind:'raptor',scale:.5,color:0xad8660,radius:.85,diet:'Meat-eater',note:'A small feathered theropod, not the human-sized movie animal. Give the research group space.'}
];
const originals=Object.fromEntries(ANIMALS.map(a=>[a.id,a]));
const species=Object.fromEntries(NEW_SPECIES.map(a=>[a.id,a]));
const rosters={fern:['parasaurolophus','parasaurolophus','plateosaurus','coelophysis'],horn:['triceratops','triceratops','parasaurolophus','ankylosaurus'],armor:['ankylosaurus','ankylosaurus','stegosaurus','stegosaurus'],raptor:['velociraptor','velociraptor','velociraptor','allosaurus'],giant:['brachiosaurus','brachiosaurus','diplodocus','parasaurolophus'],spino:['spinosaurus','spinosaurus','coelophysis','parasaurolophus'],amber:['allosaurus','plateosaurus','ankylosaurus','triceratops']};
export const EXTRA_ANIMALS=ENCLOSURES.flatMap(e=>rosters[e.id].map((id,i)=>({...originals[id],...species[id],id,uid:e.id+'-'+i,pen:e.id,x:e.x+(i%2?9:-9),z:e.z+(i<2?-8:8),phase:i*2})));
// One clearly identifiable runaway gives the first herding assignment a real subject.
EXTRA_ANIMALS.find(a=>a.uid==='fern-0').x=-89;
EXTRA_ANIMALS.find(a=>a.uid==='fern-0').z=126;
export const ALL_ANIMALS=[...ANIMALS.map(a=>({...a,uid:a.id,pen:null})),...EXTRA_ANIMALS];
export const VEHICLES=[
 {id:'ranger-07',type:'jeep',name:'Ranger 07',x:0,z:51,heading:Math.PI},
 {id:'atlas-air',type:'helicopter',name:'Atlas Air 01',x:19,z:54,heading:Math.PI},
 {id:'ridge-rover',type:'rover',name:'Ridge Utility Rover',x:126,z:20,heading:Math.PI},
 {id:'south-jeep',type:'jeep',name:'Southern Ranger',x:0,z:169,heading:Math.PI},
 {id:'lagoon-launch',type:'boat',name:'Lagoon Launch',x:-153,z:65,heading:Math.PI},
 {id:'north-launch',type:'boat',name:'North Shore Launch',x:-208,z:-100,heading:0}
];
export const ROUTES=[
 [[-25,6],[-63,24],[-84,47],[-131,65]],
 [[0,60],[0,96],[0,157],[45,170],[76,244]],
 [[0,96],[-45,118],[-91,117],[-131,65]],
 [[0,96],[60,122],[105,116],[126,49],[126,9],[166,32],[186,28]],
 [[31,-26],[84,-49],[126,9]],
 [[37,-43],[42,-86],[42,-132],[0,-142],[-20,-143]],
 [[42,-86],[85,-96],[122,-99],[164,-73],[186,28]],
 [[-6,-49],[-66,-79],[-118,-94],[-138,-143],[-167,-163],[-208,-124]],
 [[42,-132],[15,-247],[-67,-248],[-138,-143]],
 [[76,244],[132,203],[180,138],[105,116]],
 [[-131,65],[-129,17],[-118,-94]],
 [[-20,-143],[-20,-151]],[[122,-99],[122,-107]],[[186,28],[186,19]],[[105,116],[105,108]],[[76,244],[76,235]]
];
export const CHECKPOINTS=[{id:'valley',x:-60,z:23},{id:'lagoon',x:-131,z:40},{id:'south',x:0,z:117},{id:'prairie',x:59,z:122},{id:'ridge',x:149,z:30},{id:'north',x:42,z:-83},{id:'raptor',x:93,z:-97},{id:'wetland',x:-96,z:-87},{id:'highland',x:-25,z:-247},{id:'amber',x:132,z:203}];
export const CRATES=[{id:'blast-1',x:17,z:40},{id:'blast-2',x:22,z:40},{id:'blast-3',x:27,z:40},{id:'blast-4',x:133,z:22},{id:'blast-5',x:139,z:22},{id:'blast-6',x:12,z:173}];
export function emptyFrontier(){return {version:2,outposts:['base'],checkpoint:'base',gates:{},fed:[],secured:[],observed:[],checkpoints:[],stats:{water:0,zap:0,explosions:0,recoveries:0,flight:0,sailing:0},tracked:'lakeside'};}
export function sanitizeFrontier(v){
 const p=emptyFrontier();if(!v||v.version!==2)return p;
 for(const [key,valid] of [['outposts',OUTPOSTS.map(a=>a.id)],['fed',ENCLOSURES.map(e=>e.id)],['secured',ENCLOSURES.map(e=>e.id)],['observed',ALL_ANIMALS.map(a=>a.id)],['checkpoints',CHECKPOINTS.map(a=>a.id)]])if(Array.isArray(v[key]))p[key]=[...new Set(v[key].filter(id=>valid.includes(id)))];
 if(!p.outposts.includes('base'))p.outposts.unshift('base');if(p.outposts.includes(v.checkpoint))p.checkpoint=v.checkpoint;
 for(const e of ENCLOSURES)if(typeof v.gates?.[e.id]==='boolean')p.gates[e.id]=v.gates[e.id];
 for(const k of Object.keys(p.stats))if(Number.isFinite(v.stats?.[k]))p.stats[k]=clamp(v.stats[k],0,1e8);
 if(typeof v.tracked==='string'&&JOBS.some(j=>j.id===v.tracked))p.tracked=v.tracked;return p;
}
export function readFrontier(storage){try{return sanitizeFrontier(JSON.parse(storage.getItem(FRONTIER_KEY)));}catch{return emptyFrontier();}}
export function saveFrontier(storage,p){try{storage.setItem(FRONTIER_KEY,JSON.stringify(sanitizeFrontier(p)));return true;}catch{return false;}}
export const JOBS=[
 {id:'lakeside',title:'Establish a foothold',text:'Drive west and rest at Lagoon Outpost. E activates the checkpoint and refills tools.',target:'lakeside',done:s=>s.outposts.includes('lakeside')},
 {id:'water',title:'Give the giants space',text:'Select water with 1. Aim at a nearby dinosaur and hold F to push it away.',target:'fern',done:s=>s.stats.water>0},
 {id:'zap',title:'Short-range herding',text:'Select the pulse zapper with 2. Aim and use F within 11 meters of an animal.',target:'fern',done:s=>s.stats.zap>0},
 {id:'fern',title:'Bring the stray home',text:'Open Fern Hollow at its left gate console. Activate the right feeder, lead the stray through, then close the gate.',target:'fern',done:s=>s.secured.includes('fern')},
 {id:'feeding',title:'Feeding round',text:'Activate the feeder terminals at three different enclosures.',target:'horn',done:s=>s.fed.length>=3},
 {id:'flight',title:'Highland air patrol',text:'Board the helicopter with V, rise with Q, fly north and land with Z. Rest at Highland Research.',target:'north',done:s=>s.stats.flight>150&&s.outposts.includes('north')},
 {id:'sailing',title:'Across the lagoon',text:'Board a launch at the western dock. Cross the lagoon, disembark near shore and rest at North Shore Dock.',target:'lagoon-north',done:s=>s.stats.sailing>100&&s.outposts.includes('lagoon-north')},
 {id:'outposts',title:'An island-wide network',text:'Activate all six outposts. Rest points refill tools and save your checkpoint.',target:'south',done:s=>s.outposts.length===OUTPOSTS.length},
 {id:'checkpoints',title:'Every road tells a story',text:'Pass through all ten blue trail checkpoint rings.',target:'amber',done:s=>s.checkpoints.length===CHECKPOINTS.length},
 {id:'blast',title:'The rollover yard',text:'Bump a marked orange blast crate with a vehicle. No damage and no lost progress.',target:'yard',done:s=>s.stats.explosions>0},
 {id:'upright',title:'Back on your wheels',text:'Experience a rollover. Automatic recovery rights your vehicle where it fell.',target:'yard',done:s=>s.stats.recoveries>0},
 {id:'survey',title:'A living atlas',text:'Observe all twelve species using E nearby or the scanner tool (4 then F).',target:'giant',done:s=>s.observed.length>=12},
 {id:'secure',title:'Reserve under control',text:'Feed every new enclosure and close its gate with all assigned animals inside.',target:'raptor',done:s=>s.secured.length===ENCLOSURES.length}
];
export function jobTarget(id){const j=JOBS.find(j=>j.id===id);return OUTPOSTS.find(p=>p.id===j?.target)||ENCLOSURES.find(p=>p.id===j?.target)||{x:22,z:40};}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
export function managementStep(a,actor,dt,time,state,lure=null){
 const e=ENCLOSURES.find(e=>e.id===a.pen),predator=['rex','allo','spino','raptor'].includes(a.kind);let tx,tz,speed=predator?1.45:.95;
 a.deterrent=Math.max(0,(a.deterrent||0)-dt);a.hitCooldown=Math.max(0,(a.hitCooldown||0)-dt);
 if(a.deterrent>0){tx=a.x+a.flee.x*8;tz=a.z+a.flee.z*8;speed=a.tool==='zap'?5:3.6;a.mood='herding';}
 else if(lure&&distance(a,lure)<40){tx=lure.x;tz=lure.z;speed=1.9;a.mood='following lure';}
 else if(e&&state.fed.includes(e.id)){tx=e.x+Math.sin(a.phase)*5;tz=e.z+Math.cos(a.phase)*5;speed=1.9;a.mood='returning to feeder';}
 else if(predator&&distance(a,actor)<22&&(!e||insidePen(actor,e))){tx=actor.x;tz=actor.z;speed=a.kind==='raptor'?5.8:4.2;a.mood='investigating';}
 else {tx=a.origin.x+Math.sin(time*.09+a.phase)*8;tz=a.origin.z+Math.cos(time*.11+a.phase)*7;a.mood='roaming';}
 // Route a runaway through the real gate, instead of letting it clip through a fence.
 if(e&&insidePen({x:tx,z:tz},e)!==insidePen(a,e)&&state.gates[e.id]){
  const g=gatePosition(e),inside=insidePen(a,e);if(Math.abs(a.x-g.x)>3||Math.abs(a.z-g.z)>4){tx=g.x;tz=g.z+(inside?-3:3);}else{tx=g.x;tz=g.z+(inside?6:-6);}
 }
 const dx=tx-a.x,dz=tz-a.z,len=Math.hypot(dx,dz),old={x:a.x,z:a.z};
 if(len>.35){const k=Math.min(speed*dt,len)/len;a.x+=dx*k;a.z+=dz*k;const yaw=Math.atan2(dx,dz);a.angle+=Math.atan2(Math.sin(yaw-a.angle),Math.cos(yaw-a.angle))*Math.min(1,dt*4);}
 if(e){const wasInside=insidePen(old,e),nowInside=insidePen(a,e),g=gatePosition(e);
  const crossing=wasInside!==nowInside,clear=state.gates[e.id]&&Math.abs(a.x-g.x)<5&&Math.abs(a.z-g.z)<4;
  if(crossing&&!clear){a.x=old.x;a.z=old.z;a.mood='at fence';}
 }
 if(inWater(a)||Math.hypot(a.x,a.z)>MAP_RADIUS-5){a.x=old.x;a.z=old.z;}
 return a;
}
export function applyDeterrent(a,source,tool){let x=a.x-source.x,z=a.z-source.z,l=Math.hypot(x,z);if(l<.01){x=0;z=-1;l=1;}a.flee={x:x/l,z:z/l};a.deterrent=tool==='zap'?3.2:1.3;a.tool=tool;a.mood='herding';}
export function toolTarget(animals,source,aim,range,cosine=.91){let best=null;const len=Math.hypot(aim.x-source.x,aim.z-source.z)||1,fx=(aim.x-source.x)/len,fz=(aim.z-source.z)/len;
 for(const a of animals){const dx=a.x-source.x,dz=a.z-source.z,gap=Math.hypot(dx,dz);if(gap<=range+a.radius&&gap>.1&&(dx*fx+dz*fz)/gap>cosine&&(!best||gap<best.gap))best={animal:a,gap};}return best?.animal||null;}
