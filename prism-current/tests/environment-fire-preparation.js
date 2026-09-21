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
