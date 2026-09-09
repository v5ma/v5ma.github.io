/* Linear-HDR render target -> half-size depth AO -> quarter-size bloom ->
 * composite -> ONE tone/color conversion. Inspired by the documented Three.js
 * post-processing workflow; original shaders, no external runtime dependencies.
 * Fullscreen effects never process the DOM HUD, and are bypassed for XR. */
import * as T from './vendor/three.module.js';
const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const viewPosition=`vec3 positionAt(vec2 uv){float z=texture2D(tDepth,uv).r;vec4 q=invProjection*vec4(uv*2.-1.,z*2.-1.,1.);return q.xyz/q.w;}`;
export const aoFragment=`varying vec2 vUv;uniform sampler2D tDepth;uniform mat4 invProjection;uniform vec2 pixel;${viewPosition}
void main(){float d=texture2D(tDepth,vUv).r;if(d>.99999){gl_FragColor=vec4(1.);return;}vec3 p=positionAt(vUv);vec3 n=normalize(cross(dFdx(p),dFdy(p)));if(dot(n,-p)<0.)n=-n;
float sum=0.;float radius=clamp(150./max(1.,-p.z),2.,20.);
for(int i=0;i<12;i++){float a=float(i)*2.39996323;float r=radius*(.35+.65*float(i+1)/12.);vec2 uv=clamp(vUv+vec2(cos(a),sin(a))*r*pixel,pixel,vec2(1.)-pixel);vec3 v=positionAt(uv)-p;float len=length(v);float horizon=max(0.,dot(n,v/max(len,.001))-.09);sum+=horizon*(1.-smoothstep(.1,1.5,len));}
float ao=1.-clamp(sum/12.*2.2,0.,.50);gl_FragColor=vec4(vec3(ao),1.);}`;
const bloomFragment=`varying vec2 vUv;uniform sampler2D source;uniform vec2 delta;uniform float extract;
vec3 sampleGlow(vec2 q){vec3 c=texture2D(source,q).rgb;float l=max(c.r,max(c.g,c.b));return extract>.5?c*max(0.,l-1.20)/max(l,.001):c;}
void main(){vec3 c=sampleGlow(vUv)*.227027;c+=sampleGlow(vUv+delta*1.384615)*.316216;c+=sampleGlow(vUv-delta*1.384615)*.316216;c+=sampleGlow(vUv+delta*3.230769)*.070270;c+=sampleGlow(vUv-delta*3.230769)*.070270;gl_FragColor=vec4(c,1.);}`;
const compositeFragment=`varying vec2 vUv;uniform sampler2D source,tAO,tBloom,tDepth;uniform float bloomAmount,aoAmount;uniform vec2 pixel;uniform vec3 shadowTint,highlightTint;
void main(){vec3 c=texture2D(source,vUv).rgb;float ao=0.,weight=0.;float center=texture2D(tDepth,vUv).r;
for(int i=0;i<4;i++){vec2 o=vec2(float(i-2*(i/2)),float(i/2))-.5;vec2 q=vUv+o*pixel*2.;float d=texture2D(tDepth,q).r;float w=exp(-abs(d-center)*2200.);ao+=texture2D(tAO,q).r*w;weight+=w;}ao/=max(weight,.001);
c*=mix(1.,ao,aoAmount);c+=texture2D(tBloom,vUv).rgb*bloomAmount;float lum=dot(c,vec3(.2126,.7152,.0722));c*=mix(shadowTint,highlightTint,smoothstep(.02,1.8,lum));c=mix(vec3(lum),c,1.025);
float vignette=1.-.10*smoothstep(.22,.75,length((vUv-.5)*vec2(1.,.9)));gl_FragColor=vec4(max(vec3(0.),c*vignette),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export function effectSize(w,h,ratio=1){const scale=Math.min(Math.max(.25,ratio),1.5,1600/Math.max(1,w),1100/Math.max(1,h));return {width:Math.max(2,Math.round(w*scale)),height:Math.max(2,Math.round(h*scale))};}
export function createCinematic(renderer,scene,camera,chapter){
 let enabled=true,reduced=false,disposed=false,width=0,height=0,renders=0;const available=!!renderer.extensions.has('EXT_color_buffer_float');
 const target=new T.WebGLRenderTarget(2,2,{type:available?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true});target.depthTexture=new T.DepthTexture(2,2,T.UnsignedIntType);
 const ao=new T.WebGLRenderTarget(2,2,{depthBuffer:false});const bloomA=new T.WebGLRenderTarget(2,2,{type:target.texture.type,depthBuffer:false}),bloomB=bloomA.clone();
 const screen=new T.Scene(),quad=new T.Mesh(new T.PlaneGeometry(2,2),null),ortho=new T.OrthographicCamera(-1,1,1,-1,0,1);quad.frustumCulled=false;screen.add(quad);
 const material=(fragmentShader,uniforms,toneMapped=false)=>new T.ShaderMaterial({vertexShader:vertex,fragmentShader,uniforms,depthTest:false,depthWrite:false,toneMapped});
 const depthUniform={value:target.depthTexture},aoMat=material(aoFragment,{tDepth:depthUniform,invProjection:{value:camera.projectionMatrixInverse},pixel:{value:new T.Vector2(1,1)}});
 const blurMat=material(bloomFragment,{source:{value:target.texture},delta:{value:new T.Vector2()},extract:{value:1}});
 const finalMat=material(compositeFragment,{source:{value:target.texture},tAO:{value:ao.texture},tBloom:{value:bloomB.texture},tDepth:depthUniform,pixel:{value:new T.Vector2()},bloomAmount:{value:chapter.id==='terminus'?.24:.16},aoAmount:{value:.85},shadowTint:{value:new T.Vector3(.97,1.015,1.03)},highlightTint:{value:new T.Vector3(1.03,1.01,.97)}},true);
 function resize(w,h){const size=effectSize(w,h,renderer.getPixelRatio());if(size.width===width&&size.height===height)return;({width,height}=size);target.setSize(width,height);ao.setSize(Math.ceil(width/2),Math.ceil(height/2));bloomA.setSize(Math.ceil(width/4),Math.ceil(height/4));bloomB.setSize(bloomA.width,bloomA.height);aoMat.uniforms.pixel.value.set(1/width,1/height);finalMat.uniforms.pixel.value.set(1/width,1/height);}
 function pass(m,destination){quad.material=m;renderer.setRenderTarget(destination);renderer.clear();renderer.render(screen,ortho);}
 function render(){if(disposed)return;if(!enabled||reduced||!available||renderer.xr.isPresenting){renderer.render(scene,camera);return;}
  const before=renderer.getRenderTarget(),auto=renderer.autoClear;try{renderer.autoClear=true;renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);pass(aoMat,ao);blurMat.uniforms.source.value=target.texture;blurMat.uniforms.extract.value=1;blurMat.uniforms.delta.value.set(1/bloomA.width,0);pass(blurMat,bloomA);blurMat.uniforms.source.value=bloomA.texture;blurMat.uniforms.extract.value=0;blurMat.uniforms.delta.value.set(0,1/bloomA.height);pass(blurMat,bloomB);pass(finalMat,before);renders++;}finally{renderer.setRenderTarget(before);renderer.autoClear=auto;}}
 return {resize,render,set(value,low=false){enabled=!!value;reduced=!!low;},stats:()=>({enabled,active:enabled&&!reduced&&available&&!renderer.xr.isPresenting,available,width,height,renders,passes:5}),dispose(){if(disposed)return;disposed=true;for(const x of[target,ao,bloomA,bloomB,aoMat,blurMat,finalMat,quad.geometry])x.dispose();}};
}
