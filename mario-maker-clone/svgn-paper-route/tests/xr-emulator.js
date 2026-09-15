/* TEST ONLY: deterministic WebXR hardware facade. No game-state assignments.
 * Exercises the real Three XRManager, stereo render target and native input events.
 * It is not a physical Quest, tracking-quality or performance qualification.
 */
(()=>{
 const matrix=(x=0,y=0,z=0)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1];
 const transform=m=>({matrix:new Float32Array(m),position:{x:m[12],y:m[13],z:m[14],w:1},orientation:{x:0,y:0,z:0,w:1}});
 const projection=()=>{const n=.05,f=30,s=1.55,a=550/800;return new Float32Array([s/a,0,0,0,0,s,0,0,0,0,-(f+n)/(f-n),-1,0,0,-2*f*n/(f-n),0]);};
 const event=(type,values)=>Object.assign(new Event(type),values);
 function controller(handedness,hand=false){const targetRaySpace={m:matrix(handedness==='left'?-.25:.25,1.25,-.2)},gripSpace={m:targetRaySpace.m.slice()},source={handedness,targetRayMode:'tracked-pointer',targetRaySpace,gripSpace,profiles:hand?['generic-hand-select']:['oculus-touch-v3'],gamepad:hand?null:{mapping:'xr-standard',buttons:Array.from({length:6},()=>({pressed:false,touched:false,value:0})),axes:[0,0,0,0]}};
  if(hand){source.hand=new Map();const names=['wrist',...['thumb','index-finger','middle-finger','ring-finger','pinky-finger'].flatMap((finger,i)=>(i?['metacarpal','phalanx-proximal','phalanx-intermediate','phalanx-distal','tip']:['metacarpal','phalanx-proximal','phalanx-distal','tip']).map(j=>finger+'-'+j))];names.forEach((jointName,i)=>source.hand.set(jointName,{jointName,m:matrix(targetRaySpace.m[12]+(i%5)*.014,1.22+Math.floor(i/5)*.014,-.23)}));}
  return source;
 }
 class Session extends EventTarget{
  constructor(){super();this.inputSources=[controller('left'),controller('right')];this.visibilityState='visible';this.enabledFeatures=['hand-tracking'];this.renderState={depthNear:.05,depthFar:30};this.active=true;this.pending=new Set();this.environmentBlendMode='opaque';this.interactionMode='world-space';}
  requestReferenceSpace(){return Promise.resolve(Object.assign(new EventTarget(),{getOffsetReferenceSpace(){return this;}}));}
  updateRenderState(state){Object.assign(this.renderState,state);}
  requestAnimationFrame(fn){const id=requestAnimationFrame(time=>{this.pending.delete(id);if(this.active)fn(time,this.frame());});this.pending.add(id);return id;}
  cancelAnimationFrame(id){cancelAnimationFrame(id);this.pending.delete(id);}
  frame(){const self=this;return {session:self,getViewerPose(){const views=['left','right'].map((eye,i)=>({eye,transform:transform(matrix(i?.032:-.032,1.6,0)),projectionMatrix:projection()}));return {transform:transform(matrix(0,1.6,0)),views,emulatedPosition:false};},getPose(space){return space?.m?{transform:transform(space.m),emulatedPosition:false}:null;},getJointPose(space){return space?.m?{transform:transform(space.m),radius:.006}:null;}};}
  end(){if(!this.active)return Promise.resolve();this.active=false;for(const id of this.pending)cancelAnimationFrame(id);this.pending.clear();this.dispatchEvent(new Event('end'));return Promise.resolve();}
 }
 class Layer{
  constructor(session,gl){this.framebufferWidth=1100;this.framebufferHeight=800;this.ignoreDepthValues=false;this.fixedFoveation=0;this.context=gl;this.framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuffer);const color=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,color);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1100,800,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1100,800);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Emulator framebuffer incomplete');gl.bindFramebuffer(gl.FRAMEBUFFER,null);window.xrEmulator.layer=this;session.addEventListener('end',()=>setTimeout(()=>{gl.deleteTexture(color);gl.deleteRenderbuffer(depth);gl.deleteFramebuffer(this.framebuffer);},1000),{once:true});}
  getViewport(view){return {x:view.eye==='left'?0:550,y:0,width:550,height:800};}
  static getNativeFramebufferScaleFactor(){return 1;}
 }
 Object.defineProperty(window,'XRWebGLLayer',{configurable:true,value:Layer});Object.defineProperty(window,'XRWebGLBinding',{configurable:true,value:undefined});
 for(const kind of ['WebGLRenderingContext','WebGL2RenderingContext'])if(window[kind])window[kind].prototype.makeXRCompatible=async()=>{};
 const xr=new EventTarget();xr.isSessionSupported=async()=>true;xr.requestSession=async(type,options)=>{window.xrEmulator.request={type,options};if(window.xrEmulator.deny)throw new DOMException('Test user denied XR','NotAllowedError');return window.xrEmulator.session=new Session();};Object.defineProperty(navigator,'xr',{configurable:true,value:xr});
 window.xrEmulator={session:null,layer:null,request:null,deny:false,
  button(handedness,index,pressed){const s=this.session.inputSources.find(s=>s.handedness===handedness);s.gamepad.buttons[index]={pressed,touched:pressed,value:pressed?1:0};},
  axis(value){this.session.inputSources.find(s=>s.handedness==='left').gamepad.axes[2]=value;},
  hands(){const removed=this.session.inputSources;this.session.inputSources=[controller('left',true),controller('right',true)];this.session.dispatchEvent(event('inputsourceschange',{added:this.session.inputSources,removed}));},
  disconnect(){const removed=this.session.inputSources;this.session.inputSources=[];this.session.dispatchEvent(event('inputsourceschange',{added:[],removed}));},
  visibility(value){this.session.visibilityState=value;this.session.dispatchEvent(new Event('visibilitychange'));},
  async point(label,handedness='right'){
   const d=SkyCycleXR.diagnostics,r=d.buttons.find(r=>r.label.toLowerCase().includes(label.toLowerCase()));if(!r)throw Error('XR target absent: '+label+' in '+d.buttons.map(r=>r.label).join(','));
   const T=await import('../vendor/three.webgpu.js');const target=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.5,(.5-(r.y+r.h/2)/900)*1.125,0).applyMatrix4(new T.Matrix4().fromArray(d.uiMatrix));
   const s=this.session.inputSources.find(s=>s.handedness===handedness),origin=new T.Vector3(handedness==='left'?-.2:.2,1.3,-.25),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());s.targetRaySpace.m=new T.Matrix4().compose(origin,q,new T.Vector3(1,1,1)).toArray();return r.label;
  },
  select(phase='start',handedness='right'){const source=this.session.inputSources.find(s=>s.handedness===handedness);this.session.dispatchEvent(event('select'+phase,{inputSource:source,frame:this.session.frame()}));},
  image(){const l=this.layer,gl=l.context,old=gl.getParameter(gl.FRAMEBUFFER_BINDING);gl.bindFramebuffer(gl.FRAMEBUFFER,l.framebuffer);const data=new Uint8Array(1100*800*4);gl.readPixels(0,0,1100,800,gl.RGBA,gl.UNSIGNED_BYTE,data);gl.bindFramebuffer(gl.FRAMEBUFFER,old);const c=document.createElement('canvas');c.width=1100;c.height=800;const cx=c.getContext('2d'),img=cx.createImageData(1100,800);for(let y=0;y<800;y++)img.data.set(data.subarray(y*4400,(y+1)*4400),(799-y)*4400);cx.putImageData(img,0,0);return c.toDataURL();}
 };
})();
