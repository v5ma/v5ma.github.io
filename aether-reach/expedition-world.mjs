import {ROOFS,UPPER_ROOMS,UPPER_FLOORS,UPPER_STAIRS,ROOF_RAILS,ROOF_TASKS,ROOF_THINGS,ROOF_CACHES,ROOF_FLAGS,ROOF_RECORDS,ROOF_ENEMIES} from './rooftop-world.mjs';
/* Skyward Dispatch: original public side-adventures in the existing Aether Reach.
 * The same definitions drive visible streets, collision, AI, atlas and missions.
 * Southern space remains reserved for the separate living-city candidate. */
export const EXP_DISTRICTS = [
  {id:'bellmarket', name:'Bellwether Market', x:-93, y:7, z:-18, w:48, d:40, theme:'market'},
  {id:'canal', name:'Gannet Docks', x:-151, y:3, z:-26, w:42, d:46, theme:'harbor'},
  {id:'academy', name:'Aurelian Academy', x:-95, y:18, z:-98, w:48, d:40, theme:'academy'},
  {id:'archive', name:'The Civic Archive', x:-95, y:30, z:-162, w:44, d:38, theme:'archive'},
  {id:'observatory', name:'Solstice Observatory', x:7, y:38, z:-208, w:56, d:44, theme:'observatory'},
  {id:'stormworks', name:'Stormglass Works', x:114, y:26, z:-155, w:52, d:40, theme:'foundry'},
  {id:'aerodrome', name:'Dawn Aerodrome', x:143, y:12, z:-70, w:50, d:48, theme:'port'}
];
export const EXP_BRIDGES = [
  ...UPPER_STAIRS,
  {id:'market-stair', a:[-16,0,-6], b:[-70,7,-8], width:6.5, stairs:true},
  {id:'gannet-stair', a:[-116,7,-18], b:[-132,3,-18], width:6, stairs:true},
  {id:'academy-stair', a:[-92,7,-37], b:[-92,18,-79], width:6, stairs:true},
  {id:'scholar-walk', a:[-72,18,-96], b:[-45,12,-96], width:5.5, stairs:true},
  {id:'archive-stair', a:[-95,18,-117], b:[-95,30,-144], width:6.5, stairs:true},
  {id:'solstice-walk', a:[-74,30,-169], b:[-19,38,-203], width:7, stairs:true},
  {id:'meridian-stair', a:[44,20,-137], b:[12,38,-187], width:6.5, stairs:true},
  {id:'stormglass-walk', a:[63,20,-120], b:[89,26,-149], width:6.5, stairs:true},
  {id:'dawn-walk', a:[82,6,-27], b:[119,12,-53], width:7, stairs:true},
  {id:'airmail-stair', a:[138,12,-93], b:[128,26,-136], width:6.5, stairs:true},
  {id:'archive-gallery-stair', a:[-108,30,-152], b:[-108,36,-168], width:3.2, stairs:true},
  {id:'solstice-gallery-stair', a:[-7,38,-199], b:[-7,45,-215], width:3.2, stairs:true},
  {id:'dawn-gallery-stair', a:[154,12,-56], b:[154,18,-72], width:3.2, stairs:true}
];
export const TERRACES = [
  ...ROOFS,...UPPER_FLOORS,
  {id:'archive-gallery', x:-95, y:36, z:-172, w:30, d:10},
  {id:'solstice-gallery', x:7, y:45, z:-221, w:36, d:14},
  {id:'dawn-gallery', x:154, y:18, z:-80, w:18, d:18}
];
export const EXP_RAILS = [
  ...ROOF_RAILS,
  {id:'bellline',name:'Bellwether Local',from:'harbor',to:'bellmarket',points:[[-9,3.1,0],[-31,13,9],[-61,19,10],[-82,16,2],[-81,10.1,-7]]},
  {id:'archiveline',name:'Scholar Skyway',from:'bellmarket',to:'archive',points:[[-93,10.1,-28],[-93,20,-53],[-127,39,-104],[-124,46,-139],[-98,33.1,-151]]},
  {id:'solsticeline',name:'Solstice Crown',from:'archive',to:'observatory',points:[[-81,33.1,-157],[-58,42,-155],[-33,55,-182],[6,52,-191],[12,41.1,-196]]},
  {id:'dawnline',name:'Dawn Airmail',from:'garden',to:'aerodrome',points:[[78,9.1,-19],[105,22,-6],[136,29,-26],[151,25,-40],[130,15.1,-56]]},
  {id:'stormline',name:'Stormglass Switchback',from:'aerodrome',to:'stormworks',points:[[161,15.1,-55],[182,27,-88],[174,40,-121],[145,40,-147],[130,29.1,-149]]},
  {id:'northline',name:'The Northern Express',from:'stormworks',to:'observatory',points:[[102,29.1,-162],[105,43,-186],[62,60,-218],[30,60,-240],[-17,56,-235],[-26,50,-216],[-15,41.1,-196]]}
];
export const EXP_BUILDINGS = [
  {id:'bell-theatre',x:-107,y:7,z:-7,w:12,d:12,h:16},
  {id:'bell-hotel',x:-77,y:7,z:-29,w:9,d:12,h:11},
  {id:'gannet-tower',x:-160,y:3,z:-12,w:11,d:11,h:19},
  {id:'gannet-store',x:-139,y:3,z:-38,w:10,d:12,h:11},
  {id:'academy-west',x:-111,y:18,z:-101,w:10,d:19,h:16},
  {id:'academy-east',x:-78,y:18,z:-107,w:9,d:15,h:18},
  {id:'archive-wing',x:-80,y:30,z:-177,w:9,d:7,h:17},
  {id:'solstice-east',x:28,y:38,z:-216,w:9,d:15,h:18},
  {id:'storm-chimney',x:94,y:26,z:-168,w:8,d:9,h:19},
  {id:'dawn-terminal',x:126,y:12,z:-79,w:11,d:15,h:20}
];
export const EXP_ROOMS = [
  ...UPPER_ROOMS,
  {id:'market-workshop',name:'The Clockmaker’s Arcade',x:-103,y:7,z:-29,w:13,d:12,h:4.6,gate:null},
  {id:'archive-room',name:'Hall of Common Memory',x:-95,y:30,z:-172,w:18,d:14,h:5.4,gate:'archive-open'},
  {id:'storm-room',name:'The Weather Engine',x:116,y:26,z:-166,w:17,d:14,h:6,gate:'weather-open'}
];
const box=(id,x1,x2,y1,y2,z1,z2)=>({id,x1,x2,y1,y2,z1,z2});
export const ROOM_SOLIDS=EXP_ROOMS.flatMap(r=>{
  const x1=r.x-r.w/2,x2=r.x+r.w/2,z1=r.z-r.d/2,z2=r.z+r.d/2,t=.25,door=3.4;
  return [box(r.id+'-west',x1,x1+t,r.y,r.y+r.h,z1,z2),box(r.id+'-east',x2-t,x2,r.y,r.y+r.h,z1,z2),
    box(r.id+'-north',x1,x2,r.y,r.y+r.h,z1,z1+t),box(r.id+'-jamb-a',x1,r.x-door/2,r.y,r.y+r.h,z2-t,z2),
    box(r.id+'-jamb-b',r.x+door/2,x2,r.y,r.y+r.h,z2-t,z2),box(r.id+'-lintel',r.x-door/2,r.x+door/2,r.y+3.2,r.y+r.h,z2-t,z2),
    box(r.id+'-ceiling',x1,x2,r.y+r.h,r.y+r.h+.25,z1,z2)];
});
export const GATES=EXP_ROOMS.filter(r=>r.gate).map(r=>({...box(r.id+'-gate',r.x-1.7,r.x+1.7,r.y,r.y+3.2,r.z+r.d/2-.27,r.z+r.d/2+.05),flag:r.gate}));
export const COVER=[
  box('market-planter',-88,-85,7,8.05,-26,-24),box('academy-planter',-91,-88,18,19.1,-103,-101),
  box('gannet-cargo',-153,-150,3,4.15,-34,-31),box('archive-planter',-87,-84,30,31.15,-155,-153),
  box('dawn-cargo',140,143,12,13.15,-73,-70),box('storm-cargo',119,122,26,27.1,-148,-145),
  box('solstice-cover-west',-3,1,38,39.05,-208,-206),box('solstice-cover-east',14,18,38,39.05,-208,-206)
];
export const EXP_DEPOTS=[
  {id:'market-outfitters',x:-81,y:7,z:-17,name:'Bellwether Outfitters'},
  {id:'academy-outfitters',x:-101,y:18,z:-86,name:'Academy Field Supplies'},
  {id:'aerodrome-outfitters',x:137,y:12,z:-53,name:'Dawn Flight Supplies'},
  {id:'observatory-outfitters',x:22,y:38,z:-195,name:'Solstice Expedition Supplies'}
];
export const EXP_CACHES=[
  ...ROOF_CACHES,
  {id:'bell-cache',x:-111,y:7,z:-20,credits:80,label:'Theatre supply chest',weapon:null},
  {id:'gannet-cache',x:-162,y:3,z:-40,credits:90,label:'Gannet freight reserve',weapon:null},
  {id:'academy-cache',x:-114,y:18,z:-85,credits:100,label:'Academy field chest',weapon:'carbine'},
  {id:'archive-cache',x:-85,y:36,z:-171,credits:110,label:'Archive balcony reserve',weapon:null},
  {id:'storm-cache',x:116,y:26,z:-168,credits:120,label:'Weather-engine reserve',weapon:'scatter'},
  {id:'dawn-cache',x:160,y:18,z:-82,credits:100,label:'Aerodrome survey chest',weapon:'sniper'},
  {id:'solstice-cache',x:20,y:45,z:-222,credits:150,label:'Solstice summit reserve',weapon:null}
];
export const EXP_RECORDS=[
  ...ROOF_RECORDS,
  {id:'bell-programme',x:-99,y:7,z:-3,title:'The price of an open road',text:'Every toll gate began as a temporary measure. The word temporary remained on the brass plate for forty-three years. Tonight the theatre is collecting those plates for a new curtain. - Bellwether playbill'},
  {id:'gannet-log',x:-145,y:3,z:-9,title:'The ferry that waited',text:'A timetable is a promise to someone you have never met. We kept the Gannet fueled after the Registry closed its route. Someone will need to cross. Someone always does. - Captain Orel'},
  {id:'academy-letter',x:-100,y:18,z:-110,title:'An unfinished lesson',text:'A good instrument reveals what its maker did not expect. A good city should do the same. We teach our students to repair the apparatus, not to erase the inconvenient measurement. - Aurelian workshop letter'},
  {id:'storm-instructions',x:100,y:26,z:-143,title:'Three valves, one weather engine',text:'The eastbound dial takes ONE quarter-turn. The cloud-return dial takes THREE. The pressure equalizer takes TWO. Read the dials from west to east: 1, 3, 2. Then test the engine at the control pedestal. - Stormglass maintenance card'},
  {id:'solstice-record',x:12,y:45,z:-223,title:'A sky without owners',text:'We did not lift these streets into the air to make the world smaller. A route belongs to the person who needs it next. Leave the lights on. Leave the ladder down. - Solstice dedication'}
];
export const POSTS=[
  {id:'bellmarket',name:'Bellwether Rest Pavilion',x:-94,y:7,z:-13},
  {id:'canal',name:'Gannet Travelers’ Shelter',x:-146,y:3,z:-21},
  {id:'academy',name:'Academy Field Station',x:-98,y:18,z:-92},
  {id:'archive',name:'Archive Reading Court',x:-92,y:30,z:-157},
  {id:'observatory',name:'Solstice Base Camp',x:18,y:38,z:-201},
  {id:'stormworks',name:'Stormglass Aid Station',x:130,y:26,z:-139},
  {id:'aerodrome',name:'Dawn Courier Shelter',x:133,y:12,z:-64}
];
export const TASKS=[
  ...ROOF_TASKS,
  {id:'dispatch',name:'A Letter Through the Clouds',reward:60,flag:'dispatch-delivered',description:'Take Iona’s public dispatch from Arrival Quay to the Bellwether notice office.'},
  {id:'ferry',name:'A Ferry for Everyone',reward:100,flag:'ferry-online',description:'Recover the induction regulator in the Clockmaker’s Arcade and install it at Gannet Docks.'},
  {id:'charter',name:'The People’s Archive',reward:150,flag:'charter',description:'Recover three missing charter leaves, open the archive, and retrieve its original public-route charter.'},
  {id:'weather',name:'The Weather Lock',reward:120,flag:'weather-open',description:'Read the maintenance card and set Stormglass’s three valve dials to 1, 3, 2. Test the engine.'},
  {id:'rescue',name:'The Last Surveyor',reward:140,flag:'surveyor-safe',description:'Find Surveyor Lio at Dawn Aerodrome. Clear the escort route and accompany Lio to the evacuation pad.'},
  {id:'defense',name:'Keep the Light On',reward:180,flag:'beacon-secure',description:'Start the Solstice beacon and repel three waves of Registry boarding troops. Stay within the observatory.'},
  {id:'summits',name:'Above the Weather',reward:120,flag:'summits-surveyed',description:'Use the stairs, lifts or Foldwing to survey the Archive, Dawn and Solstice upper galleries.'},
  {id:'routes',name:'The Traveler’s Passport',reward:90,flag:'route-passport',description:'Finish a new sky-rail ride, a passenger-ferry crossing and an elevator journey.'},
  {id:'districts',name:'Every Street Has a Story',reward:100,flag:'all-districts',description:'Reach all seven new districts on their actual streets. Distant flyovers do not count.'},
  {id:'open-sky',name:'The Skyward Dispatch',reward:300,flag:'open-sky',description:'Recover the charter, restore the weather engine, rescue Lio and secure the beacon. Return to Iona’s Quay noticeboard.'}
];
export const THINGS=[
  ...ROOF_THINGS,
  {id:'dispatch-board',name:'Iona’s expedition noticeboard',x:5,y:0,z:-1,kind:'board'},
  {id:'market-board',name:'Bellwether notice office',x:-92,y:7,z:-6,kind:'board'},
  {id:'regulator',name:'Induction regulator',x:-103,y:7,z:-30,kind:'pickup'},
  {id:'ferry-engine',name:'Gannet ferry engine',x:-155,y:3,z:-26,kind:'console'},
  {id:'charter-market',name:'Market charter leaf',x:-83,y:7,z:-34,kind:'pickup'},
  {id:'charter-academy',name:'Academy charter leaf',x:-96,y:18,z:-106,kind:'pickup'},
  {id:'charter-dawn',name:'Aerodrome charter leaf',x:159,y:12,z:-66,kind:'pickup'},
  {id:'archive-lock',name:'Archive seal reader',x:-97,y:30,z:-161,kind:'console'},
  {id:'charter-original',name:'The public-route charter',x:-95,y:30,z:-173,kind:'pickup'},
  {id:'valve-0',name:'Eastbound valve',x:102,y:26,z:-145,kind:'valve'},
  {id:'valve-1',name:'Cloud-return valve',x:109,y:26,z:-145,kind:'valve'},
  {id:'valve-2',name:'Pressure-equalizer valve',x:116,y:26,z:-145,kind:'valve'},
  {id:'weather-console',name:'Weather-engine control',x:111,y:26,z:-155,kind:'console'},
  {id:'surveyor',name:'Surveyor Lio',x:149,y:12,z:-85,kind:'person'},
  {id:'beacon-control',name:'Solstice beacon console',x:7,y:38,z:-209,kind:'console'},
  {id:'survey-archive',name:'Archive survey telescope',x:-90,y:36,z:-174,kind:'telescope'},
  {id:'survey-dawn',name:'Dawn survey telescope',x:149,y:18,z:-84,kind:'telescope'},
  {id:'survey-solstice',name:'Solstice survey telescope',x:1,y:45,z:-224,kind:'telescope'}
];
export const ESCORT_PATH=[[149,12,-85],[148,12,-76],[148,12,-64],[139,12,-60],[130,12,-58]];
// Public transports follow these actual world-space routes. Calling a distant
// cabin brings it to the landing; boarding never teleports the player across.
export const TRANSIT=[
  {id:'gannet-ferry',name:'Gannet Passenger Ferry',kind:'ferry',requires:'ferry-online',seconds:23,a:{x:-159,y:3,z:-43},b:{x:-111,y:30,z:-157},points:[[-159,3,-43],[-175,14,-59],[-170,27,-110],[-139,38,-139],[-111,30,-157]]},
  {id:'crosswind-tram',name:'Crosswind Cloud Tram',kind:'ferry',requires:null,seconds:28,a:{x:-94,y:7,z:-1},b:{x:54,y:6,z:-13},points:[[-94,7,-1],[-77,20,30],[-27,29,41],[25,22,23],[54,6,-13]]},
  {id:'archive-lift',name:'Archive Reading Lift',kind:'lift',requires:null,seconds:5,a:{x:-83,y:30,z:-168},b:{x:-83,y:36,z:-168},points:[[-83,30,-168],[-83,36,-168]]},
  {id:'solstice-lift',name:'Solstice Summit Lift',kind:'lift',requires:null,seconds:6,a:{x:20,y:38,z:-217},b:{x:20,y:45,z:-217},points:[[20,38,-217],[20,45,-217]]}
];
const enemy=(id,kind,home,x,y,z,patrol)=>({id,kind,home,x,y:y+1.05,z,hp:kind==='breacher'?160:kind==='marshal'?100:75,reward:kind==='breacher'?80:50,humanoid:true,patrol:patrol||[[x,z],[x+2,z],[x+2,z+3],[x,z+3]]});
export const EXP_ENEMIES=[
  ...ROOF_ENEMIES,
  enemy('bell-warden-a','warden','bellmarket',-88,7,-30,[[-88,-30],[-88,-33],[-95,-33],[-95,-26]]),
  enemy('bell-marshal','marshal','bellmarket',-102,7,-20,[[-102,-20],[-100,-17],[-105,-17]]),
  enemy('gannet-warden','warden','canal',-156,3,-36,[[-156,-36],[-156,-28],[-160,-28]]),
  enemy('gannet-breacher','breacher','canal',-140,3,-14,[[-140,-14],[-137,-20],[-137,-25]]),
  enemy('academy-marshal','marshal','academy',-96,18,-108,[[-96,-108],[-87,-108],[-87,-97]]),
  enemy('academy-warden','warden','academy',-103,18,-98,[[-103,-98],[-100,-98],[-100,-104]]),
  enemy('archive-warden','warden','archive',-101,30,-155,[[-101,-155],[-104,-159],[-101,-162]]),
  enemy('archive-marshal','marshal','archive',-84,30,-160,[[-84,-160],[-82,-164],[-78,-164]]),
  enemy('dawn-warden','warden','aerodrome',145,12,-79,[[145,-79],[145,-68],[140,-66]]),
  enemy('dawn-marshal','marshal','aerodrome',159,12,-71,[[159,-71],[160,-65],[155,-65]]),
  enemy('dawn-breacher','breacher','aerodrome',141,12,-85,[[141,-85],[141,-77],[137,-77]]),
  enemy('storm-warden','warden','stormworks',102,26,-151,[[102,-151],[104,-157],[99,-158]]),
  enemy('storm-marshal','marshal','stormworks',126,26,-159,[[126,-159],[128,-152],[132,-156]]),
  enemy('storm-breacher','breacher','stormworks',119,26,-153,[[119,-153],[123,-151],[123,-155]]),
  ...[0,1,2].flatMap(w=>[
    {...enemy('solstice-wave-'+w+'-a',w===2?'breacher':'warden','observatory',-13,38,-210,[[-13,-210],[-11,-206]]),wave:w},
    {...enemy('solstice-wave-'+w+'-b','marshal','observatory',27,38,-194,[[27,-194],[22,-194]]),wave:w},
    {...enemy('solstice-wave-'+w+'-c','warden','observatory',8,38,-226,[[8,-226],[14,-226]]),wave:w}
  ])
];
export const EXP_FLAGS=new Set([...ROOF_FLAGS,'dispatch-started','dispatch-delivered','regulator','ferry-online','charter-market','charter-academy','charter-dawn','archive-open','charter','weather-open','surveyor-found','surveyor-safe','beacon-secure','survey-archive','survey-dawn','survey-solstice','summits-surveyed','route-passport','all-districts','open-sky']);
export function closedExpeditionGates(s){return GATES.filter(g=>!s?.expedition?.flags?.includes(g.flag));}
export function transitPosition(route,t){
  const lengths=route.points.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-route.points[i][j])));
  const total=lengths.reduce((a,b)=>a+b,0);let n=Math.max(0,Math.min(1,t))*total;
  for(let i=0;i<lengths.length;i++)if(n<=lengths[i]||i===lengths.length-1){const a=route.points[i],b=route.points[i+1],u=lengths[i]?n/lengths[i]:0;return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,z:a[2]+(b[2]-a[2])*u};}else n-=lengths[i];
}
// Rounded-segment barriers are a body collision test, not an axis-aligned wall
// across a diagonal bridge. A deliberate jump can clear a 1.2 m handrail.
export function bridgeBarrier(bridges,x,y,z,r=.38){
  for(const b of bridges){const [ax,ay,az]=b.a,[bx,by,bz]=b.b,dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz);if(!l)continue;
    const t=((x-ax)*dx+(z-az)*dz)/(l*l);if(t<=0||t>=1)continue;const gy=ay+(by-ay)*t;if(y>=gy+1.18||y+1.8<=gy-.12)continue;
    const side=((x-ax)*-dz+(z-az)*dx)/l;
    if(Math.abs(Math.abs(side)-(b.width/2+.1))<r+.075)return true;
  }return false;
}
// Openings line up with the physical stair landings. The same segments are
// rendered as balustrades and used by capsule collision.
export const BALCONY_RAILS=TERRACES.flatMap(t=>{
 const gap=(t.rooftop||t.interior)?1.15:2.4;const l=t.x-t.w/2,r=t.x+t.w/2,n=t.z-t.d/2,f=t.z+t.d/2,entry=t.entry??{'archive-gallery':-108,'solstice-gallery':-7,'dawn-gallery':154}[t.id];
 return [[[l,t.y,n],[r,t.y,n]],[[l,t.y,n],[l,t.y,f]],[[r,t.y,n],[r,t.y,f]],[[l,t.y,f],[Math.max(l,entry-gap),t.y,f]],[[Math.min(r,entry+gap),t.y,f],[r,t.y,f]]].filter(([a,b])=>Math.hypot(a[0]-b[0],a[2]-b[2])>.1).map(([a,b])=>({a,b}));
});
export function balconyBarrier(x,y,z,r=.38){for(const q of BALCONY_RAILS){const [ax,ay,az]=q.a,[bx,,bz]=q.b,dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2));if(y>=ay+1.18||y+1.8<=ay)continue;if(Math.hypot(x-ax-dx*t,z-az-dz*t)<r+.07)return true;}return false;}
