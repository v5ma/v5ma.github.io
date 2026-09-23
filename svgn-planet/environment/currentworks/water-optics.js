/* Currentworks Water Optics 0.1.0. Original extension for Water 0.1.0.
 * Explicit, reversible material integration; no scene-copy or renderer ownership.
 */
(function(root){'use strict';
 const VERSION='0.1.0';
 function attach(T,material){
  if(!T?.Vector4||!material?.isShaderMaterial||!material.uniforms?.waterNoise)throw new TypeError('Water Optics requires a Currentworks water ShaderMaterial.');
  if(material.userData.currentworksOptics)throw new Error('Water optics already attached.');
  const old=material.fragmentShader,patches=[
   ['uniform sampler2D waterNoise;',`uniform sampler2D waterNoise;\nuniform vec4 optics;`],
   ['return mix(c,vec3(.70,.74,.76),cloud*.60);',`// Rough surfaces reflect a wider sky lobe instead of a razor-sharp cloud.
      vec3 reflected=mix(c,vec3(.70,.74,.76),cloud*.60);
      return mix(reflected,vec3(.29,.39,.46),optics.x);`],
   ['float wake=0.,splash=0.;',`// A larger moving modulation breaks up repeated small ripples without
      // another texture fetch, simulation pass, or camera-space noise.
      slope*=.78+.30*n1.a;
      float wake=0.,splash=0.;`],
   ['float r=clamp(roughness+length(fwidth(normal))*.50,.09,.55),a=r*r,a2=a*a;',`// Widen the solar lobe to stabilize glitter at stereo pixel footprints.
      float r=clamp(roughness+optics.y+length(fwidth(normal))*.65,.12,.55),a=r*r,a2=a*a;`],
   ['float crest=smoothstep(.065,.22,vCompression)*aaStep(.50,breakup);',`float filament=abs(n0.b-n1.b);
      float crest=smoothstep(.055,.20,vCompression)*aaStep(.43,breakup)*(.55+.45*aaStep(.13,filament));`],
   ['color=mix(color,vec3(.70,.83,.78),foam);',`// Foam is a lit surface, not an emissive white outline.
      vec3 foamColor=mix(vec3(.38,.56,.59),vec3(.82,.89,.83),.45+.55*nl);
      color=mix(color,foamColor,foam);
      float thinCrest=vCompression*(1.-nv)*exp(-vDepth*.24);
      color+=vec3(.025,.095,.075)*thinCrest*optics.z;`],
   ['gl_FragColor=vec4(color,alpha);',`// Fade only the near water, preserving passthrough around the player's feet.
      float nearRoom=mix(1.,smoothstep(.50,1.45,length(vEye)),optics.w);
      gl_FragColor=vec4(color,alpha*nearRoom);`]
  ];
  let source=old;
  for(const [from,to] of patches){if(source.split(from).length!==2)throw new Error('Unsupported water shader revision: '+from.slice(0,45));source=source.replace(from,to);}
  const uniform={value:new T.Vector4(.08,.025,1,0)};
  material.uniforms.optics=uniform;material.fragmentShader=source;material.userData.currentworksOptics=VERSION;material.needsUpdate=true;let disposed=false;
  function update(frame={}){if(disposed||!frame||typeof frame!=='object')return false;uniform.value.w=frame.ar===true?1:0;return true;}
  function dispose(){if(disposed)return;disposed=true;material.fragmentShader=old;delete material.uniforms.optics;delete material.userData.currentworksOptics;material.needsUpdate=true;}
  return Object.freeze({update,dispose,get stats(){return {module:'Currentworks Water Optics',version:VERSION,ar:uniform.value.w===1,disposed,renderTargets:0,extraTextures:0};}});
 }
 const api=Object.freeze({VERSION,attach});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNWaterOptics=api;
})(globalThis);
