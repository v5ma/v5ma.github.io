/* Bellwether Rewired. Authored geometry, shared by simulation and presentation.
 * Existing mission/collectible IDs remain in place for version-1 expeditions. */
export const BELL_LAYOUT_VERSION = 1;
export const BELL_DECKS = Object.freeze([
 {id:'bell-arcade-roof',x:-103,y:12,z:-29,w:13,d:12},
 {id:'bell-rear-gallery',x:-101.5,y:12,z:-35.5,w:17,d:5},
 {id:'bell-west-landing',x:-115.35,y:17,z:-20.5,w:1.8,d:8},
 {id:'bell-east-landing',x:-100.5,y:22,z:-18.5,w:4,d:4},
 {id:'bell-receiver-arrival',x:-99.8,y:27.5,z:-6,w:3.8,d:2.5}
]);
export const BELL_STAIRS = Object.freeze([
 {id:'bell-maintenance-stair',a:[-95.8,7,-21],b:[-95.8,12,-34],width:2.4,stairs:true},
 {id:'bell-workshop-ascent',a:[-103,12,-24],b:[-115.2,17,-22],width:2.5,stairs:true},
 {id:'bell-flygallery',a:[-114.5,17,-18.5],b:[-102,22,-18.5],width:2.6,stairs:true},
 {id:'bell-receiver-stair',a:[-99,22,-18.5],b:[-99,27.5,-6],width:2.5,stairs:true}
]);
const box=(id,x,z,w,d,h,y=7)=>({id,x1:x-w/2,x2:x+w/2,y1:y,y2:y+h,z1:z-d/2,z2:z+d/2});
// Cover separates a direct street lane from the protected service approach.
// Keep the original dispatch, rest pavilion and record approach clear.
export const BELL_STREET_SOLIDS=Object.freeze([
 box('bell-market-screen',-88,-15,1.1,6,2.4),
 box('bell-service-screen',-99,-19.6,4.0,.65,2.2),
 box('bell-crossing-cover',-83,-27,2.6,1.15,1.05)
]);
export const BELL_SHORTCUT=Object.freeze(box('bell-arcade-service-gate',-109.38,-28, .24,3.4,3.2));
export const BELL_DEMO=Object.freeze({id:'bell-demonstrator',kind:'demo',name:'Induction bench / crank to test the lamp',x:-86,y:7,z:-9});
export const BELL_WATER=Object.freeze([
 {id:'bell-training-water',type:'water',x:-85,y:7,z:-11,r:1.2},
 {id:'bell-street-water',type:'water',x:-86,y:7,z:-22,r:2.3}
]);
// Every route has a distinct cost, readable landmark and reconnection.
export const BELL_ROUTES=Object.freeze([
 {id:'market',name:'Market floor',purpose:'Direct cover-to-cover combat and supply access',points:[[-84,7,-4],[-84,7,-12],[-84,7,-20],[-90,7,-22],[-95,7,-18],[-103,7,-21],[-103,7,-25]]},
 {id:'service',name:'Clockmaker service approach',purpose:'Break line of sight, reach the Arcade and its repair shortcut',points:[[-84,7,-4],[-95,7,-4],[-95,7,-18],[-103,7,-21],[-103,7,-25],[-107.5,7,-28],[-111.5,7,-28],[-114.5,7,-22],[-114.5,7,-18]]},
 {id:'upper',name:'Maintenance galleries',purpose:'Street reconnaissance then a continuous stair ascent with sheltered landings',points:[[-95.8,7,-21],[-95.8,12,-34],[-99,12,-35.5],[-103,12,-30],[-103,12,-24],[-115.2,17,-22],[-115.2,17,-18.5],[-114.5,17,-18.5],[-102,22,-18.5],[-99,22,-18.5],[-99,27.5,-6],[-101.5,27.5,-6],[-104,27.5,-4],[-111,27.5,-6]]}
]);
export function bellShortcutOpen(state){return (state?.bellwether?.stage||0)>=3;}
export function bellCircuitFeedback(state){
 const b=state?.bellwether||{},d=b.dials||[0,0,0],target=[2,1,3];
 const stages=target.map((v,i)=>d[i]===v),stable=stages.every(Boolean);
 return {stages,stable,firstFault:stages.indexOf(false),shortcutOpen:bellShortcutOpen(state),restored:(b.stage||0)>=5,signal:Math.min(1,Math.max(0,(b.hold||0)/6))};
}
