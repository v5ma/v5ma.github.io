/* Actual Three resource objects with an explicitly controlled renderer.
 * The real GPU and current game adapter have separate native acceptance. */
window.treesPreparationComplete=(async()=>{
 const T=AFRAME.THREE,M=SVGNTrees,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const scene=new T.Scene();scene.add(new T.PointLight(0xffaa00,0),new T.HemisphereLight());
 const f=M.create(T,{trees:[{id:'test',preset:'palm',position:[6,0,-8]}]});
 let finish,compiles=0;const compile={compileAsync(){compiles++;return new Promise(r=>finish=r)}};
 const a=f.prepare(compile,new T.PerspectiveCamera(),scene),b=f.prepare(compile,new T.PerspectiveCamera(),scene);await Promise.resolve();
 check(a===b&&compiles===1,'Concurrent Trees loading shares one pending preparation');finish();await a;check(f.stats.prepared&&f.stats.warmupDraws===0,'Compile-only collaborator is distinguished from a real draw');f.dispose();
 function renderer(fail=false,kind='screen'){
  const target=kind==='screen'?null:{isXRRenderTarget:kind==='xr',texture:{colorSpace:T.SRGBColorSpace}},viewport=new T.Vector4(2,3,600,400),scissor=new T.Vector4(5,6,70,90);
  const r={isWebGLRenderer:true,target,face:1,mip:2,xr:{enabled:true},autoClear:false,scissorTest:true,viewport:viewport.clone(),scissor:scissor.clone(),outputColorSpace:T.SRGBColorSpace,draws:0,freed:0,finished:0,
   compileAsync:async()=>{},getRenderTarget(){return this.target},getActiveCubeFace(){return this.face},getActiveMipmapLevel(){return this.mip},getViewport(v){return v.copy(this.viewport)},getScissor(v){return v.copy(this.scissor)},getScissorTest(){return this.scissorTest},
   setViewport(v){this.viewport.copy(v)},setScissor(v){this.scissor.copy(v)},setScissorTest(v){this.scissorTest=v},setRenderTarget(t,face=0,mip=0){this.target=t;this.face=face;this.mip=mip;if(t?.isWebGLRenderTarget)t.addEventListener('dispose',()=>this.freed++)},
   render(warm,camera){this.draws++;check(this.target?.width===24&&this.target?.height===24&&!this.xr.enabled,'Tree loading uses only a tiny scratch target, never the headset buffer');check(this.target.isXRRenderTarget===(kind!=='linear'),'Tree loading matches the host output shader policy');check(warm.children.filter(o=>o.isMesh).length===6,'All six prebuilt tree meshes receive the loading draw');check(warm.children.filter(o=>o.isLight).length===2,'Tree loading preserves host lighting shader keys without reparenting');if(fail)throw Error('intentional tree warmup failure')},
   getContext(){return {finish:()=>this.finished++}}
  };
  return {r,restored:()=>r.target===target&&r.face===1&&r.mip===2&&r.xr.enabled&&r.autoClear===false&&r.scissorTest&&r.viewport.equals(viewport)&&r.scissor.equals(scissor)};
 }
 for(const kind of ['screen','xr','linear']){
  const f=M.create(T),ctx=renderer(false,kind),before=JSON.stringify(f.describe()),children=scene.children.slice();f.update({time:4,viewer:[40,2,1]});const lod=f.stats.lod.slice();
  await f.prepare(ctx.r,new T.PerspectiveCamera(),scene);
  check(f.stats.prepared&&f.stats.warmupDraws===1&&ctx.r.finished===1,kind+': readiness follows completed geometry drawing');
  check(ctx.restored()&&ctx.r.freed===1,kind+': output destination and renderer state are restored and the scratch target freed');
  check(f.stats.time===4&&JSON.stringify(f.describe())===before&&JSON.stringify(f.stats.lod)===JSON.stringify(lod)&&scene.children.every((v,i)=>v===children[i]),kind+': warmup changes no tree positions, LOD, clock or host scene children');
  await f.prepare(ctx.r,new T.PerspectiveCamera(),scene);check(ctx.r.draws===1,kind+': repeated prepare allocates no further GPU work');f.dispose();
 }
 const broken=M.create(T),ctx=renderer(true);let failed=false;try{await broken.prepare(ctx.r,new T.PerspectiveCamera(),scene)}catch{failed=true}
 check(failed&&!broken.stats.prepared&&ctx.restored()&&ctx.r.freed===1,'Failed tree drawing rejects readiness while restoring renderer state');const retry=renderer();await broken.prepare(retry.r,new T.PerspectiveCamera(),scene);check(broken.stats.prepared,'Failed preparation supports a deliberate retry');broken.dispose();
 const disposed=M.create(T);let resolve;const pending=disposed.prepare({compileAsync:()=>new Promise(r=>resolve=r)},new T.PerspectiveCamera());await Promise.resolve();disposed.dispose();resolve();await pending;check(disposed.stats.disposed&&!disposed.stats.prepared,'Disposing during compilation cannot resurrect tree geometry');
 window.treesPreparationReport={passed:checks.length,checks,scope:'Controlled renderer collaborators and actual Three resources; not actual GPU or headset execution.'};return true;
})();
