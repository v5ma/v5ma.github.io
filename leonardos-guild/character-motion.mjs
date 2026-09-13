/* Deterministic, distance-driven joint poses on the existing character actors.
 * Cosmetic only: no position, hitbox, speed, stamina or save writes. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),num=(n,f=0)=>Number.isFinite(n)?n:f;
export function poseAt(time,{motion='idle',speed=0,phase=0,weight=1,action=0}={}){
 const t=num(time),p=num(phase),v=clamp(Math.abs(num(speed)),0,12),w=clamp(num(weight,1),0,1);
 const stride=Math.sin(p)*Math.min(.52,v*.115)*w,breathe=Math.sin(t*1.6)*.02;
 const q={left:stride-.1,right:-stride-.1,leftOut:.06,rightOut:-.06,headPitch:breathe,headTurn:Math.sin(t*.38)*.035,leftElbow:-.18,rightElbow:-.18,leftHip:-stride,rightHip:stride,leftKnee:Math.max(0,Math.sin(p))*.8*w,rightKnee:Math.max(0,-Math.sin(p))*.8*w,leftAnkle:0,rightAnkle:0,lean:Math.min(.1,v*.016)*w,bob:Math.sin(p*2)*.016*w};
 if(motion==='idle'||motion==='listen'||motion==='work'||motion==='wave'){q.leftHip=q.rightHip=q.leftKnee=q.rightKnee=q.lean=q.bob=0;}
 if(motion==='ride'){q.left=q.right=-.65;q.leftElbow=q.rightElbow=-.28;q.headPitch=-.035;q.lean=.12;q.leftHip=-.65+Math.sin(p)*.32;q.rightHip=-.65-Math.sin(p)*.32;q.leftKnee=1.1-Math.sin(p)*.35;q.rightKnee=1.1+Math.sin(p)*.35;q.bob=0;}
 if(motion==='work'){q.left=-.42;q.right=-.55-Math.sin(t*2.2)*.15;q.rightElbow=-.65;q.headPitch=.08;}
 if(motion==='wave'){q.right=-1.72;q.rightOut=-.35-Math.sin(t*3.5)*.15;q.rightElbow=-.35;q.headTurn=.08;}
 if(motion==='guard'){q.left=-.82;q.right=-.95;q.leftOut=.32;q.rightOut=-.35;q.leftElbow=-.75;q.rightElbow=-.85;q.lean=.09;}
 if(motion==='strike'){const swing=Math.sin(clamp(num(action),0,1)*Math.PI);q.right=-.45-swing*1.5;q.rightElbow=-.35;q.left=-.6;q.headPitch=.08;}
 if(motion==='aim'){q.left=-1.32;q.right=-1.25;q.leftElbow=-.2;q.rightElbow=-.6;q.headTurn=0;q.headPitch=-.015;q.lean=.04;q.bob=0;}
 if(motion==='reload'){q.left=-.72;q.right=-.85;q.leftElbow=-.9;q.rightElbow=-1-Math.sin(t*6)*.16;q.headPitch=.14;}
 if(motion==='cover'||motion==='dodge'){q.lean=.18;q.leftHip-=.38;q.rightHip-=.38;q.leftKnee+=.6;q.rightKnee+=.6;q.left=q.right=-.5;q.bob=-.06;}
 if(motion==='jump'){q.left=-.5;q.right=.2;q.leftHip=-.35;q.rightHip=.12;q.leftKnee=.8;q.rightKnee=.45;q.bob=0;}
 if(motion==='yield'){q.lean=.32;q.left=q.right=-.4;q.leftHip=q.rightHip=-.25;q.leftKnee=q.rightKnee=.55;q.headPitch=.22;q.bob=-.07;}
 if(motion==='listen'){q.left=q.right=-.12;q.headPitch=Math.sin(t*1.2)*.045;q.headTurn=0;}
 q.leftAnkle=-q.leftKnee*.28;q.rightAnkle=-q.rightKnee*.28;
 return q;
}
export function advanceMotion(previous,time,point,options={}){
 const t=num(time),x=num(point.x),z=num(point.z),level=options.level||0;
 const dt=previous?clamp(t-previous.time,0,.1):0,travel=previous?Math.hypot(x-previous.x,z-previous.z):0;
 const teleport=!previous||level!==previous.level||travel>3;
 const moving=dt>0&&!teleport?travel/dt:0;
 const phase=teleport?0:(previous.phase+travel*(options.motion==='ride'?3:3.8))%(Math.PI*2);
 const target=clamp(moving/.7,0,1),a=1-Math.exp(-dt*14),weight=teleport?0:previous.weight+(target-previous.weight)*a;
 const pose=poseAt(t,{...options,speed:moving,phase,weight});
 if(previous&&!teleport&&dt===0)return {...previous};
 if(previous&&!teleport)for(const key of Object.keys(pose))pose[key]=previous.pose[key]+(pose[key]-previous.pose[key])*a;
 return {time:t,x,z,level,phase,weight,pose,motion:options.motion||'idle',moving};
}
export function animatePerson(person,time,options={}){
 const root=person.root||person,rig=root.guildRig;if(!rig)return false;
 if(rig.version!==2){const p=poseAt(time,options);rig.arms[0].rotation.set(p.left,0,p.leftOut);rig.arms[1].rotation.set(p.right,0,p.rightOut);rig.head.rotation.set(p.headPitch,p.headTurn,0);return true;}
 rig.memory=advanceMotion(rig.memory,time,root.position,options);const p=rig.memory.pose;
 rig.arms[0].rotation.set(p.left,0,p.leftOut);rig.arms[1].rotation.set(p.right,0,p.rightOut);rig.head.rotation.set(p.headPitch,p.headTurn,0);
 for(let i=0;i<2;i++){const side=i?'right':'left';rig.elbows[i].rotation.x=p[side+'Elbow'];rig.legs[i].rotation.x=p[side+'Hip'];rig.knees[i].rotation.x=p[side+'Knee'];rig.ankles[i].rotation.x=p[side+'Ankle'];}
 rig.torso.rotation.x=p.lean;rig.torso.position.y=1.04+p.bob;root.userData.gesture=options.motion||'idle';return true;
}
export function inspectMotion(person){const rig=(person.root||person).guildRig,m=rig?.memory;return {rigVersion:rig?.version||1,jointed:rig?.version===2,motion:m?.motion||'idle',phase:m?.phase||0,weight:m?.weight||0,actualSpeed:m?.moving||0,knees:rig?.knees?.map(k=>k.rotation.x)||[],elbows:rig?.elbows?.map(k=>k.rotation.x)||[],pose:m?{...m.pose}:null};}
