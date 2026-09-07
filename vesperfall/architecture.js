/* Authored architecture layered over the seeded graph. Coordinates are metres.
 * The starter gallery is a real walkable floor with a stair surface, not scenery.
 * No geometry, image, character, texture or story data from reference games. */
(function(root){'use strict';
 const GALLERY_Y=3.2;
 function box(min,max,type){return {min,max,type};}
 function augment(world){
  // Tall enclosure walls use the existing collision footprint. Ground graph
  // doors and low tactical cover retain their positions and their dimensions.
  for(const b of world.solids){if(b.type==='wall')b.max[1]=7.8;if(b.type==='column')b.max[1]=7.6;}
  const floors=[
   {id:'choir-stair',type:'stair',x:-4.65,z:.2,w:1.8,d:8.8,y:0,slopeZ:-GALLERY_Y/8.8,anchorZ:4.6},
   {id:'choir-landing',type:'gallery',x:-4.65,z:-4.85,w:1.8,d:1.3,y:GALLERY_Y},
   {id:'choir-gallery',type:'gallery',x:.5,z:-4.85,w:8.5,d:2.2,y:GALLERY_Y}
  ];
  world.floors.push(...floors);
  world.targets.push([3.2,1.5,2.8]); // Court bell visible from the upper gallery.
  // Floor slab and front balustrade share their visible/collision bounds.
  world.solids.push(box([-5.55,2.96,-5.5],[-3.75,3.19,-4.2],'gallery-deck'));
  world.solids.push(box([-3.75,2.96,-5.95],[4.75,3.19,-3.75],'gallery-deck'));
  world.solids.push(box([-3.72,3.2,-3.75],[-1.25,4.08,-3.57],'balustrade'));
  world.solids.push(box([1.25,3.2,-3.75],[4.75,4.08,-3.57],'balustrade'));
  world.solids.push(box([4.65,3.2,-5.5],[4.88,4.08,-3.57],'balustrade'));
  // Top landing is reached from the stair at x=-4.65; no auto-lift or teleport.
  world.architecture={version:1,galleryHeight:GALLERY_Y,blinkPad:[0,GALLERY_Y,-4.85],stairEntry:[-4.65,0,4.75],viewpoint:[3.9,GALLERY_Y,-4.85],floorIDs:floors.map(f=>f.id)};
  world.architecture.lofts=[];
  // Use the two nearest non-start, non-beacon rooms. Each has two independently
  // reachable stairs, a broad cross-gallery, and one height-gated supply cache.
  const selected=world.rooms.filter(r=>r.id!==1&&r.id!==world.exit).sort((a,b)=>(Math.abs(a.x)+Math.abs(a.z))-(Math.abs(b.x)+Math.abs(b.z))).slice(0,2);
  for(const [i,r] of selected.entries()){
   r.family=i?'Reliquary Walk':'Archive Loft';const x=r.x,z=r.z;
   // Relocate no hidden blockers: remove only low cover intersecting the stairs.
   world.solids=world.solids.filter(b=>!(b.type==='cover'&&Math.abs((b.min[0]+b.max[0])/2-x)<6&&Math.abs((b.min[2]+b.max[2])/2-z)<5));
   for(const side of[-1,1])world.floors.push({id:'loft-'+r.id+'-'+side,type:'stair',x:x+side*4.85,z:z+.2,w:1.6,d:8.8,y:0,slopeZ:-GALLERY_Y/8.8,anchorZ:z+4.6});
   world.floors.push({id:'loft-'+r.id+'-walk',type:'gallery',x,z:z-4.85,w:8.1,d:2.1,y:GALLERY_Y});
   world.solids.push(box([x-4.05,2.96,z-5.9],[x+4.05,3.19,z-3.8],'gallery-deck'));
   for(const side of[-1,1]){const xx=x+side*4.85;world.floors.push({id:'loft-'+r.id+'-landing-'+side,type:'gallery',x:xx,z:z-5.05,w:1.6,d:1.7,y:GALLERY_Y});world.solids.push(box([xx-.8,2.96,z-5.9],[xx+.8,3.19,z-4.2],'gallery-deck'));}
   for(const side of[-1,1]){const a=side<0?-3.95:1.25,b=side<0?-1.25:3.95;world.solids.push(box([x+a,3.2,z-3.8],[x+b,4.05,z-3.62],'balustrade'));}
   world.pickups.push({id:'loft-'+r.id,p:[x+2.7,3.5,z-4.85],kind:i?'frost':'cinder',taken:false});
   world.architecture.lofts.push({room:r.id,label:r.family,entry:[x-4.85,0,z+4.75],otherEntry:[x+4.85,0,z+4.75],pad:[x,3.2,z-4.85]});
  }
  return world;
 }
 function elevation(f,p){return f.y+(f.slopeZ||0)*(p[2]-(f.anchorZ??f.z))+(f.slopeX||0)*(p[0]-(f.anchorX??f.x));}
 function floorAt(world,p,margin=0,maxRise=.42,maxDrop=Infinity){
  let best=null;
  for(const f of world.floors){if(p[0]<f.x-f.w/2+margin||p[0]>f.x+f.w/2-margin||p[2]<f.z-f.d/2+margin||p[2]>f.z+f.d/2-margin)continue;
   const y=elevation(f,p);if(y>(p[1]||0)+maxRise+1e-5||y<(p[1]||0)-maxDrop-1e-5)continue;
   if(best===null||y>best)best=y;
  }return best;
 }
 function floorHit(world,a,b){let best=null;
  for(const f of world.floors){const da=a[1]-elevation(f,a)-.02,db=b[1]-elevation(f,b)-.02;if(da<0||db>0||da-db<1e-9)continue;
   const t=da/(da-db),p=a.map((x,i)=>x+(b[i]-x)*t);
   if(p[0]<f.x-f.w/2||p[0]>f.x+f.w/2||p[2]<f.z-f.d/2||p[2]>f.z+f.d/2)continue;
   if(!best||t<best.t)best={t,p:[p[0],elevation(f,p),p[2]],id:f.id||'ground'};
  }return best;
 }
 const API={GALLERY_Y,augment,elevation,floorAt,floorHit};root.CloisterLayout=Object.freeze(API);if(typeof module!=='undefined')module.exports=API;
})(globalThis);
