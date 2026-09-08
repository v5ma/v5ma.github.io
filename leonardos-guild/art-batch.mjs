/* Normalize glTF color accessors for static batching. Some CC0 meshes use
 * normalized Uint16 RGBA, others have no vertex colors. Preserve all channels
 * as Float32 RGBA; never reinterpret integer values as linear floats. */
import * as T from './vendor/three.module.js';
import {mergeGeometries,mergeVertices} from './vendor/BufferGeometryUtils.js';
export function compatibleGeometry(source,matrix){
 const g=source.index?source.toNonIndexed():source.clone();g.applyMatrix4(matrix);
 for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);
 const n=g.attributes.position.count,old=g.attributes.color,a=new Float32Array(n*4).fill(1);
 if(old)for(let i=0;i<n;i++){a[i*4]=old.getX(i);a[i*4+1]=old.getY(i);a[i*4+2]=old.getZ(i);a[i*4+3]=old.itemSize===4?old.getW(i):1;}
 g.setAttribute('color',new T.Float32BufferAttribute(a,4));
 if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
 if(!g.attributes.normal)g.computeVertexNormals();return g;
}
export function batchStatic(group){
 group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),bins=new Map(),meshes=[];
 group.traverse(obj=>{if(!obj.isMesh)return;if(Array.isArray(obj.material))throw Error('Batch expects one material per glTF primitive.');
  const matrix=new T.Matrix4().multiplyMatrices(inverse,obj.matrixWorld),geo=compatibleGeometry(obj.geometry,matrix),key=obj.material.uuid;
  if(!bins.has(key))bins.set(key,{material:obj.material,geometries:[]});bins.get(key).geometries.push(geo);
 });
 try{for(const bin of bins.values()){const flat=mergeGeometries(bin.geometries,false);if(!flat)throw Error('Incompatible static mesh attributes.');const geo=mergeVertices(flat,1e-5);flat.dispose();const mesh=new T.Mesh(geo,bin.material);mesh.castShadow=mesh.receiveShadow=true;meshes.push(mesh);}}
 catch(e){meshes.forEach(m=>m.geometry.dispose());throw e;}
 finally{for(const b of bins.values())b.geometries.forEach(g=>g.dispose());}
 // Commit after ALL material groups validate; never erase a valid source early.
 group.clear();group.add(...meshes);return group;
}
