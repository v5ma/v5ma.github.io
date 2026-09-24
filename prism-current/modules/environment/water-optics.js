/* Currentworks Water Optics 0.2.1 / Clear Shoals.
 * Reversible Water 0.1.0 extension. No scene-copy, float targets or renderer.
 * See CLEARWATER-NOTICE.txt for the adapted Fresnel helper and attribution.
 */
(function(root){'use strict';
 const VERSION='0.2.1';
 const D=typeof module!=='undefined'&&module.exports?require('./water-detail'):root.SVGNWaterDetail;
 function patch(source,pairs){for(const [from,to] of pairs){if(source.split(from).length!==2)throw new Error('Unsupported water shader revision: '+from.slice(0,45));source=source.replace(from,to);}return source;}
 function attach(T,material){
  if(!T?.Vector4||!T?.DataTexture||!D?.generate||!material?.isShaderMaterial||!material.uniforms?.waterNoise)throw new TypeError('Water Optics requires Currentworks Water and Water Detail.');
  if(material.userData.currentworksOptics)throw new Error('Water optics already attached.');
  const old=material.fragmentShader,oldVertex=material.vertexShader;
  // The unnormalized columns preserve nonuniform AR scale when converting a
  // refracted view ray to the authored bed's local coordinate system.
  const vertex=patch(oldVertex,[
   ['varying vec3 vLocal, vEye, vTx, vTz;',`varying vec3 vLocal, vEye, vTx, vTz;
    varying vec3 opticalX,opticalY,opticalZ;`],
   ['vEye=-view.xyz;vTx=mat3(modelViewMatrix)*dx;vTz=mat3(modelViewMatrix)*dz;',`vEye=-view.xyz;vTx=mat3(modelViewMatrix)*dx;vTz=mat3(modelViewMatrix)*dz;
      opticalX=modelViewMatrix[0].xyz;opticalY=modelViewMatrix[1].xyz;opticalZ=modelViewMatrix[2].xyz;`]
  ]);
  const source=patch(old,[
   ['uniform sampler2D waterNoise;',`uniform sampler2D waterNoise,waterDetail,waterPebbles;
    uniform vec4 optics;
    uniform vec2 causticShift;
    varying vec3 opticalX,opticalY,opticalZ;
    // Unpolarized air/water reflectance, adapted from Clearwater (MIT).
    float dielectric(float c){
      float eta=1.3335,ct=sqrt(1.-(1.-c*c)/(eta*eta));
      float rs=(c-eta*ct)/(c+eta*ct),rp=(eta*c-ct)/(eta*c+ct);
      return .5*(rs*rs+rp*rp);
    }
    vec3 toWaterLocal(vec3 ray){
      vec3 a=cross(opticalY,opticalZ),b=cross(opticalZ,opticalX),c=cross(opticalX,opticalY);
      float determinant=dot(opticalX,a);
      float safeDet=(determinant<0.?-1.:1.)*max(.00001,abs(determinant));
      return vec3(dot(ray,a),dot(ray,b),dot(ray,c))/safeDet;
    }`],
   ['return mix(c,vec3(.70,.74,.76),cloud*.60);',`vec3 reflected=mix(c,vec3(.70,.74,.76),cloud*.60);
      return mix(reflected,vec3(.29,.39,.46),optics.x);`],
   ['float wake=0.,splash=0.;',`// Mips retain mean squared slope, rather than turning unresolved waves
      // into an artificially mirror-flat surface. Data is uploaded once.
      vec2 opticalDrift=vec2(time*.013,-time*.008);
      vec4 micro=texture2D(waterDetail,q*.25+opticalDrift);
      vec2 meanSlope=(micro.rg-.5)*.70;
      float slopeVariance=max(0.,micro.b*.25-dot(meanSlope,meanSlope)-.0011);
      slope=slope*.16+meanSlope*mix(.55,1.,motion);
      float wake=0.,splash=0.;`],
   ['float fresnel=.0204+.9796*pow(1.-nv,5.);',`float fresnel=.0204+.9796*pow(1.-nv,5.);
      float opticalFresnel=dielectric(clamp(nv,0.,1.));`],
   [`float path=min(14.,vDepth/max(.22,nv));
      vec3 transmittance=exp(-absorption*path);
      vec3 bentRay=refract(-eye,normal,.752);
      vec2 bedDirection=vec2(dot(bentRay,tx),dot(bentRay,tz));
      vec2 bedUV=vLocal.xz+bedDirection*min(8.,vDepth/max(.25,abs(dot(bentRay,normal))))+slope*vDepth*.12;
      float sand=texture2D(waterNoise,bedUV*.48).b;
      vec3 bed=mix(vec3(.17,.20,.13),vec3(.37,.36,.21),sand);
      if(detail>.5)bed+=vec3(.15,.23,.12)*caustic(bedUV)*exp(-vDepth*.65);`,
    `// Intersect the refracted ray with the locally authored depth plane.
      // This is procedural bed shading, NEVER an image of the real room.
      vec3 localRay=toWaterLocal(refract(-eye,normal,1./1.3335));
      float bedDistance=min(14.,vDepth/max(.12,-localRay.y));
      vec2 bedUV=vLocal.xz+localRay.xz*bedDistance;
      float path=min(14.,length(localRay)*bedDistance);
      vec3 transmittance=exp(-absorption*path*.78);
      vec4 pebbles=texture2D(waterPebbles,bedUV*.625);
      float depthBlend=exp(-vDepth*.35);
      vec3 bed=mix(vec3(.23,.25,.19),pebbles.rgb,depthBlend);
      // Flux was baked at one reference depth. Advection and light shift are
      // a bounded approximation, not a newly simulated wave/refraction field.
      vec2 causticUV=(bedUV-current*time-causticShift*(vDepth/1.25))*.25+opticalDrift;
      float focused=texture2D(waterDetail,causticUV).a*4.;
      float focusWeight=exp(-abs(vDepth-1.25)*.40)*smoothstep(.015,.12,vDepth);
      bed*=1.+(focused-1.)*.62*focusWeight;
      bed+=vec3(.085,.105,.065)*max(0.,focused-1.)*focusWeight;`],
   ['color=mix(color,sky(reflection),min(.92,fresnel));','color=mix(color,sky(reflection),min(.92,opticalFresnel));'],
   ['float r=clamp(roughness+length(fwidth(normal))*.50,.09,.55),a=r*r,a2=a*a;',`float r=clamp(sqrt(roughness*roughness+1.6*slopeVariance)+optics.y+length(fwidth(normal))*.65,.12,.55),a=r*r,a2=a*a;`],
   ['float crest=smoothstep(.065,.22,vCompression)*aaStep(.50,breakup);',`float filament=abs(n0.b-n1.b);
      float crest=smoothstep(.055,.20,vCompression)*aaStep(.43,breakup)*(.55+.45*aaStep(.13,filament));`],
   ['color=mix(color,vec3(.70,.83,.78),foam);',`vec3 foamColor=mix(vec3(.38,.56,.59),vec3(.82,.89,.83),.45+.55*nl);
      color=mix(color,foamColor,foam);
      float thinCrest=vCompression*(1.-nv)*exp(-vDepth*.24);
      color+=vec3(.025,.095,.075)*thinCrest*optics.z;`],
   ['gl_FragColor=vec4(color,alpha);',`// Keep the original opacity cap and fade around the player's feet.
      float nearRoom=mix(1.,smoothstep(.50,1.45,length(vEye)),optics.w);
      gl_FragColor=vec4(color,alpha*nearRoom);`]
  ]);
  // Validate the exact shader contract BEFORE allocating or mutating anything.
  const generated=D.generate(),owned=[];
  function texture(data,size,name){const t=new T.DataTexture(data,size,size,T.RGBAFormat,T.UnsignedByteType);
   t.name=name;t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;
   t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;owned.push(t);return t;}
  const uniform={value:new T.Vector4(.08,.025,1,0)};let additions;
  try{additions={optics:uniform,waterDetail:{value:texture(generated.data,128,'Currentworks / slope moments and focused light')},
   waterPebbles:{value:texture(D.pebbles(),256,'Currentworks / original pebble bed')},causticShift:{value:new T.Vector2(...generated.shift)}};}
  catch(e){for(const t of owned)t.dispose();throw e;}
  Object.assign(material.uniforms,additions);material.vertexShader=vertex;material.fragmentShader=source;
  material.userData.currentworksOptics=VERSION;material.needsUpdate=true;let disposed=false,prepared=false,pending=null,warmupDraws=0;
  function update(frame={}){if(disposed||!frame||typeof frame!=='object'||Array.isArray(frame))return false;uniform.value.w=frame.ar===true?1:0;return true;}
  // Exercise the actual water buffers/material during cancellable loading.
  // Nothing here advances the host clock or exposes a synthetic gameplay event.
  function warm(renderer,mesh,scene){
   if(!renderer.isWebGLRenderer)return; // Explicitly labeled test collaborators.
   const target=new T.WebGLRenderTarget(24,24,{depthBuffer:true,stencilBuffer:false});
   const scratch=new T.Scene(),cam=new T.PerspectiveCamera(55,1,.01,1000),proxy=new T.Mesh(mesh.geometry,material);
   const vp=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4());
   const before={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),xr:renderer.xr.enabled,autoClear:renderer.autoClear,scissor:renderer.getScissorTest()};
   target.isXRRenderTarget=!before.target||before.target.isXRRenderTarget===true;
   target.texture.colorSpace=target.isXRRenderTarget?(before.target?.texture.colorSpace||renderer.outputColorSpace):T.ColorManagement.workingColorSpace;
   scratch.fog=scene?.fog||null;scratch.environment=scene?.environment||null;
   scene?.traverseVisible?.(o=>{if(o.isLight)scratch.add(o.clone(false));});
   proxy.frustumCulled=false;scratch.add(proxy);
   // Compute bounds on a temporary Box3, not by changing the caller's geometry.
   const bounds=new T.Box3().setFromBufferAttribute(mesh.geometry.attributes.position),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
   const height=Math.max(size.x,size.z,2);
   cam.position.set(center.x,center.y+height,center.z+height*.20);cam.lookAt(center);
   const originalOpacity=material.uniforms.opacity.value,originalAR=uniform.value.w;
   try{
    // Representative fragments are warmed even when the saved room opacity is zero.
    material.uniforms.opacity.value=.38;uniform.value.w=0;
    renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setScissorTest(false);
    renderer.render(scratch,cam);renderer.getContext().finish();warmupDraws++;
   }finally{
    material.uniforms.opacity.value=originalOpacity;uniform.value.w=originalAR;material.uniformsNeedUpdate=true;scratch.clear();
    renderer.setRenderTarget(before.target,before.face,before.mip);renderer.setViewport(vp);renderer.setScissor(sc);renderer.setScissorTest(before.scissor);
    renderer.autoClear=before.autoClear;renderer.xr.enabled=before.xr;target.dispose();
   }
  }
  function prepare(renderer,camera,scene,mesh){
   if(disposed)return Promise.resolve();
   if(!mesh?.isMesh||mesh.material!==material||!mesh.geometry?.attributes.position)return Promise.reject(new TypeError('Optical preparation needs its existing water mesh.'));
   if(prepared)return Promise.resolve();if(pending)return pending;
   pending=Promise.resolve().then(async()=>{
    if(disposed)return;
    renderer.initTexture?.(material.uniforms.waterNoise.value);for(const t of owned)renderer.initTexture?.(t);
    // A detached proxy avoids exposing or reparenting the live water surface.
    const proxy=new T.Mesh(mesh.geometry,material),group=new T.Group();group.add(proxy);
    try{if(renderer.compileAsync)await renderer.compileAsync(group,camera,scene);else renderer.compile(group,camera,scene);}
    finally{group.clear();}
    if(disposed)return;warm(renderer,mesh,scene);prepared=true;
   }).finally(()=>{pending=null;});return pending;
  }
  function dispose(){if(disposed)return;disposed=true;material.fragmentShader=old;material.vertexShader=oldVertex;
   for(const key of Object.keys(additions))delete material.uniforms[key];for(const t of owned)t.dispose();
   delete material.userData.currentworksOptics;material.needsUpdate=true;}
  return Object.freeze({update,prepare,dispose,get stats(){return {module:'Currentworks Water Optics',version:VERSION,ar:uniform.value.w===1,disposed,prepared,warmupDraws,
   renderTargets:0,extraTextures:disposed?0:2,dataBytes:disposed?0:327680,caustics:'precomputed-refracted-flux',meanBakedFlux:generated.meanFlux};}});
 }
 const api=Object.freeze({VERSION,attach});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNWaterOptics=api;
})(globalThis);
