/* Continuous, world-scaled terrain. Vertex elevation is the movement surface,
 * so long slopes no longer render as stretched box textures or hovering steps. */
import * as T from './vendor/three.module.js';
import {heightAt} from './world.mjs';
export function buildTerrain(scene,A){
 function sheet(width,color,tile,yOffset){
  const geometry=new T.PlaneGeometry(width,136,Math.max(2,Math.ceil(width/2)),136);geometry.rotateX(-Math.PI/2);geometry.translate(0,0,-12);
  const position=geometry.getAttribute('position');for(let i=0;i<position.count;i++)position.setY(i,heightAt(position.getX(i),position.getZ(i))+yOffset);position.needsUpdate=true;geometry.computeVertexNormals();
  const base=A.mat(color,'stone'),material=base.clone();material.color.setHex(color);material.roughness=.86;
  if(base.map){material.map=base.map.clone();material.map.repeat.set(width/tile,136/tile);material.map.needsUpdate=true;}
  if(base.bumpMap){material.bumpMap=base.bumpMap.clone();material.bumpMap.repeat.set(width/tile,136/tile);material.bumpMap.needsUpdate=true;material.bumpScale=.035;}
  const mesh=new T.Mesh(geometry,material);mesh.name='Continuous conservatory ground';mesh.receiveShadow=true;scene.add(mesh);return mesh;
 }
 const ground=sheet(104,0x78806b,3,0),walkway=sheet(13,0xaaa58c,2.4,.025);
 for(let z=-76;z<52;z+=2)for(const x of[-8,8])A.add('box',x,heightAt(x,z)+.06,z,1.1,.12,1.94,0xb9af8a,'stone');
 return [ground,walkway];
}
