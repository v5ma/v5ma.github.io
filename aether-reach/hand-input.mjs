/* XR hand gestures select spatial UI only. No gameplay buttons are synthesized.
 * Reconnection, lost joints and menu changes require an open hand before pinch. */
const point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
export class HandPinchSampler {
 constructor(){this.reset();}
 reset(){this.states=new Map();}
 sample(source,frame,space){
  const side=source?.handedness;if(!source?.hand||!['left','right'].includes(side))return null;
  let state=this.states.get(side);if(!state||state.source!==source){state={source,armed:false,down:false};this.states.set(side,state);}
  let thumb,index,ray;
  try{const t=source.hand.get('thumb-tip'),i=source.hand.get('index-finger-tip');if(t&&i&&frame?.getJointPose){thumb=frame.getJointPose(t,space);index=frame.getJointPose(i,space);}if(source.targetRaySpace)ray=frame.getPose(source.targetRaySpace,space);}catch{}
  const a=thumb?.transform?.position,b=index?.transform?.position,q=ray?.transform?.orientation;
  if(!point(a)||!point(b)||!point(ray?.transform?.position)||!q||![q.x,q.y,q.z,q.w].every(Number.isFinite)){state.armed=state.down=false;return {side,tracked:false,pressed:false};}
  const distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);let pressed=false;
  if(distance>=.04){state.armed=true;state.down=false;}
  else if(distance<=.025&&state.armed&&!state.down){state.down=true;pressed=true;}
  return {side,source,tracked:true,pressed,down:state.down,distance,ray,thumb,index};
 }
 prune(sources){for(const [side,state]of this.states)if(!sources.includes(state.source))this.states.delete(side);}
}
