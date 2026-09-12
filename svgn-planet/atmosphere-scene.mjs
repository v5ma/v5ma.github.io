import * as T from './vendor/three.module.js';
import {point,cross} from './world.mjs';
import {loadAtmosphere,storeAtmosphere,cleanAtmosphere,atmosphereFrame,ATMOSPHERE_VERSION} from './atmosphere-core.mjs';
import {patchSurfaceShader,patchLeafDepth,patchSky} from './atmosphere-shaders.mjs';

/* One bounded rain batch, shader uniforms on existing surfaces, no extra scene
 * capture, full-screen render target, imported assets or physics modifications. */
export function createAtmosphere({renderer,scene,root,sun,sky,jewel}){
 let storage;try{storage=globalThis.localStorage;}catch{}
 let prefs=loadAtmosphere(storage),pending=true,lastProfile=null,rebuilds=0,disposed=false;
 const uniforms={uAtmosphereTime:{value:0},uAtmosphereWet:{value:0},uAtmosphereRipples:{value:0},uAtmosphereNight:{value:0},uAtmosphereAmount:{value:0},uAtmosphereWind:{value:0},uAtmosphereSun:{value:new T.Vector3(1,1,0).normalize()}};
 const materials=new Map(),depths=new Map(),glassCache=new Map();let scans=0,leafMeshes=0;
 const original={exposure:renderer.toneMappingExposure,hemi:scene.children.find(o=>o.isHemisphereLight)};
 const originalFog=scene.fog;
 const hemi=original.hemi,pole=new T.Vector3(0,1,0),rotation=new T.Quaternion(),normal=new T.Vector3(),east=new T.Vector3(),north=new T.Vector3(),warm=new T.Color('#ffbe80'),day=new T.Color('#ffe1b3'),cool=new T.Color('#bbccf2'),fogDay=new T.Color('#cbdde0'),fogGold=new T.Color('#d7b38d'),fogNight=new T.Color('#526e8d'),groundNight=new T.Color('#4a5860');
 // Extend the existing sky; its CC0 photograph and fallback remain in place.
 const skyMaterial=sky.mesh.material;
 const skyDefaults={fragmentShader:skyMaterial.fragmentShader};
 patchSky(skyMaterial);
 Object.assign(skyMaterial.uniforms,{uSkyNight:{value:0},uSkyWarm:{value:0},uSkyBrightness:{value:1},uSkyAmount:{value:0}});
 skyMaterial.needsUpdate=true;
 function register(m,role){
  if(materials.has(m)||!m||(!m.isMeshStandardMaterial&&!m.isMeshLambertMaterial))return;
  if((role==='road'||role==='paving')&&!m.isMeshStandardMaterial)return;
  const prior=m.onBeforeCompile,oldKey=m.customProgramCacheKey(),record={role,prior,key:m.customProgramCacheKey,environment:m.envMap,envIntensity:m.envMapIntensity};
  materials.set(m,record);m.onBeforeCompile=(shader,r)=>{prior.call(m,shader,r);Object.assign(shader.uniforms,uniforms);patchSurfaceShader(shader,role);};
  m.customProgramCacheKey=()=>oldKey+'|neighborhood-atmosphere-090|'+role;
  m.needsUpdate=true;
 }
 function facade(m){
  const high=m.userData.opticsHigh||m;if(glassCache.has(high))return glassCache.get(high);
  const result=new T.MeshStandardMaterial({name:'Atmosphere / facade glazing',color:'#416476',roughness:.21,metalness:.18,side:T.DoubleSide});
  result.userData={atmosphereRole:'window',keepOptics:true};glassCache.set(high,result);return result;
 }
 function addDepth(mesh,material){
  if(mesh.userData.atmosphereDepth)return;
  let d=depths.get(material);
  if(!d){d=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:material.map,alphaMap:material.alphaMap,alphaTest:material.alphaTest,side:material.side});
   d.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);patchLeafDepth(shader);};d.customProgramCacheKey=()=> 'atmosphere-leaf-depth-090';depths.set(material,d);}
  mesh.customDepthMaterial=d;mesh.userData.atmosphereDepth=true;leafMeshes++;
 }
 function scan(){
  pending=false;scans++;
  root.traverse(mesh=>{
   if(!mesh.isMesh||Array.isArray(mesh.material))return;
   let m=mesh.material,role=m.userData.atmosphereRole;
   if(!role&&/Leaves|Leaf/.test(m.name))role='leaf';
   // Restrict facade glazing to the authored street-art hierarchy. Car glass,
   // gems, shelters and photo overlays retain their original optical materials.
   if(!role&&((m.userData.opticsHigh||m).userData.opticsRole==='glass')){
    let p=mesh.parent;while(p&&p!==root&&p.name!=='CC0 expanded neighborhood')p=p.parent;
    if(p?.name==='CC0 expanded neighborhood'){m=mesh.material=facade(m);role='window';}
   }
   if(!role)return;
   register(m,role);if(role==='leaf')addDepth(mesh,m);
  });
 }
 const rainRoot=new T.Group();rainRoot.name='Coastal Atmosphere / local rain';root.add(rainRoot);
 const g=new T.InstancedBufferGeometry();g.setIndex([0,1,2,2,1,3]);g.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,-.5,.5,0,.5,.5,0],3));
 const seeds=new Float32Array(640*4);let rng=8719;for(let i=0;i<seeds.length;i++){rng=(rng*1664525+1013904223)>>>0;seeds[i]=rng/4294967296;}
 g.setAttribute('aRainSeed',new T.InstancedBufferAttribute(seeds,4));g.instanceCount=0;
 const rainMaterial=new T.ShaderMaterial({name:'Coastal Atmosphere / rain streaks',transparent:true,depthWrite:false,depthTest:true,uniforms:{uTime:uniforms.uAtmosphereTime,uOpacity:{value:0}},vertexShader:`
  attribute vec4 aRainSeed;uniform float uTime;varying vec2 vRainUV;varying float vRainFade;
  void main(){vRainUV=position.xy+.5;
   vec3 p=vec3((aRainSeed.x-.5)*34.,mod(aRainSeed.y*19.-uTime*(10.+aRainSeed.w*5.),19.)+.1,(aRainSeed.z-.5)*34.);
   p.x+=sin(uTime*.3)*.5;vec4 view=modelViewMatrix*vec4(p,1.);
   vRainFade=smoothstep(.6,3.,-view.z)*(1.-smoothstep(15.,30.,length(p.xz)));
   view.xy+=position.xy*vec2(.022,.40+aRainSeed.w*.4);gl_Position=projectionMatrix*view;
  }`,fragmentShader:`varying vec2 vRainUV;varying float vRainFade;uniform float uOpacity;
  void main(){float edge=smoothstep(0.,.2,vRainUV.x)*(1.-smoothstep(.8,1.,vRainUV.x));float tip=sin(vRainUV.y*3.14159);gl_FragColor=vec4(.57,.71,.83,edge*tip*vRainFade*uOpacity*.38);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
 const rainMesh=new T.Mesh(g,rainMaterial);rainMesh.frustumCulled=false;rainMesh.renderOrder=8;rainRoot.add(rainMesh);
 function set(values){prefs=cleanAtmosphere({...prefs,...values});const stored=storeAtmosphere(storage,prefs);window.dispatchEvent(new CustomEvent('nm-atmosphere-change',{detail:{prefs:{...prefs},stored}}));return stored;}
 function update(s,camera,{low=false,quiet=false,overview=false}={}){
  if(disposed)return;
  if(pending)scan();
  const f=atmosphereFrame(prefs,{low,quiet});lastProfile=f;
  uniforms.uAtmosphereTime.value=quiet?0:s.time;
  uniforms.uAtmosphereWet.value=f.wet;uniforms.uAtmosphereRipples.value=f.ripples;uniforms.uAtmosphereNight.value=f.night;uniforms.uAtmosphereAmount.value=f.amount;uniforms.uAtmosphereWind.value=f.wind;
  normal.set(...s.n);east.set(...cross(s.north,s.n));north.set(...s.north);
  rotation.setFromUnitVectors(pole,normal);
  sun.position.set(...point(s.n,f.elevation)).addScaledVector(east,-22).addScaledVector(north,-18);
  sun.color.copy(day).lerp(warm,f.warm*.7).lerp(cool,f.night*.8);sun.intensity=f.sun;
  uniforms.uAtmosphereSun.value.copy(sun.position).sub(sun.target.position).normalize();
  if(hemi){hemi.position.copy(normal);hemi.color.set('#e3f3ff').lerp(cool,f.night*.4);hemi.groundColor.set('#9c947d').lerp(groundNight,f.night*.6);hemi.intensity=f.ambient;}
  if(originalFog){originalFog.color.copy(fogDay).lerp(fogGold,f.warm*.6).lerp(fogNight,f.night*.82);originalFog.near=f.fogNear;originalFog.far=f.fogFar;}
  const skyU=skyMaterial.uniforms;skyU.uSkyNight.value=f.night;skyU.uSkyWarm.value=f.warm;skyU.uSkyBrightness.value=f.sky;skyU.uSkyAmount.value=f.amount;
  for(const [m,rec]of materials){
   if(rec.role!=='road'&&rec.role!=='paving'&&rec.role!=='window')continue;
   // Reuse the existing prefiltered environment, never render the city twice.
   const env=jewel.library.environment;if(m.envMap!==env){m.envMap=env;m.needsUpdate=true;}
   m.envMapIntensity=rec.role==='window'?.48:f.wet*.75;
   m.envMapRotation?.setFromQuaternion(rotation);
  }
  rainRoot.position.set(...point(s.n,.25));rainRoot.quaternion.copy(rotation);g.instanceCount=f.rainCount;rainRoot.visible=!overview&&f.rainCount>0;rainMaterial.uniforms.uOpacity.value=f.amount;
 }
 function restored(){pending=true;rebuilds++;for(const m of materials.keys())m.needsUpdate=true;skyMaterial.needsUpdate=true;rainMaterial.needsUpdate=true;}
 return {set,update,refresh(){pending=true;},restored,get prefs(){return {...prefs};},get rainLevel(){return lastProfile?.rain||0;},inspect(){const roles={road:0,paving:0,leaf:0,window:0};for(const r of materials.values())roles[r.role]++;return {version:ATMOSPHERE_VERSION,prefs:{...prefs},effective:lastProfile?{...lastProfile}:null,registeredMaterials:roles,leafShadowMeshes:leafMeshes,depthMaterials:depths.size,rainCapacity:640,rainInstances:g.instanceCount,extraScenePasses:0,extraRainDraws:rainRoot.visible?1:0,scans,rebuilds,reflectionMethod:'Existing prefiltered environment; not ray tracing or live scene reflections',physics:'unchanged'};},dispose(){disposed=true;for(const [m,r]of materials){m.onBeforeCompile=r.prior;m.customProgramCacheKey=r.key;m.envMap=r.environment;m.envMapIntensity=r.envIntensity;m.needsUpdate=true;}for(const d of depths.values())d.dispose();for(const m of glassCache.values())m.dispose();g.dispose();rainMaterial.dispose();rainRoot.removeFromParent();skyMaterial.fragmentShader=skyDefaults.fragmentShader;skyMaterial.needsUpdate=true;renderer.toneMappingExposure=original.exposure;}};
}
