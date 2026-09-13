/* Original pool shaders. Caustics are an artistic interference approximation,
 * not a physical light solver. Reflection/refraction use bounded local captures. */
import * as T from './vendor/three.module.js';
export const WATER_VERTEX=`
 uniform float uTime;uniform vec4 uRipples[12];
 varying vec3 vWaterWorld;varying vec4 vWaterClip;varying vec4 vMirrorClip;
 uniform mat4 uMirrorMatrix;
 void main(){vec3 p=position;float h=.017*sin(p.x*1.1+uTime*1.3)+.012*sin(p.z*.8-uTime*.9);
 for(int i=0;i<12;i++){vec4 r=uRipples[i];float age=uTime-r.z;float d=length(p.xz-r.xy);if(age>=0.&&age<4.5)h+=r.w*.022*sin(d*5.-age*7.)*exp(-abs(d-age*2.1)*2.)*exp(-age*.75);}
 p.y+=h;vec4 world=modelMatrix*vec4(p,1.);vWaterWorld=world.xyz;vWaterClip=projectionMatrix*viewMatrix*world;vMirrorClip=uMirrorMatrix*world;gl_Position=vWaterClip;
 }`;
export const WATER_FRAGMENT=`
 uniform float uTime;uniform float uAdvanced;uniform float uUnder;uniform float uRippleStrength;uniform vec4 uRipples[12];
 uniform sampler2D uRefraction;uniform sampler2D uReflection;
 varying vec3 vWaterWorld;varying vec4 vWaterClip;varying vec4 vMirrorClip;
 void main(){vec2 p=vWaterWorld.xz;
 vec2 slope=vec2(.029*cos(p.x*1.1+uTime*1.3)+.014*cos((p.x+p.y)*2.3+uTime*.7),.020*cos(p.y*.8-uTime*.9)+.014*cos((p.x-p.y)*1.7-uTime));
 for(int i=0;i<12;i++){vec4 r=uRipples[i];float age=uTime-r.z;vec2 delta=p-r.xy;float d=length(delta);if(age>=0.&&age<4.5)slope+=normalize(delta+vec2(.001))*r.w*.1*cos(d*5.-age*7.)*exp(-abs(d-age*2.1)*2.)*exp(-age*.75);}
 slope*=uRippleStrength;vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));vec3 viewDir=normalize(cameraPosition-vWaterWorld);float fresnel=.025+.82*pow(1.-abs(dot(normal,viewDir)),5.);
 vec2 screenUV=vWaterClip.xy/vWaterClip.w*.5+.5;vec2 reflectUV=vMirrorClip.xy/vMirrorClip.w*.5+.5;
 vec3 refracted=texture2D(uRefraction,clamp(screenUV+slope*.055,vec2(.004),vec2(.996))).rgb;
 vec3 reflected=texture2D(uReflection,clamp(reflectUV+slope*.07,vec2(.004),vec2(.996))).rgb;
 float depth=1.65+3.05*clamp((12.-p.y)/24.,0.,1.);vec3 absorption=exp(-vec3(.17,.055,.038)*depth*.42);
 vec3 body=vec3(.025,.23,.25);vec3 through=refracted*absorption+body*(1.-absorption);
 vec3 halfDir=normalize(viewDir+normalize(vec3(-.7,1.,-.3)));float sun=pow(max(dot(normal,halfDir),0.),200.)*.5;
 vec3 col=mix(through,reflected,clamp(fresnel,0.,.65))+vec3(.8,.86,.72)*sun;
 float boundary=min(8.-abs(p.x),16.-abs(p.y));float edge=1.-smoothstep(0.,.16,boundary);col+=vec3(.12,.22,.18)*edge;
 float alpha=1.;if(uAdvanced<.5){col=mix(vec3(.06,.36,.38),vec3(.43,.65,.64),fresnel)+sun*.3;alpha=.24+fresnel*.5;}
 if(uUnder>.5){col=mix(col,vec3(.08,.39,.39),.4);alpha=uAdvanced>.5?.80:.26;}
 gl_FragColor=vec4(col,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
export function makeWaterMaterial(){return new T.ShaderMaterial({name:'Tideglass / refractive pool water',transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:{value:0},uAdvanced:{value:0},uUnder:{value:0},uRippleStrength:{value:1},uRipples:{value:Array.from({length:12},()=>new T.Vector4(0,0,-100,0))},uRefraction:{value:null},uReflection:{value:null},uMirrorMatrix:{value:new T.Matrix4()}},vertexShader:WATER_VERTEX,fragmentShader:WATER_FRAGMENT});}
export function tileMaterial(color,{caustics=true}={}){
 const m=new T.MeshStandardMaterial({color,roughness:.43,metalness:.02,side:T.DoubleSide});const time={value:0},strength={value:1};
 m.userData.poolTime=time;m.userData.causticStrength=strength;
 m.onBeforeCompile=shader=>{
  shader.uniforms.uPoolTime=time;shader.uniforms.uPoolCaustics=strength;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPoolPosition;varying vec3 vPoolNormal;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPoolPosition=(modelMatrix*vec4(transformed,1.)).xyz;vPoolNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vPoolPosition;varying vec3 vPoolNormal;uniform float uPoolTime;uniform float uPoolCaustics;
   float gridLine(vec2 p){vec2 f=abs(fract(p)-.5);vec2 aa=fwidth(p)*1.1;return max(smoothstep(.478-aa.x,.49+aa.x,f.x),smoothstep(.478-aa.y,.49+aa.y,f.y));}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   vec3 nw=abs(normalize(vPoolNormal));vec2 tc=nw.y>.7?vPoolPosition.xz:(nw.x>nw.z?vPoolPosition.zy:vPoolPosition.xy);float grout=gridLine(tc*2.7);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.64,.62),grout*.55);diffuseColor.rgb*=.96+.035*sin(floor(tc.x*2.7)*7.4+floor(tc.y*2.7)*17.9);
   float sub=1.-smoothstep(-.08,.08,vPoolPosition.y);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.60,.86,.91),sub*.58);
  `).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   ${caustics?`vec2 cp=vPoolPosition.xz+vPoolPosition.y*.35;float c1=sin(cp.x*2.1+sin(cp.y*1.7+uPoolTime*.55))+cos(cp.y*2.2-uPoolTime*.6+sin(cp.x*1.3));float c2=sin(cp.x*2.7-uPoolTime*.31)+cos(cp.y*2.8+uPoolTime*.42);float ca=pow(max(0.,1.-abs(c1*.48)),12.)*.16+pow(max(0.,1.-abs(c2*.5)),18.)*.09;totalEmissiveRadiance+=vec3(.32,.59,.50)*ca*sub*uPoolCaustics;`:''}
  `);
 };
 m.customProgramCacheKey=()=> 'tideglass-tile-010-'+caustics;return m;
}
