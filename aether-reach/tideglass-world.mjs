/* Tideglass is a connected reservoir annex, not a replacement for any old district. */
export const TIDEGLASS=Object.freeze({id:'tideglass',name:'Tideglass Reservoir',x:132,y:6,z:0,w:44,d:44,checkpoint:{x:116,y:6.02,z:12}});
export const TIDE_POOLS=Object.freeze([
 {id:'reservoir',x:132,z:-2,w:16,d:20,floor:1.8,high:5.45,low:2.25},
 {id:'filter',x:146,z:12,w:7,d:6,floor:5.55,high:5.88,low:5.88}
]);
export const TIDE_BRIDGES=Object.freeze([
 {id:'tideglass-pump-walk',a:[105,6,-28],b:[116,6,-17],width:3.8},
 {id:'tideglass-garden-walk',a:[80,6,-12],b:[113,6,12],width:4.2},
 {id:'tideglass-basin-stairs',a:[126,1.8,-5],b:[126,6,8.6],width:2.4,stairs:true}
]);
// Cut real holes into the walkable deck; the pools are not water painted on a floor.
let rectangles=[{x1:110,x2:154,z1:-22,z2:22}];
for(const q of TIDE_POOLS){const b={x1:q.x-q.w/2,x2:q.x+q.w/2,z1:q.z-q.d/2,z2:q.z+q.d/2};rectangles=rectangles.flatMap(a=>{const l=Math.max(a.x1,b.x1),r=Math.min(a.x2,b.x2),n=Math.max(a.z1,b.z1),f=Math.min(a.z2,b.z2);if(l>=r||n>=f)return[a];return[{...a,x2:l},{...a,x1:r},{x1:l,x2:r,z1:a.z1,z2:n},{x1:l,x2:r,z1:f,z2:a.z2}].filter(p=>p.x2-p.x1>.001&&p.z2-p.z1>.001);});}
export const TIDE_FLOORS=Object.freeze([...rectangles.map((r,i)=>({id:'tideglass-deck-'+i,x:(r.x1+r.x2)/2,y:6,z:(r.z1+r.z2)/2,w:r.x2-r.x1,d:r.z2-r.z1})),...TIDE_POOLS.map(p=>({id:p.id+'-floor',x:p.x,y:p.floor,z:p.z,w:p.w,d:p.d}))]);
const box=(id,x1,x2,y1,y2,z1,z2)=>({id,x1,x2,y1,y2,z1,z2});
export const TIDE_SOLIDS=Object.freeze([
 ...[119,141].flatMap(x=>[-14,16].map(z=>box('tide-pillar-'+x+'-'+z,x-.14,x+.14,6,12.3,z-.14,z+.14))),
 ...TIDE_POOLS.flatMap(p=>{const l=p.x-p.w/2,r=p.x+p.w/2,n=p.z-p.d/2,f=p.z+p.d/2,h=p.id==='filter'?5.55:6;return [box(p.id+'-west',l-.3,l,p.floor-.4,h,n,f),box(p.id+'-east',r,r+.3,p.floor-.4,h,n,f),box(p.id+'-north',l,r,p.floor-.4,h,n-.3,n),...(p.id==='reservoir'?[box(p.id+'-south-a',l,124.6,p.floor-.4,h,f,f+.3),box(p.id+'-south-b',127.4,r,p.floor-.4,h,f,f+.3)]:[box(p.id+'-south',l,r,p.floor-.4,h,f,f+.3)])];}),
 box('tide-pumphouse-west',142,142.3,6,11.3,-14,0),box('tide-pumphouse-east',152,152.3,6,11.3,-14,0),box('tide-pumphouse-back',142,152.3,6,11.3,-14.3,-14),
 box('tide-pumphouse-jamb-a',142,145.5,6,11.3,-.3,0),box('tide-pumphouse-jamb-b',148.5,152.3,6,11.3,-.3,0),box('tide-pumphouse-lintel',145.5,148.5,9.2,11.3,-.3,0),box('tide-pumphouse-roof',142,152.3,11.3,11.6,-14.3,0),
 box('tide-west-parapet-n',109.8,110.15,6,7.1,-22,-19),box('tide-west-parapet-mid',109.8,110.15,6,7.1,-13,7),box('tide-west-parapet-s',109.8,110.15,6,7.1,16,22),
 box('tide-east-parapet',153.85,154.2,6,7.1,-22,22),box('tide-north-parapet',116,154,6,7.1,-22.2,-21.85),box('tide-south-parapet',110,154,6,7.1,21.85,22.2)
]);
export const TIDE_TASKS=Object.freeze([
 {id:'tideglass-repair',name:'The Water Below the Sky',flag:'tideglass-restored',reward:240,description:'Visit the reservoir dispatch desk east of Glasshouse Gardens. Isolate two valves, recover the submerged regulator by swimming or draining the basin, install it at the pump, and restore the public water supply.'},
 {id:'tideglass-survey',name:'Poolside Signals',flag:'tideglass-surveyed',reward:100,description:'Inspect three calibration plates in the reservoir and filter pool. Dive with B and surface with A, or drain the main basin and use its railed steps. Each plate is a separate proximity interaction.'}
]);
export const TIDE_POINTS=Object.freeze([
 {id:'tide-desk',name:'Reservoir dispatch desk',kind:'desk',x:116,y:6,z:12},
 {id:'tide-valve-0',name:'Intake isolation valve',kind:'valve',x:118,y:6,z:-14},
 {id:'tide-valve-1',name:'Return isolation valve',kind:'valve',x:148,y:6,z:-18},
 {id:'tide-pump',name:'Drain / refill control',kind:'pump',x:148,y:6,z:-7},
 {id:'tide-install',name:'Regulator socket',kind:'install',x:144,y:6,z:-10},
 {id:'tide-regulator',name:'Lost brass regulator',kind:'pickup',x:134,y:1.8,z:-7},
 {id:'tide-plate-0',name:'Intake calibration plate',kind:'plate',x:130,y:1.8,z:-9},
 {id:'tide-plate-1',name:'Basin calibration plate',kind:'plate',x:137,y:1.8,z:3},
 {id:'tide-plate-2',name:'Filter calibration plate',kind:'plate',x:146,y:5.55,z:12}
]);
export const TIDE_FLAGS=TIDE_TASKS.map(t=>t.flag);
export function tidePoolAt(x,z){return TIDE_POOLS.find(q=>Math.abs(x-q.x)<q.w/2-.05&&Math.abs(z-q.z)<q.d/2-.05)||null;}
export function tideLevel(s,q){return q.id==='reservoir'?(s.tideglass?.level??q.high):q.high;}
export function tideGoal(s,id=s.expedition?.tracked){const w=s.tideglass||{stage:0,valves:[false,false],plates:[]},find=id=>TIDE_POINTS.find(p=>p.id===id);if(id==='tideglass-survey')return TIDE_POINTS.find(p=>p.kind==='plate'&&!w.plates.includes(p.id))||find('tide-desk');if(w.stage===0||w.stage>=3)return find('tide-desk');const v=w.valves.indexOf(false);if(v>=0)return find('tide-valve-'+v);return find(w.stage===2?'tide-install':'tide-regulator');}
export function tideProgress(s,id=s.expedition?.tracked){const w=s.tideglass;if(!w)return 'Visit the reservoir dispatch desk';if(id==='tideglass-survey')return w.plates.length+' / 3 calibration plates inspected';return ['Read the dispatch at Tideglass',w.valves.every(Boolean)?'Recover the regulator: dive, or drain and take the steps':'Isolate the intake and return valves','Install the regulator inside the pumphouse',Math.abs(w.level-TIDE_POOLS[0].high)<.03?'Supply restored / report to dispatch':'Refilling reservoir / '+(w.level-TIDE_POOLS[0].floor).toFixed(1)+' m depth','Reservoir restored / reward saved'][w.stage];}

export const TIDE_LADDERS=[{id:'tide-pool-ladder',name:'Reservoir pool ladder',water:true,points:[[138.4,1.8,7],[138.4,6.32,7],[138.4,6.32,9.2]]}];
