import * as T from './vendor/three.module.js';
// Original bounded shaders for the pinned WebGL renderer. No screen-space reflection pass.
export function waterMaterial() {
 const uniforms=T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:{value:0},uNight:{value:0}}]);
 return new T.ShaderMaterial({uniforms,fog:true,side:T.DoubleSide,vertexShader:`
 varying vec3 vWorld;
 #include <fog_pars_vertex>
 void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,fragmentShader:`
 uniform float uTime;uniform float uNight;varying vec3 vWorld;
 #include <fog_pars_fragment>
 void main(){
 vec2 p=vWorld.xz;float t=uTime;float a=dot(p,vec2(.17,.09))+t*.62;float b=dot(p,vec2(-.09,.21))-t*.47;
 vec2 slope=cos(a)*vec2(.051,.027)+cos(b)*vec2(-.018,.042);
 vec3 n=normalize(vec3(-slope.x,1.0,-slope.y));vec3 view=normalize(cameraPosition-vWorld);
 float fresnel=pow(1.0-clamp(dot(n,view),0.0,1.0),3.0);
 float shine=pow(max(dot(reflect(normalize(vec3(.4,-.85,-.32)),n),view),0.0),90.0);
 float detail=sin(p.x*.42+t*.35+sin(p.y*.3))*sin(p.y*.48-t*.3);
 vec3 deep=mix(vec3(.027,.17,.19),vec3(.018,.075,.115),uNight);
 vec3 shallow=mix(vec3(.12,.42,.40),vec3(.06,.18,.23),uNight);
 vec3 c=mix(deep,shallow,.36+detail*.14)+vec3(.24,.36,.37)*fresnel+vec3(1.0,.84,.55)*shine*(1.0-uNight*.8);
 float edge=abs(length(p)-420.0);float foam=(1.0-smoothstep(.5,3.2,edge))*(.4+.28*sin(t*1.4+p.x*.6+p.y*.4));
 c=mix(c,vec3(.63,.80,.72),foam*(1.0-uNight*.45));gl_FragColor=vec4(c,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`});
}
export function canopyMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:{value:0},uNight:{value:0}},vertexShader:`varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vV=-mv.xyz;vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uTime;uniform float uNight;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float rim=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.5);float grid=pow(.5+.5*cos(vP.y*2.4+vP.x*.3),18.0);vec3 c=mix(vec3(.05,.35,.31),vec3(.28,.91,.71),rim)+grid*.15;gl_FragColor=vec4(c,.09+rim*.32+grid*.08);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
export function hologramMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uTime:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.0;float r=length(p);float rim=1.0-smoothstep(.012,.034,abs(r-.84));float inner=1.0-smoothstep(.01,.03,abs(r-.56));float grid=pow(.5+.5*cos(p.x*36.),28.)+pow(.5+.5*cos(p.y*36.),28.);float scan=pow(max(0.0,cos(atan(p.y,p.x)-uTime*.35)),30.);float mask=1.-smoothstep(.9,.96,r);float a=(rim*.8+inner*.32+grid*.10+scan*.36)*mask;gl_FragColor=vec4(.24,.80,.64,a);}`});}
export class Fieldlight {
 constructor(scene,signatureWorld){
  this.scene=scene;this.time=0;this.enabled=true;this.original=[];this.water=waterMaterial();this.glass=canopyMaterial();this.holo=hologramMaterial();
  const colors=new Set([0x387e89,0x548b88,0x639a90,0x517e7a]);
  scene.traverse(m=>{if(!m.isMesh||Array.isArray(m.material))return;const c=m.material?.color?.getHex();if(colors.has(c)&&['PlaneGeometry','RingGeometry','CircleGeometry'].includes(m.geometry?.type)){this.original.push({mesh:m,material:m.material,replacement:this.water});}});
  signatureWorld?.root.traverse(m=>{if(m.isMesh&&m.material?.transparent&&m.material.opacity===.22)this.original.push({mesh:m,material:m.material,replacement:this.glass});});
  this.displays=[];
  for(const [x,y,z] of [[-7,.12,58],[-35,.13,-329]]){const m=new T.Mesh(new T.PlaneGeometry(3.8,3.8),this.holo);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);scene.add(m);this.displays.push(m);}
  this.apply(true);
 }
 apply(on){this.enabled=!!on;for(const o of this.original)o.mesh.material=this.enabled?o.replacement:o.material;for(const m of this.displays)m.visible=this.enabled;}
 update(dt,night,reduced){if(!reduced)this.time+=Math.max(0,Math.min(.1,dt));this.water.uniforms.uTime.value=this.time;this.water.uniforms.uNight.value=night?1:0;this.glass.uniforms.uNight.value=night?1:0;this.holo.uniforms.uTime.value=reduced?0:this.time;}
 snapshot(){return {enabled:this.enabled,waterSurfaces:this.original.filter(o=>o.replacement===this.water).length,canopyPanels:this.original.filter(o=>o.replacement===this.glass).length,shaderTime:this.time};}
}
