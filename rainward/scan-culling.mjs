/* Instance-level culling: an instanced batch's world-wide bounding box is too
 * coarse for scattered foliage and cliffs. Keep source meshes/UVs intact and
 * submit only instances whose conservative sphere intersects the camera. */
import * as T from './vendor/three.module.js';
const sphere=new T.Sphere();
export function compactVisibleInstances(mesh,matrices,frustum){
 if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
 let count=0;
 for(const matrix of matrices){sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);if(!mesh.castShadow&&!frustum.intersectsSphere(sphere))continue;mesh.setMatrixAt(count++,matrix);}
 mesh.count=count;mesh.instanceMatrix.needsUpdate=true;return count;
}
