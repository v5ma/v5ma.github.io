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
 material.customProgramCacheKey=()=>`rainward-surface-v4-${metres}`;
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vRWPosition; varying vec3 vRWNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 rwP=vec4(transformed,1.0);vec3 rwN=normal;
   #ifdef USE_INSTANCING
    rwP=instanceMatrix*rwP;rwN=mat3(instanceMatrix)*rwN;
   #endif
   vRWPosition=(modelMatrix*rwP).xyz;vRWNormal=normalize(mat3(modelMatrix)*rwN);`);
  shader.fragmentShader=`varying vec3 vRWPosition;varying vec3 vRWNormal;
   vec4 rwSample(sampler2D tex){vec3 p=vRWPosition/${Number(metres).toFixed(3)};vec3 a=pow(abs(normalize(vRWNormal)),vec3(8.0));a/=max(a.x+a.y+a.z,.0001);return texture2D(tex,p.zy)*a.x+texture2D(tex,p.xz)*a.y+texture2D(tex,p.xy)*a.z;}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   diffuseColor *= rwSample(map);
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`float roughnessFactor=roughness;
  #ifdef USE_ROUGHNESSMAP
   roughnessFactor*=rwSample(roughnessMap).g;
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#ifdef USE_BUMPMAP
   float rwHeight=rwSample(bumpMap).r*bumpScale;
   normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(rwHeight),dFdy(rwHeight)),faceDirection);
  #endif`);
 };return material;
}
