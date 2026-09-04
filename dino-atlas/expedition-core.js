// Navigation and evidence rules shared by both graphical views.
export const LIMIT=41;
export const LAKE={x:-24,z:19,r:8};
export const CLUES=[
  {id:'tracks',x:10,z:10,title:'A trail of footprints',text:'Footprints are trace fossils: evidence of activity rather than a preserved body. A trackway can suggest how an animal moved, but a footprint does not always identify an exact species.'},
  {id:'layers',x:-14,z:-17,title:'Reading the rocks',text:'In an undisturbed stack of sedimentary rocks, lower layers are usually older than the layers above. Geologists check for folding, faults, and other changes before interpreting the story.'}
];
export const SPAWN={x:0,z:24};
export function move(position,dx,dz,dt,speed=7){
  if(![position.x,position.z,dx,dz,dt,speed].every(Number.isFinite))return {...SPAWN};
  const mag=Math.hypot(dx,dz),f=mag>1?1/mag:1;
  let x=position.x+dx*f*Math.max(0,Math.min(dt,.1))*speed,z=position.z+dz*f*Math.max(0,Math.min(dt,.1))*speed;
  const r=Math.hypot(x,z);if(r>LIMIT){x=x/r*LIMIT;z=z/r*LIMIT;}
  const lx=x-LAKE.x,lz=z-LAKE.z,l=Math.hypot(lx,lz);
  if(l<LAKE.r+1){const s=(LAKE.r+1)/(l||1);x=LAKE.x+(l?lx*s:LAKE.r+1);z=LAKE.z+lz*s;}
  return {x,z};
}
export function nearest(position,targets,radius=6){
  let best=null;
  for(const item of targets){const d=Math.hypot(position.x-item.x,position.z-item.z);if(d<=radius&&(!best||d<best.distance))best={...item,distance:d};}
  return best;
}
export function animalPose(index,time){
  const x=index===0?-10:15,z=index===0?-3:-10;
  return {x:x+Math.sin(time*.14+index)*4,z:z+Math.cos(time*.14+index)*3,angle:-Math.atan2(-Math.sin(time*.14+index)*3,Math.cos(time*.14+index)*4)};
}
export function readClues(storage){try{const list=JSON.parse(storage.getItem('dino-atlas.clues.v1')||'[]');return new Set(Array.isArray(list)?list.filter(s=>/^(triassic|jurassic|cretaceous):(tracks|layers)$/.test(s)):[]);}catch{return new Set();}}
