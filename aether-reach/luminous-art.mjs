/* Rendering-only Prismatic Quay. Original geometry/GLSL; Three r177 PBR.
 * References and CC0 inputs: VISUAL-RELEASE.md / ART-SOURCES.md.
 * No gameplay imports, actor writes, external network or persistence here. */
import * as T from './vendor/three.module.js';
export const VISUAL_MODES=Object.freeze(['balanced','prismatic','low']);
export function visualBudget(mode='balanced',xr=false){
 const low=xr||mode==='low';return Object.freeze({mode:low?'low':mode,transmission:!low&&mode==='prismatic',sparkles:low?20:48,shadowSize:low?0:1024,refractionScale:.5});
}
export function cutGemGeometry(){
 const p=[],n=8;const ring=(r,y,a=0)=>Array.from({length:n},(_,i)=>new T.Vector3(Math.cos(i/n*Math.PI*2+a)*r,y,Math.sin(i/n*Math.PI*2+a)*r));
 const table=ring(.48,.5),shoulder=ring(.82,.24,Math.PI/n),girdle=ring(1,0),lower=ring(.985,-.035),tip=new T.Vector3(0,-1.1,0),top=new T.Vector3(0,.5,0);
 const tri=(a,b,c)=>{ // Consistently outward normals, including the pavilion.
  const normal=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a));
  const center=new T.Vector3().addVectors(a,b).add(c).multiplyScalar(1/3);if(normal.dot(center)<0)[b,c]=[c,b];
  p.push(...a.toArray(),...b.toArray(),...c.toArray());
 };
 for(let i=0;i<n;i++){const j=(i+1)%n;tri(top,table[i],table[j]);tri(table[i],shoulder[i],table[j]);tri(table[j],shoulder[i],girdle[j]);tri(table[i],girdle[i],shoulder[i]);tri(girdle[i],girdle[j],shoulder[i]);tri(girdle[i],lower[i],lower[j]);tri(girdle[i],lower[j],girdle[j]);tri(lower[i],tip,lower[j]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function luminousPalette(mode='balanced'){
 const metal=(name,color,roughness)=>{const m=new T.MeshPhysicalMaterial({color,metalness:.93,roughness,clearcoat:.65,clearcoatRoughness:.16,envMapIntensity:1.5});m.name=name;return m;};
 const crystal=new T.MeshPhysicalMaterial({color:'#d5fbff',metalness:0,roughness:.07,ior:2.1,thickness:1.2,transmission:mode==='prismatic'?.82:0,attenuationColor:'#86cadb',attenuationDistance:2.4,clearcoat:1,clearcoatRoughness:.05,iridescence:.3,iridescenceIOR:1.3,iridescenceThicknessRange:[150,390],envMapIntensity:1.8,flatShading:true});
 crystal.name='Cut crystal / finite-volume refraction';
 const glass=new T.MeshPhysicalMaterial({color:'#b6edee',metalness:.06,roughness:.1,ior:1.46,thickness:.08,transmission:mode==='prismatic'?.65:0,transparent:mode!=='prismatic',opacity:mode==='prismatic'?1:.34,depthWrite:false,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.5,side:T.DoubleSide,forceSinglePass:true});glass.name='Curved sea-glass glazing';
 return {gold:metal('Brushed champagne brass','#cfab67',.2),silver:metal('Polished nickel','#bacad5',.15),dark:metal('Blued machine steel','#234554',.27),crystal,glass};
}
const causticFragment=`varying vec2 q;uniform float time;uniform vec3 tint;
 void main(){vec2 p=(q-.5)*8.;float edge=1.-smoothstep(.32,.5,length(q-.5));
 float a=sin(p.x*2.5+sin(p.y*1.8+time*.28))+sin(p.y*2.7+sin(p.x*1.2-time*.24));
 float b=sin(p.y*3.1+cos(p.x*1.9+time*.2))+cos(p.x*2.8+cos(p.y*1.7-time*.15));
 float lines=pow(max(0.,1.-abs(a)*1.4),10.)*.6+pow(max(0.,1.-abs(b)*1.5),11.)*.45;
 gl_FragColor=vec4(tint,clamp(lines*edge*.28,0.,.33));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
export function makeCaustic(){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2,uniforms:{time:{value:0},tint:{value:new T.Color('#b5e7e5')}},vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:causticFragment});}
export function installLuminousArt({scene,camera,renderer,quality,relays}){
 const root=new T.Group();root.name='Prismatic freight / decorative optics';scene.add(root);let mode=quality==='low'?'low':'prismatic',active='',time=0;
 const pal=luminousPalette(mode),gemGeo=cutGemGeometry(),boxGeo=new T.BoxGeometry(1,1,1),rings=[],gems=[],twinkles=[];const caustics=[];
 const mount=(g,m,pos,scale=[1,1,1],parent=root)=>{const mesh=new T.Mesh(g,m);mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const rod=(a,b,r=.025,m=pal.gold,parent=root)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),mesh=mount(new T.CylinderGeometry(r,r,start.distanceTo(end),8),m,new T.Vector3().addVectors(start,end).multiplyScalar(.5).toArray(),[1,1,1],parent);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return mesh;};
 function jewel(x,y,z,size,color){const pivot=new T.Group();pivot.position.set(x,y,z);root.add(pivot);const mat=pal.crystal.clone();mat.color.set(color);mat.name='Faceted jewel '+color;const gem=mount(gemGeo,mat,[0,0,0],[size,size,size],pivot);gems.push(gem);
  // Etched girdle and slender brass suspension; not a solid platform.
  const rim=mount(new T.TorusGeometry(size*1.02,.016*size,6,8),pal.silver,[0,-.015*size,0],[1,1,1],pivot);rim.rotation.x=Math.PI/2;
  const halo=mount(new T.TorusGeometry(size*1.52,.035*size,8,64),pal.gold,[0,-.15*size,0],[1,1,1],pivot);halo.rotation.x=Math.PI/2.7;rings.push(halo);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([Math.cos(a)*size*1.04,-size*.08,Math.sin(a)*size*1.04],[Math.cos(a)*size*.75,-size*.8,Math.sin(a)*size*.75],size*.018,pal.gold,pivot);}
  const geo=new T.BufferGeometry(),pts=[],phase=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;pts.push(Math.cos(a)*size*(.56+(i%3)*.18),size*(.44-(i%5)*.28),Math.sin(a)*size*(.56+(i%3)*.18));phase.push(i*2.399);}
  geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setAttribute('phase',new T.Float32BufferAttribute(phase,1));
  const shader=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0},size:{value:18},motion:{value:1}},vertexShader:`attribute float phase;uniform float time;uniform float size;uniform float motion;varying float bright;void main(){vec4 v=modelViewMatrix*vec4(position,1.);bright=pow(max(0.,sin(phase+time*.6*motion)),18.);gl_PointSize=clamp(size*9./max(1.,-v.z),2.,26.);gl_Position=projectionMatrix*v;}`,fragmentShader:`varying float bright;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float crossGlow=exp(-abs(p.x)*65.)*exp(-abs(p.y)*9.)+exp(-abs(p.y)*65.)*exp(-abs(p.x)*9.);float alpha=(exp(-d*17.)+crossGlow*.35)*bright;if(alpha<.01)discard;gl_FragColor=vec4(.83,.94,1.,alpha*.65);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
  const points=new T.Points(geo,shader);pivot.add(points);twinkles.push(points);return pivot;
 }
 // Suspended landmark, safely above the unchanged main walkway. Supports
 // remain on the deck edge; none of these decorative items changes collisions.
 jewel(0,7.2,-9,1.3,'#e6f8ff');
 const arc=new T.Mesh(new T.TorusGeometry(2.4,.065,8,80,Math.PI),pal.gold);arc.rotation.y=Math.PI/2;arc.position.set(0,6.65,-9);root.add(arc);
 rod([0,9.05,-9],[0,9.6,-9],.055);mount(new T.SphereGeometry(.12,12,8),pal.silver,[0,9.6,-9]);
 jewel(7,2,4,.34,'#ceb7ff'); // existing Field Engineering console display
 for(const [x,y,z,s,col]of [[-10,14.15,9,.5,'#c2f5f4'],[11,13.8,-12,.42,'#ffd0a5']])jewel(x,y,z,s,col);
 // Re-surface actual relay orbs: their location and completion colors remain.
 for(const v of relays.values()){v.orb.geometry=gemGeo;const mat=pal.crystal.clone();mat.name='Relay optical core';v.orb.material=mat;v.orb.scale.set(.46,.64,.46);gems.push(v.orb);}
 // Glass barrel-vault over the existing west stall; its counter/poles remain.
 const roof=new T.Group();roof.position.set(-12,3.48,-5);root.add(roof);const vertices=[],indices=[],segments=24;
 for(let i=0;i<=segments;i++){const a=Math.PI*(i/segments);for(const z of[-1.75,1.75])vertices.push(Math.cos(a)*2.23,Math.sin(a)*.78,z);}
 for(let i=0;i<segments;i++){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(vertices,3));rg.setIndex(indices);rg.computeVertexNormals();mount(rg,pal.glass,[0,0,0],[1,1,1],roof);
 for(const z of[-1.75,0,1.75]){const pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;pts.push(new T.Vector3(Math.cos(a)*2.23,Math.sin(a)*.8,z));}mount(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.034,6,false),pal.gold,[0,0,0],[1,1,1],roof);}
 for(const x of[-2.23,0,2.23])rod([x,x===0?.8:0,-1.75],[x,x===0?.8:0,1.75],.035,pal.gold,roof);
 // Stylized light caustics, explicitly not traced caustic physics.
 for(const [x,y,z,size]of [[0,.035,-9,6],[-12,.035,-5,4],[0,3.83,-44,5.8]]){const mat=makeCaustic(),m=mount(new T.PlaneGeometry(size,size),mat,[x,y,z]);m.rotation.x=-Math.PI/2;caustics.push(m);}
 const initialMaterials=[];for(const m of [...gems.map(g=>g.material),pal.glass])initialMaterials.push(m);
 function apply(request=mode,xr=false){const b=visualBudget(request,xr);if(active===b.mode)return;active=b.mode;renderer.shadowMap.enabled=b.shadowSize>0;renderer.transmissionResolutionScale=b.refractionScale;
  for(const m of initialMaterials){m.transmission=b.transmission?(m===pal.glass?.65:.82):0;if(m===pal.glass){m.transparent=!b.transmission;m.opacity=b.transmission?1:.34;}m.dispersion=b.transmission?.22:0;m.iridescence=b.mode==='low'?0:.3;m.needsUpdate=true;}
  twinkles.forEach(p=>{p.geometry.setDrawRange(0,b.sparkles);p.visible=b.mode!=='low';});caustics.forEach(c=>c.visible=b.mode!=='low');
 }
 apply(mode);
 function update(s,dt,reduced,xr){apply(mode,xr);if(!reduced)time+=Math.max(0,Math.min(.1,dt));rings.forEach((r,i)=>{r.rotation.y=reduced?0:time*.12*(i%2?1:-1);});twinkles.forEach(p=>{p.material.uniforms.time.value=time;p.material.uniforms.motion.value=reduced?0:1;});caustics.forEach(m=>m.material.uniforms.time.value=reduced?0:time);
  // Do not globally zoom or rotate a headset to create an optical effect.
 }
 return {update,setMode(value){if(VISUAL_MODES.includes(value)){mode=value;apply(mode,renderer.xr.isPresenting);}},stats:()=>({mode:active,requested:mode,transmission:active==='prismatic',gems:gems.length,glassCanopies:1,causticPatches:active==='low'?0:caustics.length,sparklePoints:active==='low'?0:twinkles.length*48}),root};
}
