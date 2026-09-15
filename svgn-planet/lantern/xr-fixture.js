/* Synthetic WebXR session. Tests real r177 session/render/input paths, NOT hardware. */
(()=>{
 const ident=(x=0,y=0,z=0)=>({position:{x,y,z,w:1},orientation:{x:0,y:0,z:0,w:1},matrix:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1])});
 const source=handedness=>({handedness,targetRayMode:'tracked-pointer',profiles:['oculus-touch-v3'],targetRaySpace:{pose:ident(4,0,0)},gripSpace:{pose:ident(handedness==='left'?-.2:.2,-.3,-.6)},gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({pressed:false,value:0}))}});
 const left=source('left'),right=source('right'),hand=source('right');delete hand.gamepad;
 hand.hand=new Map(Array.from({length:25},(_,i)=>[i===0?'thumb-tip':i===1?'index-finger-tip':'joint-'+i,{joint:i}]));
 const data=window.__xrFixture={left,right,hand,pinch:.06,tracking:true,viewer:true,requested:null};
 const projection=new Float32Array([1.73,0,0,0,0,1.73,0,0,0,0,-1.00334,-1,0,0,-.100167,0]);
 const head=(x=0)=>{const a=data.viewerPitch||0,c=Math.cos(a),s=Math.sin(a);return {position:{x,y:0,z:0,w:1},orientation:{x:Math.sin(a/2),y:0,z:0,w:Math.cos(a/2)},matrix:new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,x,0,0,1])};};
 const frame={getViewerPose:()=>data.viewer?{transform:head(),views:[{eye:'left',transform:head(-.032),projectionMatrix:projection},{eye:'right',transform:head(.032),projectionMatrix:projection}]}:null,getPose:space=>data.tracking?{transform:space.pose}:null,getJointPose:space=>data.tracking?{transform:ident(.1+(space.joint===0?data.pinch:0),-.3,-.6),radius:.008}:null};
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
