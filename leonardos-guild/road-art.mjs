import * as T from './vendor/three.module.js';
import {Batch,label} from './art-primitives.mjs';
import {ROAD_NODES,inRoadTown} from './road-core.mjs';
export function createRoadArt({root,m,heightAt}){
 const group=new T.Group();group.name='Lantern road civic signs';root.add(group);const wood=new Batch();
 for(const n of ROAD_NODES){const side=n.x<0?-1:1,x=n.id==='gate'?4:n.x+side*1.8,z=n.z,y=heightAt(x,z);
  wood.box(x,y+.8,z,.12,1.6,.12,'#735438');wood.box(x,y+1.7,z,1.9,.78,.16,'#40534b');
  label(group,n.sign,x,y+1.7,z-.10,1.8,.7,Math.PI,'#243d39','#ffefd0');
  label(group,n.sign,x,y+1.7,z+.10,1.8,.7,0,'#243d39','#ffefd0');
 }
 wood.finish(group,m.trim,'Shared civic sign posts');
 const y=heightAt(4,-17),material=new T.MeshStandardMaterial({color:'#687379',emissive:'#000000',roughness:.4}),lamp=new T.Mesh(new T.OctahedronGeometry(.28),material);lamp.position.set(4,y+2.5,-17);group.add(lamp);
 const plaque=label(group,'ROAD SIGNAL\nRESTORED',4,y+1.0,-17-.12,1.8,.4,Math.PI,'#24564f','#ffefd0');plaque.visible=false;
 const reading=new T.Group();reading.name='Restored Map House reading instrument';group.add(reading);const bx=-13,bz=61,by=heightAt(bx,bz),instrument=new Batch();
 instrument.box(bx,by+.55,bz,1.1,1.1,.85,'#635d49');instrument.rod([bx,by+1.1,bz],[bx,by+1.8,bz],.07,'#c7a867');instrument.box(bx,by+1.1,bz,.85,.07,.65,'#e6d39c');instrument.finish(reading,m.trim,'Optical reading stand');
 const ring=new T.Mesh(new T.TorusGeometry(.32,.055,6,16),new T.MeshStandardMaterial({color:'#94dbe0'}));ring.position.set(bx,by+1.7,bz);ring.rotation.x=-Math.PI/3;reading.add(ring);label(reading,'READING INSTRUMENT\nRESTORED BY YOUR SURVEY',bx,by+2.6,bz,3,.6,0,'#244c48','#fff4d4');reading.visible=false;
 let lit=false;
 return {update(s){group.visible=inRoadTown(s);reading.visible=s.vault?.reported===true;const next=s.road?.stage>=5;if(lit!==next){lit=next;material.color.set(lit?'#f5d28a':'#687379');material.emissive.set(lit?'#9c6e28':'#000000');plaque.visible=lit;}},inspect:()=>({readingInstrument:reading.visible,lit,sites:ROAD_NODES.length,visible:group.visible})};
}
