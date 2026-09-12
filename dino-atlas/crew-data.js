export const CREW_BUILD='crew-canopy-20260912.1';
export const CREW_KEY='dino-atlas.crew.v1';
export const CREW=[
 {id:'mara',name:'Mara Vale',role:'Chief ranger',skin:'female',x:-6,z:62,color:0xe8c57a,job:'field',line:'Welcome to the reserve. Start with the guided patrol, or study a calm grazer before approaching the predators. Read the amber warning before reaching for the zapper.'},
 {id:'leon',name:'Leon Park',role:'Redwood keeper',skin:'male',x:-175,z:47,color:0xa8d28e,job:'roundup',line:'Crest Meadow needs careful hands. Position yourself behind a stray, guide it toward the open gate, stock the feeder, and close the gate only when all four are safely inside.'},
 {id:'tess',name:'Tess Okoro',role:'Wetland quartermaster',skin:'female',x:-85,z:-71,color:0x86d6e3,job:'salvage',line:'The wetland channel runs west into the ocean. Three floating supply cases await a patrol boat. Recover them with A, then deliver at East Freight Pier.'},
 {id:'ivo',name:'Ivo Chen',role:'Canopy systems engineer',skin:'male',x:-36,z:-326,color:0x9ceacb,job:'canopy',line:'Northstar has two ways to the roof: the maintenance lift, or the exterior switchback service ascent. The Canopy Circuit tests the seed relay, roof sensor and circulation. Keep the landing pad clear.'},
 {id:'rhea',name:'Rhea Moss',role:'Northstar dispatcher',skin:'female',x:75,z:-216,color:0xb0c5ee,job:'storm',line:'Storm Response links Meridian, two research rooftops and a coastal delivery. Request the unoccupied helicopter and boat at their marked transfer desks. Suspending retains your checkpoint.'},
 {id:'owen',name:'Owen Reed',role:'FossilWorks surveyor',skin:'male',x:218,z:-137,color:0xddad86,job:'bones',line:'The boneyards are field sites, not drive-through exhibits. Park, dismount and inspect the survey case on foot. Three recorded sites complete the FossilWorks assignment.'},
 {id:'ada',name:'Ada Lin',role:'Coastal safety officer',skin:'female',x:208,z:106,color:0x8ecbdc,job:'race',line:'The boat circuit runs entirely outside the island. Cross the start buoy at speed, then the 24 markers in order. Pause stops the clock. Your best lap is saved; vehicles take no damage.'}
];
export function emptyCrew(){return {version:1,met:[],tour:false,reported:false,fieldlight:true,avatar:'male'};}
export function sanitizeCrew(v){const s=emptyCrew();if(!v||v.version!==1)return s;if(Array.isArray(v.met))s.met=[...new Set(v.met.filter(id=>CREW.some(c=>c.id===id)))];for(const k of ['tour','reported','fieldlight'])if(typeof v[k]==='boolean')s[k]=v[k];if(['male','female','classic'].includes(v.avatar))s.avatar=v.avatar;return s;}
export function readCrew(storage){try{return sanitizeCrew(JSON.parse(storage?.getItem(CREW_KEY)));}catch{return emptyCrew();}}
export function saveCrew(storage,s){try{if(!storage)return false;storage.setItem(CREW_KEY,JSON.stringify(sanitizeCrew(s)));return true;}catch{return false;}}
export function contactAllowed(player,staff,mode,speed){return mode==='foot'&&Math.abs(speed)<3&&Math.abs(player.y-1)<2.4&&Math.hypot(player.x-staff.x,player.z-staff.z)<4.4;}
export function meetCrew(s,id){if(!CREW.some(c=>c.id===id)||s.met.includes(id))return false;s.met.push(id);return true;}
