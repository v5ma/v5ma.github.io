/* First authored replacement slice: the clinic/market seam, not an extra demo.
 * Stable shelters, objective IDs, patrol IDs and field records are retained. */
const box=(id,x,z,w,d,h,kind='brick',bottom=0,extra={})=>({id,x,z,w,d,h,kind,bottom,...extra});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const RECUT_REVISION='clinic-market-loop-1';
export const RETURN_TASK='ward-service-latch';
export const RECUT_SURFACES=Object.freeze([
 {id:'west-ramp',x0:-32,x1:-28,z0:-22,z1:-8.5},
 {id:'observation-terrace',x0:-28,x1:-16,z0:-12,z1:-8.5},
 {id:'east-ramp',x0:-16,x1:-8,z0:-12,z1:-8.5},
 {id:'clinic-ramp',x0:-24,x1:-20,z0:-8.5,z1:-3.5}
]);
export function recutHeight(x,z){
 if(x>=-32&&x<=-28&&z>=-22&&z<=-8.5)return 2.4*clamp((z+22)/10,0,1);
 if(x>=-28&&x<=-16&&z>=-12&&z<=-8.5)return 2.4;
 if(x>=-16&&x<=-8&&z>=-12&&z<=-8.5)return 2.4*clamp((-8-x)/8,0,1);
 if(x>=-24&&x<=-20&&z>=-8.5&&z<=-3.5)return 2.4*clamp((-3.5-z)/5,0,1);
 return 0;
}
export const RECUT_OBSTACLES=[
 box('clinic-west-north',-28,-1.55,1,11.9,4.8),box('clinic-west-south',-28,8.35,1,2.3,4.8),
 box('clinic-north-west',-26.25,-7,3.5,1,4.8),box('clinic-north-east',-17,-7,5,1,4.8),
 box('clinic-service-gate',-28,5.8,.55,2.8,2.8,'service-gate',0,{openOnTask:RETURN_TASK,disabled:false}),
 box('clinic-west-lintel',-28,5.8,1,3,1.3,'brick',3.5),
 box('clinic-treatment-screen',-23,4,3.1,.3,1.15,'counter'),
 box('clinic-battery-screen',-19,-1,1.0,3,1.15,'counter')
];
// Retaining parapets close all non-ramp elevation edges. Their solid base is
// visible architecture, not an invisible wall under a floating railing.
function retaining(id,a,b,sample){const alongX=a.z===b.z,length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(length);for(let i=0;i<steps;i++){
 const t=(i+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,ground=recutHeight(x+(sample.x||0),z+(sample.z||0));
 RECUT_OBSTACLES.push(box('recut-'+id+'-'+i,x,z,alongX?length/steps:.35,alongX?.35:length/steps,ground+1.05,'retaining'));
}}
retaining('west-edge',{x:-32.18,z:-22},{x:-32.18,z:-8.5},{x:.3});
retaining('ramp-east-edge',{x:-27.82,z:-22},{x:-27.82,z:-12},{x:-.3});
retaining('terrace-north',{x:-31.99,z:-12.18},{x:-8,z:-12.18},{z:.3});
// Leave the west ramp itself open where it passes the terrace's north edge.
for(let i=RECUT_OBSTACLES.length-1;i>=0;i--){const o=RECUT_OBSTACLES[i];if(o.id.startsWith('recut-terrace-north')&&o.x<-28)RECUT_OBSTACLES.splice(i,1);}
retaining('terrace-south-west',{x:-32,z:-8.32},{x:-24.3,z:-8.32},{z:-.3});
retaining('terrace-south-east',{x:-19.7,z:-8.32},{x:-8,z:-8.32},{z:-.3});
retaining('clinic-ramp-west',{x:-24.18,z:-8.5},{x:-24.18,z:-3.5},{x:.3});
retaining('clinic-ramp-east',{x:-19.82,z:-8.5},{x:-19.82,z:-3.5},{x:-.3});
export const RECUT_TASK={id:RETURN_TASK,customArt:true,x:-26.1,z:5.8,title:'Open the clinic return gate',description:'Release the yard shutter from inside the clinic. The return to the rain garden becomes a short, readable recovery loop. Its open state is recorded at shelters.',kind:'repair',reward:{},required:false};
export const RECUT_ROUTES=Object.freeze({
 garden:{purpose:'Concealment and recovery, not a second exposed street.',points:[[0,27],[-13,23],[-19,16],[-19,7],[-24,6],[-24,-1],[-22,-3.5]]},
 marketTerrace:{purpose:'Observe the market from 2.4 metres up, trade concealment for information, then descend into the battery room.',points:[[-7,-10],[-10,-10],[-15,-10],[-22,-10],[-22,-7],[-22,-3.5]]},
 westRamp:{purpose:'A distinct ground-to-terrace approach reached from the west market, shared by patrol navigation.',points:[[-30,-23],[-30,-20],[-30,-14],[-30,-10],[-25,-10],[-22,-10]]},
 clinicReturn:{purpose:'Unlock from inside, recognize the garden, then retreat without retracing the original entrance.',requires:RETURN_TASK,points:[[-26.1,5.8],[-30,5.8],[-31,11],[-24,12],[-19,16]]}
});
export function applyFloodgateRecut(data){
 const removed=new Set(['clinic-west','clinic-north']);
 // The ruin's collapsed south end now leaves a genuine dry approach to the west ramp.
 data.obstacles=data.obstacles.filter(o=>!removed.has(o.id)).map(o=>o.id==='west-ruin'?{...o,z:-33,d:16}:o).concat(RECUT_OBSTACLES.map(o=>({...o})));
 data.tasks=[...data.tasks,{...RECUT_TASK}];data.layoutRevision=RECUT_REVISION;
 // Keep concealment where its grass is actually rendered at ground level.
 data.grass=data.grass.map((g,i)=>i===1?{...g,x:-20,z:-16,w:11,d:4}:g);
 return data;
}
