/* Authored, reversible-at-source layout refinements for existing expeditions.
 * No new save fields, reward sources, enemies, movement verbs or forced combat.
 * New full-height construction sits inside former solid walls. Raised racks
 * leave the .4m legacy loot ray and prone body clear on formerly open ground.
 */
export const PLACES_REVISION='reclaimed-places-1';
const box=(id,x,z,w,d,h,kind='brick',bottom=0,extra={})=>({id,x,z,w,d,h,kind,bottom,placeArt:true,...extra});
export const DISPATCH_ESCAPE='dispatch-emergency-shutter';
export const WORKSHOP_ESCAPE='workshop-goods-shutter';
export const PLACE_ROUTES=Object.freeze({
 district:{
  service:{purpose:'Longer enclosed recovery route through the former solid quay ruin, with south and north exits and a market-side escape.',points:[[-30,-23],[-32,-24],[-32,-28],[-31,-32],[-31,-34],[-32,-38],[-32,-42],[-27,-44],[-18,-46],[-7,-46],[0,-46],[0,-43]]},
  verge:{purpose:'Shorter exposed verge. It keeps the transmitter visible but gives less hard cover than the service rooms.',points:[[-27,-24],[-27,-32],[-27,-42],[-18,-46],[-7,-46],[0,-43]]},
  freight:{purpose:'Fast commitment from Freight Hall, using the existing east grass and new low baggage screen. It is not a safe corridor.',points:[[21,-32],[16,-38],[10,-40.5],[7,-43],[7,-46],[0,-46],[0,-43]]}
 },
 terminus:{
  dispatch:{purpose:'The recorded dispatch opens a lateral escape from the prism room. The rootback can follow, and the track crossing remains exposed.',requires:'last-dispatch',points:[[32,-21],[25,-22],[18,-22],[5,-24],[0,-30]]},
  workshop:{purpose:'With the original power puzzle solved, restoring the station radio opens the northern goods doorway. It reconnects the key room to the signal bridge approach.',requires:'station-radio',points:[[-34,-20],[-32,-23],[-32,-29],[-24,-30],[0,-30]]},
  dispatchOuter:{purpose:'A slower outer aisle behind the raised document racks gives a sightline break, not invulnerability. Both ends reconnect to the dispatch encounter.',points:[[30,10],[38,8],[38,-4],[38,-19],[32,-21]]}
 }
});
const quay=[
 // The former 5 by 16m solid ruin becomes two usable service rooms.
 box('quay-east-south',-29.75,-25.65,.5,1.3,3.4),
 box('quay-east-middle',-29.75,-32.5,.5,6,3.4),
 box('quay-east-north',-29.75,-39.75,.5,2.5,3.4),
 box('quay-observation-sill',-29.75,-37,.5,3,1.05,'counter'),
 box('quay-north-west',-33.75,-40.75,1.5,.5,3.4),
 box('quay-north-east',-30.25,-40.75,1.5,.5,3.4),
 box('quay-south-west',-33.75,-25.25,1.5,.5,3.4),
 box('quay-south-east',-30.25,-25.25,1.5,.5,3.4),
 box('quay-room-divider',-33.05,-33,2.4,.4,2.6),
 box('quay-pump-cabinet',-33.65,-29.8,.7,1.7,1.45,'metal'),
 box('quay-bench',-33.55,-37,.9,3,.85,'counter'),
 box('quay-canopy-west',-33.8,-29,.8,7.5,.22,'slab',3.4),
 box('quay-canopy-south',-32,-25.5,4,1,.22,'slab',3.4),
 // Baggage stands are raised, retaining old saved drops and prone clearance.
 box('quay-baggage-screen',11,-39,4,.7,.5,'crate',.6),
 box('quay-west-break',-12,-42,4,.6,.5,'crate',.6)
];
const station=[
 box('dispatch-wall-north-remnant',20,-24.9,1.2,2.2,8),
 box(DISPATCH_ESCAPE,20,-22,1.2,3.6,3.2,'service-gate',0,{openOnTask:'last-dispatch',disabled:false}),
 box('dispatch-escape-lintel',20,-22,1.2,3.6,4.8,'brick',3.2),
 box('workshop-back-west-remnant',-36.85,-27,6.3,1.2,8),
 box(WORKSHOP_ESCAPE,-32,-27,3.4,1.2,3.2,'service-gate',0,{openOnTask:'station-radio',disabled:false}),
 box('workshop-escape-lintel',-32,-27,3.4,1.2,4.8,'brick',3.2),
 box('dispatch-record-rack',31,-7.5,1.1,10.5,1.35,'shelf',.6),
 box('dispatch-return-rack',35.8,5,3.2,.7,.55,'counter',.6)
];
export function applyReclaimedPlaces(data){
 if(!['district','terminus'].includes(data.id)||data.placesRevision===PLACES_REVISION)return data;
 if(data.id==='district'){
  const old=data.obstacles.find(o=>o.id==='west-ruin');
  if(!old||old.x!==-32||old.z!==-33||old.w!==5||old.d!==16)throw Error('Review changed quay ruin before applying Reclaimed Places');
  data.obstacles=data.obstacles.map(o=>o.id==='west-ruin'?{...o,x:-34.25,w:.5,placeArt:true}:o).concat(quay.map(o=>({...o})));
 }else{
  const east=data.obstacles.find(o=>o.id==='dispatch-wall-b'),back=data.obstacles.find(o=>o.id==='service-back');
  if(!east||east.z!==-11||east.d!==30||!back||back.x!==-30||back.w!==20)throw Error('Review changed station walls before applying Reclaimed Places');
  data.obstacles=data.obstacles.map(o=>o.id==='dispatch-wall-b'?{...o,z:-8.1,d:24.2}:o.id==='service-back'?{...o,x:-25.15,w:10.3}:o).concat(station.map(o=>({...o})));
  data.tasks=data.tasks.map(t=>t.id==='last-dispatch'?{...t,description:'Copy the last coastal dispatch and pull the linked emergency release at the desk. The shutter at the north-west end of the dispatch gallery opens onto the tracks. Creatures can follow through it too.',completionHint:'Dispatch recorded. NORTH-WEST DISPATCH SHUTTER OPEN. The prism room now has a second exit to the tracks.'}:t.id==='station-radio'?{...t,description:'Restore the workshop radio once the railway circuit is safe. The goods-door release shares that service circuit: the northern workshop exit reconnects to the signal bridge approach.',completionHint:'Station radio restored. NORTH WORKSHOP GOODS DOOR OPEN. The bridge puzzle and both mission components still matter.'}:t);
 }
 data.placesRevision=PLACES_REVISION;
 return data;
}
