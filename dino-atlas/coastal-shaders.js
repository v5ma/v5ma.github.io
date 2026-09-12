import * as T from './vendor/three.module.js';
import {LAKE} from './ranger-data.js';

export const OPTICS_BUILD='coastal-light-20260912.1';
export const OPTICS_KEY='dino-atlas.optics.v1';
export const PRESETS=['classic','balanced','cinematic'];
export const DEFAULT_OPTICS={version:1,preset:'balanced',water:true,wind:true,energy:true,bloom:.32};
export function sanitizeOptics(v){
 const s={...DEFAULT_OPTICS};if(!v||v.version!==1)return s;
 if(PRESETS.includes(v.preset))s.preset=v.preset;
 for(const k of ['water','wind','energy'])if(typeof v[k]==='boolean')s[k]=v[k];
 if(Number.isFinite(v.bloom))s.bloom=Math.max(0,Math.min(.8,v.bloom));return s;
}
export function readOptics(storage){try{return sanitizeOptics(JSON.parse(storage?.getItem(OPTICS_KEY)));}catch{return {...DEFAULT_OPTICS};}}
export function saveOptics(storage,s){try{if(!storage)return false;storage.setItem(OPTICS_KEY,JSON.stringify(sanitizeOptics(s)));return true;}catch{return false;}}
// Visual-only clocks: hidden tabs, pause menus and Reduced Motion cannot build up time.
export function visualStep(clock,dt,reduced){return clock+(!reduced&&Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0);}
export function effectivePreset(s,low,floatTargets=true){return s.preset==='cinematic'&&(low||!floatTargets)?'balanced':s.preset;}

const WORLD_VERTEX=`
varying vec3 vAtlasWorld;
uniform float atlasTime;
uniform float atlasWind;
uniform float atlasStorm;
`;
const WORLD_ASSIGN=`
vec4 atlasVertex=vec4(transformed,1.0);
#ifdef USE_INSTANCING
 atlasVertex=instanceMatrix*atlasVertex;
#endif
vAtlasWorld=(modelMatrix*atlasVertex).xyz;
`;
const WATER_COMMON=`
varying vec3 vAtlasWorld;
uniform float atlasTime;
uniform float atlasNight;
uniform float atlasStorm;
uniform float atlasRegion;
uniform vec3 atlasPond;
uniform float atlasRipples;
uniform vec4 atlasWake[12];
uniform vec4 atlasImpact[6];
float atlasEllipse(vec2 p,vec2 c,vec2 r){return (1.0-length((p-c)/r))*min(r.x,r.y);}
float atlasShore(vec2 p){
 if(atlasRegion>0.5)return atlasPond.z-length(p-atlasPond.xy);
 float sea=length(p)-420.0;
 float channel=min(min(p.x+478.0,-222.0-p.x),18.0-abs(p.y+152.0));
 float lagoon=max(atlasEllipse(p,vec2(-164.0,-155.0),vec2(76.0,57.0)),atlasEllipse(p,vec2(-238.0,-152.0),vec2(38.0,25.0)));
 return max(sea,max(channel,lagoon));
}
vec3 atlasWaterNormal(vec2 p){
 float t=atlasTime;
 float a=dot(p,vec2(.21,.14))+t*1.15;
 float b=dot(p,vec2(-.12,.30))-t*.86;
 float c=dot(p,vec2(.66,-.48))+t*1.9;
 float amp=mix(.15,.29,atlasStorm);
 return normalize(vec3(-amp*(cos(a)+.48*cos(b))-.045*cos(c),1.0,-amp*(.67*cos(a)-cos(b))+.035*cos(c)));
}
float atlasFoam(vec2 p){
 float shore=atlasShore(p);
 float edge=(1.0-smoothstep(.0,4.5,max(shore,0.0)));
 float lace=sin(shore*2.9-atlasTime*1.8+sin(p.x*.37+p.y*.28)*.65)*.5+.5;
 return edge*smoothstep(.38,.9,lace)*.52;
}
float atlasTrail(vec2 p){
 float trail=0.0;
 for(int i=0;i<12;i++){
  vec4 w=atlasWake[i];float r=max(.1,w.z),d=length(p-w.xy);
  float shell=exp(-pow((d-r)/max(.4,r*.25),2.0));
  trail=max(trail,shell*w.w);
 }
 return trail;
}
float atlasRings(vec2 p){
 float rings=0.0;
 for(int i=0;i<6;i++){
  vec4 w=atlasImpact[i];float d=length(p-w.xy);
  rings+=exp(-pow((d-w.z)/.48,2.0))*w.w;
 }
 return min(1.0,rings)*atlasRipples;
}
`;

// Shader patches preserve Three.js lighting, fog, tone mapping and output conversion.
// Each patch has a stable cache key; changing time/weather never recompiles a shader.
function patchStandard(base,kind,uniforms){
 const m=base.clone();m.name='Coastal Light / '+kind;
 m.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=WORLD_VERTEX+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+WORLD_ASSIGN);
  if(kind==='water'){
   shader.fragmentShader=WATER_COMMON+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float atlasDepth=smoothstep(0.0,19.0,atlasShore(vAtlasWorld.xz));
    vec3 atlasShallow=mix(vec3(.055,.37,.31),vec3(.018,.10,.14),atlasNight);
    vec3 atlasDeep=mix(vec3(.012,.12,.19),vec3(.006,.025,.075),atlasNight);
    float atlasFoamValue=atlasFoam(vAtlasWorld.xz);
    float atlasTrailValue=atlasTrail(vAtlasWorld.xz);
    float atlasRingValue=atlasRings(vAtlasWorld.xz);
    diffuseColor.rgb=mix(atlasShallow,atlasDeep,atlasDepth);
    float caustic=pow(.5+.5*sin(vAtlasWorld.x*.63+sin(vAtlasWorld.z*.56)+atlasTime*.72),12.0);
    diffuseColor.rgb+=vec3(.02,.09,.075)*caustic*(1.0-atlasDepth)*(1.0-atlasNight);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.64,.86,.78),min(.82,atlasFoamValue+atlasTrailValue*.45+atlasRingValue*.15));
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.22,.36,atlasStorm);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec3 atlasN=atlasWaterNormal(vAtlasWorld.xz);
    normal=normalize(mat3(viewMatrix)*atlasN);
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    vec3 atlasView=normalize(cameraPosition-vAtlasWorld);
    float atlasFresnel=.045+.65*pow(1.0-max(0.0,dot(atlasN,atlasView)),4.0);
    vec3 atlasSky=mix(vec3(.36,.59,.63),vec3(.09,.17,.27),atlasNight);
    outgoingLight=mix(outgoingLight,atlasSky,atlasFresnel);
    outgoingLight+=vec3(.055,.60,.69)*(atlasTrailValue+atlasRingValue)*atlasNight*1.3;
    #include <opaque_fragment>
   `);
  }else if(kind==='wet'){
   shader.fragmentShader='varying vec3 vAtlasWorld;\nuniform float atlasStorm;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    float atlasPuddle=smoothstep(.2,.72,.5+.25*sin(vAtlasWorld.x*.83+vAtlasWorld.z*.19)+.25*sin(vAtlasWorld.z*.59-vAtlasWorld.x*.21));
    roughnessFactor=mix(roughnessFactor,.19,atlasStorm*atlasPuddle*.83);
   `).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.0-atlasStorm*.22;');
  }else if(kind==='canopy'){
   const wind=`
    vec3 atlasOrigin=vec3(0.0);
    #ifdef USE_INSTANCING
      atlasOrigin=instanceMatrix[3].xyz;
    #endif
    float atlasGust=sin(dot(atlasOrigin.xz,vec2(.065,.047))+atlasTime*.87);
    float atlasFlutter=sin(atlasOrigin.x*.31+atlasOrigin.z*.23+atlasTime*1.31);
    transformed.x+=atlasWind*(atlasGust*.14+atlasFlutter*.025)*(1.0+atlasStorm*.65);
    transformed.z+=atlasWind*atlasGust*.055;
   `;
   shader.vertexShader=shader.vertexShader.replace(WORLD_ASSIGN,wind+WORLD_ASSIGN);
   shader.fragmentShader='varying vec3 vAtlasWorld;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float atlasLeafLight=.5+.5*sin(vAtlasWorld.x*.19+vAtlasWorld.z*.17);
    diffuseColor.rgb*=mix(vec3(.87,.96,.86),vec3(1.16,1.12,.93),atlasLeafLight);
   `);
  }
 };
 m.customProgramCacheKey=()=>`coastal-light-v1-${kind}`;return m;
}

function canopyDepth(uniforms,distance=false){
 const m=distance?new T.MeshDistanceMaterial():new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});
 m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='uniform float atlasTime;\nuniform float atlasWind;\nuniform float atlasStorm;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vec3 atlasOrigin=vec3(0.0);
  #ifdef USE_INSTANCING
   atlasOrigin=instanceMatrix[3].xyz;
  #endif
  float atlasGust=sin(dot(atlasOrigin.xz,vec2(.065,.047))+atlasTime*.87);
  float atlasFlutter=sin(atlasOrigin.x*.31+atlasOrigin.z*.23+atlasTime*1.31);
  transformed.x+=atlasWind*(atlasGust*.14+atlasFlutter*.025)*(1.0+atlasStorm*.65);
  transformed.z+=atlasWind*atlasGust*.055;
 `);};m.customProgramCacheKey=()=>`coastal-light-depth-${distance}`;return m;
}
function energyMaterial(base,uniforms){
 const m=base.clone();m.name='Coastal Light / resonance bands';
 m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='varying vec2 vAtlasRing;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAtlasRing=position.xy;');
 shader.fragmentShader='varying vec2 vAtlasRing;\nuniform float atlasTime;\nuniform float atlasEnergy;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float radius=length(vAtlasRing);
  float edge=smoothstep(.86,.90,radius)*(1.0-smoothstep(.975,1.0,radius));
  float streak=.74+.26*sin(atan(vAtlasRing.y,vAtlasRing.x)*12.0-atlasTime*.85);
  diffuseColor.rgb*=1.0+atlasEnergy*1.7*edge;
  diffuseColor.a*=edge*streak;
 `);};m.customProgramCacheKey=()=>`coastal-light-energy-v1`;return m;
}

// Match the maintained builders by geometric role, not broad material colors.
// Unknown meshes are left untouched. Tests lock these selectors to the current scene.
export function classifySurface(mesh){
 if(!mesh?.isMesh||Array.isArray(mesh.material))return null;
 const p=mesh.geometry?.parameters||{},g=mesh.geometry?.type,m=mesh.material;
 if(m.isMeshStandardMaterial){
  if(g==='RingGeometry'&&p.innerRadius===420)return 'water';
  if(g==='PlaneGeometry'&&((p.width===1800&&p.height===1800)||(p.width===258&&p.height===36)))return 'water';
  if(g==='CircleGeometry'&&m.metalness>=.15&&m.roughness<=.43&&mesh.rotation.x<-1.5)return 'water';
  if(mesh.isInstancedMesh&&g==='IcosahedronGeometry'&&mesh.count>50){
   const ys=mesh.instanceMatrix.array;let raised=0;for(let i=0;i<mesh.count;i++)if(ys[i*16+13]>3)raised++;
   if(raised/mesh.count>.85)return 'canopy';
  }
  // Original and frontier road ribbons contain no UVs or are spline BufferGeometry.
  if(g==='BufferGeometry'&&!mesh.isInstancedMesh&&mesh.geometry.attributes.position?.count>=200&&mesh.position.y===0){
   const pos=mesh.geometry.attributes.position;let min=Infinity,max=-Infinity;
   for(let i=0;i<pos.count;i++){min=Math.min(min,pos.getY(i));max=Math.max(max,pos.getY(i));}
   if(min>=.025&&max<=.11)return 'wet';
  }
 }
 if(m.isMeshBasicMaterial&&m.transparent&&m.depthWrite===false&&g==='RingGeometry'&&p.outerRadius===1&&p.innerRadius>=.85&&mesh.parent?.isScene)return 'energy';
 return null;
}

export class CoastalMaterials{
 constructor(scene){
  this.scene=scene;this.clock=0;this.wakes=[];this.impacts=[];this.wakeTick=0;this.impactCursor=0;this.materials=[];this.bindings=[];
  this.uniforms={atlasTime:{value:0},atlasNight:{value:0},atlasStorm:{value:0},atlasWind:{value:1},atlasEnergy:{value:1},atlasRipples:{value:1},atlasWake:{value:Array.from({length:12},()=>new T.Vector4(0,0,1,0))},atlasImpact:{value:Array.from({length:6},()=>new T.Vector4(0,0,1,0))}};
  scene.traverse(mesh=>{
   const kind=classifySurface(mesh);if(!kind)return;
   const original=mesh.material,u={...this.uniforms,atlasRegion:{value:0},atlasPond:{value:new T.Vector3(LAKE.x,LAKE.z,LAKE.r)}};
   // Region 1 is the old central pond; its position/radius are read from the mesh below.
   if(kind==='water'&&mesh.geometry.type==='CircleGeometry'&&mesh.scale.x===1&&mesh.geometry.parameters.radius>1)u.atlasRegion.value=1;
   const enhanced=kind==='energy'?energyMaterial(original,u):patchStandard(original,kind,u);
   const binding={mesh,kind,original,enhanced,depth:mesh.customDepthMaterial,distance:mesh.customDistanceMaterial};
   if(kind==='canopy'){binding.windDepth=canopyDepth(this.uniforms);binding.windDistance=canopyDepth(this.uniforms,true);this.materials.push(binding.windDepth,binding.windDistance);}
   this.materials.push(enhanced);this.bindings.push(binding);
  });
 }
 apply(settings,effective){
  this.uniforms.atlasEnergy.value=effective==='cinematic'?1:.52;
  for(const b of this.bindings){const on=effective!=='classic'&&(b.kind==='water'?settings.water:b.kind==='canopy'?settings.wind:b.kind==='energy'?settings.energy:true);
   b.mesh.material=on?b.enhanced:b.original;
   if(b.kind==='canopy'){b.mesh.customDepthMaterial=on?b.windDepth:b.depth;b.mesh.customDistanceMaterial=on?b.windDistance:b.distance;}
  }
 }
 impact(p,strength=1){if(!p||![p.x,p.z].every(Number.isFinite))return;this.impacts.push({x:p.x,z:p.z,age:0,strength:Math.min(1,Math.max(0,strength))});if(this.impacts.length>6)this.impacts.shift();}
 update(dt,{night=false,storm=0,reduced=false,boat=null}={}){
  const step=!reduced&&Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
  this.clock=visualStep(this.clock,dt,reduced);const u=this.uniforms;u.atlasTime.value=this.clock;u.atlasNight.value=Number(night);u.atlasStorm.value=Math.max(0,Math.min(1,storm));u.atlasWind.value=reduced?0:1;u.atlasRipples.value=reduced?0:1;
  if(reduced){this.wakes.length=0;this.impacts.length=0;}
  if(step>0){for(const w of this.wakes)w.age+=step;for(const w of this.impacts)w.age+=step;this.wakeTick+=step;
   if(boat&&boat.speed>1&&this.wakeTick>.14){this.wakeTick=0;this.wakes.push({x:boat.x,z:boat.z,age:0,speed:Math.min(1,boat.speed/12)});if(this.wakes.length>12)this.wakes.shift();}
  }
  u.atlasWake.value.forEach((v,i)=>{const w=this.wakes[i];if(w)v.set(w.x,w.z,.7+w.age*2.1,Math.max(0,1-w.age/2.2)*w.speed);else v.w=0;});
  u.atlasImpact.value.forEach((v,i)=>{const w=this.impacts[i];if(w)v.set(w.x,w.z,w.age*9,Math.max(0,1-w.age/2)*w.strength);else v.w=0;});
  // The original builders keep mutating fading ring materials through mesh.material.
  // Mirror those fields on both variants so switching presets never resurrects a pulse.
  for(const b of this.bindings)if(b.kind==='energy'){const live=b.mesh.material,other=live===b.original?b.enhanced:b.original;other.opacity=live.opacity;other.color.copy(live.color);}
 }
 dispose(){for(const b of this.bindings){b.mesh.material=b.original;b.mesh.customDepthMaterial=b.depth;b.mesh.customDistanceMaterial=b.distance;}for(const m of this.materials)m.dispose();}
 snapshot(){const counts={water:0,canopy:0,wet:0,energy:0};for(const b of this.bindings)counts[b.kind]++;return {targets:counts,clock:this.clock,wakes:this.wakes.length,impacts:this.impacts.length,materials:this.materials.length};}
}

const QUAD_VERTEX=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const BLUR_FRAGMENT=`varying vec2 vUv;uniform sampler2D source;uniform vec2 stepUv;uniform float bright;
vec3 sampleLight(vec2 uv){vec3 c=texture2D(source,uv).rgb;if(bright>0.5){float l=max(c.r,max(c.g,c.b));c*=smoothstep(.72,1.55,l);}return c;}
void main(){vec3 c=sampleLight(vUv)*.227027;c+=(sampleLight(vUv+stepUv*1.384615)+sampleLight(vUv-stepUv*1.384615))*.316216;c+=(sampleLight(vUv+stepUv*3.230769)+sampleLight(vUv-stepUv*3.230769))*.070270;gl_FragColor=vec4(c,1.0);}`;
const COMPOSITE_FRAGMENT=`varying vec2 vUv;uniform sampler2D source;uniform sampler2D bloomTex;uniform float strength;
void main(){vec3 c=texture2D(source,vUv).rgb+min(texture2D(bloomTex,vUv).rgb,vec3(3.0))*strength;gl_FragColor=vec4(c,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export class CoastalBloom{
 constructor(renderer){
  this.renderer=renderer;this.available=!!renderer.extensions.has('EXT_color_buffer_float');this.targets=null;this.size=new T.Vector2();this.passes=0;
  this.scene=new T.Scene();this.camera=new T.Camera();this.geometry=new T.PlaneGeometry(2,2);
  this.blur=new T.ShaderMaterial({vertexShader:QUAD_VERTEX,fragmentShader:BLUR_FRAGMENT,uniforms:{source:{value:null},stepUv:{value:new T.Vector2()},bright:{value:0}},depthTest:false,depthWrite:false,toneMapped:false});
  this.final=new T.ShaderMaterial({vertexShader:QUAD_VERTEX,fragmentShader:COMPOSITE_FRAGMENT,uniforms:{source:{value:null},bloomTex:{value:null},strength:{value:.32}},depthTest:false,depthWrite:false});
  this.quad=new T.Mesh(this.geometry,this.blur);this.quad.frustumCulled=false;this.scene.add(this.quad);
 }
 resize(){const r=this.renderer;r.getDrawingBufferSize(this.size);const w=Math.max(1,Math.min(1920,this.size.x)),h=Math.max(1,Math.round(this.size.y*w/this.size.x)),bw=Math.max(1,Math.round(w/2)),bh=Math.max(1,Math.round(h/2));
  if(this.targets&&this.targets[0].width===w&&this.targets[0].height===h)return;
  this.release();const opts={type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false,stencilBuffer:false};
  this.targets=[new T.WebGLRenderTarget(w,h,opts),new T.WebGLRenderTarget(bw,bh,{...opts,depthBuffer:false}),new T.WebGLRenderTarget(bw,bh,{...opts,depthBuffer:false})];
 }
 render(scene,camera,strength){
  const r=this.renderer;this.resize();const [full,a,b]=this.targets,old=r.getRenderTarget(),auto=r.info.autoReset;r.info.autoReset=false;r.info.reset();
  try{
   r.setRenderTarget(full);r.clear();r.render(scene,camera);
   this.quad.material=this.blur;this.blur.uniforms.source.value=full.texture;this.blur.uniforms.bright.value=1;this.blur.uniforms.stepUv.value.set(2/full.width,0);
   r.setRenderTarget(a);r.render(this.scene,this.camera);
   this.blur.uniforms.source.value=a.texture;this.blur.uniforms.bright.value=0;this.blur.uniforms.stepUv.value.set(0,1/a.height);
   r.setRenderTarget(b);r.render(this.scene,this.camera);
   this.quad.material=this.final;this.final.uniforms.source.value=full.texture;this.final.uniforms.bloomTex.value=b.texture;this.final.uniforms.strength.value=strength;
   r.setRenderTarget(old);r.render(this.scene,this.camera);this.passes=4;
  }finally{r.setRenderTarget(old);r.info.autoReset=auto;}
 }
 release(){if(this.targets){for(const t of this.targets)t.dispose();this.targets=null;}this.passes=0;}
 dispose(){this.release();this.geometry.dispose();this.blur.dispose();this.final.dispose();}
 snapshot(){return {passes:this.passes,targets:this.targets?.length||0,width:this.targets?.[0].width||0,height:this.targets?.[0].height||0};}
}
