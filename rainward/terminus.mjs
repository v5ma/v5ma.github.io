/* Authored third chapter: an enclosed railway hall and its two service wings.
 * Layout, collision and objectives are independent of the conservatory. */
const box=(id,x,z,w,d,h,kind='brick',bottom=0)=>({id,x,z,w,d,h,kind,bottom});
export const TERMINUS={
 id:'terminus',title:'Bellweather Terminus',subtitle:'CHAPTER 03 / THE LAST PLATFORM',number:3,
 bounds:{x0:-42,x1:42,z0:-76,z1:48},start:{x:0,z:39},
 objectiveNames:{cell:'Signal prism',crank:'Traction key'},exit:{x:0,z:-65,name:'Northbound service tram'},
 exitPrompt:'Board the northbound tram / finish',objectivePrompt:'Recover the prism and traction key.',
 intro:'Read the power-room diagram. Route power to the signals and platform, but leave the flooded pump OFF.',
 shelters:[{id:'concourse',x:0,z:39,name:'Concourse shelter'},{id:'workshop',x:-32,z:-13,name:'Service workshop'},{id:'dispatch',x:30,z:-23,name:'Dispatch alcove'}],
 grass:[{x:-23,z:26,w:11,d:8},{x:24,z:26,w:10,d:10},{x:-8,z:-7,w:5,d:9},{x:10,z:-28,w:7,d:9},{x:-25,z:-49,w:10,d:12}],
 water:[{x:-8,z:18,w:10,d:5,depth:.18},{x:7,z:-10,w:9,d:16,depth:.25},{x:30,z:8,w:13,d:6,depth:.24}],
 zones:[{name:'Clock concourse',x:0,z:32},{name:'Power room',x:-29,z:16},{name:'Service workshop',x:-31,z:-10},{name:'Dispatch gallery',x:30,z:-12},{name:'Signal bridge',x:0,z:-35},{name:'Northbound platform',x:0,z:-61}],
 obstacles:[
  box('terminus-edge-w',-43,-14,2,126,18),box('terminus-edge-e',43,-14,2,126,18),box('terminus-edge-n',0,-77,88,2,21),box('terminus-edge-s',0,49,88,2,9),
  // Side galleries have generous south entrances and mid-hall doorways.
  box('service-wall-a',-20,19,1.2,14,8),box('service-wall-b',-20,-11,1.2,30,8),
  box('service-back',-30,-27,20,1.2,8),box('service-cover',-32,-4,5,2,1,'counter'),
  box('dispatch-wall-a',20,20,1.2,12,8),box('dispatch-wall-b',20,-11,1.2,30,8),
  box('dispatch-back',30,-27,20,1.2,8),box('dispatch-cover',31,-4,5,2,1,'counter'),
  box('ticket-counter-w',-9,27,9,2,1.05,'counter'),box('ticket-counter-e',9,27,9,2,1.05,'counter'),
  // Abandoned carriages obstruct real sightlines and create alternate lanes.
  box('carriage-west',-11,-8,4.1,20,3.6,'railcar'),box('carriage-east',11,-4,4.1,18,3.6,'railcar'),
  box('workbench',-36,2,3,6,.95,'counter'),box('dispatch-desk',35,-14,3,6,.95,'counter'),
  box('north-store',-29,-46,10,3,1.1,'counter'),box('north-cover',17,-52,7,2,1.0,'planter'),
  box('barrier-west',-24,-35,36,1.8,7,'fence'),box('barrier-east',24,-35,36,1.8,7,'fence'),
  {...box('signal-gate',0,-35,12,1.8,6,'gate'),openWhen:'signal'},
  box('tram',0,-70,5,10,3.5,'railcar'),
  ...[-24,-6,12,32].flatMap(z=>[-17,17].map(x=>({...box('roof-column-'+x+'-'+z,x,z,1.1,1.1,12,'column'),renderSeparately:true}))),
 ],
 items:[
  {id:'terminus-kit',x:2,z:38,type:'supplies',label:'Station supply roll',ammo:12,cloth:3,canister:3,bottles:3},
  {id:'service-key',x:-34,z:-20,type:'objective',objective:'crank',label:'Traction key'},
  {id:'dispatch-prism',x:32,z:-21,type:'objective',objective:'cell',label:'Signal prism'},
  {id:'ticket-stash',x:-12,z:30,type:'supplies',label:'Ticket cabinet',ammo:6,bottles:1},
  {id:'service-stash',x:-35,z:-10,type:'supplies',label:'Workshop locker',ammo:6,cloth:2},
  {id:'dispatch-stash',x:29,z:0,type:'supplies',label:'Dispatch satchel',canister:2,bottles:2},
  {id:'platform-stash',x:-26,z:-49,type:'supplies',label:'Platform emergency kit',ammo:8,cloth:1,canister:1},
 ],
 patrols:[
  {id:'terminus-watch',name:'Concourse scavenger',type:'watcher',points:[[4,12],[4,0],[-4,0],[-4,12]],yaw:0},
  {id:'workshop-hound',name:'Mire hound',type:'prowler',points:[[-27,-17],[-35,-17],[-35,-12],[-27,-12]],yaw:0},
  {id:'dispatch-rootback',name:'Rootback',type:'brute',points:[[27,-19],[30,-16],[30,-10],[25,-10]],yaw:0},
  {id:'platform-watch',name:'Platform scavenger',type:'watcher',points:[[11,-58],[18,-58],[18,-67],[11,-67]],yaw:0},
 ],
 puzzle:{id:'signal',mode:'linked',symbols:['OFF','ON'],initial:[0,0,0],targets:[1,0,1],links:[[0,1],[1],[1,2]],
  circuitNames:['SIGNALS','FLOODED PUMP','PLATFORM'],
  clue:{x:-28,z:21,label:'Read the power-room diagram',text:'Keep SIGNALS and PLATFORM lit. The flooded PUMP must stay OFF. Breaker A feeds signals AND pump; B feeds pump only; C feeds pump AND platform. A shared circuit flips each time it is switched.'},
  wheels:[{id:'signal-a',x:-28,z:15,label:'Breaker A'},{id:'signal-b',x:-28,z:9,label:'Breaker B'},{id:'signal-c',x:-28,z:3,label:'Breaker C'}],
  hints:['Enter the west power room from the concourse. Read the illuminated diagram beside its doorway.','The outside breakers both change the pump. Switching both cancels their pump changes. You need signals ON, pump OFF, platform ON.','From the untouched OFF / OFF / OFF state, use A once and C once. Leave B alone. The lamps must read ON / OFF / ON.'],
  clueLocation:'West power-room entrance, on the concourse side.',gateText:'The signal bridge unlocks. The northbound platform is reachable.'},
};
