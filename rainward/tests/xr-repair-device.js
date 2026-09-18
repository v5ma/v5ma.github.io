/* Explicit test device: real compositor attachments, artificial tracking.
 * Physical grip orientation is intentionally 65 degrees off the pointing ray. */
(()=>{
 const d=questDevice,path=window.REPAIR_LAYER||'projection';d.layerPath=path;d.captures=[];
 function transform(p,q){const {x,y,z,w}=q,xx=x+x,yy=y+y,zz=z+z;return {position:new DOMPointReadOnly(p.x,p.y,p.z,1),orientation:new DOMPointReadOnly(x,y,z,w),matrix:new Float32Array([1-y*yy-z*zz,x*yy+w*zz,x*zz-w*yy,0,x*yy-w*zz,1-x*xx-z*zz,y*zz+w*xx,0,x*zz+w*yy,y*zz-w*xx,1-x*xx-y*yy,0,p.x,p.y,p.z,1])};}
 function attachments(gl,depthFormat){const old=gl.getParameter(gl.FRAMEBUFFER_BINDING),tex=gl.getParameter(gl.TEXTURE_BINDING_2D),fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
  function texture(format){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,format,960,640);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;}
  const color=texture(gl.RGBA8),depth=depthFormat?texture(depthFormat):null;gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);if(depth)gl.framebufferTexture2D(gl.FRAMEBUFFER,depthFormat===gl.DEPTH24_STENCIL8?gl.DEPTH_STENCIL_ATTACHMENT:gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);const complete=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindTexture(gl.TEXTURE_2D,tex);gl.bindFramebuffer(gl.FRAMEBUFFER,old);d.layer={gl,fbo,color,depth,complete};return d.layer;
 }
 const view=v=>({x:v.eye==='left'?0:480,y:0,width:480,height:640});
 if(path==='projection')window.XRWebGLBinding=class {constructor(session,gl){this.gl=gl;}createProjectionLayer(init){const a=attachments(this.gl,init.depthFormat);this.a=a;return {textureWidth:960,textureHeight:640,ignoreDepthValues:true,fixedFoveation:0};}getViewSubImage(layer,v){return {colorTexture:this.a.color,depthStencilTexture:this.a.depth,viewport:view(v)};}};
 else{window.XRWebGLBinding=undefined;window.XRWebGLLayer=class{constructor(session,gl){this.framebuffer=attachments(gl,gl.DEPTH_COMPONENT24).fbo;this.framebufferWidth=960;this.framebufferHeight=640;this.ignoreDepthValues=false;this.fixedFoveation=0;}getViewport(v){return view(v);}};}
 const original=navigator.xr.requestSession.bind(navigator.xr);navigator.xr.requestSession=async(...args)=>{const session=await original(...args),raf=session.requestAnimationFrame.bind(session);session.requestAnimationFrame=cb=>raf((t,frame)=>{
   const pose=frame.getPose.bind(frame);frame.getPose=space=>{const src=space?.owner;if(space===src?.gripSpace&&src.tracked){const a=65*Math.PI/360,q=src.gripOrientation||{x:Math.sin(a),y:0,z:0,w:Math.cos(a)};return {transform:transform(src.position,q),emulatedPosition:false};}return pose(space);};
   cb(t,frame);
   if(d.captureRequested&&d.layer){const {gl,fbo,complete}=d.layer,label=d.captureRequested;d.captureRequested=null;const old=gl.getParameter(gl.FRAMEBUFFER_BINDING);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);const pixels=new Uint8Array(960*640*4);gl.readPixels(0,0,960,640,gl.RGBA,gl.UNSIGNED_BYTE,pixels);gl.bindFramebuffer(gl.FRAMEBUFFER,old);
    const eyes=[];for(let eye=0;eye<2;eye++){let solid=0,transparent=0,colorful=0;for(let y=0;y<640;y+=4)for(let x=eye*480;x<(eye+1)*480;x+=4){const i=(y*960+x)*4;solid+=pixels[i+3]>200;transparent+=pixels[i+3]<10;colorful+=Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>15;}eyes.push({solid,transparent,colorful,samples:19200});}
    const c=document.createElement('canvas');c.width=960;c.height=640;const ctx=c.getContext('2d'),image=ctx.createImageData(960,640);for(let y=0;y<640;y++)image.data.set(pixels.subarray(y*960*4,(y+1)*960*4),(639-y)*960*4);ctx.putImageData(image,0,0);d.captures.push({label,path,complete,eyes,png:c.toDataURL('image/png')});
   }
  });return session;};
})();
