/* Fixed-detail spatial batching: never lowers geometry quality.
 * Whole triangles keep every attribute and are assigned once to a visibility
 * chunk. Frustum and shadow-camera culling can then reject distant scenery.
 */
'use strict';
globalThis.CloudDepthChunks = (() => {
  function split(T,geometry,size=640) {
    const source=geometry.index?geometry.toNonIndexed():geometry;
    const position=source.getAttribute('position');
    if(!position||position.count%3)throw new Error('Expected complete triangles');
    const attrs=Object.entries(source.attributes).filter(([,a])=>a.count===position.count);
    const bins=new Map();
    for(let i=0;i<position.count;i+=3){
      const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3;
      const z=(position.getZ(i)+position.getZ(i+1)+position.getZ(i+2))/3;
      const key=Math.floor(x/size)+':'+Math.floor(z/800);
      if(!bins.has(key))bins.set(key,[]);bins.get(key).push(i);
    }
    const result=[];
    for(const [key,indices]of bins){
      const g=new T.BufferGeometry();
      for(const [name,a]of attrs){
        const data=new Float32Array(indices.length*3*a.itemSize);let cursor=0;
        for(const first of indices)for(let v=first;v<first+3;v++)for(let k=0;k<a.itemSize;k++)data[cursor++]=a.array[v*a.itemSize+k];
        g.setAttribute(name,new T.Float32BufferAttribute(data,a.itemSize,a.normalized));
      }
      g.computeBoundingSphere();result.push({key,geometry:g});
    }
    if(source!==geometry)source.dispose();
    return result;
  }
  function apply(m,root){
    const candidates=root.children.filter(o=>o.geometry&&!o.geometry.index&&o.count===1&&o.geometry.getAttribute('position')?.count>=15000&&!o.material?.transparent);
    const stats={batches:0,chunks:0,inputVertices:0,outputVertices:0};
    for(const old of candidates){
      const entries=split(m.THREE,old.geometry);
      if(entries.length<2){entries.forEach(e=>e.geometry.dispose());continue;}
      stats.batches++;stats.inputVertices+=old.geometry.getAttribute('position').count;
      for(const {key,geometry}of entries){
        const mesh=m.makeSingle(geometry,old.material);
        mesh.name=old.name+' / spatial '+key;
        mesh.position.copy(old.position);mesh.rotation.copy(old.rotation);mesh.scale.copy(old.scale);
        mesh.renderOrder=old.renderOrder;mesh.castShadow=old.castShadow;mesh.receiveShadow=old.receiveShadow;
        mesh.frustumCulled=true;mesh.computeBoundingSphere();root.add(mesh);
        stats.chunks++;stats.outputVertices+=geometry.getAttribute('position').count;
      }
      root.remove(old);old.geometry.dispose();
    }
    if(stats.inputVertices!==stats.outputVertices)throw new Error('Spatial partition changed geometry');
    return stats;
  }
  return Object.freeze({split,apply});
})();
