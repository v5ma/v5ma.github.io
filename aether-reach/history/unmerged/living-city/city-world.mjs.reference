/* Public, original civic sandbox. No private manuscript or remote content.
 * Floors, walls, apertures and scene art use these same world-space definitions. */
export const CITY_DISTRICTS=[
 {id:'commons',name:'Lantern Commons',x:0,y:0,z:43,w:38,d:26,theme:'commons'},
 {id:'skyyard',name:'Skywright Yard',x:-37,y:2,z:42,w:28,d:26,theme:'yard'}
];
export const CITY_BRIDGES=[
 {id:'commons-walk',a:[0,0,16],b:[0,0,31],width:6},
 {id:'yard-walk',a:[-17,0,43],b:[-25,2,43],width:5},
 {id:'quay-yard',a:[-16,0,0],b:[-37,2,30],width:4}
];
export const CITY_BUILDINGS=[
 {id:'civic-hall',x:10,y:0,z:44,w:11,d:10,h:13},
 {id:'watch-house',x:-10,y:0,z:44,w:10,d:10,h:9},
 {id:'sky-workshop',x:-39,y:2,z:47,w:14,d:12,h:12}
];
export const ROOMS=[
 {id:'cafe',building:'arrival',name:'The Copper Cup',x:-10,y:0,z:9,w:9,d:9,height:3.6,color:'#d9b493',accent:'#447e79',door:'north'},
 {id:'customs',building:'customs',name:'Old Customs Exchange',x:11,y:0,z:-12,w:7,d:6,height:3.5,color:'#acbdc5',accent:'#856641',door:'south'},
 {id:'greenhouse',building:'greenhouse',name:'Sel’s Resonance Conservatory',x:74,y:6,z:-34,w:8,d:8,height:3.6,color:'#c0d4bc',accent:'#886ba2',door:'south'},
 {id:'hall',building:'civic-hall',name:'Civic Hall',x:10,y:0,z:44,w:11,d:10,height:4.3,color:'#e2d4b1',accent:'#6a96a6',door:'north'},
 {id:'watch',building:'watch-house',name:'Lantern Watch',x:-10,y:0,z:44,w:10,d:10,height:3.8,color:'#b8cdd2',accent:'#325b79',door:'north'},
 {id:'workshop',building:'sky-workshop',name:'Skywright Hangar',x:-39,y:2,z:47,w:14,d:12,height:5,color:'#c4b79e',accent:'#bf684b',door:'north',gate:'hangar'},
 {id:'basement',building:null,name:'Underquay Pump Vault',x:-10,y:-4.2,z:9,w:7.8,d:7.8,height:3.9,color:'#6e8888',accent:'#8bb5aa',door:null}
];
export const CELLAR={x1:-13.5,x2:-6.0,z1:5.3,z2:12.9,y:-4.2};
export const STAIR={x1:-13.05,x2:-11.25,z1:5.1,z2:11.5,top:0,bottom:-4.2};
const box=(x1,x2,y1,y2,z1,z2,id)=>({x1,x2,y1,y2,z1,z2,id});
export function roomWalls(r){
 const x1=r.x-r.w/2,x2=r.x+r.w/2,z1=r.z-r.d/2,z2=r.z+r.d/2,t=.24,y1=r.y,y2=r.y+r.height,door=2.7;
 const out=[box(x1,x1+t,y1,y2,z1,z2,r.id+'-west'),box(x2-t,x2,y1,y2,z1,z2,r.id+'-east')];
 for(const side of ['north','south']){
  const a=side==='north'?z1:z2-t,b=a+t;
  if(r.id==='basement'&&side==='north'){out.push(box(x1,STAIR.x1-.15,y1,y2,a,b,r.id+'-stair-left'),box(STAIR.x2+.15,x2,y1,y2,a,b,r.id+'-stair-right'));}
  else if(r.door!==side)out.push(box(x1,x2,y1,y2,a,b,r.id+'-'+side));
  else{out.push(box(x1,r.x-door/2,y1,y2,a,b,r.id+'-jamb-left'),box(r.x+door/2,x2,y1,y2,a,b,r.id+'-jamb-right'),box(r.x-door/2,r.x+door/2,y1+2.9,y2,a,b,r.id+'-lintel'));}
 }
 // Real ceilings stop vertical jumps/vehicle travel through a floor above.
 if(r.id!=='basement')out.push(box(x1,x2,y2,y2+.25,z1,z2,r.id+'-ceiling'));
 return out;
}
export const CITY_GATES=[
 {id:'cellar',name:'Pump-vault service gate',requires:'cellar-key',x1:STAIR.x1,x2:STAIR.x2,y1:-.4,y2:2.9,z1:5.85,z2:6.10},
 {id:'hangar',name:'Skywright permit gate',requires:'permit',x1:-40.35,x2:-37.65,y1:2,y2:4.9,z1:40.99,z2:41.26}
];
export const CITY_FURNITURE=[
 box(-8.5,-6.6,0,1.05,10.7,12.3,'cafe-counter'),
 box(9,12,0,1.1,46.6,47.4,'mayor-desk'),
 box(-13.9,-11.8,0,1.05,46.7,47.7,'watch-desk'),
 box(-44.7,-43.8,2,3.15,45.8,50.5,'workbench'),
 box(75.8,77.3,6,7,-36.9,-35.1,'magic-workbench')
];
export function closedGates(city){return CITY_GATES.filter(g=>!city?.flags?.includes(g.requires));}
export function stairContains(x,z){return x>STAIR.x1&&x<STAIR.x2&&z>=STAIR.z1&&z<=STAIR.z2;}
export function cityFloor(x,z,under=Infinity){
 let y=-Infinity,id=null;
 if(x>CELLAR.x1&&x<CELLAR.x2&&z>CELLAR.z1&&z<CELLAR.z2&&CELLAR.y<=under){y=CELLAR.y;id='basement';}
 if(stairContains(x,z)){const t=(z-STAIR.z1)/(STAIR.z2-STAIR.z1),sy=STAIR.top+(STAIR.bottom-STAIR.top)*t;if(sy<=under&&sy>y){y=sy;id='cafe-stair';}}
 return {y,id};
}
export function insideRoom(p){
 if(p.y<-1&&p.x>CELLAR.x1&&p.x<CELLAR.x2&&p.z>CELLAR.z1&&p.z<CELLAR.z2)return ROOMS.at(-1);
 return ROOMS.find(r=>r.id!=='basement'&&Math.abs(p.x-r.x)<r.w/2-.15&&Math.abs(p.z-r.z)<r.d/2-.15&&p.y>=r.y-.4&&p.y<r.y+r.height)||null;
}
// Constant public NPC IDs and articulated procedural appearances. Romance choices
// concern fictional adults and have no mechanical reward or mandatory outcome.
export const PEOPLE=[
 {id:'mara',name:'Mara Vale',role:'Café owner · adult',x:-9.4,y:0,z:10.0,yaw:Math.PI,coat:'#ba654b',skin:'#b88969',hair:'#322d32',style:'apron'},
 {id:'nora',name:'Nora Bell',role:'Pump engineer',x:-7.8,y:0,z:7.0,yaw:-1.2,coat:'#487e8b',skin:'#805344',hair:'#292c30',style:'engineer'},
 {id:'ada',name:'Constable Ada',role:'Lantern Watch',x:-9.6,y:0,z:46,yaw:Math.PI,coat:'#35546f',skin:'#ca9a74',hair:'#242935',style:'police'},
 {id:'mayor',name:'Mayor Orin',role:'Elected steward',x:10.4,y:0,z:45.3,yaw:Math.PI,coat:'#537866',skin:'#b2836e',hair:'#a6a1a0',style:'mayor'},
 {id:'rook',name:'Rook Finch',role:'Unlicensed salvage broker',x:11.4,y:0,z:-12.6,yaw:0,coat:'#755379',skin:'#cca684',hair:'#482c2c',style:'broker'},
 {id:'sel',name:'Sel Anwen',role:'Resonance practitioner',x:72.3,y:6,z:-35.3,yaw:.6,coat:'#816f9c',skin:'#d3ab85',hair:'#dad6c3',style:'mage'},
 {id:'ivo',name:'Ivo Calder',role:'Skywright mechanic',x:-41.7,y:2,z:46.6,yaw:1.5,coat:'#a36740',skin:'#8c6151',hair:'#30383b',style:'engineer'},
 {id:'delivery',name:'Jun Reed',role:'Garden courier',x:80,y:6,z:-15,yaw:-1.4,coat:'#5c9380',skin:'#b88c69',hair:'#373b38',style:'courier'}
];
export const CITIZENS=[
 {id:'baker',name:'Tess the baker',route:[[-5,0,33],[6,0,33],[6,0,36],[-5,0,36]],coat:'#ba9d61',skin:'#b88969',hair:'#5a3930'},
 {id:'porter',name:'Ari the porter',route:[[16,0,0],[16,0,9],[5,0,13],[5,0,2]],coat:'#667e96',skin:'#795247',hair:'#292c30'},
 {id:'reader',name:'Mae the librarian',route:[[-5,0,49],[3,0,49],[3,0,51],[-5,0,51]],coat:'#ad718a',skin:'#c4a080',hair:'#aaaba3'},
 {id:'watch-patrol',name:'Watch patrol',route:[[-16,0,36],[-5,0,36],[-5,0,52],[-16,0,52],[-16,0,36]],coat:'#365974',skin:'#9f7964',hair:'#2b313b',style:'police'},
 {id:'gardener',name:'Garen the gardener',route:[[53,6,-36],[60,6,-36],[60,6,-27],[53,6,-27]],coat:'#a8a066',skin:'#bf987b',hair:'#74614f'},
 {id:'worker',name:'Freight worker',route:[[-29,12,-74],[-27,12,-80],[-24,12,-84],[-24,12,-74]],coat:'#9c7455',skin:'#805949',hair:'#313b3a'}
];
export const CATS=[
 {id:'pip',name:'Pip',x:3,y:0,z:47,color:'#d8ad77'},
 {id:'miso',name:'Miso',x:-5.1,y:0,z:34,color:'#e5ded1'},
 {id:'soot',name:'Soot',x:-46,y:2,z:37,color:'#45474d'}
];
export const THINGS=[
 {id:'pump-fuse',name:'Ceramic pump fuse',x:-8,y:-4.2,z:11.1},
 {id:'pump-valve',name:'Main pump console',x:-7.6,y:-4.2,z:6.8},
 {id:'cargo-ledger',name:'Missing-cargo ledger',x:-9,y:-4.2,z:8.7},
 {id:'glyph-root',name:'Root glyph',x:71.3,y:6,z:-32},
 {id:'glyph-tide',name:'Tide glyph',x:74,y:6,z:-32.3},
 {id:'glyph-star',name:'Star glyph',x:76.7,y:6,z:-32},
 {id:'mailbox-garden',name:'Garden airmail receptacle',x:75.5,y:6,z:-13.5}
];
export const DOCKS=[
 {id:'yard',name:'Skywright landing pad',x:-30,y:2,z:35},
 {id:'garden',name:'Garden landing pad',x:79,y:6,z:-12},
 {id:'commons',name:'Commons landing pad',x:14,y:0,z:34}
];
export const ATTRIBUTES={
 vigor:{name:'Vigor',description:'+10 maximum health per rank.'},
 aviation:{name:'Aviation',description:'Foldwing charge drains 8% slower per rank.'},
 resonance:{name:'Resonance',description:'Mend restores 5 additional health per rank.'}
};
export function citizenPose(c,time){
 const route=c.route;let length=0;const edges=route.map((p,i)=>{const q=route[(i+1)%route.length],d=Math.hypot(q[0]-p[0],q[2]-p[2]);length+=d;return d;});
 let s=(Math.max(0,time)*.8)%length;
 for(let i=0;i<route.length;i++){if(s<=edges[i]&&edges[i]>0){const p=route[i],q=route[(i+1)%route.length],t=s/edges[i];return {x:p[0]+(q[0]-p[0])*t,y:p[1],z:p[2]+(q[2]-p[2])*t,yaw:Math.atan2(q[0]-p[0],q[2]-p[2])};}s-=edges[i];}
 return {x:route[0][0],y:route[0][1],z:route[0][2],yaw:0};
}
export function catPosition(cat,s){return cat.id==='pip'&&s.city?.flags.includes('cat-found')?{x:-8.9,y:0,z:8.6}:cat;}
