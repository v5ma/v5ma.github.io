/* GPU-side color texture budget for the public Reduced Graphics setting.
 * Keep the full-quality source and UV transform untouched. WebP file compression
 * alone does not reduce decoded texture memory or the sampling working set. */
import * as T from './vendor/three.module.js';
export function reducedTextureSize(width,height,limit=512){
 const scale=Math.min(1,limit/Math.max(width||1,height||1));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function reducedColorMap(source,makeCanvas=()=>globalThis.document?.createElement('canvas')){
 const texture=source.clone(),image=source.image;
 if(image?.width>512||image?.height>512){
  const canvas=makeCanvas();
  if(canvas){const size=reducedTextureSize(image.width,image.height);canvas.width=size.width;canvas.height=size.height;const context=canvas.getContext('2d');if(context){context.drawImage(image,0,0,size.width,size.height);texture.source=new T.Source(canvas);}}
 }
 texture.anisotropy=1;texture.needsUpdate=true;return texture;
}
