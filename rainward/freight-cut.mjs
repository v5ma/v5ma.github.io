/* One spatial consequence for the existing radio task. No new objective,
 * reward, save field, additional patrol or input verb. All exits already open stay open. */
export const FREIGHT_CUT_TASK='ward-radio';
export const FREIGHT_CUT_GATE='freight-loading-shutter';
export const FREIGHT_CUT_REVISION='freight-cut-4';
export const FREIGHT_CUT_OBSTACLES=Object.freeze([
 {id:'depot-west-bay-south',x:14,z:-20.25,w:1,d:4.5,h:5.5,bottom:0,kind:'brick'},
 {id:'freight-loading-lintel',x:14,z:-24,w:1,d:3,h:2.1,bottom:3.4,kind:'brick'},
 {id:FREIGHT_CUT_GATE,x:14,z:-24,w:.6,d:3,h:3.4,bottom:0,kind:'service-gate',openOnTask:FREIGHT_CUT_TASK,disabled:false},
 // Suspended low pallet screen: the south approach is readable as a slower crouched lane.
 // It sits west of the lookout's x=19 patrol turn so both ends remain a real
 // shared flank. Its north end now reaches the loading decision, so players
 // can prepare before crossing the spindle floor. Standing stays exposed.
 // Ground clearance preserves old supply drops and offers a slower prone gap.
 {id:'freight-aisle-screen',x:17.8,z:-18,w:.8,d:12.5,h:.45,bottom:.6,kind:'crate'},
 // Raised outside sorting screen breaks the quay sightline while keeping older
 // ground-level supply drops reachable; prone movement fits underneath it.
 {id:'freight-sorting-baffle',x:10.9,z:-26.4,w:4,d:.55,h:1.55,bottom:.6,kind:'crate'}
].map(Object.freeze));
export const FREIGHT_CUT_ROUTES=Object.freeze({
 approach:{purpose:'Observe from the clinic, crouch behind its parapet, then use the counter, the SOUTH side of the fountain and east grass. If detected, use finite tools to break sight before committing; crouching alone cannot erase a chase.',points:[[-22,-10],[-8,-10],[-5.2,-17],[-4,-18.5],[4,-18.5],[9,-17],[12,-15],[18,-11]]},
 aisle:{purpose:'Slower crouch-cover lane to the loading decision. Prepare BEFORE the exposed spindle floor; the open west shutter is the retreat. Standing is exposed and either end can be flanked.',points:[[18,-11],[16.2,-14],[16.2,-18],[16.2,-22],[16.2,-24],[17,-26],[22.3,-26.7]]},
 retreat:{purpose:'Powered lateral escape to the sorting baffle and concealment, then the clinic terrace.',requires:FREIGHT_CUT_TASK,points:[[22.3,-26.7],[17,-26],[17,-24],[11,-24],[9,-21],[-4,-23],[-8,-10]]},
 quay:{purpose:'Original fast north exit toward extraction; exposed to the quay lookout.',points:[[22.3,-26.7],[21,-32],[16,-38],[0,-43]]}
});
export function freightCutState(state){const open=state?.level==='district'&&!!state.completedTasks?.includes(FREIGHT_CUT_TASK);return {open,status:open?'WEST LOADING OPEN':'WEST LOADING SEALED',detail:open?'The radio circuit released the west loading shutter. The yard is a retreat, not a safe zone: lookouts can follow. The north exit still reaches the quay.':'The clinic battery can restore the receiver circuit and release this shutter. The south and north doors remain open. Repair is optional.'};}
export function applyFreightCut(data){
 if(data.id!=='district')return data;
 if(data.freightCutRevision===FREIGHT_CUT_REVISION)return data;
 const old=data.obstacles.find(o=>o.id==='depot-west-a');
 if(!old||old.x!==14||old.z!==-24||old.d!==12)throw Error('Review changed Freight Hall geometry before applying Freight Cut');
 data.obstacles=data.obstacles.map(o=>o.id==='depot-west-a'?{...o,z:-27.75,d:4.5}:o.id==='fountain'?{...o,h:1.05}:o).concat(FREIGHT_CUT_OBSTACLES.map(o=>({...o})));
 // The market lookout works the lower market, not the narrow clinic ramp.
 // The ramp remains shared navigation and can still be searched after noise.
 data.patrols=data.patrols.map(e=>e.id==='watch-2'?{...e,points:[[-10,-16],[-24,-16],[-24,-22],[-10,-22]]}:e);
 data.tasks=data.tasks.map(t=>t.id===FREIGHT_CUT_TASK?{...t,description:'Repair the freight receiver using the clinic signal battery. Its shared service circuit releases the west loading shutter: a shorter escape to the market, but a new sightline and pursuit route into the hall.',completionHint:'Receiver restored. WEST LOADING OPEN. The market-side passage now works for you and the lookouts; north still leads to the floodgate.'}:t);
 data.freightCutRevision=FREIGHT_CUT_REVISION;return data;
}
