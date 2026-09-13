/* Chapter 07: a flooded municipal aquatic center built around swimming, diving
 * and water-aware stealth. The pools are gameplay regions, not decorative planes. */
const box=(id,x,z,w,d,h,kind='tile',bottom=0)=>({id,x,z,w,d,h,kind,bottom});
const task=(id,x,z,title,description,kind='record',extra={})=>({id,x,z,title,description,kind,reward:{cloth:1,canister:1},...extra});
export const NATATORIUM={
 id:'natatorium',title:'Northlight Natatorium',subtitle:'CHAPTER 07 / BELOW THE WATERLINE',number:7,
 bounds:{x0:-48,x1:48,z0:-86,z1:56},start:{x:0,z:48},
 intro:'The municipal baths are still half full. Recover the filtration fuse from the deep competition pool, find the pressure spindle, balance the circulation valves, and reopen the north service route.',
 objectiveNames:{cell:'Filtration fuse',crank:'Pressure spindle'},objectivePrompt:'Recover the filtration fuse and pressure spindle.',
 exit:{x:0,z:-78,name:'North service lift'},exitPrompt:'Ride the north service lift / finish',
 shelters:[{id:'natatorium-lobby',x:0,z:48,name:'Dry lobby shelter'},{id:'natatorium-deck',x:15,z:23.5,name:'Competition-deck refuge'},{id:'natatorium-lockers',x:-36,z:18,name:'Locker-room refuge'},{id:'natatorium-pump',x:-36,z:-54,name:'Pump-room shelter'}],
 zones:[{name:'Ticket lobby',x:0,z:46},{name:'Warm-up pool',x:-18,z:15},{name:'Competition pool',x:15,z:2},{name:'Diving well',x:-18,z:-27},{name:'Filter gallery',x:13,z:-50},{name:'Pump room',x:-35,z:-54},{name:'North service lift',x:0,z:-78}],
 grass:[],
 water:[
  {id:'warmup',x:-18,z:14,w:20,d:26,depth:.48,surface:-.08,swimmable:false,pool:true},
  {id:'competition',x:15,z:1,w:18,d:42,depth:2.55,surface:-.08,swimmable:true,pool:true},
  {id:'divewell',x:-18,z:-27,w:18,d:20,depth:3.15,surface:-.08,swimmable:true,pool:true},
  {id:'filter-channel',x:13,z:-50,w:14,d:18,depth:1.65,surface:-.08,swimmable:true,pool:true}
 ],
 obstacles:[
  box('nat-edge-w',-49,-15,2,144,12,'tile'),box('nat-edge-e',49,-15,2,144,12,'tile'),box('nat-edge-s',0,57,100,2,8,'tile'),box('nat-edge-n',0,-87,100,2,10,'tile'),
  // Lobby and locker walls leave broad, readable entrances.
  box('lobby-west',-26,43,1,24,7,'tile'),box('lobby-east',26,43,1,24,7,'tile'),
  box('locker-back',-37,7,22,1,6,'tile'),box('locker-side-a',-48,18,1,22,6,'tile'),box('locker-side-b',-26,18,1,10,6,'tile'),
  box('office-back',37,20,22,1,6,'tile'),box('office-side-a',48,31,1,22,6,'tile'),box('office-side-b',26,31,1,10,6,'tile'),
  // Dry central walkway between the two main pools.
  box('center-rail-a',0,17,2.4,8,.95,'rail'),box('center-rail-b',0,-13,2.4,10,.95,'rail'),
  box('bench-west',-34,29,5,1.6,.8,'counter'),box('bench-east',34,29,5,1.6,.8,'counter'),
  box('locker-island',-37,16,6,2,2.2,'shelf'),box('office-desk',36,29,5,2,1,'counter'),
  // Pump gallery and service corridor.
  box('pump-west',-48,-55,1,30,7,'tile'),box('pump-east-a',-24,-62,1,16,7,'tile'),box('pump-east-b',-24,-42,1,8,7,'tile'),box('pump-north',-36,-70,24,1,7,'tile'),
  box('pump-console',-37,-48,5,1.5,1.1,'counter'),box('chemical-locker',-43,-60,3,5,2.5,'shelf'),
  box('north-barrier-west',-30,-68,36,1.6,6,'fence'),box('north-barrier-east',30,-68,36,1.6,6,'fence'),{...box('natatorium-gate',0,-68,24,1.6,6,'gate'),openWhen:'natatorium'},
  // Structural columns around the competition hall; none occupy a pool footprint.
  ...[-2,-18,-36,-54].flatMap(z=>[-45,-6,33,45].map(x=>box('nat-column-'+x+'-'+z,x,z,1,1,9,'column'))),
 ],
 items:[
  {id:'natatorium-kit',x:2,z:47,type:'supplies',label:'Aquatics emergency bag',ammo:10,cloth:3,canister:3,bottles:2},
  {id:'natatorium-fuse',x:15,z:-13,type:'objective',objective:'cell',label:'Submerged filtration fuse',underwater:true},
  {id:'natatorium-spindle',x:-35,z:-63,type:'objective',objective:'crank',label:'Pressure spindle'},
  {id:'natatorium-locker-cache',x:-38,z:21,type:'supplies',label:'Locker-room first aid case',cloth:2,canister:1},
  {id:'natatorium-office-cache',x:36,z:31,type:'supplies',label:'Coach office supply case',ammo:6,bottles:2},
  {id:'natatorium-filter-cache',x:21,z:-57,type:'supplies',label:'Filter gallery maintenance bag',ammo:6,cloth:1,canister:2},
 ],
 patrols:[
  {id:'nat-deck-watch',name:'Pool-deck lookout',type:'watcher',points:[[34,17],[34,5],[34,-7],[30,-7],[30,17]],yaw:Math.PI},
  {id:'nat-locker-raider',name:'Locker-room raider',type:'raider',points:[[-40,27],[-32,27],[-32,20],[-40,20]],yaw:0},
  {id:'nat-office-rifle',name:'Upper-deck marksman',type:'marksman',points:[[37,36],[43,36],[43,26],[37,26]],yaw:Math.PI},
  {id:'nat-pump-sentinel',name:'Pump-room sentry',type:'sentinel',points:[[-33,-45],[-42,-45],[-42,-55],[-33,-55]],yaw:0},
  {id:'nat-service-hound',name:'Filter-channel mire hound',type:'prowler',points:[[26,-44],[31,-44],[31,-54],[26,-54]],yaw:0},
  {id:'nat-north-watch',name:'North-lift lookout',type:'watcher',points:[[12,-78],[20,-78],[20,-72],[12,-72]],yaw:0},
 ],
 puzzle:{id:'natatorium',symbols:['CLOSED','BYPASS','OPEN'],initial:[0,0,0],targets:[2,0,1],
  clue:{x:-34,z:-39,label:'Read the circulation schematic',text:'Open the COMPETITION intake. Keep the DIVE WELL drain CLOSED. Set the FILTER return to BYPASS. The north service barrier releases only when pressure is balanced.'},
  wheels:[{id:'nat-intake',x:-39,z:-42,label:'Competition intake'},{id:'nat-drain',x:-39,z:-50,label:'Dive-well drain'},{id:'nat-return',x:-39,z:-58,label:'Filter return'}],
  clueLocation:'Dry pump gallery, west of the diving well.',
  hints:['Reach the pump room from the west locker corridor. The illuminated schematic is beside the first valve.','Each valve advances CLOSED -> BYPASS -> OPEN independently. The three labels correspond to competition intake, dive-well drain, and filter return.','Set Competition intake OPEN, Dive-well drain CLOSED, Filter return BYPASS.'],gateText:'The north service barrier unlocks. The lift route is open.'},
 tasks:[
  task('nat-locker-log',-40,25,'The last swim class','Record the coach board left behind in the locker corridor.','record'),
  task('nat-lane-lights',31,-14,'Lights under the lanes','Restore the competition-pool lane lights after recovering the filtration fuse.','repair',{requires:['cell'],reward:{ammo:4,canister:2}}),
  task('nat-dive-marker',-7.5,-34,'Mark the deep well','Leave a visible depth marker at the diving well for anyone following.','rescue',{reward:{cloth:2}}),
  task('nat-chemical-lock',-40.2,-61,'Seal the chlorine room','Secure the chemical cabinet before opening the north route.','supply',{reward:{canister:2,cloth:1}}),
  task('nat-circulation',-33,-56,'Wake the circulation loop','Install the pressure spindle after balancing the three circulation valves.','repair',{required:true,requires:['crank','puzzle'],reward:{health:20,canister:2}}),
  task('nat-lift-signal',0,-64,'Call the service lift','Send the clearance signal after recovering the submerged fuse and restoring circulation.','signal',{required:true,requires:['cell','crank','puzzle','task:nat-circulation'],reward:{ammo:5}}),
 ]
};
