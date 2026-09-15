/* Original analytic two-link solver and distance-driven contact controller.
 * Technique reference: theorangeduck.com/page/inverse-kinematics-foot-locking.
 * Positions are solved in courier-local space; planted targets live in world space.
 */
import * as T from './vendor/three.module.js';
import {point,norm} from './model.mjs';
const clamp=T.MathUtils.clamp,down=new T.Vector3(0,-1,0);
export function solveTwoBone(root,target,a,b,pole=new T.Vector3(0,0,-1)){
 const delta=target.clone().sub(root),raw=delta.length(),axis=raw>1e-8?delta.divideScalar(raw):down.clone();
 const max=a+b-1e-5,soft=.012,start=max-soft;
 const d=clamp(raw>start?start+soft*(1-Math.exp(-(raw-start)/soft)):raw,Math.abs(a-b)+1e-5,max);
 const along=(a*a-b*b+d*d)/(2*d),bend=pole.clone().addScaledVector(axis,-pole.dot(axis));
 if(bend.lengthSq()<1e-8){bend.set(Math.abs(axis.x)<.8?1:0,Math.abs(axis.x)<.8?0:1,0);bend.addScaledVector(axis,-bend.dot(axis));}
 bend.normalize();const knee=root.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
 return {knee,end:root.clone().addScaledVector(axis,d),error:Math.abs(raw-d)};
}
export function placeChain(chain,root,target,pole){
 const q=solveTwoBone(root,target,chain.a,chain.b,pole);
 function segment(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(down,b.clone().sub(a).normalize());}
 segment(chain.upper,root,q.knee);segment(chain.lower,q.knee,q.end);chain.joint.position.copy(q.knee);chain.end.position.copy(q.end);return q;
}
export function createGroundedMotion(rig){
 let phase=0,lastDistance=null,lastMode='',lastPosition=null,blend=1,maxError=0;
 const feet=[0,1].map(()=>({lock:null,start:null,previous:null,target:new T.Vector3(),orientation:new T.Quaternion(),plant:false,contact:false}));
 const forwardPole=new T.Vector3(0,0,-1),armPole=new T.Vector3(0,0,.8);
 function update(s,vehicle,dt=1/60){
  const mode=s.tide?.boat?'boat':s.ride?vehicle:(s.lift>.015?'air':'walk'),speed=Math.abs(s.speed||0);
  const moved=lastDistance===null?0:Math.max(0,s.distance-lastDistance),teleport=lastPosition&&rig.g.position.distanceTo(lastPosition)>3;
  lastDistance=s.distance;lastPosition=rig.g.position.clone();
  if(mode!==lastMode||teleport){blend=0;for(const f of feet){f.lock=null;f.start=null;f.contact=false;f.plant=false;f.previous=f.target.clone();}lastMode=mode;}
  blend=Math.min(1,blend+Math.max(0,dt)/.16);const easing=blend*blend*(3-2*blend);
  // Cadence follows distance, so stops never keep walking and braking never speeds up the gait.
  const stride=clamp(.8+speed*.4,1,3),duty=Math.min(.58,.76/stride),reach=stride*duty*.5;
  phase=(phase+moved/(mode==='bicycle'?2.4:stride))%1;
  rig.body.position.set(0,mode==='bicycle'?(1.09-.96*Math.cos(.56)):mode==='unicycle'?.27:mode==='boat'?-.27:mode==='walk'&&speed>.08?-.085:0,mode==='bicycle'?(.25+.96*Math.sin(.56)):0);
  rig.body.rotation.set(mode==='bicycle'?-.56:0,0,0);rig.g.updateMatrixWorld(true);maxError=0;
  for(let i=0;i<2;i++){
   const side=i===0?-1:1,f=feet[i],p=(phase+i*.5)%1,cycle=p*2*Math.PI;
   let foot=new T.Vector3(side*.125,.14,0),hand=new T.Vector3(side*.28,1.01,Math.sin(cycle)*Math.min(.20,speed*.06));
   if(mode==='bicycle'){
    foot.set(side*.22,.47+Math.cos(cycle)*.14,Math.sin(cycle)*.14);hand.set(side*.32,1.21,-.48);
    rig.pedals[i].position.set(side*.22,.40+Math.cos(cycle)*.14,Math.sin(cycle)*.14);
   }else if(mode==='unicycle'){foot.set(side*.25,.465,0);hand.set(side*.29,1.28,-.12);}
   else if(mode==='boat'){foot.set(side*.17,.13,-.36);hand.set(side*.30,1.05,-.46);}
   else if(mode==='air'){foot.set(side*.13,.28,.14);hand.set(side*.33,1.26,-.23);}
   else{
    const stance=p<duty,stepping=speed>.08;
    if(!stepping){
     if(!f.lock||rig.g.worldToLocal(f.lock.clone()).distanceTo(foot)>.18){f.lock=rig.g.localToWorld(foot.clone());f.orientation.copy(rig.g.quaternion);}
     f.plant=true;f.contact=true;
    }else if(stance){
     if(!f.plant||!f.lock){foot.z=-reach;const wp=rig.g.localToWorld(foot.clone());f.lock=new T.Vector3(...point(norm(wp.toArray()),.24));f.orientation.copy(rig.g.quaternion);}
     f.plant=true;f.contact=true;
    }else{
     if(f.plant||!f.start)f.start=f.lock?.clone()||rig.g.localToWorld(foot.clone());
     f.plant=false;f.contact=false;
     const t=(p-duty)/(1-duty),u=t*t*(3-2*t),end=rig.g.localToWorld(new T.Vector3(side*.125,.14,-reach));
     const wp=f.start.clone().lerp(end,u);foot.copy(rig.g.worldToLocal(wp));foot.y+=Math.sin(Math.PI*t)*.15;
    }
    if(f.plant&&f.lock){foot.copy(rig.g.worldToLocal(f.lock.clone()));if(Math.hypot(foot.x,foot.z)>.67){f.lock=null;f.plant=false;f.contact=false;foot.set(side*.125,.14,0);}}
   }
   if(mode!=='walk'){f.plant=false;f.contact=false;}
   if(f.previous&&easing<1)foot.lerpVectors(f.previous,foot,easing);
   f.target.copy(foot);
   const root=rig.body.localToWorld(new T.Vector3(side*.125,.96,0));rig.g.worldToLocal(root);
   const leg=placeChain(rig.legChains[i],root,foot,forwardPole);maxError=Math.max(maxError,leg.error);
   rig.legChains[i].end.quaternion.copy(f.plant?rig.g.quaternion.clone().invert().multiply(f.orientation):new T.Quaternion());
   const shoulder=rig.body.localToWorld(new T.Vector3(side*.235,1.43,0));rig.g.worldToLocal(shoulder);
   if(easing<1&&rig.armChains[i].last)hand.lerpVectors(rig.armChains[i].last,hand,easing);
   placeChain(rig.armChains[i],shoulder,hand,armPole);rig.armChains[i].last=hand.clone();
  }
  for(const w of rig.wheels)w.rotation.x=-(s.distance||0)/.34;
 }
 return {update,inspect:()=>({mode:lastMode,phase,maxTargetError:maxError,contacts:feet.map(f=>f.contact),worldTargets:feet.map(f=>f.lock?.toArray()||null),targetFeet:feet.map(f=>f.target.toArray()),height:1.82,headHeight:.24})};
}
