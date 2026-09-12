/* Silent first-use GPU preparation. No song-clock, score or controller writes.
 * Installed on the existing art instance before any song is started. */
(function(root){'use strict';
 function install(art,scene){const T=art.T,original=art.prepare.bind(art),dispose=art.dispose.bind(art);let target=null;
  art.prepare=async function(song){
   const r=scene.renderer;if(!r||art.graphics.disposed)return;
   // Immersive sessions may suspend window RAF; use the XR frame source there.
   // Their translucent materials do not need the desktop transmission prepass.
   if(!r.xr.isPresenting)await original(song);
   const warmScene=new T.Scene(),camera=new T.PerspectiveCamera(65,1,.01,80),owned=[],seen=new Set();camera.position.set(0,1.65,0);camera.updateMatrixWorld();let index=0;
   scene.object3D.updateMatrixWorld(true);
   scene.object3D.traverse(o=>{
    if(o.isLight){const l=o.clone();o.getWorldPosition(l.position);warmScene.add(l);}
    if(!o.isMesh&&!o.isPoints)return;
    const key=o.geometry.uuid+'/'+(Array.isArray(o.material)?o.material.map(m=>m.uuid).join('/'):o.material.uuid);
    if(seen.has(key)||o.geometry.drawRange.count===0)return;seen.add(key);
    const copy=o.isPoints?new T.Points(o.geometry,o.material):new T.Mesh(o.geometry,o.material);copy.frustumCulled=false;copy.position.set((index%5-2)*.08,1.65+(Math.floor(index/5)%5-2)*.08,-1.8-index*.002);copy.scale.setScalar(.12);warmScene.add(copy);index++;
   });
   const plane=new T.PlaneGeometry(.1,.1);owned.push(plane);
   for(const m of [...art.fx.trail,...art.fx.blade,...art.fx.crystal]){const o=new T.Mesh(plane,m);o.position.set(0,1.65,-2-index++*.002);o.frustumCulled=false;warmScene.add(o);}
   try{
    if(r.compileAsync)await r.compileAsync(warmScene,camera);
    if(art.graphics.disposed)return;
    target??=new T.WebGLRenderTarget(32,32,{depthBuffer:true});
    const previous=r.getRenderTarget(),xr=r.xr.enabled;
    try{r.xr.enabled=false;r.setRenderTarget(target);r.render(warmScene,camera);}finally{r.setRenderTarget(previous);r.xr.enabled=xr;}
    const update=art.update;
    art.update=function(){return update.call(art,song,0,0,false);};
    try{
     art.update();if(r.compileAsync)await r.compileAsync(scene.object3D,scene.camera);
     let last=performance.now(),stable=0;const deadline=last+10000;
     while(stable<8&&performance.now()<deadline){
      const now=await new Promise(resolve=>{const session=r.xr.getSession?.();if(r.xr.isPresenting&&session)session.requestAnimationFrame(t=>resolve(t));else requestAnimationFrame(resolve);});
      stable=now-last<120?stable+1:0;last=now;
     }
     if(stable<8)throw Error('Rendering is not steady yet. Choose Light graphics and try again.');
    }finally{art.update=update;}
   }finally{for(const g of owned)g.dispose();}
  };
  art.dispose=function(){target?.dispose();target=null;dispose();};
 }
 root.PrismRenderReady=Object.freeze({install});
})(globalThis);
