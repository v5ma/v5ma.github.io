/* Static instance visibility is tested per object, not by a world-spanning
 * batch bound. Cached transformed bounds retain source geometry and matrices.
 * Shadow casters are preserved whenever a shadow pass is actually enabled. */
import * as T from './vendor/three.module.js';
const boundsCache=new WeakMap();
function bounds(mesh,matrices){
 let cached=boundsCache.get(matrices);
 if(!cached){
  if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
  if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
  cached=matrices.map(m=>({sphere:mesh.geometry.boundingSphere.clone().applyMatrix4(m),box:mesh.geometry.boundingBox.clone().applyMatrix4(m)}));
  boundsCache.set(matrices,cached);
 }
 return cached;
}
export function compactVisibleInstances(mesh,matrices,frustum,shadowsEnabled=true){
 const volumes=bounds(mesh,matrices);let count=0;
 for(let i=0;i<matrices.length;i++){
  if(!(mesh.castShadow&&shadowsEnabled)&&(!frustum.intersectsSphere(volumes[i].sphere)||!frustum.intersectsBox(volumes[i].box)))continue;
  mesh.setMatrixAt(count++,matrices[i]);
 }
 mesh.count=count;mesh.instanceMatrix.needsUpdate=true;return count;
}
export function createStaticCulling(scene){
 const groups=[],frustum=new T.Frustum(),projection=new T.Matrix4();
 scene.traverse(mesh=>{if(!mesh.isInstancedMesh||mesh.userData.scannedVisual||mesh.userData.scanBackdrop)return;
  const matrices=[];for(let i=0;i<mesh.count;i++){const m=new T.Matrix4();mesh.getMatrixAt(i,m);matrices.push(m);}
  bounds(mesh,matrices);groups.push({mesh,matrices});
 });
 let submitted=0;
 return {update(camera,shadowsEnabled){
  projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);submitted=0;
  for(const {mesh,matrices}of groups){if(!mesh.visible)continue;submitted+=compactVisibleInstances(mesh,matrices,frustum,shadowsEnabled);}
 },restore(){for(const {mesh,matrices}of groups){matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.count=matrices.length;mesh.instanceMatrix.needsUpdate=true;}},stats(){return {batches:groups.length,submitted,authored:groups.reduce((n,g)=>n+g.matrices.length,0)};}};
}
