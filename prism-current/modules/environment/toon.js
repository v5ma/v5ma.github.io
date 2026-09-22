/* Currentworks Toon 0.1.0. Original material factory; caller supplies THREE.
 * Does not replace existing game materials, own a renderer, or draw outlines.
 */
(function(root){
  'use strict';
  const VERSION='0.1.0', DEFAULT_BANDS=Object.freeze([.26,.52,.78,1]), MAX_MATERIALS=64;
  function bands(value=DEFAULT_BANDS){
    if(!Array.isArray(value)||value.length<2||value.length>8||value.some((v,i)=>!Number.isFinite(v)||v<0||v>1||(i&&v<=value[i-1])))
      throw new TypeError('Toon bands must be 2..8 strictly increasing numbers in [0,1].');
    return value.slice();
  }
  function ramp(value){return Uint8Array.from(bands(value),v=>Math.round(v*255));}
  function create(T,options={}){
    if(!T?.MeshToonMaterial||!T?.DataTexture)throw new TypeError('Supply the existing compatible THREE namespace.');
    if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Toon options must be an object.');
    const values=bands(options.bands),owned=new Set();let disposed=false;
    const gradient=new T.DataTexture(ramp(values),values.length,1,T.RedFormat,T.UnsignedByteType);
    gradient.name='Currentworks / toon light bands';gradient.colorSpace=T.NoColorSpace;
    gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
    function material(parameters={}){
      if(disposed)throw new Error('Toon factory has been disposed.');
      if(!parameters||typeof parameters!=='object'||Array.isArray(parameters))throw new TypeError('Material parameters must be an object.');
      if(Object.hasOwn(parameters,'gradientMap'))throw new TypeError('This factory owns gradientMap; choose bands at construction.');
      if(owned.size>=MAX_MATERIALS)throw new RangeError('Toon material budget exceeded; reuse or release an existing material.');
      const result=new T.MeshToonMaterial({...parameters,gradientMap:gradient});
      result.name=parameters.name||'Currentworks Toon '+VERSION;owned.add(result);return result;
    }
    function release(value){if(!owned.delete(value))return false;value.dispose();return true;}
    function dispose(){if(disposed)return;disposed=true;for(const value of owned)value.dispose();owned.clear();gradient.dispose();}
    return Object.freeze({material,release,dispose,gradient,
      get stats(){return {module:'Currentworks Toon',version:VERSION,bands:values.slice(),materials:owned.size,textureCount:disposed?0:1,disposed};}});
  }
  const api=Object.freeze({VERSION,DEFAULT_BANDS,MAX_MATERIALS,bands,ramp,create});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNToon=api;
})(globalThis);
