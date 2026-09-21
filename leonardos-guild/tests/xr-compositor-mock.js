/* Test hardware extension: real non-default WebGL framebuffer or projection
 * textures. Load AFTER xr-hardware-mock.js. Never changes game/renderer code. */
(()=>{
 const kind=globalThis.__compositorKind||'framebuffer',W=1280,H=800;
 const state=globalThis.__compositor={kind,captureNext:false,capture:null,frames:0,errors:[]};
 let gl=null,target=null,readTarget=null;
 function allocate(context,depthFormat){
  gl=context;const f=gl.getParameter(gl.FRAMEBUFFER_BINDING),t=gl.getParameter(gl.TEXTURE_BINDING_2D);
  function texture(internal,format,type){const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,internal,W,H,0,format,type,null);return tx;}
  const color=texture(gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE),depth=depthFormat===gl.DEPTH24_STENCIL8?texture(gl.DEPTH24_STENCIL8,gl.DEPTH_STENCIL,gl.UNSIGNED_INT_24_8):texture(gl.DEPTH_COMPONENT24,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT);
  const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,depthFormat===gl.DEPTH24_STENCIL8?gl.DEPTH_STENCIL_ATTACHMENT:gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Hardware fixture framebuffer incomplete');
  gl.bindTexture(gl.TEXTURE_2D,t);gl.bindFramebuffer(gl.FRAMEBUFFER,f);target={color,depth,fbo};readTarget=fbo;state.nonDefault=true;return target;
 }
 const OriginalLayer=window.XRWebGLLayer;
 class Layer extends OriginalLayer{constructor(session,context,options){super(session,context,options);this.framebuffer=allocate(context,context.DEPTH_COMPONENT24).fbo;this.framebufferWidth=W;this.framebufferHeight=H;}}
 class Binding{
  constructor(session,context){this.gl=context;}
  createProjectionLayer(options){allocate(this.gl,options.depthFormat);return {textureWidth:W,textureHeight:H,textureArrayLength:1,ignoreDepthValues:false,fixedFoveation:1};}
  getViewSubImage(layer,view){return {colorTexture:target.color,depthStencilTexture:target.depth,viewport:{x:view.eye==='left'?0:W/2,y:0,width:W/2,height:H},imageIndex:0};}
 }
 Object.defineProperty(window,'XRWebGLLayer',{value:Layer,configurable:true});
 Object.defineProperty(window,'XRWebGLBinding',{value:kind==='projection'?Binding:undefined,configurable:true});
 const request=navigator.xr.requestSession.bind(navigator.xr);
 navigator.xr.requestSession=async(...args)=>{
  const session=await request(...args),raf=session.requestAnimationFrame.bind(session);
  session.requestAnimationFrame=callback=>raf((now,frame)=>{
   callback(now,frame);state.frames++;
   if(!state.captureNext||!gl||!readTarget)return;state.captureNext=false;
   const old=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),pixels=new Uint8Array(W*H*4);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,readTarget);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,old);
   const error=gl.getError();if(error)state.errors.push(error);
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d'),image=ctx.createImageData(W,H);
   for(let y=0;y<H;y++)image.data.set(pixels.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);ctx.putImageData(image,0,0);state.capture=canvas.toDataURL('image/png');
  });return session;
 };
})();
