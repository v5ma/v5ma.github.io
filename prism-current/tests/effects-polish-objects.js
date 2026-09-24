window.effectsPolishComplete=(async()=>{'use strict';
 const T=AFRAME.THREE,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const fire=SVGNFire.create(T),volume=fire.group.getObjectByName('Currentworks flame 0'),data=volume.material.uniforms.fireNoise.value;
 check(data.format===T.RGBAFormat&&data.image.data.byteLength===131072,'Real fire volume packs curling flow and density into one declared 128 KiB texture');
 const version=data.version,buffer=data.image.data;
 fire.update({time:0});fire.emit({id:'burst',position:[0,1,-3]});for(let t=.01;t<1;t+=.01)fire.update({time:t,xr:true});
 check(data.version===version&&data.image.data===buffer,'Fire animation neither regenerates nor uploads the curl volume');
 check(fire.stats.textureCount===1&&fire.stats.textureSamplesPerStep===2&&fire.stats.activeVolumes<=2&&fire.stats.activeSparks<=32,'Curling fire preserves XR volume/spark/texture-read budgets');
 fire.update({quiet:true});check(fire.stats.activeSparks===0&&fire.stats.lights===0,'Quiet continues to remove ember motion and flashing lights');
 fire.dispose();check(fire.stats.textureBytes===0,'Disposed fire retains no reported curl storage');
 function rendererFixture(kind='screen',fail=false){
  const destination=kind==='screen'?null:{texture:{colorSpace:T.SRGBColorSpace},isXRRenderTarget:kind==='xr'},events=[];
  const r={isWebGLRenderer:true,xr:{enabled:true},autoClear:false,outputColorSpace:T.SRGBColorSpace,target:destination,face:2,mip:1,viewport:new T.Vector4(1,2,300,220),scissor:new T.Vector4(4,5,88,99),scissorTest:true,freed:0,
   getViewport(v){return v.copy(this.viewport)},getScissor(v){return v.copy(this.scissor)},getRenderTarget(){return this.target},getActiveCubeFace(){return this.face},getActiveMipmapLevel(){return this.mip},getScissorTest(){return this.scissorTest},
   setViewport(v){this.viewport.copy(v)},setScissor(v){this.scissor.copy(v)},setScissorTest(v){this.scissorTest=v},setRenderTarget(v,f=0,m=0){this.target=v;this.face=f;this.mip=m;if(v?.isWebGLRenderTarget)v.addEventListener('dispose',()=>this.freed++)},
   initTexture(t){events.push(['texture',t])},compileAsync:async(g,c,s)=>{events.push(['compile',g.children[0].geometry]);},
   render(s,c){events.push(['draw',s.children.find(o=>o.isMesh)]);check(this.target.width===24&&this.target.height===24&&!this.xr.enabled,'Optical first use targets only a bounded scratch buffer, not the headset');
    check(this.target.isXRRenderTarget===(kind!=='linear'),'Optical prewarm chooses the current display or linear output shader policy');
    if(fail)throw Error('intentional draw failure');},
   getContext(){return {finish:()=>events.push(['finish'])}}
  };
  return {r,events,restored:()=>r.target===destination&&r.face===2&&r.mip===1&&!r.autoClear&&r.xr.enabled&&r.scissorTest&&r.viewport.equals(new T.Vector4(1,2,300,220))&&r.scissor.equals(new T.Vector4(4,5,88,99))};
 }
 for(const kind of ['screen','xr','linear']){
  const w=SVGNWater.create(T),o=SVGNWaterOptics.attach(T,w.material),s=new T.Scene(),cam=new T.PerspectiveCamera();s.add(w.mesh);
  w.update({time:4.5,quiet:false,opacity:0});o.update({ar:true});const before=JSON.stringify(w.stats),shader=w.material.fragmentShader,geometry=w.mesh.geometry,stats=o.stats;
  const ctx=rendererFixture(kind),a=o.prepare(ctx.r,cam,s,w.mesh),b=o.prepare(ctx.r,cam,s,w.mesh);check(a===b,'Concurrent optical preparation shares one pending operation');await a;
  check(o.stats.prepared&&o.stats.warmupDraws===1&&o.stats.renderTargets===0,'Optical readiness follows a completed one-time draw with no persistent target');
  check(ctx.events.map(e=>e[0]).join(',')==='texture,texture,texture,compile,draw,finish','Base data and both optical textures upload before compilation and draw');
  check(ctx.restored()&&ctx.r.freed===1,'Optical preparation restores target/viewport/scissor/XR and frees its scratch target');
  check(w.mesh.parent===s&&w.mesh.geometry===geometry&&w.material.fragmentShader===shader&&before===JSON.stringify(w.stats)&&w.uniforms.opacity.value===0&&o.stats.ar,'Prewarm preserves live mesh, shader, paused clock, zero opacity and room settings');
  await o.prepare(ctx.r,cam,s,w.mesh);check(o.stats.warmupDraws===1&&ctx.r.freed===1,'Repeated preparation avoids another upload/draw allocation');o.dispose();w.dispose();
 }
 const w=SVGNWater.create(T),o=SVGNWaterOptics.attach(T,w.material),s=new T.Scene(),cam=new T.PerspectiveCamera();s.add(w.mesh);const broken=rendererFixture('xr',true);w.update({opacity:.22});o.update({ar:true});
 let failed=false;try{await o.prepare(broken.r,cam,s,w.mesh)}catch(e){failed=e.message==='intentional draw failure'}
 check(failed&&!o.stats.prepared&&broken.restored()&&broken.r.freed===1&&w.uniforms.opacity.value===.22&&o.stats.ar,'Failed optical draw restores state and rejects readiness');
 await o.prepare(rendererFixture().r,cam,s,w.mesh);check(o.stats.prepared,'A deliberate preparation retry after failure succeeds');o.dispose();w.dispose();
 const lateWater=SVGNWater.create(T),late=SVGNWaterOptics.attach(T,lateWater.material);let done;
 const r={initTexture:()=>{},compileAsync:()=>new Promise(resolve=>{done=resolve})};const pending=late.prepare(r,cam,s,lateWater.mesh);await Promise.resolve();late.dispose();done();await pending;
 check(!late.stats.prepared&&late.stats.disposed&&late.stats.warmupDraws===0,'Pending compilation cannot revive disposed optical resources');lateWater.dispose();
 window.effectsPolishReport={passed:checks.length,checks,scope:'Actual Three resource/data/lifecycle objects with controlled renderer collaborators; not GPU timing or physical headset approval.'};return true;
})();
