/* The ordinary game through a stereo aperture, NOT a six-plane miniature map.
 * Physical XR eye separation stays unscaled. Every scene mutation is restored.
 */
import * as T from './vendor/three.module.js';
import {createPortalOcclusion,blocksPortalFocus} from './portal-occlusion.mjs';
import {PortalMaterials,boxInverse,enterPortal,seesFragment,shellMaterial} from './world-aperture.mjs';
import {normalizeDiorama,shellOpenings,STAGE_METRES} from './diorama-core.mjs';
const UP=new T.Vector3(0,1,0);
export function createWorldPortal(){
 const overlay=new T.Scene(),shell=new T.Group(),world=new T.Group(),materials=new PortalMaterials(),occlusion=createPortalOcclusion();
 overlay.add(shell,new T.HemisphereLight(0xd8e6eb,0x394b42,1.6));shell.name='Rainward character-centered world portal';
 const frameMaterial=new T.MeshBasicMaterial({color:0xbda678,depthTest:false,toneMapped:false});
 const edges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(STAGE_METRES.width,STAGE_METRES.height,STAGE_METRES.depth)),new T.LineBasicMaterial({color:0xbda678,depthTest:false,transparent:true,opacity:.6}));edges.position.y=STAGE_METRES.height/2;edges.renderOrder=110;shell.add(edges);
 const faces={};
 for(const [name,normal,point,rotation,scale]of [
  ['base',[0,-1,0],[0,0,0],[-Math.PI/2,0,0],[1.6,1.2]],['back',[0,0,-1],[0,.36,-.6],[0,0,0],[1.6,.72]],
  ['left',[-1,0,0],[-.8,.36,0],[0,Math.PI/2,0],[1.2,.72]],['right',[1,0,0],[.8,.36,0],[0,Math.PI/2,0],[1.2,.72]],
  ['top',[0,1,0],[0,.72,0],[-Math.PI/2,0,0],[1.6,1.2]],['front',[0,0,1],[0,.36,.6],[0,0,0],[1.6,.72]]]){
  const m=new T.Mesh(new T.PlaneGeometry(...scale),shellMaterial(new T.Vector3(...normal),new T.Vector3(...point),materials.uniforms));m.position.set(...point);m.rotation.set(...rotation);m.renderOrder=100;shell.add(m);faces[name]=m;
 }
 const sky=new T.Mesh(new T.SphereGeometry(500,12,8),new T.MeshBasicMaterial({color:0x819995,side:T.BackSide,depthWrite:false,fog:false,toneMapped:false}));sky.renderOrder=-1000;sky.frustumCulled=false;materials.attach(sky.material);
 let anchor=null,heading=0,config=normalizeDiorama(),centre=new T.Vector3(),eye=new T.Vector3(),enabled=false;
 const display=new T.Matrix4(),inverse=new T.Matrix4();
 function reset(){anchor=null;enabled=false;}
 function update(rig,head,player,yaw,ground,dt,settings){
  config=normalizeDiorama(settings);enabled=config.view.startsWith('diorama');if(!enabled)return;
  eye.copy(head.position);
  if(!anchor){const forward=new T.Vector3(0,0,-1).applyQuaternion(head.orientation);forward.y=0;if(forward.lengthSq()<.001)forward.set(0,0,-1);forward.normalize();heading=Math.atan2(-forward.x,-forward.z);anchor=eye.clone().addScaledVector(forward,1.5);anchor.y=eye.y-.86;}
  centre.set(player.x,ground-(player.swimDepth||0)+.9,player.z);
  const rotation=new T.Quaternion().setFromAxisAngle(UP,heading-yaw),scale=new T.Vector3().setScalar(config.scale),target=anchor.clone().add(new T.Vector3(0,STAGE_METRES.height/2,0));
  const offset=centre.clone().multiplyScalar(config.scale).applyQuaternion(rotation);display.compose(target.sub(offset),rotation,scale);inverse.copy(display).invert();
  rig.position.set(0,0,0);rig.quaternion.identity();rig.scale.set(1,1,1);rig.updateMatrixWorld(true);
  shell.position.copy(anchor);shell.rotation.set(0,heading,0);shell.updateMatrixWorld(true);materials.configure(anchor,heading,STAGE_METRES);
  const openings=shellOpenings(config.shell);faces.top.visible=!openings.topOpen;faces.front.visible=!openings.frontOpen;
 }
 function render(renderer,scene,camera,rig,environmentRoots){
  const lamps=[];scene.traverse(o=>{if(o.isPointLight||o.isSpotLight)lamps.push({light:o,distance:o.distance,intensity:o.intensity});});
  const children=[...scene.children].filter(o=>o!==rig),bg=scene.background,fog=scene.fog,auto=renderer.autoClear,planes=renderer.clippingPlanes,color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
  try{
   for(const item of lamps){if(item.distance>0)item.light.distance=item.distance*config.scale;item.light.intensity=item.intensity*Math.pow(config.scale,item.light.decay||2);}
   scene.add(world);for(const child of children)world.add(child);world.matrixAutoUpdate=false;world.matrix.copy(display);world.matrixWorldNeedsUpdate=true;
   occlusion.collect(environmentRoots);occlusion.configure(anchor.clone().add(new T.Vector3(0,STAGE_METRES.height/2,0)),anchor.y+STAGE_METRES.height/2-.9*config.scale,config.scale);materials.collect(world);sky.position.copy(centre);sky.material.color.copy(bg?.isColor?bg:color);world.add(sky);
   overlay.add(rig);scene.background=null;scene.fog=null;renderer.clippingPlanes=[];renderer.setClearColor(0x101c24,config.view==='diorama-ar'?0:1);
   occlusion.active=true;materials.active=true;world.updateMatrixWorld(true);renderer.autoClear=true;renderer.render(scene,camera);
   occlusion.active=false;materials.active=false;renderer.autoClear=false;renderer.render(overlay,camera);
  }finally{
   for(const item of lamps){item.light.distance=item.distance;item.light.intensity=item.intensity;}
   occlusion.active=false;materials.active=false;world.remove(sky);for(const child of children)scene.add(child);scene.remove(world);scene.add(rig);
   world.matrix.identity();renderer.autoClear=auto;renderer.clippingPlanes=planes;renderer.setClearColor(color,alpha);scene.background=bg;scene.fog=fog;scene.updateMatrixWorld(true);
  }
 }
 function gameRay(ray){if(!anchor||!ray)return null;const entered=enterPortal(ray,boxInverse(anchor,heading),STAGE_METRES);if(!entered)return null;return {origin:entered.origin.applyMatrix4(inverse),direction:entered.direction.transformDirection(inverse)};}
 function contains(point,environment=false){if(!anchor)return false;const shown=new T.Vector3(point.x,point.y,point.z).applyMatrix4(display);if(!seesFragment(eye,shown,boxInverse(anchor,heading),STAGE_METRES))return false;return !environment||!blocksPortalFocus(eye,shown,anchor.clone().add(new T.Vector3(0,STAGE_METRES.height/2,0)),anchor.y+STAGE_METRES.height/2-.75*config.scale,Math.max(.10,3.5*config.scale));}
 return {reset,update,render,gameRay,contains,heading:()=>heading,displayPoint(point){return new T.Vector3(point.x,point.y,point.z).applyMatrix4(display);},stats:()=>({enabled,portal:true,scale:config.scale,shell:config.shell,...shellOpenings(config.shell),physicalDimensions:{...STAGE_METRES},centre:{x:centre.x,y:centre.y,z:centre.z},anchor:anchor?{x:anchor.x,y:anchor.y,z:anchor.z}:null,heading,follow:true,rigScale:1,extraRenderTargets:0,beyondBackVisible:true,automaticEyeFacingTransparency:true,foregroundCutaway:true,worldMatrix:display.toArray(),closedFaces:Object.entries(faces).filter(([,m])=>m.visible).map(([k])=>k)}),dispose(){materials.dispose();occlusion.dispose();overlay.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});sky.geometry.dispose();sky.material.dispose();frameMaterial.dispose();}};
}
