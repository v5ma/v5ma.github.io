/* Stillwater's existing puzzle, now using shared Currentworks Water.
 * Analytical sky/bed shading, actual tiled basin beneath alpha blending.
 * No refraction render target or extra scene pass; physics stay in cistern-core. */
import * as T from './vendor/three.module.js';
import Water from '../prism-current/modules/environment/water.mjs';
import {environmentOptions,environmentQuality} from './environment.mjs';
import {POOL,insidePool,waterGround,waterDepth,poolFloor} from './cistern-core.mjs';
const tileVertex=`varying vec3 vWorld; varying vec3 vNormal;
void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`;
const tileFragment=`uniform float clock;uniform float level;varying vec3 vWorld;varying vec3 vNormal;
void main(){vec3 n=abs(vNormal);vec2 p=n.y>.5?vWorld.xz:(n.x>.5?vWorld.zy:vWorld.xy);
vec2 tile=fract(p*1.55);float border=min(min(tile.x,1.-tile.x),min(tile.y,1.-tile.y));
float grout=1.-smoothstep(.015,.04,border);float age=.97+.03*sin(floor(p.x*1.55)*7.1+floor(p.y*1.55)*9.2);
vec3 colour=mix(vec3(.38,.52,.49)*age,vec3(.17,.24,.235),grout);
float depth=max(0.,level-vWorld.y);float a=sin(vWorld.x*2.5+sin(vWorld.z*1.8+clock*.3)+clock*.6);float b=sin(vWorld.z*3.2+sin(vWorld.x*2.-clock*.25)-clock*.4);
float caustic=pow(max(0.,1.-abs(a+b)*.48),14.);colour+=vec3(.28,.37,.30)*caustic*min(1.,depth*3.)*exp(-depth*.3);
colour*=.84+.16*max(vNormal.y,0.);gl_FragColor=vec4(colour,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export function carvePoolTerrain(geo){
 const pos=geo.attributes.position,index=geo.index.array,out=[];
 for(let i=0;i<index.length;i+=3){let x=0,z=0;for(let j=0;j<3;j++){x+=pos.getX(index[i+j])/3;z+=pos.getZ(index[i+j])/3;}if(!insidePool(x,z))out.push(index[i],index[i+1],index[i+2]);}
 geo.setIndex(out);return geo;
}
export function createCisternArt(root){
 const group=new T.Group();group.name='Stillwater tiled hydraulic cistern';root.add(group);
 const uniform={clock:{value:0},level:{value:POOL.high}},tiles=new T.ShaderMaterial({uniforms:uniform,vertexShader:tileVertex,fragmentShader:tileFragment,side:T.DoubleSide});
 function box(x,y,z,w,h,d){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),tiles);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 box(POOL.x,POOL.bottom-.12,POOL.z,POOL.hx*2,.24,POOL.hz*2);
 for(const side of[-1,1])box(POOL.x+side*POOL.hx,-.9,POOL.z,.3,2.35,POOL.hz*2+.3);
 box(POOL.x,-.9,40,POOL.hx*2,.0+2.35,.3);
 for(const side of[-1,1])box(POOL.x+side*(POOL.hx+1.85)/2,-.9,20,POOL.hx-1.85,2.35,.3);
 // The southern ramp has the same footprint/slope as the navigation reducer.
 const ramp=new T.BufferGeometry();ramp.setAttribute('position',new T.Float32BufferAttribute([POOL.x-1.85,0,20,POOL.x+1.85,0,20,POOL.x+1.85,-2,26,POOL.x-1.85,0,20,POOL.x+1.85,-2,26,POOL.x-1.85,-2,26],3));ramp.computeVertexNormals();group.add(new T.Mesh(ramp,tiles));
 // Dry rim and readable brass wheels stay accessible at every water level.
 const stone=new T.MeshStandardMaterial({color:'#c1b8a0',roughness:.88}),brass=new T.MeshStandardMaterial({color:'#b09b6e',metalness:.5,roughness:.4});
 const deck=new T.Mesh(new T.BoxGeometry(8,.2,3.5),stone);deck.position.set(POOL.x,.0,17);group.add(deck);
 const wheels=[];for(let i=0;i<3;i++){const wheel=new T.Mesh(new T.TorusGeometry(.3,.055,7,24),brass);wheel.position.set(POOL.x-1.3+i*1.3,1.1,17.8);group.add(wheel);const spoke=new T.Mesh(new T.BoxGeometry(.55,.06,.08),brass);wheel.add(spoke);wheels.push(wheel);}
 const water=Water.create(T,{preset:'lagoon',quality:'light',width:POOL.hx*2-.3,length:POOL.hz*2-.3,centerZ:0,level:POOL.high,flowX:0,flowZ:0,seed:23630,bedHeight:(x,z)=>poolFloor(x+POOL.x,z+POOL.z)??0});
 water.mesh.position.set(POOL.x,0,POOL.z);water.mesh.renderOrder=2;group.add(water.mesh);
 let last={active:false,passes:0,size:0},settings=environmentOptions();
 function render(s,scene,camera,renderer,quality,mode={}){
  const c=s.frontier.cistern,near=Math.hypot(s.x-POOL.x,s.z-POOL.z)<65;
  uniform.clock.value=settings.quiet?0:s.time;uniform.level.value=c.surface;
  wheels.forEach((w,i)=>{w.rotation.z=c.mask&(1<<i)?Math.PI/2:0;});
  const immersive=mode.xr===true||renderer.xr.isPresenting;
  const wading=s.mode==='foot'&&(s.lift||0)<.05&&waterDepth(s)>.02&&insidePool(s.x,s.z,.4);
  // Mesh translation only: all supplied observations are mesh-local, never XR room coordinates.
  const bodies=wading?[{id:'guild-apprentice',x:s.x-POOL.x,z:s.z-POOL.z,radius:.28}]:[];
  water.update({time:s.time,level:c.surface,quality:environmentQuality(quality,immersive),quiet:settings.quiet,xr:immersive,visible:near,opacity:mode.ar?settings.arWaterOpacity:.86,bodies});
  last={active:near,passes:0,size:0,phase:c.phase,surface:c.surface,depth:waterDepth(s),actorGround:waterGround(s.x,s.z,0),refraction:'authored bed plus transparent basin',reflection:'analytic sky Fresnel',caustics:true,shaderTime:water.uniforms.time.value,water:water.stats};
 }
 return {render,configure:raw=>{settings=environmentOptions(raw);},inspect:()=>({...last}),group,water,dispose:()=>water.dispose()};
}
