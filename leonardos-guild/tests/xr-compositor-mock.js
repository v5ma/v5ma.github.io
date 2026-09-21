/* Test-only compositor attachments. Load AFTER xr-hardware-mock.js.
 * These are real GL framebuffer/texture objects, not the browser canvas.
 * Poses/buttons remain synthetic; no application source/state is changed. */
(()=>{
 const data=window.__xr,kind=window.__XR_ATTACHMENT||'framebuffer';
 let latest=null;
 function allocate(gl,depthFormat=gl.DEPTH_COMPONENT24){
  const previous={draw:gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),read:gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),texture:gl.getParameter(gl.TEXTURE_BINDING_2D)};
  const color=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,color);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,1280,800);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  const depth=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depth);gl.texStorage2D(gl.TEXTURE_2D,1,depthFormat||gl.DEPTH_COMPONENT24,1280,800);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,depthFormat===gl.DEPTH24_STENCIL8?gl.DEPTH_STENCIL_ATTACHMENT:gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
  const complete=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,previous.draw);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previous.read);gl.bindTexture(gl.TEXTURE_2D,previous.texture);
  if(!complete)throw Error('Test compositor framebuffer incomplete');
  const resource={gl,color,depth,framebuffer};latest=resource;
  data.compositor={kind,complete,nonDefault:true,width:1280,height:800,captures:0};return resource;
 }
 const viewport=view=>({x:view.eye==='left'?0:640,y:0,width:640,height:800});
 class Layer{
  constructor(session,gl){Object.assign(this,allocate(gl));this.framebufferWidth=1280;this.framebufferHeight=800;this.ignoreDepthValues=false;this.fixedFoveation=1;}
  getViewport(view){return viewport(view);}
 }
 class Binding{
  constructor(session,gl){this.session=session;this.gl=gl;}
  createProjectionLayer(options){
   if(options.textureType==='texture-array')throw Error('Test fixture covers side-by-side textures, not multiview');
   const resource=allocate(this.gl,options.depthFormat);
   return {textureWidth:1280,textureHeight:800,textureArrayLength:1,ignoreDepthValues:false,fixedFoveation:1,...resource};
  }
  getViewSubImage(layer,view){return {viewport:viewport(view),colorTexture:layer.color,depthStencilTexture:layer.depth,imageIndex:0};}
 }
 Object.defineProperty(window,'XRWebGLLayer',{configurable:true,value:Layer});
 Object.defineProperty(window,'XRWebGLBinding',{configurable:true,value:kind==='projection'?Binding:undefined});
 data.captureFrame=()=>{
  const {gl,framebuffer}=latest,old=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),pixels=new Uint8Array(1280*800*4);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER,framebuffer);gl.readPixels(0,0,1280,800,gl.RGBA,gl.UNSIGNED_BYTE,pixels);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,old);
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;const context=canvas.getContext('2d'),image=context.createImageData(1280,800);
  for(let y=0;y<800;y++)image.data.set(pixels.subarray(y*1280*4,(y+1)*1280*4),(799-y)*1280*4);
  context.putImageData(image,0,0);data.compositor.captures++;return canvas.toDataURL('image/png');
 };
})();
