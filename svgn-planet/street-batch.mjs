/* Render optimization only: bake static architecture by material, instance
 * repeated nature geometry, and preserve the source vertices and placement. */
import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
export function batchStreetPatch(group){
 group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),solid=new Map(),nature=new Map();
 group.traverse(o=>{
  if(!o.isMesh)return;
  if(Array.isArray(o.material))throw Error('Curated art expects one material per primitive');
  const matrix=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
  if(o.userData.sharedNature){
   const key=o.geometry.uuid+o.material.uuid;
   if(!nature.has(key))nature.set(key,{geometry:o.geometry,material:o.material,matrices:[]});
   nature.get(key).matrices.push(matrix);return;
  }
  let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(matrix);
  if(!g.attributes.normal)g.computeVertexNormals();
  for(const name of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(name))g.deleteAttribute(name);
  const count=g.attributes.position.count;
  if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(count*2),2));
  if(o.material.vertexColors){
   const source=g.attributes.color,values=new Float32Array(count*3);
   for(let i=0;i<count;i++){values[i*3]=source?source.getX(i):1;values[i*3+1]=source?source.getY(i):1;values[i*3+2]=source?source.getZ(i):1;}
   g.setAttribute('color',new T.Float32BufferAttribute(values,3));
  }else g.deleteAttribute('color');
  if(matrix.determinant()<0){for(const attr of Object.values(g.attributes)){const a=attr.array,n=attr.itemSize;for(let i=0;i<count;i+=3)for(let j=0;j<n;j++){const x=(i+1)*n+j,y=(i+2)*n+j,tmp=a[x];a[x]=a[y];a[y]=tmp;}}}
  const key=o.material.uuid;if(!solid.has(key))solid.set(key,{material:o.material,geometries:[]});solid.get(key).geometries.push(g);
 });
 group.clear();
 for(const {material,geometries} of solid.values()){
  const g=mergeGeometries(geometries,false);if(!g)throw Error('Static art attributes do not match');
  g.computeBoundingSphere();const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;group.add(m);
  for(const temporary of geometries)temporary.dispose();
 }
 for(const {geometry,material,matrices}of nature.values()){
  const m=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((x,i)=>m.setMatrixAt(i,x));m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.castShadow=m.receiveShadow=true;group.add(m);
 }
 return {solidDraws:solid.size,natureDraws:nature.size};
}
