import * as T from './vendor/three.module.js';
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
export function footContacts(actor,player,heightAt){
 if(player.hp<=0||player.waterMode==='swim'||player.stance==='prone'||player.vault||player.dodge>0){actor.contacts=null;return;}
 actor.root.updateMatrixWorld(true);const location=new T.Vector3(player.x,0,player.z),old=actor.contacts;if(!old||old.position.distanceTo(location)>3||old.stance!==player.stance)actor.contacts={position:location.clone(),stance:player.stance,feet:[null,null]};const c=actor.contacts;c.position.copy(location);
 for(const [i,start]of [11,14].entries()){
  const hip=actor.bones[start],knee=actor.bones[start+1],foot=actor.bones[start+2],current=foot.getWorldPosition(new T.Vector3()),plant=(player.speed||0)<.2||Math.cos(actor.gait+(i?Math.PI:0))<-.1;
  if(!plant)c.feet[i]=null;if(plant&&!c.feet[i])c.feet[i]=current.clone();let target=c.feet[i]?.clone()||current.clone();target.y=heightAt(target.x,target.z)+.105;
  if(c.feet[i]&&new T.Vector2(current.x-target.x,current.z-target.z).length()>.5){c.feet[i]=current.clone();target=current.clone();target.y=heightAt(target.x,target.z)+.105;}
  if(!plant&&current.y>=target.y)continue;const pole=hip.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.05,-1).applyQuaternion(actor.root.quaternion));solveTwoBone(hip,knee,foot,target,pole);
  const parent=foot.parent.getWorldQuaternion(new T.Quaternion()).invert();foot.quaternion.copy(parent.multiply(actor.root.quaternion));foot.updateWorldMatrix(true,true);
 }actor.skin.skeleton.update();
}
