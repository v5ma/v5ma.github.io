/* Close furniture cutaways complement solid-wall camera collision.
 * Individual bookcases are tagged by the existing art builders. Their static
 * bounds are cached, and only obstructing furniture receives private materials.
 * No shared source material, player collision or saved state is modified. */
import * as T from './vendor/three.module.js';
import {segmentBox} from './camera-safety.mjs';
export function createCameraOcclusion(scene){
 let records=[],revision=null,last={tagged:0,faded:0,names:[]};
 const sourceForClone=new WeakMap(),known=new WeakMap();
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function refresh(value){
  if(value===revision)return;revision=value;scene.updateMatrixWorld(true);const next=[];
  scene.traverse(o=>{if(!o.userData.cameraOccluder)return;let rec=known.get(o);if(!rec){const meshes=[];o.traverse(m=>{if(m.isMesh&&!Array.isArray(m.material))meshes.push({mesh:m,copies:new Map()});});rec={object:o,box:new T.Box3().setFromObject(o).expandByScalar(.07),meshes,opacity:1};known.set(o,rec);}next.push(rec);});records=next;
 }
 function update(camera,anchor,dt=0,value='initial'){
  refresh(value);const names=[];
  for(const r of records){
   const near=r.box.distanceToPoint(camera)<7||r.box.distanceToPoint(anchor)<7;
   const block=near&&visible(r.object)&&!!segmentBox(camera,anchor,{min:r.box.min,max:r.box.max});
   // Pull transparency in immediately if the camera enters a shelf. Fade it
   // back only after the view clears; an inside-box case has no ray surface hit.
   r.opacity=block?.10:Math.min(1,r.opacity+(1-r.opacity)*(1-Math.exp(-Math.max(0,Math.min(.1,dt))*12)));
   if(r.opacity>.995)r.opacity=1;if(r.opacity<1)names.push(r.object.name);
   for(const {mesh,copies} of r.meshes){const source=sourceForClone.get(mesh.material)||mesh.material;
    if(r.opacity===1){mesh.material=source;continue;}
    let copy=copies.get(source);if(!copy){copy=source.clone();copy.transparent=true;copy.depthWrite=false;sourceForClone.set(copy,source);copies.set(source,copy);}copy.opacity=r.opacity;mesh.material=copy;
   }
  }
  last={tagged:records.length,faded:names.length,names};return {...last,names:[...names]};
 }
 return {update,inspect:()=>({...last,names:[...last.names]})};
}
