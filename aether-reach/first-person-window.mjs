/* A first-person camera inside a room-fixed AR aperture, not life-size scenery
 * spilling into the room. Tracking changes the view, never the simulation.
 * The initial physical eye maps to the normal player eye. The center of the
 * window maps to the stick-controlled shooting direction. */
import * as T from './vendor/three.module.js';
import {eyeHeight} from './skirmish-core.mjs';
export class FirstPersonWindow{
 constructor(){this.reference=new T.Vector3();this.windowView=new T.Quaternion();this.ready=false;this.aim=new T.Quaternion();this.matrix=new T.Matrix4();}
 center(head,anchor,scale){
  this.reference.set(head.x,head.y,head.z);
  const target=new T.Vector3(anchor.x,anchor.y+14.5*scale,anchor.z);
  this.windowView.setFromRotationMatrix(new T.Matrix4().lookAt(this.reference,target,new T.Vector3(0,1,0)));
  this.ready=true;
 }
 sync(rig,player){
  if(!this.ready)return;
  this.aim.setFromEuler(new T.Euler(player.pitch,-player.yaw,0,'YXZ'));
  rig.quaternion.copy(this.aim).multiply(this.windowView.clone().invert());rig.scale.setScalar(1);
  rig.position.copy(this.reference).applyQuaternion(rig.quaternion).negate().add(new T.Vector3(player.x,player.y+eyeHeight(player),player.z));rig.updateMatrixWorld(true);
 }
 boxMatrix(rig,anchor,scale){
  return this.matrix.compose(new T.Vector3(anchor.x,anchor.y-3*scale,anchor.z),new T.Quaternion(),new T.Vector3(scale,scale,scale)).premultiply(rig.matrixWorld);
 }
 reset(){this.ready=false;}
}
