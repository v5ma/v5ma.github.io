/* WebIDL-safe tracking, headset-visible menus, and recoverable frame errors.
 * No gameplay reducer, save namespace, bindings or renderer is replaced. */
import * as T from './vendor/three.module.js';
export const XR_REPAIR_BUILD='guild-xr-recovery-20260918';
export function xrPosition(point){
 const x=point?.x,y=point?.y,z=point?.z;
 if(![x,y,z].every(Number.isFinite))throw new TypeError('Headset position is unavailable or invalid. Recenter or re-enter XR.');
 return {x,y,z};
}
export function checkedEyeMatrix(matrix){
 if(!matrix.elements.every(Number.isFinite))throw new TypeError('The XR view transform is invalid. Exit and re-enter the selected view.');
 return matrix;
}
export function guardFrame(frame,recover){return function(now,xrFrame){
 try{return frame(now,xrFrame);}catch(error){
  // Three's loop schedules the next frame after this callback. Letting a UI
  // exception escape would therefore leave a permanently frozen headset.
  try{recover(error);}catch(recoveryError){console.error('XR recovery failed',recoveryError);}
 }
};}
export function createMenuAnchor(panel,stage){
 const home={position:panel.position.clone(),quaternion:panel.quaternion.clone(),scale:panel.scale.clone()},frame=new T.Group();
 frame.name='On-demand headset menu';stage.parent.add(frame);
 panel.material.depthTest=false;panel.material.depthWrite=false;panel.renderOrder=4000;
 let lastRoot=null,wasVisible=false,spatial=false,placements=0;
 function reset(){lastRoot=null;wasVisible=false;}
 function update(real,root,visible,pose){
  if(!real){if(spatial){stage.add(panel);panel.position.copy(home.position);panel.quaternion.copy(home.quaternion);panel.scale.copy(home.scale);}spatial=false;reset();return;}
  if(!spatial){frame.add(panel);panel.position.set(0,0,0);panel.quaternion.identity();panel.scale.setScalar(.74);spatial=true;reset();}
  if(visible&&pose?.transform&&(!wasVisible||root!==lastRoot)){
   const eye=new T.Vector3().copy(xrPosition(pose.transform.position)),q=new T.Quaternion().copy(pose.transform.orientation);
   frame.position.copy(eye).add(new T.Vector3(0,0,-1.25).applyQuaternion(q));
   // Face the current eye without adopting head roll. Place ONCE on opening,
   // not every frame; looking aside does not drag rectangles across the game.
   frame.quaternion.setFromRotationMatrix(new T.Matrix4().lookAt(frame.position,eye,new T.Vector3(0,1,0)));
   frame.rotateY(Math.PI);placements++;
  }
  lastRoot=root;wasVisible=visible&&!!pose?.transform;frame.updateWorldMatrix(true,true);
 }
 return {update,reset,inspect:()=>{panel.updateWorldMatrix(true,false);return {matrix:panel.matrixWorld.toArray(),placements,depthTest:panel.material.depthTest,spatial};}};
}
export function createDialogBridge(active,env=globalThis){
 const proto=env.HTMLDialogElement?.prototype,doc=env.document;
 if(!proto||!doc?.querySelectorAll)return {restore(){},dispose(){},inspect:()=>({bridged:0})};
 const nativeShow=proto.showModal,ordinaryShow=proto.show,marked=new Set();
 function show(){
  if(!active())return nativeShow.call(this);
  // Native 2D modal/inert focus is not our immersive UI. Keep the ORIGINAL
  // dialog and its handlers, but display it through the in-headset panel.
  marked.add(this);if(!this.open)ordinaryShow.call(this);
 }
 proto.showModal=show;
 function restore(){for(const d of marked){if(d.isConnected&&d.open){const result=d.returnValue;d.close(result);nativeShow.call(d);}}marked.clear();}
 return {restore,dispose(){restore();if(proto.showModal===show)proto.showModal=nativeShow;},inspect:()=>({bridged:marked.size})};
}
