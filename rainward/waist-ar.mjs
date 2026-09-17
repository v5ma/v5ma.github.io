import * as T from './vendor/three.module.js';
import {enableDioramaClipping} from './diorama-shaders.mjs';
/* Visual cutaway only. Characters and hands remain full size; collisions stay. */
export function renderWaistAR(renderer,scene,camera,environment,waist){
 enableDioramaClipping(scene);
 const all=[...scene.children],saved=all.map(o=>[o,o.visible]),old={background:scene.background,fog:scene.fog,auto:renderer.autoClear,planes:renderer.clippingPlanes,color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha()};
 const protectedNodes=all.filter(o=>!environment.has(o)&&!o.isCamera&&!o.isLight);
 try{
  scene.background=null;scene.fog=null;renderer.setClearColor(0,0);renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),waist)];renderer.autoClear=true;
  for(const o of protectedNodes)o.visible=false;renderer.render(scene,camera);
  for(const [o,visible]of saved)o.visible=visible;for(const o of environment)if(!o.isLight&&!o.isCamera)o.visible=false;
  renderer.clippingPlanes=[];renderer.autoClear=false;renderer.render(scene,camera);
 }finally{for(const [o,v]of saved)o.visible=v;scene.background=old.background;scene.fog=old.fog;renderer.autoClear=old.auto;renderer.clippingPlanes=old.planes;renderer.setClearColor(old.color,old.alpha);}
}
