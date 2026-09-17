/* Test-only WebXR hardware fixture. It emulates poses, input sources and the
 * browser session/frame boundary, NOT game state, renderer or UI handlers.
 * Actual local Three.js, WebGL, shaders, raycasting and gameplay run unchanged.
 */
(()=>{
 const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
 const identity={x:0,y:0,z:0,w:1};
 const data=window.__xr={supported:true,reject:false,floor:true,headTracked:true,head:{x:0,y:1.6,z:0},yaw:0,pitch:0,hitSupported:true,hitAvailable:true,sources:[],session:null};
 function matrix(position,orientation=identity){
  const {x,y,z,w}=orientation,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return new Float32Array([1-(yy+zz),xy+wz,xz-wy,0,xy-wz,1-(xx+zz),yz+wx,0,xz+wy,yz-wx,1-(xx+yy),0,position.x,position.y,position.z,1]);
 }
 function transform(p,q=identity){return {position:p,orientation:q,matrix:matrix(p,q)};}
 function source(handedness,hand=false){
  const s={handedness,targetRayMode:'tracked-pointer',profiles:hand?['generic-hand-select']:['oculus-touch-v3'],tracked:true,jointsTracked:true,down:false,position:{x:handedness==='left'?-.25:.25,y:1.3,z:-.1},orientation:{...identity},pinch:.06};
  s.targetRaySpace={source:s,kind:'ray'};s.gripSpace={source:s,kind:'grip'};
  if(hand){s.hand=new Map();for(const name of['wrist',...['thumb','index-finger','middle-finger','ring-finger','pinky-finger'].flatMap(f=>f==='thumb'?['thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip']:[f+'-metacarpal',f+'-phalanx-proximal',f+'-phalanx-intermediate',f+'-phalanx-distal',f+'-tip'])])s.hand.set(name,{source:s,joint:name});}
  else s.gamepad={mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({pressed:false,value:0}))};
  return s;
 }
 data.makeSource=source;data.sources=[source('left'),source('right')];
 data.replace=(index,hand)=>{const old=data.sources[index],s=source(old.handedness,hand);data.sources[index]=s;if(data.session){const event=new Event('inputsourceschange');event.removed=[old];event.added=[s];data.session.dispatchEvent(event);}return s;};
 class Frame{
  constructor(session){this.session=session;}
  getViewerPose(){
   if(!data.headTracked)return null;
   const f=1/Math.tan(70*Math.PI/360),near=this.session.renderState.depthNear||.05,far=this.session.renderState.depthFar||1800,projection=new Float32Array([f/.8,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
   const cy=Math.cos(data.yaw/2),sy=Math.sin(data.yaw/2),cx=Math.cos(data.pitch/2),sx=Math.sin(data.pitch/2);const q={x:cy*sx,y:sy*cx,z:-sy*sx,w:cy*cx};
   const views=['left','right'].map((eye,i)=>({eye,projectionMatrix:projection,transform:transform({...data.head,x:data.head.x+(i?.032:-.032)},q)}));
   return {views,transform:transform(data.head,q),emulatedPosition:false};
  }
  getHitTestResults(){return data.hitAvailable?[{getPose:()=>({transform:transform({x:0,y:.7,z:-1.7})})}]:[];}
  getPose(space){const s=space?.source;if(!s?.tracked)return null;return {transform:transform(s.position,s.orientation),emulatedPosition:false};}
  getJointPose(space){const s=space?.source;if(!s?.tracked||!s.jointsTracked)return null;const p={...s.position};p.z-=.06;if(space.joint==='thumb-tip')p.x+=s.pinch;return {transform:transform(p,s.orientation),radius:.008};}
 }
 class Session extends EventTarget{
  constructor(){super();this.renderState={depthNear:.05,depthFar:30};this.visibilityState='visible';this.environmentBlendMode=data.request?.mode==='immersive-ar'?'alpha-blend':'opaque';this.enabledFeatures=['local-floor','hand-tracking'];this.pending=new Set();this.ended=false;}
  get inputSources(){return data.sources;}
  requestReferenceSpace(type){return type==='local-floor'&&!data.floor?Promise.reject(new Error('No floor reference')):Promise.resolve({type,getOffsetReferenceSpace(){return this;}});}
  requestHitTestSource(){return data.hitSupported?Promise.resolve({cancel(){data.hitCancelled=true;}}):Promise.reject(Error('Hit test unavailable'));}
  updateRenderState(v){Object.assign(this.renderState,v);}
  requestAnimationFrame(callback){const id=raf(time=>{this.pending.delete(id);if(!this.ended){callback(time,new Frame(this));if(data.captureNext){data.captureNext=false;data.capture=document.getElementById('world').toDataURL('image/png');}}});this.pending.add(id);return id;}
  cancelAnimationFrame(id){this.pending.delete(id);caf(id);}
  async end(){if(this.ended)return;this.ended=true;for(const id of this.pending)caf(id);this.pending.clear();this.dispatchEvent(new Event('end'));data.session=null;}
 }
 class Layer{
  constructor(session,gl){this.framebuffer=null;this.framebufferWidth=1280;this.framebufferHeight=800;this.ignoreDepthValues=false;this.fixedFoveation=1;}
  getViewport(view){return {x:view.eye==='left'?0:640,y:0,width:640,height:800};}
 }
 Object.defineProperty(window,'XRWebGLBinding',{value:undefined,configurable:true});Object.defineProperty(window,'XRWebGLLayer',{value:Layer,configurable:true});
 WebGL2RenderingContext.prototype.makeXRCompatible=()=>Promise.resolve();
 Object.defineProperty(navigator,'xr',{value:{isSessionSupported:async()=>data.supported,requestSession:async(mode,options)=>{data.request={mode,options};if(data.reject)throw new DOMException('User declined XR','NotAllowedError');const s=new Session();data.session=s;return s;}},configurable:true});
})();
