/* Experimental stationary WebXR overlook of the ACTUAL chapter. Not a claim of
 * Quest-certified gameplay: AI/mission time pauses, head tracking stays user-
 * controlled, trigger cycles authored viewing points and grip exits. */
import * as T from './vendor/three.module.js';
export function previewViews(chapter,heightAt){return chapter.shelters.map(p=>({x:p.x,y:heightAt(p.x,p.z)+1.65,z:p.z+1.5,label:p.name}));}
export function createXRSessionGate({xr,attach,active,end}){
 let session=null,pending=false,disposed=false;
 return {async supported(){try{return !!xr&&await xr.isSessionSupported('immersive-vr');}catch{return false;}},async enter(){
  if(disposed||pending||session)return false;pending=true;let candidate;
  try{candidate=await xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});if(disposed){await candidate.end();return false;}session=candidate;
   candidate.addEventListener('end',()=>{if(session===candidate){session=null;if(!disposed)end();}},{once:true});await attach(candidate);if(disposed||session!==candidate){await candidate.end();return false;}active();return true;
  }catch(e){if(session===candidate)session=null;try{await candidate?.end();}catch{}end(e);return false;}finally{pending=false;}
 },async exit(){try{await session?.end();}catch(e){end(e);session=null;}},dispose(){disposed=true;void session?.end().catch(()=>{});},state:()=>({active:!!session,pending,disposed})};
}
export function createXRPreview(renderer,scene,chapter,{heightAt,onStart,onEnd}){
 const rig=new T.Group(),camera=new T.PerspectiveCamera(65,1,.05,250);rig.add(camera);scene.add(rig);const views=previewViews(chapter,heightAt);let index=0,active=false;
 const board=document.createElement('canvas');board.width=1024;board.height=200;const texture=new T.CanvasTexture(board);texture.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(1.7,.332),new T.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthTest:false}));panel.position.set(0,-.45,-2.2);camera.add(panel);panel.visible=false;
 function label(){const c=board.getContext('2d');c.clearRect(0,0,1024,200);c.fillStyle='rgba(13,26,28,.85)';c.fillRect(0,0,1024,200);c.fillStyle='#efdcad';c.font='bold 38px sans-serif';c.textAlign='center';c.fillText(views[index].label.toUpperCase(),512,53);c.fillStyle='#d7e3d7';c.font='25px sans-serif';c.fillText('VR OVERLOOK · TRIGGER: NEXT VIEW · GRIP: EXIT',512,104);c.fillText('Stationary preview. Mission paused. Not VR combat.',512,150);texture.needsUpdate=true;}
 function anchor(){const p=views[index];rig.position.set(p.x,p.y,p.z);label();}
 const gate=createXRSessionGate({xr:globalThis.navigator?.xr,attach:async session=>{renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.xr.setFramebufferScaleFactor(.8);await renderer.xr.setSession(session);renderer.xr.setFoveation(.8);},active(){active=true;panel.visible=true;anchor();onStart();},end(error){active=false;panel.visible=false;onEnd(error);}});
 const controllers=[];for(let i=0;i<2;i++){const controller=renderer.xr.getController(i);const next=()=>{if(active){index=(index+1)%views.length;anchor();}},exit=()=>{if(active)void gate.exit();};controller.addEventListener('select',next);controller.addEventListener('squeeze',exit);rig.add(controller);controllers.push({controller,next,exit});}
 return {camera,rig,supported:()=>gate.supported(),enter:()=>gate.enter(),exit:()=>gate.exit(),isActive:()=>active,stats:()=>({...gate.state(),mode:'stationary-overlook',view:index,hardwareVerified:false}),dispose(){gate.dispose();for(const {controller,next,exit}of controllers){controller.removeEventListener('select',next);controller.removeEventListener('squeeze',exit);}scene.remove(rig);panel.geometry.dispose();panel.material.dispose();texture.dispose();}};
}
