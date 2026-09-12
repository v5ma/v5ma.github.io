import * as T from './vendor/three.module.js';
const textures=new Map();
function grain(i){let x=(i*1664525+1013904223)>>>0;x^=x>>>13;return (x>>>0)/4294967295;}
export function surfaceTexture(kind){
 if(textures.has(kind))return textures.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),image=g.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const i=y*256+x,n=grain(i),mortar=kind==='brick'&&(y%32<2||(x+(Math.floor(y/32)%2)*32)%64<2),join=kind==='paving'&&(x%64<2||y%64<2),seam=kind==='roof'&&(x%24<2||y%48<2);
  let v=kind==='asphalt'?142+n*50:kind==='roof'?205+n*22:kind==='wood'?203+n*13+Math.sin(y*.21)*9:222+n*28;
  if(mortar||join||seam)v-=65;image.data.set([v,v,v,255],i*4);
 }
 g.putImageData(image,0,0);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(kind==='asphalt'?1:2,kind==='asphalt'?1:2);map.anisotropy=4;textures.set(kind,map);return map;
}
export function coastalMaterial(kind,color='#ffffff'){
 const mat=new T.MeshStandardMaterial({color,map:surfaceTexture(kind),roughness:kind==='roof'?.68:kind==='asphalt'?.91:.88});
 mat.bumpMap=mat.map;mat.bumpScale=kind==='asphalt'?.012:.023;return mat;
}
export function worldRoadMaterial(){
 const m=coastalMaterial('asphalt','#536169');m.side=T.DoubleSide;m.bumpMap=null;
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 roadWorld; varying vec3 roadNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nroadWorld=position;roadNormal=normal;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 roadWorld; varying vec3 roadNormal;').replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 w=pow(abs(normalize(roadNormal)),vec3(8.));w/=w.x+w.y+w.z;vec3 q=roadWorld*.32;vec4 texel=texture2D(map,q.yz)*w.x+texture2D(map,q.xz)*w.y+texture2D(map,q.xy)*w.z;diffuseColor*=texel;
 #endif`);};m.customProgramCacheKey=()=> 'coastal-asphalt-07';return m;
}
export function roundedBox(){const g=new T.BoxGeometry(1,1,1,4,4,4),a=g.attributes.position,v=new T.Vector3(),q=new T.Vector3();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i);q.copy(v).clampScalar(-.42,.42);v.sub(q).normalize().multiplyScalar(.08).add(q);a.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;}
let signage;
export function storefrontAtlas(){if(signage)return signage;const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d'),names=['COAST CAFE','MARKET','CYCLE WORKS','VINYL & SOUL','BAKERY','BOOK CORNER','GALLERY','FLOWERS'],tones=['#285354','#946044','#3a5167','#675268'];for(let i=0;i<8;i++){const x=i%4*256,y=Math.floor(i/4)*128;g.fillStyle=tones[i%4];g.fillRect(x,y,256,128);g.strokeStyle='#d4c4a5';g.lineWidth=4;g.strokeRect(x+9,y+9,238,110);g.fillStyle='#f7eedc';g.font='600 24px system-ui';g.textAlign='center';g.fillText(names[i],x+128,y+73,227);}const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;signage=new T.MeshStandardMaterial({map,roughness:.78,side:T.DoubleSide});return signage;}
export function addShopSigns(parent,buildings){const positions=[],uv=[],v=new T.Vector3();for(const b of buildings){if(!['shop','kiosk'].includes(b.style))continue;const j=b.seed%8,u=j%4/4,w=Math.floor(j/4)/2,coords=[[-b.w*.37,3.6,b.d/2+.19],[b.w*.37,3.6,b.d/2+.19],[-b.w*.37,2.7,b.d/2+.19],[b.w*.37,2.7,b.d/2+.19]],tex=[[u,w+.49],[u+.25,w+.49],[u,w+.01],[u+.25,w+.01]];for(const i of[0,2,1,1,2,3]){v.set(...coords[i]).applyMatrix4(b.matrix);positions.push(v.x,v.y,v.z);uv.push(...tex[i]);}}if(!positions.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const mesh=new T.Mesh(g,storefrontAtlas());parent.add(mesh);}
