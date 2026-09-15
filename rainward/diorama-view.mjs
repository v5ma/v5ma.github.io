/* A clipped window into the ACTUAL game scene. No render-to-texture theatre,
 * duplicated simulation, movement authority or passthrough-camera access. */
import * as T from './vendor/three.module.js';
import {enableDioramaClipping} from './diorama-shaders.mjs';
import {normalizeDiorama,displayBounds,shellOpenings,followCentre,STAGE_METRES} from './diorama-core.mjs';
const UP=new T.Vector3(0,1,0);
export function createDioramaView(){
 const overlay=new T.Scene(),shell=new T.Group();shell.name='Rainward miniature display shell';overlay.add(shell);
 const material=new T.MeshBasicMaterial({color:0x263a3d,side:T.DoubleSide,toneMapped:false});
 const trimMaterial=new T.MeshBasicMaterial({color:0xdbc394,toneMapped:false});
 const geometry=new T.BoxGeometry(1,1,1),walls={};
 for(const name of ['base','back','left','right','top','front']){const m=new T.Mesh(geometry,material);m.name='Diorama '+name;shell.add(m);walls[name]=m;}
 const edges=[];for(let i=0;i<4;i++){const m=new T.Mesh(geometry,trimMaterial);shell.add(m);edges.push(m);}
 const marker=new T.Mesh(new T.RingGeometry(.52,.68,24),new T.MeshBasicMaterial({color:0xffdc7e,side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.name='Controlled survivor marker';overlay.add(marker);
 let centre=null,anchor=null,floor=0,config=normalizeDiorama(),dimensions=displayBounds(),active=false,heading=0,preparedScene=null,customShaderCount=0;
 const planes=Array.from({length:6},()=>new T.Plane()),matrix=new T.Matrix4();
 function reset(){centre=null;anchor=null;active=false;}
 function place(head,player,yaw,ground){const direction=new T.Vector3(0,0,-1).applyQuaternion(head.orientation);direction.y=0;if(direction.lengthSq()<.01)direction.set(0,0,-1);direction.normalize();
  anchor={x:head.position.x+direction.x*1.50,y:head.position.y-.86,z:head.position.z+direction.z*1.50};centre={x:player.x,z:player.z};floor=ground-4;heading=yaw;
 }
 function update(rig,head,player,yaw,ground,dt,settings){
  config=normalizeDiorama(settings);active=config.view!=='first-person';if(!active)return;dimensions=displayBounds(config.scale);
  if(!anchor)place(head,player,yaw,ground);
  centre=followCentre(centre,player,yaw,dimensions.width,dimensions.depth,dt,config.follow);
  // A table stays in the room. Player movement only scrolls the content within it.
  // Leaning/walking around it does not translate the controlled character.
  const factor=1/config.scale,offset=new T.Vector3(anchor.x,anchor.y,anchor.z).applyAxisAngle(UP,yaw).multiplyScalar(factor);
  rig.scale.setScalar(factor);rig.rotation.y=yaw;rig.position.set(centre.x-offset.x,floor-offset.y,centre.z-offset.z);rig.updateMatrixWorld(true);
  shell.position.set(centre.x,floor,centre.z);shell.rotation.y=yaw;const {width:w,depth:d,height:h}=dimensions,t=.016/config.scale;
  function box(name,x,y,z,w,h,d,visible=true){const m=walls[name];m.position.set(x,y,z);m.scale.set(w,h,d);m.visible=visible;}
  const openings=shellOpenings(config.shell);box('base',0,-t*.5,0,w+t,t,d+t);box('back',0,h*.5,-d*.5,w+t,h,t);box('left',-w*.5,h*.5,0,t,h,d);box('right',w*.5,h*.5,0,t,h,d);box('top',0,h+t*.5,0,w+t,t,d+t,!openings.topOpen);box('front',0,h*.5,d*.5,w+t,h,t,!openings.frontOpen);
  for(let i=0;i<4;i++){const along=i<2;edges[i].position.set(along?0:(i===2?-w/2:w/2),h,along?(i===0?-d/2:d/2):0);edges[i].scale.set(along?w:t,t,along?t:d);}
  shell.updateMatrixWorld(true);matrix.copy(shell.matrixWorld);
  const normals=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],constants=[w/2,w/2,0,h,d/2,d/2];
  for(let i=0;i<6;i++)planes[i].set(new T.Vector3(...normals[i]),constants[i]).applyMatrix4(matrix);
  marker.position.set(player.x,ground+.04,player.z);marker.visible=player.waterMode!=='swim';heading=yaw;
 }
 function render(renderer,scene,camera,rig){
  if(preparedScene!==scene){customShaderCount=enableDioramaClipping(scene);preparedScene=scene;}
  // World-only clipping; the shell/hands/UI are a second depth-preserving pass.
  const old={background:scene.background,fog:scene.fog,autoClear:renderer.autoClear,planes:renderer.clippingPlanes,alpha:renderer.getClearAlpha(),color:renderer.getClearColor(new T.Color()).clone()};
  overlay.add(rig);scene.background=null;scene.fog=null;renderer.clippingPlanes=planes;renderer.setClearColor(0x101c24,config.view==='diorama-ar'?0:1);
  try{renderer.autoClear=true;renderer.render(scene,camera);renderer.autoClear=false;renderer.clippingPlanes=[];renderer.render(overlay,camera);}
  finally{renderer.autoClear=old.autoClear;renderer.clippingPlanes=old.planes;renderer.setClearColor(old.color,old.alpha);scene.background=old.background;scene.fog=old.fog;scene.add(rig);}
 }
 function localPoint(world){return new T.Vector3(world.x,world.y,world.z).applyMatrix4(new T.Matrix4().copy(matrix).invert());}
 return {reset,place,update,render,planes,overlay,stats:()=>({enabled:active,scale:config.scale,shell:config.shell,...shellOpenings(config.shell),dimensions:{...dimensions},physicalDimensions:{...STAGE_METRES},centre:centre?{...centre}:null,anchor:anchor?{...anchor}:null,floor,heading,follow:config.follow,extraRenderTargets:0,customShaderCount,closedFaces:Object.entries(walls).filter(([,v])=>v.visible).map(([k])=>k)}),contains(point){const p=localPoint(point);return Math.abs(p.x)<=dimensions.width/2&&Math.abs(p.z)<=dimensions.depth/2&&p.y>=0&&p.y<=dimensions.height;},dispose(){shell.removeFromParent();marker.removeFromParent();geometry.dispose();material.dispose();trimMaterial.dispose();marker.geometry.dispose();marker.material.dispose();}};
}
