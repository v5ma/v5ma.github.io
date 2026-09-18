/* Original playable pool material. Real scene-colour refraction, procedural
 * Fresnel sky reflection and moving floor caustics. One reusable render target;
 * no downloaded texture, reference image, additional light or audio source. */
import * as T from './vendor/three.module.js';
import {POOL,insidePool,waterGround,waterDepth} from './cistern-core.mjs';
const tileVertex=`varying vec3 vWorld; varying vec3 vNormal;
void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`;
const tileFragment=`uniform float clock;uniform float level;varying vec3 vWorld;varying vec3 vNormal;
void main(){vec3 n=abs(vNormal);vec2 p=n.y>.5?vWorld.xz:(n.x>.5?vWorld.zy:vWorld.xy);
vec2 tile=fract(p*1.55);float border=min(min(tile.x,1.-tile.x),min(tile.y,1.-tile.y));
float grout=1.-smoothstep(.015,.04,border);float age=.97+.03*sin(floor(p.x*1.55)*7.1+floor(p.y*1.55)*9.2);
vec3 colour=mix(vec3(.38,.52,.49)*age,vec3(.17,.24,.235),grout);
float depth=max(0.,level-vWorld.y);float a=sin(vWorld.x*2.5+sin(vWorld.z*1.8+clock*.3)+clock*.6);float b=sin(vWorld.z*3.2+sin(vWorld.x*2.-clock*.25)-clock*.4);
float caustic=pow(max(0.,1.-abs(a+b)*.48),14.);colour+=vec3(.28,.37,.30)*caustic*min(1.,depth*3.)*exp(-depth*.3);
colour*=.84+.16*max(vNormal.y,0.);gl_FragColor=vec4(colour,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const waterVertex=`uniform float clock;varying vec3 vWorld;varying vec4 vClip;
void main(){vec3 p=position;float w=.018*sin(p.x*1.1+clock*.85)+.012*sin(p.z*1.7-clock*.7);p.y+=w;
vWorld=(modelMatrix*vec4(p,1.)).xyz;vClip=projectionMatrix*viewMatrix*vec4(vWorld,1.);gl_Position=vClip;}`;
const waterFragment=`uniform sampler2D behind;uniform float clock;uniform float depth;uniform vec2 sourceSize;uniform float hasSource;varying vec3 vWorld;varying vec4 vClip;
void main(){vec3 n=normalize(vec3(-.02*cos(vWorld.x*1.1+clock*.85),1.,-.025*cos(vWorld.z*1.7-clock*.7)));
vec3 eye=normalize(cameraPosition-vWorld);float fresnel=.035+.72*pow(1.-max(0.,dot(eye,n)),4.);
vec2 uv=vClip.xy/vClip.w*.5+.5;vec2 offset=n.xz*.07*min(depth,2.);
vec2 edge=1.5/sourceSize;vec3 through=texture2D(behind,clamp(uv+offset,edge,1.-edge)).rgb;
through=mix(vec3(.23,.38,.36),through,hasSource);vec3 absorption=exp(-vec3(.38,.12,.16)*depth);
through=through*absorption+vec3(.075,.22,.195)*(1.-absorption);
vec3 reflected=mix(vec3(.29,.37,.43),vec3(.55,.66,.7),clamp(eye.y,0.,1.));
float glint=pow(max(dot(reflect(-normalize(vec3(-.3,1.,.25)),n),eye),0.),90.);
vec3 result=mix(through,reflected,fresnel)+vec3(.8,.71,.49)*glint*.45;
gl_FragColor=vec4(result,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export function carvePoolTerrain(geo){
 const pos=geo.attributes.position,index=geo.index.array,out=[];
 for(let i=0;i<index.length;i+=3){let x=0,z=0;for(let j=0;j<3;j++){x+=pos.getX(index[i+j])/3;z+=pos.getZ(index[i+j])/3;}if(!insidePool(x,z))out.push(index[i],index[i+1],index[i+2]);}
 geo.setIndex(out);return geo;
}
export function createCisternArt(root){
 const group=new T.Group();group.name='Stillwater tiled hydraulic cistern';root.add(group);
 const uniform={clock:{value:0},level:{value:POOL.high}},tiles=new T.ShaderMaterial({uniforms:uniform,vertexShader:tileVertex,fragmentShader:tileFragment,side:T.DoubleSide});
 function box(x,y,z,w,h,d){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),tiles);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 box(POOL.x,POOL.bottom-.12,POOL.z,POOL.hx*2,.24,POOL.hz*2);
 for(const side of[-1,1])box(POOL.x+side*POOL.hx,-.9,POOL.z,.3,2.35,POOL.hz*2+.3);
 box(POOL.x,-.9,40,POOL.hx*2,.0+2.35,.3);
 for(const side of[-1,1])box(POOL.x+side*(POOL.hx+1.85)/2,-.9,20,POOL.hx-1.85,2.35,.3);
 // The southern ramp has the same footprint/slope as the navigation reducer.
 const ramp=new T.BufferGeometry();ramp.setAttribute('position',new T.Float32BufferAttribute([POOL.x-1.85,0,20,POOL.x+1.85,0,20,POOL.x+1.85,-2,26,POOL.x-1.85,0,20,POOL.x+1.85,-2,26,POOL.x-1.85,-2,26],3));ramp.computeVertexNormals();group.add(new T.Mesh(ramp,tiles));
 // Dry rim and readable brass wheels stay accessible at every water level.
 const stone=new T.MeshStandardMaterial({color:'#c1b8a0',roughness:.88}),brass=new T.MeshStandardMaterial({color:'#b09b6e',metalness:.5,roughness:.4});
 const deck=new T.Mesh(new T.BoxGeometry(8,.2,3.5),stone);deck.position.set(POOL.x,.0,17);group.add(deck);
 const wheels=[];for(let i=0;i<3;i++){const wheel=new T.Mesh(new T.TorusGeometry(.3,.055,7,24),brass);wheel.position.set(POOL.x-1.3+i*1.3,1.1,17.8);group.add(wheel);const spoke=new T.Mesh(new T.BoxGeometry(.55,.06,.08),brass);wheel.add(spoke);wheels.push(wheel);}
 const target=new T.WebGLRenderTarget(1,1,{type:T.UnsignedByteType,depthBuffer:true});target.texture.name='Cistern scene-colour refraction';target.texture.colorSpace=T.NoColorSpace;
 const mat=new T.ShaderMaterial({uniforms:{behind:{value:target.texture},clock:{value:0},depth:{value:2},sourceSize:{value:new T.Vector2(1,1)},hasSource:{value:0}},vertexShader:waterVertex,fragmentShader:waterFragment,side:T.DoubleSide});
 const plane=new T.PlaneGeometry(POOL.hx*2-.3,POOL.hz*2-.3,28,28);plane.rotateX(-Math.PI/2);const surface=new T.Mesh(plane,mat);surface.position.set(POOL.x,POOL.high,POOL.z);surface.renderOrder=2;group.add(surface);
 let last={active:false,passes:0,size:0},allocated=0;const viewport=new T.Vector4(),scissor=new T.Vector4();
 function update(s){const c=s.frontier.cistern;uniform.clock.value=mat.uniforms.clock.value=s.time;uniform.level.value=surface.position.y=c.surface;mat.uniforms.depth.value=Math.max(.05,c.surface-POOL.bottom);wheels.forEach((w,i)=>{w.rotation.z=c.mask&(1<<i)?Math.PI/2:0;});}
 function render(s,scene,camera,renderer,quality){
  update(s);const near=Math.hypot(s.x-POOL.x,s.z-POOL.z)<65;
  last={active:near,passes:0,size:allocated,phase:s.frontier.cistern.phase,surface:s.frontier.cistern.surface,depth:waterDepth(s),actorGround:waterGround(s.x,s.z,0),refraction:'scene colour',reflection:'procedural Fresnel environment',caustics:true};
  if(renderer.xr.isPresenting){mat.uniforms.hasSource.value=0;return;}
  if(!near)return;
  const width=quality==='low'?256:quality==='balanced'?512:768,height=Math.max(128,Math.round(width/camera.aspect));
  if(target.width!==width||target.height!==height){target.setSize(width,height);allocated=width;mat.uniforms.sourceSize.value.set(width,height);}
  const previous=renderer.getRenderTarget(),scissorTest=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);
  surface.visible=false;
  try{renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.clear();renderer.render(scene,camera);mat.uniforms.hasSource.value=1;last.passes=1;last.size=allocated;}
  finally{renderer.setRenderTarget(previous);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);surface.visible=true;}
 }
 return {render,inspect:()=>({...last}),group};
}
