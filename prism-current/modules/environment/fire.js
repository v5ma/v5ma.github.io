/* Currentworks Fire 0.1.2. Original WebGL2 volume effects, caller-owned THREE.
 * No renderer, DOM, input, clock, storage or gameplay ownership. All emitter
 * coordinates are GROUP-LOCAL. Visual radius is NEVER a damage radius.
 * See FIRE.md for budgets, clipping limits, reuse and reduced-motion behavior.
 */
(function(root){
 'use strict';
 const VERSION='0.1.2',CAPACITY=6,MAX_EMITTERS=2,PARTICLES=128;
 const QUALITY=Object.freeze({light:Object.freeze({volumes:2,steps:12,sparks:32}),balanced:Object.freeze({volumes:3,steps:20,sparks:64}),cinematic:Object.freeze({volumes:6,steps:32,sparks:128})});
 const finite=Number.isFinite,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const num=(n,d,a,b)=>finite(n)?clamp(n,a,b):d;
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128||Number.isSafeInteger(id);
 const smooth=(a,b,v)=>{v=clamp((v-a)/(b-a),0,1);return v*v*(3-2*v);};
 function direction(v){if(!vec(v)||Math.hypot(...v)<1e-5)return [0,1,0];const l=Math.hypot(...v);return v.map(n=>n/l);}
 function limits(q,xr){return xr?QUALITY.light:Object.hasOwn(QUALITY,q)?QUALITY[q]:QUALITY.balanced;}
 function noiseData(size=32,seed=2731){
  if(![16,32,64].includes(size))throw new RangeError('Fire noise size must be 16, 32 or 64.');
  let s=seed>>>0;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  const grids=[4,8,16].map(n=>({n,data:Float32Array.from({length:n*n*n},rand)}));
  function sample(g,x,y,z){const n=g.n,fx=x*n/size,fy=y*n/size,fz=z*n/size,ix=Math.floor(fx),iy=Math.floor(fy),iz=Math.floor(fz),u=smooth(0,1,fx-ix),v=smooth(0,1,fy-iy),w=smooth(0,1,fz-iz);let sum=0;
   for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)sum+=g.data[(((iz+c)%n)*n+(iy+b)%n)*n+(ix+a)%n]*(a?u:1-u)*(b?v:1-v)*(c?w:1-w);return sum;}
  const data=new Uint8Array(size**3);for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++)data[(z*size+y)*size+x]=Math.round(255*grids.reduce((a,g,i)=>a+sample(g,x,y,z)*[.53,.30,.17][i],0));return data;
 }
 /** Pure, bounded observations. Repeated time is pause, not a request to advance. */
 class Pool{
  constructor(){this.slots=Array.from({length:CAPACITY},(_,i)=>({slot:i,active:false,emitter:null,position:[0,0,0],direction:[0,1,0],born:0,touched:0,life:1.6,radius:.6,length:1.8,power:1,mode:0,seed:0}));this.time=0;this.quiet=false;this.visible=true;this.xr=false;this.emitted=0;this.seen=new Set();this.keys=[];}
  clear(history=false){for(const s of this.slots){s.active=false;s.emitter=null;}if(history){this.seen.clear();this.keys.length=0;this.emitted=0;}}
  update(frame={}){if(!frame||typeof frame!=='object')return false;const t=num(frame.time,this.time,0,1e7),q=typeof frame.quiet==='boolean'?frame.quiet:this.quiet,v=typeof frame.visible==='boolean'?frame.visible:this.visible;
   if(t<this.time)this.clear(true);else if(t-this.time>1||q!==this.quiet||v!==this.visible)this.clear(false);
   this.time=t;this.quiet=q;this.visible=v;this.xr=typeof frame.xr==='boolean'?frame.xr:this.xr;
   for(const s of this.slots)if(s.active&&(s.emitter!==null?t-s.touched>.85:t-s.born>=s.life)){s.active=false;s.emitter=null;}return true;}
  remember(id){if(id===undefined)return true;if(!validId(id)||this.seen.has(id))return false;this.seen.add(id);this.keys.push(id);if(this.keys.length>64)this.seen.delete(this.keys.shift());return true;}
  write(s,o,mode){s.active=true;s.position.splice(0,3,...o.position);s.direction.splice(0,3,...direction(o.direction));s.radius=num(o.radius,.6,.08,2);s.length=num(o.length,2,.2,6);s.power=num(o.power,1,0,1);s.life=num(o.life,1.65,.2,3);s.mode=mode;s.born=s.touched=this.time;s.seed=(this.emitted++%997)*.173;return s;}
  emit(o={}){if(!o||!vec(o.position)||!this.remember(o.id)||!this.visible)return false;
   let s=this.slots.find(s=>!s.active);if(!s)s=this.slots.filter(s=>s.emitter===null).sort((a,b)=>a.born-b.born)[0];if(!s)return false;
   this.write(s,o,o.mode==='impact'?2:0);s.emitter=null;return true;}
  emitter(id,o={}){if(!validId(id)||!o||!vec(o.position)||!this.visible||this.quiet)return false;
   let s=this.slots.find(s=>s.active&&s.emitter===id);if(s){s.position.splice(0,3,...o.position);s.direction.splice(0,3,...direction(o.direction));s.touched=this.time;s.power=num(o.power,s.power,0,1);s.radius=num(o.radius,s.radius,.08,2);s.length=num(o.length,s.length,.2,6);return true;}
   if(this.slots.filter(s=>s.active&&s.emitter!==null).length>=MAX_EMITTERS)return false;s=this.slots.find(s=>!s.active);if(!s)return false;this.write(s,o,1);s.emitter=id;return true;}
  stop(id){const s=this.slots.find(s=>s.active&&s.emitter===id);if(!s)return false;s.touched=Math.min(s.touched,this.time-.3);return true;}
  reset(time=0){this.clear(true);this.time=num(time,0,0,1e7);}
 }
 const vertexShader=`varying vec3 localPoint;void main(){localPoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const fragmentShader=`
 precision highp sampler3D;
 uniform sampler3D fireNoise;
 uniform vec3 eyeLocal;
 uniform mat4 localToView,fireProjection;
 uniform float clock,age,fade,power,seed,steps,mode,quiet;
 varying vec3 localPoint;
 float field(vec3 p){return texture(fireNoise,p).r;}
 vec2 flame(vec3 p){
  vec3 q=p;float n,t=clock;
  q.x+=sin(p.y*6.1-t*3.7+seed)*.17;q.z+=cos(p.y*5.7-t*3.1+seed)*.16;
  n=field(q*.72+vec3(seed,-t*.38,0.))*.55+field(q*vec3(2.8,1.15,2.8)+vec3(0.,-t*.83,seed))*.45;
  n=clamp((n-.5)*3.2+.5,0.,1.);
  float shape,heat;
  if(mode>.5&&mode<1.5){
   float y=clamp((p.y+.95)/1.9,0.,1.);float radius=.15+.48*pow(y,.65);
   shape=radius-length(q.xz)+(n-.5)*.65;
   heat=clamp(1.06-y*.48-length(q.xz)*.88+(n-.5)*.22,0.,1.);
  }else{
   float expansion=.19+.42*(1.-exp(-age*10.));
   float r=length(q*vec3(1.,mode>1.5?1.40:.91,1.));
   shape=expansion-r+(n-.48)*.62;
   heat=clamp(1.12-age*.65+(n-.5)*.45-r*.95,0.,1.);
  }
  float edge=1.-smoothstep(.79,.99,max(max(abs(p.x),abs(p.y)),abs(p.z)));
  float d=smoothstep(-.08,.12,shape)*smoothstep(.18,.68,n)*edge*fade*power;
  if(mode>.5&&mode<1.5)d*=1.-smoothstep(.22+.5*n,.98,p.y);
  return vec2(d,heat);
 }
 void main(){
  vec3 rd=normalize(localPoint-eyeLocal);vec3 safe=mix(-vec3(1.),vec3(1.),step(vec3(0.),rd))*max(abs(rd),vec3(.00001));
  vec3 a=(-vec3(1.)-eyeLocal)/safe,b=(vec3(1.)-eyeLocal)/safe;
  vec3 lo=min(a,b),hi=max(a,b);float start=max(0.,max(max(lo.x,lo.y),lo.z)),end=min(min(hi.x,hi.y),hi.z);
  if(end<=start||power<=0.)discard;
  float stride=(end-start)/steps;vec4 total=vec4(0.);float first=end;
  for(int i=0;i<32;i++){
   if(float(i)>=steps||total.a>.96)break;
   float d=start+(float(i)+.5)*stride;vec3 p=eyeLocal+rd*d;vec2 f=flame(p);
   float alpha=1.-exp(-f.x*stride*5.4);if(alpha<.002)continue;
   if(first==end)first=d;
   vec3 smoke=mix(vec3(.09,.095,.105),vec3(.22,.20,.19),f.y);
   vec3 color=mix(smoke,vec3(2.3,.065,.001),smoothstep(.12,.36,f.y));
   color=mix(color,vec3(4.3,.55,.015),smoothstep(.37,.69,f.y));
   color=mix(color,vec3(5.,2.8,.75),smoothstep(.75,1.,f.y));
   color=mix(color,vec3(.8,.20,.045),quiet*.75);
   total.rgb+=(1.-total.a)*alpha*color;total.a+=(1.-total.a)*alpha;
  }
  if(total.a<.015)discard;
  // Depth of the nearest contributing material, not the back of its proxy box.
  vec4 front=fireProjection*localToView*vec4(eyeLocal+rd*first,1.);
  gl_FragDepth=clamp(front.z/front.w*.5+.5,0.,1.);
  vec3 color=total.rgb/max(.001,total.a);
  #ifndef TONE_MAPPING
   color=color/(vec3(1.)+color);
  #endif
  // Near-face fade avoids enveloping the viewer in a bright close-range blast.
  float comfort=smoothstep(.25,1.0,length(eyeLocal));
  gl_FragColor=vec4(color,total.a*comfort*(quiet>.5?.28:.88));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
 const sparkVertex=`attribute vec3 center;attribute vec2 sizeFade;varying vec2 vUv;varying float opacity;
 void main(){vUv=uv;opacity=sizeFade.y;vec4 p=modelViewMatrix*vec4(center,1.);p.xy+=position.xy*sizeFade.x*length(modelViewMatrix[0].xyz);gl_Position=projectionMatrix*p;}`;
 const sparkFragment=`varying vec2 vUv;varying float opacity;void main(){vec2 p=vUv*2.-1.;float a=exp(-dot(p,p)*4.)*(1.-smoothstep(.5,1.,length(p)))*opacity;if(a<.01)discard;gl_FragColor=vec4(1.,.48,.08,a);
 #include <colorspace_fragment>
 }`;
 function create(T,input={}){
  if(!T?.Data3DTexture||!T?.ShaderMaterial||!T?.InstancedBufferGeometry)throw new TypeError('Fire requires an existing compatible THREE WebGL2 namespace.');
  if(!input||typeof input!=='object')input={};
  const pool=new Pool(),group=new T.Group();group.name='Currentworks Fire';
  let disposed=false,quality=Object.hasOwn(QUALITY,input.quality)?input.quality:'balanced',prepared=false,preparing=null,activeVolumes=0,activeSparks=0,lit=0,warmupDraws=0;
  const noise=new T.Data3DTexture(noiseData(32,Number.isSafeInteger(input.seed)?input.seed:2731),32,32,32);noise.name='Currentworks generated fire density';noise.format=T.RedFormat;noise.type=T.UnsignedByteType;noise.minFilter=noise.magFilter=T.LinearFilter;noise.wrapS=noise.wrapT=noise.wrapR=T.RepeatWrapping;noise.unpackAlignment=1;noise.colorSpace=T.NoColorSpace;noise.needsUpdate=true;
  const box=new T.BoxGeometry(2,2,2),axis=new T.Vector3(0,1,0),inverse=new T.Matrix4(),eye=new T.Vector3(),dir=new T.Vector3();
  const volumes=Array.from({length:CAPACITY},(_,i)=>{const uniforms={fireNoise:{value:noise},eyeLocal:{value:new T.Vector3()},localToView:{value:new T.Matrix4()},fireProjection:{value:new T.Matrix4()},clock:{value:0},age:{value:0},fade:{value:0},power:{value:0},seed:{value:0},steps:{value:20},mode:{value:0},quiet:{value:0}};
   const material=new T.ShaderMaterial({name:'Currentworks Fire '+VERSION,uniforms,vertexShader,fragmentShader,side:T.BackSide,transparent:true,depthTest:true,depthWrite:false,toneMapped:true});
   const mesh=new T.Mesh(box,material);mesh.name='Currentworks flame '+i;mesh.visible=false;mesh.frustumCulled=false;mesh.renderOrder=1;
   mesh.onBeforeRender=(renderer,scene,camera)=>{inverse.copy(mesh.matrixWorld).invert();eye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inverse);uniforms.eyeLocal.value.copy(eye);uniforms.localToView.value.multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld);uniforms.fireProjection.value.copy(camera.projectionMatrix);material.uniformsNeedUpdate=true;};group.add(mesh);return mesh;});
  const particleGeometry=new T.InstancedBufferGeometry();particleGeometry.setIndex([0,1,2,0,2,3]);particleGeometry.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3));particleGeometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  const centers=new T.InstancedBufferAttribute(new Float32Array(PARTICLES*3),3),sizes=new T.InstancedBufferAttribute(new Float32Array(PARTICLES*2),2);centers.setUsage(T.DynamicDrawUsage);sizes.setUsage(T.DynamicDrawUsage);particleGeometry.setAttribute('center',centers);particleGeometry.setAttribute('sizeFade',sizes);
  const sparkMaterial=new T.ShaderMaterial({name:'Currentworks embers',vertexShader:sparkVertex,fragmentShader:sparkFragment,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending});
  const sparks=new T.Mesh(particleGeometry,sparkMaterial);sparks.name='Currentworks embers';sparks.frustumCulled=false;sparks.renderOrder=2;sparks.visible=false;group.add(sparks);
  const lights=input.lights===false?[]:Array.from({length:2},()=>{const l=new T.PointLight(0xff963d,0,4,2);l.castShadow=false;group.add(l);return l;});
  function sync(){
   if(disposed)return;const budget=limits(quality,pool.xr);group.visible=pool.visible;activeVolumes=activeSparks=lit=0;
   for(const m of volumes)m.visible=false;for(const l of lights)l.intensity=0;
   const active=pool.slots.filter(s=>s.active).sort((a,b)=>b.born-a.born).slice(0,budget.volumes);
   for(const s of active){const m=volumes[s.slot],u=m.material.uniforms,life=pool.time-s.born,jet=s.mode===1;
    const age=jet?life:life*1.65/s.life;const fade=jet?1-smooth(.30,.85,pool.time-s.touched):smooth(0,.05,age)*(1-smooth(.9,1.65,age));
    if(fade<=0)continue;m.visible=true;m.position.fromArray(s.position);m.quaternion.setFromUnitVectors(axis,dir.fromArray(s.direction));
    const growth=jet||pool.quiet?1:(.65+Math.min(age,1)*.45);m.scale.set(s.radius*growth,jet?s.length/2:s.radius*growth*(s.mode===2?.42:1.15),s.radius*growth);
    if(jet)m.position.addScaledVector(dir,s.length/2);else if(s.mode===2)m.position.addScaledVector(dir,s.radius*.25);
    u.clock.value=pool.quiet?.3:pool.time;u.age.value=pool.quiet?.3:age;u.fade.value=fade;u.power.value=s.power;u.seed.value=s.seed;u.steps.value=pool.quiet?8:budget.steps;u.mode.value=s.mode;u.quiet.value=pool.quiet?1:0;activeVolumes++;
    if(!pool.quiet&&lit<Math.min(lights.length,pool.xr?1:2)){const l=lights[lit++];l.position.copy(m.position);l.intensity=fade*s.power*(jet?1.4:Math.max(0,1-age)*3.0);l.distance=3+s.radius;}
    if(!pool.quiet&&s.mode!==1)for(let i=0;i<24&&activeSparks<budget.sparks;i++){
     const seed=s.seed+i*2.399,delay=(i%4)*.018,a=life-delay;if(a<0||a>Math.min(1.3,s.life))continue;
     const speed=(.35+(i%7)*.18)*s.radius,vx=Math.cos(seed)*speed,vz=Math.sin(seed)*speed,vy=.7+(i%5)*.26;
     centers.setXYZ(activeSparks,s.position[0]+vx*a,s.position[1]+vy*a-.75*a*a,s.position[2]+vz*a);
     sizes.setXY(activeSparks,.026+(i%3)*.009,(1-a/1.3)*fade*s.power);activeSparks++;
    }
   }
   sparks.visible=activeSparks>0;particleGeometry.instanceCount=activeSparks;centers.needsUpdate=true;sizes.needsUpdate=true;
  }
  function update(frame={}){if(disposed||!pool.update(frame))return false;if(Object.hasOwn(QUALITY,frame.quality))quality=frame.quality;sync();return true;}
  function emit(o){if(disposed)return false;const ok=pool.emit(o);sync();return ok;}
  function emitter(id,o){if(disposed)return false;const ok=pool.emitter(id,o);sync();return ok;}
  function stop(id){if(disposed)return false;const ok=pool.stop(id);sync();return ok;}
  function reset(time=0){if(disposed)return;pool.reset(time);sync();}
  // Shader compilation does not upload vertex buffers or exercise a first draw.
  // Use a disposable 24px scratch target during loading; never expose a pool slot
  // or paint into the user's canvas/XR framebuffer. No target survives this call.
  function warmDraw(renderer,scene){
   if(!renderer.isWebGLRenderer)return; // Controlled compile-only collaborators.
   const target=new T.WebGLRenderTarget(24,24,{depthBuffer:true,stencilBuffer:false});
   target.texture.colorSpace=renderer.outputColorSpace;
   const warmScene=new T.Scene(),camera=new T.PerspectiveCamera(55,1,.01,20);
   camera.position.z=3;
   // Match the host's shader lighting/fog keys without borrowing its scene nodes.
   warmScene.fog=scene?.fog||null;warmScene.environment=scene?.environment||null;
   scene?.traverseVisible?.(o=>{if(o.isLight)warmScene.add(o.clone(false));});
   const volume=new T.Mesh(box,volumes[0].material),ember=new T.Mesh(particleGeometry,sparkMaterial);
   volume.frustumCulled=ember.frustumCulled=false;warmScene.add(volume,ember);
   const u=volume.material.uniforms,savedUniforms={};
   for(const [name,uniform] of Object.entries(u))savedUniforms[name]=uniform.value?.isTexture?uniform.value:uniform.value?.clone?uniform.value.clone():uniform.value;
   const savedCenters=centers.array.slice(),savedSizes=sizes.array.slice(),count=particleGeometry.instanceCount;
   const viewport=renderer.getViewport(new T.Vector4()),scissor=renderer.getScissor(new T.Vector4());
   const previous={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),autoClear:renderer.autoClear,scissorTest:renderer.getScissorTest(),xr:renderer.xr.enabled};
   volume.onBeforeRender=(r,s,c)=>{
    u.eyeLocal.value.setFromMatrixPosition(c.matrixWorld).applyMatrix4(new T.Matrix4().copy(volume.matrixWorld).invert());
    u.localToView.value.multiplyMatrices(c.matrixWorldInverse,volume.matrixWorld);
    u.fireProjection.value.copy(c.projectionMatrix);volume.material.uniformsNeedUpdate=true;
   };
   try{
    u.clock.value=.3;u.age.value=.3;u.fade.value=1;u.power.value=1;u.seed.value=0;u.steps.value=20;u.mode.value=0;u.quiet.value=0;
    centers.setXYZ(0,0,0,.2);sizes.setXY(0,.10,.8);centers.needsUpdate=sizes.needsUpdate=true;particleGeometry.instanceCount=1;
    renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setScissorTest(false);
    renderer.render(warmScene,camera);
    // A one-time loading barrier: do not move deferred first-use work into audio.
    renderer.getContext().finish();warmupDraws++;
   }finally{
    warmScene.clear();
    for(const [name,value] of Object.entries(savedUniforms)){const old=u[name].value;if(old?.copy&&!old.isTexture)old.copy(value);else u[name].value=value;}
    centers.array.set(savedCenters);sizes.array.set(savedSizes);centers.needsUpdate=sizes.needsUpdate=true;particleGeometry.instanceCount=count;
    renderer.setRenderTarget(previous.target,previous.face,previous.mip);
    renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(previous.scissorTest);
    renderer.autoClear=previous.autoClear;renderer.xr.enabled=previous.xr;target.dispose();
   }
  }
  // Preparation belongs in the host's cancellable loading path before playback.
  // Share pending work; a disposed or failed preparation cannot report readiness.
  function prepare(renderer,camera,scene=null){
   if(disposed||prepared)return Promise.resolve();if(preparing)return preparing;
   preparing=Promise.resolve().then(()=>{
    if(disposed)return;
    renderer.initTexture?.(noise);
    return renderer.compileAsync?renderer.compileAsync(group,camera,scene):renderer.compile(group,camera,scene);
   }).then(()=>{if(!disposed){warmDraw(renderer,scene);prepared=true;}}).finally(()=>{preparing=null;});
   return preparing;
  }
  function dispose(){if(disposed)return;disposed=true;activeVolumes=activeSparks=lit=0;group.removeFromParent();pool.clear(true);for(const m of volumes)m.material.dispose();box.dispose();noise.dispose();particleGeometry.dispose();sparkMaterial.dispose();for(const l of lights)l.dispose();}
  return Object.freeze({group,update,emit,emitter,stop,reset,prepare,dispose,get stats(){return {module:'Currentworks Fire',version:VERSION,time:pool.time,quiet:pool.quiet,xr:pool.xr,quality,visible:pool.visible,emitted:pool.emitted,activeVolumes,activeSparks,capacity:CAPACITY,sparkCapacity:PARTICLES,emitters:pool.slots.filter(s=>s.active&&s.emitter!==null).length,lights:lit,prepared,warmupDraws,disposed,renderTargets:0};}});
 }
 const api=Object.freeze({VERSION,CAPACITY,MAX_EMITTERS,PARTICLES,QUALITY,limits,noiseData,Pool,create,shaders:Object.freeze({vertexShader,fragmentShader,sparkVertex,sparkFragment})});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNFire=api;
})(globalThis);
