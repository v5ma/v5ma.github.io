import * as T from './vendor/three.module.js';
import {box,part,bone,label} from './ranger-art.js';
import {bakeStatics} from './frontier-art.js?v=storm2';
import {LAB,AQUA_HARBOR,ROUTE,POINTS,insideLab,gap,shallowSafe} from './aquatics-data.js';

// The tile shader projects an artistic caustic pattern onto actual submerged
// walls/floors. It is deliberately not advertised as physically traced light.
export function tiledMaterial(uniforms){
 const m=new T.MeshStandardMaterial({color:0xbbcec5,roughness:.48,metalness:.05});m.name='Pelagic tiled pool';
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,uniforms);
 s.vertexShader='varying vec3 poolWorld;varying vec3 poolNormal;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npoolWorld=(modelMatrix*vec4(transformed,1.0)).xyz;poolNormal=normalize(mat3(modelMatrix)*normal);');
 s.fragmentShader='varying vec3 poolWorld;varying vec3 poolNormal;uniform float poolTime;uniform float poolLevel;uniform float poolEffects;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 coord=abs(poolNormal.y)>.5?poolWorld.xz:(abs(poolNormal.x)>.5?poolWorld.zy:poolWorld.xy);
 vec2 tile=coord*2.0;vec2 cell=fract(tile);vec2 seam=min(cell,1.0-cell);
 vec2 aa=max(fwidth(tile),vec2(.001));float grout=1.0-min(smoothstep(.01,.025+aa.x,seam.x),smoothstep(.01,.025+aa.y,seam.y));
 float variety=.96+.04*sin(dot(floor(tile),vec2(15.31,28.71)));
 diffuseColor.rgb*=variety;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.23,.20),grout*.6);
 float depth=max(0.0,poolLevel-poolWorld.y);float submerged=smoothstep(0.0,.13,depth);
 diffuseColor.rgb*=mix(vec3(1.0),vec3(.48,.78,.73),submerged);
 vec2 q=poolWorld.xz*.75+vec2(poolWorld.y*.35);float a=sin(q.x+sin(q.y+poolTime*.27))+cos(q.y-poolTime*.33);
 float b=sin(q.y*1.24+cos(q.x-poolTime*.24))+cos(q.x*1.1+poolTime*.31);
 float caustic=pow(max(0.0,1.0-abs(a*b)*.9),14.0);
 diffuseColor.rgb+=vec3(.36,.62,.51)*caustic*submerged*exp(-depth*.22)*poolEffects;
 `);};m.customProgramCacheKey=()=> 'pelagic-tiles-v1';return m;
}
const waterVertex=`varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const waterFragment=`
#include <packing>
varying vec3 vWorld;uniform sampler2D poolScene;uniform sampler2D poolDepth;uniform vec2 poolViewport;uniform float poolTime;uniform float poolNear;uniform float poolFar;uniform float hasScene;uniform float poolEffects;uniform vec4 poolRipples[8];
void main(){
 vec2 p=vWorld.xz;float t=poolTime;
 vec2 slope=vec2(cos(p.x*.94+p.y*.61+t*.9),sin(p.y*1.12-p.x*.47-t*.7))*.05;
 for(int i=0;i<8;i++){vec4 r=poolRipples[i];vec2 d=p-r.xy;float l=length(d);float ring=exp(-pow((l-r.z)/.36,2.0))*r.w;slope+=d/max(.1,l)*ring*.1;}
 vec3 n=normalize(vec3(-slope.x,1.0,-slope.y));vec3 viewDir=normalize(cameraPosition-vWorld);
 float fresnel=.025+.65*pow(1.0-max(0.0,dot(viewDir,n)),4.0);
 vec2 uv=gl_FragCoord.xy/poolViewport;vec2 refracted=clamp(uv+slope*.085*poolEffects,vec2(.002),vec2(.998));
 float d=texture2D(poolDepth,refracted).x;if(d<gl_FragCoord.z-.0001)refracted=uv;
 float behind=-perspectiveDepthToViewZ(texture2D(poolDepth,refracted).x,poolNear,poolFar);
 float surface=-perspectiveDepthToViewZ(gl_FragCoord.z,poolNear,poolFar);float thickness=clamp(behind-surface,0.0,7.0);
 vec3 transmitted=texture2D(poolScene,refracted).rgb;
 vec3 absorption=exp(-thickness*vec3(.23,.065,.08));
 vec3 deep=vec3(.025,.22,.19);
 vec3 c=mix(deep,transmitted*absorption+deep*(1.0-absorption)*.38,hasScene);
 vec3 ceiling=vec3(.28,.43,.43);c=mix(c,ceiling,fresnel);
 vec3 lightDir=normalize(vec3(-.35,1.0,.4));float highlight=pow(max(0.0,dot(reflect(-lightDir,n),viewDir)),150.0);
 c+=vec3(1.0,.93,.69)*highlight*.9*poolEffects;
 gl_FragColor=vec4(c,hasScene>.5?1.0:.58);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export class AquaticsWorld{
 constructor(scene,physics){
  this.scene=scene;this.physics=physics;this.time=0;this.target=null;this.passes=0;this.ripples=[];this.wetStep=0;this.error=false;
  this.uniforms={poolTime:{value:0},poolLevel:{value:LAB.high},poolEffects:{value:1},poolRipples:{value:Array.from({length:8},()=>new T.Vector4(0,0,1,0))}};
  this.tiles=tiledMaterial(this.uniforms);this.root=new T.Group();this.root.position.set(LAB.x,0,LAB.z);scene.add(this.root);this.props=new T.Group();this.root.add(this.props);this.roof=new T.Group();this.root.add(this.roof);this.bodies=[];
  const solid=(g,color,x,y,z,sx,sy,sz)=>{box(g,color,x,y,z,sx,sy,sz);const b=physics.box(LAB.x+x,y,LAB.z+z,sx/2,sy/2,sz/2);this.bodies.push(b);return b;};
  // Actual raised deck and basin: no underground cutout through the old terrain.
  solid(this.props,this.tiles,-6,.08,-1,20,.2,34);
  solid(this.props,this.tiles,13.5,.08,-3.5,15,.2,27);
  solid(this.props,this.tiles,-20,1.35,0,8,2.7,52);
  solid(this.props,this.tiles,-6,1.35,22,20,2.7,8);
  solid(this.props,this.tiles,-6,1.35,-22,20,2.7,8);
  solid(this.props,this.tiles,4.5,1.35,20,.7,2.7,12);
  // Basin north/west walls have tile grids and caustics, not painted flat water.
  solid(this.props,this.tiles,-16.2,1.35,-1,.35,2.7,34);
  solid(this.props,this.tiles,-6,1.35,-18.2,20,2.7,.35);
  // Interior boundary and a physical 2.8 m archive access door at z=-6.
  solid(this.props,this.tiles,5,3.8,4.8,.45,7.6,10.4);
  solid(this.props,this.tiles,5,3.8,-13.8,.45,7.6,8.4);
  solid(this.props,this.tiles,5,5.35,-6,.45,4.5,5.2);
  solid(this.props,this.tiles,21,3.8,-3.5,.45,7.6,27);
  solid(this.props,this.tiles,13,3.8,-17.2,16,7.6,.4);
  solid(this.props,this.tiles,13,3.8,10.2,16,7.6,.4);
  // Perimeter with a narrow west doorway. No vehicle is needed inside.
  solid(this.props,0x708681,-24,4,-3.8,.4,8,44.4);
  solid(this.props,0x708681,-24,4,23.8,.4,8,4.4);
  solid(this.props,0x708681,-24,6.5,21,.4,3,6);
  solid(this.props,0x72867d,0,4,-26,48,8,.5);
  solid(this.props,0x7b918a,24,4,0,.5,8,52);
  solid(this.props,0x82958c,0,4,26,48,8,.5);
  // Outdoor entry steps from the pier. Individual low risers support the old
  // kinematic ranger's real autostep; this is not an interaction teleport.
  for(let i=0;i<9;i++)solid(this.props,0x809991,-31+i*.65,(i+1)*.15,20,.68,(i+1)*.3,4);
  solid(this.props,0x809991,-24.7,1.35,20,1.4,2.7,4);
  for(const z of [17.8,22.2]){bone(this.props,0xafc3b4,[-31,1,z],[-25,3.7,z],.055);}
  // Pool steps descend from the south deck; gated until the depth is safe.
  for(let i=0;i<9;i++){const top=2.7-i*.28;solid(this.props,this.tiles,-12,top/2,17.6-i*.65,4,top,.68);}
  for(const x of [-14.3,-9.7]){bone(this.props,0xb5c7bf,[x,3.6,18.8],[x,1.3,12],.055);}
  this.gate=box(this.root,0x9abdaf,-12,4.4,18.5,4.6,3.4,.16);
  this.gateBody=physics.box(LAB.x-12,4.4,18.5,2.3,1.7,.08);this.bodies.push(this.gateBody);
  // Rails protect the rim while leaving the south staircase as the clear route.
  for(const [x,z,sx,sz] of [[-6,16.8,7,.12],[-15.2,16.8,1.4,.12],[-16,0,.12,34],[-6,-18,20,.12]]){box(this.props,0xc0d1c7,x,3.25,z,sx,1.1,sz);}
  // A framed skylight, arches, service pipes and glass overlook create room scale.
  for(const z of [-22,-10,2,14,24]){
   for(const x of [-21.5,21.5])box(this.props,0x6e8580,x,4,z,.6,8,.6);
   box(this.roof,0x607975,0,7.8,z,44,.42,.5);
   const arch=part(this.roof,new T.TorusGeometry(21.5,.16,6,32,Math.PI),0x80958c,0,7.5,z);arch.scale.y=.18;
  }
  const glass=new T.MeshStandardMaterial({color:0xc3e8df,transparent:true,opacity:.12,roughness:.2,metalness:.1,depthWrite:false,side:T.DoubleSide});
  box(this.roof,glass,0,8.1,0,47,.1,50);
  for(const z of [-21,-9,3,15]){box(this.props,0x293f3e,-21.8,6.9,z,1.4,.18,3.4);box(this.props,new T.MeshBasicMaterial({color:0xd8f4dd}),-21.8,6.79,z,1.1,.03,3.1);}
  for(const z of [-22,23])bone(this.props,0x527c73,[-23,5,z],[21,5,z],.18);
  for(const x of [8,15])bone(this.props,0x558277,[x,.5,-16],[x,6.6,-16],.22);
  // Pool ladders are visible set dressing; the labeled steps are the route.
  for(const x of [-6,-4.4]){bone(this.props,0xb7cec7,[x,.6,-17.4],[x,4,-17.4],.07);bone(this.props,0xb7cec7,[x,4,-17.4],[x,4,-19.3],.07);}
  for(let y=.9;y<3;y+=.5)bone(this.props,0xadccc4,[-6,y,-17.4],[-4.4,y,-17.4],.055);
  for(const [key,point] of Object.entries(POINTS)){
   if(key==='stairs')continue;const x=point.x-LAB.x,z=point.z,base=key==='archive'||key==='sample'?.18:LAB.deck;
   box(this.props,0x304e49,x,base+.6,z,.85,1.2,.75);
   const text=label(({breaker:'01 / SAFETY BREAKER',intake:'02 / SEAWATER INTAKE',pump:'03 / DRAIN PUMP',archive:'04 / HABITAT ARCHIVE',sample:'05 / SAMPLE CASE'})[key],5.5,.7,'#254c47','#d9ebc6');text.position.set(x,base+2.2,z);this.props.add(text);
   if(key==='intake'){const wheel=part(this.props,new T.TorusGeometry(.53,.07,6,20),0xdfb369,x+.5,base+1.25,z);wheel.rotation.y=Math.PI/2;}
   if(key==='sample'){for(const offset of [-.22,.22])part(this.props,new T.CylinderGeometry(.14,.14,.44,10),0x91ddd0,x+offset,base+1.48,z);}
  }
  const title=label('PELAGIC STATION / AQUATIC RESEARCH',29,1.6,'#244a43','#e7ebc8');title.rotation.y=-Math.PI/2;title.position.set(-24.4,6.2,3);this.props.add(title);
  const help=label('NO DIVING / DRAIN BEFORE ENTRY',16,1,'#375e58','#eeddb0');help.position.set(-5,4.4,-23.8);this.props.add(help);
  const access=label('POOL ACCESS / SOUTH STEPS',10,.7);access.position.set(-12,5,20);this.props.add(access);
  this.gauge=new T.Group();this.gauge.position.set(-16.4,0,-15);this.root.add(this.gauge);
  for(let i=0;i<6;i++)box(this.gauge,0xbbe1d1,0,.3+i*.4,0,.05,.05,.8);
  this.float=box(this.gauge,0xf6c777,-.08,LAB.high,0,.12,.15,1);
  // Reuse one scene/depth capture for both connected water surfaces.
  this.fallback=new T.MeshStandardMaterial({color:0x5a9c95,transparent:true,opacity:.42,roughness:.19,metalness:.1,depthWrite:false,side:T.DoubleSide});
  const blank=new T.DataTexture(new Uint8Array([100,145,134,255]),1,1);blank.needsUpdate=true;this.blank=blank;
  this.waterUniforms={...this.uniforms,poolScene:{value:blank},poolDepth:{value:blank},poolViewport:{value:new T.Vector2(1,1)},poolNear:{value:.1},poolFar:{value:750},hasScene:{value:0}};
  this.waterMaterial=new T.ShaderMaterial({vertexShader:waterVertex,fragmentShader:waterFragment,uniforms:this.waterUniforms,transparent:true,side:T.DoubleSide,depthWrite:false});this.waterMaterial.name='Pelagic refraction';
  this.waters=[[-6,-1,20,34],[13.5,-3.5,15,27]].map(([x,z,w,h])=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),this.waterMaterial);m.rotation.x=-Math.PI/2;m.position.set(x,LAB.high,z);m.renderOrder=2;m.onBeforeRender=(r)=>{const rt=r.getRenderTarget();if(rt)this.waterUniforms.poolViewport.value.set(rt.width,rt.height);else r.getDrawingBufferSize(this.waterUniforms.poolViewport.value);};this.root.add(m);return m;});
  bakeStatics(this.props);bakeStatics(this.roof);
  // Pier is placed outside the island's dry navigation radius, with boarding
  // supplied by the same Fleet mechanism as the previous four harbors.
  this.pier=new T.Group();scene.add(this.pier);
  for(let x=-431;x< -407;x+=1)box(this.pier,0xa89e7d,x,.38,20,.94,.15,3.8);
  physics.box(-414,.27,20,6,.1,1.9);
  for(let x=-430;x< -408;x+=4)for(const z of [18,22]){box(this.pier,0x75928b,x,.9,z,.12,1.8,.12);part(this.pier,new T.SphereGeometry(.15,6,4),new T.MeshBasicMaterial({color:0x95e8d6}),x,1.8,z);}
  const pierTitle=label('PELAGIC PIER / Y TO BOARD',16,1.1);pierTitle.position.set(-413,3,20);pierTitle.rotation.y=-Math.PI/2;this.pier.add(pierTitle);bakeStatics(this.pier);
  this.buoys=ROUTE.map((p,i)=>{const g=new T.Group();g.position.set(p.x,.4,p.z);box(g,0x5d9286,0,0,0,1.4,.8,1.4);const l=label('PELAGIC '+(i+1),6,.6);l.position.y=2.3;g.add(l);scene.add(g);return g;});
 }
 splash(p){if(this.ripples.length>=8)this.ripples.shift();this.ripples.push({x:p.x,z:p.z,age:0});}
 update(s,dt,p,{reduced=false,enhanced=true}={}){
  const step=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
  if(!reduced)this.time+=step;this.uniforms.poolTime.value=this.time;this.uniforms.poolLevel.value=s.water;this.uniforms.poolEffects.value=enhanced?1:0;
  this.root.visible=gap(p,LAB)<190;this.pier.visible=gap(p,AQUA_HARBOR)<200;this.roof.visible=!insideLab(p);
  this.waters.forEach(m=>{m.position.y=s.water;m.material=enhanced&&!this.error?this.waterMaterial:this.fallback;});this.float.position.y=s.water;
  const safe=shallowSafe(s);this.gate.visible=!safe;if(this.safe!==safe){this.safe=safe;this.gateBody.setTranslation({x:LAB.x-12,y:safe?-8:4.4,z:18.5},true);}
  if(reduced)this.ripples=[];else this.ripples.forEach(r=>r.age+=step);
  this.uniforms.poolRipples.value.forEach((v,i)=>{const r=this.ripples[i];if(r)v.set(r.x,r.z,.2+r.age*1.8,Math.max(0,1-r.age/1.5));else v.w=0;});
  this.buoys.forEach((g,i)=>g.visible=s.active&&(s.stage===0||s.stage===5)&&gap(p,g.position)<180);
 }
 capture(renderer,camera,settings,enabled){
  this.passes=0;
  if(!enabled||this.error||!this.root.visible||gap(camera.position,LAB)>85){this.release();return;}
  const size=renderer.getDrawingBufferSize(new T.Vector2());this.waterUniforms.poolViewport.value.copy(size);
  const width=Math.max(1,Math.min(settings.low?512:1024,size.x)),height=Math.max(1,Math.round(size.y*width/size.x));
  if(!this.target||this.target.width!==width||this.target.height!==height){this.release();this.target=new T.WebGLRenderTarget(width,height,{depthBuffer:true,minFilter:T.LinearFilter,magFilter:T.LinearFilter});this.target.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);}
  const old=renderer.getRenderTarget(),shadow=renderer.shadowMap.autoUpdate;
  try{
   this.waters.forEach(m=>m.visible=false);renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(this.target);renderer.render(this.scene,camera);
   this.waterUniforms.poolScene.value=this.target.texture;this.waterUniforms.poolDepth.value=this.target.depthTexture;this.waterUniforms.poolNear.value=camera.near;this.waterUniforms.poolFar.value=camera.far;this.waterUniforms.hasScene.value=1;this.passes=1;
  }catch(e){this.error=true;console.warn('Pool refraction fell back to translucent water.',e);this.release();}
  finally{renderer.setRenderTarget(old);renderer.shadowMap.autoUpdate=shadow;this.waters.forEach(m=>m.visible=true);}
 }
 release(){if(this.target){this.target.depthTexture?.dispose();this.target.dispose();this.target=null;}this.waterUniforms.hasScene.value=0;this.waterUniforms.poolScene.value=this.blank;this.waterUniforms.poolDepth.value=this.blank;}
 snapshot(){return {water:this.uniforms.poolLevel.value,time:this.time,gateOpen:!!this.safe,refractionTargets:this.target?1:0,refractionPasses:this.passes,targetWidth:this.target?.width||0,ripples:this.ripples.length,failed:this.error};}
}
