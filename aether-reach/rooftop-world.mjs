/* Lumen Circuit: six reachable rooftops, two upper rooms, two aerial links.
 * Stable IDs extend existing saves; no changes to the reserved southern city. */
export const ROOFS=[
 {id:'roof-bell',name:'Theatre Lantern Walk',x:-107,y:27.5,z:-9,w:14,d:16,base:7,home:'bellmarket'},
 {id:'roof-gannet',name:'Gannet Signal House',x:-139,y:18.5,z:-38,w:14,d:16,base:3,home:'canal'},
 {id:'roof-academy',name:'Aurelian Lens Terrace',x:-78,y:40.5,z:-107,w:13,d:19,base:18,home:'academy'},
 {id:'roof-storm',name:'Stormglass Lightning Deck',x:94,y:49.5,z:-168,w:12,d:15,base:26,home:'stormworks'},
 {id:'roof-dawn',name:'Dawn Courier Loft',x:126,y:36.5,z:-79,w:15,d:21,base:12,home:'aerodrome'},
 {id:'roof-solstice',name:'Solstice Prism Crown',x:28,y:60.5,z:-216,w:13,d:19,base:38,home:'observatory'}
].map(r=>({...r,entry:r.x,rooftop:true}));
export const LADDERS=ROOFS.map(r=>{const z=r.z+r.d/2;return{id:r.id+'-ladder',name:r.name,points:[[r.x,r.base,z+1.1],[r.x,r.y+.32,z+1.1],[r.x,r.y+.32,z-1.1]],roof:r.id};});
export const UPPER_ROOMS=[
 {id:'gannet-signal-house',name:'Gannet Signal House',x:-139,y:18.5,z:-40,w:8,d:8,h:8.3,gate:null},
 {id:'dawn-courier-loft',name:'Dawn Courier Loft',x:126,y:36.5,z:-82,w:9,d:8,h:8.3,gate:null}
];
export const UPPER_FLOORS=[
 {id:'gannet-mezzanine',x:-139,y:22.5,z:-42.5,w:7,d:3,entry:-141,interior:true},
 {id:'dawn-mezzanine',x:126,y:40.5,z:-84.5,w:8,d:3,entry:123.5,interior:true}
];
export const UPPER_STAIRS=[
 {id:'signal-house-stair',a:[-141,18.5,-37],b:[-141,22.5,-41.3],width:1.5,stairs:true},
 {id:'courier-loft-stair',a:[123.5,36.5,-79],b:[123.5,40.5,-83.3],width:1.5,stairs:true}
];
export const ROOF_RAILS=[
 {id:'lantern-line',name:'Lantern-to-Lens Skyway',from:'bellmarket',to:'academy',points:[[-103,30.6,-6],[-62,43,-28],[-53,58,-60],[-65,54,-89],[-78,43.6,-103]]},
 {id:'lightning-line',name:'Lightning Courier Express',from:'aerodrome',to:'stormworks',points:[[131.8,39.6,-73.5],[162,52,-94],[159,66,-132],[128,65,-153],[94,52.6,-166]]}
];
export const BEACON_TARGETS=[2,1,3];
export const ROOF_TASKS=[
 {id:'roof-surveys',name:'The City Above the City',reward:220,flag:'roof-surveys-done',description:'Climb the six marked service ladders or arrive by Foldwing and sky-rail. Use the survey instruments on every rooftop. The Gannet and Dawn instruments are upstairs inside their signal houses.'},
 {id:'roof-courier',name:'Letters That Never Landed',reward:180,flag:'roof-courier-done',description:'Recover the undelivered parcels on Gannet, Aurelian and Dawn rooftops. Deliver all three to the courier desk inside the Clockmaker\'s Arcade at Bellwether.'},
 {id:'roof-beacons',name:'The Lumen Circuit',reward:240,flag:'roof-beacons-done',description:'Align the Theatre, Stormglass and Solstice rooftop beacon rings to 2, 1, 3 respectively. Each ring turns on interaction. Return to the courier desk and energize the completed circuit.'}
];
export const ROOF_THINGS=[
 ...ROOFS.map(r=>({id:'survey-'+r.id,name:r.name+' survey',x:r.x+2,y:r.y,z:r.z-2,kind:'telescope'})).map(t=>t.id==='survey-roof-gannet'?{...t,x:-137.7,y:22.5,z:-42}:t.id==='survey-roof-dawn'?{...t,x:128,y:40.5,z:-84}:t),
 {id:'roof-parcel-gannet',name:'Gannet undelivered parcel',x:-135,y:18.5,z:-33,kind:'pickup'},
 {id:'roof-parcel-academy',name:'Aurelian undelivered parcel',x:-81,y:40.5,z:-108,kind:'pickup'},
 {id:'roof-parcel-dawn',name:'Dawn undelivered parcel',x:131,y:36.5,z:-76,kind:'pickup'},
 ...['roof-bell','roof-storm','roof-solstice'].map((id,i)=>{const r=ROOFS.find(r=>r.id===id);return{id:'roof-beacon-'+i,name:r.name+' beacon / target '+BEACON_TARGETS[i],x:r.x-2,y:r.y,z:r.z-4,kind:'console'};}),
 {id:'roof-desk',name:'Rooftop courier desk / energize circuit',x:-107,y:7,z:-30,kind:'console'}
];
export const ROOF_CACHES=ROOFS.map((r,i)=>({id:r.id+'-reserve',x:r.x+(r.id==='roof-gannet'?-4:4),y:r.y,z:r.z+4,credits:65+i*10,label:r.name+' reserve',weapon:null}));
export const ROOF_FLAGS=[...ROOF_TASKS.map(t=>t.flag),...ROOF_THINGS.filter(t=>t.kind==='pickup'||t.kind==='telescope').map(t=>t.id)];
export const ROOF_RECORDS=[
 {id:'gannet-roof-note',x:-137.5,y:18.5,z:-38,title:'Leave the ladder down',text:'The street is not the only way through a city. The signal houses have upper rooms, and the rooftops have their own post. A service ladder is an invitation, not a border. Climb with forward or back; jump to leave it. - Gannet courier manual'},
 {id:'dawn-roof-note',x:127,y:36.5,z:-80,title:'A circuit of public lights',text:'The Theatre ring needs two turns. Stormglass needs one. Solstice needs three. Set each ring on its actual rooftop, then return to the courier desk in the Clockmaker\'s Arcade. Nobody should need a private frequency to find the way home.'}
];
export const ROOF_ENEMIES=[
 {id:'lens-longshot',kind:'longshot',home:'academy',x:-76,y:41.55,z:-112,hp:65,reward:70,humanoid:true,patrol:[[-76,-112],[-80,-112]],range:54,projectileSpeed:30,attackDelay:4.2,shotDamage:28,chaseSpeed:0},
 {id:'storm-skirmisher',kind:'skirmisher',home:'stormworks',x:97,y:50.55,z:-169,hp:90,reward:65,humanoid:true,patrol:[[97,-169],[97,-172],[94,-172]],range:24,projectileSpeed:18,attackDelay:1.7,shotDamage:9,chaseSpeed:3.8}
];
