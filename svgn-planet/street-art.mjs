/* Graphics-only resource transaction. Gameplay coordinates, saves and inputs
 * are intentionally outside this module. All runtime resources are local. */
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {createStreetSet} from './street-set.mjs';
import {createArtQuality} from './street-quality.mjs';
import {distance} from './world.mjs';
export const ART_VERSION='0.5.0';
const base=new URL('./assets/street-art/',import.meta.url);
export function ribbonUV(geometry,points,width,meters=3){const uv=[];let d=0;for(let i=1;i<points.length;i++){const next=d+distance(points[i-1],points[i]);uv.push(0,d/meters,0,next/meters,width/meters,d/meters,0,next/meters,width/meters,next/meters,width/meters,d/meters);d=next;}if(uv.length/2!==geometry.attributes.position.count)throw Error('Road texture coordinates must match its rendered geometry');geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
export function loadStreetArt({root,fallback,renderer,asphalt,sidewalks,land,roadPoints,extraRoads=[],optics=null}){
 const scene=root.parent,low=!renderer.shadowMap.enabled;let status='loading',error=null,set=null,quality=null,expired=false,redraw=true,rendered=0;const loader=new T.TextureLoader();const texturePromises=[];
 function texture(name,color){const p=loader.loadAsync(new URL(name,base).href).then(t=>{t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;});texturePromises.push(p);return p;}
 async function material(asset,roughness,relief){const [map,normalMap,roughnessMap]=await Promise.all([texture(asset+'-color.jpg',true),texture(asset+'-normal.jpg',false),texture(asset+'-rough.jpg',false)]);return new T.MeshStandardMaterial({map,normalMap,roughnessMap,normalScale:new T.Vector2(relief,relief),roughness,color:0xffffff,side:T.DoubleSide});}
 const work=Promise.all([new GLTFLoader().loadAsync(new URL('street-art.gltf',base).href),material('aerial_asphalt_01',.91,.42),material('concrete_pavement',.95,.45),material('rocky_terrain_02',1,.30),texture(low?'sky-mobile.jpg':'sky-desktop.jpg',true)]).then(([gltf,road,paving,lawn,skyMap])=>{
  if(expired)return;optics?.(gltf.scene);const next=createStreetSet(gltf.scene,renderer);
  ribbonUV(asphalt.geometry,roadPoints,6.4,3);asphalt.material=road;
  for(const r of extraRoads){ribbonUV(r.mesh.geometry,r.points,r.width,3);r.mesh.material=road;}
  for(const [m,points] of sidewalks){ribbonUV(m.geometry,points,1.55,2.1);m.material=paving;}
  lawn.side=T.FrontSide;lawn.normalMap=null;lawn.roughnessMap=null;lawn.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition; varying vec3 terrainNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPosition=position;terrainNormal=normal;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition; varying vec3 terrainNormal;').replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 weights=pow(abs(normalize(terrainNormal)),vec3(6.));weights/=weights.x+weights.y+weights.z;vec3 p=terrainPosition*.22;vec4 grass=texture2D(map,p.yz)*weights.x+texture2D(map,p.xz)*weights.y+texture2D(map,p.xy)*weights.z;diffuseColor*=grass;
 #endif`);};lawn.customProgramCacheKey=()=> 'svgn-grass-triplanar-2';
  const sky=scene.getObjectByName('Procedural daylight sky');if(sky?.userData?.setTexture)sky.userData.setTexture(skyMap);
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;envCanvas.getContext('2d').drawImage(skyMap.image,0,0,512,256);const environment=new T.CanvasTexture(envCanvas);environment.colorSpace=T.SRGBColorSpace;environment.mapping=T.EquirectangularReflectionMapping;next.root.traverse(o=>{if(o.isMesh&&o.material?.name==='MI_Glass'){o.material.envMap=environment;o.material.envMapIntensity=.55;o.material.needsUpdate=true;}});
  land.material=lawn;set=next;quality=createArtQuality(next.root);root.add(next.root);fallback.visible=false;status='ready';redraw=true;next.root.traverse(o=>{if(o.isMesh)o.onAfterRender=()=>{rendered++;};});
 });
 const timeout=new Promise((_,reject)=>{setTimeout(()=>{if(status==='loading'){expired=true;reject(Error('Art loading timed out; original scenery retained.'));}},20000);});
 const ready=Promise.race([work,timeout]).catch(e=>{expired=true;status='fallback';error=String(e.message||e);redraw=true;console.warn('Street art fallback:',error);const hint=document.querySelector('#welcome .hint');if(hint)hint.textContent='Detailed artwork did not load. Original scenery is still playable; reload to retry the art download.';});
 return {ready,update(n,overview){quality?.update(!renderer.shadowMap.enabled);set?.update(n,overview,!renderer.shadowMap.enabled);},consumeRedraw(){const r=redraw;redraw=false;return r;},inspect:()=>({version:ART_VERSION,status,error,rendered,assetsLocal:true,source:'Quaternius Standard + Poly Haven / CC0',texturedRoads:1+extraRoads.length,...(set?.inspect()||{}),...(quality?.inspect()||{})})};
}
