import * as T from './vendor/three.module.js';
import {PortalMaterials,createPortalFrame} from './lantern/portal.mjs';
import {presentationMatrix,modeInfo} from './spatial-modes.mjs';
import {point} from './model.mjs';
export function spatialView(view,kind){
 const scene=view.scene,camera=view.camera,world=new T.Group();world.name='Unified '+kind+' scene geometry';
 // All world lights, geometry, sky and active actors get the same coordinate transform.
 // UI and the XR camera remain outside this group in physical reference space.
 for(const child of [...scene.children]){if(child.userData.portalPresentation){child.removeFromParent();continue;}if(child!==camera&&child!==view.rig)world.add(child);}
 if(view.rig){view.rig.remove(camera);view.rig.removeFromParent();}
 scene.add(world,camera);camera.up.set(0,1,0);
 const materials=new PortalMaterials(),frame=createPortalFrame(scene,materials);
 const originalBG=scene.background,originalFog=scene.fog;let centerError=0,pose=null,mode=null,shown=false,opening='both',lastCollect=0;
 function restore(){world.matrixAutoUpdate=true;world.position.set(0,0,0);world.rotation.set(0,0,0);world.scale.setScalar(1);world.updateMatrixWorld(true);materials.active=false;frame.group.visible=false;world.visible=true;if(kind==='ward')view.stopPortal();if(view.courier)view.courier.g.visible=true;if(view.hero)view.hero.g.visible=true;camera.up.set(0,1,0);}
 function present(state,id,origin,heading,settings,yaw=0){
  mode=modeInfo(id);shown=true;let feet,basis;
  if(kind==='city'){
   const b=view.movementBasis(state),n=new T.Vector3(...state.n),f=new T.Vector3(...b.forward),right=new T.Vector3(...b.right);
   feet=new T.Vector3(...point(state.n,state.lift+.1));basis=new T.Matrix4().makeBasis(right,n,f.negate());
  }else{feet=new T.Vector3(state.x,state.y,state.z);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw);basis=new T.Matrix4().makeRotationFromQuaternion(q);view.stopPortal();}
  pose=presentationMatrix({feet,basis,origin,heading,settings,mode:id});
  world.matrixAutoUpdate=false;world.matrix.copy(pose.matrix);world.matrixWorldNeedsUpdate=true;world.updateMatrixWorld(true);centerError=feet.clone().applyMatrix4(world.matrix).distanceTo(pose.target);
  camera.position.set(0,0,0);camera.rotation.set(0,0,0);camera.up.set(0,1,0);camera.near=.025;camera.far=4000;camera.updateProjectionMatrix();
  const hero=view.courier||view.hero;if(hero)hero.g.visible=!mode.first;
  if(mode.portal){
   // Newly streamed city meshes must receive the aperture shader too.
   if(performance.now()-lastCollect>300){materials.collect(world);lastCollect=performance.now();}
   materials.configure(pose.anchor,heading+settings.rotation,pose.portalSize);materials.active=true;
   frame.group.visible=true;frame.update(pose.anchor,heading+settings.rotation,pose.portalSize,opening);
  }else{materials.active=false;frame.group.visible=false;}
  scene.background=mode.ar?null:mode.portal?new T.Color(0x152a34):originalBG;
  scene.fog=null;view.renderer.setClearColor(mode.portal?0x152a34:0xabc8cb,mode.ar?0:1);
  if(shown){ // The original screen-space sky is neither per-eye geometry nor passthrough.
   world.traverse(o=>{if(o.name&&/sky/i.test(o.name))o.visible=false;});
  }
  if(kind==='ward'&&!mode.first){const cam=view.renderer.xr.getCamera();const eye=new T.Vector3().setFromMatrixPosition(cam.matrixWorld);view.cutaway(state,world.worldToLocal(eye));}
 }
 return {view,world,restore,present,setOpening(v){if(!['top','front','both'].includes(v))throw Error('At least one aperture must remain open');opening=v;},
  end(){shown=false;restore();scene.background=originalBG;scene.fog=originalFog;view.setCamera?.('street');view.resize();},
  ray(origin,direction){world.updateWorldMatrix(true,false);const a=world.worldToLocal(origin.clone()),b=world.worldToLocal(origin.clone().add(direction)).sub(a).normalize();return {origin:{x:a.x,y:a.y,z:a.z},direction:{x:b.x,y:b.y,z:b.z}};},
  inspect(){return {district:kind,active:shown,mode:mode?.id||null,stereo:true,screenTextures:0,portal:!!mode?.portal,firstPerson:!!mode?.first,opening,scale:pose?.scale,centerError,worldMatrix:world.matrix.toArray(),portalBounds:pose?.portalSize.toArray(),materials:materials.entries.size};}};
}
