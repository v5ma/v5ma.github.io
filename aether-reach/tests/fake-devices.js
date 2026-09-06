/* TEST-ONLY device API emulation, never shipped in the game module graph.
 * Supplies Gamepad/XR frames; does not assign avatar state, wins or game time. */
(()=>{
 const makePad=mapping=>({id:'Test standard controller',index:0,connected:true,mapping,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))});
 const pad=makePad('standard');let connected=false;
 Object.defineProperty(navigator,'getGamepads',{value:()=>connected?[pad]:[]});
 window.TestPad={connect(){connected=true;},disconnect(){connected=false;},axes(a){pad.axes=a;},button(i,v){pad.buttons[i]={pressed:v,touched:v,value:v?1:0};}};
 const devices={headYaw:0,headX:0,session:null,deny:false};
 function transform(x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return {position:{x,y,z},orientation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},matrix:new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1])};}
 const projection=new Float32Array([1.8,0,0,0,0,1.5,0,0,0,0,-1.0001,-1,0,0,-.12,0]);
 class Space extends EventTarget{getOffsetReferenceSpace(){return this;}}
 class Session extends EventTarget{
  constructor(){super();this.visibilityState='visible';this.environmentBlendMode='opaque';this.enabledFeatures=['local-floor'];this.renderState={depthNear:.06,depthFar:1100};this.inputSources=['left','right'].map(hand=>({handedness:hand,targetRayMode:'tracked-pointer',targetRaySpace:{hand},gripSpace:{hand},profiles:['oculus-touch-v3','generic-trigger-squeeze-thumbstick'],gamepad:makePad('xr-standard')}));this.started=false;this.ended=false;}
  requestReferenceSpace(){return Promise.resolve(new Space());}
  updateRenderState(s){Object.assign(this.renderState,s);}
  requestAnimationFrame(fn){if(this.ended)return 0;return window.requestAnimationFrame(t=>{
   if(this.ended)return;if(!this.started){this.started=true;const e=new Event('inputsourceschange');e.added=this.inputSources;e.removed=[];this.dispatchEvent(e);}
   const h=transform(devices.headX,1.65,0,-devices.headYaw);const views=['left','right'].map((eye,i)=>({eye,projectionMatrix:projection,transform:transform(devices.headX+(i?.032:-.032),1.65,0,-devices.headYaw)}));
   fn(t,{session:this,getViewerPose:()=>({transform:h,views}),getPose:space=>({transform:transform(space.hand==='right'?.23:-.23,1.35,-.35),emulatedPosition:false,linearVelocity:null,angularVelocity:null})});
  });}
  cancelAnimationFrame(id){window.cancelAnimationFrame(id);}
  async end(){this.ended=true;this.dispatchEvent(new Event('end'));}
 }
 const xr=new EventTarget();xr.isSessionSupported=async mode=>mode==='immersive-vr';xr.requestSession=async()=>{if(devices.deny)throw new DOMException('Test refusal','NotAllowedError');const s=new Session();devices.session=s;return s;};
 Object.defineProperty(navigator,'xr',{value:xr,configurable:true});
 for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type)type.prototype.makeXRCompatible=async()=>{};
 window.XRWebGLBinding=undefined;window.XRWebGLLayer=class{constructor(session,gl){this.framebuffer=null;this.framebufferWidth=960;this.framebufferHeight=640;this.ignoreDepthValues=false;this.fixedFoveation=0;}getViewport(view){return {x:view.eye==='left'?0:480,y:0,width:480,height:640};}};
 window.TestXR={devices,button(hand,index,value){const p=devices.session.inputSources.find(s=>s.handedness===hand).gamepad;p.buttons[index]={pressed:value,touched:value,value:value?1:0};},axes(hand,a){devices.session.inputSources.find(s=>s.handedness===hand).gamepad.axes=a;},hidden(value){devices.session.visibilityState=value?'hidden':'visible';devices.session.dispatchEvent(new Event('visibilitychange'));}};
})();
