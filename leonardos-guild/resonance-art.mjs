/* Bounded presentation: a visible sling, twelve pellets, and one vehicle lamp. */
import * as T from './vendor/three.module.js';
import {heightAt} from './model.mjs';
import {doorElevation} from './doors-core.mjs';
export function createResonanceArt({scene,rider}){
 const leather=new T.MeshStandardMaterial({color:'#704c2a',roughness:.85}),brass=new T.MeshStandardMaterial({color:'#c7a357',roughness:.5,metalness:.6});
 const sling=new T.Group();const pouch=new T.Mesh(new T.SphereGeometry(.09,8,6),leather);pouch.scale.set(1,.45,1.4);sling.add(pouch);
 const stringMat=new T.LineBasicMaterial({color:'#e1c08b'}),string=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.07,0,0),new T.Vector3(0,.4,.1),new T.Vector3(.07,0,0)]),stringMat);sling.add(string);rider.root.add(sling);
 const pelletGeo=new T.SphereGeometry(.075,8,5),pelletMat=new T.MeshStandardMaterial({color:'#d7bba0',roughness:.7,emissive:'#766044',emissiveIntensity:.25});
 const pellets=Array.from({length:12},()=>{const m=new T.Mesh(pelletGeo,pelletMat);m.visible=false;scene.add(m);return m;});
 const lamp=new T.Group(),shell=new T.Mesh(new T.CylinderGeometry(.1,.13,.26,8),brass);lamp.add(shell);const glass=new T.Mesh(new T.SphereGeometry(.085,8,6),new T.MeshBasicMaterial({color:'#ffe2a1'}));glass.position.z=.095;lamp.add(glass);scene.add(lamp);
 const light=new T.SpotLight('#ffdf9a',10,19,Math.PI/5,.7,1.5);light.castShadow=false;scene.add(light,light.target);
 let snapshot={tool:'staff',pellets:0,lamp:false,aim:false};
 function update(s){const c=s.resonance;if(!c)return;const y=heightAt(s.x,s.z)+doorElevation(s)+s.lift;
  sling.visible=s.mode==='foot'&&c.tool==='sling';sling.position.set(-.34,1.15,.32);sling.rotation.z=c.aim?-.7:0;sling.rotation.x=s.attackT>0?Math.sin(s.attackT*30):0;
  pellets.forEach((m,i)=>{const p=c.projectiles[i];m.visible=!!p;if(p)m.position.set(p.x,heightAt(p.x,p.z)+doorElevation(s)+1.3,p.z);});
  const visible=s.mode!=='foot'&&c.headlight&&!s.life.inside&&!s.doors.level;lamp.visible=visible;light.visible=visible;
  const fx=Math.sin(s.yaw),fz=Math.cos(s.yaw),distance=s.mode==='bike'?.64:1.8;
  lamp.position.set(s.x+fx*distance,y+1.05,s.z+fz*distance);lamp.rotation.y=s.yaw;light.position.copy(lamp.position);light.target.position.set(s.x+fx*12,y+.35,s.z+fz*12);light.target.updateMatrixWorld();
  if(c.duck){rider.root.position.y-=.22;rider.root.rotation.x=.6;}else if(c.cover){rider.root.position.y-=.17;rider.root.rotation.x=.3;}
  snapshot={tool:c.tool,pellets:c.projectiles.length,lamp:visible,aim:c.aim,duck:c.duck};
 }
 return {update,inspect:()=>({...snapshot})};
}
