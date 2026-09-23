// A single GPU atlas, composed from four same-origin column strips. Every crop
// comes from the original generated artwork; the previous 64px atlas is fallback.
import {ATLAS} from './warledger-art.mjs';
export const HD_ATLAS=Object.freeze({width:512,height:1024,cell:128,columns:4,rows:8,gutter:4,
  urls:Object.freeze(Array.from({length:4},(_,i)=>`./assets/piece-faces-hd-${i}.webp`))});
export function finishAtlas(texture,THREE,renderer,quality) {
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=Math.max(1,Math.min(4,renderer.capabilities.getMaxAnisotropy()));
  texture.userData={...texture.userData,quality};return texture;
}
export async function loadPieceAtlas(THREE,renderer,baseURL) {
  const loader=new THREE.TextureLoader();
  const parts=await Promise.allSettled(HD_ATLAS.urls.map(url=>loader.loadAsync(new URL(url,baseURL).href)));
  try {
    if(parts.some(p=>p.status!=='fulfilled'))throw new Error('An HD artwork strip did not load.');
    const canvas=document.createElement('canvas');canvas.width=HD_ATLAS.width;canvas.height=HD_ATLAS.height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas textures are unavailable.');
    parts.forEach((p,i)=>{
      const image=p.value.image;
      if(image.width!==HD_ATLAS.cell||image.height!==HD_ATLAS.height)throw new Error('HD artwork dimensions do not match the UV layout.');
      ctx.drawImage(image,i*HD_ATLAS.cell,0);
    });
    return finishAtlas(new THREE.CanvasTexture(canvas),THREE,renderer,'hd-128');
  } catch {
    const fallback=await loader.loadAsync(new URL(ATLAS.url,baseURL).href);
    return finishAtlas(fallback,THREE,renderer,'fallback-64');
  } finally {
    parts.forEach(p=>{if(p.status==='fulfilled')p.value.dispose();});
  }
}
