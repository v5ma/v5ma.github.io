/* Preserve original meshes verbatim; only close interaction readouts are capped. */
export * from './art-primitives.mjs';
import {label as primitiveLabel} from './art-primitives.mjs';
import {Vector3} from './vendor/three.module.js';
import {readoutScale} from './label-sizing.mjs';
export function label(parent,text,x,y,z,width,height,angle=0,bg='#174b4f',fg='#fff4d5'){
 const mesh=primitiveLabel(parent,text,x,y,z,width,height,angle,bg,fg);
 if(width<=4&&height<=1.4){
  const viewPosition=new Vector3(),parentScale=new Vector3();
  mesh.onBeforeRender=(renderer,_scene,camera)=>{
   mesh.getWorldPosition(viewPosition).applyMatrix4(camera.matrixWorldInverse);
   parent.getWorldScale(parentScale);
   const factor=readoutScale({depth:Math.max(.001,-viewPosition.z),width,height,parentScale:Math.abs(parentScale.y),viewportHeight:renderer.domElement.clientHeight||1,fov:camera.fov||58});
   mesh.scale.setScalar(factor);mesh.updateMatrixWorld(true);
  };
 }
 return mesh;
}
