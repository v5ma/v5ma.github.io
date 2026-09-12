/* Original GLSL additions to pinned Three.js r177 materials. Hooks retain
 * their earlier shader customizations and never replace the renderer. */
export const SURFACE_VERTEX=`
 varying vec3 vAtmosphereWorld;
 vec3 atmosphereWorld(vec3 p){vec4 w=vec4(p,1.);
 #ifdef USE_INSTANCING
 w=instanceMatrix*w;
 #endif
 return (modelMatrix*w).xyz;}
`;
export const SURFACE_FRAGMENT=`
 varying vec3 vAtmosphereWorld;
 uniform float uAtmosphereTime,uAtmosphereWet,uAtmosphereRipples,uAtmosphereNight,uAtmosphereAmount;
 uniform vec3 uAtmosphereSun;
 float aHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float aNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(aHash(i),aHash(i+vec2(1.,0.)),f.x),mix(aHash(i+vec2(0.,1.)),aHash(i+1.),f.x),f.y);}
 vec3 aWeights(vec3 p){vec3 w=pow(abs(normalize(p)),vec3(6.));return w/max(.0001,w.x+w.y+w.z);}
 float aPuddle(vec3 p){vec3 w=aWeights(p);return smoothstep(.39,.65,aNoise(p.yz*.42)*w.x+aNoise(p.xz*.42)*w.y+aNoise(p.xy*.42)*w.z);}
 float aRing(vec2 p){p*=1.2;vec2 cell=floor(p),f=fract(p)-.5;float seed=aHash(cell);f-=(vec2(seed,aHash(cell+13.))-.5)*.24;float age=fract(uAtmosphereTime*.65+seed);float d=length(f);float radius=age*.58;float band=exp(-abs(d-radius)*43.);return sin((d-radius)*75.)*band*(1.-age)*smoothstep(0.,.07,age);}
 float aRipple(vec3 p){vec3 w=aWeights(p);return aRing(p.yz)*w.x+aRing(p.xz)*w.y+aRing(p.xy)*w.z;}
`;
export const LEAF_VERTEX=`
 uniform float uAtmosphereTime,uAtmosphereWind;
 vec3 aBend(vec3 p){
  vec3 world=atmosphereWorld(p);float phase=dot(world,vec3(.071,.039,.053));
  float tip=clamp(abs(p.y)*.18+length(p.xz)*.09,0.,1.);
  p.x+=sin(uAtmosphereTime*1.25+phase)*tip*.18*uAtmosphereWind;
  p.z+=sin(uAtmosphereTime*.87+phase*1.7)*tip*.095*uAtmosphereWind;return p;}
`;
const replace=(source,anchor,value)=>{if(!source.includes(anchor))throw Error('Atmosphere shader anchor not found: '+anchor);return source.replace(anchor,value);};
export function patchSurfaceShader(shader,role){
 shader.vertexShader=replace(shader.vertexShader,'#include <common>','#include <common>\n'+SURFACE_VERTEX+(role==='leaf'?LEAF_VERTEX:''));
 shader.vertexShader=replace(shader.vertexShader,'#include <begin_vertex>','#include <begin_vertex>\n'+(role==='leaf'?'transformed=aBend(transformed);':'')+'\nvAtmosphereWorld=atmosphereWorld(transformed);');
 shader.fragmentShader=replace(shader.fragmentShader,'#include <common>','#include <common>\n'+SURFACE_FRAGMENT);
 if(role==='road'||role==='paving'){
  shader.fragmentShader=replace(shader.fragmentShader,'#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float atmosphereWet=0.;if(uAtmosphereWet>.001)atmosphereWet=uAtmosphereWet*${role==='paving'?'.4':'1.'}*aPuddle(vAtmosphereWorld);
   diffuseColor.rgb*=1.-atmosphereWet*.34;
   roughnessFactor=mix(roughnessFactor,.14,atmosphereWet*.92);`);
  shader.fragmentShader=replace(shader.fragmentShader,'#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   if(uAtmosphereRipples>.001&&atmosphereWet>.05){
    float h=aRipple(vAtmosphereWorld)*uAtmosphereRipples*atmosphereWet;
    vec3 q0=dFdx(vViewPosition),q1=dFdy(vViewPosition);
    vec3 c0=cross(q1,normal),c1=cross(normal,q0);
    normal=normalize(normal+(dFdx(h)*c0+dFdy(h)*c1)*(.023/max(abs(dot(q0,c0)),.00001)));
   }`);
 }else if(role==='leaf'){
  shader.fragmentShader=replace(shader.fragmentShader,'#include <opaque_fragment>',`
   float backlight=pow(max(0.,dot(normalize(cameraPosition-vAtmosphereWorld),-uAtmosphereSun)),3.);
   outgoingLight+=diffuseColor.rgb*vec3(.65,.85,.3)*(.08+.20*backlight)*uAtmosphereAmount*(1.-uAtmosphereNight*.8);
   #include <opaque_fragment>`);
 }else if(role==='window'){
  shader.fragmentShader=replace(shader.fragmentShader,'#include <opaque_fragment>',`
   float lit=mix(.32,1.,step(.25,aHash(floor(vAtmosphereWorld.xz*.22))));
   outgoingLight+=vec3(1.,.48,.13)*uAtmosphereNight*lit*.75;
   #include <opaque_fragment>`);
 }
 return shader;
}
export function patchLeafDepth(shader){
 shader.vertexShader=replace(shader.vertexShader,'#include <common>','#include <common>\n'+SURFACE_VERTEX+LEAF_VERTEX);
 shader.vertexShader=replace(shader.vertexShader,'#include <begin_vertex>','#include <begin_vertex>\ntransformed=aBend(transformed);');return shader;
}
export function patchSky(shader){
 shader.fragmentShader=replace(shader.fragmentShader,'uniform float photographic;','uniform float photographic;uniform float uSkyNight,uSkyWarm,uSkyBrightness,uSkyAmount;');
 shader.fragmentShader=replace(shader.fragmentShader,'#include <colorspace_fragment>',`
   float horizonGlow=exp(-abs(h-.08)*3.2);
   vec3 c=gl_FragColor.rgb;float gray=dot(c,vec3(.2126,.7152,.0722));
   c=mix(c,vec3(gray)*vec3(.66,.82,1.08),uSkyNight*.68);
   c*=mix(vec3(1.),vec3(1.18,.91,.70),uSkyWarm*.65);
   c=mix(c,vec3(.88,.34,.105),horizonGlow*uSkyWarm*.34);
   c*=uSkyBrightness;gl_FragColor.rgb=c;
   #include <colorspace_fragment>`);return shader;
}
