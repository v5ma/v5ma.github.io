/* Three.js physical materials + original bounded GLSL effects.
 * Cinematic glass refracts only the virtual scene, never camera/passthrough.
 * AR uses a translucent Fresnel material and never asks for a screen buffer. */
(function(root){'use strict';
 const vertex=`varying vec3 vN; varying vec3 vP; varying vec2 vUv;
 void main(){vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.); vP=p.xyz; vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`;
 const planeVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 function create(T){const clock={value:0},pulse={value:0},strength={value:.72},motion={value:1};const owned=[],geometries=[],textures=[],targets=[];
  const keep=m=>(owned.push(m),m),color=h=>new T.Color(h);
  const gold=keep(new T.MeshPhysicalMaterial({color:0xdcc1a0,metalness:1,roughness:.19,clearcoat:1,clearcoatRoughness:.13,envMapIntensity:1.6}));gold.name='Champagne-gold polished bezel';
  const silver=keep(new T.MeshPhysicalMaterial({color:0xd5e5ee,metalness:1,roughness:.14,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.5}));silver.name='Machined platinum';
  const ceramic=keep(new T.MeshPhysicalMaterial({color:0x101d28,metalness:.45,roughness:.19,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.2}));ceramic.name='Gloss ceramic grip';
  const physical=[0x64efd9,0xff8aab].map(c=>{const m=keep(new T.MeshPhysicalMaterial({color:c,metalness:0,roughness:.045,transmission:.78,thickness:.28,ior:2.15,dispersion:.35,attenuationColor:color(c),attenuationDistance:.8,clearcoat:1,clearcoatRoughness:.04,iridescence:.22,iridescenceIOR:1.35,iridescenceThicknessRange:[120,340],envMapIntensity:1.85,flatShading:true}));m.name='Dispersive optical jewel';return m;});
  const envVertex=vertex;
  const crystal=[0x6eeed6,0xff94b1].map(c=>{const m=keep(new T.ShaderMaterial({vertexShader:envVertex,uniforms:{uColor:{value:color(c)},uTime:clock,uStrength:strength,uMotion:motion,uAR:{value:0}},transparent:true,depthWrite:false,side:T.FrontSide,fragmentShader:`
  varying vec3 vN;varying vec3 vP;varying vec2 vUv;uniform vec3 uColor;uniform float uTime,uStrength,uMotion,uAR;
  vec3 studio(vec3 r){float strip=pow(max(0.,1.-abs(r.x*.7+r.y*.4-.22)),32.);float band=pow(max(0.,1.-abs(r.x*-.8+r.z*.6+.25)),52.);return vec3(.12,.22,.33)+vec3(1.7,1.5,1.2)*strip+vec3(.45,.95,1.2)*band;}
  void main(){vec3 n=normalize(vN),v=normalize(-vP);float nv=abs(dot(n,v)),f=pow(1.-nv,3.);vec3 r=reflect(-v,n);vec3 refr=refract(-v,n,1./2.15);
   vec3 spectrum=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+vec3(nv*1.7+dot(n,vec3(.3,.2,.4)))));
   float facet=pow(abs(sin(dot(refr,vec3(21.,13.,19.)))),12.);
   vec3 rgb=mix(uColor*.38,studio(r)*uColor,.48)+spectrum*(.1+.34*f)*uStrength+vec3(.75)*facet*.17;
   float alpha=mix(.92,.43+.42*f,uAR);gl_FragColor=vec4(rgb,alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`}));m.name='AR-safe translucent faceted Fresnel';return m;});
  const blade=[0x5cf4d8,0xff83a9].map(c=>{const m=keep(new T.ShaderMaterial({vertexShader:vertex,uniforms:{uColor:{value:color(c)},uTime:clock,uPulse:pulse,uStrength:strength,uMotion:motion},transparent:true,depthWrite:false,fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec2 vUv;uniform vec3 uColor;uniform float uTime,uPulse,uStrength,uMotion;
   void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(-vP))),1.35);float flow=.5+.5*sin(vUv.x*26.-uTime*2.*uMotion);vec3 c=mix(uColor*.7,vec3(1.),rim*.7);c+=uColor*(flow*.2+uPulse*.12)*uStrength;gl_FragColor=vec4(c,.45+rim*.42);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`}));m.name='Energy crystal blade';return m;});
  const halo=[0x60e9d7,0xff82ad].map(c=>keep(new T.ShaderMaterial({vertexShader:planeVertex,uniforms:{uColor:{value:color(c)},uStrength:strength,uPulse:pulse},transparent:true,depthWrite:false,blending:T.AdditiveBlending,fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform float uStrength,uPulse;void main(){float d=length(vUv-.5)*2.;float a=exp(-d*d*9.)*(1.-smoothstep(.65,1.,d))*.23*uStrength;gl_FragColor=vec4(uColor*(1.+.12*uPulse),a);#include <colorspace_fragment>}`.replace(';#',';\n#')})));
  const trail=[0x75f1d8,0xff8eaf].map(c=>keep(new T.ShaderMaterial({vertexShader:planeVertex,uniforms:{uColor:{value:color(c)},uStrength:strength},side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform float uStrength;void main(){float tail=pow(vUv.x,2.5),edge=sin(vUv.y*3.14159);gl_FragColor=vec4(mix(uColor,vec3(1.),pow(edge,10.)*.35),tail*edge*.23*uStrength);\n#include <colorspace_fragment>}`})));
  const aurora=keep(new T.ShaderMaterial({vertexShader:planeVertex,uniforms:{uTime:clock,uMotion:motion,uStrength:strength},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,fragmentShader:`varying vec2 vUv;uniform float uTime,uMotion,uStrength;
   void main(){float x=vUv.x,t=uTime*.08*uMotion;float ridge=.52+sin(x*5.2+t)*.11+sin(x*11.3-t*.6)*.045;float band=exp(-abs(vUv.y-ridge)*19.)*(.5+.5*sin(x*27.+vUv.y*13.+t));float edge=smoothstep(0.,.12,x)*(1.-smoothstep(.88,1.,x));vec3 c=mix(vec3(.16,.58,.57),vec3(.54,.22,.55),x);gl_FragColor=vec4(c,band*edge*.39*uStrength);\n#include <colorspace_fragment>}`}));aurora.name='Studio-only silk aurora';
  const floor=keep(new T.MeshPhysicalMaterial({color:0x172335,metalness:.72,roughness:.26,clearcoat:.38,clearcoatRoughness:.25,envMapIntensity:.22}));floor.name='Environment-reflective obsidian';
  // A real custom shader is inserted into the PBR floor, not a scrolling image.
  floor.onBeforeCompile=s=>{s.uniforms.uJewelTime=clock;s.uniforms.uJewelStrength=strength;s.uniforms.uJewelMotion=motion;s.vertexShader='varying vec3 vJewelLocal;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvJewelLocal=position;');s.fragmentShader='uniform float uJewelTime,uJewelStrength,uJewelMotion;varying vec3 vJewelLocal;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 vec2 q=vJewelLocal.xz;float t=uJewelTime*.16*uJewelMotion;float a=sin(q.x*2.9+sin(q.y*2.2+t))+cos(q.y*3.3-sin(q.x*2.+t));float b=sin(q.x*3.7-q.y*1.9+t*.6);float lace=pow(max(0.,1.-abs(a+b)*.7),10.);float mask=exp(-length(q*vec2(.4,.12))*.9);totalEmissiveRadiance+=vec3(.04,.21,.24)*lace*mask*uJewelStrength;`);};floor.customProgramCacheKey=()=> 'prism-caustic-lace-v1';
  function environment(renderer){if(targets.length)return;const w=256,h=128,data=new Float32Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/w,v=y/h,du=(a,b)=>Math.min(Math.abs(a-b),1-Math.abs(a-b));const warm=Math.exp(-((du(u,.14)/.032)**2+((v-.46)/.21)**8))*13;const cool=Math.exp(-((du(u,.63)/.022)**2+((v-.50)/.32)**8))*8;const top=Math.exp(-(((v-.15)/.11)**2))*1.5;const i=(y*w+x)*4;data[i]=.12+warm+cool*.55+top;data[i+1]=.17+warm*.83+cool*.92+top;data[i+2]=.24+warm*.62+cool*1.12+top;data[i+3]=1;}
   const t=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);t.mapping=T.EquirectangularReflectionMapping;t.needsUpdate=true;const pm=new T.PMREMGenerator(renderer);const env=pm.fromEquirectangular(t);targets.push(env);for(const m of[gold,silver,ceramic,floor,...physical]){m.envMap=env.texture;m.needsUpdate=true;}pm.dispose();t.dispose();
  }
  const state={quality:'cinematic',ar:false,immersive:false,reduced:false,intensity:.72,environmentReady:false};
  function setQuality(quality,ar,immersive=false){state.quality=quality;state.ar=ar;state.immersive=immersive;for(const c of crystal)c.uniforms.uAR.value=ar?1:0;return state;}
  function jewel(hand){return state.quality==='cinematic'&&!state.immersive?physical[hand]:crystal[hand];}
  function update(time,beat,intensity,reduced){state.reduced=reduced;state.intensity=intensity;clock.value=time;motion.value=reduced?0:1;pulse.value=reduced?0:Math.pow(Math.max(0,1-beat),4)*.6;strength.value=intensity*(state.ar?.6:1);}
  function dispose(){for(const m of owned)m.dispose();for(const t of targets)t.dispose();for(const t of textures)t.dispose();}
  return {gold,silver,ceramic,physical,crystal,blade,halo,trail,aurora,floor,jewel,setQuality,update,state,environment,dispose,owned};
 }
 root.PrismMaterials=Object.freeze({create});
})(globalThis);
