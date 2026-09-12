/* Per-instance bones, shared read-only geometry/material resources. No game state. */
import * as T from './vendor/three.module.js';
export function cloneRig(source){
 const copy=source.clone(true),map=new Map();
 function pair(a,b){map.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source,copy);
 source.traverse(o=>{if(!o.isSkinnedMesh)return;const n=map.get(o),skeleton=o.skeleton.clone();skeleton.bones=o.skeleton.bones.map(b=>{const result=map.get(b);if(!result)throw Error('Character bones must be inside the cloned root');return result;});n.bind(skeleton,o.bindMatrix.clone());n.bindMode=o.bindMode;n.frustumCulled=false;});
 return copy;
}
export function prepareRig(gltf){
 const source=gltf.scene;const neutral=gltf.animations?.find(c=>c.name==='Idle_Neutral');if(neutral){const mixer=new T.AnimationMixer(source);mixer.clipAction(neutral).play();mixer.update(0);source.updateMatrixWorld(true);source.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.boundingBox=null;}});}
 source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),height=box.max.y-box.min.y;
 if(!Number.isFinite(height)||height<=0||!gltf.animations?.length)throw Error('Character requires finite geometry and animation clips');
 let skinCount=0,boneCount=0;source.traverse(o=>{if(o.isSkinnedMesh)skinCount++;if(o.isBone)boneCount++;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 if(!skinCount||!boneCount)throw Error('Character requires a skinned humanoid skeleton');
 return {source,clips:gltf.animations,height,feet:box.min.y,centerX:(box.max.x+box.min.x)/2,centerZ:(box.max.z+box.min.z)/2,skinCount,boneCount};
}
export function disposeInstance(root){const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const skeleton of skeletons)skeleton.dispose();root.removeFromParent();}
export function disposeRig(rig){const geometries=new Set(),materials=new Set(),textures=new Set();rig.source.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});disposeInstance(rig.source);for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
