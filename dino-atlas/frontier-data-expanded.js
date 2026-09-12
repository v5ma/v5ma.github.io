// Spectacle & Trade expansion. Keeps the original Ranger Operations IDs/save format intact.
import * as base from './frontier-data.js?base=storm2';
export * from './frontier-data.js?base=storm2';

export const BONUS_SPECIES=[
 {id:'corythosaurus',species:'corythosaurus',name:'Corythosaurus',kind:'crested',color:0xb88f63,scale:.96,radius:1.9,role:'A social crested herbivore assigned to the northern meadow research herd.'},
 {id:'maiasaura',species:'maiasaura',name:'Maiasaura',kind:'crested',color:0x9d8065,scale:.93,radius:1.8,role:'A herd-focused hadrosaur used by the reserve team for nesting-behavior observation.'},
 {id:'ouranosaurus',species:'ouranosaurus',name:'Ouranosaurus',kind:'iguanodon',color:0x7e9c74,scale:1.02,radius:2.0,role:'A sail-backed herbivore ranging along the western service roads.'},
 {id:'kentrosaurus',species:'kentrosaurus',name:'Kentrosaurus',kind:'stego',color:0x8f805d,scale:.88,radius:1.7,role:'A compact plated herbivore with a heavily armed tail display.'},
 {id:'euoplocephalus',species:'euoplocephalus',name:'Euoplocephalus',kind:'ankylosaur',color:0x82745e,scale:.96,radius:2.1,role:'A low armored browser that prefers quiet routes and broad turning room.'},
 {id:'protoceratops',species:'protoceratops',name:'Protoceratops',kind:'trike',color:0xb69b72,scale:.54,radius:1.0,role:'A small ceratopsian maintained in a loose research group near the fossil lab.'},
 {id:'torosaurus',species:'torosaurus',name:'Torosaurus',kind:'trike',color:0x8f755d,scale:1.04,radius:2.5,role:'A large horned herbivore whose broad frill makes it easy to spot from the trail.'},
 {id:'argentinosaurus',species:'argentinosaurus',name:'Argentinosaurus',kind:'brachio',color:0x768d69,scale:1.42,radius:4.3,role:'A giant sauropod represented at reserve scale as one of the park flagship animals.'},
 {id:'camarasaurus',species:'camarasaurus',name:'Camarasaurus',kind:'brachio',color:0x8c956d,scale:1.08,radius:3.0,role:'A robust sauropod used in mixed-herd habitat studies.'},
 {id:'suchomimus',species:'suchomimus',name:'Suchomimus',kind:'spinosaur',color:0x668d7f,scale:1.06,radius:2.5,role:'A long-snouted predator assigned to the marsh-side observation program.'},
 {id:'baryonyx',species:'baryonyx',name:'Baryonyx',kind:'spinosaur',color:0x708b72,scale:.99,radius:2.3,role:'A fish-eating predator analogue kept near wetland patrol routes.'},
 {id:'ceratosaurus',species:'ceratosaurus',name:'Ceratosaurus',kind:'allosaur',color:0x965f4c,scale:.96,radius:2.2,role:'A medium theropod with a distinctive nasal crest and a wide patrol radius.'},
 {id:'carnotaurus',species:'carnotaurus',name:'Carnotaurus',kind:'allosaur',color:0xa05e46,scale:1.02,radius:2.4,role:'A fast horned theropod used for long-range ranger tracking exercises.'},
 {id:'oviraptor',species:'oviraptor',name:'Oviraptor',kind:'raptor',color:0x9b8b74,scale:.48,radius:.8,role:'A small feather-styled omnivore represented as a quick, curious reserve resident.'},
 {id:'therizinosaurus',species:'therizinosaurus',name:'Therizinosaurus',kind:'iguanodon',color:0x718b78,scale:1.04,radius:2.1,role:'A tall herbivorous theropod analogue with an unmistakable long-claw silhouette.'},
 {id:'deinonychus',species:'deinonychus',name:'Deinonychus',kind:'raptor',color:0x77898c,scale:.62,radius:1.0,role:'A compact pack predator used for ranger-response and tracking drills.'}
];

export const SPECIES=[...base.SPECIES,...BONUS_SPECIES];
export const LIBRARY_TOTAL=SPECIES.length;
export const speciesById=id=>SPECIES.find(s=>s.id===id);
export const PREDATORS=new Set(base.PREDATORS);

const WILD=[
 ['corythosaurus',-120,100],['maiasaura',-110,145],['ouranosaurus',-130,180],['kentrosaurus',-210,90],
 ['euoplocephalus',-225,50],['protoceratops',-35,210],['torosaurus',25,210],['argentinosaurus',120,120],
 ['camarasaurus',160,100],['suchomimus',35,-90],['baryonyx',60,-120],['ceratosaurus',175,-55],
 ['carnotaurus',210,-85],['oviraptor',100,175],['therizinosaurus',135,-180],['deinonychus',80,145],
 ['corythosaurus',-155,-55],['maiasaura',-125,-80],['protoceratops',-40,-150],['camarasaurus',100,-190],
 ['euoplocephalus',180,-190],['oviraptor',235,40],['therizinosaurus',170,60],['deinonychus',-205,-100]
];
export const ALL_ANIMALS=[...base.ALL_ANIMALS,...WILD.map(([id,x,z],i)=>{const d=speciesById(id);return {...d,uid:'spectacle-'+String(i+1).padStart(2,'0'),species:id,pen:null,x,z,scale:d.scale*(i>15?.9:1)};})];

export function operations(s){
 const tasks=base.operations(s).map(o=>({...o}));
 const survey=tasks.find(o=>o.id==='species');
 if(survey){survey.name='Complete the expanded reserve survey';survey.detail='Observe all 30 species across the core habitats and new open-range research herds.';survey.done=(s.observed||[]).filter(id=>SPECIES.some(d=>d.id===id)).length;survey.total=SPECIES.length;}
 return tasks;
}

export function sanitizeFrontier(v){
 const s=base.sanitizeFrontier(v);
 if(v&&v.version===2&&Array.isArray(v.observed))s.observed=[...new Set(v.observed.filter(id=>typeof id==='string'&&SPECIES.some(d=>d.id===id)))].slice(0,100);
 return s;
}
export function readFrontier(storage){try{return sanitizeFrontier(JSON.parse(storage?.getItem(base.FRONTIER_KEY)));}catch{return sanitizeFrontier(null);}}
export function saveFrontier(storage,s){try{storage?.setItem(base.FRONTIER_KEY,JSON.stringify(sanitizeFrontier(s)));return !!storage;}catch{return false;}}
