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
   {id:'choir-gallery',type:'gallery',x:.5,z:-4.85,w:8.5,d:1.3,y:GALLERY_Y}
  ];
  world.floors.push(...floors);
  world.targets.push([3.2,1.5,2.8]); // Court bell visible from the upper gallery.
  // Floor slab and front balustrade share their visible/collision bounds.
  world.solids.push(box([-5.55,2.96,-5.5],[4.75,3.19,-4.2],'gallery-deck'));
  world.solids.push(box([-3.72,3.2,-4.2],[4.75,4.08,-4.02],'balustrade'));
  world.solids.push(box([4.65,3.2,-5.5],[4.88,4.08,-4.05],'balustrade'));
  // Top landing is reached from the stair at x=-4.65; no auto-lift or teleport.
  world.architecture={version:1,galleryHeight:GALLERY_Y,stairEntry:[-4.65,0,4.75],viewpoint:[3.9,GALLERY_Y,-4.85],floorIDs:floors.map(f=>f.id)};
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
