/* Small local deformations, not simulation changes. Water/ripples remain inside
 * the authored shallow-water footprint. Wind bends blades from anchored roots.
 * The environment clock pauses with the game; reduced motion disables animation. */
import * as T from './vendor/three.module.js';
const waterDefs=`uniform float rwTime,rwMotion;uniform vec4 rwRipples[8];varying vec3 rwWaterPos;
float wave(vec2 p){float t=rwTime*rwMotion;float h=sin(p.x*2.1+t*1.5)*.016+sin(p.y*3.3-t*1.1+p.x)*.012;
for(int i=0;i<8;i++){float age=rwTime-rwRipples[i].z;float d=length(p-rwRipples[i].xy);if(age>0.&&age<3.&&rwRipples[i].w>0.){float ring=d-age*1.6;h+=sin(ring*15.)*exp(-ring*ring*7.)*exp(-age)*rwRipples[i].w*.035*rwMotion;}}return h;}`;
export function animateWater(material,clock,ripples,kind='water'){
 if(material.userData.rwWater)return material;material.userData.rwWater=true;const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();material.customProgramCacheKey=()=>key+'/rainward-water-6';
 material.onBeforeCompile=s=>{previous(s);s.uniforms.rwTime=clock.time;s.uniforms.rwMotion=clock.motion;s.uniforms.rwRipples={value:ripples};
  s.vertexShader='varying vec3 rwWaterPos;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>\nrwWaterPos=(modelMatrix*vec4(transformed,1.)).xyz;`);
  s.fragmentShader=waterDefs+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat sheen=abs(wave(rwWaterPos.xz));diffuseColor.rgb+=vec3(.12,.23,.18)*sheen*2.;`);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
vec2 p=rwWaterPos.xz;float e=.035;float dx=(wave(p+vec2(e,0.))-wave(p-vec2(e,0.)))/(2.*e);float dz=(wave(p+vec2(0.,e))-wave(p-vec2(0.,e)))/(2.*e);normal=normalize(mat3(viewMatrix)*vec3(-dx,1.,-dz));`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(.13+abs(wave(rwWaterPos.xz))*.65,.12,.27);`);
 };material.needsUpdate=true;return material;
}
export function animateWind(material,clock,amplitude=.13){
 if(material.userData.rwWind)return;material.userData.rwWind=true;const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();material.customProgramCacheKey=()=>key+'/rainward-wind-6';
 material.onBeforeCompile=s=>{previous(s);s.uniforms.rwWindTime=clock.time;s.uniforms.rwWindMotion=clock.motion;s.vertexShader='uniform float rwWindTime,rwWindMotion;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vec3 seed=(modelMatrix*vec4(position,1.)).xyz;
#ifdef USE_INSTANCING
 seed=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;
#endif
float bend=clamp(position.y,0.,1.5)*${amplitude.toFixed(3)}*rwWindMotion;transformed.x+=sin(rwWindTime*1.15+seed.x*.38+seed.z*.27)*bend;transformed.z+=sin(rwWindTime*.81+seed.z*.42)*bend*.45;`);
 };material.needsUpdate=true;
}
export function createLivingMaterials(scene,chapter,heightAt){
 const clock={time:{value:0},motion:{value:1}},ripples=Array.from({length:8},()=>new T.Vector4(0,0,-10,0));let next=0,lastRipple=-1,enabled=true,lastState=null;
 const water=[],oldMaterials=new Set(),created=new Set();
 // Old chapter builders explicitly tag their water surfaces/waterfall strips.
 scene.traverse(m=>{if(m.userData.waterSurface){oldMaterials.add(m.material);const material=new T.MeshPhysicalMaterial({color:0x39746e,roughness:.16,metalness:.18,clearcoat:.55,clearcoatRoughness:.12,transparent:true,opacity:.76,side:T.DoubleSide});animateWater(material,clock,ripples);m.material=material;m.name='Living shallow water';water.push(m);created.add(material);}
 if(m.userData.waterfall){oldMaterials.add(m.material);const shader=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:clock.time,motion:clock.motion},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time,motion;void main(){float t=time*motion;float x=sin(vUv.x*92.+sin(vUv.y*16.+t*2.)*.8)*.5+.5;float streak=sin(vUv.y*68.+t*14.+vUv.x*12.)*.5+.5;float edge=smoothstep(0.,.15,vUv.x)*smoothstep(0.,.15,1.-vUv.x);gl_FragColor=vec4(mix(vec3(.49,.67,.67),vec3(.82,.93,.87),streak),edge*(.12+x*.17));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});m.material=shader;created.add(shader);}});
 const windMaterials=new WeakSet();let rippleCount=0;
 return {update(state){if(lastState!==state){lastState=state;lastRipple=-1;for(const r of ripples)r.w=0;}clock.time.value=state.t;
  const p=state.player,inside=chapter.water?.some(r=>Math.abs(p.x-r.x)<r.w/2&&Math.abs(p.z-r.z)<r.d/2);
  if(enabled&&inside&&p.speed>.2&&state.t-lastRipple>.26){ripples[next].set(p.x,p.z,state.t,Math.min(1,p.speed/2));next=(next+1)%8;lastRipple=state.t;rippleCount++;}
  scene.traverse(o=>{if(!o.isMesh)return;if(o.userData.waterSurface)animateWater(o.material,clock,ripples);const fern=o.name==='Scanned fern clumps',wind=fern||o.userData.windFoliage; if(!wind)return;if(!o.geometry.userData.rwWindBounds){o.geometry.computeBoundingBox();o.geometry.boundingBox.expandByScalar(.22);o.geometry.computeBoundingSphere();o.geometry.boundingSphere.radius+=.22;o.geometry.userData.rwWindBounds=true;}
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!windMaterials.has(m)){animateWind(m,clock,fern?.12:.10);windMaterials.add(m);}
  });
 },setMotion(v){enabled=!!v;clock.motion.value=v?1:0;},stats:()=>({waterSurfaces:water.length,rippleCount,motion:enabled}),dispose(){for(const m of created)m.dispose();for(const m of oldMaterials)m.dispose();}};
}
