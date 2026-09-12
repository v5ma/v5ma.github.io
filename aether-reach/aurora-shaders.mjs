/* Original Aurora materials. All shader inputs are presentation-only.
 * Bounded WebGL paths; no scene capture, transmission pass or state mutation. */
import * as T from './vendor/three.module.js';
export function castBudget(mode='balanced',xr=false){
 const light=xr||mode==='low';return Object.freeze({actors:xr?3:light?5:10,distance:xr?28:light?40:65,animatedHz:xr?20:light?24:60,clothRim:!light,rifts:!light,clouds:!light});
}
export function makeRiftVeil(){return new T.ShaderMaterial({name:'Aurora / rift interference',transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,blending:T.AdditiveBlending,
 uniforms:{time:{value:0},tint:{value:new T.Color('#83ecdc')},strength:{value:1}},
 vertexShader:`varying vec3 localPosition;varying vec3 viewNormal;varying vec3 viewPosition;
 void main(){localPosition=position;vec4 p=modelViewMatrix*vec4(position,1.0);viewNormal=normalize(normalMatrix*normal);viewPosition=-p.xyz;gl_Position=projectionMatrix*p;}`,
 fragmentShader:`uniform float time;uniform vec3 tint;uniform float strength;varying vec3 localPosition;varying vec3 viewNormal;varying vec3 viewPosition;
 void main(){vec3 n=normalize(viewNormal);float rim=pow(1.0-abs(dot(n,normalize(viewPosition))),2.5);
 vec3 grid=abs(fract(localPosition*12.0)-.5);float line=1.0-smoothstep(.025,.060,min(grid.x,min(grid.y,grid.z)));
 float band=pow(.5+.5*sin(localPosition.y*28.0-time*.8),12.0);
 float opacity=(.07+rim*.38+line*.06+band*.08)*strength;
 gl_FragColor=vec4(tint*(.72+rim*.25),opacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
export function fabricMaterial(source,{accent='#87c4c3'}={}){
 // Retain source maps, colors, normals, alpha and skinning support.
 const mat=source.clone();mat.name='Aurora fabric / '+source.name;mat.roughness=Math.max(.68,source.roughness??.8);mat.metalness=Math.min(.2,source.metalness??0);mat.envMapIntensity=.65;
 const rim={value:.025},tint={value:new T.Color(accent)};
 mat.onBeforeCompile=shader=>{shader.uniforms.auroraRim=rim;shader.uniforms.auroraTint=tint;
  shader.fragmentShader='uniform float auroraRim;uniform vec3 auroraTint;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight += auroraTint * auroraRim * pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);\n#include <opaque_fragment>`);
 };
 mat.customProgramCacheKey=()=> 'aether-aurora-fabric-v1';
 mat.userData.auroraRim=rim;
 return mat;
}
export function installAuroraAtmosphere({scene}){
 // A far, sky-only layer: depth-tested, no occlusion of islands, people or sights.
 const mat=new T.ShaderMaterial({name:'Aurora / high cloud silk',side:T.BackSide,transparent:true,depthWrite:false,depthTest:true,
  uniforms:{time:{value:0}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float time;varying vec3 direction;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  void main(){vec3 d=normalize(direction);float height=smoothstep(.06,.28,d.y)*(1.-smoothstep(.7,.95,d.y));
   vec2 p=d.xz/max(.15,d.y)*3.+vec2(time*.005,time*.002);float n=noise(p)*.55+noise(p*2.03+8.)*.30+noise(p*4.1)*.15;
   float wisps=smoothstep(.54,.77,n)*height;gl_FragColor=vec4(vec3(.86,.91,.92),wisps*.21);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const dome=new T.Mesh(new T.SphereGeometry(795,24,16),mat);dome.name='Aurora high cloud layer';dome.frustumCulled=false;dome.renderOrder=1;scene.add(dome);let time=0;
 function update(dt,{mode='balanced',xr=false,reduced=false,enabled=true}={}){const budget=castBudget(mode,xr);dome.visible=enabled&&budget.clouds;if(!reduced)time+=Math.max(0,Math.min(dt,.1));mat.uniforms.time.value=reduced?0:time;}
 return{update,stats:()=>({cloudLayer:dome.visible,clock:mat.uniforms.time.value}),dispose(){scene.remove(dome);dome.geometry.dispose();mat.dispose();}};
}
