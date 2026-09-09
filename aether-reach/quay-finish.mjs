/* Original material/FX finishing for the existing public Quay, Three.js r177.
 * No gameplay imports, persistence, external fetches, camera steering or post
 * processing. Rich and reduced profiles share silhouettes; only one physical
 * transmission material is used. Hardware performance remains unverified.
 * API references: https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial
 * https://threejs.org/docs/#api/en/renderers/webxr/WebXRManager
 */
import * as T from './vendor/three.module.js';

export const FINISH_LIMITS=Object.freeze({sparkles:96,reducedSparkles:32,shards:6,scanLimit:24});
export function makeJewelMaterial({reduced=false,color=0x8cded9}={}){
 const material=new T.MeshPhysicalMaterial({color,metalness:0,roughness:reduced?.2:.105,clearcoat:1,clearcoatRoughness:.12,ior:2.42,envMapIntensity:1.2,transmission:reduced?0:.84,thickness:reduced?0:.62,attenuationColor:0x80bfc8,attenuationDistance:3.4,transparent:reduced,opacity:reduced?.84:1});
 material.name='Quay / diamond-cut aether glass';
 // Dispersion is supported by the pinned renderer; keep the chromatic spread
 // subtle rather than turning every glass surface into a rainbow.
 material.dispersion=reduced?0:.035;
 return material;
}
export function makeAlloyMaterial(){
 const m=new T.MeshPhysicalMaterial({color:0xbca26c,metalness:1,roughness:.24,clearcoat:.5,clearcoatRoughness:.2,envMapIntensity:1.1});
 m.name='Quay / brushed champagne alloy';return m;
}
export function installQuayFinish({scene,renderer,reduced=false,reducedMotion=false}={}){
 if(!scene?.isScene||!renderer)throw new TypeError('Quay finishing requires the existing scene and renderer.');
 if(scene.userData.quayFinish)return scene.userData.quayFinish;
 const root=new T.Group();root.name='Quay jewel finishing / visual only';
 // Above the pedestrian corridor, not an invented doorway, collision surface,
 // rail receiver, pickup or mission object. Existing routes remain unchanged.
 root.position.set(0,5.4,-7);scene.add(root);
 const gemstone=makeJewelMaterial({reduced}),alloy=makeAlloyMaterial();
 const coreGeo=new T.OctahedronGeometry(.58,0);
 const core=new T.Mesh(coreGeo,gemstone);core.name='Aether prism / decorative';core.rotation.set(.12,.35,0);root.add(core);
 const mountGeo=new T.TorusGeometry(.88,.025,6,reduced?32:64);
 const mount=new T.Mesh(mountGeo,alloy);mount.rotation.x=Math.PI/2;root.add(mount);
 const vertical=new T.Mesh(mountGeo,alloy);vertical.rotation.y=.5;root.add(vertical);
 const shardGeo=new T.OctahedronGeometry(.17,0);
 const shardMat=new T.MeshPhysicalMaterial({color:0x70acb6,metalness:.25,roughness:.15,clearcoat:1,clearcoatRoughness:.14,envMapIntensity:1.3});shardMat.name='Quay / polished satellite crystals';
 for(let i=0;i<FINISH_LIMITS.shards;i++){const a=i*Math.PI/3,m=new T.Mesh(shardGeo,shardMat);m.position.set(Math.cos(a)*.87,0,Math.sin(a)*.87);m.rotation.y=a;root.add(m);}
 const count=reduced?FINISH_LIMITS.reducedSparkles:FINISH_LIMITS.sparkles;
 const positions=new Float32Array(count*3),phases=new Float32Array(count),sizes=new Float32Array(count);
 // Deterministic distribution: no per-frame allocation or random object churn.
 for(let i=0;i<count;i++){const a=i*2.3999632297,r=.85+(i%13)/13*.65;positions[i*3]=Math.cos(a)*r;positions[i*3+1]=((i*17)%41)/41*2.2-1.1;positions[i*3+2]=Math.sin(a)*r;phases[i]=i*.731;sizes[i]=1+(i%5)*.22;}
 const particlesGeo=new T.BufferGeometry();particlesGeo.setAttribute('position',new T.BufferAttribute(positions,3));particlesGeo.setAttribute('aPhase',new T.BufferAttribute(phases,1));particlesGeo.setAttribute('aSize',new T.BufferAttribute(sizes,1));particlesGeo.boundingSphere=new T.Sphere(new T.Vector3(),2.4);
 const particlesMat=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false,uniforms:{uTime:{value:0},uPixelRatio:{value:1},uMotion:{value:reducedMotion?0:1}},vertexShader:`
 attribute float aPhase; attribute float aSize;
 uniform float uTime; uniform float uPixelRatio; uniform float uMotion;
 varying float vLight;
 void main(){
   vec3 p=position;
   p.y+=sin(uTime*.35+aPhase)*.08*uMotion;
   vec4 mv=modelViewMatrix*vec4(p,1.0);
   gl_Position=projectionMatrix*mv;
   gl_PointSize=clamp(aSize*28.0*uPixelRatio/max(1.0,-mv.z),1.0,7.0);
   float pulse=.5+.5*sin(uTime*.7*uMotion+aPhase);
   vLight=.12+.45*pow(pulse,8.0);
 }`,fragmentShader:`
 precision highp float;
 varying float vLight;
 void main(){
   vec2 uv=gl_PointCoord-.5;
   float r=length(uv)*2.0;
   if(r>1.0)discard;
   float glow=pow(1.0-r,3.0);
   float cross=max(0.0,1.0-abs(uv.x)*18.0)*max(0.0,1.0-abs(uv.y)*2.0)
              +max(0.0,1.0-abs(uv.y)*18.0)*max(0.0,1.0-abs(uv.x)*2.0);
   float alpha=min(.7,(glow+cross*.1)*vLight);
   gl_FragColor=vec4(.64,.9,1.0,alpha);
 }`});
 const particles=new T.Points(particlesGeo,particlesMat);particles.name='Quay / bounded prismatic motes';root.add(particles);
 let disposed=false,wasXR=false,lastScan=-1,scans=0;const originals=new Map();
 function update(time=0){
  if(disposed)return;
  const xr=!!renderer.xr?.isPresenting;
  // Never add a scene-transmission render pass to an immersive session.
  if(xr!==wasXR){wasXR=xr;gemstone.transmission=xr||reduced?0:.84;gemstone.transparent=xr||reduced;gemstone.opacity=xr||reduced?.84:1;gemstone.dispersion=xr||reduced?0:.035;gemstone.needsUpdate=true;}
  particlesMat.uniforms.uTime.value=reducedMotion?0:time;
  particlesMat.uniforms.uPixelRatio.value=Math.min(1.5,renderer.getPixelRatio?.()||1);
  // Improve existing plain metal without replacing animated materials or their
  // shader callbacks. Finish only material surfaces already authored as metal.
  if(scans<FINISH_LIMITS.scanLimit&&time-lastScan>=1){lastScan=time;scans++;scene.traverse(object=>{if(!object.isMesh||!object.material)return;for(const mat of Array.isArray(object.material)?object.material:[object.material]){if(!mat?.isMeshStandardMaterial||mat.map||mat.metalness<.8||mat.roughness<=.32||originals.has(mat)||mat===alloy)continue;originals.set(mat,mat.roughness);mat.roughness=.28;}});}
 }
 const oldBefore=particles.onBeforeRender;
 particles.onBeforeRender=function(r,s,c,g,m,group){update((globalThis.performance?.now?.()||0)/1000);oldBefore?.call(this,r,s,c,g,m,group);};
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const [m,r]of originals)m.roughness=r;originals.clear();for(const resource of [coreGeo,mountGeo,shardGeo,particlesGeo,gemstone,alloy,shardMat,particlesMat])resource.dispose();delete scene.userData.quayFinish;}
 const api={root,update,dispose,stats:()=>({profile:reduced?'reduced':'rich',sparkles:count,shards:FINISH_LIMITS.shards,transmissionMeshes:renderer.xr?.isPresenting||reduced?0:1,hardwareVerified:false})};scene.userData.quayFinish=api;return api;
}
