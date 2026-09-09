/* Original material library. Pinned Three.js renderer; no CDN or external shaders. */
import * as T from './vendor/three.module.js';
export const JEWEL_VERSION='0.5.0';
export const LOOK_KEY='svgn.paper-delivery.look.v1';
export function resolveLook(value,touch=false){return ['balanced','cinematic','light'].includes(value)?value:touch?'light':'balanced';}
export function gemGeometry(radius=.42){
 // Table, eight crown facets, girdle and pavilion. Flat normals retain the cut.
 const p=[],rings=[[.43,.50],[1,.10],[1,0],[.15,-.66]],ring=(i,j)=>{const a=j*Math.PI/4;return [Math.cos(a)*rings[i][0]*radius,rings[i][1]*radius,Math.sin(a)*rings[i][0]*radius];};
 const tri=(a,b,c)=>p.push(...a,...b,...c);
 for(let j=0;j<8;j++){const k=(j+1)%8;tri([0,.5*radius,0],ring(0,k),ring(0,j));for(let i=0;i<3;i++){const a=ring(i,j),b=ring(i,k),c=ring(i+1,j),d=ring(i+1,k);tri(a,b,c);tri(b,d,c);}tri(ring(3,j),ring(3,k),[0,-.78*radius,0]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function prepareCrystal(mesh,geometry,material){mesh.geometry=geometry;mesh.material=material;mesh.scale.setScalar(1);mesh.position.y=.1;mesh.castShadow=false;return mesh;}
export function bevelGeometry(){const s=new T.Shape();s.moveTo(-.42,-.42);s.lineTo(.42,-.42);s.lineTo(.42,.42);s.lineTo(-.42,.42);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.84,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,steps:1,curveSegments:1});g.center();return g;}
export function reflectionPixels(w=256,h=128){
 const a=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/(h-1),sky=Math.max(0,1-v*1.8),horizon=Math.exp(-Math.pow((v-.48)*12,2));
  let r=.08+.28*sky+.65*horizon,g=.13+.5*sky+.63*horizon,b=.19+.94*sky+.52*horizon;
  // Original sky, horizon and broad bright cards. This is environment lighting,
  // not a live mirror capture, room photograph or ray-traced street reflection.
  for(const [cx,cy,sx,sy,power] of [[.14,.27,.028,.16,6],[.7,.32,.065,.026,4],[.94,.43,.014,.12,3]]){
   const dx=Math.min(Math.abs(u-cx),1-Math.abs(u-cx))/sx,dy=(v-cy)/sy,q=Math.exp(-Math.pow(dx,8)-Math.pow(dy,8))*power;r+=q;g+=q*.90;b+=q*.72;
  }
  const i=(y*w+x)*4;a[i]=r;a[i+1]=g;a[i+2]=b;a[i+3]=1;
 }return a;
}
/* Cheap reflected-color shader for Light mode. It samples the same authored
 * environment once; it deliberately does not claim physical transmission. */
export function lightOpticsMaterial(high,environment){
 const isGlass=high.userData.opticsRole==='glass';
 return new T.ShaderMaterial({name:high.name+' / lightweight reflection',transparent:isGlass,opacity:isGlass?.42:1,depthWrite:!isGlass,side:high.side,
  userData:{keepOptics:true,opticsHigh:high},uniforms:{env:{value:environment},tint:{value:high.color.clone()},metal:{value:high.metalness||0},glass:{value:isGlass?1:0},rotation:{value:new T.Matrix3()}},
  vertexShader:`#include <common>
   varying vec3 worldP,worldN;
   void main(){vec4 p=vec4(position,1.);vec3 n=normal;
   #ifdef USE_INSTANCING
    p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
   #endif
    worldP=(modelMatrix*p).xyz;worldN=inverseTransformDirection(normalize(normalMatrix*n),viewMatrix);gl_Position=projectionMatrix*viewMatrix*vec4(worldP,1.);}`,
  fragmentShader:`uniform sampler2D env;uniform vec3 tint;uniform float metal,glass;uniform mat3 rotation;varying vec3 worldP,worldN;
   void main(){vec3 n=normalize(worldN),v=normalize(cameraPosition-worldP),r=normalize(rotation*reflect(-v,n));float rim=pow(1.-abs(dot(n,v)),4.);
    vec2 uv=vec2(atan(r.z,r.x)*.159154943+.5,acos(clamp(r.y,-1.,1.))*.318309886);vec3 reflected=texture2D(env,uv).rgb;
    float lambert=.72+.28*max(0.,dot(n,normalize(vec3(-.3,.9,.2))));vec3 diffuse=tint*lambert;
    vec3 c=mix(diffuse,reflected*tint,metal*.84)+reflected*(.065+rim*.18);
    if(glass>.5)c=mix(tint*.3,reflected,.48+rim*.3);
    gl_FragColor=vec4(c,glass>.5?.30+rim*.25:1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
}

export function createMaterialLibrary(renderer,scene){
 const source=new T.DataTexture(reflectionPixels(),256,128,T.RGBAFormat,T.FloatType);source.mapping=T.EquirectangularReflectionMapping;source.colorSpace=T.LinearSRGBColorSpace;source.needsUpdate=true;
 let env=null,look='balanced',generation=0;const materials=new Set(),glass=new Set(),gem=new Set(),lite=new Map(),rotation=new T.Matrix4(),inverse=new T.Quaternion();
 const make=(name,p)=>{const m=new T.MeshPhysicalMaterial({name,roughness:.25,...p});materials.add(m);return m;};
 const chrome=make('SVGN / polished platinum',{color:'#dee9ec',metalness:1,roughness:.14,envMapIntensity:1.2});
 const gold=make('SVGN / champagne gold',{color:'#e9c075',metalness:1,roughness:.2,clearcoat:.8,clearcoatRoughness:.13,envMapIntensity:1.25});
 const ink=make('SVGN / ceramic graphite',{color:'#172b37',metalness:.25,roughness:.27,clearcoat:1});
 const glassMat=make('SVGN / architectural glass',{color:'#d4edf0',metalness:0,roughness:.035,ior:1.5,thickness:.18,transparent:true,opacity:.24,depthWrite:false,envMapIntensity:.7,clearcoat:.65});glass.add(glassMat);glassMat.userData.opticsRole="glass";
 const gems=['#5acedd','#b1a4ee','#efb95f'].map((color,i)=>{const m=make('SVGN / cut crystal '+i,{color,metalness:.1,roughness:.055,ior:2.1,thickness:.55,clearcoat:1,iridescence:.38,iridescenceIOR:1.3,iridescenceThicknessRange:[160,360],envMapIntensity:1.7});gem.add(m);return m;});
 const displayGems=gems.map((m,i)=>make('SVGN / display crystal '+i,{color:m.color,metalness:.32,roughness:.055,ior:2.1,clearcoat:1,iridescence:.55,envMapIntensity:1.6}));
 const paints=new Map();function paint(color){const c=new T.Color(color),key=c.getHexString();if(!paints.has(key))paints.set(key,make('SVGN / lacquer '+key,{color:c,metalness:.6,roughness:.23,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:1.2}));return paints.get(key);}
 function setLook(value){look=resolveLook(value);for(const m of [...glass,...gem]){const crystal=gem.has(m),refract=look==='cinematic';m.transmission=refract?(crystal?.78:.97):0;m.dispersion=refract&&crystal?.22:0;m.opacity=refract?1:crystal?1:.24;m.transparent=!refract&&!crystal;m.depthWrite=crystal;m.iridescence=crystal&&look!=='light'?.38:0;m.needsUpdate=true;}for(const m of materials)m.envMap=env?.texture||null;}
 function rebuild(){const old=env;const generator=new T.PMREMGenerator(renderer);env=generator.fromEquirectangular(source);generator.dispose();env.texture.name='SVGN / original HDR reflection environment';scene.environment=env.texture;scene.environmentIntensity=.35;for(const m of materials){m.envMap=env.texture;m.needsUpdate=true;}old?.dispose();generation++;}
 function applyTo(root){root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const high=o.material.userData.opticsHigh||o.material;if(!materials.has(high))return;if(look!=="light"){o.material=high;return;}if(!lite.has(high))lite.set(high,lightOpticsMaterial(high,source));o.material=lite.get(high);});}
 rebuild();setLook(look);
 return {chrome,gold,ink,glass:glassMat,gems,displayGems,paint,setLook,rebuild,applyTo,orient(q){for(const m of materials)m.envMapRotation.setFromQuaternion(q);rotation.makeRotationFromQuaternion(inverse.copy(q).invert());for(const m of lite.values())m.uniforms.rotation.value.setFromMatrix4(rotation);},get look(){return look;},get environment(){return env.texture;},inspect:()=>({version:JEWEL_VERSION,look,environmentReady:!!env,generation,materialCount:materials.size,lightweightMaterials:lite.size,lightweightReflection:look==='light',transmissive:look==='cinematic',reflections:'generated HDR environment, not live scene ray tracing'}),dispose(){for(const m of materials)m.dispose();for(const m of lite.values())m.dispose();env?.dispose();source.dispose();}};
}
