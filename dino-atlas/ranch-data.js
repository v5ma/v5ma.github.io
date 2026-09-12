// Ranch & Coast: pure geography, task and save models. One world unit is one metre.
export const RANCH_BUILD='ranch-coast-20260911.1';
export const RANCH_KEY='dino-atlas.ranch.v1';
export const LAND_RADIUS=420, WORLD_EDGE=535, RACE_RADIUS=465;
export const BUILDINGS=[
 {id:'north-lab',name:'Northstar Canopy Institute',x:-30,z:-353,h:24,hx:22,hz:17,color:0x8fcabb,record:'Canopy habitat archive'},
 {id:'east-hub',name:'Meridian Logistics Atrium',x:340,z:-94,h:18,hx:23,hz:18,color:0xd1b780,record:'Emergency supply manifest'},
 {id:'south-lab',name:'South Coast Biosecurity Center',x:110,z:355,h:21,hx:22,hz:17,color:0x92b8d2,record:'Coastal ecosystem survey'}
];
export const BONEYARDS=[
 {id:'red-bones',name:'Redwood Rib Basin',x:-325,z:148},
 {id:'amber-bones',name:'Amber Titan Graveyard',x:276,z:267},
 {id:'north-bones',name:'Windfall Fossil Ravine',x:-184,z:-326}
];
export const HARBORS=[
 {id:'wetland',name:'Wetland Dock',x:-78,z:-151,land:{x:-73,z:-151},boat:{x:-94,z:-151}},
 {id:'east',name:'East Freight Pier',x:411,z:40,land:{x:410,z:40},boat:{x:437,z:40}},
 {id:'north',name:'North Research Pier',x:10,z:-411,land:{x:10,z:-409},boat:{x:10,z:-438}},
 {id:'south',name:'South Rescue Pier',x:0,z:411,land:{x:0,z:409},boat:{x:0,z:438}}
];
export const SALVAGE=[{id:'cargo-a',x:346,z:-311},{id:'cargo-b',x:273,z:376},{id:'cargo-c',x:-374,z:276}];
const start=Math.atan2(-152,-440);
export const RACE_GATES=Array.from({length:24},(_,i)=>{const a=start+i*Math.PI*2/24;return {id:i,x:Math.cos(a)*RACE_RADIUS,z:Math.sin(a)*RACE_RADIUS,angle:a};});
export const EXTRA_ROADS=[
 [[-178,42],[-275,57],[-325,148]],
 [[70,-222],[24,-296],[-30,-324],[-30,-330]],
 [[-63,-215],[-138,-288],[-184,-305]],
 [[223,-143],[284,-131],[340,-65]],
 [[214,99],[329,103],[406,40]],
 [[105,190],[166,267],[110,327]],
 [[214,99],[267,183],[276,243]],
 [[-58,203],[-15,300],[0,402]],
 [[70,-222],[65,-345],[10,-402]]
];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function seaWater(x,z,margin=0){const r=Math.hypot(x,z);return r>LAND_RADIUS-margin&&r<WORLD_EDGE+margin||x< -222+margin&&x> -478-margin&&Math.abs(z+152)<18+margin;}
export function roofAt(x,z){return BUILDINGS.find(b=>Math.abs(x-b.x)<b.hx-1&&Math.abs(z-b.z)<b.hz-1)||null;}
export function surfaceAt(p){const b=roofAt(p.x,p.z);return b&&p.y>b.h-1?b.h:0;}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,d=dx*dx+dz*dz;const t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
export function emptyRanch(){return {version:1,tutorial:0,guided:true,welcomed:false,done:[],records:[],bones:[],salvage:[],rewards:[],bestLap:null,bestRoundup:null,hornHits:0,crewDeliveries:0,crewScore:{meridian:0,fossilworks:0,greenline:0}};}
export function sanitizeRanch(v){const s=emptyRanch();if(!v||v.version!==1)return s;for(const k of ['guided','welcomed'])if(typeof v[k]==='boolean')s[k]=v[k];for(const k of ['tutorial','hornHits','crewDeliveries'])if(Number.isFinite(v[k]))s[k]=Math.max(0,Math.min(k==='tutorial'?10:1e6,Math.floor(v[k])));const choices={done:['drive','horn','water','zapper','feed','pen','trade','boat','roof','interior'],records:BUILDINGS.map(b=>b.id),bones:BONEYARDS.map(b=>b.id),salvage:SALVAGE.map(b=>b.id),rewards:['school','roundup','bones','salvage',...BUILDINGS.map(b=>b.id)]};for(const [k,ids] of Object.entries(choices))if(Array.isArray(v[k]))s[k]=[...new Set(v[k].filter(x=>ids.includes(x)))];for(const k of ['bestLap','bestRoundup'])if(Number.isFinite(v[k])&&v[k]>0)s[k]=Math.min(86400,v[k]);for(const k of Object.keys(s.crewScore))if(Number.isFinite(v.crewScore?.[k]))s.crewScore[k]=Math.max(0,Math.min(1e6,Math.floor(v.crewScore[k])));return s;}
export function readRanch(storage){try{return sanitizeRanch(JSON.parse(storage?.getItem(RANCH_KEY)));}catch{return emptyRanch();}}
export function saveRanch(storage,s){try{if(!storage)return false;storage.setItem(RANCH_KEY,JSON.stringify(sanitizeRanch(s)));return true;}catch{return false;}}
export class CoastRace{
 constructor(){this.active=false;this.running=false;this.index=0;this.time=0;this.last=null;this.splits=[];this.reason='';}
 start(){this.active=true;this.running=false;this.index=0;this.time=0;this.last=null;this.splits=[];this.reason='';}
 cancel(reason='Race cancelled.'){this.active=false;this.running=false;this.reason=reason;}
 step(p,mode,dt,speed=0){if(!this.active||dt<=0)return null;if(mode!=='boat'){if(this.running)this.cancel('Race ended because you left the boat.');this.last=null;return null;}if(p.y>4)return null;const old=this.last||p;this.last={x:p.x,z:p.z};if(distance(p,old)>55){this.cancel('Race cancelled after a position jump. Your best time is safe.');return null;}if(!this.running){if(distance(p,RACE_GATES[0])<19&&speed>1){this.running=true;this.index=1;this.time=0;return {type:'start'};}return null;}
 this.time+=Math.min(.1,dt);const gate=RACE_GATES[this.index%24];if(segmentDistance(gate,old,p)>19)return null;this.splits.push(this.time);this.index++;if(this.index>24){this.active=false;this.running=false;return {type:'finish',time:this.time,medal:this.time<=210?'Gold':this.time<=285?'Silver':'Bronze'};}return {type:'gate',index:this.index-1};}
}
// Nominal adult reference lengths, not a claim of anatomical reconstruction.
// NHM Dino Directory: diplodocus 26 m; tyrannosaurus 12 m; triceratops 9 m.
export const SCALE_REFERENCE={diplodocus:26,tyrannosaurus:12,triceratops:9};
export const LESSONS=[
 ['drive','Your first patrol','Drive through the gold marker beyond the visitor center. RT accelerates, LT brakes; left stick steers. Keyboard: W / S and A / D.',{x:0,z:38}],
 ['horn','Make room for the herd','Follow the marked road to Crest Meadow. Sound the horn near a dinosaur: D-pad down / H. Orange rings show its 42 m reach.',{x:-58,z:208}],
 ['water','Guide, do not chase','Hold LB + RT to spray from the jeep, or LT + RT on foot. Aim with the right stick. Water pushes dinosaurs away from you. Keyboard: right mouse + left mouse.',{x:-58,z:208}],
 ['zapper','Interrupt a charge','RB / Q selects the zapper. Aim and fire at a dinosaur to interrupt it, then guide it away. X / R reloads. The blue arc and halo confirm a hit.',{x:-58,z:208}],
 ['feed','Stock the home pen','Stop at the Crest Meadow terminal and press A / E. Fill the feeder and open the gate. Position yourself behind the strays to guide them toward the opening.',{x:-48,z:203}],
 ['pen','Bring everyone home','Get all four Crest Meadow residents inside, then close the gate at the terminal. A stocked feeder helps. The live count shows who is still outside.',{x:-48,z:203}],
 ['trade','Supply the reserve','At a visited outpost, open its Supply Exchange and buy one useful item. A selects, B closes every window. Credits and cargo remain saved.',{x:0,z:51}],
 ['boat','Open water awaits','Go to Wetland Dock, leave your vehicle with Y / F, and board the boat. RT sails, LT reverses. Follow the lit west channel out to the ocean start buoy.',{x:-78,z:-151}],
 ['roof','Take the high route','Board the helicopter at the visitor center. Left stick flies; RT rises, LT lands. Reach the Northstar roof, land, then exit with Y. Keyboard: WASD, Z / X.',{x:-30,z:-353}],
 ['interior','Leave the vehicle behind','On the Northstar roof, walk to the marked maintenance lift and press A. Select the ground floor, then follow the corridor to recover the habitat archive.',{x:-30,z:-353}]
];
