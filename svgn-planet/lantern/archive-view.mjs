import {archiveIsolated} from './archive.mjs';
export function createArchiveView({world,box,label,materials}){
 const group=world.clone(false);group.name='Print Exchange / upper reading room';world.add(group);
 function prop(color,x,y,z,w,h,d,material){const m=box(group,color,x,y,z,w,h,d);if(material)m.material=material;return m;}
 // Shelves stop short of the middle walking lane and both real controls.
 for(const x of [-21.7,-19.5]){
  prop(0x6e5744,x,11.85,-6.82,1.7,2.1,.25);
  for(const y of [11.1,11.65,12.2,12.75]){prop(0x987550,x,y,-6.65,1.72,.07,.42);for(let i=0;i<5;i++)prop(0xe6cca0,x-.62+i*.3,y+.19,-6.5,.2,.31,.16,materials.paper);}
 }
 prop(0x7c6449,-21.65,11.48,-3.52,1.55,.14,.65);
 for(const x of [-22.15,-21.15])prop(0x594a3a,x,11.14,-3.52,.09,.68,.5);
 prop(0xe6cca0,-21.5,11.6,-3.6,.9,.05,.4,materials.paper);
 prop(0x46878d,-19.1,11.55,-6.5,.7,1.3,.38,materials.teal);
 const status=prop(0xe7ad57,-19.1,11.9,-6.28,.27,.18,.045);status.material=status.material.clone();
 prop(0xe7ad57,-19.1,11.45,-6.23,.17,.17,.1,materials.signal);
 label('UPPER ARCHIVE / READING ROOM',-20.2,13.25,-7,4.6,.44,'#384e58','#f2dbab',group);
 label('ISOLATE CROSSFEED',-19.1,12.5,-6.4,2.1,.28,'#304c59','#f2dbab',group);
 label('ORIGINAL SERVICE LOG',-21.5,12.15,-3.45,2.4,.3,'#304c59','#f2dbab',group);
 return {update(s){status.material.color.setHex(archiveIsolated(s)?0x70d5a1:0xe7ad57);},inspect:()=>({sharedGeometry:true,location:[-20.15,10.8,-5.05],propsOnly:true})};
}
