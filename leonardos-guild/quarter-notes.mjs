/* Observations require an actual station action. Reading the notebook is pure. */
export const QUARTER_OBSERVATIONS=Object.freeze({
 'arch-front':{title:'A bell to recognize',text:'The workshop-side arch has a distinctive bell bracket and no latch on this side. Look for the same bracket when returning from the gallery.'},
 precision:{title:'Marta: a disconnected drive',text:'The large drive turns once while the pinion turns twice. Setting 2:1 reconnects the loading drive and opens the goods stairs. The roof and cellar approaches do not need this repair.'},
 dye:{title:'Ilaria: cloth follows a route',text:'Dye work begins below the loft. Follow its timber stairs to the finishing table, then the next stairs to the drying roof. The timber bridge joins the goods gallery.'},
 loft:{title:'The finishing record',text:'The commission was finished here and sent onto the shared gallery. The drying roof and timber bridge are a working connection, not a dead-end balcony.'},
 cellar:{title:'The maintenance ledger',text:'The carriage stopped above this service room when its loading drive disengaged. Rear stairs go around the machinery and emerge at the gallery. This is an interrupted delivery, not a stolen parcel.'}
});
export function normalizeObservations(raw){return Array.isArray(raw)?Object.keys(QUARTER_OBSERVATIONS).filter(id=>raw.includes(id)):[];}
export function quarterNotebook(s){
 const q=s.quarter||{},observed=normalizeObservations(q.observations),entries=observed.map(id=>({id,...QUARTER_OBSERVATIONS[id]}));
 if(q.goodsAccess)entries.push({id:'drive-restored',title:'The loading stairs are open',text:'Marta\'s repaired drive now gives a direct route from the court to the goods gallery.'});
 if(q.low)entries.push({id:'channel-drained',title:'The lower route is available',text:'The outlet is draining or has drained the channel. Watch the waterline from the dry controls before descending. Rear service stairs return to the gallery.'});
 if(q.parcel)entries.push({id:'commission-found',title:'The missing commission is safe',text:q.reported?'Leonardo has received the commission. Its reward has already been paid.':'Return to Leonardo on the workshop porch. Recovering it by any of the three approaches is sufficient.'});
 if(q.archOpen)entries.push({id:'arch-open',title:'A permanent way home',text:'The bell-bracket arch connects the gallery descent with the workshop. It stays open after leaving or reloading.'});
 if(q.delivery)entries.push({id:'spindle',title:'The finishing delivery',text:q.delivery===1?'Collect the spindle from Marta\'s workbench.':q.delivery===2?'Bring the spindle to Ilaria\'s finishing table in the loft.': 'The spindle has been delivered and paid for. Both commissions are complete.'});
 return entries;
}
const PLACES=Object.freeze({
 'workshop-porch':['Workshop porch','The bell arch is beside the workshop. The court leads to Marta; the dye stairs lead to Ilaria.'],
 'arrival-walk':['Approach to the canal court','Marta works across the court. Ilaria works along the dye approach.'],
 'canal-court':['Canal court','The loading workshop is across the court; the dry sluice controls overlook the lower channel.'],
 'precision-workshop':['Precision workshop','Inspect the drive instructions here. The loading court connects to the goods stairs.'],
 'loading-court':['Loading court','The goods stairs climb to the gallery once Marta reconnects the drive.'],
 'goods-stair':['Goods stairs','These stairs climb directly to the shared gallery.'],
 'hoist-gallery':['Shared goods gallery','The carriage is here. The workshop descent is at the dye-roof end of the gallery.'],
 'dye-approach':['Dye approach','Follow the vats into the dye workroom; timber stairs connect it to the loft.'],
 'dye-workroom':['Dye workroom','The workroom stairs lead to the finishing loft, then the drying roof.'],
 'dye-stair':['Dye stairs','The finishing table is on the first raised landing.'],
 'dye-loft':['Finishing loft','The next stairs reach the drying roof. The finishing table is here, not on the gallery.'],
 'drying-stair':['Drying stairs','Climb to the hanging fabrics and look for the timber bridge.'],
 'drying-roof':['Drying roof','The timber bridge returns toward the goods gallery.'],
 'roof-bridge':['Timber bridge','The gallery connects the roof, the loading court and the service stairs.'],
 'return-stair':['Workshop descent','The low landing leads to the bell-bracket arch beside the workshop.'],
 'return-landing':['Workshop-side landing','Look for the familiar bell bracket and its latch.'],
 'arch-passage':['Bell-bracket passage','The latch is on the gallery side of this arch. Once opened, the connection stays open.'],
 'sluice-landing':['Dry sluice controls','Watch the waterline here. The nearby ramp descends into the service channel.'],
 'channel-ramp':['Channel ramp','Descend only as the water falls. The service room lies beneath the goods gallery.'],
 'service-channel':['Lower service channel','Follow the channel into the maintenance room. The overhead floor is a different route.'],
 'maintenance-cellar':['Maintenance room','Read the ledger here. The rear stairs go around the machinery to the gallery.'],
 'service-stair-a':['Rear service stairs','Continue to the turning landing, then take the second stair back toward the gallery.'],
 'service-turn':['Rear turning landing','The second stair returns toward the gallery above the channel.'],
 'service-stair-b':['Upper service stairs','The goods gallery is at the top of these stairs.']
});
export function quarterPlace(s){const [name,hint]=PLACES[s.quarter?.surface]||['Waterwheel Quarter','Use the nearby work stations or read your Quarter notebook.'];return {name,hint};}
export const QUARTER_MAP_LAYERS=Object.freeze(['current','all','street','upper','service']);
export function mapLayer(value,s){return value==='current'?(s.quarter?.groundY<-.35?'service':s.quarter?.groundY>.6?'upper':'street'):QUARTER_MAP_LAYERS.includes(value)?value:'all';}
export function floorOnLayer(f,layer){const low=Math.min(f.y,f.endY),high=Math.max(f.y,f.endY);return layer==='all'||(layer==='upper'?high>.6:layer==='service'?low<-.35:low<=.6&&high>=-.35);}
