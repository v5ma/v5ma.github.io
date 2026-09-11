import * as T from './vendor/three.module.js';
import {CURRENT,heightAt} from './world.mjs';
/* Small interaction props remain offset from the authored standing position. */
export function createTaskArt(scene,A){
 const stations=[];
 for(const t of CURRENT.tasks||[]){const group=new T.Group();group.position.set(t.x,heightAt(t.x,t.z),t.z-.7);const kind=t.kind;
  function part(shape,scale,color,at,type='metal'){const m=A.mesh(shape,scale,color,type);m.position.set(...at);group.add(m);return m;}
  if(kind==='repair'||kind==='signal'){
   part('box',[.69,.84,.34],0x647b6d,[0,.64,0]);part('box',[.59,.30,.03],0x243e3a,[0,.88,.185]);part('box',[.39,.035,.045],0xb6c29b,[0,.91,.21]);
   for(const x of[-.23,.23])part('cyl',[.045,.038,.045],0xc0b391,[x,.69,.22]);
   if(kind==='signal'){part('cyl',[.022,2,.022],0x82908c,[.23,1.92,0]);part('box',[.82,.035,.035],0x8c9691,[.23,2.74,0]);}
  }else if(kind==='rescue'){
   part('cyl',[.038,1.7,.038],0x989981,[0,.85,0]);part('box',[.92,.57,.035],0x758968,[0,1.45,0]);part('box',[.51,.045,.043],0xd9d8b7,[0,1.45,.025]);
  }else{
   part('box',[.72,.66,.44],0x666c54,[0,.34,0],'wood');part('box',[.72,.08,.48],0xb9b397,[0,.72,0],'wood');part('box',[.42,.042,.30],0xd0c7a5,[0,.78,.02],'cloth');part('box',[.045,.045,.31],0x665d48,[-.12,.785,.02],'cloth');
  }
  const material=new T.MeshStandardMaterial({color:0xc49f60,emissive:0xaa8048,emissiveIntensity:.6});const lamp=new T.Mesh(new T.SphereGeometry(.05,10,8),material);lamp.position.set(.21,1.15,.19);group.add(lamp);scene.add(group);stations.push({t,lamp});
  A.label(t.required?'FIELD TASK / REQUIRED':'FIELD TASK / OPTIONAL',t.x,heightAt(t.x,t.z)+1.95,t.z-.67,2.8,.43,'#435b4b',t.required?'#efdab0':'#becbaf');
 }
 return {update(s){for(const {t,lamp}of stations){const done=s.completedTasks.includes(t.id);lamp.material.color.setHex(done?0x7bad7a:0xc49f60);lamp.material.emissive.setHex(done?0x335c39:0x80683f);}},count:stations.length};
}
