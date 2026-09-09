/* In-world atmosphere and contact cues; never a pre-rendered screenshot.
 * Bounded particles, soft actor-ground contact, local water caustics. */
import * as T from './vendor/three.module.js';
export function createAtmosphere(scene,chapter,heightAt){
 const objects=[],materials=[],geometries=[];let motion=true,time=0;
 const add=(geometry,material)=>{const m=new T.Mesh(geometry,material);scene.add(m);objects.push(m);materials.push(material);geometries.push(geometry);return m;};
 const contact=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,uniforms:{},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){float d=length((vUv-.5)*2.);gl_FragColor=vec4(.028,.043,.035,pow(max(0.,1.-d),2.)*.32);}'});
 const contacts=new Map();
 // Moving illumination on submerged stone. It is an artistic caustic pattern,
 // not a ray-traced water simulation, and cannot grant concealment or damage.
 const clocks={time:{value:0}};
 for(const r of chapter.water||[]){const m=add(new T.PlaneGeometry(r.w*.98,r.d*.98),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:clocks,vertexShader:'varying vec2 q;void main(){q=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 q;uniform float time;void main(){vec2 p=q*2.5+vec2(sin(q.y+time*.4),cos(q.x-time*.35))*.3;float a=abs(sin(p.x+p.y*.43+time*.43)),b=abs(sin(p.y-p.x*.39-time*.32));float c=pow(max(0.,1.-min(a,b)),20.);gl_FragColor=vec4(.34,.65,.49,c*.16);}`}));m.rotation.x=-Math.PI/2;m.position.set(r.x,heightAt(r.x,r.z)+.045,r.z);m.name='Animated submerged caustics';}
 const points=420,positions=new Float32Array(points*3),seeds=new Float32Array(points);
 for(let i=0;i<points;i++){const r=n=>{const x=Math.sin(n*127.1)*43758.54;return x-Math.floor(x);};positions[i*3]=(r(i+3)-.5)*56;positions[i*3+1]=.7+r(i+5)*10;positions[i*3+2]=(r(i+7)-.5)*64;seeds[i]=r(i+19);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setAttribute('seed',new T.BufferAttribute(seeds,1));
 const dustMat=new T.ShaderMaterial({uniforms:{time:clocks.time,motion:{value:1}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`attribute float seed;uniform float time,motion;varying float a;void main(){vec3 p=position;p.x+=sin(time*.2+seed*19.)*.6*motion;p.y+=sin(time*.28+seed*12.)*.3*motion;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((16.+seed*13.)/max(1.,-mv.z),1.,3.);a=.04+seed*.11;}`,fragmentShader:`varying float a;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.94,.85,.60,(1.-d*d)*a);}`});
 const dust=new T.Points(geo,dustMat);dust.frustumCulled=false;scene.add(dust);objects.push(dust);materials.push(dustMat);geometries.push(geo);
 return {update(s){if(motion)time=s.t;clocks.time.value=time;const p=s.player;dust.position.set(p.x,heightAt(p.x,p.z),p.z);
  for(const e of [s.player,...s.enemies]){const id=e.id||'hero';let m=contacts.get(id);if(!m){m=add(new T.PlaneGeometry(2,2),contact);m.rotation.x=-Math.PI/2;m.name='Actor contact shading';contacts.set(id,m);}m.position.set(e.x,heightAt(e.x,e.z)+.025,e.z);const base=e.type==='brute'?1.25:e.type==='prowler'?.8:.46;m.scale.set(base,base*(e.stance==='prone'?2.2:1.1),1);m.visible=!e.vault;}
 },setMotion(v){motion=!!v;dustMat.uniforms.motion.value=v?1:0;},stats:()=>({particles:points,contacts:contacts.size,motion}),dispose(){for(const m of objects)scene.remove(m);new Set(materials).forEach(m=>m.dispose());new Set(geometries).forEach(g=>g.dispose());}};
}
