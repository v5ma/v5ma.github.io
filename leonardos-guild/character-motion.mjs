/* Articulated animation of the existing clothed meshes. These are authored
 * shoulder/head poses, not imported motion capture or a new skeletal asset pack. */
export function poseAt(time,{motion='idle',speed=0,phase=0}={}){
  const t=Number.isFinite(time)?time:0,p=Number.isFinite(phase)?phase:0;
  const walk=Math.sin(p)*Math.min(.48,Math.abs(speed)*.12),breathe=Math.sin(t*1.6)*.02;
  const pose={left:walk-.1,right:-walk-.1,leftOut:.06,rightOut:-.06,headPitch:breathe,headTurn:Math.sin(t*.38)*.035};
  if(motion==='ride'){pose.left=pose.right=-.58;pose.headPitch=-.035;}
  if(motion==='work'){pose.left=-.42;pose.right=-.55-Math.sin(t*2.2)*.2;pose.headPitch=.08;}
  if(motion==='wave'){pose.right=-1.72;pose.rightOut=-.35-Math.sin(t*3.5)*.15;pose.headTurn=.08;}
  if(motion==='guard'){pose.left=-.82;pose.right=-.95;pose.leftOut=.32;pose.rightOut=-.35;}
  if(motion==='strike'){pose.right=-.7-Math.sin(t*14)*.75;pose.headPitch=.08;}
  if(motion==='listen'){pose.left=pose.right=-.12;pose.headPitch=Math.sin(t*1.2)*.045;pose.headTurn=0;}
  return pose;
}
export function animatePerson(person,time,options={}){
  const root=person.root||person,rig=root.guildRig;if(!rig)return false;
  const p=poseAt(time,options);rig.arms[0].rotation.set(p.left,0,p.leftOut);rig.arms[1].rotation.set(p.right,0,p.rightOut);
  rig.head.rotation.set(p.headPitch,p.headTurn,0);root.userData.gesture=options.motion||'idle';return true;
}
