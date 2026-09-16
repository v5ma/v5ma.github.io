/* One spatial consequence for the existing radio task. No new objective,
 * reward, save field, patrol or input verb. All exits already open stay open. */
export const FREIGHT_CUT_TASK='ward-radio';
export const FREIGHT_CUT_GATE='freight-loading-shutter';
export const FREIGHT_CUT_REVISION='freight-cut-1';
export const FREIGHT_CUT_OBSTACLES=Object.freeze([
 {id:'depot-west-bay-south',x:14,z:-20.25,w:1,d:4.5,h:5.5,bottom:0,kind:'brick'},
 {id:'freight-loading-lintel',x:14,z:-24,w:1,d:3,h:2.1,bottom:3.4,kind:'brick'},
 {id:FREIGHT_CUT_GATE,x:14,z:-24,w:.6,d:3,h:3.4,bottom:0,kind:'service-gate',openOnTask:FREIGHT_CUT_TASK,disabled:false},
 // The raised sorting screen breaks standing sightlines while keeping older
 // ground-level supply drops reachable; prone movement fits beneath it.
 {id:'freight-sorting-baffle',x:10.9,z:-26.4,w:4,d:.55,h:1.55,bottom:.6,kind:'crate'}
].map(Object.freeze));
export const FREIGHT_CUT_ROUTES=Object.freeze({
 approach:{purpose:'Clinic terrace to the established south receiver entrance. Repair is optional.',points:[[-8,-10],[0,-8],[10,-10],[18,-11]]},
 aisle:{purpose:'Original indoor route to the spindle; low crate cover, close freight lookout.',points:[[18,-11],[16,-16],[17,-22],[17,-26],[22.3,-26.7]]},
 retreat:{purpose:'Powered lateral escape to the sorting baffle and concealment, then the clinic terrace.',requires:FREIGHT_CUT_TASK,points:[[22.3,-26.7],[17,-26],[17,-24],[11,-24],[9,-21],[-4,-23],[-8,-10]]},
 quay:{purpose:'Original fast north exit toward extraction; exposed to the quay lookout.',points:[[22.3,-26.7],[21,-32],[16,-38],[0,-43]]}
});
export function freightCutState(state){const open=state?.level==='district'&&!!state.completedTasks?.includes(FREIGHT_CUT_TASK);return {open,status:open?'WEST LOADING OPEN':'WEST LOADING SEALED',detail:open?'The radio circuit released the west loading shutter. The yard is a retreat, not a safe zone: lookouts can follow. The north exit still reaches the quay.':'The clinic battery can restore the receiver circuit and release this shutter. The south and north doors remain open. Repair is optional.'};}
export function applyFreightCut(data){
 if(data.id!=='district')return data;
 if(data.freightCutRevision===FREIGHT_CUT_REVISION)return data;
 const old=data.obstacles.find(o=>o.id==='depot-west-a');
 if(!old||old.x!==14||old.z!==-24||old.d!==12)throw Error('Review changed Freight Hall geometry before applying Freight Cut');
 data.obstacles=data.obstacles.map(o=>o.id==='depot-west-a'?{...o,z:-27.75,d:4.5}:o).concat(FREIGHT_CUT_OBSTACLES.map(o=>({...o})));
 data.tasks=data.tasks.map(t=>t.id===FREIGHT_CUT_TASK?{...t,description:'Repair the freight receiver using the clinic signal battery. Its shared service circuit releases the west loading shutter: a shorter escape to the market, but a new sightline and pursuit route into the hall.',completionHint:'Receiver restored. WEST LOADING OPEN. The market-side passage now works for you and the lookouts; north still leads to the floodgate.'}:t);
 data.freightCutRevision=FREIGHT_CUT_REVISION;return data;
}
