/* Rain film composes with the existing world-scale PBR material patch. */
export function rainClimate(id){return ({district:.82,conservatory:.18,terminus:.48,meridian:.85,breakwater:1,whiteout:.12})[id]??.5;}
export function applyRainFilm(material,uniform){
 if(!material.isMeshStandardMaterial||!material.userData.worldSurface||material.userData.rainFilm)return false;
 const before=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.userData.rainFilm=true;material.customProgramCacheKey=()=>key+'/rainward-rain-film-1';
 material.onBeforeCompile=shader=>{before(shader);shader.uniforms.rwRainFilm=uniform;
  shader.fragmentShader=`uniform float rwRainFilm;
float rwFilmHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float rwFilmNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(rwFilmHash(i),rwFilmHash(i+vec2(1.,0.)),f.x),mix(rwFilmHash(i+vec2(0.,1.)),rwFilmHash(i+vec2(1.)),f.x),f.y);}
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
float rwUp=smoothstep(.55,.94,abs(normalize(vRWNormal).y));
float rwPatches=smoothstep(.38,.72,rwFilmNoise(vRWPosition.xz*.48)+rwFilmNoise(vRWPosition.xz*1.91)*.18);
float rwStreak=smoothstep(.3,.78,rwFilmNoise(vRWPosition.xz*vec2(6.,6.)+vec2(vRWPosition.y*.10,0.)));
float rwFilm=clamp(rwRainFilm*(rwUp*(.14+.83*rwPatches)+(1.-rwUp)*(.10+.28*rwStreak)),0.,.94);
material.diffuseColor*=1.-rwFilm*.31;
material.roughness=mix(material.roughness,max(.10,geometryRoughness+.085),rwFilm*.88);
#ifdef USE_CLEARCOAT
 material.clearcoat*=rwFilm;
 material.clearcoatRoughness=mix(.22,.10,rwPatches);
#endif
`);
 };material.needsUpdate=true;return true;
}
export function createRainwornMaterials(art,chapter){
 const uniform={value:rainClimate(chapter.id)};let enabled=true,low=false,count=0;const seen=new WeakSet();
 function bind(){for(const material of art.mats.values()){if(seen.has(material))continue;seen.add(material);if(applyRainFilm(material,uniform))count++;}}
 bind();return {update:bind,set(value,reduced=false){enabled=!!value;low=!!reduced;uniform.value=enabled&&!low?rainClimate(chapter.id):0;},stats:()=>({enabled,active:enabled&&!low,materials:count,amount:uniform.value,extraRenderTargets:0})};
}
