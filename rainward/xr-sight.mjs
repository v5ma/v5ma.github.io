import * as T from './vendor/three.module.js';
/* Small magnified sight: never changes headset FOV, muzzle or ammunition. */
export function createXRSight(){
 const target=new T.WebGLRenderTarget(256,256,{depthBuffer:true,stencilBuffer:false}),camera=new T.PerspectiveCamera(18,1,.05,160),group=new T.Group();group.name='Optional magnified weapon sight';
 const lens=new T.Mesh(new T.PlaneGeometry(.145,.145),new T.ShaderMaterial({uniforms:{image:{value:target.texture}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
  vertexShader:'varying vec2 lensUV;void main(){lensUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform sampler2D image;varying vec2 lensUV;void main(){vec2 p=lensUV-.5;if(length(p)>.49)discard;vec3 c=texture2D(image,lensUV).rgb;if((abs(p.x)<.005&&abs(p.y)>.045)||(abs(p.y)<.005&&abs(p.x)>.045))c=vec3(.14,.22,.18);gl_FragColor=vec4(c,1.);}'}));
 lens.renderOrder=10000;group.add(lens);group.position.set(0,.12,-.16);group.visible=false;let active=false,draws=0,last=-Infinity,lastScene=null,sceneDraws=0;
 function render(renderer,scene,rig,hero,origin,direction,t,enabled){
  if(scene!==lastScene||t<last){lastScene=scene;last=-Infinity;sceneDraws=0;}active=!!enabled;group.visible=active;if(!active||t-last<1/30)return;last=t;camera.position.copy(origin);camera.lookAt(origin.clone().add(direction));camera.updateMatrixWorld();
  const old={xr:renderer.xr.enabled,target:renderer.getRenderTarget(),auto:renderer.autoClear,viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),test:renderer.getScissorTest(),rig:rig.visible,hero:hero.visible};
  try{rig.visible=false;hero.visible=false;renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setViewport(0,0,256,256);renderer.setScissorTest(false);renderer.render(scene,camera);draws++;sceneDraws++;}
  finally{renderer.setRenderTarget(old.target);renderer.setViewport(old.viewport);renderer.setScissor(old.scissor);renderer.setScissorTest(old.test);renderer.autoClear=old.auto;renderer.xr.enabled=old.xr;rig.visible=old.rig;hero.visible=old.hero;}
 }
 return {group,render,reset(){last=-Infinity;lastScene=null;sceneDraws=0;active=false;group.visible=false;},stats:()=>({active,draws,sceneDraws,size:256,headsetFovChanged:false,origin:camera.position.toArray(),direction:camera.getWorldDirection(new T.Vector3()).toArray()}),dispose(){target.dispose();group.removeFromParent();lens.geometry.dispose();lens.material.dispose();}};
}
