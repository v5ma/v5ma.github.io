window.fireAsyncComplete=(async()=>{
 const T=AFRAME.THREE,checks=[];const check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 let done,called=0,uploaded=0;const f=SVGNFire.create(T),flags=f.group.children.map(o=>o.visible);
 const renderer={initTexture(t){if(!t.isData3DTexture)throw Error('wrong texture');uploaded++;},compileAsync(){called++;return new Promise(resolve=>done=resolve);}};
 const a=f.prepare(renderer,{}),b=f.prepare(renderer,{});await Promise.resolve();
 check(a===b&&called===1&&uploaded===1,'Concurrent preparation shares one compile and one density upload');
 check(f.group.children.every((o,i)=>o.visible===flags[i]),'Preparing cannot reveal invisible pool slots');
 done();await a;check(f.stats.prepared,'Only completed preparation is reported ready');f.dispose();
 let finish;const g=SVGNFire.create(T);const pending=g.prepare({compileAsync:()=>new Promise(resolve=>finish=resolve)},{});await Promise.resolve();g.dispose();finish();await pending;
 check(g.stats.disposed&&!g.stats.prepared&&g.stats.activeVolumes===0,'Late preparation cannot revive a disposed module');
 const h=SVGNFire.create(T);let failed=false;try{await h.prepare({compileAsync:async()=>{throw Error('intentional compilation fixture');}},{});}catch{failed=true;}
 check(failed&&!h.stats.prepared,'Compiler failure is reported and does not mark preparation complete');
 await h.prepare({compile:()=>{}},{});check(h.stats.prepared,'An explicit retry after failure is allowed');h.dispose();
 window.fireAsyncReport={passed:checks.length,checks};return true;
})();
// Controlled renderer state around actual Three.js GPU resource descriptors.
// This does not claim that the collaborator performs a GPU draw.
window.fireWarmupComplete=(async()=>{
 const T=AFRAME.THREE,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const host=new T.Scene();host.add(new T.PointLight(),new T.DirectionalLight());const hidden=new T.PointLight();hidden.visible=false;host.add(hidden);host.fog=new T.Fog(0,1,20);
 function fixture(fail=false){
  const originalTarget={name:'host-owned-target'},viewport=new T.Vector4(3,4,640,480),scissor=new T.Vector4(7,8,90,100),events=[];
  const r={isWebGLRenderer:true,outputColorSpace:T.SRGBColorSpace,autoClear:false,xr:{enabled:true},target:originalTarget,face:2,mip:1,scissorTest:true,viewport:viewport.clone(),scissor:scissor.clone(),freed:0,
   initTexture(t){events.push('texture');},compileAsync:async()=>{events.push('compile');},
   getViewport(v){return v.copy(this.viewport);},getScissor(v){return v.copy(this.scissor);},getRenderTarget(){return this.target;},getActiveCubeFace(){return this.face;},getActiveMipmapLevel(){return this.mip;},getScissorTest(){return this.scissorTest;},
   setRenderTarget(t,face=0,mip=0){this.target=t;this.face=face;this.mip=mip;if(t?.isWebGLRenderTarget)t.addEventListener('dispose',()=>this.freed++);},
   setViewport(v){this.viewport.copy(v);},setScissor(v){this.scissor.copy(v);},setScissorTest(v){this.scissorTest=v;},
   render(scene,camera){events.push('draw');check(this.target!==originalTarget&&this.target.width===24&&this.target.height===24,'Warmup draw uses only a bounded temporary target');check(this.xr.enabled===false,'Loading draw cannot target the active headset framebuffer');check(scene.children.filter(o=>o.isLight).length===2&&scene.fog===host.fog,'Warmup preserves host shader light and fog selection without reparenting');const meshes=scene.children.filter(o=>o.isMesh);check(meshes.length===2&&meshes[1].geometry.instanceCount===1,'Warmup exercises volume and instanced ember geometry');scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);meshes[0].onBeforeRender(this,scene,camera);if(fail)throw Error('intentional warmup draw failure');},
   getContext(){return {finish:()=>events.push('finish')};}
  };
  return {r,events,restored:()=>r.target===originalTarget&&r.face===2&&r.mip===1&&r.autoClear===false&&r.xr.enabled===true&&r.scissorTest===true&&r.viewport.equals(viewport)&&r.scissor.equals(scissor)};
 }
 const f=SVGNFire.create(T);f.update({time:.2});f.emit({id:8,position:[2,1,-3]});f.update({time:.35});
 const before=f.stats,flags=f.group.children.map(o=>o.visible),geometry=f.group.children.find(o=>o.name==='Currentworks embers').geometry;
 const originalCount=geometry.instanceCount,originalCenters=geometry.attributes.center.array.slice(),originalSizes=geometry.attributes.sizeFade.array.slice(),ctx=fixture();
 await f.prepare(ctx.r,new T.PerspectiveCamera(),host);
 check(ctx.events.join(',')==='texture,compile,draw,finish'&&f.stats.prepared&&f.stats.warmupDraws===1,'Completed GPU warmup is part of readiness, after upload and compile');
 check(ctx.restored()&&ctx.r.freed===1,'Host target, viewport, scissor and XR state are restored and temporary target disposed');
 check(f.stats.emitted===before.emitted&&f.stats.time===before.time&&f.stats.activeVolumes===before.activeVolumes&&f.group.children.every((o,i)=>o.visible===flags[i]),'Loading warmup never advances or exposes the host effect pool');
 check(geometry.instanceCount===originalCount&&geometry.attributes.center.array.every((v,i)=>v===originalCenters[i])&&geometry.attributes.sizeFade.array.every((v,i)=>v===originalSizes[i]),'Active emitter particle data survives preparation unchanged');
 await f.prepare(ctx.r,new T.PerspectiveCamera(),host);check(f.stats.warmupDraws===1&&ctx.r.freed===1,'Repeated preparation does not allocate or draw again');f.dispose();
 const g=SVGNFire.create(T),broken=fixture(true);let failed=false;try{await g.prepare(broken.r,new T.PerspectiveCamera(),host);}catch(e){failed=e.message==='intentional warmup draw failure';}
 check(failed&&!g.stats.prepared&&g.stats.warmupDraws===0,'Failed draw rejects readiness instead of silently starting playback');
 check(broken.restored()&&broken.r.freed===1,'Failed warmup also restores the exact renderer state and disposes its target');
 const retry=fixture();await g.prepare(retry.r,new T.PerspectiveCamera(),host);check(g.stats.prepared&&g.stats.warmupDraws===1,'Explicit retry of a failed warmup works without replacing the game');g.dispose();
 window.fireWarmupReport={passed:checks.length,checks};return true;
})();
