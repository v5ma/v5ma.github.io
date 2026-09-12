/* Original, bounded WebGL shaders. No simulation, network, or saved-progress writes. */
import * as T from './vendor/three.module.js';
export function skyglassBudget(mode='balanced',xr=false,enabled=true){
 const light=xr||mode==='low';return {cloudStrength:enabled&&!light?.13:0,riftMotion:enabled&&!light?1:0,castLimit:xr?4:light?6:12,castRange:xr?32:light?45:85};
}
export function makeRiftMaterial(){
 return new T.ShaderMaterial({name:'Skyglass / etched spectral rift',transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,fog:true,
  uniforms:{clock:{value:0},motion:{value:1},fogColor:{value:new T.Color()},fogNear:{value:1},fogFar:{value:2000}},
  vertexShader:`varying vec2 vEtch;varying vec3 vEye;varying vec3 vRim;varying vec3 vWorld;
   #include <fog_pars_vertex>
   void main(){vEtch=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);vEye=-mvPosition.xyz;vRim=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
   }`,
  fragmentShader:`uniform float clock;uniform float motion;varying vec2 vEtch;varying vec3 vEye;varying vec3 vRim;varying vec3 vWorld;
   #include <fog_pars_fragment>
   void main(){float edge=1.-smoothstep(.012,.075,min(min(vEtch.x,1.-vEtch.x),min(vEtch.y,1.-vEtch.y)));
    float fresnel=pow(1.-abs(dot(normalize(vEye),normalize(vRim))),3.);
    float ribbon=.5+.5*sin(vWorld.y*3.2+sin(vWorld.x*.55)+clock*.45*motion);
    float etch=pow(.5+.5*cos(vWorld.y*21.),20.)*.16;
    vec3 cyan=vec3(.18,.70,.68);vec3 gold=vec3(1.,.67,.27);
    vec3 tint=mix(cyan,gold,clamp((fresnel*.48+ribbon*.18)*motion,0.,.55));
    float alpha=.045+edge*.36+fresnel*.07+(ribbon*.035+etch)*motion;
    gl_FragColor=vec4(tint,clamp(alpha,0.,.55));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`});
}
const cloudGLSL=`
 uniform float skyClock;uniform float skyStrength;varying vec3 vSkyWorld;varying float vSkyTop;
 float skyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float skyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(skyHash(i),skyHash(i+vec2(1,0)),f.x),mix(skyHash(i+vec2(0,1)),skyHash(i+vec2(1,1)),f.x),f.y);}
`;
export function patchCloudShader(shader,clock,strength){
 if(!shader.vertexShader.includes('#include <project_vertex>')||!shader.fragmentShader.includes('#include <color_fragment>'))throw Error('Skyglass requires the pinned standard material chunks');
 shader.uniforms.skyClock=clock;shader.uniforms.skyStrength=strength;
 shader.vertexShader='varying vec3 vSkyWorld;varying float vSkyTop;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
  vSkyWorld=(modelMatrix*vec4(transformed,1.)).xyz;vSkyTop=max(0.,(modelMatrix*vec4(objectNormal,0.)).y);`);
 shader.fragmentShader=cloudGLSL+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  if(skyStrength>0. && vSkyTop>.5){vec2 drift=vSkyWorld.xz*.035+vec2(skyClock*.012,skyClock*.004);
   float cloud=skyNoise(drift)*.67+skyNoise(drift*2.1)*.33;
   diffuseColor.rgb*=1.-skyStrength*smoothstep(.32,.8,cloud);}`);
 return shader;
}
export function installCloudShade(decks){
 const clock={value:0},strength={value:.13},patched=new Map();let disposed=false,enabled=true,mode='balanced',xr=false;
 function attach(){if(disposed)return;for(const mesh of decks){if(!mesh.material?.isMeshStandardMaterial)continue;const old=patched.get(mesh);if(old&&mesh.material===old.material)continue;if(old)old.material.dispose();const original=mesh.material,material=original.clone();material.name=(original.name||'Paving')+' / cloud light';material.onBeforeCompile=s=>patchCloudShader(s,clock,strength);material.customProgramCacheKey=()=> 'aether-cloud-light-v1';mesh.material=material;patched.set(mesh,{original,material});}}
 attach();
 return {attach,setEnabled(v){enabled=!!v;},update(time,{reduced=false,quality='balanced',immersive=false}={}){mode=quality;xr=immersive;clock.value=reduced?0:Math.max(0,Number.isFinite(time)?time:0);strength.value=skyglassBudget(mode,xr,enabled).cloudStrength;},stats:()=>({enabled,mode,clock:clock.value,strength:strength.value,decks:patched.size}),dispose(){disposed=true;for(const [mesh,{original,material}]of patched){if(mesh.material===material)mesh.material=original;material.dispose();}patched.clear();}};
}
