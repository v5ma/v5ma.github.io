/* Reproducible local material authoring. Separate albedo, micro-height and
 * roughness; metre-scale projection avoids stretched 80-metre texture squares.
 * These are authored procedural assets, not scans and not imported AAA art. */
import * as T from './vendor/three.module.js';
const fract=x=>x-Math.floor(x),hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453),mix=(a,b,t)=>a+(b-a)*t;
function noise(x,y,period){let a=Math.floor(x),b=Math.floor(y),u=fract(x),v=fract(y);u=u*u*(3-2*u);v=v*v*(3-2*v);return mix(mix(hash((a+period)%period,(b+period)%period),hash((a+1+period)%period,(b+period)%period),u),mix(hash((a+period)%period,(b+1+period)%period),hash((a+1+period)%period,(b+1+period)%period),u),v);}
export function authorSurface(kind='stone',size=256){
 const pixels=new Uint8ClampedArray(size*size*4),heights=new Uint8ClampedArray(pixels.length),rough=new Uint8ClampedArray(pixels.length);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=.5*noise(u*8,v*8,8)+.3*noise(u*32,v*32,32)+.2*noise(u*64,v*64,64),fine=hash(x,y);
  const brick=kind==='brick',road=kind==='road',rock=kind==='rock',rows=brick?8:4,cols=brick?4:3;
  const gy=v*rows,gx=u*cols+(Math.floor(gy)%2)*.5,fx=fract(gx),fy=fract(gy),seam=Math.min(fx,1-fx,fy,1-fy),joint=!road&&!rock?1-Math.min(1,Math.max(0,(seam-.019)/.045)):0;
  const variation=hash(Math.floor(gx)%cols,Math.floor(gy)%rows),moss=!road&&!rock?joint*Math.max(0,noise(u*16+5,v*16,16)-.35):0;
  const height=road?.38+n*.25:rock?.25+n*.6:(.48+variation*.15+n*.2)*(1-joint*.70);
  let shade=(road?.49:rock?.63:brick?.62:.79)+(n-.5)*.24+(variation-.5)*(road||rock?0:.20)-joint*.32;
  const channels=brick?[1.07,.91,.79]:road?[.9,.94,.96]:rock?[.99,1,.96]:[1.04,1,.9];
  const i=(y*size+x)*4;
  for(let c=0;c<3;c++){pixels[i+c]=Math.max(0,Math.min(255,(shade*channels[c]+moss*(c===1?.15:-.10)+(fine-.5)*.03)*255));heights[i+c]=height*255;rough[i+c]=(road?.48+n*.28:.73+n*.22)*255;}
  pixels[i+3]=heights[i+3]=rough[i+3]=255;
 }
 return {size,albedo:pixels,height:heights,roughness:rough};
}
function texture(data,size,color){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');ctx.putImageData(new ImageData(data,size,size),0,0);const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;return t;}
export function physicalSurface(kind){const d=authorSurface(kind);return {map:texture(d.albedo,d.size,true),bump:texture(d.height,d.size,false),rough:texture(d.roughness,d.size,false)};}
export function worldTexturing(material,metres=2.6){
 material.userData.worldSurface=metres;
 material.customProgramCacheKey=()=>`rainward-surface-v5-${metres}`;
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vRWPosition; varying vec3 vRWNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 rwP=vec4(transformed,1.0);vec3 rwN=normal;
   #ifdef USE_INSTANCING
    rwP=instanceMatrix*rwP;rwN=mat3(instanceMatrix)*rwN;
   #endif
   vRWPosition=(modelMatrix*rwP).xyz;vRWNormal=normalize(mat3(modelMatrix)*rwN);`);
  shader.fragmentShader=`varying vec3 vRWPosition;varying vec3 vRWNormal;
   mat3 rwFrame(vec3 eye,vec3 n,vec2 uv){vec3 q0=dFdx(eye),q1=dFdy(eye);vec2 st0=dFdx(uv),st1=dFdy(uv);vec3 p1=cross(q1,n),p0=cross(n,q0);vec3 t=p1*st0.x+p0*st1.x,b=p1*st0.y+p0*st1.y;float scale=inversesqrt(max(max(dot(t,t),dot(b,b)),1e-12));return mat3(t*scale,b*scale,n);}

   vec4 rwSample(sampler2D tex){vec3 p=vRWPosition/${Number(metres).toFixed(3)};vec3 a=pow(abs(normalize(vRWNormal)),vec3(8.0));a/=max(a.x+a.y+a.z,.0001);return texture2D(tex,p.zy)*a.x+texture2D(tex,p.xz)*a.y+texture2D(tex,p.xy)*a.z;}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   diffuseColor *= rwSample(map);
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`float roughnessFactor=roughness;
  #ifdef USE_ROUGHNESSMAP
   roughnessFactor*=rwSample(roughnessMap).g;
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',T.ShaderChunk.aomap_fragment.replace('texture2D( aoMap, vAoMapUv ).r','rwSample(aoMap).r'));
  shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>',T.ShaderChunk.metalnessmap_fragment.replace('texture2D( metalnessMap, vMetalnessMapUv )','rwSample(metalnessMap)'));
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#ifdef USE_NORMALMAP_TANGENTSPACE
   vec3 rwP5=vRWPosition/${Number(metres).toFixed(3)};
   vec3 rwWeights=pow(abs(normalize(vRWNormal)),vec3(8.0));rwWeights/=max(dot(rwWeights,vec3(1.0)),.0001);
   vec3 nx=texture2D(normalMap,rwP5.zy).xyz*2.0-1.0;
   vec3 ny=texture2D(normalMap,rwP5.xz).xyz*2.0-1.0;
   vec3 nz=texture2D(normalMap,rwP5.xy).xyz*2.0-1.0;
   nx.xy*=normalScale;ny.xy*=normalScale;nz.xy*=normalScale;
   normal=normalize(rwFrame(-vViewPosition,normal,rwP5.zy)*nx*rwWeights.x+rwFrame(-vViewPosition,normal,rwP5.xz)*ny*rwWeights.y+rwFrame(-vViewPosition,normal,rwP5.xy)*nz*rwWeights.z);
  #elif defined(USE_BUMPMAP)
   float rwHeight=rwSample(bumpMap).r*bumpScale;
   normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(rwHeight),dFdy(rwHeight)),faceDirection);
  #endif`);
 };return material;
}

/* Reduced Graphics uses a single world-scaled color fetch per fragment. Select
 * the dominant plane per vertex; unlike the PBR tier this has no three-axis
 * blending or height derivatives. It changes material cost, not scene geometry. */
export function reducedWorldTexturing(material,metres=2.6){
 material.userData.worldSurface=metres;material.userData.surfaceTier='single-projection';
 material.customProgramCacheKey=()=>`rainward-surface-simple-v4-${metres}`;
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 vRWUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 rwP=vec4(transformed,1.0);vec3 rwN=normal;
   #ifdef USE_INSTANCING
    rwP=instanceMatrix*rwP;rwN=mat3(instanceMatrix)*rwN;
   #endif
   vec3 rwWorld=(modelMatrix*rwP).xyz/${Number(metres).toFixed(3)};
   vec3 rwAxis=abs(normalize(mat3(modelMatrix)*rwN));
   vRWUv=rwAxis.y>=rwAxis.x&&rwAxis.y>=rwAxis.z?rwWorld.xz:(rwAxis.x>=rwAxis.z?rwWorld.zy:rwWorld.xy);`);
  shader.fragmentShader='varying vec2 vRWUv;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   diffuseColor *= texture2D(map,vRWUv);
  #endif`);
 };return material;
}
