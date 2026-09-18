import * as T from './vendor/three.module.js';
import {enableDioramaClipping} from './diorama-shaders.mjs';
/* One compositor draw: only environment materials get waist-height planes.
 * No hidden rig, second XR update or intermediate depth resolve is required. */
export function renderWaistAR(renderer,scene,camera,environment,waist){
 const original=new Map(),plane=new T.Plane(new T.Vector3(0,-1,0),waist),old={background:scene.background,fog:scene.fog,local:renderer.localClippingEnabled,planes:renderer.clippingPlanes,color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha()};
 try{
  for(const root of environment||[]){enableDioramaClipping(root);root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){if(original.has(m))continue;original.set(m,m.clippingPlanes);m.clippingPlanes=[...(m.clippingPlanes||[]),plane];}});}
  renderer.localClippingEnabled=true;renderer.clippingPlanes=[];scene.background=null;scene.fog=null;renderer.setClearColor(0,0);renderer.render(scene,camera);
 }finally{for(const [m,planes]of original)m.clippingPlanes=planes;renderer.localClippingEnabled=old.local;renderer.clippingPlanes=old.planes;scene.background=old.background;scene.fog=old.fog;renderer.setClearColor(old.color,old.alpha);}
}
