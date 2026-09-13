/* Original analytic basin refraction and caustic-style interference.
 * Uses existing PBR lights/shadows and the existing environment. It does NOT
 * sample the live scene, simulate fluid volume, or add a reflection render pass. */
export const WATER_GLSL=`
 varying vec3 vBasinPosition;
 varying vec2 vBasinCoord;
 uniform float uWaterTime,uWaterDepth,uWaterClarity,uWaterRain,uWaterDetail,uWaterCanal;
 uniform vec2 uWaterHalf;
 uniform vec3 uWaterEye;
 uniform mat3 uWaterNormal;
 uniform vec4 uWaterImpulses[8];
 float basinHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec2 basinSlope(vec2 p){
  float t=uWaterTime;
  vec2 d=vec2(cos(p.x*1.28+p.y*.63+t*1.3),cos(p.x*.51-p.y*1.07+t*.87))*.021;
  d+=vec2(cos(p.x*3.4+p.y*1.8-t*1.9),sin(p.y*3.8+p.x*.7+t*1.2))*.009;
  for(int i=0;i<8;i++){
   vec2 delta=p-uWaterImpulses[i].xy;float age=t-uWaterImpulses[i].z,dist=length(delta),radius=age*2.8;
   float a=step(0.,age)*(1.-smoothstep(2.5,4.,age))*uWaterImpulses[i].w;
   d+=delta/max(dist,.1)*cos((dist-radius)*7.5)*exp(-pow((dist-radius)*1.6,2.))*a*.11;
  }
  if(uWaterDetail>.5&&uWaterRain>.01){
   vec2 cell=floor(p*.55),q=fract(p*.55)-.5;float seed=basinHash(cell),age=fract(t*.71+seed*13.);
   float r=length(q),a=(1.-age)*(1.-smoothstep(.1,.45,r))*uWaterRain;
   d+=q/max(r,.02)*sin((r-age*.9)*39.)*exp(-pow((r-age*.45)*10.,2.))*a*.045;
  }
  return d;
 }
 float basinCaustic(vec2 p){
  float t=uWaterTime*.55;
  vec2 q=p*.96+vec2(sin(p.y*.71+t),cos(p.x*.83-t))*.35;
  float a=abs(sin(q.x*2.6+sin(q.y*2.3+t))+sin(q.y*2.1+cos(q.x*2.4-t)));
  float b=abs(sin(q.x*3.5-q.y*1.3-t)+cos(q.y*3.1+q.x*.9+t));
  return pow(max(0.,1.-a),8.)*.8+pow(max(0.,1.-b),10.)*.5;
 }
 vec3 basinTile(vec2 p,float wall){
  vec2 uv=p*2.25,f=fract(uv),fw=max(fwidth(uv),vec2(.008));
  vec2 edge=smoothstep(vec2(.018),vec2(.032)+fw,min(f,1.-f));float grout=1.-edge.x*edge.y;
  float checker=mod(floor(uv.x)+floor(uv.y),2.);
  vec3 c=mix(vec3(.56,.72,.70),vec3(.47,.64,.65),checker*.5);
  if(uWaterCanal>.5)c=mix(vec3(.32,.43,.42),vec3(.41,.49,.46),checker*.55);
  if(wall<.5&&uWaterCanal<.5){float lane=1.-smoothstep(.09,.14,abs(mod(p.x+1.4,2.8)-1.4));c=mix(c,vec3(.065,.26,.32),lane*.75);}
  return mix(c,vec3(.23,.39,.40),grout*.67);
 }
 vec3 basinUnderwater(vec3 n){
  vec3 surface=vec3(vBasinCoord.x,0.,vBasinCoord.y);
  vec3 incident=normalize(vec3(vBasinPosition.x,0.,vBasinPosition.z)-uWaterEye);
  vec3 ray=refract(incident,n,.7502);float travel=uWaterDepth/max(.10,-ray.y),wall=0.;
  float tx=((ray.x>0.?uWaterHalf.x:-uWaterHalf.x)-surface.x)/(abs(ray.x)<.0001?.0001:ray.x);
  float tz=((ray.z>0.?uWaterHalf.y:-uWaterHalf.y)-surface.z)/(abs(ray.z)<.0001?.0001:ray.z);
  if(tx>0.&&tx<travel){travel=tx;wall=1.;}if(tz>0.&&tz<travel){travel=tz;wall=2.;}
  vec3 hit=surface+ray*travel;vec2 tileUV=wall<.5?hit.xz:wall<1.5?vec2(hit.z,hit.y):vec2(hit.x,hit.y);
  vec3 tiles=basinTile(tileUV,wall);
  float waterFog=1.-exp(-travel*(.10+(1.-uWaterClarity)*.35));
  vec3 tint=mix(vec3(.035,.32,.35),vec3(.11,.27,.22),1.-uWaterClarity);
  vec3 c=mix(tiles,tint,waterFog);
  c+=vec3(.45,.80,.67)*basinCaustic(hit.xz+hit.y*.4)*uWaterClarity*(1.-waterFog)*.42;
  float rim=min(uWaterHalf.x-abs(vBasinCoord.x),uWaterHalf.y-abs(vBasinCoord.y));
  float foam=(1.-smoothstep(.08,.32,rim))*(.50+.5*sin(vBasinCoord.x*3.+vBasinCoord.y*2.+uWaterTime*.7));
  return mix(c,vec3(.55,.77,.70),foam*.17);
 }
`;
export function patchBasinShader(shader){
 for(const [stage,anchor]of[['vertexShader','#include <begin_vertex>'],['fragmentShader','#include <normal_fragment_maps>'],['fragmentShader','#include <color_fragment>']])if(!shader[stage].includes(anchor))throw Error('Water shader anchor unavailable: '+anchor);
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aBasinCoord; varying vec3 vBasinPosition; varying vec2 vBasinCoord;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBasinPosition=position;vBasinCoord=aBasinCoord;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+WATER_GLSL)
 .replace('#include <color_fragment>','#include <color_fragment>\nvec2 waterSlope=basinSlope(vBasinCoord);vec3 basinNormal=normalize(vec3(-waterSlope.x,1.,-waterSlope.y));diffuseColor.rgb=basinUnderwater(basinNormal);')
 .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(uWaterNormal*basinNormal);')
 .replace('#include <clearcoat_normal_fragment_maps>','#include <clearcoat_normal_fragment_maps>\n#ifdef USE_CLEARCOAT\nclearcoatNormal=normal;\n#endif');
}
