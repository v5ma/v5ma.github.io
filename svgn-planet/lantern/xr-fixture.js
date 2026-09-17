/* Synthetic WebXR session. Tests real r177 session/render/input paths, NOT hardware. */
(()=>{
 const ident=(x=0,y=0,z=0)=>({position:{x,y,z,w:1},orientation:{x:0,y:0,z:0,w:1},matrix:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1])});
 const source=handedness=>({handedness,targetRayMode:'tracked-pointer',profiles:['oculus-touch-v3'],targetRaySpace:{pose:ident(4,0,0)},gripSpace:{pose:ident(handedness==='left'?-.2:.2,-.3,-.6)},gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({pressed:false,value:0}))}});
 const left=source('left'),right=source('right'),hand=source('right');delete hand.gamepad;
 hand.hand=new Map(Array.from({length:25},(_,i)=>[i===0?'thumb-tip':i===1?'index-finger-tip':i===2?'wrist':'joint-'+i,{joint:i}]));
 const data=window.__xrFixture={left,right,hand,pinch:.06,tracking:true,viewer:true,requested:null};
 const projection=new Float32Array([1.73,0,0,0,0,1.73,0,0,0,0,-1.00334,-1,0,0,-.100167,0]);
 const head=(offset=0)=>{const ax=data.viewerPitch||0,ay=data.viewerYaw||0,az=data.viewerRoll||0,c1=Math.cos(ax/2),c2=Math.cos(ay/2),c3=Math.cos(az/2),s1=Math.sin(ax/2),s2=Math.sin(ay/2),s3=Math.sin(az/2);
  const x=s1*c2*c3+c1*s2*s3,y=c1*s2*c3-s1*c2*s3,z=c1*c2*s3-s1*s2*c3,w=c1*c2*c3+s1*s2*s3;
  const a=1-2*(y*y+z*z),b=2*(x*y+z*w),d=2*(x*z-y*w),position={x:(data.viewerX||0)+offset*a,y:(data.viewerY||0)+offset*b,z:(data.viewerZ||0)+offset*d,w:1};
  return {position,orientation:{x,y,z,w},matrix:new Float32Array([a,b,d,0,2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),0,2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y),0,position.x,position.y,position.z,1])};};
 const frame={getViewerPose:()=>data.viewer?{transform:head(),views:[{eye:'left',transform:head(-.032),projectionMatrix:projection},{eye:'right',transform:head(.032),projectionMatrix:projection}]}:null,getPose:space=>data.tracking?{transform:space.pose}:null,getJointPose:space=>data.tracking?{transform:ident(hand.gripSpace.pose.position.x+(space.joint===0?data.pinch:0),hand.gripSpace.pose.position.y,hand.gripSpace.pose.position.z),radius:.008}:null};
 class Session extends EventTarget{
  constructor(){super();this.inputSources=[left,right];this.renderState={};this.visibilityState='visible';this.environmentBlendMode='opaque';this.enabledFeatures=['hand-tracking'];this.ended=false;}
  requestReferenceSpace(){return Promise.resolve({getOffsetReferenceSpace(){return this;}});}
  updateRenderState(state){Object.assign(this.renderState,state);}
  requestAnimationFrame(callback){return setTimeout(()=>{if(!this.ended)callback(performance.now(),frame);},24);}
  cancelAnimationFrame(id){clearTimeout(id);}
  async end(){this.ended=true;this.dispatchEvent(new Event('end'));}
 }
 Object.defineProperty(window,'XRWebGLBinding',{configurable:true,value:undefined});
 Object.defineProperty(window,'XRWebGLLayer',{configurable:true,value:class{constructor(){this.framebuffer=null;this.framebufferWidth=960;this.framebufferHeight=600;this.fixedFoveation=0;}getViewport(view){return {x:view.eye==='left'?0:480,y:0,width:480,height:600};}}});
 WebGL2RenderingContext.prototype.makeXRCompatible=async()=>{};
 Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async(mode,options)=>{data.requested={mode,options};const s=new Session();s.environmentBlendMode=mode==='immersive-ar'&&!data.opaque?'alpha-blend':'opaque';return data.session=s;}}});
 data.ray=async(u,v,menu=true)=>{const T=await import('./vendor/three.module.js');const size=menu?1.4:1.12,p=new T.Vector3((u-.5)*size,(.5-v)*size+(menu?-.05:-.96),menu?-1.8:-2),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q);const pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};right.targetRaySpace.pose=hand.targetRaySpace.pose=pose;};
 data.useHands=()=>{const e=new Event('inputsourceschange');e.removed=data.session.inputSources;e.added=[hand];data.session.inputSources=[hand];data.session.dispatchEvent(e);};
})();
