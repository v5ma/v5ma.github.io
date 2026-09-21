import * as T from './vendor/three.module.js';
import {applyGroundedMotion} from './grounded-motion.mjs';
/* Bounded visual IK only. Does not move the collision body or save any joints. */
export function solveTwoBone(hip,knee,foot,target,pole){
 hip.updateWorldMatrix(true,true);const h=hip.getWorldPosition(new T.Vector3()),k=knee.getWorldPosition(new T.Vector3()),f=foot.getWorldPosition(new T.Vector3()),a=h.distanceTo(k),b=k.distanceTo(f),delta=target.clone().sub(h),raw=delta.length();
 if(!Number.isFinite(raw)||raw<1e-6||a<1e-5||b<1e-5)return false;
 const direction=delta.normalize(),distance=Math.max(Math.abs(a-b)+.0001,Math.min(a+b-.0001,raw)),side=pole.clone().sub(h).addScaledVector(direction,-pole.clone().sub(h).dot(direction));
 if(side.lengthSq()<1e-8)side.set(0,0,-1).addScaledVector(direction,direction.z);if(side.lengthSq()<1e-8)side.set(1,0,0);side.normalize();
 const cosine=Math.max(-1,Math.min(1,(a*a+distance*distance-b*b)/(2*a*distance))),desiredK=h.clone().addScaledVector(direction,a*cosine).addScaledVector(side,a*Math.sqrt(1-cosine*cosine)),desiredF=h.clone().addScaledVector(direction,distance);
 function aim(bone,from,to){const world=bone.getWorldQuaternion(new T.Quaternion()),parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert(),turn=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());bone.quaternion.copy(parent.multiply(turn).multiply(world));bone.updateWorldMatrix(true,true);}
 aim(hip,k.clone().sub(h),desiredK.clone().sub(h));const nk=knee.getWorldPosition(new T.Vector3()),nf=foot.getWorldPosition(new T.Vector3());aim(knee,nf.sub(nk),desiredF.sub(nk));return true;
}
/* Scene integration point is retained: base pose -> actual terrain height ->
 * this single visual solve. Do not run the superseded contact loop afterward. */
export function footContacts(actor,player,heightAt=()=>0){
 const time=Number.isFinite(actor.lastTime)?actor.lastTime:0;
 const dt=actor.motion?Math.max(0,Math.min(.1,time-actor.motion.time)):1/60;
 // The scene gives its base enemy pose this same inferred aiming state.
 // Use a render-only copy; never add animation flags to an enemy's game state.
 const renderState=actor.enemy&&player.aim===undefined?{...player,aim:player.state==='chase'&&(player.aimTime||0)>.1}:player;
 applyGroundedMotion(actor,renderState,time,dt,heightAt);
 actor.root.updateMatrixWorld(true);actor.skin.skeleton.update();
}
