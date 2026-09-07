/* Original second chapter. Authored lanes, clue puzzle, raised approaches and
 * static geometry share the same collision data. No commercial assets. */
const box=(id,x,z,w,d,h,kind='ruin',bottom=0)=>({id,x,z,w,d,h,kind,bottom});
export const CONSERVATORY={
 id:'conservatory',title:'The Drowned Conservatory',subtitle:'CHAPTER 02 / THE ARCHIVE BELOW',
 bounds:{x0:-52,x1:52,z0:-80,z1:56},start:{x:0,z:48},
 objectiveNames:{cell:'Archive lens',crank:'Resonance core'},exit:{x:0,z:-72,name:'North archive lift'},
 shelters:[{id:'arrival',x:0,z:48,name:'Terrace camp'},{id:'garden',x:-7,z:19,name:'Lantern garden'},{id:'archive',x:-40,z:-21,name:'Archive alcove'}],
 grass:[{x:-18,z:17,w:14,d:10},{x:20,z:14,w:13,d:12},{x:-35,z:-13,w:10,d:16},{x:32,z:-15,w:9,d:16},{x:18,z:-39,w:14,d:9},{x:-18,z:-56,w:14,d:12}],
 water:[{x:0,z:-10,w:18,d:25,depth:.32},{x:-43,z:8,w:10,d:14,depth:.22},{x:41,z:5,w:12,d:12,depth:.3}],
 zones:[{name:'Arrival overlook',x:0,z:45},{name:'Lantern garden',x:0,z:16},{name:'Flooded archive',x:-34,z:-10},{name:'Glasshouse',x:33,z:-10},{name:'Sluice causeway',x:0,z:-34},{name:'North sanctuary',x:0,z:-66}],
 obstacles:[
  box('edge-w',-53,-12,2,138,24,'rock'),box('edge-e',53,-12,2,138,24,'rock'),box('edge-s',0,57,106,2,16,'rock'),box('edge-n',0,-81,106,2,28,'rock'),
  // Low cover and root islands leave east/west garden routes open.
  box('garden-bed-w',-13,12,7,3,1.05,'planter'),box('garden-bed-e',13,12,7,3,1.05,'planter'),
  box('garden-basin',0,10,5,3,.85,'fountain'),box('garden-broken-plinth',-23,24,3,3,2.2,'ruin'),
  // Archive is enterable from both ends and an east-side doorway.
  box('archive-w',-47,-8,1.2,34,8),box('archive-n',-35,-25,24,1.2,9),
  box('archive-e-a',-23,-18,1.2,14,7),box('archive-e-b',-23,3,1.2,12,7),
  box('archive-front-a',-44,9,7,1.2,6),box('archive-front-b',-28,9,11,1.2,6),
  box('archive-low',-38,-9,3,6,.95,'counter'),box('archive-shelves',-44,-4,2,12,3,'shelf'),
  // Separate glasshouse route; monster cover is physical, not decorative.
  box('glass-e',47,-7,1.2,34,8),box('glass-n',35,-24,24,1.2,8),
  box('glass-w-a',23,-17,1.2,14,7),box('glass-w-b',23,5,1.2,10,7),
  box('glass-cover',34,-8,5,2,1.0,'planter'),box('glass-cover-2',28,-18,2,4,.9,'counter'),
  // A true gate prevents bypassing the puzzle, all the way to the world edges.
  box('sluice-west',-29,-31,46,2,10),box('sluice-east',29,-31,46,2,10),
  {...box('sluice-gate',0,-31,12,2,7,'gate'),openWhen:'sluice'},
  box('causeway-cover-w',-13,-41,5,2,1,'planter'),box('causeway-cover-e',13,-41,5,2,1,'planter'),
  box('sanctuary-west',-18,-67,2,18,13,'ruin',5),box('sanctuary-east',18,-67,2,18,13,'ruin',5),
  box('sanctuary-north',0,-78,38,2,18,'ruin',5),box('sanctuary-table',0,-68,6,2,1,'counter',5),
  // The detailed columns use these same boxes for navigation and body clearance.
  ...[16,2,-12].flatMap(z=>[-11,11].map(x=>({...box('colonnade-'+x+'-'+z,x,z,1.9,1.9,9,'column'),renderSeparately:true}))),
  ...[7,-3,-13,-23].flatMap(z=>[-35,35].map(x=>({...box('chamber-column-'+x+'-'+z,x,z,1.9,1.9,8,'column'),renderSeparately:true}))),

 ],
 items:[
  {id:'ruins-supplies',x:2,z:46,type:'supplies',label:'Expedition kit',cloth:3,canister:3,bottles:3,ammo:12},
  {id:'garden-stash',x:-15,z:22,type:'supplies',label:'Gardener’s tool roll',cloth:2,ammo:6},
  {id:'archive-lens',x:-41,z:-18,type:'objective',objective:'cell',label:'Archive lens'},
  {id:'glass-core',x:39,z:-19,type:'objective',objective:'crank',label:'Resonance core'},
  {id:'archive-stash',x:-42,z:5,type:'supplies',label:'Sealed archive satchel',canister:2,bottles:2},
  {id:'glass-stash',x:30,z:4,type:'supplies',label:'Glasshouse supplies',ammo:9,cloth:1},
  {id:'causeway-stash',x:-25,z:-42,type:'supplies',label:'Hidden causeway cache',ammo:6,cloth:1,canister:1},
  {id:'sanctuary-stash',x:12,z:-68,type:'supplies',label:'North shelter chest',ammo:8,cloth:2},
 ],
 patrols:[
  {id:'ruin-watch',name:'Archive scavenger',type:'watcher',points:[[-19,4],[-17,-4],[-19,-20],[-13,-8]],yaw:0},
  {id:'mire-hound',name:'Mire hound',type:'prowler',points:[[-34,-15],[-39,-20],[-40,-12],[-32,-8]],yaw:0},
  {id:'rootback',name:'Rootback',type:'brute',points:[[34,-14],[39,-12],[39,-20],[29,-18]],yaw:0},
  {id:'north-hound',name:'Mire hound',type:'prowler',points:[[-18,-43],[-16,-52],[-21,-58],[-23,-49]],yaw:0},
  {id:'north-watch',name:'Sanctuary scavenger',type:'watcher',points:[[12,-64],[12,-73],[8,-74],[7,-64]],yaw:0},
 ],
 puzzle:{id:'sluice',targets:[0,1,3],initial:[2,2,2],symbols:['SUN','LEAF','MOON','WAVE'],
  clue:{x:-29,z:7,label:'Read the archive inscription',text:'Three keepers open the waterway: the first welcomes the SUN; the second shelters the LEAF; the last returns the WAVE. Read the wheels from the garden toward the north.'},
  wheels:[{id:'wheel-0',x:-29,z:1,label:'Garden wheel'},{id:'wheel-1',x:-29,z:-7,label:'Archive wheel'},{id:'wheel-2',x:-29,z:-15,label:'Deep wheel'}]},
};
