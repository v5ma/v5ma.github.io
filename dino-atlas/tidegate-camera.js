import * as T from './vendor/three.module.js';
// Clamp after smoothing as well as before it: easing must never move the camera
// through a wall. Five parallel feelers reserve a small near-plane clearance.
export function resolveCamera(focus,desired,current,dt,cast,{reduced=false,radius=.18,margin=.12}={}){
 const restrict=end=>{
  const delta=end.clone().sub(focus),length=delta.length();if(length<1e-7)return focus.clone();
  const direction=delta.multiplyScalar(1/length),side=new T.Vector3().crossVectors(direction,new T.Vector3(0,1,0));
  if(side.lengthSq()<1e-7)side.set(1,0,0);else side.normalize();
  const up=new T.Vector3().crossVectors(side,direction).normalize();let safe=length;
  for(const offset of [new T.Vector3(),side.clone().multiplyScalar(radius),side.clone().multiplyScalar(-radius),up.clone().multiplyScalar(radius),up.clone().multiplyScalar(-radius)]){
   const hit=cast(focus.clone().add(offset),direction,length);
   if(Number.isFinite(hit)&&hit>=0)safe=Math.min(safe,Math.max(0,hit-margin));
  }
  return focus.clone().addScaledVector(direction,safe);
 };
 const target=restrict(desired),blend=reduced?1:1-Math.exp(-Math.max(0,Math.min(.1,dt))*8);
 return restrict(current.clone().lerp(target,blend));
}
